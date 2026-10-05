import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createProject, restoreProject, validateProject } from '../src/lib/project.ts'
import { escapeXml, slideSvg, wrapText } from '../src/lib/slide.ts'

test('the example has six valid independent slides', () => {
  const a = createProject(); a.slides[0].title = 'Изменено'
  assert.notEqual(createProject().slides[0].title, a.slides[0].title)
  assert.equal(validateProject(createProject()), null)
  assert.equal(createProject().slides.length, 6)
})
test('saved edits round-trip; corrupt, old and unsafe data are rejected', () => {
  const p = createProject(); p.brand = 'Тестовый бренд'
  assert.deepEqual(restoreProject(JSON.stringify(p)), p)
  for (const raw of ['{', 'null', '{}', JSON.stringify({ ...p, version: 2 }), JSON.stringify({ ...p, slides: [] }), JSON.stringify({ ...p, logo: 'javascript:alert(1)' })]) assert.equal(restoreProject(raw), null)
})
test('blank fields and overlong text cannot be exported', () => {
  const p = createProject(); p.slides[3].title = '   '
  assert.match(validateProject(p)!, /4/)
  p.brand = ' '; assert.match(validateProject(p)!, /бренда/)
  p.slides[0].body = 'x'.repeat(221)
  assert.equal(restoreProject(JSON.stringify(p)), null)
})
test('SVG escapes user content and includes brand, contact and correct dimensions', () => {
  const p = createProject(); p.brand = '<script>&"'; p.contact = '@test'
  const svg = slideSvg(p, 0)
  assert.ok(svg.includes('width="1080" height="1350"'))
  assert.ok(svg.includes(escapeXml(p.brand)))
  assert.ok(svg.includes('@test')); assert.ok(!svg.includes('<script>'))
})
test('long words and line breaks wrap without losing characters', () => {
  assert.deepEqual(wrapText('ABCDEFGHIJK', 4, s => s.length), ['ABCD', 'EFGH', 'IJK'])
  assert.deepEqual(wrapText('one\ntwo   three', 7, s => s.length), ['one two', 'three'])
})
