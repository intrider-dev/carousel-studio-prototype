import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import http from 'node:http'
import { models, complete } from './provider.mjs'
const root = resolve('dist')
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
let active = 0
const requests = []
const json = (res, status, data) => { if(res.destroyed||res.writableEnded)return;res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)) }
async function body(req) {
  let size = 0; const parts = []
  for await (const chunk of req) { size += chunk.length; if (size > 40_000_000) throw new Error('Слишком большой запрос.'); parts.push(chunk) }
  return JSON.parse(Buffer.concat(parts).toString('utf8'))
}
function legacy(req, res, pathname) {
  const url = new URL(process.env.LEGACY_URL || 'http://host.docker.internal:3002')
  const path = pathname.startsWith('/legacy') ? pathname.slice(7) : pathname
  const split = path.indexOf('?')
  url.pathname = '/' + (split < 0 ? path : path.slice(0, split)).replace(/^\/+/, '')
  url.search = split < 0 ? '' : path.slice(split)
  const proxy = http.request(url, { method: req.method, headers: { ...req.headers, host: url.host, ...(req.headers.origin ? { origin: 'http://localhost:3002' } : {}), 'accept-encoding': 'identity' } }, response => {
    const headers = { ...response.headers }; delete headers['content-length']; delete headers['transfer-encoding']
    if (String(headers['content-type']).includes('text/html')) {
      const parts = []; response.on('data', d => parts.push(d)); response.on('end', () => { res.writeHead(response.statusCode, headers); res.end(Buffer.concat(parts).toString().replace(/(src|href)="\//g, '$1="/legacy/')) })
    } else { res.writeHead(response.statusCode, headers); response.pipe(res) }
  })
  proxy.on('error', () => { if (!res.headersSent) json(res, 502, { error: 'Исходный чат недоступен. Запустите его Docker Compose.' }); else res.end() })
  req.pipe(proxy)
}
createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname
    const allowed = ['http://localhost:3080', 'http://127.0.0.1:3080']
    if (req.headers['sec-fetch-site'] === 'cross-site' || req.headers.origin && !allowed.includes(req.headers.origin)) { json(res, 403, { error: 'Запрос с этого сайта запрещён.' }); return }
    if (path.startsWith('/legacy/') || path.startsWith('/api/')) { legacy(req, res, req.url); return }
    if (path === '/studio-api/models' && req.method === 'GET') { json(res, 200, await models()); return }
    if (path === '/studio-api/complete' && req.method === 'POST') {
      if (!req.headers['content-type']?.startsWith('application/json')) { json(res, 415, { error: 'Ожидается JSON.' }); return }
      while (requests.length && requests[0] < Date.now() - 60_000) requests.shift()
      if (active >= 2 || requests.length >= 15) { json(res, 429, { error: 'Слишком много запросов. Повторите через минуту.' }); return }
      requests.push(Date.now()); active++
      const controller=new AbortController();res.on('close',()=>{if(!res.writableEnded)controller.abort()})
      try { const input=await body(req); if(typeof input.prompt!=='string'||!input.prompt.trim()||input.prompt.length>4000){json(res,422,{error:'Введите запрос до 4000 символов.'});return}json(res, 200, await complete(input,controller.signal)) } finally { active-- }
      return
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    const file = resolve(root, '.' + (['/', '/chat', '/basic'].includes(pathname) ? '/index.html' : pathname))
    if (!file.startsWith(root + sep)) { res.writeHead(403); res.end(); return }
    const data = await readFile(file)
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' })
    res.end(req.method === 'HEAD' ? undefined : data)
  } catch (error) {
    if (req.url.startsWith('/studio-api/')) json(res, 502, { error: error instanceof Error ? error.message : 'Ошибка подключения.' })
    else { res.writeHead(404); res.end('Not found') }
  }
}).listen(3000, '0.0.0.0', () => console.log('Carousel studio: http://localhost:3000'))
