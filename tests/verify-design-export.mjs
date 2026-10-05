import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { docSchema } from '../src/studio/model.ts'
const doc=docSchema.parse(JSON.parse(await readFile('output/playwright/design-project.json','utf8'))),group=doc.groups.at(-1)
assert.equal(group.slides.length,6)
assert(group.slides.every(s=>s.elements.some(e=>e.type==='image')&&s.elements.filter(e=>e.type==='text').every(e=>e.font==='Manrope Variable')))
const zip=await JSZip.loadAsync(await readFile('output/playwright/design-group.zip'),{checkCRC32:true})
assert.equal(Object.keys(zip.files).length,6)
for(const [i,file]of Object.values(zip.files).entries()){
 const bytes=await file.async('nodebuffer')
 assert.equal(bytes.readUInt32BE(16),1080);assert.equal(bytes.readUInt32BE(20),1080)
 assert.deepEqual(bytes,await readFile(`output/playwright/design-slide-${i+1}.png`))
}
console.log(JSON.stringify({slides:6,pictures:6,sharedFonts:true,crc:true,dimensions:[1080,1080],pngMatchesZip:true}))
