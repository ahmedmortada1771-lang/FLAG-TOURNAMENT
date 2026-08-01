class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private volume: number = 0.9;

  private musicEnabled: boolean = true;
  private musicVolume: number = 0.7;
  private bgmGain: GainNode | null = null;
  private bgmInterval: number | null = null;
  private isMusicPlaying: boolean = false;
  private currentStep: number = 0;
  private nextStepTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.ensureAudioRunning();
      };

      const events = ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'click', 'keydown'];
      events.forEach((evt) => {
        window.addEventListener(evt, unlockAudio, { passive: true });
        document.addEventListener(evt, unlockAudio, { passive: true });
      });

      // Try starting immediately on load
      this.ensureAudioRunning();
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  public ensureAudioRunning() {
    this.initCtx();
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          if (this.ctx) {
            this.nextStepTime = this.ctx.currentTime + 0.05;
          }
        }).catch(() => {});
      } else if (this.ctx.state === 'running') {
        if (this.nextStepTime < this.ctx.currentTime) {
          this.nextStepTime = this.ctx.currentTime + 0.05;
        }
      }
    }

    if (this.musicEnabled) {
      this.startMusic();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.bgmGain && this.ctx) {
      const targetGain = this.musicEnabled ? this.musicVolume * 0.35 : 0;
      this.bgmGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  public setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.bgmGain && this.ctx) {
      const targetGain = this.musicEnabled ? this.musicVolume * 0.35 : 0;
      this.bgmGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
  }

  public startMusic() {
    if (!this.musicEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (!this.bgmGain) {
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.connect(this.ctx.destination);
    }
    this.bgmGain.gain.setValueAtTime(this.musicEnabled ? this.musicVolume * 0.35 : 0, this.ctx.currentTime);

    if (this.nextStepTime < this.ctx.currentTime) {
      this.nextStepTime = this.ctx.currentTime + 0.05;
    }

    if (this.isMusicPlaying && this.bgmInterval !== null) return;
    this.isMusicPlaying = true;

    this.currentStep = 0;

    if (this.bgmInterval) window.clearInterval(this.bgmInterval);
    this.bgmInterval = window.setInterval(() => {
      this.scheduleMusicStep();
    }, 100);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.bgmInterval) {
      window.clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  private scheduleMusicStep() {
    if (!this.ctx || !this.isMusicPlaying || !this.bgmGain || !this.musicEnabled) return;

    if (this.ctx.state === 'suspended') {
      return;
    }

    if (this.nextStepTime < this.ctx.currentTime) {
      this.nextStepTime = this.ctx.currentTime + 0.05;
    }

    const tempo = 115; // BPM
    const stepDuration = 60 / tempo / 2; // 8th note duration (~0.26s)
    const scheduleAhead = 0.3; // Lookahead window

    while (this.nextStepTime < this.ctx.currentTime + scheduleAhead) {
      this.playSynthNoteForStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % 32;
    }
  }

  private playSynthNoteForStep(step: number, time: number) {
    if (!this.ctx || !this.bgmGain) return;

    const bar = Math.floor(step / 8);
    const stepInBar = step % 8;

    const chords = [
      { bass: 130.81, triad: [261.63, 329.63, 392.00, 493.88], arpeggio: [523.25, 659.25, 783.99, 987.77, 1046.50] }, // Cmaj7
      { bass: 110.00, triad: [220.00, 261.63, 329.63, 392.00], arpeggio: [440.00, 523.25, 659.25, 783.99, 880.00] },  // Am7
      { bass: 87.31,  triad: [174.61, 220.00, 261.63, 329.63], arpeggio: [349.23, 440.00, 523.25, 659.25, 698.46] },  // Fmaj7
      { bass: 98.00,  triad: [196.00, 246.94, 293.66, 349.23], arpeggio: [392.00, 493.88, 587.33, 698.46, 783.99] },  // G7
    ];

    const currentChord = chords[bar];

    // Bass note
    if (stepInBar === 0 || stepInBar === 4) {
      try {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(currentChord.bass, time);

        bassGain.gain.setValueAtTime(0, time);
        bassGain.gain.linearRampToValueAtTime(0.5, time + 0.03);
        bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

        bassOsc.connect(bassGain);
        bassGain.connect(this.bgmGain);

        bassOsc.start(time);
        bassOsc.stop(time + 0.45);
      } catch {
        // audio catch
      }
    }

    // Soft backing pad chord
    if (stepInBar === 0 || stepInBar === 4) {
      currentChord.triad.forEach((freq) => {
        try {
          if (!this.ctx || !this.bgmGain) return;
          const padOsc = this.ctx.createOscillator();
          const padGain = this.ctx.createGain();
          padOsc.type = 'triangle';
          padOsc.frequency.setValueAtTime(freq, time);

          padGain.gain.setValueAtTime(0, time);
          padGain.gain.linearRampToValueAtTime(0.18, time + 0.08);
          padGain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);

          padOsc.connect(padGain);
          padGain.connect(this.bgmGain);

          padOsc.start(time);
          padOsc.stop(time + 0.8);
        } catch {
          // audio catch
        }
      });
    }

    // Arpeggiated melody note
    const arpIndex = stepInBar % currentChord.arpeggio.length;
    const arpFreq = currentChord.arpeggio[arpIndex];

    try {
      const arpOsc = this.ctx.createOscillator();
      const arpGain = this.ctx.createGain();
      arpOsc.type = 'sine';
      arpOsc.frequency.setValueAtTime(arpFreq, time);

      arpGain.gain.setValueAtTime(0, time);
      arpGain.gain.linearRampToValueAtTime(0.25, time + 0.02);
      arpGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

      arpOsc.connect(arpGain);
      arpGain.connect(this.bgmGain);

      arpOsc.start(time);
      arpOsc.stop(time + 0.22);
    } catch {
      // audio catch
    }
  }

  public playClick() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Audio playback safety catch
    }
  }

  public playCorrect() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(this.volume * 0.5, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.25);
      });
    } catch {
      // Audio safety catch
    }
  }

  public playWrong() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);

      gain.gain.setValueAtTime(this.volume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Audio safety catch
    }
  }

  public playStreak() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

      gain.gain.setValueAtTime(this.volume * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Audio safety catch
    }
  }

  public playTick() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(900, now);

      gain.gain.setValueAtTime(this.volume * 0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // Audio safety catch
    }
  }

  public playVictory() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const fanfare = [
        { f: 523.25, d: 0.15 }, // C5
        { f: 659.25, d: 0.15 }, // E5
        { f: 783.99, d: 0.15 }, // G5
        { f: 1046.50, d: 0.4 }, // C6
      ];
      let offset = 0;
      const now = this.ctx.currentTime;

      fanfare.forEach((note) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, now + offset);

        gain.gain.setValueAtTime(0.01, now + offset);
        gain.gain.linearRampToValueAtTime(this.volume * 0.35, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + note.d);

        offset += note.d * 0.85;
      });
    } catch {
      // Audio safety catch
    }
  }

  public playGameOver() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [329.63, 293.66, 261.63, 220.00]; // E4, D4, C4, A3
      let offset = 0;

      notes.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + offset);

        gain.gain.setValueAtTime(this.volume * 0.3, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.25);

        offset += 0.2;
      });
    } catch {
      // Audio safety catch
    }
  }
}

export const soundEngine = new SoundEngine();
