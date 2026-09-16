import React, { useState } from 'react';
import {
  Printer,
  Shuffle,
  RefreshCw,
  Palette,
  Check,
  User,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';
import { Student, ClassSettings } from '../../types';

interface SeatingPlanViewProps {
  students: Student[];
  settings: ClassSettings;
  onUpdateStudents?: (updated: Student[]) => void;
  onUpdateStudent?: (student: Student) => void;
  onOpenStudentDetail?: (student: Student) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const COLOR_PALETTE = [
  { label: 'Mặc định (Cyan)', value: '#06b6d4' },
  { label: 'Cán sự lớp (Vàng)', value: '#f59e0b' },
  { label: 'Cần chú ý (Cam)', value: '#f97316' },
  { label: 'Học sinh giỏi (Xanh lá)', value: '#10b981' },
  { label: 'Tổ 1 (Xanh dương)', value: '#3b82f6' },
  { label: 'Tổ 2 (Tím)', value: '#8b5cf6' },
  { label: 'Tổ 3 (Hồng)', value: '#ec4899' },
  { label: 'Tổ 4 (Xám)', value: '#64748b' },
];

export const SeatingPlanView: React.FC<SeatingPlanViewProps> = ({
  students = [],
  settings,
  onUpdateStudents,
  onUpdateStudent,
  onOpenStudentDetail,
  onShowToast,
}) => {
  const [selectedSeat, setSelectedSeat] = useState<Student | null>(null);
  const [colorPickerTarget, setColorPickerTarget] = useState<Student | null>(null);

  const rows = 4; // 4 rows
  const cols = 8; // 4 dãy bàn đôi = 8 chỗ mỗi hàng = 32 chỗ

  const saveUpdatedStudents = (updated: Student[]) => {
    if (onUpdateStudents) {
      onUpdateStudents(updated);
    } else if (onUpdateStudent) {
      updated.forEach((s) => onUpdateStudent(s));
    }
  };

  // Arrange students on grid
  const getStudentAt = (r: number, c: number): Student | undefined => {
    return students.find((s) => s.seatRow === r && s.seatCol === c);
  };

  // Swap seats
  const handleSeatClick = (r: number, c: number) => {
    const clickedStudent = getStudentAt(r, c);

    if (!selectedSeat) {
      if (clickedStudent) {
        setSelectedSeat(clickedStudent);
      }
      return;
    }

    // If clicking same student, deselect
    if (clickedStudent && clickedStudent.id === selectedSeat.id) {
      setSelectedSeat(null);
      return;
    }

    // Swap positions
    const updated = students.map((s) => {
      if (s.id === selectedSeat.id) {
        return { ...s, seatRow: r, seatCol: c };
      }
      if (clickedStudent && s.id === clickedStudent.id) {
        return { ...s, seatRow: selectedSeat.seatRow, seatCol: selectedSeat.seatCol };
      }
      return s;
    });

    saveUpdatedStudents(updated);
    setSelectedSeat(null);
    onShowToast?.('Đã đổi vị trí chỗ ngồi thành công!', 'success');
  };

  // Change student color tag
  const handleApplyColor = (student: Student, color: string) => {
    const updated = students.map((s) => (s.id === student.id ? { ...s, seatColor: color } : s));
    saveUpdatedStudents(updated);
    setColorPickerTarget(null);
    onShowToast?.(`Đã đổi màu nhãn cho học sinh ${student.fullName}!`, 'success');
  };

  // Auto layout by Group (Tổ 1: cột 1-2, Tổ 2: cột 3-4, Tổ 3: cột 5-6, Tổ 4: cột 7-8)
  const handleArrangeByGroup = () => {
    const updated: Student[] = [];
    [1, 2, 3, 4].forEach((grp) => {
      const groupStudents = students.filter((s) => s.group === grp);
      const startCol = (grp - 1) * 2 + 1;
      groupStudents.forEach((st, idx) => {
        const r = Math.floor(idx / 2) + 1;
        const c = startCol + (idx % 2);
        updated.push({
          ...st,
          seatRow: r <= rows ? r : 4,
          seatCol: c <= cols ? c : cols,
        });
      });
    });
    // Add any leftovers
    students.forEach((st) => {
      if (!updated.some((u) => u.id === st.id)) {
        updated.push(st);
      }
    });
    saveUpdatedStudents(updated);
    onShowToast?.('Đã sắp xếp chỗ ngồi theo 4 Tổ thành công!', 'success');
  };

  // Shuffle seating randomly
  const handleShuffle = () => {
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    let index = 0;
    const updated: Student[] = [];
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        if (index < shuffled.length) {
          updated.push({
            ...shuffled[index],
            seatRow: r,
            seatCol: c,
          });
          index++;
        }
      }
    }
    saveUpdatedStudents(updated);
    onShowToast?.('Đã đảo chỗ ngồi ngẫu nhiên cho cả lớp!', 'info');
  };

  return (
    <div id="seating-plan-view" className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs no-print">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            Sơ Đồ Bàn Ghế Lớp {settings.className}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Nhấp chọn 2 vị trí bất kỳ để đổi chỗ trực tiếp. Bấm vào icon màu để đổi nhãn học sinh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="arrange-by-group-btn"
            onClick={handleArrangeByGroup}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Xếp theo 4 Tổ
          </button>

          <button
            id="shuffle-seats-btn"
            onClick={handleShuffle}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Đổi ngẫu nhiên
          </button>

          <button
            id="print-seating-btn"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            In sơ đồ
          </button>
        </div>
      </div>

      {/* Selected Seat notification */}
      {selectedSeat && (
        <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 rounded-2xl flex items-center justify-between text-xs text-cyan-800 dark:text-cyan-200">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-cyan-600 animate-pulse" />
            <span>
              Đang chọn: <strong>{selectedSeat.fullName}</strong>. Hãy nhấp vào chỗ ngồi thứ 2 để đổi vị trí!
            </span>
          </div>
          <button
            onClick={() => setSelectedSeat(null)}
            className="font-bold underline text-cyan-700 dark:text-cyan-300 hover:text-cyan-900 cursor-pointer"
          >
            Hủy chọn
          </button>
        </div>
      )}

      {/* Classroom layout canvas */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Mobile scroll hint */}
        <div className="sm:hidden mb-3 px-3 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 text-[11px] font-medium flex items-center justify-between">
          <span>💡 Vuốt sang ngang để xem đủ 4 dãy bàn</span>
          <span className="font-bold text-[10px] uppercase">Vuốt ➡️</span>
        </div>

        <div className="overflow-x-auto pb-2">
          {/* Podium / Black Board */}
          <div className="max-w-xl mx-auto mb-8 text-center min-w-[320px]">
            <div className="h-9 w-full bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 text-white rounded-xl shadow-md flex items-center justify-center font-bold text-xs tracking-widest uppercase border border-slate-600">
              BẢNG LỚP HỌC (BỤC GIẢNG)
            </div>
            <div className="mt-2 inline-flex items-center gap-2 px-4 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-semibold border border-amber-300/50">
              BÀN GIÁO VIÊN
            </div>
          </div>

          {/* 4 Dãy Bàn (Mỗi dãy 2 chỗ = Cặp đôi) */}
          <div className="min-w-[720px] max-w-4xl mx-auto space-y-6">
          {/* Header for Rows: Dãy 1 (Tổ 1), Dãy 2 (Tổ 2), Dãy 3 (Tổ 3), Dãy 4 (Tổ 4) */}
          <div className="grid grid-cols-4 gap-6 text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <div>DÃY 1 (TỔ 1)</div>
            <div>DÃY 2 (TỔ 2)</div>
            <div>DÃY 3 (TỔ 3)</div>
            <div>DÃY 4 (TỔ 4)</div>
          </div>

          {/* Rows */}
          {[1, 2, 3, 4].map((r) => (
            <div key={r} className="grid grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((grp) => {
                const colLeft = (grp - 1) * 2 + 1;
                const colRight = colLeft + 1;
                const studentLeft = getStudentAt(r, colLeft);
                const studentRight = getStudentAt(r, colRight);

                return (
                  <div
                    key={grp}
                    className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex gap-2 items-center justify-center shadow-xs"
                  >
                    {/* Desk Left */}
                    <SeatSlot
                      student={studentLeft}
                      row={r}
                      col={colLeft}
                      isSelected={selectedSeat?.id === studentLeft?.id}
                      onClick={() => handleSeatClick(r, colLeft)}
                      onPickColor={(st) => setColorPickerTarget(st)}
                    />
                    {/* Divider between pair */}
                    <div className="w-px h-12 bg-slate-200 dark:bg-slate-700" />
                    {/* Desk Right */}
                    <SeatSlot
                      student={studentRight}
                      row={r}
                      col={colRight}
                      isSelected={selectedSeat?.id === studentRight?.id}
                      onClick={() => handleSeatClick(r, colRight)}
                      onPickColor={(st) => setColorPickerTarget(st)}
                    />
                  </div>
                );
              })}
            </div>
          ))}

          {/* Door indicator */}
          <div className="flex justify-between items-center pt-4 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              🚪 CỬA RA VÀO CHÍNH
            </span>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              🪟 CỬA SỔ HÀNH LANG
            </span>
          </div>
        </div>
      </div>
    </div>

      {/* Color Picker Drawer / Popover */}
      {colorPickerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Chọn màu thẻ cho: {colorPickerTarget.fullName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Màu giúp giáo viên phân loại nhóm học sinh trực quan trên sơ đồ.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-5">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  onClick={() => handleApplyColor(colorPickerTarget, c.value)}
                  className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-xs font-medium cursor-pointer transition-all"
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: c.value }}
                  />
                  <span className="truncate text-slate-700 dark:text-slate-200">{c.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setColorPickerTarget(null)}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface SeatSlotProps {
  student?: Student;
  row: number;
  col: number;
  isSelected: boolean;
  onClick: () => void;
  onPickColor: (st: Student) => void;
}

