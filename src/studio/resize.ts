import { makeGroup, parseProposal } from './model'
import type { Doc, Slide, Element } from './model'
import { fitText } from './text-layout'
import { loadSlideFonts } from './fonts'

export const exportSizes={project:{label:'Размер проекта',width:0,height:0},square:{label:'Квадрат · 1080×1080',width:1080,height:1080},portrait:{label:'Публикация · 1080×1350',width:1080,height:1350},story:{label:'Вертикальный · 1080×1920',width:1080,height:1920},landscape:{label:'Горизонтальный · 1920×1080',width:1920,height:1080}} as const
export function resizeSlide(doc:Doc,slide:Slide,width:number,height:number):Slide {
  const target={...doc,width,height},artworks=slide.elements.filter((e):e is Extract<Element,{type:'image'}>=>e.type==='image'&&e.role!=='brand')
  if(slide.layout&&artworks.length===1&&!slide.elements.some(e=>e.locked&&e.role!=='brand')) {
    const text=slide.elements.filter(e=>e.type==='text')
    const heading=text.find(e=>e.role==='heading'),body=text.find(e=>e.role==='body'),label=text.find(e=>e.role==='label')
    const accent=slide.elements.find((e):e is Extract<Element,{type:'shape'}>=>e.type==='shape'&&e.fill!==slide.background)?.fill||'#ba462d'
    const source=parseProposal(JSON.stringify({name:doc.groups.find(g=>g.slides.some(s=>s.id===slide.id))?.name||slide.title,background:slide.background,foreground:heading?.fill||'#171717',accent,slides:[{title:heading?.text||slide.title,body:body?.text||' ',layout:slide.layout,headingFont:'Manrope Variable',bodyFont:'Manrope Variable',highlight:label?.text||'',artwork:{src:artworks[0].src,width:1,height:1}}]}))
    // A template reflow must never silently discard added or repositioned layers.
    const baseline=makeGroup(doc,source).slides[0]
    const geometry=(e:Element)=>JSON.stringify([e.type,e.role,e.visible,e.locked,...[e.x,e.y,e.width,e.height,e.rotation].map(n=>Math.round(n*100)/100)])
    const originalGeometry=slide.elements.map(geometry).sort().join('|')
    if(originalGeometry===baseline.elements.map(geometry).sort().join('|')) {
    const composed=makeGroup(target,source).slides[0]
    const counter=text.find(e=>e.role==='counter')
    return {...composed,elements:composed.elements.map(e=>fitText(e.type==='text'?{...e,font:e.role==='heading'?heading?.font||doc.defaultFont:body?.font||doc.defaultFont,...(e.role==='counter'&&counter?{text:counter.text}:{})}:e,doc.defaultFont))}
    }
  }
  const sx=width/doc.width,sy=height/doc.height
  return {...slide,elements:slide.elements.map(e=>fitText({...e,x:e.x*sx,y:e.y*sy,width:e.width*sx,height:e.height*sy,...(e.type==='text'?{size:Math.max(8,Math.min(300,e.size*Math.min(sx,sy)))}:{})},doc.defaultFont))}
}
export async function prepareResizedSlide(doc:Doc,slide:Slide,width:number,height:number) {
  await loadSlideFonts(doc,[slide])
  return resizeSlide(doc,slide,width,height)
}
