import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Country, Question, GameMode, UserAnswer } from '../types';
import { getFlagUrl } from '../data/fifaCountries';
import { soundEngine } from '../services/audio';
import { Trophy, Shield, Zap, Flame, Clock, Pause, X } from 'lucide-react';

interface Props {
  questions: Question[];
  gameMode: GameMode;
  onFinishGame: (answers: UserAnswer[], finalScore: number, maxStreak: number, bestDifficulty: number) => void;
  onQuitGame: () => void;
}

function findNextTournamentQuestionIndex(
  questions: Question[],
  askedIndices: Set<number>,
  targetDiff: number,
  wasCorrect: boolean
): number {
  const unasked = questions
    .map((q, idx) => ({ q, idx }))
    .filter(({ idx }) => !askedIndices.has(idx));

  if (unasked.length === 0) return -1;

  // 1. Look for exact match for target difficulty
  const exact = unasked.filter(({ q }) => q.targetCountry.difficulty === targetDiff);
  if (exact.length > 0) {
    const pick = exact[Math.floor(Math.random() * exact.length)];
    return pick.idx;
  }

  // 2. Best alternative based on direction (harder if correct, easier if wrong)
  let best = unasked[0];
  let bestDelta = Math.abs(best.q.targetCountry.difficulty - targetDiff);

  for (const item of unasked) {
    const diff = item.q.targetCountry.difficulty;
    const delta = Math.abs(diff - targetDiff);

    if (delta < bestDelta) {
      bestDelta = delta;
      best = item;
    } else if (delta === bestDelta) {
      if (wasCorrect && diff > best.q.targetCountry.difficulty) {
        best = item;
      } else if (!wasCorrect && diff < best.q.targetCountry.difficulty) {
        best = item;
      }
    }
  }

  return best.idx;
}

