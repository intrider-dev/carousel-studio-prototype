import { useEffect, useReducer, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Copy, Download, ImagePlus, Layers, Plus, Redo2, Trash2, Type, Undo2, Check, EyeOff, LockKeyhole, Shapes, PanelRight, WandSparkles } from 'lucide-react'
import JSZip from 'jszip'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { createDoc, cloneSlide, contextFor, docSchema, fonts, makeGroup, normalizeDoc, textElement, uid } from './model'
import type { Doc, Element, Proposal, Settings } from './model'
import { loadDoc, saveDoc, imageFile, registerFonts, validatePhotos, readLocal, restoreBackup, projectFile } from './storage'
import { SlideCanvas, renderSlide } from './canvas'
import { Connector } from './connector'
import { download } from '@/lib/slide'
import { fitGroup, fitText, textFits,fitEditedDocument } from './text-layout'
import { shapeElement } from './layouts'
import { SlideThumbnail } from './thumbnail'
import { loadSlideFonts } from './fonts'
import { groupProposal } from './restyle'
import { applyEditPlan,applyContentProposal,assertTarget,editError } from './edits'
import type { EditTarget } from './edits'
import type { EditPlan } from '../../shared/edit-plan'
import { BriefControls, BrandControls, DirectionControls } from './project-controls'
import { ProjectLibrary } from './project-library'
import { QualityPanel } from './quality-panel'
import { MotionRegion, Pending, Disclosure } from './interface'
import { useInputMode } from './motion'
import { exportSizes, prepareResizedSlide } from './resize'
import { briefSchema } from '../../shared/design'

