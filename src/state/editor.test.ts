import { describe, expect, it } from 'vitest'
import { parseMusic } from '../music/parse'
import { parsePitch } from '../music/pitch'
import { addMeasure, locateAll, moveSteps, placeAt, removeLastMeasure, removeNote } from '../music/score'
import { newScore } from '../music/serialize'
import { editorReducer, initEditor } from './editor'

const FOUR = { beats: 4, beatValue: 4 }

describe('tools', () => {
  const start = initEditor(newScore(), false)
  const tune = { ...newScore(), measures: parseMusic('C4:4 D4:4 E4:2', FOUR) }

  it('starts writing a blank score or one of your own', () => {
    expect(start.tool).toBe('write')
    expect(initEditor(tune, true).tool).toBe('write')
  })

  it('opens an example or shared link to look at', () => {
    expect(initEditor(tune, false).tool).toBe('select')
  })

  it('switches between select and write', () => {
    const selecting = editorReducer(start, { type: 'tool', tool: 'select' })
    expect(selecting.tool).toBe('select')
    expect(editorReducer(selecting, { type: 'tool', tool: 'write' }).tool).toBe('write')
  })
})

describe('caret', () => {
  // C D, then a half rest: the caret starts after the last note.
  const score = { ...newScore(), measures: parseMusic('C4:4 D4:4 r:2', FOUR) }
  const start = initEditor(score, true)
  const ids = locateAll(score).map((l) => l.event.id)
  const writeRest = (state: typeof start) =>
    editorReducer(state, {
      type: 'edit',
      label: 'write quarter rest',
      edit: (s) => placeAt(s, state.cursor, { duration: '4', dots: 0 }, null),
      written: true,
    })

  it('starts after the last note', () => {
    expect(start.cursor).toBe(16)
  })

  it('goes after a selected note', () => {
    expect(editorReducer(start, { type: 'select', id: ids[0] }).cursor).toBe(8)
  })

  it('goes into a selected rest, keeping the value being written', () => {
    const halved = editorReducer(start, { type: 'duration', duration: '8' })
    const selected = editorReducer(halved, { type: 'select', id: ids[2] })
    expect(selected.cursor).toBe(16)
    expect(selected.duration).toBe('8')
  })

  it('moves past a written rest even though it merges into the gap', () => {
    const once = writeRest(start)
    expect(once.cursor).toBe(24)
    expect(writeRest(once).cursor).toBe(32)
  })

  it('comes back with undo and redo', () => {
    const written = writeRest(start)
    const undone = editorReducer(written, { type: 'undo' })
    expect(undone.cursor).toBe(16)
    expect(editorReducer(undone, { type: 'redo' }).cursor).toBe(24)
  })

  it('stays inside the piece when the last bar is removed', () => {
    const twoBars = { ...newScore(), measures: parseMusic('C4:1 | D4:1', FOUR) }
    const late = initEditor(twoBars, true)
    expect(late.cursor).toBe(64)
    expect(editorReducer(late, { type: 'edit', label: 'remove last bar', edit: removeLastMeasure }).cursor).toBe(32)
  })
})

describe('playhead', () => {
  // C D E F | G A B C, a quarter note is 8 ticks.
  const score = { ...newScore(), measures: parseMusic('C4:4 D4:4 E4:4 F4:4 | G4:4 A4:4 B4:4 C5:4', FOUR) }
  const writing = initEditor(score, true)
  const start = editorReducer(writing, { type: 'tool', tool: 'select' })
  const ids = locateAll(score).map((l) => l.event.id)

  it('starts at the beginning', () => {
    expect(start.playhead).toBe(0)
  })

  it('follows what the Select tool picks', () => {
    expect(editorReducer(start, { type: 'select', id: ids[5] }).playhead).toBe(40)
  })

  it('stays put when a note is picked while writing', () => {
    expect(editorReducer(writing, { type: 'select', id: ids[5] }).playhead).toBe(0)
  })

  it('stays put when the selection is cleared', () => {
    const selected = editorReducer(start, { type: 'select', id: ids[5] })
    expect(editorReducer(selected, { type: 'select', id: null }).playhead).toBe(40)
  })

  it('stays put while notes are written', () => {
    const written = editorReducer(start, {
      type: 'edit',
      label: 'write G4 eighth',
      edit: (s) => placeAt(s, 16, { duration: '8', dots: 0 }, parsePitch('G4')!),
      written: true,
    })
    expect(written.playhead).toBe(0)
  })

  it('snaps a seek to the start of the event under it', () => {
    expect(editorReducer(start, { type: 'seek', tick: 27 }).playhead).toBe(24)
  })

  it('returns to the beginning when its bar is removed', () => {
    const late = editorReducer(start, { type: 'seek', tick: 48 })
    expect(editorReducer(late, { type: 'edit', label: 'remove last bar', edit: removeLastMeasure }).playhead).toBe(0)
  })
})

