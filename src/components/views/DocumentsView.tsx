import React, { useState } from 'react';
import {
  FolderArchive,
  FileText,
  Download,
  Copy,
  Check,
  Plus,
  Search,
  BookOpen,
  Calendar,
  Eye,
} from 'lucide-react';
import { DocumentItem } from '../../types';

interface DocumentsViewProps {
  documents: DocumentItem[];
  onAddDocument: (doc: DocumentItem) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onAddDocument,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(documents[0] || null);
  const [copied, setCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New doc form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Biểu mẫu học sinh');
  const [content, setContent] = useState('');

  const handleCopy = () => {
    if (selectedDoc?.content) {
      navigator.clipboard.writeText(selectedDoc.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShowToast('Đã sao chép biểu mẫu vào bộ nhớ tạm!', 'success');
    }
  };

  const handleDownload = () => {
    if (!selectedDoc) return;
    const blob = new Blob([selectedDoc.content || selectedDoc.title], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedDoc.title.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast(`Đã tải xuống ${selectedDoc.title}!`, 'success');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast('Vui lòng nhập tên tài liệu', 'error');
      return;
    }
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title,
      category,
      uploadDate: new Date().toISOString().split('T')[0],
      fileType: 'TXT',
      content,
    };
    onAddDocument(newDoc);
    onShowToast('Đã thêm biểu mẫu tài liệu mới!', 'success');
    setShowAddModal(false);
    setTitle('');
    setContent('');
  };

  const filteredDocs = documents.filter((d) => {
    const matchesCat = selectedCategory === 'all' || d.category === selectedCategory;
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div id="documents-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            Kho Tài Liệu & Biểu Mẫu Chủ Nhiệm
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mẫu đơn xin nghỉ học, biên bản cam kết, kế hoạch năm học, mẫu tự kiểm điểm
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Thêm biểu mẫu mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Catalog: 5 cols */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm biểu mẫu theo từ khóa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 outline-hidden"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['all', 'Biểu mẫu học sinh', 'Kế hoạch chủ nhiệm', 'Cam kết & Nội quy', 'Biên bản'].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'Tất cả' : cat}
                  </button>
                )
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto pr-1">
              {filteredDocs.map((d) => {
                const isSelected = selectedDoc?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDoc(d)}
                    className={`py-3 px-3 rounded-2xl cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-cyan-500/10 border-l-4 border-cyan-500 text-cyan-900 dark:text-cyan-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <FileText className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {d.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {d.category} • {d.uploadDate}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Preview: 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {selectedDoc ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                    {selectedDoc.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chuyên mục: {selectedDoc.category} • Cập nhật: {selectedDoc.uploadDate}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? 'Đã sao chép' : 'Sao chép'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Tải về
                  </button>
                </div>
              </div>

              {/* Text content preview */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[460px] overflow-y-auto">
                {selectedDoc.content || 'Nội dung biểu mẫu đang được cập nhật...'}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-slate-400 text-xs">Vui lòng chọn biểu mẫu từ danh sách bên trái.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Thêm biểu mẫu mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Thêm Tài Liệu / Biểu Mẫu Mới
            </h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên biểu mẫu / Tài liệu
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đơn xin chuyển trường, Giấy cam kết rèn luyện..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chuyên mục
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="Biểu mẫu học sinh">Biểu mẫu học sinh</option>
                  <option value="Kế hoạch chủ nhiệm">Kế hoạch chủ nhiệm</option>
                  <option value="Cam kết & Nội quy">Cam kết & Nội quy</option>
                  <option value="Biên bản">Biên bản họp & Sự việc</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung văn bản / Mẫu điền
                </label>
                <textarea
                  rows={8}
                  placeholder="Dán hoặc soạn thảo nội dung biểu mẫu tại đây..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
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
                  Lưu biểu mẫu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
