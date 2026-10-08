import {
  type DurationValue,
  canDot,
  decompose,
  eventTicks,
  exactValue,
  measureTicks,
  valueTicks,
} from './duration'
import { clampDiatonic, diatonicIndex, fromDiatonic, samePitch } from './pitch'
import type { Measure, NoteEvent, Pitch, Score, TimeSignature } from './types'

let counter = 0
export function newId(): string {
  counter = (counter + 1) % 1296
  return `e${Math.random().toString(36).slice(2, 8)}${counter.toString(36)}`
}

/** An event placed on the absolute timeline, in ticks from the start of the piece. */
export interface Segment {
  start: number
  ticks: number
  kind: 'note' | 'rest'
  pitch?: Pitch
  tie?: boolean
  id?: string
}

export interface Located {
  event: NoteEvent
  start: number
  measureIndex: number
}

export interface EditResult {
  score: Score
  selectedId: string | null
}

export function locateAll(score: Score): Located[] {
  const cap = measureTicks(score.timeSignature)
  const out: Located[] = []
  score.measures.forEach((measure, measureIndex) => {
    let pos = measureIndex * cap
    for (const event of measure.events) {
      out.push({ event, start: pos, measureIndex })
      pos += eventTicks(event)
    }
  })
  return out
}

export function locate(score: Score, id: string | null): Located | undefined {
  if (!id) return undefined
  return locateAll(score).find((l) => l.event.id === id)
}

/** The event sounding (or resting) at `tick`. */
export function eventAt(score: Score, tick: number): Located | undefined {
  return locateAll(score).find((l) => l.start <= tick && tick < l.start + eventTicks(l.event))
}

/** Start of the event covering `tick`, or 0 when `tick` is past the end. */
export function eventStart(score: Score, tick: number): number {
  return eventAt(score, tick)?.start ?? 0
}

export function toSegments(score: Score): Segment[] {
  return locateAll(score).map(({ event, start }) => ({
    start,
    ticks: eventTicks(event),
    kind: event.kind,
    pitch: event.pitch,
    tie: event.tie,
    id: event.id,
  }))
}

function makeEvent(segment: Segment, value: DurationValue, id: string, tie: boolean): NoteEvent {
  if (segment.kind === 'rest') return { id, kind: 'rest', ...value }
  const event: NoteEvent = { id, kind: 'note', ...value, pitch: segment.pitch }
  if (tie) event.tie = true
  return event
}

/**
 * Turns timeline segments back into measures: fills gaps with rests, merges
 * neighbouring rests, splits anything crossing a barline into tied notes, and
 * keeps at least `minMeasures` measures.
 */
export function buildMeasures(segments: Segment[], ts: TimeSignature, minMeasures = 1): Measure[] {
  const cap = measureTicks(ts)
  const sorted = [...segments].sort((a, b) => a.start - b.start)

  // Lay segments end to end, later segments losing any part that overlaps an earlier one.
  const laid: Segment[] = []
  let cursor = 0
  for (const seg of sorted) {
    let { start, ticks } = seg
    if (start < cursor) {
      ticks -= cursor - start
      start = cursor
    }
    if (ticks <= 0) continue
    if (start > cursor) laid.push({ start: cursor, ticks: start - cursor, kind: 'rest' })
    laid.push({ ...seg, start, ticks })
    cursor = start + ticks
  }

  const count = Math.max(minMeasures, 1, Math.ceil(cursor / cap))
  if (cursor < count * cap) laid.push({ start: cursor, ticks: count * cap - cursor, kind: 'rest' })

  const merged: Segment[] = []
  for (const seg of laid) {
    const prev = merged[merged.length - 1]
    if (prev && prev.kind === 'rest' && seg.kind === 'rest') prev.ticks += seg.ticks
    else merged.push({ ...seg })
  }

  const measures: Measure[] = Array.from({ length: count }, () => ({ events: [] }))
  for (const seg of merged) {
    let pos = seg.start
    const end = seg.start + seg.ticks
    let first = true
    while (pos < end) {
      const measureIndex = Math.floor(pos / cap)
      const offset = pos - measureIndex * cap
      const pieceEnd = Math.min(end, (measureIndex + 1) * cap)
      const length = pieceEnd - pos
      const whole = pos === seg.start && pieceEnd === end
      const exact = seg.kind === 'note' && whole ? exactValue(length) : undefined
      const values = exact ? [exact] : decompose(offset, length, ts, seg.kind)
      values.forEach((value, i) => {
        const id = first && seg.id ? seg.id : newId()
        first = false
        const lastOfSegment = pieceEnd === end && i === values.length - 1
        const tie = lastOfSegment ? !!seg.tie : true
        measures[measureIndex].events.push(makeEvent(seg, value, id, tie))
      })
      pos = pieceEnd
    }
  }
  return fixTies(measures)
}

/** Drops ties that no longer lead into a note of the same pitch. */
function fixTies(measures: Measure[]): Measure[] {
  const flat = measures.flatMap((m) => m.events)
  flat.forEach((event, i) => {
    if (!event.tie) return
    const next = flat[i + 1]
    if (!next || next.kind !== 'note' || !samePitch(event.pitch, next.pitch)) delete event.tie
  })
  return measures
}

function rebuild(score: Score, segments: Segment[], minMeasures = score.measures.length): Score {
  return { ...score, measures: buildMeasures(segments, score.timeSignature, minMeasures) }
}

/** Result whose selection falls back to whatever now occupies `tick` if `id` was merged away. */
function result(score: Score, id: string | null, tick: number): EditResult {
  if (id && locate(score, id)) return { score, selectedId: id }
  return { score, selectedId: eventAt(score, tick)?.event.id ?? null }
}

