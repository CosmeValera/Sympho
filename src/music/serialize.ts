import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { DURATIONS, canDot, measureTicks, valueTicks } from './duration'
import { INSTRUMENTS } from './instruments'
import { KEY_SIGNATURES, STEPS } from './pitch'
import { type Segment, buildMeasures, newId } from './score'
import type { Duration, NoteEvent, Pitch, Score, Step, TimeSignature } from './types'

export const TIME_SIGNATURES: TimeSignature[] = [
  { beats: 4, beatValue: 4 },
  { beats: 3, beatValue: 4 },
  { beats: 2, beatValue: 4 },
  { beats: 2, beatValue: 2 },
  { beats: 6, beatValue: 8 },
]

export const MIN_BPM = 30
export const MAX_BPM = 240

type Json = Record<string, unknown>

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, fallback: string, max = 120) => (typeof v === 'string' ? v.slice(0, max) : fallback)

function readPitch(v: unknown): Pitch | undefined {
  if (!isObject(v)) return undefined
  const { step, octave, alter } = v
  if (!STEPS.includes(step as Step)) return undefined
  if (!Number.isInteger(octave) || (octave as number) < 1 || (octave as number) > 8) return undefined
  const a = Number.isInteger(alter) ? Math.max(-2, Math.min(2, alter as number)) : 0
  return { step: step as Step, octave: octave as number, alter: a }
}

function readEvent(v: unknown): Omit<NoteEvent, 'id'> | undefined {
  if (!isObject(v)) return undefined
  const duration = v.duration as Duration
  if (!DURATIONS.includes(duration)) return undefined
  const dots = v.dots === 1 && canDot(duration) ? 1 : 0
  if (v.kind === 'rest') return { kind: 'rest', duration, dots }
  const pitch = readPitch(v.pitch)
  if (v.kind !== 'note' || !pitch) return undefined
  return { kind: 'note', duration, dots, pitch, tie: v.tie === true || undefined }
}

/**
 * Validates untrusted JSON (localStorage, share links) into a Score. Measures are
 * re-barred from scratch, so malformed timing can't break the editor.
 */
export function readScore(raw: unknown): Score | null {
  if (!isObject(raw) || !Array.isArray(raw.measures)) return null
  const tsRaw = isObject(raw.timeSignature) ? raw.timeSignature : {}
  const ts =
    TIME_SIGNATURES.find((t) => t.beats === tsRaw.beats && t.beatValue === tsRaw.beatValue) ??
    TIME_SIGNATURES[0]
  const cap = measureTicks(ts)

  const segments: Segment[] = []
  raw.measures.slice(0, 500).forEach((m, index) => {
    if (!isObject(m) || !Array.isArray(m.events)) return
    let pos = index * cap
    for (const e of m.events) {
      const event = readEvent(e)
      if (!event) continue
      const ticks = valueTicks(event)
      segments.push({ start: pos, ticks, kind: event.kind, pitch: event.pitch, tie: event.tie })
      pos += ticks
    }
  })

  const bpm = Number(raw.bpm)
  const instrument = INSTRUMENTS.find((i) => i.id === raw.instrument)?.id ?? 'piano'
  const keySignature = KEY_SIGNATURES.find((k) => k.id === raw.keySignature)?.id ?? 'C'
  return {
    v: 1,
    id: typeof raw.id === 'string' && /^[\w-]{1,40}$/.test(raw.id) ? raw.id : newId(),
    title: str(raw.title, 'Untitled'),
    composer: str(raw.composer, ''),
    instrument,
    keySignature,
    timeSignature: ts,
    bpm: Number.isFinite(bpm) ? Math.round(Math.max(MIN_BPM, Math.min(MAX_BPM, bpm))) : 100,
    measures: buildMeasures(segments, ts, Math.min(raw.measures.length, 500)),
    updatedAt: Number.isFinite(raw.updatedAt) ? (raw.updatedAt as number) : Date.now(),
  }
}

/** Score without event ids, which are regenerated on load: keeps share links short. */
function strip(score: Score): Json {
  return {
    ...score,
    measures: score.measures.map((m) => ({ events: m.events.map(({ id: _id, ...e }) => e) })),
  }
}

export function encodeShare(score: Score): string {
  return compressToEncodedURIComponent(JSON.stringify(strip(score)))
}

export function decodeShare(data: string): Score | null {
  try {
    const json = decompressFromEncodedURIComponent(data)
    if (!json) return null
    const score = readScore(JSON.parse(json))
    // A shared score is a fresh copy, never an overwrite of the recipient's own.
    return score && { ...score, id: newId() }
  } catch {
    return null
  }
}

export function timeSignatureLabel(ts: TimeSignature): string {
  return `${ts.beats}/${ts.beatValue}`
}

export function newScore(): Score {
  const timeSignature = TIME_SIGNATURES[0]
  return {
    v: 1,
    id: newId(),
    title: 'Untitled score',
    composer: '',
    instrument: 'piano',
    keySignature: 'C',
    timeSignature,
    bpm: 100,
    measures: buildMeasures([], timeSignature, 4),
    updatedAt: Date.now(),
  }
}
