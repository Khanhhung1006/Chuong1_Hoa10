import * as XLSX from 'xlsx';
import { Student } from '../types';

/**
 * Tạo và tải xuống file Excel mẫu chuẩn (.xlsx) có sẵn dữ liệu ví dụ
 */
export function downloadStudentTemplate(className: string = '11A1'): void {
  const templateData = [
    {
      'STT': 1,
      'Họ và tên *': 'Nguyễn Văn An',
      'Mã định danh': `HS-${className}-01`,
      'Giới tính': 'Nam',
      'Ngày sinh': '15/03/2008',
      'Tổ sinh hoạt': 1,
      'Số điện thoại Phụ huynh *': '0981234567',
      'Số điện thoại Học sinh': '0912345678',
      'Họ tên Cha': 'Nguyễn Văn Tuấn',
      'Họ tên Mẹ': 'Lê Thị Mai',
      'Chức vụ trong lớp': 'Lớp trưởng',
      'Địa chỉ thường trú': 'Số 12, Phố Huế, Q. Hoàn Kiếm, Hà Nội',
      'Đoàn viên': 'Có',
      'Cần quan tâm': 'Không',
      'Lý do quan tâm': '',
      'Hoàn cảnh': 'Bình thường',
      'Ghi chú': 'Học sinh gương mẫu, nhiệt tình',
    },
    {
      'STT': 2,
      'Họ và tên *': 'Trần Thị Ngọc Bích',
      'Mã định danh': `HS-${className}-02`,
      'Giới tính': 'Nữ',
      'Ngày sinh': '22/07/2008',
      'Tổ sinh hoạt': 1,
      'Số điện thoại Phụ huynh *': '0978654321',
      'Số điện thoại Học sinh': '0905123456',
      'Họ tên Cha': 'Trần Quang Dũng',
      'Họ tên Mẹ': 'Phạm Thị Lan',
      'Chức vụ trong lớp': 'Bí thư Chi đoàn',
      'Địa chỉ thường trú': 'Số 45, Đường Kim Mã, Q. Ba Đình, Hà Nội',
      'Đoàn viên': 'Có',
      'Cần quan tâm': 'Không',
      'Lý do quan tâm': '',
      'Hoàn cảnh': 'Bình thường',
      'Ghi chú': 'Cán bộ đoàn năng động',
    },
    {
      'STT': 3,
      'Họ và tên *': 'Lê Hoàng Cường',
      'Mã định danh': `HS-${className}-03`,
      'Giới tính': 'Nam',
      'Ngày sinh': '10/11/2008',
      'Tổ sinh hoạt': 2,
      'Số điện thoại Phụ huynh *': '0934567890',
      'Số điện thoại Học sinh': '0943219876',
      'Họ tên Cha': 'Lê Văn Nam',
      'Họ tên Mẹ': 'Hoàng Thị Cúc',
      'Chức vụ trong lớp': 'Tổ trưởng',
      'Địa chỉ thường trú': 'Số 88, Phố Cầu Giấy, Q. Cầu Giấy, Hà Nội',
      'Đoàn viên': 'Chưa',
      'Cần quan tâm': 'Có',
      'Lý do quan tâm': 'Thị lực yếu, cần ngồi bàn đầu',
      'Hoàn cảnh': 'Bình thường',
      'Ghi chú': 'Cần chú ý xếp chỗ ngồi gần bảng',
    },
    {
      'STT': 4,
      'Họ và tên *': 'Phạm Thị Thùy Dung',
      'Mã định danh': `HS-${className}-04`,
      'Giới tính': 'Nữ',
      'Ngày sinh': '05/01/2008',
      'Tổ sinh hoạt': 2,
      'Số điện thoại Phụ huynh *': '0965432109',
      'Số điện thoại Học sinh': '0918765432',
      'Họ tên Cha': 'Phạm Văn Hưng',
      'Họ tên Mẹ': 'Đỗ Thị Oanh',
      'Chức vụ trong lớp': 'Lớp phó học tập',
      'Địa chỉ thường trú': 'Số 102, Đường Giải Phóng, Q. Hai Bà Trưng, Hà Nội',
      'Đoàn viên': 'Có',
      'Cần quan tâm': 'Không',
      'Lý do quan tâm': '',
      'Hoàn cảnh': 'Bình thường',
      'Ghi chú': 'Học lực Xuất sắc',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Set column widths for optimal view
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 24 }, // Họ và tên
    { wch: 15 }, // Mã định danh
    { wch: 10 }, // Giới tính
    { wch: 14 }, // Ngày sinh
    { wch: 12 }, // Tổ
    { wch: 25 }, // SĐT Phụ huynh
    { wch: 22 }, // SĐT Học sinh
    { wch: 20 }, // Họ tên Cha
    { wch: 20 }, // Họ tên Mẹ
    { wch: 20 }, // Chức vụ
    { wch: 38 }, // Địa chỉ
    { wch: 12 }, // Đoàn viên
    { wch: 14 }, // Cần quan tâm
    { wch: 28 }, // Lý do quan tâm
    { wch: 16 }, // Hoàn cảnh
    { wch: 30 }, // Ghi chú
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh_Sach_Mau');
  XLSX.writeFile(workbook, `Mau_Danh_Sach_Hoc_Sinh_${className}.xlsx`);
}

/**
 * Chuẩn hóa chuỗi ngày tháng từ nhiều định dạng sang YYYY-MM-DD
 */
function normalizeDate(rawVal: any): string {
  if (!rawVal) return '2008-01-01';

  if (rawVal instanceof Date && !isNaN(rawVal.getTime())) {
    return rawVal.toISOString().slice(0, 10);
  }

  // Excel serial number
  if (typeof rawVal === 'number') {
    const dateObj = new Date((rawVal - (25567 + 2)) * 86400 * 1000);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().slice(0, 10);
    }
  }

  const str = String(rawVal).trim();

  // DD/MM/YYYY or D/M/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return '2008-01-01';
}

