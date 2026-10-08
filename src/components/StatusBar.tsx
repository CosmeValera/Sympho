import { type DurationValue, TICKS_PER_WHOLE, aValue, measureTicks, valueName } from '../music/duration'
import { pitchLabel } from '../music/pitch'
import type { Located } from '../music/score'
import type { Score } from '../music/types'
import type { Tool } from '../state/editor'

interface Props {
  score: Score
  tool: Tool
  /** Value of the next note written. */
  value: DurationValue
  selected: Located | null
  /** The selection is the note just written. */
  written: boolean
  /** Where typed notes go, while the caret is shown. */
  cursor: number | null
  /** Where the marker is: the sounding event while playing, else where playback will start. */
  marker: number
  playing: boolean
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
export function StatusBar({ score, tool, value, selected, written, cursor, marker, playing }: Props) {
  return (
    <div className="status-bar" aria-live="polite">
      <p className="status-help">
        <span className="mode-chip">{tool === 'write' ? 'Write' : 'Select'}</span>
        {selected ? <SelectionHelp selected={selected} written={written} /> : <ToolHelp tool={tool} value={value} />}
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

function ToolHelp({ tool, value }: { tool: Tool; value: DurationValue }) {
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
      <kbd>R</kbd> for a rest. Click a note to change it.
    </>
  )
}

function SelectionHelp({ selected, written }: { selected: Located; written: boolean }) {
  const { event, measureIndex } = selected
  const bar = `bar ${measureIndex + 1}`
  if (event.kind === 'rest' || !event.pitch) {
    const name = valueName(event)
    return (
      <>
        <strong>{name[0].toUpperCase() + name.slice(1)} rest</strong> {bar} · <kbd>A</kbd>–<kbd>G</kbd> fill it ·{' '}
        <kbd>Esc</kbd> deselect
      </>
    )
  }
  const name = `${pitchLabel(event.pitch)} ${valueName(event)}${event.tie ? ', tied' : ''}`
  if (written) {
    return (
      <>
        Wrote <strong>{name}</strong> · <kbd>↑</kbd>
        <kbd>↓</kbd> fix its pitch · <kbd>1</kbd>–<kbd>5</kbd> next value · keep typing to go on
      </>
    )
  }
  return (
    <>
      <strong>{name}</strong> {bar} · <kbd>↑</kbd>
      <kbd>↓</kbd> pitch · <kbd>+</kbd> <kbd>−</kbd> sharp, flat · <kbd>1</kbd>–<kbd>5</kbd> value · <kbd>Del</kbd> rest ·{' '}
      <kbd>Esc</kbd> deselect
    </>
  )
}
