import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createDoc, cloneSlide, contextFor, docSchema, makeGroup, parseProposal, normalizeDoc } from '../src/studio/model.ts'
import { layouts, proposalJsonSchema } from '../shared/proposal.ts'
const settings = { width: 1080, height: 1350, topic: 'Кофе', style: 'Светлая фотография', defaultFont: 'Arial' }
test('Document settings and groups survive serialization', () => {
  const doc = createDoc(settings)
  assert.deepEqual(docSchema.parse(JSON.parse(JSON.stringify(doc))), doc)
  assert.equal(doc.groups[0].slides.length, 1)
  assert.equal(doc.groups[0].slides[0].title, settings.topic)
  assert.equal(doc.width / doc.height, .8)
  for (const width of [320, 2160]) for (const height of [320, 2160]) assert.equal(docSchema.safeParse(createDoc({ ...settings, width, height })).success, true)
})
test('Duplicate slide has independent element identities', () => {
  const slide = createDoc(settings).groups[0].slides[0]
  const copy = cloneSlide(slide)
  assert.notEqual(copy.id, slide.id)
  copy.elements.forEach((e,i) => assert.notEqual(e.id, slide.elements[i].id))
  copy.elements[0].x = 1
  assert.notEqual(slide.elements[0].x, 1)
})
test('Connector accepts fenced JSON and rejects invalid or excessive proposals', () => {
  const valid = { name: 'Кофе', slides: [{ title: 'Зёрна', body: 'Выберите свежую обжарку' }] }
  assert.equal(parseProposal('```json\n' + JSON.stringify(valid) + '\n```').slides.length, 1)
  assert.throws(() => parseProposal('Не JSON'))
  assert.throws(() => parseProposal(JSON.stringify({ ...valid, slides: Array(13).fill(valid.slides[0]) })))
  assert.throws(() => parseProposal(JSON.stringify({ ...valid, background: 'red' })))
})
test('Connector scope excludes image content and other slides', () => {
  const doc = createDoc(settings)
  const group = doc.groups[0]
  group.slides.push(cloneSlide(group.slides[0]))
  const context = contextFor(doc, group, group.slides[1].id)
  assert.equal(context.slides.length, 1)
  assert.equal(context.slides[0].title, group.slides[1].title)
  assert.equal(context.topic, settings.topic)
  assert.equal(contextFor(doc, group).slides.length, 2)
  assert.ok(context.slides[0].layers.some(e=>e.role==='heading'))
})
test('Invalid dimensions, external image sources and empty groups rejected', () => {
  const doc = createDoc(settings)
  assert.equal(docSchema.safeParse({ ...doc, width: 0 }).success, false)
  assert.equal(docSchema.safeParse({ ...doc, groups: [] }).success, false)
  const group = makeGroup(settings)
  group.slides[0].elements = [{ ...group.slides[0].elements[0], type: 'image', src: 'https://external.invalid/photo.png' }]
  assert.equal(docSchema.safeParse({ ...doc, groups: [group] }).success, false)
})

test('Illustrated layouts preserve pictures, editable text and bounds at supported dimensions', () => {
  const proposal = parseProposal(JSON.stringify({ name: 'Кофе', accent: '#7047eb', slides: layouts.map((layout, i) => ({ layout, title: `Совет ${i + 1}`, body: 'Выбирайте свежие зёрна.', artwork: { src: 'data:image/webp;base64,AAAA', width: 1024, height: 1024 } })) }))
  for (const [width, height] of [[1080,1080], [1080,1350], [1080,1920], [1920,1080], [320,2160], [2160,320]]) {
    const doc = createDoc({ ...settings, width, height })
    const group = makeGroup(doc, proposal)
    assert.equal(docSchema.safeParse({ ...doc, groups: [group] }).success, true)
    for (const slide of group.slides) {
      const picture = slide.elements.find(e => e.type === 'image')!
      assert.equal(picture.type==='image'&&picture.fit, 'cover')
      assert.ok(slide.elements.filter(e => e.type === 'text').length >= 4)
      for (const element of slide.elements) {
        assert.ok(element.x >= 0 && element.y >= 0)
        assert.ok(element.x + element.width <= width + .01 && element.y + element.height <= height + .01)
      }
      const copy = cloneSlide(slide)
      const copied=copy.elements.find(e=>e.type==='image')!
      assert.notEqual(copied.id, picture.id)
      assert.deepEqual(copied, { ...picture, id: copied.id })
    }
  }
})
test('Numbering follows slide order and roles survive layer reordering',()=>{
  const doc=createDoc(settings),group=doc.groups[0]
  group.slides.push(cloneSlide(group.slides[0]));group.slides.reverse();group.slides[0].elements.reverse()
  const normalized=normalizeDoc(doc)
  assert.equal(normalized.groups[0].slides[0].elements.find(e=>e.role==='counter')?.type,'text')
  const counter=normalized.groups[0].slides[1].elements.find(e=>e.role==='counter')!
  assert.equal(counter.type==='text'&&counter.text,'02 / 02')
  assert.equal(normalized.groups[0].slides[0].elements.find(e=>e.role==='heading')?.name,'Заголовок')
})
test('Narrow photos remain valid and server contract uses the same text limit',()=>{
  const doc=createDoc(settings)
  doc.groups[0].slides[0].elements.push({id:crypto.randomUUID(),name:'Фото',type:'image',src:'data:image/png;base64,AAAA',x:0,y:0,width:702,height:6.5,rotation:0,locked:false,visible:true})
  assert.equal(docSchema.safeParse(doc).success,true)
  const schema=proposalJsonSchema(3)
  assert.equal(schema.properties?.slides.minItems,3)
  assert.throws(()=>parseProposal(JSON.stringify({name:'Тест',slides:[{title:'Тест',body:'x'.repeat(451)}]})))
})
