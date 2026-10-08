import { eventTicks, secondsPerTick } from '../music/duration'
import { instrumentInfo } from '../music/instruments'
import { toMidi } from '../music/pitch'
import { locateAll, soundingNotes } from '../music/score'
import type { Instrument, Pitch, Score } from '../music/types'

type ToneModule = typeof import('tone')

interface Voice {
  triggerAttackRelease(note: number, duration: number, time?: number, velocity?: number): unknown
  dispose(): unknown
}

/** Spreads notes over several one-note-at-a-time voices so they can play chords. */
function pool(voices: Voice[]): Voice {
  let next = 0
  return {
    triggerAttackRelease: (...args) => voices[next++ % voices.length].triggerAttackRelease(...args),
    dispose: () => voices.forEach((v) => v.dispose()),
  }
}

const PIANO_SAMPLES = ['A2', 'C3', 'D#3', 'F#3', 'A3', 'C4', 'D#4', 'F#4', 'A4', 'C5', 'D#5', 'F#5', 'A5', 'C6', 'D#6', 'F#6', 'A6', 'C7']

export interface PlaybackHandlers {
  /** Called in sync with the audio as each event (note or rest) starts, with its start tick. */
  onEvent: (id: string, tick: number) => void
  onEnd: () => void
}

/**
 * Lazily loads Tone.js on first use (it's the largest dependency and only needed
 * once the user makes a sound) and keeps one voice per instrument.
 */
class Player {
  private tone?: ToneModule
  private voices = new Map<Instrument, Promise<Voice>>()
  private playing = false
  /** Bumped by every play and stop, so a play still waiting for its voice knows it was superseded. */
  private run = 0

  private async load(): Promise<ToneModule> {
    if (!this.tone) {
      const Tone = await import('tone')
      // Chords add up; keep their peaks from clipping.
      Tone.getDestination().chain(new Tone.Limiter(-1))
      this.tone = Tone
    }
    await this.tone.start()
    return this.tone
  }

  private makeVoice(Tone: ToneModule, instrument: Instrument): Promise<Voice> {
    switch (instrument) {
      case 'piano': {
        const urls = Object.fromEntries(PIANO_SAMPLES.map((n) => [n, `${n.replace('#', 's')}.mp3`]))
        return new Promise((resolve) => {
          const sampler = new Tone.Sampler({
            urls,
            release: 1,
            baseUrl: 'https://tonejs.github.io/audio/salamander/',
            onload: () => resolve(sampler),
            // Offline or blocked CDN: fall back to a plain synth rather than staying silent.
            onerror: () => {
              sampler.dispose()
              resolve(new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' } }).toDestination())
            },
          }).toDestination()
          sampler.volume.value = -4
        })
      }
      case 'flute': {
        const synth = new Tone.PolySynth(Tone.FMSynth, {
          harmonicity: 3,
          modulationIndex: 10,
          modulation: { type: 'triangle' },
          envelope: { attack: 0.04, decay: 0.1, sustain: 0.9, release: 0.4 },
        }).toDestination()
        synth.volume.value = -12
        return Promise.resolve(synth)
      }
      case 'guitar': {
        // One per string.
        const strings = Array.from({ length: 6 }, () => {
          const pluck = new Tone.PluckSynth({ attackNoise: 1, dampening: 3800, resonance: 0.96 }).toDestination()
          pluck.volume.value = -2
          return pluck
        })
        return Promise.resolve(pool(strings))
      }
      case 'bass': {
        const wah = new Tone.AutoWah(120, 10, -20).toDestination()
        const voices = Array.from({ length: 4 }, () => {
          const bass = new Tone.MonoSynth({
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.3 },
            filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.4, baseFrequency: 200, octaves: 3 },
          }).connect(wah)
          bass.volume.value = -10
          return bass
        })
        return Promise.resolve(pool(voices))
      }
    }
  }

  private async voice(instrument: Instrument): Promise<{ Tone: ToneModule; voice: Voice }> {
    const Tone = await this.load()
    let voice = this.voices.get(instrument)
    if (!voice) {
      voice = this.makeVoice(Tone, instrument)
      this.voices.set(instrument, voice)
    }
    return { Tone, voice: await voice }
  }

  private frequency(Tone: ToneModule, pitch: Pitch, instrument: Instrument): number {
    return Tone.Frequency(toMidi(pitch) + instrumentInfo(instrument).transpose, 'midi').toFrequency()
  }

  /** Warms up the audio engine and the instrument's samples ahead of the first note. */
  preload(instrument: Instrument): void {
    void this.voice(instrument).catch(() => {})
  }

  /** Plays a note or chord briefly, as feedback while editing. */
  async audition(pitches: Pitch[], instrument: Instrument): Promise<void> {
    if (this.playing) return
    const { Tone, voice } = await this.voice(instrument)
    const now = Tone.now()
    for (const pitch of pitches) voice.triggerAttackRelease(this.frequency(Tone, pitch, instrument), 0.45, now, 0.8)
  }

  get isPlaying(): boolean {
    return this.playing
  }

  async play(score: Score, fromTick: number, handlers: PlaybackHandlers): Promise<void> {
    this.stop()
    const run = this.run
    this.playing = true
    const { Tone, voice } = await this.voice(score.instrument)
    if (run !== this.run) return

    const transport = Tone.getTransport()
    const draw = Tone.getDraw()
    const spt = secondsPerTick(score.bpm, score.timeSignature)
    let end = 0
    // Draw callbacks already queued can still fire after a stop; drop them.
    const live = (fn: () => void) => () => {
      if (run === this.run) fn()
    }

    for (const { event, start } of locateAll(score)) {
      if (start < fromTick) continue
      const at = (start - fromTick) * spt
      end = Math.max(end, at + eventTicks(event) * spt)
      transport.schedule((time) => draw.schedule(live(() => handlers.onEvent(event.id, start)), time), at)
    }
    for (const note of soundingNotes(score)) {
      // A tie held over from before the start sounds for what is left of it.
      const begin = Math.max(note.start, fromTick)
      const ticks = note.start + note.ticks - begin
      if (ticks <= 0) continue
      const freq = this.frequency(Tone, note.pitch, score.instrument)
      const length = ticks * spt * 0.92
      transport.schedule((time) => voice.triggerAttackRelease(freq, length, time, 0.8), (begin - fromTick) * spt)
    }

    transport.schedule(
      (time) =>
        draw.schedule(
          live(() => {
            this.stop()
            handlers.onEnd()
          }),
          time,
        ),
      end + 0.05,
    )
    transport.start('+0.08')
  }

  stop(): void {
    this.run++
    this.playing = false
    if (!this.tone) return
    const transport = this.tone.getTransport()
    transport.stop()
    transport.cancel()
    transport.position = 0
  }
}

export const player = new Player()