function normalizeGender(rawVal: any): 'Nam' | 'Nữ' {
  if (!rawVal) return 'Nam';
  const str = String(rawVal).trim().toLowerCase();
  if (str === 'nữ' || str === 'nu' || str === 'female' || str === 'f' || str === 'gái') {
    return 'Nữ';
  }
  return 'Nam';
}

function normalizeBoolean(rawVal: any): boolean {
  if (rawVal === true || rawVal === 1) return true;
  if (!rawVal) return false;
  const str = String(rawVal).trim().toLowerCase();
  return ['có', 'co', 'yes', 'y', 'x', 'đoàn viên', 'doan vien', 'true', '1', 'đúng'].includes(str);
}

function normalizeGroup(rawVal: any): number {
  if (typeof rawVal === 'number' && rawVal >= 1 && rawVal <= 4) {
    return Math.floor(rawVal);
  }
  const str = String(rawVal || '').replace(/\D/g, '');
  const num = parseInt(str, 10);
  if (!isNaN(num) && num >= 1 && num <= 4) {
    return num;
  }
  return 1;
}

export interface ParsedStudentResult {
  validStudents: Student[];
  invalidRows: { rowNumber: number; reason: string; rawData: any }[];
  totalRows: number;
}

/**
 * Đọc và phân tích file Excel / CSV tải lên từ người dùng
 */
