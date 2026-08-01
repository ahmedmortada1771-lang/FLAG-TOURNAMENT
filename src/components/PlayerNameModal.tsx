import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Sparkles, Check, AlertCircle } from 'lucide-react';
import { soundEngine } from '../services/audio';
import { StorageService } from '../services/storage';
import { OnlineService } from '../services/onlineService';

interface Props {
  onSaveName: (name: string) => void;
  initialName?: string;
  isDismissable?: boolean;
  onClose?: () => void;
}

export const PlayerNameModal: React.FC<Props> = ({
  onSaveName,
  initialName = '',
  isDismissable = false,
  onClose,
}) => {
  const [name, setName] = useState<string>(initialName);
  const [touched, setTouched] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const trimmed = name.trim();
  const isValidLength = StorageService.isValidPlayerName(trimmed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setErrorMsg('');

    if (!isValidLength) {
      soundEngine.playWrong();
      return;
    }

    setLoading(true);
    try {
      const playerId = StorageService.getPlayerId();
      const savedName = await OnlineService.registerPlayerName(trimmed, playerId);
      soundEngine.playClick();
      StorageService.savePlayerName(savedName);
      onSaveName(savedName);
    } catch (err: any) {
      soundEngine.playWrong();
      setErrorMsg(err.message || 'This name is already used, try another name');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="text-center space-y-3 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-fuchsia-500 to-amber-400 p-[2px] mx-auto shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <User className="w-8 h-8 text-cyan-400" />
            </div>
          </div>

          <h3 className="text-2xl font-extrabold text-white flex items-center justify-center gap-2">
            <span>Welcome Challenger</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Please choose a player name for your profile & online matches.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="player-name-input" className="text-xs font-bold uppercase font-mono text-slate-300">
                Player Name
              </label>
              <span className={`text-xs font-mono ${trimmed.length >= 3 && trimmed.length <= 12 ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
                {trimmed.length} / 12
              </span>
            </div>

            <div className="relative">
              <input
                id="player-name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setTouched(true);
                  if (errorMsg) setErrorMsg('');
                }}
                maxLength={16}
                placeholder="e.g. FlagMaster"
                autoFocus
                disabled={loading}
                className={`w-full px-4 py-3.5 rounded-2xl bg-slate-950 border text-white placeholder-slate-600 focus:outline-none transition-all font-medium text-base shadow-inner ${
                  (touched && !isValidLength) || errorMsg
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/50'
                    : 'border-slate-800 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30'
                }`}
              />

              {trimmed.length > 0 && isValidLength && !errorMsg && (
                <Check className="w-5 h-5 text-emerald-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
            </div>

            {/* Error Messages */}
            {errorMsg ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 mt-2.5 text-xs text-rose-400 font-bold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </motion.div>
            ) : touched && !isValidLength ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 mt-2.5 text-xs text-rose-400 font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Name must be <strong>between 3 and 12 characters</strong> long.
                </span>
              </motion.div>
            ) : null}

            <p className="text-[11px] text-slate-500 mt-2">
              Allowed: 3 to 12 characters. Your name will be saved locally.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {isDismissable && onClose && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onClose();
                }}
                className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={!isValidLength || loading}
              className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                isValidLength && !loading
                  ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 text-slate-950 hover:brightness-110 shadow-cyan-500/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
              id="submit-player-name-btn"
            >
              <span>{loading ? 'SAVING...' : initialName ? 'SAVE NAME' : 'START PLAYING'}</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
