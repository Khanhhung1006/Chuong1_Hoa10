import React, { useState } from 'react';
import {
  PhoneCall,
  MessageSquare,
  Search,
  ExternalLink,
  Copy,
  Check,
  Send,
  User,
  Clock,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react';
import { Student, ParentContactLog, ClassSettings } from '../../types';

interface ParentContactViewProps {
  students: Student[];
  contactLogs: ParentContactLog[];
  settings: ClassSettings;
  onAddLog: (log: ParentContactLog) => void;
  onDeleteLog: (id: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const SMS_TEMPLATES = [
  {
    title: 'Thông báo họp PHHS',
    text: (name: string, pName: string, cls: string) =>
      `Kính gửi Phụ huynh em ${name}, GVCN lớp ${cls} trân trọng kính mời quý phụ huynh tham dự Buổi họp Phụ huynh đầu năm vào lúc 08h00 Chủ Nhật ngày 20/09/2026 tại phòng học lớp ${cls}. Sự hiện diện của quý vị là niềm vinh hạnh của lớp. Trân trọng!`,
  },
  {
    title: 'Nhắc nhở vắng học / Đi muộn',
    text: (name: string, pName: string, cls: string) =>
      `Kính gửi Phụ huynh em ${name}, hôm nay em ${name} có vắng học (chưa có giấy phép). Kính đề nghị phụ huynh liên hệ lại với GVCN lớp ${cls} qua SĐT này để nắm tình hình sức khỏe và lịch học của em. Trân trọng cảm ơn!`,
  },
  {
    title: 'Khen ngợi tiến bộ',
    text: (name: string, pName: string, cls: string) =>
      `Kính gửi Phụ huynh em ${name}, GVCN lớp ${cls} xin chia sẻ niềm vui: tuần này em ${name} học tập rất chăm chỉ, đạt điểm cao và hăng hái phát biểu xây dựng bài. Gia đình tiếp tục động viên em phát huy nhé! Trân trọng!`,
  },
  {
    title: 'Nhắc nộp BHYT / Giấy tờ',
    text: (name: string, pName: string, cls: string) =>
      `Kính gửi Phụ huynh em ${name}, nhà trường đang hoàn thiện hồ sơ Bảo hiểm Y tế học sinh năm học 2026-2027. Nhờ phụ huynh kiểm tra và hoàn tất nộp thẻ trước ngày 25/09/2026. Trân trọng!`,
  },
];

export const ParentContactView: React.FC<ParentContactViewProps> = ({
  students,
  contactLogs,
  settings,
  onAddLog,
  onDeleteLog,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(students[0] || null);

  // Quick message template generator
  const [activeTemplateIdx, setActiveTemplateIdx] = useState(0);
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // New Log Form
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [logType, setLogType] = useState<'Cuộc gọi' | 'Tin nhắn Zalo' | 'Gặp trực tiếp' | 'Họp phụ huynh'>('Cuộc gọi');
  const [logContent, setLogContent] = useState('');
  const [logParentFeedback, setLogParentFeedback] = useState('');

  // Update message when student or template changes
  React.useEffect(() => {
    if (selectedStudent) {
      const tpl = SMS_TEMPLATES[activeTemplateIdx];
      setCustomMessage(
        tpl.text(
          selectedStudent.fullName,
          selectedStudent.fatherName || selectedStudent.motherName || 'Phụ huynh',
          settings.className
        )
      );
    }
  }, [selectedStudent, activeTemplateIdx, settings.className]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast('Đã sao chép nội dung tin nhắn vào bộ nhớ tạm!', 'success');
  };

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !logContent.trim()) {
      onShowToast('Vui lòng nhập nội dung trao đổi', 'error');
      return;
    }
    const rec: ParentContactLog = {
      id: `log-${Date.now()}`,
      studentId: selectedStudent.id,
      date: new Date().toISOString().split('T')[0],
      type: logType,
      content: logContent,
      parentFeedback: logParentFeedback,
    };
    onAddLog(rec);
    onShowToast('Đã lưu nhật ký liên lạc phụ huynh!', 'success');
    setShowAddLogModal(false);
    setLogContent('');
    setLogParentFeedback('');
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.parentPhone.includes(search) ||
      s.fatherName?.toLowerCase().includes(search.toLowerCase()) ||
      s.motherName?.toLowerCase().includes(search.toLowerCase())
  );

  const studentLogs = selectedStudent
    ? contactLogs.filter((l) => l.studentId === selectedStudent.id)
    : [];

  return (
    <div id="parent-contact-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            Sổ Liên Lạc & Kết Nối Phụ Huynh
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gọi điện trực tiếp, kết nối Zalo 1 chạm, mẫu tin nhắn tự động điền tên học sinh
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Contacts Directory (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm phụ huynh theo tên HS, SĐT, cha/mẹ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 outline-hidden"
              />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[540px] overflow-y-auto pr-1">
              {filteredStudents.map((st) => {
                const isSelected = selectedStudent?.id === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudent(st)}
                    className={`py-3 px-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-500/10 border-l-4 border-cyan-500 text-cyan-900 dark:text-cyan-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {st.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {st.fatherName ? `Bố: ${st.fatherName}` : `Mẹ: ${st.motherName}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                        {st.parentPhone}
                      </div>
                      <span className="text-[10px] text-slate-400">Tổ {st.group}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Student Contact Details & Message Composer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedStudent ? (
            <>
              {/* Contact Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                        {selectedStudent.fullName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {selectedStudent.code} • Tổ {selectedStudent.group} • {selectedStudent.roleInClass || 'Học sinh'}
                      </p>
                    </div>
                  </div>

                  {/* Direct Action Buttons: Call & Zalo */}
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${selectedStudent.parentPhone}`}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      Gọi điện
                    </a>
                    <a
                      href={`https://zalo.me/${selectedStudent.parentPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Mở Zalo
                    </a>
                  </div>
                </div>

                {/* Parent detail rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div className="text-slate-400 text-[10px] font-semibold">CHA</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedStudent.fatherName || 'Chưa cập nhật'}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div className="text-slate-400 text-[10px] font-semibold">MẸ</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedStudent.motherName || 'Chưa cập nhật'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Composer with Presets */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-600" />
                    Soạn Tin Nhắn Mẫu Gửi Phụ Huynh
                  </h4>
                  <button
                    onClick={handleCopyMessage}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>

                {/* Templates Selector */}
                <div className="flex flex-wrap gap-2">
                  {SMS_TEMPLATES.map((tpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTemplateIdx(idx)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        activeTemplateIdx === idx
                          ? 'bg-cyan-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {tpl.title}
                    </button>
                  ))}
                </div>

                {/* Message Textarea */}
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 outline-hidden leading-relaxed"
                />
              </div>

              {/* Contact History Logs */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    Lịch Sử Liên Lạc ({studentLogs.length})
                  </h4>
                  <button
                    onClick={() => setShowAddLogModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ghi nhật ký mới
                  </button>
                </div>

                {studentLogs.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-6">
                    Chưa có nhật ký liên lạc nào với phụ huynh học sinh này.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {studentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                            {log.type} • {log.date}
                          </span>
                          <button
                            onClick={() => onDeleteLog(log.id)}
                            className="text-slate-400 hover:text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">
                          {log.content}
                        </p>
                        {log.parentFeedback && (
                          <div className="text-slate-500 italic text-[11px] bg-white dark:bg-slate-900 p-2 rounded-xl">
                            Ý kiến PH: &ldquo;{log.parentFeedback}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Modal: Ghi nhật ký liên lạc */}
      {showAddLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Ghi Nhật Ký Trao Đổi Với Phụ Huynh
            </h3>
            <form onSubmit={handleCreateLog} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hình thức trao đổi
                </label>
                <select
                  value={logType}
                  onChange={(e) => setLogType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="Cuộc gọi">Cuộc gọi điện thoại</option>
                  <option value="Tin nhắn Zalo">Tin nhắn Zalo / SMS</option>
                  <option value="Gặp trực tiếp">Gặp trực tiếp tại trường</option>
                  <option value="Họp phụ huynh">Họp phụ huynh</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung trao đổi của Giáo viên
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Trao đổi về tình hình học tập, nề nếp, chuyên cần..."
                  value={logContent}
                  onChange={(e) => setLogContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ý kiến / Cam kết của Phụ huynh
                </label>
                <textarea
                  rows={2}
                  placeholder="Phụ huynh tiếp thu, hứa nhắc nhở con đi ngủ sớm, kiểm tra bài tập..."
                  value={logParentFeedback}
                  onChange={(e) => setLogParentFeedback(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer"
                >
                  Lưu nhật ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
