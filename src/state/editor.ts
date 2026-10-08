import { type EditResult, eventStart, locate } from '../music/score'
import type { Duration, Score } from '../music/types'

const HISTORY_LIMIT = 200

/** What a click on the staff does: pick an event, write a note, or write a rest. */
export type Tool = 'select' | 'note' | 'rest'

export interface EditorState {
  score: Score
  /** Whether edits autosave to the library. Examples and shared links stay drafts until first edited. */
  persisted: boolean
  past: Score[]
  future: Score[]
  selectedId: string | null
  /** Value used for new notes; mirrors the selected note's. */
  duration: Duration
  tool: Tool
  /**
   * Tick playback starts from, always the start of an event. It follows the
   * selection, and pausing or dragging the marker moves it.
   */
  playhead: number
}

export type EditorAction =
  | { type: 'load'; score: Score; persisted: boolean }
  | { type: 'edit'; edit: (score: Score, selectedId: string | null) => EditResult | Score }
  | { type: 'meta'; patch: Partial<Pick<Score, 'title' | 'composer'>> }
  | { type: 'select'; id: string | null }
  | { type: 'duration'; duration: Duration }
  | { type: 'tool'; tool: Tool }
  | { type: 'seek'; tick: number }
  | { type: 'undo' }
  | { type: 'redo' }

export function initEditor(score: Score, persisted: boolean): EditorState {
  return { score, persisted, past: [], future: [], selectedId: null, duration: '4', tool: 'note', playhead: 0 }
}

/**
 * Keeps the selection only if that event still exists, and syncs the input
 * duration and the playhead to it. Without a selection the playhead stays put,
 * snapped to whatever event now covers it.
 */
function withSelection(state: EditorState, score: Score, id: string | null): EditorState {
  const found = locate(score, id)
  return {
    ...state,
    score,
    selectedId: found ? id : null,
    duration: found ? found.event.duration : state.duration,
    playhead: found ? found.start : eventStart(score, state.playhead),
  }
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'load':
      return initEditor(action.score, action.persisted)

    case 'edit': {
      const out = action.edit(state.score, state.selectedId)
      const { score, selectedId } = 'score' in out ? out : { score: out, selectedId: state.selectedId }
      if (score === state.score) return withSelection(state, score, selectedId)
      const next = withSelection(state, { ...score, updatedAt: Date.now() }, selectedId)
      return {
        ...next,
        persisted: true,
        past: [...state.past, state.score].slice(-HISTORY_LIMIT),
        future: [],
      }
    }

    case 'meta':
      // Typing a title isn't worth an undo step per keystroke.
      return { ...state, persisted: true, score: { ...state.score, ...action.patch, updatedAt: Date.now() } }

    case 'select':
      return withSelection(state, state.score, action.id)

    case 'duration':
      return { ...state, duration: action.duration }

    case 'tool':
      return { ...state, tool: action.tool }

    case 'seek':
      return { ...state, playhead: eventStart(state.score, action.tick) }

    case 'undo': {
      const previous = state.past.at(-1)
      if (!previous) return state
      return {
        ...withSelection(state, previous, state.selectedId),
        past: state.past.slice(0, -1),
        future: [state.score, ...state.future],
      }
    }

    case 'redo': {
      const [next, ...rest] = state.future
      if (!next) return state
      return {
        ...withSelection(state, next, state.selectedId),
        past: [...state.past, state.score],
        future: rest,
      }
    }
  }
}
