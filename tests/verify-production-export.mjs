import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { docSchema } from '../src/studio/model.ts'
const doc=docSchema.parse(JSON.parse(await readFile('output/playwright/production-project.json','utf8')))
const group=doc.groups.at(-1),slides=group.slides
assert.equal(slides.length,4)
assert.equal(doc.brand.name,'FORM')
assert(slides.every(s=>s.background==='#202722'&&s.elements.some(e=>e.type==='image'&&e.role==='artwork')&&s.elements.some(e=>e.type==='text'&&e.role==='heading'&&e.font==='Cormorant Garamond Variable')))
const zip=await JSZip.loadAsync(await readFile('output/playwright/production-group.zip'),{checkCRC32:true})
assert.equal(Object.keys(zip.files).length,4)
function pngDimensions(bytes,width,height){assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes.readUInt32BE(16),width);assert.equal(bytes.readUInt32BE(20),height)}
for(const [i,file]of Object.values(zip.files).entries()){const bytes=await file.async('nodebuffer');pngDimensions(bytes,1080,1350);assert.deepEqual(bytes,await readFile(`output/playwright/production-slide-${i+1}.png`))}
pngDimensions(await readFile('output/playwright/production-landscape.png'),1920,1080)
console.log(JSON.stringify({document:'passed',brand:'FORM',slides:4,crc:'passed',dimensions:[1080,1350],landscape:[1920,1080],pngMatchesZip:true}))
