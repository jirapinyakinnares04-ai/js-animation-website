/**
 * ============================================================================
 * ATELIER FORMA — Procedural Sound Synthesis Engine (Web Audio API)
 * Zero external MP3/WAV assets; pure mathematical acoustic resonance
 * ============================================================================
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.masterGain = null;
    this.pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C4, D4, E4, G4, A4, C5
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.init();
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.playChime(523.25, 0.4); // Welcome chime
    }
    return this.enabled;
  }

  /**
   * Delicate ceramic tap / click
   */
  playTap(pitch = 880) {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Harmonic Glass Chime for hover states
   */
  playHover(idx = 0) {
    if (!this.enabled || !this.ctx) return;
    const note = this.pentatonic[idx % this.pentatonic.length] * 2;
    this.playChime(note, 0.15, 0.08);
  }

  /**
   * Pure sinusoidal chime with exponential decay
   */
  playChime(freq, duration = 0.3, volume = 0.15) {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Swelling chord for mode / theme transitions
   */
  playTransitionChord() {
    if (!this.enabled || !this.ctx) return;
    const chord = [329.63, 392.00, 493.88, 659.25]; // E minor triad / seventh
    chord.forEach((freq, i) => {
      setTimeout(() => {
        this.playChime(freq, 0.6, 0.1);
      }, i * 60);
    });
  }

  /**
   * Fluid ripple pitch modulation
   */
  playRipple(speed = 1) {
    if (!this.enabled || !this.ctx) return;
    const freq = 400 + Math.min(speed * 30, 800);
    this.playChime(freq, 0.08, 0.05);
  }
}

// Global Sound instance
window.soundEngine = new SoundEngine();
