import type { ReactNode } from 'react'
import { DURATIONS, DURATION_NAMES, canDot } from '../music/duration'
import type { Duration, NoteEvent } from '../music/types'
import type { Tool } from '../state/editor'
import {
  BarAddIcon,
  BarRemoveIcon,
  KeyboardIcon,
  PauseIcon,
  PlayIcon,
  PointerIcon,
  RedoIcon,
  TieIcon,
  ToStartIcon,
  TrashIcon,
  UndoIcon,
} from './Icons'

/** SMuFL codepoints rendered with Bravura. */
const NOTE_GLYPH: Record<Duration, string> = { '1': '\uE1D2', '2': '\uE1D3', '4': '\uE1D5', '8': '\uE1D7', '16': '\uE1D9' }
const REST_GLYPH: Record<Duration, string> = { '1': '\uE4E3', '2': '\uE4E4', '4': '\uE4E5', '8': '\uE4E6', '16': '\uE4E7' }
const ACCIDENTALS = [
  { alter: -2, glyph: '\uE264', label: 'Double flat', key: '' },
  { alter: -1, glyph: '\uE260', label: 'Flat', key: '−' },
  { alter: 0, glyph: '\uE261', label: 'Natural', key: 'N' },
  { alter: 1, glyph: '\uE262', label: 'Sharp', key: '+' },
  { alter: 2, glyph: '\uE263', label: 'Double sharp', key: '' },
]

const TOOLS: { tool: Tool; label: string; key: string; tip: string; icon: ReactNode }[] = [
  { tool: 'select', label: 'Select', key: 'S', tip: 'Click picks a note to edit', icon: <PointerIcon /> },
  { tool: 'note', label: 'Notes', key: 'W', tip: 'Click writes a note', icon: <span className="glyph">{NOTE_GLYPH['4']}</span> },
  { tool: 'rest', label: 'Rests', key: 'Shift R', tip: 'Click writes a rest', icon: <span className="glyph">{REST_GLYPH['4']}</span> },
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
  tool: Tool
  duration: Duration
  selected: NoteEvent | null
  playing: boolean
  /** Playback would already start from the beginning. */
  atStart: boolean
  canUndo: boolean
  canRedo: boolean
  canRemoveBar: boolean
  onPlay: () => void
  onToStart: () => void
  onTool: (tool: Tool) => void
  onDuration: (d: Duration) => void
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
  const { tool, duration, selected, playing } = props
  const note = selected?.kind === 'note' ? selected : null
  const rests = tool === 'rest'

  return (
    <div className="toolbar" role="toolbar" aria-label="Notation tools">
      <div className="transport">
        <button
          type="button"
          className={`play-button${playing ? ' is-playing' : ''}`}
          onClick={props.onPlay}
          data-tip={playing ? 'Pause · Space' : 'Play from the marker · Space'}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
          <span>{playing ? 'Pause' : 'Play'}</span>
        </button>
        <ToolButton label="Back to start" shortcut="Home" disabled={props.atStart} onClick={props.onToStart}>
          <ToStartIcon />
        </ToolButton>
      </div>

      <div className="segmented" role="radiogroup" aria-label="Click on the staff to">
        {TOOLS.map((t) => (
          <button
            key={t.tool}
            type="button"
            role="radio"
            aria-checked={tool === t.tool}
            className="segment"
            data-tip={`${t.tip} · ${t.key}`}
            onClick={() => props.onTool(t.tool)}
          >
            {t.icon}
            <span className="segment-label">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="tool-group" aria-label="Note value">
        {DURATIONS.map((d, i) => (
          <ToolButton
            key={d}
            label={`${DURATION_NAMES[d]} ${rests ? 'rest' : 'note'}`}
            shortcut={String(i + 1)}
            pressed={duration === d}
            className="glyph-tool"
            onClick={() => props.onDuration(d)}
          >
            <span className="glyph">{rests ? REST_GLYPH[d] : NOTE_GLYPH[d]}</span>
          </ToolButton>
        ))}
      </div>

      <div className="tool-group">
        <ToolButton
          label="Dotted"
          shortcut="."
          pressed={!!selected?.dots}
          disabled={!selected || !canDot(selected.duration)}
          className="glyph-tool"
          onClick={props.onDot}
        >
          <span className="glyph glyph-dot">{'\uE1E7'}</span>
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
