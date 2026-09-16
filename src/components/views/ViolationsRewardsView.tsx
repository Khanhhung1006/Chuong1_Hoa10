import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Plus,
  Trash2,
  Calendar,
  User,
  ShieldAlert,
  Sparkles,
  FileText,
  Search,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, ViolationRecord, RewardRecord, SeverityLevel, ClassSettings, UserAccount } from '../../types';

interface ViolationsRewardsViewProps {
  students: Student[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  initialTab?: 'violations' | 'rewards' | 'goodBadScores';
  onAddViolation: (v: ViolationRecord) => void;
  onDeleteViolation: (id: string) => void;
  onAddReward: (r: RewardRecord) => void;
  onDeleteReward: (id: string) => void;
  onSaveMultipleRewards?: (rewards: RewardRecord[]) => void;
  onSaveMultipleViolations?: (violations: ViolationRecord[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  currentUserGroup?: number;
  settings?: ClassSettings;
  currentUser?: UserAccount;
}

export const ViolationsRewardsView: React.FC<ViolationsRewardsViewProps> = ({
  students,
  violations,
  rewards,
  initialTab = 'violations',
  onAddViolation,
  onDeleteViolation,
  onAddReward,
  onDeleteReward,
  onSaveMultipleRewards,
  onSaveMultipleViolations,
  onShowToast,
  currentUserGroup,
  settings,
  currentUser,
}) => {
  const isTeacher = currentUser?.role === 'GVCN' || currentUser?.role === 'ADMIN';
  const isLocked = !!settings?.isLockedData && !isTeacher;

  const roleUpper = (currentUser?.role || '').toUpperCase();
  const roleTitleLower = (currentUser?.roleTitle || '').toLowerCase();
  const isThuKi = roleUpper === 'TK' || roleTitleLower.includes('thư ký') || roleTitleLower.includes('thư kí');

  const [activeTab, setActiveTab] = useState<'violations' | 'goodBadScores' | 'uniform'>(
    initialTab === 'rewards' ? 'violations' : (initialTab as any)
  );

  React.useEffect(() => {
    if (initialTab) {
      const t = initialTab === 'rewards' ? 'violations' : (initialTab as any);
      if (isThuKi && t === 'uniform') {
        setActiveTab('violations');
      } else {
        setActiveTab(t);
      }
    }
  }, [initialTab, isThuKi]);

  const [search, setSearch] = useState('');
  const [recordFilter, setRecordFilter] = useState<'all' | 'violation' | 'reward'>('all');

  // Daily scores state
  const [scoreDate, setScoreDate] = useState('2026-09-14');
  const [scoreGroup, setScoreGroup] = useState<string>(currentUserGroup ? currentUserGroup.toString() : 'all');
  const [scoresState, setScoresState] = useState<Record<string, { good: number; bad: number; note: string }>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Uniform check state
  const [uniformDate, setUniformDate] = useState('2026-09-14');
  const [uniformGroup, setUniformGroup] = useState<string>(currentUserGroup ? currentUserGroup.toString() : 'all');
  const [uniformState, setUniformState] = useState<Record<string, { status: 'correct' | 'missing' | 'wrong'; note: string }>>({});
  const [isUniformDirty, setIsUniformDirty] = useState(false);

  // Form states for Add Violation
  const [showAddViolationModal, setShowAddViolationModal] = useState(false);
  const [vStudentId, setVStudentId] = useState(students[0]?.id || '');
  const [vDate, setVDate] = useState('2026-09-14');
  const [vContent, setVContent] = useState('');
  const [vSeverity, setVSeverity] = useState<SeverityLevel>('Vừa');
  const [vPenalty, setVPenalty] = useState(5);
  const [vEvidence, setVEvidence] = useState('');
  const [vReporter, setVReporter] = useState('Lớp phó phong trào');

  // Form states for Add Reward
  const [showAddRewardModal, setShowAddRewardModal] = useState(false);
  const [rStudentId, setRStudentId] = useState(students[0]?.id || '');
  const [rDate, setRDate] = useState('2026-09-14');
  const [rContent, setRContent] = useState('');
  const [rBonus, setRBonus] = useState(10);
  const [rType, setRType] = useState<'Học tập' | 'Phong trào Đoàn' | 'Việc tốt' | 'Hội thao' | 'Khác'>('Học tập');

  // Handle severity change auto penalty points
  const handleSeveritySelect = (level: SeverityLevel) => {
    setVSeverity(level);
    if (level === 'Nhẹ') setVPenalty(2);
    else if (level === 'Vừa') setVPenalty(5);
    else if (level === 'Nặng') setVPenalty(10);
    else if (level === 'Rất nặng') setVPenalty(20);
  };

  const handleCreateViolation = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      onShowToast('Dữ liệu đã bị GVCN khóa, không thể chỉnh sửa!', 'error');
      return;
    }
    if (!vContent.trim()) {
      onShowToast('Vui lòng nhập nội dung vi phạm', 'error');
      return;
    }
    const rec: ViolationRecord = {
      id: `vio-${Date.now()}`,
      date: vDate,
      studentId: vStudentId,
      content: vContent,
      severity: vSeverity,
      penaltyPoints: Number(vPenalty),
      evidence: vEvidence,
      reporter: vReporter,
      status: 'Đang theo dõi',
    };
    onAddViolation(rec);
    onShowToast(`Đã ghi nhận vi phạm và trừ ${vPenalty} điểm thi đua!`, 'warning');
    setShowAddViolationModal(false);
    setVContent('');
    setVEvidence('');
  };

  const handleCreateReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      onShowToast('Dữ liệu đã bị GVCN khóa, không thể chỉnh sửa!', 'error');
      return;
    }
    if (!rContent.trim()) {
      onShowToast('Vui lòng nhập nội dung khen thưởng', 'error');
      return;
    }
    const rec: RewardRecord = {
      id: `rew-${Date.now()}`,
      date: rDate,
      studentId: rStudentId,
      content: rContent,
      bonusPoints: Number(rBonus),
      type: rType,
    };
    onAddReward(rec);

    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (_) {}

