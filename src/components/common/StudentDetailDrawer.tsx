import React from 'react';
import {
  X,
  PhoneCall,
  MessageSquare,
  AlertTriangle,
  Award,
  Calendar,
  Heart,
  MapPin,
  ShieldAlert,
  Edit2,
  GraduationCap,
  UserCheck,
} from 'lucide-react';
import { Student, AttendanceRecord, ViolationRecord, RewardRecord, GradeRecord } from '../../types';

interface StudentDetailDrawerProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  attendance: AttendanceRecord[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  grades: GradeRecord[];
  onOpenEditStudent?: (student: Student) => void;
  onOpenParentContact?: (student: Student) => void;
}

export const StudentDetailDrawer: React.FC<StudentDetailDrawerProps> = ({
  student,
  isOpen,
  onClose,
  attendance,
  violations,
  rewards,
  grades,
  onOpenEditStudent,
  onOpenParentContact,
}) => {
  if (!isOpen || !student) return null;

  const studentViolations = violations.filter((v) => v.studentId === student.id);
  const studentRewards = rewards.filter((r) => r.studentId === student.id);
  const studentAttendance = attendance.filter((a) => a.studentId === student.id);
  const absentDays = studentAttendance.filter((a) => a.status === 'Vắng có phép' || a.status === 'Vắng không phép');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-screen sm:max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              Hồ Sơ Chi Tiết Học Sinh
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Top Profile Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30 border border-cyan-100 dark:border-cyan-900/40">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {student.fullName}
                </h4>
                <p className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                  Mã số: {student.code}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300">
                    Tổ {student.group}
                  </span>
                  {student.roleInClass && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                      {student.roleInClass}
                    </span>
                  )}
                  {student.isUnionMember && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300">
                      Đoàn viên
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions (Call, Zalo) */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${student.parentPhone}`}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Gọi phụ huynh
              </a>
              <a
                href={`https://zalo.me/${student.parentPhone}`}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Nhắn tin Zalo
              </a>
            </div>

            {/* Personal Details */}
            <div className="space-y-3 text-xs">
              <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-slate-400">
                Thông tin cá nhân & Gia đình
              </h5>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày sinh:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {student.dob} ({student.gender})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Địa chỉ cư trú:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[220px]">
                    {student.address}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cha:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {student.fatherName || 'Chưa rõ'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mẹ:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {student.motherName || 'Chưa rõ'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SĐT Phụ huynh:</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">
                    {student.parentPhone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SĐT Học sinh:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {student.studentPhone || 'Chưa có'}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance & Violations Summary */}
            <div className="space-y-3 text-xs">
              <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-slate-400">
                Theo dõi chuyên cần & nề nếp
              </h5>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Nghỉ học</span>
                  <span className="text-base font-black text-rose-600">
                    {absentDays.length} buổi
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Lượt vi phạm</span>
                  <span className="text-base font-black text-amber-600">
                    {studentViolations.length} lần
                  </span>
                </div>
              </div>

              {/* Violations preview */}
              {studentViolations.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Nhật ký lỗi vi phạm:
                  </div>
                  {studentViolations.map((v) => (
                    <div
                      key={v.id}
                      className="p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 text-[11px] text-rose-800 dark:text-rose-300 flex items-center justify-between"
                    >
                      <span>
                        {v.date}: {v.content}
                      </span>
                      <span className="font-bold">-{v.penaltyPoints}đ</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Note & special attention */}
            {student.notes && (
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200">
                <div className="font-bold mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Ghi chú của GVCN:
                </div>
                <p>{student.notes}</p>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 cursor-pointer"
            >
              Đóng lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
