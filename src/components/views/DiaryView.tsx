import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Plus,
  Trash2,
  Tag,
  Search,
  Sparkles,
  Heart,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { DiaryEntry } from '../../types';

interface DiaryViewProps {
  entries: DiaryEntry[];
  onAddEntry: (entry: DiaryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const DiaryView: React.FC<DiaryViewProps> = ({
  entries,
  onAddEntry,
  onDeleteEntry,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [date, setDate] = useState('2026-09-14');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('Tâm lý học đường, Nề nếp');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      onShowToast('Vui lòng nhập tiêu đề và nội dung nhật ký', 'error');
      return;
    }
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newEntry: DiaryEntry = {
      id: `diary-${Date.now()}`,
      date,
      title,
      content,
      tags,
    };
    onAddEntry(newEntry);
    onShowToast('Đã lưu mục nhật ký chủ nhiệm mới!', 'success');
    setShowAddModal(false);
    setTitle('');
    setContent('');
  };

  const filtered = entries.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.content.toLowerCase().includes(search.toLowerCase()) ||
      e.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div id="diary-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            Nhật Ký Công Tác Chủ Nhiệm
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi chép tâm tư học sinh, các sự vụ nảy sinh trong ngày và tiến trình giáo dục cá biệt
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Viết nhật ký hôm nay
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Tìm trong nhật ký (theo ngày, từ khóa, tâm lý...)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 outline-hidden"
        />
      </div>

      {/* Diary Timeline Entries */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">Chưa có bài viết nhật ký nào phù hợp.</p>
          </div>
        ) : (
          filtered.map((entry) => (
            <div
              key={entry.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 relative group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 px-3 py-1 bg-cyan-50 dark:bg-cyan-950/40 rounded-xl">
                    {entry.date}
                  </span>
                  <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                    {entry.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDeleteEntry(entry.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Xóa bài viết"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content text */}
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {entry.content}
              </p>

              {/* Tags */}
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {entry.tags.map((tg, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tg}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: Viết nhật ký mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Viết Nhật Ký Công Tác Chủ Nhiệm
            </h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày ghi chép
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gắn thẻ phân loại
                  </label>
                  <input
                    type="text"
                    placeholder="Tâm lý, Kỷ luật, Gia đình..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề tóm tắt
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trao đổi riêng với em Long sau giờ học..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung chi tiết & Hướng can thiệp
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Ghi nhận cụ thể diễn biến sự việc, tâm trạng của học sinh, phản ứng của gia đình và biện pháp giáo dục tiếp theo..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer"
                >
                  Lưu bài viết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
