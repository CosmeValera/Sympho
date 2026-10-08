import { type Dispatch, useEffect, useEffectEvent, useState } from 'react'
import { player } from '../audio/player'
import { downloadBlob, fileName } from '../download'
import { type DurationValue, DURATIONS, aValue, canDot, measureTicks, valueName, valueTicks } from '../music/duration'
import { diatonicIndex, fromDiatonic, nearestPitch, pitchAbove, pitchLabel } from '../music/pitch'
import {
  type EditResult,
  addMeasure,
  addPitch,
  headOf,
  locate,
  locateAll,
  moveSteps,
  placeAt,
  removeLastMeasure,
  removeNote,
  setAlter,
  setTimeSignature,
  setValue,
  toggleDot,
  toggleTie,
} from '../music/score'
import { encodeShare } from '../music/serialize'
import type { Duration, Pitch, Score, Step } from '../music/types'
import type { EditorAction, EditorState, Tool } from '../state/editor'
import { ScoreHeader } from './ScoreHeader'
import { type StaffHit, ScoreView } from './ScoreView'
import { ShortcutsDialog } from './ShortcutsDialog'
import { StatusBar } from './StatusBar'
import { Toolbar } from './Toolbar'
import { useMediaQuery } from './useMediaQuery'

type Edit = (score: Score, id: string, head: number | null) => EditResult | Score

const MIDDLE_LINE: Pitch = { step: 'B', octave: 4, alter: 0 }

const ALTER_NAMES: Record<number, string> = { [-2]: 'double flat', [-1]: 'flat', 0: 'natural', 1: 'sharp', 2: 'double sharp' }

/** Keys a focused dropdown uses itself. Any other key is a shortcut, not a jump to a matching option ("4" picking 4/4). */
const SELECT_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Home', 'End', 'PageUp', 'PageDown', 'Tab', 'Escape'])

/** Whether the focused field needs `key` for itself, so it isn't a shortcut. */
function ownsKey(target: EventTarget | null, key: string): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target instanceof HTMLSelectElement) return SELECT_KEYS.has(key)
  return !!target.closest('input, textarea, [contenteditable="true"]')
}

/** The pitch typed letters are placed nearest to: the last note before the caret, or a chord's lowest note. */
function referencePitch(score: Score, tick: number): Pitch {
  const before = locateAll(score).filter((l) => l.event.pitches && l.start < tick)
  return before.at(-1)?.event.pitches?.[0] ?? MIDDLE_LINE
}

/** The event being heard; `id` is null until the first one sounds. */
interface Sounding {
  id: string | null
  tick: number
}

interface EditOptions {
  /** Play the selected note afterwards. */
  audition?: boolean
  /** The edit writes the note it selects. */
  written?: boolean
}

interface Props {
  state: EditorState
  dispatch: Dispatch<EditorAction>
}

