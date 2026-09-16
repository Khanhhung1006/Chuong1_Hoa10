import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Copy,
  Check,
  RotateCcw,
  MessageSquare,
  BookOpen,
  HeartHandshake,
  Users,
  Lightbulb,
} from 'lucide-react';
import { generateAIAdvice, AIChatMessage } from '../../services/aiService';
import { Student, ClassSettings } from '../../types';

interface AIAssistantViewProps {
  students: Student[];
  settings: ClassSettings;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const QUICK_PROMPTS = [
  {
    icon: BookOpen,
    label: 'Nhận xét học bạ TT22',
    prompt:
      'Hãy viết giúp tôi 3 mẫu lời nhận xét học bạ cuối kỳ 1 theo Thông tư 22 cho học sinh THPT: một em học lực Giỏi nề nếp tốt, một em học lực Khá cần nỗ lực môn Toán, và một em học sinh cá biệt có tiến bộ.',
  },
  {
    icon: Users,
    label: 'Bài phát biểu Họp Phụ Huynh',
    prompt:
      'Hãy soạn một dàn ý và lời phát biểu ấm áp, trang trọng cho buổi Họp Phụ Huynh đầu năm lớp 11A1 THPT, nhấn mạnh sự phối hợp giữa gia đình và nhà trường trong định hướng thi tốt nghiệp THPT.',
  },
  {
    icon: HeartHandshake,
    label: 'Tình huống sư phạm: Mê game & Trốn học',
    prompt:
      'Tôi có một học sinh nam lớp 11 thường xuyên đi học muộn, có dấu hiệu trốn học chơi game ở quán net, phụ huynh bận buôn bán ít để ý. Với vai trò GVCN, tôi nên tiếp cận và can thiệp giáo dục như thế nào cho khéo léo?',
  },
  {
    icon: Lightbulb,
    label: 'Kế hoạch sinh hoạt lớp chuyên đề',
    prompt:
      'Gợi ý cho tôi một kịch bản sinh hoạt lớp 45 phút theo chủ đề: "Xây dựng tình bạn đẹp - Nói không với bạo lực học đường và mạng xã hội" dành cho học sinh THPT.',
  },
];

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  students,
  settings,
  onShowToast,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'ai-welcome',
      role: 'assistant',
      content: `Xin chào Thầy/Cô **${settings.teacherName}**! Tôi là Trợ lý AI Chủ nhiệm THPT. Tôi có thể hỗ trợ Thầy/Cô:\n\n- Soạn nhận xét học bạ, sổ liên lạc chuẩn mực theo Thông tư 22\n- Xử lý các tình huống sư phạm và tâm lý lứa tuổi học sinh THPT\n- Lập kế hoạch sinh hoạt lớp, bài phát biểu họp phụ huynh\n- Soạn thảo tin nhắn khéo léo gửi phụ huynh học sinh.\n\nThầy/Cô cần tôi hỗ trợ nội dung gì hôm nay ạ?`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: AIChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!navigator.onLine) {
      const offlineAiMsg: AIChatMessage = {
        id: `ai-offline-${Date.now()}`,
        role: 'assistant',
        content:
          '⚠️ **Thiết bị đang ở chế độ Ngoại tuyến (Offline):**\n\nTrợ lý AI cần kết nối Internet để gửi yêu cầu đến mô hình Gemini. Tuy nhiên, toàn bộ dữ liệu quản lý lớp học (Điểm danh, Hồ sơ học sinh, Sơ đồ lớp, Sổ điểm, Thu chi, Kỷ luật, Khen thưởng...) vẫn đang hoạt động và lưu trữ bình thường 100% trên thiết bị của Thầy/Cô.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, offlineAiMsg]);
      onShowToast('Bạn đang ở chế độ Offline. AI cần có mạng Internet.', 'warning');
      return;
    }

    setInput('');
    setLoading(true);

    try {
      const reply = await generateAIAdvice(query, {
        className: settings.className,
        schoolName: settings.schoolName,
        teacherName: settings.teacherName,
        studentsCount: students.length,
      });

      const aiMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      onShowToast('Không thể kết nối với dịch vụ AI', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    onShowToast('Đã chép nội dung trả lời của AI!', 'success');
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'ai-welcome-new',
        role: 'assistant',
        content: 'Cuộc trò chuyện đã được làm mới. Thầy/Cô cần hỗ trợ tình huống sư phạm hay văn bản nào tiếp theo ạ?',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div id="ai-assistant-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-amber-600 p-6 rounded-3xl text-white shadow-xl shadow-cyan-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            AI Gemini Sư Phạm THPT
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
            Trợ Lý AI Dành Cho Giáo Viên Chủ Nhiệm
          </h2>
          <p className="text-xs text-cyan-50/90 mt-1">
            Được huấn luyện theo chuẩn Thông tư 22/BGDĐT, kinh nghiệm tư vấn tâm lý học đường và giao tiếp sư phạm
          </p>
        </div>

        <button
          onClick={handleClearHistory}
          className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Làm mới phiên chat
        </button>
      </div>

      {/* Quick Prompts Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK_PROMPTS.map((qp, idx) => {
          const Icon = qp.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSend(qp.prompt)}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left hover:border-cyan-500 dark:hover:border-cyan-500 shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {qp.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2">{qp.prompt}</p>
            </button>
          );
        })}
      </div>

      {/* Chat Messages Frame */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[520px]">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isAI = msg.role === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                {isAI && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-teal-400 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 relative group ${
                    isAI
                      ? 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800'
                      : 'bg-cyan-600 text-white font-medium rounded-br-none'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>

                  <div
                    className={`flex items-center justify-between pt-1 border-t text-[10px] ${
                      isAI
                        ? 'border-slate-200/60 dark:border-slate-700 text-slate-400'
                        : 'border-white/20 text-cyan-100'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {isAI && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-cyan-600 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === msg.id ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-teal-400 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                Trợ lý AI đang phân tích và soạn câu trả lời sư phạm...
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              id="ai-prompt-input"
              type="text"
              placeholder="Nhập câu hỏi, tình huống sư phạm hoặc yêu cầu soạn văn bản..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 outline-hidden focus:border-cyan-500"
            />
            <button
              id="ai-send-btn"
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
              Gửi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
