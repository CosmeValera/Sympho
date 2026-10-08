import { describe, expect, it } from 'vitest'
import { EXAMPLES, exampleScore } from '../examples'
import { decompose, eventTicks, measureTicks } from './duration'
import { parseMusic } from './parse'
import { keyAlter, nearestPitch, parsePitch, toMidi, toVexKey } from './pitch'
import {
  entryTick,
  locateAll,
  moveSteps,
  placeAt,
  setAlter,
  setTimeSignature,
  setValue,
  toRest,
  toggleDot,
  toggleTie,
} from './score'
import { decodeShare, encodeShare, newScore, readScore } from './serialize'
import type { Score, TimeSignature } from './types'

const FOUR: TimeSignature = { beats: 4, beatValue: 4 }
const THREE: TimeSignature = { beats: 3, beatValue: 4 }
const SIX_EIGHT: TimeSignature = { beats: 6, beatValue: 8 }

/** Renders measures back to the compact notation, for readable assertions. */
function notation(score: Score): string {
  return score.measures
    .map((m) =>
      m.events
        .map((e) => {
          const head = e.kind === 'rest' ? 'r' : `${e.pitch!.step}${['bb', 'b', '', '#', '##'][e.pitch!.alter + 2]}${e.pitch!.octave}`
          return `${head}:${e.duration}${e.dots ? '.' : ''}${e.tie ? '~' : ''}`
        })
        .join(' '),
    )
    .join(' | ')
}

function scoreOf(music: string, ts: TimeSignature = FOUR, keySignature = 'C'): Score {
  return { ...newScore(), keySignature, timeSignature: ts, measures: parseMusic(music, ts) }
}

const idAt = (score: Score, index: number) => locateAll(score)[index].event.id
const C4 = parsePitch('C4')!

describe('decompose', () => {
  it('writes rests on the beat in 4/4', () => {
    expect(decompose(8, 24, FOUR).map((v) => v.duration)).toEqual(['4', '2'])
    expect(decompose(4, 28, FOUR).map((v) => v.duration)).toEqual(['8', '4', '2'])
  })

  it('never lets a rest straddle the dotted beat in 6/8', () => {
    expect(decompose(4, 20, SIX_EIGHT)).toEqual([
      { duration: '8', dots: 0 },
      { duration: '8', dots: 0 },
      { duration: '4', dots: 1 },
    ])
  })
})

describe('pitch', () => {
  it('follows the key signature', () => {
    expect(keyAlter('G', 'F')).toBe(1)
    expect(keyAlter('Bb', 'E')).toBe(-1)
    expect(keyAlter('Bb', 'A')).toBe(0)
  })

  it('converts to MIDI and VexFlow keys', () => {
    expect(toMidi(parsePitch('A4')!)).toBe(69)
    expect(toMidi(parsePitch('Cb4')!)).toBe(59)
    expect(toVexKey(parsePitch('F#5')!)).toBe('f#/5')
  })

  it('picks the octave closest to the previous note', () => {
    expect(nearestPitch('C', parsePitch('B4')!, 'C')).toEqual({ step: 'C', octave: 5, alter: 0 })
    expect(nearestPitch('A', parsePitch('C5')!, 'C')).toEqual({ step: 'A', octave: 4, alter: 0 })
    expect(nearestPitch('F', parsePitch('E4')!, 'D')).toEqual({ step: 'F', octave: 4, alter: 1 })
  })

  it('leans towards the staff when two octaves are nearly as close', () => {
    // D6 is a step closer to A5, but D5 sits on the staff.
    expect(nearestPitch('D', parsePitch('A5')!, 'C')).toEqual({ step: 'D', octave: 5, alter: 0 })
  })
})

