import { useState } from 'react'
import { INSTRUMENTS } from '../music/instruments'
import { KEY_SIGNATURES } from '../music/pitch'
import { MAX_BPM, MIN_BPM, TIME_SIGNATURES, timeSignatureLabel } from '../music/serialize'
import type { Instrument, Score, TimeSignature } from '../music/types'
import { DownloadIcon, LinkIcon } from './Icons'

interface Props {
  score: Score
  status: string
  onMeta: (patch: Partial<Pick<Score, 'title' | 'composer'>>) => void
  onInstrument: (instrument: Instrument) => void
  onKeySignature: (key: string) => void
  onTimeSignature: (ts: TimeSignature) => void
  onBpm: (bpm: number) => void
  onShare: () => void
  onExportMidi: () => void
  onExportSvg: () => void
}

/** Commits on blur or Enter, so typing "120" doesn't pass through a clamped "1". */
function BpmInput({ bpm, onBpm }: { bpm: number; onBpm: (bpm: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    const value = Number(draft)
    if (Number.isFinite(value) && draft.trim() !== '') onBpm(Math.round(Math.max(MIN_BPM, Math.min(MAX_BPM, value))))
    setDraft(null)
  }
  return (
    <label className="field field-tempo">
      <span className="field-label">Tempo</span>
      <span className="tempo-input">
        <span className="glyph" aria-hidden="true">
          {''}
        </span>
        <span aria-hidden="true">=</span>
        <input
          type="number"
          inputMode="numeric"
          min={MIN_BPM}
          max={MAX_BPM}
          value={draft ?? bpm}
          aria-label="Beats per minute"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
        />
      </span>
    </label>
  )
}

export function ScoreHeader(props: Props) {
  const { score } = props
  const tsValue = timeSignatureLabel(score.timeSignature)

  return (
    <section className="score-header">
      <div className="score-titles">
        <input
          className="title-input"
          value={score.title}
          maxLength={120}
          placeholder="Untitled score"
          aria-label="Title"
          onChange={(e) => props.onMeta({ title: e.target.value })}
        />
        <div className="subtitle-row">
          <input
            className="composer-input"
            value={score.composer}
            maxLength={120}
            placeholder="Composer"
            aria-label="Composer"
            onChange={(e) => props.onMeta({ composer: e.target.value })}
          />
          <span className="save-status">{props.status}</span>
        </div>
      </div>

      <div className="score-settings">
        <label className="field">
          <span className="field-label">Instrument</span>
          <select value={score.instrument} onChange={(e) => props.onInstrument(e.target.value as Instrument)}>
            {INSTRUMENTS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Key</span>
          <select value={score.keySignature} onChange={(e) => props.onKeySignature(e.target.value)}>
            {KEY_SIGNATURES.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Time</span>
          <select
            value={tsValue}
            onChange={(e) => {
              const ts = TIME_SIGNATURES.find((t) => timeSignatureLabel(t) === e.target.value)
              if (ts) props.onTimeSignature(ts)
            }}
          >
            {TIME_SIGNATURES.map((t) => (
              <option key={timeSignatureLabel(t)} value={timeSignatureLabel(t)}>
                {timeSignatureLabel(t)}
              </option>
            ))}
          </select>
        </label>
        <BpmInput bpm={score.bpm} onBpm={props.onBpm} />

        <div className="score-actions">
          <button type="button" className="button" onClick={props.onShare}>
            <LinkIcon />
            Share
          </button>
          <button type="button" className="button" onClick={props.onExportMidi}>
            <DownloadIcon />
            MIDI
          </button>
          <button type="button" className="button" onClick={props.onExportSvg}>
            <DownloadIcon />
            SVG
          </button>
        </div>
      </div>
    </section>
  )
}
