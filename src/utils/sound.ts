/**
 * Web Audio API synthesizer for emergency sirens, tactical confirmation chirps, and warning beeps.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sirenOsc1: OscillatorNode | null = null;
  private sirenOsc2: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isSirenRunning: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.isSirenRunning) {
      this.stopSiren();
    }
  }

  playBeep(freq = 880, type: OscillatorType = 'sine', duration = 0.1, gainVal = 0.15) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playHoldTick(progress: number) {
    if (this.isMuted) return;
    const freq = 440 + progress * 600;
    this.playBeep(freq, 'triangle', 0.05, 0.08);
  }

  playArmedChirp() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.16); // D6

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Ignore
    }
  }

  playStandDownTone() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(659.25, now + 0.12);
      osc.frequency.setValueAtTime(440, now + 0.24);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Ignore
    }
  }

  startSiren() {
    if (this.isMuted || this.isSirenRunning) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      this.isSirenRunning = true;
      const now = this.ctx.currentTime;

      this.sirenOsc1 = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();

      this.sirenOsc1.type = 'sawtooth';
      this.sirenOsc1.frequency.setValueAtTime(700, now);

      // Modulate frequency like emergency siren
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(2.5, now); // 2.5 sweeps per second
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(400, now); // swing between 300 and 1100 Hz

      lfo.connect(this.sirenOsc1.frequency);
      lfo.start();

      this.sirenGain.gain.setValueAtTime(0.15, now);
      this.sirenOsc1.connect(this.sirenGain);
      this.sirenGain.connect(this.ctx.destination);

      this.sirenOsc1.start();
    } catch {
      // Audio context error
    }
  }

  stopSiren() {
    if (!this.isSirenRunning) return;
    try {
      if (this.sirenGain && this.ctx) {
        this.sirenGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      setTimeout(() => {
        if (this.sirenOsc1) {
          try {
            this.sirenOsc1.stop();
            this.sirenOsc1.disconnect();
          } catch {
            // Ignore
          }
          this.sirenOsc1 = null;
        }
        if (this.sirenOsc2) {
          try {
            this.sirenOsc2.stop();
            this.sirenOsc2.disconnect();
          } catch {
            // Ignore
          }
          this.sirenOsc2 = null;
        }
        this.isSirenRunning = false;
      }, 80);
    } catch {
      this.isSirenRunning = false;
    }
  }
}

export const soundEngine = new SoundEngine();
