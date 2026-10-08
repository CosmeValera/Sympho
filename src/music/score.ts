import {
  type DurationValue,
  canDot,
  decompose,
  eventTicks,
  exactValue,
  measureTicks,
  valueTicks,
} from './duration'
import { chordOf, clampDiatonic, diatonicIndex, fromDiatonic, includesPitch, sharesPitch } from './pitch'
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
  pitches?: Pitch[]
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
  /** Where typing should continue, when the edit knows better than the selection does. */
  cursor?: number
  /** Staff position of the chord note to select, when the edit moved or added one. */
  head?: number
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

/** Length of the whole piece, in ticks. */
export function scoreTicks(score: Score): number {
  return score.measures.length * measureTicks(score.timeSignature)
}

/** A pitch as heard: a note tied on sounds once, for the whole tied length. */
export interface Sounding {
  pitch: Pitch
  start: number
  ticks: number
}

/** Every pitch the score sounds, ties joined, for playback and MIDI. */
export function soundingNotes(score: Score): Sounding[] {
  const all = locateAll(score)
  const out: Sounding[] = []
  all.forEach(({ event, start }, i) => {
    const prev = all[i - 1]?.event
    for (const pitch of event.pitches ?? []) {
      // Held over from the previous note.
      if (prev?.tie && includesPitch(prev.pitches, pitch)) continue
      let ticks = eventTicks(event)
      for (let j = i; all[j].event.tie && includesPitch(all[j + 1]?.event.pitches, pitch); j++) ticks += eventTicks(all[j + 1].event)
      out.push({ pitch, start, ticks })
    }
  })
  return out
}

export function toSegments(score: Score): Segment[] {
  return locateAll(score).map(({ event, start }) => ({
    start,
    ticks: eventTicks(event),
    kind: event.kind,
    pitches: event.pitches,
    tie: event.tie,
    id: event.id,
  }))
}