type State = { doc: Doc | null; past: Doc[]; future: Doc[] }
type Action = { type: 'load'; doc: Doc | null } | { type: 'edit'; change: (d: Doc) => Doc } | { type: 'undo' | 'redo' }
function reducer(state: State, action: Action): State {
  if (action.type === 'load') return { doc: action.doc ? normalizeDoc(action.doc) : null, past: [], future: [] }
  if (!state.doc) return state
  if (action.type === 'edit') {
    const next = normalizeDoc(action.change(state.doc))
    return { doc: next, past: [...state.past, state.doc].slice(-20), future: [] }
  }
  if (action.type === 'undo' && state.past.length) return { doc: state.past.at(-1)!, past: state.past.slice(0, -1), future: [state.doc, ...state.future] }
  if (action.type === 'redo' && state.future.length) return { doc: state.future[0], past: [...state.past, state.doc], future: state.future.slice(1) }
  return state
}
const defaults: Settings = { width: 1080, height: 1350, topic: 'Полезный контент для социальных сетей', style: 'Выразительная типографика, единая палитра, фотографии и графические акценты', defaultFont: 'Manrope Variable', direction:'bold', brief:briefSchema.parse({}) }
function NumberField({ label, value, onChange, min = 0, max = 4096 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return <div className="space-y-1"><Label htmlFor={`number-${label}`}>{label}</Label><Input key={value} id={`number-${label}`} type="number" step="any" min={min} max={max} defaultValue={Number(value.toFixed(2))} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur()}} onBlur={e => { const n = Number(e.target.value); const next=e.target.value.trim()&&Number.isFinite(n)?Math.min(max, Math.max(min, n)):value; e.target.value=String(next);if(next!==value)onChange(next) }} /></div>
}
export default function Studio() {
  useInputMode()
  const [state, dispatch] = useReducer(reducer, { doc: null, past: [], future: [] })
  const doc = state.doc
  const currentDoc=useRef(doc)
  useEffect(()=>{currentDoc.current=doc},[doc])
  const [settings, setSettings] = useState(defaults)
  const [loaded, setLoaded] = useState(false)
  const [groupId, setGroupId] = useState('')
  const [slideId, setSlideId] = useState('')
  const [selected, setSelected] = useState('')
  const [page, setPage] = useState(location.pathname)
  const [panel, setPanel] = useState('properties')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Загрузка проекта…')
  const [busy, setBusy] = useState(false)
  const [chatBusy, setChatBusy] = useState(false)
  const [reset, setReset] = useState(false)
  const [zoom,setZoom] = useState(1)
  const [library,setLibrary] = useState(false)
  const [exportSize,setExportSize] = useState<keyof typeof exportSizes>('project')
  const [guides,setGuides] = useState(false)
  const [workspace,setWorkspace] = useState('design')
  const [recovery,setRecovery] = useState(false)
  const iframe = useRef<HTMLIFrameElement>(null)
  const imageInput = useRef<HTMLInputElement>(null)
  const [chatReady, setChatReady] = useState(false)
  const [incoming, setIncoming] = useState('')
  const group = doc?.groups.find(g => g.id === groupId) ?? doc?.groups[0]
  const slide = group?.slides.find(s => s.id === slideId) ?? group?.slides[0]
  const element = slide?.elements.find(e => e.id === selected)
  const fontChoices = [...fonts, ...(doc?.fonts.map(f => f.family) ?? [])]
  const edit = (change: (d: Doc) => Doc) => dispatch({ type: 'edit', change })
  useEffect(() => {
    let active = true
    loadDoc().then(async value => { if (value) { await registerFonts(value); await validatePhotos(value); if (active) dispatch({ type: 'load', doc: value }) } })
      .catch(e => { if (active) {setRecovery(true);setError(e instanceof Error ? e.message : 'Не удалось открыть сохранённый проект.')} })
      .finally(() => { if (active) { setLoaded(true); setStatus('') } })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (!doc) return
    let active = true
    queueMicrotask(()=>{if(active)setStatus('Сохранение…')})
    const timer=setTimeout(()=>{try{void saveDoc(doc).then(() => { if (active) setStatus('Сохранено в этом браузере') }).catch(() => { if (active) setStatus('Не удалось сохранить. Скачайте файл проекта.') })}catch{setStatus('Изменения не сохранены: проверьте данные.')}},300)
    const flush=()=>{try{void saveDoc(doc)}catch{/* Validation is reported above. */}}
    window.addEventListener('pagehide',flush)
    return () => { active = false;clearTimeout(timer);window.removeEventListener('pagehide',flush) }
  }, [doc])
  useEffect(() => {
    const pop = () => setPage(location.pathname)
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== iframe.current?.contentWindow) return
      if (event.data?.type === 'studio:ready') setChatReady(event.data.ready === true)
      if (event.data?.type === 'studio:response' && typeof event.data.text === 'string' && event.data.text.length <= 16000) setIncoming(event.data.text)
    }
    window.addEventListener('popstate', pop); window.addEventListener('message', receive)
    return () => { window.removeEventListener('popstate', pop); window.removeEventListener('message', receive) }
  }, [])
  function navigate(path: string) { if (chatBusy) { setError('Дождитесь ответа модели перед переходом в другой раздел.'); return } history.pushState(null, '', path); setPage(path); setChatReady(false) }
  function updateSlide(change: (s: NonNullable<typeof slide>) => NonNullable<typeof slide>) {
    if (!group || !slide) return
    edit(d => ({ ...d, groups: d.groups.map(g => g.id === group.id ? { ...g, slides: g.slides.map(s => s.id === slide.id ? change(s) : s) } : g) }))
  }
  function updateElement(next: Element) {
    const safe = { ...next, x: Math.max(-4096, Math.min(4096, next.x)), y: Math.max(-4096, Math.min(4096, next.y)), width: Math.max(1, Math.min(8192, next.width)), height: Math.max(1, Math.min(8192, next.height)), rotation: next.rotation % 360 }
    updateSlide(s => ({ ...s, ...(safe.type === 'text' && safe.role === 'heading' ? { title: safe.text.trim().slice(0, 120) || 'Слайд' } : {}), elements: s.elements.map(e => e.id === next.id ? safe : e) }))
  }
  function addGroup(proposal?: Proposal) {
    if (!doc || doc.groups.length >= 12) { setError('Можно создать до 12 групп.'); return false }
    const next = fitGroup(makeGroup(doc, proposal), doc.defaultFont, doc.width/doc.height)
    edit(d => ({ ...d, groups: [...d.groups, next] })); setGroupId(next.id); setSlideId(next.slides[0].id); setSelected(''); setError('')
    return true
  }
  async function applyChanges(plan:EditPlan,target:EditTarget) {
    if(!doc)return false
    setBusy(true)
    try {await assertTarget(doc,target);const next=await fitEditedDocument(doc,applyEditPlan(doc,target,plan));if(currentDoc.current!==doc)throw new Error('Проект изменился. Повторите применение с текущим контекстом.');edit(()=>next);setGroupId(target.groupId);setSelected('');setError('');return true} catch(e){setError(editError(e));return false}finally{setBusy(false)}
  }
  async function applyProposal(proposal: Proposal, target: 'slide' | 'group' | 'rewrite' | 'replace',binding?:EditTarget) {
    if(target==='rewrite'||target==='replace') {
      if(!doc||!binding){setError('Не найден исходный контекст. Отправьте новый запрос.');return false}
      try{await assertTarget(doc,binding);const next=await fitEditedDocument(doc,applyContentProposal(doc,binding,proposal,target==='rewrite'?'rewrite':'replace'));if(currentDoc.current!==doc)throw new Error('Проект изменился. Повторите применение с текущим контекстом.');edit(()=>next);setGroupId(binding.groupId);setSelected('');setError('');return true}catch(e){setError(editError(e));return false}
    }
    if (target === 'group') return addGroup(proposal)
    if (!doc || !group || group.slides.length >= 20) { setError('В группе уже 20 слайдов. Выберите создание новой группы.'); return false }
    if (proposal.slides.length !== 1) { setError('Для добавления одного слайда нужен результат из одного слайда.'); return false }
    const next = fitGroup(makeGroup(doc, proposal), doc.defaultFont, doc.width/doc.height).slides[0]
    edit(d => ({ ...d, groups: d.groups.map(g => g.id === group.id ? { ...g, slides: [...g.slides, next] } : g) }))
    setSlideId(next.id); setSelected(''); setError(''); return true
  }
  async function addPhoto(src: string, replace = false,layerId?:string) {
    if (!doc || !slide) return false
    if(replace){const existing=slide.elements.find(e=>e.type==='image'&&e.id===(layerId||selected))??slide.elements.find(e=>e.type==='image'&&e.role!=='brand');if(!existing){setError('На слайде нет картинки для замены.');return false}if(existing.locked){setError('Картинка закреплена. Сначала разрешите её изменение.');return false}try{const image=new Image();image.src=src;await image.decode()}catch{setError('Не удалось открыть фото.');return false}if(currentDoc.current!==doc){setError('Проект изменился. Повторите применение изображения.');return false}updateSlide(s=>({...s,elements:s.elements.map(e=>e.id===existing.id?{...existing,src}:e)}));return true}
    if (slide.elements.length >= 40) { setError('Не больше 40 слоёв на слайде.'); return false }
    const target = slide.id
    const img = new Image(); img.src = src
    try {
      await img.decode()
      const width = Math.min(doc.width * .65, doc.height * .65 * img.width / img.height)
      const photo: Element = { id: uid(), type: 'image', origin:'manual', role:'artwork', name: 'Фото', src, x: doc.width * .1, y: doc.height * .2, width:Math.max(1,width), height: Math.max(1,width * img.height / img.width), rotation: 0, locked: false, visible: true }
      edit(d => ({ ...d, groups: d.groups.map(g => ({ ...g, slides: g.slides.map(s => s.id === target ? { ...s, elements: [...s.elements, photo].slice(0, 40) } : s) })) }))
      setSelected(photo.id); setError('');return true
    } catch { setError('Не удалось открыть фото.');return false }
  }
  async function uploadPhotos(files: File[]) {
    if (!slide || files.length + slide.elements.length > 40) { setError('Не больше 40 слоёв на слайде.'); return }
    setBusy(true)
    try { for (const file of files) await addPhoto(await imageFile(file)) } catch (e) { setError(String(e)) } finally { setBusy(false) }
  }
  async function exportSlides(all: boolean) {
    if (!doc || !group || !slide) return
    setBusy(true); setError('')
    try {
      const format=exportSizes[exportSize],target=format.width?{...doc,width:format.width,height:format.height}:doc
      const adapt=async(s:typeof slide)=>format.width?prepareResizedSlide(doc,s,target.width,target.height):s
      if (all) { const zip = new JSZip(); for (const [i, s] of group.slides.entries()) zip.file(`slide-${String(i + 1).padStart(2, '0')}.png`, await renderSlide(target, await adapt(s))); download(await zip.generateAsync({ type: 'blob' }), 'slides.zip') }
      else download(await renderSlide(target, await adapt(slide)), 'slide.png')
    } catch (e) { setError(String(e)) } finally { setBusy(false) }
  }
  async function start() {
    const created = createDoc(settings)
    await registerFonts(created)
    created.groups = created.groups.map(g => fitGroup(g, created.defaultFont, created.width/created.height))
    const result = docSchema.safeParse(created)
    if (!result.success || !settings.topic.trim()) { setError('Укажите тему. Размеры должны быть от 320 до 2160 px.'); return }
    try{await saveDoc(result.data)}catch{setError('Не удалось сохранить новый проект. Освободите место в браузере и повторите.');return}
    dispatch({ type: 'load', doc: result.data }); setError('');setRecovery(false); setGroupId(''); setSlideId(''); setSelected('');setPanel('chat')
  }
  async function fontUpload(file?: File) {
    if (!file || !doc) return
    if (!/\.(ttf|otf|woff2?)$/i.test(file.name) || file.size > 2_000_000 || doc.fonts.length >= 10) { setError('До 10 шрифтов TTF, OTF, WOFF/WOFF2 размером до 2 МБ.'); return }
    setBusy(true)
    try {
      const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file) })
      const family = file.name.replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}_-]/gu, '').slice(0, 50) + '-' + uid().slice(0, 6)
      const newFont = { family, data }; await registerFonts({ ...doc, fonts: [newFont] })
      edit(d => ({ ...d, fonts: [...d.fonts, newFont] })); setError('')
    } catch { setError('Шрифт не загрузился. Проверьте формат файла.') } finally { setBusy(false) }
  }
  const header = <header className="studio-header border-b"><div className="mx-auto flex max-w-[1720px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6"><div className="flex items-center gap-2"><Layers className="size-5" aria-hidden="true" /><span className="font-semibold">Карусель</span><Badge variant="secondary">Студия</Badge></div><nav className="studio-nav flex flex-wrap gap-1" aria-label="Разделы">{[['/','Редактор'],['/chat','Диалог'],['/basic','Простой шаблон']].map(([href,label])=><a key={href} href={href} aria-current={page===href?'page':undefined} className={`rounded-lg px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring ${page===href?'bg-secondary text-secondary-foreground':'text-muted-foreground hover:bg-muted hover:text-foreground'}`} onClick={href==='/basic'?undefined:e=>{e.preventDefault();navigate(href)}}>{label}</a>)}</nav><div className="flex items-center gap-3"><Button variant="outline" disabled={busy||chatBusy||status==='Сохранение…'} aria-expanded={library} aria-haspopup="dialog" id="project-library-trigger" onClick={()=>setLibrary(!library)}>Проекты</Button><p className="flex min-h-5 items-center gap-1.5 text-xs text-muted-foreground" role="status">{status==='Сохранено в этом браузере'&&<Check className="size-3.5" aria-hidden="true"/>}{status}</p></div></div></header>
  if (!loaded) return <>{header}<main className="studio-main mx-auto max-w-[1720px] px-6"><Pending>Открываю проект…</Pending></main></>
  return <>{header}<main className="studio-main mx-auto max-w-[1720px] space-y-6 px-4 sm:px-6">
    <ProjectLibrary open={library} onClose={()=>setLibrary(false)} onOpen={value=>{dispatch({type:'load',doc:value});setGroupId('');setSlideId('');setSelected('');setLibrary(false);setRecovery(false);setError('');navigate('/')}}/>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {recovery && <Card><CardContent className="flex flex-wrap gap-3 pt-4"><Button onClick={async()=>{try{const restored=await restoreBackup();dispatch({type:'load',doc:restored});setRecovery(false);setError('')}catch{setError('Исправная резервная копия не найдена. Скачайте исходные данные или откройте сохранённый JSON.')}}}>Восстановить резервную копию</Button><Button variant="outline" onClick={async()=>{try{download(new Blob([JSON.stringify(await readLocal('current'))],{type:'application/json'}),'recovery-project.json')}catch{setError('Не удалось прочитать исходные данные.')}}}>Скачать исходные данные</Button><Label htmlFor="recovery-import">Открыть сохранённый JSON</Label><Input id="recovery-import" type="file" accept=".json" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>80_000_000)throw new Error('size');const value=docSchema.parse(JSON.parse(await file.text()));await registerFonts(value);await validatePhotos(value);dispatch({type:'load',doc:value});setError('');setRecovery(false)}catch{setError('Не удалось открыть файл проекта.')}}}/></CardContent></Card>}
    {!doc && <div className="mx-auto max-w-2xl space-y-6"><h1 className="text-2xl font-semibold">Новая карусель</h1><Card><CardHeader><CardTitle>Формат и тема</CardTitle></CardHeader><CardContent className="space-y-5">
      <div className="space-y-2"><Label htmlFor="ratio">Соотношение сторон</Label><NativeSelect id="ratio" defaultValue="4:5" onChange={e => { const [w,h] = e.target.value.split(':').map(Number); if (w && h) setSettings({ ...settings, width: 1080, height: Math.round(1080 * h / w) }) }}><NativeSelectOption value="4:5">4:5 · Публикация</NativeSelectOption><NativeSelectOption value="1:1">1:1 · Квадрат</NativeSelectOption><NativeSelectOption value="9:16">9:16 · История</NativeSelectOption><NativeSelectOption value="16:9">16:9 · Презентация</NativeSelectOption><NativeSelectOption value="custom">Свой размер</NativeSelectOption></NativeSelect></div>
      <div className="grid grid-cols-2 gap-4"><NumberField label="Ширина, px" value={settings.width} min={320} max={2160} onChange={v => setSettings({ ...settings, width: v })} /><NumberField label="Высота, px" value={settings.height} min={320} max={2160} onChange={v => setSettings({ ...settings, height: v })} /></div>
      <div className="space-y-2"><Label htmlFor="topic">Тема *</Label><Textarea id="topic" maxLength={800} value={settings.topic} onChange={e => setSettings({ ...settings, topic: e.target.value })} /></div><div className="space-y-2"><Label htmlFor="style">Стиль</Label><Textarea id="style" maxLength={800} value={settings.style} onChange={e => setSettings({ ...settings, style: e.target.value })} /></div>
<Disclosure title="Задача и аудитория" className="rounded-lg border p-3"><div className="pt-4"><BriefControls value={settings} onChange={setSettings}/></div></Disclosure><DirectionControls value={settings} onChange={setSettings}/><Disclosure title="Бренд"><div className="pt-4"><BrandControls value={settings} onChange={setSettings}/></div></Disclosure><Button onClick={start} className="w-full">Создать проект</Button>
    </CardContent></Card></div>}
    {doc && group && slide && <>
      <div className="flex flex-wrap items-center justify-between gap-5"><div className="space-y-1"><h1 className="text-2xl font-semibold">{page === '/chat' ? 'Создание слайдов' : 'Редактор слайдов'}</h1><p className="text-sm text-muted-foreground">{doc.width} × {doc.height} px · {group.name} · Слайдов: {group.slides.length}</p></div><div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={!state.past.length || busy} aria-label="Отменить изменение" onClick={() => dispatch({ type: 'undo' })}><Undo2 /></Button><Button variant="outline" disabled={!state.future.length || busy} aria-label="Повторить изменение" onClick={() => dispatch({ type: 'redo' })}><Redo2 /></Button>
<div className="space-y-1"><Label htmlFor="export-size" className="sr-only">Формат экспорта</Label><NativeSelect id="export-size" value={exportSize} disabled={busy} onChange={e=>setExportSize(e.target.value as keyof typeof exportSizes)}>{Object.entries(exportSizes).map(([key,value])=><NativeSelectOption key={key} value={key}>{value.label}</NativeSelectOption>)}</NativeSelect></div><Button variant="outline" disabled={busy} onClick={() => exportSlides(false)}>PNG</Button><Button disabled={busy} onClick={() => exportSlides(true)}><Download />{busy ? 'Подготовка…' : 'ZIP группы'}</Button><Button variant="outline" disabled={busy || chatBusy} onClick={() => setReset(true)}>Новый проект</Button>
      </div></div>
      {exportSize!=='project'&&<p className="text-sm text-muted-foreground">Проверьте кадрирование в новом размере.</p>}
      {page === '/chat' ? <MotionRegion changeKey="dialog" className="space-y-6"><div className="space-y-6"><Connector wide doc={doc} group={group} slideId={slide.id} sourceText={incoming} onProposal={async(p, target,binding) => { const applied = await applyProposal(p, target,binding); if (applied) { setIncoming(''); navigate('/') } return applied }} onImage={addPhoto} selectedLayerId={selected} onEdit={applyChanges} onBusy={setChatBusy} /><Disclosure title="Чат" className="rounded-lg border p-4"><div className="space-y-4 pt-4"><Card><CardContent className="space-y-3 pt-4"><div className="flex flex-wrap gap-2"><Button disabled={!chatReady} onClick={() => { const text=JSON.stringify(contextFor(doc, group, slide.id));if(text.length>3500){setError('Контекст слишком велик для обычного чата. Используйте «Создание слайдов».');return}iframe.current?.contentWindow?.postMessage({ type: 'studio:context', text: `Помоги улучшить этот слайд. Контекст: ${text}` }, location.origin) }}>Передать текущий слайд</Button><Button variant="outline" disabled={!chatReady} onClick={() => { const text = JSON.stringify(contextFor(doc, group)); if (text.length > 3500) { setError('Группа слишком велика для обычного чата. Используйте «Создание слайдов» в редакторе.'); return } iframe.current?.contentWindow?.postMessage({ type: 'studio:context', text: `Проанализируй группу слайдов и предложи улучшения: ${text}` }, location.origin) }}>Передать группу</Button></div>
        {incoming && <div className="space-y-2"><Label htmlFor="incoming">Текст из чата</Label><Textarea id="incoming" rows={8} className="max-h-64 overflow-y-auto" maxLength={16000} disabled={chatBusy} value={incoming} onChange={e => setIncoming(e.target.value)} /><Button variant="outline" disabled={chatBusy} onClick={() => setIncoming('')}>Убрать текст</Button></div>}
      </CardContent></Card><iframe ref={iframe} title="Чат исходного проекта" src="/legacy/" className="h-[78vh] w-full rounded-lg border" onLoad={() => iframe.current?.contentWindow?.postMessage({ type: 'studio:hello' }, location.origin)} /></div></Disclosure></div></MotionRegion> : <>
      <div className="flex w-fit max-w-full flex-wrap gap-1 rounded-lg bg-muted p-1" aria-label="Режим рабочего пространства">{[['design','Дизайн'],['project','Бриф и бренд'],['quality','Проверка серии']].map(([key,label])=><Button key={key} variant={workspace===key?'outline':'ghost'} aria-pressed={workspace===key} onClick={()=>setWorkspace(key)}>{label}</Button>)}</div>
      {workspace==='quality'&&<MotionRegion changeKey="quality"><QualityPanel doc={doc} group={group} onSelect={(id,layer)=>{setSlideId(id);setSelected(layer||'');setPanel('properties');setWorkspace('design')}}/></MotionRegion>}
      <MotionRegion changeKey={workspace} hidden={workspace==='quality'} className={`workspace-grid ${workspace==='project'?'project-layout':''}`}>
        <aside hidden={workspace==='project'} className="workspace-rail min-w-0 space-y-5" aria-label="Слайды и группы"><Card><CardHeader><CardTitle>Группы и слайды</CardTitle></CardHeader><CardContent className="space-y-3"><Label htmlFor="group">Группа</Label><NativeSelect id="group" value={group.id} onChange={e => { setGroupId(e.target.value); setSlideId(''); setSelected('') }}>{doc.groups.map(g => <NativeSelectOption key={g.id} value={g.id}>{g.name}</NativeSelectOption>)}</NativeSelect><Input aria-label="Название группы" value={group.name} maxLength={100} onChange={e => edit(d => ({ ...d, groups: d.groups.map(g => g.id === group.id ? { ...g, name: e.target.value || 'Группа' } : g) }))} /><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={doc.groups.length >= 12} onClick={() => addGroup()}><Plus />Группа</Button>
          <Button variant="outline" disabled={busy||chatBusy||doc.groups.length>=12} onClick={async()=>{setBusy(true);try{const proposal=groupProposal(group);await loadSlideFonts(doc,makeGroup(doc,proposal).slides);addGroup(proposal)}catch{setError('Не удалось обновить дизайн. Группа должна содержать до 12 слайдов.')}finally{setBusy(false)}}}>Обновить дизайн</Button>
          <Button variant="ghost" size="icon" aria-label="Удалить группу" title="Удалить группу" disabled={doc.groups.length<=1||chatBusy} onClick={()=>{edit(d=>({...d,groups:d.groups.filter(g=>g.id!==group.id)}));setGroupId('');setSlideId('');setSelected('')}}><Trash2/></Button></div>
          <div className="slide-filmstrip" aria-label="Слайды группы">{group.slides.map((s, i) => <Button className="h-auto justify-start gap-3 px-2 py-3 text-left" title={s.title} key={s.id} variant={slide.id === s.id ? 'secondary' : 'ghost'} onClick={() => { setSlideId(s.id); setSelected('') }} aria-pressed={slide.id===s.id} aria-label={`Открыть слайд ${i + 1}`}><SlideThumbnail doc={doc} slide={s}/><span className="min-w-0"><span className="mb-1 block text-xs font-normal text-muted-foreground">{String(i+1).padStart(2,'0')}</span><span className="line-clamp-2">{s.title}</span></span></Button>)}</div>
          <div className="flex gap-2">{[-1,1].map(direction=><Button key={direction} variant="outline" aria-label={direction<0?'Слайд раньше':'Слайд позже'} disabled={group.slides.findIndex(s=>s.id===slide.id)+direction<0||group.slides.findIndex(s=>s.id===slide.id)+direction>=group.slides.length} onClick={()=>edit(d=>({...d,groups:d.groups.map(g=>{if(g.id!==group.id)return g;const slides=[...g.slides],from=slides.findIndex(s=>s.id===slide.id),to=from+direction;[slides[from],slides[to]]=[slides[to],slides[from]];return {...g,slides}})}))}>{direction<0?<ArrowUp/>:<ArrowDown/>}</Button>)}</div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={group.slides.length >= 20} aria-label="Добавить слайд" onClick={() => { const s = { id: uid(), title: 'Новый слайд', background: '#ffffff', elements: [textElement(doc)] }; edit(d => ({ ...d, groups: d.groups.map(g => g.id === group.id ? { ...g, slides: [...g.slides, s] } : g) })); setSlideId(s.id) }}><Plus /></Button><Button variant="outline" disabled={group.slides.length >= 20} aria-label="Дублировать слайд" onClick={() => { const s = cloneSlide(slide); edit(d => ({ ...d, groups: d.groups.map(g => g.id === group.id ? { ...g, slides: [...g.slides, s] } : g) })); setSlideId(s.id) }}><Copy /></Button><Button variant="outline" disabled={group.slides.length <= 1} aria-label="Удалить слайд" onClick={() => edit(d => ({ ...d, groups: d.groups.map(g => g.id === group.id ? { ...g, slides: g.slides.filter(s => s.id !== slide.id) } : g) }))}><Trash2 /></Button></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Файл проекта</CardTitle></CardHeader><CardContent className="space-y-3"><Button variant="outline" onClick={() => {try{download(projectFile(doc),'carousel-project.json')}catch(e){setError(String(e))}}}>Сохранить JSON</Button><Label htmlFor="import">Открыть JSON</Label><Input id="import" type="file" accept=".json" disabled={busy || chatBusy} onChange={async e => {
          const file = e.target.files?.[0]; e.target.value = ''; if (!file) return
          try { if (file.size > 80_000_000) throw new Error('Файл больше 80 МБ.'); const parsed = docSchema.parse(JSON.parse(await file.text())); await registerFonts(parsed); await validatePhotos(parsed); edit(() => parsed); setError('') } catch { setError('Файл проекта повреждён или содержит неподдерживаемые данные.') }
        }} /></CardContent></Card></aside>
        <section className="workspace-canvas space-y-5"><div hidden={workspace==='project'}><Card><CardContent className="space-y-4 pt-4"><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={slide.elements.length >= 40} onClick={() => { const e = textElement(doc); updateSlide(s => ({ ...s, elements: [...s.elements, e] })); setSelected(e.id) }}><Type />Текст</Button><Button variant="outline" disabled={busy} onClick={() => imageInput.current?.click()}><ImagePlus />Фото</Button><input ref={imageInput} className="sr-only" aria-label="Добавить фотографии" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={e => { void uploadPhotos(Array.from(e.target.files ?? [])); e.target.value = '' }} /><Button variant="outline" disabled={slide.elements.length>=40} onClick={()=>{const e=shapeElement(doc);updateSlide(s=>({...s,elements:[...s.elements,e]}));setSelected(e.id);setPanel('properties')}}><Shapes/>Фигура</Button><Badge variant="outline">{doc.width} × {doc.height}</Badge></div>
          <div className="flex flex-wrap items-center gap-2"><Button variant={guides?'default':'outline'} aria-pressed={guides} onClick={()=>setGuides(!guides)}>Безопасные поля</Button><Label htmlFor="zoom" className="sr-only">Масштаб просмотра</Label><NativeSelect id="zoom" value={zoom} onChange={e=>setZoom(Number(e.target.value))}><NativeSelectOption value={.5}>50%</NativeSelectOption><NativeSelectOption value={1}>По размеру окна</NativeSelectOption><NativeSelectOption value={1.5}>150%</NativeSelectOption><NativeSelectOption value={2}>200%</NativeSelectOption></NativeSelect></div>
          <div className="canvas-well"><SlideCanvas doc={doc} slide={slide} selected={selected} onSelect={id=>{setSelected(id);if(id)setPanel('properties')}} onChange={updateElement} zoom={zoom} safeGuides={guides}/></div>
          <p className="text-xs text-muted-foreground">Перетащите слой или потяните за угол.</p>
        </CardContent></Card></div>
        <div hidden={workspace!=='project'} className="project-settings"><Card><CardHeader><CardTitle>Тема и стиль</CardTitle></CardHeader><CardContent className="space-y-3"><Label htmlFor="edit-topic">Тема</Label><Textarea id="edit-topic" value={doc.topic} maxLength={800} onChange={e => edit(d => ({ ...d, topic: e.target.value }))} /><Label htmlFor="edit-style">Стиль</Label><Textarea id="edit-style" value={doc.style} maxLength={800} onChange={e => edit(d => ({ ...d, style: e.target.value }))} /><p className="text-xs text-muted-foreground">Изменения темы применяются к следующим запросам. Для новой версии серии выберите «Сменить тематику» в диалоге.</p><Label htmlFor="default-font">Шрифт по умолчанию</Label><NativeSelect id="default-font" value={doc.defaultFont} onChange={e => edit(d => ({ ...d, defaultFont: e.target.value }))}>{fontChoices.map(f => <NativeSelectOption key={f}>{f}</NativeSelectOption>)}</NativeSelect><Label htmlFor="font-upload">Добавить шрифт</Label><Input id="font-upload" type="file" accept=".ttf,.otf,.woff,.woff2" disabled={busy} onChange={e => { void fontUpload(e.target.files?.[0]); e.target.value = '' }} /></CardContent></Card><Card><CardHeader><CardTitle>Бриф серии</CardTitle></CardHeader><CardContent><BriefControls value={doc} onChange={value=>edit(d=>({...d,...value}))}/></CardContent></Card><Card><CardHeader><CardTitle>Оформление и бренд</CardTitle></CardHeader><CardContent className="space-y-6"><DirectionControls value={doc} onChange={value=>edit(d=>({...d,...value}))}/><BrandControls value={doc} extraFonts={doc.fonts.map(f=>f.family)} onChange={value=>edit(d=>({...d,...value}))}/></CardContent></Card></div></section>
        <aside hidden={workspace==='project'} className="workspace-inspector min-w-0 space-y-4" aria-label="Панель редактирования"><div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1"><Button variant={panel === 'properties' ? 'outline' : 'ghost'} aria-pressed={panel==='properties'} onClick={() => setPanel('properties')}><PanelRight/>Свойства</Button><Button variant={panel === 'chat' ? 'outline' : 'ghost'} aria-pressed={panel==='chat'} onClick={() => setPanel('chat')}><WandSparkles/>Создание слайдов</Button></div>
          <div hidden={panel !== 'chat'}><Connector doc={doc} group={group} slideId={slide.id} onProposal={applyProposal} onImage={addPhoto} selectedLayerId={selected} onEdit={applyChanges} onBusy={setChatBusy} /></div>
          <MotionRegion changeKey={panel} hidden={panel !== 'properties'} className="properties-stack">
          {element && <Card><CardHeader><CardTitle>Свойства слоя</CardTitle></CardHeader><CardContent className="space-y-4"><Label htmlFor="layer-name">Название слоя</Label><Input id="layer-name" maxLength={100} value={element.name} onChange={e => updateElement({ ...element, name: e.target.value })} />
            <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => updateElement({ ...element, locked: !element.locked })}>{element.locked ? 'Открепить' : 'Закрепить'}</Button><Button variant="outline" onClick={() => updateElement({ ...element, visible: !element.visible })}>{element.visible ? 'Скрыть' : 'Показать'}</Button><Button variant="outline" aria-label="Удалить слой" onClick={() => { updateSlide(s => ({ ...s, elements: s.elements.filter(e => e.id !== element.id) })); setSelected('') }}><Trash2 /></Button></div>
            <fieldset disabled={element.locked} className="space-y-4">            {element.type === 'text' && <><Label htmlFor="layer-text">Текст слоя</Label><Textarea id="layer-text" rows={5} maxLength={2000} value={element.text} onChange={e => updateElement({ ...element, text: e.target.value })} /><Label htmlFor="layer-font">Шрифт слоя</Label><NativeSelect id="layer-font" value={element.font} onChange={e => updateElement({ ...element, font: e.target.value })}><NativeSelectOption value="">По умолчанию ({doc.defaultFont})</NativeSelectOption>{fontChoices.map(f => <NativeSelectOption key={f}>{f}</NativeSelectOption>)}</NativeSelect><NumberField label="Размер шрифта" value={element.size} min={8} max={300} onChange={v => updateElement({ ...element, size: v })} /><Label htmlFor="text-color">Цвет текста</Label><Input id="text-color" type="color" value={element.fill} onChange={e => updateElement({ ...element, fill: e.target.value })} /><Label htmlFor="text-gradient">Градиент</Label><div className="flex gap-2"><Input id="text-gradient" type="color" value={element.gradient||element.fill} onChange={e=>updateElement({...element,gradient:e.target.value})}/><Button variant="outline" disabled={!element.gradient} onClick={()=>updateElement({...element,gradient:undefined})}>Убрать</Button></div><div className="flex gap-2"><Button variant={element.bold ? 'default' : 'outline'} onClick={() => updateElement({ ...element, bold: !element.bold })}>Жирный</Button><Button variant={element.italic ? 'default' : 'outline'} onClick={() => updateElement({ ...element, italic: !element.italic })}>Курсив</Button></div><Label htmlFor="text-align">Выравнивание</Label><NativeSelect id="text-align" value={element.align} onChange={e => updateElement({ ...element, align: e.target.value as 'left' | 'center' | 'right' })}><NativeSelectOption value="left">Слева</NativeSelectOption><NativeSelectOption value="center">По центру</NativeSelectOption><NativeSelectOption value="right">Справа</NativeSelectOption></NativeSelect></>}
<p className="pt-2 text-xs font-medium text-muted-foreground">Положение и размер</p><div className="grid grid-cols-2 gap-3"><NumberField label="X" value={element.x} min={-4096} onChange={v => updateElement({ ...element, x: v })} /><NumberField label="Y" value={element.y} min={-4096} onChange={v => updateElement({ ...element, y: v })} /><NumberField label="Ширина слоя" value={element.width} min={1} max={8192} onChange={v => updateElement({ ...element, width: v, ...(element.type === 'image' ? { height: element.height * v / element.width } : {}) })} /><NumberField label="Высота слоя" value={element.height} min={1} max={8192} onChange={v => updateElement({ ...element, height: v, ...(element.type === 'image' ? { width: element.width * v / element.height } : {}) })} /><NumberField label="Поворот" value={element.rotation} min={-360} max={360} onChange={v => updateElement({ ...element, rotation: v })} /></div>
            <NumberField label="Непрозрачность" value={element.opacity??1} max={1} onChange={v=>updateElement({...element,opacity:v})}/><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>updateElement({...element,x:(doc.width-element.width)/2})}>По центру X</Button><Button variant="outline" onClick={()=>updateElement({...element,y:(doc.height-element.height)/2})}>По центру Y</Button><Button variant="outline" onClick={()=>updateElement({...element,x:Math.max(0,Math.min(doc.width-element.width,element.x)),y:Math.max(0,Math.min(doc.height-element.height,element.y)),rotation:0})}>Вернуть на холст</Button></div>
            {element.type==='text'&&<><NumberField label="Межстрочный интервал" value={element.lineHeight??1.2} min={.8} max={2} onChange={v=>updateElement({...element,lineHeight:v})}/><NumberField label="Межбуквенный интервал" value={element.letterSpacing??0} min={-10} max={40} onChange={v=>updateElement({...element,letterSpacing:v})}/><Label htmlFor="text-role">Назначение текста</Label><NativeSelect id="text-role" value={element.role??'label'} onChange={e=>updateElement({...element,role:e.target.value as Element['role']})}><NativeSelectOption value="heading">Заголовок</NativeSelectOption><NativeSelectOption value="body">Основной текст</NativeSelectOption><NativeSelectOption value="label">Подпись</NativeSelectOption><NativeSelectOption value="counter">Номер слайда</NativeSelectOption></NativeSelect></>}
            {element.type==='image'&&<><Label htmlFor="image-fit">Размещение фото</Label><NativeSelect id="image-fit" value={element.fit??'contain'} onChange={async e=>{const fit=e.target.value as 'contain'|'cover';if(fit==='contain'){const img=new Image();img.src=element.src;await img.decode();const scale=Math.min(element.width/img.width,element.height/img.height);updateElement({...element,fit,width:Math.max(1,img.width*scale),height:Math.max(1,img.height*scale)})}else updateElement({...element,fit})}}><NativeSelectOption value="contain">Целиком</NativeSelectOption><NativeSelectOption value="cover">Заполнить рамку</NativeSelectOption></NativeSelect>{element.fit==='cover'&&<><NumberField label="Кадрирование X" value={element.cropX??.5} max={1} onChange={v=>updateElement({...element,cropX:v})}/><NumberField label="Кадрирование Y" value={element.cropY??.5} max={1} onChange={v=>updateElement({...element,cropY:v})}/></>}</>}
            {element.type==='shape'&&<><Label htmlFor="shape-kind">Тип фигуры</Label><NativeSelect id="shape-kind" value={element.kind} onChange={e=>updateElement({...element,kind:e.target.value as typeof element.kind})}><NativeSelectOption value="rect">Плашка</NativeSelectOption><NativeSelectOption value="ellipse">Круг / овал</NativeSelectOption><NativeSelectOption value="arrow">Стрелка</NativeSelectOption><NativeSelectOption value="star">Звезда</NativeSelectOption><NativeSelectOption value="line">Линия</NativeSelectOption><NativeSelectOption value="curve">Рисованная стрелка</NativeSelectOption></NativeSelect><Label htmlFor="shape-fill">Цвет фигуры</Label><Input id="shape-fill" type="color" value={element.fill} onChange={e=>updateElement({...element,fill:e.target.value})}/><Label htmlFor="shape-gradient">Второй цвет градиента</Label><Input id="shape-gradient" type="color" value={element.gradient??element.fill} onChange={e=>updateElement({...element,gradient:e.target.value})}/><Button variant="outline" onClick={()=>updateElement({...element,gradient:undefined})}>Убрать градиент</Button><NumberField label="Скругление" value={element.radius??0} max={500} onChange={v=>updateElement({...element,radius:v})}/><Label htmlFor="shape-stroke">Цвет обводки</Label><Input id="shape-stroke" type="color" value={element.stroke??element.fill} onChange={e=>updateElement({...element,stroke:e.target.value})}/><NumberField label="Толщина обводки" value={element.strokeWidth??0} max={50} onChange={v=>updateElement({...element,strokeWidth:v})}/></>}
            {element.type === 'text' && <><Button variant="outline" onClick={() => updateElement(fitText(element, doc.defaultFont))}>Подогнать текст</Button>{!textFits(element, doc.defaultFont) && <p role="alert" className="text-sm text-destructive">Текст не помещается. Увеличьте слой или уменьшите шрифт.</p>}</>}
            </fieldset><div className="flex gap-2">{[-1, 1].map(direction => <Button key={direction} variant="outline" aria-label={direction === 1 ? 'Слой вперёд' : 'Слой назад'} onClick={() => updateSlide(s => { const elements = [...s.elements]; const from = elements.findIndex(e => e.id === element.id); const to = Math.max(0, Math.min(elements.length - 1, from + direction)); [elements[from], elements[to]] = [elements[to], elements[from]]; return { ...s, elements } })}>{direction === 1 ? <ArrowUp /> : <ArrowDown />}</Button>)}</div>
          </CardContent></Card>}
          <Card className="layer-stack"><CardHeader><CardTitle>Слои</CardTitle><CardDescription>Верхний слой перекрывает остальные.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="layer-list space-y-1" aria-label="Слои слайда">{[...slide.elements].reverse().map(e => <Button key={e.id} variant={selected === e.id ? 'secondary' : 'ghost'} className="h-9 w-full justify-start gap-2" aria-label={e.name+(e.locked?' · закреплён':'')+(!e.visible?' · скрыт':'')} aria-pressed={selected===e.id} title={e.name} onClick={() => setSelected(e.id)}>{e.type==='text'?<Type aria-hidden="true"/>:e.type==='image'?<ImagePlus aria-hidden="true"/>:<Shapes aria-hidden="true"/>}<span className="min-w-0 flex-1 truncate text-left">{e.name}</span>{e.locked&&<LockKeyhole aria-hidden="true" className="size-3.5"/>}{!e.visible&&<EyeOff aria-hidden="true" className="size-3.5"/>}</Button>)}</div><Label htmlFor="slide-background">Фон слайда</Label><Input id="slide-background" type="color" value={slide.background} onChange={e => updateSlide(s => ({ ...s, background: e.target.value }))} /></CardContent></Card>
        </MotionRegion></aside>
      </MotionRegion></>}
    </>}
    <AlertDialog open={reset} onOpenChange={setReset}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Создать новый проект?</AlertDialogTitle><AlertDialogDescription>Текущий проект останется в «Проектах».</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Отмена</AlertDialogCancel><AlertDialogAction onClick={() => { setReset(false); dispatch({ type: 'load', doc: null }); setGroupId(''); setSlideId(''); setSelected(''); navigate('/') }}>Выбрать новый формат</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main></>
}
