import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  ShieldCheck,
  UserPlus,
  Users,
  School,
  KeyRound,
  Lock,
  Unlock,
  RotateCcw,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  Calendar,
  Layers,
  Copy,
  Check,
  FileSpreadsheet,
  Settings,
  Clock,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Save,
} from 'lucide-react';
import { authService, getTeacherUsernameSuffix, getCleanClassCode } from '../../services/authService';
import { storageService } from '../../services/storageService';
import { UserAccount, UserRole, ClassItem } from '../../types';

interface AdminDashboardViewProps {
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onNavigateToAuditLogs?: () => void;
  onSelectClass?: (className: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onShowToast,
  onNavigateToAuditLogs,
  onSelectClass,
}) => {
  // Data States
  const [users, setUsers] = useState<UserAccount[]>(() => authService.getUsers());
  const [classes, setClasses] = useState<ClassItem[]>(() => storageService.getClasses());

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');

  // Form: Create Teacher Account
  const [newClassName, setNewClassName] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [academicYear, setAcademicYear] = useState('2026 - 2027');
  const [customUsername, setCustomUsername] = useState('');
  const [customPassword, setCustomPassword] = useState('gvcn123');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Class Modal
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [addClassName, setAddClassName] = useState('');
  const [addClassGrade, setAddClassGrade] = useState<number>(10);

  // Edit / Reassign Teacher Modal
  const [editingTeacherClass, setEditingTeacherClass] = useState<ClassItem | null>(null);
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editTeacherUsername, setEditTeacherUsername] = useState('');
  const [editTeacherPassword, setEditTeacherPassword] = useState('gvcn123');

  // Delete User Confirmation Modal (prevents window.confirm iframe issues)
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);

  // Delete Class Confirmation Modal
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
  const [deleteClassAccountsChecked, setDeleteClassAccountsChecked] = useState(true);

  // Excel Batch Import for Teachers & Classes
  const [importedTeacherRows, setImportedTeacherRows] = useState<any[]>([]);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const teacherFileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTeacherTemplate = () => {
    try {
      const templateData = [
        {
          "STT": 1,
          "Tên Lớp": "10A1",
          "Họ và Tên GVCN": "Thầy Nguyễn Văn An",
          "Tên đăng nhập (Tùy chọn)": "gvcn-10a1",
          "Mật khẩu ban đầu": "gvcn123"
        },
        {
          "STT": 2,
          "Tên Lớp": "10A2",
          "Họ và Tên GVCN": "Cô Trần Thị Bình",
          "Tên đăng nhập (Tùy chọn)": "gvcn-10a2",
          "Mật khẩu ban đầu": "gvcn123"
        },
        {
          "STT": 3,
          "Tên Lớp": "11B1",
          "Họ và Tên GVCN": "Thầy Lê Văn Cường",
          "Tên đăng nhập (Tùy chọn)": "gvcn-11b1",
          "Mật khẩu ban đầu": "gvcn123"
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachGVCN");

      worksheet['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 18 }];

      XLSX.writeFile(workbook, `Mau_Danh_Sach_GVCN_Va_Lop_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
      onShowToast("Đã tải xuống file Excel mẫu danh sách GVCN & Lớp thành công!", "success");
    } catch (err) {
      console.error(err);
      onShowToast("Không thể tải file mẫu Excel. Vui lòng thử lại!", "error");
    }
  };

  const handleTeacherExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (json.length < 2) {
          onShowToast("File Excel không có dữ liệu hoặc sai định dạng mẫu!", "error");
          return;
        }

        const headers = (json[0] as any[]).map((h) => String(h || '').trim().toLowerCase());
        
        // Find Class Column: (must not match teacher or username columns)
        let classColIdx = headers.findIndex(h => 
          (h.includes('lớp') || h === 'lop' || h.includes('class')) && 
          !h.includes('gvcn') && !h.includes('giáo viên') && !h.includes('tên gv')
        );

        // Find Teacher Name Column: (must NOT match "Tên Lớp", "Tên đăng nhập", "Tên tài khoản")
        let nameColIdx = headers.findIndex(h => 
          h.includes('gvcn') || 
          h.includes('giáo viên') || 
          h.includes('giao vien') ||
          h.includes('teacher') || 
          h.includes('họ và tên') || 
          h.includes('ho va ten') || 
          h.includes('họ tên') || 
          h.includes('ho ten') || 
          h.includes('họ & tên') ||
          (h.includes('họ') && !h.includes('lớp')) ||
          (h.includes('tên') && !h.includes('lớp') && !h.includes('đăng nhập') && !h.includes('tài khoản') && !h.includes('user'))
        );

        // Find Username Column:
        let usernameColIdx = headers.findIndex(h => 
          h.includes('đăng nhập') || h.includes('dang nhap') || h.includes('username') || h.includes('tài khoản') || h.includes('tai khoan') || h.includes('login')
        );

        // Find Password Column:
        let passColIdx = headers.findIndex(h => 
          h.includes('mật khẩu') || h.includes('mat khau') || h.includes('password') || h.includes('pass') || h === 'mk'
        );

        // Robust column fallbacks if headers weren't found or collided
        if (classColIdx === -1) classColIdx = headers.length > 1 ? 1 : 0;
        if (nameColIdx === -1 || nameColIdx === classColIdx) {
          nameColIdx = headers.length > 2 ? 2 : 1;
        }
        if (usernameColIdx === -1 || usernameColIdx === nameColIdx || usernameColIdx === classColIdx) {
          usernameColIdx = headers.length > 3 ? 3 : 2;
        }
        if (passColIdx === -1 || passColIdx === usernameColIdx || passColIdx === nameColIdx || passColIdx === classColIdx) {
          passColIdx = headers.length > 4 ? 4 : 3;
        }

        const parsedRows: any[] = [];
        for (let i = 1; i < json.length; i++) {
          const row = json[i] as any[];
          if (!row || row.length === 0) continue;
          
          let className = String(row[classColIdx] !== undefined ? row[classColIdx] : (row[1] || '')).trim().toUpperCase();
          let teacherName = String(row[nameColIdx] !== undefined ? row[nameColIdx] : (row[2] || '')).trim();

          // If teacherName was mistakenly read as className (e.g. if swapped or same column)
          if (teacherName.toUpperCase() === className.toUpperCase()) {
            for (let c = 0; c < row.length; c++) {
              if (c !== classColIdx && c !== usernameColIdx && c !== passColIdx) {
                const val = String(row[c] || '').trim();
                if (val && val.toUpperCase() !== className.toUpperCase() && isNaN(Number(val))) {
                  teacherName = val;
                  break;
                }
              }
            }
          }
          
          if (!className) continue;
          if (!teacherName || teacherName.toUpperCase() === className.toUpperCase()) {
            teacherName = `Thầy/Cô GVCN Lớp ${className}`;
          }

          const cleanCls = getCleanClassCode(className);
          let username = String(row[usernameColIdx] !== undefined ? row[usernameColIdx] : (row[3] || `gvcn-${cleanCls}`)).trim().toLowerCase();
          if (!username || username === 'gvcn-' || username.includes(' ') || username.toUpperCase() === className.toUpperCase()) {
            username = `gvcn-${cleanCls}`;
          }
          const password = String(row[passColIdx] !== undefined ? row[passColIdx] : (row[4] || 'gvcn123')).trim() || 'gvcn123';

          parsedRows.push({
            className,
            teacherName,
            username: username.startsWith('gvcn-') ? username : `gvcn-${username}`,
            password,
          });
        }

        if (parsedRows.length === 0) {
          onShowToast("Không trích xuất được dòng dữ liệu GVCN hợp lệ nào từ file Excel.", "error");
          return;
        }

        setImportedTeacherRows(parsedRows);
        setIsImportPreviewOpen(true);
        onShowToast(`Đã đọc thành công ${parsedRows.length} giáo viên & lớp học từ file Excel!`, 'success');
      } catch (err: any) {
        console.error(err);
        onShowToast("Lỗi đọc file Excel. Vui lòng kiểm tra lại định dạng.", "error");
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmBatchTeacherImport = () => {
    if (importedTeacherRows.length === 0) return;

    let successCount = 0;
    const createdAccountsResult: any[] = [];

    importedTeacherRows.forEach((row) => {
      const clsName = row.className;
      const tName = row.teacherName;
      const uname = row.username;
      const pword = row.password;

      const res = authService.createTeacherAccount({
        className: clsName,
        teacherName: tName,
        academicYear,
        customUsername: uname,
        customPassword: pword,
        performedBy: 'ADMIN',
      });

      if (res.success) {
        successCount++;
        createdAccountsResult.push({
          "STT": successCount,
          "Tên Lớp": clsName,
          "Họ và Tên GVCN": tName,
          "Tên đăng nhập": res.account?.username || uname,
          "Mật khẩu ban đầu": pword,
          "Vai trò": "Giáo viên Chủ nhiệm",
          "Trạng thái": "Thành công"
        });
      }
    });

    reloadData();

    if (createdAccountsResult.length > 0) {
      try {
        const ws = XLSX.utils.json_to_sheet(createdAccountsResult);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachTaiKhoanGVCN");
        ws['!cols'] = [{ wch: 6 }, { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 15 }];
        XLSX.writeFile(wb, `Danh_Sach_Tai_Khoan_GVCN_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
      } catch (err) {
        console.error(err);
      }
    }

    onShowToast(`Đã tạo thành công ${successCount} tài khoản GVCN & lớp học từ Excel! Đã tải file kết quả.`, 'success');
    setImportedTeacherRows([]);
    setIsImportPreviewOpen(false);
  };

  // Sync users whenever auth changes
  const reloadData = () => {
    setUsers(authService.getUsers());
    setClasses(storageService.getClasses());
  };

  useEffect(() => {
    const handleAuthUsersChange = () => reloadData();
    window.addEventListener('edumaster_auth_users_change', handleAuthUsersChange);
    return () => window.removeEventListener('edumaster_auth_users_change', handleAuthUsersChange);
  }, []);

  // Update suggested username when class name changes
  const handleClassNameChange = (val: string) => {
    setNewClassName(val);
    if (val.trim()) {
      const suffix = getTeacherUsernameSuffix(val);
      setCustomUsername(`gvcn-${suffix}`);
    } else {
      setCustomUsername('');
    }
  };

  // Create GVCN account
  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      onShowToast('Vui lòng nhập tên lớp (ví dụ: 10A1)', 'error');
      return;
    }
    if (!newTeacherName.trim()) {
      onShowToast('Vui lòng nhập họ tên Giáo viên Chủ nhiệm', 'error');
      return;
    }

    const res = authService.createTeacherAccount({
      className: newClassName.trim().toUpperCase(),
      teacherName: newTeacherName.trim(),
      academicYear,
      customUsername: customUsername.trim() || undefined,
      customPassword: customPassword.trim() || 'gvcn123',
      performedBy: 'ADMIN',
    });

    if (!res.success) {
      onShowToast(res.error || 'Không thể tạo tài khoản', 'error');
      return;
    }

    onShowToast(
      `Đã tạo tài khoản GVCN "${res.account?.username}" cho lớp ${newClassName.toUpperCase()} thành công!`,
      'success'
    );
    reloadData();

    // Reset form
    setNewClassName('');
    setNewTeacherName('');
    setCustomUsername('');
    setCustomPassword('gvcn123');
  };

  // Reassign / Update Teacher for an existing class
  const handleReassignTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacherClass) return;
    if (!editTeacherName.trim()) {
      onShowToast('Vui lòng nhập họ tên Giáo viên Chủ nhiệm mới.', 'error');
      return;
    }

    const res = authService.createTeacherAccount({
      className: editingTeacherClass.className,
      teacherName: editTeacherName.trim(),
      academicYear: editingTeacherClass.academicYear || academicYear,
      customUsername: editTeacherUsername.trim() || undefined,
      customPassword: editTeacherPassword.trim() || 'gvcn123',
      performedBy: 'ADMIN',
    });

    if (res.success) {
      onShowToast(
        `Đã phân công GVCN "${editTeacherName.trim()}" cho lớp ${editingTeacherClass.className} thành công!`,
        'success'
      );
      setEditingTeacherClass(null);
      reloadData();
    } else {
      onShowToast(res.error || 'Lỗi cập nhật', 'error');
    }
  };

  // Lock / Unlock
  const handleToggleLock = (username: string) => {
    const res = authService.toggleLockUser(username, 'ADMIN');
    if (res.success) {
      onShowToast(`Đã ${res.isLocked ? 'khóa' : 'mở khóa'} tài khoản "${username}"!`, 'info');
      reloadData();
    } else {
      onShowToast(res.error || 'Lỗi thao tác', 'error');
    }
  };

  // Reset password
  const handleResetPassword = (username: string) => {
    const res = authService.resetPassword(username, undefined, 'ADMIN');
    if (res.success) {
      onShowToast(
        `Đã đặt lại mật khẩu cho "${username}" về "${res.newPassword}" (yêu cầu đổi mật khẩu ở lần đăng nhập tiếp theo)!`,
        'success'
      );
      reloadData();
    } else {
      onShowToast(res.error || 'Lỗi thao tác', 'error');
    }
  };

  // Confirm delete user (in-app modal, safe for iframes)
  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    const username = userToDelete.username;
    const res = authService.deleteUser(username, 'ADMIN');
    if (res.success) {
      onShowToast(`Đã xóa tài khoản "${username}" (${userToDelete.displayName}) thành công!`, 'success');
      reloadData();
      setUserToDelete(null);
    } else {
      onShowToast(res.error || 'Lỗi thao tác xóa tài khoản', 'error');
    }
  };

  // Confirm delete class
  const handleConfirmDeleteClass = () => {
    if (!classToDelete) return;
    const clsName = classToDelete.className;
    const res = authService.deleteClassAndAccounts(clsName, deleteClassAccountsChecked, 'ADMIN');
    if (res.success) {
      onShowToast(
        `Đã xóa lớp "${clsName}"${res.deletedCount ? ` và ${res.deletedCount} tài khoản liên quan` : ''} thành công!`,
        'success'
      );
      reloadData();
      setClassToDelete(null);
    } else {
      onShowToast(res.error || 'Lỗi thao tác xóa lớp', 'error');
    }
  };

  // Add new class manually
  const handleAddClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = addClassName.trim().toUpperCase();
    if (!clean) {
      onShowToast('Vui lòng nhập tên lớp!', 'error');
      return;
    }
    const existing = classes.find((c) => c.className.toUpperCase() === clean);
    if (existing) {
      onShowToast(`Lớp "${clean}" đã tồn tại!`, 'error');
      return;
    }

    storageService.addClass({
      id: clean,
      className: clean,
      grade: addClassGrade,
      academicYear,
      teacherUsername: '',
      teacherName: 'Chưa phân công',
      studentCount: 0,
      isInitialized: false,
      createdAt: new Date().toISOString(),
    });

    onShowToast(`Đã thêm lớp ${clean} vào danh mục trường!`, 'success');
    setShowAddClassModal(false);
    setAddClassName('');
    reloadData();
  };

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    onShowToast(`Đã sao chép: ${text}`, 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.assignedClass && u.assignedClass.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchRole =
      roleFilter === 'ALL'
        ? true
        : roleFilter === 'GVCN'
        ? u.role === 'GVCN'
        : roleFilter === 'CADRES'
        ? ['LT', 'TK', 'BT', 'TT1', 'TT2', 'TT3', 'TT4'].includes(u.role)
        : roleFilter === 'HS'
        ? u.role === 'HS'
        : u.role === roleFilter;

    const matchClass =
      classFilter === 'ALL'
        ? true
        : u.assignedClass && u.assignedClass.toUpperCase() === classFilter.toUpperCase();

    return matchSearch && matchRole && matchClass;
  });

  // Calculate System Stats
  const totalClasses = classes.length;
  const teacherAccounts = users.filter((u) => u.role === 'GVCN');
  const totalStudents = classes.reduce((sum, c) => sum + (c.studentCount || 0), 0);
  const lockedAccountsCount = users.filter((u) => u.isLocked).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-semibold mb-3 border border-cyan-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Cổng Quản Trị Hệ Thống (System Administrator)
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white flex items-center gap-2.5">
              Quản Trị Trường THPT & Cấp Quyền GVCN
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Tạo tài khoản Giáo viên Chủ nhiệm theo quy tắc chuẩn, quản lý danh sách lớp học, phân phối mật khẩu và giám sát an ninh dữ liệu toàn trường.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onNavigateToAuditLogs && (
              <button
                onClick={onNavigateToAuditLogs}
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600/80 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Clock className="w-4 h-4 text-cyan-400" />
                Nhật ký Hệ thống
              </button>
            )}
            <button
              onClick={() => setShowAddClassModal(true)}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <School className="w-4 h-4" />
              Thêm Lớp Mới
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <School className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalClasses}</div>
            <div className="text-xs font-medium text-slate-500">Lớp học quản lý</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{teacherAccounts.length}</div>
            <div className="text-xs font-medium text-slate-500">Giáo viên Chủ nhiệm</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{users.length}</div>
            <div className="text-xs font-medium text-slate-500">Tổng tài khoản hoạt động</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{lockedAccountsCount}</div>
            <div className="text-xs font-medium text-slate-500">Tài khoản bị khóa</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: CREATE GVCN ACCOUNT FORM */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-600" />
              Tạo Tài Khoản Giáo Viên Chủ Nhiệm (GVCN) & Lớp Học
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quy tắc chuẩn: Lớp <code className="text-cyan-600 dark:text-cyan-400 font-bold">10A1</code> → Tài khoản <code className="text-cyan-600 dark:text-cyan-400 font-bold">gvcn-10a1</code>, Mật khẩu ban đầu: <code className="text-cyan-600 dark:text-cyan-400 font-bold">gvcn123</code>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              ref={teacherFileInputRef}
              onChange={handleTeacherExcelUpload}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <button
              type="button"
              onClick={handleDownloadTeacherTemplate}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-600" />
              Tải File Mẫu Excel
            </button>
            <button
              type="button"
              onClick={() => teacherFileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Import Từ File Excel
            </button>
          </div>
        </div>

        <form onSubmit={handleCreateTeacher} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tên Lớp THPT <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newClassName}
                onChange={(e) => handleClassNameChange(e.target.value)}
                placeholder="Ví dụ: 10A1, 10A2, 11B3"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all uppercase"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Khối 10, 11 hoặc 12</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Họ và Tên GVCN <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newTeacherName}
                onChange={(e) => setNewTeacherName(e.target.value)}
                placeholder="Ví dụ: Thầy Nguyễn Văn Thành"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tên đăng nhập (Tự động sinh)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value)}
                  placeholder="gvcn-10a1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-cyan-300 dark:border-cyan-700/80 bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-900 dark:text-cyan-200 font-mono font-bold focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Quy tắc chuẩn: gvcn-[tên lớp] (Ví dụ: gvcn-10a1, gvcn-11a2)</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mật khẩu ban đầu
              </label>
              <input
                type="text"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                placeholder="gvcn123"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-medium focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block">
                Bắt buộc đổi mật khẩu lần đầu
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-600" />
              Năm học áp dụng: <span className="font-semibold text-slate-700 dark:text-slate-300">{academicYear}</span>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/25 flex items-center gap-2 cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Tạo Tài Khoản & Bàn Giao Lớp
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: CLASS LIST OVERVIEW */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <School className="w-5 h-5 text-indigo-600" />
              Danh Mục Lớp Học THPT ({classes.length} Lớp)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mỗi lớp được phụ trách bởi duy nhất 1 GVCN. GVCN chỉ có quyền xem và quản lý lớp của mình.
            </p>
          </div>

          <button
            onClick={() => setShowAddClassModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <School className="w-3.5 h-3.5" />
            + Thêm lớp học
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {classes.map((cls) => {
            const teacher = users.find(
              (u) =>
                u.assignedClass &&
                u.assignedClass.toUpperCase() === cls.className.toUpperCase() &&
                u.role === 'GVCN'
            );

            // Ensure teacher name is cleanly resolved and does not display just the class code
            let displayTeacherName = 'Chưa phân công';
            if (teacher?.displayName && teacher.displayName.trim().toUpperCase() !== cls.className.toUpperCase()) {
              displayTeacherName = teacher.displayName.trim();
            } else if (cls.teacherName && cls.teacherName.trim().toUpperCase() !== cls.className.toUpperCase()) {
              displayTeacherName = cls.teacherName.trim();
            } else if (cls.className === '10A1') {
              displayTeacherName = 'Thầy Nguyễn Văn Thành';
            } else if (cls.className === '11A1') {
              displayTeacherName = 'Cô Hoàng Mai Lan';
            } else {
              displayTeacherName = `Thầy/Cô GVCN Lớp ${cls.className}`;
            }

            return (
              <div
                key={cls.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 hover:border-cyan-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <School className="w-4 h-4 text-cyan-600" />
                      Lớp {cls.className}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                        Khối {cls.grade}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">GVCN:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {displayTeacherName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Tài khoản GVCN:</span>
                      <code className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {teacher?.username || cls.teacherUsername || `gvcn-${getTeacherUsernameSuffix(cls.className)}`}
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Sĩ số học sinh:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {cls.studentCount || 0} học sinh
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                      cls.isInitialized
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {cls.isInitialized ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Đã khởi tạo lớp
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" /> Chờ nhập DS
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeacherClass(cls);
                        setEditTeacherName(
                          displayTeacherName.startsWith('Thầy/Cô GVCN Lớp') ? '' : displayTeacherName
                        );
                        setEditTeacherUsername(
                          teacher?.username || cls.teacherUsername || `gvcn-${getTeacherUsernameSuffix(cls.className)}`
                        );
                        setEditTeacherPassword('gvcn123');
                      }}
                      className="text-slate-600 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 hover:underline flex items-center gap-0.5 text-[11px] font-semibold"
                      title="Đổi hoặc phân công Giáo viên Chủ nhiệm"
                    >
                      Đổi GV
                    </button>
                    {onSelectClass && (
                      <button
                        onClick={() => onSelectClass(cls.className)}
                        className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                        title="Vào xem dữ liệu và bảng điều khiển của lớp này"
                      >
                        Xem lớp →
                      </button>
                    )}
                    {teacher && (
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `Tài khoản: ${teacher.username}\nMật khẩu: ${teacher.passwordHash}`,
                            teacher.username
                          )
                        }
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-1 text-[11px] font-medium"
                        title="Sao chép tài khoản và mật khẩu GVCN"
                      >
                        {copiedKey === teacher.username ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Copy TK
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setClassToDelete(cls);
                        setDeleteClassAccountsChecked(true);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title={`Xóa lớp học ${cls.className}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: ALL USER ACCOUNTS DIRECTORY & MANAGEMENT */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-600" />
              Danh Sách Toàn Bộ Tài Khoản Hệ Thống ({filteredUsers.length} tài khoản)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý tài khoản Admin, GVCN, Ban cán sự và Học sinh. Hỗ trợ khóa tài khoản, reset mật khẩu và xóa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên đăng nhập, họ tên..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 w-48 sm:w-60"
              />
            </div>

            {/* Filter by Role */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ADMIN">Quản trị viên (Admin)</option>
              <option value="GVCN">Giáo viên chủ nhiệm</option>
              <option value="CADRES">Ban cán sự (LT, TK, BT, TT)</option>
              <option value="HS">Học sinh</option>
            </select>

            {/* Filter by Class */}
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">Tất cả các lớp</option>
              {classes.map((c) => (
                <option key={c.id} value={c.className}>
                  Lớp {c.className}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Tài khoản (Username)</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-4">Vai trò / Chức vụ</th>
                <th className="py-3 px-4">Lớp</th>
                <th className="py-3 px-4">Mật khẩu hiện tại</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((u) => {
                const isSuperAdmin = u.role === 'ADMIN' && u.username.toUpperCase() === 'ADMIN';
                return (
                  <tr
                    key={u.username}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      u.isLocked ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {u.role === 'ADMIN' && <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />}
                      {u.role === 'GVCN' && <School className="w-3.5 h-3.5 text-cyan-500" />}
                      <span>{u.username}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {u.displayName}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : u.role === 'GVCN'
                            ? 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300'
                            : ['LT', 'TK', 'BT'].includes(u.role)
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : u.role.startsWith('TT')
                            ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {u.roleTitle || u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {u.role === 'ADMIN' ? (
                        <span className="text-slate-500 font-medium">Toàn trường (Quản trị hệ thống)</span>
                      ) : u.assignedClass ? (
                        `Lớp ${u.assignedClass}`
                      ) : (
                        'Toàn trường'
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <span>{u.passwordHash}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(u.passwordHash, `pw_${u.username}`)}
                          className="text-slate-400 hover:text-cyan-600 p-0.5 rounded"
                          title="Sao chép mật khẩu"
                        >
                          {copiedKey === `pw_${u.username}` ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {u.isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold">
                          <Lock className="w-3 h-3" /> Đã khóa
                        </span>
                      ) : u.mustChangePassword ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-medium">
                          <AlertCircle className="w-3 h-3" /> Chưa đổi mật khẩu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Đang hoạt động
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Lock / Unlock */}
                        {!isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => handleToggleLock(u.username)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              u.isLocked
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600'
                            }`}
                            title={u.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          >
                            {u.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {/* Reset Password */}
                        <button
                          type="button"
                          onClick={() => handleResetPassword(u.username)}
                          className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                          title="Đặt lại mật khẩu về mặc định và yêu cầu đổi MK"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete User */}
                        {!isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition-colors"
                            title={`Xóa tài khoản "${u.username}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Không tìm thấy tài khoản nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD CLASS */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <School className="w-4 h-4 text-cyan-600" />
                Thêm Lớp Học Mới
              </h3>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddClassSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Lớp (Ví dụ: 10A2, 11B1, 12A5) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={addClassName}
                  onChange={(e) => setAddClassName(e.target.value)}
                  placeholder="10A2"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Khối Lớp
                </label>
                <select
                  value={addClassGrade}
                  onChange={(e) => setAddClassGrade(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                >
                  <option value={10}>Khối 10</option>
                  <option value={11}>Khối 11</option>
                  <option value={12}>Khối 12</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer"
                >
                  Xác nhận thêm lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REASSIGN / UPDATE GVCN */}
      {editingTeacherClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 text-cyan-600 dark:text-cyan-400">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 flex items-center justify-center border border-cyan-200/60 dark:border-cyan-800/60">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Phân Công / Đổi GVCN Lớp {editingTeacherClass.className}
                  </h3>
                  <p className="text-[11px] text-slate-400">Cập nhật thông tin Giáo viên Chủ nhiệm</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeacherClass(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReassignTeacherSubmit} className="space-y-4 text-xs">
              <div className="bg-cyan-50/50 dark:bg-cyan-950/20 p-3 rounded-xl border border-cyan-100 dark:border-cyan-900/30 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between items-center">
                  <span>Lớp phân công:</span>
                  <span className="font-bold text-cyan-700 dark:text-cyan-300">Lớp {editingTeacherClass.className}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span>Năm học:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{editingTeacherClass.academicYear || '2026 - 2027'}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và Tên Giáo viên Chủ nhiệm mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Cô Vũ Thị Lan, Thầy Phạm Đức Minh"
                  value={editTeacherName}
                  onChange={(e) => setEditTeacherName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    placeholder="Tùy chọn username"
                    value={editTeacherUsername}
                    onChange={(e) => setEditTeacherUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu ban đầu
                  </label>
                  <input
                    type="text"
                    value={editTeacherPassword}
                    onChange={(e) => setEditTeacherPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTeacherClass(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Lưu phân công GVCN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE USER ACCOUNT */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-100 dark:border-rose-900/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center border border-rose-200/60 dark:border-rose-800/60">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Xác Nhận Xóa Tài Khoản
                  </h3>
                  <p className="text-[11px] text-slate-400">Hành động này không thể hoàn tác</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tên đăng nhập:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200/70 dark:bg-slate-700 px-2 py-0.5 rounded">
                  {userToDelete.username}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Họ và Tên:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {userToDelete.displayName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Vai trò / Chức vụ:</span>
                <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                  {userToDelete.roleTitle || userToDelete.role}
                </span>
              </div>
              {userToDelete.assignedClass && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Lớp phụ trách / học:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Lớp {userToDelete.assignedClass}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa tài khoản{' '}
              <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                {userToDelete.username}
              </span>{' '}
              khỏi hệ thống? Sau khi xóa, người dùng này sẽ không thể đăng nhập vào ứng dụng nữa.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xác nhận xóa tài khoản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE CLASS */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-100 dark:border-rose-900/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center border border-rose-200/60 dark:border-rose-800/60">
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Xác Nhận Xóa Lớp Học
                  </h3>
                  <p className="text-[11px] text-slate-400">Xóa lớp khỏi danh mục toàn trường</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tên lớp:</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  Lớp {classToDelete.className}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">GVCN:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {classToDelete.teacherName || 'Chưa phân công'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Sĩ số:</span>
                <span className="font-semibold text-emerald-600">
                  {classToDelete.studentCount || 0} học sinh
                </span>
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteClassAccountsChecked}
                onChange={(e) => setDeleteClassAccountsChecked(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <span className="text-xs text-rose-800 dark:text-rose-300">
                Đồng thời xóa toàn bộ tài khoản học sinh và cán sự thuộc lớp {classToDelete.className} khỏi hệ thống
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClass}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xác nhận xóa lớp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Import Preview Modal */}
      {isImportPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-cyan-600" />
                  Xác Nhận Danh Sách GVCN & Lớp Học Từ File Excel ({importedTeacherRows.length} Lớp)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm tra thông tin trước khi hệ thống tiến hành tạo tài khoản hàng loạt và xuất file báo cáo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportPreviewOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">STT</th>
                    <th className="p-3">Tên Lớp</th>
                    <th className="p-3">Họ và Tên GVCN</th>
                    <th className="p-3">Tên đăng nhập</th>
                    <th className="p-3">Mật khẩu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {importedTeacherRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-medium text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-bold text-cyan-600 dark:text-cyan-400">{row.className}</td>
                      <td className="p-3 font-semibold">{row.teacherName}</td>
                      <td className="p-3 font-mono text-xs">{row.username}</td>
                      <td className="p-3 font-mono text-xs text-amber-600 dark:text-amber-400">{row.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsImportPreviewOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchTeacherImport}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/25 flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Xác Nhận Tạo {importedTeacherRows.length} Tài Khoản & Tải File Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
