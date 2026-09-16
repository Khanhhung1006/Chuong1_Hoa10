import React, { useState, useMemo, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  Slash,
  Users,
  Calendar as CalendarIcon,
  Search,
  Save,
  AlertTriangle,
  Filter,
  Check,
  Info,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  Student,
  PhoneRecord,
  PhoneStatus,
  ClassSettings,
  UserAccount,
  ViolationRecord,
} from '../../types';
import { NavTab } from '../common/Sidebar';

interface PhoneManagementViewProps {
  students: Student[];
  phoneRecords: PhoneRecord[];
  settings: ClassSettings;
  onSavePhoneRecords: (records: PhoneRecord[]) => void;
  onAddViolation?: (v: ViolationRecord) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
  currentUserGroup?: number;
  currentUser?: UserAccount;
  onNavigate?: (tab: NavTab) => void;
}

export const PhoneManagementView: React.FC<PhoneManagementViewProps> = ({
  students,
  phoneRecords,
  settings,
  onSavePhoneRecords,
  onAddViolation,
  onShowToast,
  currentUserGroup,
  currentUser,
  onNavigate,
}) => {
  const defaultGroup = currentUserGroup || currentUser?.group || (currentUser?.role?.startsWith('TT') ? parseInt(currentUser.role.replace('TT', ''), 10) : undefined);
  const isTeacher = currentUser?.role === 'GVCN' || currentUser?.role === 'ADMIN';
  const isLocked = settings.isLockedData && !isTeacher;

  const [selectedDate, setSelectedDate] = useState('2026-09-14');
  const [session, setSession] = useState<'Sáng' | 'Chiều'>(settings.defaultSession || 'Sáng');
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>(
    defaultGroup ? defaultGroup.toString() : 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | PhoneStatus>('all');

  useEffect(() => {
    if (settings.defaultSession) {
      setSession(settings.defaultSession);
    }
  }, [settings.defaultSession]);

  useEffect(() => {
    if (defaultGroup) {
      setActiveGroupFilter(defaultGroup.toString());
    }
  }, [defaultGroup]);

  const effectiveGroupFilter = defaultGroup ? defaultGroup.toString() : activeGroupFilter;

  // Filter students by search & group
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchGroup = effectiveGroupFilter === 'all' || s.group.toString() === effectiveGroupFilter;
      const matchSearch =
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [students, effectiveGroupFilter, searchQuery]);

  // Current records map for selectedDate and session
  const currentRecordsMap = useMemo(() => {
    const map = new Map<string, PhoneRecord>();
    phoneRecords
      .filter((p) => p.date === selectedDate && (p.session || 'Sáng') === session)
      .forEach((p) => map.set(p.studentId, p));
    return map;
  }, [phoneRecords, selectedDate, session]);

  // Local editable state map: studentId -> { status, note }
  const [phoneMap, setPhoneMap] = useState<Record<string, { status: PhoneStatus; note: string }>>({});

  // Sync with current records whenever date, session, students, or phoneRecords change
  useEffect(() => {
    const initial: Record<string, { status: PhoneStatus; note: string }> = {};
    students.forEach((s) => {
      const existing = currentRecordsMap.get(s.id);
      if (existing) {
        initial[s.id] = { status: existing.status, note: existing.note || '' };
      } else {
        // Default to 'submitted' (Đã nộp)
        const isExempted = settings.exemptedPhoneStudentIds?.includes(s.id);
        initial[s.id] = { 
          status: isExempted ? 'not_brought' : 'submitted', 
          note: isExempted ? 'Được miễn nộp điện thoại' : '' 
        };
      }
    });
    setPhoneMap(initial);
  }, [students, selectedDate, session, phoneRecords, settings.exemptedPhoneStudentIds]);

  const handleStatusChange = (studentId: string, status: PhoneStatus) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    setPhoneMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        note: `Thời gian TT xác nhận: ${timeStr}`,
      },
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setPhoneMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
  };

  // Quick Batch Actions
  const handleMarkAll = (status: PhoneStatus) => {
    if (isLocked) {
      onShowToast('Dữ liệu đã bị GVCN khóa, không thể chỉnh sửa!', 'error');
      return;
    }
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    setPhoneMap((prev) => {
      const next = { ...prev };
      filteredStudents.forEach((s) => {
        // Do not change status for exempted students on batch mark
        if (settings.exemptedPhoneStudentIds?.includes(s.id)) {
          return;
        }
        next[s.id] = {
          status,
          note: `Thời gian TT xác nhận: ${timeStr}`,
        };
      });
      return next;
    });
    const labelMap: Record<PhoneStatus, string> = {
      submitted: 'Đã nộp',
      not_submitted: 'Không nộp',
      not_brought: 'Không mang',
    };
    onShowToast(`Đã chuyển trạng thái tất cả học sinh hiển thị sang "${labelMap[status]}"`, 'info');
  };

  // Metrics for filtered students
  const metrics = useMemo(() => {
    let submitted = 0;
    let notSubmitted = 0;
    let notBrought = 0;

    filteredStudents.forEach((s) => {
      const item = phoneMap[s.id];
      if (item) {
        if (item.status === 'submitted') submitted++;
        else if (item.status === 'not_submitted') notSubmitted++;
        else if (item.status === 'not_brought') notBrought++;
      }
    });

    return {
      total: filteredStudents.length,
      submitted,
      notSubmitted,
      notBrought,
    };
  }, [filteredStudents, phoneMap]);

  // Save changes
  const handleSave = () => {
    if (isLocked) {
      onShowToast('Dữ liệu đã bị GVCN khóa, không thể chỉnh sửa!', 'error');
      return;
    }
    const recordsToSave: PhoneRecord[] = Object.entries(phoneMap).map(([studentId, data]) => {
      const item = data as { status: PhoneStatus; note: string };
      return {
        id: `phone-${selectedDate}-${session}-${studentId}`,
        date: selectedDate,
        session,
        studentId,
        status: item.status,
        note: item.note,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.displayName || 'Cán sự',
      };
    });

    onSavePhoneRecords(recordsToSave);
  };

  // Auto create violations for "not_submitted"
  const handleAutoCreateViolations = () => {
    if (isLocked) {
      onShowToast('Dữ liệu đã bị GVCN khóa, không thể chỉnh sửa!', 'error');
      return;
    }
    const violatingStudents = filteredStudents.filter(
      (s) => phoneMap[s.id]?.status === 'not_submitted'
    );

    if (violatingStudents.length === 0) {
      onShowToast('Không có học sinh nào ở trạng thái "Không nộp" để tạo biên bản vi phạm.', 'info');
      return;
    }

    if (!onAddViolation) {
      onShowToast('Chức năng ghi vi phạm không sẵn sàng.', 'error');
      return;
    }

    violatingStudents.forEach((s) => {
      const vRecord: ViolationRecord = {
        id: `v-phone-${Date.now()}-${s.id}`,
        date: selectedDate,
        studentId: s.id,
        content: `Vi phạm quy định sử dụng điện thoại: Không nộp điện thoại di động đầu giờ học (${session})`,
        severity: 'Nhẹ',
        penaltyPoints: 5,
        reporter: currentUser?.displayName || 'Cán sự cờ đỏ',
        status: 'Đã xử lý',
      };
      onAddViolation(vRecord);
    });

    onShowToast(`Đã tự động tạo ${violatingStudents.length} biên bản vi phạm trừ 5đ thi đua!`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Quick Action Switcher for Group Leader (Tổ trưởng) */}
      {onNavigate && (
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 pl-2">Thao tác nhanh:</span>
          <button
            type="button"
            onClick={() => onNavigate('phones')}
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-cyan-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Quản lí điện thoại
          </button>
          <button
            type="button"
            onClick={() => onNavigate('uniformCheck')}
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Kiểm tra đồng phục
          </button>
        </div>
      )}

      {isLocked && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 p-4 rounded-3xl flex items-start gap-3 shadow-xs">
          <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300">
            <Lock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-red-950 dark:text-red-200">
              Dữ liệu lớp học đã bị GVCN khóa
            </h4>
            <p className="text-[11px] text-red-700/80 dark:text-red-300/80 mt-0.5 leading-relaxed">
              Thầy/Cô chủ nhiệm đã khóa dữ liệu nộp điện thoại. Hiện tại, Cán sự lớp và học sinh chỉ có quyền xem báo cáo, toàn bộ tính năng chỉnh sửa trạng thái đã bị tạm khóa để lưu giữ dữ liệu an toàn.
            </p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-300 text-xs font-semibold mb-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Quản lý Nộp Điện thoại Di động</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Báo cáo Thu Nộp Điện Thoại Học Sinh
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Kiểm tra, ghi nhận và quản lý tình trạng thu nộp điện thoại di động đầu buổi học. Tự động nhắc nhở và tạo biên bản thi đua đối với học sinh cố tình giữ điện thoại.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleSave}
              disabled={isLocked}
              className={`px-4 py-2.5 font-semibold rounded-xl text-white transition-all text-xs sm:text-sm flex items-center gap-2 ${
                isLocked
                  ? 'bg-slate-700 text-slate-500 border border-slate-600/50 cursor-not-allowed opacity-50'
                  : 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 shadow-lg shadow-cyan-600/30 cursor-pointer'
              }`}
            >
              {isLocked ? <Lock className="w-4 h-4 text-slate-500" /> : <Save className="w-4 h-4" />}
              <span>Lưu Dữ Liệu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date & Session Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Date & Session */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <CalendarIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400 ml-1" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSession('Sáng')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  session === 'Sáng'
                    ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Buổi Sáng
              </button>
              <button
                type="button"
                onClick={() => setSession('Chiều')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  session === 'Chiều'
                    ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Buổi Chiều
              </button>
            </div>

            {/* Group selector if not restricted */}
            {!defaultGroup && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 text-[11px] px-2 font-medium">Tổ:</span>
                {['all', '1', '2', '3', '4'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setActiveGroupFilter(g)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all text-xs cursor-pointer ${
                      activeGroupFilter === g
                        ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {g === 'all' ? 'Tất cả' : `Tổ ${g}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search box */}
          <div className="relative w-full lg:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên học sinh..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Quick Batch Actions */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-semibold text-[11px]">Thao tác nhanh:</span>
            <button
              type="button"
              onClick={() => handleMarkAll('submitted')}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Đánh dấu tất cả Đã nộp
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('not_brought')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Slash className="w-3.5 h-3.5 text-slate-500" />
              Đánh dấu tất cả Không mang
            </button>
          </div>

          {metrics.notSubmitted > 0 && onAddViolation && (
            <button
              type="button"
              onClick={handleAutoCreateViolations}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm cursor-pointer transition-all shrink-0"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Ghi vi phạm cho {metrics.notSubmitted} em Không nộp (-5đ)
            </button>
          )}
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Sĩ số hiển thị</span>
            <Users className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {metrics.total} <span className="text-xs text-slate-400 font-normal">học sinh</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'submitted' ? 'all' : 'submitted')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'submitted'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <span>📱 Đã nộp</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {metrics.submitted}{' '}
            <span className="text-xs text-emerald-500/80 font-normal">
              ({metrics.total ? Math.round((metrics.submitted / metrics.total) * 100) : 0}%)
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'not_submitted' ? 'all' : 'not_submitted')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'not_submitted'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-rose-700 dark:text-rose-300">
            <span>❌ Không nộp</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {metrics.notSubmitted}{' '}
            <span className="text-xs text-rose-500/80 font-normal">
              ({metrics.total ? Math.round((metrics.notSubmitted / metrics.total) * 100) : 0}%)
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'not_brought' ? 'all' : 'not_brought')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'not_brought'
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 ring-2 ring-slate-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>🚫 Không mang</span>
            <Slash className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-2">
            {metrics.notBrought}{' '}
            <span className="text-xs text-slate-400 font-normal">
              ({metrics.total ? Math.round((metrics.notBrought / metrics.total) * 100) : 0}%)
            </span>
          </div>
        </button>
      </div>

      {/* Student List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-600" />
            <span>Danh Sách Học Sinh Nộp Điện Thoại</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {filteredStudents.length} em
            </span>
          </div>

          {statusFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
            >
              Xem tất cả
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Không tìm thấy học sinh phù hợp với bộ lọc.
            </div>
          ) : (
            filteredStudents
              .filter((s) => statusFilter === 'all' || phoneMap[s.id]?.status === statusFilter)
              .map((student, index) => {
                const currentStatus = phoneMap[student.id]?.status || 'submitted';
                const currentNote = phoneMap[student.id]?.note || '';

                return (
                  <div
                    key={student.id}
                    className={`p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                      currentStatus === 'not_submitted'
                        ? 'bg-rose-50/40 dark:bg-rose-950/20'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Student Info */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-6 text-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                        {student.fullName.slice(-2)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{student.fullName}</span>
                          <span className="px-2 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold">
                            Tổ {student.group}
                          </span>
                          {student.roleInClass && student.roleInClass !== 'Học sinh' && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 text-[10px] font-semibold">
                              {student.roleInClass}
                            </span>
                          )}
                          {settings.exemptedPhoneStudentIds?.includes(student.id) && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-850 dark:text-amber-300 text-[10px] font-semibold flex items-center gap-1 border border-amber-200 dark:border-amber-800 animate-pulse">
                              <Smartphone className="w-2.5 h-2.5" />
                              Miễn nộp máy
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Buttons & Note Input */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* Submitted */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'submitted')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                            currentStatus === 'submitted'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã nộp</span>
                        </button>

                        {/* Not Submitted */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'not_submitted')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                            currentStatus === 'not_submitted'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs animate-pulse'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Không nộp</span>
                        </button>

                        {/* Not Brought */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'not_brought')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                            currentStatus === 'not_brought'
                              ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Slash className="w-3.5 h-3.5" />
                          <span>Không mang</span>
                        </button>
                      </div>

                      {/* Note Input */}
                      <input
                        type="text"
                        value={currentNote}
                        onChange={(e) => handleNoteChange(student.id, e.target.value)}
                        placeholder="Thời gian TT xác nhận..."
                        className="w-full sm:w-48 text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Footer save bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-cyan-600" />
            <span>Mọi dữ liệu thay đổi sẽ được đồng bộ và sao lưu theo sổ lớp.</span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Báo Cáo Nộp Điện Thoại</span>
          </button>
        </div>
      </div>
    </div>
  );
};
