import { useEffect, useMemo, useRef, useState } from 'react'
import { EXAMPLES, exampleScore } from '../examples'
import { instrumentInfo } from '../music/instruments'
import { KEY_SIGNATURES } from '../music/pitch'
import { newId } from '../music/score'
import { timeSignatureLabel } from '../music/serialize'
import type { Score } from '../music/types'
import { loadMusicFonts, renderScore } from '../render/renderScore'
import { deleteScore, loadLibrary, saveScore } from '../state/storage'
import { CopyIcon, PlusIcon, TrashIcon } from './Icons'

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

function Thumbnail({ score }: { score: Score }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let live = true
    void loadMusicFonts().then(() => {
      if (live && ref.current) renderScore(ref.current, score, { width: ref.current.clientWidth, scale: 0.62, maxRows: 2 })
    })
    return () => {
      live = false
    }
  }, [score])
  return <div className="thumb" ref={ref} aria-hidden="true" />
}

function details(score: Score): string {
  const key = KEY_SIGNATURES.find((k) => k.id === score.keySignature)?.label ?? score.keySignature
  return `${instrumentInfo(score.instrument).label} · ${key} · ${timeSignatureLabel(score.timeSignature)} · ${score.measures.length} bars`
}

interface Props {
  currentId: string
  onOpen: (score: Score) => void
  onNew: () => void
  onDeleted: (id: string) => void
}

export function Library({ currentId, onOpen, onNew, onDeleted }: Props) {
  const [scores, setScores] = useState(loadLibrary)
  const examples = useMemo(() => EXAMPLES.map((e) => ({ slug: e.slug, score: exampleScore(e.slug)! })), [])

  const duplicate = (score: Score) => {
    saveScore({ ...score, id: newId(), title: `${score.title} (copy)`, updatedAt: Date.now() })
    setScores(loadLibrary())
  }

  const remove = (score: Score) => {
    if (!window.confirm(`Delete “${score.title}”? This can't be undone.`)) return
    deleteScore(score.id)
    setScores(loadLibrary())
    onDeleted(score.id)
  }

  return (
    <main className="library">
      <section className="library-section">
        <div className="library-head">
          <div>
            <h1>Your scores</h1>
            <p className="muted">Saved automatically in this browser as you edit.</p>
          </div>
          <button type="button" className="button button-primary" onClick={onNew}>
            <PlusIcon />
            New score
          </button>
        </div>
        {scores.length === 0 ? (
          <p className="empty-state">Nothing here yet. Open an example below or start a new score, and your edits will show up here.</p>
        ) : (
          <ul className="card-grid">
            {scores.map((score) => (
              <li key={score.id} className={`score-card${score.id === currentId ? ' is-current' : ''}`}>
                <button type="button" className="card-open" onClick={() => onOpen(score)}>
                  <Thumbnail score={score} />
                  <span className="card-title">{score.title || 'Untitled score'}</span>
                  <span className="card-meta">{details(score)}</span>
                  <span className="card-meta">Edited {dateFormat.format(score.updatedAt)}</span>
                </button>
                <div className="card-actions">
                  <button type="button" className="icon-button" aria-label={`Duplicate ${score.title}`} data-tip="Duplicate" onClick={() => duplicate(score)}>
                    <CopyIcon />
                  </button>
                  <button type="button" className="icon-button is-danger" aria-label={`Delete ${score.title}`} data-tip="Delete" onClick={() => remove(score)}>
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="library-section">
        <div className="library-head">
          <div>
            <h2>Examples</h2>
            <p className="muted">Open one, edit it, and it's saved as your own copy.</p>
          </div>
        </div>
        <ul className="card-grid">
          {examples.map(({ slug, score }) => (
            <li key={slug} className="score-card">
              <a className="card-open" href={`#/example/${slug}`}>
                <Thumbnail score={score} />
                <span className="card-title">{score.title}</span>
                <span className="card-meta">{score.composer}</span>
                <span className="card-meta">{details(score)}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
