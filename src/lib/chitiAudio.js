/**
 * CHITI TECHNOLOGIES UDS v3.0.0 — MULTI-SENSORY SACRED FEEDBACK
 * Programmatic synthetic audio synthesis (Web Audio API) & subtle mobile haptics.
 */

class ChitiSensory {
  constructor() {
    this.audioCtx = null;
  }

  initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
  }

  playTick() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.audioCtx.currentTime + 0.015);

      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.015);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.015);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(8);
      }
    } catch {
      // Gracefully ignore autoplay policies
    }
  }

  playBell() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.07, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.6);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch {
      // Gracefully ignore
    }
  }

  playSacredGong() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(108, now); // 108 Hz sacred base
      osc1.frequency.exponentialRampToValueAtTime(54, now + 2.5);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(216, now); // First harmonic
      osc2.frequency.exponentialRampToValueAtTime(108, now + 2.5);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.5);
      osc2.stop(now + 2.5);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([15, 30, 45]);
      }
    } catch {
      // Gracefully ignore
    }
  }

  playOmChant() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(136.1, now); // 136.1 Hz Cosmic OM frequency
      osc.frequency.linearRampToValueAtTime(136.5, now + 1.5);
      osc.frequency.exponentialRampToValueAtTime(130, now + 3.0);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.8);
      gain.gain.linearRampToValueAtTime(0.05, now + 2.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 3.0);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([20, 40, 80]);
      }
    } catch {
      // Gracefully ignore
    }
  }

  playConch() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      const now = this.audioCtx.currentTime;
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.6);
      osc.frequency.linearRampToValueAtTime(210, now + 2.0);
      osc.frequency.exponentialRampToValueAtTime(140, now + 2.8);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.4);
      gain.gain.linearRampToValueAtTime(0.06, now + 2.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 2.8);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 60, 100]);
      }
    } catch {
      // Gracefully ignore
    }
  }

  playFlowerDrop() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      const now = this.audioCtx.currentTime;
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.12);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(6);
      }
    } catch {
      // Gracefully ignore
    }
  }

  playDiya() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // A diya is lit with a soft breath of flame: a quiet filtered noise
      // "whoosh" (ignition) plus a warm A/E shimmer that gently flickers
      // three times before settling — bright but never harsh.
      const duration = 0.9;

      // 1) Ignition whoosh — short noise burst through a closing low-pass.
      const noiseLen = Math.max(1, Math.floor(this.audioCtx.sampleRate * 0.18));
      const noiseBuf = this.audioCtx.createBuffer(1, noiseLen, this.audioCtx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / noiseLen);

      const noiseSrc = this.audioCtx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      const noiseFilter = this.audioCtx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(900, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(250, now + 0.18);
      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.035, now + 0.05);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.audioCtx.destination);
      noiseSrc.start(now);
      noiseSrc.stop(now + 0.2);

      // 2) Flame shimmer — warm sine with three gentle flicker pulses.
      const osc = this.audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now); // E4
      osc.frequency.linearRampToValueAtTime(349, now + 0.15);
      osc.frequency.linearRampToValueAtTime(330, now + duration);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.06);
      // Flicker pulses at ~4 Hz — like a lamp catching the breeze.
      gain.gain.linearRampToValueAtTime(0.018, now + 0.25);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.38);
      gain.gain.linearRampToValueAtTime(0.015, now + 0.55);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.68);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + duration);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([8, 40, 8]);
      }
    } catch {
      // Gracefully ignore
    }
  }
}

export const chitiSensory = new ChitiSensory();
export const playBell = () => chitiSensory.playBell();
export const playTick = () => chitiSensory.playTick();
export const playConch = () => chitiSensory.playConch();
export const playSacredGong = () => chitiSensory.playSacredGong();
export const playOmChant = () => chitiSensory.playOmChant();
export const playFlowerDrop = () => chitiSensory.playFlowerDrop();
export const playDiya = () => chitiSensory.playDiya();
