import { type JSX, useEffect, useLayoutEffect, useReducer, useState } from 'react'
import './App.css'
import { Editor } from './components/Editor'
import { GithubIcon, LogoMark, MoonIcon, SolarIcon, SunIcon } from './components/Icons'
import { Library } from './components/Library'
import { exampleScore } from './examples'
import { decodeShare, newScore } from './music/serialize'
import type { Score } from './music/types'
import { editorReducer, initEditor } from './state/editor'
import { lastOpenedId, loadLibrary, readFlag, rememberOpened, saveScore, writeFlag } from './state/storage'
import { uniqueTitle } from './state/titles'

type View = 'editor' | 'library'
type Theme = 'light' | 'dark' | 'solar'

const THEMES: { id: Theme; label: string; icon: () => JSX.Element }[] = [
  { id: 'light', label: 'Light', icon: SunIcon },
  { id: 'dark', label: 'Dark', icon: MoonIcon },
  { id: 'solar', label: 'Solarized', icon: SolarIcon },
]

const REPO_URL = 'https://github.com/CosmeValera/Sympho'

const viewOf = (hash: string): View => (hash === '#/library' ? 'library' : 'editor')

interface Draft {
  score: Score
  /** The title it's saved under once edited, so it can't be mistaken for another card in the library. */
  saveAs: string
}

const libraryTitles = () => loadLibrary().map((s) => s.title)

/** An example is always saved as a copy; a shared link keeps its title unless the library already has one like it. */
function exampleDraft(slug: string): Draft | null {
  const score = exampleScore(slug)
  return score && { score, saveAs: uniqueTitle(score.title, [...libraryTitles(), score.title], 'copy') }
}

/** Shared links (#/s/…) and examples (#/example/…) open as unsaved drafts. */
function draftFromHash(hash: string): Draft | null {
  if (hash.startsWith('#/s/')) {
    const score = decodeShare(hash.slice(4))
    return score && { score, saveAs: uniqueTitle(score.title, libraryTitles(), 'copy') }
  }
  if (hash.startsWith('#/example/')) return exampleDraft(decodeURIComponent(hash.slice(10)))
  return null
}

function initialEditor() {
  const draft = draftFromHash(location.hash)
  if (draft) return initEditor(draft.score, false, draft.saveAs)
  const lastId = lastOpenedId()
  const last = lastId ? loadLibrary().find((s) => s.id === lastId) : undefined
  if (last) return initEditor(last, true)
  const ode = exampleDraft('ode-to-joy')!
  return initEditor(ode.score, false, ode.saveAs)
}

function initialTheme(): Theme {
  const stored = readFlag('theme')
  if (THEMES.some((t) => t.id === stored)) return stored as Theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function App() {
  const [state, dispatch] = useReducer(editorReducer, undefined, initialEditor)
  const [view, setView] = useState(() => viewOf(location.hash))
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    const onHashChange = () => {
      setView(viewOf(location.hash))
      const draft = draftFromHash(location.hash)
      if (draft) dispatch({ type: 'load', score: draft.score, persisted: false, saveAs: draft.saveAs })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Every change is saved straight away; a score is a few kilobytes of JSON.
  useEffect(() => {
    if (!state.persisted) return
    saveScore(state.score)
    rememberOpened(state.score.id)
    // The draft is now the user's own copy: reloading should open that, not the link again.
    if (/^#\/(s|example)\//.test(location.hash)) history.replaceState(null, '', '#/')
  }, [state.persisted, state.score])

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const themeIndex = THEMES.findIndex((t) => t.id === theme)
  const current = THEMES[themeIndex]
  const nextTheme = THEMES[(themeIndex + 1) % THEMES.length]
  const ThemeIcon = current.icon

  const openEditor = (score: Score, persisted: boolean) => {
    dispatch({ type: 'load', score, persisted })
    location.hash = '#/'
  }

  return (
    <div className="app">
      <header className="app-header">
        <a className="brand" href="#/">
          <LogoMark />
          <span>Sympho</span>
        </a>
        <nav className="app-nav" aria-label="Main">
          <a href="#/" aria-current={view === 'editor' ? 'page' : undefined}>
            Editor
          </a>
          <a href="#/library" aria-current={view === 'library' ? 'page' : undefined}>
            Library
          </a>
        </nav>
        <div className="app-header-end">
          <button
            type="button"
            className="icon-button"
            aria-label={`Switch to ${nextTheme.label.toLowerCase()} theme`}
            data-tip={`Theme: ${current.label} · next: ${nextTheme.label}`}
            onClick={() => {
              setTheme(nextTheme.id)
              writeFlag('theme', nextTheme.id)
            }}
          >
            <ThemeIcon />
          </button>
          <a className="icon-button" href={REPO_URL} target="_blank" rel="noreferrer" aria-label="Source on GitHub" data-tip="Source">
            <GithubIcon />
          </a>
        </div>
      </header>

      {view === 'library' ? (
        <Library
          currentId={state.score.id}
          onOpen={(score) => openEditor(score, true)}
          onNew={() => openEditor(newScore(uniqueTitle('Untitled score', libraryTitles(), 'number')), false)}
          onDeleted={(id) => {
            // Keep the open score on screen, but stop saving it back.
            if (id === state.score.id) dispatch({ type: 'load', score: state.score, persisted: false })
          }}
          onImported={(scores) => {
            // A newer copy of the open score came in: show it, or the next edit would save over it.
            const fresh = scores.find((s) => s.id === state.score.id)
            if (fresh && fresh.updatedAt > state.score.updatedAt) dispatch({ type: 'load', score: fresh, persisted: true })
          }}
        />
      ) : (
        <Editor state={state} dispatch={dispatch} />
      )}
    </div>
  )
}
