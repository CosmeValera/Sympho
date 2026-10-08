import { readScore } from '../music/serialize'
import type { Score } from '../music/types'

/**
 * What Export library downloads. Scores live only in this browser, so this file
 * is the backup and the way to move them to another device.
 */
export interface LibraryFile {
  app: 'sympho'
  version: 1
  exportedAt: string
  scores: Score[]
}

export function libraryFile(scores: Score[], now = new Date()): LibraryFile {
  return { app: 'sympho', version: 1, exportedAt: now.toISOString(), scores }
}

export interface MergeResult {
  scores: Score[]
  added: number
  updated: number
  /** Already here in the same or a newer version. */
  unchanged: number
}

function isLibraryFile(raw: unknown): raw is { scores: unknown[] } {
  return typeof raw === 'object' && raw !== null && Array.isArray((raw as { scores?: unknown }).scores)
}

/**
 * Merges a backup into `current`. Accepts a library file, a bare array of
 * scores, or one score. A score that's already here is only replaced by a
 * newer copy, so importing an old backup never loses work. Throws when the
 * text holds no scores at all.
 */
export function mergeBackup(current: Score[], text: string): MergeResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error("That file isn't a Sympho library")
  }
  const list: unknown[] = Array.isArray(raw) ? raw : isLibraryFile(raw) ? raw.scores : [raw]
  const incoming = list.map(readScore).filter((s): s is Score => s !== null)
  if (incoming.length === 0) throw new Error('No scores found in that file')

  const byId = new Map(current.map((s) => [s.id, s]))
  let added = 0
  let updated = 0
  let unchanged = 0
  for (const score of incoming) {
    const existing = byId.get(score.id)
    if (!existing) added++
    else if (score.updatedAt > existing.updatedAt) updated++
    else {
      unchanged++
      continue
    }
    byId.set(score.id, score)
  }
  const scores = [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt)
  return { scores, added, updated, unchanged }
}

/** "Imported 3 scores, updated 1." */
export function describeMerge({ added, updated, unchanged }: MergeResult): string {
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
  const parts: string[] = []
  if (added) parts.push(`added ${plural(added, 'score')}`)
  if (updated) parts.push(`updated ${plural(updated, 'score')}`)
  if (parts.length === 0) return `Already up to date (${plural(unchanged, 'score')})`
  const text = parts.join(', ')
  return text[0].toUpperCase() + text.slice(1)
}
