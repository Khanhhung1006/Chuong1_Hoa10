import React, { useState, useEffect, useCallback } from 'react';
import { storageService } from './services/storageService';
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
  UserAccount,
  AuthSession,
  PendingApprovalItem,
  PhoneRecord,
} from './types';
import { Header } from './components/common/Header';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { StudentDetailDrawer } from './components/common/StudentDetailDrawer';
import { StudentFormModal } from './components/common/StudentFormModal';
import { ImportStudentsModal } from './components/common/ImportStudentsModal';
import { StudentTransferData } from './components/common/StudentTransferModal';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { Snackbar } from './components/common/Snackbar';
import { cloudSyncService, FullClassData } from './services/cloudSyncService';

// Views
import { DashboardView } from './components/views/DashboardView';
import { StudentsView } from './components/views/StudentsView';
import { AttendanceView } from './components/views/AttendanceView';
import { PhoneManagementView } from './components/views/PhoneManagementView';
import { UniformCheckView } from './components/views/UniformCheckView';
import { ViolationsRewardsView } from './components/views/ViolationsRewardsView';
import { EmulationView } from './components/views/EmulationView';
import { AcademicsView } from './components/views/AcademicsView';
import { ConductView } from './components/views/ConductView';
import { ParentContactView } from './components/views/ParentContactView';
import { CalendarView } from './components/views/CalendarView';
import { ReportsView } from './components/views/ReportsView';
import { DocumentsView } from './components/views/DocumentsView';
import { DiaryView } from './components/views/DiaryView';
import { AIAssistantView } from './components/views/AIAssistantView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';
import { ApprovalsView } from './components/views/ApprovalsView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { ClassAccountInitModal } from './components/views/ClassAccountInitModal';
import { RolePermissionsModal } from './components/common/RolePermissionsModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import { ForceChangePasswordModal } from './components/auth/ForceChangePasswordModal';
import { authService } from './services/authService';

export function getDefaultTabForUser(user?: UserAccount): NavTab {
  if (!user) return 'dashboard';
  if (user.role === 'ADMIN') return 'admin';
  if (user.role === 'GVCN') return 'dashboard';

  const roleUpper = (user.role || '').toUpperCase();
  const roleTitleLower = (user.roleTitle || '').toLowerCase();

  if (roleUpper === 'LT' || roleTitleLower.includes('lớp trưởng')) {
    return 'attendance';
  }
  if (roleUpper === 'TK' || roleTitleLower.includes('thư ký') || roleTitleLower.includes('thư kí')) {
    return 'violations';
  }
  if (roleUpper.startsWith('TT') || roleTitleLower.includes('tổ trưởng')) {
    return 'phones';
  }

  return 'attendance';
}

