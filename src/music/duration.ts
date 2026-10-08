import type { Duration, NoteEvent, TimeSignature } from './types'

/** One tick is a 32nd note, so every supported value is a whole number of ticks. */
export const TICKS_PER_WHOLE = 32

export const DURATIONS: Duration[] = ['1', '2', '4', '8', '16']

export const DURATION_TICKS: Record<Duration, number> = {
  '1': 32,
  '2': 16,
  '4': 8,
  '8': 4,
  '16': 2,
}

export const DURATION_NAMES: Record<Duration, string> = {
  '1': 'Whole',
  '2': 'Half',
  '4': 'Quarter',
  '8': 'Eighth',
  '16': 'Sixteenth',
}

export interface DurationValue {
  duration: Duration
  dots: 0 | 1
}

/** "quarter", "dotted half". */
export function valueName({ duration, dots }: DurationValue): string {
  const name = DURATION_NAMES[duration].toLowerCase()
  return dots ? `dotted ${name}` : name
}

/** "a quarter", "an eighth", "a dotted half": the name with its article. */
export function aValue(value: DurationValue): string {
  const name = valueName(value)
  return `${/^[aeiou]/.test(name) ? 'an' : 'a'} ${name}`
}

export function valueTicks({ duration, dots }: DurationValue): number {
  const base = DURATION_TICKS[duration]
  return dots ? base * 1.5 : base
}

export function eventTicks(event: NoteEvent): number {
  return valueTicks(event)
}

/** A dotted 16th would leave a 32nd-note gap, which the editor doesn't support. */
export function canDot(duration: Duration): boolean {
  return duration !== '16'
}

export function measureTicks(ts: TimeSignature): number {
  return (ts.beats * TICKS_PER_WHOLE) / ts.beatValue
}

export function isCompound(ts: TimeSignature): boolean {
  return ts.beatValue === 8 && ts.beats % 3 === 0 && ts.beats > 3
}

/** Ticks in one counted beat; compound meters count the dotted quarter. */
export function beatTicks(ts: TimeSignature): number {
  const unit = TICKS_PER_WHOLE / ts.beatValue
  return isCompound(ts) ? unit * 3 : unit
}

/** Seconds per tick at a tempo given in counted beats per minute. */
export function secondsPerTick(bpm: number, ts: TimeSignature): number {
  return 60 / bpm / beatTicks(ts)
}

const PLAIN: DurationValue[] = DURATIONS.map((duration) => ({ duration, dots: 0 }))
const DOTTED_COMPOUND: DurationValue[] = [{ duration: '2', dots: 1 }, { duration: '4', dots: 1 }]

/**
 * Splits `length` ticks starting `offset` ticks into a measure into notated values,
 * the way engravers write them. Rests start on a multiple of their own length and
 * only straddle beats when spanning whole beats; tied notes may also start on any
 * beat as long as they end on one (a half note on beat 2 of 3/4).
 */
export function decompose(
  offset: number,
  length: number,
  ts: TimeSignature,
  kind: 'note' | 'rest' = 'rest',
): DurationValue[] {
  const candidates = isCompound(ts)
    ? [...DOTTED_COMPOUND, ...PLAIN].sort((a, b) => valueTicks(b) - valueTicks(a))
    : PLAIN
  const beat = beatTicks(ts)
  const fitsGrid = (pos: number, ticks: number) => {
    const end = pos + ticks
    const onBeats = pos % beat === 0 && end % beat === 0
    if (kind === 'note' && onBeats) return true
    if (pos % ticks !== 0) return false
    const crossesBeat = Math.floor(pos / beat) !== Math.floor((end - 1) / beat)
    return !crossesBeat || onBeats
  }
  const out: DurationValue[] = []
  let pos = offset
  let left = length
  while (left > 0) {
    const pick =
      candidates.find((c) => valueTicks(c) <= left && fitsGrid(pos, valueTicks(c))) ??
      candidates.find((c) => valueTicks(c) <= left)
    if (!pick) throw new Error(`Cannot notate ${left} ticks`)
    out.push(pick)
    pos += valueTicks(pick)
    left -= valueTicks(pick)
  }
  return out
}

/** The value of exactly `ticks` length, if a single (possibly dotted) note can express it. */
export function exactValue(ticks: number): DurationValue | undefined {
  for (const duration of DURATIONS) {
    if (DURATION_TICKS[duration] === ticks) return { duration, dots: 0 }
    if (canDot(duration) && DURATION_TICKS[duration] * 1.5 === ticks) return { duration, dots: 1 }
  }
  return undefined
}
