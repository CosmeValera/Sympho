import { DURATIONS, valueTicks } from './duration'
import { parsePitch } from './pitch'
import { type Segment, buildMeasures } from './score'
import type { Duration, Measure, TimeSignature } from './types'

/**
 * Compact text notation used for the bundled examples and tests:
 * `C5:4` quarter C5, `F#4:8.` dotted eighth, `r:2` half rest, `G4:2~` tied.
 * Bar lines (`|`) are ignored; barring comes from the time signature.
 */
export function parseMusic(text: string, ts: TimeSignature): Measure[] {
  const segments: Segment[] = []
  let pos = 0
  for (const token of text.split(/\s+/)) {
    if (!token || token === '|') continue
    const m = /^([^:]+):(\d+)(\.?)(~?)$/.exec(token)
    if (!m || !DURATIONS.includes(m[2] as Duration)) throw new Error(`Bad token "${token}"`)
    const value = { duration: m[2] as Duration, dots: m[3] ? 1 : 0 } as const
    const ticks = valueTicks(value)
    if (m[1] === 'r') {
      segments.push({ start: pos, ticks, kind: 'rest' })
    } else {
      const pitch = parsePitch(m[1])
      if (!pitch) throw new Error(`Bad pitch "${m[1]}"`)
      segments.push({ start: pos, ticks, kind: 'note', pitch, tie: m[4] === '~' })
    }
    pos += ticks
  }
  return buildMeasures(segments, ts)
}
