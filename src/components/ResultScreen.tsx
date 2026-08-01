import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { UserAnswer, GameMode, Achievement } from '../types';
import { soundEngine } from '../services/audio';
import { Trophy, RotateCcw, Home, Star, Target, Flame, Award, Zap } from 'lucide-react';

interface Props {
  answers: UserAnswer[];
  finalScore: number;
  maxStreak: number;
  bestDifficulty: number;
  gameMode: GameMode;
  newlyUnlocked: Achievement[];
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export const ResultScreen: React.FC<Props> = ({
  answers,
  finalScore,
  maxStreak,
  bestDifficulty,
  gameMode,
  newlyUnlocked,
  onPlayAgain,
  onGoHome,
}) => {
  const totalQuestions = answers.length;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const wrongCount = totalQuestions - correctCount;
  const accuracyPct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Star Rating (1 to 5)
  const starCount = accuracyPct >= 95 ? 5 : accuracyPct >= 80 ? 4 : accuracyPct >= 65 ? 3 : accuracyPct >= 45 ? 2 : 1;
  const ratingOutOfTen = (accuracyPct / 10).toFixed(1);

  // Trigger Confetti on high score / star rating
  useEffect(() => {
    if (accuracyPct >= 70) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#ff007f', '#fbbf24', '#34d399'],
      });
    }
  }, [accuracyPct]);

  // Performance Analysis Commentary
  const getAnalysisText = () => {
    if (accuracyPct === 100) return 'FLAWLESS VICTORY! You possess world-class flag knowledge!';
    if (accuracyPct >= 85) return 'EXCEPTIONAL PERFORMANCE! You know almost every national flag.';
    if (accuracyPct >= 70) return 'GREAT JOB! Solid understanding of international flags.';
    if (accuracyPct >= 50) return 'GOOD EFFORT! Keep practicing to master rarer flags.';
    return 'CHALLENGING ROUND! Try Easy or Continent mode to build flag mastery.';
  };

  return (
    <div className="relative z-10 min-h-screen flex flex-col justify-between p-4 md:p-8 max-w-4xl mx-auto text-white">
      {/* Header */}
      <header className="text-center py-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold mb-2 shadow-inner">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="uppercase">{gameMode} MATCH COMPLETE</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300">
            TOURNAMENT RESULTS
          </h1>
        </motion.div>
      </header>

      {/* Main Stats Card */}
      <main className="my-auto py-4 space-y-6">
        {/* Star Rating & Score Hero Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-2xl text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

          {/* Stars */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.span
                key={star}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: star * 0.1 }}
                className="text-3xl md:text-4xl"
              >
                <Star
                  className={`w-8 h-8 md:w-10 md:h-10 ${
                    star <= starCount
                      ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                      : 'text-slate-700'
                  }`}
                />
              </motion.span>
            ))}
          </div>

          {/* Final Score */}
          <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-amber-300 mb-1 font-mono tracking-tight">
            {finalScore}
          </div>
          <p className="text-xs font-mono uppercase text-slate-400 tracking-widest mb-4">FINAL SCORE</p>

          <p className="text-sm md:text-base text-cyan-300 font-semibold max-w-md mx-auto leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            {getAnalysisText()}
          </p>
        </motion.div>

        {/* Newly Unlocked Achievements Toast */}
        {newlyUnlocked.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 to-slate-900/90 border border-amber-500/50 backdrop-blur-xl shadow-xl flex items-center gap-4"
          >
            <div className="p-3 rounded-xl bg-amber-500 text-slate-950 text-2xl font-bold shadow-md">
              🏆
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold text-amber-400 uppercase">Achievement Unlocked!</h4>
              <p className="font-bold text-white text-sm">
                {newlyUnlocked.map((a) => a.title).join(', ')}
              </p>
            </div>
          </motion.div>
        )}

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl text-center">
            <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-emerald-400">{accuracyPct}%</p>
            <p className="text-[11px] text-slate-400 font-mono">ACCURACY</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl text-center">
            <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-amber-400">x{maxStreak}</p>
            <p className="text-[11px] text-slate-400 font-mono">BEST STREAK</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl text-center">
            <Zap className="w-5 h-5 text-fuchsia-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-fuchsia-400">{bestDifficulty}/10</p>
            <p className="text-[11px] text-slate-400 font-mono">MAX DIFFICULTY</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl text-center">
            <Award className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-cyan-400">{ratingOutOfTen}</p>
            <p className="text-[11px] text-slate-400 font-mono">RATING / 10</p>
          </div>
        </div>

        {/* Breakdown Stats Box */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex items-center justify-around text-xs font-mono">
          <div>
            <span className="text-slate-400">Correct:</span>{' '}
            <span className="font-bold text-emerald-400">{correctCount}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div>
            <span className="text-slate-400">Wrong:</span>{' '}
            <span className="font-bold text-rose-400">{wrongCount}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div>
            <span className="text-slate-400">Total Flags:</span>{' '}
            <span className="font-bold text-white">{totalQuestions}</span>
          </div>
        </div>
      </main>

      {/* Action Buttons */}
      <footer className="flex items-center gap-3 py-4">
        <button
          onClick={() => {
            soundEngine.playClick();
            onGoHome();
          }}
          className={`flex-1 py-4 rounded-2xl ${
            gameMode === 'daily'
              ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-600 text-slate-950 font-black'
              : 'bg-slate-900/80 border border-slate-800 text-slate-300 font-bold hover:border-cyan-500/50 hover:bg-slate-800 hover:text-cyan-400'
          } text-sm transition-all flex items-center justify-center gap-2 shadow-lg`}
          id="result-home-btn"
        >
          <Home className="w-5 h-5" />
          <span>MAIN MENU</span>
        </button>

        {gameMode !== 'daily' && (
          <button
            onClick={() => {
              soundEngine.playVictory();
              onPlayAgain();
            }}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-600 text-slate-950 font-black text-sm tracking-wide hover:brightness-110 active:scale-98 transition-all shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2"
            id="result-replay-btn"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PLAY AGAIN</span>
          </button>
        )}
      </footer>
    </div>
  );
};
