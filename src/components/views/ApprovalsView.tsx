import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Calendar,
  Users,
  UserCheck,
  ShieldCheck,
  Filter,
  Check,
  X,
  Trash2,
  ChevronRight,
  Eye,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  PendingApprovalItem,
  UserAccount,
  AttendanceRecord,
  ViolationRecord,
  RewardRecord,
  Student,
  ClassSettings,
} from '../../types';
import { authService } from '../../services/authService';
import { Settings } from 'lucide-react';

interface ApprovalsViewProps {
  currentUser: UserAccount;
  approvals: PendingApprovalItem[];
  students: Student[];
  settings?: ClassSettings;
  onNavigateToSettings?: () => void;
  onApproveItem: (item: PendingApprovalItem) => void;
  onRejectItem: (id: string, reason?: string) => void;
  onApproveAll: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
}

const formatAttendanceStatusVi = (status: string) => {
  switch (status) {
    case 'present':
    case 'Đúng giờ':
    case 'Có mặt':
      return 'Có mặt';
    case 'absent_excused':
    case 'Nghỉ có phép':
      return 'Nghỉ có phép';
    case 'absent_unexcused':
    case 'Nghỉ không phép':
      return 'Nghỉ không phép';
    case 'late_under_5':
    case 'Muộn < 5 phút':
      return 'Đi muộn < 5 phút';
    case 'late_over_5':
    case 'Muộn > 5 phút':
      return 'Đi muộn > 5 phút';
    case 'truant':
    case 'Trốn tiết':
    case 'Bỏ tiết':
      return 'Bỏ tiết / Trốn tiết';
    default:
      return status;
  }
};

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  currentUser,
  approvals,
  students,
  settings,
  onNavigateToSettings,
  onApproveItem,
  onRejectItem,
  onApproveAll,
  onShowToast,
}) => {
  const isGVCN = currentUser.role === 'GVCN' || currentUser.role === 'ADMIN';
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'attendance' | 'violation' | 'reward'>('all');
  const [rejectModalItem, setRejectModalItem] = useState<PendingApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<PendingApprovalItem | null>(null);

  // Filter items according to role
  const visibleApprovals = React.useMemo(() => {
    let items = approvals;
    if (!isGVCN) {
      // Students only see their own submissions or submissions from their group
      items = items.filter(
        (i) =>
          i.submittedBy.username.toUpperCase() === currentUser.username.toUpperCase() ||
          (currentUser.group && i.targetGroup === currentUser.group)
      );
    }

    if (statusFilter !== 'all') {
      items = items.filter((i) => i.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      items = items.filter((i) => i.type.startsWith(typeFilter));
    }

    return items;
  }, [approvals, isGVCN, currentUser, statusFilter, typeFilter]);

  const pendingCount = approvals.filter((i) => i.status === 'pending').length;
  const approvedCount = approvals.filter((i) => i.status === 'approved').length;
  const rejectedCount = approvals.filter((i) => i.status === 'rejected').length;

  const studentMap = React.useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const handleConfirmReject = () => {
    if (!rejectModalItem) return;
    onRejectItem(rejectModalItem.id, rejectReason.trim() || 'GVCN từ chối đề xuất này.');
    onShowToast(`Đã từ chối đề xuất: ${rejectModalItem.title}`, 'info');
    setRejectModalItem(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-300 text-xs font-semibold mb-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              {isGVCN ? 'Trung tâm Phê duyệt & Kiểm duyệt Dữ liệu' : 'Tiến trình Đề xuất & Phê duyệt của GVCN'}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {isGVCN ? 'Phê duyệt Đề xuất Cán sự Lớp' : 'Lịch sử Đề xuất của bạn'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {isGVCN
                ? 'Xem xét, kiểm tra và phê duyệt các bản ghi điểm danh, vi phạm kỷ luật và tuyên dương khen thưởng do Lớp trưởng, Thư ký và các Tổ trưởng đề xuất.'
                : 'Mọi nội dung điểm danh, vi phạm, tuyên dương bạn vừa cập nhật sẽ được lưu trữ tạm thời và chỉ được áp dụng vào sổ sách lớp khi Thầy/Cô GVCN bấm Phê duyệt.'}
            </p>
          </div>

          {isGVCN && pendingCount > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onApproveAll}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition-all text-xs sm:text-sm flex items-center gap-2 cursor-pointer shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Phê duyệt tất cả ({pendingCount})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Approval Settings Status Indicator (for GVCN/Admin) */}
      {isGVCN && settings && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-50 dark:bg-cyan-950/50 rounded-xl text-cyan-600 dark:text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Cài đặt kiểm duyệt hiện tại của GVCN:
              </div>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  • Điểm danh:{' '}
                  <strong className={settings.requireApprovalAttendance !== false ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                    {settings.requireApprovalAttendance !== false ? 'Yêu cầu duyệt' : 'Tự động ghi nhận'}
                  </strong>
                </span>
                <span className="flex items-center gap-1">
                  • Vi phạm & Tuyên dương:{' '}
                  <strong className={settings.requireApprovalViolationsRewards !== false ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                    {settings.requireApprovalViolationsRewards !== false ? 'Yêu cầu duyệt' : 'Tự động ghi nhận'}
                  </strong>
                </span>
              </div>
            </div>
          </div>
          {onNavigateToSettings && (
            <button
              type="button"
              onClick={onNavigateToSettings}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-600" />
              Thay đổi cài đặt
            </button>
          )}
        </div>
      )}

      {/* Filter Tabs & Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'pending'
              ? 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider">Chờ phê duyệt</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-amber-600 dark:text-amber-400">{pendingCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'approved'
              ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider">Đã phê duyệt</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">{approvedCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'rejected'
              ? 'bg-red-500/10 dark:bg-red-500/20 border-red-500/40 text-red-900 dark:text-red-200 ring-2 ring-red-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider">Đã từ chối</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-red-600 dark:text-red-400">{rejectedCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'all'
              ? 'bg-cyan-500/10 dark:bg-cyan-500/20 border-cyan-500/40 text-cyan-900 dark:text-cyan-200 ring-2 ring-cyan-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider">Tất cả đề xuất</span>
            <CheckSquare className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-cyan-600 dark:text-cyan-400">{approvals.length}</div>
        </button>
      </div>

      {/* Secondary Filter by Type */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Phân loại:
        </span>
        {(
          [
            { id: 'all', label: 'Tất cả loại' },
            { id: 'attendance', label: 'Điểm danh' },
            { id: 'violation', label: 'Vi phạm kỷ luật' },
            { id: 'reward', label: 'Tuyên dương & Thưởng' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTypeFilter(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              typeFilter === t.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Submissions List */}
      <div className="space-y-3.5">
        {visibleApprovals.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Không có đề xuất nào trong danh sách
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {statusFilter === 'pending'
                ? 'Hiện tại không có bản ghi nào đang chờ phê duyệt. Mọi hoạt động đã được xử lý xong!'
                : 'Thử thay đổi bộ lọc trạng thái để xem các bản ghi khác.'}
            </p>
          </div>
        ) : (
          visibleApprovals.map((item) => {
            const isPending = item.status === 'pending';
            const isApproved = item.status === 'approved';
            const isRejected = item.status === 'rejected';

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 transition-all shadow-sm ${
                  isPending
                    ? 'border-amber-400/60 dark:border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/10'
                    : isApproved
                    ? 'border-emerald-200 dark:border-emerald-800/60'
                    : 'border-red-200 dark:border-red-800/60 opacity-85'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left content */}
                  <div className="flex-1 space-y-2.5">
                    {/* Top badging */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Submitter Role badge */}
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        [{item.submittedBy.role}] {item.submittedBy.displayName}
                        {item.targetGroup ? ` (Tổ ${item.targetGroup})` : ''}
                      </span>

                      {/* Type badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                          item.type.includes('attendance')
                            ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : item.type.includes('violation')
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {item.type.includes('attendance') && <UserCheck className="w-3 h-3" />}
                        {item.type.includes('violation') && <AlertTriangle className="w-3 h-3" />}
                        {item.type.includes('reward') && <Award className="w-3 h-3" />}
                        {item.type.includes('attendance')
                          ? 'Điểm danh'
                          : item.type.includes('violation')
                          ? 'Vi phạm kỷ luật'
                          : 'Tuyên dương'}
                      </span>

                      {/* Status badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                          isPending
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 animate-pulse'
                            : isApproved
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                            : 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300'
                        }`}
                      >
                        {isPending && <Clock className="w-3 h-3" />}
                        {isApproved && <CheckCircle2 className="w-3 h-3" />}
                        {isRejected && <XCircle className="w-3 h-3" />}
                        {isPending ? 'Chờ GVCN duyệt' : isApproved ? 'Đã duyệt lưu' : 'Đã từ chối'}
                      </span>

                      <span className="text-[11px] text-slate-400 ml-auto">
                        {new Date(item.submittedAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        • {new Date(item.submittedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Specific payload preview */}
                    {item.type.includes('attendance') && item.attendanceRecords && (() => {
                      const absentOrLate = item.attendanceRecords.filter(
                        (r) => r.status !== 'present' && r.status !== 'Đúng giờ' && r.status !== 'Có mặt'
                      );
                      return (
                        <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
                          <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                            {absentOrLate.length > 0 ? (
                              <span>
                                Danh sách học sinh vắng / đi muộn (<strong className="text-rose-600 dark:text-rose-400 font-bold">{absentOrLate.length} em</strong>):
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                Tất cả học sinh đều có mặt đầy đủ ({item.attendanceRecords.length} em)
                              </span>
                            )}
                          </div>

                          {absentOrLate.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {absentOrLate.map((r) => {
                                const st = studentMap.get(r.studentId);
                                const isLate = r.status === 'late_under_5' || r.status === 'late_over_5' || r.status.includes('Muộn');
                                const statusTextVi = formatAttendanceStatusVi(r.status);
                                return (
                                  <span
                                    key={r.id}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-2xs flex items-center gap-1 ${
                                      isLate
                                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                    }`}
                                  >
                                    <span>{st?.fullName || r.studentId}:</span>
                                    <span>{statusTextVi}</span>
                                    {r.note && <span className="font-normal text-slate-500 dark:text-slate-400">({r.note})</span>}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Báo cáo này không có học sinh nào vắng mặt hoặc đi muộn.
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {item.type === 'violation' && item.violationRecord && (
                      <div className="mt-2 p-2.5 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-rose-800 dark:text-rose-300">
                            Học sinh:{' '}
                            {studentMap.get(item.violationRecord.studentId)?.fullName ||
                              item.violationRecord.studentId}
                          </span>
                          <span className="text-slate-500 ml-2">• Mức độ: {item.violationRecord.severity}</span>
                          {item.violationRecord.evidence && (
                            <span className="text-slate-500 ml-2">• Minh chứng: {item.violationRecord.evidence}</span>
                          )}
                        </div>
                        <span className="px-2 py-0.5 bg-rose-600 text-white font-bold rounded text-xs">
                          -{item.violationRecord.penaltyPoints}đ
                        </span>
                      </div>
                    )}

                    {item.type.includes('violation') && item.violationRecords && item.violationRecords.length > 0 && (
                      <div className="mt-2 p-2.5 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs">
                        <div className="font-semibold text-rose-800 dark:text-rose-300 mb-1 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          Chi tiết danh sách vi phạm điểm kém ({item.violationRecords.length} lượt):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {item.violationRecords.map((r, idx) => (
                            <span key={r.id || idx} className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded-md font-medium text-[11px]">
                              {studentMap.get(r.studentId)?.fullName || r.studentId}: {r.content} (-{r.penaltyPoints}đ)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.type === 'reward' && item.rewardRecord && (
                      <div className="mt-2 p-2.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-amber-800 dark:text-amber-300">
                            Học sinh:{' '}
                            {studentMap.get(item.rewardRecord.studentId)?.fullName ||
                              item.rewardRecord.studentId}
                          </span>
                          <span className="text-slate-500 ml-2">• Danh mục: {item.rewardRecord.type || 'Học tập'}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-xs">
                          +{item.rewardRecord.bonusPoints}đ
                        </span>
                      </div>
                    )}

                    {item.type.includes('reward') && item.rewardRecords && item.rewardRecords.length > 0 && (
                      <div className="mt-2 p-2.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs">
                        <div className="font-semibold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          Chi tiết danh sách tuyên dương điểm tốt ({item.rewardRecords.length} lượt):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {item.rewardRecords.map((r, idx) => (
                            <span key={r.id || idx} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-md font-medium text-[11px]">
                              {studentMap.get(r.studentId)?.fullName || r.studentId}: {r.content} (+{r.bonusPoints}đ)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review notes if any */}
                    {item.reviewNote && (
                      <div className="text-xs p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-cyan-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-semibold">Ý kiến GVCN ({item.reviewedBy}):</span>{' '}
                          {item.reviewNote}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right actions (Only for GVCN on pending items) */}
                  {isGVCN && isPending && (
                    <div className="flex sm:flex-col gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 sm:border-l sm:pl-4 border-slate-200 dark:border-slate-800 justify-end">
                      <button
                        type="button"
                        onClick={() => onApproveItem(item)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Duyệt & Lưu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRejectModalItem(item);
                          setRejectReason('');
                        }}
                        className="px-3.5 py-2 bg-red-100 dark:bg-red-950/60 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Từ chối</span>
                      </button>
                    </div>
                  )}

                  {/* For students, status indication */}
                  {!isGVCN && (
                    <div className="shrink-0 flex items-center justify-end text-xs font-semibold">
                      {isPending && (
                        <span className="text-amber-500 flex items-center gap-1">
                          <Clock className="w-4 h-4" /> Đang đợi GVCN duyệt
                        </span>
                      )}
                      {isApproved && (
                        <span className="text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Đã lưu vào sổ lớp
                        </span>
                      )}
                      {isRejected && (
                        <span className="text-red-500 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> GVCN không duyệt
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Từ chối đề xuất này?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Đề xuất: <span className="font-semibold">{rejectModalItem.title}</span> do{' '}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {rejectModalItem.submittedBy.displayName}
              </span>{' '}
              gửi.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lý do từ chối (Ghi chú phản hồi cho học sinh)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do (ví dụ: Học sinh đã xin phép trực tiếp GVCN, thông tin chưa chính xác...)"
                rows={3}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="mt-5 flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
