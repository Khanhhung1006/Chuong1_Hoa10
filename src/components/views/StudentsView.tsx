import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  LayoutGrid,
  List,
  Phone,
  Mail,
  MapPin,
  Heart,
  MoreVertical,
  Download,
  Upload,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Eye,
  ShieldCheck,
  AlertCircle,
  Award,
  Users,
  UserCheck,
  UserMinus,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Student, ClassSettings, UserAccount } from '../../types';
import { exportStudentsToExcel } from '../../services/exportService';
import { CadreAssignmentModal, CadreSelection } from '../common/CadreAssignmentModal';
import { StudentTransferModal, StudentTransferData } from '../common/StudentTransferModal';
import { authService } from '../../services/authService';
import { storageService } from '../../services/storageService';

interface StudentsViewProps {
  students: Student[];
  settings: ClassSettings;
  onOpenStudentDetail: (student: Student) => void;
  onOpenAddStudent: () => void;
  onOpenImportExcel: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string, name: string, transferData?: StudentTransferData) => void;
  onUpdateStudents?: (students: Student[]) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  currentUser?: UserAccount;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  settings,
  onOpenStudentDetail,
  onOpenAddStudent,
  onOpenImportExcel,
  onEditStudent,
  onDeleteStudent,
  onUpdateStudents,
  onShowToast,
  currentUser,
}) => {
  const [search, setSearch] = useState('');
  const [selectedGroupTab, setSelectedGroupTab] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [filterAttention, setFilterAttention] = useState<boolean>(false);
  const [filterCadresOnly, setFilterCadresOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'code' | 'dob' | 'group'>('name-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isCadreModalOpen, setIsCadreModalOpen] = useState(false);
  const [studentToTransfer, setStudentToTransfer] = useState<Student | null>(null);

  const cleanClass = settings.className.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || '11a1';

  // Cadres lookup
  const ltStudent = students.find((s) => s.roleInClass?.toLowerCase().includes('lớp trưởng') || s.roleInClass === 'LT');
  const tkStudent = students.find((s) => s.roleInClass?.toLowerCase().includes('thư ký') || s.roleInClass === 'TK');
  const btStudent = students.find((s) => s.roleInClass?.toLowerCase().includes('bí thư') || s.roleInClass === 'BT');
  const tt1Student = students.find((s) => (s.roleInClass?.toLowerCase().includes('tổ trưởng') && s.group === 1) || s.roleInClass === 'TT1');
  const tt2Student = students.find((s) => (s.roleInClass?.toLowerCase().includes('tổ trưởng') && s.group === 2) || s.roleInClass === 'TT2');
  const tt3Student = students.find((s) => (s.roleInClass?.toLowerCase().includes('tổ trưởng') && s.group === 3) || s.roleInClass === 'TT3');
  const tt4Student = students.find((s) => (s.roleInClass?.toLowerCase().includes('tổ trưởng') && s.group === 4) || s.roleInClass === 'TT4');

  const cadresCount = students.filter((s) => s.roleInClass && s.roleInClass.trim().length > 0).length;
  const boysCount = students.filter((s) => s.gender === 'Nam').length;
  const girlsCount = students.filter((s) => s.gender === 'Nữ').length;
  const attentionCount = students.filter((s) => s.specialAttention).length;

  const groupCounts = {
    g1: students.filter((s) => s.group === 1).length,
    g2: students.filter((s) => s.group === 2).length,
    g3: students.filter((s) => s.group === 3).length,
    g4: students.filter((s) => s.group === 4).length,
  };

  const userGroup = currentUser?.group || (currentUser?.role?.startsWith('TT') ? parseInt(currentUser.role.replace('TT', ''), 10) : undefined);

  useEffect(() => {
    if (userGroup) {
      setSelectedGroupTab(userGroup.toString());
    }
  }, [userGroup]);

  // Filter & sort
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const matchesSearch =
          s.fullName.toLowerCase().includes(search.toLowerCase()) ||
          s.code.toLowerCase().includes(search.toLowerCase()) ||
          s.parentPhone.includes(search) ||
          s.address.toLowerCase().includes(search.toLowerCase());

        const matchesGroup = userGroup
          ? s.group === userGroup
          : selectedGroupTab === 'all'
          ? true
          : selectedGroupTab === 'cadres'
          ? Boolean(s.roleInClass && s.roleInClass.trim().length > 0)
          : s.group.toString() === selectedGroupTab;

        const matchesGender =
          selectedGender === 'all' || s.gender === selectedGender;

        const matchesAttention = !filterAttention || s.specialAttention;
        const matchesCadres = !filterCadresOnly || Boolean(s.roleInClass && s.roleInClass.trim().length > 0);

        return matchesSearch && matchesGroup && matchesGender && matchesAttention && matchesCadres;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') {
          const aLastName = a.fullName.split(' ').pop() || '';
          const bLastName = b.fullName.split(' ').pop() || '';
          return aLastName.localeCompare(bLastName, 'vi');
        }
        if (sortBy === 'name-desc') {
          const aLastName = a.fullName.split(' ').pop() || '';
          const bLastName = b.fullName.split(' ').pop() || '';
          return bLastName.localeCompare(aLastName, 'vi');
        }
        if (sortBy === 'code') {
          return a.code.localeCompare(b.code);
        }
        if (sortBy === 'dob') {
          return a.dob.localeCompare(b.dob);
        }
        if (sortBy === 'group') {
          return a.group - b.group;
        }
        return 0;
      });
  }, [students, search, selectedGroupTab, selectedGender, filterAttention, filterCadresOnly, sortBy]);

  // Handle Cadre Assignment Save
  const handleSaveCadres = (selection: CadreSelection) => {
    const updatedList = students.map((s) => {
      let newRole: string | undefined = undefined;
      let newGroup = s.group;

      if (s.id === selection.lt) newRole = 'Lớp trưởng';
      else if (s.id === selection.tk) newRole = 'Thư ký lớp';
      else if (s.id === selection.bt) newRole = 'Bí thư Chi đoàn';
      else if (s.id === selection.tt1) {
        newRole = 'Tổ trưởng';
        newGroup = 1;
      } else if (s.id === selection.tt2) {
        newRole = 'Tổ trưởng';
        newGroup = 2;
      } else if (s.id === selection.tt3) {
        newRole = 'Tổ trưởng';
        newGroup = 3;
      } else if (s.id === selection.tt4) {
        newRole = 'Tổ trưởng';
        newGroup = 4;
      }

      return {
        ...s,
        roleInClass: newRole,
        group: newGroup,
      };
    });

    // Sync user accounts in authService
    authService.updateClassCadres({
      className: settings.className,
      academicYear: settings.academicYear,
      cadres: selection,
      students: updatedList,
      performedBy: currentUser?.username || 'GVCN',
    });

    // Save student objects
    storageService.saveStudents(updatedList, settings.className);
    if (onUpdateStudents) {
      onUpdateStudents(updatedList);
    }

    if (onShowToast) {
      onShowToast(`Đã cập nhật phân công Ban cán sự lớp ${settings.className} và đồng bộ tài khoản tác vụ!`, 'success');
    }
  };

  // Handle Transfer / Delete confirmation
  const handleConfirmTransfer = (data: StudentTransferData) => {
    // Audit log
    const typeLabel =
      data.transferType === 'transfer_class'
        ? `Chuyển sang lớp ${data.targetDestination || 'khác'}`
        : data.transferType === 'transfer_school'
        ? `Chuyển sang trường ${data.targetDestination || 'khác'}`
        : data.transferType === 'drop_out'
        ? 'Nghỉ học / Thôi học'
        : 'Xóa do nhập nhầm hồ sơ';

    storageService.addAuditLog({
      username: currentUser?.username || 'GVCN',
      displayName: currentUser?.displayName || 'Giáo viên Chủ nhiệm',
      role: 'GVCN',
      roleTitle: 'Giáo viên Chủ nhiệm',
      action: 'DELETE',
      module: 'Quản lý Học sinh',
      details: `Đã xử lý xóa/chuyển học sinh ${data.studentName} (${data.studentCode}) khỏi lớp ${settings.className}. Lý do: ${typeLabel}${data.reasonNote ? ` - Ghi chú: ${data.reasonNote}` : ''}`,
    });

    onDeleteStudent(data.studentId, data.studentName, data);
    setStudentToTransfer(null);
  };

  return (
    <div id="students-view" className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 text-xs font-bold">
                Lớp {settings.className}
              </span>
              <span className="text-xs text-slate-400">• Năm học {settings.academicYear}</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-1">
              Danh Sách & Hồ Sơ Học Sinh
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý sĩ số, phân bổ 4 tổ học tập, hồ sơ cá nhân và phân công Ban cán sự lớp
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View toggle */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                id="view-mode-grid-btn"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Chế độ xem dạng thẻ"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                id="view-mode-table-btn"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Chế độ xem dạng bảng"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Cadre Assignment Button */}
            <button
              id="open-cadre-assignment-btn"
              onClick={() => setIsCadreModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Phân công hoặc thay đổi Lớp trưởng, Thư ký, Bí thư, Tổ trưởng"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Đổi Ban Cán Sự</span>
            </button>

            {/* Import Excel */}
            <button
              id="import-students-excel-btn"
              onClick={onOpenImportExcel}
              className="px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Nhập thêm học sinh từ file Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Nhập Excel</span>
            </button>

            {/* Export Excel */}
            <button
              id="export-students-excel-btn"
              onClick={() => exportStudentsToExcel(students, settings)}
              className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Xuất file Excel danh sách học sinh"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>

            {/* Add Student */}
            <button
              id="add-student-btn"
              onClick={onOpenAddStudent}
              className="px-4 py-2 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm học sinh</span>
            </button>
          </div>
        </div>

        {/* Metric Pill Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-medium">Tổng sĩ số</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {students.length} <span className="text-xs font-normal text-slate-400">học sinh</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-800/60">
            <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">Nam / Nữ</div>
            <div className="text-lg font-bold text-cyan-950 dark:text-cyan-100 mt-0.5">
              {boysCount} <span className="text-xs font-normal text-slate-400">Nam</span> • {girlsCount} <span className="text-xs font-normal text-slate-400">Nữ</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60">
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Ban cán sự & Tổ trưởng</div>
            <div className="text-lg font-bold text-indigo-950 dark:text-indigo-100 mt-0.5">
              {cadresCount} <span className="text-xs font-normal text-slate-400">em</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60">
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Cần quan tâm đặc biệt</div>
            <div className="text-lg font-bold text-amber-950 dark:text-amber-100 mt-0.5">
              {attentionCount} <span className="text-xs font-normal text-slate-400">học sinh</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Phân bổ 4 Tổ</div>
            <div className="text-xs font-bold text-emerald-950 dark:text-emerald-100 mt-1 flex items-center justify-between">
              <span>T1: {groupCounts.g1}</span>
              <span>T2: {groupCounts.g2}</span>
              <span>T3: {groupCounts.g3}</span>
              <span>T4: {groupCounts.g4}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cadre Team Summary Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display">Ban Cán Sự & Tổ Trưởng Lớp {settings.className}</h3>
              <p className="text-[11px] text-slate-300">Các học sinh có tài khoản tác vụ để điểm danh, nhập nề nếp và thi đua</p>
            </div>
          </div>

          <button
            onClick={() => setIsCadreModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-300" />
            <span>Phân công lại Cán sự</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-3">
          {/* Lớp trưởng */}
          <div className="bg-white/5 border border-white/10 p-2.5 rounded-2xl">
            <div className="text-[10px] text-emerald-300 font-bold flex items-center justify-between">
              <span>Lớp trưởng</span>
              <span className="font-mono text-[9px] text-slate-400">lt-{cleanClass}</span>
            </div>
            <div className="text-xs font-bold text-white mt-1 truncate">
              {ltStudent ? ltStudent.fullName : <span className="text-slate-400 italic">Chưa chỉ định</span>}
            </div>
          </div>

          {/* Thư ký */}
          <div className="bg-white/5 border border-white/10 p-2.5 rounded-2xl">
            <div className="text-[10px] text-emerald-300 font-bold flex items-center justify-between">
              <span>Thư ký</span>
              <span className="font-mono text-[9px] text-slate-400">tk-{cleanClass}</span>
            </div>
            <div className="text-xs font-bold text-white mt-1 truncate">
              {tkStudent ? tkStudent.fullName : <span className="text-slate-400 italic">Chưa chỉ định</span>}
            </div>
          </div>

          {/* Bí thư */}
          <div className="bg-white/5 border border-white/10 p-2.5 rounded-2xl">
            <div className="text-[10px] text-emerald-300 font-bold flex items-center justify-between">
              <span>Bí thư</span>
              <span className="font-mono text-[9px] text-slate-400">bt-{cleanClass}</span>
            </div>
            <div className="text-xs font-bold text-white mt-1 truncate">
              {btStudent ? btStudent.fullName : <span className="text-slate-400 italic">Chưa chỉ định</span>}
            </div>
          </div>

          {/* TT 1 */}
          <div className="bg-white/5 border border-white/10 p-2.5 rounded-2xl">
            <div className="text-[10px] text-cyan-300 font-bold flex items-center justify-between">
              <span>Tổ trưởng 1</span>
              <span className="font-mono text-[9px] text-slate-400">tt1-{cleanClass}</span>
            </div>
            <div className="text-xs font-bold text-white mt-1 truncate">
              {tt1Student ? tt1Student.fullName : <span className="text-slate-400 italic">Chưa chỉ định</span>}
            </div>
          </div>

          {/* TT 2 */}
          <div className="bg-white/5 border border-white/10 p-2.5 rounded-2xl">
            <div className="text-[10px] text-cyan-300 font-bold flex items-center justify-between">
              <span>Tổ trưởng 2</span>
              <span className="font-mono text-[9px] text-slate-400">tt2-{cleanClass}</span>
            </div>
            <div className="text-xs font-bold text-white mt-1 truncate">
              {tt2Student ? tt2Student.fullName : <span className="text-slate-400 italic">Chưa chỉ định</span>}
            </div>
          </div>

          {/* TT 3 */}
          <div className="bg-white/5 border border-white/10 p-2.5 rounded-2xl">
            <div className="text-[10px] text-cyan-300 font-bold flex items-center justify-between">
              <span>Tổ trưởng 3</span>
              <span className="font-mono text-[9px] text-slate-400">tt3-{cleanClass}</span>
            </div>
            <div className="text-xs font-bold text-white mt-1 truncate">
              {tt3Student ? tt3Student.fullName : <span className="text-slate-400 italic">Chưa chỉ định</span>}
            </div>
          </div>

          {/* TT 4 */}
          <div className="bg-white/5 border border-white/10 p-2.5 rounded-2xl">
            <div className="text-[10px] text-cyan-300 font-bold flex items-center justify-between">
              <span>Tổ trưởng 4</span>
              <span className="font-mono text-[9px] text-slate-400">tt4-{cleanClass}</span>
            </div>
            <div className="text-xs font-bold text-white mt-1 truncate">
              {tt4Student ? tt4Student.fullName : <span className="text-slate-400 italic">Chưa chỉ định</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="space-y-3">
        {/* Group Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl max-w-full overflow-x-auto">
          {userGroup ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-cyan-600 text-white font-bold text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <span>Giao diện Tổ trưởng Tổ {userGroup} • Danh sách {filteredStudents.length} học sinh</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setSelectedGroupTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedGroupTab === 'all'
                    ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tất cả ({students.length})
              </button>

              <button
                onClick={() => setSelectedGroupTab('1')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedGroupTab === '1'
                    ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tổ 1 ({groupCounts.g1})
              </button>

              <button
                onClick={() => setSelectedGroupTab('2')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedGroupTab === '2'
                    ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tổ 2 ({groupCounts.g2})
              </button>

              <button
                onClick={() => setSelectedGroupTab('3')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedGroupTab === '3'
                    ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tổ 3 ({groupCounts.g3})
              </button>

              <button
                onClick={() => setSelectedGroupTab('4')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedGroupTab === '4'
                    ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tổ 4 ({groupCounts.g4})
              </button>
            </>
          )}

          <button
            onClick={() => setSelectedGroupTab('cadres')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedGroupTab === 'cadres'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Ban cán sự ({cadresCount})
          </button>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="students-search-input"
              type="text"
              placeholder="Tìm theo tên, mã HS, SĐT phụ huynh, địa chỉ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 outline-hidden focus:border-cyan-500 shadow-xs"
            />
          </div>

          {/* Gender Filter */}
          <select
            id="filter-gender-select"
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 outline-hidden focus:border-cyan-500 shadow-xs"
          >
            <option value="all">Giới tính (Tất cả)</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>

          {/* Sort By */}
          <select
            id="sort-students-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 outline-hidden focus:border-cyan-500 shadow-xs"
          >
            <option value="name-asc">Tên học sinh (A - Z)</option>
            <option value="name-desc">Tên học sinh (Z - A)</option>
            <option value="group">Theo Tổ (1 → 4)</option>
            <option value="code">Mã học sinh</option>
            <option value="dob">Ngày sinh</option>
          </select>

          {/* Quick Attention Filter */}
          <button
            onClick={() => setFilterAttention(!filterAttention)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              filterAttention
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Cần quan tâm ({attentionCount})</span>
          </button>
        </div>
      </div>

      {/* Main Students Content */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-slate-400 text-sm font-medium">Không tìm thấy học sinh nào phù hợp bộ lọc.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student) => {
            const isCadre = Boolean(student.roleInClass && student.roleInClass.trim().length > 0);
            return (
              <div
                key={student.id}
                id={`student-card-${student.id}`}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
                  isCadre
                    ? 'border-indigo-200/80 dark:border-indigo-800/80 bg-gradient-to-b from-indigo-50/20 to-white dark:from-indigo-950/20 dark:to-slate-900'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Card Top: Avatar, name, code, badges */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-1.5 py-0.5 rounded">
                          {student.code}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          Tổ {student.group}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-1">
                        {student.fullName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {student.gender} • {student.dob}
                      </p>
                    </div>
                  </div>

                  {/* Role and Attention Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {student.roleInClass ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        <Award className="w-3 h-3" />
                        {student.roleInClass}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 px-1.5 py-0.5">
                        Học sinh
                      </span>
                    )}

                    {student.specialAttention && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <AlertCircle className="w-3 h-3" />
                        Cần quan tâm
                      </span>
                    )}
                  </div>

                  {/* Contact info snippets */}
                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 mb-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3 h-3 text-cyan-600 shrink-0" />
                      <span>PH: <strong className="text-slate-800 dark:text-slate-200">{student.parentPhone}</strong></span>
                    </div>
                    {student.address && (
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{student.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => onOpenStudentDetail(student)}
                    className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700 font-bold transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Chi tiết
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditStudent(student)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Chỉnh sửa hồ sơ"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setStudentToTransfer(student)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Chuyển lớp hoặc xóa học sinh"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Học sinh</th>
                  <th className="py-3.5 px-4">Mã số</th>
                  <th className="py-3.5 px-4">Tổ</th>
                  <th className="py-3.5 px-4">Chức vụ cán sự</th>
                  <th className="py-3.5 px-4">Ngày sinh</th>
                  <th className="py-3.5 px-4">SĐT Phụ huynh</th>
                  <th className="py-3.5 px-4">Hoàn cảnh</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {s.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400">{s.gender}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-cyan-600">{s.code}</td>
                    <td className="py-3 px-4 font-medium">Tổ {s.group}</td>
                    <td className="py-3 px-4">
                      {s.roleInClass ? (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold">
                          {s.roleInClass}
                        </span>
                      ) : (
                        <span className="text-slate-400">Học sinh</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{s.dob}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {s.parentPhone}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                          s.familyCircumstance === 'Bình thường' || !s.familyCircumstance
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                        }`}
                      >
                        {s.familyCircumstance || 'Bình thường'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpenStudentDetail(s)}
                          className="p-1.5 rounded-lg text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 transition-colors cursor-pointer"
                          title="Chi tiết hồ sơ"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditStudent(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStudentToTransfer(s)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="Chuyển lớp / Xóa"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cadre Assignment Modal */}
      <CadreAssignmentModal
        isOpen={isCadreModalOpen}
        onClose={() => setIsCadreModalOpen(false)}
        students={students}
        className={settings.className}
        academicYear={settings.academicYear}
        onSaveCadres={handleSaveCadres}
      />

      {/* Student Transfer / Removal Modal */}
      <StudentTransferModal
        isOpen={Boolean(studentToTransfer)}
        onClose={() => setStudentToTransfer(null)}
        student={studentToTransfer}
        currentClassName={settings.className}
        onConfirm={handleConfirmTransfer}
      />
    </div>
  );
};
