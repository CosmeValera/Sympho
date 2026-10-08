import { readScore } from '../music/serialize'
import type { Score } from '../music/types'

const SCORES = 'sympho:scores'
const LAST = 'sympho:last'

/** localStorage can throw (private mode, quota, blocked site data); storage is a convenience, never fatal. */
function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null): boolean {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function readRaw(): unknown[] {
  try {
    const raw: unknown = JSON.parse(read(SCORES) ?? '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function loadLibrary(): Score[] {
  try {
    return readRaw()
      .map(readScore)
      .filter((s): s is Score => s !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

const idOf = (raw: unknown) => (typeof raw === 'object' && raw !== null ? (raw as { id?: unknown }).id : undefined)

/** Runs on every edit, so it skips validating the other stored scores. */
export function saveScore(score: Score): boolean {
  const others = readRaw().filter((s) => idOf(s) !== score.id)
  return write(SCORES, JSON.stringify([score, ...others]))
}

/** Overwrites the whole library, for restoring a backup. */
export function replaceLibrary(scores: Score[]): boolean {
  return write(SCORES, JSON.stringify(scores))
}

export function deleteScore(id: string): void {
  write(SCORES, JSON.stringify(readRaw().filter((s) => idOf(s) !== id)))
  if (lastOpenedId() === id) write(LAST, null)
}

export function lastOpenedId(): string | null {
  return read(LAST)
}

export function rememberOpened(id: string): void {
  write(LAST, id)
}

export function readFlag(key: string): string | null {
  return read(`sympho:${key}`)
}

export function writeFlag(key: string, value: string): void {
  write(`sympho:${key}`, value)
}
