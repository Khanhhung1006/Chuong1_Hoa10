import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { questions, Question } from './data/questions';
import { audio } from './lib/audio';
import { Play, ChevronLeft, ChevronRight, Award, CheckCircle2, XCircle, RotateCcw, Home, BrainCircuit, Layers, Settings, Volume2, VolumeX } from 'lucide-react';

type ScreenState = 'home' | 'quiz' | 'result' | 'flashcards' | 'settings';

interface AppStats {
  totalQuestions: number;
  correctAnswers: number;
  quizzesCompleted: number;
  lastScore: number | null;
}

const INITIAL_STATS: AppStats = {
  totalQuestions: 0,
  correctAnswers: 0,
  quizzesCompleted: 0,
  lastScore: null,
};

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('home');
  const [stats, setStats] = useState<AppStats>(INITIAL_STATS);
  
  // App Settings
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [quizLength, setQuizLength] = useState<number>(10);

  // Quiz State
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);

  // Flashcard State
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);

  // Load stats & settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('chemistry_stats');
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (e) {}
    }

    const soundPref = localStorage.getItem('chemistry_sound');
    if (soundPref !== null) {
      const enabled = JSON.parse(soundPref);
      setIsSoundEnabled(enabled);
      audio.setMuted(!enabled);
    }
    
    const quizLenPref = localStorage.getItem('chemistry_quiz_len');
    if (quizLenPref) {
      setQuizLength(JSON.parse(quizLenPref));
    }
  }, []);

  const updateStats = (newStats: Partial<AppStats>) => {
    setStats(prev => {
      const updated = { ...prev, ...newStats };
      localStorage.setItem('chemistry_stats', JSON.stringify(updated));
      return updated;
    });
  };

  const handleInteraction = () => {
    audio.unlock();
  };

  const toggleSound = () => {
    const newVal = !isSoundEnabled;
    setIsSoundEnabled(newVal);
    audio.setMuted(!newVal);
    localStorage.setItem('chemistry_sound', JSON.stringify(newVal));
    if (newVal) {
      audio.unlock();
      audio.playClick();
    }
  };

  const updateQuizLength = (num: number) => {
    setQuizLength(num);
    localStorage.setItem('chemistry_quiz_len', JSON.stringify(num));
    handleInteraction();
    audio.playClick();
  };

  // --- Flashcards Logic ---
  const startFlashcards = () => {
    handleInteraction();
    audio.playClick();
    setFcIndex(0);
    setFcFlipped(false);
    setScreen('flashcards');
  };

  const handlePrevCard = () => {
    handleInteraction();
    audio.playClick();
    if (fcFlipped) {
      setFcFlipped(false);
      setTimeout(() => setFcIndex(i => Math.max(0, i - 1)), 250);
    } else {
      setFcIndex(i => Math.max(0, i - 1));
    }
  };

  const handleNextCard = () => {
    handleInteraction();
    audio.playClick();
    if (fcFlipped) {
      setFcFlipped(false);
      setTimeout(() => setFcIndex(i => Math.min(questions.length - 1, i + 1)), 250);
    } else {
      setFcIndex(i => Math.min(questions.length - 1, i + 1));
    }
  };

  // --- Quiz Logic ---
  const startQuiz = () => {
    handleInteraction();
    audio.playClick();
    
    // Pick N random questions and shuffle options
    const limit = Math.min(quizLength, questions.length);
    const shuffled = [...questions].sort(() => 0.5 - Math.random()).slice(0, limit);
    const preparedQuestions = shuffled.map(q => ({
      ...q,
      options: [...q.options].sort(() => 0.5 - Math.random())
    }));
    
    setQuizQuestions(preparedQuestions);
    setCurrentQuizIndex(0);
    setScore(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setScreen('quiz');
  };

  const handleOptionSelect = (option: string) => {
    if (hasAnswered) return;
    handleInteraction();
    audio.playClick();
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || hasAnswered) return;
    
    const currentQ = quizQuestions[currentQuizIndex];
    const isCorrect = selectedOption === currentQ.answer;
    
    if (isCorrect) {
      audio.playSuccess();
      setScore(s => s + 1);
    } else {
      audio.playError();
    }
    
    setHasAnswered(true);
  };

  const handleNextQuestion = () => {
    handleInteraction();
    audio.playClick();
    
    const currentQ = quizQuestions[currentQuizIndex];
    const isCorrect = selectedOption === currentQ.answer;

    // Update stats cumulatively
    const newStats = {
      totalQuestions: stats.totalQuestions + 1,
      correctAnswers: stats.correctAnswers + (isCorrect ? 1 : 0),
    };

    if (currentQuizIndex < quizQuestions.length - 1) {
      updateStats(newStats);
      setCurrentQuizIndex(i => i + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      // Finish quiz
      updateStats({
        ...newStats,
        quizzesCompleted: stats.quizzesCompleted + 1,
        lastScore: score + (isCorrect ? 1 : 0)
      });
      setScreen('result');
    }
  };

  const returnHome = () => {
    handleInteraction();
    audio.playClick();
    setScreen('home');
  };

  const accuracy = stats.totalQuestions > 0 
    ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) 
    : 0;

  return (
    <div className="w-full max-w-md mx-auto min-h-[100dvh] flex flex-col bg-stone-50 relative safe-pt safe-pb shadow-2xl shadow-stone-200/50 text-stone-800">
      <AnimatePresence mode="wait">
        {screen === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col p-6 space-y-8 relative"
          >
            <button 
              onClick={() => { handleInteraction(); audio.playClick(); setScreen('settings'); }}
              className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-600 active:bg-stone-100 rounded-full transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
            <div className="text-center mt-8 mb-2 space-y-4">
              <div className="w-20 h-20 bg-cyan-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-cyan-600/30">
                <BrainCircuit className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-stone-800">
                Hóa 10 - Thầy Quân
              </h1>
              <p className="text-stone-500">Ôn tập chương 1</p>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200 flex flex-col gap-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Tiến độ học tập</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                  <p className="text-3xl font-black text-stone-800">{stats.quizzesCompleted}</p>
                  <p className="text-xs font-semibold text-stone-500 mt-1">BÀI ĐÃ LÀM</p>
                </div>
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                  <p className="text-3xl font-black text-cyan-600">{accuracy}%</p>
                  <p className="text-xs font-semibold text-stone-500 mt-1">ĐỘ CHÍNH XÁC</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-auto pb-4">
              {/* Thẻ học tập */}
              <button 
                onClick={startFlashcards} 
                className="no-select w-full bg-amber-100 text-amber-800 hover:bg-amber-200 active:bg-amber-300 font-bold text-lg py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                <Layers className="w-6 h-6" />
                Thẻ Học Tập (Flashcards)
              </button>

              {/* Trắc nghiệm */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-stone-700 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500"/>
                    Trắc Nghiệm ({quizLength === 15 ? 'Tất cả' : quizLength} câu)
                  </h3>
                </div>
                <button 
                  onClick={startQuiz} 
                  className="no-select w-full bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-cyan-600/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <Play className="w-6 h-6 fill-current" />
                  Bắt Đầu Thi
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'flashcards' && (
          <motion.div 
            key="flashcards"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between bg-stone-50 sticky top-0 z-10">
              <button 
                onClick={returnHome}
                className="no-select w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-stone-200 text-stone-600 active:bg-stone-100 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="font-bold text-stone-400">
                Thẻ {fcIndex + 1} / {questions.length}
              </div>
              <div className="w-10"></div>
            </div>

            {/* Card Container */}
            <div className="flex-1 px-6 py-8 flex flex-col perspective">
              <motion.div
                className="w-full flex-1 relative preserve-3d cursor-pointer"
                animate={{ rotateY: fcFlipped ? 180 : 0 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
                onClick={() => {
                  handleInteraction();
                  audio.playClick();
                  setFcFlipped(!fcFlipped);
                }}
              >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-white rounded-3xl p-8 shadow-xl border border-stone-200 flex flex-col items-center justify-center text-center gap-6">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-2">
                     <span className="text-2xl font-black text-amber-500">Q</span>
                  </div>
                  <h2 className="text-2xl font-bold text-stone-800 leading-snug">
                    {questions[fcIndex].question}
                  </h2>
                  <p className="text-stone-400 text-sm mt-auto font-medium">Chạm để xem đáp án</p>
                </div>
                
                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-cyan-600 rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center text-center gap-6 text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2">
                     <span className="text-2xl font-black text-white">A</span>
                  </div>
                  <h2 className="text-2xl font-bold leading-snug">
                    {questions[fcIndex].answer}
                  </h2>
                  <p className="text-cyan-100 text-sm mt-auto font-medium">Chạm để lật lại</p>
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <div className="p-6 pb-safe flex items-center justify-between gap-4">
              <button
                onClick={handlePrevCard}
                disabled={fcIndex === 0}
                className="no-select flex-1 bg-white border-2 border-stone-200 text-stone-700 font-bold text-lg py-4 rounded-2xl active:bg-stone-50 transition-colors disabled:opacity-50 disabled:active:bg-white flex justify-center items-center"
              >
                <ChevronLeft className="w-6 h-6 mr-1" /> Trước
              </button>
              <button
                onClick={handleNextCard}
                disabled={fcIndex === questions.length - 1}
                className="no-select flex-1 bg-amber-100 text-amber-800 font-bold text-lg py-4 rounded-2xl active:bg-amber-200 transition-colors disabled:opacity-50 flex justify-center items-center"
              >
                Tiếp <ChevronRight className="w-6 h-6 ml-1" />
              </button>
            </div>
          </motion.div>
        )}

        {screen === 'quiz' && quizQuestions.length > 0 && (
          <motion.div 
            key="quiz"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-stone-200 bg-white sticky top-0 z-10">
              <button 
                onClick={returnHome}
                className="no-select w-10 h-10 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 active:bg-stone-200 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="font-bold text-stone-400">
                Câu {currentQuizIndex + 1} / {quizQuestions.length}
              </div>
              <div className="w-10"></div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-stone-100">
              <motion.div 
                className="h-full bg-cyan-600"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Question */}
            <div className="flex-1 p-6 flex flex-col gap-8 overflow-y-auto">
              <h2 className="text-2xl font-bold text-stone-800 leading-snug">
                {quizQuestions[currentQuizIndex].question}
              </h2>

              <div className="flex flex-col gap-3">
                {quizQuestions[currentQuizIndex].options.map((opt, idx) => {
                  const isSelected = selectedOption === opt;
                  const isCorrect = opt === quizQuestions[currentQuizIndex].answer;
                  
                  let btnClass = "no-select w-full text-left p-5 rounded-2xl border-2 transition-all font-medium text-lg flex items-center justify-between ";
                  
                  if (!hasAnswered) {
                    btnClass += isSelected 
                      ? "border-cyan-600 bg-cyan-50 text-cyan-900" 
                      : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 active:bg-stone-50";
                  } else {
                    if (isCorrect) {
                      btnClass += "border-emerald-500 bg-emerald-50 text-emerald-900";
                    } else if (isSelected && !isCorrect) {
                      btnClass += "border-rose-500 bg-rose-50 text-rose-900";
                    } else {
                      btnClass += "border-stone-200 bg-white text-stone-400 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(opt)}
                      className={btnClass}
                      disabled={hasAnswered}
                    >
                      <span>{opt}</span>
                      {hasAnswered && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 ml-3" />}
                      {hasAnswered && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-rose-500 flex-shrink-0 ml-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Action Area */}
            <div className="p-6 bg-white border-t border-stone-200 pb-safe">
              {!hasAnswered ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOption}
                  className={`no-select w-full font-bold text-lg py-5 rounded-[2rem] transition-all flex items-center justify-center ${
                    selectedOption 
                      ? "bg-cyan-600 text-white shadow-xl shadow-cyan-600/20 active:scale-95" 
                      : "bg-stone-100 text-stone-400 cursor-not-allowed"
                  }`}
                >
                  Kiểm tra
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="no-select w-full bg-stone-800 text-white font-bold text-lg py-5 rounded-[2rem] shadow-xl shadow-stone-900/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  {currentQuizIndex < quizQuestions.length - 1 ? "Tiếp tục" : "Hoàn thành"}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {screen === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col p-6 space-y-6"
          >
            <div className="flex items-center mb-4">
              <button 
                onClick={returnHome}
                className="no-select w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-stone-200 text-stone-600 active:bg-stone-100 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold text-stone-800 ml-4">Cài Đặt</h2>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200 flex flex-col gap-6">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isSoundEnabled ? 'bg-cyan-50 text-cyan-600' : 'bg-stone-100 text-stone-400'}`}>
                    {isSoundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-800">Âm thanh</h3>
                    <p className="text-sm text-stone-500">Bật/tắt hiệu ứng âm thanh</p>
                  </div>
                </div>
                <button
                  onClick={toggleSound}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isSoundEnabled ? 'bg-cyan-500' : 'bg-stone-200'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isSoundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              
              <div className="h-px w-full bg-stone-100"></div>

              {/* Quiz Length */}
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="font-bold text-stone-800">Số câu hỏi trắc nghiệm</h3>
                  <p className="text-sm text-stone-500">Mỗi lượt làm bài kiểm tra</p>
                </div>
                <div className="flex bg-stone-100 rounded-2xl p-1.5 gap-1">
                  {[5, 10, 15].map(num => (
                    <button
                      key={num}
                      onClick={() => updateQuizLength(num)}
                      className={`flex-1 no-select py-2.5 rounded-xl text-sm font-bold transition-all ${quizLength === num ? 'bg-white text-cyan-600 shadow-sm' : 'text-stone-500 hover:bg-stone-200/50'}`}
                    >
                      {num === 15 ? 'Tất cả' : `${num} câu`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'result' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col p-6 items-center justify-center text-center space-y-8"
          >
            <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Award className="w-16 h-16 text-amber-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-stone-800">Hoàn Thành!</h2>
              <p className="text-stone-500">Bạn đã trả lời đúng {score} trên {quizQuestions.length} câu hỏi.</p>
            </div>

            <div className="bg-white rounded-3xl p-8 w-full shadow-sm border border-stone-200 mt-8 mb-8">
              <p className="text-6xl font-black text-cyan-600 mb-2">
                {Math.round((score / quizQuestions.length) * 100)}%
              </p>
              <p className="text-sm font-bold text-stone-400 uppercase tracking-wider">ĐIỂM SỐ</p>
            </div>

            <div className="w-full space-y-4 mt-auto pb-4">
              <button 
                onClick={startQuiz}
                className="no-select w-full bg-cyan-600 text-white font-bold text-lg py-5 rounded-[2rem] shadow-xl shadow-cyan-600/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Làm Lại ({quizLength === 15 ? 'Tất cả' : quizLength} câu)
              </button>
              <button 
                onClick={returnHome}
                className="no-select w-full bg-white text-stone-700 font-bold text-lg py-5 rounded-[2rem] border-2 border-stone-200 active:bg-stone-50 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Về Trang Chủ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
