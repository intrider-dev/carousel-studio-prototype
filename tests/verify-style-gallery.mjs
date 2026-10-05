import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import JSZip from 'jszip'
import { directions } from '../shared/design.ts'
import { visualStyles } from '../shared/visual-styles.ts'
import { docSchema } from '../src/studio/model.ts'

const pictures=Object.keys(visualStyles)
assert.equal(pictures.length,6)
const files=[...Object.keys(directions).map(key=>`direction-${key}`),...pictures.map(key=>`picture-${key}`)]
assert.equal(files.length,11)
const results=[]
const directionLayouts=new Set()
for(const file of files){
 const doc=docSchema.parse(JSON.parse(await readFile(`output/playwright/${file}.json`,'utf8')))
 assert.equal(doc.width,1080);assert.equal(doc.height,1350)
 assert.equal(doc.groups.length,2)
 assert.equal(doc.groups[0].slides[0].title,'Место для мысли: домашний рабочий стол')
 assert.equal(doc.groups[0].slides[0].elements.filter(layer=>layer.type==='image').length,0)
 const slides=doc.groups.at(-1).slides
 assert.equal(slides.length,1)
 const slide=slides[0],heading=slide.elements.find(layer=>layer.role==='heading'),body=slide.elements.find(layer=>layer.role==='body')
 assert.equal(heading.text,'Место для мысли')
 assert.equal(body.text,'Оставьте на столе ноутбук, блокнот и ручку. Остальное уберите.')
 assert.equal(slide.elements.filter(layer=>layer.type==='image'&&layer.role==='artwork').length,1)
 if(file.startsWith('direction-')){
  directionLayouts.add(slide.layout)
  const key=file.slice('direction-'.length),preset=directions[key]
  assert.equal(doc.direction,key)
  if(key!=='auto')assert.equal(slide.background,preset.background)
  assert.equal(heading.font,preset.heading);assert.equal(body.font,preset.body)
 }else{
  assert.equal(slide.layout,'poster')
  assert.equal(slide.background,'#f2ecdf')
  assert.equal(heading.font,'Manrope Variable');assert.equal(body.font,'Manrope Variable')
  assert(body.y>=heading.y+heading.height)
  assert(body.y-(heading.y+heading.height)<heading.size*.5,'Short poster copy must not leave an oversized gap')
 }
 const png=await readFile(`docs/examples/${file}.png`)
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a')
 assert.equal(png.readUInt32BE(16),1080);assert.equal(png.readUInt32BE(20),1350)
 const zip=await JSZip.loadAsync(await readFile(`output/playwright/${file}.zip`),{checkCRC32:true})
 const archived=Object.values(zip.files)
 assert.equal(archived.length,1)
 assert(!archived[0].dir)
 assert.deepEqual(await archived[0].async('nodebuffer'),png)
 results.push({example:file,png:true,zipCRC:true,sourcePreserved:true})
}
assert(directionLayouts.size>=3,'Project directions must demonstrate different compositions')
for(const file of ['README.md','README.ru.md']){
 const text=await readFile(file,'utf8')
 assert(!text.includes('\ufffd'),'Documentation must retain valid text')
 const examples=Array.from(text.matchAll(/<img src="(docs\/examples\/[^"]+)"/gu),match=>match[1])
 assert.deepEqual(examples,files.map(file=>`docs/examples/${file}.png`))
 const links=Array.from(text.matchAll(/(?:src|href)="(docs\/[^"]+)"/gu),match=>match[1])
 for(const link of links)assert((await stat(link)).isFile(),`Missing local documentation asset: ${link}`)
}
console.log(JSON.stringify({examples:results,directions:5,pictureStyles:6,dimensions:'1080x1350',readmes:'both checked'}))
