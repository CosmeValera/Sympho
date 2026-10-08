import type { ReactNode } from 'react'
import { type DurationValue, DURATIONS, DURATION_NAMES, aValue, canDot } from '../music/duration'
import { keyAlter } from '../music/pitch'
import type { Duration, NoteEvent, Pitch } from '../music/types'
import type { Tool } from '../state/editor'
import {
  BarAddIcon,
  BarRemoveIcon,
  KeyboardIcon,
  PauseIcon,
  PlayFromStartIcon,
  PlayIcon,
  PointerIcon,
  RedoIcon,
  StepDownIcon,
  StepUpIcon,
  TieIcon,
  TrashIcon,
  UndoIcon,
} from './Icons'

/** SMuFL codepoints rendered with Bravura. */
const NOTE_GLYPH: Record<Duration, string> = { '1': '\uE1D2', '2': '\uE1D3', '4': '\uE1D5', '8': '\uE1D7', '16': '\uE1D9' }
const REST_GLYPH: Record<Duration, string> = { '1': '\uE4E3', '2': '\uE4E4', '4': '\uE4E5', '8': '\uE4E6', '16': '\uE4E7' }
const DOT_GLYPH = '\uE1E7'
const ACCIDENTALS = [
  { alter: -2, glyph: '\uE264', label: 'Double flat', key: '' },
  { alter: -1, glyph: '\uE260', label: 'Flat', key: '−' },
  { alter: 0, glyph: '\uE261', label: 'Natural', key: 'N' },
  { alter: 1, glyph: '\uE262', label: 'Sharp', key: '+' },
  { alter: 2, glyph: '\uE263', label: 'Double sharp', key: '' },
]

const TOOLS: { tool: Tool; label: string; key: string; tip: string; icon: ReactNode }[] = [
  { tool: 'select', label: 'Select', key: 'S', tip: 'Click picks a note to edit', icon: <PointerIcon /> },
  { tool: 'write', label: 'Write', key: 'W', tip: 'Click writes a note', icon: <span className="glyph">{NOTE_GLYPH['4']}</span> },
]

const NEEDS_NOTE = 'select a note first'

interface ToolButtonProps {
  label: string
  shortcut?: string
  pressed?: boolean
  disabled?: boolean
  /** Why it's disabled, shown in the tooltip instead of the shortcut. */
  hint?: string
  className?: string
  onClick: () => void
  children: ReactNode
}

