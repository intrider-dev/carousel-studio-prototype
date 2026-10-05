import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createDoc,makeGroup,parseProposal,cloneSlide,textElement,uid,normalizeDoc,docSchema } from '../src/studio/model.ts'
import { applyEditPlan,applyContentProposal,bindTarget,assertTarget } from '../src/studio/edits.ts'
import type { EditPlan } from '../shared/edit-plan.ts'
import { parseEditPlan } from '../shared/edit-plan.ts'
import { shapeElement } from '../src/studio/layouts.ts'
const settings={width:1080,height:1080,topic:'Кофе',style:'Предметная графика',defaultFont:'Manrope Variable'}
const setup=()=>{const doc=createDoc(settings);doc.groups[0].slides.push(cloneSlide(doc.groups[0].slides[0]));doc.groups.push(makeGroup(doc));return normalizeDoc(doc)}
const plan=(operations:EditPlan['operations']):EditPlan=>({summary:'Изменения',operations})
test('Layer edits are scoped and preserve other slides, groups and original data',async()=>{
 const doc=setup(),g=doc.groups[0],s=g.slides[0],target=await bindTarget(doc,g,s.id,'slide'),original=JSON.stringify(doc)
 const next=applyEditPlan(doc,target,plan([{op:'update_layer',slideId:s.id,layerId:s.elements[0].id,patch:{text:'Новый заголовок',x:100,fill:'#aabbcc',font:'Montserrat Variable'}},{op:'update_slide',slideId:s.id,background:'#112233'}]))
 assert.equal(JSON.stringify(doc),original);assert.deepEqual(next.groups[1],doc.groups[1]);assert.equal(next.groups[0].slides[0].title,'Новый заголовок')
 assert.deepEqual(next.groups[0].slides[1].elements.filter(e=>e.role!=='counter'),g.slides[1].elements.filter(e=>e.role!=='counter'))
 assert.throws(()=>applyEditPlan(doc,target,plan([{op:'update_slide',slideId:g.slides[1].id,background:'#112233'}])))
})
test('Invalid operations fail atomically and cannot change identifiers or source URLs',async()=>{
 const doc=setup(),s=doc.groups[0].slides[0],target=await bindTarget(doc,doc.groups[0],s.id,'slide'),original=JSON.stringify(doc)
 for(const patch of [{font:'MissingFont'},{fit:'cover'},{text:'X',src:'https://example.invalid'},{id:'other'}])assert.throws(()=>applyEditPlan(doc,target,plan([{op:'update_slide',slideId:s.id,background:'#112233'},{op:'update_layer',slideId:s.id,layerId:s.elements[0].id,patch} as never])))
 assert.equal(JSON.stringify(doc),original)
})
test('Locked layers require explicit unlocking and counters remain automatic',async()=>{
 const doc=setup(),s=doc.groups[0].slides[0];s.elements[0].locked=true
 const target=await bindTarget(doc,doc.groups[0],s.id,'slide')
 assert.throws(()=>applyEditPlan(doc,target,plan([{op:'delete_layer',slideId:s.id,layerId:s.elements[0].id}])))
 const next=applyEditPlan(doc,target,plan([{op:'update_layer',slideId:s.id,layerId:s.elements[0].id,patch:{locked:false,text:'Разрешённое изменение'}}]))
 assert.equal(next.groups[0].slides[0].title,'Разрешённое изменение')
 assert.throws(()=>applyEditPlan(doc,target,plan([{op:'update_layer',slideId:s.id,layerId:s.elements[2].id,patch:{text:'100'}}])))
})
test('Adding, duplicating, ordering and deleting layers use independent identities',async()=>{
 const doc=setup(),s=doc.groups[0].slides[0],target=await bindTarget(doc,doc.groups[0],s.id,'slide')
 const next=applyEditPlan(doc,target,plan([{op:'add_text',slideId:s.id,text:'Акцент',x:20,y:20,width:400,height:80,size:40,fill:'#000000'},{op:'add_shape',slideId:s.id,kind:'curve',x:50,y:50,width:100,height:100,fill:'#112233'},{op:'duplicate_layer',slideId:s.id,layerId:s.elements[0].id}]))
 const layers=next.groups[0].slides[0].elements;assert.equal(new Set(layers.map(e=>e.id)).size,layers.length)
 const reversed=applyEditPlan(next,target,plan([{op:'layer_order',slideId:s.id,order:layers.map(e=>e.id).reverse()},{op:'delete_layer',slideId:s.id,layerId:layers[0].id}]))
 assert.equal(reversed.groups[0].slides[0].elements.length,layers.length-1)
 assert.throws(()=>applyEditPlan(next,target,plan([{op:'layer_order',slideId:s.id,order:[layers[0].id,layers[0].id]}])))
})
test('Slide ordering, duplication and removal preserve limits and renumber counters',async()=>{
 const doc=setup(),g=doc.groups[0],target=await bindTarget(doc,g,g.slides[0].id,'group')
 const next=applyEditPlan(doc,target,plan([{op:'slide_order',order:g.slides.map(s=>s.id).reverse()},{op:'duplicate_slide',slideId:g.slides[1].id},{op:'delete_slide',slideId:g.slides[0].id},{op:'rename_group',name:'Новая последовательность'}]))
 assert.equal(next.groups[0].slides.length,2);assert.equal(next.groups[0].name,'Новая последовательность')
 assert.equal(next.groups[0].slides[0].elements.find(e=>e.type==='text'&&e.role==='counter')?.text,'01 / 02')
 const only=createDoc(settings),binding=await bindTarget(only,only.groups[0],only.groups[0].slides[0].id,'group')
 assert.throws(()=>applyEditPlan(only,binding,plan([{op:'delete_slide',slideId:binding.slideIds[0]}])))
})
test('Layer and slide limits reject a whole plan without partially applying it',async()=>{
 const doc=setup(),g=doc.groups[0],s=g.slides[0]
 while(s.elements.length<40)s.elements.push(textElement(doc))
 const target=await bindTarget(doc,g,s.id,'group')
 assert.throws(()=>applyEditPlan(doc,target,plan([{op:'duplicate_layer',slideId:s.id,layerId:s.elements[0].id}])))
 while(g.slides.length<20)g.slides.push(cloneSlide(s))
 assert.throws(()=>applyEditPlan(doc,target,plan([{op:'duplicate_slide',slideId:s.id}])))
})
test('A changed photo, deleted slide, changed order or format invalidates pending edits',async()=>{
 const doc=setup(),g=doc.groups[0],s=g.slides[0]
 s.elements.push({id:uid(),name:'Фото',type:'image',src:'data:image/png;base64,AAAA',x:0,y:0,width:100,height:100,rotation:0,visible:true,locked:false})
 const target=await bindTarget(doc,g,s.id,'group');await assertTarget(doc,target)
 for(const mutate of [(d:typeof doc)=>{const e=d.groups[0].slides[0].elements.at(-1)!;if(e.type==='image')e.src='data:image/png;base64,BBBB'},(d:typeof doc)=>d.groups[0].slides.reverse(),(d:typeof doc)=>{d.width=1200},(d:typeof doc)=>d.groups[0].slides.pop()]){const changed=structuredClone(doc);mutate(changed);await assert.rejects(assertTarget(changed,target))}
})
test('Saving and parsing the same document does not invalidate a pending operation',async()=>{
 const doc=setup(),g=doc.groups[0],s=g.slides[0];s.elements.push(shapeElement(doc,'curve'))
 const target=await bindTarget(doc,g,s.id,'slide')
 await assertTarget(docSchema.parse(JSON.parse(JSON.stringify(doc))),target)
})
test('Single-slide rewriting preserves all photos, layer IDs and other slides',async()=>{
 const doc=setup(),g=doc.groups[0],s=g.slides[1],target=await bindTarget(doc,g,s.id,'slide')
 const proposal=parseProposal(JSON.stringify({name:'Текст',slides:[{title:'Новая тема',body:'Новый текст'}]}))
 const next=applyContentProposal(doc,target,proposal,'rewrite')
 assert.deepEqual(next.groups[0].slides[0],g.slides[0]);assert.deepEqual(next.groups[1],doc.groups[1]);assert.deepEqual(next.groups[0].slides[1].elements.map(e=>e.id),s.elements.map(e=>e.id))
 assert.equal(next.groups[0].slides[1].title,'Новая тема')
})
test('Redesign keeps slide identities, added graphics, extra photos and custom text',async()=>{
 const doc=setup(),g=doc.groups[0],s=g.slides[0]
 const custom=[shapeElement(doc,'curve'),textElement(doc,'Заметка')]
 s.elements.push(...custom)
 const target=await bindTarget(doc,g,s.id,'slide'),proposal=parseProposal(JSON.stringify({name:'Дизайн',background:'#112233',slides:[{title:'Обновлённый дизайн',body:'Текст',layout:'split'}]}))
 const next=applyContentProposal(doc,target,proposal,'replace')
 assert.equal(next.groups.length,doc.groups.length);assert.equal(next.groups[0].id,g.id);assert.equal(next.groups[0].slides[0].id,s.id)
 custom.forEach(e=>assert.deepEqual(next.groups[0].slides[0].elements.find(x=>x.id===e.id),e));assert.equal(next.groups[0].slides[0].background,'#112233')
})
test('Edit response parsing rejects arbitrary commands and accepts fenced contracts',()=>{
 assert.equal(parseEditPlan('```json\n'+JSON.stringify(plan([{op:'rename_group',name:'Серия'}]))+'\n```').operations.length,1)
 assert.throws(()=>parseEditPlan(JSON.stringify(plan([{op:'execute',code:'arbitrary'} as never]))))
})
test('New slides can reuse source pictures and group duplication remains independent',async()=>{
 const doc=setup(),g=doc.groups[0],s=g.slides[0],photo={id:uid(),name:'Фото',origin:'manual' as const,type:'image' as const,src:'data:image/png;base64,AAAA',x:0,y:0,width:100,height:100,rotation:0,visible:true,locked:false}
 s.elements.push(photo)
 const target=await bindTarget(doc,g,s.id,'group')
 const next=applyEditPlan(doc,target,plan([{op:'add_slide',afterSlideId:s.id,title:'Новый кадр',body:'Новый текст',layout:'poster',imageFromLayerId:photo.id},{op:'duplicate_group',name:'Копия'}]))
 assert.equal(next.groups[0].slides[1].title,'Новый кадр');assert.equal(next.groups.at(-1)?.slides.length,3)
 assert(next.groups[0].slides[1].elements.some(e=>e.type==='image'&&e.src===photo.src))
 assert.equal(new Set(next.groups.flatMap(g=>g.slides.flatMap(s=>s.elements.map(e=>e.id)))).size,next.groups.reduce((sum,g)=>sum+g.slides.reduce((n,s)=>n+s.elements.length,0),0))
 assert.throws(()=>applyEditPlan(doc,target,plan([{op:'add_slide',afterSlideId:s.id,title:'Нет',body:'Нет',layout:'poster',imageFromLayerId:'missing'}])))
})
test('The last group and slide-only contexts cannot be deleted or duplicated as groups',async()=>{
 const doc=createDoc(settings),target=await bindTarget(doc,doc.groups[0],doc.groups[0].slides[0].id,'group')
 assert.throws(()=>applyEditPlan(doc,target,plan([{op:'delete_group'}])))
 const single=await bindTarget(doc,doc.groups[0],target.slideIds[0],'slide')
 for(const op of [{op:'delete_group'},{op:'duplicate_group',name:'Копия'},{op:'rename_group',name:'Нет'}] as EditPlan['operations'])assert.throws(()=>applyEditPlan(doc,single,plan([op])))
 const multi=setup(),group=multi.groups[0],binding=await bindTarget(multi,group,group.slides[0].id,'group')
 const deleted=applyEditPlan(multi,binding,plan([{op:'delete_group'}]));assert.equal(deleted.groups.length,1);assert.equal(deleted.groups[0].id,multi.groups[1].id)
})
