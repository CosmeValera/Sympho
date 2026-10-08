import { describe, expect, it } from 'vitest'
import { uniqueTitle } from './titles'

describe('uniqueTitle', () => {
  it('keeps a title nobody else has', () => {
    expect(uniqueTitle('Ode to Joy', ['Minuet'], 'copy')).toBe('Ode to Joy')
    expect(uniqueTitle('  ', [], 'number')).toBe('Untitled score')
  })

  it('counts copies up from the original', () => {
    const taken = ['Ode to Joy', 'Ode to Joy (copy)']
    expect(uniqueTitle('Ode to Joy', ['Ode to Joy'], 'copy')).toBe('Ode to Joy (copy)')
    expect(uniqueTitle('Ode to Joy', taken, 'copy')).toBe('Ode to Joy (copy 2)')
    expect(uniqueTitle('Ode to Joy (copy)', taken, 'copy')).toBe('Ode to Joy (copy 2)')
  })

  it('numbers new scores', () => {
    expect(uniqueTitle('Untitled score', ['Untitled score', 'Untitled score 2'], 'number')).toBe('Untitled score 3')
  })
})
