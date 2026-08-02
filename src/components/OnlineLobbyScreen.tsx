import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, PlusCircle, LogIn, Copy, Check, ArrowLeft, Play, Globe, Shield, Sparkles, AlertCircle, Crown, UserCheck, Trophy, Zap, Clock } from 'lucide-react';
import { Continent, GameMode } from '../types';
import { soundEngine } from '../services/audio';
import { StorageService } from '../services/storage';
import { OnlineService, OnlineRoom } from '../services/onlineService';
import { ContinentIcon } from './ContinentIcons';

interface Props {
  playerName: string;
  initialRoom?: OnlineRoom | null;
  onBackToHome: () => void;
  onStartMatch: (room: OnlineRoom) => void;
  onLeaveRoom?: () => void;
  onChangeNameClick: () => void;
}

const CONTINENTS: { name: Continent; label: string }[] = [
  { name: 'All', label: 'World (All Flags)' },
  { name: 'Europe', label: 'Europe' },
  { name: 'Asia', label: 'Asia' },
  { name: 'Africa', label: 'Africa' },
  { name: 'North America', label: 'North America' },
  { name: 'South America', label: 'South America' },
  { name: 'Oceania', label: 'Oceania' },
];

const ONLINE_GAME_MODES: { id: GameMode; name: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { id: 'classic', name: 'Classic (Default)', icon: <Play className="w-4 h-4 text-cyan-400" />, color: 'from-cyan-500 to-blue-500', desc: 'Standard flag quiz • Regular scoring' },
  { id: 'tournament', name: 'Tournament', icon: <Trophy className="w-4 h-4 text-amber-400" />, color: 'from-amber-500 to-yellow-300', desc: 'Dynamic Difficulty (1-10) • Bonus points' },
  { id: 'timeattack', name: 'Time Attack', icon: <Zap className="w-4 h-4 text-fuchsia-400" />, color: 'from-fuchsia-500 to-pink-500', desc: 'Rapid speed challenge • High speed bonus' },
  { id: 'survival', name: 'Survival', icon: <Shield className="w-4 h-4 text-emerald-400" />, color: 'from-emerald-500 to-teal-400', desc: '3 Lives system • Elimination on 3 mistakes' },
];