export function Editor({ state, dispatch }: Props) {
  const { score, selectedId, duration, dots, tool, playhead, cursor } = state
  const value: DurationValue = { duration, dots }
  const located = locate(score, selectedId) ?? null
  const selected = located?.event ?? null
  // A note picked to edit, as opposed to one just written: value keys change it.
  const pickedNote = selected?.kind === 'note' && !state.written ? selected : null
  // The note of the selection that arrows, accidentals and Del change: in a chord, the one picked out.
  const headPitch = selected?.pitches?.find((p) => diatonicIndex(p) === state.head) ?? null
  const inChord = (selected?.pitches?.length ?? 0) > 1
  // Non-null while playing.
  const [sounding, setSounding] = useState<Sounding | null>(null)
  const playing = sounding !== null
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  // `at` makes the same message twice in a row count as a new one.
  const [toast, setToast] = useState<{ text: string; at: number } | null>(null)
  const [auditionCount, setAuditionCount] = useState(0)
  // Like a focus ring, the caret only shows for keyboard work: typing a note or moving with ← → shows it,
  // and a click on the staff, Esc or playing hides it. A mouse user already sees where a click writes.
  const [typing, setTyping] = useState(false)
  const showCaret = tool === 'write' && typing && !playing
  // A finger rather than a mouse: the status bar talks about taps and the toolbar instead of keys.
  const touch = useMediaQuery('(pointer: coarse)')

  const notify = (text: string) => setToast({ text, at: Date.now() })

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  // Leaving the editor should silence it.
  useEffect(() => () => player.stop(), [])

  /**
   * Plays from `from` without moving the marker: when the piece ends the marker
   * is back where it was. Pausing is what moves it.
   */
  const playFrom = (from: number) => {
    setSounding({ id: null, tick: from })
    setTyping(false)
    player
      .play(score, from, {
        onEvent: (id, tick) => setSounding({ id, tick }),
        onEnd: () => setSounding(null),
      })
      .catch(() => {
        player.stop()
        setSounding(null)
        notify("Couldn't start audio in this browser")
      })
  }

  /** Stops and leaves the marker on the note that was sounding, so playing again resumes there. */
  const pause = () => {
    player.stop()
    if (sounding) dispatch({ type: 'seek', tick: sounding.tick })
    setSounding(null)
  }

  const togglePlay = () => (playing ? pause() : playFrom(playhead))

  /** Moves the marker; while playing, playback jumps there too. */
  const seek = (tick: number) => {
    dispatch({ type: 'seek', tick })
    if (playing) playFrom(tick)
  }

  /** Dispatches a change to the music; the scheduled playback would be stale after it. */
  const change = (action: EditorAction) => {
    if (playing) pause()
    dispatch(action)
  }

  const auditionSelected = useEffectEvent(() => {
    if (selected?.pitches) void player.audition(selected.pitches, score.instrument)
  })
  useEffect(() => {
    if (auditionCount) auditionSelected()
  }, [auditionCount])

  /** `label` names the edit in undo messages, in lower case: "write C5 quarter". */
  const edit = (
    label: string,
    fn: (score: Score, selectedId: string | null, head: number | null) => EditResult | Score,
    options: EditOptions = {},
  ) => {
    change({ type: 'edit', label, edit: fn, written: options.written })
    if (options.audition) setAuditionCount((n) => n + 1)
  }

  /** Edits the selected event; does nothing without a selection. */
  const editSelected = (label: string, fn: Edit, options: EditOptions = {}) => {
    if (!selectedId) return
    edit(label, (s, id, head) => (id ? fn(s, id, head) : s), options)
  }

  const undo = () => {
    const last = state.past.at(-1)
    if (!last) return
    change({ type: 'undo' })
    notify(`Undid: ${last.label}`)
  }

  const redo = () => {
    const next = state.future[0]
    if (!next) return
    change({ type: 'redo' })
    notify(`Redid: ${next.label}`)
  }

  /** Selects an event; `head` picks a note of a chord, else it's the top one. */
  const select = (id: string | null, head?: number | null) => {
    dispatch({ type: 'select', id, head })
    const found = locate(score, id)
    if (!found) return
    if (playing) {
      // The marker follows what the Select tool picks, so mid-playback this jumps there.
      if (tool === 'select') playFrom(found.start)
      return
    }
    if (found.event.pitches) void player.audition(found.event.pitches, score.instrument)
  }

  /** Picks the next note up or down in the selected chord. Returns whether there is a chord to move in. */
  const moveHead = (delta: 1 | -1): boolean => {
    const pitches = selected?.pitches
    if (!pitches || pitches.length < 2) return false
    const next = pitches[pitches.findIndex((p) => diatonicIndex(p) === state.head) + delta]
    if (next) {
      dispatch({ type: 'head', head: diatonicIndex(next) })
      void player.audition([next], score.instrument)
    }
    return true
  }

  const chooseTool = (next: Tool) => dispatch({ type: 'tool', tool: next })

  /** Changes a picked note's value, or else sets the value of the next note written. */
  const chooseDuration = (d: Duration) => {
    if (!pickedNote || !located) return dispatch({ type: 'duration', duration: d })
    if (pickedNote.duration === d && !pickedNote.dots) return
    const next: DurationValue = { duration: d, dots: 0 }
    editSelected(`change to ${valueName(next)}`, (s, id) => setValue(s, id, next))
    const cap = measureTicks(score.timeSignature)
    if ((located.start % cap) + valueTicks(next) > cap) {
      const name = aValue(next)
      notify(`${name[0].toUpperCase()}${name.slice(1)} doesn't fit in the bar, so it's tied across the barline`)
    }
  }

  const toggleDots = () => {
    if (pickedNote) return editSelected(pickedNote.dots ? 'remove dot' : 'add dot', toggleDot)
    if (canDot(duration)) dispatch({ type: 'duration', duration, dots: dots ? 0 : 1 })
  }

  const step = (steps: number) => {
    if (selected?.kind !== 'note') return
    const which = inChord && headPitch ? `${pitchLabel(headPitch)} ` : ''
    const label = `move ${which}${steps > 0 ? 'up' : 'down'} ${Math.abs(steps) === 7 ? 'an octave' : 'a step'}`
    editSelected(label, (s, id, head) => moveSteps(s, id, steps, head), { audition: true })
  }

  const alter = (next: number) => {
    const clamped = Math.max(-2, Math.min(2, next))
    const which = inChord && headPitch ? `${headPitch.step} ` : ''
    editSelected(`make ${which}${ALTER_NAMES[clamped]}`, (s, id, head) => setAlter(s, id, clamped, head), { audition: true })
  }

  const tie = () => editSelected(selected?.tie ? 'remove tie' : 'tie to next note', toggleTie)

  /** Deletes the picked note of a chord, or turns a single note into a rest. */
  const removeSelected = () =>
    editSelected(inChord && headPitch ? `remove ${pitchLabel(headPitch)} from chord` : 'turn into a rest', removeNote)

  /** Writes a note (or a rest when `letter` is null) at the caret, which moves past it. Typing is writing, so it leaves the select tool. */
  const write = (letter: Step | null) => {
    if (tool !== 'write') chooseTool('write')
    setTyping(true)
    const pitch = letter ? nearestPitch(letter, referencePitch(score, cursor), score.keySignature) : null
    const label = pitch ? `write ${pitchLabel(pitch)} ${valueName(value)}` : `write ${valueName(value)} rest`
    edit(
      label,
      (s) => {
        const out = placeAt(s, cursor, value, pitch)
        // A rest merges into the rests around it, so there's nothing to select; the caret shows where it ended.
        return pitch ? out : { ...out, selectedId: null }
      },
      { audition: !!pitch, written: true },
    )
  }

  /** Adds `letter` to the selected note, above it (in a chord, above its picked note). Without a note, it's written. */
  const addToChord = (letter: Step) => {
    const pitches = selected?.pitches
    if (!pitches) return write(letter)
    if (tool !== 'write') chooseTool('write')
    setTyping(true)
    const pitch = pitchAbove(letter, headOf(pitches, state.head), pitches, score.keySignature)
    if (!pitch) return notify(`No ${letter} fits above: C7 is the highest note`)
    editSelected(`add ${pitchLabel(pitch)} to chord`, (s, id) => addPitch(s, id, pitch), { audition: true })
  }

  const moveSelection = (delta: 1 | -1) => {
    const all = locateAll(score)
    const index = all.findIndex((l) => l.event.id === selectedId)
    const next = index === -1 ? (delta > 0 ? all[0] : all.at(-1)) : all[index + delta]
    if (next) select(next.event.id)
  }

  const onStaffClick = (hit: StaffHit) => {
    player.preload(score.instrument)
    setTyping(false)
    if (hit.noteId) return select(hit.noteId, hit.head)
    if (tool === 'select') return select(null)
    const pitch = fromDiatonic(hit.diatonic, score.keySignature)
    const chord = hit.addTo
    if (chord) {
      return edit(`add ${pitchLabel(pitch)} to chord`, (s) => addPitch(s, chord, pitch), { audition: true, written: true })
    }
    edit(`write ${pitchLabel(pitch)} ${valueName(value)}`, (s) => placeAt(s, hit.box.tick, value, pitch), {
      audition: true,
      written: true,
    })
  }

  const share = () => {
    const url = `${location.origin}${location.pathname}#/s/${encodeShare(score)}`
    navigator.clipboard.writeText(url).then(
      () => notify('Share link copied'),
      () => window.prompt('Copy this link to share the score', url),
    )
  }

  const exportMidi = async () => {
    const { scoreToMidi } = await import('../audio/midi')
    const bytes = scoreToMidi(score)
    downloadBlob(new Blob([new Uint8Array(bytes)], { type: 'audio/midi' }), fileName(score.title, 'mid'))
  }

  const exportSvg = async () => {
    try {
      const { scoreToSvg } = await import('../render/exportSvg')
      downloadBlob(new Blob([await scoreToSvg(score)], { type: 'image/svg+xml' }), fileName(score.title, 'svg'))
    } catch {
      notify("Couldn't export the SVG")
    }
  }

  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (shortcutsOpen || ownsKey(e.target, e.key)) return
    const key = e.key
    const mod = e.ctrlKey || e.metaKey

    // Alt is left to the browser, except to move around a chord.
    if (e.altKey) {
      if ((key !== 'ArrowUp' && key !== 'ArrowDown') || mod || !moveHead(key === 'ArrowUp' ? 1 : -1)) return
      e.preventDefault()
      return
    }

    if (mod) {
      const lower = key.toLowerCase()
      if (lower === 'z' && !e.shiftKey) undo()
      else if (lower === 'y' || (lower === 'z' && e.shiftKey)) redo()
      else return
      e.preventDefault()
      return
    }

    const letter = key.toUpperCase()
    if (/^[A-G]$/.test(letter) && !e.repeat) {
      if (e.shiftKey) addToChord(letter as Step)
      else write(letter as Step)
    } else if (letter === 'R' && !e.repeat) {
      write(null)
    } else if (letter === 'S' && !e.repeat) {
      chooseTool(tool === 'select' ? 'write' : 'select')
    } else if (letter === 'W' && !e.repeat) {
      chooseTool('write')
    } else if (/^[1-5]$/.test(key)) {
      chooseDuration(DURATIONS[Number(key) - 1])
    } else if (key === 'ArrowUp' || key === 'ArrowDown') {
      if (selected?.kind !== 'note') return
      step((key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 7 : 1))
    } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
      moveSelection(key === 'ArrowRight' ? 1 : -1)
      setTyping(true)
    } else if (key === '+' || key === '=' || key === '-' || letter === 'N') {
      if (!headPitch) return
      alter(letter === 'N' ? 0 : headPitch.alter + (key === '-' ? -1 : 1))
    } else if (key === '.') {
      toggleDots()
    } else if (letter === 'T') {
      tie()
    } else if (key === 'Delete' || key === 'Backspace') {
      removeSelected()
    } else if (key === ' ') {
      // Handled here even on a focused button, which would otherwise take Space as a click.
      if (e.shiftKey) playFrom(0)
      else togglePlay()
    } else if (key === 'Home') {
      seek(0)
    } else if (key === 'Escape') {
      dispatch({ type: 'select', id: null })
      setTyping(false)
    } else if (key === '?') {
      setShortcutsOpen(true)
    } else {
      return
    }
    e.preventDefault()
    // A shortcut typed on a focused dropdown was meant for the score, and so are the keys after it.
    if (e.target instanceof HTMLSelectElement) e.target.blur()
  })

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const marker = sounding?.tick ?? playhead

  return (
    <main className="editor" data-tool={tool} onPointerDown={() => player.preload(score.instrument)}>
      <ScoreHeader
        score={score}
        status={state.persisted ? 'Saved in your library' : 'Draft · saves when you edit'}
        onMeta={(patch) => dispatch({ type: 'meta', patch })}
        onInstrument={(instrument) => {
          player.preload(instrument)
          edit('change instrument', (s) => ({ ...s, instrument }))
        }}
        onKeySignature={(keySignature) => edit('change key', (s) => ({ ...s, keySignature }))}
        onTimeSignature={(ts) => edit('change time signature', (s) => setTimeSignature(s, ts))}
        onBpm={(bpm) => edit('change tempo', (s) => (s.bpm === bpm ? s : { ...s, bpm }))}
        onShare={share}
        onExportMidi={() => void exportMidi()}
        onExportSvg={() => void exportSvg()}
      />

      <Toolbar
        tool={tool}
        value={value}
        selected={selected}
        pitch={headPitch}
        keySignature={score.keySignature}
        playing={playing}
        atStart={!playing && playhead === 0}
        undoLabel={state.past.at(-1)?.label ?? null}
        redoLabel={state.future[0]?.label ?? null}
        canRemoveBar={score.measures.length > 1}
        onPlay={togglePlay}
        onToStart={() => seek(0)}
        onTool={chooseTool}
        onDuration={chooseDuration}
        onRest={() => write(null)}
        onDot={toggleDots}
        onStep={step}
        onAlter={alter}
        onTie={tie}
        onDelete={removeSelected}
        onUndo={undo}
        onRedo={redo}
        onAddBar={() => edit('add bar', addMeasure)}
        onRemoveBar={() => edit('remove last bar', removeLastMeasure)}
        onShortcuts={() => setShortcutsOpen(true)}
      />

      <StatusBar
        score={score}
        tool={tool}
        value={value}
        selected={located}
        head={headPitch}
        written={state.written}
        cursor={showCaret ? cursor : null}
        marker={marker}
        playing={playing}
        touch={touch}
      />

      <ScoreView
        score={score}
        selectedId={selectedId}
        head={state.head}
        playingId={sounding?.id ?? null}
        playhead={marker}
        cursor={showCaret ? cursor : null}
        playing={playing}
        editable
        tool={tool}
        value={value}
        onStaffClick={onStaffClick}
        onSeek={seek}
      />

      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <div className="toast" role="status" aria-live="polite">
        {toast && <span key={toast.at}>{toast.text}</span>}
      </div>
    </main>
  )
}
