import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  UserX,
  AlertCircle,
  FileCheck2,
  Save,
  Check,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Lock,
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus, ClassSettings, UserAccount } from '../../types';

interface AttendanceViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  settings: ClassSettings;
  onSaveAttendance: (records: AttendanceRecord[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  currentUserGroup?: number;
  currentUser?: UserAccount;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  attendance,
  settings,
  onSaveAttendance,
  onShowToast,
  currentUserGroup,
  currentUser,
}) => {
  const defaultGroup = currentUserGroup || currentUser?.group || (currentUser?.role?.startsWith('TT') ? parseInt(currentUser.role.replace('TT', ''), 10) : undefined);
  const isTeacher = currentUser?.role === 'GVCN' || currentUser?.role === 'ADMIN';
  const isLocked = settings.isLockedData && !isTeacher;

  const [selectedDate, setSelectedDate] = useState('2026-09-14');
  const [session, setSession] = useState<'Sáng' | 'Chiều'>(settings.defaultSession || 'Sáng');
  const [period, setPeriod] = useState<number>(0); // 0: Cả buổi, 1-5: Tiết cụ thể
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>(
    defaultGroup ? defaultGroup.toString() : 'all'
  );

  React.useEffect(() => {
    if (settings.defaultSession) {
      setSession(settings.defaultSession);
    }
  }, [settings.defaultSession]);

  React.useEffect(() => {
    if (defaultGroup) {
      setActiveGroupFilter(defaultGroup.toString());
    }
  }, [defaultGroup]);

  const effectiveGroupFilter = defaultGroup ? defaultGroup.toString() : activeGroupFilter;

  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) => effectiveGroupFilter === 'all' || s.group.toString() === effectiveGroupFilter
    );
  }, [students, effectiveGroupFilter]);

  // Map studentId -> AttendanceRecord for current date/session/period
  const currentRecordsMap = React.useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendance
      .filter(
        (a) =>
          a.date === selectedDate &&
          a.session === session &&
          a.period === period
      )
      .forEach((rec) => {
        map.set(rec.studentId, rec);
      });
    return map;
  }, [attendance, selectedDate, session, period]);

  // Local state for edits
  const [statusMap, setStatusMap] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});

  // Sync with current records
  React.useEffect(() => {
    const initial: Record<string, { status: AttendanceStatus; note: string }> = {};
    students.forEach((s) => {
      const existing = currentRecordsMap.get(s.id);
      if (existing) {
        initial[s.id] = { status: existing.status, note: existing.note || '' };
      } else {
        // default to present
        initial[s.id] = { status: 'present', note: '' };
      }
    });
    setStatusMap(initial);
  }, [students, currentRecordsMap]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    if (isLocked) {
      onShowToast('Dữ liệu đã bị GVCN khóa, không thể chỉnh sửa!', 'error');
      return;
    }
    const next: Record<string, { status: AttendanceStatus; note: string }> = { ...statusMap };
    filteredStudents.forEach((s) => {
      next[s.id] = { status: 'present', note: statusMap[s.id]?.note || '' };
    });
    setStatusMap(next);
    onShowToast(
      defaultGroup
        ? `Đã đánh dấu tất cả học sinh Tổ ${defaultGroup} CÓ MẶT!`
        : 'Đã đánh dấu tất cả học sinh CÓ MẶT!',
      'info'
    );
  };

  // Save changes
  const handleSave = () => {
    if (isLocked) {
      onShowToast('Dữ liệu đã bị GVCN khóa, không thể chỉnh sửa!', 'error');
      return;
    }
    const newRecords: AttendanceRecord[] = [];
    const targetStudents = defaultGroup ? filteredStudents : students;
    const targetStudentIds = new Set(targetStudents.map((s) => s.id));

    // Keep other records not matching this date/session/period AND target students
    const otherRecords = attendance.filter(
      (a) =>
        !(
          a.date === selectedDate &&
          a.session === session &&
          a.period === period &&
          targetStudentIds.has(a.studentId)
        )
    );

    targetStudents.forEach((s) => {
      const current = statusMap[s.id];
      if (current) {
        newRecords.push({
          id: `att-${selectedDate}-${session}-${period}-${s.id}`,
          date: selectedDate,
          session,
          period,
          studentId: s.id,
          status: current.status,
          note: current.note,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    onSaveAttendance([...otherRecords, ...newRecords]);
    if (defaultGroup) {
      onShowToast(`Đã lưu / gửi điểm danh Tổ ${defaultGroup}!`, 'success');
    } else {
      onShowToast('Đã lưu dữ liệu điểm danh thành công!', 'success');
    }
  };

  // Stats calculation based on filtered group
  const totalStudents = filteredStudents.length;
  const presentCount = filteredStudents.filter((s) => statusMap[s.id]?.status === 'present').length;
  const excusedCount = filteredStudents.filter((s) => statusMap[s.id]?.status === 'absent_excused').length;
  const unexcusedCount = filteredStudents.filter((s) => statusMap[s.id]?.status === 'absent_unexcused').length;
  const lateUnder5Count = filteredStudents.filter((s) => statusMap[s.id]?.status === 'late_under_5').length;
  const lateOver5Count = filteredStudents.filter((s) => statusMap[s.id]?.status === 'late_over_5').length;
  const truantCount = filteredStudents.filter((s) => statusMap[s.id]?.status === 'truant').length;

  return (
    <div id="attendance-view" className="space-y-6">
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
              Thầy/Cô chủ nhiệm đã khóa dữ liệu điểm danh và hoạt động. Hiện tại, Cán sự lớp và học sinh chỉ có quyền xem, toàn bộ tính năng chỉnh sửa đã bị khóa để bảo toàn dữ liệu.
            </p>
          </div>
        </div>
      )}

      {/* Top Header Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            Sổ Điểm Danh Lớp {settings.className}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi nhận chuyên cần từng tiết, buổi học và thống kê nề nếp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="mark-all-present-btn"
            onClick={handleMarkAllPresent}
            disabled={isLocked}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              isLocked
                ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Tất cả có mặt
          </button>

          <button
            id="save-attendance-btn"
            onClick={handleSave}
            disabled={isLocked}
            className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-1.5 ${
              isLocked
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-700 shadow-md shadow-cyan-600/20 cursor-pointer'
            }`}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Save className="w-4 h-4" />}
            Lưu điểm danh
          </button>
        </div>
      </div>

      {/* Date & Period Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Date input */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <CalendarIcon className="w-4 h-4 text-cyan-600" />
          <input
            id="attendance-date-input"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-bold bg-transparent text-slate-800 dark:text-slate-100 outline-hidden w-full cursor-pointer"
          />
        </div>

        {/* Session (Sáng / Chiều) */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            id="session-morning-btn"
            onClick={() => setSession('Sáng')}
            className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
              session === 'Sáng'
                ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Buổi Sáng
          </button>
          <button
            id="session-afternoon-btn"
            onClick={() => setSession('Chiều')}
            className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
              session === 'Chiều'
                ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Buổi Chiều
          </button>
        </div>

        {/* Period (Tiết 0: cả buổi, 1..5) */}
        <select
          id="period-select"
          value={period}
          onChange={(e) => setPeriod(parseInt(e.target.value, 10))}
          className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-200 outline-hidden focus:border-cyan-500"
        >
          <option value={0}>Toàn bộ buổi học</option>
          <option value={1}>Tiết 1</option>
          <option value={2}>Tiết 2</option>
          <option value={3}>Tiết 3</option>
          <option value={4}>Tiết 4</option>
          <option value={5}>Tiết 5</option>
        </select>

        {/* Filter by Group */}
        {defaultGroup ? (
          <div className="px-3.5 py-2 text-xs font-bold bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 rounded-2xl text-cyan-800 dark:text-cyan-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
            <span>Tổ trưởng: Quản lý Tổ {defaultGroup}</span>
          </div>
        ) : (
          <select
            id="group-filter-select"
            value={activeGroupFilter}
            onChange={(e) => setActiveGroupFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-200 outline-hidden focus:border-cyan-500"
          >
            <option value="all">Xem tất cả các tổ</option>
            <option value="1">Chỉ Tổ 1</option>
            <option value="2">Chỉ Tổ 2</option>
            <option value="3">Chỉ Tổ 3</option>
            <option value="4">Chỉ Tổ 4</option>
          </select>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-center">
          <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Đúng giờ</div>
          <div className="text-xl font-black text-emerald-600 font-display mt-0.5">
            {presentCount} / {totalStudents}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-900/40 text-center">
          <div className="text-[11px] font-bold text-cyan-800 dark:text-cyan-300">Có phép (P)</div>
          <div className="text-xl font-black text-cyan-600 font-display mt-0.5">{excusedCount}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-center">
          <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300">Không phép (K)</div>
          <div className="text-xl font-black text-rose-600 font-display mt-0.5">{unexcusedCount}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-center">
          <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Muộn {'<'} 5p</div>
          <div className="text-xl font-black text-amber-600 font-display mt-0.5">{lateUnder5Count}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40 text-center col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-orange-800 dark:text-orange-300">Muộn {'>='} 5p</div>
          <div className="text-xl font-black text-orange-600 font-display mt-0.5">{lateOver5Count}</div>
        </div>
      </div>

      {/* Attendance List: Desktop Table + Mobile Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Mobile View: High-Touch Student Attendance Cards */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-3">
          {filteredStudents.map((st, idx) => {
            const current = statusMap[st.id] || { status: 'present', note: '' };

            return (
              <div
                key={st.id}
                className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5"
              >
                {/* Student Info Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {st.fullName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {st.code} • Tổ {st.group}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      current.status === 'present'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : current.status === 'absent_excused'
                        ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300'
                        : current.status === 'absent_unexcused'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : current.status === 'late_under_5'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : current.status === 'late_over_5'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                    }`}
                  >
                    {current.status === 'present'
                      ? 'Đúng giờ'
                      : current.status === 'absent_excused'
                      ? 'Có phép'
                      : current.status === 'absent_unexcused'
                      ? 'Không phép'
                      : current.status === 'late_under_5'
                      ? 'Muộn < 5p'
                      : current.status === 'late_over_5'
                      ? 'Muộn >= 5p'
                      : ''}
                  </span>
                </div>

                {/* Big Thumb-Friendly Status Buttons */}
                <div className="grid grid-cols-5 gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(st.id, 'present')}
                    className={`py-2 rounded-xl font-bold transition-all text-center text-[10px] min-h-[36px] flex items-center justify-center cursor-pointer ${
                      current.status === 'present'
                        ? 'bg-emerald-500 text-white shadow-xs font-black'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Đúng giờ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(st.id, 'absent_excused')}
                    className={`py-2 rounded-xl font-bold transition-all text-center text-[10px] min-h-[36px] flex items-center justify-center cursor-pointer ${
                      current.status === 'absent_excused'
                        ? 'bg-cyan-500 text-white shadow-xs font-black'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Phép
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(st.id, 'absent_unexcused')}
                    className={`py-2 rounded-xl font-bold transition-all text-center text-[10px] min-h-[36px] flex items-center justify-center cursor-pointer ${
                      current.status === 'absent_unexcused'
                        ? 'bg-rose-500 text-white shadow-xs font-black'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    K.Phép
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(st.id, 'late_under_5')}
                    className={`py-2 rounded-xl font-bold transition-all text-center text-[10px] min-h-[36px] flex items-center justify-center cursor-pointer ${
                      current.status === 'late_under_5'
                        ? 'bg-amber-500 text-white shadow-xs font-black'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    M {'<'} 5p
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(st.id, 'late_over_5')}
                    className={`py-2 rounded-xl font-bold transition-all text-center text-[10px] min-h-[36px] flex items-center justify-center cursor-pointer ${
                      current.status === 'late_over_5'
                        ? 'bg-orange-500 text-white shadow-xs font-black'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    M {'>='} 5p
                  </button>
                </div>

                {/* Optional Note input */}
                <input
                  type="text"
                  placeholder="Ghi chú lý do nếu vắng/muộn..."
                  value={current.note}
                  onChange={(e) => handleNoteChange(st.id, e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-hidden focus:border-cyan-500"
                />
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4 w-12">STT</th>
                <th className="py-3 px-4">Học sinh</th>
                <th className="py-3 px-4">Tổ</th>
                <th className="py-3 px-4">Trạng thái chuyên cần</th>
                <th className="py-3 px-4">Lý do / Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((st, idx) => {
                const current = statusMap[st.id] || { status: 'present', note: '' };

                return (
                  <tr
                    key={st.id}
                    className="hover:bg-cyan-50/30 dark:hover:bg-cyan-950/10 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {st.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{st.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      Tổ {st.group}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id, 'present')}
                          className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer text-[11px] ${
                            current.status === 'present'
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          Đúng giờ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id, 'absent_excused')}
                          className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer text-[11px] ${
                            current.status === 'absent_excused'
                              ? 'bg-cyan-500 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          Có phép
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id, 'absent_unexcused')}
                          className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer text-[11px] ${
                            current.status === 'absent_unexcused'
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          Không phép
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id, 'late_under_5')}
                          className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer text-[11px] ${
                            current.status === 'late_under_5'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          Muộn {'<'} 5p
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id, 'late_over_5')}
                          className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer text-[11px] ${
                            current.status === 'late_over_5'
                              ? 'bg-orange-500 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          Muộn {'>='} 5p
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="Nhập ghi chú / lý do nếu có..."
                        value={current.note}
                        onChange={(e) => handleNoteChange(st.id, e.target.value)}
                        className="w-full max-w-xs px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-hidden focus:border-cyan-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
