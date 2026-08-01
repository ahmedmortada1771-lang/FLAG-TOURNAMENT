import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameSettings } from '../types';
import { soundEngine } from '../services/audio';
import { StorageService } from '../services/storage';
import { X, Settings, Volume2, VolumeX, Music, Keyboard, Smartphone, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onResetData: () => void;
  playerName: string;
  onEditName: () => void;
}

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetData,
  playerName,
  onEditName,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 max-w-md w-full text-white shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-500/30 text-cyan-400">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold">Settings</h3>
                <p className="text-xs text-slate-400 font-mono">Audio & Controls</p>
              </div>
            </div>

            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              id="close-settings-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Settings Options */}
          <div className="space-y-4">
            {/* Player Name Row */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <h4 className="font-bold text-sm text-white">Player Profile Name</h4>
                <p className="text-[11px] text-cyan-300 font-mono">{playerName || 'Not Set'}</p>
              </div>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  onClose();
                  onEditName();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-400 border border-slate-700 transition-all"
                id="edit-name-settings-btn"
              >
                Change Name
              </button>
            </div>

            {/* Background Music Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <Music className={`w-5 h-5 ${settings.musicEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
                <div>
                  <h4 className="font-bold text-sm">Background Music</h4>
                  <p className="text-[11px] text-slate-400">Ambient gaming synth soundtrack</p>
                </div>
              </div>

              <button
                onClick={() => {
                  const updated = { ...settings, musicEnabled: !settings.musicEnabled };
                  soundEngine.setMusicEnabled(updated.musicEnabled);
                  onUpdateSettings(updated);
                  soundEngine.playClick();
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                  settings.musicEnabled ? 'bg-amber-500' : 'bg-slate-800'
                }`}
                id="toggle-music-btn"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                    settings.musicEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Background Music Volume Slider */}
            {settings.musicEnabled && (
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Music Volume</span>
                  <span className="text-amber-400 font-bold">{Math.round((settings.musicVolume ?? 0.7) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.musicVolume ?? 0.7}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    soundEngine.setMusicVolume(vol);
                    onUpdateSettings({ ...settings, musicVolume: vol });
                  }}
                  className="w-full accent-amber-400 bg-slate-800 rounded-lg cursor-pointer h-2"
                  id="music-volume-slider"
                />
              </div>
            )}

            {/* Sound FX Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
                <div>
                  <h4 className="font-bold text-sm">Sound Effects</h4>
                  <p className="text-[11px] text-slate-400">WebAudio synthesized sound FX</p>
                </div>
              </div>

              <button
                onClick={() => {
                  const updated = { ...settings, soundEnabled: !settings.soundEnabled };
                  soundEngine.setSoundEnabled(updated.soundEnabled);
                  onUpdateSettings(updated);
                  soundEngine.playClick();
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                  settings.soundEnabled ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
                id="toggle-sound-btn"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sound Effects Volume Slider */}
            {settings.soundEnabled && (
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Sound Effects Volume</span>
                  <span className="text-cyan-400 font-bold">{Math.round(settings.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.volume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    soundEngine.setVolume(vol);
                    onUpdateSettings({ ...settings, volume: vol });
                  }}
                  className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-2"
                  id="volume-slider"
                />
              </div>
            )}

            {/* Keyboard Shortcuts Info */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h4 className="font-bold text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                <Keyboard className="w-4 h-4 text-cyan-400" />
                <span>Keyboard Shortcuts</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-cyan-400 font-bold">Keys 1 - 4:</span> Select Choice
                </div>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-cyan-400 font-bold">Esc Key:</span> Pause Game
                </div>
              </div>
            </div>

            {/* Reset Data */}
            <div className="pt-2">
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="w-full py-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-900/60 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  id="reset-stats-btn"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reset All Local Game Data</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500 text-center space-y-3">
                  <p className="text-xs font-bold text-rose-200">Are you sure? This deletes high scores & achievements.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="flex-1 py-2 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        StorageService.resetStats();
                        onResetData();
                        setConfirmReset(false);
                        onClose();
                      }}
                      className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
                    >
                      Confirm Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
