import { type MouseEvent, type PointerEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  TREBLE_TOP_LINE,
  clampDiatonic,
  diatonicIndex,
  fromDiatonic,
  pitchLabel,
} from '../music/pitch'
import { locate } from '../music/score'
import type { Duration, Score } from '../music/types'
import {
  type EventBox,
  type MeasureBox,
  type ScoreLayout,
  loadMusicFonts,
  renderScore,
} from '../render/renderScore'
import type { Tool } from '../state/editor'

export interface StaffHit {
  box: EventBox
  measure: MeasureBox
  diatonic: number
  /** The click selects this existing note (or rest) instead of writing a new one. */
  noteId: string | null
}

interface Props {
  score: Score
  selectedId: string | null
  playingId: string | null
  /** Tick the playback marker is drawn at. */
  playhead: number
  playing: boolean
  editable: boolean
  tool: Tool
  duration: Duration
  onStaffClick: (hit: StaffHit) => void
  /** The marker was dragged to the event starting at `tick`. */
  onSeek: (tick: number) => void
  onLayout?: (layout: ScoreLayout) => void
}

/** SMuFL codepoints rendered with Bravura. */
const NOTEHEAD: Record<Duration, string> = {
  '1': '\uE0A2',
  '2': '\uE0A3',
  '4': '\uE0A4',
  '8': '\uE0A4',
  '16': '\uE0A4',
}
const REST: Record<Duration, string> = { '1': '\uE4E3', '2': '\uE4E4', '4': '\uE4E5', '8': '\uE4E6', '16': '\uE4E7' }

/** In note mode a click this many steps from a notehead picks the note rather than writing over it. */
const NOTE_REACH = 1

function scaleFor(width: number): number {
  if (width >= 1000) return 1.2
  if (width >= 640) return 1.08
  return 0.9
}

function hitTest(layout: ScoreLayout, x: number, y: number): Omit<StaffHit, 'noteId'> | null {
  for (const measure of layout.measures) {
    const { topLineY, spacing } = measure
    if (x < measure.x || x > measure.x + measure.width) continue
    if (y < topLineY - 4.4 * spacing || y >= topLineY + 8.4 * spacing) continue
    const box = measure.events.find((b) => x >= b.x0 && x < b.x1) ?? (x < measure.events[0].x0 ? measure.events[0] : measure.events.at(-1)!)
    const halfSpaces = Math.round((y - topLineY) / (spacing / 2))
    return { box, measure, diatonic: clampDiatonic(TREBLE_TOP_LINE - halfSpaces) }
  }
  return null
}

/** The event at or before `tick`, and the measure it's drawn in. */
function markerAt(layout: ScoreLayout, tick: number): { box: EventBox; measure: MeasureBox } | null {
  let found: { box: EventBox; measure: MeasureBox } | null = null
  for (const measure of layout.measures) {
    if (measure.ghost) continue
    for (const box of measure.events) {
      if (box.tick > tick) return found
      found = { box, measure }
    }
  }
  return found
}

/** Tick of the event start nearest a point: the row is picked by height, then the closest note in it. */
function snapTick(layout: ScoreLayout, x: number, y: number): number | null {
  const real = layout.measures.filter((m) => !m.ghost)
  if (real.length === 0) return null
  const distance = (m: MeasureBox) => Math.abs(m.topLineY + 2 * m.spacing - y)
  const nearest = real.reduce((best, m) => (distance(m) < distance(best) ? m : best))
  let best: EventBox | null = null
  for (const m of real) {
    if (m.y !== nearest.y) continue
    for (const b of m.events) if (!best || Math.abs(b.left - x) < Math.abs(best.left - x)) best = b
  }
  return best?.tick ?? null
}