function ToolButton({ label, shortcut, pressed, disabled, hint, className, onClick, children }: ToolButtonProps) {
  const extra = disabled && hint ? hint : shortcut
  return (
    <button
      type="button"
      className={`tool${className ? ` ${className}` : ''}`}
      aria-label={label}
      aria-pressed={pressed}
      data-tip={extra ? `${label} · ${extra}` : label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface Props {
  tool: Tool
  /** Value of the next note written; a picked note's own value. */
  value: DurationValue
  selected: NoteEvent | null
  /** The selected note's pitch; in a chord, the note picked out. */
  pitch: Pitch | null
  keySignature: string
  playing: boolean
  /** What undo and redo would do, if anything. */
  undoLabel: string | null
  redoLabel: string | null
  canRemoveBar: boolean
  onPlay: () => void
  /** Moves the marker back to the beginning and plays from there. */
  onPlayFromStart: () => void
  onTool: (tool: Tool) => void
  onDuration: (d: Duration) => void
  /** Writes a rest of the current value at the caret. */
  onRest: () => void
  onDot: () => void
  onStep: (steps: number) => void
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
  const { tool, value, selected, playing } = props
  const note = selected?.kind === 'note' ? selected : null
  const pitch = note && props.pitch
  const chord = (note?.pitches?.length ?? 0) > 1
  // A natural only means something where the key would otherwise sharpen or flatten the note.
  const shown = (alter: number) =>
    !!pitch && pitch.alter === alter && (alter !== 0 || keyAlter(props.keySignature, pitch.step) !== 0)

  return (
    <div className="toolbar" role="toolbar" aria-label="Notation tools">
      <div className="transport">
        <button
          type="button"
          className={`play-button${playing ? ' is-playing' : ''}`}
          onClick={props.onPlay}
          aria-label={playing ? 'Pause' : 'Play'}
          data-tip={playing ? 'Pause · Space' : 'Play from the marker · Space'}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
          <span className="play-label">{playing ? 'Pause' : 'Play'}</span>
        </button>
        <ToolButton label="Play from the beginning" shortcut="Shift Space" onClick={props.onPlayFromStart}>
          <PlayFromStartIcon />
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

      <div className="tool-group tools-value" aria-label="Note value">
        {DURATIONS.map((d, i) => (
          <ToolButton
            key={d}
            label={`${DURATION_NAMES[d]} note`}
            shortcut={String(i + 1)}
            pressed={value.duration === d}
            className="glyph-tool"
            onClick={() => props.onDuration(d)}
          >
            <span className="glyph">{NOTE_GLYPH[d]}</span>
          </ToolButton>
        ))}
        <ToolButton
          label="Dotted"
          shortcut="."
          pressed={value.dots === 1}
          disabled={!canDot(value.duration)}
          hint="not for sixteenths"
          className="glyph-tool"
          onClick={props.onDot}
        >
          <span className="glyph glyph-dot">{DOT_GLYPH}</span>
        </ToolButton>
        {/* An action, not a mode: rests are the gaps between notes, so one is only ever written at the caret. */}
        <span className="tool-divider" aria-hidden="true" />
        <ToolButton label={`Write ${aValue(value)} rest`} shortcut="R" className="glyph-tool" onClick={props.onRest}>
          <span className="glyph">
            {REST_GLYPH[value.duration]}
            {value.dots ? DOT_GLYPH : ''}
          </span>
        </ToolButton>
      </div>

      <div className="tool-group tools-pitch" aria-label="Pitch">
        <ToolButton label="Up a step" shortcut="↑" disabled={!note} hint={NEEDS_NOTE} onClick={() => props.onStep(1)}>
          <StepUpIcon />
        </ToolButton>
        <ToolButton label="Down a step" shortcut="↓" disabled={!note} hint={NEEDS_NOTE} onClick={() => props.onStep(-1)}>
          <StepDownIcon />
        </ToolButton>
        {ACCIDENTALS.map((a) => (
          <ToolButton
            key={a.alter}
            label={a.label}
            shortcut={a.key || undefined}
            pressed={shown(a.alter)}
            disabled={!note}
            hint={NEEDS_NOTE}
            className={`glyph-tool${a.key ? '' : ' is-secondary'}`}
            onClick={() => props.onAlter(a.alter)}
          >
            <span className="glyph">{a.glyph}</span>
          </ToolButton>
        ))}
      </div>

      <div className="tool-group tools-note">
        <ToolButton label="Tie to next note" shortcut="T" pressed={!!note?.tie} disabled={!note} hint={NEEDS_NOTE} onClick={props.onTie}>
          <TieIcon />
        </ToolButton>
        <ToolButton label={chord ? 'Remove note from chord' : 'Turn into a rest'} shortcut="Del" disabled={!note} hint={NEEDS_NOTE} onClick={props.onDelete}>
          <TrashIcon />
        </ToolButton>
      </div>

      <div className="tool-group tools-history">
        <ToolButton
          label={props.undoLabel ? `Undo ${props.undoLabel}` : 'Undo'}
          shortcut="Ctrl Z"
          disabled={!props.undoLabel}
          onClick={props.onUndo}
        >
          <UndoIcon />
        </ToolButton>
        <ToolButton
          label={props.redoLabel ? `Redo ${props.redoLabel}` : 'Redo'}
          shortcut="Ctrl Y"
          disabled={!props.redoLabel}
          onClick={props.onRedo}
        >
          <RedoIcon />
        </ToolButton>
      </div>

      <div className="tool-group tools-bars">
        <ToolButton label="Add a bar at the end" onClick={props.onAddBar}>
          <BarAddIcon />
        </ToolButton>
        <ToolButton label="Remove the last bar" disabled={!props.canRemoveBar} onClick={props.onRemoveBar}>
          <BarRemoveIcon />
        </ToolButton>
      </div>

      <ToolButton label="Keyboard shortcuts" shortcut="?" className="toolbar-end" onClick={props.onShortcuts}>
        <KeyboardIcon />
      </ToolButton>
    </div>
  )
}
