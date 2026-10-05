import assert from 'node:assert/strict'
const base = 'http://localhost:3080'
const results = []
for (const path of ['/', '/chat', '/basic', '/legacy/', '/api/health']) {
  const response = await fetch(base + path)
  assert.equal(response.status, 200)
  results.push({ path, status: response.status })
}
const cross = await fetch(base + '/studio-api/models', { headers: { origin: 'https://example.invalid' } })
assert.equal(cross.status, 403)
const invalid = await fetch(base + '/studio-api/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: '', action: 'generate' }) })
assert.equal(invalid.ok, false)
assert.match((await invalid.json()).error, /Введите запрос/)
const secret = await fetch(base + '/.env')
assert.equal(secret.status, 404)
console.log(JSON.stringify({ pages: results, crossOriginBlocked: true, invalidInputRejected: true, secretUnavailable: true }))
