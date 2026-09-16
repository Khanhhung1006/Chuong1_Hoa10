import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Student,
  AttendanceRecord,
  ViolationRecord,
  RewardRecord,
  GradeRecord,
  ConductRecord,
  ParentContactLog,
  CalendarEvent,
  FinancialTransaction,
  DocumentItem,
  DiaryEntry,
  ClassSettings,
} from '../types';

export type SyncStatus = 'synced' | 'syncing' | 'offline_queued' | 'error';

export interface FullClassData {
  students: Student[];
  attendance: AttendanceRecord[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  scores: GradeRecord[];
  conduct: ConductRecord[];
  contacts: ParentContactLog[];
  calendar: CalendarEvent[];
  finance: FinancialTransaction[];
  documents: DocumentItem[];
  diary: DiaryEntry[];
  settings: ClassSettings;
  updatedAt: string;
  deviceId: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

type SyncListener = (status: SyncStatus, lastSyncTime?: Date, errorMsg?: string) => void;
type RemoteDataListener = (data: FullClassData) => void;

class CloudSyncService {
  private syncListeners: Set<SyncListener> = new Set();
  private remoteDataListeners: Set<RemoteDataListener> = new Set();
  private snapshotUnsubscribe: Unsubscribe | null = null;
  private currentStatus: SyncStatus = 'synced';
  private lastSyncTime: Date | null = null;
  private syncDebounceTimer: any = null;
  private deviceId: string;
  private isProcessingRemoteUpdate = false;
  private pendingPayload: FullClassData | null = null;
  private lastErrorMsg: string | null = null;
  private lastSyncedJson: string | null = null;

  constructor() {
    // Generate or get device identifier to avoid self-echo loops
    let savedDeviceId = localStorage.getItem('edumaster_device_id');
    if (!savedDeviceId) {
      savedDeviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('edumaster_device_id', savedDeviceId);
    }
    this.deviceId = savedDeviceId;

    // Listen to browser network changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.handleNetworkReconnect();
      });
      window.addEventListener('offline', () => {
        this.setStatus('offline_queued');
      });
    }
  }

  public getDeviceId() {
    return this.deviceId;
  }

  public getStatus(): SyncStatus {
    return this.currentStatus;
  }

  public getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  public getLastErrorMsg(): string | null {
    return this.lastErrorMsg;
  }

  public getLastErrorDetails(): FirestoreErrorInfo | null {
    if (!this.lastErrorMsg) return null;
    try {
      return JSON.parse(this.lastErrorMsg) as FirestoreErrorInfo;
    } catch {
      return {
        error: this.lastErrorMsg,
        operationType: OperationType.WRITE,
        path: null,
        authInfo: {},
      };
    }
  }

  public addSyncListener(listener: SyncListener) {
    this.syncListeners.add(listener);
    listener(this.currentStatus, this.lastSyncTime || undefined, this.lastErrorMsg || undefined);
    return () => this.syncListeners.delete(listener);
  }

  public addRemoteDataListener(listener: RemoteDataListener) {
    this.remoteDataListeners.add(listener);
    return () => this.remoteDataListeners.delete(listener);
  }

  private setStatus(status: SyncStatus, errorMsg?: string) {
    this.currentStatus = status;
    if (status === 'error' && errorMsg) {
      this.lastErrorMsg = errorMsg;
    } else if (status === 'synced') {
      this.lastErrorMsg = null;
    }
    this.syncListeners.forEach((l) => l(status, this.lastSyncTime || undefined, errorMsg));
  }

  private getPayloadJson(payload: Omit<FullClassData, 'updatedAt' | 'deviceId'>): string {
    return JSON.stringify({
      students: payload.students || [],
      attendance: payload.attendance || [],
      violations: payload.violations || [],
      rewards: payload.rewards || [],
      scores: payload.scores || [],
      conduct: payload.conduct || [],
      contacts: payload.contacts || [],
      calendar: payload.calendar || [],
      finance: payload.finance || [],
      documents: payload.documents || [],
      diary: payload.diary || [],
      settings: payload.settings || {},
    });
  }

  private serializeClassData(data: FullClassData): any {
    return {
      students: JSON.stringify(data.students || []),
      attendance: JSON.stringify(data.attendance || []),
      violations: JSON.stringify(data.violations || []),
      rewards: JSON.stringify(data.rewards || []),
      scores: JSON.stringify(data.scores || []),
      conduct: JSON.stringify(data.conduct || []),
      contacts: JSON.stringify(data.contacts || []),
      calendar: JSON.stringify(data.calendar || []),
      finance: JSON.stringify(data.finance || []),
      documents: JSON.stringify(data.documents || []),
      diary: JSON.stringify(data.diary || []),
      settings: JSON.stringify(data.settings || {}),
      updatedAt: data.updatedAt,
      deviceId: data.deviceId,
    };
  }

  private deserializeClassData(raw: any): FullClassData {
    if (!raw) return raw;
    const parseField = (val: any, fallback: any) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch (err) {
          console.warn('Failed to parse field:', err);
          return fallback;
        }
      }
      return val || fallback;
    };

    return {
      students: parseField(raw.students, []),
      attendance: parseField(raw.attendance, []),
      violations: parseField(raw.violations, []),
      rewards: parseField(raw.rewards, []),
      scores: parseField(raw.scores, []),
      conduct: parseField(raw.conduct, []),
      contacts: parseField(raw.contacts, []),
      calendar: parseField(raw.calendar, []),
      finance: parseField(raw.finance, []),
      documents: parseField(raw.documents, []),
      diary: parseField(raw.diary, []),
      settings: parseField(raw.settings, {}),
      updatedAt: raw.updatedAt || new Date().toISOString(),
      deviceId: raw.deviceId || '',
    };
  }

  private getClassDocRef(className: string = '11A1') {
    const safeName = className.replace(/[^a-zA-Z0-9_-]/g, '_') || '11A1';
    return doc(db, 'class_data', safeName);
  }

  /**
   * Start listening to Firestore real-time updates for the current class
   */
  public initRealtimeSync(className: string) {
    if (this.snapshotUnsubscribe) {
      this.snapshotUnsubscribe();
      this.snapshotUnsubscribe = null;
    }

    try {
      const docRef = this.getClassDocRef(className);
      this.snapshotUnsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (!snapshot.exists()) return;

          const rawData = snapshot.data();
          if (!rawData || !rawData.updatedAt) return;
          const data = this.deserializeClassData(rawData);

          // Update lastSyncedJson to prevent echoing this remote data back in queueSync
          this.lastSyncedJson = this.getPayloadJson(data);

          // If update came from another device, notify local app
          if (data.deviceId !== this.deviceId) {
            this.isProcessingRemoteUpdate = true;
            this.lastSyncTime = new Date(data.updatedAt);
            this.setStatus('synced');
            this.remoteDataListeners.forEach((listener) => listener(data));
            setTimeout(() => {
              this.isProcessingRemoteUpdate = false;
            }, 500);
          } else {
            this.lastSyncTime = new Date();
            this.setStatus('synced');
          }
        },
        (err) => {
          console.warn('Firestore real-time subscription error:', err);
          if (!navigator.onLine) {
            this.setStatus('offline_queued');
          } else {
            try {
              handleFirestoreError(err, OperationType.GET, `class_data/${className}`);
            } catch (formattedError: any) {
              this.setStatus('error', formattedError.message);
            }
          }
        }
      );
    } catch (err) {
      console.warn('Failed to init Firestore snapshot:', err);
    }
  }

  /**
   * Queue local data to be synced to Firebase Firestore
   */
  public queueSync(payload: Omit<FullClassData, 'updatedAt' | 'deviceId'>) {
    if (this.isProcessingRemoteUpdate) {
      return;
    }

    const currentJson = this.getPayloadJson(payload);
    if (this.lastSyncedJson && currentJson === this.lastSyncedJson) {
      // Data is identical, do not trigger an unnecessary sync cycle
      return;
    }
    this.lastSyncedJson = currentJson;

    const fullData: FullClassData = {
      ...payload,
      updatedAt: new Date().toISOString(),
      deviceId: this.deviceId,
    };

    this.pendingPayload = fullData;

    if (!navigator.onLine) {
      this.setStatus('offline_queued');
      return;
    }

    this.setStatus('syncing');

    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    this.syncDebounceTimer = setTimeout(() => {
      this.pushToFirestore(fullData);
    }, 1200);
  }

  /**
   * Direct manual push immediately
   */
  public async pushNow(payload: Omit<FullClassData, 'updatedAt' | 'deviceId'>): Promise<boolean> {
    const fullData: FullClassData = {
      ...payload,
      updatedAt: new Date().toISOString(),
      deviceId: this.deviceId,
    };

    this.lastSyncedJson = this.getPayloadJson(payload);
    return this.pushToFirestore(fullData);
  }

  /**
   * Push data directly to Firestore
   */
  private async pushToFirestore(data: FullClassData): Promise<boolean> {
    try {
      this.setStatus('syncing');
      const docRef = this.getClassDocRef(data.settings?.className || '11A1');
      const serializedData = this.serializeClassData(data);
      
      // Update lastSyncedJson to current state
      this.lastSyncedJson = this.getPayloadJson(data);
      
      await setDoc(docRef, serializedData, { merge: true });
      this.lastSyncTime = new Date();
      this.pendingPayload = null;
      this.setStatus('synced');
      return true;
    } catch (err: any) {
      console.warn('Error pushing data to Firestore:', err);
      if (!navigator.onLine) {
        this.setStatus('offline_queued');
      } else {
        try {
          handleFirestoreError(err, OperationType.WRITE, `class_data/${data.settings?.className || '11A1'}`);
        } catch (formattedError: any) {
          this.setStatus('error', formattedError.message);
        }
      }
      return false;
    }
  }

  /**
   * Pull latest data from Firestore directly
   */
  public async pullFromFirestore(className: string = '11A1'): Promise<FullClassData | null> {
    try {
      this.setStatus('syncing');
      const docRef = this.getClassDocRef(className);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const rawData = snap.data();
        const data = this.deserializeClassData(rawData);
        
        // Update lastSyncedJson to match pulled data
        this.lastSyncedJson = this.getPayloadJson(data);
        
        this.lastSyncTime = new Date();
        this.setStatus('synced');
        return data;
      }
      this.setStatus('synced');
      return null;
    } catch (err: any) {
      console.warn('Error pulling data from Firestore:', err);
      if (!navigator.onLine) {
        this.setStatus('offline_queued');
      } else {
        try {
          handleFirestoreError(err, OperationType.GET, `class_data/${className}`);
        } catch (formattedError: any) {
          this.setStatus('error', formattedError.message);
        }
      }
      return null;
    }
  }

  /**
   * When network reconnects, automatically push any pending payload
   */
  private handleNetworkReconnect() {
    if (this.pendingPayload) {
      this.pushToFirestore(this.pendingPayload);
    } else {
      this.setStatus('synced');
    }
  }
}

export const cloudSyncService = new CloudSyncService();
