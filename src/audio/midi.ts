import { Midi } from '@tonejs/midi'
import { TICKS_PER_WHOLE, secondsPerTick } from '../music/duration'
import { instrumentInfo } from '../music/instruments'
import { toMidi } from '../music/pitch'
import { soundingNotes } from '../music/score'
import type { Score } from '../music/types'

export function scoreToMidi(score: Score): Uint8Array {
  const midi = new Midi()
  const perTick = midi.header.ppq / (TICKS_PER_WHOLE / 4)
  // MIDI tempo is always in quarter notes per minute.
  midi.header.setTempo(60 / (secondsPerTick(score.bpm, score.timeSignature) * (TICKS_PER_WHOLE / 4)))
  midi.header.timeSignatures.push({
    ticks: 0,
    timeSignature: [score.timeSignature.beats, score.timeSignature.beatValue],
  })
  midi.header.name = score.title
  midi.header.update()

  const track = midi.addTrack()
  track.name = score.title
  const instrument = instrumentInfo(score.instrument)
  track.instrument.number = instrument.program

  for (const { pitch, start, ticks } of soundingNotes(score)) {
    track.addNote({
      midi: toMidi(pitch) + instrument.transpose,
      ticks: start * perTick,
      durationTicks: ticks * perTick,
      velocity: 0.8,
    })
  }
  return midi.toArray()
}
