import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserStats } from '../types';
import { ACHIEVEMENTS_LIST } from '../services/storage';
import { soundEngine } from '../services/audio';
import { X, Trophy, Target, Flame, Award, Globe, CheckCircle, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
}

export const StatsModal: React.FC<Props> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  const totalAnswered = stats.totalCorrect + stats.totalWrong;
  const overallAccuracy = totalAnswered > 0 ? Math.round((stats.totalCorrect / totalAnswered) * 100) : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 max-w-2xl w-full max-h-[85vh] overflow-y-auto text-white shadow-2xl relative space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-500/30 text-cyan-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold">Statistics & Achievements</h3>
                <p className="text-xs text-slate-400 font-mono">World Flag Quiz Career</p>
              </div>
            </div>

            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              id="close-stats-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Overview Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
              <p className="text-xl font-black text-cyan-400">{stats.gamesPlayed}</p>
              <p className="text-[10px] font-mono text-slate-400 uppercase">Games Played</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
              <p className="text-xl font-black text-emerald-400">{overallAccuracy}%</p>
              <p className="text-[10px] font-mono text-slate-400 uppercase">Overall Accuracy</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
              <p className="text-xl font-black text-amber-400">{stats.highestScore}</p>
              <p className="text-[10px] font-mono text-slate-400 uppercase">High Score</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
              <p className="text-xl font-black text-fuchsia-400">x{stats.longestStreak}</p>
              <p className="text-[10px] font-mono text-slate-400 uppercase">Max Streak</p>
            </div>
          </div>

          {/* Continent Accuracy Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Continental Performance</span>
            </h4>

            <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              {['Europe', 'Africa', 'Asia', 'North America', 'South America', 'Oceania'].map((c) => {
                const data = stats.continentAccuracy[c] || { correct: 0, total: 0 };
                const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

                return (
                  <div key={c} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300 font-semibold">{c}</span>
                      <span className="text-slate-400">
                        {data.correct}/{data.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Achievements ({stats.unlockedAchievements.length}/{ACHIEVEMENTS_LIST.length})</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACHIEVEMENTS_LIST.map((ach) => {
                const isUnlocked = stats.unlockedAchievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-2xl border backdrop-blur-md flex items-center gap-3 transition-all ${
                      isUnlocked
                        ? 'bg-amber-950/30 border-amber-500/40 text-amber-100 shadow-md'
                        : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="text-2xl filter drop-shadow">{ach.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-xs truncate text-white">{ach.title}</h5>
                        {isUnlocked ? (
                          <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{ach.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
