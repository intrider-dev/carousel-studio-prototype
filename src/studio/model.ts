import { z } from 'zod'
import { fontNames, proposalSchema, pictureSource, layouts } from '../../shared/proposal.ts'
import type { Proposal } from '../../shared/proposal.ts'
import { composeGroup } from './layouts.ts'
import { brandSchema, briefSchema, directionSchema } from '../../shared/design.ts'
export { proposalSchema }
export type { Proposal }

export const fonts = [...fontNames]
const color = z.string().regex(/^#[0-9a-f]{6}$/i)
const base = z.object({ id: z.string().min(1).max(80), name: z.string().max(100), role: z.enum(['heading', 'body', 'counter', 'decoration', 'artwork', 'label', 'brand']).optional(), opacity: z.number().min(0).max(1).optional(), x: z.number().finite().min(-4096).max(4096), y: z.number().finite().min(-4096).max(4096), width: z.number().min(1).max(8192), height: z.number().min(1).max(8192), rotation: z.number().min(-360).max(360), locked: z.boolean(), visible: z.boolean() })
export const elementSchema = z.discriminatedUnion('type', [
  base.extend({ type: z.literal('text'), text: z.string().max(2000), font: z.string().max(100), size: z.number().min(8).max(300), bold: z.boolean(), italic: z.boolean(), fill: color, gradient:color.optional(), align: z.enum(['left', 'center', 'right']), lineHeight: z.number().min(.8).max(2).optional(), letterSpacing: z.number().min(-10).max(40).optional() }),
  base.extend({ type: z.literal('image'), src: pictureSource, fit: z.enum(['contain', 'cover']).optional(), cropX: z.number().min(0).max(1).optional(), cropY: z.number().min(0).max(1).optional() }),
  base.extend({ type: z.literal('shape'), kind: z.enum(['rect', 'ellipse', 'arrow', 'star', 'line', 'curve']), fill: color, gradient: color.optional(), radius: z.number().min(0).max(500).optional(), stroke: color.optional(), strokeWidth: z.number().min(0).max(50).optional() }),
])
export const slideSchema = z.object({ id: z.string(), title: z.string().max(120), layout:z.enum(layouts).optional(), background: color, elements: z.array(elementSchema).max(40) })
const groupSchema = z.object({ id: z.string(), name: z.string().min(1).max(100), slides: z.array(slideSchema).min(1).max(20) })
export const docSchema = z.object({ version: z.literal(2), brand:brandSchema.optional(), brief:briefSchema.optional(), direction:directionSchema.optional(), id: z.string().max(80).optional(), width: z.number().int().min(320).max(2160), height: z.number().int().min(320).max(2160), topic: z.string().max(800), style: z.string().max(800), defaultFont: z.string().max(100), groups: z.array(groupSchema).min(1).max(12), fonts: z.array(z.object({ family: z.string().regex(/^[\p{L}\p{N}_-]+$/u).max(100), data: z.string().max(3_000_000).regex(/^data:[\w.+/-]*;base64,[A-Za-z0-9+/=]+$/) })).max(10) }).refine(doc => {
  const ids = doc.groups.flatMap(g => [g.id, ...g.slides.flatMap(s => [s.id, ...s.elements.map(e => e.id)])])
  return ids.every(id => id.length > 0 && id.length <= 80) && new Set(ids).size === ids.length
}, 'Повторяющиеся идентификаторы слоёв или слайдов.')
export type Doc = z.infer<typeof docSchema>
export type Element = z.infer<typeof elementSchema>
export type Slide = z.infer<typeof slideSchema>
export type Group = Doc['groups'][number]
export type Settings = Pick<Doc, 'width' | 'height' | 'topic' | 'style' | 'defaultFont' | 'brand' | 'brief' | 'direction'>
export function parseProposal(text: string): Proposal {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  return proposalSchema.parse(JSON.parse(cleaned))
}
export const uid = () => crypto.randomUUID()
export function textElement(doc: Settings, text = 'Новый текст'): Extract<Element, { type: 'text' }> {
  return { id: uid(), name: 'Текст', type: 'text', text, x: doc.width * .08, y: doc.height * .12, width: doc.width * .84, height: doc.height * .18, rotation: 0, locked: false, visible: true, font: '', size: Math.round(doc.width * .05), bold: false, italic: false, fill: '#171717', align: 'left' }
}
export function makeGroup(doc: Settings, proposal?: Proposal): Group {
  if (proposal) return composeGroup(doc, proposal)
  const source = { name: 'Новая группа', background: '#ffffff', foreground: '#171717', slides: [{ title: doc.topic.slice(0,120) || 'Новая карусель', body: 'Откройте диалог и опишите, какую карусель хотите создать.' }] }
  return { id: uid(), name: source.name, slides: source.slides.map((s, i) => ({ id: uid(), title: s.title, background: source.background,
    elements: [
      { ...textElement(doc, s.title), role: 'heading', name: 'Заголовок', bold: true, height: doc.height * .25, fill: source.foreground },
      { ...textElement(doc, s.body), role: 'body', name: 'Основной текст', y: doc.height * .4, height: doc.height * .42, size: Math.round(doc.width * .031), fill: source.foreground },
      { ...textElement(doc, `${i + 1} / ${source.slides.length}`), role: 'counter', name: 'Номер слайда', y: doc.height * .9, height: doc.height * .06, size: Math.max(8, Math.round(doc.width * .023)), fill: source.foreground },
    ],
  })) }
}
export function normalizeDoc(value: Doc): Doc {
  return { ...value, id: value.id || value.groups[0].id, groups: value.groups.map(g => ({ ...g, slides: g.slides.map((s,i) => ({ ...s, elements: s.elements.map(e => {
    const role = e.role || (e.name === 'Заголовок' ? 'heading' : e.name === 'Номер слайда' ? 'counter' : e.name === 'Основной текст' ? 'body' : undefined)
    return { ...e, ...(role ? { role } : {}), ...(e.type === 'text' && role === 'counter' ? { text: `${String(i + 1).padStart(2,'0')} / ${String(g.slides.length).padStart(2,'0')}` } : {}) }
  }) })) })) }
}
export function createDoc(settings: Settings): Doc { return { version: 2, id: uid(), ...settings, fonts: [], groups: [makeGroup(settings)] } }
export function cloneSlide(slide: Slide): Slide { return { ...slide, id: uid(), elements: slide.elements.map(e => ({ ...e, id: uid() })) } }
export function contextFor(doc: Doc, group: Group, slideId?: string) {
  return { width: doc.width, height: doc.height, topic: doc.topic, style: doc.style, group: group.name, brief:doc.brief, direction:doc.direction, brand:doc.brand?{...doc.brand,logo:doc.brand.logo?'uploaded':undefined}:undefined,
    slides: group.slides.filter(s => !slideId || s.id === slideId).map(s => ({ id: s.id, title: s.title, background: s.background, texts: s.elements.filter(e => e.type === 'text').map(e => e.text), images: s.elements.filter(e => e.type === 'image').length, layers: s.elements.map(e => { const { id, name, type, x, y, width, height, rotation, role } = e; return { id, name, type, x, y, width, height, rotation, role, ...(e.type === 'text' ? { text: e.text, font: e.font || doc.defaultFont, size: e.size, fill: e.fill } : {}) } }) })) }
}
