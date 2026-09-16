import { storage } from './storageService';

export interface AIChatMessage {
  id: string;
  sender?: 'user' | 'assistant';
  role?: 'user' | 'assistant';
  text?: string;
  content?: string;
  timestamp: string;
  source?: 'gemini' | 'offline_assistant' | 'offline_fallback' | string;
}

export async function askTeacherAI(
  prompt: string,
  history: AIChatMessage[] = []
): Promise<{ reply: string; source: string }> {
  try {
    const students = storage.getStudents();
    const attendance = storage.getAttendance();
    const violations = storage.getViolations();
    const rewards = storage.getRewards();
    const settings = storage.getSettings();

    const studentsWithAbsent = students.map((s) => {
      const studentAtt = attendance.filter((a) => a.studentId === s.id);
      const absentCount = studentAtt.filter(
        (a) => a.status === 'absent_excused' || a.status === 'absent_unexcused' || a.status === 'truant' || a.status === 'Vắng có phép' || a.status === 'Vắng không phép'
      ).length;
      return {
        fullName: s.fullName,
        group: s.group,
        absentCount,
        parentPhone: s.parentPhone,
        specialAttention: s.specialAttention,
      };
    });

    const context = {
      className: settings.className,
      schoolName: settings.schoolName,
      teacherName: settings.teacherName,
      totalStudents: students.length,
      students: studentsWithAbsent,
      recentViolations: violations.slice(0, 5),
      recentRewards: rewards.slice(0, 5),
      historyPreview: history.slice(-4).map((h) => ({
        role: h.role || h.sender,
        content: h.content || h.text,
      })),
    };

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        context,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return {
      reply: data.reply || 'Không nhận được câu trả lời từ máy chủ.',
      source: data.source || 'gemini',
    };
  } catch (error) {
    console.warn('AI query error, using local smart fallback:', error);
    // Offline intelligent pedagogical knowledge base responses
    const p = prompt.toLowerCase();
    let smartReply = '';
    if (p.includes('học bạ') || p.includes('thông tư 22') || p.includes('nhận xét')) {
      smartReply = `**Gợi ý nhận xét học bạ theo Thông tư 22/2021/TT-BGDĐT:**\n\n1. **Học sinh Giỏi / Toàn diện:** "Em có ý thức kỷ luật tốt, tích cực, chủ động, sáng tạo trong tiếp thu bài học; luôn năng nổ giúp đỡ bạn bè và gương mẫu đi đầu trong phong trào của Chi đoàn."\n2. **Học sinh Khá cần cải thiện:** "Em chăm ngoan, lễ phép, chấp hành nghiêm nội quy lớp học; cần tự giác và chủ động hơn trong việc ôn luyện các môn Tự nhiên để đạt kết quả bứt phá hơn."\n3. **Học sinh cần quan tâm:** "Em có nhiều chuyển biến tích cực về nề nếp và chuyên cần; nếu chú ý nghe giảng và hoàn thành bài tập về nhà đầy đủ hơn sẽ tiến bộ rõ rệt."`;
    } else if (p.includes('phụ huynh') || p.includes('họp')) {
      smartReply = `**Dàn ý & Bài phát biểu Họp Phụ Huynh đầu năm (Lớp 11A1):**\n\n- **1. Chào mừng & Cảm ơn:** Chào trân trọng các bậc cha mẹ học sinh đã dành thời gian quý báu tham dự buổi họp.\n- **2. Báo cáo đặc điểm tình hình:** Lớp gồm 32 học sinh, tinh thần đoàn kết cao, cơ sở vật chất đảm bảo.\n- **3. Mục tiêu năm học bản lề lớp 11:** Chuẩn bị khối lượng kiến thức trọng tâm cho kỳ thi Tốt nghiệp THPT và ĐGNL.\n- **4. Phương hướng phối hợp Gia đình - Nhà trường:** Khuyến khích phụ huynh duy trì trao đổi qua nhóm Zalo, theo dõi thời gian biểu tự học buổi tối của các em.\n- **5. Lời kết:** Kính chúc quý phụ huynh sức khỏe, cùng đồng hành giúp các em có một năm học thành công rực rỡ.`;
    } else if (p.includes('game') || p.includes('trốn học') || p.includes('vi phạm')) {
      smartReply = `**Tư vấn sư phạm xử lý học sinh mê game / trốn học:**\n\n- **Bước 1 (Lắng nghe & đồng cảm):** Không trách mắng ngay trước tập thể lớp. Gặp riêng em sau giờ học trong không gian thân thiện, tìm hiểu lý do (áp lực học tập, mâu thuẫn bạn bè hay nghiện game trực tuyến).\n- **Bước 2 (Đặt mục tiêu nhỏ):** Giao việc cụ thể trong ban cán sự hoặc đội nhóm (quản lý kỹ thuật máy chiếu, thể thao) để em thấy mình có giá trị trong lớp.\n- **Bước 3 (Liên kết gia đình):** Gọi điện thoại ấm áp cho phụ huynh để thống nhất quy ước dùng điện thoại ở nhà, không dùng đòn roi gây phản tác dụng tâm lý tuổi dậy thì.`;
    } else {
      smartReply = `**Ý kiến sư phạm từ Trợ lý Chủ nhiệm:**\n\nChào Thầy/Cô! Đối với yêu cầu của Thầy/Cô về "${prompt}", nguyên tắc sư phạm cốt lõi tại bậc THPT là **Tôn trọng - Thấu hiểu - Kỷ cương đồng hành cùng Yêu thương**.\n\n- Thầy/Cô nên duy trì việc ghi chép nhật ký lớp học hàng ngày.\n- Phối hợp chặt chẽ với Giáo viên bộ môn để nắm bắt kịp thời học lực từng môn.\n- Tạo động lực cho các em thông qua cơ chế cộng điểm thi đua và khen thưởng nhóm Tổ.`;
    }

    return {
      reply: smartReply,
      source: 'offline_assistant',
    };
  }
}

export async function generateAIAdvice(
  prompt: string,
  contextData?: any
): Promise<string> {
  const result = await askTeacherAI(prompt, []);
  return result.reply;
}
