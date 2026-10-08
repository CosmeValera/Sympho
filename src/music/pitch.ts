import type { Pitch, Step } from './types'

export const STEPS: Step[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

const SEMITONES: Record<Step, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

export interface KeySignatureInfo {
  /** VexFlow key spec, also the stored value. */
  id: string
  label: string
  /** Positive for sharps, negative for flats. */
  accidentals: number
}

export const KEY_SIGNATURES: KeySignatureInfo[] = [
  { id: 'C', label: 'C major', accidentals: 0 },
  { id: 'Am', label: 'A minor', accidentals: 0 },
  { id: 'G', label: 'G major', accidentals: 1 },
  { id: 'Em', label: 'E minor', accidentals: 1 },
  { id: 'D', label: 'D major', accidentals: 2 },
  { id: 'Bm', label: 'B minor', accidentals: 2 },
  { id: 'A', label: 'A major', accidentals: 3 },
  { id: 'F#m', label: 'F♯ minor', accidentals: 3 },
  { id: 'F', label: 'F major', accidentals: -1 },
  { id: 'Dm', label: 'D minor', accidentals: -1 },
  { id: 'Bb', label: 'B♭ major', accidentals: -2 },
  { id: 'Gm', label: 'G minor', accidentals: -2 },
  { id: 'Eb', label: 'E♭ major', accidentals: -3 },
  { id: 'Cm', label: 'C minor', accidentals: -3 },
]

const SHARP_ORDER: Step[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
const FLAT_ORDER: Step[] = ['B', 'E', 'A', 'D', 'G', 'C', 'F']

/** The alteration the key signature applies to `step`. */
export function keyAlter(keySignature: string, step: Step): number {
  const count = KEY_SIGNATURES.find((k) => k.id === keySignature)?.accidentals ?? 0
  if (count > 0) return SHARP_ORDER.slice(0, count).includes(step) ? 1 : 0
  if (count < 0) return FLAT_ORDER.slice(0, -count).includes(step) ? -1 : 0
  return 0
}

/** Steps counted from C0, ignoring accidentals: the vertical position on a staff. */
export function diatonicIndex(p: Pitch): number {
  return p.octave * 7 + STEPS.indexOf(p.step)
}

export function fromDiatonic(index: number, keySignature: string): Pitch {
  const octave = Math.floor(index / 7)
  const step = STEPS[index - octave * 7]
  return { step, octave, alter: keyAlter(keySignature, step) }
}

export function toMidi(p: Pitch): number {
  return 12 * (p.octave + 1) + SEMITONES[p.step] + p.alter
}

const ALTER_ASCII: Record<number, string> = { [-2]: 'bb', [-1]: 'b', 0: '', 1: '#', 2: '##' }
const ALTER_GLYPH: Record<number, string> = { [-2]: '𝄫', [-1]: '♭', 0: '', 1: '♯', 2: '𝄪' }

/** VexFlow key, e.g. `f#/5`. */
export function toVexKey(p: Pitch): string {
  return `${p.step.toLowerCase()}${ALTER_ASCII[p.alter]}/${p.octave}`
}

/** Human label, e.g. `F♯5`. */
export function pitchLabel(p: Pitch): string {
  return `${p.step}${ALTER_GLYPH[p.alter]}${p.octave}`
}

/** Parses `C4`, `F#5`, `Bb3`, `C##4`, `Dbb4`. */
export function parsePitch(text: string): Pitch | undefined {
  const m = /^([A-Ga-g])(##|#|bb|b)?(-?\d)$/.exec(text)
  if (!m) return undefined
  const alter = { '##': 2, '#': 1, bb: -2, b: -1 }[m[2] ?? ''] ?? 0
  return { step: m[1].toUpperCase() as Step, octave: Number(m[3]), alter }
}

/** Pitch range the editor accepts: G3 to C7. */
export const LOWEST = diatonicIndex({ step: 'G', octave: 3, alter: 0 })
export const HIGHEST = diatonicIndex({ step: 'C', octave: 7, alter: 0 })

export function clampDiatonic(index: number): number {
  return Math.min(HIGHEST, Math.max(LOWEST, index))
}

/** Treble clef: the top staff line is F5. */
export const TREBLE_TOP_LINE = diatonicIndex({ step: 'F', octave: 5, alter: 0 })

/** Treble clef: the bottom staff line is E4. */
const TREBLE_BOTTOM_LINE = diatonicIndex({ step: 'E', octave: 4, alter: 0 })

/**
 * `step` in whichever octave lands closest to `reference`, as when typing
 * letters. Steps off the staff count half again, so near-ties go towards the
 * staff and a run of typed notes doesn't drift up onto ledger lines.
 */
export function nearestPitch(step: Step, reference: Pitch, keySignature: string): Pitch {
  const ref = diatonicIndex(reference)
  const base = STEPS.indexOf(step)
  const cost = (index: number) =>
    Math.abs(index - ref) + 0.5 * Math.max(0, TREBLE_BOTTOM_LINE - index, index - TREBLE_TOP_LINE)
  const candidates = [-1, 0, 1]
    .map((d) => base + 7 * (reference.octave + d))
    .filter((index) => index >= LOWEST && index <= HIGHEST)
  if (candidates.length === 0) return fromDiatonic(clampDiatonic(base + 7 * reference.octave), keySignature)
  const best = candidates.reduce((a, b) => (cost(b) < cost(a) ? b : a))
  return fromDiatonic(best, keySignature)
}

/** A chord's pitches lowest first, keeping one per staff position (the last given wins). */
export function chordOf(pitches: Pitch[]): Pitch[] {
  const byLine = new Map(pitches.map((p) => [diatonicIndex(p), p]))
  return [...byLine.entries()].sort(([a], [b]) => a - b).map(([, p]) => p)
}

/** Whether `chord` sounds `pitch` (enharmonics count). */
export function includesPitch(chord: Pitch[] | undefined, pitch: Pitch): boolean {
  return !!chord?.some((p) => toMidi(p) === toMidi(pitch))
}

/** Whether two notes or chords have a pitch in common, which a tie can carry over. */
export function sharesPitch(a: Pitch[] | undefined, b: Pitch[] | undefined): boolean {
  return !!a?.some((p) => includesPitch(b, p))
}

/**
 * `step` in the nearest octave above staff position `from` that `chord`
 * hasn't got yet, as when stacking a chord upwards. Null above the range.
 */
export function pitchAbove(step: Step, from: number, chord: Pitch[], keySignature: string): Pitch | null {
  const taken = new Set(chord.map(diatonicIndex))
  let index = from
  do index += (STEPS.indexOf(step) - (index % 7) + 7) % 7 || 7
  while (taken.has(index))
  return index <= HIGHEST ? fromDiatonic(index, keySignature) : null
}
