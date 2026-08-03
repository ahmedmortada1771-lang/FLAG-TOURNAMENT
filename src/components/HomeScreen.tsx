import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Continent, GameMode } from '../types';
import { soundEngine } from '../services/audio';
import { getLocalDateString } from '../services/storage';
import { Trophy, Zap, Shield, Calendar, Play, Settings, BarChart2, Volume2, VolumeX, Music, Sparkles, Star, Lock, Clock, Users, User, Info } from 'lucide-react';
import { ContinentIcon } from './ContinentIcons';
import { InteractiveGlobe } from './InteractiveGlobe';

interface Props {
  onSelectContinent: (continent: Continent) => void;
  onSelectMode: (mode: GameMode) => void;
  selectedMode: GameMode;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  dailyStreak: number;
  dailyPoints: number;
  lastDailyDate: string;
  lastDailyTimestamp?: number;
  playerName: string;
  onEditName: () => void;
}

const CONTINENTS: { name: Continent; label: string; desc: string }[] = [
  { name: 'All', label: 'World', desc: 'All 209 World Flags' },
  { name: 'Europe', label: 'Europe', desc: '54 European Flags' },
  { name: 'Africa', label: 'Africa', desc: '54 African Flags' },
  { name: 'Asia', label: 'Asia', desc: '47 Asian Flags' },
  { name: 'North America', label: 'North America', desc: '35 North American Flags' },
  { name: 'South America', label: 'South America', desc: '10 South American Flags' },
  { name: 'Oceania', label: 'Oceania', desc: '11 Oceania Flags' },
];

const MODES: { id: GameMode; name: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { id: 'online', name: 'Play Online', icon: <Users className="w-5 h-5" />, color: 'from-cyan-400 via-fuchsia-400 to-amber-300', desc: 'Real-Time Rooms • Up to 15 Players' },
  { id: 'tournament', name: 'Tournament', icon: <Trophy className="w-5 h-5" />, color: 'from-amber-500 to-yellow-300', desc: 'Dynamic Difficulty (1-10)' },
  { id: 'classic', name: 'Classic', icon: <Play className="w-5 h-5" />, color: 'from-cyan-500 to-blue-500', desc: '20 Randomized Flags' },
  { id: 'survival', name: 'Survival', icon: <Shield className="w-5 h-5" />, color: 'from-emerald-500 to-teal-400', desc: 'Infinite Non-Repeating Flags • 3 Lives' },
  { id: 'timeattack', name: 'Time Attack', icon: <Zap className="w-5 h-5" />, color: 'from-pink-500 to-purple-500', desc: '30s Speed Rush' },
  { id: 'daily', name: 'Daily Challenge', icon: <Calendar className="w-5 h-5" />, color: 'from-fuchsia-500 to-rose-400', desc: '3 Daily Questions • Earn Points' },
];