/** Writes `segment` at its start, overwriting what was there (the cut-off tail of a note becomes rest). */
export function writeSegment(score: Score, segment: Segment): EditResult {
  const end = segment.start + segment.ticks
  const kept: Segment[] = []
  for (const s of toSegments(score)) {
    const sEnd = s.start + s.ticks
    if (sEnd <= segment.start || s.start >= end) {
      kept.push(s)
      continue
    }
    if (s.start < segment.start) kept.push({ ...s, ticks: segment.start - s.start, tie: false })
    if (sEnd > end) kept.push({ start: end, ticks: sEnd - end, kind: 'rest' })
  }
  const id = segment.id ?? newId()
  kept.push({ ...segment, id })
  return result(rebuild(score, kept), id, segment.start)
}

/** Places a note (or a rest when `pitch` is null) of `value` starting at `tick`. */
export function placeAt(score: Score, tick: number, value: DurationValue, pitch: Pitch | null): EditResult {
  return writeSegment(score, {
    start: tick,
    ticks: valueTicks(value),
    kind: pitch ? 'note' : 'rest',
    pitch: pitch ?? undefined,
  })
}

/** Tick where typed notes go: after the selection, else after the last note. */
export function entryTick(score: Score, selectedId: string | null): number {
  const all = locateAll(score)
  const selected = all.find((l) => l.event.id === selectedId)
  if (selected) return selected.start + eventTicks(selected.event)
  const lastNote = all.filter((l) => l.event.kind === 'note').pop()
  return lastNote ? lastNote.start + eventTicks(lastNote.event) : 0
}

export function setValue(score: Score, id: string, value: DurationValue): EditResult {
  const found = locate(score, id)
  if (!found) return { score, selectedId: id }
  const { event, start } = found
  return writeSegment(score, {
    start,
    ticks: valueTicks(value),
    kind: event.kind,
    pitch: event.pitch,
    tie: event.tie,
    id,
  })
}

export function toggleDot(score: Score, id: string): EditResult {
  const found = locate(score, id)
  if (!found || !canDot(found.event.duration)) return { score, selectedId: id }
  return setValue(score, id, { duration: found.event.duration, dots: found.event.dots ? 0 : 1 })
}

function mapEvent(score: Score, id: string, fn: (e: NoteEvent) => NoteEvent): Score {
  const measures = score.measures.map((m) => ({
    events: m.events.map((e) => (e.id === id ? fn(e) : { ...e })),
  }))
  return { ...score, measures: fixTies(measures) }
}

export function setPitch(score: Score, id: string, pitch: Pitch): EditResult {
  const next = mapEvent(score, id, (e) => ({ ...e, kind: 'note', pitch }))
  return { score: next, selectedId: id }
}

/** Moves a note by diatonic steps, taking the key signature's accidental. */
export function moveSteps(score: Score, id: string, steps: number): EditResult {
  const found = locate(score, id)
  if (!found?.event.pitch) return { score, selectedId: id }
  const index = clampDiatonic(diatonicIndex(found.event.pitch) + steps)
  return setPitch(score, id, fromDiatonic(index, score.keySignature))
}

export function setAlter(score: Score, id: string, alter: number): EditResult {
  const found = locate(score, id)
  if (!found?.event.pitch) return { score, selectedId: id }
  const clamped = Math.max(-2, Math.min(2, alter))
  return setPitch(score, id, { ...found.event.pitch, alter: clamped })
}

export function toRest(score: Score, id: string): EditResult {
  const found = locate(score, id)
  if (!found || found.event.kind === 'rest') return { score, selectedId: id }
  const segments = toSegments(score).map((s) =>
    s.id === id ? { start: s.start, ticks: s.ticks, kind: 'rest' as const, id } : s,
  )
  return result(rebuild(score, segments), id, found.start)
}

/**
 * Ties the selected note to the next one. If the next event isn't the same
 * pitch, a note of the same pitch and value is written there first.
 */
export function toggleTie(score: Score, id: string): EditResult {
  const all = locateAll(score)
  const index = all.findIndex((l) => l.event.id === id)
  const current = all[index]
  if (!current || current.event.kind !== 'note' || !current.event.pitch) return { score, selectedId: id }
  if (current.event.tie) {
    const untied = mapEvent(score, id, (e) => {
      const copy = { ...e }
      delete copy.tie
      return copy
    })
    return { score: untied, selectedId: id }
  }

  const next = all[index + 1]
  let base = score
  if (!next || next.event.kind !== 'note' || !samePitch(next.event.pitch, current.event.pitch)) {
    base = placeAt(
      score,
      current.start + eventTicks(current.event),
      { duration: current.event.duration, dots: current.event.dots },
      current.event.pitch,
    ).score
  }
  return { score: mapEvent(base, id, (e) => ({ ...e, tie: true })), selectedId: id }
}

export function emptyMeasure(ts: TimeSignature): Measure {
  return {
    events: decompose(0, measureTicks(ts), ts).map((value) => ({ id: newId(), kind: 'rest', ...value })),
  }
}

export function addMeasure(score: Score): Score {
  return { ...score, measures: [...score.measures, emptyMeasure(score.timeSignature)] }
}

export function removeLastMeasure(score: Score): Score {
  if (score.measures.length <= 1) return score
  const measures = score.measures.slice(0, -1).map((m) => ({ events: m.events.map((e) => ({ ...e })) }))
  return { ...score, measures: fixTies(measures) }
}

/** Re-bars the whole piece in a new meter, keeping every note's timing. */
export function setTimeSignature(score: Score, ts: TimeSignature): Score {
  return { ...score, timeSignature: ts, measures: buildMeasures(toSegments(score), ts) }
}
