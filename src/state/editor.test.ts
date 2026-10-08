import { describe, expect, it } from 'vitest'
import { parseMusic } from '../music/parse'
import { locateAll, placeAt, removeLastMeasure } from '../music/score'
import { newScore } from '../music/serialize'
import { editorReducer, initEditor } from './editor'

const FOUR = { beats: 4, beatValue: 4 }

describe('tools', () => {
  const start = initEditor(newScore(), false)

  it('starts writing notes', () => {
    expect(start.tool).toBe('note')
  })

  it('switches between select, notes and rests', () => {
    const selecting = editorReducer(start, { type: 'tool', tool: 'select' })
    expect(selecting.tool).toBe('select')
    expect(editorReducer(selecting, { type: 'tool', tool: 'rest' }).tool).toBe('rest')
  })
})

describe('playhead', () => {
  // C D E F | G A B C, a quarter note is 8 ticks.
  const score = { ...newScore(), measures: parseMusic('C4:4 D4:4 E4:4 F4:4 | G4:4 A4:4 B4:4 C5:4', FOUR) }
  const start = initEditor(score, true)
  const ids = locateAll(score).map((l) => l.event.id)

  it('starts at the beginning', () => {
    expect(start.playhead).toBe(0)
  })

  it('follows the selection', () => {
    expect(editorReducer(start, { type: 'select', id: ids[5] }).playhead).toBe(40)
  })

  it('stays put when the selection is cleared', () => {
    const selected = editorReducer(start, { type: 'select', id: ids[5] })
    expect(editorReducer(selected, { type: 'select', id: null }).playhead).toBe(40)
  })

  it('moves to a newly written note', () => {
    const written = editorReducer(start, { type: 'edit', edit: (s) => placeAt(s, 16, { duration: '8', dots: 0 }, null) })
    expect(written.playhead).toBe(16)
  })

  it('snaps a seek to the start of the event under it', () => {
    expect(editorReducer(start, { type: 'seek', tick: 27 }).playhead).toBe(24)
  })

  it('returns to the beginning when its bar is removed', () => {
    const late = editorReducer(start, { type: 'seek', tick: 48 })
    expect(editorReducer(late, { type: 'edit', edit: removeLastMeasure }).playhead).toBe(0)
  })
})
