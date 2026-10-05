import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { docSchema } from '../src/studio/model.ts'
const doc = docSchema.parse(JSON.parse(await readFile('output/playwright/illustrated-project.json', 'utf8')))
const group = doc.groups.at(-1)
assert.equal(group.slides.length, 3)
assert.equal(group.slides.every(s => s.elements.some(e => e.type === 'image')), true)
const zip = await JSZip.loadAsync(await readFile('output/playwright/illustrated-group.zip'), { checkCRC32: true })
assert.equal(Object.keys(zip.files).length, group.slides.length)
for (const [index, file] of Object.values(zip.files).entries()) {
  const bytes = await file.async('nodebuffer')
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(bytes.readUInt32BE(16), doc.width)
  assert.equal(bytes.readUInt32BE(20), doc.height)
  if (!index) assert.deepEqual(bytes, await readFile('output/playwright/illustrated-cover.png'))
}
console.log(JSON.stringify({ validDocument: true, crc: 'passed', files: group.slides.length, dimensions: [doc.width, doc.height], singlePngMatchesZip: true }))
