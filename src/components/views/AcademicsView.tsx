import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Search,
  Filter,
  Download,
  AlertCircle,
  Award,
  Sparkles,
  TrendingUp,
  Save,
} from 'lucide-react';
import { Student, AcademicRecord, SubjectScore, ClassSettings } from '../../types';

interface AcademicsViewProps {
  students: Student[];
  academicRecords?: AcademicRecord[];
  grades?: SubjectScore[];
  settings: ClassSettings;
  onSaveScores?: (records: AcademicRecord[]) => void;
  onSaveGrade?: (score: SubjectScore) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const SUBJECT_LIST = [
  'Toán học',
  'Ngữ văn',
  'Tiếng Anh',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Lịch sử',
  'Địa lý',
  'Tin học',
  'GD Kinh tế & Pháp luật',
];

export const AcademicsView: React.FC<AcademicsViewProps> = ({
  students = [],
  academicRecords = [],
  grades = [],
  settings,
  onSaveScores,
  onSaveGrade,
  onShowToast,
}) => {
  const [selectedSubject, setSelectedSubject] = useState('Toán học');
  const [selectedTerm, setSelectedTerm] = useState<'HK1' | 'HK2'>('HK1');
  const [search, setSearch] = useState('');

  // Local editing scores cache
  const [scoresMap, setScoresMap] = useState<Record<string, SubjectScore>>({});

  // Sync initial scores
  React.useEffect(() => {
    const map: Record<string, SubjectScore> = {};
    (students || []).forEach((s) => {
      const rec = (academicRecords || []).find((r) => r.studentId === s.id && r.term === selectedTerm);
      const subScore = rec?.subjects?.find((sub) => sub.subjectName === selectedSubject);
      const singleGrade = (grades || []).find(
        (g) => g.studentId === s.id && (g.subject === selectedSubject || g.subjectName === selectedSubject)
      );

      if (subScore) {
        map[s.id] = { ...subScore };
      } else if (singleGrade) {
        map[s.id] = {
          studentId: s.id,
          subjectName: selectedSubject,
          regularScores: singleGrade.oral?.length ? singleGrade.oral : [8, 8.5],
          midtermScore: singleGrade.midTerm ?? 8,
          finalScore: singleGrade.finalTerm ?? 8,
          averageScore: singleGrade.average ?? 8.1,
        };
      } else {
        map[s.id] = {
          studentId: s.id,
          subjectName: selectedSubject,
          regularScores: [8, 8.5],
          midtermScore: 8,
          finalScore: 8,
          averageScore: 8.1,
        };
      }
    });
    setScoresMap(map);
  }, [students, academicRecords, grades, selectedSubject, selectedTerm]);

  // Calculate subject average: (sum(regular) + midterm*2 + final*3) / (count(regular) + 2 + 3)
  const calcSubjectAvg = (sc: SubjectScore): number => {
    const regSum = sc.regularScores.reduce((a, b) => a + b, 0);
    const regCount = sc.regularScores.length;
    const mid = sc.midtermScore || 0;
    const fin = sc.finalScore || 0;
    const totalWeight = regCount + 2 + 3;
    if (totalWeight === 0) return 0;
    const total = regSum + mid * 2 + fin * 3;
    return parseFloat((total / totalWeight).toFixed(1));
  };

  const handleScoreChange = (
    studentId: string,
    field: 'reg1' | 'reg2' | 'mid' | 'fin',
    val: number
  ) => {
    setScoresMap((prev) => {
      const cur = prev[studentId] || {
        subjectName: selectedSubject,
        regularScores: [0, 0],
        midtermScore: 0,
        finalScore: 0,
        averageScore: 0,
      };
      const reg = [...cur.regularScores];
      let mid = cur.midtermScore;
      let fin = cur.finalScore;

      if (field === 'reg1') reg[0] = val;
      if (field === 'reg2') reg[1] = val;
      if (field === 'mid') mid = val;
      if (field === 'fin') fin = val;

      const updatedSc: SubjectScore = {
        subjectName: selectedSubject,
        regularScores: reg,
        midtermScore: mid,
        finalScore: fin,
        averageScore: 0,
      };
      updatedSc.averageScore = calcSubjectAvg(updatedSc);

      return {
        ...prev,
        [studentId]: updatedSc,
      };
    });
  };

  // Save changes
  const handleSave = () => {
    if (onSaveScores && academicRecords && academicRecords.length > 0) {
      const updated = academicRecords.map((rec) => {
        if (rec.term === selectedTerm) {
          const studentSc = scoresMap[rec.studentId];
          if (studentSc) {
            const others = rec.subjects.filter((s) => s.subjectName !== selectedSubject);
            return {
              ...rec,
              subjects: [...others, studentSc],
            };
          }
        }
        return rec;
      });
      onSaveScores(updated);
    }

    if (onSaveGrade) {
      Object.entries(scoresMap).forEach(([stId, sc]: [string, any]) => {
        onSaveGrade({
          studentId: stId,
          subject: selectedSubject,
          subjectName: selectedSubject,
          oral: sc.regularScores,
          midTerm: sc.midtermScore,
          finalTerm: sc.finalScore,
          average: sc.averageScore,
        });
      });
    }

    onShowToast(`Đã lưu bảng điểm môn ${selectedSubject} (${selectedTerm})!`, 'success');
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  // Overall class averages calculation
  const classScores: number[] = Object.values(scoresMap).map((s: SubjectScore) => s.averageScore || 0);
  const classAvg =
    classScores.length > 0
      ? (classScores.reduce((a, b) => a + b, 0) / classScores.length).toFixed(1)
      : '0.0';

  const excellentCount = classScores.filter((x) => x >= 8.0).length;
  const goodCount = classScores.filter((x) => x >= 6.5 && x < 8.0).length;
  const averageCount = classScores.filter((x) => x >= 5.0 && x < 6.5).length;
  const poorCount = classScores.filter((x) => x < 5.0).length;

  return (
    <div id="academics-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            Sổ Điểm & Học Lực Lớp {settings.className}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quy chế đánh giá theo Thông tư 22/BGDĐT • Tính tự động ĐTBm và ĐTBhk
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="save-academics-btn"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Lưu bảng điểm
          </button>
        </div>
      </div>

      {/* Subject & Term Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">
            CHỌN MÔN HỌC
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-hidden"
          >
            {SUBJECT_LIST.map((sub) => (
              <option key={sub} value={sub}>
                Môn {sub}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">
            HỌC KỲ
          </label>
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setSelectedTerm('HK1')}
              className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
                selectedTerm === 'HK1'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-xs font-bold'
                  : 'text-slate-500'
              }`}
            >
              Học Kỳ 1
            </button>
            <button
              onClick={() => setSelectedTerm('HK2')}
              className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
                selectedTerm === 'HK2'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-xs font-bold'
                  : 'text-slate-500'
              }`}
            >
              Học Kỳ 2
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">
            TÌM HỌC SINH
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tên học sinh hoặc mã số..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Grade Level Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-900/40 text-center">
          <div className="text-[11px] font-bold text-cyan-800 dark:text-cyan-300">
            ĐTB Môn {selectedSubject}
          </div>
          <div className="text-2xl font-black text-cyan-600 font-display mt-0.5">{classAvg}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-center">
          <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
            Tốt (&gt;= 8.0)
          </div>
          <div className="text-2xl font-black text-emerald-600 font-display mt-0.5">
            {excellentCount} HS
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-center">
          <div className="text-[11px] font-bold text-blue-800 dark:text-blue-300">
            Khá (6.5 - 7.9)
          </div>
          <div className="text-2xl font-black text-blue-600 font-display mt-0.5">{goodCount} HS</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-center">
          <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
            Đạt (5.0 - 6.4)
          </div>
          <div className="text-2xl font-black text-amber-600 font-display mt-0.5">
            {averageCount} HS
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-center col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300">
            Chưa đạt (&lt; 5.0)
          </div>
          <div className="text-2xl font-black text-rose-600 font-display mt-0.5">{poorCount} HS</div>
        </div>
      </div>

      {/* Scores Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4 w-10">STT</th>
                <th className="py-3 px-4">Học sinh</th>
                <th className="py-3 px-4">Tổ</th>
                <th className="py-3 px-4 text-center">ĐGTX 1</th>
                <th className="py-3 px-4 text-center">ĐGTX 2</th>
                <th className="py-3 px-4 text-center">ĐGGK (x2)</th>
                <th className="py-3 px-4 text-center">ĐGCK (x3)</th>
                <th className="py-3 px-4 text-center font-bold text-cyan-600">ĐTB Môn</th>
                <th className="py-3 px-4 text-center">Xếp loại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((st, idx) => {
                const sc = scoresMap[st.id] || {
                  subjectName: selectedSubject,
                  regularScores: [8, 8],
                  midtermScore: 8,
                  finalScore: 8,
                  averageScore: 8,
                };

                const rank =
                  sc.averageScore >= 8.0
                    ? 'Tốt'
                    : sc.averageScore >= 6.5
                    ? 'Khá'
                    : sc.averageScore >= 5.0
                    ? 'Đạt'
                    : 'Chưa đạt';

                const rankColor =
                  rank === 'Tốt'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : rank === 'Khá'
                    ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                    : rank === 'Đạt'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';

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
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={sc.regularScores[0] || ''}
                        onChange={(e) =>
                          handleScoreChange(st.id, 'reg1', parseFloat(e.target.value) || 0)
                        }
                        className="w-14 text-center py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={sc.regularScores[1] || ''}
                        onChange={(e) =>
                          handleScoreChange(st.id, 'reg2', parseFloat(e.target.value) || 0)
                        }
                        className="w-14 text-center py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={sc.midtermScore || ''}
                        onChange={(e) =>
                          handleScoreChange(st.id, 'mid', parseFloat(e.target.value) || 0)
                        }
                        className="w-14 text-center py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-amber-600"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={sc.finalScore || ''}
                        onChange={(e) =>
                          handleScoreChange(st.id, 'fin', parseFloat(e.target.value) || 0)
                        }
                        className="w-14 text-center py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-cyan-600"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-black text-cyan-600 dark:text-cyan-400 font-display">
                        {sc.averageScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${rankColor}`}>
                        {rank}
                      </span>
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
