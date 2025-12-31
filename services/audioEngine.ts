import { InstrumentType, Note } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;
  private globalPitchShift: number = 0;

  constructor() {
    // Initialize lazily
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      
      // Analyzer settings
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.5;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setGlobalPitchShift(semitones: number) {
    this.globalPitchShift = semitones;
  }

  private noteToFreq(note: string): number {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const regex = /^([a-gA-G])(#|b)?(\d)$/;
    const match = note.match(regex);
    if (!match) return 440;

    const key = match[1].toUpperCase() + (match[2] || '');
    const octave = parseInt(match[3], 10);
    
    let semitone = notes.indexOf(key);
    if (semitone === -1) semitone = 0;

    // Apply global pitch shift
    const n = (octave * 12 + semitone) + this.globalPitchShift;
    const a4 = 57; // A4 index relative to C0
    return 440 * Math.pow(2, (n - a4) / 12);
  }

  public playNote(note: Note, instrument: InstrumentType, bpm: number, when: number = 0) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Instrument shaping
    switch (instrument) {
      case InstrumentType.BASS:
        osc.type = 'sawtooth';
        break;
      case InstrumentType.PAD:
        osc.type = 'sine';
        break;
      case InstrumentType.PLUCK:
        osc.type = 'triangle';
        break;
      case InstrumentType.DRUMS:
        osc.type = 'square'; 
        if (note.pitch.includes("C2") || note.pitch.includes("C3")) osc.frequency.value = 60; // Kick approx
        break;
      case InstrumentType.SYNTH:
      default:
        osc.type = 'square';
        break;
    }

    if (instrument !== InstrumentType.DRUMS) {
       osc.frequency.value = this.noteToFreq(note.pitch);
    } else {
        // Simple drum frequency mapping
        if(parseInt(note.pitch.slice(-1)) < 3) osc.frequency.value = 60; // Kick
        else osc.frequency.value = 200; // Snare-ish
    }

    // Envelope
    const now = this.ctx.currentTime + when;
    const beatDuration = 60 / bpm;
    const durationSec = note.duration * beatDuration;

    gain.connect(this.masterGain);
    osc.connect(gain);

    // ADSR approximation
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(note.velocity * 0.5, now + 0.02); // Attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec); // Decay/Release

    osc.start(now);
    osc.stop(now + durationSec + 0.1);
  }

  public playSnippet(notes: Note[], instrument: InstrumentType, bpm: number) {
    notes.forEach(note => {
      const snippetLengthBeats = 4;
      const delayBeats = note.startTime * snippetLengthBeats; 
      const delaySeconds = delayBeats * (60/bpm);
      this.playNote(note, instrument, bpm, delaySeconds);
    });
  }
}

export const audioEngine = new AudioEngine();