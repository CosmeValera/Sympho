import { type DurationValue, TICKS_PER_WHOLE, aValue, measureTicks, valueName } from '../music/duration'
import { pitchLabel } from '../music/pitch'
import type { Located } from '../music/score'
import type { Pitch, Score } from '../music/types'
import type { Tool } from '../state/editor'

interface Props {
  score: Score
  tool: Tool
  /** Value of the next note written. */
  value: DurationValue
  selected: Located | null
  /** The selected note's pitch; in a chord, the note picked out. */
  head: Pitch | null
  /** The selection is the note just written. */
  written: boolean
  /** Where typed notes go, while the caret is shown. */
  cursor: number | null
  /** Where the marker is: the sounding event while playing, else where playback will start. */
  marker: number
  playing: boolean
  /** On a touchscreen the hints talk about taps and the toolbar instead of keys. */
  touch: boolean
}

/** `bar 3, beat 2.5` for a tick, counting the beats the time signature names (eighths in 6/8). */
function position(score: Score, tick: number): string {
  const cap = measureTicks(score.timeSignature)
  const bar = Math.floor(tick / cap) + 1
  const beat = 1 + (tick % cap) / (TICKS_PER_WHOLE / score.timeSignature.beatValue)
  return `bar ${bar}, beat ${Number(beat.toFixed(2))}`
}

/**
 * One line under the toolbar: which tool is on, what a click does now or what
 * the selection is, and where the caret and the playback marker are.
 */
export function StatusBar({ score, tool, value, selected, head, written, cursor, marker, playing, touch }: Props) {
  return (
    <div className="status-bar" aria-live="polite">
      <p className="status-help">
        <span className="mode-chip">{tool === 'write' ? 'Write' : 'Select'}</span>
        {selected ? (
          <SelectionHelp selected={selected} head={head} written={written} tool={tool} touch={touch} />
        ) : (
          <ToolHelp tool={tool} value={value} touch={touch} />
        )}
      </p>
      <div className="status-markers">
        {cursor !== null && (
          <p className="status-marker">
            <span className="caret-dot" aria-hidden="true" />
            Writes at {position(score, cursor)}
          </p>
        )}
        <p className="status-marker">
          <span className="marker-dot" aria-hidden="true" />
          {playing ? 'Playing ' : 'Plays from '}
          {marker === 0 && !playing ? 'the start' : position(score, marker)}
        </p>
      </div>
    </div>
  )
}

function ToolHelp({ tool, value, touch }: { tool: Tool; value: DurationValue; touch: boolean }) {
  if (touch) {
    return tool === 'select' ? (
      <>Tap a note or rest to edit it.</>
    ) : (
      <>
        Tap the staff to write {aValue(value)} note, or hold and slide to aim it. Aim above or below a note to make a
        chord.
      </>
    )
  }
  if (tool === 'select') {
    return (
      <>
        Click a note or rest to edit it. <kbd>W</kbd> goes back to writing.
      </>
    )
  }
  return (
    <>
      Type <kbd>A</kbd>–<kbd>G</kbd> or click the staff to write {aValue(value)} note,{' '}
      <kbd>R</kbd> for a rest. Click above or below a note to make a chord.
    </>
  )
}

interface SelectionHelpProps {
  selected: Located
  head: Pitch | null
  written: boolean
  tool: Tool
  touch: boolean
}

function SelectionHelp({ selected, head, written, tool, touch }: SelectionHelpProps) {
  const { event, measureIndex } = selected
  const bar = `bar ${measureIndex + 1}`
  if (event.kind === 'rest' || !event.pitches || !head) {
    const name = valueName(event)
    return (
      <>
        <strong>{name[0].toUpperCase() + name.slice(1)} rest</strong> {bar} ·{' '}
        {touch ? (
          'tap the staff to fill it'
        ) : (
          <>
            <kbd>A</kbd>–<kbd>G</kbd> fill it · <kbd>Esc</kbd> deselect
          </>
        )}
      </>
    )
  }
  const value = `${valueName(event)}${event.tie ? ', tied' : ''}`
  if (event.pitches.length > 1) {
    return <ChordHelp pitches={event.pitches} head={head} value={value} bar={bar} written={written} touch={touch} />
  }
  const name = `${pitchLabel(head)} ${value}`
  if (touch) {
    return (
      <>
        {written ? 'Wrote ' : ''}
        <strong>{name}</strong> {written ? '' : `${bar} `}· the buttons below change it
        {tool === 'write' && ' · hold above or below it to add a chord note'}
      </>
    )
  }
  if (written) {
    return (
      <>
        Wrote <strong>{name}</strong> · <kbd>↑</kbd>
        <kbd>↓</kbd> fix its pitch · <kbd>Shift</kbd> <kbd>A</kbd>–<kbd>G</kbd> add a chord note · <kbd>1</kbd>–<kbd>5</kbd> next
        value · keep typing to go on
      </>
    )
  }
  return (
    <>
      <strong>{name}</strong> {bar} · <kbd>↑</kbd>
      <kbd>↓</kbd> pitch · <kbd>+</kbd> <kbd>−</kbd> sharp, flat · <kbd>Shift</kbd> <kbd>A</kbd>–<kbd>G</kbd> chord ·{' '}
      <kbd>1</kbd>–<kbd>5</kbd> value · <kbd>Del</kbd> rest · <kbd>Esc</kbd> deselect
    </>
  )
}

interface ChordHelpProps {
  pitches: Pitch[]
  head: Pitch
  value: string
  bar: string
  written: boolean
  touch: boolean
}

/** A chord, its notes named with the one the keys change underlined. */
function ChordHelp({ pitches, head, value, bar, written, touch }: ChordHelpProps) {
  const label = pitchLabel(head)
  return (
    <>
      {written ? 'Wrote ' : ''}
      <strong>
        {pitches.map((p) => {
          const name = pitchLabel(p)
          return (
            <span key={name} className={name === label ? 'status-head' : undefined}>
              {name}{' '}
            </span>
          )
        })}
        {value}
      </strong>
      {written ? '' : `${bar} `}·{' '}
      {touch ? (
        <>tap a note to pick it · the buttons below change {label}</>
      ) : (
        <>
          <kbd>Alt</kbd> <kbd>↑</kbd>
          <kbd>↓</kbd> pick a note · <kbd>↑</kbd>
          <kbd>↓</kbd> move {label} · <kbd>Shift</kbd> <kbd>A</kbd>–<kbd>G</kbd> add · <kbd>Del</kbd> remove {label}
        </>
      )}
    </>
  )
}
