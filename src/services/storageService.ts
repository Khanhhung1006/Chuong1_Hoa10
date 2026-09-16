import {
  Student,
  AttendanceRecord,
  ViolationRecord,
  RewardRecord,
  SubjectScore,
  ConductRecord,
  ParentContactLog,
  CalendarEvent,
  FinanceTransaction,
  ClassDocument,
  DiaryEntry,
  ClassSettings,
  AuditLogRecord,
  RolePermissionConfig,
  ClassItem,
  PhoneRecord,
} from '../types';
import {
  sampleStudents,
  sampleAttendanceRecords,
  sampleViolations,
  sampleRewards,
  sampleSubjectScores,
  sampleConductRecords,
  sampleParentContactLogs,
  sampleCalendarEvents,
  sampleFinanceTransactions,
  sampleClassDocuments,
  sampleDiaryEntries,
  initialSettings,
  samplePhoneRecords,
} from '../data/sampleData';

const STORAGE_KEYS = {
  CLASSES: 'edumaster_classes_list_v1',
  STUDENTS: 'edumaster_students_v1',
  ATTENDANCE: 'edumaster_attendance_v1',
  PHONES: 'edumaster_phones_v1',
  VIOLATIONS: 'edumaster_violations_v1',
  REWARDS: 'edumaster_rewards_v1',
  SCORES: 'edumaster_scores_v1',
  CONDUCT: 'edumaster_conduct_v1',
  CONTACTS: 'edumaster_contacts_v1',
  CALENDAR: 'edumaster_calendar_v1',
  FINANCE: 'edumaster_finance_v1',
  DOCUMENTS: 'edumaster_documents_v1',
  DIARY: 'edumaster_diary_v1',
  SETTINGS: 'edumaster_settings_v1',
  BACKUP_HISTORY: 'edumaster_backups_v1',
  AUDIT_LOGS: 'edumaster_audit_logs_v1',
  ROLE_PERMISSIONS: 'edumaster_role_permissions_v1',
};