describe('value', () => {
  // A half note, then a dotted quarter and an eighth.
  const score = { ...newScore(), measures: parseMusic('C4:2 D4:4. E4:8', FOUR) }
  const start = initEditor(score, true)
  const ids = locateAll(score).map((l) => l.event.id)
  const write = editorReducer(start, {
    type: 'edit',
    label: 'write F4 quarter',
    edit: (s) => placeAt(s, start.cursor, { duration: '4', dots: 0 }, parsePitch('F4')!),
    written: true,
  })

  it('takes the value of a picked note', () => {
    const picked = editorReducer(start, { type: 'select', id: ids[1] })
    expect(picked.duration).toBe('4')
    expect(picked.dots).toBe(1)
    expect(picked.written).toBe(false)
  })

  it("doesn't take the value of the note just written", () => {
    const halved = editorReducer(start, { type: 'duration', duration: '2' })
    const written = editorReducer(halved, {
      type: 'edit',
      label: 'write F4 quarter',
      edit: (s) => placeAt(s, halved.cursor, { duration: '4', dots: 0 }, parsePitch('F4')!),
      written: true,
    })
    expect(written.written).toBe(true)
    expect(written.duration).toBe('2')
  })

  it('keeps a note as just written while its pitch is fixed, until it is picked', () => {
    const fixed = editorReducer(write, { type: 'edit', label: 'move up a step', edit: (s, id) => moveSteps(s, id!, 1) })
    expect(fixed.written).toBe(true)
    expect(editorReducer(fixed, { type: 'select', id: fixed.selectedId }).written).toBe(false)
  })

  it('starts a new value undotted unless asked', () => {
    const dotted = editorReducer(start, { type: 'duration', duration: '4', dots: 1 })
    expect(dotted.dots).toBe(1)
    expect(editorReducer(dotted, { type: 'duration', duration: '2' }).dots).toBe(0)
    expect(editorReducer(start, { type: 'duration', duration: '16', dots: 1 }).dots).toBe(0)
  })
})

describe('chord', () => {
  // A C major triad, then a single note.
  const score = { ...newScore(), measures: parseMusic('C4+E4+G4:2 D4:2', FOUR) }
  const start = initEditor(score, true)
  const ids = locateAll(score).map((l) => l.event.id)
  const picked = editorReducer(start, { type: 'select', id: ids[0] })
  const E4 = 30
  const G4 = 32

  it('picks its top note unless told which', () => {
    expect(picked.head).toBe(G4)
    expect(editorReducer(start, { type: 'select', id: ids[0], head: E4 }).head).toBe(E4)
    expect(editorReducer(start, { type: 'select', id: ids[1] }).head).toBe(29)
  })

  it('moves to another of its notes, but not one it lacks', () => {
    expect(editorReducer(picked, { type: 'head', head: E4 }).head).toBe(E4)
    expect(editorReducer(picked, { type: 'head', head: 31 })).toBe(picked)
  })

  it('edits the picked note and follows it', () => {
    const middle = editorReducer(picked, { type: 'head', head: E4 })
    const moved = editorReducer(middle, { type: 'edit', label: 'move E4 up', edit: (s, id, head) => moveSteps(s, id!, 1, head) })
    expect(moved.head).toBe(31)
    expect(moved.score.measures[0].events[0].pitches!.map((p) => p.step)).toEqual(['C', 'F', 'G'])
  })

  it('falls back to the top note once the picked one is removed', () => {
    const middle = editorReducer(picked, { type: 'head', head: E4 })
    const removed = editorReducer(middle, { type: 'edit', label: 'remove E4', edit: (s, id, head) => removeNote(s, id!, head) })
    expect(removed.head).toBe(G4)
  })
})

describe('drafts', () => {
  const score = { ...newScore(), title: 'Minuet', measures: parseMusic('C4:4 D4:4 E4:2', FOUR) }
  const draft = initEditor(score, false, 'Minuet (copy)')
  const edited = editorReducer(draft, { type: 'edit', label: 'add bar', edit: addMeasure })

  it('is saved under its own name on the first edit', () => {
    expect(draft.score.title).toBe('Minuet')
    expect(edited.persisted).toBe(true)
    expect(edited.score.title).toBe('Minuet (copy)')
    expect(edited.saveAs).toBeNull()
  })

  it('stays a draft after an edit that changes nothing', () => {
    const same = editorReducer(draft, { type: 'edit', label: 'nothing', edit: (s) => s })
    expect(same.persisted).toBe(false)
    expect(same.past).toHaveLength(0)
  })

  it('keeps the title through undo', () => {
    const undone = editorReducer(edited, { type: 'undo' })
    expect(undone.score.title).toBe('Minuet (copy)')
    expect(undone.score.measures).toHaveLength(1)
    expect(undone.future[0].label).toBe('add bar')
  })
})