export const HomeScreen: React.FC<Props> = ({
  onSelectContinent,
  onSelectMode,
  selectedMode,
  onOpenStats,
  onOpenSettings,
  onOpenAbout,
  soundEnabled,
  onToggleSound,
  musicEnabled,
  onToggleMusic,
  dailyStreak,
  dailyPoints,
  lastDailyDate,
  lastDailyTimestamp,
  playerName,
  onEditName,
}) => {
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [showLockedModal, setShowLockedModal] = useState<boolean>(false);

  const todayStr = getLocalDateString();
  const nowMs = Date.now();
  const isDailyLocked = !!(
    (lastDailyTimestamp && (nowMs - lastDailyTimestamp < 24 * 60 * 60 * 1000)) ||
    (!lastDailyTimestamp && lastDailyDate === todayStr)
  );

  useEffect(() => {
    const updateTimer = () => {
      const currentNow = Date.now();
      let diffMs = 0;

      if (lastDailyTimestamp) {
        diffMs = (lastDailyTimestamp + 24 * 60 * 60 * 1000) - currentNow;
      } else {
        const d = new Date();
        const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
        diffMs = midnight.getTime() - currentNow;
      }

      if (diffMs <= 0) {
        setTimeUntilReset('00h 00m 00s');
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      const pad = (n: number) => n.toString().padStart(2, '0');
      setTimeUntilReset(`${pad(h)}h ${pad(m)}m ${pad(s)}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastDailyTimestamp, lastDailyDate, todayStr]);

  const handleContinentClick = (continent: Continent) => {
    if (selectedMode === 'daily') {
      if (isDailyLocked) {
        soundEngine.playWrong();
        setShowLockedModal(true);
        return;
      }
      // Daily Challenge is always World
      onSelectContinent('All');
      return;
    }
    onSelectContinent(continent);
  };

  return (
    <div className="relative z-10 min-h-screen flex flex-col justify-between p-4 md:p-8 pb-24 sm:pb-8 max-w-6xl mx-auto text-white">
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-2 py-3 sm:py-4">
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-fuchsia-600 p-[2px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950/90 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-[11px] sm:text-xs font-bold tracking-widest text-cyan-400 uppercase">World Flag Quiz</h2>
            <p className="text-[10px] sm:text-xs text-slate-400 font-mono">209 National Flags</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Player Profile Badge */}
          {playerName && (
            <button
              onClick={() => {
                soundEngine.playClick();
                onEditName();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition-all shadow-lg shrink-0"
              title="Click to edit player name"
              id="player-profile-header-btn"
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              <span className="max-w-[85px] sm:max-w-none truncate">{playerName}</span>
            </button>
          )}

          {/* Special Daily Points Counter Display */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-amber-950/80 border border-amber-500/50 text-amber-300 font-mono text-xs font-bold shadow-lg shadow-amber-500/10 cursor-default shrink-0"
            title="Special Daily Points earned from Daily Challenges (1pt per correct answer)"
            id="daily-points-badge"
          >
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400 animate-pulse" />
            <span>{dailyPoints} Pts</span>
          </div>

          {/* Quick Music Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleMusic();
            }}
            className="p-2 sm:p-3 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80 transition-all text-slate-300 hover:text-amber-400 shadow-lg"
            title={musicEnabled ? "Mute Background Music" : "Unmute Background Music"}
            id="music-toggle-btn"
          >
            {musicEnabled ? (
              <Music className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse" />
            ) : (
              <Music className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400/60" />
            )}
          </button>

          {/* Quick Sound Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleSound();
            }}
            className="p-2 sm:p-3 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all text-slate-300 hover:text-cyan-400 shadow-lg"
            title="Toggle Sound"
            id="sound-toggle-btn"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />}
          </button>

          {/* Stats Button */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenStats();
            }}
            className="p-2 sm:p-3 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all text-slate-300 hover:text-cyan-400 shadow-lg"
            title="Statistics & Achievements"
            id="stats-btn"
          >
            <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenSettings();
            }}
            className="p-2 sm:p-3 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all text-slate-300 hover:text-cyan-400 shadow-lg"
            title="Settings"
            id="settings-btn"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* About Game Button */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenAbout();
            }}
            className="p-2 sm:p-3 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all text-slate-300 hover:text-cyan-400 shadow-lg"
            title="About Flag Tournament"
            id="about-btn"
          >
            <Info className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* Hero Section & Interactive Globe */}
      <div className="my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-4 backdrop-blur-md shadow-inner">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>AAA World Championship Edition</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 drop-shadow-[0_10px_20px_rgba(0,240,255,0.3)] font-sans">
            FLAG TOURNAMENT
          </h1>
          
          <p className="mt-3 text-base sm:text-lg text-slate-300 font-medium tracking-wide">
            Guess National & Territory Flags
          </p>
        </motion.div>

        {/* Interactive 3D Spinning Globe Widget */}
        <div className="lg:col-span-5">
          <InteractiveGlobe />
        </div>
      </div>

      {/* Game Mode Selector */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Select Game Mode</span>
          {dailyStreak > 0 && (
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1 bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-500/30">
              🔥 {dailyStreak} Day Streak
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {MODES.map((m) => {
            const isActive = selectedMode === m.id;
            const isThisDailyLocked = m.id === 'daily' && isDailyLocked;

            return (
              <motion.button
                key={m.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  soundEngine.playClick();
                  onSelectMode(m.id);
                  if (m.id === 'daily') {
                    if (isDailyLocked) {
                      setShowLockedModal(true);
                    } else {
                      onSelectContinent('All');
                    }
                  }
                }}
                className={`relative p-3.5 rounded-2xl border text-left transition-all duration-300 backdrop-blur-xl flex flex-col justify-between overflow-hidden shadow-lg ${
                  isActive
                    ? 'bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-cyan-400 shadow-cyan-500/20 ring-2 ring-cyan-400/50'
                    : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
                id={`mode-btn-${m.id}`}
              >
                {/* Active Indicator Glow */}
                {isActive && (
                  <span className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/20 blur-xl rounded-full pointer-events-none" />
                )}
                
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${m.color} text-slate-950 shadow-md`}>
                    {m.icon}
                  </div>
                  {isThisDailyLocked ? (
                    <span className="px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500/50 text-[10px] font-mono text-rose-300 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  ) : isActive ? (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
                  ) : null}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-white flex items-center justify-between">
                    <span>{m.name}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {isThisDailyLocked ? `Next in ${timeUntilReset}` : m.desc}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Continent Region Selection Grid */}
      <div className="mb-6">
        <div className="mb-3 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Select Continent Region</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CONTINENTS.map((c, index) => (
            <motion.button
              key={c.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                soundEngine.playClick();
                handleContinentClick(c.name);
              }}
              className="group relative p-4 rounded-2xl bg-slate-900/60 hover:bg-gradient-to-r hover:from-slate-900/90 hover:to-slate-800/90 border border-slate-800 hover:border-cyan-500/50 backdrop-blur-xl transition-all duration-300 shadow-xl flex items-center justify-between overflow-hidden"
              id={`continent-btn-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {/* Subtle hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-fuchsia-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-fuchsia-500/5 transition-all duration-500 pointer-events-none" />

              <div className="flex items-center space-x-3.5 z-10">
                <ContinentIcon continent={c.name} className="w-10 h-10 shrink-0" />
                <div className="text-left">
                  <h4 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors">
                    {c.label}
                  </h4>
                  <p className="text-xs text-slate-400">{c.desc}</p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-xl bg-slate-800/80 group-hover:bg-cyan-500 group-hover:text-slate-950 text-slate-400 flex items-center justify-center transition-all duration-300 shadow-md">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Daily Locked Modal */}
      <AnimatePresence>
        {showLockedModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 max-w-sm w-full text-center shadow-2xl space-y-5 relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 p-[2px] mx-auto shadow-lg shadow-rose-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Lock className="w-8 h-8 text-amber-400" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white mb-1">Daily Challenge Completed!</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You have already answered today's 3-question Daily Challenge and claimed your Daily Points.
                </p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-center gap-3">
                <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
                <div className="text-left">
                  <p className="text-[10px] font-mono uppercase text-slate-400">Next Challenge In</p>
                  <p className="text-xl font-mono font-extrabold text-cyan-300">{timeUntilReset}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  setShowLockedModal(false);
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-extrabold text-sm hover:brightness-110 transition-all shadow-lg"
                id="close-daily-locked-modal"
              >
                GOT IT
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="text-center py-6 text-xs text-slate-500 font-mono flex flex-col items-center justify-center gap-2">
        <p>World Flags &amp; Territories • Global Flag Quiz</p>
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenAbout();
          }}
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 font-bold transition-colors"
          id="footer-about-btn"
        >
          About Flag Tournament
        </button>
      </footer>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile devices) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-2xl px-3 py-2 flex items-center justify-around shadow-2xl">
        {/* Profile / Name Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onEditName();
          }}
          className="flex flex-col items-center gap-1 p-1 text-cyan-400 hover:text-cyan-300 transition-colors"
          id="mobile-bottom-profile-btn"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-mono font-bold max-w-[65px] truncate">{playerName || 'Profile'}</span>
        </button>

        {/* Stats Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenStats();
          }}
          className="flex flex-col items-center gap-1 p-1 text-slate-400 hover:text-cyan-400 transition-colors"
          id="mobile-bottom-stats-btn"
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px] font-mono font-bold">Stats</span>
        </button>

        {/* About Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenAbout();
          }}
          className="flex flex-col items-center gap-1 p-1 text-slate-400 hover:text-cyan-400 transition-colors"
          id="mobile-bottom-about-btn"
        >
          <Info className="w-5 h-5" />
          <span className="text-[10px] font-mono font-bold">About</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenSettings();
          }}
          className="flex flex-col items-center gap-1 p-1 text-slate-400 hover:text-cyan-400 transition-colors"
          id="mobile-bottom-settings-btn"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-mono font-bold">Settings</span>
        </button>
      </nav>
    </div>
  );
};
