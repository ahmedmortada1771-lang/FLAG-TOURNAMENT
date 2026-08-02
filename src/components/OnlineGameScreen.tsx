import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { OnlineRoom, OnlineService } from '../services/onlineService';
import { StorageService } from '../services/storage';
import { soundEngine } from '../services/audio';
import { Trophy, Check, X, Clock, Users, Zap, Home, Heart, Shield, Award } from 'lucide-react';

interface Props {
  room: OnlineRoom;
  playerName: string;
  onBackToLobby: () => void;
  onBackToHome: () => void;
}

function findNextTournamentQuestionIndex(
  questions: any[],
  askedIndices: Set<number>,
  targetDiff: number,
  wasCorrect: boolean
): number {
  const unasked = questions
    .map((q, idx) => ({ q, idx }))
    .filter(({ idx }) => !askedIndices.has(idx));

  if (unasked.length === 0) return -1;

  const exact = unasked.filter(({ q }) => q.targetCountry?.difficulty === targetDiff);
  if (exact.length > 0) {
    const pick = exact[Math.floor(Math.random() * exact.length)];
    return pick.idx;
  }

  let best = unasked[0];
  let bestDelta = Math.abs((best.q.targetCountry?.difficulty || 1) - targetDiff);

  for (const item of unasked) {
    const diff = item.q.targetCountry?.difficulty || 1;
    const delta = Math.abs(diff - targetDiff);

    if (delta < bestDelta) {
      bestDelta = delta;
      best = item;
    } else if (delta === bestDelta) {
      if (wasCorrect && diff > (best.q.targetCountry?.difficulty || 1)) {
        best = item;
      } else if (!wasCorrect && diff < (best.q.targetCountry?.difficulty || 1)) {
        best = item;
      }
    }
  }

  return best.idx;
}

