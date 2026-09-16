import { UserAccount, UserRole, AuthSession, PendingApprovalItem, ApprovalType } from '../types';
import { storageService } from './storageService';

const STORAGE_KEYS = {
  USERS: 'edumaster_users_db_v1',
  SESSION: 'edumaster_auth_session_v1',
  APPROVALS: 'edumaster_approvals_v1',
  CLASSES: 'edumaster_classes_v1',
};

export function getCleanClassCode(className: string): string {
  if (!className) return '10a1';
  return className.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function getTeacherUsernameSuffix(className: string): string {
  const clean = getCleanClassCode(className);
  // Quy tắc chuẩn: gvcn-[toàn bộ ký hiệu lớp gồm cả khối]
  // Ví dụ: Lớp "10A1" -> "10a1" -> Tên đăng nhập chuẩn là "gvcn-10a1" (không bỏ số khối vì trường có nhiều khối 10, 11, 12)
  return clean;
}

// Default seed accounts as specified by user requirements
const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    username: 'ADMIN',
    role: 'ADMIN',
    displayName: 'Quản trị viên Hệ thống (Admin)',
    roleTitle: 'Quản trị viên Hệ thống',
    passwordHash: 'admin123',
    mustChangePassword: true,
    initialPasswordNotice: 'admin123',
    createdAt: new Date().toISOString(),
  },
  {
    username: 'gvcn-10a1',
    role: 'GVCN',
    displayName: 'Thầy Nguyễn Văn Thành',
    roleTitle: 'Giáo viên Chủ nhiệm',
    assignedClass: '10A1',
    academicYear: '2026 - 2027',
    passwordHash: 'gvcn123',
    mustChangePassword: true,
    initialPasswordNotice: 'gvcn123',
    createdAt: new Date().toISOString(),
  },
  {
    username: 'GVCN',
    role: 'GVCN',
    displayName: 'Cô Hoàng Mai Lan (11A1)',
    roleTitle: 'Giáo viên Chủ nhiệm',
    assignedClass: '11A1',
    academicYear: '2026 - 2027',
    passwordHash: 'GVCN@123',
    mustChangePassword: true,
    initialPasswordNotice: 'GVCN@123',
    createdAt: new Date().toISOString(),
  },
  {
    username: 'lt-10a1',
    role: 'LT',
    displayName: 'Lớp trưởng (10A1)',
    roleTitle: 'Lớp trưởng',
    assignedClass: '10A1',
    academicYear: '2026 - 2027',
    passwordHash: 'lt-10a1-123',
    mustChangePassword: true,
    initialPasswordNotice: 'lt-10a1-123',
    createdAt: new Date().toISOString(),
  },
  {
    username: 'tk-10a1',
    role: 'TK',
    displayName: 'Thư ký lớp (10A1)',
    roleTitle: 'Thư ký lớp',
    assignedClass: '10A1',
    academicYear: '2026 - 2027',
    passwordHash: 'tk-10a1-123',
    mustChangePassword: true,
    initialPasswordNotice: 'tk-10a1-123',
    createdAt: new Date().toISOString(),
  },
  {
    username: 'bt-10a1',
    role: 'BT',
    displayName: 'Bí thư Chi đoàn (10A1)',
    roleTitle: 'Bí thư Chi đoàn',
    assignedClass: '10A1',
    academicYear: '2026 - 2027',
    passwordHash: 'bt-10a1-123',
    mustChangePassword: true,
    initialPasswordNotice: 'bt-10a1-123',
    createdAt: new Date().toISOString(),
  },
  {
    username: 'tt1-10a1',
    role: 'TT1',
    displayName: 'Tổ trưởng Tổ 1 (10A1)',
    roleTitle: 'Tổ trưởng Tổ 1',
    group: 1,
    assignedClass: '10A1',
    academicYear: '2026 - 2027',
    passwordHash: 'tt1-10a1-123',
    mustChangePassword: true,
    initialPasswordNotice: 'tt1-10a1-123',
    createdAt: new Date().toISOString(),
  },
  {
    username: 'tt2-10a1',
    role: 'TT2',
    displayName: 'Tổ trưởng Tổ 2 (10A1)',
    roleTitle: 'Tổ trưởng Tổ 2',
    group: 2,
    assignedClass: '10A1',
    academicYear: '2026 - 2027',
    passwordHash: 'tt2-10a1-123',
    mustChangePassword: true,
    initialPasswordNotice: 'tt2-10a1-123',
    createdAt: new Date().toISOString(),
  },
  {
    username: 'tt3-10a1',
    role: 'TT3',
    displayName: 'Tổ trưởng Tổ 3 (10A1)',
    roleTitle: 'Tổ trưởng Tổ 3',
    group: 3,
    assignedClass: '10A1',
    academicYear: '2026 - 2027',
    passwordHash: 'tt3-10a1-123',
    mustChangePassword: true,
    initialPasswordNotice: 'tt3-10a1-123',
    createdAt: new Date().toISOString(),
  },
  {
    username: 'tt4-10a1',
    role: 'TT4',
    displayName: 'Tổ trưởng Tổ 4 (10A1)',
    roleTitle: 'Tổ trưởng Tổ 4',
    group: 4,
    assignedClass: '10A1',
    academicYear: '2026 - 2027',
    passwordHash: 'tt4-10a1-123',
    mustChangePassword: true,
    initialPasswordNotice: 'tt4-10a1-123',
    createdAt: new Date().toISOString(),
  },
  {
    username: 'LT',
    role: 'LT',
    displayName: 'Lớp trưởng (11A1)',
    roleTitle: 'Lớp trưởng',
    assignedClass: '11A1',
    passwordHash: 'admin@123',
    mustChangePassword: true,
  },
  {
    username: 'TK',
    role: 'TK',
    displayName: 'Thư ký lớp (11A1)',
    roleTitle: 'Thư ký lớp',
    assignedClass: '11A1',
    passwordHash: 'admin@123',
    mustChangePassword: true,
  },
  {
    username: 'BT',
    role: 'BT',
    displayName: 'Bí thư Chi đoàn (11A1)',
    roleTitle: 'Bí thư Chi đoàn',
    assignedClass: '11A1',
    passwordHash: 'admin@123',
    mustChangePassword: true,
  },
  {
    username: 'TT1',
    role: 'TT1',
    displayName: 'Tổ trưởng Tổ 1 (11A1)',
    roleTitle: 'Tổ trưởng Tổ 1',
    group: 1,
    assignedClass: '11A1',
    passwordHash: 'admin@123',
    mustChangePassword: true,
  },
  {
    username: 'HS',
    role: 'HS',
    displayName: 'Học sinh Nguyễn Văn A',
    roleTitle: 'Học sinh',
    passwordHash: 'admin@123',
    mustChangePassword: true,
  },
  {
    username: 'PH',
    role: 'PH',
    displayName: 'Phụ huynh em Nguyễn Văn A',
    roleTitle: 'Phụ huynh học sinh',
    passwordHash: 'admin@123',
    mustChangePassword: true,
  },
];

