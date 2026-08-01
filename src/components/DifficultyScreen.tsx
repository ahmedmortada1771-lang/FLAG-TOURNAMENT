import React from 'react';
import { motion } from 'motion/react';
import { Continent, GameMode } from '../types';
import { soundEngine } from '../services/audio';
import { Trophy, ArrowLeft, Zap, Shield, Calendar, Sparkles, Heart, Target } from 'lucide-react';

interface Props {
  continent: Continent;
  gameMode: GameMode;
  onStartGame: (difficultyFilter: 'easy' | 'medium' | 'hard' | 'all') => void;
  onBack: () => void;
}

const DIFFICULTIES = [
  {
    id: 'easy' as const,
    name: 'Easy',
    levelText: 'Difficulty 1 - 3',
    color: 'from-emerald-500 to-teal-400',
    borderColor: 'hover:border-emerald-400/80',
    glowColor: 'shadow-emerald-500/20',
    desc: 'Famous national flags like Brazil, France, Japan, USA, Germany.',
    icon: '🌱',
  },
  {
    id: 'medium' as const,
    name: 'Medium',
    levelText: 'Difficulty 4 - 7',
    color: 'from-amber-500 to-yellow-400',
    borderColor: 'hover:border-amber-400/80',
    glowColor: 'shadow-amber-500/20',
    desc: 'Challenging flags like Slovakia, Kenya, Jamaica, Uzbekistan, Peru.',
    icon: '⚡',
  },
  {
    id: 'hard' as const,
    name: 'Hard',
    levelText: 'Difficulty 8 - 10',
    color: 'from-rose-500 to-pink-500',
    borderColor: 'hover:border-rose-400/80',
    glowColor: 'shadow-rose-500/20',
    desc: 'Rare & tough flags like Comoros, San Marino, Vanuatu, Montserrat.',
    icon: '🔥',
  },
  {
    id: 'all' as const,
    name: 'All Levels',
    levelText: 'Difficulty 1 - 10',
    color: 'from-cyan-500 to-fuchsia-500',
    borderColor: 'hover:border-cyan-400/80',
    glowColor: 'shadow-cyan-500/20',
    desc: 'Full spectrum mix of all flags from easy to master level.',
    icon: '🎲',
  },
];

