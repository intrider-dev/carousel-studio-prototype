import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
const doc = JSON.parse(await readFile('output/playwright/studio-project.json', 'utf8'))
const zip = await JSZip.loadAsync(await readFile('output/playwright/studio-slides.zip'), { checkCRC32: true })
const expected = doc.groups[0].slides.map((_, i) => `slide-${String(i + 1).padStart(2, '0')}.png`)
assert.deepEqual(Object.keys(zip.files).sort(), expected)
for (const name of expected) {
  const bytes = await zip.file(name).async('nodebuffer')
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(bytes.readUInt32BE(16), doc.width)
  assert.equal(bytes.readUInt32BE(20), doc.height)
  if (name === 'slide-01.png') assert.deepEqual(bytes, await readFile('output/playwright/studio-slide.png'))
}
console.log(JSON.stringify({ crc: 'passed', singlePngMatchesZip: true, files: expected.length, dimensions: [doc.width, doc.height], embeddedFonts: doc.fonts.length }))