export const OnlineGameScreen: React.FC<Props> = ({
  room: initialRoom,
  playerName,
  onBackToLobby,
  onBackToHome,
}) => {
  const playerId = StorageService.getPlayerId();

  const [room, setRoom] = useState<OnlineRoom>(initialRoom);
  const questions = room.questions || [];

  const initialTournamentIdx = React.useMemo(() => {
    if (initialRoom.gameMode === 'tournament' && questions.length > 0) {
      const idx = questions.findIndex((q) => q.targetCountry?.difficulty === 1);
      return idx !== -1 ? idx : 0;
    }
    return 0;
  }, [initialRoom.gameMode, questions]);

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(initialTournamentIdx);
  const [askedIndices, setAskedIndices] = useState<Set<number>>(() => new Set([initialTournamentIdx]));
  const [score, setScore] = useState<number>(0);
  const [totalCorrect, setTotalCorrect] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [finished, setFinished] = useState<boolean>(false);

  // 3-2-1 Countdown Animation State
  const [countdownText, setCountdownText] = useState<string | null>('3');

  // Mode Specific States
  const [lives, setLives] = useState<number>(3); // Survival Mode Hearts
  const [timeLeft, setTimeLeft] = useState<number>(30); // Time Attack Countdown
  const [bonusTimePopup, setBonusTimePopup] = useState<boolean>(false); // "+1s" Toast Indicator
  const [currentDifficulty, setCurrentDifficulty] = useState<number>(() => {
    if (initialRoom.gameMode === 'tournament' && questions[initialTournamentIdx]) {
      return questions[initialTournamentIdx].targetCountry?.difficulty || 1;
    }
    return 1;
  }); // Tournament Difficulty Level (1 to 10)

  const startTimeRef = useRef<number>(Date.now());
  const questionStartTimeRef = useRef<number>(Date.now());

  // 3-2-1 GO Countdown Animation Effect on Game Start
  useEffect(() => {
    setCountdownText('3');
    soundEngine.playTick();

    const t1 = setTimeout(() => {
      setCountdownText('2');
      soundEngine.playTick();
    }, 750);

    const t2 = setTimeout(() => {
      setCountdownText('1');
      soundEngine.playTick();
    }, 1500);

    const t3 = setTimeout(() => {
      setCountdownText('GO!');
      soundEngine.playClick();
    }, 2250);

    const t4 = setTimeout(() => {
      setCountdownText(null);
      questionStartTimeRef.current = Date.now();
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  // Subscribe to Room updates
  useEffect(() => {
    const unsubscribe = OnlineService.subscribeToRoomUpdates(initialRoom.code, (updatedRoom) => {
      setRoom(updatedRoom);
    });
    return () => unsubscribe();
  }, [initialRoom.code]);

  // Handle Time Attack 30s Countdown Timer
  useEffect(() => {
    const isTimeAttack = room.gameMode === 'timeattack' || room.gameMode === 'time_attack';
    if (!isTimeAttack || finished || showFeedback || countdownText !== null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          soundEngine.playGameOver();
          setFinished(true);
          OnlineService.submitProgress(room.code, playerId, {
            currentQuestionIndex: currentQuestionIdx,
            score,
            totalCorrect,
            totalTimeMs: Date.now() - startTimeRef.current,
            finished: true,
          });
          return 0;
        }
        if (prev <= 6) {
          soundEngine.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [room.gameMode, finished, showFeedback, room.code, playerId, currentQuestionIdx, score, totalCorrect, countdownText]);

  // Trigger confetti if current player is the winner when game ends
  useEffect(() => {
    if (finished || room.status === 'finished') {
      const sorted = [...room.players].sort((a, b) => b.score - a.score);
      if (sorted.length > 0 && sorted[0].id === playerId) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    }
  }, [finished, room.status, room.players, playerId]);

  const currentQuestion = questions[currentQuestionIdx];

  const handleSelectChoice = async (idx: number) => {
    if (showFeedback || !currentQuestion || finished) return;

    const timeTakenMs = Date.now() - questionStartTimeRef.current;
    setSelectedIndex(idx);
    setShowFeedback(true);

    const isCorrect = idx === currentQuestion.correctIndex;
    let newScore = score;
    let newTotalCorrect = totalCorrect;
    let newStreak = streak;
    let newLives = lives;
    let newDiff = currentDifficulty;

    const isTimeAttack = room.gameMode === 'timeattack' || room.gameMode === 'time_attack';
    const isSurvival = room.gameMode === 'survival';
    const isTournament = room.gameMode === 'tournament';

    if (isCorrect) {
      soundEngine.playCorrect();
      newTotalCorrect += 1;
      newStreak += 1;

      // Tournament Dynamic Difficulty Upgrade
      if (isTournament) {
        newDiff = Math.min(10, currentDifficulty + 1);
        setCurrentDifficulty(newDiff);
      }

      // Time Attack +1s Time Bonus
      if (isTimeAttack) {
        setTimeLeft((prev) => Math.min(99, prev + 1));
        setBonusTimePopup(true);
        setTimeout(() => setBonusTimePopup(false), 800);
      }

      // Points calculation
      const activeDiff = isTournament ? newDiff : (currentQuestion.targetCountry.difficulty || 1);
      const speedBonus = Math.max(0, 50 - Math.floor(timeTakenMs / 100));
      const points = 100 + newStreak * 10 + activeDiff * 15 + speedBonus;
      newScore += points;

      setScore(newScore);
      setTotalCorrect(newTotalCorrect);
      setStreak(newStreak);
    } else {
      soundEngine.playWrong();
      newStreak = 0;
      setStreak(0);

      // Tournament Dynamic Difficulty Downgrade
      if (isTournament) {
        newDiff = Math.max(1, currentDifficulty - 1);
        setCurrentDifficulty(newDiff);
      }

      // Survival Life Loss
      if (isSurvival) {
        newLives = lives - 1;
        setLives(newLives);
      }
    }

    let nextIdx = -1;
    if (isTournament) {
      nextIdx = findNextTournamentQuestionIndex(questions, askedIndices, newDiff, isCorrect);
    } else {
      nextIdx = currentQuestionIdx + 1;
    }

    const maxTournamentCount = Math.min(20, questions.length);
    const isLastQuestion = isTournament
      ? (nextIdx === -1 || askedIndices.size >= maxTournamentCount)
      : (nextIdx >= questions.length);

    const isSurvivalDead = isSurvival && newLives <= 0;
    const isPlayerFinished = isLastQuestion || isSurvivalDead;
    const totalElapsedMs = Date.now() - startTimeRef.current;

    // Send progress update to server
    await OnlineService.submitProgress(room.code, playerId, {
      currentQuestionIndex: isPlayerFinished ? questions.length : (nextIdx !== -1 ? nextIdx : currentQuestionIdx + 1),
      score: newScore,
      totalCorrect: newTotalCorrect,
      totalTimeMs: totalElapsedMs,
      finished: isPlayerFinished,
    });

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedIndex(null);
      if (isPlayerFinished) {
        if (isSurvivalDead) soundEngine.playGameOver();
        setFinished(true);
      } else {
        const targetNext = isTournament ? nextIdx : currentQuestionIdx + 1;
        setCurrentQuestionIdx(targetNext);
        if (isTournament && targetNext !== -1) {
          setAskedIndices((prev) => new Set([...prev, targetNext]));
        }
        questionStartTimeRef.current = Date.now();
      }
    }, 1200);
  };

  const sortedPlayers = [...room.players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.totalCorrect !== a.totalCorrect) return b.totalCorrect - a.totalCorrect;
    return a.totalTimeMs - b.totalTimeMs;
  });

  const isMatchOver = finished || room.players.every((p) => p.finished);

  return (
    <div className="relative z-10 min-h-screen flex flex-col justify-between p-4 md:p-8 max-w-4xl mx-auto text-white">
      {/* MATCH LEADERBOARD OVERLAY WHEN FINISHED */}
      {isMatchOver ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="my-auto space-y-8 text-center"
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold backdrop-blur-md shadow-inner">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>MATCH COMPLETED • ROOM LEADERBOARD</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300">
              FINAL RESULTS
            </h1>
            <p className="text-sm text-slate-300">
              Room Code: <strong className="font-mono text-cyan-300">{room.code}</strong> • {room.players.length} Players
            </p>
            <div className="pt-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold shadow-lg">
                <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  You completed all flags in {room.continent === 'All' || !room.continent ? 'the World' : room.continent}!
                </span>
              </div>
            </div>
          </div>

          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-2">
            {sortedPlayers.slice(0, 3).map((player, rankIdx) => {
              const isFirst = rankIdx === 0;
              const isSecond = rankIdx === 1;
              const isThird = rankIdx === 2;
              const isUser = player.id === playerId;

              return (
                <div
                  key={player.id}
                  className={`p-5 rounded-3xl border text-center space-y-3 relative overflow-hidden shadow-2xl ${
                    isFirst
                      ? 'bg-gradient-to-b from-amber-950/90 via-slate-900 to-amber-950/90 border-amber-400 shadow-amber-500/20 sm:-translate-y-3'
                      : isSecond
                      ? 'bg-slate-900/90 border-slate-400'
                      : 'bg-slate-900/90 border-amber-700/60'
                  }`}
                >
                  {isFirst && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-2xl rounded-full pointer-events-none" />
                  )}

                  <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center font-black text-xl shadow-lg">
                    {isFirst ? (
                      <span className="text-3xl">🥇</span>
                    ) : isSecond ? (
                      <span className="text-3xl">🥈</span>
                    ) : (
                      <span className="text-3xl">🥉</span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-black text-base text-white truncate flex items-center justify-center gap-1">
                      <span>{player.name}</span>
                      {isUser && <span className="text-xs text-cyan-300 font-mono">(You)</span>}
                    </h4>
                    <p className="text-2xl font-black font-mono text-cyan-300 mt-1">
                      {player.score} pts
                    </p>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                    <span>{player.totalCorrect}/{room.questionCount} Correct</span>
                    <span>{(player.totalTimeMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Leaderboard Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl max-w-2xl mx-auto space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono text-left px-2">
              All Room Standings ({sortedPlayers.length} Players)
            </h3>

            <div className="space-y-2">
              {sortedPlayers.map((p, idx) => {
                const isUser = p.id === playerId;
                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-mono shadow-md ${
                      isUser
                        ? 'bg-cyan-950/60 border-cyan-500/60 text-white font-bold'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 font-bold text-cyan-400">#{idx + 1}</span>
                      <span className="font-bold text-sm text-white">{p.name} {isUser && '(You)'}</span>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-slate-400 hidden sm:inline">{p.totalCorrect}/{room.questionCount} Correct</span>
                      <span className="text-cyan-300 font-bold text-sm">{p.score} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto pt-4">
            <button
              onClick={() => {
                soundEngine.playClick();
                onBackToLobby();
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black text-sm hover:brightness-110 transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2"
              id="return-online-lobby-btn"
            >
              <Users className="w-4 h-4" />
              <span>RETURN TO ROOM LOBBY</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                onBackToHome();
              }}
              className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all flex items-center justify-center gap-2"
              id="return-home-from-online-btn"
            >
              <Home className="w-4 h-4" />
              <span>MAIN MENU</span>
            </button>
          </div>
        </motion.div>
      ) : (
        /* ACTIVE MULTIPLAYER MATCH SCREEN */
        <>
          {/* Top Bar with Live Mini Leaderboard & Mode Indicators */}
          <header className="py-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="px-3 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold">
                  Q {room.gameMode === 'tournament' ? askedIndices.size : currentQuestionIdx + 1} / {room.gameMode === 'tournament' ? Math.min(20, questions.length) : questions.length}
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-cyan-400 text-xs font-mono font-bold uppercase">
                  {room.gameMode || 'classic'}
                </span>

                {/* Survival Hearts Display */}
                {room.gameMode === 'survival' && (
                  <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-900/90 border border-rose-500/40 shadow-md">
                    {[1, 2, 3].map((h) => (
                      <Heart
                        key={h}
                        className={`w-4 h-4 transition-all duration-300 ${
                          h <= lives
                            ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse'
                            : 'text-slate-700 fill-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Time Attack Countdown Display */}
                {(room.gameMode === 'timeattack' || room.gameMode === 'time_attack') && (
                  <div className="relative flex items-center gap-1.5 px-3 py-1 rounded-xl bg-fuchsia-950/90 border border-fuchsia-500/50 shadow-md">
                    <Clock className={`w-4 h-4 ${timeLeft <= 6 ? 'text-rose-400 animate-bounce' : 'text-fuchsia-400'}`} />
                    <span className={`font-mono font-black text-xs ${timeLeft <= 6 ? 'text-rose-400' : 'text-fuchsia-300'}`}>
                      {timeLeft}s
                    </span>
                    <AnimatePresence>
                      {bonusTimePopup && (
                        <motion.span
                          initial={{ opacity: 0, y: 0, scale: 0.8 }}
                          animate={{ opacity: 1, y: -18, scale: 1.2 }}
                          exit={{ opacity: 0 }}
                          className="absolute -top-3 right-0 font-mono font-black text-xs text-emerald-400 drop-shadow-md"
                        >
                          +1s!
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Tournament Dynamic Difficulty Display */}
                {room.gameMode === 'tournament' && (
                  <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold shadow-md">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lvl {currentDifficulty}/10</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono flex items-center gap-1 shadow-md">
                  <span className="text-slate-400">SCORE:</span>
                  <span className="font-bold text-cyan-400">{score}</span>
                </div>
                {streak > 1 && (
                  <div className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono text-xs font-bold animate-pulse">
                    🔥 {streak} Streak
                  </div>
                )}
              </div>
            </div>

            {/* Live Players Mini Leaderboard Strip */}
            <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-mono uppercase text-slate-400 shrink-0 px-2 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                LIVE STANDINGS:
              </span>
              <div className="flex items-center gap-2">
                {sortedPlayers.map((p, idx) => {
                  const isUser = p.id === playerId;
                  return (
                    <div
                      key={p.id}
                      className={`px-3 py-1 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 shrink-0 shadow-sm ${
                        isUser
                          ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400">#{idx + 1}</span>
                      <span className="truncate max-w-[80px]">{p.name}</span>
                      <span className="font-bold text-white">{p.score}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Question Progress Bar */}
            {room.gameMode !== 'survival' && room.gameMode !== 'timeattack' && room.gameMode !== 'time_attack' && (
              <div className="w-full bg-slate-900/80 rounded-full h-2 border border-slate-800 overflow-hidden p-0.5">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-amber-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.round(
                      ((room.gameMode === 'tournament' ? askedIndices.size : currentQuestionIdx + 1) /
                        (room.gameMode === 'tournament' ? Math.min(20, questions.length) : questions.length)) *
                        100
                    )}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </header>

          {/* Flag Question Card */}
          {currentQuestion && (
            <main className="my-auto py-4 max-w-xl mx-auto w-full space-y-6">
              {/* Flag Image Box */}
              <motion.div
                key={currentQuestionIdx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl shadow-2xl text-center space-y-4 overflow-hidden"
              >
                {/* Continent Badge (hidden in Tournament mode) */}
                {room.gameMode !== 'tournament' && currentQuestion.targetCountry?.continent && (
                  <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-300 uppercase">
                    {currentQuestion.targetCountry.continent}
                  </div>
                )}
                <div className="w-64 h-40 sm:w-80 sm:h-52 md:w-96 md:h-56 mx-auto rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-slate-950 flex items-center justify-center p-3 relative group">
                  <img
                    src={`https://flagcdn.com/w640/${currentQuestion.targetCountry.flagCode.toLowerCase()}.png`}
                    alt="Flag"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <p className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
                  WHICH COUNTRY DOES THIS FLAG BELONG TO?
                </p>
              </motion.div>

              {/* 4 Multiple Choice Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.choices.map((choice: any, idx: number) => {
                  let btnStyle = 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 text-white';

                  if (showFeedback) {
                    if (idx === currentQuestion.correctIndex) {
                      btnStyle = 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-emerald-500/20 ring-2 ring-emerald-400/50';
                    } else if (selectedIndex === idx) {
                      btnStyle = 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-rose-500/20';
                    } else {
                      btnStyle = 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={choice.id}
                      onClick={() => handleSelectChoice(idx)}
                      disabled={showFeedback}
                      className={`p-4 rounded-2xl border text-left font-bold text-sm transition-all duration-200 shadow-lg flex items-center justify-between ${btnStyle}`}
                      id={`online-choice-btn-${idx}`}
                    >
                      <span className="truncate">{choice.name}</span>
                      {showFeedback && idx === currentQuestion.correctIndex && (
                        <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                      {showFeedback && selectedIndex === idx && idx !== currentQuestion.correctIndex && (
                        <X className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </main>
          )}

          <footer className="text-center py-4 text-xs text-slate-500 font-mono">
            <p>Live Synchronized Online Round • Flag Quest</p>
          </footer>
        </>
      )}

      {/* 3-2-1 GO Countdown Overlay */}
      <AnimatePresence>
        {countdownText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <motion.span
                key={countdownText}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1.25, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-7xl sm:text-9xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 drop-shadow-[0_0_35px_rgba(6,182,212,0.8)] block"
              >
                {countdownText}
              </motion.span>
              <span className="text-xs sm:text-sm font-bold font-mono tracking-widest text-cyan-300 uppercase mt-4 block">
                Get Ready!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
