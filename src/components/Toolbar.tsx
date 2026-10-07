import type { ReactNode } from 'react'
import { DURATIONS, DURATION_NAMES, canDot } from '../music/duration'
import type { Duration, NoteEvent } from '../music/types'
import {
  BarAddIcon,
  BarRemoveIcon,
  KeyboardIcon,
  PlayIcon,
  RedoIcon,
  StopIcon,
  TieIcon,
  TrashIcon,
  UndoIcon,
} from './Icons'

/** SMuFL codepoints rendered with Bravura. */
const NOTE_GLYPH: Record<Duration, string> = { '1': '', '2': '', '4': '', '8': '', '16': '' }
const ACCIDENTALS = [
  { alter: -2, glyph: '', label: 'Double flat', key: '' },
  { alter: -1, glyph: '', label: 'Flat', key: '−' },
  { alter: 0, glyph: '', label: 'Natural', key: 'N' },
  { alter: 1, glyph: '', label: 'Sharp', key: '+' },
  { alter: 2, glyph: '', label: 'Double sharp', key: '' },
]

interface ToolButtonProps {
  label: string
  shortcut?: string
  pressed?: boolean
  disabled?: boolean
  className?: string
  onClick: () => void
  children: ReactNode
}

function ToolButton({ label, shortcut, pressed, disabled, className, onClick, children }: ToolButtonProps) {
  return (
    <button
      type="button"
      className={`tool${className ? ` ${className}` : ''}`}
      aria-label={label}
      aria-pressed={pressed}
      data-tip={shortcut ? `${label} · ${shortcut}` : label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface Props {
  duration: Duration
  restMode: boolean
  selected: NoteEvent | null
  playing: boolean
  canUndo: boolean
  canRedo: boolean
  canRemoveBar: boolean
  onPlay: () => void
  onDuration: (d: Duration) => void
  onRestMode: () => void
  onDot: () => void
  onAlter: (alter: number) => void
  onTie: () => void
  onDelete: () => void
  onUndo: () => void
  onRedo: () => void
  onAddBar: () => void
  onRemoveBar: () => void
  onShortcuts: () => void
}

export function Toolbar(props: Props) {
  const { duration, restMode, selected, playing } = props
  const note = selected?.kind === 'note' ? selected : null

  return (
    <div className="toolbar" role="toolbar" aria-label="Notation tools">
      <button
        type="button"
        className={`play-button${playing ? ' is-playing' : ''}`}
        onClick={props.onPlay}
        data-tip={playing ? 'Stop · Space' : selected ? 'Play from selection · Space' : 'Play · Space'}
      >
        {playing ? <StopIcon /> : <PlayIcon />}
        <span>{playing ? 'Stop' : 'Play'}</span>
      </button>

      <div className="tool-group" aria-label="Note value">
        {DURATIONS.map((d, i) => (
          <ToolButton
            key={d}
            label={`${DURATION_NAMES[d]} ${restMode ? 'rest' : 'note'}`}
            shortcut={String(i + 1)}
            pressed={duration === d}
            className="glyph-tool"
            onClick={() => props.onDuration(d)}
          >
            <span className="glyph">{NOTE_GLYPH[d]}</span>
          </ToolButton>
        ))}
      </div>

      <div className="tool-group">
        <ToolButton label="Rest input" shortcut="R adds a rest" pressed={restMode} className="glyph-tool" onClick={props.onRestMode}>
          <span className="glyph">{''}</span>
        </ToolButton>
        <ToolButton
          label="Dotted"
          shortcut="."
          pressed={!!selected?.dots}
          disabled={!selected || !canDot(selected.duration)}
          className="glyph-tool"
          onClick={props.onDot}
        >
          <span className="glyph glyph-dot">{''}</span>
        </ToolButton>
        <ToolButton label="Tie to next note" shortcut="T" pressed={!!note?.tie} disabled={!note} onClick={props.onTie}>
          <TieIcon />
        </ToolButton>
      </div>

      <div className="tool-group" aria-label="Accidentals">
        {ACCIDENTALS.map((a) => (
          <ToolButton
            key={a.alter}
            label={a.label}
            shortcut={a.key || undefined}
            pressed={note?.pitch?.alter === a.alter}
            disabled={!note}
            className={`glyph-tool${a.key ? '' : ' is-secondary'}`}
            onClick={() => props.onAlter(a.alter)}
          >
            <span className="glyph">{a.glyph}</span>
          </ToolButton>
        ))}
      </div>

      <div className="tool-group">
        <ToolButton label="Delete note" shortcut="Del" disabled={!note} onClick={props.onDelete}>
          <TrashIcon />
        </ToolButton>
        <ToolButton label="Undo" shortcut="Ctrl Z" disabled={!props.canUndo} onClick={props.onUndo}>
          <UndoIcon />
        </ToolButton>
        <ToolButton label="Redo" shortcut="Ctrl Y" disabled={!props.canRedo} onClick={props.onRedo}>
          <RedoIcon />
        </ToolButton>
      </div>

      <div className="tool-group">
        <ToolButton label="Add bar" onClick={props.onAddBar}>
          <BarAddIcon />
        </ToolButton>
        <ToolButton label="Remove last bar" disabled={!props.canRemoveBar} onClick={props.onRemoveBar}>
          <BarRemoveIcon />
        </ToolButton>
      </div>

      <ToolButton label="Keyboard shortcuts" shortcut="?" className="toolbar-end" onClick={props.onShortcuts}>
        <KeyboardIcon />
      </ToolButton>
    </div>
  )
}
