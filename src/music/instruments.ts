import type { Instrument } from './types'

export interface InstrumentInfo {
  id: Instrument
  label: string
  /** General MIDI program for exports. */
  program: number
  /** Semitones between written and sounding pitch: guitar and bass sound lower than written, as on the real instruments. */
  transpose: number
}

export const INSTRUMENTS: InstrumentInfo[] = [
  { id: 'piano', label: 'Piano', program: 0, transpose: 0 },
  { id: 'flute', label: 'Flute', program: 73, transpose: 0 },
  { id: 'guitar', label: 'Guitar', program: 24, transpose: -12 },
  { id: 'bass', label: 'Synth bass', program: 38, transpose: -24 },
]

export function instrumentInfo(id: Instrument): InstrumentInfo {
  return INSTRUMENTS.find((i) => i.id === id) ?? INSTRUMENTS[0]
}