const DEFAULT_ROLE_PERMISSIONS: RolePermissionConfig[] = [
  {
    role: 'GVCN',
    roleTitle: 'Giáo viên Chủ nhiệm',
    permissions: {
      dashboard: true,
      students: { view: true, add: true, edit: true, delete: true },
      attendance: { view: true, editAll: true, editGroup: true },
      violations: { view: true, add: true, editAll: true, editGroup: true, approve: true },
      academics: { view: true, edit: true },
      conduct: { view: true, edit: true },
      finance: { view: true, add: true, edit: true },
      documents: { view: true, add: true },
      diary: { view: true, add: true },
      calendar: { view: true, add: true },
      settings: true,
      auditLogs: true,
    },
  },
  {
    role: 'LT',
    roleTitle: 'Lớp trưởng',
    permissions: {
      dashboard: true,
      students: { view: true, add: false, edit: false, delete: false },
      attendance: { view: true, editAll: true, editGroup: true },
      violations: { view: true, add: true, editAll: false, editGroup: true, approve: false },
      academics: { view: true, edit: false },
      conduct: { view: true, edit: false },
      finance: { view: true, add: true, edit: false },
      documents: { view: true, add: true },
      diary: { view: true, add: true },
      calendar: { view: true, add: true },
      settings: false,
      auditLogs: false,
    },
  },
  {
    role: 'TK',
    roleTitle: 'Thư ký lớp',
    permissions: {
      dashboard: true,
      students: { view: true, add: false, edit: false, delete: false },
      attendance: { view: true, editAll: true, editGroup: true },
      violations: { view: true, add: true, editAll: false, editGroup: true, approve: false },
      academics: { view: true, edit: false },
      conduct: { view: true, edit: false },
      finance: { view: true, add: false, edit: false },
      documents: { view: true, add: true },
      diary: { view: true, add: true },
      calendar: { view: true, add: true },
      settings: false,
      auditLogs: false,
    },
  },
  {
    role: 'BT',
    roleTitle: 'Bí thư Chi đoàn',
    permissions: {
      dashboard: true,
      students: { view: true, add: false, edit: false, delete: false },
      attendance: { view: true, editAll: false, editGroup: false },
      violations: { view: true, add: true, editAll: false, editGroup: false, approve: false },
      academics: { view: true, edit: false },
      conduct: { view: true, edit: false },
      finance: { view: true, add: false, edit: false },
      documents: { view: true, add: true },
      diary: { view: true, add: true },
      calendar: { view: true, add: true },
      settings: false,
      auditLogs: false,
    },
  },
  {
    role: 'TT1',
    roleTitle: 'Tổ trưởng Tổ 1',
    permissions: {
      dashboard: true,
      students: { view: true, add: false, edit: false, delete: false },
      attendance: { view: true, editAll: false, editGroup: true },
      violations: { view: true, add: true, editAll: false, editGroup: true, approve: false },
      academics: { view: true, edit: false },
      conduct: { view: true, edit: false },
      finance: { view: false, add: false, edit: false },
      documents: { view: true, add: false },
      diary: { view: false, add: false },
      calendar: { view: true, add: false },
      settings: false,
      auditLogs: false,
    },
  },
  {
    role: 'TT2',
    roleTitle: 'Tổ trưởng Tổ 2',
    permissions: {
      dashboard: true,
      students: { view: true, add: false, edit: false, delete: false },
      attendance: { view: true, editAll: false, editGroup: true },
      violations: { view: true, add: true, editAll: false, editGroup: true, approve: false },
      academics: { view: true, edit: false },
      conduct: { view: true, edit: false },
      finance: { view: false, add: false, edit: false },
      documents: { view: true, add: false },
      diary: { view: false, add: false },
      calendar: { view: true, add: false },
      settings: false,
      auditLogs: false,
    },
  },
  {
    role: 'TT3',
    roleTitle: 'Tổ trưởng Tổ 3',
    permissions: {
      dashboard: true,
      students: { view: true, add: false, edit: false, delete: false },
      attendance: { view: true, editAll: false, editGroup: true },
      violations: { view: true, add: true, editAll: false, editGroup: true, approve: false },
      academics: { view: true, edit: false },
      conduct: { view: true, edit: false },
      finance: { view: false, add: false, edit: false },
      documents: { view: true, add: false },
      diary: { view: false, add: false },
      calendar: { view: true, add: false },
      settings: false,
      auditLogs: false,
    },
  },
  {
    role: 'TT4',
    roleTitle: 'Tổ trưởng Tổ 4',
    permissions: {
      dashboard: true,
      students: { view: true, add: false, edit: false, delete: false },
      attendance: { view: true, editAll: false, editGroup: true },
      violations: { view: true, add: true, editAll: false, editGroup: true, approve: false },
      academics: { view: true, edit: false },
      conduct: { view: true, edit: false },
      finance: { view: false, add: false, edit: false },
      documents: { view: true, add: false },
      diary: { view: false, add: false },
      calendar: { view: true, add: false },
      settings: false,
      auditLogs: false,
    },
  },
  {
    role: 'HS',
    roleTitle: 'Học sinh',
    permissions: {
      dashboard: true,
      students: { view: true, add: false, edit: false, delete: false },
      attendance: { view: true, editAll: false, editGroup: false },
      violations: { view: true, add: false, editAll: false, editGroup: false, approve: false },
      academics: { view: true, edit: false },
      conduct: { view: true, edit: false },
      finance: { view: true, add: false, edit: false },
      documents: { view: true, add: false },
      diary: { view: false, add: false },
      calendar: { view: true, add: false },
      settings: false,
      auditLogs: false,
    },
  },
  {
    role: 'PH',
    roleTitle: 'Phụ huynh học sinh',
    permissions: {
      dashboard: true,
      students: { view: true, add: false, edit: false, delete: false },
      attendance: { view: true, editAll: false, editGroup: false },
      violations: { view: true, add: false, editAll: false, editGroup: false, approve: false },
      academics: { view: true, edit: false },
      conduct: { view: true, edit: false },
      finance: { view: true, add: false, edit: false },
      documents: { view: true, add: false },
      diary: { view: false, add: false },
      calendar: { view: true, add: false },
      settings: false,
      auditLogs: false,
    },
  },
];

// Safe JSON parser
function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? (parsed as T) : fallback;
  } catch (err) {
    console.warn(`Storage load error for ${key}:`, err);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Trigger window event for cross-component sync
    window.dispatchEvent(new CustomEvent('edumaster_data_change', { detail: { key } }));
  } catch (err) {
    console.error(`Storage save error for ${key}:`, err);
  }
}

class StorageRepository {
  private currentActiveClass: string = '11A1';

  constructor() {
    this.initDefaults();
  }

  public setActiveClass(className: string): void {
    if (className && typeof className === 'string') {
      const clean = className.trim().toUpperCase();
      if (clean) {
        this.currentActiveClass = clean;
      }
    }
  }

