import { parseMusic } from './music/parse'
import { newId } from './music/score'
import type { Instrument, Score, TimeSignature } from './music/types'

interface Example {
  slug: string
  title: string
  composer: string
  instrument: Instrument
  keySignature: string
  timeSignature: TimeSignature
  bpm: number
  music: string
}

const COMMON: TimeSignature = { beats: 4, beatValue: 4 }

export const EXAMPLES: Example[] = [
  {
    slug: 'ode-to-joy',
    title: 'Ode to Joy',
    composer: 'Ludwig van Beethoven',
    instrument: 'piano',
    keySignature: 'G',
    timeSignature: COMMON,
    bpm: 112,
    music: `
      B4:4 B4:4 C5:4 D5:4 | D5:4 C5:4 B4:4 A4:4 | G4:4 G4:4 A4:4 B4:4 | B4:4. A4:8 A4:2 |
      B4:4 B4:4 C5:4 D5:4 | D5:4 C5:4 B4:4 A4:4 | G4:4 G4:4 A4:4 B4:4 | A4:4. G4:8 G4:2`,
  },
  {
    slug: 'minuet-in-g',
    title: 'Minuet in G',
    composer: 'Christian Petzold',
    instrument: 'piano',
    keySignature: 'G',
    timeSignature: { beats: 3, beatValue: 4 },
    bpm: 120,
    music: `
      D5:4 G4:8 A4:8 B4:8 C5:8 | D5:4 G4:4 G4:4 | E5:4 C5:8 D5:8 E5:8 F#5:8 | G5:4 G4:4 G4:4 |
      C5:4 D5:8 C5:8 B4:8 A4:8 | B4:4 C5:8 B4:8 A4:8 G4:8 | F#4:4 G4:8 A4:8 B4:8 G4:8 | A4:2. |
      D5:4 G4:8 A4:8 B4:8 C5:8 | D5:4 G4:4 G4:4 | E5:4 C5:8 D5:8 E5:8 F#5:8 | G5:4 G4:4 G4:4 |
      C5:4 D5:8 C5:8 B4:8 A4:8 | B4:4 C5:8 B4:8 A4:8 G4:8 | A4:4 B4:8 A4:8 G4:8 F#4:8 | G4:2.`,
  },
  {
    slug: 'row-your-boat',
    title: 'Row, Row, Row Your Boat',
    composer: 'Traditional',
    instrument: 'flute',
    keySignature: 'C',
    timeSignature: { beats: 6, beatValue: 8 },
    bpm: 60,
    music: `
      C4:4. C4:4. | C4:4 D4:8 E4:4. | E4:4 D4:8 E4:4 F4:8 | G4:2. |
      C5:8 C5:8 C5:8 G4:8 G4:8 G4:8 | E4:8 E4:8 E4:8 C4:8 C4:8 C4:8 | G4:4 F4:8 E4:4 D4:8 | C4:2.`,
  },
  {
    slug: 'frere-jacques',
    title: 'Frère Jacques',
    composer: 'Traditional',
    instrument: 'guitar',
    keySignature: 'F',
    timeSignature: COMMON,
    bpm: 100,
    music: `
      F4:4 G4:4 A4:4 F4:4 | F4:4 G4:4 A4:4 F4:4 | A4:4 Bb4:4 C5:2 | A4:4 Bb4:4 C5:2 |
      C5:8 D5:8 C5:8 Bb4:8 A4:4 F4:4 | C5:8 D5:8 C5:8 Bb4:8 A4:4 F4:4 | F4:4 C4:4 F4:2 | F4:4 C4:4 F4:2`,
  },
  {
    slug: 'twinkle',
    title: 'Twinkle, Twinkle, Little Star',
    composer: 'Traditional',
    instrument: 'piano',
    keySignature: 'C',
    timeSignature: COMMON,
    bpm: 96,
    music: `
      C4:4 C4:4 G4:4 G4:4 | A4:4 A4:4 G4:2 | F4:4 F4:4 E4:4 E4:4 | D4:4 D4:4 C4:2 |
      G4:4 G4:4 F4:4 F4:4 | E4:4 E4:4 D4:2 | G4:4 G4:4 F4:4 F4:4 | E4:4 E4:4 D4:2 |
      C4:4 C4:4 G4:4 G4:4 | A4:4 A4:4 G4:2 | F4:4 F4:4 E4:4 E4:4 | D4:4 D4:4 C4:2`,
  },
  {
    // The chord progression, with the first violin's descending line on top.
    slug: 'canon-in-d',
    title: 'Canon in D',
    composer: 'Johann Pachelbel',
    instrument: 'piano',
    keySignature: 'D',
    timeSignature: COMMON,
    bpm: 72,
    music: `
      A4+D5+F#5:2 A4+C#5+E5:2 | F#4+B4+D5:2 F#4+A4+C#5:2 | D4+G4+B4:2 D4+F#4+A4:2 | D4+G4+B4:2 E4+A4+C#5:2 |
      F#4+A4+D5:1`,
  },
]

/** A fresh, unsaved copy of an example. */
export function exampleScore(slug: string): Score | null {
  const example = EXAMPLES.find((e) => e.slug === slug)
  if (!example) return null
  const { music, slug: _slug, ...meta } = example
  return {
    v: 1,
    id: newId(),
    ...meta,
    measures: parseMusic(music, meta.timeSignature),
    updatedAt: Date.now(),
  }
}
