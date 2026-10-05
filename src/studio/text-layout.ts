import Konva from 'konva'
import type { Element, Group } from './model'
import { drawingAttrs } from './drawing'

export function textFits(e: Element, defaultFont: string) {
  if (e.type !== 'text') return true
  const node = new Konva.Text({ ...drawingAttrs(e, defaultFont), height: undefined })
  const longestWord = Math.max(0, ...e.text.split(/\s+/u).map(word => node.measureSize(word).width))
  // Even a fractional extra line height can make Konva omit the final line.
  const fits = node.height() <= e.height && longestWord <= e.width
  node.destroy()
  return fits
}
export function fitText(e: Element, font: string): Element {
  if (e.type !== 'text') return e
  let next = { ...e }
  while (next.size > 8 && !textFits(next, font)) next = { ...next, size: next.size - 1 }
  return next
}
export function fitGroup(group: Group, font: string): Group {
  return { ...group, slides: group.slides.map(s => ({ ...s, elements: s.elements.map(e => fitText(e, font)) })) }
}
