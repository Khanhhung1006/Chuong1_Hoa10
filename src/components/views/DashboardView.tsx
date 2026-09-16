import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  Award,
  Cake,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  ViolationRecord,
  RewardRecord,
  ClassSettings,
  CalendarEvent,
  PhoneRecord,
} from '../../types';
import { NavTab } from '../common/Sidebar';
import { storageService } from '../../services/storageService';

interface DashboardViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  events: CalendarEvent[];
  settings: ClassSettings;
  phoneRecords?: PhoneRecord[];
  onNavigate: (tab: NavTab) => void;
  onOpenStudentDetail: (student: Student) => void;
  onOpenAI: () => void;
  onOpenClassInitModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students = [],
  attendance = [],
  violations = [],
  rewards = [],
  events = [],
  settings,
  phoneRecords,
  onNavigate,
  onOpenStudentDetail,
  onOpenAI,
  onOpenClassInitModal,
}) => {
  const today = '2026-09-14';

  // Calculate today stats
  const safeStudents = students || [];
  const safeAttendance = attendance || [];
  const safeViolations = violations || [];
  const safeRewards = rewards || [];
  const safeEvents = events || [];

  const todayAtt = safeAttendance.filter((a) => a.date === today);
  const absentCount = todayAtt.filter(
    (a) => a.status === 'absent_excused' || a.status === 'absent_unexcused' || a.status === 'truant'
  ).length;
  const lateUnder5Count = todayAtt.filter((a) => a.status === 'late_under_5').length;
  const lateOver5Count = todayAtt.filter((a) => a.status === 'late_over_5').length;
  const lateCount = lateUnder5Count + lateOver5Count;
  const presentCount = safeStudents.length - absentCount;
  const boysCount = safeStudents.filter((s) => s.gender === 'Nam').length;
  const girlsCount = safeStudents.filter((s) => s.gender === 'Nữ').length;

  // Conduct rating breakdown
  const conductGoodCount = safeStudents.filter((s) => {
    const vCount = safeViolations.filter((v) => v.studentId === s.id).length;
    return vCount === 0;
  }).length;
  const conductFairCount = safeStudents.filter((s) => {
    const vCount = safeViolations.filter((v) => v.studentId === s.id).length;
    return vCount >= 1 && vCount <= 2;
  }).length;
  const conductPassCount = Math.max(0, safeStudents.length - conductGoodCount - conductFairCount);

  const goodPct = safeStudents.length > 0 ? Number(((conductGoodCount / safeStudents.length) * 100).toFixed(1)) : 0;
  const fairPct = safeStudents.length > 0 ? Number(((conductFairCount / safeStudents.length) * 100).toFixed(1)) : 0;
  const passPct = safeStudents.length > 0 ? Number(((conductPassCount / safeStudents.length) * 100).toFixed(1)) : 0;

  // Weekly attendance rate
  const totalAttendanceDays = new Set(safeAttendance.map((a) => a.date)).size || 1;
  const totalAbsents = safeAttendance.filter(
    (a) => a.status === 'absent_excused' || a.status === 'absent_unexcused' || a.status === 'truant'
  ).length;
  const totalPossible = safeStudents.length * totalAttendanceDays;
  const attendanceRate = totalPossible > 0 ? (((totalPossible - totalAbsents) / totalPossible) * 100).toFixed(1) : '98.4';

  // Birthday this month / week
  const currentMonth = new Date().getMonth() + 1; // e.g. 9
  const birthdayStudents = safeStudents.filter((s) => {
    const m = parseInt(s.dob.split('-')[1], 10);
    return m === currentMonth;
  });

  // Birthday today!
  const todayBirthdays = safeStudents.filter((s) => {
    const parts = s.dob.split('-');
    if (parts.length < 3) return false;
    const dobMonth = parseInt(parts[1], 10);
    const dobDay = parseInt(parts[2], 10);

    const dashboardParts = today.split('-');
    const dashMonth = parseInt(dashboardParts[1], 10);
    const dashDay = parseInt(dashboardParts[2], 10);

    const sysDate = new Date();
    const sysMonth = sysDate.getMonth() + 1;
    const sysDay = sysDate.getDate();

    return (dobMonth === dashMonth && dobDay === dashDay) || (dobMonth === sysMonth && dobDay === sysDay);
  });

  // Students requiring special attention
  const attentionStudents = safeStudents.filter((s) => s.specialAttention);

  // Group emulation points
  const groupScores = [1, 2, 3, 4].map((grp) => {
    const groupStudents = safeStudents.filter((s) => s.group === grp);
    const grpStudentIds = groupStudents.map((s) => s.id);
    const totalRewards = safeRewards
      .filter((r) => grpStudentIds.includes(r.studentId))
      .reduce((sum, r) => sum + r.bonusPoints, 0);
    const totalViolations = safeViolations
      .filter((v) => grpStudentIds.includes(v.studentId))
      .reduce((sum, v) => sum + v.penaltyPoints, 0);
    
    const baseScorePerStudent = settings?.baseScorePerWeek || 100;
    const memberCount = groupStudents.length;
    const totalPoints = memberCount > 0 ? (memberCount * baseScorePerStudent) + totalRewards - totalViolations : 0;
    const averagePoints = memberCount > 0 ? Number((totalPoints / memberCount).toFixed(1)) : 0;

    return {
      group: grp,
      studentsCount: memberCount,
      points: averagePoints,
      rewardsCount: totalRewards,
      violationsCount: totalViolations,
    };
  });

  // Sort groups by points descending
  const sortedGroups = [...groupScores].sort((a, b) => b.points - a.points);

  // Phone submission and violation calculations for the banner summary
  const exemptedIds = settings.exemptedPhoneStudentIds || [];
  const safeStudentIds = new Set(safeStudents.map((s) => s.id));
  const activeClassRecords =
    phoneRecords && phoneRecords.length > 0
      ? phoneRecords
      : storageService.getPhoneRecords(settings.className);

  const todayPhones = activeClassRecords.filter(
    (p) => p.date === today && safeStudentIds.has(p.studentId)
  );

  // Consider active session (Morning/Afternoon) to avoid summing multiple sessions of the same day
  const currentSession = settings.defaultSession || 'Sáng';
  const sessionPhones = todayPhones.filter(
    (p) => (p.session || 'Sáng') === currentSession
  );
  const targetPhones = sessionPhones.length > 0 ? sessionPhones : todayPhones;

  // Deduplicate by studentId to guarantee no double counting across multiple records
  const submittedStudentIds = new Set<string>();
  targetPhones.forEach((p) => {
    if (
      p.status === 'submitted' &&
      !exemptedIds.includes(p.studentId) &&
      safeStudentIds.has(p.studentId)
    ) {
      submittedStudentIds.add(p.studentId);
    }
  });

  const requiredCount = safeStudents.filter((s) => !exemptedIds.includes(s.id)).length;
  // Guaranteed mathematically: submittedCount <= requiredCount <= safeStudents.length
  const submittedCount = Math.min(submittedStudentIds.size, requiredCount);

  const todayViolationsCount = safeViolations.filter((v) => v.date === today).length;
  const neNepStatus = todayViolationsCount > 0 ? `${todayViolationsCount} vi phạm` : 'Ổn định';

  const formattedDate = (() => {
    const parts = today.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return today;
  })();

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-cyan-900 dark:bg-cyan-950 p-6 sm:p-8 text-white shadow-xl shadow-cyan-900/10">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
              {settings.className} - {formattedDate}
            </h2>
            <p className="text-sm sm:text-base text-cyan-50/90 leading-relaxed font-medium space-x-1">
              <span>Sĩ số: <strong className="text-white font-bold">{presentCount}/{students.length}</strong></span>
              <span className="text-white/40">•</span>
              <span>Nề nếp: <strong className="text-white font-bold">{neNepStatus}</strong></span>
              <span className="text-white/40">•</span>
              <span>Điện thoại: <strong className="text-white font-bold">{submittedCount}/{requiredCount}</strong></span>
            </p>
          </div>

          <div className="flex flex-row flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <button
              id="dashboard-phone-btn"
              onClick={() => onNavigate('phones')}
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap"
              title="Quản lý nộp điện thoại di động của học sinh"
            >
              <Smartphone className="w-4 h-4 text-cyan-200" />
              Quản lý điện thoại
            </button>
            <button
              id="dashboard-attendance-btn"
              onClick={() => onNavigate('attendance')}
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-white text-cyan-800 text-xs font-bold shadow-md hover:bg-cyan-50 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4 text-cyan-600" />
              Điểm danh
            </button>
          </div>
        </div>
      </div>

      {/* Birthday Celebration Banner */}
      {todayBirthdays.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 dark:from-slate-900 dark:via-rose-950/25 dark:to-amber-950/20 p-5 border border-rose-200/80 dark:border-rose-900/50 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300">
          {/* Decorative abstract shapes */}
          <div className="absolute -right-10 -top-10 w-28 h-28 bg-rose-200/40 dark:bg-rose-900/10 rounded-full blur-xl pointer-events-none animate-pulse" />
          <div className="absolute -left-10 -bottom-10 w-28 h-28 bg-amber-200/40 dark:bg-amber-900/10 rounded-full blur-xl pointer-events-none animate-pulse" />
          
          <div className="flex items-start md:items-center gap-4 relative z-10">
            <div className="p-3.5 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 animate-bounce shadow-md shrink-0">
              <Cake className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tracking-wide uppercase">
                  Hôm nay có sinh nhật! 🎉
                </span>
                <span className="flex gap-0.5 text-amber-500 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white font-display leading-tight">
                Chúc mừng sinh nhật {todayBirthdays.map(s => s.fullName).join(' & ')}!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Chúc {todayBirthdays.map(s => s.fullName).join(' & ')} (Tổ {todayBirthdays.map(s => s.group).join(', ')}) tuổi mới luôn mạnh khỏe, tràn đầy niềm vui, hạnh phúc và gặt hái được nhiều thành tích xuất sắc trong năm học 2026 - 2027 này! 🌸🎂🎁
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 relative z-10 shrink-0 self-end md:self-center">
            {todayBirthdays.map(s => (
              <button
                key={s.id}
                onClick={() => onOpenStudentDetail(s)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-all shadow-sm cursor-pointer hover:scale-102 active:scale-98"
              >
                Xem hồ sơ {s.fullName.split(' ').pop()} ➜
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Metric Cards Grid (8 Core Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4">
        {/* 1. Tổng số học sinh */}
        <div
          id="stat-total-students"
          onClick={() => onNavigate('students')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Users className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-slate-400">SĨ SỐ</span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-display">
            {students.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {boysCount} Nam • {girlsCount} Nữ
          </div>
        </div>

        {/* 2. Đúng giờ hôm nay */}
        <div
          id="stat-present-today"
          onClick={() => onNavigate('attendance')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <UserCheck className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-emerald-600">CÓ MẶT</span>
          </div>
          <div className="text-xl font-black text-emerald-600 font-display">
            {presentCount}
          </div>
          <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 truncate mt-0.5">
            {Math.round((presentCount / students.length) * 100)}% sĩ số
          </div>
        </div>

        {/* 3. Nghỉ học */}
        <div
          id="stat-absent-today"
          onClick={() => onNavigate('attendance')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <UserX className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-rose-600">NGHỈ</span>
          </div>
          <div className="text-xl font-black text-rose-600 font-display">
            {absentCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {absentCount > 0 ? 'Có phép' : 'Đủ sĩ số'}
          </div>
        </div>

        {/* 4. Đi muộn */}
        <div
          id="stat-late-today"
          onClick={() => onNavigate('attendance')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Clock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-amber-600">ĐI MUỘN</span>
          </div>
          <div className="text-xl font-black text-amber-600 font-display">
            {lateCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {lateCount > 0 ? 'Học sinh' : 'Không có'}
          </div>
        </div>

        {/* 5. Vi phạm */}
        <div
          id="stat-violations"
          onClick={() => onNavigate('violations')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-rose-500">VI PHẠM</span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-display">
            {violations.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            Đã ghi sổ
          </div>
        </div>

        {/* 6. Khen thưởng */}
        <div
          id="stat-rewards"
          onClick={() => onNavigate('violations')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Award className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-amber-600">KHEN THƯỞNG</span>
          </div>
          <div className="text-xl font-black text-amber-500 font-display">
            {rewards.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            Lượt tuyên dương
          </div>
        </div>

        {/* 7. Sinh nhật tháng này */}
        <div
          id="stat-birthdays"
          onClick={() => onNavigate('students')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Cake className="w-4 h-4 text-pink-500 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-pink-600">SINH NHẬT</span>
          </div>
          <div className="text-xl font-black text-pink-600 font-display">
            {birthdayStudents.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            Tháng {currentMonth}
          </div>
        </div>

        {/* 8. Học sinh cần quan tâm */}
        <div
          id="stat-attention"
          onClick={() => onNavigate('students')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <AlertCircle className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-cyan-600">CẦN ĐỂ Ý</span>
          </div>
          <div className="text-xl font-black text-cyan-600 font-display">
            {attentionStudents.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            Hồ sơ đặc biệt
          </div>
        </div>
      </div>

      {/* Charts Section: Chuyên cần, Hạnh kiểm, Điểm trung bình, Thi đua tổ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Thi đua 4 Tổ */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Bảng Xếp Hạng Thi Đua 4 Tổ
              </h3>
              <p className="text-xs text-slate-500">Cộng điểm nề nếp, học tập và hoạt động Đoàn</p>
            </div>
            <button
              onClick={() => onNavigate('emulation')}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 cursor-pointer"
            >
              Chi tiết <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {sortedGroups.map((g, idx) => {
              const maxPoints = Math.max(...sortedGroups.map((x) => x.points), settings?.baseScorePerWeek || 100);
              const pct = Math.round((g.points / maxPoints) * 100);
              const rankMedal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎗️';
              return (
                <div key={g.group} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{rankMedal}</span>
                      <span className="text-slate-800 dark:text-slate-100 font-bold">
                        Tổ {g.group}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({g.studentsCount} học sinh)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-emerald-600">+{g.rewardsCount}</span>
                      <span className="text-[11px] text-rose-500">-{g.violationsCount}</span>
                      <span className="text-sm font-black text-cyan-600 dark:text-cyan-400">
                        {g.points} đ
                      </span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        idx === 0
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                          : idx === 1
                          ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                          : 'bg-gradient-to-r from-slate-400 to-slate-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Tỉ lệ chuyên cần & Hạnh kiểm */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  Chuyên Cần & Hạnh Kiểm Toàn Lớp
                </h3>
                <p className="text-xs text-slate-500">Dữ liệu đánh giá sơ bộ Tháng 9</p>
              </div>
              <button
                onClick={() => onNavigate('conduct')}
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 cursor-pointer"
              >
                Chi tiết <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Visual breakdown cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-center">
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Tốt</div>
                <div className="text-2xl font-black text-emerald-600 my-1 font-display">{goodPct}%</div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400">{conductGoodCount} Học sinh</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50 text-center">
                <div className="text-xs font-bold text-cyan-800 dark:text-cyan-300">Khá</div>
                <div className="text-2xl font-black text-cyan-600 my-1 font-display">{fairPct}%</div>
                <div className="text-[11px] text-cyan-700 dark:text-cyan-400">{conductFairCount} Học sinh</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 text-center">
                <div className="text-xs font-bold text-amber-800 dark:text-amber-300">Đạt / Yếu</div>
                <div className="text-2xl font-black text-amber-600 my-1 font-display">{passPct}%</div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400">{conductPassCount} Học sinh</div>
              </div>
            </div>

            {/* Attendance weekly trend pill */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tỉ lệ chuyên cần trung bình tuần này
                </div>
                <div className="text-[11px] text-slate-500">Mục tiêu trường: &gt; 98.0%</div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span className="text-xl font-black text-emerald-600 font-display">{attendanceRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Học sinh cần quan tâm & Lịch công tác sắp tới */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Học sinh cần quan tâm */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  Học Sinh Cần Quan Tâm ({attentionStudents.length})
                </h3>
                <p className="text-xs text-slate-500">Gặp khó khăn về hoàn cảnh, tâm lý hoặc học tập</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('students')}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-3">
            {attentionStudents.map((s) => (
              <div
                key={s.id}
                onClick={() => onOpenStudentDetail(s)}
                className="p-3.5 rounded-2xl border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-100/40 dark:hover:bg-amber-950/40 transition-all cursor-pointer flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {s.fullName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-900 font-semibold">
                        Tổ {s.group}
                      </span>
                    </div>
                    <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-1 leading-snug">
                      {s.attentionReason || 'Cần theo dõi thêm.'}
                    </p>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Phụ huynh: {s.parentPhone}
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Lịch công tác sắp tới */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  Lịch Công Tác Sắp Tới
                </h3>
                <p className="text-xs text-slate-500">Các sự kiện và mốc thời gian quan trọng</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 cursor-pointer"
            >
              Xem lịch
            </button>
          </div>

          <div className="space-y-3">
            {(safeEvents || []).slice(0, 3).map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {ev.title}
                    </span>
                    {ev.isImportant && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                        Quan trọng
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{ev.description}</p>
                  <div className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                    {ev.date} {ev.time ? `• ${ev.time}` : ''} {ev.location ? `• ${ev.location}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