function makeEvent(segment: Segment, value: DurationValue, id: string, tie: boolean): NoteEvent {
  if (segment.kind === 'rest') return { id, kind: 'rest', ...value }
  const event: NoteEvent = { id, kind: 'note', ...value, pitches: segment.pitches }
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

/** Drops ties that no longer lead into a note sharing one of their pitches. */
function fixTies(measures: Measure[]): Measure[] {
  const flat = measures.flatMap((m) => m.events)
  flat.forEach((event, i) => {
    if (!event.tie) return
    const next = flat[i + 1]
    if (!next || next.kind !== 'note' || !sharesPitch(event.pitches, next.pitches)) delete event.tie
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

/**
 * Writes `segment` at its start, overwriting what was there (the cut-off tail of
 * a note becomes rest). Typing continues where it ends, even if it was a rest
 * that merged into its neighbours.
 */
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
  return { ...result(rebuild(score, kept), id, segment.start), cursor: end }
}

/** Places a note (or a rest when `pitch` is null) of `value` starting at `tick`. */
export function placeAt(score: Score, tick: number, value: DurationValue, pitch: Pitch | null): EditResult {
  return writeSegment(score, {
    start: tick,
    ticks: valueTicks(value),
    kind: pitch ? 'note' : 'rest',
    pitches: pitch ? [pitch] : undefined,
  })
}

/**
 * Tick where typed notes go for a selection: after a selected note, at the start
 * of a selected rest (to fill it), else after the last note.
 */
export function entryTick(score: Score, selectedId: string | null): number {
  const all = locateAll(score)
  const selected = all.find((l) => l.event.id === selectedId)
  if (selected) return selected.event.kind === 'rest' ? selected.start : selected.start + eventTicks(selected.event)
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
    pitches: event.pitches,
    tie: event.tie,
    id,
  })
}

export function toggleDot(score: Score, id: string): EditResult {
  const found = locate(score, id)
  // A rest is just the gap before the next note, so dotting one would change nothing.
  if (!found || found.event.kind === 'rest' || !canDot(found.event.duration)) return { score, selectedId: id }
  return setValue(score, id, { duration: found.event.duration, dots: found.event.dots ? 0 : 1 })
}

function mapEvent(score: Score, id: string, fn: (e: NoteEvent) => NoteEvent): Score {
  const measures = score.measures.map((m) => ({
    events: m.events.map((e) => (e.id === id ? fn(e) : { ...e })),
  }))
  return { ...score, measures: fixTies(measures) }
}

function setPitches(score: Score, id: string, pitches: Pitch[]): EditResult {
  const next = mapEvent(score, id, (e) => ({ ...e, kind: 'note', pitches }))
  return { score: next, selectedId: id }
}

/**
 * Staff position of a chord's selected note: `head` if the chord has a note
 * there, else its top note. A single note is its own head.
 */
export function headOf(pitches: Pitch[], head?: number | null): number {
  const lines = pitches.map(diatonicIndex)
  return head != null && lines.includes(head) ? head : lines[lines.length - 1]
}

/**
 * Moves a note (in a chord, the note at `head`) by diatonic steps, taking the
 * key signature's accidental. A whole octave keeps the note's own accidental,
 * so F♯ stays F♯ in C major. It steps over the chord's other notes.
 */
export function moveSteps(score: Score, id: string, steps: number, head?: number | null): EditResult {
  const pitches = locate(score, id)?.event.pitches
  if (!pitches) return { score, selectedId: id }
  const from = headOf(pitches, head)
  const pitch = pitches.find((p) => diatonicIndex(p) === from)!
  const others = new Set(pitches.map(diatonicIndex).filter((line) => line !== from))
  let index = clampDiatonic(from + steps)
  while (others.has(index)) index += Math.sign(steps)
  if (index === from || index !== clampDiatonic(index)) return { score, selectedId: id }
  const moved = (index - from) % 7 === 0 ? { ...pitch, octave: pitch.octave + (index - from) / 7 } : fromDiatonic(index, score.keySignature)
  return { ...setPitches(score, id, chordOf([...pitches.filter((p) => p !== pitch), moved])), head: index }
}

/** Sets the accidental of a note, or of the chord note at `head`. */
export function setAlter(score: Score, id: string, alter: number, head?: number | null): EditResult {
  const pitches = locate(score, id)?.event.pitches
  if (!pitches) return { score, selectedId: id }
  const line = headOf(pitches, head)
  const clamped = Math.max(-2, Math.min(2, alter))
  const pitch = pitches.find((p) => diatonicIndex(p) === line)!
  if (pitch.alter === clamped) return { score, selectedId: id }
  return { ...setPitches(score, id, pitches.map((p) => (p === pitch ? { ...p, alter: clamped } : p))), head: line }
}

/** Adds `pitch` to a note, making or growing a chord. A staff position the chord already has stays as it is. */
export function addPitch(score: Score, id: string, pitch: Pitch): EditResult {
  const pitches = locate(score, id)?.event.pitches
  const line = diatonicIndex(pitch)
  if (!pitches) return { score, selectedId: id }
  if (pitches.some((p) => diatonicIndex(p) === line)) return { score, selectedId: id, head: line }
  return { ...setPitches(score, id, chordOf([...pitches, pitch])), head: line }
}

/** Deletes the note at `head` from a chord; a single note becomes a rest. */
export function removeNote(score: Score, id: string, head?: number | null): EditResult {
  const pitches = locate(score, id)?.event.pitches
  if (!pitches || pitches.length < 2) return toRest(score, id)
  const line = headOf(pitches, head)
  return setPitches(score, id, pitches.filter((p) => diatonicIndex(p) !== line))
}

/** Turns a note into a rest; typing then writes where the note was. */
export function toRest(score: Score, id: string): EditResult {
  const found = locate(score, id)
  if (!found || found.event.kind === 'rest') return { score, selectedId: id }
  const segments = toSegments(score).map((s) =>
    s.id === id ? { start: s.start, ticks: s.ticks, kind: 'rest' as const, id } : s,
  )
  return { ...result(rebuild(score, segments), id, found.start), cursor: found.start }
}

/**
 * Ties the selected note or chord to the next one. If the next event shares no
 * pitch with it, a copy of the same pitches and value is written there first.
 */
export function toggleTie(score: Score, id: string): EditResult {
  const all = locateAll(score)
  const index = all.findIndex((l) => l.event.id === id)
  const current = all[index]
  if (!current || current.event.kind !== 'note' || !current.event.pitches) return { score, selectedId: id }
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
  if (!next || next.event.kind !== 'note' || !sharesPitch(next.event.pitches, current.event.pitches)) {
    const ticks = eventTicks(current.event)
    base = writeSegment(score, { start: current.start + ticks, ticks, kind: 'note', pitches: current.event.pitches }).score
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
