import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { docSchema } from '../src/studio/model.ts'
const doc=docSchema.parse(JSON.parse(await readFile('output/playwright/creative-project.json','utf8')))
const slides=doc.groups.at(-1).slides
assert.equal(slides.length,4)
assert(slides.every(s=>s.elements.some(e=>e.type==='image')&&s.elements.some(e=>e.type==='shape')))
const zip=await JSZip.loadAsync(await readFile('output/playwright/creative-group.zip'),{checkCRC32:true})
assert.equal(Object.keys(zip.files).length,4)
for(const [i,file] of Object.values(zip.files).entries()) {
 const bytes=await file.async('nodebuffer')
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a')
 assert.equal(bytes.readUInt32BE(16),1080);assert.equal(bytes.readUInt32BE(20),1350)
 assert.deepEqual(bytes,await readFile(`output/playwright/creative-slide-${i+1}.png`))
}
console.log(JSON.stringify({slides:4,crc:'passed',dimensions:[1080,1350],pngMatchesZip:true,fonts:[...new Set(slides.flatMap(s=>s.elements.filter(e=>e.type==='text').map(e=>e.font)))]}))
