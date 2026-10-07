import { locate, type EditResult } from '../music/score'
import type { Duration, Score } from '../music/types'

const HISTORY_LIMIT = 200

export interface EditorState {
  score: Score
  /** Whether edits autosave to the library. Examples and shared links stay drafts until first edited. */
  persisted: boolean
  past: Score[]
  future: Score[]
  selectedId: string | null
  /** Value used for new notes; mirrors the selected note's. */
  duration: Duration
  /** Clicking the staff places rests instead of notes. */
  restMode: boolean
}

export type EditorAction =
  | { type: 'load'; score: Score; persisted: boolean }
  | { type: 'edit'; edit: (score: Score, selectedId: string | null) => EditResult | Score }
  | { type: 'meta'; patch: Partial<Pick<Score, 'title' | 'composer'>> }
  | { type: 'select'; id: string | null }
  | { type: 'duration'; duration: Duration }
  | { type: 'restMode'; on: boolean }
  | { type: 'undo' }
  | { type: 'redo' }

export function initEditor(score: Score, persisted: boolean): EditorState {
  return { score, persisted, past: [], future: [], selectedId: null, duration: '4', restMode: false }
}

/** Keeps the selection only if that event still exists, and syncs the input duration to it. */
function withSelection(state: EditorState, score: Score, id: string | null): EditorState {
  const found = locate(score, id)
  return {
    ...state,
    score,
    selectedId: found ? id : null,
    duration: found ? found.event.duration : state.duration,
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

    case 'restMode':
      return { ...state, restMode: action.on }

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
