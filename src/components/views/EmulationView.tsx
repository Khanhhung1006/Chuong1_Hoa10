import React, { useState } from 'react';
import {
  Trophy,
  Medal,
  TrendingUp,
  AlertTriangle,
  Award,
  Users,
  ChevronRight,
  Shield,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { Student, ViolationRecord, RewardRecord, ClassSettings } from '../../types';

interface EmulationViewProps {
  students: Student[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  settings?: ClassSettings;
  onOpenStudentDetail?: (student: Student) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const EmulationView: React.FC<EmulationViewProps> = ({
  students = [],
  violations = [],
  rewards = [],
  settings,
  onOpenStudentDetail,
  onShowToast,
}) => {
  const [selectedWeek, setSelectedWeek] = useState('Tuần 2');

  const basePointsPerStudent = 100; // Mặc định cố định 100 điểm/tháng per học sinh

  // Calculate stats for each of 4 groups
  const groupsData = [1, 2, 3, 4].map((grp) => {
    const grpStudents = students.filter((s) => s.group === grp);
    const grpStudentIds = new Set(grpStudents.map((s) => s.id));

    const grpViolations = violations.filter((v) => grpStudentIds.has(v.studentId));
    const grpRewards = rewards.filter((r) => grpStudentIds.has(r.studentId));

    const totalDeductions = grpViolations.reduce((sum, v) => sum + v.penaltyPoints, 0);
    const totalBonuses = grpRewards.reduce((sum, r) => sum + r.bonusPoints, 0);
    
    const memberCount = grpStudents.length;
    const totalPoints = memberCount > 0 ? (memberCount * basePointsPerStudent) + totalBonuses - totalDeductions : 0;
    const finalScore = memberCount > 0 ? Number((totalPoints / memberCount).toFixed(1)) : 0;

    // Leader & vice leader
    const leader = grpStudents.find((s) => s.roleInClass?.includes('Tổ trưởng'));
    const viceLeader = grpStudents.find((s) => s.roleInClass?.includes('Tổ phó'));

    return {
      group: grp,
      students: grpStudents,
      leader,
      viceLeader,
      violations: grpViolations,
      rewards: grpRewards,
      totalDeductions,
      totalBonuses,
      finalScore,
    };
  });

  // Sort descending by final score
  const rankedGroups = [...groupsData].sort((a, b) => b.finalScore - a.finalScore);

  return (
    <div id="emulation-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            Phong Trào Thi Đua 4 Tổ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Điểm gốc: 100 điểm/tháng (cố định) • Cộng thưởng và trừ vi phạm tự động
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Kỳ thi đua:</label>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-hidden"
          >
            <option value="Tuần 1">Tuần 1 (Khai giảng)</option>
            <option value="Tuần 2">Tuần 2 (Hiện tại)</option>
            <option value="Tháng 9">Tổng kết Tháng 9</option>
          </select>
        </div>
      </div>

      {/* Podium Cards: 4 Ranks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rankedGroups.map((g, idx) => {
          const isFirst = idx === 0;
          const isSecond = idx === 1;
          const isThird = idx === 2;
          const medal = isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : '🎗️';
          const rankTitle = isFirst ? 'HẠNG NHẤT' : isSecond ? 'HẠNG NHÌ' : isThird ? 'HẠNG BA' : 'HẠNG TƯ';

          return (
            <div
              key={g.group}
              id={`group-card-rank-${idx + 1}`}
              className={`rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                isFirst
                  ? 'bg-gradient-to-b from-amber-500/10 to-amber-500/5 border-amber-400 dark:border-amber-600 shadow-md shadow-amber-500/10'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{medal}</span>
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      isFirst
                        ? 'bg-amber-400 text-amber-950 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {rankTitle}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="text-lg font-black font-display text-slate-900 dark:text-white">
                    TỔ {g.group}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {g.students.length} thành viên • TT: {g.leader?.fullName || 'Chưa phân công'}
                  </p>
                </div>

                <div className="mt-4 text-center py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">TỔNG ĐIỂM</div>
                  <div className="text-3xl font-black text-cyan-600 dark:text-cyan-400 font-display my-0.5">
                    {g.finalScore}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Gốc: 300 đ
                  </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-center text-xs">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold">
                    <span className="text-[10px] block text-emerald-600">Thưởng</span>
                    +{g.totalBonuses} đ
                  </div>
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-semibold">
                    <span className="text-[10px] block text-rose-600">Vi phạm</span>
                    -{g.totalDeductions} đ
                  </div>
                </div>
              </div>

              {/* Members Preview */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 mb-2">THÀNH VIÊN ({g.students.length}):</div>
                <div className="flex flex-wrap gap-1 py-1">
                  {g.students.slice(0, 6).map((st) => (
                    <span
                      key={st.id}
                      onClick={() => onOpenStudentDetail?.(st)}
                      className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:text-cyan-600 hover:underline"
                    >
                      {st.fullName}{g.students.indexOf(st) < Math.min(g.students.length, 6) - 1 ? ',' : ''}
                    </span>
                  ))}
                  {g.students.length > 6 && (
                    <span className="text-xs text-slate-400">
                      +{g.students.length - 6}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Groups Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groupsData.map((g) => (
          <div
            key={g.group}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-black text-base">
                  T{g.group}
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                    Chi Tiết Thi Đua Tổ {g.group}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tổ trưởng: {g.leader?.fullName || 'Chưa chọn'} • Tổ phó: {g.viceLeader?.fullName || 'Chưa chọn'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-cyan-600 font-display">
                  {g.finalScore} đ
                </span>
              </div>
            </div>

            {/* List of members in this group */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto pr-1">
              {g.students.map((st) => (
                <div
                  key={st.id}
                  onClick={() => onOpenStudentDetail(st)}
                  className="py-2 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {st.fullName}
                      </span>
                      {st.roleInClass && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                          {st.roleInClass}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{st.code}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
