import { canDot } from '../music/duration'
import { type EditResult, entryTick, eventStart, headOf, locate, locateAll, scoreTicks } from '../music/score'
import type { Duration, Score } from '../music/types'

const HISTORY_LIMIT = 200

/** What a click on the staff does: pick an event, or write a note. */
export type Tool = 'select' | 'write'

/** A version of the score in the undo history, with the caret it had and the edit that left it. */
interface Snapshot {
  score: Score
  cursor: number
  /** Lower-case description of the edit, e.g. "write C5 quarter". */
  label: string
}

export interface EditorState {
  score: Score
  /** Whether edits autosave to the library. Examples and shared links stay drafts until first edited. */
  persisted: boolean
  /** Title a draft takes when it's first saved, so the copy doesn't share the original's name. */
  saveAs: string | null
  past: Snapshot[]
  future: Snapshot[]
  selectedId: string | null
  /** Staff position (diatonic index) of the selected chord note that edits apply to; null for a rest or no selection. */
  head: number | null
  /**
   * The selection is the note just written rather than one picked to edit. Value
   * keys then set the next note's value instead of changing this one.
   */
  written: boolean
  /** Value used for new notes and rests; mirrors a picked note's. */
  duration: Duration
  dots: 0 | 1
  tool: Tool
  /**
   * Tick playback starts from, always the start of an event. It follows an event
   * picked with the Select tool, and pausing or dragging the marker moves it.
   */
  playhead: number
  /**
   * Tick of the caret, where typed notes and rests are written: after a selected
   * note, at the start of a selected rest, and after whatever was just written.
   */
  cursor: number
}

export type EditorAction =
  | { type: 'load'; score: Score; persisted: boolean; saveAs?: string }
  | {
      type: 'edit'
      label: string
      edit: (score: Score, selectedId: string | null, head: number | null) => EditResult | Score
      /** The edit wrote the note it selects. Left out, an edit to the note just written keeps it that. */
      written?: boolean
    }
  | { type: 'meta'; patch: Partial<Pick<Score, 'title' | 'composer'>> }
  | { type: 'select'; id: string | null; head?: number | null }
  /** Selects another note of the selected chord. */
  | { type: 'head'; head: number }
  | { type: 'duration'; duration: Duration; dots?: 0 | 1 }
  | { type: 'tool'; tool: Tool }
  | { type: 'seek'; tick: number }
  | { type: 'undo' }
  | { type: 'redo' }

const isBlank = (score: Score) => locateAll(score).every((l) => l.event.kind === 'rest')

/** A score of your own, or a blank one, opens ready to write; an example or shared link opens to look at. */
export function initEditor(score: Score, persisted: boolean, saveAs: string | null = null): EditorState {
  return {
    score,
    persisted,
    saveAs: persisted ? null : saveAs,
    past: [],
    future: [],
    selectedId: null,
    head: null,
    written: false,
    duration: '4',
    dots: 0,
    tool: persisted || isBlank(score) ? 'write' : 'select',
    playhead: 0,
    cursor: entryTick(score, null),
  }
}

/**
 * Keeps the selection only if that event still exists, and syncs the caret to
 * it. A picked note also sets the input value, and an event picked with the
 * Select tool moves the playhead; a note just written does neither, and while
 * writing, picking a note to fix it leaves the playhead alone. Otherwise the
 * playhead stays put, snapped to whatever event now covers it, and so does the
 * caret unless `cursor` moves it. A chord keeps its selected note if it still
 * has it, else selects its top one.
 */
function withSelection(
  state: EditorState,
  score: Score,
  id: string | null,
  { cursor, written = false, head }: { cursor?: number; written?: boolean; head?: number | null } = {},
): EditorState {
  const found = locate(score, id)
  const pitches = found?.event.pitches
  const picked = found && !written ? found : null
  // A selected rest is a gap to fill, so the value being written stays.
  const note = picked?.event.kind === 'note' ? picked.event : null
  return {
    ...state,
    score,
    selectedId: found ? id : null,
    head: pitches ? headOf(pitches, head ?? (id === state.selectedId ? state.head : null)) : null,
    written: !!found && written,
    duration: note ? note.duration : state.duration,
    dots: note ? note.dots : state.dots,
    playhead: picked && state.tool === 'select' ? picked.start : eventStart(score, state.playhead),
    cursor: Math.min(cursor ?? (found ? entryTick(score, id) : state.cursor), scoreTicks(score)),
  }
}

/** The title and composer aren't part of the undo history, so going back keeps the current ones. */
function restore(state: EditorState, snapshot: Snapshot): EditorState {
  const { title, composer } = state.score
  const score = { ...snapshot.score, title, composer, updatedAt: Date.now() }
  return withSelection(state, score, state.selectedId, { cursor: snapshot.cursor, written: state.written })
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'load':
      return initEditor(action.score, action.persisted, action.saveAs)

    case 'edit': {
      const out = action.edit(state.score, state.selectedId, state.head)
      const { score, selectedId, cursor, head }: EditResult =
        'score' in out ? out : { score: out, selectedId: state.selectedId }
      const same = selectedId === state.selectedId
      // An edit to the selected note leaves the caret where it was.
      const options = {
        cursor: cursor ?? (same ? state.cursor : undefined),
        written: action.written ?? (same && state.written),
        head,
      }
      if (score === state.score) return withSelection(state, score, selectedId, options)
      // A draft's first edit saves it, under its own name.
      const titled = state.saveAs ? { ...score, title: state.saveAs } : score
      const next = withSelection(state, { ...titled, updatedAt: Date.now() }, selectedId, options)
      return {
        ...next,
        persisted: true,
        saveAs: null,
        past: [...state.past, { score: state.score, cursor: state.cursor, label: action.label }].slice(-HISTORY_LIMIT),
        future: [],
      }
    }

    case 'meta': {
      // Typing a title isn't worth an undo step per keystroke.
      const titled = state.saveAs ? { ...state.score, title: state.saveAs } : state.score
      return { ...state, persisted: true, saveAs: null, score: { ...titled, ...action.patch, updatedAt: Date.now() } }
    }

    case 'select':
      return withSelection(state, state.score, action.id, { head: action.head })

    case 'head': {
      const pitches = locate(state.score, state.selectedId)?.event.pitches
      if (!pitches || headOf(pitches, action.head) !== action.head) return state
      return { ...state, head: action.head }
    }

    case 'duration': {
      // A new value starts undotted unless it says otherwise.
      const dots = canDot(action.duration) ? (action.dots ?? 0) : 0
      return { ...state, duration: action.duration, dots }
    }

    case 'tool':
      return { ...state, tool: action.tool }

    case 'seek':
      return { ...state, playhead: eventStart(state.score, action.tick) }

    case 'undo': {
      const previous = state.past.at(-1)
      if (!previous) return state
      return {
        ...restore(state, previous),
        past: state.past.slice(0, -1),
        future: [{ score: state.score, cursor: state.cursor, label: previous.label }, ...state.future],
      }
    }

    case 'redo': {
      const [next, ...rest] = state.future
      if (!next) return state
      return {
        ...restore(state, next),
        past: [...state.past, { score: state.score, cursor: state.cursor, label: next.label }],
        future: rest,
      }
    }
  }
}
