import React, { useState } from 'react';
import {
  HeartHandshake,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  ChevronRight,
} from 'lucide-react';
import { Student, ConductEvaluation, ConductGrade, ViolationRecord, AttendanceRecord, ClassSettings, ConductRecord, RewardRecord, ConductRating } from '../../types';

interface ConductViewProps {
  students: Student[];
  evaluations?: ConductEvaluation[];
  conducts?: ConductRecord[];
  violations: ViolationRecord[];
  attendance: AttendanceRecord[];
  rewards?: RewardRecord[];
  settings: ClassSettings;
  onSaveEvaluations?: (evals: ConductEvaluation[]) => void;
  onSaveConduct?: (c: ConductRecord | ConductRecord[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ConductView: React.FC<ConductViewProps> = ({
  students = [],
  evaluations = [],
  conducts = [],
  violations = [],
  attendance = [],
  rewards = [],
  settings,
  onSaveEvaluations,
  onSaveConduct,
  onShowToast,
}) => {
  const [selectedTerm, setSelectedTerm] = useState<
    'HK1' | 'HK2' | 'CN' | 'Tháng 9' | 'Tháng 10' | 'Tháng 11' | 'Tháng 12' | 'Tháng 1' | 'Tháng 2' | 'Tháng 3' | 'Tháng 4' | 'Tháng 5'
  >('HK1');
  const [viewMode, setViewMode] = useState<'semester' | 'monthly'>('semester');
  const [search, setSearch] = useState('');

  // Local state map: studentId -> { grade, note }
  const [evalMap, setEvalMap] = useState<Record<string, { grade: ConductGrade; note: string }>>({});

  // Helper to calculate semester average rating from monthly evaluations
  const getSemesterAverageRating = (studentId: string, semester: 'HK1' | 'HK2') => {
    const months = semester === 'HK1'
      ? ['Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12', 'Tháng 1']
      : ['Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5'];

    // Find all saved conduct records for this student in these months
    const savedMonthlyRecords = (conducts || []).filter(
      (c) => c.studentId === studentId && c.term === 'Tháng' && c.timeLabel && months.includes(c.timeLabel)
    );

    const details = savedMonthlyRecords.map(r => ({
      month: r.timeLabel || '',
      rating: r.rating || r.grade || 'Tốt'
    }));

    if (savedMonthlyRecords.length === 0) {
      return { grade: null, averagePoints: 0, details: [] };
    }

    const ratingToPoints: Record<ConductRating, number> = {
      'Tốt': 4,
      'Khá': 3,
      'Đạt': 2,
      'Chưa đạt': 1,
    };

    let totalPoints = 0;
    savedMonthlyRecords.forEach((r) => {
      const rating = r.rating || r.grade || 'Tốt';
      totalPoints += ratingToPoints[rating] || 4;
    });

    const averagePoints = totalPoints / savedMonthlyRecords.length;

    let grade: ConductGrade = 'Chưa đạt';
    if (averagePoints >= 3.5) grade = 'Tốt';
    else if (averagePoints >= 2.5) grade = 'Khá';
    else if (averagePoints >= 1.5) grade = 'Đạt';

    return { grade, averagePoints, details };
  };

  // Helper to calculate annual average rating from semester evaluations
  const getAnnualAverageRating = (studentId: string) => {
    const hkRecords = (conducts || []).filter(
      (c) => c.studentId === studentId && (c.term === 'Học kỳ 1' || c.term === 'Học kỳ 2')
    );

    const details = hkRecords.map(r => ({
      term: r.term || '',
      rating: r.rating || r.grade || 'Tốt'
    }));

    if (hkRecords.length === 0) {
      return { grade: null, details: [] };
    }

    const ratingToPoints: Record<ConductRating, number> = {
      'Tốt': 4,
      'Khá': 3,
      'Đạt': 2,
      'Chưa đạt': 1,
    };

    let totalPoints = 0;
    hkRecords.forEach((r) => {
      const rating = r.rating || r.grade || 'Tốt';
      const weight = r.term === 'Học kỳ 2' ? 2 : 1;
      totalPoints += (ratingToPoints[rating] || 4) * weight;
    });

    const totalWeight = hkRecords.reduce((sum, r) => sum + (r.term === 'Học kỳ 2' ? 2 : 1), 0);
    const averagePoints = totalPoints / totalWeight;

    let grade: ConductGrade = 'Chưa đạt';
    if (averagePoints >= 3.5) grade = 'Tốt';
    else if (averagePoints >= 2.5) grade = 'Khá';
    else if (averagePoints >= 1.5) grade = 'Đạt';

    return { grade, details };
  };

  // Auto suggestion calculation logic based on violations, rewards, and absences
  const getAutoSuggestedGrade = (studentId: string, term: string): ConductGrade => {
    let studentViolations = violations.filter((v) => v.studentId === studentId);
    let studentRewards = rewards.filter((r) => r.studentId === studentId);
    let sAtt = attendance.filter((a) => a.studentId === studentId);

    if (term.startsWith('Tháng ')) {
      const monthMap: Record<string, string> = {
        'Tháng 9': '-09-',
        'Tháng 10': '-10-',
        'Tháng 11': '-11-',
        'Tháng 12': '-12-',
        'Tháng 1': '-01-',
        'Tháng 2': '-02-',
        'Tháng 3': '-03-',
        'Tháng 4': '-04-',
        'Tháng 5': '-05-',
      };
      const pattern = monthMap[term];
      if (pattern) {
        studentViolations = studentViolations.filter((v) => v.date && v.date.includes(pattern));
        studentRewards = studentRewards.filter((r) => r.date && r.date.includes(pattern));
        sAtt = sAtt.filter((a) => a.date && a.date.includes(pattern));
      }
    } else if (term === 'HK1') {
      const hk1Months = ['-09-', '-10-', '-11-', '-12-', '-01-'];
      studentViolations = studentViolations.filter((v) => v.date && hk1Months.some(m => v.date.includes(m)));
      studentRewards = studentRewards.filter((r) => r.date && hk1Months.some(m => r.date.includes(m)));
      sAtt = sAtt.filter((a) => a.date && hk1Months.some(m => a.date.includes(m)));
    } else if (term === 'HK2') {
      const hk2Months = ['-02-', '-03-', '-04-', '-05-'];
      studentViolations = studentViolations.filter((v) => v.date && hk2Months.some(m => v.date.includes(m)));
      studentRewards = studentRewards.filter((r) => r.date && hk2Months.some(m => r.date.includes(m)));
      sAtt = sAtt.filter((a) => a.date && hk2Months.some(m => a.date.includes(m)));
    }

    const totalPenalty = studentViolations.reduce((sum, v) => sum + v.penaltyPoints, 0);
    const totalBonus = studentRewards.reduce((sum, r) => sum + (r.bonusPoints || 0), 0);

    const un = sAtt.filter((a) => a.status === 'absent_unexcused' || a.status === 'Vắng không phép').length;
    const lateUnder5 = sAtt.filter((a) => a.status === 'late_under_5' || a.status === 'Đi muộn dưới 5 phút').length;
    const lateOver5 = sAtt.filter((a) => a.status === 'late_over_5' || a.status === 'Đi muộn trên 5 phút').length;

    const baseScore = 100;
    const attDeduction = (un * 10) + (lateUnder5 * 5) + (lateOver5 * 10);
    const netScore = Math.max(0, baseScore + totalBonus - totalPenalty - attDeduction);

    if (netScore < 50) return 'Chưa đạt';
    if (netScore < 70) return 'Đạt';
    if (netScore < 90) return 'Khá';
    return 'Tốt';
  };

  // Sync initial
  React.useEffect(() => {
    const initial: Record<string, { grade: ConductGrade; note: string }> = {};
    (students || []).forEach((s) => {
      const existingEval = (evaluations || []).find(
        (e) => e.studentId === s.id && e.term === selectedTerm
      );
      const existingCond = (conducts || []).find((c) => {
        if (c.studentId !== s.id) return false;
        if (selectedTerm.startsWith('Tháng ')) {
          return c.term === 'Tháng' && c.timeLabel === selectedTerm;
        }
        if (selectedTerm === 'HK1') return c.term === 'Học kỳ 1';
        if (selectedTerm === 'HK2') return c.term === 'Học kỳ 2';
        if (selectedTerm === 'CN') return c.term === 'Cả năm';
        return false;
      });

      if (existingCond) {
        initial[s.id] = {
          grade: (existingCond.rating as ConductGrade) || 'Tốt',
          note: existingCond.teacherNote || '',
        };
      } else if (existingEval) {
        initial[s.id] = { grade: existingEval.grade, note: existingEval.note || '' };
      } else {
        let auto: ConductGrade = 'Tốt';
        let autoNote = '';

        if (selectedTerm === 'HK1' || selectedTerm === 'HK2') {
          const avgRes = getSemesterAverageRating(s.id, selectedTerm as 'HK1' | 'HK2');
          if (avgRes.grade) {
            auto = avgRes.grade;
            autoNote = `Tính toán tự động theo trung bình các tháng: ${avgRes.grade} (Điểm TB: ${avgRes.averagePoints.toFixed(2)}/4).`;
          } else {
            auto = getAutoSuggestedGrade(s.id, selectedTerm);
            autoNote = 'Chưa có đánh giá tháng. Tính toán tự động theo tổng hợp vi phạm cả học kỳ.';
          }
        } else if (selectedTerm === 'CN') {
          const annualRes = getAnnualAverageRating(s.id);
          if (annualRes.grade) {
            auto = annualRes.grade;
            autoNote = `Tính toán tự động theo trung bình HK1 & HK2 (hệ số 2 cho HK2): ${annualRes.grade}.`;
          } else {
            auto = getAutoSuggestedGrade(s.id, selectedTerm);
            autoNote = 'Chưa có đánh giá học kỳ. Tính toán tự động theo tổng hợp vi phạm cả năm.';
          }
        } else {
          auto = getAutoSuggestedGrade(s.id, selectedTerm);
          autoNote = auto === 'Tốt'
            ? `Chấp hành tốt kỷ luật và nề nếp trong ${selectedTerm}.`
            : auto === 'Khá'
            ? `Nề nếp trong ${selectedTerm} khá tốt, có một vài lỗi nhỏ đã khắc phục.`
            : `Cần chấn chỉnh tinh thần tự giác rèn luyện trong ${selectedTerm}.`;
        }
        initial[s.id] = { grade: auto, note: autoNote };
      }
    });
    setEvalMap(initial);
  }, [students, evaluations, conducts, selectedTerm, violations, attendance, rewards]);

  const handleGradeChange = (studentId: string, grade: ConductGrade) => {
    setEvalMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        grade,
      },
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setEvalMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
  };

  // Apply auto-suggestions to all
  const handleAutoSuggestAll = () => {
    const updated: Record<string, { grade: ConductGrade; note: string }> = {};
    students.forEach((s) => {
      let auto: ConductGrade = 'Tốt';
      let autoNote = '';

      if (selectedTerm === 'HK1' || selectedTerm === 'HK2') {
        const avgRes = getSemesterAverageRating(s.id, selectedTerm as 'HK1' | 'HK2');
        if (avgRes.grade) {
          auto = avgRes.grade;
          autoNote = `Gợi ý theo trung bình các tháng: ${avgRes.grade} (TB: ${avgRes.averagePoints.toFixed(2)}/4).`;
        } else {
          auto = getAutoSuggestedGrade(s.id, selectedTerm);
          autoNote = 'Ý thức học tập tốt, chưa có đánh giá tháng.';
        }
      } else if (selectedTerm === 'CN') {
        const annualRes = getAnnualAverageRating(s.id);
        if (annualRes.grade) {
          auto = annualRes.grade;
          autoNote = `Gợi ý theo trung bình HK1 & HK2 (hệ số 2 cho HK2): ${annualRes.grade}.`;
        } else {
          auto = getAutoSuggestedGrade(s.id, selectedTerm);
          autoNote = 'Ý thức rèn luyện tốt cả năm.';
        }
      } else {
        auto = getAutoSuggestedGrade(s.id, selectedTerm);
        autoNote = auto === 'Tốt'
          ? `Ý thức tự giác tốt, chấp hành tốt kỷ luật trong ${selectedTerm}.`
          : auto === 'Khá'
          ? `Nề nếp trong ${selectedTerm} khá tốt, cần chú ý chuyên cần.`
          : `Cần nỗ lực khắc phục vi phạm nề nếp trong ${selectedTerm}.`;
      }
      updated[s.id] = { grade: auto, note: autoNote };
    });
    setEvalMap(updated);
    onShowToast(`Đã tự động tính gợi ý hạnh kiểm cho ${selectedTerm}!`, 'info');
  };

  // Save evaluations
  const handleSave = () => {
    const otherEvals = (evaluations || []).filter((e) => e.term !== selectedTerm);
    const newEvals: ConductEvaluation[] = (students || []).map((s) => ({
      id: `eval-${selectedTerm}-${s.id}`,
      studentId: s.id,
      term: selectedTerm,
      grade: evalMap[s.id]?.grade || 'Tốt',
      rating: evalMap[s.id]?.grade || 'Tốt',
      teacherNote: evalMap[s.id]?.note || '',
    }));

    if (onSaveEvaluations) {
      onSaveEvaluations([...otherEvals, ...newEvals]);
    }

    if (onSaveConduct) {
      const conductRecordsToSave: ConductRecord[] = newEvals.map((ev) => ({
        id: ev.id,
        studentId: ev.studentId,
        term: ev.term.startsWith('Tháng') ? 'Tháng' : ev.term === 'CN' ? 'Cả năm' : ev.term === 'HK1' ? 'Học kỳ 1' : 'Học kỳ 2',
        rating: ev.rating || 'Tốt',
        grade: ev.grade || 'Tốt',
        teacherNote: ev.teacherNote || '',
        timeLabel: ev.term.startsWith('Tháng') ? ev.term : undefined,
      }));
      onSaveConduct(conductRecordsToSave);
    }

    onShowToast(`Đã lưu bảng xếp loại Hạnh kiểm (${selectedTerm}) thành công!`, 'success');
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const evalList = Object.values(evalMap) as { grade: ConductGrade; note?: string }[];
  const grades = evalList.map((v) => v.grade);
  const totCount = grades.filter((g) => g === 'Tốt').length;
  const khaCount = grades.filter((g) => g === 'Khá').length;
  const datCount = grades.filter((g) => g === 'Đạt').length;
  const chuadatCount = grades.filter((g) => g === 'Chưa đạt').length;

  return (
    <div id="conduct-view" className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            Đánh Giá & Xếp Loại Hạnh Kiểm
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quy định Thông tư 22/BGDĐT • GVCN: <span className="font-semibold text-cyan-600 dark:text-cyan-400">{settings.teacherName || 'Chưa cập nhật'}</span> • Tự động gợi ý từ vi phạm và chuyên cần, tính điểm trung bình tháng cho học kỳ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="auto-suggest-conduct-btn"
            onClick={handleAutoSuggestAll}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            Gợi ý tự động
          </button>

          <button
            id="save-conduct-btn"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Lưu xếp loại
          </button>
        </div>
      </div>

      {/* Mode and Term Selector Panel */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-fit">
            <button
              onClick={() => {
                setViewMode('semester');
                setSelectedTerm('HK1');
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                viewMode === 'semester'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Học Kỳ & Cả Năm
            </button>
            <button
              onClick={() => {
                setViewMode('monthly');
                setSelectedTerm('Tháng 9');
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Đánh Giá Theo Tháng
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, mã số..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 outline-hidden focus:border-cyan-500/50"
            />
          </div>
        </div>

        {viewMode === 'semester' ? (
          <div className="flex items-center p-1 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 text-xs font-bold max-w-md">
            <button
              onClick={() => setSelectedTerm('HK1')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer text-center ${
                selectedTerm === 'HK1'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-xs font-black'
                  : 'text-slate-500'
              }`}
            >
              Học Kỳ 1
            </button>
            <button
              onClick={() => setSelectedTerm('HK2')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer text-center ${
                selectedTerm === 'HK2'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-xs font-black'
                  : 'text-slate-500'
              }`}
            >
              Học Kỳ 2
            </button>
            <button
              onClick={() => setSelectedTerm('CN')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer text-center ${
                selectedTerm === 'CN'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-xs font-black'
                  : 'text-slate-500'
              }`}
            >
              Cả Năm
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 text-xs font-bold">
            {(['Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedTerm(m)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
                  selectedTerm === m
                    ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-center">
          <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">TỐT</div>
          <div className="text-2xl font-black text-emerald-600 font-display mt-0.5">
            {totCount} ({students.length > 0 ? Math.round((totCount / students.length) * 100) : 0}%)
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-900/40 text-center">
          <div className="text-[11px] font-bold text-cyan-800 dark:text-cyan-300">KHÁ</div>
          <div className="text-2xl font-black text-cyan-600 font-display mt-0.5">
            {khaCount} ({students.length > 0 ? Math.round((khaCount / students.length) * 100) : 0}%)
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-center">
          <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">ĐẠT</div>
          <div className="text-2xl font-black text-amber-600 font-display mt-0.5">
            {datCount} ({students.length > 0 ? Math.round((datCount / students.length) * 100) : 0}%)
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-center">
          <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300">CHƯA ĐẠT</div>
          <div className="text-2xl font-black text-rose-600 font-display mt-0.5">
            {chuadatCount} ({students.length > 0 ? Math.round((chuadatCount / students.length) * 100) : 0}%)
          </div>
        </div>
      </div>

      {/* Evaluations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4 w-10">STT</th>
                <th className="py-3 px-4">Học sinh</th>
                <th className="py-3 px-4">Tổ</th>
                <th className="py-3 px-4 text-center">Điểm & Dữ liệu nề nếp</th>
                {(selectedTerm === 'HK1' || selectedTerm === 'HK2' || selectedTerm === 'CN') && (
                  <th className="py-3 px-4">Tổng hợp Hạnh kiểm Tháng</th>
                )}
                <th className="py-3 px-4">Xếp loại Hạnh kiểm ({selectedTerm})</th>
                <th className="py-3 px-4">Nhận xét của GVCN {settings.teacherName ? `(${settings.teacherName})` : ''}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((st, idx) => {
                const current = evalMap[st.id] || { grade: 'Tốt', note: '' };

                // Filter violations, rewards, and attendance based on selectedTerm
                let stViolations = violations.filter((v) => v.studentId === st.id);
                let stRewards = rewards.filter((r) => r.studentId === st.id);
                let sAtt = attendance.filter((a) => a.studentId === st.id);

                if (selectedTerm.startsWith('Tháng ')) {
                  const monthMap: Record<string, string> = {
                    'Tháng 9': '-09-',
                    'Tháng 10': '-10-',
                    'Tháng 11': '-11-',
                    'Tháng 12': '-12-',
                    'Tháng 1': '-01-',
                    'Tháng 2': '-02-',
                    'Tháng 3': '-03-',
                    'Tháng 4': '-04-',
                    'Tháng 5': '-05-',
                  };
                  const pattern = monthMap[selectedTerm];
                  if (pattern) {
                    stViolations = stViolations.filter((v) => v.date && v.date.includes(pattern));
                    stRewards = stRewards.filter((r) => r.date && r.date.includes(pattern));
                    sAtt = sAtt.filter((a) => a.date && a.date.includes(pattern));
                  }
                } else if (selectedTerm === 'HK1') {
                  const hk1Months = ['-09-', '-10-', '-11-', '-12-', '-01-'];
                  stViolations = stViolations.filter((v) => v.date && hk1Months.some(m => v.date.includes(m)));
                  stRewards = stRewards.filter((r) => r.date && hk1Months.some(m => r.date.includes(m)));
                  sAtt = sAtt.filter((a) => a.date && hk1Months.some(m => a.date.includes(m)));
                } else if (selectedTerm === 'HK2') {
                  const hk2Months = ['-02-', '-03-', '-04-', '-05-'];
                  stViolations = stViolations.filter((v) => v.date && hk2Months.some(m => v.date.includes(m)));
                  stRewards = stRewards.filter((r) => r.date && hk2Months.some(m => r.date.includes(m)));
                  sAtt = sAtt.filter((a) => a.date && hk2Months.some(m => a.date.includes(m)));
                }

                const totalPenalty = stViolations.reduce((s, v) => s + v.penaltyPoints, 0);
                const totalBonus = stRewards.reduce((s, r) => s + (r.bonusPoints || 0), 0);

                const un = sAtt.filter((a) => a.status === 'absent_unexcused' || a.status === 'Vắng không phép').length;
                const lateUnder5 = sAtt.filter((a) => a.status === 'late_under_5' || a.status === 'Đi muộn dưới 5 phút').length;
                const lateOver5 = sAtt.filter((a) => a.status === 'late_over_5' || a.status === 'Đi muộn trên 5 phút').length;

                const baseScore = 100;
                const attDeduction = (un * 10) + (lateUnder5 * 5) + (lateOver5 * 10);
                const netScore = Math.max(0, baseScore + totalBonus - totalPenalty - attDeduction);

                return (
                  <tr
                    key={st.id}
                    className="hover:bg-cyan-50/20 dark:hover:bg-cyan-950/10 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {st.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{st.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">Tổ {st.group}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                        {netScore}đ
                      </div>
                      <div className="flex flex-col gap-0.5 items-center text-[10px] text-slate-500">
                        {totalBonus > 0 && <span className="text-emerald-600 font-bold">Điểm tốt: +{totalBonus}đ</span>}
                        {un > 0 && <span className="text-rose-600 font-semibold">Vắng KP: {un} (-{un * 10}đ)</span>}
                        {lateUnder5 > 0 && <span className="text-amber-600 font-medium">Muộn &lt;5p: {lateUnder5} (-{lateUnder5 * 5}đ)</span>}
                        {lateOver5 > 0 && <span className="text-orange-600 font-semibold font-bold">Muộn &ge;5p: {lateOver5} (-{lateOver5 * 10}đ)</span>}
                        {stViolations.length > 0 && (
                          <span className="text-red-500 font-semibold">Lỗi VP: {stViolations.length} (-{totalPenalty}đ)</span>
                        )}
                        {un === 0 && lateUnder5 === 0 && lateOver5 === 0 && stViolations.length === 0 && totalBonus === 0 && (
                          <span className="text-emerald-600 font-semibold">Không vi phạm</span>
                        )}
                      </div>
                    </td>

                    {/* Monthly average summary column for Semesters / Year */}
                    {(selectedTerm === 'HK1' || selectedTerm === 'HK2') && (
                      <td className="py-3 px-4">
                        {(() => {
                          const avgRes = getSemesterAverageRating(st.id, selectedTerm as 'HK1' | 'HK2');
                          if (avgRes.details.length === 0) {
                            return <span className="text-slate-400 text-[11px] italic">Chưa đánh giá tháng</span>;
                          }
                          return (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {avgRes.details.map((d) => {
                                  const shortMonth = d.month.replace('Tháng ', 'T');
                                  return (
                                    <span
                                      key={d.month}
                                      className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold ${
                                        d.rating === 'Tốt'
                                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50'
                                          : d.rating === 'Khá'
                                          ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-200/50'
                                          : d.rating === 'Đạt'
                                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50'
                                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50'
                                      }`}
                                      title={`${d.month}: ${d.rating}`}
                                    >
                                      {shortMonth}: {d.rating}
                                    </span>
                                  );
                                })}
                              </div>
                              <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                Trung bình tháng: <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">{avgRes.grade}</span> ({avgRes.averagePoints.toFixed(2)}/4)
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                    )}

                    {selectedTerm === 'CN' && (
                      <td className="py-3 px-4">
                        {(() => {
                          const annualRes = getAnnualAverageRating(st.id);
                          if (annualRes.details.length === 0) {
                            return <span className="text-slate-400 text-[11px] italic">Chưa đánh giá học kỳ</span>;
                          }
                          return (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex flex-wrap gap-1">
                                {annualRes.details.map((d) => (
                                  <span
                                    key={d.term}
                                    className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold ${
                                      d.rating === 'Tốt'
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50'
                                        : d.rating === 'Khá'
                                        ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-200/50'
                                        : d.rating === 'Đạt'
                                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50'
                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50'
                                    }`}
                                  >
                                    {d.term === 'Học kỳ 1' ? 'HK1' : 'HK2'}: {d.rating}
                                  </span>
                                ))}
                              </div>
                              {annualRes.grade && (
                                <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                  Cả năm (TB): <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">{annualRes.grade}</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                    )}

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {(['Tốt', 'Khá', 'Đạt', 'Chưa đạt'] as ConductGrade[]).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => handleGradeChange(st.id, g)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                              current.grade === g
                                ? g === 'Tốt'
                                  ? 'bg-emerald-500 text-white shadow-xs'
                                  : g === 'Khá'
                                  ? 'bg-cyan-500 text-white shadow-xs'
                                  : g === 'Đạt'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-rose-500 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={current.note}
                        onChange={(e) => handleNoteChange(st.id, e.target.value)}
                        className="w-full min-w-[280px] px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-hidden focus:border-cyan-500"
                        placeholder="Nhập nhận xét chi tiết..."
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
