import * as XLSX from 'xlsx';
import {
  Student,
  AttendanceRecord,
  ViolationRecord,
  RewardRecord,
  FinancialTransaction,
  ClassSettings,
  ParentContactLog,
  DiaryEntry,
} from '../types';

/**
 * Check if a date falls within [startDate, endDate] (inclusive)
 * Formats expected: YYYY-MM-DD
 */
export function isDateInRange(dateStr?: string, startDate?: string, endDate?: string): boolean {
  if (!dateStr) return false;
  const d = dateStr.slice(0, 10);
  if (startDate && d < startDate) return false;
  if (endDate && d > endDate) return false;
  return true;
}

/**
 * Format date from YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateVN(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.slice(0, 10).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Export Student Profiles to Excel
 */
export function exportStudentsToExcel(students: Student[], settings: ClassSettings): void {
  const rows = students.map((s, idx) => ({
    'STT': idx + 1,
    'Mã Học Sinh': s.code,
    'Họ và Tên': s.fullName,
    'Giới Tính': s.gender,
    'Ngày Sinh': formatDateVN(s.dob),
    'Tổ': `Tổ ${s.group}`,
    'Chức Vụ': s.roleInClass || 'Học sinh',
    'Địa Chỉ': s.address,
    'SĐT Học Sinh': s.studentPhone,
    'SĐT Phụ Huynh': s.parentPhone,
    'Họ Tên Bố': s.fatherName,
    'Họ Tên Mẹ': s.motherName,
    'Hoàn Cảnh': s.familyCircumstance || 'Bình thường',
    'Đoàn Viên': s.isUnionMember ? 'Đoàn viên' : 'Chưa',
    'Mã BHYT': s.healthInsuranceId || '',
    'Ghi Chú': s.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `DanhSach_${settings.className}`);
  XLSX.writeFile(workbook, `Danh_Sach_Lop_${settings.className}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export Class Fund & Financial Transactions to Excel
 */
export function exportFinanceToExcel(
  transactions: FinancialTransaction[],
  settings: ClassSettings,
  periodLabel?: string
): void {
  let runningBalance = 0;
  const rows = transactions.map((t, idx) => {
    if (t.type === 'income') {
      runningBalance += t.amount;
    } else {
      runningBalance -= t.amount;
    }
    return {
      'STT': idx + 1,
      'Ngày': formatDateVN(t.date),
      'Phân Loại': t.type === 'income' ? 'Thu' : 'Chi',
      'Hạng Mục': t.category,
      'Số Tiền (VNĐ)': t.amount,
      'Nội Dung Diễn Giải': t.description,
      'Người Lập Phiếu': t.recorder || t.recordedBy || settings.teacherName,
    };
  });

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Add summary rows
  rows.push({
    'STT': '' as any,
    'Ngày': 'TỔNG CỘNG THU',
    'Phân Loại': '',
    'Hạng Mục': '',
    'Số Tiền (VNĐ)': totalIncome,
    'Nội Dung Diễn Giải': `${transactions.filter((t) => t.type === 'income').length} khoản thu`,
    'Người Lập Phiếu': '',
  });

  rows.push({
    'STT': '' as any,
    'Ngày': 'TỔNG CỘNG CHI',
    'Phân Loại': '',
    'Hạng Mục': '',
    'Số Tiền (VNĐ)': totalExpense,
    'Nội Dung Diễn Giải': `${transactions.filter((t) => t.type === 'expense').length} khoản chi`,
    'Người Lập Phiếu': '',
  });

  rows.push({
    'STT': '' as any,
    'Ngày': 'TỒN QUỸ KỲ NÀY',
    'Phân Loại': '',
    'Hạng Mục': '',
    'Số Tiền (VNĐ)': totalIncome - totalExpense,
    'Nội Dung Diễn Giải': 'Chênh lệch Thu - Chi',
    'Người Lập Phiếu': '',
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SoThuChi');
  const safePeriod = periodLabel ? `_${periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
  XLSX.writeFile(workbook, `So_Thu_Chi_Quy_Lop_${settings.className}${safePeriod}.xlsx`);
}

/**
 * Export Attendance Report by Period to Excel
 */
export function exportAttendanceToExcel(
  students: Student[],
  attendance: AttendanceRecord[],
  settings: ClassSettings,
  periodLabel?: string
): void {
  const rows = students.map((s, idx) => {
    const studentAtt = attendance.filter((a) => a.studentId === s.id);
    const absentExcused = studentAtt.filter(
      (a) => a.status === 'absent_excused' || a.status === 'Vắng có phép'
    ).length;
    const absentUnexcused = studentAtt.filter(
      (a) => a.status === 'absent_unexcused' || a.status === 'Vắng không phép'
    ).length;
    const lateUnder5 = studentAtt.filter(
      (a) => a.status === 'late_under_5' || a.status === 'Đi muộn dưới 5 phút'
    ).length;
    const lateOver5 = studentAtt.filter(
      (a) => a.status === 'late_over_5' || a.status === 'Đi muộn trên 5 phút'
    ).length;

    const totalAbsent = absentExcused + absentUnexcused;

    return {
      'STT': idx + 1,
      'Mã Học Sinh': s.code,
      'Họ và Tên': s.fullName,
      'Tổ': `Tổ ${s.group}`,
      'Vắng Có Phép': absentExcused,
      'Vắng Không Phép': absentUnexcused,
      'Muộn < 5p': lateUnder5,
      'Muộn >= 5p': lateOver5,
      'Tổng Lượt Vắng': totalAbsent,
      'SĐT Phụ Huynh': s.parentPhone,
      'Ghi Chú': totalAbsent >= 3 ? 'Cần GVCN lưu ý' : '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DiemDanh');
  const safePeriod = periodLabel ? `_${periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
  XLSX.writeFile(workbook, `Bang_Theo_Doi_Chuyen_Can_${settings.className}${safePeriod}.xlsx`);
}

/**
 * Export Emulation, Violations & Rewards to Excel
 */
export function exportEmulationToExcel(
  students: Student[],
  violations: ViolationRecord[],
  rewards: RewardRecord[],
  settings: ClassSettings,
  periodLabel?: string
): void {
  const workbook = XLSX.utils.book_new();

  // 1. Sheet Tổng hợp theo tổ
  const groupStats = [1, 2, 3, 4].map((groupNum) => {
    const groupStudents = students.filter((s) => s.group === groupNum);
    const groupStudentIds = new Set(groupStudents.map((s) => s.id));
    const groupViolations = violations.filter((v) => groupStudentIds.has(v.studentId));
    const groupRewards = rewards.filter((r) => groupStudentIds.has(r.studentId));

    const totalPenalty = groupViolations.reduce((sum, v) => sum + (v.penaltyPoints || 0), 0);
    const totalBonus = groupRewards.reduce((sum, r) => sum + (r.bonusPoints || 0), 0);
    const baseScorePerStudent = settings.baseScorePerWeek || 100;
    const memberCount = groupStudents.length;
    const totalPoints = memberCount > 0 ? (memberCount * baseScorePerStudent) + totalBonus - totalPenalty : 0;
    const finalScore = memberCount > 0 ? Number((totalPoints / memberCount).toFixed(1)) : 0;

    return {
      'Tổ': `Tổ ${groupNum}`,
      'Sĩ Số': memberCount,
      'Điểm Gốc/HS': baseScorePerStudent,
      'Tổng Điểm Khen (+)' : totalBonus,
      'Tổng Điểm Phạt (-)': totalPenalty,
      'Trung Bình Thi Đua': finalScore,
      'Số Lượt Khen Thưởng': groupRewards.length,
      'Số Lượt Vi Phạm': groupViolations.length,
    };
  });

  const groupSheet = XLSX.utils.json_to_sheet(groupStats);
  XLSX.utils.book_append_sheet(workbook, groupSheet, 'ThiDua_CacTo');

  // 2. Sheet Chi tiết vi phạm
  const violationRows = violations.map((v, idx) => {
    const student = students.find((s) => s.id === v.studentId);
    return {
      'STT': idx + 1,
      'Ngày': formatDateVN(v.date),
      'Mã Học Sinh': student?.code || '',
      'Họ và Tên': student?.fullName || 'Chưa xác định',
      'Tổ': student ? `Tổ ${student.group}` : '',
      'Nội Dung Vi Phạm': v.content,
      'Mức Độ': v.severity || 'Vừa',
      'Điểm Trừ': v.penaltyPoints,
      'Người Báo Cáo': v.reporter || 'Đội Cờ Đỏ',
      'Trạng Thái': v.status || 'Đã xử lý',
    };
  });
  const violationSheet = XLSX.utils.json_to_sheet(violationRows);
  XLSX.utils.book_append_sheet(workbook, violationSheet, 'ChiTiet_ViPham');

  // 3. Sheet Chi tiết khen thưởng
  const rewardRows = rewards.map((r, idx) => {
    const student = students.find((s) => s.id === r.studentId);
    return {
      'STT': idx + 1,
      'Ngày': formatDateVN(r.date),
      'Mã Học Sinh': student?.code || '',
      'Họ và Tên': student?.fullName || 'Chưa xác định',
      'Tổ': student ? `Tổ ${student.group}` : '',
      'Nội Dung Khen Thưởng': r.content,
      'Lĩnh Vực': r.type || 'Học tập',
      'Điểm Cộng': r.bonusPoints,
    };
  });
  const rewardSheet = XLSX.utils.json_to_sheet(rewardRows);
  XLSX.utils.book_append_sheet(workbook, rewardSheet, 'ChiTiet_KhenThuong');

  const safePeriod = periodLabel ? `_${periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
  XLSX.writeFile(workbook, `Bao_Cao_Thi_Dua_Ne_Nep_${settings.className}${safePeriod}.xlsx`);
}

/**
 * Export Full Comprehensive Multi-Sheet Excel Workbook
 */
export function exportComprehensiveMultiSheetExcel(
  students: Student[],
  attendance: AttendanceRecord[],
  violations: ViolationRecord[],
  rewards: RewardRecord[],
  transactions: FinancialTransaction[],
  contactLogs: ParentContactLog[],
  settings: ClassSettings,
  periodLabel: string,
  startDate?: string,
  endDate?: string
): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Tổng quan kỳ báo cáo
  const absentExcused = attendance.filter(
    (a) => a.status === 'absent_excused' || a.status === 'Vắng có phép'
  ).length;
  const absentUnexcused = attendance.filter(
    (a) => a.status === 'absent_unexcused' || a.status === 'Vắng không phép'
  ).length;
  const totalLate = attendance.filter(
    (a) => a.status === 'late_under_5' || a.status === 'late_over_5'
  ).length;
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const overviewRows = [
    { 'Hạng Mục Chỉ Số': 'Kỳ Báo Cáo', 'Giá Trị': periodLabel },
    { 'Hạng Mục Chỉ Số': 'Khoảng Thời Gian', 'Giá Trị': `${formatDateVN(startDate)} - ${formatDateVN(endDate)}` },
    { 'Hạng Mục Chỉ Số': 'Trường THPT', 'Giá Trị': settings.schoolName },
    { 'Hạng Mục Chỉ Số': 'Lớp Chủ Nhiệm', 'Giá Trị': settings.className },
    { 'Hạng Mục Chỉ Số': 'Giáo Viên Chủ Nhiệm', 'Giá Trị': settings.teacherName },
    { 'Hạng Mục Chỉ Số': 'Sĩ Số Lớp', 'Giá Trị': `${students.length} học sinh (Nam: ${students.filter(s => s.gender === 'Nam').length}, Nữ: ${students.filter(s => s.gender === 'Nữ').length})` },
    { 'Hạng Mục Chỉ Số': 'Tổng Số Lượt Vắng Có Phép', 'Giá Trị': absentExcused },
    { 'Hạng Mục Chỉ Số': 'Tổng Số Lượt Vắng Không Phép', 'Giá Trị': absentUnexcused },
    { 'Hạng Mục Chỉ Số': 'Tổng Số Lượt Đi Muộn', 'Giá Trị': totalLate },
    { 'Hạng Mục Chỉ Số': 'Tổng Số Vụ Việc Khen Thưởng', 'Giá Trị': rewards.length },
    { 'Hạng Mục Chỉ Số': 'Tổng Số Vụ Việc Vi Phạm Nề Nếp', 'Giá Trị': violations.length },
    { 'Hạng Mục Chỉ Số': 'Tổng Số Lượt Liên Hệ Phụ Huynh', 'Giá Trị': contactLogs.length },
    { 'Hạng Mục Chỉ Số': 'Tổng Thu Quỹ Trong Kỳ', 'Giá Trị': `${totalIncome.toLocaleString('vi-VN')} VNĐ` },
    { 'Hạng Mục Chỉ Số': 'Tổng Chi Quỹ Trong Kỳ', 'Giá Trị': `${totalExpense.toLocaleString('vi-VN')} VNĐ` },
    { 'Hạng Mục Chỉ Số': 'Tồn Quỹ Kỳ Báo Cáo', 'Giá Trị': `${(totalIncome - totalExpense).toLocaleString('vi-VN')} VNĐ` },
  ];
  const overviewSheet = XLSX.utils.json_to_sheet(overviewRows);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'TongQuan_ChiSo');

  // Sheet 2: Danh sách học sinh & Chuyên cần kỳ này
  const attRows = students.map((s, idx) => {
    const sAtt = attendance.filter((a) => a.studentId === s.id);
    const ex = sAtt.filter((a) => a.status === 'absent_excused' || a.status === 'Vắng có phép').length;
    const un = sAtt.filter((a) => a.status === 'absent_unexcused' || a.status === 'Vắng không phép').length;
    const lateUnder5 = sAtt.filter((a) => a.status === 'late_under_5' || a.status === 'Đi muộn dưới 5 phút').length;
    const lateOver5 = sAtt.filter((a) => a.status === 'late_over_5' || a.status === 'Đi muộn trên 5 phút').length;
    return {
      'STT': idx + 1,
      'Mã HS': s.code,
      'Họ và Tên': s.fullName,
      'Giới Tính': s.gender,
      'Tổ': `Tổ ${s.group}`,
      'Chức Vụ': s.roleInClass || 'Học sinh',
      'Vắng Có Phép': ex,
      'Vắng Không Phép': un,
      'Muộn < 5p': lateUnder5,
      'Muộn >= 5p': lateOver5,
      'Tổng Lượt Vắng': ex + un,
      'SĐT Phụ Huynh': s.parentPhone,
    };
  });
  const attSheet = XLSX.utils.json_to_sheet(attRows);
  XLSX.utils.book_append_sheet(workbook, attSheet, 'ChuyenCan_HocSinh');

  // Sheet 3: Khen thưởng
  const rewardRows = rewards.map((r, idx) => {
    const student = students.find((s) => s.id === r.studentId);
    return {
      'STT': idx + 1,
      'Ngày': formatDateVN(r.date),
      'Họ và Tên': student?.fullName || '',
      'Tổ': student ? `Tổ ${student.group}` : '',
      'Nội Dung Khen Thưởng': r.content,
      'Lĩnh Vực': r.type || 'Học tập',
      'Điểm Thưởng': r.bonusPoints,
    };
  });
  const rewardSheet = XLSX.utils.json_to_sheet(rewardRows);
  XLSX.utils.book_append_sheet(workbook, rewardSheet, 'KhenThuong');

  // Sheet 4: Vi phạm
  const violationRows = violations.map((v, idx) => {
    const student = students.find((s) => s.id === v.studentId);
    return {
      'STT': idx + 1,
      'Ngày': formatDateVN(v.date),
      'Họ và Tên': student?.fullName || '',
      'Tổ': student ? `Tổ ${student.group}` : '',
      'Hành Vi Vi Phạm': v.content,
      'Mức Độ': v.severity || 'Vừa',
      'Điểm Trừ': v.penaltyPoints,
      'Người Báo Cáo': v.reporter || '',
      'Xử Lý': v.status || 'Đã xử lý',
    };
  });
  const violationSheet = XLSX.utils.json_to_sheet(violationRows);
  XLSX.utils.book_append_sheet(workbook, violationSheet, 'ViPham_KyLuat');

  // Sheet 5: Thu chi quỹ
  const financeRows = transactions.map((t, idx) => ({
    'STT': idx + 1,
    'Ngày': formatDateVN(t.date),
    'Loại': t.type === 'income' ? 'Thu' : 'Chi',
    'Hạng Mục': t.category,
    'Số Tiền': t.amount,
    'Diễn Giải': t.description,
    'Người Lập': t.recorder || t.recordedBy || settings.teacherName,
  }));
  const financeSheet = XLSX.utils.json_to_sheet(financeRows);
  XLSX.utils.book_append_sheet(workbook, financeSheet, 'ThuChi_QuyLop');

  // Sheet 6: Nhật ký liên hệ phụ huynh
  const contactRows = contactLogs.map((c, idx) => {
    const student = students.find((s) => s.id === c.studentId);
    return {
      'STT': idx + 1,
      'Ngày': formatDateVN(c.date),
      'Học Sinh': student?.fullName || '',
      'Hình Thức': c.method || c.type || 'Gọi điện',
      'Nội Dung Trao Đổi': c.content,
      'Phản Hồi Phụ Huynh': c.parentFeedback || '',
      'Kết Quả': c.result || 'Đã tiếp nhận',
    };
  });
  const contactSheet = XLSX.utils.json_to_sheet(contactRows);
  XLSX.utils.book_append_sheet(workbook, contactSheet, 'LienHe_PhuHuynh');

  const safePeriod = periodLabel ? `_${periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
  XLSX.writeFile(workbook, `So_Bao_Cao_Tong_Hop_${settings.className}${safePeriod}.xlsx`);
}

/**
 * Base Word Export Engine
 */
export function exportReportToWord(title: string, htmlBody: string, settings: ClassSettings, fileNameOverride?: string): void {
  const currentDateStr = `ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`;
  const fullHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        @page { size: A4 portrait; margin: 20mm 15mm 20mm 20mm; }
        body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.35; color: #000; }
        .header-table { width: 100%; margin-bottom: 18px; border: none; }
        .header-col { vertical-align: top; text-align: center; border: none; font-size: 11pt; line-height: 1.25; }
        .title { text-align: center; font-size: 15pt; font-weight: bold; margin: 20px 0 6px; text-transform: uppercase; color: #111; }
        .subtitle { text-align: center; font-size: 11pt; font-style: italic; margin-bottom: 18px; }
        h3 { font-size: 12.5pt; font-weight: bold; margin: 16px 0 6px; color: #000; text-transform: uppercase; }
        p { margin: 4px 0; text-align: justify; font-size: 12pt; }
        ul, ol { margin: 4px 0 8px 24px; padding: 0; }
        li { margin-bottom: 4px; font-size: 12pt; }
        table.data-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        table.data-table th, table.data-table td { border: 1px solid #333; padding: 6px 8px; font-size: 10.5pt; text-align: left; }
        table.data-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        .footer-table { width: 100%; margin-top: 30px; border: none; page-break-inside: avoid; }
        .signature-col { vertical-align: top; text-align: center; width: 50%; border: none; font-size: 11.5pt; }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td class="header-col" style="width: 45%;">
            SỞ GIÁO DỤC VÀ ĐÀO TẠO<br>
            <b>${settings.schoolName.toUpperCase()}</b><br>
            <b>LỚP: ${settings.className}</b><br>
            <i>Năm học: ${settings.academicYear}</i>
          </td>
          <td class="header-col" style="width: 55%;">
            <b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br>
            <b>Độc lập - Tự do - Hạnh phúc</b><br>
            --------------------------
          </td>
        </tr>
      </table>

      <div class="title">${title}</div>

      <div>${htmlBody}</div>

      <table class="footer-table">
        <tr>
          <td class="signature-col">
            <b>XÁC NHẬN CỦA BAN GIÁM HIỆU</b><br>
            <i>(Ký và đóng dấu)</i><br><br><br><br><br>
          </td>
          <td class="signature-col">
            <i>Hà Nội, ${currentDateStr}</i><br>
            <b>GIÁO VIÊN CHỦ NHIỆM</b><br>
            <i>(Ký và ghi rõ họ tên)</i><br><br><br><br><br>
            <b>${settings.teacherName}</b>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', fullHtml], {
    type: 'application/msword',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const finalFileName = fileNameOverride || `${title.replace(/\s+/g, '_')}_${settings.className}.doc`;
  a.download = finalFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Comprehensive Periodic Report to Word (By Week, Month, or Custom Date Range)
 */
export function exportPeriodReportWord(params: {
  reportPeriodType: 'week' | 'month' | 'custom';
  periodTitle: string;
  startDateStr: string;
  endDateStr: string;
  students: Student[];
  attendance: AttendanceRecord[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  transactions: FinancialTransaction[];
  contactLogs: ParentContactLog[];
  diaryEntries: DiaryEntry[];
  settings: ClassSettings;
  teacherEvaluation?: string;
  nextPeriodPlan?: string;
}): void {
  const {
    periodTitle,
    startDateStr,
    endDateStr,
    students,
    attendance,
    violations,
    rewards,
    transactions,
    contactLogs,
    diaryEntries,
    settings,
    teacherEvaluation,
    nextPeriodPlan,
  } = params;

  const maleCount = students.filter((s) => s.gender === 'Nam').length;
  const femaleCount = students.filter((s) => s.gender === 'Nữ').length;

  const absentExcused = attendance.filter(
    (a) => a.status === 'absent_excused' || a.status === 'Vắng có phép'
  ).length;
  const absentUnexcused = attendance.filter(
    (a) => a.status === 'absent_unexcused' || a.status === 'Vắng không phép'
  ).length;
  const lateUnder5 = attendance.filter(
    (a) => a.status === 'late_under_5' || a.status === 'Đi muộn dưới 5 phút'
  ).length;
  const lateOver5 = attendance.filter(
    (a) => a.status === 'late_over_5' || a.status === 'Đi muộn trên 5 phút'
  ).length;

  // Emulation groups
  const groupScores = [1, 2, 3, 4].map((g) => {
    const groupStudents = students.filter((s) => s.group === g);
    const gIds = new Set(groupStudents.map((s) => s.id));
    const gV = violations.filter((v) => gIds.has(v.studentId));
    const gR = rewards.filter((r) => gIds.has(r.studentId));
    const bonus = gR.reduce((sum, r) => sum + (r.bonusPoints || 0), 0);
    const penalty = gV.reduce((sum, v) => sum + (v.penaltyPoints || 0), 0);
    const base = settings.baseScorePerWeek || 100;
    const memberCount = groupStudents.length;
    const totalPoints = memberCount > 0 ? (memberCount * base) + bonus - penalty : 0;
    const finalScore = memberCount > 0 ? Number((totalPoints / memberCount).toFixed(1)) : 0;
    return { group: g, bonus, penalty, finalScore, memberCount };
  }).sort((a, b) => b.finalScore - a.finalScore);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const htmlBody = `
    <div class="subtitle">
      (Thời gian thực hiện: Từ ngày <b>${formatDateVN(startDateStr)}</b> đến ngày <b>${formatDateVN(endDateStr)}</b>)
    </div>

    <h3>I. TÌNH HÌNH SĨ SỐ & CHUYÊN CẦN</h3>
    <p>- Tổng sĩ số lớp: <b>${students.length}</b> học sinh (Nam: <b>${maleCount}</b> em, Nữ: <b>${femaleCount}</b> em).</p>
    <p>- Học sinh diện chính sách, hoàn cảnh cần quan tâm: <b>${students.filter(s => s.familyCircumstance && s.familyCircumstance !== 'Bình thường').length}</b> em.</p>
    <p>- Tình hình chuyên cần trong kỳ:</p>
    <ul>
      <li>Tổng số lượt vắng có phép: <b>${absentExcused}</b> lượt.</li>
      <li>Tổng số lượt vắng không phép: <b>${absentUnexcused}</b> lượt ${absentUnexcused > 0 ? '<span style="color: red;">(Đã liên hệ phụ huynh xác minh)</span>' : '(Tốt)'}.</li>
      <li>Tổng số lượt đi muộn dưới 5 phút: <b>${lateUnder5}</b> lượt.</li>
      <li>Tổng số lượt đi muộn từ 5 phút trở lên: <b>${lateOver5}</b> lượt.</li>
    </ul>

    <h3>II. NỀ NẾP KỶ CƯƠNG & XẾP HẠNG THI ĐUA CÁC TỔ</h3>
    <p>- <b>Bảng xếp hạng thi đua nề nếp:</b></p>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 12%;">Hạng</th>
          <th style="width: 20%;">Tổ</th>
          <th style="width: 18%;">Sĩ số</th>
          <th style="width: 25%;">Điểm thưởng (+)</th>
          <th style="width: 25%;">Điểm trừ (-)</th>
          <th style="width: 20%;">Tổng điểm</th>
        </tr>
      </thead>
      <tbody>
        ${groupScores
          .map(
            (g, idx) => `
          <tr>
            <td style="text-align: center; font-weight: bold;">Hạng ${idx + 1}</td>
            <td style="font-weight: bold;">Tổ ${g.group}</td>
            <td style="text-align: center;">${g.memberCount} HS</td>
            <td style="text-align: center; color: green;">+${g.bonus}</td>
            <td style="text-align: center; color: red;">-${g.penalty}</td>
            <td style="text-align: center; font-weight: bold;">${g.finalScore}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <p>- <b>Tuyên dương khen thưởng (${rewards.length} lượt):</b></p>
    ${
      rewards.length > 0
        ? `<table class="data-table">
            <thead>
              <tr>
                <th style="width: 15%;">Ngày</th>
                <th style="width: 25%;">Họ và tên</th>
                <th style="width: 45%;">Nội dung thành tích</th>
                <th style="width: 15%;">Điểm cộng</th>
              </tr>
            </thead>
            <tbody>
              ${rewards
                .slice(0, 10)
                .map((r) => {
                  const st = students.find((s) => s.id === r.studentId);
                  return `<tr>
                    <td style="text-align: center;">${formatDateVN(r.date)}</td>
                    <td><b>${st?.fullName || 'Học sinh'}</b></td>
                    <td>${r.content}</td>
                    <td style="text-align: center; color: green; font-weight: bold;">+${r.bonusPoints}</td>
                  </tr>`;
                })
                .join('')}
            </tbody>
          </table>`
        : '<p><i>* Không có ghi nhận khen thưởng đặc biệt trong kỳ này.</i></p>'
    }

    <p>- <b>Các tồn tại và vi phạm cần chấn chỉnh (${violations.length} lượt):</b></p>
    ${
      violations.length > 0
        ? `<table class="data-table">
            <thead>
              <tr>
                <th style="width: 15%;">Ngày</th>
                <th style="width: 25%;">Họ và tên</th>
                <th style="width: 45%;">Hành vi vi phạm</th>
                <th style="width: 15%;">Điểm trừ</th>
              </tr>
            </thead>
            <tbody>
              ${violations
                .slice(0, 10)
                .map((v) => {
                  const st = students.find((s) => s.id === v.studentId);
                  return `<tr>
                    <td style="text-align: center;">${formatDateVN(v.date)}</td>
                    <td><b>${st?.fullName || 'Học sinh'}</b></td>
                    <td>${v.content} (${v.severity})</td>
                    <td style="text-align: center; color: red; font-weight: bold;">-${v.penaltyPoints}</td>
                  </tr>`;
                })
                .join('')}
            </tbody>
          </table>`
        : '<p><i>* Toàn thể học sinh duy trì kỷ cương tốt, không xảy ra vi phạm nề nếp.</i></p>'
    }

    <h3>III. CÔNG TÁC PHỐI HỢP PHỤ HUYNH & NHẬT KÝ CHỦ NHIỆM</h3>
    <p>- Số lượt trao đổi với Ban Đại diện và Phụ huynh học sinh: <b>${contactLogs.length}</b> lượt.</p>
    ${
      contactLogs.length > 0
        ? `<ul>
            ${contactLogs
              .slice(0, 5)
              .map((c) => {
                const st = students.find((s) => s.id === c.studentId);
                return `<li>Ngày ${formatDateVN(c.date)}: Trao đổi với PH em <b>${st?.fullName || ''}</b> về "${c.content}" - Kết quả: <i>${c.result || 'Đã thống nhất phối hợp'}</i>.</li>`;
              })
              .join('')}
          </ul>`
        : '<p><i>* Chưa phát sinh trường hợp cần can thiệp đặc biệt.</i></p>'
    }

    <h3>IV. QUẢN LÝ TÀI CHÍNH & QUỸ LỚP</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 33%;">Tổng Thu Trong Kỳ</th>
          <th style="width: 33%;">Tổng Chi Trong Kỳ</th>
          <th style="width: 34%;">Số Dư / Tồn Quỹ</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center; font-weight: bold; color: green;">${totalIncome.toLocaleString('vi-VN')} VNĐ</td>
          <td style="text-align: center; font-weight: bold; color: red;">${totalExpense.toLocaleString('vi-VN')} VNĐ</td>
          <td style="text-align: center; font-weight: bold; color: #0284c7;">${(totalIncome - totalExpense).toLocaleString('vi-VN')} VNĐ</td>
        </tr>
      </tbody>
    </table>

    <h3>V. ĐÁNH GIÁ CHUNG CỦA GIÁO VIÊN CHỦ NHIỆM</h3>
    <p>${teacherEvaluation || '- Tập thể lớp ổn định, đại đa số học sinh có ý thức tự giác cao trong học tập và rèn luyện đạo đức. Các cán sự lớp và tổ trưởng phát huy tốt vai trò điều hành.'}</p>

    <h3>VI. PHƯƠNG HƯỚNG & KẾ HOẠCH TRỌNG TÂM KỲ KẾ TIẾP</h3>
    <p>${nextPeriodPlan || `1. Tiếp tục duy trì sĩ số và chấn chỉnh nề nếp đồng phục, truy bài 15 phút đầu giờ.<br>
2. Đẩy mạnh phong trào học tốt, giúp đỡ các bạn có học lực còn yếu.<br>
3. Phối hợp chặt chẽ với Giáo viên Bộ môn và Phụ huynh để theo sát các trường hợp cá biệt.`}</p>
  `;

  const title = `BÁO CÁO CÔNG TÁC CHỦ NHIỆM ${periodTitle.toUpperCase()}`;
  exportReportToWord(title, htmlBody, settings, `Bao_Cao_${periodTitle.replace(/\s+/g, '_')}_${settings.className}.doc`);
}

/**
 * Legacy weekly report helper for backward compatibility
 */
export function exportWeeklyReportWord(
  reportWeek: string,
  students: Student[],
  violations: ViolationRecord[],
  rewards: RewardRecord[],
  settings: ClassSettings
): void {
  exportPeriodReportWord({
    reportPeriodType: 'week',
    periodTitle: reportWeek,
    startDateStr: new Date().toISOString().slice(0, 10),
    endDateStr: new Date().toISOString().slice(0, 10),
    students,
    attendance: [],
    violations,
    rewards,
    transactions: [],
    contactLogs: [],
    diaryEntries: [],
    settings,
  });
}

export function printClassReport(): void {
  window.print();
}

/**
 * Export Comprehensive Master Student Ledger to Excel
 * Contains every single student with their detailed violations, commendations, attendance, and net scores
 */
export function exportStudentDetailedLedgerExcel(
  students: Student[],
  attendance: AttendanceRecord[],
  violations: ViolationRecord[],
  rewards: RewardRecord[],
  settings: ClassSettings,
  periodLabel: string,
  startDate?: string,
  endDate?: string
): void {
  const workbook = XLSX.utils.book_new();

  // 1. Sheet Tổng hợp 100% học sinh
  const masterRows = students.map((s, idx) => {
    const sAtt = attendance.filter((a) => a.studentId === s.id);
    const ex = sAtt.filter((a) => a.status === 'absent_excused' || a.status === 'Vắng có phép').length;
    const un = sAtt.filter((a) => a.status === 'absent_unexcused' || a.status === 'Vắng không phép').length;
    const lateUnder5 = sAtt.filter((a) => a.status === 'late_under_5' || a.status === 'Đi muộn dưới 5 phút').length;
    const lateOver5 = sAtt.filter((a) => a.status === 'late_over_5' || a.status === 'Đi muộn trên 5 phút').length;

    const sRewards = rewards.filter((r) => r.studentId === s.id);
    const totalBonus = sRewards.reduce((sum, r) => sum + (r.bonusPoints || 0), 0);
    const rewardDetails = sRewards.length > 0
      ? sRewards.map((r) => `[${formatDateVN(r.date)}] ${r.content} (+${r.bonusPoints}đ)`).join('\n')
      : 'Không có';

    const sViolations = violations.filter((v) => v.studentId === s.id);
    const totalPenalty = sViolations.reduce((sum, v) => sum + (v.penaltyPoints || 0), 0);
    const violationDetails = sViolations.length > 0
      ? sViolations.map((v) => `[${formatDateVN(v.date)}] ${v.content} (-${v.penaltyPoints}đ, ${v.severity || 'Vừa'})`).join('\n')
      : 'Không có';

    const baseScore = 100;
    const attDeduction = (un * 10) + (lateUnder5 * 5) + (lateOver5 * 10);
    const netScore = Math.max(0, baseScore + totalBonus - totalPenalty - attDeduction);
    let conductRank = 'Tốt';
    if (netScore < 50) {
      conductRank = 'Chưa đạt';
    } else if (netScore < 70) {
      conductRank = 'Đạt';
    } else if (netScore < 90) {
      conductRank = 'Khá';
    }

    return {
      'STT': idx + 1,
      'Mã Học Sinh': s.code,
      'Họ và Tên': s.fullName,
      'Giới Tính': s.gender,
      'Ngày Sinh': formatDateVN(s.dob),
      'Tổ': `Tổ ${s.group}`,
      'Chức Vụ': s.roleInClass || 'Học sinh',
      'Vắng Có Phép': ex,
      'Vắng Không Phép': un,
      'Muộn < 5p': lateUnder5,
      'Muộn >= 5p': lateOver5,
      'Số Lần Tuyên Dương': sRewards.length,
      'Tổng Điểm Thưởng (+)': totalBonus,
      'Chi Tiết Tuyên Dương': rewardDetails,
      'Số Lần Vi Phạm': sViolations.length,
      'Tổng Điểm Phạt (-)': totalPenalty,
      'Chi Tiết Lỗi Vi Phạm': violationDetails,
      'Điểm Nề Nếp (Thang 100)': netScore,
      'Xếp Loại Nề Nếp': conductRank,
      'SĐT Phụ Huynh': s.parentPhone,
      'Họ Tên Bố/Mẹ': s.fatherName || s.motherName || '',
      'Ghi Chú': s.notes || (un > 0 ? 'Có vắng không phép' : ''),
    };
  });

  const masterSheet = XLSX.utils.json_to_sheet(masterRows);
  XLSX.utils.book_append_sheet(workbook, masterSheet, 'TongHop_TatCa_HocSinh');

  // 2. Sheet Chi tiết tất cả lỗi vi phạm
  const violationRows = violations.map((v, idx) => {
    const student = students.find((s) => s.id === v.studentId);
    return {
      'STT': idx + 1,
      'Ngày': formatDateVN(v.date),
      'Mã Học Sinh': student?.code || '',
      'Họ và Tên Học Sinh': student?.fullName || 'Chưa xác định',
      'Tổ': student ? `Tổ ${student.group}` : '',
      'Hành Vi Vi Phạm': v.content,
      'Mức Độ': v.severity || 'Vừa',
      'Điểm Trừ': v.penaltyPoints,
      'Người Báo Cáo': v.reporter || 'Đội Cờ Đỏ',
      'Trạng Thái Xử Lý': v.status || 'Đã nhắc nhở',
    };
  });
  const violationSheet = XLSX.utils.json_to_sheet(violationRows);
  XLSX.utils.book_append_sheet(workbook, violationSheet, 'DanhSach_ChiTiet_ViPham');

  // 3. Sheet Chi tiết tất cả tuyên dương khen thưởng
  const rewardRows = rewards.map((r, idx) => {
    const student = students.find((s) => s.id === r.studentId);
    return {
      'STT': idx + 1,
      'Ngày': formatDateVN(r.date),
      'Mã Học Sinh': student?.code || '',
      'Họ và Tên Học Sinh': student?.fullName || 'Chưa xác định',
      'Tổ': student ? `Tổ ${student.group}` : '',
      'Nội Dung Tuyên Dương': r.content,
      'Lĩnh Vực': r.type || 'Học tập',
      'Điểm Thưởng Cộng': r.bonusPoints,
    };
  });
  const rewardSheet = XLSX.utils.json_to_sheet(rewardRows);
  XLSX.utils.book_append_sheet(workbook, rewardSheet, 'DanhSach_ChiTiet_TuyenDuong');

  const safePeriod = periodLabel ? `_${periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
  XLSX.writeFile(workbook, `Bao_Cao_Tong_Hop_Hoc_Sinh_Vi_Pham_Khen_Thuong_${settings.className}${safePeriod}.xlsx`);
}

/**
 * Export Master Student Ledger (All Students + Violations + Rewards Table) to Word (.doc)
 */
export function exportStudentDetailedLedgerWord(
  students: Student[],
  attendance: AttendanceRecord[],
  violations: ViolationRecord[],
  rewards: RewardRecord[],
  settings: ClassSettings,
  periodLabel: string,
  startDate?: string,
  endDate?: string
): void {
  const tableRows = students
    .map((s, idx) => {
      const sAtt = attendance.filter((a) => a.studentId === s.id);
      const ex = sAtt.filter((a) => a.status === 'absent_excused' || a.status === 'Vắng có phép').length;
      const un = sAtt.filter((a) => a.status === 'absent_unexcused' || a.status === 'Vắng không phép').length;
      const lateUnder5 = sAtt.filter((a) => a.status === 'late_under_5' || a.status === 'Đi muộn dưới 5 phút').length;
      const lateOver5 = sAtt.filter((a) => a.status === 'late_over_5' || a.status === 'Đi muộn trên 5 phút').length;
      
      const attSummary: string[] = [];
      if (ex > 0) attSummary.push(`Vắng CP: ${ex}`);
      if (un > 0) attSummary.push(`Vắng KP: ${un} (-${un * 10}đ)`);
      if (lateUnder5 > 0) attSummary.push(`Muộn < 5p: ${lateUnder5} (-${lateUnder5 * 5}đ)`);
      if (lateOver5 > 0) attSummary.push(`Muộn >= 5p: ${lateOver5} (-${lateOver5 * 10}đ)`);
      const attText = attSummary.length > 0 ? attSummary.join(', ') : 'Đầy đủ, đúng giờ';

      const sRewards = rewards.filter((r) => r.studentId === s.id);
      const totalBonus = sRewards.reduce((sum, r) => sum + (r.bonusPoints || 0), 0);
      const rewardText = sRewards.length > 0
        ? sRewards.map((r) => `+ ${r.content} (+${r.bonusPoints}đ)`).join('<br/>')
        : '<span style="color: #666;">-</span>';

      const sViolations = violations.filter((v) => v.studentId === s.id);
      const totalPenalty = sViolations.reduce((sum, v) => sum + (v.penaltyPoints || 0), 0);
      const violationText = sViolations.length > 0
        ? sViolations.map((v) => `• ${v.content} (-${v.penaltyPoints}đ)`).join('<br/>')
        : '<span style="color: #15803d;">Không vi phạm</span>';

      const baseScore = 100;
      const attDeduction = (un * 10) + (lateUnder5 * 5) + (lateOver5 * 10);
      const netScore = Math.max(0, baseScore + totalBonus - totalPenalty - attDeduction);
      let rank = 'Tốt';
      let rankColor = '#15803d';
      if (netScore < 50) {
        rank = 'Chưa đạt';
        rankColor = '#b91c1c';
      } else if (netScore < 70) {
        rank = 'Đạt';
        rankColor = '#c2410c';
      } else if (netScore < 90) {
        rank = 'Khá';
        rankColor = '#0369a1';
      }

      return `
        <tr>
          <td style="text-align: center; vertical-align: middle;">${idx + 1}</td>
          <td style="vertical-align: middle;"><b>${s.fullName}</b><br/><span style="font-size: 9pt; color: #555;">${s.code}</span></td>
          <td style="text-align: center; vertical-align: middle;">Tổ ${s.group}</td>
          <td style="font-size: 10pt; vertical-align: middle;">${attText}</td>
          <td style="font-size: 10pt; vertical-align: middle; color: #166534;">${rewardText}</td>
          <td style="font-size: 10pt; vertical-align: middle; color: #991b1b;">${violationText}</td>
          <td style="text-align: center; vertical-align: middle;"><b>${netScore}</b><br/><span style="font-weight: bold; color: ${rankColor}; font-size: 9.5pt;">${rank}</span></td>
          <td style="font-size: 9.5pt; vertical-align: middle;">${s.notes || (un > 0 ? 'Cần nhắc nhở chuyên cần' : 'Nề nếp tốt')}</td>
        </tr>
      `;
    })
    .join('');

  const htmlBody = `
    <p><b>Kỳ báo cáo:</b> ${periodLabel}</p>
    <p><b>Thời gian:</b> Từ ngày ${formatDateVN(startDate)} đến ngày ${formatDateVN(endDate)}</p>
    <p><b>Tổng số học sinh:</b> ${students.length} học sinh | <b>Tổng lượt tuyên dương:</b> ${rewards.length} | <b>Tổng lượt vi phạm:</b> ${violations.length}</p>

    <h3>BẢNG TỔNG HỢP CHI TIẾT TỪNG HỌC SINH (CHUYÊN CẦN, TUYÊN DƯƠNG & VI PHẠM)</h3>
    <table class="data-table">
      <thead>
        <tr style="background-color: #f1f5f9;">
          <th style="width: 4%; text-align: center;">STT</th>
          <th style="width: 18%;">Họ và Tên</th>
          <th style="width: 6%; text-align: center;">Tổ</th>
          <th style="width: 14%;">Chuyên Cần</th>
          <th style="width: 22%;">Tuyên Dương / Khen Thưởng</th>
          <th style="width: 22%;">Lỗi Vi Phạm / Khuyết Điểm</th>
          <th style="width: 8%; text-align: center;">Điểm / Xếp Loại</th>
          <th style="width: 6%;">Ghi Chú</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <div style="margin-top: 20px;">
      <p><b>Ghi chú đánh giá của GVCN:</b></p>
      <p>- Điểm nề nếp cơ bản bắt đầu từ 100 điểm/học sinh; cộng điểm theo các thành tích và trừ điểm tương ứng với các vi phạm theo nội quy nhà trường.</p>
      <p>- Các học sinh có biểu hiện vi phạm nhiều lần đã được GVCN mời trao đổi, lập biên bản và liên hệ với phụ huynh để cùng phối hợp giáo dục.</p>
    </div>
  `;

  const title = `BẢNG TỔNG HỢP HỌC SINH - VI PHẠM & TUYÊN DƯƠNG (${settings.className})`;
  exportReportToWord(title, htmlBody, settings, `Bang_Tong_Hop_Hoc_Sinh_Vi_Pham_Khen_Thuong_${settings.className}.doc`);
}
