import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Search,
  CheckCircle2,
  Lock,
  Save,
  Smartphone,
} from 'lucide-react';
import { Student, ViolationRecord, ClassSettings, UserAccount } from '../../types';
import { NavTab } from '../common/Sidebar';

interface UniformCheckViewProps {
  students: Student[];
  violations: ViolationRecord[];
  settings: ClassSettings;
  onSaveMultipleViolations: (violations: ViolationRecord[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
  currentUserGroup?: number;
  currentUser?: UserAccount;
  onNavigate?: (tab: NavTab) => void;
}

export const UniformCheckView: React.FC<UniformCheckViewProps> = ({
  students,
  violations,
  settings,
  onSaveMultipleViolations,
  onShowToast,
  currentUserGroup,
  currentUser,
  onNavigate,
}) => {
  const defaultGroup = currentUserGroup || currentUser?.group || (currentUser?.role?.startsWith('TT') ? parseInt(currentUser.role.replace('TT', ''), 10) : undefined);
  const isTeacher = currentUser?.role === 'GVCN' || currentUser?.role === 'ADMIN';
  const isLocked = settings.isLockedData && !isTeacher;

  const [uniformDate, setUniformDate] = useState('2026-09-14');
  const [uniformGroup, setUniformGroup] = useState<string>(defaultGroup ? defaultGroup.toString() : 'all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [uniformState, setUniformState] = useState<Record<string, { status: 'correct' | 'wrong'; note: string }>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (defaultGroup) {
      setUniformGroup(defaultGroup.toString());
    }
  }, [defaultGroup]);

  const effectiveGroup = defaultGroup ? defaultGroup.toString() : uniformGroup;

  // Sync uniform state with violations records
  useEffect(() => {
    const initialUniform: Record<string, { status: 'correct' | 'wrong'; note: string }> = {};
    students.forEach((s) => {
      const uRec = violations.find(
        (v) =>
          v.studentId === s.id &&
          v.date === uniformDate &&
          v.content.startsWith('[Đồng phục]')
      );

      let status: 'correct' | 'wrong' = 'correct';
      let note = '';

      if (uRec) {
        status = 'wrong';
        const parts = uRec.content.split(' - ');
        if (parts.length > 1) {
          note = parts.slice(1).join(' - ');
        }
      }

      initialUniform[s.id] = { status, note };
    });
    setUniformState(initialUniform);
    setIsDirty(false);
  }, [students, uniformDate, violations]);

