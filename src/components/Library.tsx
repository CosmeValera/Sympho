import { useEffect, useMemo, useRef, useState } from 'react'
import { downloadBlob } from '../download'
import { EXAMPLES, exampleScore } from '../examples'
import { instrumentInfo } from '../music/instruments'
import { KEY_SIGNATURES } from '../music/pitch'
import { newId } from '../music/score'
import { timeSignatureLabel } from '../music/serialize'
import type { Score } from '../music/types'
import { loadMusicFonts, renderScore } from '../render/renderScore'
import { describeMerge, libraryFile, mergeBackup } from '../state/backup'
import { deleteScore, loadLibrary, replaceLibrary, saveScore } from '../state/storage'
import { uniqueTitle } from '../state/titles'
import { CloseIcon, CopyIcon, DownloadIcon, PlusIcon, TrashIcon, UploadIcon } from './Icons'

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
  /** A backup was imported; `scores` is the whole library after it. */
  onImported: (scores: Score[]) => void
}

export function Library({ currentId, onOpen, onNew, onDeleted, onImported }: Props) {
  const [scores, setScores] = useState(loadLibrary)
  const [notice, setNotice] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const examples = useMemo(() => EXAMPLES.map((e) => ({ slug: e.slug, score: exampleScore(e.slug)! })), [])

  const duplicate = (score: Score) => {
    const title = uniqueTitle(score.title, scores.map((s) => s.title), 'copy')
    saveScore({ ...score, id: newId(), title, updatedAt: Date.now() })
    setScores(loadLibrary())
    setNotice(`Duplicated as “${title}”`)
  }

  const remove = (score: Score) => {
    if (!window.confirm(`Delete “${score.title}”? This can't be undone.`)) return
    deleteScore(score.id)
    setScores(loadLibrary())
    onDeleted(score.id)
  }

  const exportLibrary = () => {
    const json = JSON.stringify(libraryFile(loadLibrary()), null, 2)
    const date = new Date().toISOString().slice(0, 10)
    downloadBlob(new Blob([json], { type: 'application/json' }), `sympho-library-${date}.json`)
  }

  const importLibrary = async (file: File) => {
    try {
      const result = mergeBackup(loadLibrary(), await file.text())
      if (!replaceLibrary(result.scores)) throw new Error("This browser's storage is full, so nothing was imported")
      setScores(result.scores)
      setNotice(describeMerge(result))
      onImported(result.scores)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Couldn't read that file")
    }
  }

  return (
    <main className="library">
      <section className="library-section">
        <div className="library-head">
          <div>
            <h1>Your scores</h1>
            <p className="muted">
              Saved in this browser as you edit, newest first. Export a backup to keep them safe or move them to another
              device.
            </p>
          </div>
          <div className="library-actions">
            <button
              type="button"
              className="button"
              onClick={exportLibrary}
              disabled={scores.length === 0}
              data-tip={scores.length === 0 ? 'Nothing to export yet' : undefined}
            >
              <DownloadIcon />
              Export
            </button>
            <button type="button" className="button" onClick={() => fileRef.current?.click()}>
              <UploadIcon />
              Import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) void importLibrary(file)
              }}
            />
            <button type="button" className="button button-primary" onClick={onNew}>
              <PlusIcon />
              New score
            </button>
          </div>
        </div>
        {notice && (
          <div className="library-notice" role="status">
            <span>{notice}</span>
            <button type="button" className="icon-button" aria-label="Dismiss" onClick={() => setNotice(null)}>
              <CloseIcon />
            </button>
          </div>
        )}
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
