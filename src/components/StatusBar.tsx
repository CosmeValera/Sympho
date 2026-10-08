import { DURATION_NAMES, beatTicks, measureTicks } from '../music/duration'
import { pitchLabel } from '../music/pitch'
import type { Located } from '../music/score'
import type { Duration, NoteEvent, Score } from '../music/types'
import type { Tool } from '../state/editor'

interface Props {
  score: Score
  tool: Tool
  duration: Duration
  selected: Located | null
  /** Where the marker is: the sounding event while playing, else where playback will start. */
  marker: number
  playing: boolean
}

function valueName(event: Pick<NoteEvent, 'duration' | 'dots'>): string {
  const name = DURATION_NAMES[event.duration].toLowerCase()
  return event.dots ? `dotted ${name}` : name
}

/** `bar 3, beat 2.5` for a tick. */
function position(score: Score, tick: number): string {
  const cap = measureTicks(score.timeSignature)
  const bar = Math.floor(tick / cap) + 1
  const beat = 1 + (tick % cap) / beatTicks(score.timeSignature)
  return `bar ${bar}, beat ${Number(beat.toFixed(2))}`
}

/** One line under the toolbar saying what a click does now, and what the selection is. */
export function StatusBar({ score, tool, duration, selected, marker, playing }: Props) {
  return (
    <div className="status-bar" aria-live="polite">
      <p className="status-help">{selected ? <SelectionHelp selected={selected} /> : <ToolHelp tool={tool} duration={duration} />}</p>
      <p className="status-marker">
        <span className="marker-dot" aria-hidden="true" />
        {playing ? 'Playing ' : 'Plays from '}
        {marker === 0 && !playing ? 'the start' : position(score, marker)}
      </p>
    </div>
  )
}

function ToolHelp({ tool, duration }: { tool: Tool; duration: Duration }) {
  const value = DURATION_NAMES[duration].toLowerCase()
  if (tool === 'select') {
    return (
      <>
        <strong>Select</strong> Click a note or rest to edit it. <kbd>W</kbd> goes back to writing.
      </>
    )
  }
  if (tool === 'rest') {
    return (
      <>
        <strong>Rests</strong> Click the staff to write a {value} rest, or type <kbd>R</kbd>.
      </>
    )
  }
  return (
    <>
      <strong>Notes</strong> Click the staff to write a {value} note, or type <kbd>A</kbd>–<kbd>G</kbd>. Click on a note to select it.
    </>
  )
}

function SelectionHelp({ selected }: { selected: Located }) {
  const { event, measureIndex } = selected
  const bar = `bar ${measureIndex + 1}`
  if (event.kind === 'rest' || !event.pitch) {
    const name = valueName(event)
    return (
      <>
        <strong>{name[0].toUpperCase() + name.slice(1)} rest</strong> {bar} · <kbd>A</kbd>–<kbd>G</kbd> write after it · <kbd>Esc</kbd> deselect
      </>
    )
  }
  return (
    <>
      <strong>
        {pitchLabel(event.pitch)} {valueName(event)}
      </strong>{' '}
      {bar} · <kbd>+</kbd> sharp · <kbd>−</kbd> flat · <kbd>↑</kbd>
      <kbd>↓</kbd> pitch · <kbd>Esc</kbd> deselect
    </>
  )
}