export async function parseStudentExcelFile(
  file: File,
  existingStudents: Student[],
  className: string = '11A1'
): Promise<ParsedStudentResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('File Excel không có trang tính (sheet) nào.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('File Excel rỗng hoặc không có dữ liệu học sinh.');
  }

  const validStudents: Student[] = [];
  const invalidRows: { rowNumber: number; reason: string; rawData: any }[] = [];

  let nextIndex = existingStudents.length + 1;

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // Excel 1-based index (header is row 1)

    // Helper to find column value by loose matching key names
    const getVal = (aliases: string[]): any => {
      for (const key of Object.keys(row)) {
        const cleanKey = key.toLowerCase().trim().replace(/[*_#]/g, '');
        for (const alias of aliases) {
          if (cleanKey === alias.toLowerCase() || cleanKey.includes(alias.toLowerCase())) {
            return row[key];
          }
        }
      }
      return '';
    };

    const fullName = String(
      getVal(['họ và tên', 'họ tên', 'tên học sinh', 'fullname', 'name', 'tên']) || ''
    ).trim();

    if (!fullName) {
      invalidRows.push({
        rowNumber: rowNum,
        reason: 'Thiếu thông tin Họ và tên học sinh',
        rawData: row,
      });
      return;
    }

    const gender = normalizeGender(getVal(['giới tính', 'gioi tinh', 'gender', 'phái']));
    const dob = normalizeDate(getVal(['ngày sinh', 'ngay sinh', 'dob', 'năm sinh', 'birth date']));
    const group = normalizeGroup(getVal(['tổ sinh hoạt', 'tổ', 'to', 'group', 'to sinh hoat']));
    
    // Code
    let code = String(getVal(['mã định danh', 'mã học sinh', 'mã hs', 'ma hs', 'code', 'mã']) || '').trim();
    if (!code) {
      code = `HS-${className}-${String(nextIndex).padStart(2, '0')}`;
    }

    const parentPhone = String(
      getVal(['số điện thoại phụ huynh', 'sđt phụ huynh', 'sđt ph', 'điện thoại ph', 'sdt ph', 'sdt phụ huynh', 'parent phone', 'ph']) || ''
    ).trim() || 'Chưa cập nhật';

    const studentPhone = String(
      getVal(['số điện thoại học sinh', 'sđt học sinh', 'sđt hs', 'điện thoại hs', 'sdt hs', 'student phone']) || ''
    ).trim() || parentPhone;

    const fatherName = String(getVal(['họ tên cha', 'họ tên bố', 'tên cha', 'tên bố', 'cha', 'bố', 'father']) || '').trim();
    const motherName = String(getVal(['họ tên mẹ', 'tên mẹ', 'mẹ', 'mother']) || '').trim();
    const roleInClass = String(getVal(['chức vụ trong lớp', 'chức vụ', 'chuc vu', 'role', 'vị trí']) || '').trim();
    const address = String(getVal(['địa chỉ thường trú', 'địa chỉ', 'dia chi', 'nơi ở', 'address']) || '').trim() || 'TP. Hà Nội';
    const isUnionMember = normalizeBoolean(getVal(['đoàn viên', 'doan vien', 'đoàn', 'union']));
    const specialAttention = normalizeBoolean(getVal(['cần quan tâm', 'quan tâm', 'đặc biệt', 'attention']));
    const attentionReason = String(getVal(['lý do quan tâm', 'lý do', 'ly do']) || '').trim();
    const familyCircumstance = String(getVal(['hoàn cảnh', 'gia cảnh', 'circumstance']) || '').trim() || 'Bình thường';
    const notes = String(getVal(['ghi chú', 'ghi chu', 'notes', 'note']) || '').trim();

    const newStudent: Student = {
      id: `hs-imp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      code,
      fullName,
      gender,
      dob,
      className,
      group,
      seatRow: 1,
      seatCol: 1,
      address,
      studentPhone,
      fatherName,
      motherName,
      parentPhone,
      familyCircumstance,
      isUnionMember,
      notes: notes || undefined,
      roleInClass: roleInClass || undefined,
      specialAttention,
      attentionReason: specialAttention ? attentionReason : undefined,
    };

    validStudents.push(newStudent);
    nextIndex++;
  });

  return {
    validStudents,
    invalidRows,
    totalRows: rawRows.length,
  };
}
