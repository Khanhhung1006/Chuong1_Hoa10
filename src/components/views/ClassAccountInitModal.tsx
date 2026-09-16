import React, { useState, useId, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  School,
  Calendar,
  FileSpreadsheet,
  Users,
  Award,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  Printer,
  Sparkles,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { Student, UserAccount } from '../../types';
import { authService, getCleanClassCode } from '../../services/authService';
import { storageService } from '../../services/storageService';
import {
  downloadStudentTemplate,
  parseStudentExcelFile,
} from '../../services/studentImportService';

interface ClassAccountInitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: string;
  academicYear: string;
  existingStudents: Student[];
  onSuccess: (createdAccounts: UserAccount[], updatedStudents: Student[], finalizedClass?: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  currentUser?: UserAccount;
}

export const ClassAccountInitModal: React.FC<ClassAccountInitModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  academicYear: initialAcademicYear,
  existingStudents,
  onSuccess,
  onShowToast,
  currentUser,
}) => {
  const fileInputId = useId();
  // Wizard Steps (1 to 6)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Class Name
  const [className, setClassName] = useState<string>(currentClass || '10A1');

  // Step 2: Academic Year
  const [academicYear, setAcademicYear] = useState<string>(initialAcademicYear || '2026 - 2027');

  // Step 3: Students list (can be imported or use existing)
  const [studentsList, setStudentsList] = useState<Student[]>(existingStudents || []);
  const [importFileName, setImportFileName] = useState<string>('');

  // Step 5: Selected Cadres
  const [selectedLT, setSelectedLT] = useState<string>(''); // student id for LT
  const [selectedTK, setSelectedTK] = useState<string>(''); // student id for TK
  const [selectedBT, setSelectedBT] = useState<string>(''); // student id for BT
  const [selectedTT1, setSelectedTT1] = useState<string>('');
  const [selectedTT2, setSelectedTT2] = useState<string>('');
  const [selectedTT3, setSelectedTT3] = useState<string>('');
  const [selectedTT4, setSelectedTT4] = useState<string>('');

  // Step 6: Generated Accounts
  const [generatedAccounts, setGeneratedAccounts] = useState<UserAccount[]>([]);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [isCopyAllDone, setIsCopyAllDone] = useState<boolean>(false);

  // Track previous isOpen state to prevent reset during parent re-renders
  const prevIsOpenRef = useRef<boolean>(false);

  useEffect(() => {
    // Only reset state when modal opens (transition from false -> true)
    if (isOpen && !prevIsOpenRef.current) {
      if (currentClass) {
        setClassName(currentClass.trim().toUpperCase());
      }
      if (initialAcademicYear) {
        setAcademicYear(initialAcademicYear);
      }
      setStudentsList(existingStudents || []);
      setCurrentStep(1);
      setGeneratedAccounts([]);
      setImportFileName('');
      setSelectedLT('');
      setSelectedTK('');
      setSelectedBT('');
      setSelectedTT1('');
      setSelectedTT2('');
      setSelectedTT3('');
      setSelectedTT4('');
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, currentClass, initialAcademicYear]);

  if (!isOpen) return null;

  const cleanClass = getCleanClassCode(className);

  // Download official Excel student template
  const handleDownloadTemplate = () => {
    try {
      const targetClass = (className || '10A1').trim().toUpperCase();
      downloadStudentTemplate(targetClass);
      onShowToast(
        `Đã tải xuống file Excel mẫu chuẩn: Mau_Danh_Sach_Hoc_Sinh_${targetClass}.xlsx`,
        'success'
      );
    } catch (err) {
      console.error('Download template error:', err);
      onShowToast('Không thể tạo file mẫu. Vui lòng thử lại!', 'error');
    }
  };

  // Handle Excel / CSV File Import
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);

    try {
      const targetClass = (className || '10A1').trim().toUpperCase();
      const result = await parseStudentExcelFile(file, existingStudents, targetClass);

      if (result.validStudents && result.validStudents.length > 0) {
        setStudentsList(result.validStudents);
        onShowToast(
          `Đã import thành công ${result.validStudents.length} học sinh từ file "${file.name}"!`,
          'success'
        );
      } else if (result.invalidRows && result.invalidRows.length > 0) {
        onShowToast(`Lỗi đọc file ở dòng ${result.invalidRows[0].rowNumber}: ${result.invalidRows[0].reason}`, 'error');
      } else {
        onShowToast('Không tìm thấy dữ liệu học sinh hợp lệ trong file Excel.', 'error');
      }
    } catch (err: any) {
      console.error('File parse error:', err);
      onShowToast(err.message || 'Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng.', 'error');
    } finally {
      // Reset input value so same file can be re-selected if needed
      e.target.value = '';
    }
  };

  // Pre-load sample 32 students if empty
  const handleLoadSampleStudents = () => {
    if (existingStudents && existingStudents.length > 0) {
      setStudentsList(existingStudents);
      onShowToast(`Đã nạp ${existingStudents.length} học sinh hiện có của lớp!`, 'info');
      return;
    }

    // Default sample list for high school class
    const sampleNames = [
      'Nguyễn An Bình', 'Trần Bảo Châu', 'Lê Công Danh', 'Phạm Đăng Dũng',
      'Hoàng Đức Duy', 'Vũ Gia Hân', 'Đặng Hải Yến', 'Bùi Hữu Khang',
      'Đỗ Khánh Linh', 'Hồ Minh Khôi', 'Ngô Ngọc Mai', 'Dương Nhật Minh',
      'Lý Phương Nga', 'Đinh Quang Huy', 'Mai Quốc Bảo', 'Lâm Quỳnh Anh',
      'Trịnh Sơn Tùng', 'Võ Thái Sơn', 'Lương Thanh Hà', 'Phan Thu Trang',
      'Chu Thùy Linh', 'Tạ Tiến Đạt', 'Cao Trọng Nghĩa', 'Bạch Tuấn Anh',
      'Đoàn Việt Dũng', 'Vương Vũ Phong', 'Tô Xuân Bắc', 'Lưu Yến Nhi',
      'Nghiêm Minh Tuấn', 'Trương Hoài An', 'Quách Đình Nam', 'Tạ Mỹ Duyên'
    ];

    const generated: Student[] = sampleNames.map((fullName, idx) => ({
      id: `st_init_${idx + 1}`,
      code: `HS${String(idx + 1).padStart(3, '0')}`,
      fullName,
      gender: (idx % 2 === 0 ? 'Nam' : 'Nữ') as 'Nam' | 'Nữ',
      dob: '2010-05-15',
      className,
      group: (idx % 4) + 1,
      address: 'TP. Hà Nội',
      studentPhone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
      fatherName: `Bác ${fullName.split(' ').slice(-1)[0]}`,
      motherName: `Cô ${fullName.split(' ').slice(-1)[0]}`,
      parentPhone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
      isUnionMember: true,
      roleInClass: 'Học sinh',
    }));

    setStudentsList(generated);
    onShowToast(`Đã nạp danh sách mẫu 32 học sinh lớp ${className}!`, 'success');
  };

  // Step 4 to 5 transition: Auto-generate student accounts
  const handleGenerateAccountsAndProceed = () => {
    if (studentsList.length === 0) {
      onShowToast('Vui lòng nạp danh sách học sinh trước khi sinh tài khoản!', 'error');
      return;
    }

    // If cadres not picked, auto suggest first few students
    if (!selectedLT && studentsList[0]) setSelectedLT(studentsList[0].id);
    if (!selectedTK && studentsList[1]) setSelectedTK(studentsList[1].id);
    if (!selectedBT && studentsList[2]) setSelectedBT(studentsList[2].id);

    // Group leaders
    const g1 = studentsList.find((s) => s.group === 1) || studentsList[3];
    const g2 = studentsList.find((s) => s.group === 2) || studentsList[4];
    const g3 = studentsList.find((s) => s.group === 3) || studentsList[5];
    const g4 = studentsList.find((s) => s.group === 4) || studentsList[6];

    if (!selectedTT1 && g1) setSelectedTT1(g1.id);
    if (!selectedTT2 && g2) setSelectedTT2(g2.id);
    if (!selectedTT3 && g3) setSelectedTT3(g3.id);
    if (!selectedTT4 && g4) setSelectedTT4(g4.id);

    setCurrentStep(5);
  };

  // Step 5: Finalize and create accounts in AuthService and StorageService
  const handleFinalizeAccounts = () => {
    try {
      // Map roleInClass to students
      const updatedStudents = studentsList.map((st) => {
        let roleInClass: string | undefined = undefined;
        if (st.id === selectedLT) roleInClass = 'Lớp trưởng';
        else if (st.id === selectedTK) roleInClass = 'Thư ký';
        else if (st.id === selectedBT) roleInClass = 'Bí thư';
        else if (st.id === selectedTT1) roleInClass = 'Tổ trưởng Tổ 1';
        else if (st.id === selectedTT2) roleInClass = 'Tổ trưởng Tổ 2';
        else if (st.id === selectedTT3) roleInClass = 'Tổ trưởng Tổ 3';
        else if (st.id === selectedTT4) roleInClass = 'Tổ trưởng Tổ 4';

        return {
          ...st,
          roleInClass,
        };
      });

      const targetClass = (className || '10A1').trim().toUpperCase();

      const res = authService.createClassCadresAndStudentsAccounts({
        className: targetClass,
        academicYear,
        students: updatedStudents.map((s) => ({
          id: s.id,
          fullName: s.fullName,
          roleInClass: s.roleInClass,
          group: s.group,
          code: s.code,
        })),
        performedBy: currentUser?.username || 'GVCN',
      });

      if (!res.success) {
        onShowToast(res.error || 'Lỗi sinh tài khoản', 'error');
        return;
      }

      // Save updated students with assigned roles into storageService scoped to className
      storageService.setActiveClass(targetClass);
      storageService.saveStudents(updatedStudents, targetClass);

      const classSettings = storageService.getSettings(targetClass);
      storageService.saveSettings(
        {
          ...classSettings,
          className: targetClass,
          academicYear,
          schoolName: classSettings.schoolName || 'THPT Nguyễn Trãi - BĐ',
          teacherName: currentUser?.displayName || classSettings.teacherName,
        },
        targetClass
      );

      setGeneratedAccounts(res.createdAccounts);
      setCurrentStep(6);
      onSuccess(res.createdAccounts, updatedStudents, targetClass);
      onShowToast(
        `Đã hoàn tất khởi tạo lớp ${targetClass} với ${res.createdAccounts.length} tài khoản!`,
        'success'
      );
    } catch (err: any) {
      console.error('Error finalizing accounts:', err);
      onShowToast(`Lỗi khi khởi tạo tài khoản: ${err?.message || 'Vui lòng thử lại'}`, 'error');
    }
  };

  // Copy helper
  const copyAccountText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    onShowToast(`Đã sao chép: ${text}`, 'info');
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  // Copy all accounts summary
  const handleCopyAllAccounts = () => {
    if (generatedAccounts.length === 0) return;
    const lines = [
      `DANH SÁCH TÀI KHOẢN BAN CÁN SỰ LỚP ${className} - NĂM HỌC ${academicYear}`,
      '----------------------------------------------------------------------',
      ...generatedAccounts.map(
        (a, i) =>
          `${i + 1}. [${a.roleTitle}] ${a.displayName} | Username: ${a.username} | Pass: ${a.passwordHash}`
      ),
      '----------------------------------------------------------------------',
      '* Lưu ý: Tất cả tài khoản cán sự bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.',
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setIsCopyAllDone(true);
    onShowToast('Đã sao chép toàn bộ danh sách tài khoản ban cán sự vào bộ nhớ tạm!', 'success');
    setTimeout(() => setIsCopyAllDone(false), 3000);
  };

  // Export to Excel (.xlsx) using SheetJS
  const handleExportExcel = () => {
    if (generatedAccounts.length === 0) return;

    try {
      const dataRows = generatedAccounts.map((acc, idx) => ({
        'STT': idx + 1,
        'Tên đăng nhập': acc.username,
        'Mật khẩu ban đầu': acc.passwordHash,
        'Họ và tên Cán sự': acc.displayName,
        'Chức vụ / Nhiệm vụ': acc.roleTitle,
        'Lớp': acc.assignedClass || className,
        'Tổ': acc.group ? `Tổ ${acc.group}` : 'Lớp',
        'Năm học': acc.academicYear || academicYear,
        'Bắt buộc đổi mật khẩu': 'Có (Lần đầu)',
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataRows);
      
      // Auto-fit column widths
      const colWidths = [
        { wch: 6 },
        { wch: 18 },
        { wch: 18 },
        { wch: 26 },
        { wch: 22 },
        { wch: 10 },
        { wch: 10 },
        { wch: 16 },
        { wch: 22 },
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Can_Su_${cleanClass}`);

      XLSX.writeFile(workbook, `Danh_Sach_Tai_Khoan_Can_Su_Lop_${cleanClass}_${academicYear.replace(/\s+/g, '_')}.xlsx`);
      onShowToast('Đã xuất file Excel (.xlsx) danh sách tài khoản ban cán sự thành công!', 'success');
    } catch (err: any) {
      console.error('Export Excel error:', err);
      // Fallback to CSV if xlsx throws
      handleExportCSV();
    }
  };

  // Export to CSV format
  const handleExportCSV = () => {
    if (generatedAccounts.length === 0) return;

    let csv = 'STT,Ten_dang_nhap,Mat_khau_mac_dinh,Ho_va_ten_Can_su,Chuc_vu,Lop,To,Nam_hoc,Yeu_cau_doi_mk\n';
    generatedAccounts.forEach((acc, idx) => {
      csv += `${idx + 1},"${acc.username}","${acc.passwordHash}","${acc.displayName}","${acc.roleTitle}","${acc.assignedClass || className}","${acc.group || ''}","${acc.academicYear || academicYear}","Co"\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh_Sach_Tai_Khoan_Can_Su_Lop_${cleanClass}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast('Đã tải xuống file CSV danh sách tài khoản cán sự!', 'success');
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  const cadreMainAccounts = generatedAccounts.filter((a) => ['LT', 'TK', 'BT'].includes(a.role));
  const cadreGroupAccounts = generatedAccounts.filter((a) => a.role.startsWith('TT'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center">
                <School className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Khởi Tạo Lớp & Cấp Tài Khoản Ban Cán Sự
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Quy trình chuẩn 6 bước: Thiết lập lớp, nạp học sinh, xác nhận danh sách, chọn Ban cán sự & Tổ trưởng, cấp tài khoản tác vụ
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Wizard Progress Steps */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[640px] text-xs">
            {[
              { num: 1, label: 'Tên lớp' },
              { num: 2, label: 'Năm học' },
              { num: 3, label: 'DS Học sinh' },
              { num: 4, label: 'Xác nhận DS' },
              { num: 5, label: 'Chọn Ban cán sự' },
              { num: 6, label: 'Cấp quyền & Xuất file' },
            ].map((st) => (
              <div
                key={st.num}
                className={`flex items-center gap-1.5 ${
                  currentStep === st.num
                    ? 'text-cyan-600 dark:text-cyan-400 font-bold'
                    : currentStep > st.num
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep === st.num
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                      : currentStep > st.num
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentStep > st.num ? '✓' : st.num}
                </div>
                <span>{st.label}</span>
                {st.num < 6 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 ml-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm">
          {/* STEP 1: CLASS NAME */}
          {currentStep === 1 && (
            <div className="space-y-4 max-w-md mx-auto py-6">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 mx-auto flex items-center justify-center mb-2">
                  <School className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bước 1: Nhập và xác nhận Tên Lớp Chủ Nhiệm
                </h3>
                <p className="text-xs text-slate-500">
                  Hệ thống tự động sử dụng tên lớp làm tiền tố định danh tài khoản cán sự lớp
                </p>
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Tên Lớp (Ví dụ: 10A1, 10A2, 11A1, 12A3)
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value.toUpperCase())}
                  placeholder="10A1"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-lg text-center tracking-wider uppercase focus:ring-2 focus:ring-cyan-500"
                />
                <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-300 text-xs flex items-start gap-2 border border-cyan-100 dark:border-cyan-900">
                  <Sparkles className="w-4 h-4 shrink-0 text-cyan-600 mt-0.5" />
                  <span>
                    Quy chuẩn tự động tài khoản cán sự: Lớp trưởng (<code className="font-bold">lt-{cleanClass}</code>), Thư ký (<code className="font-bold">tk-{cleanClass}</code>), Bí thư (<code className="font-bold">bt-{cleanClass}</code>), 4 Tổ trưởng (<code className="font-bold">tt1-{cleanClass}</code> .. <code className="font-bold">tt4-{cleanClass}</code>).
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ACADEMIC YEAR */}
          {currentStep === 2 && (
            <div className="space-y-4 max-w-md mx-auto py-6">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 mx-auto flex items-center justify-center mb-2">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bước 2: Chọn Năm Học
                </h3>
                <p className="text-xs text-slate-500">
                  Tất cả hồ sơ điểm danh, nề nếp, thi đua và sổ điểm sẽ gắn với niên khóa này
                </p>
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Niên khóa áp dụng
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-center focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="2026 - 2027">Năm học 2026 - 2027 (Hiện tại)</option>
                  <option value="2025 - 2026">Năm học 2025 - 2026</option>
                  <option value="2027 - 2028">Năm học 2027 - 2028</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 3: IMPORT STUDENTS EXCEL */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    Bước 3: Import Danh Sách Học Sinh Từ Excel
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hỗ trợ file .xlsx, .csv hoặc sử dụng danh sách học sinh mẫu chuẩn (32 học sinh)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="btn-download-excel-template-step3"
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    title="Tải file Excel mẫu (.xlsx) chuẩn cấu trúc THPT để điền danh sách học sinh"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    Tải file mẫu Excel
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSampleStudents}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Nạp DS mẫu (32 HS)
                  </button>

                  <label 
                    htmlFor={fileInputId}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Chọn file Excel / CSV
                    <input
                      id={fileInputId}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {importFileName && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Đã tải file: <span className="font-bold">{importFileName}</span>
                </div>
              )}

              {/* Students Preview Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                  <span>Danh sách học sinh lớp {className} ({studentsList.length} học sinh)</span>
                  <span className="text-slate-500 font-normal">Học sinh được chia vào 4 tổ tự động</span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/50 dark:bg-slate-800/40 text-slate-500 sticky top-0">
                      <tr>
                        <th className="py-2 px-3">STT</th>
                        <th className="py-2 px-3">Mã HS</th>
                        <th className="py-2 px-3">Họ và Tên</th>
                        <th className="py-2 px-3">Giới tính</th>
                        <th className="py-2 px-3">Tổ</th>
                        <th className="py-2 px-3">Phụ huynh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {studentsList.map((st, idx) => (
                        <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                            {st.code || `HS${String(idx + 1).padStart(3, '0')}`}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                            {st.fullName}
                          </td>
                          <td className="py-2 px-3">{st.gender}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
                              Tổ {st.group || ((idx % 4) + 1)}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500">{st.parentPhone}</td>
                        </tr>
                      ))}

                      {studentsList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-400 space-y-2">
                            <p>Chưa có dữ liệu học sinh cho lớp {className}.</p>
                            <p className="text-xs text-slate-400">
                              Thầy/Cô có thể bấm <span className="font-bold text-cyan-600 dark:text-cyan-400">&quot;Tải file mẫu Excel&quot;</span> để điền danh sách, hoặc bấm <span className="font-bold text-slate-600 dark:text-slate-300">&quot;Nạp DS mẫu&quot;</span> / <span className="font-bold text-emerald-600 dark:text-emerald-400">&quot;Chọn file Excel / CSV&quot;</span> để nạp ngay!
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRM STUDENTS & GROUPS */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-sm text-cyan-800 dark:text-cyan-300">
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  Bước 4: Xác nhận danh sách học sinh & Phân bổ 4 tổ
                </div>
                <p className="text-slate-700 dark:text-slate-300">
                  • <span className="font-semibold text-cyan-700 dark:text-cyan-300">Chính sách tài khoản nhà trường:</span> Hệ thống chỉ tạo tài khoản làm việc cho <span className="font-bold text-slate-900 dark:text-white">Ban cán sự lớp (Lớp trưởng, Thư ký, Bí thư)</span> và <span className="font-bold text-slate-900 dark:text-white">4 Tổ trưởng</span> để phục vụ nhập điểm danh, nề nếp, vệ sinh và thi đua.
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  • Học sinh thông thường <span className="font-bold text-emerald-700 dark:text-emerald-400">không cần tài khoản</span> để tránh phát sinh quản trị và rủi ro bảo mật.
                </p>
              </div>

              {/* Class Overview Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-xs text-slate-500">Tổng sĩ số học sinh</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{studentsList.length}</div>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-center">
                  <div className="text-xs text-indigo-600 dark:text-indigo-400">Phân bổ tổ</div>
                  <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">4 Tổ học tập</div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">Tài khoản cán sự cấp</div>
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">7 Tài khoản</div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
                  <div className="text-xs text-amber-600 dark:text-amber-400">Học sinh thường</div>
                  <div className="text-sm font-bold text-amber-700 dark:text-amber-300 mt-1">Không cấp TK</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                  <span>Xem trước danh sách học sinh theo tổ</span>
                  <span className="text-slate-500 font-normal">Sẵn sàng để chỉ định cán sự ở bước 5</span>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/50 dark:bg-slate-800/40 text-slate-500 sticky top-0">
                      <tr>
                        <th className="py-2 px-3">STT</th>
                        <th className="py-2 px-3">Mã HS</th>
                        <th className="py-2 px-3">Họ và Tên</th>
                        <th className="py-2 px-3">Giới tính</th>
                        <th className="py-2 px-3">Tổ</th>
                        <th className="py-2 px-3">Vai trò dự kiến</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {studentsList.map((st, idx) => (
                        <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                            {st.code || `HS${String(idx + 1).padStart(3, '0')}`}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                            {st.fullName}
                          </td>
                          <td className="py-2 px-3">{st.gender}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
                              Tổ {st.group || ((idx % 4) + 1)}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500">
                            {idx === 0 ? 'Dự kiến Lớp trưởng' : idx === 1 ? 'Dự kiến Thư ký' : idx === 2 ? 'Dự kiến Bí thư' : 'Học sinh'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SELECT CADRES */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Bước 5: GVCN Chọn Ban Cán Sự Lớp & Tổ Trưởng
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn học sinh đảm nhiệm các vị trí cán sự. Hệ thống sẽ tự động cấp quyền và tạo đúng 7 tài khoản cán sự tương ứng.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Lớp trưởng */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-emerald-700 dark:text-emerald-300 text-xs">
                      Lớp trưởng
                    </label>
                    <span className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-1.5 py-0.5 rounded">
                      lt-{cleanClass}
                    </span>
                  </div>
                  <select
                    value={selectedLT}
                    onChange={(e) => setSelectedLT(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">-- Chưa chọn --</option>
                    {studentsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} (Tổ {s.group || 1})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Thư ký */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-emerald-700 dark:text-emerald-300 text-xs">
                      Thư ký lớp
                    </label>
                    <span className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-1.5 py-0.5 rounded">
                      tk-{cleanClass}
                    </span>
                  </div>
                  <select
                    value={selectedTK}
                    onChange={(e) => setSelectedTK(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">-- Chưa chọn --</option>
                    {studentsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} (Tổ {s.group || 1})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bí thư */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-emerald-700 dark:text-emerald-300 text-xs">
                      Bí thư Chi đoàn
                    </label>
                    <span className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-1.5 py-0.5 rounded">
                      bt-{cleanClass}
                    </span>
                  </div>
                  <select
                    value={selectedBT}
                    onChange={(e) => setSelectedBT(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">-- Chưa chọn --</option>
                    {studentsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} (Tổ {s.group || 1})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tổ trưởng 1 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-indigo-700 dark:text-indigo-300 text-xs">
                      Tổ trưởng Tổ 1
                    </label>
                    <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                      tt1-{cleanClass}
                    </span>
                  </div>
                  <select
                    value={selectedTT1}
                    onChange={(e) => setSelectedTT1(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">-- Chưa chọn --</option>
                    {studentsList.filter((s) => s.group === 1).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} (Tổ 1)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tổ trưởng 2 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-indigo-700 dark:text-indigo-300 text-xs">
                      Tổ trưởng Tổ 2
                    </label>
                    <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                      tt2-{cleanClass}
                    </span>
                  </div>
                  <select
                    value={selectedTT2}
                    onChange={(e) => setSelectedTT2(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">-- Chưa chọn --</option>
                    {studentsList.filter((s) => s.group === 2).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} (Tổ 2)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tổ trưởng 3 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-indigo-700 dark:text-indigo-300 text-xs">
                      Tổ trưởng Tổ 3
                    </label>
                    <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                      tt3-{cleanClass}
                    </span>
                  </div>
                  <select
                    value={selectedTT3}
                    onChange={(e) => setSelectedTT3(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">-- Chưa chọn --</option>
                    {studentsList.filter((s) => s.group === 3).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} (Tổ 3)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tổ trưởng 4 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-indigo-700 dark:text-indigo-300 text-xs">
                      Tổ trưởng Tổ 4
                    </label>
                    <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                      tt4-{cleanClass}
                    </span>
                  </div>
                  <select
                    value={selectedTT4}
                    onChange={(e) => setSelectedTT4(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">-- Chưa chọn --</option>
                    {studentsList.filter((s) => s.group === 4).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} (Tổ 4)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: FINISHED & EXPORT */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-base flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Khởi tạo lớp & Cấp tài khoản Ban Cán Sự thành công!
                  </div>
                  <p className="text-xs mt-1 text-emerald-700 dark:text-emerald-400">
                    Đã hoàn tất khởi tạo lớp <span className="font-bold">{className}</span> ({academicYear}) với đúng <span className="font-bold">{generatedAccounts.length}</span> tài khoản Ban cán sự lớp.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                    title="Xuất file Excel (.xlsx) danh sách tài khoản cán sự"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Xuất File Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyAllAccounts}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {isCopyAllDone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {isCopyAllDone ? 'Đã sao chép tất cả' : 'Sao chép tất cả'}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    In danh sách
                  </button>
                </div>
              </div>

              {/* Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-xs text-slate-500">Tổng tài khoản cán sự</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">{generatedAccounts.length}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">Ban cán sự (LT, TK, BT)</div>
                  <div className="text-base font-bold text-emerald-700 dark:text-emerald-300">{cadreMainAccounts.length}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-center">
                  <div className="text-xs text-indigo-600 dark:text-indigo-400">Tổ trưởng 4 tổ</div>
                  <div className="text-base font-bold text-indigo-700 dark:text-indigo-300">{cadreGroupAccounts.length}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
                  <div className="text-xs text-amber-600 dark:text-amber-400">Bảo mật tài khoản</div>
                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 mt-1">Đổi MK khi ĐN đầu</div>
                </div>
              </div>

              {/* Accounts Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">STT</th>
                        <th className="py-2.5 px-3">Tài khoản (Username)</th>
                        <th className="py-2.5 px-3">Mật khẩu mặc định</th>
                        <th className="py-2.5 px-3">Họ và Tên Cán sự</th>
                        <th className="py-2.5 px-3">Chức vụ / Quyền hạn</th>
                        <th className="py-2.5 px-3 text-right">Sao chép</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {generatedAccounts.map((acc, idx) => (
                        <tr key={acc.username} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">
                            {acc.username}
                          </td>
                          <td className="py-2 px-3 font-mono text-cyan-700 dark:text-cyan-300 font-semibold">
                            {acc.passwordHash}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                            {acc.displayName}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                ['LT', 'TK', 'BT'].includes(acc.role)
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                              }`}
                            >
                              {acc.roleTitle}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() =>
                                copyAccountText(
                                  `Tài khoản: ${acc.username} | Mật khẩu: ${acc.passwordHash} | Họ tên: ${acc.displayName}`,
                                  acc.username
                                )
                              }
                              className="text-slate-400 hover:text-cyan-600 p-1 rounded cursor-pointer"
                              title="Sao chép thông tin tài khoản"
                            >
                              {copiedAccount === acc.username ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
          <div>
            {currentStep > 1 && currentStep < 6 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Quay lại bước {currentStep - 1}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep === 1 && (
              <button
                type="button"
                onClick={() => {
                  if (!className.trim()) {
                    onShowToast('Vui lòng nhập tên lớp!', 'error');
                    return;
                  }
                  setCurrentStep(2);
                }}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-600/20"
              >
                Tiếp tục (Bước 2)
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => {
                  if (studentsList.length === 0) {
                    handleLoadSampleStudents();
                  }
                  setCurrentStep(3);
                }}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-600/20"
              >
                Tiếp tục (Bước 3)
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={() => {
                  if (studentsList.length === 0) {
                    onShowToast('Vui lòng chọn file Excel hoặc nạp danh sách mẫu!', 'error');
                    return;
                  }
                  setCurrentStep(4);
                }}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-600/20"
              >
                Tiếp tục: Xác nhận danh sách (Bước 4)
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 4 && (
              <button
                type="button"
                onClick={handleGenerateAccountsAndProceed}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-600/20"
              >
                Tiếp tục: Chọn Ban cán sự (Bước 5)
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 5 && (
              <button
                type="button"
                onClick={handleFinalizeAccounts}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
              >
                Hoàn tất & Cấp tài khoản cán sự (Bước 6)
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}

            {currentStep === 6 && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                Đóng & Vào làm việc
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
