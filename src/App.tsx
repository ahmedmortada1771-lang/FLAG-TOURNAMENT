import React, { useState, useEffect, useCallback } from 'react';
import { Continent, GameMode, Question, Country, UserAnswer, GameSettings, UserStats, Achievement } from './types';
import { FIFA_COUNTRIES } from './data/fifaCountries';
import { StorageService } from './services/storage';
import { soundEngine } from './services/audio';
import { OnlineRoom } from './services/onlineService';

import { BackgroundParticles } from './components/BackgroundParticles';
import { HomeScreen } from './components/HomeScreen';
import { DifficultyScreen } from './components/DifficultyScreen';
import { GameScreen } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { PlayerNameModal } from './components/PlayerNameModal';
import { OnlineLobbyScreen } from './components/OnlineLobbyScreen';
import { OnlineGameScreen } from './components/OnlineGameScreen';

type ScreenState = 'home' | 'difficulty' | 'game' | 'result' | 'online_lobby' | 'online_game';

// Seeded PRNG for Daily Challenge
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('home');
  const [selectedContinent, setSelectedContinent] = useState<Continent>('All');
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>('tournament');

  // Player Profile Name State
  const [playerName, setPlayerName] = useState<string>(StorageService.getPlayerName());
  const [showNameModal, setShowNameModal] = useState<boolean>(!StorageService.isValidPlayerName(StorageService.getPlayerName()));

  // Active Offline Game State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [bestDifficulty, setBestDifficulty] = useState<number>(1);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

  // Active Online Room State
  const [activeOnlineRoom, setActiveOnlineRoom] = useState<OnlineRoom | null>(null);

  // Modals & Storage
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(StorageService.getSettings());
  const [stats, setStats] = useState<UserStats>(StorageService.getStats());

  // Register PWA Service Worker Blob for offline support
  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      const swCode = `
        const CACHE_NAME = 'flag-tournament-v1';
        self.addEventListener('install', (e) => {
          e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(['/'])));
        });
        self.addEventListener('fetch', (e) => {
          e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
        });
      `;
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);

      navigator.serviceWorker
        .register(blobUrl)
        .catch(() => {
          // Fallback if Blob SW fails in sandbox
        });
    }
  }, []);

  // Update audio settings on load
  useEffect(() => {
    soundEngine.setSoundEnabled(settings.soundEnabled);
    soundEngine.setVolume(settings.volume);
    soundEngine.setMusicEnabled(settings.musicEnabled ?? true);
    soundEngine.setMusicVolume(settings.musicVolume ?? 0.4);
  }, [settings]);

  // Handle background music: turn off during gameplay, turn on everywhere else (in room, lobby, home, etc.)
  useEffect(() => {
    const isPlaying = screen === 'game' || screen === 'online_game';
    if (isPlaying) {
      soundEngine.stopMusic();
    } else {
      if (settings.musicEnabled) {
        soundEngine.startMusic();
      } else {
        soundEngine.stopMusic();
      }
    }
  }, [screen, settings.musicEnabled]);

  // Handle Continent Selection -> Go to Difficulty
  const handleSelectContinent = (continent: Continent) => {
    setSelectedContinent(continent);
    setScreen('difficulty');
  };

  // Question Generator
  const generateQuestions = useCallback(
    (difficultyFilter: 'easy' | 'medium' | 'hard' | 'all') => {
      // 1. Filter strictly by continent first if not 'All'
      let continentPool = FIFA_COUNTRIES;
      if (selectedContinent !== 'All') {
        continentPool = FIFA_COUNTRIES.filter((c) => c.continent === selectedContinent);
      }

      // 2. Filter by difficulty tier
      let pool = continentPool;
      if (difficultyFilter === 'easy') {
        const strictEasy = continentPool.filter((c) => c.difficulty <= 3);
        if (strictEasy.length >= 3) {
          pool = strictEasy;
        } else {
          // If a continent has very few easy flags (e.g. Oceania), expand slightly to difficulty <= 5
          const expandedEasy = continentPool.filter((c) => c.difficulty <= 5);
          pool = expandedEasy.length > 0 ? expandedEasy : continentPool;
        }
      } else if (difficultyFilter === 'medium') {
        const mediumPool = continentPool.filter((c) => c.difficulty >= 4 && c.difficulty <= 7);
        pool = mediumPool.length > 0 ? mediumPool : continentPool;
      } else if (difficultyFilter === 'hard') {
        const hardPool = continentPool.filter((c) => c.difficulty >= 8);
        pool = hardPool.length > 0 ? hardPool : continentPool;
      }

      // Randomizer function
      const rng = Math.random;

      // Shuffle helper
      const shuffle = <T,>(arr: T[]): T[] => {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      };

      const shuffledPool = shuffle(pool);
      let selectedTargets: Country[] = [];

      if (selectedGameMode === 'daily') {
        // Daily Challenge: strictly up to 3 questions
        selectedTargets = shuffledPool.slice(0, Math.min(3, shuffledPool.length));
      } else if (selectedGameMode === 'tournament') {
        // Tournament: sample up to 40 unique flags spanning all available difficulty levels in pool
        selectedTargets = shuffledPool.slice(0, Math.min(40, shuffledPool.length));
      } else if (selectedGameMode === 'classic') {
        // Classic: up to 20 unique flags
        selectedTargets = shuffledPool.slice(0, Math.min(20, shuffledPool.length));
      } else {
        // Survival or Time Attack: play through all unique flags in pool
        selectedTargets = shuffledPool.slice(0, shuffledPool.length);
      }

      const generatedQuestions: Question[] = selectedTargets.map((target, idx) => {
        // Distractors: if a specific continent is selected, distractors MUST come strictly from that continent; if World ('All') is selected, distractors come randomly from any country in the world
        let distractorPool: Country[] = [];
        if (selectedContinent !== 'All') {
          distractorPool = FIFA_COUNTRIES.filter(
            (c) => c.continent === selectedContinent && c.id !== target.id
          );
        } else {
          distractorPool = FIFA_COUNTRIES.filter((c) => c.id !== target.id);
        }

        if (distractorPool.length < 3) {
          const extra = FIFA_COUNTRIES.filter(
            (c) => c.id !== target.id && !distractorPool.some((dp) => dp.id === c.id)
          );
          distractorPool = [...distractorPool, ...extra];
        }

        const chosenDistractors = shuffle(distractorPool).slice(0, 3);
        const choices = shuffle([target, ...chosenDistractors]);
        const correctIndex = choices.findIndex((c) => c.id === target.id);

        return {
          id: idx + 1,
          targetCountry: target,
          choices,
          correctIndex,
        };
      });

      setQuestions(generatedQuestions);
      setScreen('game');
    },
    [selectedContinent, selectedGameMode]
  );

  // Handle Game Completion
  const handleFinishGame = (
    answers: UserAnswer[],
    score: number,
    streak: number,
    bestDiff: number
  ) => {
    setUserAnswers(answers);
    setFinalScore(score);
    setMaxStreak(streak);
    setBestDifficulty(bestDiff);

    const correctCount = answers.filter((a) => a.isCorrect).length;
    const wrongCount = answers.length - correctCount;

    // Save Career Stats & check Achievements
    const { stats: updatedStats, newlyUnlocked: unlocked } = StorageService.updateGameEndStats({
      correctCount,
      wrongCount,
      score,
      maxStreak: streak,
      bestDifficulty: bestDiff,
      continent: selectedContinent,
      isTournament: selectedGameMode === 'tournament',
      isDaily: selectedGameMode === 'daily',
      isSurvival: selectedGameMode === 'survival',
    });

    setStats(updatedStats);
    setNewlyUnlocked(unlocked);
    setScreen('result');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden relative">
      {/* 60fps Neon Canvas Particles */}
      <BackgroundParticles theme={settings.theme} />

      {/* Main Views */}
      {screen === 'home' && (
        <HomeScreen
          onSelectContinent={handleSelectContinent}
          onSelectMode={(mode) => {
            setSelectedGameMode(mode);
            if (mode === 'online') {
              setScreen('online_lobby');
            }
          }}
          selectedMode={selectedGameMode}
          onOpenStats={() => setIsStatsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          soundEnabled={settings.soundEnabled}
          onToggleSound={() => {
            const updated = { ...settings, soundEnabled: !settings.soundEnabled };
            setSettings(updated);
            StorageService.saveSettings(updated);
          }}
          musicEnabled={settings.musicEnabled ?? true}
          onToggleMusic={() => {
            const updated = { ...settings, musicEnabled: !(settings.musicEnabled ?? true) };
            setSettings(updated);
            soundEngine.setMusicEnabled(updated.musicEnabled);
            StorageService.saveSettings(updated);
          }}
          dailyStreak={stats.dailyStreak}
          dailyPoints={stats.dailyPoints || 0}
          lastDailyDate={stats.lastDailyDate || ''}
          lastDailyTimestamp={stats.lastDailyTimestamp || 0}
          playerName={playerName}
          onEditName={() => setShowNameModal(true)}
        />
      )}

      {screen === 'online_lobby' && (
        <OnlineLobbyScreen
          playerName={playerName}
          onBackToHome={() => setScreen('home')}
          onStartMatch={(room) => {
            setActiveOnlineRoom(room);
            setScreen('online_game');
          }}
          onChangeNameClick={() => setShowNameModal(true)}
        />
      )}

      {screen === 'online_game' && activeOnlineRoom && (
        <OnlineGameScreen
          room={activeOnlineRoom}
          playerName={playerName}
          onBackToLobby={() => setScreen('online_lobby')}
          onBackToHome={() => setScreen('home')}
        />
      )}

      {screen === 'difficulty' && (
        <DifficultyScreen
          continent={selectedContinent}
          gameMode={selectedGameMode}
          onStartGame={generateQuestions}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'game' && (
        <GameScreen
          questions={questions}
          gameMode={selectedGameMode}
          onFinishGame={handleFinishGame}
          onQuitGame={() => setScreen('home')}
        />
      )}

      {screen === 'result' && (
        <ResultScreen
          answers={userAnswers}
          finalScore={finalScore}
          maxStreak={maxStreak}
          bestDifficulty={bestDifficulty}
          gameMode={selectedGameMode}
          continent={selectedContinent}
          newlyUnlocked={newlyUnlocked}
          onPlayAgain={() => generateQuestions('all')}
          onGoHome={() => setScreen('home')}
        />
      )}

      {/* Mandatory Name Entry Modal if Name Not Set */}
      {showNameModal && (
        <PlayerNameModal
          initialName={playerName}
          isDismissable={StorageService.isValidPlayerName(playerName)}
          onClose={() => setShowNameModal(false)}
          onSaveName={(savedName) => {
            setPlayerName(savedName);
            setShowNameModal(false);
          }}
        />
      )}

      {/* Modals */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSet) => {
          setSettings(newSet);
          StorageService.saveSettings(newSet);
        }}
        onResetData={() => {
          const fresh = StorageService.resetStats();
          setStats(fresh);
        }}
        playerName={playerName}
        onEditName={() => setShowNameModal(true)}
      />
    </div>
  );
}
