import { type Dispatch, useEffect, useEffectEvent, useState } from 'react'
import { player } from '../audio/player'
import { downloadBlob, fileName } from '../download'
import { DURATIONS, canDot } from '../music/duration'
import { fromDiatonic, nearestPitch } from '../music/pitch'
import {
  type EditResult,
  addMeasure,
  entryTick,
  locate,
  locateAll,
  moveSteps,
  placeAt,
  removeLastMeasure,
  setAlter,
  setTimeSignature,
  setValue,
  toRest,
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

type Edit = (score: Score, id: string) => EditResult | Score

const MIDDLE_LINE: Pitch = { step: 'B', octave: 4, alter: 0 }

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && !!target.closest('input, select, textarea, [contenteditable="true"]')
}

/** The pitch typed letters are placed nearest to: the selected note, else the last note before the entry point. */
function referencePitch(score: Score, selectedId: string | null, tick: number): Pitch {
  const selected = locate(score, selectedId)?.event
  if (selected?.pitch) return selected.pitch
  const before = locateAll(score).filter((l) => l.event.pitch && l.start < tick)
  return before.at(-1)?.event.pitch ?? MIDDLE_LINE
}

/** The event being heard; `id` is null until the first one sounds. */
interface Sounding {
  id: string | null
  tick: number
}

interface Props {
  state: EditorState
  dispatch: Dispatch<EditorAction>
}

