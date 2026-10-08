import { describe, expect, it } from 'vitest'
import { newScore } from '../music/serialize'
import type { Score } from '../music/types'
import { describeMerge, libraryFile, mergeBackup } from './backup'

const score = (id: string, title: string, updatedAt: number): Score => ({ ...newScore(), id, title, updatedAt })

describe('mergeBackup', () => {
  const mine = [score('a', 'Mine', 200), score('b', 'Other', 100)]

  it('adds scores it has never seen', () => {
    const result = mergeBackup(mine, JSON.stringify(libraryFile([score('c', 'New', 50)])))
    expect(result.added).toBe(1)
    expect(result.scores.map((s) => s.id)).toEqual(['a', 'b', 'c'])
  })

  it('replaces a score only with a newer copy', () => {
    const backup = [score('a', 'Old mine', 150), score('b', 'Newer other', 300)]
    const result = mergeBackup(mine, JSON.stringify(libraryFile(backup)))
    expect(result).toMatchObject({ added: 0, updated: 1, unchanged: 1 })
    expect(result.scores.find((s) => s.id === 'a')?.title).toBe('Mine')
    expect(result.scores.find((s) => s.id === 'b')?.title).toBe('Newer other')
  })

  it('accepts a bare array or a single score', () => {
    expect(mergeBackup([], JSON.stringify([score('x', 'X', 1)])).added).toBe(1)
    expect(mergeBackup([], JSON.stringify(score('y', 'Y', 1))).added).toBe(1)
  })

  it('rejects files without scores', () => {
    expect(() => mergeBackup(mine, 'not json')).toThrow()
    expect(() => mergeBackup(mine, JSON.stringify({ hello: 'world' }))).toThrow()
  })

  it('summarises what changed', () => {
    expect(describeMerge({ scores: [], added: 2, updated: 1, unchanged: 0 })).toBe('Added 2 scores, updated 1 score')
    expect(describeMerge({ scores: [], added: 0, updated: 0, unchanged: 3 })).toBe('Already up to date (3 scores)')
  })
})
