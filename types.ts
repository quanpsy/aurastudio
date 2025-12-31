export enum InstrumentType {
  SYNTH = 'SYNTH',
  BASS = 'BASS',
  DRUMS = 'DRUMS',
  PAD = 'PAD',
  PLUCK = 'PLUCK'
}

export interface Note {
  pitch: string; // e.g., "C4", "A#3"
  startTime: number; // 0.0 to 1.0 (relative to snippet duration)
  duration: number; // relative duration
  velocity: number; // 0.0 to 1.0
}

export interface Snippet {
  id: string;
  name: string;
  instrument: InstrumentType;
  notes: Note[];
  color: string;
  mathPattern: string; // Description of the math used (e.g., "Fibonacci Sequence")
  complexity: number; // 0-100
  isLocked: boolean; // If true, AI won't regenerate this unless explicitly asked
}

export interface Track {
  id: string;
  name: string;
  snippets: Snippet[];
  volume: number;
  muted: boolean;
}

export interface Composition {
  title: string;
  bpm: number;
  scale: string;
  timeSignature: string;
  globalPitchShift: number; // Semitones +/-
  tracks: Track[];
  lyrics?: string; // Optional lyrics for the composition
}

export interface MathVisData {
  name: string;
  value: number;
  ratio: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface HistoryItem {
  timestamp: number;
  description: string;
  state: Composition;
}