const SeatSlot: React.FC<SeatSlotProps> = ({
  student,
  row,
  col,
  isSelected,
  onClick,
  onPickColor,
}) => {
  if (!student) {
    return (
      <div
        onClick={onClick}
        className="w-full h-22 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 cursor-pointer transition-colors"
      >
        <span className="text-[10px] font-medium">Trống</span>
        <span className="text-[9px] text-slate-300">R{row}C{col}</span>
      </div>
    );
  }

  const borderAccent = student.seatColor || '#06b6d4';

  return (
    <div
      onClick={onClick}
      className={`relative w-full h-22 rounded-xl p-2 bg-white dark:bg-slate-900 border-2 transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md ${
        isSelected
          ? 'border-amber-500 scale-105 shadow-lg shadow-amber-500/20'
          : 'border-slate-200 dark:border-slate-700 hover:border-cyan-500'
      }`}
      style={{
        borderTopColor: borderAccent,
        borderTopWidth: '4px',
      }}
    >
      <div className="flex items-center gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
            {student.fullName}
          </div>
          <div className="text-[9px] text-slate-400 truncate">
            {student.roleInClass || `Tổ ${student.group}`}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-1">
        <span>{student.code.replace('HS-11A1-', '#')}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPickColor(student);
          }}
          title="Đổi màu thẻ"
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-cyan-600 transition-colors"
        >
          <Palette className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
