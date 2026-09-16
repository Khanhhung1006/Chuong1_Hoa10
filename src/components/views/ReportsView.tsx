import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  Calendar,
  Users,
  Award,
  AlertTriangle,
  Wallet,
  PhoneCall,
  CheckCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Eye,
  Filter,
  Layers,
  ChevronRight,
  Edit3,
  Search,
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  ViolationRecord,
  RewardRecord,
  ClassSettings,
  FinancialTransaction,
  ParentContactLog,
  DiaryEntry,
  SubjectScore,
  ConductRecord,
} from '../../types';
import {
  exportStudentsToExcel,
  exportFinanceToExcel,
  exportAttendanceToExcel,
  exportEmulationToExcel,
  exportComprehensiveMultiSheetExcel,
  exportPeriodReportWord,
  exportStudentDetailedLedgerExcel,
  exportStudentDetailedLedgerWord,
  isDateInRange,
  formatDateVN,
} from '../../services/exportService';

interface ReportsViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  transactions: FinancialTransaction[];
  contactLogs?: ParentContactLog[];
  diaryEntries?: DiaryEntry[];
  grades?: SubjectScore[];
  conducts?: ConductRecord[];
  settings: ClassSettings;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
}

// School Year 2026-2027 base date: Week 1 starts Sept 07, 2026
const SCHOOL_YEAR_START = new Date('2026-09-07');

