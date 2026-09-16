export type Gender = 'Nam' | 'Nữ';

export type AttendanceStatus =
  | 'present'
  | 'absent_excused'
  | 'absent_unexcused'
  | 'late_under_5'
  | 'late_over_5'
  | 'truant'
  | 'Đúng giờ'
  | 'Vắng có phép'
  | 'Vắng không phép'
  | 'Đi muộn dưới 5 phút'
  | 'Đi muộn trên 5 phút'
  | 'Trốn tiết';

export type ConductRating = 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';
export type ConductGrade = ConductRating;

export type AcademicRating = 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Trung bình' | 'Yếu';

export type SeverityLevel = 'Nhẹ' | 'Vừa' | 'Nặng' | 'Rất nặng';

export interface Student {
  id: string;
  code: string; // Mã học sinh (e.g. HS-11A1-01)
  fullName: string;
  gender: Gender;
  dob: string; // YYYY-MM-DD
  className?: string;
  group: number; // Tổ 1, 2, 3, 4
  seatRow?: number;
  seatCol?: number;
  seatColor?: string;
  address: string;
  studentPhone: string;
  email?: string;
  fatherName: string;
  fatherPhone?: string;
  motherName: string;
  motherPhone?: string;
  parentPhone: string; // SĐT chính
  familyCircumstance?: 'Bình thường' | 'Hộ nghèo' | 'Hộ cận nghèo' | 'Con thương binh' | 'Mồ côi' | 'Khó khăn' | string;
  isUnionMember: boolean; // Đoàn viên
  healthInsuranceId?: string; // Mã thẻ BHYT
  notes?: string;
  roleInClass?: 'Lớp trưởng' | 'Lớp phó học tập' | 'Lớp phó phong trào' | 'Bí thư Chi đoàn' | 'Tổ trưởng' | 'Học sinh' | string;
  specialAttention?: boolean; // Học sinh cần quan tâm
  attentionReason?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  session?: 'Sáng' | 'Chiều';
  period?: number; // 0 for cả buổi, 1..5 for tiết cụ thể
  studentId: string;
  status: AttendanceStatus | string;
  note?: string;
  updatedAt?: string;
}

export type PhoneStatus = 'submitted' | 'not_submitted' | 'not_brought';

export interface PhoneRecord {
  id: string;
  date: string; // YYYY-MM-DD
  session?: 'Sáng' | 'Chiều';
  studentId: string;
  status: PhoneStatus;
  note?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ViolationRecord {
  id: string;
  date: string;
  studentId: string;
  content: string;
  severity: SeverityLevel;
  penaltyPoints: number; // Điểm trừ thi đua
  evidence?: string; // Link ảnh / ghi chú
  reporter?: string; // Người nhập (Cờ đỏ, Lớp phó, GVBM, GVCN)
  status?: 'Đã xử lý' | 'Đang theo dõi' | 'Đã tha thứ' | string;
}

export interface RewardRecord {
  id: string;
  date: string;
  studentId: string;
  content: string;
  bonusPoints: number; // Điểm cộng thi đua
  type?: 'Học tập' | 'Phong trào Đoàn' | 'Việc tốt' | 'Hội thao' | 'Khác' | string;
}

export interface SubjectScore {
  id?: string;
  studentId?: string;
  subject?: string;
  subjectName?: string;
  oral?: number[];
  test15m?: number[];
  test45m?: number[];
  regularScores?: number[];
  midTerm?: number;
  midtermScore?: number;
  finalTerm?: number;
  finalScore?: number;
  average?: number;
  averageScore?: number;
  semester?: 'HK1' | 'HK2' | string;
}

export interface AcademicRecord {
  id: string;
  studentId: string;
  term?: string;
  semester?: string;
  subjects: SubjectScore[];
  gpa?: number;
  rating?: string;
}

export type GradeRecord = SubjectScore;

export interface ConductRecord {
  id: string;
  studentId: string;
  term?: 'Tuần' | 'Tháng' | 'Học kỳ 1' | 'Học kỳ 2' | 'Cả năm' | string;
  semester?: 'HK1' | 'HK2' | 'Cả năm' | string;
  timeLabel?: string;
  rating?: ConductRating;
  grade?: ConductRating;
  teacherNote?: string;
  evaluation?: string;
}

export type ConductEvaluation = ConductRecord;

export interface ParentContactLog {
  id: string;
  studentId: string;
  date: string;
  method?: 'Gọi điện' | 'Nhắn tin Zalo' | 'Tin nhắn SMS/Zalo' | 'Gặp trực tiếp' | 'Họp phụ huynh' | string;
  type?: string;
  content: string;
  parentFeedback?: string;
  result?: 'Đã tiếp nhận' | 'Hứa khắc phục' | 'Cần phối hợp thêm' | 'Chưa liên lạc được' | string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  location?: string;
  type?: 'Họp HĐSP' | 'Sinh hoạt lớp' | 'Thi cử' | 'Hoạt động Đoàn' | 'Lễ - Kỷ niệm' | 'Khác' | string;
  description?: string;
  isImportant?: boolean;
}

export interface FinanceTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense'; // Thu hoặc Chi
  category: string;
  amount: number;
  description: string;
  proofUrl?: string;
  recorder?: string;
  recordedBy?: string;
}