export default function App() {
  // Authentication State
  const [session, setSession] = useState<AuthSession | null>(() => authService.getSession());
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [approvals, setApprovals] = useState<PendingApprovalItem[]>(() => authService.getApprovals());
  const [approvalsBadgeCount, setApprovalsBadgeCount] = useState(0);

  // Initialize storage active class based on session
  const initialClass = session?.user?.assignedClass
    ? session.user.assignedClass.trim().toUpperCase()
    : '11A1';
  storageService.setActiveClass(initialClass);

  // Navigation & Shell UI State
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    const currentSession = authService.getSession();
    return getDefaultTabForUser(currentSession?.user);
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isRolePermissionsOpen, setIsRolePermissionsOpen] = useState<boolean>(false);
  const [isClassInitModalOpen, setIsClassInitModalOpen] = useState<boolean>(false);

  // Persistent Domain State from Local-First Storage (scoped to active class)
  const [settings, setSettings] = useState<ClassSettings>(() => storageService.getSettings(initialClass));
  const [students, setStudents] = useState<Student[]>(() => storageService.getStudents(initialClass));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => storageService.getAttendance(initialClass));
  const [phoneRecords, setPhoneRecords] = useState<PhoneRecord[]>(() => storageService.getPhoneRecords(initialClass));
  const [violations, setViolations] = useState<ViolationRecord[]>(() => storageService.getViolations(initialClass));
  const [rewards, setRewards] = useState<RewardRecord[]>(() => storageService.getRewards(initialClass));
  const [grades, setGrades] = useState<GradeRecord[]>(() => storageService.getGrades(initialClass));
  const [conducts, setConducts] = useState<ConductRecord[]>(() => storageService.getConducts(initialClass));
  const [contactLogs, setContactLogs] = useState<ParentContactLog[]>(() => storageService.getParentContactLogs(initialClass));
  const [events, setEvents] = useState<CalendarEvent[]>(() => storageService.getCalendarEvents(initialClass));
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => storageService.getFinancialTransactions(initialClass));
  const [documents, setDocuments] = useState<DocumentItem[]>(() => storageService.getDocuments(initialClass));
  const [diary, setDiary] = useState<DiaryEntry[]>(() => storageService.getDiaryEntries(initialClass));

  // Drawers & Modals
  const [selectedStudentForDrawer, setSelectedStudentForDrawer] = useState<Student | null>(null);
  const [studentFormOpen, setStudentFormOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Confirmation & Toast alerts
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'error' | 'warning';
    isVisible: boolean;
  }>({
    message: '',
    type: 'success',
    isVisible: false,
  });

  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
      setToast({ message, type, isVisible: true });
    },
    []
  );

  // Central function to switch and load class-scoped data
  const loadClassData = useCallback((targetClass: string) => {
    const safeClass = (targetClass || '11A1').trim().toUpperCase();
    storageService.setActiveClass(safeClass);

    const s = storageService.getSettings(safeClass);
    setSettings(s);
    setStudents(storageService.getStudents(safeClass));
    setAttendance(storageService.getAttendance(safeClass));
    setPhoneRecords(storageService.getPhoneRecords(safeClass));
    setViolations(storageService.getViolations(safeClass));
    setRewards(storageService.getRewards(safeClass));
    setGrades(storageService.getGrades(safeClass));
    setConducts(storageService.getConducts(safeClass));
    setContactLogs(storageService.getParentContactLogs(safeClass));
    setEvents(storageService.getCalendarEvents(safeClass));
    setTransactions(storageService.getFinancialTransactions(safeClass));
    setDocuments(storageService.getDocuments(safeClass));
    setDiary(storageService.getDiaryEntries(safeClass));

    cloudSyncService.initRealtimeSync(safeClass);
  }, []);

  // Theme synchronization (Dark / Light mode)
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const toggleDarkMode = () => {
    const nextMode = !settings.darkMode;
    const updated = { ...settings, darkMode: nextMode };
    setSettings(updated);
    storageService.saveSettings(updated);
  };

  // Keep storageService active class aligned with settings
  useEffect(() => {
    if (settings.className) {
      storageService.setActiveClass(settings.className);
    }
  }, [settings.className]);

  useEffect(() => {
    const handleAuthChange = (e: CustomEvent<{ session: AuthSession | null }>) => {
      const newSession = e.detail.session;
      setSession(newSession);
      if (newSession?.user) {
        const targetClass = newSession.user.assignedClass
          ? newSession.user.assignedClass.trim().toUpperCase()
          : '11A1';
        loadClassData(targetClass);

        if (newSession.user.role === 'ADMIN') {
          setActiveTab('admin');
        } else if (newSession.user.role === 'GVCN') {
          setActiveTab('dashboard');
          const cls = storageService
            .getClasses()
            .find((c) => c.className.toUpperCase() === targetClass);
          const stList = storageService.getStudents(targetClass);
          if (!cls?.isInitialized || stList.length === 0) {
            setIsClassInitModalOpen(true);
          }
        } else {
          setActiveTab(getDefaultTabForUser(newSession.user));
        }
      } else {
        loadClassData('11A1');
      }
    };
    window.addEventListener('edumaster_auth_change', handleAuthChange as EventListener);
    const handleClassesChange = () => {
      const currentSession = authService.getSession();
      if (currentSession?.user) {
        setSession({ ...currentSession });
      }
    };
    window.addEventListener('edumaster_classes_change', handleClassesChange);

    return () => {
      window.removeEventListener('edumaster_auth_change', handleAuthChange as EventListener);
      window.removeEventListener('edumaster_classes_change', handleClassesChange);
    };
  }, [loadClassData]);

  useEffect(() => {
    const updateApprovalsCount = () => {
       const apps = authService.getApprovals();
       setApprovals(apps || []);
       setApprovalsBadgeCount((apps || []).filter(a => a.status === 'pending').length);
    }
    updateApprovalsCount();
    window.addEventListener('edumaster_approvals_change', updateApprovalsCount);
    return () => window.removeEventListener('edumaster_approvals_change', updateApprovalsCount);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setSession(null);
    loadClassData('11A1');
  };

  // Initialize Cloud Sync & Realtime Firestore synchronization
  useEffect(() => {
    // 1. Start listening to realtime changes from Firebase
    cloudSyncService.initRealtimeSync(settings.className);

    // 2. Handle remote data changes (when updated from another device/browser)
    const unsubRemote = cloudSyncService.addRemoteDataListener((remoteData: FullClassData) => {
      if (!remoteData) return;
      if (remoteData.settings) {
        setSettings(remoteData.settings);
        storageService.saveSettings(remoteData.settings);
      }
      if (remoteData.students) {
        setStudents(remoteData.students);
        storageService.saveStudents(remoteData.students);
      }
      if (remoteData.attendance) {
        setAttendance(remoteData.attendance);
        storageService.saveAttendance(remoteData.attendance);
      }
      if (remoteData.violations) {
        setViolations(remoteData.violations);
        storageService.saveViolations(remoteData.violations);
      }
      if (remoteData.rewards) {
        setRewards(remoteData.rewards);
        storageService.saveRewards(remoteData.rewards);
      }
      if (remoteData.scores) {
        setGrades(remoteData.scores);
        storageService.saveScores(remoteData.scores);
      }
      if (remoteData.conduct) {
        setConducts(remoteData.conduct);
        storageService.saveConduct(remoteData.conduct);
      }
      if (remoteData.contacts) {
        setContactLogs(remoteData.contacts);
        storageService.saveContacts(remoteData.contacts);
      }
      if (remoteData.calendar) {
        setEvents(remoteData.calendar);
        storageService.saveCalendar(remoteData.calendar);
      }
      if (remoteData.finance) {
        setTransactions(remoteData.finance);
        storageService.saveFinance(remoteData.finance);
      }
      if (remoteData.documents) {
        setDocuments(remoteData.documents);
        storageService.saveDocuments(remoteData.documents);
      }
      if (remoteData.diary) {
        setDiary(remoteData.diary);
        storageService.saveDiary(remoteData.diary);
      }
      showToast('⚡ Dữ liệu lớp học vừa được đồng bộ tự động từ Đám mây!', 'info');
    });

    return () => {
      unsubRemote();
    };
  }, [settings.className]);

  // Automatically queue cloud sync whenever any state changes
  useEffect(() => {
    cloudSyncService.queueSync({
      students,
      attendance,
      violations,
      rewards,
      scores: grades,
      conduct: conducts,
      contacts: contactLogs,
      calendar: events,
      finance: transactions,
      documents,
      diary,
      settings,
    });
  }, [
    students,
    attendance,
    violations,
    rewards,
    grades,
    conducts,
    contactLogs,
    events,
    transactions,
    documents,
    diary,
    settings,
  ]);

  const handleManualSync = async () => {
    showToast('Đang kết nối và đồng bộ lên Đám mây Firebase...', 'info');
    const ok = await cloudSyncService.pushNow({
      students,
      attendance,
      violations,
      rewards,
      scores: grades,
      conduct: conducts,
      contacts: contactLogs,
      calendar: events,
      finance: transactions,
      documents,
      diary,
      settings,
    });
    if (ok) {
      showToast('Đã đồng bộ toàn bộ dữ liệu lên Đám mây Firebase thành công!', 'success');
    } else {
      showToast('Chưa thể kết nối đám mây. Dữ liệu sẽ tự động đồng bộ khi có mạng.', 'warning');
    }
  };

  const handleManualPull = async () => {
    showToast('Đang kết nối và tải dữ liệu từ Đám mây Firebase...', 'info');
    const remoteData = await cloudSyncService.pullFromFirestore(settings.className);
    if (remoteData) {
      if (remoteData.settings) {
        setSettings(remoteData.settings);
        storageService.saveSettings(remoteData.settings);
      }
      if (remoteData.students) {
        setStudents(remoteData.students);
        storageService.saveStudents(remoteData.students);
      }
      if (remoteData.attendance) {
        setAttendance(remoteData.attendance);
        storageService.saveAttendance(remoteData.attendance);
      }
      if (remoteData.violations) {
        setViolations(remoteData.violations);
        storageService.saveViolations(remoteData.violations);
      }
      if (remoteData.rewards) {
        setRewards(remoteData.rewards);
        storageService.saveRewards(remoteData.rewards);
      }
      if (remoteData.scores) {
        setGrades(remoteData.scores);
        storageService.saveScores(remoteData.scores);
      }
      if (remoteData.conduct) {
        setConducts(remoteData.conduct);
        storageService.saveConduct(remoteData.conduct);
      }
      if (remoteData.contacts) {
        setContactLogs(remoteData.contacts);
        storageService.saveContacts(remoteData.contacts);
      }
      if (remoteData.calendar) {
        setEvents(remoteData.calendar);
        storageService.saveCalendar(remoteData.calendar);
      }
      if (remoteData.finance) {
        setTransactions(remoteData.finance);
        storageService.saveFinance(remoteData.finance);
      }
      if (remoteData.documents) {
        setDocuments(remoteData.documents);
        storageService.saveDocuments(remoteData.documents);
      }
      if (remoteData.diary) {
        setDiary(remoteData.diary);
        storageService.saveDiary(remoteData.diary);
      }
      showToast('⚡ Đồng bộ tải dữ liệu từ Đám mây thành công!', 'success');
    } else {
      showToast('Không tìm thấy dữ liệu lớp này trên Đám mây hoặc có lỗi kết nối.', 'warning');
    }
  };

  // Subscribe to storage change events to keep state synced
  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      const customEv = e as CustomEvent;
      const key = (customEv.detail?.key || '').toString();

      const currentClass = settings.className || '11A1';
      const cleanClass = currentClass.replace(/[^a-zA-Z0-9]/g, '_');

      // If key is provided, only update state if key belongs to active class
      if (key && !key.toUpperCase().includes(cleanClass.toUpperCase())) {
        return;
      }

      if (!key) return;

      if (key.includes('students')) {
        setStudents(storageService.getStudents(currentClass));
      } else if (key.includes('attendance')) {
        setAttendance(storageService.getAttendance(currentClass));
      } else if (key.includes('phones')) {
        setPhoneRecords(storageService.getPhoneRecords(currentClass));
      } else if (key.includes('violations')) {
        setViolations(storageService.getViolations(currentClass));
      } else if (key.includes('rewards')) {
        setRewards(storageService.getRewards(currentClass));
      } else if (key.includes('scores')) {
        setGrades(storageService.getGrades(currentClass));
      } else if (key.includes('conduct')) {
        setConducts(storageService.getConducts(currentClass));
      } else if (key.includes('contacts')) {
        setContactLogs(storageService.getParentContactLogs(currentClass));
      } else if (key.includes('calendar')) {
        setEvents(storageService.getCalendarEvents(currentClass));
      } else if (key.includes('finance')) {
        setTransactions(storageService.getFinancialTransactions(currentClass));
      } else if (key.includes('documents')) {
        setDocuments(storageService.getDocuments(currentClass));
      } else if (key.includes('diary')) {
        setDiary(storageService.getDiaryEntries(currentClass));
      } else if (key.includes('settings')) {
        setSettings(storageService.getSettings(currentClass));
      }
    };

    window.addEventListener('edumaster_data_change', handleStorageChange);
    return () => window.removeEventListener('edumaster_data_change', handleStorageChange);
  }, [settings.className]);

  // Student CRUD handlers
  const handleSaveStudent = (studentData: Student) => {
    storageService.saveStudent(studentData);
    setStudents(storageService.getStudents());
    showToast(
      studentToEdit
        ? `Đã cập nhật hồ sơ học sinh ${studentData.fullName}`
        : `Đã thêm học sinh ${studentData.fullName} vào lớp ${settings.className}`,
      'success'
    );
  };

  const handleUpdateStudents = (updatedStudents: Student[]) => {
    storageService.saveStudents(updatedStudents);
    setStudents(storageService.getStudents());
  };

  const handleImportStudents = (importedList: Student[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      storageService.saveStudents(importedList);
      setStudents(importedList);
      showToast(
        `Đã thiết lập mới danh sách lớp ${settings.className} với ${importedList.length} học sinh từ file Excel!`,
        'success'
      );
    } else {
      const currentList = [...students];
      let added = 0;
      let updated = 0;

      importedList.forEach((st) => {
        const existingIdx = currentList.findIndex(
          (s) => s.code.trim().toLowerCase() === st.code.trim().toLowerCase()
        );
        if (existingIdx >= 0) {
          currentList[existingIdx] = {
            ...currentList[existingIdx],
            ...st,
            id: currentList[existingIdx].id,
          };
          updated++;
        } else {
          currentList.push(st);
          added++;
        }
      });

      storageService.saveStudents(currentList);
      setStudents(currentList);
      showToast(
        `Đã nhập thành công ${added} học sinh mới${
          updated > 0 ? ` (cập nhật ${updated} học sinh trùng mã)` : ''
        } từ file Excel!`,
        'success'
      );
    }
  };

  const handleDeleteStudent = (
    studentId: string,
    name: string,
    transferData?: StudentTransferData
  ) => {
    if (transferData) {
      storageService.deleteStudent(studentId);
      setStudents(storageService.getStudents());
      const label =
        transferData.transferType === 'transfer_class'
          ? `Đã xử lý chuyển học sinh ${name} sang lớp ${transferData.targetDestination || 'mới'}`
          : transferData.transferType === 'transfer_school'
          ? `Đã xử lý chuyển trường cho học sinh ${name}`
          : `Đã xóa học sinh ${name} khỏi danh sách lớp ${settings.className}`;
      showToast(label, 'info');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Xóa học sinh khỏi lớp?',
      message: `Bạn có chắc chắn muốn xóa học sinh "${name}" khỏi danh sách lớp ${settings.className}? Dữ liệu liên quan đến học sinh này sẽ bị xóa.`,
      onConfirm: () => {
        storageService.deleteStudent(studentId);
        setStudents(storageService.getStudents());
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast(`Đã xóa học sinh ${name}`, 'info');
      },
    });
  };

  // Attendance Handlers
  const checkDataLocked = (): boolean => {
    const isTeacher = session?.user?.role === 'GVCN' || session?.user?.role === 'ADMIN';
    if (!isTeacher && settings.isLockedData) {
      showToast('Dữ liệu lớp học đã bị GVCN khóa, không thể chỉnh sửa hoặc báo cáo!', 'error');
      return true;
    }
    return false;
  };

  const handleSaveMultipleAttendance = (records: AttendanceRecord[]) => {
    if (checkDataLocked()) return;
    const isTeacher = session?.user?.role === 'GVCN' || session?.user?.role === 'ADMIN';
    const requireApproval = settings.requireApprovalAttendance !== false;

    if (isTeacher || !requireApproval) {
      const currentList = storageService.getAttendance();
      const updated = [...currentList];
      records.forEach((rec) => {
        const idx = updated.findIndex(
          (a) =>
            a.studentId === rec.studentId &&
            a.date === rec.date &&
            a.session === rec.session &&
            a.period === rec.period
        );
        if (idx >= 0) {
          updated[idx] = rec;
        } else {
          updated.push(rec);
        }
      });
      storageService.saveAttendance(updated);
      setAttendance(updated);
      if (isTeacher) {
        showToast('Đã lưu dữ liệu điểm danh thành công!', 'success');
      } else {
        showToast('Đã ghi nhận trực tiếp điểm danh (Cài đặt GVCN không yêu cầu duyệt)!', 'success');
      }
    } else {
      authService.submitApproval({
        type: 'attendance_multiple',
        title: 'Báo cáo điểm danh',
        description: `Báo cáo điểm danh cho ${records.length} bản ghi`,
        submittedBy: {
          username: session?.user?.username || 'unknown',
          displayName: session?.user?.displayName || 'Cán sự',
          role: session?.user?.role || 'HS',
          roleTitle: session?.user?.roleTitle || 'Cán sự',
        },
        attendanceRecords: records,
      });
      showToast('Đã gửi báo cáo điểm danh cho GVCN duyệt!', 'info');
    }
  };

  const handleSavePhoneRecords = (records: PhoneRecord[]) => {
    if (checkDataLocked()) return;
    const isTeacher = session?.user?.role === 'GVCN' || session?.user?.role === 'ADMIN';
    const requireApproval = settings.requireApprovalAttendance !== false;

    if (isTeacher || !requireApproval) {
      const cls = (settings.className || '11A1').trim().toUpperCase();
      const currentList = storageService.getPhoneRecords(cls);
      const updated = [...currentList];
      records.forEach((rec) => {
        const idx = updated.findIndex(
          (p) =>
            p.studentId === rec.studentId &&
            p.date === rec.date &&
            (p.session || 'Sáng') === (rec.session || 'Sáng')
        );
        if (idx >= 0) {
          updated[idx] = rec;
        } else {
          updated.push(rec);
        }
      });
      storageService.savePhoneRecords(updated, cls);
      setPhoneRecords(updated);
      showToast('Đã lưu báo cáo nộp điện thoại thành công!', 'success');
    } else {
      authService.submitApproval({
        type: 'attendance_multiple',
        title: 'Báo cáo thu nộp điện thoại',
        description: `Báo cáo thu nộp điện thoại cho ${records.length} học sinh`,
        submittedBy: {
          username: session?.user?.username || 'unknown',
          displayName: session?.user?.displayName || 'Cán sự',
          role: session?.user?.role || 'HS',
          roleTitle: session?.user?.roleTitle || 'Cán sự',
        },
        attendanceRecords: records.map(r => ({
          id: r.id,
          date: r.date,
          session: r.session,
          studentId: r.studentId,
          status: r.status === 'submitted' ? 'Đã nộp ĐT' : r.status === 'not_submitted' ? 'Không nộp ĐT' : 'Không mang ĐT',
          note: r.note,
        })),
      });
      showToast('Đã gửi báo cáo thu nộp điện thoại cho GVCN duyệt!', 'info');
    }
  };

  // Violations & Rewards Handlers
  const handleAddViolation = (v: ViolationRecord) => {
    if (checkDataLocked()) return;
    const isTeacher = session?.user?.role === 'GVCN' || session?.user?.role === 'ADMIN';
    const requireApproval = settings.requireApprovalViolationsRewards !== false;

    if (isTeacher || !requireApproval) {
      storageService.addViolation(v);
      setViolations(storageService.getViolations());
      if (isTeacher) {
        showToast('Đã thêm biên bản vi phạm kỷ luật', 'success');
      } else {
        showToast('Đã ghi nhận trực tiếp vi phạm (Cài đặt GVCN không yêu cầu duyệt)!', 'success');
      }
    } else {
      const student = students.find(s => s.id === v.studentId);
      authService.submitApproval({
        type: 'violation',
        title: 'Báo cáo vi phạm',
        description: `Học sinh ${student?.fullName || v.studentId} vi phạm: ${v.content}`,
        submittedBy: {
          username: session?.user?.username || 'unknown',
          displayName: session?.user?.displayName || 'Cán sự',
          role: session?.user?.role || 'HS',
          roleTitle: session?.user?.roleTitle || 'Cán sự',
        },
        violationRecord: v,
      });
      showToast('Đã gửi báo cáo vi phạm cho GVCN duyệt!', 'info');
    }
  };

  const handleDeleteViolation = (id: string) => {
    if (checkDataLocked()) return;
    storageService.deleteViolation(id);
    setViolations(storageService.getViolations());
    showToast('Đã xóa biên bản vi phạm kỷ luật', 'info');
  };

  const handleAddReward = (r: RewardRecord) => {
    if (checkDataLocked()) return;
    const isTeacher = session?.user?.role === 'GVCN' || session?.user?.role === 'ADMIN';
    const requireApproval = settings.requireApprovalViolationsRewards !== false;

    if (isTeacher || !requireApproval) {
      storageService.addReward(r);
      setRewards(storageService.getRewards());
      if (isTeacher) {
        showToast('Đã thêm bản ghi tuyên dương', 'success');
      } else {
        showToast('Đã ghi nhận trực tiếp tuyên dương (Cài đặt GVCN không yêu cầu duyệt)!', 'success');
      }
    } else {
      const student = students.find(s => s.id === r.studentId);
      authService.submitApproval({
        type: 'reward',
        title: 'Đề xuất tuyên dương',
        description: `Đề xuất tuyên dương ${student?.fullName || r.studentId}: ${r.content}`,
        submittedBy: {
          username: session?.user?.username || 'unknown',
          displayName: session?.user?.displayName || 'Cán sự',
          role: session?.user?.role || 'HS',
          roleTitle: session?.user?.roleTitle || 'Cán sự',
        },
        rewardRecord: r,
      });
      showToast('Đã gửi đề xuất tuyên dương cho GVCN duyệt!', 'info');
    }
  };

  const handleDeleteReward = (id: string) => {
    if (checkDataLocked()) return;
    storageService.deleteReward(id);
    setRewards(storageService.getRewards());
    showToast('Đã xóa bản ghi khen thưởng', 'info');
  };

  const handleSaveMultipleRewards = (newRewards: RewardRecord[]) => {
    if (checkDataLocked()) return;
    const isTeacher = session?.user?.role === 'GVCN' || session?.user?.role === 'ADMIN';
    const requireApproval = settings.requireApprovalViolationsRewards !== false;

    if (isTeacher || !requireApproval) {
      const currentList = storageService.getRewards();
      const merged = [...newRewards];
      const newIds = new Set(newRewards.map(r => r.id));
      currentList.forEach(rec => {
        if (!newIds.has(rec.id)) {
          merged.push(rec);
        }
      });
      storageService.saveRewards(merged);
      setRewards(storageService.getRewards());
      if (isTeacher) {
        showToast('Đã lưu danh sách tuyên dương thành công!', 'success');
      } else {
        showToast('Đã ghi nhận trực tiếp điểm tốt (Cài đặt GVCN không yêu cầu duyệt)!', 'success');
      }
    } else {
      authService.submitApproval({
        type: 'reward_multiple',
        title: 'Báo cáo điểm tốt',
        description: `Báo cáo điểm tốt cập nhật danh sách`,
        submittedBy: {
          username: session?.user?.username || 'unknown',
          displayName: session?.user?.displayName || 'Cán sự',
          role: session?.user?.role || 'HS',
          roleTitle: session?.user?.roleTitle || 'Cán sự',
        },
        rewardRecords: newRewards,
      });
      showToast('Đã gửi báo cáo điểm tốt cho GVCN duyệt!', 'info');
    }
  };

  const handleSaveMultipleViolations = (newViolations: ViolationRecord[]) => {
    if (checkDataLocked()) return;
    const isTeacher = session?.user?.role === 'GVCN' || session?.user?.role === 'ADMIN';
    const requireApproval = settings.requireApprovalViolationsRewards !== false;

    if (isTeacher || !requireApproval) {
      const currentList = storageService.getViolations();
      const merged = [...newViolations];
      const newIds = new Set(newViolations.map(v => v.id));
      currentList.forEach(rec => {
        if (!newIds.has(rec.id)) {
          merged.push(rec);
        }
      });
      storageService.saveViolations(merged);
      setViolations(storageService.getViolations());
      if (isTeacher) {
        showToast('Đã lưu danh sách vi phạm thành công!', 'success');
      } else {
        showToast('Đã ghi nhận trực tiếp điểm kém (Cài đặt GVCN không yêu cầu duyệt)!', 'success');
      }
    } else {
      authService.submitApproval({
        type: 'violation_multiple',
        title: 'Báo cáo điểm kém',
        description: `Báo cáo điểm kém cập nhật danh sách`,
        submittedBy: {
          username: session?.user?.username || 'unknown',
          displayName: session?.user?.displayName || 'Cán sự',
          role: session?.user?.role || 'HS',
          roleTitle: session?.user?.roleTitle || 'Cán sự',
        },
        violationRecords: newViolations,
      });
      showToast('Đã gửi báo cáo điểm kém cho GVCN duyệt!', 'info');
    }
  };

  // Grades & Conduct Handlers
  const handleSaveGrade = (g: GradeRecord) => {
    storageService.saveGrade(g);
    setGrades(storageService.getGrades());
  };

  const handleSaveConduct = (c: ConductRecord | ConductRecord[]) => {
    if (Array.isArray(c)) {
      const cls = (settings.className || '11A1').trim().toUpperCase();
      const list = storageService.getConducts(cls);
      c.forEach((record) => {
        const idx = list.findIndex((x) => x.id === record.id);
        if (idx >= 0) {
          list[idx] = record;
        } else {
          list.push(record);
        }
      });
      storageService.saveConduct(list, cls);
      setConducts(list);
    } else {
      storageService.saveConductRecord(c);
      setConducts(storageService.getConducts());
    }
  };

  // Parent contact Handlers
  const handleAddContactLog = (log: ParentContactLog) => {
    storageService.saveParentContactLog(log);
    setContactLogs(storageService.getParentContactLogs());
  };

  const handleDeleteContactLog = (id: string) => {
    storageService.deleteParentContactLog(id);
    setContactLogs(storageService.getParentContactLogs());
    showToast('Đã xóa nhật ký liên lạc', 'info');
  };

  // Calendar Event Handlers
  const handleAddCalendarEvent = (ev: CalendarEvent) => {
    storageService.saveCalendarEvent(ev);
    setEvents(storageService.getCalendarEvents());
  };

  const handleDeleteCalendarEvent = (id: string) => {
    storageService.deleteCalendarEvent(id);
    setEvents(storageService.getCalendarEvents());
    showToast('Đã xóa sự kiện lịch công tác', 'info');
  };

  // Finance Handlers
  const handleAddTransaction = (tx: FinancialTransaction) => {
    storageService.saveFinancialTransaction(tx);
    setTransactions(storageService.getFinancialTransactions());
  };

  const handleDeleteTransaction = (id: string) => {
    storageService.deleteFinancialTransaction(id);
    setTransactions(storageService.getFinancialTransactions());
    showToast('Đã xóa giao dịch quỹ', 'info');
  };

  // Document Handlers
  const handleAddDocument = (doc: DocumentItem) => {
    storageService.saveDocument(doc);
    setDocuments(storageService.getDocuments());
  };

  // Diary Handlers
  const handleAddDiaryEntry = (entry: DiaryEntry) => {
    storageService.saveDiaryEntry(entry);
    setDiary(storageService.getDiaryEntries());
  };

  const handleDeleteDiaryEntry = (id: string) => {
    storageService.deleteDiaryEntry(id);
    setDiary(storageService.getDiaryEntries());
    showToast('Đã xóa mục nhật ký', 'info');
  };

  // Settings & Reset
  const handleUpdateSettings = (newSettings: ClassSettings) => {
    storageService.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const handleResetData = () => {
    storageService.resetToInitialMock();
    setSettings(storageService.getSettings());
    setStudents(storageService.getStudents());
    setAttendance(storageService.getAttendance());
    setViolations(storageService.getViolations());
    setRewards(storageService.getRewards());
    setGrades(storageService.getGrades());
    setConducts(storageService.getConducts());
    setContactLogs(storageService.getParentContactLogs());
    setEvents(storageService.getCalendarEvents());
    setTransactions(storageService.getFinancialTransactions());
    setDocuments(storageService.getDocuments());
    setDiary(storageService.getDiaryEntries());
  };

  // Badge counters for sidebar
  const todayStr = '2026-09-14';
  const absentTodayCount = (attendance || []).filter(
    (a) => a.date === todayStr && (a.status === 'Vắng có phép' || a.status === 'Vắng không phép')
  ).length;

  const urgentAttentionCount = (students || []).filter((s) => s.specialAttention).length;

  if (!session) {
    return (
      <LoginScreen
        academicYear={settings.academicYear}
        onLoginSuccess={(newSession) => {
          setSession(newSession);
          const targetClass = newSession.user.assignedClass
            ? newSession.user.assignedClass.trim().toUpperCase()
            : '11A1';
          loadClassData(targetClass);

          if (newSession.user.role === 'ADMIN') {
            setActiveTab('admin');
          } else if (newSession.user.role === 'GVCN') {
            setActiveTab('dashboard');
            // If class uninitialized or has no students, prompt 6-step initialization wizard
            const cls = storageService
              .getClasses()
              .find((c) => c.className.toUpperCase() === targetClass);
            const classStudents = storageService.getStudents(targetClass);
            if (!cls?.isInitialized || classStudents.length === 0) {
              setIsClassInitModalOpen(true);
            }
          } else {
            setActiveTab(getDefaultTabForUser(newSession.user));
          }
        }}
      />
    );
  }

  if (session.user.mustChangePassword) {
    return (
      <ForceChangePasswordModal
        user={session.user}
        onLogout={handleLogout}
        onPasswordChanged={() => {
          setSession(authService.getSession());
        }}
      />
    );
  }

  const userGroup = session?.user?.group || (session?.user?.role?.startsWith('TT') ? parseInt(session.user.role.replace('TT', ''), 10) : undefined);

  return (
    <div id="edumaster-app" className="min-h-screen bg-slate-100/70 dark:bg-slate-950 flex flex-col font-sans transition-colors">
      {/* Sticky Header */}
      <Header
        settings={settings}
        onToggleSidebar={() => {
          if (window.innerWidth < 1024) {
            setIsMobileSidebarOpen((prev) => !prev);
          } else {
            setIsSidebarCollapsed((prev) => !prev);
          }
        }}
        onToggleDarkMode={toggleDarkMode}
        onOpenAI={() => setActiveTab('ai')}
        onSelectStudent={(st) => setSelectedStudentForDrawer(st)}
        allStudents={students}
        currentUser={session.user}
        onLogout={handleLogout}
        onOpenChangePassword={() => setShowChangePassword(true)}
        pendingApprovalsCount={approvalsBadgeCount}
        onOpenApprovals={() => setActiveTab('approvals' as NavTab)}
        onOpenClassInitModal={() => setIsClassInitModalOpen(true)}
        onOpenAdminDashboard={() => setActiveTab('admin')}
        onNavigateToStudents={() => setActiveTab('students')}
      />

      {/* Main Body with Fixed/Sticky Sidebar and Content Stage */}
      <div className="flex-1 flex w-full">
        <Sidebar
          currentTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          badgeCounts={{
            absentToday: absentTodayCount,
            violationsCount: violations.length,
            urgentAttention: urgentAttentionCount,
          }}
          currentUser={session.user}
          onLogout={handleLogout}
        />

        {/* Dynamic View Content Area */}
        <main
          id="main-stage"
          className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto w-full transition-all duration-300"
        >
          {activeTab === 'admin' && (
            <AdminDashboardView
              onShowToast={showToast}
              onNavigateToAuditLogs={() => setActiveTab('audit_logs')}
              onSelectClass={(selectedClass) => {
                loadClassData(selectedClass);
                setActiveTab('dashboard');
                showToast(`Đã chuyển sang xem dữ liệu lớp ${selectedClass}`, 'info');
              }}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              students={students}
              attendance={attendance}
              violations={violations}
              rewards={rewards}
              events={events}
              settings={settings}
              phoneRecords={phoneRecords}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenStudentDetail={(st) => setSelectedStudentForDrawer(st)}
              onOpenAI={() => setActiveTab('ai')}
              onOpenClassInitModal={() => setIsClassInitModalOpen(true)}
            />
          )}

          {activeTab === 'students' && (
            <StudentsView
              students={students}
              settings={settings}
              currentUser={session.user}
              onOpenStudentDetail={(st) => setSelectedStudentForDrawer(st)}
              onOpenAddStudent={() => {
                setStudentToEdit(null);
                setStudentFormOpen(true);
              }}
              onOpenImportExcel={() => setIsImportModalOpen(true)}
              onEditStudent={(st) => {
                setStudentToEdit(st);
                setStudentFormOpen(true);
              }}
              onDeleteStudent={handleDeleteStudent}
              onUpdateStudents={handleUpdateStudents}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView
              students={students}
              attendance={attendance}
              settings={settings}
              onSaveAttendance={handleSaveMultipleAttendance}
              onShowToast={showToast}
              currentUserGroup={userGroup}
              currentUser={session.user}
            />
          )}

          {activeTab === 'phones' && (
            <PhoneManagementView
              students={students}
              phoneRecords={phoneRecords}
              settings={settings}
              onSavePhoneRecords={handleSavePhoneRecords}
              onAddViolation={handleAddViolation}
              onShowToast={showToast}
              currentUserGroup={userGroup}
              currentUser={session.user}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'uniformCheck' && (
            <UniformCheckView
              students={students}
              violations={violations}
              settings={settings}
              onSaveMultipleViolations={handleSaveMultipleViolations}
              onShowToast={showToast}
              currentUserGroup={userGroup}
              currentUser={session.user}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'violations' && (
            <ViolationsRewardsView
              students={students}
              violations={violations}
              rewards={rewards}
              initialTab="violations"
              onAddViolation={handleAddViolation}
              onDeleteViolation={handleDeleteViolation}
              onAddReward={handleAddReward}
              onDeleteReward={handleDeleteReward}
              onSaveMultipleRewards={handleSaveMultipleRewards}
              onSaveMultipleViolations={handleSaveMultipleViolations}
              onShowToast={showToast}
              currentUserGroup={userGroup}
              settings={settings}
              currentUser={session.user || undefined}
            />
          )}

          {activeTab === 'rewards' && (
            <ViolationsRewardsView
              students={students}
              violations={violations}
              rewards={rewards}
              initialTab="rewards"
              onAddViolation={handleAddViolation}
              onDeleteViolation={handleDeleteViolation}
              onAddReward={handleAddReward}
              onDeleteReward={handleDeleteReward}
              onSaveMultipleRewards={handleSaveMultipleRewards}
              onSaveMultipleViolations={handleSaveMultipleViolations}
              onShowToast={showToast}
              currentUserGroup={userGroup}
              settings={settings}
              currentUser={session.user || undefined}
            />
          )}

          {activeTab === 'emulation' && (
            <EmulationView
              students={students}
              violations={violations}
              rewards={rewards}
              settings={settings}
              onOpenStudentDetail={(st) => setSelectedStudentForDrawer(st)}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'academics' && (
            <AcademicsView
              students={students}
              grades={grades}
              settings={settings}
              onSaveGrade={handleSaveGrade}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'conduct' && (
            <ConductView
              students={students}
              attendance={attendance}
              violations={violations}
              rewards={rewards}
              conducts={conducts}
              settings={settings}
              onSaveConduct={handleSaveConduct}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'parents' && (
            <ParentContactView
              students={students}
              contactLogs={contactLogs}
              settings={settings}
              onAddLog={handleAddContactLog}
              onDeleteLog={handleDeleteContactLog}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              events={events}
              onAddEvent={handleAddCalendarEvent}
              onDeleteEvent={handleDeleteCalendarEvent}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              students={students}
              attendance={attendance}
              violations={violations}
              rewards={rewards}
              transactions={transactions}
              contactLogs={contactLogs}
              diaryEntries={diary}
              grades={grades}
              conducts={conducts}
              settings={settings}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsView
              documents={documents}
              onAddDocument={handleAddDocument}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'diary' && (
            <DiaryView
              entries={diary}
              onAddEntry={handleAddDiaryEntry}
              onDeleteEntry={handleDeleteDiaryEntry}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'ai' && (
            <AIAssistantView
              students={students}
              settings={settings}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              students={students}
              attendance={attendance}
              violations={violations}
              rewards={rewards}
              settings={settings}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              students={students}
              onUpdateSettings={handleUpdateSettings}
              onResetData={handleResetData}
              onShowToast={showToast}
              onOpenRolePermissions={() => setIsRolePermissionsOpen(true)}
              onOpenClassInitModal={() => setIsClassInitModalOpen(true)}
            />
          )}

          {activeTab === 'audit_logs' && (
            <AuditLogsView currentRole={session.user.role} />
          )}

          {activeTab === 'approvals' && (
            <ApprovalsView
              currentUser={session.user}
              onShowToast={showToast}
              approvals={approvals}
              students={students}
              settings={settings}
              onNavigateToSettings={() => setActiveTab('settings')}
              onApproveItem={(item) => {
                if (session.user.role !== 'GVCN' && session.user.role !== 'ADMIN') return;
                const updated = authService.approveApprovalItem(item.id, session.user.displayName);
                if (updated) {
                  if ((item.type === 'attendance_multiple' || item.type === 'attendance') && item.attendanceRecords) {
                    handleSaveMultipleAttendance(item.attendanceRecords);
                  } else if (item.type === 'violation' && item.violationRecord) {
                    handleAddViolation(item.violationRecord);
                  } else if (item.type === 'reward' && item.rewardRecord) {
                    handleAddReward(item.rewardRecord);
                  } else if (item.type === 'reward_multiple' && item.rewardRecords) {
                    handleSaveMultipleRewards(item.rewardRecords);
                  } else if (item.type === 'violation_multiple' && item.violationRecords) {
                    handleSaveMultipleViolations(item.violationRecords);
                  }
                  showToast('Đã duyệt phiếu trình.', 'success');
                }
              }}
              onRejectItem={(id, reason) => {
                if (session.user.role !== 'GVCN' && session.user.role !== 'ADMIN') return;
                const updated = authService.rejectApprovalItem(id, session.user.displayName, reason);
                if (updated) {
                  showToast('Đã từ chối phiếu trình.', 'info');
                }
              }}
              onApproveAll={() => {
                if (session.user.role !== 'GVCN' && session.user.role !== 'ADMIN') return;
                const pending = approvals.filter(a => a.status === 'pending');
                let count = 0;
                pending.forEach(item => {
                  const updated = authService.approveApprovalItem(item.id, session.user.displayName);
                  if (updated) {
                    if ((item.type === 'attendance_multiple' || item.type === 'attendance') && item.attendanceRecords) {
                      const currentList = storageService.getAttendance();
                      const updatedAttendance = [...currentList];
                      item.attendanceRecords.forEach((rec) => {
                        const idx = updatedAttendance.findIndex(
                          (a) =>
                            a.studentId === rec.studentId &&
                            a.date === rec.date &&
                            a.session === rec.session &&
                            a.period === rec.period
                        );
                        if (idx >= 0) {
                          updatedAttendance[idx] = rec;
                        } else {
                          updatedAttendance.push(rec);
                        }
                      });
                      storageService.saveAttendance(updatedAttendance);
                    } else if (item.type === 'violation' && item.violationRecord) {
                      storageService.addViolation(item.violationRecord);
                    } else if (item.type === 'reward' && item.rewardRecord) {
                      storageService.addReward(item.rewardRecord);
                    } else if (item.type === 'reward_multiple' && item.rewardRecords) {
                      const currentList = storageService.getRewards();
                      const merged = [...item.rewardRecords];
                      const newIds = new Set(item.rewardRecords.map(r => r.id));
                      currentList.forEach(rec => {
                        if (!newIds.has(rec.id)) {
                          merged.push(rec);
                        }
                      });
                      storageService.saveRewards(merged);
                    } else if (item.type === 'violation_multiple' && item.violationRecords) {
                      const currentList = storageService.getViolations();
                      const merged = [...item.violationRecords];
                      const newIds = new Set(item.violationRecords.map(v => v.id));
                      currentList.forEach(rec => {
                        if (!newIds.has(rec.id)) {
                          merged.push(rec);
                        }
                      });
                      storageService.saveViolations(merged);
                    }
                    count++;
                  }
                });
                if (count > 0) {
                  setAttendance(storageService.getAttendance());
                  setViolations(storageService.getViolations());
                  setRewards(storageService.getRewards());
                  showToast(`Đã duyệt tất cả (${count} phiếu trình).`, 'success');
                }
              }}
            />
          )}
        </main>
      </div>

      {/* Global Student Detail Drawer */}
      <StudentDetailDrawer
        student={selectedStudentForDrawer}
        isOpen={Boolean(selectedStudentForDrawer)}
        onClose={() => setSelectedStudentForDrawer(null)}
        attendance={attendance}
        violations={violations}
        rewards={rewards}
        grades={grades}
        onOpenEditStudent={(st) => {
          setSelectedStudentForDrawer(null);
          setStudentToEdit(st);
          setStudentFormOpen(true);
        }}
      />

      {/* Global Student Add/Edit Modal Form */}
      <StudentFormModal
        isOpen={studentFormOpen}
        onClose={() => {
          setStudentFormOpen(false);
          setStudentToEdit(null);
        }}
        onSave={handleSaveStudent}
        onOpenImportExcel={() => setIsImportModalOpen(true)}
        studentToEdit={studentToEdit}
        currentCount={students.length}
        className={settings.className}
      />

      {/* Global Excel Student Import Modal */}
      <ImportStudentsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportStudents}
        existingStudents={students}
        settings={settings}
      />

      {/* Global Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        user={session.user}
        onSuccessToast={showToast}
      />

      {/* Global Toast Notification */}
      <Snackbar
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        badgeCounts={{
          absentToday: absentTodayCount,
          violationsCount: violations.length,
          urgentAttention: urgentAttentionCount,
        }}
        currentUser={session.user}
      />

      {/* RBAC Role Permissions & Configuration Modal */}
      <RolePermissionsModal
        isOpen={isRolePermissionsOpen}
        onClose={() => setIsRolePermissionsOpen(false)}
        showToast={showToast}
      />

      {/* Class Account Initialization & Cadre Setup Wizard Modal */}
      <ClassAccountInitModal
        isOpen={isClassInitModalOpen}
        onClose={() => setIsClassInitModalOpen(false)}
        currentClass={session?.user.assignedClass || settings.className}
        academicYear={settings.academicYear}
        existingStudents={students}
        currentUser={session.user}
        onShowToast={showToast}
        onSuccess={(createdAccounts, updatedStudents, finalizedClass) => {
          const targetClass = (finalizedClass || session?.user.assignedClass || settings.className).trim().toUpperCase();
          if (session && session.user && session.user.role === 'GVCN' && session.user.assignedClass !== targetClass) {
            const updatedUser = { ...session.user, assignedClass: targetClass };
            authService.setSession({ ...session, user: updatedUser });
            setSession({ ...session, user: updatedUser });
          }
          storageService.setActiveClass(targetClass);
          loadClassData(targetClass);
        }}
      />
    </div>
  );
}