function getWeekDateRange(weekNumber: number): { start: string; end: string } {
  const start = new Date(SCHOOL_YEAR_START);
  start.setDate(start.getDate() + (weekNumber - 1) * 7);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function getMonthDateRange(yearMonth: string): { start: string; end: string } {
  const [yearStr, monthStr] = yearMonth.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  const lastDay = new Date(y, m, 0).getDate();

  return {
    start: `${yearStr}-${monthStr.padStart(2, '0')}-01`,
    end: `${yearStr}-${monthStr.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  attendance,
  violations,
  rewards,
  transactions,
  contactLogs = [],
  diaryEntries = [],
  settings,
  onShowToast,
}) => {
  // Time Filter Type: 'week' | 'month' | 'custom'
  const [periodType, setPeriodType] = useState<'week' | 'month' | 'custom'>('week');

  // Preview Mode: 'admin_report' | 'student_ledger'
  const [previewMode, setPreviewMode] = useState<'admin_report' | 'student_ledger'>('student_ledger');

  // Student Ledger Filters
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [studentGroupFilter, setStudentGroupFilter] = useState<string>('all');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'has_violation' | 'has_reward' | 'has_absent'>('all');

  // Week selection (1..35)
  const [selectedWeek, setSelectedWeek] = useState<number>(2);

  // Month selection
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');

  // Custom date range
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-09-14');

  // Active report tab for preview & export cards
  const [activeReportTab, setActiveReportTab] = useState<
    'student_ledger' | 'comprehensive_word' | 'multi_excel' | 'attendance_excel' | 'emulation_excel' | 'finance_excel' | 'students_excel'
  >('student_ledger');

  // Editable fields for Word Export
  const [teacherEvaluation, setTeacherEvaluation] = useState<string>(
    'Tập thể lớp 11A1 duy trì tốt nề nếp kỷ cương, phần lớn học sinh có ý thức tự giác cao trong giờ học và truy bài. Cán sự lớp hoạt động năng nổ, tổ trưởng theo dõi sát sao điểm thi đua.'
  );
  const [nextPeriodPlan, setNextPeriodPlan] = useState<string>(
    '1. Tiếp tục duy trì sĩ số 100%, chấn chỉnh dứt điểm hiện tượng đi học muộn.\n2. Phát động phong trào thi đua "Hoa Điểm Tốt" chào mừng ngày Nhà giáo Việt Nam.\n3. GVCN liên hệ phụ huynh các học sinh còn yếu để trao đổi phương án phụ đạo.'
  );

  // Calculate actual Date Range based on periodType
  const { startDate, endDate, periodLabel } = useMemo(() => {
    if (periodType === 'week') {
      const range = getWeekDateRange(selectedWeek);
      return {
        startDate: range.start,
        endDate: range.end,
        periodLabel: `Tuần ${selectedWeek} (${formatDateVN(range.start)} - ${formatDateVN(range.end)})`,
      };
    } else if (periodType === 'month') {
      const range = getMonthDateRange(selectedMonth);
      const [year, month] = selectedMonth.split('-');
      return {
        startDate: range.start,
        endDate: range.end,
        periodLabel: `Tháng ${parseInt(month, 10)}/${year} (${formatDateVN(range.start)} - ${formatDateVN(range.end)})`,
      };
    } else {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
        periodLabel: `Giai đoạn từ ${formatDateVN(customStartDate)} đến ${formatDateVN(customEndDate)}`,
      };
    }
  }, [periodType, selectedWeek, selectedMonth, customStartDate, customEndDate]);

  // Filter datasets by the selected date range
  const filteredAttendance = useMemo(() => {
    return attendance.filter((a) => isDateInRange(a.date, startDate, endDate));
  }, [attendance, startDate, endDate]);

  const filteredViolations = useMemo(() => {
    return violations.filter((v) => isDateInRange(v.date, startDate, endDate));
  }, [violations, startDate, endDate]);

  const filteredRewards = useMemo(() => {
    return rewards.filter((r) => isDateInRange(r.date, startDate, endDate));
  }, [rewards, startDate, endDate]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => isDateInRange(t.date, startDate, endDate));
  }, [transactions, startDate, endDate]);

  const filteredContactLogs = useMemo(() => {
    return contactLogs.filter((c) => isDateInRange(c.date, startDate, endDate));
  }, [contactLogs, startDate, endDate]);

  const filteredDiaryEntries = useMemo(() => {
    return diaryEntries.filter((d) => isDateInRange(d.date, startDate, endDate));
  }, [diaryEntries, startDate, endDate]);

  // Key metrics for the filtered period
  const absentExcused = useMemo(() => {
    return filteredAttendance.filter(
      (a) => a.status === 'absent_excused' || a.status === 'Vắng có phép'
    ).length;
  }, [filteredAttendance]);

  const absentUnexcused = useMemo(() => {
    return filteredAttendance.filter(
      (a) => a.status === 'absent_unexcused' || a.status === 'Vắng không phép'
    ).length;
  }, [filteredAttendance]);

  const lateCount = useMemo(() => {
    return filteredAttendance.filter(
      (a) => a.status === 'late_under_5' || a.status === 'late_over_5'
    ).length;
  }, [filteredAttendance]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  // Emulation groups ranking in period
  const groupRankings = useMemo(() => {
    return [1, 2, 3, 4].map((groupNum) => {
      const gStudents = students.filter((s) => s.group === groupNum);
      const gIds = new Set(gStudents.map((s) => s.id));
      const gViolations = filteredViolations.filter((v) => gIds.has(v.studentId));
      const gRewards = filteredRewards.filter((r) => gIds.has(r.studentId));
      const bonus = gRewards.reduce((sum, r) => sum + (r.bonusPoints || 0), 0);
      const penalty = gViolations.reduce((sum, v) => sum + (v.penaltyPoints || 0), 0);
      const base = settings.baseScorePerWeek || 100;
      const memberCount = gStudents.length;
      const totalPoints = memberCount > 0 ? (memberCount * base) + bonus - penalty : 0;
      const totalScore = memberCount > 0 ? Number((totalPoints / memberCount).toFixed(1)) : 0;
      return {
        groupNum,
        memberCount: gStudents.length,
        bonus,
        penalty,
        totalScore,
        violationCount: gViolations.length,
        rewardCount: gRewards.length,
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [students, filteredViolations, filteredRewards, settings.baseScorePerWeek]);

  // Quick Preset Actions
  const handleSetThisWeek = () => {
    setPeriodType('week');
    setSelectedWeek(2);
    onShowToast('Đã chọn Tuần hiện tại (Tuần 2)', 'info');
  };

  const handleSetLastWeek = () => {
    setPeriodType('week');
    setSelectedWeek(1);
    onShowToast('Đã chọn Tuần trước (Tuần 1)', 'info');
  };

  const handleSetThisMonth = () => {
    setPeriodType('month');
    setSelectedMonth('2026-09');
    onShowToast('Đã chọn Tháng 9/2026', 'info');
  };

  const handleSetCustomLast7Days = () => {
    setPeriodType('custom');
    const today = new Date('2026-09-14');
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    setCustomStartDate(sevenDaysAgo.toISOString().slice(0, 10));
    setCustomEndDate(today.toISOString().slice(0, 10));
    onShowToast('Đã chọn khoảng thời gian 7 ngày gần đây', 'info');
  };

  const handleSetCustomSemester1 = () => {
    setPeriodType('custom');
    setCustomStartDate('2026-09-01');
    setCustomEndDate('2027-01-15');
    onShowToast('Đã chọn toàn bộ Học kỳ 1 (01/09 - 15/01)', 'info');
  };

  // Student detailed ledger calculations
  const studentDetailedList = useMemo(() => {
    return students.map((s, idx) => {
      const sAtt = filteredAttendance.filter((a) => a.studentId === s.id);
      const ex = sAtt.filter((a) => a.status === 'absent_excused' || a.status === 'Vắng có phép').length;
      const un = sAtt.filter((a) => a.status === 'absent_unexcused' || a.status === 'Vắng không phép').length;
      const lateUnder5 = sAtt.filter((a) => a.status === 'late_under_5' || a.status === 'Đi muộn dưới 5 phút').length;
      const lateOver5 = sAtt.filter((a) => a.status === 'late_over_5' || a.status === 'Đi muộn trên 5 phút').length;
      const truant = sAtt.filter((a) => a.status === 'truant' || a.status === 'Trốn tiết').length;

      const sRewards = filteredRewards.filter((r) => r.studentId === s.id);
      const totalBonus = sRewards.reduce((sum, r) => sum + (r.bonusPoints || 0), 0);

      const sViolations = filteredViolations.filter((v) => v.studentId === s.id);
      const totalPenalty = sViolations.reduce((sum, v) => sum + (v.penaltyPoints || 0), 0);

      const baseScore = 100;
      const attDeduction = (un * 10) + (lateUnder5 * 5) + (lateOver5 * 10);
      const netScore = Math.max(0, baseScore + totalBonus - totalPenalty - attDeduction);
      let conductRank = 'Tốt';
      let rankBadgeColor = 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      if (netScore < 50) {
        conductRank = 'Chưa đạt';
        rankBadgeColor = 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      } else if (netScore < 70) {
        conductRank = 'Đạt';
        rankBadgeColor = 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      } else if (netScore < 90) {
        conductRank = 'Khá';
        rankBadgeColor = 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      }

      return {
        student: s,
        idx,
        attExcused: ex,
        attUnexcused: un,
        attLate: lateUnder5 + lateOver5,
        attLateUnder5: lateUnder5,
        attLateOver5: lateOver5,
        attTruant: truant,
        rewards: sRewards,
        totalBonus,
        violations: sViolations,
        totalPenalty,
        netScore,
        conductRank,
        rankBadgeColor,
      };
    });
  }, [students, filteredAttendance, filteredRewards, filteredViolations]);

  // Filtered student list based on search and filters
  const filteredStudentLedger = useMemo(() => {
    return studentDetailedList.filter((item) => {
      if (studentSearchQuery.trim()) {
        const q = studentSearchQuery.toLowerCase();
        const matchName = item.student.fullName.toLowerCase().includes(q);
        const matchCode = item.student.code.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      if (studentGroupFilter !== 'all') {
        if (item.student.group !== parseInt(studentGroupFilter, 10)) return false;
      }
      if (studentStatusFilter === 'has_violation') {
        if (item.violations.length === 0) return false;
      } else if (studentStatusFilter === 'has_reward') {
        if (item.rewards.length === 0) return false;
      } else if (studentStatusFilter === 'has_absent') {
        if (item.attExcused === 0 && item.attUnexcused === 0 && item.attLate === 0 && item.attTruant === 0) return false;
      }
      return true;
    });
  }, [studentDetailedList, studentSearchQuery, studentGroupFilter, studentStatusFilter]);

  // Export handlers
  const handleExportStudentLedgerExcel = () => {
    exportStudentDetailedLedgerExcel(
      students,
      filteredAttendance,
      filteredViolations,
      filteredRewards,
      settings,
      periodLabel,
      startDate,
      endDate
    );
    onShowToast(`Đã xuất Bảng Tổng Hợp Học Sinh (Excel) cho ${periodLabel}!`, 'success');
  };

  const handleExportStudentLedgerWord = () => {
    exportStudentDetailedLedgerWord(
      students,
      filteredAttendance,
      filteredViolations,
      filteredRewards,
      settings,
      periodLabel,
      startDate,
      endDate
    );
    onShowToast(`Đã xuất Bảng Tổng Hợp Học Sinh (Word) cho ${periodLabel}!`, 'success');
  };

  const handleExportWordReport = () => {
    exportPeriodReportWord({
      reportPeriodType: periodType,
      periodTitle: periodLabel,
      startDateStr: startDate,
      endDateStr: endDate,
      students,
      attendance: filteredAttendance,
      violations: filteredViolations,
      rewards: filteredRewards,
      transactions: filteredTransactions,
      contactLogs: filteredContactLogs,
      diaryEntries: filteredDiaryEntries,
      settings,
      teacherEvaluation,
      nextPeriodPlan,
    });
    onShowToast(`Đã xuất Báo cáo Word cho ${periodLabel}!`, 'success');
  };

  const handleExportMultiSheetExcel = () => {
    exportComprehensiveMultiSheetExcel(
      students,
      filteredAttendance,
      filteredViolations,
      filteredRewards,
      filteredTransactions,
      filteredContactLogs,
      settings,
      periodLabel,
      startDate,
      endDate
    );
    onShowToast(`Đã xuất Sổ Báo Cáo Tổng Hợp (6 Sheet) cho ${periodLabel}!`, 'success');
  };

  const handleExportAttendanceExcel = () => {
    exportAttendanceToExcel(students, filteredAttendance, settings, periodLabel);
    onShowToast(`Đã xuất Bảng Chuyên cần cho ${periodLabel}!`, 'success');
  };

  const handleExportEmulationExcel = () => {
    exportEmulationToExcel(students, filteredViolations, filteredRewards, settings, periodLabel);
    onShowToast(`Đã xuất Bảng Thi Đua & Nề Nếp cho ${periodLabel}!`, 'success');
  };

  const handleExportFinanceExcel = () => {
    exportFinanceToExcel(filteredTransactions, settings, periodLabel);
    onShowToast(`Đã xuất Báo cáo Thu Chi Quỹ Lớp cho ${periodLabel}!`, 'success');
  };

  const handleExportStudentsExcel = () => {
    exportStudentsToExcel(students, settings);
    onShowToast('Đã xuất Danh sách trích ngang học sinh lớp!', 'success');
  };

  return (
    <div id="reports-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              Trung Tâm Báo Cáo & Xuất Dữ Liệu
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hỗ trợ xuất báo cáo định kỳ theo <strong className="text-slate-700 dark:text-slate-300">Tuần</strong>, <strong className="text-slate-700 dark:text-slate-300">Tháng</strong> hoặc <strong className="text-slate-700 dark:text-slate-300">Khoảng thời gian tùy chọn</strong> chuẩn thể thức Bộ GD&ĐT.
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="export-top-student-excel-btn"
            onClick={handleExportStudentLedgerExcel}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Xuất bảng Excel tổng hợp danh sách tất cả học sinh cùng vi phạm, tuyên dương, chuyên cần"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bảng HS: Vi Phạm & Khen Thưởng (.xlsx)
          </button>
          <button
            id="export-top-student-word-btn"
            onClick={handleExportStudentLedgerWord}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Xuất bảng Word tổng hợp danh sách tất cả học sinh cùng vi phạm, tuyên dương, chuyên cần"
          >
            <FileText className="w-4 h-4" />
            Bảng HS: Vi Phạm & Khen Thưởng (.doc)
          </button>
          <button
            id="export-top-word-btn"
            onClick={handleExportWordReport}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Báo Cáo Word BGH (.doc)
          </button>
          <button
            id="export-top-excel-btn"
            onClick={handleExportMultiSheetExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            Sổ Excel 6 Sheet
          </button>
          <button
            id="print-top-btn"
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            In
          </button>
        </div>
      </div>

      {/* Time Range Selector Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Chọn Phạm Vi Thời Gian Xuất Báo Cáo
            </h3>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] mr-1">Chọn nhanh:</span>
            <button
              onClick={handleSetThisWeek}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Tuần này (Tuần 2)
            </button>
            <button
              onClick={handleSetLastWeek}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Tuần trước
            </button>
            <button
              onClick={handleSetThisMonth}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Tháng 9
            </button>
            <button
              onClick={handleSetCustomLast7Days}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              7 ngày qua
            </button>
            <button
              onClick={handleSetCustomSemester1}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Học kỳ 1
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Tab 1: Theo Tuần */}
          <div
            onClick={() => setPeriodType('week')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              periodType === 'week'
                ? 'bg-cyan-50/70 dark:bg-cyan-950/40 border-cyan-500 shadow-sm ring-2 ring-cyan-500/20'
                : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Calendar className="w-4 h-4 text-cyan-600" />
                1. Báo Cáo Theo Tuần
              </span>
              <input
                type="radio"
                name="periodType"
                checked={periodType === 'week'}
                onChange={() => setPeriodType('week')}
                className="accent-cyan-600"
              />
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Biên bản sinh hoạt lớp và đánh giá thi đua từng tuần học.
            </p>
            {periodType === 'week' && (
              <div className="space-y-2 pt-2 border-t border-cyan-100 dark:border-cyan-900/50">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                  Chọn tuần học (Năm học {settings.academicYear}):
                </label>
                <select
                  id="select-week-input"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-100 outline-hidden focus:border-cyan-500"
                >
                  {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => {
                    const r = getWeekDateRange(w);
                    return (
                      <option key={w} value={w}>
                        Tuần {w} ({formatDateVN(r.start)} - {formatDateVN(r.end)})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {/* Tab 2: Theo Tháng */}
          <div
            onClick={() => setPeriodType('month')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              periodType === 'month'
                ? 'bg-cyan-50/70 dark:bg-cyan-950/40 border-cyan-500 shadow-sm ring-2 ring-cyan-500/20'
                : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Clock className="w-4 h-4 text-emerald-600" />
                2. Báo Cáo Theo Tháng
              </span>
              <input
                type="radio"
                name="periodType"
                checked={periodType === 'month'}
                onChange={() => setPeriodType('month')}
                className="accent-cyan-600"
              />
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Tổng kết nề nếp, chuyên cần, tài chính tháng nộp Ban Giám Hiệu.
            </p>
            {periodType === 'month' && (
              <div className="space-y-2 pt-2 border-t border-cyan-100 dark:border-cyan-900/50">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                  Chọn tháng đánh giá:
                </label>
                <select
                  id="select-month-input"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-100 outline-hidden focus:border-cyan-500"
                >
                  <option value="2026-09">Tháng 09/2026 (Đầu năm học)</option>
                  <option value="2026-10">Tháng 10/2026</option>
                  <option value="2026-11">Tháng 11/2026 (Thi đua 20/11)</option>
                  <option value="2026-12">Tháng 12/2026 (Thi Học kỳ 1)</option>
                  <option value="2027-01">Tháng 01/2027 (Sơ kết HK1)</option>
                  <option value="2027-02">Tháng 02/2027 (Khai xuân)</option>
                  <option value="2027-03">Tháng 03/2027 (Tháng Đoàn)</option>
                  <option value="2027-04">Tháng 04/2027</option>
                  <option value="2027-05">Tháng 05/2027 (Tổng kết năm)</option>
                </select>
              </div>
            )}
          </div>

          {/* Tab 3: Tùy Chọn Khoảng Ngày */}
          <div
            onClick={() => setPeriodType('custom')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              periodType === 'custom'
                ? 'bg-cyan-50/70 dark:bg-cyan-950/40 border-cyan-500 shadow-sm ring-2 ring-cyan-500/20'
                : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Filter className="w-4 h-4 text-purple-600" />
                3. Tùy Chọn Khoảng Thời Gian
              </span>
              <input
                type="radio"
                name="periodType"
                checked={periodType === 'custom'}
                onChange={() => setPeriodType('custom')}
                className="accent-cyan-600"
              />
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Giáo viên tự đặt mốc ngày bắt đầu và kết thúc bất kỳ.
            </p>
            {periodType === 'custom' && (
              <div className="space-y-2 pt-2 border-t border-cyan-100 dark:border-cyan-900/50">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Từ ngày:
                    </label>
                    <input
                      id="custom-start-date"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Đến ngày:
                    </label>
                    <input
                      id="custom-end-date"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Current Active Period Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Đang chọn: <span className="text-cyan-700 dark:text-cyan-400">{periodLabel}</span>
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Mốc thời gian: {formatDateVN(startDate)} ➔ {formatDateVN(endDate)}
          </div>
        </div>
      </div>

      {/* Filtered Period Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Chuyên cần */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Chuyên Cần</span>
            <Calendar className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-xl font-bold font-display text-slate-900 dark:text-white">
            {absentExcused + absentUnexcused + lateCount} <span className="text-xs font-normal text-slate-400">lượt</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="text-amber-600 font-medium">Vắng có phép: {absentExcused}</span> • 
            <span className="text-red-500 font-medium">KP: {absentUnexcused}</span>
          </div>
        </div>

        {/* 2. Khen thưởng */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Khen Thưởng</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-display text-emerald-600 dark:text-emerald-400">
            +{filteredRewards.reduce((s, r) => s + r.bonusPoints, 0)} <span className="text-xs font-normal text-slate-400">điểm</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Ghi nhận <b>{filteredRewards.length}</b> lượt tuyên dương
          </div>
        </div>

        {/* 3. Vi phạm */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Vi Phạm Nề Nếp</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-display text-rose-600 dark:text-rose-400">
            -{filteredViolations.reduce((s, v) => s + v.penaltyPoints, 0)} <span className="text-xs font-normal text-slate-400">điểm</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Tổng số <b>{filteredViolations.length}</b> vụ việc phát sinh
          </div>
        </div>

        {/* 4. Thu chi quỹ */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Quỹ Lớp Phát Sinh</span>
            <Wallet className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-bold font-display text-slate-900 dark:text-white truncate">
            {(totalIncome - totalExpense).toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">đ</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            Thu: {totalIncome.toLocaleString('vi-VN')}đ • Chi: {totalExpense.toLocaleString('vi-VN')}đ
          </div>
        </div>

        {/* 5. Phụ huynh */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Liên Hệ Phụ Huynh</span>
            <PhoneCall className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-display text-slate-900 dark:text-white">
            {filteredContactLogs.length} <span className="text-xs font-normal text-slate-400">cuộc trao đổi</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            Nhật ký chủ nhiệm: {filteredDiaryEntries.length} ghi chú
          </div>
        </div>
      </div>

      {/* Report Types Catalog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 0: Bảng Danh Sách Chi Tiết Học Sinh (Vi Phạm, Tuyên Dương) */}
        <div
          onClick={() => {
            setActiveReportTab('student_ledger');
            setPreviewMode('student_ledger');
          }}
          className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between md:col-span-2 lg:col-span-3 ${
            activeReportTab === 'student_ledger' && previewMode === 'student_ledger'
              ? 'bg-gradient-to-br from-teal-50 to-cyan-50/60 dark:from-teal-950/40 dark:to-cyan-950/20 border-teal-500 shadow-sm ring-1 ring-teal-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shrink-0 mt-0.5">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Bảng Báo Cáo Toàn Diện Từng Học Sinh (Vi Phạm, Tuyên Dương, Nề Nếp)
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                    Phổ Biến Nhất
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
                  Bảng tổng hợp chi tiết theo từng học sinh: Lỗi vi phạm và điểm trừ, khen thưởng và điểm cộng, tình hình vắng/trễ, điểm nề nếp tổng kết (100 ± thưởng/phạt), xếp loại hạnh kiểm và số điện thoại phụ huynh.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExportStudentLedgerExcel();
                }}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Xuất Excel (.xlsx)
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExportStudentLedgerWord();
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileText className="w-4 h-4" />
                Xuất Word (.doc)
              </button>
            </div>
          </div>
        </div>

        {/* Card 1: Báo cáo Word tổng hợp */}
        <div
          onClick={() => {
            setActiveReportTab('comprehensive_word');
            setPreviewMode('admin_report');
          }}
          className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeReportTab === 'comprehensive_word' && previewMode === 'admin_report'
              ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-500 shadow-sm ring-1 ring-cyan-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                Word (.doc)
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Báo Cáo Công Tác Chủ Nhiệm (BGH)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Báo cáo toàn diện (Sĩ số, nề nếp, xếp loại thi đua tổ, khen thưởng, vi phạm, thu chi quỹ, kế hoạch) chuẩn mẫu Bộ GD&ĐT.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-600 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Xem trước & Tải về
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExportWordReport();
              }}
              className="p-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs cursor-pointer"
              title="Tải ngay"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: Sổ Excel Đa Sheet */}
        <div
          onClick={() => setActiveReportTab('multi_excel')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeReportTab === 'multi_excel'
              ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-500 shadow-sm ring-1 ring-cyan-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Excel (6 Sheet)
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Sổ Báo Cáo Tổng Hợp Trọn Gói
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              File Excel đa năng gồm 6 sheet: Tổng quan chỉ số, Điểm danh chuyên cần, Khen thưởng, Vi phạm, Thu chi quỹ, Liên hệ phụ huynh.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Xuất file
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExportMultiSheetExcel();
              }}
              className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
              title="Tải ngay"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 3: Bảng theo dõi chuyên cần Excel */}
        <div
          onClick={() => setActiveReportTab('attendance_excel')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeReportTab === 'attendance_excel'
              ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-500 shadow-sm ring-1 ring-cyan-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                Excel (.xlsx)
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Sổ Theo Dõi Chuyên Cần & Điểm Danh
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Thống kê chi tiết từng học sinh: số buổi vắng có phép, không phép, đi muộn trong kỳ kèm SĐT phụ huynh.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Xuất file
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExportAttendanceExcel();
              }}
              className="p-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs cursor-pointer"
              title="Tải ngay"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 4: Báo cáo Thi đua & Khen thưởng - Vi phạm */}
        <div
          onClick={() => setActiveReportTab('emulation_excel')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeReportTab === 'emulation_excel'
              ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-500 shadow-sm ring-1 ring-cyan-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                Excel (.xlsx)
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Báo Cáo Thi Đua & Nề Nếp Kỷ Cương
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Bảng xếp hạng điểm thi đua 4 tổ, danh sách khen thưởng và danh sách học sinh vi phạm trong kỳ.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Xuất file
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExportEmulationExcel();
              }}
              className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs cursor-pointer"
              title="Tải ngay"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 5: Bảng kê thu chi quỹ lớp */}
        <div
          onClick={() => setActiveReportTab('finance_excel')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeReportTab === 'finance_excel'
              ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-500 shadow-sm ring-1 ring-cyan-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                Excel (.xlsx)
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Bảng Kê Quyết Toán Quỹ Lớp
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Bảng kê chi tiết từng phiếu thu - phiếu chi, tổng kết thu chi và tồn quỹ trong kỳ báo cáo.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Xuất file
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExportFinanceExcel();
              }}
              className="p-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs cursor-pointer"
              title="Tải ngay"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 6: Danh sách trích ngang học sinh */}
        <div
          onClick={() => setActiveReportTab('students_excel')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeReportTab === 'students_excel'
              ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-500 shadow-sm ring-1 ring-cyan-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Excel (.xlsx)
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Danh Sách Trích Ngang Học Sinh
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Hồ sơ trích ngang {students.length} học sinh: Ngày sinh, cha mẹ, số điện thoại, BHYT, chức vụ, hoàn cảnh gia đình.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Xuất file
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExportStudentsExcel();
              }}
              className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs cursor-pointer"
              title="Tải ngay"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Live Document Preview Frame */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        {/* Header & Mode Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-600" />
              Xem Trước & Xuất Dữ Liệu Thực Tế
            </h3>
            <p className="text-xs text-slate-500">
              Dữ liệu tính toán theo phạm vi: <strong className="text-cyan-700 dark:text-cyan-400">{periodLabel}</strong>
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => setPreviewMode('student_ledger')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                previewMode === 'student_ledger'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Bảng Tổng Hợp Học Sinh (Vi Phạm & Khen Thưởng)
            </button>
            <button
              onClick={() => setPreviewMode('admin_report')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                previewMode === 'admin_report'
                  ? 'bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Báo Cáo Hành Chính (BGH)
            </button>
          </div>
        </div>

        {/* MODE 1: STUDENT DETAILED LEDGER TABLE */}
        {previewMode === 'student_ledger' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên, mã HS..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-hidden focus:border-teal-500"
                  />
                  {studentSearchQuery && (
                    <button
                      onClick={() => setStudentSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Group Filter */}
                <select
                  value={studentGroupFilter}
                  onChange={(e) => setStudentGroupFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 outline-hidden focus:border-teal-500"
                >
                  <option value="all">Tất cả các tổ (Tổ 1 - 4)</option>
                  <option value="1">Tổ 1</option>
                  <option value="2">Tổ 2</option>
                  <option value="3">Tổ 3</option>
                  <option value="4">Tổ 4</option>
                </select>

                {/* Status Filter */}
                <select
                  value={studentStatusFilter}
                  onChange={(e) => setStudentStatusFilter(e.target.value as any)}
                  className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 outline-hidden focus:border-teal-500"
                >
                  <option value="all">Tất cả tình trạng</option>
                  <option value="has_violation">Chỉ học sinh có VI PHẠM</option>
                  <option value="has_reward">Chỉ học sinh có KHEN THƯỞNG</option>
                  <option value="has_absent">Chỉ học sinh có NGHỈ / ĐI MUỘN</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  id="export-ledger-excel-btn"
                  onClick={handleExportStudentLedgerExcel}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Xuất Excel (.xlsx)
                </button>
                <button
                  id="export-ledger-word-btn"
                  onClick={handleExportStudentLedgerWord}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  Xuất Word (.doc)
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs transition-colors cursor-pointer"
                  title="In trang này"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Metrics of filtered data */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500">Hiển thị</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {filteredStudentLedger.length} / {students.length} <span className="text-xs font-normal text-slate-400">học sinh</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
                <div className="text-[11px] text-rose-600 dark:text-rose-400">Tổng lượt vi phạm</div>
                <div className="text-lg font-bold text-rose-700 dark:text-rose-300">
                  {filteredViolations.length} <span className="text-xs font-normal text-rose-500">lượt</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Tổng lượt khen thưởng</div>
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {filteredRewards.length} <span className="text-xs font-normal text-emerald-500">lượt</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                <div className="text-[11px] text-amber-600 dark:text-amber-400">Tổng lượt vắng / trễ</div>
                <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
                  {absentExcused + absentUnexcused + lateCount} <span className="text-xs font-normal text-amber-500">lượt</span>
                </div>
              </div>
            </div>

            {/* Interactive Full Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 font-bold">
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-3 min-w-[180px]">Học Sinh</th>
                    <th className="py-3 px-2 w-14 text-center">Tổ</th>
                    <th className="py-3 px-3 min-w-[120px] text-center">Chuyên Cần</th>
                    <th className="py-3 px-3 min-w-[200px]">Tuyên Dương & Điểm Cộng</th>
                    <th className="py-3 px-3 min-w-[220px]">Lỗi Vi Phạm & Điểm Trừ</th>
                    <th className="py-3 px-3 w-28 text-center">Điểm & Xếp Loại</th>
                    <th className="py-3 px-3 min-w-[120px]">SĐT Phụ Huynh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudentLedger.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        Không tìm thấy học sinh nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredStudentLedger.map((item, idx) => (
                      <tr
                        key={item.student.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                          item.violations.length > 0
                            ? 'bg-rose-50/20 dark:bg-rose-950/10'
                            : item.rewards.length > 0
                            ? 'bg-emerald-50/20 dark:bg-emerald-950/10'
                            : ''
                        }`}
                      >
                        {/* STT */}
                        <td className="py-3 px-3 text-center text-slate-500 font-medium">
                          {idx + 1}
                        </td>

                        {/* Student Name */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {item.student.fullName}
                            {item.student.position && item.student.position !== 'Thành viên' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-medium">
                                {item.student.position}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Mã: <span className="font-mono">{item.student.code}</span> • {item.student.gender} • {item.student.dob}
                          </div>
                        </td>

                        {/* Group */}
                        <td className="py-3 px-2 text-center">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                            Tổ {item.student.group}
                          </span>
                        </td>

                        {/* Attendance */}
                        <td className="py-3 px-3 text-center">
                          {item.attExcused === 0 && item.attUnexcused === 0 && item.attLate === 0 && item.attTruant === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle className="w-3.5 h-3.5" /> Đầy đủ
                            </span>
                          ) : (
                            <div className="space-y-0.5 text-[11px]">
                              {item.attExcused > 0 && (
                                <div className="text-amber-600 dark:text-amber-400 font-medium">
                                  Vắng CP: {item.attExcused}
                                </div>
                              )}
                              {item.attUnexcused > 0 && (
                                <div className="text-rose-600 dark:text-rose-400 font-bold">
                                  Vắng KP: {item.attUnexcused} (-{item.attUnexcused * 10}đ)
                                </div>
                              )}
                              {item.attLateUnder5 > 0 && (
                                <div className="text-amber-500 font-medium">
                                  Muộn &lt;5p: {item.attLateUnder5} (-{item.attLateUnder5 * 5}đ)
                                </div>
                              )}
                              {item.attLateOver5 > 0 && (
                                <div className="text-orange-600 font-bold">
                                  Muộn &ge;5p: {item.attLateOver5} (-{item.attLateOver5 * 10}đ)
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Rewards */}
                        <td className="py-3 px-3">
                          {item.rewards.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          ) : (
                            <div className="space-y-1">
                              {item.rewards.map((r) => (
                                <div
                                  key={r.id}
                                  className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] flex items-start justify-between gap-1.5"
                                >
                                  <div>
                                    <div className="font-semibold text-emerald-800 dark:text-emerald-300">
                                      {r.title}
                                    </div>
                                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                      {formatDateVN(r.date)} {r.category ? `• ${r.category}` : ''}
                                    </div>
                                  </div>
                                  <span className="font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                                    +{r.bonusPoints}đ
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Violations */}
                        <td className="py-3 px-3">
                          {item.violations.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px] flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="w-3 h-3" /> Không vi phạm
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {item.violations.map((v) => (
                                <div
                                  key={v.id}
                                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-[11px] flex items-start justify-between gap-1.5"
                                >
                                  <div>
                                    <div className="font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                                      {v.ruleName}
                                    </div>
                                    <div className="text-[10px] text-rose-600 dark:text-rose-400">
                                      {formatDateVN(v.date)} {v.notes ? `• ${v.notes}` : ''}
                                    </div>
                                  </div>
                                  <span className="font-bold text-rose-700 dark:text-rose-300 shrink-0">
                                    -{v.penaltyPoints}đ
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Score & Rank */}
                        <td className="py-3 px-3 text-center">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {item.netScore} <span className="text-[10px] font-normal text-slate-400">điểm</span>
                          </div>
                          <span
                            className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.rankBadgeColor}`}
                          >
                            {item.conductRank}
                          </span>
                        </td>

                        {/* Contact & Notes */}
                        <td className="py-3 px-3 text-[11px]">
                          <div className="font-mono text-slate-700 dark:text-slate-300">
                            {item.student.parentPhone || '—'}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={item.student.parentName}>
                            {item.student.parentName}
                          </div>
                          {item.student.notes && (
                            <div className="text-[10px] text-slate-500 italic truncate max-w-[140px]" title={item.student.notes}>
                              {item.student.notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODE 2: ADMIN FORMAL WORD-LIKE REPORT */}
        {previewMode === 'admin_report' && (
          <div className="space-y-6">
            <div className="flex justify-end gap-2">
              <button
                id="export-preview-word-btn"
                onClick={handleExportWordReport}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Tải file Word (.doc)
              </button>
              <button
                id="export-preview-excel-btn"
                onClick={handleExportMultiSheetExcel}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Tải file Excel (.xlsx)
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                In báo cáo
              </button>
            </div>

            {/* Paper Document Body */}
            <div className="bg-slate-50 dark:bg-slate-950 p-6 sm:p-10 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-3xl mx-auto font-serif text-slate-800 dark:text-slate-200 text-xs space-y-6 shadow-inner">
              {/* Header Vietnamese Administrative Format */}
              <div className="flex justify-between items-start text-center">
                <div>
                  <div className="font-bold uppercase text-[11px]">SỞ GIÁO DỤC VÀ ĐÀO TẠO</div>
                  <div className="font-bold uppercase text-[11px] underline">
                    {settings.schoolName}
                  </div>
                  <div className="text-[10px] mt-0.5 font-sans">Lớp: {settings.className} • Năm học: {settings.academicYear}</div>
                </div>
                <div>
                  <div className="font-bold uppercase text-[11px]">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </div>
                  <div className="font-bold text-[11px] underline">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="text-[10px] italic mt-0.5">
                    Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold uppercase tracking-wider font-display text-slate-900 dark:text-white">
                  BÁO CÁO CÔNG TÁC CHỦ NHIỆM {periodLabel.toUpperCase()}
                </h2>
                <p className="text-[11px] italic font-sans text-slate-600 dark:text-slate-400">
                  Thời gian thực hiện: Từ {formatDateVN(startDate)} đến {formatDateVN(endDate)}
                </p>
              </div>

              {/* Body Sections */}
              <div className="space-y-4 leading-relaxed font-sans text-xs">
                {/* Mục I: Sĩ số & Chuyên cần */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>I. TÌNH HÌNH SĨ SỐ & CHUYÊN CẦN</span>
                    <span className="text-[10px] font-normal text-slate-400">Đã cập nhật thực tế</span>
                  </div>
                  <div>- Tổng số học sinh: <strong>{students.length}</strong> (Nam: {students.filter(s => s.gender === 'Nam').length}, Nữ: {students.filter(s => s.gender === 'Nữ').length})</div>
                  <div>- Học sinh vắng có phép: <strong>{absentExcused}</strong> lượt</div>
                  <div>- Học sinh vắng không phép: <strong>{absentUnexcused}</strong> lượt {absentUnexcused > 0 ? '(Đã gọi điện phụ huynh)' : '(Tốt)'}</div>
                  <div>- Học sinh đi muộn: <strong>{lateCount}</strong> lượt</div>
                </div>

                {/* Mục II: Nề nếp & Thi đua các tổ */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white">
                    II. NỀ NẾP KỶ CƯƠNG & XẾP LOẠI THI ĐUA CÁC TỔ
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {groupRankings.map((g, idx) => (
                      <div key={g.groupNum} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-center border border-slate-100 dark:border-slate-700">
                        <div className="text-[10px] text-slate-400 font-semibold">Tổ {g.groupNum} • Hạng {idx + 1}</div>
                        <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{g.totalScore} đ</div>
                        <div className="text-[10px] text-slate-500">+{g.bonus} / -{g.penalty}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] pt-1 text-slate-600 dark:text-slate-300">
                    - Khen thưởng trong kỳ: <strong>{filteredRewards.length}</strong> lượt • Vi phạm nề nếp: <strong>{filteredViolations.length}</strong> lượt.
                  </div>
                </div>

                {/* Mục III: Tài chính quỹ lớp */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white">
                    III. QUẢN LÝ TÀI CHÍNH & QUỸ LỚP TRONG KỲ
                  </div>
                  <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                    <div>- Tổng thu phát sinh: <strong className="text-emerald-600">+{totalIncome.toLocaleString('vi-VN')} đ</strong></div>
                    <div>- Tổng chi phát sinh: <strong className="text-rose-600">-{totalExpense.toLocaleString('vi-VN')} đ</strong></div>
                    <div>- Số dư tồn quỹ: <strong className="text-cyan-600">{(totalIncome - totalExpense).toLocaleString('vi-VN')} đ</strong></div>
                  </div>
                </div>

                {/* Mục IV: Đánh giá của GVCN (Cho phép sửa trước khi in) */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-cyan-600" />
                      IV. ĐÁNH GIÁ CHUNG CỦA GIÁO VIÊN CHỦ NHIỆM
                    </span>
                    <span className="text-[10px] text-slate-400">(Có thể chỉnh sửa nội dung)</span>
                  </div>
                  <textarea
                    value={teacherEvaluation}
                    onChange={(e) => setTeacherEvaluation(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-hidden focus:border-cyan-500 font-sans"
                    placeholder="Nhập nhận xét đánh giá của GVCN..."
                  />
                </div>

                {/* Mục V: Phương hướng kế hoạch kỳ tiếp theo */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-cyan-600" />
                      V. PHƯƠNG HƯỚNG & KẾ HOẠCH KỲ TIẾP THEO
                    </span>
                    <span className="text-[10px] text-slate-400">(Có thể chỉnh sửa nội dung)</span>
                  </div>
                  <textarea
                    value={nextPeriodPlan}
                    onChange={(e) => setNextPeriodPlan(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-hidden focus:border-cyan-500 font-sans"
                    placeholder="Nhập phương hướng kế hoạch..."
                  />
                </div>
              </div>

              {/* Signature block */}
              <div className="flex justify-between items-end pt-6 font-serif">
                <div className="text-center space-y-12">
                  <div className="font-bold text-xs">XÁC NHẬN CỦA BAN GIÁM HIỆU</div>
                  <div className="font-semibold text-xs italic text-slate-400">(Ký và đóng dấu)</div>
                </div>
                <div className="text-center space-y-12">
                  <div className="font-bold text-xs">GIÁO VIÊN CHỦ NHIỆM</div>
                  <div className="font-bold text-xs">{settings.teacherName}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
