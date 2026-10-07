import academicoBoldUrl from '@vexflow-fonts/academico/academico-bold.woff2?url'
import academicoUrl from '@vexflow-fonts/academico/academico.woff2?url'
import bravuraUrl from '@vexflow-fonts/bravura/bravura.woff2?url'
import type { Score } from '../music/types'
import { loadMusicFonts, renderScore } from './renderScore'

async function dataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * A standalone SVG of the score. VexFlow draws glyphs as text in the Bravura
 * font, so the fonts are embedded or the file would show boxes elsewhere.
 */
export async function scoreToSvg(score: Score): Promise<string> {
  await loadMusicFonts()
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-10000px;top:0;'
  document.body.append(host)
  try {
    renderScore(host, score, { width: 820, header: true })
    const svg = host.querySelector('svg')!
    const [bravura, academico, academicoBold] = await Promise.all([
      dataUrl(bravuraUrl),
      dataUrl(academicoUrl),
      dataUrl(academicoBoldUrl),
    ])
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
    style.textContent = [
      `@font-face{font-family:"Bravura";src:url(${bravura}) format("woff2")}`,
      `@font-face{font-family:"Academico";src:url(${academico}) format("woff2")}`,
      `@font-face{font-family:"Academico";font-weight:bold;src:url(${academicoBold}) format("woff2")}`,
    ].join('')
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    background.setAttribute('width', '100%')
    background.setAttribute('height', '100%')
    background.setAttribute('fill', '#fff')
    svg.prepend(style, background)
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svg.style.color = '#111'
    return new XMLSerializer().serializeToString(svg)
  } finally {
    host.remove()
  }
}