class AuthService {
  constructor() {
    this.initDefaults();
  }

  private initDefaults(): void {
    if (typeof window === 'undefined') return;
    const existing = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!existing) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_ACCOUNTS));
    } else {
      // Ensure all standard default roles exist if older schema was stored
      try {
        let users: UserAccount[] = JSON.parse(existing);
        let updated = false;

        // Automatically migrate gvcn-a1 to standard gvcn-10a1, remove admin homeroom assignment, and repair teacher display names if set to class code
        users = users.map((u) => {
          if (u.username.toLowerCase() === 'gvcn-a1') {
            updated = true;
            return {
              ...u,
              username: 'gvcn-10a1',
            };
          }
          if (u.role === 'ADMIN' && u.assignedClass) {
            updated = true;
            return {
              ...u,
              assignedClass: undefined,
            };
          }
          // Repair teacher display name if it was accidentally saved as the class name
          if (u.role === 'GVCN' && u.assignedClass && u.displayName?.trim().toUpperCase() === u.assignedClass.trim().toUpperCase()) {
            updated = true;
            let repairedName = `Thầy/Cô GVCN Lớp ${u.assignedClass}`;
            if (u.assignedClass.toUpperCase() === '10A1') repairedName = 'Thầy Nguyễn Văn Thành';
            if (u.assignedClass.toUpperCase() === '11A1') repairedName = 'Cô Hoàng Mai Lan';
            return {
              ...u,
              displayName: repairedName,
            };
          }
          return u;
        });

        DEFAULT_ACCOUNTS.forEach((def) => {
          if (!users.some((u) => u.username.toUpperCase() === def.username.toUpperCase())) {
            users.push(def);
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }

        // Migrate active session if user was logged in as gvcn-a1
        const sessionRaw = localStorage.getItem(STORAGE_KEYS.SESSION);
        if (sessionRaw) {
          try {
            const sess = JSON.parse(sessionRaw);
            if (sess && sess.username && sess.username.toLowerCase() === 'gvcn-a1') {
              sess.username = 'gvcn-10a1';
              localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sess));
            }
          } catch {}
        }

        // Migrate classes list if teacherUsername was gvcn-a1
        const classesRaw = localStorage.getItem(STORAGE_KEYS.CLASSES);
        if (classesRaw) {
          try {
            let classList = JSON.parse(classesRaw);
            if (Array.isArray(classList)) {
              let classUpdated = false;
              classList = classList.map((c) => {
                if (c.teacherUsername && c.teacherUsername.toLowerCase() === 'gvcn-a1') {
                  classUpdated = true;
                  return { ...c, teacherUsername: 'gvcn-10a1' };
                }
                return c;
              });
              if (classUpdated) {
                localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classList));
              }
            }
          } catch {}
        }
      } catch (e) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_ACCOUNTS));
      }
    }
  }

  public getUsers(): UserAccount[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!raw) return DEFAULT_ACCOUNTS;
      const parsed = JSON.parse(raw);
      return parsed !== null && parsed !== undefined ? parsed : DEFAULT_ACCOUNTS;
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  }

  private saveUsers(users: UserAccount[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent('edumaster_auth_users_change'));
  }

  public getSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed !== null && parsed !== undefined ? parsed : null;
    } catch {
      return null;
    }
  }

  public setSession(session: AuthSession | null): void {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
    window.dispatchEvent(new CustomEvent('edumaster_auth_change', { detail: { session } }));
  }

  public login(
    usernameInput: string,
    passwordInput: string
  ): { success: boolean; session?: AuthSession; mustChangePassword?: boolean; error?: string } {
    const trimmedUser = usernameInput.trim().toUpperCase();
    const users = this.getUsers();
    // Match username, with fallback if user previously remembered gvcn-a1
    let user = users.find((u) => u.username.toUpperCase() === trimmedUser);
    if (!user && trimmedUser === 'GVCN-A1') {
      user = users.find((u) => u.username.toUpperCase() === 'GVCN-10A1');
    }

    if (!user) {
      return {
        success: false,
        error: 'Tên đăng nhập không chính xác hoặc không tồn tại trên hệ thống.',
      };
    }

    if (user.isLocked) {
      return {
        success: false,
        error: 'Tài khoản này đã bị tạm khóa bởi Quản trị viên hệ thống. Vui lòng liên hệ Admin!',
      };
    }

    if (user.passwordHash !== passwordInput) {
      return {
        success: false,
        error: 'Mật khẩu không đúng. Vui lòng kiểm tra lại!',
      };
    }

    const updatedUser: UserAccount = {
      ...user,
      lastLoginAt: new Date().toISOString(),
    };

    // Update lastLoginAt in users DB
    const updatedUsers = users.map((u) => (u.username === user.username ? updatedUser : u));
    this.saveUsers(updatedUsers);

    const session: AuthSession = {
      user: updatedUser,
      token: `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      loginAt: new Date().toISOString(),
    };

    this.setSession(session);

    return {
      success: true,
      session,
      mustChangePassword: user.mustChangePassword,
    };
  }

  public changePassword(
    username: string,
    currentPasswordInput: string,
    newPasswordInput: string
  ): { success: boolean; error?: string } {
    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.username.toUpperCase() === username.toUpperCase());

    if (userIndex === -1) {
      return { success: false, error: 'Tài khoản không tồn tại.' };
    }

    const user = users[userIndex];
    if (user.passwordHash !== currentPasswordInput) {
      return { success: false, error: 'Mật khẩu hiện tại không chính xác.' };
    }

    if (!newPasswordInput || newPasswordInput.trim().length < 6) {
      return { success: false, error: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' };
    }

    if (newPasswordInput === currentPasswordInput) {
      return { success: false, error: 'Mật khẩu mới không được trùng với mật khẩu cũ!' };
    }

    const updatedUser: UserAccount = {
      ...user,
      passwordHash: newPasswordInput,
      mustChangePassword: false,
      lastPasswordChangedAt: new Date().toISOString(),
    };

    users[userIndex] = updatedUser;
    this.saveUsers(users);

    // Update current active session if applicable
    const currentSession = this.getSession();
    if (currentSession && currentSession.user.username.toUpperCase() === username.toUpperCase()) {
      this.setSession({
        ...currentSession,
        user: updatedUser,
      });
    }

    return { success: true };
  }

  public resetPasswordToDefault(
    targetUsername: string,
    performedByRole: UserRole
  ): { success: boolean; error?: string } {
    if (performedByRole !== 'GVCN') {
      return { success: false, error: 'Chỉ Giáo viên chủ nhiệm mới có quyền đặt lại mật khẩu.' };
    }

    const defaultDef = DEFAULT_ACCOUNTS.find(
      (d) => d.username.toUpperCase() === targetUsername.toUpperCase()
    );
    if (!defaultDef) {
      return { success: false, error: 'Không tìm thấy tài khoản mặc định.' };
    }

    const users = this.getUsers();
    const index = users.findIndex(
      (u) => u.username.toUpperCase() === targetUsername.toUpperCase()
    );

    if (index === -1) return { success: false, error: 'Tài khoản không tồn tại.' };

    users[index] = {
      ...users[index],
      passwordHash: defaultDef.passwordHash,
      mustChangePassword: true,
    };

    this.saveUsers(users);
    return { success: true };
  }

  public logout(): void {
    this.setSession(null);
  }

  // ===================== APPROVALS MANAGEMENT =====================

  public getApprovals(): PendingApprovalItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.APPROVALS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed !== null && parsed !== undefined ? parsed : [];
    } catch {
      return [];
    }
  }

  public saveApprovals(items: PendingApprovalItem[]): void {
    localStorage.setItem(STORAGE_KEYS.APPROVALS, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('edumaster_approvals_change', { detail: { items } }));
  }

  public submitApproval(
    item: Omit<PendingApprovalItem, 'id' | 'status' | 'submittedAt'>
  ): PendingApprovalItem {
    const newItem: PendingApprovalItem = {
      ...item,
      id: `appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    const current = this.getApprovals();
    const updated = [newItem, ...current];
    this.saveApprovals(updated);
    return newItem;
  }

  public approveApprovalItem(
    id: string,
    reviewerName: string = 'GVCN'
  ): PendingApprovalItem | null {
    const current = this.getApprovals();
    const index = current.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const item = current[index];
    const updated: PendingApprovalItem = {
      ...item,
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerName,
    };

    current[index] = updated;
    this.saveApprovals(current);
    return updated;
  }

  public rejectApprovalItem(
    id: string,
    reviewerName: string = 'GVCN',
    reason?: string
  ): PendingApprovalItem | null {
    const current = this.getApprovals();
    const index = current.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const item = current[index];
    const updated: PendingApprovalItem = {
      ...item,
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerName,
      reviewNote: reason || 'Chưa đáp ứng yêu cầu hoặc thông tin chưa chính xác.',
    };

    current[index] = updated;
    this.saveApprovals(current);
    return updated;
  }

  public deleteApprovalItem(id: string): void {
    const current = this.getApprovals();
    const updated = current.filter((i) => i.id !== id);
    this.saveApprovals(updated);
  }

  // ===================== USER & CLASS ACCOUNT CREATION =====================

  public createUser(account: UserAccount): { success: boolean; error?: string } {
    const users = this.getUsers();
    if (users.some((u) => u.username.toUpperCase() === account.username.trim().toUpperCase())) {
      return { success: false, error: `Tên tài khoản "${account.username}" đã tồn tại trên hệ thống.` };
    }
    const newUser: UserAccount = {
      ...account,
      username: account.username.trim(),
      createdAt: account.createdAt || new Date().toISOString(),
      mustChangePassword: account.mustChangePassword !== undefined ? account.mustChangePassword : true,
    };
    users.push(newUser);
    this.saveUsers(users);

    storageService.addAuditLog({
      username: 'SYSTEM',
      displayName: 'Hệ thống',
      role: 'ADMIN',
      roleTitle: 'Quản trị viên',
      action: 'CREATE',
      module: 'Tài khoản',
      details: `Tạo tài khoản mới "${newUser.username}" (${newUser.roleTitle})`,
    });

    return { success: true };
  }

  public createTeacherAccount(params: {
    className: string;
    teacherName: string;
    academicYear?: string;
    customUsername?: string;
    customPassword?: string;
    performedBy?: string;
  }): { success: boolean; account?: UserAccount; error?: string } {
    const className = params.className.trim().toUpperCase();
    if (!className) {
      return { success: false, error: 'Vui lòng nhập tên lớp hợp lệ (ví dụ: 10A1, 10A2).' };
    }
    if (!params.teacherName.trim()) {
      return { success: false, error: 'Vui lòng nhập họ và tên Giáo viên Chủ nhiệm.' };
    }

    // Default username following rule: "ví dụ lớp 10a1 thì tài khoản là gvcn-a1"
    const suffix = getTeacherUsernameSuffix(className);
    const username = (params.customUsername || `gvcn-${suffix}`).trim().toLowerCase();
    const password = (params.customPassword || 'gvcn123').trim();

    const users = this.getUsers();
    const existingIndex = users.findIndex(
      (u) =>
        u.username.toLowerCase() === username.toLowerCase() ||
        (u.assignedClass?.toUpperCase() === className && u.role === 'GVCN')
    );

    let finalAccount: UserAccount;

    if (existingIndex >= 0) {
      // Reassign / Update existing GVCN account
      const prev = users[existingIndex];
      finalAccount = {
        ...prev,
        username: username || prev.username,
        displayName: params.teacherName.trim(),
        assignedClass: className,
        academicYear: params.academicYear || prev.academicYear || '2026 - 2027',
        passwordHash: password,
        mustChangePassword: true,
        initialPasswordNotice: password,
      };
      users[existingIndex] = finalAccount;
    } else {
      finalAccount = {
        username,
        role: 'GVCN',
        displayName: params.teacherName.trim(),
        roleTitle: 'Giáo viên Chủ nhiệm',
        assignedClass: className,
        academicYear: params.academicYear || '2026 - 2027',
        passwordHash: password,
        mustChangePassword: true,
        initialPasswordNotice: password,
        createdAt: new Date().toISOString(),
        createdBy: params.performedBy || 'ADMIN',
      };
      users.push(finalAccount);
    }

    this.saveUsers(users);

    // Register or update class in storageService
    const gradeNum = parseInt(className.replace(/\D/g, '').slice(0, 2), 10) || 10;
    storageService.addClass({
      id: className,
      className: className,
      grade: gradeNum,
      academicYear: params.academicYear || '2026 - 2027',
      teacherUsername: finalAccount.username,
      teacherName: params.teacherName.trim(),
      studentCount: 0,
      isInitialized: false,
      createdAt: new Date().toISOString(),
    });

    // Update settings for that class
    const currentSettings = storageService.getSettings(className);
    currentSettings.teacherName = params.teacherName.trim();
    currentSettings.schoolName = 'THPT Nguyễn Trãi - BĐ';
    currentSettings.academicYear = params.academicYear || '2026 - 2027';
    storageService.saveSettings(currentSettings, className);

    storageService.addAuditLog({
      username: params.performedBy || 'ADMIN',
      displayName: 'Quản trị viên Hệ thống',
      role: 'ADMIN',
      roleTitle: 'Quản trị viên',
      action: existingIndex >= 0 ? 'UPDATE' : 'CREATE',
      module: 'Quản lý GVCN',
      details: `Admin phân công/cập nhật GVCN "${finalAccount.username}" cho lớp ${className} (GV: ${params.teacherName.trim()})`,
    });

    window.dispatchEvent(new CustomEvent('edumaster_classes_change'));
    window.dispatchEvent(new CustomEvent('edumaster_auth_users_change'));

    return { success: true, account: finalAccount };
  }

  /**
   * Assign or unassign Admin as the Homeroom Teacher (GVCN) of a specific class.
   * Admin can concurrently manage system-wide operations and act as GVCN for their own class.
   */
  public setAdminHomeroomClass(
    className: string | null,
    performedBy: string = 'ADMIN'
  ): { success: boolean; assignedClass?: string; error?: string } {
    const users = this.getUsers();
    const adminIndex = users.findIndex(
      (u) => u.username.toUpperCase() === 'ADMIN' || u.role === 'ADMIN'
    );
    if (adminIndex === -1) {
      return { success: false, error: 'Không tìm thấy tài khoản Quản trị viên (Admin).' };
    }

    const cleanClass = className && className.trim() ? className.trim().toUpperCase() : undefined;
    const previousClass = users[adminIndex].assignedClass;

    users[adminIndex] = {
      ...users[adminIndex],
      assignedClass: cleanClass,
    };
    this.saveUsers(users);

    // Update active session if currently logged in as ADMIN
    const session = this.getSession();
    if (
      session &&
      (session.user.username.toUpperCase() === 'ADMIN' || session.user.role === 'ADMIN')
    ) {
      session.user.assignedClass = cleanClass;
      this.setSession(session);
    }

    // If a class is assigned, ensure class exists in classes list
    if (cleanClass) {
      const classes = storageService.getClasses();
      const existingCls = classes.find((c) => c.className.toUpperCase() === cleanClass);
      if (existingCls) {
        existingCls.teacherUsername = 'ADMIN';
        existingCls.teacherName = users[adminIndex].displayName || 'Admin (Quản trị viên)';
        storageService.saveClasses(classes);
      } else {
        const gradeNum = parseInt(cleanClass.replace(/\D/g, '').slice(0, 2), 10) || 10;
        storageService.addClass({
          id: cleanClass,
          className: cleanClass,
          grade: gradeNum,
          academicYear: '2026 - 2027',
          teacherUsername: 'ADMIN',
          teacherName: users[adminIndex].displayName || 'Admin (Quản trị viên)',
          studentCount: 0,
          isInitialized: false,
          createdAt: new Date().toISOString(),
        });
      }

      // Update class settings
      const currentSettings = storageService.getSettings(cleanClass);
      currentSettings.teacherName = users[adminIndex].displayName || 'Admin (Quản trị viên)';
      currentSettings.schoolName = 'THPT Nguyễn Trãi - BĐ';
      storageService.saveSettings(currentSettings, cleanClass);
    }

    storageService.addAuditLog({
      username: performedBy,
      displayName: 'Quản trị viên Hệ thống',
      role: 'ADMIN',
      roleTitle: 'Quản trị viên',
      action: 'UPDATE',
      module: 'Quản lý Admin',
      details: cleanClass
        ? `Thiết lập Admin kiêm nhiệm Giáo viên Chủ nhiệm Lớp ${cleanClass} (trước đó: ${previousClass || 'Chưa gán'})`
        : `Hủy phân công lớp chủ nhiệm kiêm nhiệm cho Admin (trước đó: ${previousClass || 'Chưa gán'})`,
    });

    window.dispatchEvent(new CustomEvent('edumaster_classes_change'));
    window.dispatchEvent(new CustomEvent('edumaster_auth_users_change'));
    return { success: true, assignedClass: cleanClass };
  }

  public getAdminHomeroomClass(): string | undefined {
    const users = this.getUsers();
    const admin = users.find((u) => u.username.toUpperCase() === 'ADMIN' || u.role === 'ADMIN');
    return admin?.assignedClass;
  }

  public createClassCadresAndStudentsAccounts(params: {
    className: string;
    academicYear?: string;
    students: { id: string; fullName: string; roleInClass?: string; group?: number; code?: string }[];
    performedBy?: string;
  }): { success: boolean; createdAccounts: UserAccount[]; error?: string } {
    const className = params.className.trim().toUpperCase();
    const cleanClass = getCleanClassCode(className);
    const users = this.getUsers();
    const existingUsernames = new Set(users.map((u) => u.username.toLowerCase()));

    const generated: UserAccount[] = [];

    // Find assigned cadres if any
    const ltStudent = params.students.find(
      (s) => s.roleInClass && (s.roleInClass.toLowerCase().includes('lớp trưởng') || s.roleInClass.toLowerCase() === 'lt')
    );
    const btStudent = params.students.find(
      (s) => s.roleInClass && (s.roleInClass.toLowerCase().includes('bí thư') || s.roleInClass.toLowerCase() === 'bt')
    );
    const tkStudent = params.students.find(
      (s) => s.roleInClass && (s.roleInClass.toLowerCase().includes('thư ký') || s.roleInClass.toLowerCase() === 'tk')
    );

    // 1. Lớp trưởng: lt-{cleanClass}, mật khẩu lt-{cleanClass}-123
    const ltUsername = `lt-${cleanClass}`;
    const ltAccount: UserAccount = {
      username: ltUsername,
      role: 'LT',
      displayName: ltStudent ? ltStudent.fullName : `Lớp trưởng ${className}`,
      roleTitle: 'Lớp trưởng',
      assignedClass: className,
      academicYear: params.academicYear || '2026 - 2027',
      passwordHash: `lt-${cleanClass}-123`,
      mustChangePassword: true,
      initialPasswordNotice: `lt-${cleanClass}-123`,
      createdAt: new Date().toISOString(),
      createdBy: params.performedBy || 'GVCN',
    };
    generated.push(ltAccount);

    // 2. Thư ký: tk-{cleanClass}, mật khẩu tk-{cleanClass}-123
    const tkUsername = `tk-${cleanClass}`;
    const tkAccount: UserAccount = {
      username: tkUsername,
      role: 'TK',
      displayName: tkStudent ? tkStudent.fullName : `Thư ký lớp ${className}`,
      roleTitle: 'Thư ký lớp',
      assignedClass: className,
      academicYear: params.academicYear || '2026 - 2027',
      passwordHash: `tk-${cleanClass}-123`,
      mustChangePassword: true,
      initialPasswordNotice: `tk-${cleanClass}-123`,
      createdAt: new Date().toISOString(),
      createdBy: params.performedBy || 'GVCN',
    };
    generated.push(tkAccount);

    // 3. Bí thư: bt-{cleanClass}, mật khẩu bt-{cleanClass}-123
    const btUsername = `bt-${cleanClass}`;
    const btAccount: UserAccount = {
      username: btUsername,
      role: 'BT',
      displayName: btStudent ? btStudent.fullName : `Bí thư Chi đoàn ${className}`,
      roleTitle: 'Bí thư Chi đoàn',
      assignedClass: className,
      academicYear: params.academicYear || '2026 - 2027',
      passwordHash: `bt-${cleanClass}-123`,
      mustChangePassword: true,
      initialPasswordNotice: `bt-${cleanClass}-123`,
      createdAt: new Date().toISOString(),
      createdBy: params.performedBy || 'GVCN',
    };
    generated.push(btAccount);

    // 4. Tổ trưởng 1, 2, 3, 4: tt1-{cleanClass} ... tt4-{cleanClass}
    for (let g = 1; g <= 4; g++) {
      const ttStudent = params.students.find(
        (s) =>
          s.group === g &&
          s.roleInClass &&
          (s.roleInClass.toLowerCase().includes('tổ trưởng') || s.roleInClass.toLowerCase() === `tt${g}`)
      );
      const ttUsername = `tt${g}-${cleanClass}`;
      const ttAccount: UserAccount = {
        username: ttUsername,
        role: `TT${g}`,
        displayName: ttStudent ? ttStudent.fullName : `Tổ trưởng Tổ ${g} (${className})`,
        roleTitle: `Tổ trưởng Tổ ${g}`,
        group: g,
        assignedClass: className,
        academicYear: params.academicYear || '2026 - 2027',
        passwordHash: `tt${g}-${cleanClass}-123`,
        mustChangePassword: true,
        initialPasswordNotice: `tt${g}-${cleanClass}-123`,
        createdAt: new Date().toISOString(),
        createdBy: params.performedBy || 'GVCN',
      };
      generated.push(ttAccount);
    }

    // Note: Per school policy, only class cadres (LT, TK, BT, TT1-4) require login accounts to enter discipline/attendance/cleaning records. Regular students do not need accounts.

    // Merge generated accounts into database (updating existing or appending, while removing old auto-generated HS accounts for this class)
    const updatedUsers = users.filter(
      (u) => !(u.role === 'HS' && u.assignedClass?.toUpperCase() === className)
    );
    generated.forEach((acc) => {
      const idx = updatedUsers.findIndex((u) => u.username.toLowerCase() === acc.username.toLowerCase());
      if (idx >= 0) {
        updatedUsers[idx] = { ...updatedUsers[idx], ...acc };
      } else {
        updatedUsers.push(acc);
      }
    });

    // If the performedBy is a GVCN user, ensure their assignedClass is set to this class
    if (params.performedBy) {
      const gvcnUserIndex = updatedUsers.findIndex(
        (u) => u.username.toLowerCase() === params.performedBy?.toLowerCase()
      );
      if (gvcnUserIndex >= 0 && updatedUsers[gvcnUserIndex].role === 'GVCN') {
        updatedUsers[gvcnUserIndex] = {
          ...updatedUsers[gvcnUserIndex],
          assignedClass: className,
          academicYear: params.academicYear || updatedUsers[gvcnUserIndex].academicYear || '2026 - 2027',
        };
      }
    }

    this.saveUsers(updatedUsers);

    // Also sync active session if current user is the one creating the class
    const currentSession = this.getSession();
    if (
      currentSession &&
      params.performedBy &&
      currentSession.user.username.toLowerCase() === params.performedBy.toLowerCase()
    ) {
      this.setSession({
        ...currentSession,
        user: {
          ...currentSession.user,
          assignedClass: className,
          academicYear: params.academicYear || currentSession.user.academicYear || '2026 - 2027',
        },
      });
    }

    // Update class metadata studentCount & initialized status
    const currentClasses = storageService.getClasses();
    const clIndex = currentClasses.findIndex((c) => c.className.toLowerCase() === className.toLowerCase());
    if (clIndex >= 0) {
      currentClasses[clIndex] = {
        ...currentClasses[clIndex],
        studentCount: params.students.length,
        isInitialized: true,
        academicYear: params.academicYear || currentClasses[clIndex].academicYear,
      };
      storageService.saveClasses(currentClasses);
    } else {
      const gradeNum = parseInt(className.replace(/\D/g, '').slice(0, 2), 10) || 10;
      storageService.addClass({
        id: `cl_${className.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
        className,
        grade: gradeNum,
        academicYear: params.academicYear || '2026 - 2027',
        teacherUsername: params.performedBy || 'GVCN',
        teacherName: currentSession?.user?.displayName || `Giáo viên Chủ nhiệm ${className}`,
        studentCount: params.students.length,
        isInitialized: true,
        createdAt: new Date().toISOString(),
      });
    }

    storageService.addAuditLog({
      username: params.performedBy || 'GVCN',
      displayName: currentSession?.user?.displayName || 'Giáo viên Chủ nhiệm',
      role: 'GVCN',
      roleTitle: 'Giáo viên Chủ nhiệm',
      action: 'CREATE',
      module: 'Cấp tài khoản lớp',
      details: `Đã cấp tự động ${generated.length} tài khoản Ban cán sự (Lớp trưởng, Thư ký, Bí thư, Tổ trưởng) cho lớp ${className}`,
    });

    window.dispatchEvent(new CustomEvent('edumaster_classes_change'));
    window.dispatchEvent(new CustomEvent('edumaster_auth_users_change'));

    return { success: true, createdAccounts: generated };
  }

  public updateClassCadres(params: {
    className: string;
    academicYear?: string;
    cadres: {
      lt?: string;
      tk?: string;
      bt?: string;
      tt1?: string;
      tt2?: string;
      tt3?: string;
      tt4?: string;
    };
    students: { id: string; fullName: string }[];
    performedBy?: string;
  }): { success: boolean; updatedAccounts: UserAccount[] } {
    const className = params.className.trim().toUpperCase();
    const cleanClass = getCleanClassCode(className);
    const users = this.getUsers();

    const roleDefinitions = [
      { key: 'lt', role: 'LT' as UserRole, username: `lt-${cleanClass}`, title: 'Lớp trưởng', defaultPass: `lt-${cleanClass}-123`, group: undefined },
      { key: 'tk', role: 'TK' as UserRole, username: `tk-${cleanClass}`, title: 'Thư ký lớp', defaultPass: `tk-${cleanClass}-123`, group: undefined },
      { key: 'bt', role: 'BT' as UserRole, username: `bt-${cleanClass}`, title: 'Bí thư Chi đoàn', defaultPass: `bt-${cleanClass}-123`, group: undefined },
      { key: 'tt1', role: 'TT1' as UserRole, username: `tt1-${cleanClass}`, title: 'Tổ trưởng Tổ 1', defaultPass: `tt1-${cleanClass}-123`, group: 1 },
      { key: 'tt2', role: 'TT2' as UserRole, username: `tt2-${cleanClass}`, title: 'Tổ trưởng Tổ 2', defaultPass: `tt2-${cleanClass}-123`, group: 2 },
      { key: 'tt3', role: 'TT3' as UserRole, username: `tt3-${cleanClass}`, title: 'Tổ trưởng Tổ 3', defaultPass: `tt3-${cleanClass}-123`, group: 3 },
      { key: 'tt4', role: 'TT4' as UserRole, username: `tt4-${cleanClass}`, title: 'Tổ trưởng Tổ 4', defaultPass: `tt4-${cleanClass}-123`, group: 4 },
    ];

    const updatedUsers = [...users];
    const touchedAccounts: UserAccount[] = [];

    roleDefinitions.forEach((def) => {
      const studentIdOrName = (params.cadres as Record<string, string | undefined>)[def.key];
      const targetStudent = params.students.find(
        (s) => s.id === studentIdOrName || s.fullName.trim().toLowerCase() === (studentIdOrName || '').trim().toLowerCase()
      );
      const displayName = targetStudent ? targetStudent.fullName : `${def.title} ${className}`;

      const existingIdx = updatedUsers.findIndex((u) => u.username.toLowerCase() === def.username.toLowerCase());
      if (existingIdx >= 0) {
        updatedUsers[existingIdx] = {
          ...updatedUsers[existingIdx],
          displayName,
          assignedClass: className,
          academicYear: params.academicYear || updatedUsers[existingIdx].academicYear || '2026 - 2027',
          role: def.role,
          roleTitle: def.title,
          group: def.group,
        };
        touchedAccounts.push(updatedUsers[existingIdx]);
      } else {
        const newAcc: UserAccount = {
          username: def.username,
          role: def.role,
          displayName,
          roleTitle: def.title,
          assignedClass: className,
          academicYear: params.academicYear || '2026 - 2027',
          group: def.group,
          passwordHash: def.defaultPass,
          mustChangePassword: true,
          initialPasswordNotice: def.defaultPass,
          createdAt: new Date().toISOString(),
          createdBy: params.performedBy || 'GVCN',
        };
        updatedUsers.push(newAcc);
        touchedAccounts.push(newAcc);
      }
    });

    this.saveUsers(updatedUsers);

    storageService.addAuditLog({
      username: params.performedBy || 'GVCN',
      displayName: 'Giáo viên Chủ nhiệm',
      role: 'GVCN',
      roleTitle: 'Giáo viên Chủ nhiệm',
      action: 'UPDATE',
      module: 'Quản lý Ban cán sự',
      details: `Đã cập nhật phân công Ban cán sự Lớp ${className}`,
    });

    window.dispatchEvent(new CustomEvent('edumaster_auth_users_change'));
    return { success: true, updatedAccounts: touchedAccounts };
  }

  public toggleLockUser(
    username: string,
    performedBy?: string
  ): { success: boolean; isLocked?: boolean; error?: string } {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
    if (index === -1) return { success: false, error: 'Không tìm thấy tài khoản.' };

    const targetUser = users[index];
    if (targetUser.role === 'ADMIN' && targetUser.username.toUpperCase() === 'ADMIN') {
      return { success: false, error: 'Không thể khóa tài khoản Admin tối cao.' };
    }

    const newLockState = !targetUser.isLocked;
    users[index] = {
      ...targetUser,
      isLocked: newLockState,
    };
    this.saveUsers(users);

    storageService.addAuditLog({
      username: performedBy || 'ADMIN',
      displayName: 'Quản trị viên Hệ thống',
      role: 'ADMIN',
      roleTitle: 'Quản trị viên',
      action: 'UPDATE',
      module: 'Quản lý tài khoản',
      details: `${newLockState ? 'Khóa' : 'Mở khóa'} tài khoản "${username}"`,
    });

    return { success: true, isLocked: newLockState };
  }

  public resetPassword(
    username: string,
    newPassword?: string,
    performedBy?: string
  ): { success: boolean; newPassword?: string; error?: string } {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
    if (index === -1) return { success: false, error: 'Không tìm thấy tài khoản.' };

    const targetUser = users[index];
    const generatedPass =
      newPassword ||
      (targetUser.role === 'GVCN'
        ? 'gvcn123'
        : targetUser.initialPasswordNotice || 'admin@123');

    users[index] = {
      ...targetUser,
      passwordHash: generatedPass,
      initialPasswordNotice: generatedPass,
      mustChangePassword: true,
      lastPasswordChangedAt: undefined,
    };
    this.saveUsers(users);

    storageService.addAuditLog({
      username: performedBy || 'ADMIN',
      displayName: 'Quản trị viên Hệ thống',
      role: 'ADMIN',
      roleTitle: 'Quản trị viên',
      action: 'UPDATE',
      module: 'Quản lý tài khoản',
      details: `Đặt lại mật khẩu tài khoản "${username}" về mặc định và yêu cầu đổi mật khẩu`,
    });

    return { success: true, newPassword: generatedPass };
  }

  public deleteUser(username: string, performedBy?: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    const targetUser = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!targetUser) return { success: false, error: 'Không tìm thấy tài khoản.' };

    if (targetUser.role === 'ADMIN') {
      return { success: false, error: 'Không được phép xóa tài khoản Quản trị viên!' };
    }

    const updated = users.filter((u) => u.username.toLowerCase() !== username.toLowerCase());
    this.saveUsers(updated);

    // If deleting a GVCN, update the corresponding class entry
    if (targetUser.role === 'GVCN') {
      const classes = storageService.getClasses();
      const updatedClasses = classes.map((c) => {
        if (
          (c.teacherUsername && c.teacherUsername.toLowerCase() === username.toLowerCase()) ||
          (targetUser.assignedClass && c.className.toLowerCase() === targetUser.assignedClass.toLowerCase())
        ) {
          return {
            ...c,
            teacherUsername: '',
            teacherName: 'Chưa phân công',
          };
        }
        return c;
      });
      storageService.saveClasses(updatedClasses);
    }

    storageService.addAuditLog({
      username: performedBy || 'ADMIN',
      displayName: 'Quản trị viên Hệ thống',
      role: 'ADMIN',
      roleTitle: 'Quản trị viên',
      action: 'DELETE',
      module: 'Quản lý tài khoản',
      details: `Xóa tài khoản "${username}" (${targetUser.displayName} - ${targetUser.roleTitle}${targetUser.assignedClass ? ` - Lớp ${targetUser.assignedClass}` : ''})`,
    });

    return { success: true };
  }

  public deleteClassAndAccounts(
    className: string,
    deleteAccounts: boolean = true,
    performedBy: string = 'ADMIN'
  ): { success: boolean; deletedCount?: number; error?: string } {
    const cls = className.trim().toUpperCase();
    const classes = storageService.getClasses();
    
    // Remove class from classes list
    const remainingClasses = classes.filter(
      (c) => c.className.toUpperCase() !== cls && c.id.toUpperCase() !== cls
    );
    storageService.saveClasses(remainingClasses);

    let deletedAccountsCount = 0;
    if (deleteAccounts) {
      const users = this.getUsers();
      const keptUsers = users.filter((u) => {
        if (u.role === 'ADMIN') return true;
        const belongsToClass = u.assignedClass && u.assignedClass.toUpperCase() === cls;
        if (belongsToClass) {
          deletedAccountsCount++;
          return false;
        }
        return true;
      });
      this.saveUsers(keptUsers);
    }

    storageService.addAuditLog({
      username: performedBy,
      displayName: 'Quản trị viên Hệ thống',
      role: 'ADMIN',
      roleTitle: 'Quản trị viên',
      action: 'DELETE',
      module: 'Quản lý lớp học',
      details: `Xóa lớp học "${cls}"${deleteAccounts ? ` và xóa ${deletedAccountsCount} tài khoản liên quan` : ''}`,
    });

    return { success: true, deletedCount: deletedAccountsCount };
  }

  public getUsersByClass(className: string): UserAccount[] {
    const users = this.getUsers();
    if (!className) return [];
    return users.filter(
      (u) => u.assignedClass && u.assignedClass.toLowerCase() === className.trim().toLowerCase()
    );
  }

  public getAllTeacherAccounts(): UserAccount[] {
    const users = this.getUsers();
    return users.filter((u) => u.role === 'GVCN');
  }
}

export const authService = new AuthService();
export { DEFAULT_ACCOUNTS };