    onShowToast(`🎉 Tuyên dương thành công! Đã cộng ${rBonus} điểm thi đua!`, 'success');
    setShowAddRewardModal(false);
    setRContent('');
  };

  // Sync daily scores state when date or tab changes, or when records change
  React.useEffect(() => {
    const initialScores: Record<string, { good: number; bad: number; note: string }> = {};
    students.forEach((s) => {
      const goodRec = rewards.find(
        (r) =>
          r.studentId === s.id &&
          r.date === scoreDate &&
          (r.content === 'Điểm tốt (Nhập theo ngày)' || r.content.startsWith('Điểm tốt (Nhập theo ngày)'))
      );
      const badRec = violations.find(
        (v) =>
          v.studentId === s.id &&
          v.date === scoreDate &&
          (v.content === 'Điểm kém (Nhập theo ngày)' || v.content.startsWith('Điểm kém (Nhập theo ngày)'))
      );

      const parseNote = (contentStr: string, prefix: string) => {
        if (!contentStr.startsWith(prefix)) return '';
        const rest = contentStr.slice(prefix.length).trim();
        if (rest.startsWith('-') || rest.startsWith(':') || rest.startsWith('[')) {
          return rest.replace(/^[-:\[\]]+/, '').replace(/\]$/, '').trim();
        }
        return rest;
      };

      const goodNote = goodRec ? parseNote(goodRec.content, 'Điểm tốt (Nhập theo ngày)') : '';
      const badNote = badRec ? parseNote(badRec.content, 'Điểm kém (Nhập theo ngày)') : '';
      const note = goodNote || badNote || '';

      initialScores[s.id] = {
        good: goodRec ? Math.round(goodRec.bonusPoints / 5) : 0,
        bad: badRec ? Math.round(badRec.penaltyPoints / 5) : 0,
        note,
      };
    });
    setScoresState(initialScores);
    setIsDirty(false);
  }, [students, scoreDate, activeTab, rewards, violations]);

  // Sync uniform state when date or tab changes
  React.useEffect(() => {
    const initialUniform: Record<string, { status: 'correct' | 'missing' | 'wrong'; note: string }> = {};
    students.forEach((s) => {
      const uRec = violations.find(
        (v) =>
          v.studentId === s.id &&
          v.date === uniformDate &&
          v.content.startsWith('[Đồng phục]')
      );

      let status: 'correct' | 'missing' | 'wrong' = 'correct';
      let note = '';

      if (uRec) {
        if (uRec.content.includes('Thiếu') || uRec.penaltyPoints === 2) {
          status = 'missing';
        } else {
          status = 'wrong';
        }
        const parts = uRec.content.split(' - ');
        if (parts.length > 1) {
          note = parts.slice(1).join(' - ');
        }
      }

      initialUniform[s.id] = { status, note };
    });
    setUniformState(initialUniform);
    setIsUniformDirty(false);
  }, [students, uniformDate, activeTab, violations]);

  const handleUniformStatusChange = (studentId: string, status: 'correct' | 'missing' | 'wrong') => {
    if (isLocked) return;
    setUniformState((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { note: '' }),
        status,
      },
    }));
    setIsUniformDirty(true);
  };

  const handleUniformNoteChange = (studentId: string, noteVal: string) => {
    if (isLocked) return;
    setUniformState((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'correct' }),
        note: noteVal,
      },
    }));
    setIsUniformDirty(true);
  };

  const handleSaveUniformChecks = () => {
    if (isLocked) {
      onShowToast('Dữ liệu đã bị GVCN khóa, không thể chỉnh sửa!', 'error');
      return;
    }

    const otherViolations = violations.filter((v) => {
      const studentObj = studentMap.get(v.studentId);
      const isUniformRec = v.date === uniformDate && v.content.startsWith('[Đồng phục]');
      if (!isUniformRec) return true;
      if (currentUserGroup && studentObj && studentObj.group !== currentUserGroup) {
        return true;
      }
      return false;
    });

    const targetStudents = currentUserGroup
      ? students.filter((s) => s.group === currentUserGroup)
      : students;

    const newUniformViolations = targetStudents
      .map((s) => {
        const item = uniformState[s.id];
        if (!item || item.status === 'correct') return null;

        const isMissing = item.status === 'missing';
        const penalty = isMissing ? 2 : 5;
        const prefix = isMissing ? '[Đồng phục] Thiếu phụ kiện / Khăn quàng' : '[Đồng phục] Sai đồng phục / Không đúng quy định';
        const contentStr = item.note.trim() ? `${prefix} - ${item.note.trim()}` : prefix;

        const rec: ViolationRecord = {
          id: `vio-uniform-${s.id}-${uniformDate}`,
          studentId: s.id,
          date: uniformDate,
          content: contentStr,
          severity: isMissing ? 'Nhẹ' : 'Vừa',
          penaltyPoints: penalty,
          status: 'Đã xử lý',
          reporter: currentUserGroup ? `Tổ trưởng Tổ ${currentUserGroup}` : 'Lớp cờ đỏ / GVCN',
        };
        return rec;
      })
      .filter(Boolean) as ViolationRecord[];

    const finalViolations = [...otherViolations, ...newUniformViolations];

    if (onSaveMultipleViolations) {
      onSaveMultipleViolations(finalViolations);
      setIsUniformDirty(false);
      onShowToast(`Đã lưu kiểm tra đồng phục ngày ${uniformDate} thành công!`, 'success');
    }
  };

  const handleIncrementGood = (studentId: string) => {
    if (isLocked) return;
    setScoresState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        good: (prev[studentId]?.good || 0) + 1,
      },
    }));
    setIsDirty(true);
  };

  const handleDecrementGood = (studentId: string) => {
    if (isLocked) return;
    setScoresState((prev) => {
      const current = prev[studentId]?.good || 0;
      if (current === 0) return prev;
      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          good: current - 1,
        },
      };
    });
    setIsDirty(true);
  };

  const handleIncrementBad = (studentId: string) => {
    if (isLocked) return;
    setScoresState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        bad: (prev[studentId]?.bad || 0) + 1,
      },
    }));
    setIsDirty(true);
  };

  const handleDecrementBad = (studentId: string) => {
    if (isLocked) return;
    setScoresState((prev) => {
      const current = prev[studentId]?.bad || 0;
      if (current === 0) return prev;
      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          bad: current - 1,
        },
      };
    });
    setIsDirty(true);
  };

  const handleGoodChange = (studentId: string, val: number) => {
    if (isLocked) return;
    const value = Math.max(0, isNaN(val) ? 0 : val);
    setScoresState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        good: value,
      },
    }));
    setIsDirty(true);
  };

  const handleBadChange = (studentId: string, val: number) => {
    if (isLocked) return;
    const value = Math.max(0, isNaN(val) ? 0 : val);
    setScoresState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        bad: value,
      },
    }));
    setIsDirty(true);
  };

  const handleNoteChange = (studentId: string, noteVal: string) => {
    if (isLocked) return;
    setScoresState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note: noteVal,
      },
    }));
    setIsDirty(true);
  };

  const handleSaveGoodBadScores = () => {
    if (isLocked) {
      onShowToast('Dữ liệu đã bị GVCN khóa, không thể chỉnh sửa!', 'error');
      return;
    }
    const otherRewards = rewards.filter((r) => {
      const studentObj = studentMap.get(r.studentId);
      const isTargetRecord = r.date === scoreDate && (r.content === 'Điểm tốt (Nhập theo ngày)' || r.content.startsWith('Điểm tốt (Nhập theo ngày)'));
      if (!isTargetRecord) return true;
      if (currentUserGroup && studentObj && studentObj.group !== currentUserGroup) {
        return true;
      }
      return false;
    });

    const targetStudents = currentUserGroup
      ? students.filter((s) => s.group === currentUserGroup)
      : students;

    const newGoodScores = targetStudents
      .map((s) => {
        const val = scoresState[s.id]?.good || 0;
        const studentNote = scoresState[s.id]?.note?.trim() || '';
        if (val > 0 || studentNote) {
          const contentStr = studentNote
            ? `Điểm tốt (Nhập theo ngày) - ${studentNote}`
            : 'Điểm tốt (Nhập theo ngày)';
          const rec: RewardRecord = {
            id: `rew-good-score-${s.id}-${scoreDate}`,
            studentId: s.id,
            date: scoreDate,
            content: contentStr,
            type: 'Học tập',
            bonusPoints: val * 5,
          };
          return rec;
        }
        return null;
      })
      .filter(Boolean) as RewardRecord[];

    const finalRewards = [...otherRewards, ...newGoodScores];

    const otherViolations = violations.filter((v) => {
      const studentObj = studentMap.get(v.studentId);
      const isTargetRecord = v.date === scoreDate && (v.content === 'Điểm kém (Nhập theo ngày)' || v.content.startsWith('Điểm kém (Nhập theo ngày)'));
      if (!isTargetRecord) return true;
      if (currentUserGroup && studentObj && studentObj.group !== currentUserGroup) {
        return true;
      }
      return false;
    });

    const newBadScores = targetStudents
      .map((s) => {
        const val = scoresState[s.id]?.bad || 0;
        const studentNote = scoresState[s.id]?.note?.trim() || '';
        if (val > 0 || studentNote) {
          const contentStr = studentNote
            ? `Điểm kém (Nhập theo ngày) - ${studentNote}`
            : 'Điểm kém (Nhập theo ngày)';
          const rec: ViolationRecord = {
            id: `vio-bad-score-${s.id}-${scoreDate}`,
            studentId: s.id,
            date: scoreDate,
            content: contentStr,
            severity: 'Nhẹ',
            penaltyPoints: val * 5,
            status: 'Đã xử lý',
            reporter: currentUserGroup ? `Tổ trưởng Tổ ${currentUserGroup}` : 'Giáo viên Chủ nhiệm',
          };
          return rec;
        }
        return null;
      })
      .filter(Boolean) as ViolationRecord[];

    const finalViolations = [...otherViolations, ...newBadScores];

    if (onSaveMultipleRewards && onSaveMultipleViolations) {
      onSaveMultipleRewards(finalRewards);
      onSaveMultipleViolations(finalViolations);
      setIsDirty(false);
      onShowToast(`Đã lưu điểm tốt, điểm kém cho ngày ${scoreDate}!`, 'success');
    }
  };

  const studentMap = new Map<string, Student>(students.map((s) => [s.id, s]));

  const filteredStudentsForScores = students.filter((s) => {
    const matchSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) || 
                        s.code.toLowerCase().includes(search.toLowerCase());
    const matchGroup = currentUserGroup 
      ? s.group === currentUserGroup
      : (scoreGroup === 'all' || s.group.toString() === scoreGroup);
    return matchSearch && matchGroup;
  });

  const filteredStudentsForUniform = students.filter((s) => {
    const matchSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) || 
                        s.code.toLowerCase().includes(search.toLowerCase());
    const matchGroup = currentUserGroup 
      ? s.group === currentUserGroup
      : (uniformGroup === 'all' || s.group.toString() === uniformGroup);
    return matchSearch && matchGroup;
  });

  const combinedRecords = React.useMemo(() => {
    const vList = (violations || []).map((v) => ({ ...v, typeOfRecord: 'violation' as const }));
    const rList = (rewards || []).map((r) => ({ ...r, typeOfRecord: 'reward' as const }));
    const list = [...vList, ...rList];
    const seen = new Set<string>();
    const unique = list.filter((item) => {
      if (!item || !item.id) return false;
      const key = `${item.typeOfRecord}-${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return unique.sort((a, b) => {
      if (b.date !== a.date) {
        return b.date.localeCompare(a.date);
      }
      return b.id.localeCompare(a.id);
    });
  }, [violations, rewards]);

  const selectableStudents = React.useMemo(() => {
    return currentUserGroup ? students.filter((s) => s.group === currentUserGroup) : students;
  }, [students, currentUserGroup]);

  const filteredCombinedRecords = combinedRecords.filter((rec) => {
    const st = studentMap.get(rec.studentId);
    if (currentUserGroup && st && st.group !== currentUserGroup) {
      return false;
    }
    const reporter = 'reporter' in rec ? rec.reporter : '';
    const type = 'type' in rec ? rec.type : '';
    const text = `${st?.fullName || ''} ${rec.content} ${reporter} ${type}`.toLowerCase();
    const matchSearch = text.includes(search.toLowerCase());
    const matchFilter = recordFilter === 'all' || rec.typeOfRecord === recordFilter;
    return matchSearch && matchFilter;
  });

  return (
    <div id="discipline-view" className="space-y-6">
      {isLocked && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 p-4 rounded-3xl flex items-start gap-3 shadow-xs">
          <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300">
            <Lock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-red-950 dark:text-red-200">
              Dữ liệu lớp học đã bị GVCN khóa
            </h4>
            <p className="text-[11px] text-red-700/80 dark:text-red-300/80 mt-0.5 leading-relaxed">
              Thầy/Cô chủ nhiệm đã khóa dữ liệu nề nếp, vi phạm và khen thưởng. Hiện tại, Cán sự lớp và học sinh chỉ có quyền xem danh sách và báo cáo, toàn bộ tính năng chỉnh sửa đã bị tạm khóa để bảo đảm tính chính xác của dữ liệu.
            </p>
          </div>
        </div>
      )}

      {/* Top Banner & Tab Switcher */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            Nề Nếp, Vi Phạm & Khen Thưởng
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tự động đồng bộ cộng/trừ điểm thi đua cá nhân và tổ
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          {/* Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs font-bold w-full sm:w-auto">
            <button
              id="tab-violations-btn"
              onClick={() => setActiveTab('violations')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                activeTab === 'violations'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Nề nếp ({violations.length + rewards.length})</span>
            </button>
            <button
              id="tab-good-bad-scores-btn"
              onClick={() => setActiveTab('goodBadScores')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                activeTab === 'goodBadScores'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'goodBadScores' ? 'text-white' : 'text-amber-500'}`} />
              <span className="truncate">Điểm tốt / kém</span>
            </button>
            {!isThuKi && (
              <button
                id="tab-uniform-btn"
                onClick={() => setActiveTab('uniform')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                  activeTab === 'uniform'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Kiểm tra đồng phục</span>
              </button>
            )}
          </div>

          {/* Action button */}
          {activeTab === 'violations' ? (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                id="open-add-violation-btn"
                onClick={() => {
                  if (isLocked) {
                    onShowToast('Dữ liệu đã bị GVCN khóa, không thể chỉnh sửa!', 'error');
                    return;
                  }
                  setShowAddViolationModal(true);
                }}
                disabled={isLocked}
                className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-white text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  isLocked
                    ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-450 dark:text-slate-600 cursor-not-allowed opacity-50'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 cursor-pointer'
                }`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                Ghi vi phạm
              </button>
              <button
                id="open-add-reward-btn"
                onClick={() => {
                  if (isLocked) {
                    onShowToast('Dữ liệu đã bị GVCN khóa, không thể chỉnh sửa!', 'error');
                    return;
                  }
                  setShowAddRewardModal(true);
                }}
                disabled={isLocked}
                className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-white text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  isLocked
                    ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-450 dark:text-slate-600 cursor-not-allowed opacity-50'
                    : 'bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 cursor-pointer'
                }`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                Tuyên dương
              </button>
            </div>
          ) : activeTab === 'goodBadScores' ? (
            <button
              id="save-good-bad-scores-btn"
              onClick={handleSaveGoodBadScores}
              disabled={isLocked || !isDirty}
              className={`w-full sm:w-auto px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isLocked
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                  : isDirty
                    ? 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/20'
                    : 'bg-slate-400 dark:bg-slate-700 opacity-60 cursor-not-allowed shadow-none'
              }`}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Sparkles className="w-4 h-4 shrink-0" />}
              Lưu điểm số
            </button>
          ) : (
            <button
              id="save-uniform-checks-btn"
              onClick={handleSaveUniformChecks}
              disabled={isLocked || !isUniformDirty}
              className={`w-full sm:w-auto px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isLocked
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                  : isUniformDirty
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : 'bg-slate-400 dark:bg-slate-700 opacity-60 cursor-not-allowed shadow-none'
              }`}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              Lưu kiểm tra đồng phục
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="discipline-search-input"
            type="text"
            placeholder="Tìm theo tên học sinh, nội dung, người báo cáo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 outline-hidden focus:border-cyan-500 shadow-xs"
          />
        </div>

        {activeTab === 'violations' && (
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold self-start md:self-auto shadow-2xs">
            <button
              onClick={() => setRecordFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                recordFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-700'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Tất cả ({violations.length + rewards.length})
            </button>
            <button
              onClick={() => setRecordFilter('violation')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                recordFilter === 'violation'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              Vi phạm ({violations.length})
            </button>
            <button
              onClick={() => setRecordFilter('reward')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                recordFilter === 'reward'
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Award className="w-3 h-3 text-amber-500" />
              Khen thưởng ({rewards.length})
            </button>
          </div>
        )}
      </div>

      {/* Content: COMBINED RECORDS LIST */}
      {activeTab === 'violations' && (
        <div className="space-y-3">
          {filteredCombinedRecords.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-slate-500 text-sm font-semibold">
                Không tìm thấy ghi nhận nề nếp hoặc khen thưởng nào phù hợp.
              </p>
            </div>
          ) : (
            filteredCombinedRecords.map((rec) => {
              const st = studentMap.get(rec.studentId);
              
              if (rec.typeOfRecord === 'violation') {
                const v = rec;
                const severityColor =
                  v.severity === 'Rất nặng'
                    ? 'bg-rose-700 text-white'
                    : v.severity === 'Nặng'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : v.severity === 'Vừa'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

                return (
                  <div
                    key={v.id}
                    id={`violation-item-${v.id}`}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {st?.fullName || 'Học sinh'}
                          </span>
                          <span className="text-[11px] text-slate-400">Tổ {st?.group}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                            Vi phạm
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${severityColor}`}>
                            {v.severity}
                          </span>
                          <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                            -{v.penaltyPoints} điểm thi đua
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {v.content}
                        </p>
                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3">
                          <span>Ngày: <strong>{v.date}</strong></span>
                          <span>Người báo: <strong>{v.reporter}</strong></span>
                          {v.evidence && <span>Minh chứng: <em>{v.evidence}</em></span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (isLocked) {
                            onShowToast('Dữ liệu đã bị GVCN khóa, không thể chỉnh sửa!', 'error');
                            return;
                          }
                          onDeleteViolation(v.id);
                        }}
                        disabled={isLocked}
                        className={`p-2 rounded-xl transition-colors ${
                          isLocked
                            ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer'
                        }`}
                        title={isLocked ? "Đã khóa" : "Xóa bản ghi"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              } else {
                const r = rec;
                return (
                  <div
                    key={r.id}
                    id={`reward-item-${r.id}`}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {st?.fullName || 'Học sinh'}
                          </span>
                          <span className="text-[11px] text-slate-400">Tổ {st?.group}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                            Khen thưởng
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            {r.type}
                          </span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            +{r.bonusPoints} điểm thi đua
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {r.content}
                        </p>
                        <div className="text-[11px] text-slate-400">
                          Ngày ghi nhận: <strong>{r.date}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (isLocked) {
                            onShowToast('Dữ liệu đã bị GVCN khóa, không thể chỉnh sửa!', 'error');
                            return;
                          }
                          onDeleteReward(r.id);
                        }}
                        disabled={isLocked}
                        className={`p-2 rounded-xl transition-colors ${
                          isLocked
                            ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer'
                        }`}
                        title={isLocked ? "Đã khóa" : "Xóa bản ghi"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>
      )}

      {activeTab === 'goodBadScores' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            {/* Date Picker */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Calendar className="w-4 h-4 text-cyan-600" />
              <input
                id="score-date-input"
                type="date"
                value={scoreDate}
                onChange={(e) => setScoreDate(e.target.value)}
                className="text-xs font-bold bg-transparent text-slate-800 dark:text-slate-100 outline-hidden w-full cursor-pointer"
              />
            </div>

            {/* Group Filter */}
            {!currentUserGroup ? (
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setScoreGroup('all')}
                  className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
                    scoreGroup === 'all'
                      ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tất cả
                </button>
                {[1, 2, 3, 4].map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setScoreGroup(g.toString())}
                    className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
                      scoreGroup === g.toString()
                        ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tổ {g}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-500 font-medium">Giám sát:</span>
                <span className="px-2.5 py-1 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 font-bold">
                  Tổ {currentUserGroup} (Tổ trưởng)
                </span>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Nhập Điểm Tốt / Điểm Kém Theo Ngày (Tốt: +5đ, Kém: -5đ)
              </div>
              {isDirty && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold animate-pulse">
                  Có thay đổi chưa lưu
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Học sinh</th>
                    <th className="py-3 px-4 w-28 text-center">Tổ</th>
                    <th className="py-3 px-4 text-center w-48">Số Điểm Tốt (+5đ)</th>
                    <th className="py-3 px-4 text-center w-48">Số Điểm Kém (-5đ)</th>
                    <th className="py-3 px-4 text-center w-64">Ghi chú (Môn học)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudentsForScores.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500 font-medium">
                        Không tìm thấy học sinh nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredStudentsForScores.map((s, idx) => {
                      const stScores = scoresState[s.id] || { good: 0, bad: 0, note: '' };

                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-cyan-50/10 dark:hover:bg-cyan-950/5 transition-colors"
                        >
                          <td className="py-3 px-4 text-slate-400 font-medium text-center">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {s.fullName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">{s.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-center">Tổ {s.group}</td>
                          
                          {/* Good Points Counter */}
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDecrementGood(s.id)}
                                disabled={stScores.good === 0}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-center transition-all"
                              >
                                -
                              </button>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={stScores.good}
                                onChange={(e) => handleGoodChange(s.id, parseInt(e.target.value, 10))}
                                className="w-10 text-center font-bold text-xs bg-slate-50 dark:bg-slate-800/50 text-emerald-600 border border-slate-200 dark:border-slate-700 rounded-md py-1"
                              />
                              <button
                                type="button"
                                onClick={() => handleIncrementGood(s.id)}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold text-center transition-all"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          {/* Bad Points Counter */}
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDecrementBad(s.id)}
                                disabled={stScores.bad === 0}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-center transition-all"
                              >
                                -
                              </button>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={stScores.bad}
                                onChange={(e) => handleBadChange(s.id, parseInt(e.target.value, 10))}
                                className="w-10 text-center font-bold text-xs bg-slate-50 dark:bg-slate-800/50 text-rose-600 border border-slate-200 dark:border-slate-700 rounded-md py-1"
                              />
                              <button
                                type="button"
                                onClick={() => handleIncrementBad(s.id)}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-center transition-all"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          {/* Note / Subject input */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="VD: Toán, Văn..."
                              disabled={isLocked}
                              value={stScores.note || ''}
                              onChange={(e) => handleNoteChange(s.id, e.target.value)}
                              className="w-full text-xs bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {filteredStudentsForScores.length > 0 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveGoodBadScores}
                  disabled={!isDirty}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                    isDirty
                      ? 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Lưu điểm tốt & điểm kém của lớp
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!isThuKi && activeTab === 'uniform' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            {/* Date Picker */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <input
                id="uniform-date-input"
                type="date"
                value={uniformDate}
                onChange={(e) => setUniformDate(e.target.value)}
                className="text-xs font-bold bg-transparent text-slate-800 dark:text-slate-100 outline-hidden w-full cursor-pointer"
              />
            </div>

            {/* Group Filter */}
            {!currentUserGroup ? (
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setUniformGroup('all')}
                  className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
                    uniformGroup === 'all'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tất cả
                </button>
                {[1, 2, 3, 4].map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setUniformGroup(g.toString())}
                    className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
                      uniformGroup === g.toString()
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tổ {g}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-500 font-medium">Giám sát:</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                  Tổ {currentUserGroup} (Tổ trưởng)
                </span>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                Kiểm Tra Đồng Phục Hằng Ngày (Đúng: 0đ, Thiếu phụ kiện: -2đ, Sai đồng phục: -5đ)
              </div>
              {isUniformDirty && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold animate-pulse">
                  Có thay đổi chưa lưu
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Học sinh</th>
                    <th className="py-3 px-4 w-28 text-center">Tổ</th>
                    <th className="py-3 px-4 text-center w-72">Trạng thái đồng phục</th>
                    <th className="py-3 px-4 text-center w-64">Ghi chú cụ thể</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudentsForUniform.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-500 font-medium">
                        Không tìm thấy học sinh nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredStudentsForUniform.map((s, idx) => {
                      const stUniform = uniformState[s.id] || { status: 'correct', note: '' };

                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-emerald-50/10 dark:hover:bg-emerald-950/5 transition-colors"
                        >
                          <td className="py-3 px-4 text-slate-400 font-medium text-center">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {s.fullName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">{s.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-center">Tổ {s.group}</td>
                          
                          {/* Uniform Status Options */}
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => handleUniformStatusChange(s.id, 'correct')}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                                  stUniform.status === 'correct'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50'
                                }`}
                              >
                                ✓ Đúng đồng phục
                              </button>
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => handleUniformStatusChange(s.id, 'missing')}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                                  stUniform.status === 'missing'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50'
                                }`}
                              >
                                ⚠ Thiếu phụ kiện (-2đ)
                              </button>
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => handleUniformStatusChange(s.id, 'wrong')}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                                  stUniform.status === 'wrong'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50'
                                }`}
                              >
                                ✕ Sai quy định (-5đ)
                              </button>
                            </div>
                          </td>

                          {/* Uniform Note */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="VD: Thiếu khăn quàng, quên áo sơ mi..."
                              disabled={isLocked}
                              value={stUniform.note || ''}
                              onChange={(e) => handleUniformNoteChange(s.id, e.target.value)}
                              className="w-full text-xs bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {filteredStudentsForUniform.length > 0 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveUniformChecks}
                  disabled={!isUniformDirty}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                    isUniformDirty
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 cursor-not-allowed shadow-none'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Lưu kết quả kiểm tra đồng phục
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Thêm Vi Phạm */}
      {showAddViolationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Ghi Nhận Vi Phạm Kỷ Luật
            </h3>
            <form onSubmit={handleCreateViolation} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn học sinh vi phạm
                </label>
                <select
                  value={vStudentId}
                  onChange={(e) => setVStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {selectableStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.code} - Tổ {s.group})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày vi phạm
                  </label>
                  <input
                    type="date"
                    value={vDate}
                    onChange={(e) => setVDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mức độ vi phạm
                  </label>
                  <select
                    value={vSeverity}
                    onChange={(e) => handleSeveritySelect(e.target.value as SeverityLevel)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Nhẹ">Nhẹ (Trừ 2đ)</option>
                    <option value="Vừa">Vừa (Trừ 5đ)</option>
                    <option value="Nặng">Nặng (Trừ 10đ)</option>
                    <option value="Rất nặng">Rất nặng (Trừ 20đ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung chi tiết vi phạm
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Bỏ tiết 3 môn Toán, đi muộn 15 phút tiết 1, không đeo thẻ học sinh..."
                  value={vContent}
                  onChange={(e) => setVContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Người phát hiện / Báo cáo
                  </label>
                  <input
                    type="text"
                    value={vReporter}
                    onChange={(e) => setVReporter(e.target.value)}
                    placeholder="Cờ đỏ, Lớp phó, GVBM..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Điểm trừ thi đua
                  </label>
                  <input
                    type="number"
                    value={vPenalty}
                    onChange={(e) => setVPenalty(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Minh chứng (nếu có)
                </label>
                <input
                  type="text"
                  placeholder="Ghi nhận sổ đầu bài, ảnh chụp thẻ, biên bản cờ đỏ..."
                  value={vEvidence}
                  onChange={(e) => setVEvidence(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddViolationModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  Lưu vi phạm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Thêm Khen Thưởng */}
      {showAddRewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Tuyên Dương & Khen Thưởng Học Sinh
            </h3>
            <form onSubmit={handleCreateReward} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn học sinh
                </label>
                <select
                  value={rStudentId}
                  onChange={(e) => setRStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {selectableStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.code} - Tổ {s.group})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày tuyên dương
                  </label>
                  <input
                    type="date"
                    value={rDate}
                    onChange={(e) => setRDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lĩnh vực
                  </label>
                  <select
                    value={rType}
                    onChange={(e) => setRType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Học tập">Học tập (Điểm cao, giải HSG)</option>
                    <option value="Phong trào Đoàn">Phong trào Đoàn & Văn nghệ</option>
                    <option value="Việc tốt">Việc tốt (Nhặt được của rơi, giúp bạn)</option>
                    <option value="Hội thao">Hội thao & Thể dục thể thao</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung thành tích
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Đạt giải Nhất học sinh giỏi cấp trường; Hăng hái phát biểu xây dựng bài..."
                  value={rContent}
                  onChange={(e) => setRContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Điểm thưởng thi đua (+)
                </label>
                <input
                  type="number"
                  value={rBonus}
                  onChange={(e) => setRBonus(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRewardModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  Lưu & Tuyên dương
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
