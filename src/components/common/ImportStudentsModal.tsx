import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Users,
  FileCheck,
  RefreshCw,
  Info,
  Sparkles,
} from 'lucide-react';
import { Student, ClassSettings } from '../../types';
import {
  downloadStudentTemplate,
  parseStudentExcelFile,
  ParsedStudentResult,
} from '../../services/studentImportService';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedStudents: Student[], mode: 'append' | 'replace') => void;
  existingStudents: Student[];
  settings: ClassSettings;
}

export const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  existingStudents,
  settings,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParsedStudentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setSelectedFile(file);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await parseStudentExcelFile(file, existingStudents, settings.className);
      setParseResult(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể đọc file Excel. Vui lòng kiểm tra định dạng.');
      setParseResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.csv')
      ) {
        handleFile(file);
      } else {
        setErrorMessage('Vui lòng chọn file định dạng Excel (.xlsx, .xls) hoặc .csv');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.validStudents.length === 0) return;
    onImportSuccess(parseResult.validStudents, importMode);
    onClose();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParseResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      id="import-students-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                Thêm Học Sinh Từ File Excel Mẫu
              </h3>
              <p className="text-[11px] text-slate-500">
                Tải file mẫu, điền danh sách và tải lên để nhập tự động vào lớp {settings.className}
              </p>
            </div>
          </div>
          <button
            id="close-import-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {!parseResult ? (
            <>
              {/* Step 1 & Step 2 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Download Template Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50/50 dark:from-cyan-950/40 dark:to-slate-800/60 border border-cyan-200/80 dark:border-cyan-800/50 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        1
                      </span>
                      <h4 className="font-bold text-xs sm:text-sm text-cyan-900 dark:text-cyan-200">
                        Tải file Excel mẫu chuẩn
                      </h4>
                    </div>
                    <p className="text-[11px] text-cyan-800/80 dark:text-cyan-300/80 leading-relaxed">
                      File mẫu đã thiết lập sẵn đầy đủ các cột: Họ tên, Mã học sinh, Giới tính, Ngày sinh, SĐT Phụ huynh, Tổ sinh hoạt, Chức vụ... kèm dữ liệu mẫu minh họa.
                    </p>
                  </div>

                  <button
                    id="download-template-excel-btn"
                    onClick={() => downloadStudentTemplate(settings.className)}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                    Tải File Mẫu Excel (.xlsx)
                  </button>
                </div>

                {/* Upload Excel Card */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-4 sm:p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-all ${
                    dragActive
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 scale-[1.01]'
                      : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />

                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                      Bước 2: Tải lên file danh sách
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Kéo thả file vào đây hoặc <span className="text-emerald-600 dark:text-emerald-400 font-bold underline">chọn từ máy tính</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Hỗ trợ: .xlsx, .xls, .csv (Tự động nhận diện cột tiếng Việt)
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message if any */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Tips & Instructions */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Info className="w-4 h-4 text-cyan-600" />
                  <span>Lưu ý khi nhập danh sách học sinh:</span>
                </div>
                <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside pl-1">
                  <li>Cột <strong>Họ và tên</strong> là bắt buộc. Các cột còn lại có thể để trống.</li>
                  <li>Nếu để trống <strong>Mã học sinh</strong>, hệ thống sẽ tự động sinh mã theo lớp (VD: HS-{settings.className}-01).</li>
                  <li>Định dạng ngày sinh linh hoạt: DD/MM/YYYY (VD: 15/03/2008) hoặc YYYY-MM-DD.</li>
                  <li>Hệ thống tự động bỏ qua các dòng trống và chuẩn hóa danh xưng, số điện thoại.</li>
                </ul>
              </div>
            </>
          ) : (
            /* Step 3: Parse Result Preview */
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span>Đã phân tích: {selectedFile?.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        {parseResult.validStudents.length} học sinh hợp lệ
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Tổng số dòng: {parseResult.totalRows} • Lớp: {settings.className}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Chọn file khác
                </button>
              </div>

              {/* Warnings if invalid rows */}
              {parseResult.invalidRows.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Có {parseResult.invalidRows.length} dòng bị bỏ qua do thiếu thông tin:</span>
                  </div>
                  <div className="text-[11px] max-h-20 overflow-y-auto space-y-0.5 pl-5">
                    {parseResult.invalidRows.map((inv, i) => (
                      <div key={i}>
                        • Dòng {inv.rowNumber}: {inv.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Mode Options */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Chế độ nhập dữ liệu:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'append'
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-cyan-600"
                    />
                    <div>
                      <div>Thêm vào danh sách hiện tại</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        Giữ nguyên {existingStudents.length} học sinh đang có, bổ sung thêm {parseResult.validStudents.length} học sinh mới.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-amber-600"
                    />
                    <div>
                      <div>Thay thế toàn bộ danh sách lớp</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        Xóa danh sách cũ và thiết lập mới hoàn toàn {parseResult.validStudents.length} học sinh từ file.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                  <span>BẢNG XEM TRƯỚC HỌC SINH SẼ NHẬP ({parseResult.validStudents.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Cuộn ngang để xem đủ cột</span>
                </div>
                <div className="max-h-60 overflow-x-auto overflow-y-auto">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5 w-10 text-center">STT</th>
                        <th className="p-2.5">Họ và Tên</th>
                        <th className="p-2.5">Mã HS</th>
                        <th className="p-2.5">Giới tính</th>
                        <th className="p-2.5">Ngày sinh</th>
                        <th className="p-2.5">Tổ</th>
                        <th className="p-2.5">SĐT Phụ huynh</th>
                        <th className="p-2.5">Chức vụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {parseResult.validStudents.map((st, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 text-center font-mono text-[11px] text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {st.fullName}
                          </td>
                          <td className="p-2.5 font-mono text-[11px]">{st.code}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                st.gender === 'Nam'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {st.gender}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-[11px]">{st.dob}</td>
                          <td className="p-2.5">Tổ {st.group}</td>
                          <td className="p-2.5 font-mono text-[11px]">{st.parentPhone}</td>
                          <td className="p-2.5 text-slate-500">{st.roleInClass || 'Học sinh'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Đóng
          </button>

          {parseResult && parseResult.validStudents.length > 0 && (
            <button
              id="confirm-import-students-btn"
              type="button"
              onClick={handleConfirmImport}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Xác nhận nhập {parseResult.validStudents.length} học sinh
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
