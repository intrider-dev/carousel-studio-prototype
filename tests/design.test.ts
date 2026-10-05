import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createDoc,makeGroup,parseProposal,docSchema } from '../src/studio/model.ts'
import { brandSchema,briefSchema } from '../shared/design.ts'
import { artDirectProposal } from '../src/studio/art-direction.ts'
import { inspectSlide,contrastRatio,elementBounds } from '../src/studio/quality.ts'
import { groupProposal } from '../src/studio/restyle.ts'

const settings={width:1080,height:1350,topic:'Кофе',style:'Фото',defaultFont:'Manrope Variable'}
test('Automatic direction keeps one font pair even when incoming slides disagree',()=>{
 const doc=createDoc({...settings,direction:'auto'})
 const proposal=parseProposal(JSON.stringify({name:'Серия',slides:[{title:'Один',body:'Текст',headingFont:'Oswald Variable',bodyFont:'Courier New'},{title:'Два',body:'Текст',headingFont:'Playfair Display Variable',bodyFont:'Arial'}]}))
 const group=makeGroup(doc,proposal)
 for(const slide of group.slides) {
  assert.equal(slide.elements.find(e=>e.role==='heading')?.type==='text'&&slide.elements.find(e=>e.role==='heading')?.font,'Oswald Variable')
  assert(slide.elements.filter(e=>e.type==='text'&&e.role!=='heading').every(e=>e.type==='text'&&e.font==='Manrope Variable'))
 }
})
test('Restyling preserves source layers and carries text and the main photo into a new group',()=>{
 const doc=createDoc({...settings,direction:'bold'})
 const source=makeGroup(doc,parseProposal(JSON.stringify({name:'Серия',slides:[{title:'Ищите своё',body:'Начните с малого.',layout:'split',artwork:{src:'data:image/png;base64,AAAA',width:1024,height:1024}}]})))
 const before=JSON.stringify(source),rebuilt=makeGroup(doc,groupProposal(source))
 assert.equal(JSON.stringify(source),before)
 assert.notEqual(rebuilt.id,source.id)
 assert.equal(rebuilt.slides[0].title,source.slides[0].title)
 assert.equal(rebuilt.slides[0].elements.find(e=>e.type==='image')?.src,'data:image/png;base64,AAAA')
 assert(docSchema.safeParse({...doc,groups:[source,rebuilt]}).success)
 assert(rebuilt.slides[0].elements.some(e=>e.type==='shape'&&e.kind==='curve'))
 assert(rebuilt.slides[0].elements.some(e=>e.type==='text'&&e.gradient))
})
test('Editorial composition does not squeeze paragraphs into a narrow column',()=>{
 const doc=createDoc(settings),group=makeGroup(doc,parseProposal(JSON.stringify({name:'Серия',slides:[{title:'Свой смысл',body:'Замечайте, что приносит радость.',layout:'editorial'}]})))
 const body=group.slides[0].elements.find(e=>e.role==='body')!
 assert(body.width/doc.width>=.8)
})
test('Technical review checks both gradient colors',()=>{
 const doc=createDoc(settings),slide=doc.groups[0].slides[0]
 const heading=slide.elements.find(e=>e.type==='text'&&e.role==='heading')!
 if(heading.type!=='text')throw new Error('Heading missing')
 heading.fill='#000000';heading.gradient=slide.background
 assert(inspectSlide(doc,slide).some(i=>i.code==='contrast'))
})
test('Brief and brand survive document validation without leaking logo into model context',async()=>{
 const {contextFor}=await import('../src/studio/model.ts')
 const doc=createDoc({...settings,brief:briefSchema.parse({audience:'Гости кофейни',count:4}),brand:brandSchema.parse({enabled:true,name:'Atelier',logo:'data:image/png;base64,AAAA'})})
 assert.deepEqual(docSchema.parse(doc),doc)
 assert.equal(contextFor(doc,doc.groups[0]).brand?.logo,'uploaded')
 assert(!JSON.stringify(contextFor(doc,doc.groups[0])).includes('data:image'))
})
test('Locked brand overrides model colors and font choices across every slide',()=>{
 const proposal=parseProposal(JSON.stringify({name:'Серия',slides:[{title:'Кофе',body:'Текст',headingFont:'Oswald Variable'},{title:'Утро',body:'Текст'}]}))
 const doc=createDoc({...settings,brand:brandSchema.parse({enabled:true,name:'Atelier',background:'#102030',foreground:'#ffffff',accent:'#efdcaa',headingFont:'Playfair Display Variable'})})
 const directed=artDirectProposal(doc,proposal)
 assert.equal(directed.background,'#102030')
 assert(directed.slides.every(s=>s.headingFont==='Playfair Display Variable'&&s.kicker==='Atelier'&&s.background===null))
 const group=makeGroup(doc,directed)
 assert(group.slides.every(s=>s.elements.some(e=>e.type==='text'&&e.role==='heading'&&e.fill==='#ffffff')))
})
test('Technical review detects unsafe bounds, small type and weak contrast',()=>{
 const doc=createDoc(settings),slide=doc.groups[0].slides[0],text=slide.elements[0]
 assert.equal(contrastRatio('#000000','#ffffff'),21)
 assert.equal(contrastRatio('#777777','#777777'),1)
 if(text.type!=='text')throw new Error('Expected heading')
 text.x=1100;text.size=8;text.fill='#ffffff'
 const issues=inspectSlide(doc,slide)
 assert(issues.some(i=>i.code==='bounds'&&i.severity==='error'))
 assert(issues.some(i=>i.code==='readability'))
 assert(issues.some(i=>i.code==='contrast'))
 text.x=0;text.y=0;text.rotation=90
 assert(Math.abs(elementBounds(text).left+text.height)<.01)
})
test('Clean direction omits unnecessary poster stars and keeps landscape reading zones separate',()=>{
 const proposal=parseProposal(JSON.stringify({name:'Серия',slides:[{title:'Кофе',body:'Короткий текст',layout:'poster',highlight:'Акцент',artwork:{src:'data:image/png;base64,AAAA',width:1024,height:1024}}]}))
 const doc=createDoc({...settings,direction:'minimal'})
 assert(!makeGroup(doc,proposal).slides[0].elements.some(e=>e.type==='shape'&&e.kind==='star'))
 const landscape=makeGroup({...doc,width:1920,height:1080},proposal).slides[0]
 const title=landscape.elements.find(e=>e.role==='heading')!,picture=landscape.elements.find(e=>e.role==='artwork')!
 assert(title.x+title.width<picture.x)
})
