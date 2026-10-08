import { describe, expect, it } from 'vitest'
import { parseMusic } from '../music/parse'
import type { TimeSignature } from '../music/types'
import { MARGIN, MIN_SCALE, type Placed, breakRows, fitScale, naturalWidth } from './layout'

const FOUR: TimeSignature = { beats: 4, beatValue: 4 }

function placed(music: string): Placed[] {
  return parseMusic(music, FOUR).map((measure, index) => ({ index, measure, ghost: false, rowStart: false, natural: 0 }))
}

describe('naturalWidth', () => {
  it('grows with the notes, accidentals and the clef at a row start', () => {
    const [quarters] = parseMusic('C5:4 D5:4 E5:4 F5:4', FOUR)
    const [sixteenths] = parseMusic('C5:16 '.repeat(16), FOUR)
    const [sharps] = parseMusic('C#5:4 D#5:4 F#5:4 G#5:4', FOUR)
    expect(naturalWidth(sixteenths, 'C', false, false)).toBeGreaterThan(naturalWidth(quarters, 'C', false, false))
    expect(naturalWidth(sharps, 'C', false, false)).toBeGreaterThan(naturalWidth(quarters, 'C', false, false))
    // In D major the sharps on F and C are in the key, so only D♯ and G♯ are drawn.
    expect(naturalWidth(sharps, 'D', false, false)).toBeLessThan(naturalWidth(sharps, 'C', false, false))
    expect(naturalWidth(quarters, 'C', true, false)).toBeGreaterThan(naturalWidth(quarters, 'C', false, false))
  })
})

describe('breakRows', () => {
  it('puts as many bars on a row as fit, and a too-wide bar on a row of its own', () => {
    const bars = placed('C5:4 D5:4 E5:4 F5:4 | G5:1 | ' + 'C5:16 '.repeat(16) + '| A4:2 B4:2')
    const rows = breakRows(bars, 400, 'C')
    expect(rows.map((row) => row.map((m) => m.index))).toEqual([[0, 1], [2], [3]])
    expect(rows.flat().map((m) => m.rowStart)).toEqual([true, false, true, true])
  })
})

describe('fitScale', () => {
  const simple = parseMusic('C5:4 D5:4 E5:4 F5:4 | G5:1', FOUR)
  const dense = parseMusic('C#5:16 D#5:16 '.repeat(8), FOUR)

  it('keeps the preferred scale when every bar fits', () => {
    expect(fitScale(simple, 'C', 1000, 1.2)).toBe(1.2)
    expect(fitScale(simple, 'C', 360, 0.9)).toBe(0.9)
  })

  it('draws smaller so the widest bar fits a phone screen', () => {
    const scale = fitScale(dense, 'C', 360, 0.9)
    expect(scale).toBeLessThan(0.9)
    expect(scale).toBeGreaterThanOrEqual(MIN_SCALE)
    // The bar then needs at most a little squeezing to fit the row.
    const available = 360 / scale - MARGIN * 2
    expect(naturalWidth(dense[0], 'C', true, true) * 0.8).toBeLessThanOrEqual(available + 1e-9)
  })

  it('never goes below the smallest scale', () => {
    expect(fitScale(dense, 'C', 120, 0.9)).toBe(MIN_SCALE)
  })
})
