import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import JSZip from 'jszip'

const zip = await JSZip.loadAsync(await readFile('output/playwright/carousel-checklist.zip'), { checkCRC32: true })
const expected = Array.from({ length: 6 }, (_, i) => `slide-0${i + 1}.png`)
assert.deepEqual(Object.keys(zip.files).sort(), expected)
const results = []
for (const name of expected) {
  const bytes = await zip.file(name).async('nodebuffer')
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(bytes.readUInt32BE(16), 1080)
  assert.equal(bytes.readUInt32BE(20), 1350)
  assert.ok(bytes.includes(Buffer.from('IDAT')))
  if (name === 'slide-01.png') assert.deepEqual(bytes, await readFile('output/playwright/exported-slide-01.png'))
  results.push({ name, width: 1080, height: 1350, bytes: bytes.length })
}
console.log(JSON.stringify({ crc: 'passed', singlePngMatchesZip: true, files: results }, null, 2))
