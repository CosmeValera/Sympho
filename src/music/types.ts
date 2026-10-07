export type Duration = '1' | '2' | '4' | '8' | '16'

export type Step = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'

/** `alter` is the accidental in semitones: -2 double flat … +2 double sharp. */
export interface Pitch {
  step: Step
  octave: number
  alter: number
}

export interface NoteEvent {
  id: string
  kind: 'note' | 'rest'
  duration: Duration
  dots: 0 | 1
  pitch?: Pitch
  /** Tied to the following note (which must have the same pitch). */
  tie?: boolean
}

export interface Measure {
  events: NoteEvent[]
}

export interface TimeSignature {
  beats: number
  beatValue: number
}

export type Instrument = 'piano' | 'flute' | 'bass' | 'guitar'

export interface Score {
  v: 1
  id: string
  title: string
  composer: string
  instrument: Instrument
  keySignature: string
  timeSignature: TimeSignature
  bpm: number
  measures: Measure[]
  updatedAt: number
}
