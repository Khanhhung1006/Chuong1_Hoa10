import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Moon,
  Sun,
  Download,
  Upload,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  School,
  User,
  Phone,
  BookOpen,
  Smartphone,
  Search,
  Lock,
  Unlock,
} from 'lucide-react';
import { ClassSettings, Student } from '../../types';
import { storageService } from '../../services/storageService';

interface SettingsViewProps {
  settings: ClassSettings;
  students: Student[];
  onUpdateSettings: (newSettings: ClassSettings) => void;
  onResetData: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onManualSync?: () => void;
  onManualPull?: () => void;
  onOpenRolePermissions?: () => void;
  onOpenClassInitModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  students,
  onUpdateSettings,
  onResetData,
  onShowToast,
  onManualSync,
  onManualPull,
  onOpenRolePermissions,
  onOpenClassInitModal,
}) => {
  const [formData, setFormData] = useState<ClassSettings>({ ...settings });
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [exemptedIds, setExemptedIds] = useState<string[]>(
    settings.exemptedPhoneStudentIds || []
  );

  useEffect(() => {
    setFormData({ ...settings });
    setExemptedIds(settings.exemptedPhoneStudentIds || []);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings = {
      ...formData,
      exemptedPhoneStudentIds: exemptedIds
    };
    onUpdateSettings(updatedSettings);
    onShowToast('Đã lưu cấu hình lớp học thành công!', 'success');
  };

  const handleToggleExemption = (studentId: string) => {
    setExemptedIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleExportBackup = () => {
    const data = storageService.exportFullBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `edumaster_backup_${formData.className}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast('Đã xuất file sao lưu dữ liệu toàn hệ thống!', 'success');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const ok = storageService.importBackup(text);
      if (ok) {
        onShowToast('Khôi phục dữ liệu thành công!', 'success');
        window.location.reload();
      } else {
        onShowToast('File sao lưu không hợp lệ!', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="settings-view" className="space-y-6 max-w-4xl">
      {/* Class Handover & Excel Account Creation Banner */}
      {onOpenClassInitModal && (
        <div className="bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-indigo-500/10 dark:from-cyan-950/40 dark:to-indigo-950/40 p-5 rounded-3xl border border-cyan-200 dark:border-cyan-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 animate-pulse"></span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Khởi Tạo Tài Khoản & Bàn Giao Lớp Từ File Excel
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Tải file Excel mẫu, import danh sách học sinh, phân công ban cán sự & tổ trưởng tự động, cấp 7 tài khoản tác vụ và xuất file Excel (.xlsx) để download.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenClassInitModal}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 hover:scale-[1.02]"
          >
            <Upload className="w-4 h-4" />
            Mở Trình Khởi Tạo & Bàn Giao Excel
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            Cài Đặt Lớp Học & Hệ Thống
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tùy chỉnh thông tin trường, lớp, giáo viên chủ nhiệm, giao diện và sao lưu an toàn dữ liệu
          </p>
        </div>
        <button
          type="submit"
          form="settings-form"
          className="px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Save className="w-4 h-4" />
          Lưu tất cả thay đổi
        </button>
      </div>

      <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Class and Teacher Info */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <School className="w-4 h-4 text-cyan-600" />
              Thông Tin Trường Lớp & Giáo Viên
            </h3>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-3.5 h-3.5" />
              Lưu cấu hình giáo viên
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tên Trường THPT
              </label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tên Lớp Chủ Nhiệm
              </label>
              <input
                type="text"
                required
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Năm Học
              </label>
              <input
                type="text"
                required
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Họ và Tên Giáo Viên Chủ Nhiệm
              </label>
              <input
                type="text"
                required
                value={formData.teacherName}
                onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Môn Giảng Dạy Chính
              </label>
              <input
                type="text"
                value={formData.teacherSubject}
                onChange={(e) => setFormData({ ...formData, teacherSubject: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số Điện Thoại GVCN
              </label>
              <input
                type="text"
                value={formData.teacherPhone}
                onChange={(e) => setFormData({ ...formData, teacherPhone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Buổi Học Mặc Định (Sáng / Chiều)
              </label>
              <select
                value={formData.defaultSession || 'Sáng'}
                onChange={(e) => setFormData({ ...formData, defaultSession: e.target.value as 'Sáng' | 'Chiều' })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer"
              >
                <option value="Sáng">Buổi Sáng</option>
                <option value="Chiều">Buổi Chiều</option>
              </select>
            </div>
          </div>
        </div>

        {/* GVCN Approval Flow Configuration */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-600" />
              Cấu Hình Quy Trình Phê Duyệt Của GVCN
            </h3>
            <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800">
              Kiểm duyệt đầu vào
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Thầy/Cô có thể tùy chỉnh yêu cầu duyệt hay cho phép hệ thống tự động ghi nhận dữ liệu khi Học sinh / Ban cán sự lớp (Lớp trưởng, Thư ký, Tổ trưởng) thực hiện điểm danh hoặc báo cáo vi phạm, tuyên dương.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Setting 1: Attendance Approval */}
            <div className={`p-4 rounded-2xl border transition-all ${
              formData.requireApprovalAttendance !== false
                ? 'border-cyan-200 dark:border-cyan-800 bg-cyan-50/40 dark:bg-cyan-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Phê duyệt Điểm danh Lớp học
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      formData.requireApprovalAttendance !== false
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {formData.requireApprovalAttendance !== false ? 'Cần GVCN duyệt' : 'Tự động ghi nhận'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {formData.requireApprovalAttendance !== false
                      ? 'Khi Học sinh / Cán sự nhập điểm danh, dữ liệu sẽ được chuyển vào danh sách "Chờ duyệt" để GVCN kiểm tra trước khi ghi nhận chính thức.'
                      : 'Dữ liệu điểm danh do Học sinh / Cán sự gửi sẽ được ghi nhận trực tiếp vào Sổ điểm danh không cần qua duyệt.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={formData.requireApprovalAttendance !== false}
                    onChange={(e) => setFormData({ ...formData, requireApprovalAttendance: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>

            {/* Setting 2: Violations & Rewards Approval */}
            <div className={`p-4 rounded-2xl border transition-all ${
              formData.requireApprovalViolationsRewards !== false
                ? 'border-cyan-200 dark:border-cyan-800 bg-cyan-50/40 dark:bg-cyan-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Phê duyệt Vi phạm & Tuyên dương
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      formData.requireApprovalViolationsRewards !== false
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {formData.requireApprovalViolationsRewards !== false ? 'Cần GVCN duyệt' : 'Tự động ghi nhận'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {formData.requireApprovalViolationsRewards !== false
                      ? 'Báo cáo vi phạm (điểm kém) và tuyên dương (điểm tốt) do Cán sự/Học sinh tạo sẽ được lưu ở danh sách "Chờ duyệt".'
                      : 'Các lỗi vi phạm và khen thưởng do Cán sự/Học sinh ghi nhận sẽ tự động áp dụng trực tiếp vào điểm thi đua của học sinh.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={formData.requireApprovalViolationsRewards !== false}
                    onChange={(e) => setFormData({ ...formData, requireApprovalViolationsRewards: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Lock Data Config (Homeroom teacher locks data so students can't edit) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              Khóa Dữ Liệu Lớp Học (Chống Học Sinh Sửa)
            </h3>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
              formData.isLockedData
                ? 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800'
                : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
            }`}>
              {formData.isLockedData ? 'Đang Khóa' : 'Đang Mở'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Khi bật tính năng này, GVCN sẽ khóa toàn bộ dữ liệu lớp học. Tất cả cán sự lớp, tổ trưởng, học sinh sẽ <strong>bị chặn hoàn toàn</strong> quyền thêm mới, chỉnh sửa, xóa dữ liệu hoặc gửi đề xuất phê duyệt (Điểm danh, Nộp điện thoại, Vi phạm, Tuyên dương). Chỉ có GVCN và Quản trị viên mới có quyền thay đổi dữ liệu.
          </p>

          <div className={`p-4 rounded-2xl border transition-all ${
            formData.isLockedData
              ? 'border-red-200 dark:border-red-800 bg-red-50/20 dark:bg-red-950/10'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  formData.isLockedData
                    ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300'
                    : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}>
                  {formData.isLockedData ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    Trạng thái khóa dữ liệu lớp học
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formData.isLockedData 
                      ? 'Dữ liệu đang được khóa an toàn. Học sinh chỉ có quyền xem báo cáo và thống kê.' 
                      : 'Học sinh & Cán sự có thể ghi nhận điểm danh, nộp điện thoại, báo cáo vi phạm theo phân quyền.'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={formData.isLockedData || false}
                  onChange={(e) => setFormData({ ...formData, isLockedData: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-red-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Phone Submission Exemption Configuration */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-600" />
              Danh Sách Học Sinh Không Phải Nộp Điện Thoại
            </h3>
            <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800">
              Miễn trừ nộp máy
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Thầy/Cô có thể tích chọn các học sinh không cần phải nộp điện thoại di động đầu buổi học (ví dụ: học sinh không sử dụng điện thoại, hoặc được phê duyệt riêng biệt). Những em này sẽ được tự động bỏ qua khi báo cáo nộp điện thoại hoặc tạo biên bản vi phạm nhanh.
          </p>

          <div className="space-y-3 pt-2">
            {/* Search Input for Students */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="Tìm nhanh học sinh cần miễn trừ..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Checked/exempted count summary */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
              <span>Số lượng miễn nộp: {exemptedIds.length} học sinh</span>
              {exemptedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setExemptedIds([])}
                  className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer"
                >
                  Xóa tất cả miễn trừ
                </button>
              )}
            </div>

            {/* Grid of students */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {students
                .filter((s) =>
                  s.fullName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                  s.code.toLowerCase().includes(studentSearchQuery.toLowerCase())
                )
                .map((s) => {
                  const isExempted = exemptedIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none text-xs ${
                        isExempted
                          ? 'border-cyan-500 bg-cyan-50/45 dark:bg-cyan-950/20 text-slate-900 dark:text-slate-100 font-bold shadow-xs'
                          : 'border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isExempted}
                        onChange={() => handleToggleExemption(s.id)}
                        className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-semibold">{s.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-normal">Mã: {s.code} • Tổ {s.group}</p>
                      </div>
                    </label>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            Lưu thay đổi cài đặt
          </button>
        </div>
      </form>

      {/* Backup & Restore Data Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-cyan-600" />
          Sao Lưu & Phục Hồi Dữ Liệu Lớp Học
        </h3>
        <p className="text-xs text-slate-500">
          Thầy/Cô có thể tải file sao lưu về máy tính bất cứ lúc nào hoặc chuyển sang máy khác.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Export JSON */}
          <button
            onClick={handleExportBackup}
            className="px-4 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 text-xs font-bold border border-cyan-200 dark:border-cyan-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            Xuất file sao lưu (Backup JSON)
          </button>

          {/* Import JSON */}
          <label className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            Khôi phục từ file JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          {/* Reset to initial mock data */}
          <button
            onClick={() => setShowConfirmReset(true)}
            className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800 flex items-center gap-2 cursor-pointer transition-colors ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Khôi phục dữ liệu mẫu
          </button>
        </div>
      </div>

      {/* Class & Cadre Account Initialization Card */}
      {onOpenClassInitModal && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-600" />
              Khởi Tạo Lớp & Cấp Tài Khoản Ban Cán Sự / Học Sinh
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Quy trình 6 bước chuẩn
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Tự động sinh tài khoản cho Lớp trưởng (<code>lt-{settings.className.toLowerCase()}</code>), Thư ký (<code>tk-{settings.className.toLowerCase()}</code>), Bí thư và các Tổ trưởng kèm danh sách học sinh theo quy chuẩn. Bắt buộc đổi mật khẩu khi đăng nhập lần đầu.
          </p>
          <button
            type="button"
            onClick={onOpenClassInitModal}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <User className="w-4 h-4" /> Mở công cụ Khởi tạo Lớp & Cấp tài khoản
          </button>
        </div>
      )}

      {/* RBAC Role Permissions Management Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-600" />
          Phân Quyền Truy Cập & Quản Lý Vai Trò (RBAC)
        </h3>
        <p className="text-xs text-slate-500">
          Tùy chỉnh quyền hạn chi tiết cho từng vai trò (Tổ trưởng, Lớp trưởng, Thư ký, Bí thư, Học sinh, Phụ huynh) và mở rộng vai trò mới không giới hạn.
        </p>
        <button
          onClick={onOpenRolePermissions}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-2 cursor-pointer transition-all"
        >
          <ShieldAlert className="w-4 h-4" /> Mở cấu hình Phân quyền RBAC & Vai trò
        </button>
      </div>

      {/* Reset Confirmation Dialog */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Khôi phục dữ liệu mẫu?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tất cả các chỉnh sửa hiện tại sẽ được thay thế bằng bộ dữ liệu mẫu chuẩn của lớp 11A1 (32 học sinh).
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onResetData();
                  setShowConfirmReset(false);
                  onShowToast('Đã khôi phục dữ liệu ban đầu thành công!', 'success');
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Đồng ý khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
