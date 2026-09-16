import React from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  ShieldCheck,
  AlertTriangle,
  Award,
  GraduationCap,
} from 'lucide-react';
import { Student, AttendanceRecord, ViolationRecord, RewardRecord, ClassSettings } from '../../types';

interface AnalyticsViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  settings: ClassSettings;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  students,
  attendance,
  violations,
  rewards,
  settings,
}) => {
  const maleCount = students.filter((s) => s.gender === 'Nam').length;
  const femaleCount = students.filter((s) => s.gender === 'Nữ').length;
  const unionCount = students.filter((s) => s.isUnionMember).length;

  // Violations categorized
  const violationTypes = [
    { label: 'Đi muộn < 5p', count: 2 }, { label: 'Đi muộn >= 5p', count: 1 },
    { label: 'Sử dụng điện thoại trong giờ', count: 2 },
    { label: 'Không chuẩn bị bài cũ', count: 2 },
    { label: 'Vi phạm đồng phục / thẻ HS', count: 1 },
    { label: 'Nói chuyện riêng', count: 1 },
  ];

  // Subject averages mock
  const subjectAverages = [
    { name: 'Toán học', avg: 8.2, color: 'from-cyan-500 to-cyan-600' },
    { name: 'Ngữ văn', avg: 7.9, color: 'from-amber-400 to-amber-500' },
    { name: 'Tiếng Anh', avg: 8.4, color: 'from-teal-500 to-teal-600' },
    { name: 'Vật lý', avg: 8.0, color: 'from-blue-500 to-blue-600' },
    { name: 'Hóa học', avg: 7.8, color: 'from-purple-500 to-purple-600' },
    { name: 'Sinh học', avg: 8.1, color: 'from-emerald-500 to-emerald-600' },
    { name: 'Lịch sử', avg: 8.5, color: 'from-rose-500 to-rose-600' },
    { name: 'Tin học', avg: 8.9, color: 'from-indigo-500 to-indigo-600' },
  ];

  // Weekly attendance rate
  const weekdays = [
    { day: 'Thứ Hai', rate: 98.5 },
    { day: 'Thứ Ba', rate: 100 },
    { day: 'Thứ Tư', rate: 96.8 },
    { day: 'Thứ Năm', rate: 98.5 },
    { day: 'Thứ Sáu', rate: 98.5 },
    { day: 'Thứ Bảy', rate: 97.0 },
  ];

  return (
    <div id="analytics-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
          Thống Kê & Phân Tích Chuyên Sâu Lớp {settings.className}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tổng hợp trực quan về nhân khẩu học, phổ điểm các bộ môn, xu hướng chuyên cần và phân loại kỷ luật
        </p>
      </div>

      {/* Row 1: Demographics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Gender Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">CƠ CẤU GIỚI TÍNH</span>
            <Users className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-slate-900 dark:text-white">
              {students.length}
            </span>
            <span className="text-xs text-slate-500">Học sinh</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="bg-cyan-500 h-full"
              style={{ width: `${(maleCount / students.length) * 100}%` }}
              title={`Nam: ${maleCount}`}
            />
            <div
              className="bg-pink-500 h-full"
              style={{ width: `${(femaleCount / students.length) * 100}%` }}
              title={`Nữ: ${femaleCount}`}
            />
          </div>
          <div className="flex justify-between text-xs font-semibold pt-1">
            <span className="text-cyan-600">
              Nam: {maleCount} ({Math.round((maleCount / students.length) * 100)}%)
            </span>
            <span className="text-pink-500">
              Nữ: {femaleCount} ({Math.round((femaleCount / students.length) * 100)}%)
            </span>
          </div>
        </div>

        {/* Union Members */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">ĐOÀN VIÊN TNCS</span>
            <ShieldCheck className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-red-600">
              {Math.round((unionCount / students.length) * 100)}%
            </span>
            <span className="text-xs text-slate-500">
              {unionCount}/{students.length} đoàn viên
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="bg-red-500 h-full rounded-full"
              style={{ width: `${(unionCount / students.length) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {students.length - unionCount} học sinh đang học lớp bồi dưỡng cảm tình Đoàn
          </p>
        </div>

        {/* Attention Students */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">CẦN QUAN TÂM ĐẶC BIỆT</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-amber-600">
              {students.filter((s) => s.specialAttention).length}
            </span>
            <span className="text-xs text-slate-500">Học sinh</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full"
              style={{
                width: `${(students.filter((s) => s.specialAttention).length / students.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-slate-400">Gặp khó khăn kinh tế, mồ côi hoặc học lực yếu</p>
        </div>
      </div>

      {/* Row 2: Subject Averages Charts */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              Phổ Điểm Trung Bình Các Môn Học (Học Kỳ 1)
            </h3>
            <p className="text-xs text-slate-500">Đánh giá mức độ đồng đều giữa các tổ hợp môn</p>
          </div>
          <span className="text-xs font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 px-3 py-1 rounded-xl">
            Điểm TB Lớp: 8.2
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectAverages.map((sub) => (
            <div
              key={sub.name}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-800 dark:text-slate-200">{sub.name}</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-black">{sub.avg}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${sub.color} rounded-full`}
                  style={{ width: `${(sub.avg / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Weekly Attendance Trend & Violation Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Days */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
            Tỷ Lệ Chuyên Cần Theo Thứ Trong Tuần
          </h3>
          <p className="text-xs text-slate-500">Thứ Ba chuyên cần 100%, Thứ Tư có tỉ lệ vắng cao nhất</p>

          <div className="space-y-3 pt-2">
            {weekdays.map((wd) => (
              <div key={wd.day} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">{wd.day}</span>
                  <span className="text-emerald-600 font-bold">{wd.rate}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${wd.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Violations Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
            Phân Loại Lỗi Vi Phạm Phổ Biến
          </h3>
          <p className="text-xs text-slate-500">Cơ sở để giáo viên chủ nhiệm chấn chỉnh trong giờ sinh hoạt lớp</p>

          <div className="space-y-3 pt-2">
            {violationTypes.map((vt) => (
              <div
                key={vt.label}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-700 dark:text-slate-300">{vt.label}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold">
                  {vt.count} vụ việc
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