export const DifficultyScreen: React.FC<Props> = ({ continent, gameMode, onStartGame, onBack }) => {
  return (
    <div className="relative z-10 min-h-screen flex flex-col justify-between p-4 md:p-8 max-w-4xl mx-auto text-white">
      {/* Top Navigation */}
      <header className="flex items-center justify-between py-4">
        <button
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all text-slate-300 hover:text-cyan-400 shadow-lg"
          id="back-to-home-btn"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold text-sm">Back to Regions</span>
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 text-xs font-mono">
          <span className="text-cyan-400 font-bold">{continent}</span>
          <span className="text-slate-500">•</span>
          <span className="text-fuchsia-400 font-bold uppercase">{gameMode}</span>
        </div>
      </header>

      {/* Main Container */}
      <div className="my-auto py-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3 backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
            <span>Select Difficulty Tier</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-2">
            {gameMode === 'tournament'
              ? 'Tournament Ladder'
              : gameMode === 'survival'
              ? 'Survival Challenge'
              : gameMode === 'daily'
              ? 'Daily Challenge'
              : 'Choose Challenge'}
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto mb-8">
            {gameMode === 'tournament'
              ? 'Tournament Mode starts at Difficulty 1 and dynamically adjusts +1 for correct answers and -1 for wrong answers.'
              : gameMode === 'survival'
              ? 'Survival Mode tests your flag endurance across all flags without country repeats. Lose all 3 lives and the run ends!'
              : gameMode === 'daily'
              ? 'Answer 3 daily seeded questions. Earn 1 special Daily Point for every correct answer!'
              : 'Select your preferred flag difficulty level for this round.'}
          </p>

          {/* Special Single Start Cards for Tournament, Survival, and Daily Modes */}
          {gameMode === 'tournament' ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 border-2 border-amber-500/60 shadow-2xl shadow-amber-500/10 backdrop-blur-xl text-left max-w-xl mx-auto mb-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-2xl rounded-full pointer-events-none" />

              <div className="flex items-center gap-4 mb-4">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-300 text-slate-950 shadow-lg">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-amber-300">Tournament Mode</h3>
                  <p className="text-xs text-slate-400">Dynamic 1-10 Ladder System</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-300 mb-6 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <p className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓ Correct Answer:</span> Difficulty increases by +1
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-rose-400 font-bold">✗ Wrong Answer:</span> Difficulty decreases by -1
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">🎯 Max Level:</span> Reach Difficulty 10 for Gold Medal
                </p>
              </div>

              <button
                onClick={() => {
                  soundEngine.playVictory();
                  onStartGame('all');
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-lg tracking-wide hover:brightness-110 active:scale-98 transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2"
                id="start-tournament-btn"
              >
                <Zap className="w-5 h-5 fill-current" />
                <span>START TOURNAMENT</span>
              </button>
            </motion.div>
          ) : gameMode === 'survival' ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 border-2 border-emerald-500/60 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl text-left max-w-xl mx-auto mb-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full pointer-events-none" />

              <div className="flex items-center gap-4 mb-4">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-slate-950 shadow-lg">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-emerald-300">Survival Mode</h3>
                  <p className="text-xs text-slate-400">3 Lives • No Country Repeats</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-300 mb-6 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <p className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-400 shrink-0" />
                  <span><strong className="text-rose-400">3 Lives:</strong> Round ends when 3 wrong answers occur</span>
                </p>
                <p className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span><strong className="text-cyan-400">No Flag Repeats:</strong> Every question features a unique target country</span>
                </p>
                <p className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong className="text-amber-400">Continuous Flow:</strong> Test how far you can go across world flags</span>
                </p>
              </div>

              <button
                onClick={() => {
                  soundEngine.playVictory();
                  onStartGame('all');
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 font-black text-lg tracking-wide hover:brightness-110 active:scale-98 transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2"
                id="start-survival-btn"
              >
                <Zap className="w-5 h-5 fill-current" />
                <span>START SURVIVAL</span>
              </button>
            </motion.div>
          ) : gameMode === 'daily' ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 border-2 border-fuchsia-500/60 shadow-2xl shadow-fuchsia-500/10 backdrop-blur-xl text-left max-w-xl mx-auto mb-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-2xl rounded-full pointer-events-none" />

              <div className="flex items-center gap-4 mb-4">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-rose-400 text-slate-950 shadow-lg">
                  <Calendar className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-fuchsia-300">Daily Challenge</h3>
                  <p className="text-xs text-slate-400">3 Questions • Seeded Daily</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-300 mb-6 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <p className="flex items-center gap-2">
                  <span className="text-fuchsia-400 font-bold">📅 3 Questions:</span> Exactly 3 seeded flag questions for today
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">⭐ Earn Points:</span> Gain 1 Daily Point per correct answer (0 for wrong)
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">🔒 Daily Lock:</span> Locks until midnight after completion
                </p>
              </div>

              <button
                onClick={() => {
                  soundEngine.playVictory();
                  onStartGame('all');
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-rose-400 to-fuchsia-500 text-slate-950 font-black text-lg tracking-wide hover:brightness-110 active:scale-98 transition-all shadow-xl shadow-fuchsia-500/25 flex items-center justify-center gap-2"
                id="start-daily-btn"
              >
                <Zap className="w-5 h-5 fill-current" />
                <span>START DAILY CHALLENGE</span>
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {DIFFICULTIES.map((d) => (
                <motion.button
                  key={d.id}
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    soundEngine.playClick();
                    onStartGame(d.id);
                  }}
                  className={`p-5 rounded-2xl bg-slate-900/60 border border-slate-800 ${d.borderColor} backdrop-blur-xl transition-all duration-300 shadow-xl ${d.glowColor} text-left flex flex-col justify-between group`}
                  id={`diff-btn-${d.id}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{d.icon}</span>
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full bg-gradient-to-r ${d.color} text-slate-950 shadow-md`}>
                      {d.levelText}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors mb-1">
                      {d.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{d.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-500 font-mono">
        Selected Region: <span className="text-slate-300">{continent}</span>
      </footer>
    </div>
  );
};
