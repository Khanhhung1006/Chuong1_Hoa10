import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, User, FileSpreadsheet } from 'lucide-react';
import { Student } from '../../types';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => void;
  onOpenImportExcel?: () => void;
  studentToEdit?: Student | null;
  currentCount: number;
  className?: string;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onOpenImportExcel,
  studentToEdit,
  currentCount,
  className = '11A1',
}) => {
  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState('');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [dob, setDob] = useState('2009-01-15');
  const [address, setAddress] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [group, setGroup] = useState<number>(1);
  const [roleInClass, setRoleInClass] = useState<string>('');
  const [isUnionMember, setIsUnionMember] = useState<boolean>(true);
  const [specialAttention, setSpecialAttention] = useState<boolean>(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (studentToEdit) {
      setFullName(studentToEdit.fullName);
      setCode(studentToEdit.code);
      setGender(studentToEdit.gender);
      setDob(studentToEdit.dob);
      setAddress(studentToEdit.address);
      setParentPhone(studentToEdit.parentPhone);
      setStudentPhone(studentToEdit.studentPhone || '');
      setFatherName(studentToEdit.fatherName || '');
      setMotherName(studentToEdit.motherName || '');
      setGroup(studentToEdit.group);
      setRoleInClass(studentToEdit.roleInClass || '');
      setIsUnionMember(studentToEdit.isUnionMember);
      setSpecialAttention(studentToEdit.specialAttention);
      setNotes(studentToEdit.notes || '');
    } else {
      const cleanClass = className.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || '11A1';
      const nextNum = (currentCount + 1).toString().padStart(2, '0');
      setFullName('');
      setCode(`HS${cleanClass}-${nextNum}`);
      setGender('Nam');
      setDob('2009-05-20');
      setAddress('');
      setParentPhone('09');
      setStudentPhone('');
      setFatherName('');
      setMotherName('');
      setGroup(1);
      setRoleInClass('');
      setIsUnionMember(true);
      setSpecialAttention(false);
      setNotes('');
    }
  }, [studentToEdit, currentCount, isOpen, className]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !code.trim() || !parentPhone.trim()) {
      return;
    }

    const student: Student = {
      id: studentToEdit?.id || `st-${Date.now()}`,
      code,
      fullName,
      gender,
      dob,
      address,
      parentPhone,
      studentPhone,
      fatherName,
      motherName,
      group,
      roleInClass: roleInClass || undefined,
      isUnionMember,
      specialAttention,
      notes: notes || undefined,
      seatRow: studentToEdit?.seatRow || 1,
      seatCol: studentToEdit?.seatCol || 1,
    };

    onSave(student);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/40 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[94vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-cyan-600" />
            {studentToEdit ? 'Chỉnh Sửa Hồ Sơ Học Sinh' : 'Thêm Học Sinh Mới Vào Lớp'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Excel Import Callout for Bulk Add */}
        {!studentToEdit && onOpenImportExcel && (
          <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                  Bạn có file danh sách lớp từ trước?
                </div>
                <div className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80">
                  Tải file mẫu Excel và nhập tự động cả lớp chỉ trong 5 giây
                </div>
              </div>
            </div>

            <button
              type="button"
              id="modal-open-excel-import-btn"
              onClick={() => {
                onClose();
                onOpenImportExcel();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 transition-all shadow-xs cursor-pointer"
            >
              Nhập từ Excel
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Họ và tên học sinh *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mã định danh học sinh *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Giới tính
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Nam' | 'Nữ')}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ngày sinh
              </label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số điện thoại Phụ huynh *
              </label>
              <input
                type="text"
                required
                placeholder="0912 345 678"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số điện thoại Học sinh
              </label>
              <input
                type="text"
                placeholder="0908 123 456"
                value={studentPhone}
                onChange={(e) => setStudentPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Họ tên Cha
              </label>
              <input
                type="text"
                placeholder="Nguyễn Văn B"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Họ tên Mẹ
              </label>
              <input
                type="text"
                placeholder="Trần Thị C"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tổ sinh hoạt
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <option value={1}>Tổ 1</option>
                <option value={2}>Tổ 2</option>
                <option value={3}>Tổ 3</option>
                <option value={4}>Tổ 4</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chức vụ trong lớp (nếu có)
              </label>
              <input
                type="text"
                placeholder="Lớp trưởng, Bí thư, Tổ trưởng..."
                value={roleInClass}
                onChange={(e) => setRoleInClass(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Địa chỉ thường trú / Chỗ ở hiện nay
            </label>
            <input
              type="text"
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isUnionMember}
                onChange={(e) => setIsUnionMember(e.target.checked)}
                className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
              />
              Đoàn viên TNCS Hồ Chí Minh
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-600 dark:text-amber-400">
              <input
                type="checkbox"
                checked={specialAttention}
                onChange={(e) => setSpecialAttention(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              Cần quan tâm đặc biệt (Hoàn cảnh, sức khỏe, học lực)
            </label>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ghi chú riêng của Giáo viên Chủ nhiệm
            </label>
            <textarea
              rows={2}
              placeholder="Tính cách, năng khiếu, lưu ý về bệnh lý hoặc hoàn cảnh gia đình..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-semibold"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer shadow-md shadow-cyan-600/20 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {studentToEdit ? 'Lưu cập nhật' : 'Thêm học sinh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
