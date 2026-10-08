import '@vexflow-fonts/academico/index.css'
import '@vexflow-fonts/bravura/index.css'
import {
  Accidental,
  BarlineType,
  Beam,
  Dot,
  Formatter,
  Metrics,
  MetricsDefaults,
  Renderer,
  Stave,
  StaveNote,
  StaveTie,
  VexFlow,
  Voice,
} from 'vexflow/core'
import { eventTicks, measureTicks } from '../music/duration'
import { diatonicIndex, toMidi, toVexKey } from '../music/pitch'
import type { Duration, NoteEvent, Score } from '../music/types'
import { MARGIN, type Placed, breakRows, fitScale } from './layout'

let fontsReady: Promise<void> | undefined

/** Resolves once Bravura is usable; VexFlow measures glyphs, so drawing earlier misplaces them. */
export function loadMusicFonts(): Promise<void> {
  fontsReady ??= Promise.all([
    document.fonts.load('30px Bravura'),
    document.fonts.load('12px Academico'),
  ]).then(() => {
    VexFlow.setFonts('Bravura', 'Academico')
    // Stems and staff lines default to fixed greys and black; make them follow the theme like everything else.
    MetricsDefaults.Stem.strokeStyle = 'currentColor'
    MetricsDefaults.Stave.strokeStyle = 'currentColor'
    Metrics.clear()
  })
  return fontsReady
}

export interface EventBox {
  /** Null for the ghost measure's placeholder rest. */
  id: string | null
  tick: number
  /** Horizontal hit range and the note's centre, in layout units. */
  x0: number
  x1: number
  cx: number
  /** Left edge of the note including its accidental, where the playback marker sits. */
  left: number
}

export interface MeasureBox {
  index: number
  x: number
  y: number
  width: number
  topLineY: number
  spacing: number
  ghost: boolean
  /** Shown as one centred whole rest; new notes land at its start. */
  fullRest: boolean
  noteStartX: number
  events: EventBox[]
}

export interface ScoreLayout {
  /** CSS pixels per layout unit. */
  scale: number
  width: number
  height: number
  measures: MeasureBox[]
}

export interface RenderOptions {
  /** Available width in CSS pixels. */
  width: number
  /** Preferred CSS pixels per layout unit; drawn smaller if the widest bar would not fit `width`. */
  scale?: number
  /** Draw a faint extra measure to click into. */
  ghostMeasure?: boolean
  /** Print title and composer above the music (exports). */
  header?: boolean
  maxRows?: number
}

export const ROW_HEIGHT = 124
export const STAVE_OFFSET = 4
const HEADER_HEIGHT = 74

/** Id VexFlow gives the notehead of a chord's note at staff position `line`; the SVG element is `vf-<headId>`. */
export function headId(eventId: string, line: number): string {
  return `${eventId}-${line}`
}

function restKey(duration: Duration): string {
  return duration === '1' ? 'd/5' : 'b/4'
}

function makeNote(event: NoteEvent): StaveNote {
  const rest = event.kind === 'rest' || !event.pitches
  const note = new StaveNote({
    keys: rest ? [restKey(event.duration)] : event.pitches!.map(toVexKey),
    duration: `${event.duration}${rest ? 'r' : ''}`,
    dots: event.dots,
    autoStem: !rest,
  })
  if (event.dots) Dot.buildAndAttach([note], { all: true })
  note.setAttribute('id', event.id)
  return note
}

/**
 * Engraves `score` into `container` as SVG and returns where every measure and
 * event landed, for hit testing. Colours are `currentColor`, so CSS themes it.
 */
