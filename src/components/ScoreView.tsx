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
  editable: boolean
  restMode: boolean
  /** Any click on a note's column picks it, whatever the pitch, and nothing is written. */
  selectMode: boolean
  duration: Duration
  onStaffClick: (hit: StaffHit) => void
  onLayout?: (layout: ScoreLayout) => void
}

const NOTEHEAD: Record<Duration, string> = {
  '1': '',
  '2': '',
  '4': '',
  '8': '',
  '16': '',
}
const REST: Record<Duration, string> = { '1': '', '2': '', '4': '', '8': '', '16': '' }

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

export function ScoreView({ score, selectedId, playingId, editable, restMode, selectMode, duration, onStaffClick, onLayout }: Props) {
  const paperRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [fontsReady, setFontsReady] = useState(false)
  const [layout, setLayout] = useState<ScoreLayout | null>(null)
  const [hover, setHover] = useState<StaffHit | null>(null)

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

  const toHit = (e: { clientX: number; clientY: number }): StaffHit | null => {
    const svg = hostRef.current?.querySelector('svg')
    if (!svg || !layout) return null
    const rect = svg.getBoundingClientRect()
    const hit = hitTest(layout, (e.clientX - rect.left) / scale, (e.clientY - rect.top) / scale)
    if (!hit) return null
    const target = locate(score, hit.box.id)?.event
    if (selectMode) return { ...hit, noteId: target?.id ?? null }
    const selects = target?.kind === 'note' && target.pitch && diatonicIndex(target.pitch) === hit.diatonic
    const selectsRest = restMode && target?.kind === 'rest' && target.duration === duration
    return { ...hit, noteId: target && (selects || selectsRest) ? target.id : null }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!editable || e.pointerType !== 'mouse') return
    setHover(toHit(e))
  }

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!editable) return
    const hit = toHit(e)
    if (hit) onStaffClick(hit)
  }

  return (
    <div className="paper" ref={paperRef}>
      <div
        className={`score-canvas${editable ? ' is-editable' : ''}${hover?.noteId ? ' is-over-note' : ''}`}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHover(null)}
        onClick={onClick}
      >
        <div ref={hostRef} className="score-svg" />
        {!fontsReady && <div className="score-loading">Loading engraver…</div>}
        {layout && hover && !hover.noteId && !selectMode && <Ghost layout={layout} hover={hover} restMode={restMode} duration={duration} score={score} />}
      </div>
    </div>
  )
}

function Ghost({ layout, hover, restMode, duration, score }: { layout: ScoreLayout; hover: StaffHit; restMode: boolean; duration: Duration; score: Score }) {
  const { measure, box, diatonic } = hover
  const { topLineY, spacing } = measure
  const x = measure.fullRest ? measure.noteStartX + 10 : box.cx
  const halfSpaces = TREBLE_TOP_LINE - diatonic
  const y = topLineY + (halfSpaces * spacing) / 2
  const fontSize = spacing * 4

  const ledgers: number[] = []
  if (!restMode) {
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
        <text x={x} y={restMode ? restY : y} fontSize={fontSize} textAnchor="middle">
          {restMode ? REST[duration] : NOTEHEAD[duration]}
        </text>
      </svg>
      {!restMode && (
        <span className="ghost-label" style={{ left: (x + 12) * s, top: (y - 30) * s }}>
          {pitchLabel(fromDiatonic(diatonic, score.keySignature))}
        </span>
      )}
    </>
  )
}