  public getActiveClass(): string {
    return this.currentActiveClass;
  }

  private getClassKey(baseKey: string, className?: string): string {
    const cls = (className || this.currentActiveClass || '11A1')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_');
    return `${baseKey}_${cls}`;
  }

  private getScopedItem<T>(baseKey: string, fallback: T, className?: string): T {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const scopedKey = this.getClassKey(baseKey, cls);
    const scopedVal = localStorage.getItem(scopedKey);

    if (scopedVal !== null && scopedVal !== undefined) {
      return getItem<T>(scopedKey, fallback);
    }

    // Backward compatibility: If querying for 11A1, migrate legacy global key if it exists
    if (cls === '11A1') {
      const legacyVal = localStorage.getItem(baseKey);
      if (legacyVal !== null && legacyVal !== undefined) {
        const parsed = getItem<T>(baseKey, fallback);
        setItem(scopedKey, parsed);
        return parsed;
      }
    }

    return fallback;
  }

  private setScopedItem<T>(baseKey: string, value: T, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const scopedKey = this.getClassKey(baseKey, cls);
    setItem(scopedKey, value);
  }

  initDefaults(): void {
    if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
      const defaultClasses: ClassItem[] = [
        {
          id: '10A1',
          className: '10A1',
          grade: 10,
          academicYear: '2026 - 2027',
          teacherUsername: 'gvcn-10a1',
          teacherName: 'Thầy Nguyễn Văn Thành',
          studentCount: 35,
          isInitialized: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '11A1',
          className: '11A1',
          grade: 11,
          academicYear: '2026 - 2027',
          teacherUsername: 'GVCN',
          teacherName: 'Cô Hoàng Mai Lan',
          studentCount: 40,
          isInitialized: true,
          createdAt: new Date().toISOString(),
        },
      ];
      setItem(STORAGE_KEYS.CLASSES, defaultClasses);
    }

    // Seed 11A1 initial data scoped by class
    const key11A1 = this.getClassKey(STORAGE_KEYS.STUDENTS, '11A1');
    if (!localStorage.getItem(key11A1)) {
      setItem(key11A1, sampleStudents);
      setItem(this.getClassKey(STORAGE_KEYS.ATTENDANCE, '11A1'), sampleAttendanceRecords);
      setItem(this.getClassKey(STORAGE_KEYS.PHONES, '11A1'), samplePhoneRecords);
      setItem(this.getClassKey(STORAGE_KEYS.VIOLATIONS, '11A1'), sampleViolations);
      setItem(this.getClassKey(STORAGE_KEYS.REWARDS, '11A1'), sampleRewards);
      setItem(this.getClassKey(STORAGE_KEYS.SCORES, '11A1'), sampleSubjectScores);
      setItem(this.getClassKey(STORAGE_KEYS.CONDUCT, '11A1'), sampleConductRecords);
      setItem(this.getClassKey(STORAGE_KEYS.CONTACTS, '11A1'), sampleParentContactLogs);
      setItem(this.getClassKey(STORAGE_KEYS.CALENDAR, '11A1'), sampleCalendarEvents);
      setItem(this.getClassKey(STORAGE_KEYS.FINANCE, '11A1'), sampleFinanceTransactions);
      setItem(this.getClassKey(STORAGE_KEYS.DOCUMENTS, '11A1'), sampleClassDocuments);
      setItem(this.getClassKey(STORAGE_KEYS.DIARY, '11A1'), sampleDiaryEntries);
      setItem(this.getClassKey(STORAGE_KEYS.SETTINGS, '11A1'), initialSettings);
    }

