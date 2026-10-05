import type { Project } from './project.ts'
import { roles } from './project.ts'

export function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!)
}

// Wrap by measured glyph widths in the browser; the fallback keeps this function testable in Node.
export function wrapText(text: string, maxWidth: number, measure: (text: string) => number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.trim().split(/\s+/u)) {
    const candidate = line ? `${line} ${word}` : word
    if (measure(candidate) <= maxWidth) { line = candidate; continue }
    if (line) { lines.push(line); line = '' }
    for (const char of Array.from(word)) {
      if (line && measure(line + char) > maxWidth) { lines.push(line); line = '' }
      line += char
    }
  }
  if (line) lines.push(line)
  return lines
}

export function slideSvg(project: Project, index: number): string {
  const slide = project.slides[index]
  const dark = index === 0 || index === 5
  const bg = dark ? '#171717' : '#ffffff'
  const fg = dark ? '#fafafa' : '#171717'
  const muted = dark ? '#d4d4d4' : '#525252'
  const ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null
  function lines(text: string, size: number, weight: number) {
    if (ctx) ctx.font = `${weight} ${size}px Arial`
    return wrapText(text, 888, t => ctx ? ctx.measureText(t).width : Array.from(t).length * size * 0.65)
  }
  let titleSize = 64
  let bodySize = 38
  let title = lines(slide.title, titleSize, 700)
  let body = lines(slide.body, bodySize, 400)
  while (350 + title.length * titleSize * 1.22 + 40 + body.length * bodySize * 1.4 > 1110 && titleSize > 36) {
    titleSize -= 2; bodySize -= 1
    title = lines(slide.title, titleSize, 700); body = lines(slide.body, bodySize, 400)
  }
  const bodyY = 350 + title.length * titleSize * 1.22 + 40
  let brandSize = 30
  const brandWidth = project.logo ? 776 : 888
  while (brandSize > 16) {
    if (ctx) ctx.font = `400 ${brandSize}px Arial`
    if ((ctx ? ctx.measureText(project.brand).width : project.brand.length * brandSize * 0.65) <= brandWidth) break
    brandSize--
  }
  const text = (rows: string[], y: number, size: number, height: number, weight: number, color: string) =>
    `<text fill="${color}" font-size="${size}" font-weight="${weight}">${rows.map((r, n) => `<tspan x="96" y="${y + n * height}">${escapeXml(r)}</tspan>`).join('')}</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <rect width="1080" height="1350" fill="${bg}"/>
    <g font-family="Arial, sans-serif">
    ${project.logo ? `<rect x="96" y="80" width="84" height="84" rx="8" fill="white"/><image href="${project.logo}" x="104" y="88" width="68" height="68" preserveAspectRatio="xMidYMid meet"/>` : ''}
    <text x="${project.logo ? 208 : 96}" y="134" fill="${fg}" font-size="${brandSize}">${escapeXml(project.brand)}</text>
    <text x="96" y="260" fill="${muted}" font-size="26">${escapeXml(roles[index].toUpperCase())}</text>
    ${text(title, 350, titleSize, titleSize * 1.22, 700, fg)}
    ${text(body, bodyY, bodySize, bodySize * 1.4, 400, muted)}
    <line x1="96" y1="1170" x2="984" y2="1170" stroke="${muted}"/>
    ${text(lines(project.contact, 26, 400), 1224, 26, 34, 400, muted)}
    <text x="984" y="1310" text-anchor="end" fill="${muted}" font-size="26">${index + 1} / 6</text>
    </g></svg>`
}

export const slideUrl = (project: Project, index: number) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(slideSvg(project, index))}`

export async function slidePng(project: Project, index: number): Promise<Blob> {
  const img = new Image()
  img.src = slideUrl(project, index)
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = 1080; canvas.height = 1350
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Не удалось подготовить изображение.')
  ctx.drawImage(img, 0, 0)
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Не удалось создать PNG.')), 'image/png'))
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url; anchor.download = name
  document.body.append(anchor); anchor.click(); anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
