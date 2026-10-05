import Konva from 'konva'
import type { Element, Group,Doc } from './model'
import { drawingAttrs } from './drawing'
import { loadSlideFonts } from './fonts'

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
export function fitGroup(group: Group, font: string, aspectRatio = 1): Group {
  return { ...group, slides: group.slides.map(s => {
    const elements=s.elements.map(e=>fitText(e,font))
    const heading=elements.find(e=>e.type==='text'&&e.role==='heading'&&e.origin==='generated')
    const body=elements.find(e=>e.type==='text'&&e.role==='body'&&e.origin==='generated')
    // Group short poster copy together after the final fonts have been measured.
    if(s.layout==='poster'&&aspectRatio<=1.25&&heading?.type==='text'&&body?.type==='text'&&body.y>=heading.y+heading.height){
      const node=new Konva.Text({...drawingAttrs(heading,font),height:undefined})
      heading.height=Math.ceil(node.height());node.destroy()
      body.y=Math.min(body.y,heading.y+heading.height+heading.size*.4)
    }
    return {...s,elements}
  }) }
}
export async function fitEditedDocument(before:Doc,after:Doc):Promise<Doc> {
  await loadSlideFonts(after,after.groups.flatMap(g=>g.slides))
  const previous=new Map(before.groups.flatMap(g=>g.slides.flatMap(s=>s.elements.map(e=>[e.id,e] as const))))
  return {...after,groups:after.groups.map(g=>({...g,slides:g.slides.map(s=>({...s,elements:s.elements.map(e=>e.type==='text'&&JSON.stringify(previous.get(e.id))!==JSON.stringify(e)?fitText(e,after.defaultFont):e)}))}))}
}