export function Editor({ state, dispatch }: Props) {
  const { score, selectedId, duration, tool, playhead } = state
  const located = locate(score, selectedId) ?? null
  const selected = located?.event ?? null
  // Non-null while playing.
  const [sounding, setSounding] = useState<Sounding | null>(null)
  const playing = sounding !== null
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [auditionCount, setAuditionCount] = useState(0)

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
    player
      .play(score, from, {
        onEvent: (id, tick) => setSounding({ id, tick }),
        onEnd: () => setSounding(null),
      })
      .catch(() => {
        player.stop()
        setSounding(null)
        setToast("Couldn't start audio in this browser")
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
    if (selected?.pitch) void player.audition(selected.pitch, score.instrument)
  })
  useEffect(() => {
    if (auditionCount) auditionSelected()
  }, [auditionCount])

  const edit = (fn: (score: Score, selectedId: string | null) => EditResult | Score, audition = false) => {
    change({ type: 'edit', edit: fn })
    if (audition) setAuditionCount((n) => n + 1)
  }

  /** Edits the selected event; does nothing without a selection. */
  const editSelected = (fn: Edit, audition = false) => {
    if (!selectedId) return
    edit((s, id) => (id ? fn(s, id) : s), audition)
  }

  const select = (id: string | null) => {
    dispatch({ type: 'select', id })
    const found = locate(score, id)
    if (!found) return
    // The marker follows the selection, so mid-playback this jumps there.
    if (playing) return playFrom(found.start)
    if (found.event.pitch) void player.audition(found.event.pitch, score.instrument)
  }

  const chooseTool = (next: Tool) => dispatch({ type: 'tool', tool: next })

  const chooseDuration = (d: Duration) => {
    dispatch({ type: 'duration', duration: d })
    editSelected((s, id) => {
      const dots = canDot(d) ? (locate(s, id)?.event.dots ?? 0) : 0
      return setValue(s, id, { duration: d, dots })
    })
  }

  const typeNote = (step: Step | null) => {
    const tick = entryTick(score, selectedId)
    const pitch = step ? nearestPitch(step, referencePitch(score, selectedId, tick), score.keySignature) : null
    edit((s) => placeAt(s, tick, { duration, dots: 0 }, pitch), !!pitch)
  }

  const moveSelection = (delta: 1 | -1) => {
    const all = locateAll(score)
    const index = all.findIndex((l) => l.event.id === selectedId)
    const next = index === -1 ? (delta > 0 ? all[0] : all.at(-1)) : all[index + delta]
    if (next) select(next.event.id)
  }

  const onStaffClick = (hit: StaffHit) => {
    player.preload(score.instrument)
    if (hit.noteId) return select(hit.noteId)
    if (tool === 'select') return select(null)
    const value = { duration, dots: 0 as const }
    if (tool === 'rest') return edit((s) => placeAt(s, hit.box.tick, value, null))
    const pitch = fromDiatonic(hit.diatonic, score.keySignature)
    edit((s) => placeAt(s, hit.box.tick, value, pitch), true)
  }

  const share = () => {
    const url = `${location.origin}${location.pathname}#/s/${encodeShare(score)}`
    navigator.clipboard.writeText(url).then(
      () => setToast('Share link copied'),
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
      setToast("Couldn't export the SVG")
    }
  }

  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (shortcutsOpen || e.altKey || isTyping(e.target)) return
    const key = e.key
    const mod = e.ctrlKey || e.metaKey

    if (mod) {
      const lower = key.toLowerCase()
      if (lower === 'z' && !e.shiftKey) change({ type: 'undo' })
      else if (lower === 'y' || (lower === 'z' && e.shiftKey)) change({ type: 'redo' })
      else return
      e.preventDefault()
      return
    }

    const letter = key.toUpperCase()
    if (/^[A-G]$/.test(letter) && !e.repeat) {
      typeNote(letter as Step)
    } else if (letter === 'R' && !e.repeat) {
      if (e.shiftKey) chooseTool('rest')
      else typeNote(null)
    } else if (letter === 'S' && !e.repeat) {
      chooseTool(tool === 'select' ? 'note' : 'select')
    } else if (letter === 'W' && !e.repeat) {
      chooseTool('note')
    } else if (/^[1-5]$/.test(key)) {
      chooseDuration(DURATIONS[Number(key) - 1])
    } else if (key === 'ArrowUp' || key === 'ArrowDown') {
      if (selected?.kind !== 'note') return
      const steps = (key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 7 : 1)
      editSelected((s, id) => moveSteps(s, id, steps), true)
    } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
      moveSelection(key === 'ArrowRight' ? 1 : -1)
    } else if (key === '+' || key === '=' || key === '-' || letter === 'N') {
      const pitch = selected?.pitch
      if (!pitch) return
      const alter = letter === 'N' ? 0 : pitch.alter + (key === '-' ? -1 : 1)
      editSelected((s, id) => setAlter(s, id, alter), true)
    } else if (key === '.') {
      editSelected(toggleDot)
    } else if (letter === 'T') {
      editSelected(toggleTie)
    } else if (key === 'Delete' || key === 'Backspace') {
      editSelected(toRest)
    } else if (key === ' ') {
      // Handled here even on a focused button, which would otherwise take Space as a click.
      if (e.shiftKey) playFrom(0)
      else togglePlay()
    } else if (key === 'Home') {
      seek(0)
    } else if (key === 'Escape') {
      dispatch({ type: 'select', id: null })
    } else if (key === '?') {
      setShortcutsOpen(true)
    } else {
      return
    }
    e.preventDefault()
  })

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const marker = sounding?.tick ?? playhead

  return (
    <main className="editor" onPointerDown={() => player.preload(score.instrument)}>
      <ScoreHeader
        score={score}
        status={state.persisted ? 'Saved in your library' : 'Draft · saves when you edit'}
        onMeta={(patch) => dispatch({ type: 'meta', patch })}
        onInstrument={(instrument) => {
          player.preload(instrument)
          edit((s) => ({ ...s, instrument }))
        }}
        onKeySignature={(keySignature) => edit((s) => ({ ...s, keySignature }))}
        onTimeSignature={(ts) => edit((s) => setTimeSignature(s, ts))}
        onBpm={(bpm) => edit((s) => ({ ...s, bpm }))}
        onShare={share}
        onExportMidi={() => void exportMidi()}
        onExportSvg={() => void exportSvg()}
      />

      <Toolbar
        tool={tool}
        duration={duration}
        selected={selected}
        playing={playing}
        atStart={!playing && playhead === 0}
        canUndo={state.past.length > 0}
        canRedo={state.future.length > 0}
        canRemoveBar={score.measures.length > 1}
        onPlay={togglePlay}
        onToStart={() => seek(0)}
        onTool={chooseTool}
        onDuration={chooseDuration}
        onDot={() => editSelected(toggleDot)}
        onAlter={(alter) => editSelected((s, id) => setAlter(s, id, alter), true)}
        onTie={() => editSelected(toggleTie)}
        onDelete={() => editSelected(toRest)}
        onUndo={() => change({ type: 'undo' })}
        onRedo={() => change({ type: 'redo' })}
        onAddBar={() => edit(addMeasure)}
        onRemoveBar={() => edit(removeLastMeasure)}
        onShortcuts={() => setShortcutsOpen(true)}
      />

      <StatusBar score={score} tool={tool} duration={duration} selected={located} marker={marker} playing={playing} />

      <ScoreView
        score={score}
        selectedId={selectedId}
        playingId={sounding?.id ?? null}
        playhead={marker}
        playing={playing}
        editable
        tool={tool}
        duration={duration}
        onStaffClick={onStaffClick}
        onSeek={seek}
      />

      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <div className="toast" role="status" aria-live="polite">
        {toast && <span>{toast}</span>}
      </div>
    </main>
  )
}