describe('editing', () => {
  it('fills the rest of the bar with rests when placing a note', () => {
    const score = scoreOf('r:1')
    const { score: next } = placeAt(score, 0, { duration: '4', dots: 0 }, C4)
    expect(notation(next)).toBe('C4:4 r:4 r:2')
  })

  it('splits notes across the barline into tied notes', () => {
    const score = scoreOf('r:1 | r:1')
    const { score: next, selectedId } = placeAt(score, 24, { duration: '2', dots: 0 }, C4)
    expect(notation(next)).toBe('r:2 r:4 C4:4~ | C4:4 r:4 r:2')
    expect(selectedId).toBe(next.measures[0].events[2].id)
  })

  it('extends the piece when writing past the last bar', () => {
    const score = scoreOf('C4:1')
    const { score: next } = placeAt(score, 32, { duration: '4', dots: 0 }, parsePitch('D4')!)
    expect(notation(next)).toBe('C4:1 | D4:4 r:4 r:2')
  })

  it('shortens and lengthens the selected note', () => {
    const score = scoreOf('C4:2 D4:4 E4:4')
    const shorter = setValue(score, idAt(score, 0), { duration: '4', dots: 0 }).score
    expect(notation(shorter)).toBe('C4:4 r:4 D4:4 E4:4')
    const longer = setValue(score, idAt(score, 0), { duration: '1', dots: 0 }).score
    expect(notation(longer)).toBe('C4:1')
  })

  it('dotting eats into the next note, leaving a rest for what is cut off', () => {
    const score = scoreOf('C4:4 D4:4 E4:2')
    const { score: next, selectedId } = toggleDot(score, idAt(score, 0))
    expect(notation(next)).toBe('C4:4. r:8 E4:2')
    expect(selectedId).toBe(idAt(score, 0))
  })

  it('merges neighbouring rests when a note is deleted', () => {
    const score = scoreOf('r:4 C4:4 r:2')
    const { score: next, selectedId } = toRest(score, idAt(score, 1))
    expect(notation(next)).toBe('r:1')
    expect(selectedId).toBe(next.measures[0].events[0].id)
  })

  it('ties into a new note of the same pitch', () => {
    const score = scoreOf('C4:2 r:2')
    const { score: next } = toggleTie(score, idAt(score, 0))
    expect(notation(next)).toBe('C4:2~ C4:2')
    expect(notation(toggleTie(next, idAt(next, 0)).score)).toBe('C4:2 C4:2')
  })

  it('drops a tie once the next note changes pitch', () => {
    const score = scoreOf('C4:2~ C4:2')
    const { score: next } = moveSteps(score, idAt(score, 1), 1)
    expect(notation(next)).toBe('C4:2 D4:2')
  })

  it('keeps the accidental when moving an octave', () => {
    const score = scoreOf('F#5:4 r:4 r:2')
    expect(notation(moveSteps(score, idAt(score, 0), -7).score)).toBe('F#4:4 r:4 r:2')
    expect(notation(moveSteps(score, idAt(score, 0), -1).score)).toBe('E5:4 r:4 r:2')
  })

  it('returns the same score for edits that change nothing', () => {
    const score = scoreOf('C7:4 F#4:4 r:2')
    expect(moveSteps(score, idAt(score, 0), 1).score).toBe(score)
    expect(setAlter(score, idAt(score, 1), 1).score).toBe(score)
  })

  it('leaves a rest alone when asked to dot it', () => {
    const score = scoreOf('C4:4 r:4 r:2')
    expect(toggleDot(score, idAt(score, 1)).score).toBe(score)
  })

  it('types after a selected note, into a selected rest, or after the last note', () => {
    const score = scoreOf('r:4 C4:4 D4:2')
    expect(entryTick(score, idAt(score, 0))).toBe(0)
    expect(entryTick(score, idAt(score, 1))).toBe(16)
    expect(entryTick(score, null)).toBe(32)
  })

  it('continues typing where a written rest ends, even once it merged away', () => {
    const score = scoreOf('C4:4 r:4 r:2')
    const { score: next, cursor } = placeAt(score, 8, { duration: '4', dots: 0 }, null)
    expect(notation(next)).toBe('C4:4 r:4 r:2')
    expect(cursor).toBe(16)
  })

  it('types where a deleted note was', () => {
    const score = scoreOf('C4:4 D4:4 E4:2')
    expect(toRest(score, idAt(score, 1)).cursor).toBe(8)
  })

  it('re-bars the piece when the meter changes', () => {
    const score = scoreOf('C4:4 D4:4 E4:4 F4:4 | G4:1')
    expect(notation(setTimeSignature(score, THREE))).toBe('C4:4 D4:4 E4:4 | F4:4 G4:2~ | G4:2 r:4')
  })
})

describe('serialization', () => {
  it('round-trips through a share link as a new copy', () => {
    const score = scoreOf('C#4:4. D4:8 E4:2~ | E4:4 r:4 Bb4:2', FOUR, 'F')
    const copy = decodeShare(encodeShare(score))!
    expect(notation(copy)).toBe(notation(score))
    expect(copy.keySignature).toBe('F')
    expect(copy.id).not.toBe(score.id)
  })

  it('rejects or repairs garbage', () => {
    expect(decodeShare('not-a-score')).toBeNull()
    expect(readScore({ measures: 'nope' })).toBeNull()
    const repaired = readScore({
      bpm: 9000,
      timeSignature: { beats: 7, beatValue: 3 },
      measures: [{ events: [{ kind: 'note', duration: '4', dots: 0, pitch: { step: 'C', octave: 4 } }, { kind: 'x' }] }],
    })!
    expect(repaired.bpm).toBe(240)
    expect(notation(repaired)).toBe('C4:4 r:4 r:2')
  })
})

describe('examples', () => {
  it.each(EXAMPLES.map((e) => [e.slug, e]))('%s fills every bar exactly', (slug, example) => {
    const score = exampleScore(slug)!
    const cap = measureTicks(score.timeSignature)
    const bars = example.music.split('|').length
    expect(score.measures).toHaveLength(bars)
    for (const m of score.measures) {
      expect(m.events.reduce((sum, e) => sum + eventTicks(e), 0)).toBe(cap)
      expect(m.events.at(-1)?.kind).toBe('note')
    }
  })
})