    // Auto-migration: Update all stored settings to ensure schoolName is THPT Nguyễn Trãi - BĐ and clean up teacher names
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_KEYS.SETTINGS)) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed && (parsed.schoolName?.includes('Lê Quý Đôn') || !parsed.schoolName)) {
                parsed.schoolName = 'THPT Nguyễn Trãi - BĐ';
                localStorage.setItem(k, JSON.stringify(parsed));
              }
            } catch {}
          }
        }
      }

      // Repair classes item if teacherName was mistakenly set as className
      const classesRaw = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (classesRaw) {
        const classList = JSON.parse(classesRaw);
        if (Array.isArray(classList)) {
          let updatedClasses = false;
          const repaired = classList.map((c: any) => {
            if (c.teacherName && c.className && c.teacherName.trim().toUpperCase() === c.className.trim().toUpperCase()) {
              updatedClasses = true;
              let defaultTName = `Thầy/Cô GVCN Lớp ${c.className}`;
              if (c.className === '10A1') defaultTName = 'Thầy Nguyễn Văn Thành';
              if (c.className === '11A1') defaultTName = 'Cô Hoàng Mai Lan';
              return { ...c, teacherName: defaultTName };
            }
            return c;
          });
          if (updatedClasses) {
            localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(repaired));
          }
        }
      }
    } catch {}

    if (!localStorage.getItem(STORAGE_KEYS.ROLE_PERMISSIONS)) {
      setItem(STORAGE_KEYS.ROLE_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      setItem(STORAGE_KEYS.AUDIT_LOGS, []);
    }
  }

  // --- Students ---
  getStudents(className?: string): Student[] {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const fallback = cls === '11A1' ? sampleStudents : [];
    return this.getScopedItem<Student[]>(STORAGE_KEYS.STUDENTS, fallback, cls);
  }

  saveStudents(students: Student[], className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    this.setScopedItem(STORAGE_KEYS.STUDENTS, students, cls);

    // Sync studentCount & initialized status with Classes list
    const classes = this.getClasses();
    const idx = classes.findIndex((c) => c.className.toUpperCase() === cls);
    if (idx >= 0) {
      classes[idx].studentCount = students.length;
      if (students.length > 0) {
        classes[idx].isInitialized = true;
      }
      this.saveClasses(classes);
    }
  }

  saveStudent(student: Student, className?: string): Student {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const students = this.getStudents(cls);
    const index = students.findIndex((s) => s.id === student.id);
    if (index >= 0) {
      students[index] = student;
    } else {
      students.push(student);
    }
    this.saveStudents(students, cls);
    return student;
  }

  deleteStudent(studentId: string, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const students = this.getStudents(cls).filter((s) => s.id !== studentId);
    this.saveStudents(students, cls);
  }

  // --- Attendance ---
  getAttendance(className?: string): AttendanceRecord[] {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const fallback = cls === '11A1' ? sampleAttendanceRecords : [];
    const data = this.getScopedItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, fallback, cls);
    return Array.isArray(data) ? data.filter(d => d && typeof d === 'object' && !Array.isArray(d)) : [];
  }

  saveAttendance(records: AttendanceRecord[], className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    this.setScopedItem(STORAGE_KEYS.ATTENDANCE, records, cls);
  }

  recordAttendance(record: AttendanceRecord, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const list = this.getAttendance(cls);
    const idx = list.findIndex(
      (r) =>
        r.studentId === record.studentId &&
        r.date === record.date &&
        r.session === record.session &&
        r.period === record.period
    );
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    this.saveAttendance(list, cls);
  }

  // --- Phone Management ---
  getPhoneRecords(className?: string): PhoneRecord[] {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const fallback = cls === '11A1' ? samplePhoneRecords : [];
    const data = this.getScopedItem<PhoneRecord[]>(STORAGE_KEYS.PHONES, fallback, cls);
    if (!Array.isArray(data)) return [];
    
    // Deduplicate by studentId + date + session to guarantee data integrity
    const map = new Map<string, PhoneRecord>();
    data.forEach((d) => {
      if (d && typeof d === 'object' && !Array.isArray(d) && d.studentId && d.date) {
        const key = `${d.studentId}_${d.date}_${d.session || 'Sáng'}`;
        map.set(key, d);
      }
    });
    return Array.from(map.values());
  }

  savePhoneRecords(records: PhoneRecord[], className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const map = new Map<string, PhoneRecord>();
    (records || []).forEach((r) => {
      if (r && typeof r === 'object' && !Array.isArray(r) && r.studentId && r.date) {
        const key = `${r.studentId}_${r.date}_${r.session || 'Sáng'}`;
        map.set(key, r);
      }
    });
    this.setScopedItem(STORAGE_KEYS.PHONES, Array.from(map.values()), cls);
  }

  // --- Violations ---
  getViolations(className?: string): ViolationRecord[] {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const fallback = cls === '11A1' ? sampleViolations : [];
    const raw = this.getScopedItem<ViolationRecord[]>(STORAGE_KEYS.VIOLATIONS, fallback, cls);
    const seen = new Set<string>();
    return (raw || []).filter((v) => {
      if (!v || !v.id) return false;
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
  }

  saveViolations(list: ViolationRecord[], className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const seen = new Set<string>();
    const unique = (list || []).filter((v) => {
      if (!v || !v.id) return false;
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
    this.setScopedItem(STORAGE_KEYS.VIOLATIONS, unique, cls);
  }

  addViolation(v: ViolationRecord, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const list = this.getViolations(cls);
    list.unshift(v);
    this.saveViolations(list, cls);
  }

  deleteViolation(id: string, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    this.saveViolations(
      this.getViolations(cls).filter((v) => v.id !== id),
      cls
    );
  }

  // --- Rewards ---
  getRewards(className?: string): RewardRecord[] {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const fallback = cls === '11A1' ? sampleRewards : [];
    const raw = this.getScopedItem<RewardRecord[]>(STORAGE_KEYS.REWARDS, fallback, cls);
    const seen = new Set<string>();
    return (raw || []).filter((r) => {
      if (!r || !r.id) return false;
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }

  saveRewards(list: RewardRecord[], className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const seen = new Set<string>();
    const unique = (list || []).filter((r) => {
      if (!r || !r.id) return false;
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
    this.setScopedItem(STORAGE_KEYS.REWARDS, unique, cls);
  }

  addReward(r: RewardRecord, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const list = this.getRewards(cls);
    list.unshift(r);
    this.saveRewards(list, cls);
  }

  deleteReward(id: string, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    this.saveRewards(
      this.getRewards(cls).filter((r) => r.id !== id),
      cls
    );
  }

  // --- Scores ---
  getScores(className?: string): SubjectScore[] {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const fallback = cls === '11A1' ? sampleSubjectScores : [];
    return this.getScopedItem<SubjectScore[]>(STORAGE_KEYS.SCORES, fallback, cls);
  }

  saveScores(list: SubjectScore[], className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    this.setScopedItem(STORAGE_KEYS.SCORES, list, cls);
  }

  updateScore(score: SubjectScore, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const list = this.getScores(cls);
    const idx = list.findIndex((s) => s.studentId === score.studentId && s.subject === score.subject);
    if (idx >= 0) {
      list[idx] = score;
    } else {
      list.push(score);
    }
    this.saveScores(list, cls);
  }

  // --- Conduct ---
  getConduct(className?: string): ConductRecord[] {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const fallback = cls === '11A1' ? sampleConductRecords : [];
    return this.getScopedItem<ConductRecord[]>(STORAGE_KEYS.CONDUCT, fallback, cls);
  }

  saveConduct(list: ConductRecord[], className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    this.setScopedItem(STORAGE_KEYS.CONDUCT, list, cls);
  }

  addOrUpdateConduct(record: ConductRecord, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const list = this.getConduct(cls);
    const idx = list.findIndex((c) => c.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    this.saveConduct(list, cls);
  }

  // --- Parent Contacts ---
  getContacts(className?: string): ParentContactLog[] {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const fallback = cls === '11A1' ? sampleParentContactLogs : [];
    return this.getScopedItem<ParentContactLog[]>(STORAGE_KEYS.CONTACTS, fallback, cls);
  }

  saveContacts(list: ParentContactLog[], className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    this.setScopedItem(STORAGE_KEYS.CONTACTS, list, cls);
  }

  addContact(log: ParentContactLog, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const list = this.getContacts(cls);
    list.unshift(log);
    this.saveContacts(list, cls);
  }

  // --- Calendar ---
  getCalendar(className?: string): CalendarEvent[] {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const fallback = cls === '11A1' ? sampleCalendarEvents : [];
    return this.getScopedItem<CalendarEvent[]>(STORAGE_KEYS.CALENDAR, fallback, cls);
  }

  saveCalendar(events: CalendarEvent[], className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    this.setScopedItem(STORAGE_KEYS.CALENDAR, events, cls);
  }

  addEvent(event: CalendarEvent, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const list = this.getCalendar(cls);
    list.push(event);
    this.saveCalendar(list, cls);
  }

  deleteEvent(id: string, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    this.saveCalendar(
      this.getCalendar(cls).filter((e) => e.id !== id),
      cls
    );
  }

  // --- Finance ---
  getFinance(className?: string): FinanceTransaction[] {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const fallback = cls === '11A1' ? sampleFinanceTransactions : [];
    return this.getScopedItem<FinanceTransaction[]>(STORAGE_KEYS.FINANCE, fallback, cls);
  }

  saveFinance(list: FinanceTransaction[], className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    this.setScopedItem(STORAGE_KEYS.FINANCE, list, cls);
  }

  addTransaction(t: FinanceTransaction, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const list = this.getFinance(cls);
    list.unshift(t);
    this.saveFinance(list, cls);
  }

  deleteTransaction(id: string, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    this.saveFinance(
      this.getFinance(cls).filter((t) => t.id !== id),
      cls
    );
  }

  // --- Documents ---
  getDocuments(className?: string): ClassDocument[] {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const fallback = cls === '11A1' ? sampleClassDocuments : [];
    return this.getScopedItem<ClassDocument[]>(STORAGE_KEYS.DOCUMENTS, fallback, cls);
  }

  saveDocuments(docs: ClassDocument[], className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    this.setScopedItem(STORAGE_KEYS.DOCUMENTS, docs, cls);
  }

  addDocument(doc: ClassDocument, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const docs = this.getDocuments(cls);
    docs.unshift(doc);
    this.saveDocuments(docs, cls);
  }

  deleteDocument(id: string, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    this.saveDocuments(
      this.getDocuments(cls).filter((d) => d.id !== id),
      cls
    );
  }

  // --- Diary ---
  getDiary(className?: string): DiaryEntry[] {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const fallback = cls === '11A1' ? sampleDiaryEntries : [];
    return this.getScopedItem<DiaryEntry[]>(STORAGE_KEYS.DIARY, fallback, cls);
  }

  saveDiary(list: DiaryEntry[], className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    this.setScopedItem(STORAGE_KEYS.DIARY, list, cls);
  }

  addDiary(entry: DiaryEntry, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const list = this.getDiary(cls);
    list.unshift(entry);
    this.saveDiary(list, cls);
  }

  updateDiary(entry: DiaryEntry, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const list = this.getDiary(cls);
    const idx = list.findIndex((d) => d.id === entry.id);
    if (idx >= 0) {
      list[idx] = entry;
      this.saveDiary(list, cls);
    }
  }

  deleteDiary(id: string, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    this.saveDiary(
      this.getDiary(cls).filter((d) => d.id !== id),
      cls
    );
  }

  // --- Settings ---
  getSettings(className?: string): ClassSettings {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const scopedKey = this.getClassKey(STORAGE_KEYS.SETTINGS, cls);
    const scopedVal = localStorage.getItem(scopedKey);

    let currentSettings: ClassSettings;

    if (scopedVal !== null && scopedVal !== undefined) {
      currentSettings = getItem<ClassSettings>(scopedKey, initialSettings);
    } else if (cls === '11A1') {
      const legacyVal = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (legacyVal !== null && legacyVal !== undefined) {
        currentSettings = getItem<ClassSettings>(STORAGE_KEYS.SETTINGS, initialSettings);
      } else {
        currentSettings = { ...initialSettings };
      }
    } else {
      currentSettings = {
        ...initialSettings,
        className: cls,
      };
    }

    // 1. Ensure schoolName is always 'THPT Nguyễn Trãi - BĐ' if default or older placeholder
    if (!currentSettings.schoolName || currentSettings.schoolName.includes('Lê Quý Đôn')) {
      currentSettings.schoolName = 'THPT Nguyễn Trãi - BĐ';
    }

    // 2. Dynamically synchronize teacherName with actual user account / assigned teacher
    let activeTeacherName: string | null = null;
    try {
      const usersRaw = localStorage.getItem('edumaster_accounts_v1');
      if (usersRaw) {
        const users = JSON.parse(usersRaw);
        // Check if Admin is assigned as GVCN for this class
        const adminUser = users.find(
          (u: any) =>
            (u.role === 'ADMIN' || u.username?.toUpperCase() === 'ADMIN') &&
            u.assignedClass?.toUpperCase() === cls
        );
        if (adminUser) {
          activeTeacherName = adminUser.displayName || 'Admin (Quản trị viên kiêm nhiệm)';
        } else {
          // Check if there is an active GVCN for this class
          const gvcnUser = users.find(
            (u: any) => u.assignedClass?.toUpperCase() === cls && u.role === 'GVCN'
          );
          if (gvcnUser?.displayName) {
            activeTeacherName = gvcnUser.displayName;
          }
        }
      }
    } catch {
      // ignore
    }

    if (!activeTeacherName) {
      const matchedClass = this.getClasses().find((c) => c.className.toUpperCase() === cls);
      if (matchedClass?.teacherName) {
        activeTeacherName = matchedClass.teacherName;
      }
    }

    if (activeTeacherName) {
      currentSettings.teacherName = activeTeacherName;
    }

    if (currentSettings.requireApprovalAttendance === undefined) {
      currentSettings.requireApprovalAttendance = true;
    }
    if (currentSettings.requireApprovalViolationsRewards === undefined) {
      currentSettings.requireApprovalViolationsRewards = true;
    }
    if (currentSettings.defaultSession === undefined) {
      currentSettings.defaultSession = 'Sáng';
    }
    if (currentSettings.isLockedData === undefined) {
      currentSettings.isLockedData = false;
    }

    // Save back to keep storage synchronized
    setItem(scopedKey, currentSettings);
    return currentSettings;
  }

  saveSettings(settings: ClassSettings, className?: string): void {
    const cls = (className || settings.className || this.currentActiveClass || '11A1')
      .trim()
      .toUpperCase();
    const updatedSettings: ClassSettings = {
      ...settings,
      className: cls,
      schoolName:
        settings.schoolName && !settings.schoolName.includes('Lê Quý Đôn')
          ? settings.schoolName
          : 'THPT Nguyễn Trãi - BĐ',
    };
    this.setScopedItem(STORAGE_KEYS.SETTINGS, updatedSettings, cls);

    // Also update class metadata in classes list
    const classes = this.getClasses();
    const idx = classes.findIndex((c) => c.className.toUpperCase() === cls);
    if (idx >= 0) {
      classes[idx].teacherName = updatedSettings.teacherName;
      classes[idx].academicYear = updatedSettings.academicYear;
      this.saveClasses(classes);
    }

    // Also synchronize displayName of GVCN user account if matching class
    try {
      const usersRaw = localStorage.getItem('edumaster_accounts_v1');
      if (usersRaw) {
        const users = JSON.parse(usersRaw);
        let changed = false;
        users.forEach((u: any) => {
          if (u.assignedClass?.toUpperCase() === cls && u.role === 'GVCN') {
            if (u.displayName !== updatedSettings.teacherName) {
              u.displayName = updatedSettings.teacherName;
              changed = true;
            }
          }
        });
        if (changed) {
          localStorage.setItem('edumaster_accounts_v1', JSON.stringify(users));
          window.dispatchEvent(new CustomEvent('edumaster_auth_users_change'));
        }
      }
    } catch {}
  }

  // --- Backup & Restore & Reset ---
  exportAllData(): string {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      students: this.getStudents(),
      attendance: this.getAttendance(),
      violations: this.getViolations(),
      rewards: this.getRewards(),
      scores: this.getScores(),
      conduct: this.getConduct(),
      contacts: this.getContacts(),
      calendar: this.getCalendar(),
      finance: this.getFinance(),
      documents: this.getDocuments(),
      diary: this.getDiary(),
      settings: this.getSettings(),
    };
    return JSON.stringify(payload, null, 2);
  }

  importAllData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') return false;
      if (Array.isArray(data.students)) this.saveStudents(data.students);
      if (Array.isArray(data.attendance)) this.saveAttendance(data.attendance);
      if (Array.isArray(data.violations)) this.saveViolations(data.violations);
      if (Array.isArray(data.rewards)) this.saveRewards(data.rewards);
      if (Array.isArray(data.scores)) this.saveScores(data.scores);
      if (Array.isArray(data.conduct)) this.saveConduct(data.conduct);
      if (Array.isArray(data.contacts)) this.saveContacts(data.contacts);
      if (Array.isArray(data.calendar)) this.saveCalendar(data.calendar);
      if (Array.isArray(data.finance)) this.saveFinance(data.finance);
      if (Array.isArray(data.documents)) this.saveDocuments(data.documents);
      if (Array.isArray(data.diary)) this.saveDiary(data.diary);
      if (data.settings && typeof data.settings === 'object') this.saveSettings(data.settings);
      return true;
    } catch (e) {
      console.error('Failed to import JSON data:', e);
      return false;
    }
  }

  resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.VIOLATIONS);
    localStorage.removeItem(STORAGE_KEYS.REWARDS);
    localStorage.removeItem(STORAGE_KEYS.SCORES);
    localStorage.removeItem(STORAGE_KEYS.CONDUCT);
    localStorage.removeItem(STORAGE_KEYS.CONTACTS);
    localStorage.removeItem(STORAGE_KEYS.CALENDAR);
    localStorage.removeItem(STORAGE_KEYS.FINANCE);
    localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
    localStorage.removeItem(STORAGE_KEYS.DIARY);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    this.initDefaults();
    window.dispatchEvent(new CustomEvent('edumaster_data_change', { detail: { key: 'ALL' } }));
  }
  // Aliases for comprehensive API compatibility
  saveMultipleAttendance(records: AttendanceRecord[], className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    const list = this.getAttendance(cls);
    records.forEach((rec) => {
      const idx = list.findIndex(
        (r) =>
          r.studentId === rec.studentId &&
          r.date === rec.date &&
          r.session === rec.session &&
          r.period === rec.period
      );
      if (idx >= 0) {
        list[idx] = rec;
      } else {
        list.push(rec);
      }
    });
    this.saveAttendance(list, cls);
  }

  saveViolation(v: ViolationRecord, className?: string): void {
    this.addViolation(v, className);
  }

  saveReward(r: RewardRecord, className?: string): void {
    this.addReward(r, className);
  }

  getGrades(className?: string): SubjectScore[] {
    return this.getScores(className);
  }

  saveGrade(g: SubjectScore, className?: string): void {
    this.updateScore(g, className);
  }

  getConducts(className?: string): ConductRecord[] {
    return this.getConduct(className);
  }

  saveConductRecord(c: ConductRecord, className?: string): void {
    this.addOrUpdateConduct(c, className);
  }

  saveDocument(doc: ClassDocument, className?: string): void {
    this.addDocument(doc, className);
  }

  getParentContactLogs(className?: string): ParentContactLog[] {
    return this.getContacts(className);
  }

  saveParentContactLog(log: ParentContactLog, className?: string): void {
    this.addContact(log, className);
  }

  deleteParentContactLog(id: string, className?: string): void {
    const cls = (className || this.currentActiveClass || '11A1').trim().toUpperCase();
    this.saveContacts(this.getContacts(cls).filter((c) => c.id !== id), cls);
  }

  getCalendarEvents(className?: string): CalendarEvent[] {
    return this.getCalendar(className);
  }

  saveCalendarEvent(ev: CalendarEvent, className?: string): void {
    this.addEvent(ev, className);
  }

  deleteCalendarEvent(id: string, className?: string): void {
    this.deleteEvent(id, className);
  }

  getFinancialTransactions(className?: string): FinanceTransaction[] {
    return this.getFinance(className);
  }

  saveFinancialTransaction(tx: FinanceTransaction, className?: string): void {
    this.addTransaction(tx, className);
  }

  deleteFinancialTransaction(id: string, className?: string): void {
    this.deleteTransaction(id, className);
  }

  getDiaryEntries(className?: string): DiaryEntry[] {
    return this.getDiary(className);
  }

  saveDiaryEntry(entry: DiaryEntry, className?: string): void {
    this.addDiary(entry, className);
  }

  deleteDiaryEntry(id: string, className?: string): void {
    this.deleteDiary(id, className);
  }

  getAuditLogs(): AuditLogRecord[] {
    return getItem<AuditLogRecord[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  addAuditLog(log: Omit<AuditLogRecord, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLogRecord = {
      ...log,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    if (logs.length > 500) {
      logs.pop();
    }
    setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  getRolePermissions(): RolePermissionConfig[] {
    return getItem<RolePermissionConfig[]>(STORAGE_KEYS.ROLE_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS);
  }

  saveRolePermissions(configs: RolePermissionConfig[]): void {
    setItem(STORAGE_KEYS.ROLE_PERMISSIONS, configs);
  }

  exportFullBackup(): string {
    return this.exportAllData();
  }

  importBackup(jsonString: string): boolean {
    return this.importAllData(jsonString);
  }

  resetToInitialMock(): void {
    this.resetToDefault();
  }

  getClasses(): ClassItem[] {
    return getItem<ClassItem[]>(STORAGE_KEYS.CLASSES, []);
  }

  saveClasses(classes: ClassItem[]): void {
    setItem(STORAGE_KEYS.CLASSES, classes);
  }

  addClass(cls: ClassItem): void {
    const classes = this.getClasses();
    const existingIdx = classes.findIndex(
      (c) => c.id === cls.id || c.className.toLowerCase() === cls.className.toLowerCase()
    );
    if (existingIdx >= 0) {
      classes[existingIdx] = { ...classes[existingIdx], ...cls };
    } else {
      classes.push(cls);
    }
    this.saveClasses(classes);
  }

  updateClass(cls: ClassItem): void {
    const classes = this.getClasses();
    const idx = classes.findIndex((c) => c.id === cls.id);
    if (idx >= 0) {
      classes[idx] = cls;
      this.saveClasses(classes);
    }
  }

  deleteClass(classId: string): void {
    const classes = this.getClasses().filter((c) => c.id !== classId);
    this.saveClasses(classes);
  }
}

export const storage = new StorageRepository();
export const storageService = storage;