export const GameScreen: React.FC<Props> = ({ questions, gameMode, onFinishGame, onQuitGame }) => {
  const initialTournamentIdx = React.useMemo(() => {
    if (gameMode === 'tournament' && questions.length > 0) {
      const idx = questions.findIndex((q) => q.targetCountry.difficulty === 1);
      return idx !== -1 ? idx : 0;
    }
    return 0;
  }, [gameMode, questions]);

  const [currentIndex, setCurrentIndex] = useState(initialTournamentIdx);
  const [askedIndices, setAskedIndices] = useState<Set<number>>(() => new Set([initialTournamentIdx]));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(3); // For Survival mode
  const [currentDifficulty, setCurrentDifficulty] = useState<number>(() => {
    if (gameMode === 'tournament' && questions[initialTournamentIdx]) {
      return questions[initialTournamentIdx].targetCountry.difficulty;
    }
    return 1;
  });
  const [bestDifficultyReached, setBestDifficultyReached] = useState<number>(1);

  // Time Attack Timer (30s total)
  const [timeRemaining, setTimeRemaining] = useState(30);

  // Per-question timer tracker
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Choice Selection State
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);

  // 3-2-1 GO Countdown Overlay State
  const [countdownText, setCountdownText] = useState<string | null>(null);

  // Feedback FX
  const [shake, setShake] = useState(false);
  const [showGlow, setShowGlow] = useState<'correct' | 'wrong' | null>(null);

  // Pause Modal
  const [isPaused, setIsPaused] = useState(false);

  const currentQuestion = questions[currentIndex];

  // Initialize or reset question timing
  useEffect(() => {
    setQuestionStartTime(Date.now());
    setSelectedIndex(null);
    setIsAnswered(false);
    setShowGlow(null);
    setCountdownText(null);
  }, [currentIndex]);

  // Handle Time Attack Mode 30s countdown
  useEffect(() => {
    if (gameMode !== 'timeattack' || isPaused || isAnswered || countdownText !== null) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time Up -> Finish Game
          soundEngine.playGameOver();
          onFinishGame(userAnswers, score, maxStreak, bestDifficultyReached);
          return 0;
        }
        if (prev <= 10) {
          soundEngine.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameMode, isPaused, isAnswered, countdownText, userAnswers, score, maxStreak, bestDifficultyReached, onFinishGame]);

  const handleSelectAnswer = useCallback(
    (index: number) => {
      if (isAnswered || isPaused || countdownText !== null) return;

      const timeTaken = Date.now() - questionStartTime;
      setIsAnswered(true);
      setSelectedIndex(index);

      const isCorrect = index === currentQuestion.correctIndex;

      if (isCorrect) {
        soundEngine.playCorrect();
        setShowGlow('correct');

        const activeDiff = currentQuestion.targetCountry.difficulty;
        const points = 100 + streak * 10 + activeDiff * 10;
        setScore((prev) => prev + points);

        const newStreak = streak + 1;
        setStreak(newStreak);
        setMaxStreak((prev) => Math.max(prev, newStreak));

        if (newStreak % 5 === 0) {
          soundEngine.playStreak();
        }

        let nextDiff = currentDifficulty;
        // Tournament difficulty increases on correct answer
        if (gameMode === 'tournament') {
          nextDiff = Math.min(10, currentDifficulty + 1);
          setCurrentDifficulty(nextDiff);
          setBestDifficultyReached((b) => Math.max(b, nextDiff));
        }

        // Time Attack bonus time (+2s)
        if (gameMode === 'timeattack') {
          setTimeRemaining((prev) => Math.min(99, prev + 2));
        }
      } else {
        soundEngine.playWrong();
        setShowGlow('wrong');
        setShake(true);
        setTimeout(() => setShake(false), 500);

        setStreak(0);

        // Survival mode live loss
        if (gameMode === 'survival') {
          setLives((prev) => {
            const nextLives = prev - 1;
            if (nextLives <= 0) {
              setTimeout(() => {
                soundEngine.playGameOver();
                onFinishGame(
                  [
                    ...userAnswers,
                    {
                      questionNumber: currentIndex + 1,
                      country: currentQuestion.targetCountry,
                      selectedCountry: currentQuestion.choices[index],
                      isCorrect: false,
                      timeTakenMs: timeTaken,
                      difficulty: currentQuestion.targetCountry.difficulty,
                    },
                  ],
                  score,
                  maxStreak,
                  bestDifficultyReached
                );
              }, 1000);
            }
            return nextLives;
          });
        }

        let nextDiff = currentDifficulty;
        // Tournament difficulty decreases on wrong answer
        if (gameMode === 'tournament') {
          nextDiff = Math.max(1, currentDifficulty - 1);
          setCurrentDifficulty(nextDiff);
        }

        // Time Attack penalty (-3s)
        if (gameMode === 'timeattack') {
          setTimeRemaining((prev) => Math.max(0, prev - 3));
        }
      }

      // Store answer record
      const answerRecord: UserAnswer = {
        questionNumber: currentIndex + 1,
        country: currentQuestion.targetCountry,
        selectedCountry: currentQuestion.choices[index],
        isCorrect,
        timeTakenMs: timeTaken,
        difficulty: currentQuestion.targetCountry.difficulty,
      };

      const updatedAnswers = [...userAnswers, answerRecord];
      setUserAnswers(updatedAnswers);

      // Determine next question index
      let nextTargetDiff = currentDifficulty;
      if (gameMode === 'tournament') {
        nextTargetDiff = isCorrect ? Math.min(10, currentDifficulty + 1) : Math.max(1, currentDifficulty - 1);
      }

      const isTournament = gameMode === 'tournament';
      const maxTournamentQuestions = Math.min(20, questions.length);

      let nextQuestionIdx = -1;
      if (isTournament) {
        nextQuestionIdx = findNextTournamentQuestionIndex(questions, askedIndices, nextTargetDiff, isCorrect);
      }

      // Trigger 3-2-1 GO Countdown before next question!
      setTimeout(() => {
        if (gameMode === 'survival' && lives - (isCorrect ? 0 : 1) <= 0) {
          return; // Game over handled above
        }

        const isLastQuestion = isTournament
          ? (nextQuestionIdx === -1 || askedIndices.size >= maxTournamentQuestions)
          : (currentIndex + 1 >= questions.length);

        if (isLastQuestion && gameMode !== 'survival') {
          // Non-survival game completed!
          soundEngine.playVictory();
          onFinishGame(
            updatedAnswers,
            score + (isCorrect ? 100 : 0),
            Math.max(maxStreak, isCorrect ? streak + 1 : maxStreak),
            bestDifficultyReached
          );
          return;
        }

        // Animate 3 -> 2 -> 1 -> GO!
        setCountdownText('3');
        soundEngine.playTick();

        setTimeout(() => {
          setCountdownText('2');
          soundEngine.playTick();
        }, 280);

        setTimeout(() => {
          setCountdownText('1');
          soundEngine.playTick();
        }, 560);

        setTimeout(() => {
          setCountdownText('GO!');
          soundEngine.playClick();
        }, 840);

        setTimeout(() => {
          setCountdownText(null);
          if (isTournament && nextQuestionIdx !== -1) {
            setCurrentIndex(nextQuestionIdx);
            setAskedIndices((prev) => new Set([...prev, nextQuestionIdx]));
          } else {
            setCurrentIndex((prev) => (prev + 1) % questions.length);
          }
        }, 1120);
      }, 500);
    },
    [isAnswered, isPaused, countdownText, questionStartTime, currentQuestion, streak, currentDifficulty, gameMode, userAnswers, score, maxStreak, bestDifficultyReached, currentIndex, questions, lives, askedIndices, onFinishGame]
  );

  // Keyboard shortcut listener (1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || isAnswered) return;

      if (['1', '2', '3', '4'].includes(e.key)) {
        const choiceIdx = parseInt(e.key, 10) - 1;
        if (choiceIdx >= 0 && choiceIdx < 4) {
          handleSelectAnswer(choiceIdx);
        }
      } else if (e.key === 'Escape') {
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, isAnswered, handleSelectAnswer]);

  if (!currentQuestion) return null;

  const totalQuestionsInMode = gameMode === 'tournament' ? Math.min(20, questions.length) : questions.length;
  const currentQuestionNumber = gameMode === 'tournament' ? askedIndices.size : currentIndex + 1;
  const progressPercent = Math.round((currentQuestionNumber / totalQuestionsInMode) * 100);

  return (
    <div className="relative z-10 min-h-screen flex flex-col justify-between p-4 md:p-6 max-w-4xl mx-auto text-white select-none">
      {/* HUD Header */}
      <header className="space-y-3 py-2">
        <div className="flex items-center justify-between">
          {/* Pause / Back Button */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setIsPaused(true);
            }}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 transition-all shadow-md flex items-center gap-1.5"
            id="pause-game-btn"
          >
            <Pause className="w-5 h-5" />
            <span className="text-xs font-semibold hidden sm:inline">Pause</span>
          </button>

          {/* Center Stats Badges */}
          <div className="flex items-center gap-2">
            {/* Score */}
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md text-xs font-mono">
              <span className="text-slate-400">SCORE:</span>{' '}
              <span className="font-extrabold text-cyan-400">{score}</span>
            </div>

            {/* Streak */}
            <div className={`px-3.5 py-1.5 rounded-xl border backdrop-blur-md text-xs font-mono flex items-center gap-1 transition-all ${
              streak >= 3 ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse' : 'bg-slate-900/80 border-slate-800 text-slate-300'
            }`}>
              <Flame className={`w-4 h-4 ${streak >= 3 ? 'text-amber-400 fill-current' : 'text-slate-500'}`} />
              <span>x{streak}</span>
            </div>

            {/* Difficulty Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono flex items-center gap-1 shadow-md">
              <span className="text-slate-400">DIFF:</span>
              <span className="font-bold text-fuchsia-400">{currentQuestion.targetCountry.difficulty}/10</span>
            </div>
          </div>

          {/* Mode Special Indicator (Lives / Timer) */}
          <div className="flex items-center gap-2">
            {gameMode === 'survival' && (
              <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-500/40 px-3 py-1.5 rounded-xl shadow-md">
                {[...Array(3)].map((_, i) => (
                  <span key={i} className={`text-base transition-all ${i < lives ? 'opacity-100 scale-100' : 'opacity-20 scale-75'}`}>
                    ❤️
                  </span>
                ))}
              </div>
            )}

            {gameMode === 'timeattack' && (
              <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold border ${
                timeRemaining <= 10 ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-bounce' : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
              }`}>
                <Clock className="w-4 h-4" />
                <span>{timeRemaining}s</span>
              </div>
            )}

            {gameMode !== 'survival' && gameMode !== 'timeattack' && (
              <div className="text-xs font-mono font-bold text-slate-400 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
                {currentQuestionNumber} / {totalQuestionsInMode}
              </div>
            )}
          </div>
        </div>

        {/* Question Progress Bar */}
        {gameMode !== 'survival' && gameMode !== 'timeattack' && (
          <div className="w-full bg-slate-900/80 rounded-full h-2 border border-slate-800 overflow-hidden p-0.5">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-amber-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </header>

      {/* Flag Image Display Card */}
      <main className="my-auto py-4 flex flex-col items-center">
        <motion.div
          animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className={`relative w-full max-w-md aspect-[3/2] rounded-3xl bg-slate-900/80 border-2 p-3 shadow-2xl backdrop-blur-2xl transition-all duration-300 flex items-center justify-center overflow-hidden ${
            showGlow === 'correct'
              ? 'border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.5)] bg-emerald-950/20'
              : showGlow === 'wrong'
              ? 'border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.5)] bg-rose-950/20'
              : 'border-slate-800/90 shadow-cyan-500/5'
          }`}
        >
          {/* Subtle continent badge (hidden in Tournament mode) */}
          {gameMode !== 'tournament' && (
            <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-300 uppercase">
              {currentQuestion.targetCountry.continent}
            </div>
          )}

          {/* Flag Image */}
          <img
            src={getFlagUrl(currentQuestion.targetCountry.flagCode)}
            alt="Flag to guess"
            className="w-full h-full object-contain rounded-2xl drop-shadow-2xl transition-transform duration-300 hover:scale-105"
            loading="eager"
            onError={(e) => {
              // Fallback to SVG format if PNG fails
              const target = e.target as HTMLImageElement;
              target.src = `https://flagcdn.com/${currentQuestion.targetCountry.flagCode.toLowerCase()}.svg`;
            }}
          />

          {/* Correct / Wrong Overlay Banner */}
          <AnimatePresence>
            {showGlow === 'correct' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center rounded-3xl"
              >
                <span className="text-6xl filter drop-shadow">✅</span>
              </motion.div>
            )}
            {showGlow === 'wrong' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-rose-950/40 backdrop-blur-sm flex items-center justify-center rounded-3xl"
              >
                <span className="text-6xl filter drop-shadow">❌</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Prompt Question Header */}
        <p className="mt-4 text-center text-slate-300 font-semibold text-base">
          Which national flag is this?
        </p>

        {/* 3-2-1-GO Transition Overlay */}
        <AnimatePresence>
          {countdownText !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              key={countdownText}
              className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute w-44 h-44 rounded-full bg-cyan-500/20 blur-2xl animate-ping" />
                <motion.div
                  initial={{ scale: 0.3, rotate: -10 }}
                  animate={{ scale: 1.2, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="px-8 py-4 rounded-3xl bg-slate-900/90 border-2 border-cyan-400 shadow-[0_0_50px_rgba(0,240,255,0.6)] text-center"
                >
                  <span className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 tracking-wider font-mono">
                    {countdownText}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Choice Options Grid */}
      <footer className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
        {currentQuestion.choices.map((choice, index) => {
          let btnStyle = 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/60 hover:bg-slate-800/80 text-white';

          if (isAnswered) {
            if (index === currentQuestion.correctIndex) {
              btnStyle = 'bg-emerald-950/90 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.4)]';
            } else if (index === selectedIndex) {
              btnStyle = 'bg-rose-950/90 border-rose-500 text-rose-200 ring-2 ring-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.4)]';
            } else {
              btnStyle = 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-50';
            }
          }

          return (
            <motion.button
              key={choice.id}
              whileHover={!isAnswered ? { scale: 1.02 } : {}}
              whileTap={!isAnswered ? { scale: 0.98 } : {}}
              onClick={() => handleSelectAnswer(index)}
              disabled={isAnswered}
              className={`p-4 rounded-2xl border backdrop-blur-xl transition-all duration-200 font-bold text-left text-base sm:text-lg flex items-center justify-between shadow-lg relative overflow-hidden ${btnStyle}`}
              id={`choice-btn-${index + 1}`}
            >
              <div className="flex items-center space-x-3">
                <span className="w-7 h-7 rounded-xl bg-slate-800/80 text-slate-400 text-xs font-mono font-bold flex items-center justify-center border border-slate-700">
                  {index + 1}
                </span>
                <span className="truncate">{choice.name}</span>
              </div>

              {isAnswered && index === currentQuestion.correctIndex && (
                <span className="text-emerald-400 text-lg">✓</span>
              )}
              {isAnswered && index === selectedIndex && index !== currentQuestion.correctIndex && (
                <span className="text-rose-400 text-lg">✗</span>
              )}
            </motion.button>
          );
        })}
      </footer>

      {/* Pause Modal Overlay */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 max-w-sm w-full text-center shadow-2xl space-y-5">
              <h3 className="text-2xl font-black text-white">Game Paused</h3>
              <p className="text-xs text-slate-400 font-mono">Press Resume to continue playing</p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setIsPaused(false);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-cyan-500/20"
                  id="resume-btn"
                >
                  Resume Game
                </button>

                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onQuitGame();
                  }}
                  className="w-full py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm hover:bg-rose-950/80 hover:border-rose-500/50 hover:text-rose-300 transition-all"
                  id="quit-to-menu-btn"
                >
                  Quit to Main Menu
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
