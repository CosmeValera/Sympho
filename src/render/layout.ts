import { KEY_SIGNATURES, diatonicIndex, keyAlter } from '../music/pitch'
import type { Duration, Measure } from '../music/types'

/** Space left and right of the staves, in layout units. */
export const MARGIN = 14

const EVENT_WIDTH: Record<Duration, number> = { '1': 48, '2': 40, '4': 34, '8': 28, '16': 24 }

/** How far a bar alone on its row may be squeezed below its natural width before the whole score is drawn smaller instead. */
const MIN_SQUEEZE = 0.8

/** The smallest scale a score is drawn at to fit a narrow screen; past it, the widest bars are squeezed harder. */
export const MIN_SCALE = 0.6

/** Roughly how wide a bar looks right, in layout units: its notes, accidentals and seconds, and the clef and key at a row's start. */
export function naturalWidth(measure: Measure, keySignature: string, rowStart: boolean, first: boolean): number {
  let width = 26
  for (const e of measure.events) {
    width += EVENT_WIDTH[e.duration] + (e.dots ? 6 : 0)
    const pitches = e.pitches ?? []
    // Accidentals stack sideways in a chord, and a second pushes one notehead beside the stem.
    const accidentals = pitches.filter((p) => p.alter !== keyAlter(keySignature, p.step)).length
    width += 10 * Math.min(2, accidentals)
    const lines = pitches.map(diatonicIndex)
    if (lines.some((line, i) => line - lines[i - 1] === 1)) width += 10
  }
  if (rowStart) {
    const accidentals = Math.abs(KEY_SIGNATURES.find((k) => k.id === keySignature)?.accidentals ?? 0)
    width += 42 + accidentals * 11
  }
  if (first) width += 30
  return width
}

export interface Placed {
  index: number
  measure: Measure
  ghost: boolean
  rowStart: boolean
  natural: number
}

/** Greedy line breaking: as many bars per row as fit `available` at their natural widths, and always at least one. */
export function breakRows(measures: Placed[], available: number, keySignature: string): Placed[][] {
  const rows: Placed[][] = []
  let row: Placed[] = []
  let used = 0
  for (const m of measures) {
    const inline = naturalWidth(m.measure, keySignature, false, m.index === 0)
    if (row.length > 0 && used + inline > available) {
      rows.push(row)
      row = []
      used = 0
    }
    const rowStart = row.length === 0
    const natural = rowStart ? naturalWidth(m.measure, keySignature, true, m.index === 0) : inline
    row.push({ ...m, rowStart, natural })
    used += natural
  }
  if (row.length > 0) rows.push(row)
  return rows
}

/**
 * The scale to draw at in `width` CSS pixels: `preferred`, unless the widest bar
 * wouldn't fit a row on its own even squeezed a little, as on a phone. Then the
 * whole score is drawn smaller, down to MIN_SCALE, so nothing runs off the side.
 */
export function fitScale(measures: Measure[], keySignature: string, width: number, preferred: number): number {
  const widest = measures.reduce((max, m, i) => Math.max(max, naturalWidth(m, keySignature, true, i === 0)), 0)
  const fits = width / (widest * MIN_SQUEEZE + MARGIN * 2)
  return Math.min(preferred, Math.max(MIN_SCALE, fits))
}
