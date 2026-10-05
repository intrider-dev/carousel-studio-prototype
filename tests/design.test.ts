import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createDoc,makeGroup,parseProposal,docSchema } from '../src/studio/model.ts'
import { brandSchema,briefSchema } from '../shared/design.ts'
import { artDirectProposal } from '../src/studio/art-direction.ts'
import { inspectSlide,contrastRatio,elementBounds } from '../src/studio/quality.ts'

const settings={width:1080,height:1350,topic:'Кофе',style:'Фото',defaultFont:'Manrope Variable'}
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