export function ScoreView(props: Props) {
  const { score, selectedId, playingId, playhead, playing, editable, tool, duration, onStaffClick, onSeek, onLayout } = props
  const paperRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [fontsReady, setFontsReady] = useState(false)
  const [layout, setLayout] = useState<ScoreLayout | null>(null)
  const [hover, setHover] = useState<StaffHit | null>(null)
  // A drag that ends off the marker sends its click to the staff underneath, which mustn't write a note.
  const swallowClick = useRef(false)

  useEffect(() => {
    let live = true
    void loadMusicFonts().then(() => live && setFontsReady(true))
    return () => {
      live = false
    }
  }, [])

  useLayoutEffect(() => {
    const el = paperRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const scale = scaleFor(width)
  useLayoutEffect(() => {
    if (!fontsReady || width === 0 || !hostRef.current) return
    const next = renderScore(hostRef.current, score, { width, scale, ghostMeasure: editable })
    setLayout(next)
    onLayout?.(next)
  }, [score, width, scale, fontsReady, editable, onLayout])

  const hoverNoteId = hover?.noteId ?? null
  useEffect(() => {
    const svg = hostRef.current?.querySelector('svg')
    if (!svg || !layout) return
    for (const cls of ['is-selected', 'is-playing', 'is-hover']) {
      svg.querySelectorAll(`.${cls}`).forEach((el) => el.classList.remove(cls))
    }
    const mark = (id: string | null, cls: string) => {
      if (id) svg.querySelector(`#${CSS.escape(`vf-${id}`)}`)?.classList.add(cls)
    }
    mark(selectedId, 'is-selected')
    mark(playingId, 'is-playing')
    mark(hoverNoteId, 'is-hover')
  }, [layout, selectedId, playingId, hoverNoteId])

  useEffect(() => {
    const id = playingId ?? selectedId
    if (!id) return
    const el = hostRef.current?.querySelector(`#${CSS.escape(`vf-${id}`)}`)
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [playingId, selectedId])

  /** Converts a pointer position to layout units. */
  const toLayout = (e: { clientX: number; clientY: number }): { x: number; y: number } | null => {
    const svg = hostRef.current?.querySelector('svg')
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale }
  }

  const toHit = (e: { clientX: number; clientY: number }): StaffHit | null => {
    const point = toLayout(e)
    if (!point || !layout) return null
    const hit = hitTest(layout, point.x, point.y)
    if (!hit) return null
    const target = locate(score, hit.box.id)?.event
    if (tool === 'select') return { ...hit, noteId: target?.id ?? null }
    const nearNote =
      tool === 'note' && target?.kind === 'note' && target.pitch && Math.abs(diatonicIndex(target.pitch) - hit.diatonic) <= NOTE_REACH
    const sameRest = tool === 'rest' && target?.kind === 'rest' && target.duration === duration
    return { ...hit, noteId: target && (nearNote || sameRest) ? target.id : null }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!editable || e.pointerType !== 'mouse') return
    setHover(toHit(e))
  }

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!editable) return
    if (swallowClick.current) {
      swallowClick.current = false
      return
    }
    const hit = toHit(e)
    if (hit) onStaffClick(hit)
  }

  const writing = tool !== 'select'
  const canvasClass = [
    'score-canvas',
    editable && (writing ? 'is-writing' : 'is-selecting'),
    hover?.noteId && 'is-over-note',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="paper" ref={paperRef}>
      <div
        className={canvasClass}
        onPointerDown={() => (swallowClick.current = false)}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHover(null)}
        onClick={onClick}
      >
        <div ref={hostRef} className="score-svg" />
        {!fontsReady && <div className="score-loading">Loading engraver…</div>}
        {layout && hover && !hover.noteId && writing && (
          <Ghost layout={layout} hover={hover} rest={tool === 'rest'} duration={duration} score={score} />
        )}
        {layout && editable && (
          <Playhead
            layout={layout}
            tick={playhead}
            playing={playing}
            toLayout={toLayout}
            onEnter={() => setHover(null)}
            onSeek={(tick) => {
              swallowClick.current = true
              onSeek(tick)
            }}
          />
        )}
      </div>
    </div>
  )
}

interface PlayheadProps {
  layout: ScoreLayout
  tick: number
  playing: boolean
  toLayout: (e: { clientX: number; clientY: number }) => { x: number; y: number } | null
  /** The pointer is over the marker, so the staff underneath shouldn't show a ghost note. */
  onEnter: () => void
  onSeek: (tick: number) => void
}

/** The playback marker: a line just before the event playback starts from, with a handle to drag it. */
function Playhead({ layout, tick, playing, toLayout, onEnter, onSeek }: PlayheadProps) {
  const [drag, setDrag] = useState<number | null>(null)
  const grabbedAt = useRef(0)
  const at = markerAt(layout, drag ?? tick)
  if (!at) return null

  const { box, measure } = at
  const s = layout.scale
  const x = (box.left - 5) * s
  const top = (measure.topLineY - 2.2 * measure.spacing) * s
  const height = 7 * measure.spacing * s

  const move = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (drag === null) return
    const point = toLayout(e)
    const next = point && snapTick(layout, point.x, point.y)
    if (next !== null && next !== drag) setDrag(next)
  }

  return (
    <div
      className={`playhead${playing ? ' is-playing' : ''}${drag !== null ? ' is-dragging' : ''}`}
      style={{ left: x, top, height }}
      title={drag === null ? 'Playback starts here. Drag to move it.' : undefined}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.preventDefault()
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        grabbedAt.current = tick
        setDrag(tick)
      }}
      onPointerEnter={onEnter}
      onPointerMove={move}
      onPointerUp={(e) => {
        e.stopPropagation()
        if (drag === null) return
        setDrag(null)
        if (drag !== grabbedAt.current) onSeek(drag)
      }}
      onPointerCancel={() => setDrag(null)}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="playhead-handle" aria-hidden="true" />
    </div>
  )
}

function Ghost({ layout, hover, rest, duration, score }: { layout: ScoreLayout; hover: StaffHit; rest: boolean; duration: Duration; score: Score }) {
  const { measure, box, diatonic } = hover
  const { topLineY, spacing } = measure
  const x = measure.fullRest ? measure.noteStartX + 10 : box.cx
  const halfSpaces = TREBLE_TOP_LINE - diatonic
  const y = topLineY + (halfSpaces * spacing) / 2
  const fontSize = spacing * 4

  const ledgers: number[] = []
  if (!rest) {
    for (let n = -2; n >= halfSpaces; n -= 2) ledgers.push(n)
    for (let n = 10; n <= halfSpaces; n += 2) ledgers.push(n)
  }
  const restY = topLineY + (duration === '1' ? 1 : 2) * spacing
  const s = layout.scale

  return (
    <>
      <svg
        className="ghost"
        width={layout.width * s}
        height={layout.height * s}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        aria-hidden="true"
      >
        {ledgers.map((n) => (
          <line key={n} x1={x - 11} x2={x + 11} y1={topLineY + (n * spacing) / 2} y2={topLineY + (n * spacing) / 2} />
        ))}
        <text x={x} y={rest ? restY : y} fontSize={fontSize} textAnchor="middle">
          {rest ? REST[duration] : NOTEHEAD[duration]}
        </text>
      </svg>
      {!rest && (
        <span className="ghost-label" style={{ left: (x + 12) * s, top: (y - 30) * s }}>
          {pitchLabel(fromDiatonic(diatonic, score.keySignature))}
        </span>
      )}
    </>
  )
}
