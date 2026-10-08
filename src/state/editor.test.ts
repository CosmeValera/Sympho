import { describe, expect, it } from 'vitest'
import { newScore } from '../music/serialize'
import { editorReducer, initEditor } from './editor'

describe('click modes', () => {
  const start = initEditor(newScore(), false)

  it('starts writing notes', () => {
    expect(start.restMode).toBe(false)
    expect(start.selectMode).toBe(false)
  })

  it('turns rest input off when select mode turns on, and back', () => {
    const resting = editorReducer(start, { type: 'restMode', on: true })
    const selecting = editorReducer(resting, { type: 'selectMode', on: true })
    expect(selecting).toMatchObject({ selectMode: true, restMode: false })
    expect(editorReducer(selecting, { type: 'restMode', on: true })).toMatchObject({ selectMode: false, restMode: true })
  })

  it('leaves the other mode alone when turning one off', () => {
    const selecting = editorReducer(start, { type: 'selectMode', on: true })
    expect(editorReducer(selecting, { type: 'restMode', on: false })).toMatchObject({ selectMode: true, restMode: false })
  })
})