export function renderScore(container: HTMLElement, score: Score, options: RenderOptions): ScoreLayout {
  const scale = fitScale(score.measures, score.keySignature, options.width, options.scale ?? 1)
  const width = options.width / scale
  const available = width - MARGIN * 2
  const ts = score.timeSignature
  const tsLabel = `${ts.beats}/${ts.beatValue}`
  const cap = measureTicks(ts)

  const placed: Placed[] = score.measures.map((measure, index) => ({
    index,
    measure,
    ghost: false,
    rowStart: false,
    natural: 0,
  }))
  if (options.ghostMeasure) {
    placed.push({ index: placed.length, measure: { events: [{ id: '', kind: 'rest', duration: '1', dots: 0 }] }, ghost: true, rowStart: false, natural: 0 })
  }
  let rows = breakRows(placed, available, score.keySignature)
  if (options.maxRows) rows = rows.slice(0, options.maxRows)

  const top = options.header ? HEADER_HEIGHT : 8
  const height = top + rows.length * ROW_HEIGHT + 10

  container.replaceChildren()
  const renderer = new Renderer(container as HTMLDivElement, Renderer.Backends.SVG)
  renderer.resize(width, height)
  const ctx = renderer.getContext()
  ctx.setFillStyle('currentColor')
  ctx.setStrokeStyle('currentColor')
  const svg = container.querySelector('svg')!
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  svg.setAttribute('width', String(width * scale))
  svg.setAttribute('height', String(height * scale))
  svg.style.width = `${width * scale}px`
  svg.style.height = `${height * scale}px`

  if (options.header) {
    ctx.setFont('Academico', 24, 'bold')
    const title = score.title || 'Untitled score'
    ctx.fillText(title, (width - ctx.measureText(title).width) / 2, 38)
    if (score.composer) {
      ctx.setFont('Academico', 13)
      ctx.fillText(score.composer, width - MARGIN - ctx.measureText(score.composer).width, 62)
    }
  }

  const layout: ScoreLayout = { scale, width, height, measures: [] }
  const staveNotes = new Map<string, { note: StaveNote; row: number }>()
  const lastReal = score.measures.length - 1

  rows.forEach((row, rowIndex) => {
    const natural = row.reduce((sum, m) => sum + m.natural, 0)
    const isLast = rowIndex === rows.length - 1
    // A short final row keeps its natural spacing instead of being stretched thin.
    const stretch = isLast && natural < available * 0.65 ? 1 : available / natural
    const y = top + rowIndex * ROW_HEIGHT + STAVE_OFFSET
    let x = MARGIN

    if (row[0].index > 0) {
      ctx.setFont('Academico', 10, 'italic')
      ctx.fillText(String(row[0].index + 1), x, y + 30)
    }

    for (const m of row) {
      const w = m.natural * stretch
      if (m.ghost) ctx.openGroup('ghost')
      const stave = new Stave(x, y, w)
      if (m.rowStart) stave.addClef('treble').addKeySignature(score.keySignature)
      if (m.index === 0) stave.addTimeSignature(tsLabel)
      if (m.index === lastReal && !options.ghostMeasure) stave.setEndBarType(BarlineType.END)
      stave.setContext(ctx).draw()

      // An empty bar shows one centred whole rest whatever the meter, standing in for all its rests.
      const fullRest = m.measure.events.every((e) => e.kind === 'rest')
      const events = fullRest ? m.measure.events.slice(0, 1) : m.measure.events
      const notes = fullRest
        ? [new StaveNote({ keys: ['d/5'], duration: '1r', alignCenter: true }).setAttribute('id', events[0].id)]
        : events.map(makeNote)

      const voice = new Voice({ numBeats: ts.beats, beatValue: ts.beatValue })
        .setMode(Voice.Mode.SOFT)
        .addTickables(notes)
      Accidental.applyAccidentals([voice], score.keySignature)
      const beams = fullRest ? [] : Beam.generateBeams(notes, { groups: Beam.getDefaultBeamGroups(tsLabel) })
      new Formatter().joinVoices([voice]).formatToStave([voice], stave)
      // Ids for each notehead so a chord's selected note can be highlighted. Set after
      // formatting: VexFlow rebuilds the noteheads if it has to move a key.
      if (!fullRest && !m.ghost) {
        events.forEach((event, i) =>
          event.pitches?.forEach((p, k) => notes[i].noteHeads[k].setAttribute('id', headId(event.id, diatonicIndex(p)))),
        )
      }
      voice.draw(ctx, stave)
      for (const beam of beams) beam.setContext(ctx).draw()
      if (m.ghost) ctx.closeGroup()

      const startX = stave.getNoteStartX()
      const endX = stave.getNoteEndX()
      const centers = notes.map((n) => {
        const box = n.getBoundingBox()
        return box ? box.getX() + box.getW() / 2 : n.getAbsoluteX()
      })
      const lefts = notes.map((n) => {
        if (fullRest) return startX
        const { modLeftPx, leftDisplacedHeadPx } = n.getMetrics()
        return n.getAbsoluteX() - modLeftPx - leftDisplacedHeadPx
      })
      const boxes: EventBox[] = []
      let tick = m.index * cap
      events.forEach((event, i) => {
        if (!m.ghost) staveNotes.set(event.id, { note: notes[i], row: rowIndex })
        boxes.push({
          id: m.ghost ? null : event.id,
          tick,
          x0: i === 0 ? startX : (centers[i - 1] + centers[i]) / 2,
          x1: i === events.length - 1 ? endX : (centers[i] + centers[i + 1]) / 2,
          cx: centers[i],
          left: lefts[i],
        })
        tick += eventTicks(event)
      })

      layout.measures.push({
        index: m.index,
        x,
        y,
        width: w,
        topLineY: stave.getYForLine(0),
        spacing: stave.getSpacingBetweenLines(),
        ghost: m.ghost,
        fullRest,
        noteStartX: startX,
        events: boxes,
      })
      x += w
    }
  })

  const flat = score.measures.flatMap((m) => m.events)
  flat.forEach((event, i) => {
    const next = flat[i + 1]
    if (!event.tie || !next) return
    const a = staveNotes.get(event.id)
    const b = staveNotes.get(next.id)
    if (!a && !b) return
    // Only the pitches the two notes share are tied.
    const firstIndexes: number[] = []
    const lastIndexes: number[] = []
    event.pitches?.forEach((p, k) => {
      const j = next.pitches?.findIndex((q) => toMidi(q) === toMidi(p)) ?? -1
      if (j < 0) return
      firstIndexes.push(k)
      lastIndexes.push(j)
    })
    if (firstIndexes.length === 0) return
    if (a && b && a.row === b.row) {
      new StaveTie({ firstNote: a.note, lastNote: b.note, firstIndexes, lastIndexes }).setContext(ctx).draw()
      return
    }
    // Across a line break the tie is drawn as two halves, one at each end.
    if (a) new StaveTie({ firstNote: a.note, firstIndexes, lastIndexes: firstIndexes }).setContext(ctx).draw()
    if (b) new StaveTie({ lastNote: b.note, firstIndexes: lastIndexes, lastIndexes }).setContext(ctx).draw()
  })

  return layout
}