export const OnlineLobbyScreen: React.FC<Props> = ({
  playerName,
  initialRoom,
  onBackToHome,
  onStartMatch,
  onLeaveRoom,
  onChangeNameClick,
}) => {
  const [currentRoom, setCurrentRoom] = useState<OnlineRoom | null>(initialRoom || null);
  const [viewState, setViewState] = useState<'menu' | 'create' | 'join' | 'in_room'>(
    initialRoom ? 'in_room' : 'menu'
  );
  const [selectedContinent, setSelectedContinent] = useState<Continent>('All');
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>('classic');
  const [questionCount, setQuestionCount] = useState<number>(20);

  // Join Code Input
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const playerId = StorageService.getPlayerId();
  const prevStatusRef = useRef<string | undefined>(currentRoom?.status);

  // Sync initialRoom when prop updates or on return
  useEffect(() => {
    if (initialRoom) {
      setCurrentRoom(initialRoom);
      setViewState('in_room');
      prevStatusRef.current = initialRoom.status;
    }
  }, [initialRoom]);

  // Room State Subscription
  useEffect(() => {
    if (!currentRoom) return;

    const unsubscribe = OnlineService.subscribeToRoomUpdates(currentRoom.code, (updatedRoom) => {
      const prevStatus = prevStatusRef.current;
      prevStatusRef.current = updatedRoom.status;

      setCurrentRoom(updatedRoom);

      if (updatedRoom.status === 'playing') {
        const wasInLobbyOrFinished = prevStatus === 'lobby' || prevStatus === 'finished';
        const isFreshMatch = updatedRoom.players.length > 0 && updatedRoom.players.every((p) => !p.finished);

        if (wasInLobbyOrFinished || isFreshMatch) {
          onStartMatch(updatedRoom);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentRoom?.code, onStartMatch]);

  const handleCreateRoomSubmit = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      soundEngine.playClick();
      const res = await OnlineService.createRoom(
        playerId,
        playerName,
        selectedContinent,
        selectedGameMode,
        questionCount
      );
      setCurrentRoom(res.room);
      setViewState('in_room');
    } catch (err: any) {
      soundEngine.playWrong();
      setErrorMsg(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoomSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = joinCodeInput.trim();
    if (cleanCode.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit room code');
      soundEngine.playWrong();
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      soundEngine.playClick();
      const room = await OnlineService.joinRoom(cleanCode, playerId, playerName);
      setCurrentRoom(room);
      setViewState('in_room');

      if (room.status === 'playing') {
        onStartMatch(room);
      }
    } catch (err: any) {
      soundEngine.playWrong();
      setErrorMsg(err.message || 'Room not found or full');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.code);
    soundEngine.playClick();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleHostStartGame = async () => {
    if (!currentRoom) return;
    if (currentRoom.players.length < 2) {
      soundEngine.playWrong();
      setErrorMsg('At least 2 players are required to start the match!');
      return;
    }

    setLoading(true);
    try {
      soundEngine.playClick();
      const startedRoom = await OnlineService.startRoom(currentRoom.code, playerId);
      onStartMatch(startedRoom);
    } catch (err: any) {
      soundEngine.playWrong();
      setErrorMsg(err.message || 'Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (currentRoom) {
      soundEngine.playClick();
      await OnlineService.leaveRoom(currentRoom.code, playerId);
      setCurrentRoom(null);
    }
    if (onLeaveRoom) {
      onLeaveRoom();
    }
    setViewState('menu');
  };

  const handleUpdateRoomSettings = async (newSettings: { continent?: Continent; gameMode?: GameMode; questionCount?: number }) => {
    if (!currentRoom || currentRoom.hostId !== playerId) return;
    try {
      soundEngine.playClick();
      const updated = await OnlineService.updateRoomSettings(currentRoom.code, playerId, newSettings);
      setCurrentRoom(updated);
    } catch (err: any) {
      soundEngine.playWrong();
      setErrorMsg(err.message || 'Failed to update room settings');
    }
  };

  const isHost = currentRoom?.hostId === playerId;
  const canStartGame = isHost && (currentRoom?.players.length || 0) >= 2;

  return (
    <div className="relative z-10 min-h-screen flex flex-col justify-between p-4 md:p-8 max-w-4xl mx-auto text-white">
      {/* Top Header */}
      <header className="flex items-center justify-between py-4">
        <button
          onClick={() => {
            soundEngine.playClick();
            if (viewState === 'in_room') {
              handleLeaveRoom();
            } else if (viewState !== 'menu') {
              setViewState('menu');
              setErrorMsg('');
            } else {
              onBackToHome();
            }
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 text-slate-300 transition-all font-medium text-xs shadow-lg"
          id="online-back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{viewState === 'menu' ? 'Main Menu' : 'Back to Lobby'}</span>
        </button>

        {/* Player Profile Info */}
        <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-1.5 rounded-2xl border border-cyan-500/30 shadow-lg">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex items-center justify-center font-bold text-slate-950 text-xs shadow-md">
            {playerName.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <p className="text-[10px] text-slate-400 font-mono">ONLINE PLAYER</p>
            <p className="text-xs font-bold text-cyan-300">{playerName}</p>
          </div>
          <button
            onClick={onChangeNameClick}
            className="ml-2 text-[10px] underline text-slate-400 hover:text-white"
            title="Edit Player Name"
          >
            Edit
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="my-auto py-6">
        <AnimatePresence mode="wait">
          {/* STATE 1: MENU (Create Room / Join Room) */}
          {viewState === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 text-center"
            >
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold backdrop-blur-md shadow-inner">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Real-Time Online Arena • Up to 15 Players</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 font-sans">
                  PLAY ONLINE
                </h1>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Create a custom room with a 6-digit code or join a friend's room to compete live on identical flag quizzes!
                </p>
              </div>

              {/* Two Big Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto pt-4">
                {/* CREATE ROOM BUTTON */}
                <motion.button
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    soundEngine.playClick();
                    setErrorMsg('');
                    setViewState('create');
                  }}
                  className="group relative p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border-2 border-cyan-500/50 hover:border-cyan-400 backdrop-blur-xl transition-all duration-300 shadow-2xl flex flex-col items-center text-center space-y-4 overflow-hidden"
                  id="create-room-btn"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-cyan-500/20" />
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[2px] shadow-lg shadow-cyan-500/20">
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                      <PlusCircle className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                      MAKE A ROOM
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose continent & get a 6-digit code to share
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold font-mono">
                    Host Match & 6-Digit Code
                  </div>
                </motion.button>

                {/* JOIN ROOM BUTTON */}
                <motion.button
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    soundEngine.playClick();
                    setErrorMsg('');
                    setViewState('join');
                  }}
                  className="group relative p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border-2 border-fuchsia-500/50 hover:border-fuchsia-400 backdrop-blur-xl transition-all duration-300 shadow-2xl flex flex-col items-center text-center space-y-4 overflow-hidden"
                  id="join-room-btn"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-fuchsia-500/20" />
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-rose-600 p-[2px] shadow-lg shadow-fuchsia-500/20">
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                      <LogIn className="w-8 h-8 text-fuchsia-400 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white group-hover:text-fuchsia-300 transition-colors">
                      JOIN THE ROOM
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter a 6-digit room code to join an active room
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-bold font-mono">
                    Enter 6-Digit Code
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STATE 2: CREATE ROOM OPTIONS */}
          {viewState === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 max-w-xl mx-auto shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-2xl"
            >
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                  <PlusCircle className="w-6 h-6 text-cyan-400" />
                  <span>Create Online Room</span>
                </h2>
                <p className="text-xs text-slate-400">Configure your match settings below</p>
              </div>

              {/* Continent Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase font-mono text-slate-300">
                  Select Continent / Region
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CONTINENTS.map((c) => {
                    const isSelected = selectedContinent === c.name;
                    return (
                      <button
                        key={c.name}
                        onClick={() => {
                          soundEngine.playClick();
                          setSelectedContinent(c.name);
                        }}
                        className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-center space-x-2 ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/50 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <ContinentIcon continent={c.name} className="w-5 h-5 shrink-0" />
                        <span className="truncate">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Game Mode Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase font-mono text-slate-300">
                  Select Game Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ONLINE_GAME_MODES.map((m) => {
                    const isSelected = selectedGameMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setSelectedGameMode(m.id);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-slate-950/90 border-cyan-400 text-white ring-1 ring-cyan-400/50 shadow-lg'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div className="flex items-center gap-2">
                            {m.icon}
                            <span className="text-xs font-black tracking-wide">{m.name}</span>
                          </div>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">{m.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Count Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase font-mono text-slate-300">
                  Question Count per Round
                </label>
                {selectedGameMode === 'classic' || selectedGameMode === 'tournament' ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-3 gap-3">
                      {[10, 15, 20].map((count) => {
                        const isSelected = questionCount === count;
                        return (
                          <button
                            key={count}
                            onClick={() => {
                              soundEngine.playClick();
                              setQuestionCount(count);
                            }}
                            className={`py-3 rounded-2xl border text-center text-xs font-bold font-mono transition-all ${
                              isSelected
                                ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-300 shadow-md'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {count} Flags
                          </button>
                        );
                      })}
                    </div>
                    {selectedGameMode === 'tournament' && (
                      <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center gap-2 text-[11px] font-mono text-amber-300">
                        <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Tournament Mode: Questions scale dynamically in difficulty (Level 1 to 10).</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-xs font-mono">
                    {selectedGameMode === 'timeattack' && (
                      <>
                        <Clock className="w-4 h-4 text-fuchsia-400" />
                        <span className="text-fuchsia-300 font-bold">Infinite Flags • 30s Countdown (+1s Bonus / Correct Answer)</span>
                      </>
                    )}
                    {selectedGameMode === 'survival' && (
                      <>
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Infinite Non-Repeating Flags • 3 Hearts System</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Room Capacity Info */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Max Room Limit:
                </span>
                <span className="font-bold text-amber-300">Up to 15 Players</span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                onClick={handleCreateRoomSubmit}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 text-slate-950 font-black text-sm hover:brightness-110 transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2"
                id="generate-room-code-btn"
              >
                {loading ? (
                  <span>Generating Room Code...</span>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>CREATE ROOM & GENERATE CODE</span>
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* STATE 3: JOIN ROOM INPUT */}
          {viewState === 'join' && (
            <motion.div
              key="join"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 max-w-md mx-auto shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-2xl"
            >
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                  <LogIn className="w-6 h-6 text-fuchsia-400" />
                  <span>Join Online Room</span>
                </h2>
                <p className="text-xs text-slate-400">Enter the 6-digit room code shared by the host</p>
              </div>

              <form onSubmit={handleJoinRoomSubmit} className="space-y-4">
                <div>
                  <label htmlFor="room-code-input" className="text-xs font-bold uppercase font-mono text-slate-300 block mb-2 text-center">
                    6-DIGIT ROOM CODE
                  </label>
                  <input
                    id="room-code-input"
                    type="text"
                    maxLength={6}
                    value={joinCodeInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setJoinCodeInput(val);
                      setErrorMsg('');
                    }}
                    placeholder="e.g. 849201"
                    autoFocus
                    className="w-full py-4 text-center font-mono text-3xl font-black tracking-widest text-cyan-300 bg-slate-950 border-2 border-slate-800 rounded-2xl focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/20 focus:outline-none transition-all shadow-inner placeholder-slate-700"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || joinCodeInput.trim().length !== 6}
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center justify-center gap-2 ${
                    joinCodeInput.trim().length === 6
                      ? 'bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white hover:brightness-110 shadow-fuchsia-500/25'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  }`}
                  id="confirm-join-room-btn"
                >
                  {loading ? (
                    <span>Joining Room...</span>
                  ) : (
                    <>
                      <span>JOIN ROOM NOW</span>
                      <Play className="w-4 h-4 fill-current" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* STATE 4: IN ROOM LOBBY */}
          {viewState === 'in_room' && currentRoom && (
            <motion.div
              key="in_room"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Room Header Card with 6-Digit Code & Copy Button */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left space-y-1">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono uppercase text-slate-400">ONLINE ROOM LOBBY</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300">
                      {currentRoom.code}
                    </span>
                    {/* SMALL COPY BUTTON */}
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-400 text-xs font-mono text-cyan-300 transition-all shadow-md active:scale-95"
                      title="Copy 6-Digit Room Code"
                      id="copy-room-code-btn"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-cyan-400" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 px-4 py-3 rounded-2xl border border-slate-800 text-xs font-mono">
                  <div>
                    <p className="text-slate-400">MODE</p>
                    <p className="font-bold text-cyan-300 uppercase">
                      {currentRoom.gameMode || 'classic'}
                    </p>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-800" />
                  <div>
                    <p className="text-slate-400">REGION</p>
                    <p className="font-bold text-white">{currentRoom.continent}</p>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-800" />
                  <div>
                    <p className="text-slate-400">QUESTIONS</p>
                    <p className="font-bold text-white">
                      {(currentRoom.gameMode === 'timeattack' || currentRoom.gameMode === 'survival') ? 'Infinity ∞' : `${currentRoom.questionCount} Flags`}
                    </p>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-800" />
                  <div>
                    <p className="text-slate-400">PLAYERS</p>
                    <p className="font-bold text-cyan-400">
                      {currentRoom.players.length} / {currentRoom.maxPlayers}
                    </p>
                  </div>
                </div>
              </div>

              {/* In-Room Gameplay Controls Panel (Host Edit / Player View) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                      {isHost ? 'Host Controls: Edit Room Settings' : 'Room Match Settings'}
                    </h3>
                  </div>
                  {isHost ? (
                    <span className="px-2.5 py-1 rounded-xl bg-amber-950/80 border border-amber-500/40 text-[11px] font-mono text-amber-300 font-bold flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-400" /> You are Host
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-[11px] font-mono text-slate-400">
                      Host Controls Settings
                    </span>
                  )}
                </div>

                {/* Game Mode Picker */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase font-mono text-slate-400 block">
                    Game Mode {isHost && '(Click to change mode)'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ONLINE_GAME_MODES.map((m) => {
                      const isSelected = (currentRoom.gameMode || 'classic') === m.id;
                      return (
                        <button
                          key={m.id}
                          disabled={!isHost}
                          onClick={() => handleUpdateRoomSettings({ gameMode: m.id })}
                          className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-slate-950 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/50 shadow-md'
                              : isHost
                              ? 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                              : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60 cursor-default'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="truncate">{m.name}</span>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Continent / World Picker */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase font-mono text-slate-400 block">
                    Continent / Region {isHost && '(Click to change continent/world)'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                    {CONTINENTS.map((c) => {
                      const isSelected = currentRoom.continent === c.name;
                      return (
                        <button
                          key={c.name}
                          disabled={!isHost}
                          onClick={() => handleUpdateRoomSettings({ continent: c.name })}
                          className={`p-2 rounded-xl border text-center text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-400/50'
                              : isHost
                              ? 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                              : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60 cursor-default'
                          }`}
                        >
                          <ContinentIcon continent={c.name} className="w-4 h-4 shrink-0" />
                          <span className="truncate">{c.name === 'All' ? 'World' : c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question Count Picker */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase font-mono text-slate-400 block">
                    Question Count
                  </label>
                  {currentRoom.gameMode === 'classic' || currentRoom.gameMode === 'tournament' ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[10, 15, 20].map((count) => {
                        const isSelected = currentRoom.questionCount === count;
                        return (
                          <button
                            key={count}
                            disabled={!isHost}
                            onClick={() => handleUpdateRoomSettings({ questionCount: count })}
                            className={`py-2.5 rounded-xl border text-center text-xs font-mono font-bold transition-all ${
                              isSelected
                                ? 'bg-fuchsia-950 border-fuchsia-400 text-fuchsia-300 shadow-md ring-1 ring-fuchsia-400/50'
                                : isHost
                                ? 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60 cursor-default'
                            }`}
                          >
                            {count} Flags
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono flex items-center gap-2">
                      {currentRoom.gameMode === 'timeattack' && (
                        <>
                          <Clock className="w-4 h-4 text-fuchsia-400 shrink-0" />
                          <span className="text-fuchsia-300 font-bold">Infinite Flags • 30s Countdown (+1s Bonus / Correct Answer)</span>
                        </>
                      )}
                      {currentRoom.gameMode === 'survival' && (
                        <>
                          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-emerald-300 font-bold">Infinite Non-Repeating Flags • 3 Hearts System</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Player Labels Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>Connected Players ({currentRoom.players.length}/15)</span>
                  </h3>
                  {currentRoom.players.length < 2 && (
                    <span className="text-[11px] font-mono text-amber-400 animate-pulse">
                      ⚡ Need at least 2 players to start match
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentRoom.players.map((p, idx) => {
                    const isSelf = p.id === playerId;
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between shadow-lg ${
                          isSelf
                            ? 'bg-slate-900/90 border-cyan-500/60 shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-fuchsia-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-white">{p.name}</span>
                              {isSelf && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">
                              Player #{idx + 1}
                            </p>
                          </div>
                        </div>

                        <div>
                          {p.isHost ? (
                            <span className="px-2.5 py-1 rounded-xl bg-amber-950/80 border border-amber-500/50 text-[11px] font-bold font-mono text-amber-300 flex items-center gap-1 shadow-md">
                              <Crown className="w-3.5 h-3.5 text-amber-400" /> Host
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-[11px] font-bold font-mono text-emerald-300 flex items-center gap-1 shadow-md">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Ready
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Waiting Status / Start Controls */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl shadow-2xl space-y-4 text-center">
                {currentRoom.players.length < 2 ? (
                  <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs sm:text-sm font-medium space-y-2">
                    <p className="font-bold flex items-center justify-center gap-2 text-amber-300">
                      <Users className="w-4 h-4 animate-bounce" />
                      <span>Waiting for at least 1 player to join...</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Share room code <strong className="font-mono text-cyan-300">{currentRoom.code}</strong> with your friends! The match cannot start with only 1 player.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm font-medium">
                    <p className="font-bold text-emerald-300 flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>{currentRoom.players.length} Players Connected & Ready!</span>
                    </p>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleLeaveRoom}
                    className="w-full sm:w-1/3 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all"
                  >
                    Leave Room
                  </button>

                  {isHost ? (
                    <button
                      onClick={handleHostStartGame}
                      disabled={!canStartGame || loading}
                      className={`w-full sm:w-2/3 py-3.5 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center justify-center gap-2 ${
                        canStartGame
                          ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 text-slate-950 hover:brightness-110 shadow-cyan-500/25'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      }`}
                      id="host-start-match-btn"
                    >
                      {loading ? (
                        <span>Starting Match...</span>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>START ROOM MATCH NOW</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-full sm:w-2/3 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 font-medium text-xs flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span>Waiting for host to start the match...</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="text-center py-4 text-xs text-slate-500 font-mono">
        <p>Flag Quest Online • Up to 15 Players Real-Time Room</p>
      </footer>
    </div>
  );
};