  const handleStatusChange = (studentId: string, status: 'correct' | 'wrong') => {
    if (isLocked) return;
    setUniformState((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { note: '' }),
        status,
      },
    }));
    setIsDirty(true);
  };

  const handleNoteChange = (studentId: string, noteVal: string) => {
    if (isLocked) return;
    setUniformState((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'correct' }),
        note: noteVal,
      },
    }));
    setIsDirty(true);
  };

  const handleMarkAllCorrect = () => {
    if (isLocked) return;
    const updated = { ...uniformState };
    filteredStudents.forEach((s) => {
      updated[s.id] = { status: 'correct', note: '' };
    });
    setUniformState(updated);
    setIsDirty(true);
    onShowToast('Đã đánh dấu tất cả học sinh hiển thị là đúng đồng phục.', 'info');
  };

  const studentMap = useMemo(() => new Map<string, Student>(students.map((s) => [s.id, s])), [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchGroup = effectiveGroup === 'all' || s.group.toString() === effectiveGroup;
      const matchSearch =
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [students, effectiveGroup, searchQuery]);

  const handleSave = () => {
    if (isLocked) {
      onShowToast('Dữ liệu đã bị GVCN khóa, không thể chỉnh sửa!', 'error');
      return;
    }

    const otherViolations = violations.filter((v) => {
      const studentObj = studentMap.get(v.studentId);
      const isUniformRec = v.date === uniformDate && v.content.startsWith('[Đồng phục]');
      if (!isUniformRec) return true;
      if (defaultGroup && studentObj && studentObj.group !== defaultGroup) {
        return true;
      }
      return false;
    });

    const targetStudents = defaultGroup
      ? students.filter((s) => s.group === defaultGroup)
      : students;

    const newUniformViolations = targetStudents
      .map((s) => {
        const item = uniformState[s.id];
        if (!item || item.status === 'correct') return null;

        const penalty = 5;
        const prefix = '[Đồng phục] Sai đồng phục / Không đúng quy định';
        const contentStr = item.note.trim() ? `${prefix} - ${item.note.trim()}` : prefix;

        const rec: ViolationRecord = {
          id: `vio-uniform-${s.id}-${uniformDate}`,
          studentId: s.id,
          date: uniformDate,
          content: contentStr,
          severity: 'Vừa',
          penaltyPoints: penalty,
          status: 'Đã xử lý',
          reporter: defaultGroup ? `Tổ trưởng Tổ ${defaultGroup}` : 'Lớp cờ đỏ / GVCN',
        };
        return rec;
      })
      .filter(Boolean) as ViolationRecord[];

    const finalViolations = [...otherViolations, ...newUniformViolations];

    onSaveMultipleViolations(finalViolations);
    setIsDirty(false);
    onShowToast(`Đã lưu kết quả kiểm tra đồng phục ngày ${uniformDate} thành công!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Quick Action Switcher for Group Leader (Tổ trưởng) */}
      {onNavigate && (
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 pl-2">Thao tác nhanh:</span>
          <button
            type="button"
            onClick={() => onNavigate('phones')}
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-600" />
            Quản lí điện thoại
          </button>
          <button
            type="button"
            onClick={() => onNavigate('uniformCheck')}
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
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
              Thầy/Cô chủ nhiệm đã khóa dữ liệu nề nếp. Cán sự lớp và học sinh chỉ có quyền xem, tính năng chỉnh sửa đã bị khóa.
            </p>
          </div>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            Kiểm Tra Đồng Phục Học Sinh
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tác phong đồng phục, khăn quàng, phù hiệu và tự động đồng bộ điểm thi đua
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <input
              type="date"
              value={uniformDate}
              onChange={(e) => setUniformDate(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-800 dark:text-slate-100 outline-hidden cursor-pointer"
            />
          </div>

          {/* Group Filter */}
          {!defaultGroup && (
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setUniformGroup('all')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  uniformGroup === 'all'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tất cả
              </button>
              {[1, 2, 3, 4].map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setUniformGroup(g.toString())}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    uniformGroup === g.toString()
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tổ {g}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search & Quick Actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, mã số học sinh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 outline-hidden focus:border-emerald-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllCorrect}
            disabled={isLocked}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Đánh dấu tất cả đúng
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isLocked || !isDirty}
            className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
              isLocked
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                : isDirty
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-slate-400 dark:bg-slate-700 opacity-60 cursor-not-allowed shadow-none'
            }`}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            Lưu kiểm tra đồng phục
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            Danh Sách Kiểm Tra (Đúng đồng phục: 0đ | Sai quy định: -5đ)
          </div>
          {isDirty && (
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold animate-pulse">
              Có thay đổi chưa lưu
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Học sinh</th>
                <th className="py-3 px-4 w-28 text-center">Tổ</th>
                <th className="py-3 px-4 text-center w-72">Trạng thái đồng phục</th>
                <th className="py-3 px-4 text-center w-72">Ghi chú cụ thể</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500 font-medium">
                    Không tìm thấy học sinh nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const stUniform = uniformState[s.id] || { status: 'correct', note: '' };

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-emerald-50/10 dark:hover:bg-emerald-950/5 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-400 font-medium text-center">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {s.fullName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{s.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-center">Tổ {s.group}</td>
                      
                      {/* Uniform Status Buttons */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleStatusChange(s.id, 'correct')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                              stUniform.status === 'correct'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50'
                            }`}
                          >
                            ✓ Đúng đồng phục
                          </button>
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleStatusChange(s.id, 'wrong')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                              stUniform.status === 'wrong'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50'
                            }`}
                          >
                            ✕ Sai / Vi phạm (-5đ)
                          </button>
                        </div>
                      </td>

                      {/* Uniform Note */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="VD: Quên khăn quàng, thiếu phù hiệu..."
                          disabled={isLocked}
                          value={stUniform.note || ''}
                          onChange={(e) => handleNoteChange(s.id, e.target.value)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredStudents.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                isDirty
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 cursor-not-allowed shadow-none'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Lưu kết quả kiểm tra đồng phục
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