export type FinancialTransaction = FinanceTransaction;

export interface ClassDocument {
  id: string;
  title: string;
  category: string;
  fileType?: 'pdf' | 'docx' | 'xlsx' | 'image' | 'video' | 'other' | 'TXT' | string;
  fileName?: string;
  fileSize?: string;
  uploadDate: string;
  downloadUrl?: string;
  content?: string;
}

export type DocumentItem = ClassDocument;

export interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  absentNote?: string;
  conductNote?: string;
  academicNote?: string;
  actionTaken?: string;
  reminderForTomorrow?: string;
  content?: string;
  tags?: string[];
  createdAt?: string;
}

export interface ClassSettings {
  className: string;
  academicYear: string;
  schoolName: string;
  schoolLogo?: string;
  teacherName: string;
  teacherPhone: string;
  teacherEmail?: string;
  teacherSubject: string;
  themeColor?: 'cyan' | 'sand' | 'slate' | string;
  darkMode: boolean;
  seatingRows?: number;
  seatingCols?: number;
  baseScorePerWeek?: number;
  requireApprovalAttendance?: boolean;
  requireApprovalViolationsRewards?: boolean;
  exemptedPhoneStudentIds?: string[];
  defaultSession?: 'Sáng' | 'Chiều';
  isLockedData?: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

export type UserRole = 'ADMIN' | 'GVCN' | 'TK' | 'LT' | 'BT' | 'TT1' | 'TT2' | 'TT3' | 'TT4' | 'HS' | 'PH' | string;

export interface UserAccount {
  username: string; // e.g., 'ADMIN', 'GVCN', 'gvcn-10a1', 'TK', 'LT', 'TT1', 'TT2', 'TT3', 'TT4', etc.
  role: UserRole;
  displayName: string;
  roleTitle: string; // e.g. 'Quản trị viên Hệ thống', 'Giáo viên Chủ nhiệm', 'Thư ký lớp', 'Lớp trưởng', 'Tổ trưởng Tổ 1'
  group?: number; // 1, 2, 3, 4 for TT1-TT4
  passwordHash: string; // Stored password (plain or hashed)
  mustChangePassword: boolean; // Flag to enforce password change on first login
  lastPasswordChangedAt?: string;
  lastLoginAt?: string;
  assignedClass?: string; // e.g. '10A1', '11A1'
  academicYear?: string; // e.g. '2026 - 2027'
  isLocked?: boolean; // Locked by Admin
  createdAt?: string;
  createdBy?: string;
  initialPasswordNotice?: string; // Stored initial password reference for teacher distribution
}

export interface ClassItem {
  id: string; // e.g. '10A1'
  className: string; // e.g. '10A1'
  grade: number; // 10, 11, 12
  academicYear: string; // e.g. '2026 - 2027'
  teacherUsername: string; // e.g. 'gvcn-10a1'
  teacherName: string; // e.g. 'Thầy Nguyễn Văn Thành'
  studentCount: number;
  isInitialized: boolean;
  createdAt: string;
}

export interface AuthSession {
  user: UserAccount;
  token: string;
  loginAt: string;
}

export type ApprovalType = 'attendance' | 'attendance_multiple' | 'violation' | 'violation_multiple' | 'reward' | 'reward_multiple';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  username: string;
  displayName: string;
  role: string;
  roleTitle: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'CONFIG' | string;
  module: string;
  details: string;
}

export interface RolePermissionConfig {
  role: string; // e.g. 'GVCN', 'TK', 'LT', 'BT', 'TT1', 'TT2', 'TT3', 'TT4', 'HS', 'PH' or custom role id
  roleTitle: string;
  isCustom?: boolean;
  permissions: {
    dashboard?: boolean;
    students?: { view: boolean; add: boolean; edit: boolean; delete: boolean };
    attendance?: { view: boolean; editAll: boolean; editGroup: boolean };
    violations?: { view: boolean; add: boolean; editAll: boolean; editGroup: boolean; approve: boolean };
    academics?: { view: boolean; edit: boolean };
    conduct?: { view: boolean; edit: boolean };
    finance?: { view: boolean; add: boolean; edit: boolean };
    documents?: { view: boolean; add: boolean };
    diary?: { view: boolean; add: boolean };
    calendar?: { view: boolean; add: boolean };
    settings?: boolean;
    auditLogs?: boolean;
  };
}

export interface PendingApprovalItem {
  id: string;
  type: ApprovalType;
  title: string;
  description: string;
  submittedBy: {
    username: string;
    displayName: string;
    role: string;
    roleTitle: string;
    group?: number;
  };
  submittedAt: string;
  status: ApprovalStatus;
  targetGroup?: number;
  studentCount?: number;
  // Payload
  attendanceRecords?: AttendanceRecord[];
  violationRecord?: ViolationRecord;
  rewardRecord?: RewardRecord;
  violationRecords?: ViolationRecord[];
  rewardRecords?: RewardRecord[];
  // Approval metadata
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
}

