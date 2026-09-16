import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  UserMinus,
  ArrowRightLeft,
  Building2,
  Trash2,
  Calendar,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { Student } from '../../types';

export interface StudentTransferData {
  studentId: string;
  studentName: string;
  studentCode: string;
  transferType: 'transfer_class' | 'transfer_school' | 'drop_out' | 'delete_mistake';
  targetDestination: string;
  transferDate: string;
  reasonNote: string;
}

interface StudentTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  currentClassName: string;
  onConfirm: (data: StudentTransferData) => void;
}

export const StudentTransferModal: React.FC<StudentTransferModalProps> = ({
  isOpen,
  onClose,
  student,
  currentClassName,
  onConfirm,
}) => {
  const [transferType, setTransferType] = useState<'transfer_class' | 'transfer_school' | 'drop_out' | 'delete_mistake'>('transfer_class');
  const [targetDestination, setTargetDestination] = useState('');
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reasonNote, setReasonNote] = useState('');

  if (!isOpen || !student) return null;

  const isCadre = Boolean(student.roleInClass && student.roleInClass.trim().length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      studentId: student.id,
      studentName: student.fullName,
      studentCode: student.code,
      transferType,
      targetDestination: targetDestination.trim(),
      transferDate,
      reasonNote: reasonNote.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <UserMinus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Chuyển Lớp / Xóa Học Sinh
              </h3>
              <p className="text-xs text-slate-500">
                Xử lý học sinh chuyển đi, chuyển trường hoặc xóa hồ sơ lớp {currentClassName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Info Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-xs text-slate-400">Học sinh được chọn:</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {student.fullName} <span className="font-mono text-cyan-600 dark:text-cyan-400 font-normal">({student.code})</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Tổ {student.group} • {student.gender} • Lớp {currentClassName}
            </div>
          </div>

          {isCadre && (
            <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
              {student.roleInClass}
            </span>
          )}
        </div>

        {isCadre && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Lưu ý chức vụ:</strong> Học sinh này đang giữ vị trí <strong>{student.roleInClass}</strong>. Khi hoàn tất xóa/chuyển đi, hệ thống sẽ tự động gỡ chức vụ này để bạn phân công học sinh khác thay thế.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Transfer Type Selection */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Hình thức chuyển / xóa:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  transferType === 'transfer_class'
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-900 dark:text-cyan-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="transferType"
                  value="transfer_class"
                  checked={transferType === 'transfer_class'}
                  onChange={() => setTransferType('transfer_class')}
                  className="hidden"
                />
                <ArrowRightLeft className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Chuyển sang lớp khác</span>
              </label>

              <label
                className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  transferType === 'transfer_school'
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-900 dark:text-cyan-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="transferType"
                  value="transfer_school"
                  checked={transferType === 'transfer_school'}
                  onChange={() => setTransferType('transfer_school')}
                  className="hidden"
                />
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Chuyển trường khác</span>
              </label>

              <label
                className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  transferType === 'drop_out'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="transferType"
                  value="drop_out"
                  checked={transferType === 'drop_out'}
                  onChange={() => setTransferType('drop_out')}
                  className="hidden"
                />
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Nghỉ học / Thôi học</span>
              </label>

              <label
                className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  transferType === 'delete_mistake'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="transferType"
                  value="delete_mistake"
                  checked={transferType === 'delete_mistake'}
                  onChange={() => setTransferType('delete_mistake')}
                  className="hidden"
                />
                <Trash2 className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Xóa hồ sơ nhập nhầm</span>
              </label>
            </div>
          </div>

          {/* Destination if transferring */}
          {(transferType === 'transfer_class' || transferType === 'transfer_school') && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {transferType === 'transfer_class' ? 'Lớp chuyển đến:' : 'Trường chuyển đến:'}
              </label>
              <input
                type="text"
                required
                placeholder={transferType === 'transfer_class' ? 'Ví dụ: 11A2, 11A5...' : 'Ví dụ: THPT Nguyễn Trãi...'}
                value={targetDestination}
                onChange={(e) => setTargetDestination(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-hidden focus:border-cyan-500"
              />
            </div>
          )}

          {/* Effective Date */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Ngày áp dụng / Ngày quyết định:
            </label>
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-hidden focus:border-cyan-500"
            />
          </div>

          {/* Reason Note */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Lý do chi tiết & Quyết định của BGH:
            </label>
            <textarea
              rows={2}
              placeholder="Nhập lý do chuyển hoặc số quyết định chuyển trường..."
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-hidden focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <UserMinus className="w-4 h-4" />
              Xác Nhận Xóa / Chuyển Học Sinh
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
