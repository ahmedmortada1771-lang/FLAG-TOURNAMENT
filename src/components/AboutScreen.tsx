import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Globe, Users, Trophy, Shield, Zap, BookOpen, Award, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';
import { soundEngine } from '../services/audio';

interface Props {
  onBackToHome: () => void;
}

export const AboutScreen: React.FC<Props> = ({ onBackToHome }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header Navigation */}
      <nav className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/80">
        <button
          onClick={() => {
            soundEngine.playClick();
            onBackToHome();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 hover:border-cyan-500/50 transition-all text-xs sm:text-sm font-bold shadow-lg"
          id="about-back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Game</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>Flag Tournament Overview</span>
        </div>
      </nav>

      <main className="space-y-10">
        {/* Hero Article Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>The Ultimate World Geography & Flag Quiz Experience</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 font-sans">
            About Flag Tournament: The Ultimate Flag Quiz & Geography Game
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
            Welcome to <strong className="text-cyan-300 font-bold">Flag Tournament</strong>, the premier online flag game and interactive geography quiz designed for students, trivia enthusiasts, and competitive players worldwide.
          </p>
        </header>

        {/* Section 1: Introduction */}
        <section className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center gap-3 text-cyan-400 font-mono text-sm font-bold tracking-wider uppercase">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h2>What is Flag Tournament?</h2>
          </div>
          <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
            <strong className="text-white">Flag Tournament</strong> is a high-octane <strong className="text-cyan-300">Flag Quiz</strong> and educational <strong className="text-fuchsia-300">Geography Game</strong> that tests your knowledge of national flags, official territories, and international sports federations. Featuring all 209 official <strong className="text-amber-300">FIFA Countries</strong> and recognized sovereign nations across six major continents, Flag Tournament offers an engaging platform to test your visual memory, learn world flags, and master world geography.
          </p>
          <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
            Whether you want to challenge yourself in single-player mode or battle friends in real-time online rooms, this platform provides a smooth, responsive, and visual learning environment. From beginner-friendly national banners to rare island territories, Flag Tournament turns geography learning into an exciting esports-style flag challenge.
          </p>
        </section>

        {/* Section 2: How to Play & Modes */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400 font-mono text-sm font-bold tracking-wider uppercase">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <h2>Single-Player Mode</h2>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
              The single-player mode allows players to sharpen their skills at their own pace. You can choose specific continents like Europe, Asia, Africa, North America, South America, or Oceania—or test your memory across all world flags simultaneously in the World mode.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside">
              <li><strong className="text-cyan-300">Tournament Mode:</strong> Progressive 10-level difficulty scaling from easy iconic banners to challenging territories.</li>
              <li><strong className="text-blue-300">Classic Quiz:</strong> Standard 20-question flag quiz sessions with instant answer feedback.</li>
              <li><strong className="text-emerald-300">Survival Challenge:</strong> Infinite non-repeating flag questions with 3 lives and streak tracking.</li>
              <li><strong className="text-purple-300">Time Attack:</strong> Fast-paced 30-second speed run to guess as many country flags as possible.</li>
              <li><strong className="text-rose-300">Daily Challenge:</strong> Curated 3-question daily geography quiz with streak bonuses.</li>
            </ul>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-fuchsia-400 font-mono text-sm font-bold tracking-wider uppercase">
              <Users className="w-5 h-5 text-fuchsia-400" />
              <h2>Multiplayer Mode & Online Rooms</h2>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
              Looking for competitive multiplayer flag quiz action? Flag Tournament features dedicated real-time online rooms where up to 15 players can enter the same match simultaneously. Host your own custom room, customize continent selections and question counts, and share your 6-character room code with friends.
            </p>
            <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
              During multiplayer matches, live scoreboards update in real time after every question. Fast correct answers award higher points, creating a suspenseful race to the top of the room standings.
            </p>
          </div>
        </section>

        {/* Section 3: Why Learn Geography with Flag Quiz */}
        <section className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center gap-3 text-emerald-400 font-mono text-sm font-bold tracking-wider uppercase">
            <Award className="w-5 h-5 text-emerald-400" />
            <h2>Why Learn Flags and Geography with Flag Tournament?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">1</div>
              <h3 className="font-bold text-white text-sm">Visual & Active Recall</h3>
              <p className="text-xs text-slate-400">Boost memory retention by combining high-definition vector flag imagery with instant multiple-choice choices.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-fuchsia-950/80 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-400 font-bold">2</div>
              <h3 className="font-bold text-white text-sm">Comprehensive Database</h3>
              <p className="text-xs text-slate-400">Includes sovereign countries, FIFA member nations, and dependent territories complete with difficulty tiering.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">3</div>
              <h3 className="font-bold text-white text-sm">Progress Tracking</h3>
              <p className="text-xs text-slate-400">Earn badges, unlock achievements, track daily streak counters, and monitor accuracy statistics across game modes.</p>
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
            Learning world geography does not have to be repetitive memorization. By turning geography quiz practice into a game, <strong className="text-white">Flag Tournament</strong> makes it easy to <strong className="text-cyan-300">Learn Flags</strong>, <strong className="text-fuchsia-300">Guess the Country</strong>, and discover fascinating details about global geography, national emblems, and international culture.
          </p>
        </section>

        {/* Section 4: Key Game Features */}
        <section className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center gap-3 text-cyan-400 font-mono text-sm font-bold tracking-wider uppercase">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h2>Core Features of Flag Tournament</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Real-Time Multiplayer Rooms</strong>
                Battle up to 15 real opponents in synchronized online sessions.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Non-Repeating Question Engine</strong>
                Enjoy pure non-repeating flag sequences until all flags in a region are completed.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">3D Interactive Hologlobe</strong>
                Explore an interactive 3D globe visualization highlighting country locations.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Audio & Visual Polish</strong>
                Equipped with retro sound effects, ambient music, and 3-2-1 countdown overlays.
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: FAQ */}
        <section className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center gap-3 text-purple-400 font-mono text-sm font-bold tracking-wider uppercase">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            <h2>Frequently Asked Questions (FAQ)</h2>
          </div>

          <div className="space-y-4">
            <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/60">
              <h3 className="font-bold text-white text-sm sm:text-base">Is Flag Tournament completely free to play?</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">Yes! Flag Tournament is 100% free to play in your browser without requiring registration or app store downloads.</p>
            </div>

            <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/60">
              <h3 className="font-bold text-white text-sm sm:text-base">How do online multiplayer flag rooms work?</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">Click "Play Online", create a new room or enter an existing 6-letter room code, wait for players to join, and the host will launch the synchronized match.</p>
            </div>

            <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/60">
              <h3 className="font-bold text-white text-sm sm:text-base">Which countries and flags are included?</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">Our database covers 209 official FIFA countries and sovereign nations, plus island territories and continental sub-regions across Europe, Asia, Africa, Americas, and Oceania.</p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="text-center py-6 bg-gradient-to-r from-cyan-950/60 via-slate-900/90 to-fuchsia-950/60 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
          <h2 className="text-2xl font-black text-white font-sans">Ready to Test Your Geography Knowledge?</h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Jump into the world flag challenge, challenge friends in multiplayer rooms, and climb the global leaderboards today!
          </p>
          <button
            onClick={() => {
              soundEngine.playClick();
              onBackToHome();
            }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all"
            id="about-cta-play-btn"
          >
            <Trophy className="w-5 h-5" />
            <span>Play Flag Tournament Now</span>
          </button>
        </div>
      </main>

      <footer className="mt-12 text-center py-6 border-t border-slate-800/80 text-xs text-slate-500 font-mono">
        <p>© {new Date().getFullYear()} Flag Tournament — World Geography Flag Quiz & Online Multiplayer Game</p>
      </footer>
    </div>
  );
};
