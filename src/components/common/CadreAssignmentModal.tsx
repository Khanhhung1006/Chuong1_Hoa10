import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Award,
  Users,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { Student } from '../../types';

export interface CadreSelection {
  lt: string; // Student ID or fullName
  tk: string;
  bt: string;
  tt1: string;
  tt2: string;
  tt3: string;
  tt4: string;
}

interface CadreAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  className: string;
  academicYear?: string;
  onSaveCadres: (selection: CadreSelection) => void;
}

export const CadreAssignmentModal: React.FC<CadreAssignmentModalProps> = ({
  isOpen,
  onClose,
  students,
  className,
  academicYear = '2026 - 2027',
  onSaveCadres,
}) => {
  const cleanClass = className.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || '11a1';

  const [selectedLT, setSelectedLT] = useState<string>('');
  const [selectedTK, setSelectedTK] = useState<string>('');
  const [selectedBT, setSelectedBT] = useState<string>('');
  const [selectedTT1, setSelectedTT1] = useState<string>('');
  const [selectedTT2, setSelectedTT2] = useState<string>('');
  const [selectedTT3, setSelectedTT3] = useState<string>('');
  const [selectedTT4, setSelectedTT4] = useState<string>('');

  useEffect(() => {
    if (isOpen && students.length > 0) {
      // Find current students with respective roles
      const lt = students.find((s) => s.roleInClass?.toLowerCase().includes('lớp trưởng') || s.roleInClass === 'LT');
      const tk = students.find((s) => s.roleInClass?.toLowerCase().includes('thư ký') || s.roleInClass === 'TK');
      const bt = students.find((s) => s.roleInClass?.toLowerCase().includes('bí thư') || s.roleInClass === 'BT');
      const tt1 = students.find((s) => (s.roleInClass?.toLowerCase().includes('tổ trưởng') && s.group === 1) || s.roleInClass === 'TT1');
      const tt2 = students.find((s) => (s.roleInClass?.toLowerCase().includes('tổ trưởng') && s.group === 2) || s.roleInClass === 'TT2');
      const tt3 = students.find((s) => (s.roleInClass?.toLowerCase().includes('tổ trưởng') && s.group === 3) || s.roleInClass === 'TT3');
      const tt4 = students.find((s) => (s.roleInClass?.toLowerCase().includes('tổ trưởng') && s.group === 4) || s.roleInClass === 'TT4');

      setSelectedLT(lt?.id || (students[0] ? students[0].id : ''));
      setSelectedTK(tk?.id || (students[1] ? students[1].id : ''));
      setSelectedBT(bt?.id || (students[2] ? students[2].id : ''));
      setSelectedTT1(tt1?.id || (students.find(s => s.group === 1)?.id || ''));
      setSelectedTT2(tt2?.id || (students.find(s => s.group === 2)?.id || ''));
      setSelectedTT3(tt3?.id || (students.find(s => s.group === 3)?.id || ''));
      setSelectedTT4(tt4?.id || (students.find(s => s.group === 4)?.id || ''));
    }
  }, [isOpen, students]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCadres({
      lt: selectedLT,
      tk: selectedTK,
      bt: selectedBT,
      tt1: selectedTT1,
      tt2: selectedTT2,
      tt3: selectedTT3,
      tt4: selectedTT4,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Phân Công & Thay Đổi Ban Cán Sự Lớp {className}
              </h3>
              <p className="text-xs text-slate-500">
                Năm học: {academicYear} • Tự động đồng bộ quyền tài khoản làm việc của cán sự
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

        {/* Notice Info */}
        <div className="p-3 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/80 dark:border-cyan-800/60 text-xs text-cyan-900 dark:text-cyan-200 mb-4 flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
          <div>
            Khi bạn thay đổi người đảm nhiệm, hệ thống sẽ tự động cập nhật tên hiển thị trên tài khoản đăng nhập của vị trí đó (ví dụ <code className="font-bold">lt-{cleanClass}</code>) và phân quyền tương ứng mà không làm gián đoạn dữ liệu của lớp.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Main Cadres Group */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              Ban Cán Sự Chính (Toàn Lớp)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Lớp trưởng */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-700 dark:text-emerald-300">
                    Lớp trưởng
                  </label>
                  <span className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-1.5 py-0.5 rounded">
                    lt-{cleanClass}
                  </span>
                </div>
                <select
                  value={selectedLT}
                  onChange={(e) => setSelectedLT(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-hidden focus:border-cyan-500"
                >
                  <option value="">-- Chưa chỉ định --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} (Tổ {st.group})
                    </option>
                  ))}
                </select>
              </div>

              {/* Thư ký */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-700 dark:text-emerald-300">
                    Thư ký lớp
                  </label>
                  <span className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-1.5 py-0.5 rounded">
                    tk-{cleanClass}
                  </span>
                </div>
                <select
                  value={selectedTK}
                  onChange={(e) => setSelectedTK(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-hidden focus:border-cyan-500"
                >
                  <option value="">-- Chưa chỉ định --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} (Tổ {st.group})
                    </option>
                  ))}
                </select>
              </div>

              {/* Bí thư */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-700 dark:text-emerald-300">
                    Bí thư Chi đoàn
                  </label>
                  <span className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-1.5 py-0.5 rounded">
                    bt-{cleanClass}
                  </span>
                </div>
                <select
                  value={selectedBT}
                  onChange={(e) => setSelectedBT(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-hidden focus:border-cyan-500"
                >
                  <option value="">-- Chưa chỉ định --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} (Tổ {st.group})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Group Leaders Section */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Tổ Trưởng 4 Tổ Học Tập
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tổ 1 */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-indigo-700 dark:text-indigo-300">
                    Tổ trưởng Tổ 1
                  </label>
                  <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                    tt1-{cleanClass}
                  </span>
                </div>
                <select
                  value={selectedTT1}
                  onChange={(e) => setSelectedTT1(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-hidden focus:border-cyan-500"
                >
                  <option value="">-- Chưa chỉ định --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} (Tổ {st.group})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tổ 2 */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-indigo-700 dark:text-indigo-300">
                    Tổ trưởng Tổ 2
                  </label>
                  <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                    tt2-{cleanClass}
                  </span>
                </div>
                <select
                  value={selectedTT2}
                  onChange={(e) => setSelectedTT2(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-hidden focus:border-cyan-500"
                >
                  <option value="">-- Chưa chỉ định --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} (Tổ {st.group})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tổ 3 */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-indigo-700 dark:text-indigo-300">
                    Tổ trưởng Tổ 3
                  </label>
                  <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                    tt3-{cleanClass}
                  </span>
                </div>
                <select
                  value={selectedTT3}
                  onChange={(e) => setSelectedTT3(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-hidden focus:border-cyan-500"
                >
                  <option value="">-- Chưa chỉ định --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} (Tổ {st.group})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tổ 4 */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-indigo-700 dark:text-indigo-300">
                    Tổ trưởng Tổ 4
                  </label>
                  <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                    tt4-{cleanClass}
                  </span>
                </div>
                <select
                  value={selectedTT4}
                  onChange={(e) => setSelectedTT4(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-hidden focus:border-cyan-500"
                >
                  <option value="">-- Chưa chỉ định --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} (Tổ {st.group})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-md shadow-cyan-600/20 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Lưu Phân Công Ban Cán Sự
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
