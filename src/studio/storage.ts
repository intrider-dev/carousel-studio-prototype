import { docSchema, fonts, normalizeDoc } from './model'
import type { Doc } from './model'

const db = () => new Promise<IDBDatabase>((resolve, reject) => {
  const req = indexedDB.open('carousel-studio', 2)
  req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains('documents')) req.result.createObjectStore('documents'); if (!req.result.objectStoreNames.contains('assets')) req.result.createObjectStore('assets') }
  req.onsuccess = () => resolve(req.result)
  req.onerror = () => reject(req.error)
})
export async function loadDoc(): Promise<Doc | null> {
  const raw = await readLocal('current')
  if (!raw) return null
  const result = docSchema.safeParse(raw)
  if (!result.success) throw new Error('Сохранённый проект повреждён. Восстановите резервную копию или скачайте исходные данные.')
  return normalizeDoc(result.data)
}
let queue = Promise.resolve()
const assetKeys = new Map<string,string>()
async function pack(value: unknown, assets: Map<string,string>): Promise<unknown> {
  if (typeof value === 'string' && value.startsWith('data:')) {
    let key = assetKeys.get(value)
    if (!key) { const digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)); key = 'asset:' + Array.from(new Uint8Array(digest)).map(n=>n.toString(16).padStart(2,'0')).join(''); assetKeys.set(value,key) }
    assets.set(key,value); return { assetRef:key }
  }
  if (Array.isArray(value)) return Promise.all(value.map(v=>pack(v,assets)))
  if (value && typeof value === 'object') return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([k,v])=>[k,await pack(v,assets)])))
  return value
}
function requestValue<T>(request: IDBRequest<T>) { return new Promise<T>((resolve,reject)=>{ request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error) }) }
export async function readLocal(key: string): Promise<unknown> {
  const database = await db()
  try {
    const stored = await requestValue(database.transaction('documents').objectStore('documents').get(key))
    if (!stored || stored.format !== 'assets-v1') return stored
    const hydrate = async (value: unknown): Promise<unknown> => {
      if (value && typeof value === 'object' && 'assetRef' in value && typeof value.assetRef === 'string') {
        const data = await requestValue(database.transaction('assets').objectStore('assets').get(value.assetRef))
        if (typeof data !== 'string') throw new Error('Не найден ресурс проекта. Восстановите резервную копию.')
        return data
      }
      if (Array.isArray(value)) return Promise.all(value.map(hydrate))
      if (value && typeof value === 'object') return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([k,v])=>[k,await hydrate(v)])))
      return value
    }
    return await hydrate(stored.payload)
  } finally { database.close() }
}
export function writeLocal(key: string, value: unknown, backup = false) {
  const snapshot = value
  queue = queue.catch(()=>{}).then(async()=>{
    let previousIsValid = false
    if (backup) { try { previousIsValid = docSchema.safeParse(await readLocal(key)).success } catch { /* Keep the last healthy backup when current storage is damaged. */ } }
    const assets = new Map<string,string>(), payload = await pack(snapshot,assets)
    const database = await db()
    try {
      const tx = database.transaction(['documents','assets'],'readwrite')
      const done = new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})
      const documents = tx.objectStore('documents'), resources = tx.objectStore('assets')
      for (const [id,src] of assets) { const existing = resources.getKey(id); existing.onsuccess=()=>{ if (!existing.result) resources.put(src,id) } }
      if (backup && previousIsValid) { const previous = documents.get(key); previous.onsuccess=()=>{ if (previous.result) documents.put(previous.result,'backup') } }
      const stored={ format:'assets-v1',payload }
      documents.put(stored,key)
      if(backup&&key==='current'){
        const doc=snapshot as Doc,id=doc.id||doc.groups[0].id
        documents.put(stored,`project:${id}`)
        const index=documents.get('project-index')
        index.onsuccess=()=>{const old:ProjectSummary[]=Array.isArray(index.result)?index.result:[];documents.put([{id,title:doc.topic||'Без названия',width:doc.width,height:doc.height,groups:doc.groups.length,slides:doc.groups.reduce((n,g)=>n+g.slides.length,0),updatedAt:new Date().toISOString()},...old.filter(p=>p.id!==id)],'project-index')}
      }
      await done
    } finally { database.close() }
  })
  return queue
}
export function saveDoc(doc: Doc) {
  const parsed = docSchema.parse(normalizeDoc(doc))
  return writeLocal('current',parsed,true)
}
export type ProjectSummary={id:string;title:string;width:number;height:number;groups:number;slides:number;updatedAt:string}
export async function listProjects():Promise<ProjectSummary[]> { const value=await readLocal('project-index');return Array.isArray(value)?value:[] }
export async function openProject(id:string) { const value=docSchema.parse(await readLocal(`project:${id}`));await registerFonts(value);await validatePhotos(value);return normalizeDoc(value) }
export async function restoreBackup() { const value = docSchema.parse(await readLocal('backup')); await validatePhotos(value); await registerFonts(value); return normalizeDoc(value) }
export function projectFile(doc: Doc) { const json = JSON.stringify(docSchema.parse(doc)); if (new Blob([json]).size > 80_000_000) throw new Error('Проект превышает 80 МБ. Удалите лишние группы или фотографии перед переносом.'); return new Blob([json],{type:'application/json'}) }
export async function registerFonts(doc: Doc) {
  for (const font of doc.fonts) {
    if (document.fonts.check(`16px "${font.family}"`)) {
      // FontFaceSet.check also returns true for unknown fonts; inspect the actual families.
      if ([...document.fonts].some(f => f.family === font.family)) continue
    }
    const face = new FontFace(font.family, `url(${font.data})`)
    await face.load(); document.fonts.add(face)
  }
  await Promise.all(fonts.map(font=>document.fonts.load(`400 32px "${font}"`,'Карусель Carousel')))
  await document.fonts.ready
}
export async function validatePhotos(doc: Doc) {
  const sources = new Set(doc.groups.flatMap(g => g.slides.flatMap(s => s.elements.flatMap(e => e.type === 'image' ? [e.src] : []))))
  for (const src of sources) { const image = new Image(); image.src = src; await image.decode() }
}
export async function imageFile(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10_000_000) throw new Error('Фото: PNG, JPEG или WebP до 10 МБ.')
  const url = URL.createObjectURL(file)
  try {
    const img = new Image(); img.src = url; await img.decode()
    const ratio = Math.min(1, 2160 / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1,Math.round(img.width * ratio)); canvas.height = Math.max(1,Math.round(img.height * ratio))
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    const result = canvas.toDataURL('image/webp', .94)
    if (result.length > 16_000_000) throw new Error('Изображение слишком велико после обработки.')
    return result
  } finally { URL.revokeObjectURL(url) }
}
