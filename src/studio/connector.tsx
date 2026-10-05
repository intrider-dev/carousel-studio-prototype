import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { parseProposal } from './model'
import type { Doc, Group, Proposal } from './model'
import { contextFor } from './model'
import { imageFile } from './storage'
import { illustrate, palettes, requestCompletion, visualStyles } from './illustrations'
import { ProposalPreview } from './proposal-preview'
import { useGenerationField, useGenerationStatus } from './generation-state'
import { renderSlide } from './canvas'
import { fonts, makeGroup } from './model'
import { loadSlideFonts } from './fonts'
import { layoutLabels } from './layouts'
import { artDirectProposal } from './art-direction'
import { directions, scenarioLabels } from '../../shared/design'
import { Badge } from '@/components/ui/badge'
import { parseEditPlan } from '../../shared/edit-plan'
import type { EditPlan } from '../../shared/edit-plan'
import { applyEditPlan,bindTarget,assertTarget,editError } from './edits'
import type { EditTarget } from './edits'
import { EditPreview,ContentPreview } from './edit-preview'
import { Disclosure,MotionRegion,Pending } from './interface'

type Model = { id: string; name: string; text: boolean; vision: boolean; image: boolean }
type Message = { role: 'user' | 'assistant'; content: string }
export function Connector({ doc, group, slideId, onProposal, onImage, onEdit, onBusy, selectedLayerId='', sourceText = '', wide = false }: { doc: Doc; group: Group; slideId: string; onProposal: (p: Proposal, target: 'slide' | 'group' | 'rewrite' | 'replace',binding?:EditTarget) => boolean|Promise<boolean>; onImage: (src: string, replace?: boolean,layerId?:string) => Promise<boolean>; onEdit:(plan:EditPlan,target:EditTarget)=>Promise<boolean>; selectedLayerId?:string; onBusy: (busy: boolean) => void; sourceText?: string; wide?: boolean }) {
  const project=doc.id||doc.groups[0].id
  const persistenceStatus=useGenerationStatus(project)
  const useField=<T,>(name:string,value:T)=>useGenerationField<T>(project,name,value)
  const abort=useRef<AbortController|null>(null)
  const applying=useRef(false)
  const [models, setModels] = useState<Model[]>([])
  const [model, setModel] = useField('model','')
  const [action, setAction] = useField('action','generate')
  const [scope, setScope] = useField('scope','group')
  const [target, setTarget] = useField<'slide'|'group'>('target','group')
  const [prompt, setPrompt] = useField('prompt',`Создай карусель по теме «${doc.topic}».`)
  const [references, setReferences] = useField<string[]>('references',[])
  const [messages, setMessages] = useField<Message[]>('messages',[])
  const [reviewFirst,setReviewFirst] = useField('reviewFirst',true)
  const [picturesStarted,setPicturesStarted] = useField('picturesStarted',false)
  const [count,setCount] = useField('count',doc.brief?.count??6)
  const [proposal, setProposal] = useField<Proposal|null>('proposal',null)
  const [editPlan,setEditPlan]=useField<EditPlan|null>('editPlan',null)
  const [binding,setBinding]=useField<EditTarget|null>('binding',null)
  const [imageLayer,setImageLayer]=useField('imageLayer','')
  const [regenerateImages,setRegenerateImages]=useField('regenerateImages',false)
  const [photo, setPhoto] = useField('photo','')
  const [busy, setBusy] = useField('busy',false)
  const [error, setError] = useField('error','')
  const [search, setSearch] = useState('')
  const [imageModel, setImageModel] = useField('imageModel','')
  const [palette, setPalette] = useField<keyof typeof palettes>('palette','auto')
  const [visualStyle, setVisualStyle] = useField<keyof typeof visualStyles>('visualStyle','photo')
  const [progress, setProgress] = useField('progress','')
  const [font,setFont] = useField('font','auto')
  const [replacement,setReplacement] = useField('replacement',false)
  const [destinationSlide,setDestinationSlide] = useField('destinationSlide','')
  const [destination,setDestination] = useField('destination','')
  const [journal,setJournal] = useField<string[]>('journal',[])
  const [savedSource,setSavedSource] = useField('source','')
  useEffect(()=>{if(sourceText)setSavedSource(sourceText)},[sourceText,setSavedSource])
  useEffect(()=>{onBusy(busy)},[busy,onBusy])
  async function loadModels() {
    try { const response = await fetch('/studio-api/models'); const data = await response.json(); if (!response.ok) throw new Error(data.error); setModels(data.models); setModel(old=>old||data.defaultModel); setImageModel(old=>old||data.models.find((m: Model) => m.image && m.id === 'google/gemini-2.5-flash-image')?.id || data.models.find((m: Model) => m.image)?.id || '') }
    catch (e) { setError(e instanceof Error ? e.message : 'Не удалось загрузить модели.') }
  }
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- Catalog is fetched once; functional setters retain the restored selection.
  useEffect(() => { void loadModels() }, [])
  const eligible = models.filter(m => action === 'image' ? m.image : m.text && (!references.length || m.vision))
  const displayed = eligible.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.id === model)
  const valid = eligible.some(m => m.id === model)
  const createsSlides = action === 'generate' || action === 'retopic' || action === 'redesign'
  const modifiesExisting=['edit','rewrite','retopic','redesign'].includes(action)
  const imageModels = models.filter(m => m.image && (!references.length || m.vision))
  const validImageModel = imageModels.some(m => m.id === imageModel)
  async function applyResult(task:()=>Promise<void>) {
    if(applying.current)return
    applying.current=true;setBusy(true);onBusy(true);setProgress('Применяю изменения…');setError('')
    try{await task()}catch(e){setError(editError(e))}finally{applying.current=false;setBusy(false);onBusy(false);setProgress('')}
  }
  async function createPictures(parsed: Proposal) {
    const result = await illustrate(parsed, { model: imageModel, style: visualStyles[visualStyle], topic: doc.topic, projectStyle: `${doc.style}. ${directions[doc.direction??'auto'].style}`,width:doc.width,height:doc.height, references,vision:models.find(m=>m.id===imageModel)?.vision,signal:abort.current?.signal }, (next, index) => { setProposal(next); setProgress(`Создаю изображение ${index} из ${parsed.slides.length}`) })
    await loadSlideFonts(doc,makeGroup(doc,result.proposal).slides)
    setProposal(result.proposal)
    if (result.failures.length) setError(`Не все изображения готовы. Текст и готовые картинки сохранены. ${result.failures.join(' ')}`)
  }
  async function retryPictures() {
    if (!proposal || !validImageModel) return
    abort.current=new AbortController();setPicturesStarted(true);setBusy(true); onBusy(true); setError('')
    try { await createPictures(proposal) }
    catch (e) { setError(e instanceof Error ? e.message : 'Не удалось создать изображения.') }
    finally { setBusy(false); onBusy(false); setProgress('') }
  }
  async function run() {
    if (!prompt.trim()) { setError('Введите запрос.'); return }
    if (!valid) { setError('Выберите модель для этого действия и вложений.'); return }
    if (createsSlides && !reviewFirst && !validImageModel) { setError('Выберите модель изображений для создания слайдов с картинками.'); return }
    if(action==='generate'&&target==='group'&&doc.groups.length>=12){setError('Удалите ненужную группу: достигнут предел 12 групп. Запрос не отправлен.');return}
    if(action==='generate'&&target==='slide'&&group.slides.length>=20){setError('В группе уже 20 слайдов. Выберите новую группу. Запрос не отправлен.');return}
    if(action==='image'&&!replacement&&group.slides.find(s=>s.id===slideId)!.elements.length>=40){setError('На слайде уже 40 слоёв. Освободите место или выберите замену изображения.');return}
    if(modifiesExisting&&action!=='edit'&&scope==='group'&&group.slides.length>12){setError('За один запрос можно переделать до 12 слайдов. Выберите текущий слайд.');return}
    if(action==='image'&&replacement){const chosen=group.slides.find(s=>s.id===slideId)?.elements.find(e=>e.type==='image'&&e.id===selectedLayerId)??group.slides.find(s=>s.id===slideId)?.elements.find(e=>e.type==='image'&&e.role!=='brand');if(!chosen||chosen.locked){setError('На слайде нет доступной картинки для замены. Открепите выбранное фото или добавьте новое.');return}}
    if(action==='analyze'&&!models.find(m=>m.id===model)?.vision){setError('Для анализа выберите модель, принимающую изображения.');return}
    abort.current=new AbortController();setDestination(group.id);setDestinationSlide(slideId)
    setPicturesStarted(false);setBusy(true); onBusy(true); setError(''); setProgress('Подготавливаю содержание слайдов')
    setJournal(old=>[`${new Date().toLocaleString()}: ${action}, запрос отправлен`,...old].slice(0,30))
    try {
      const requestTarget=await bindTarget(doc,group,slideId,(action==='image'?'slide':scope) as 'slide'|'group');setBinding(requestTarget)
      if(action==='image')setImageLayer(group.slides.find(s=>s.id===slideId)?.elements.find(e=>e.type==='image'&&e.id===selectedLayerId)?.id||group.slides.find(s=>s.id===slideId)?.elements.find(e=>e.type==='image'&&e.role!=='brand')?.id||'')
      const snapshot=async(s:Group['slides'][number])=>{const blob=await renderSlide(doc,s,{preview:true,width:768});return new Promise<string>(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.readAsDataURL(blob)})}
      const payload={prompt,model,action,target,requestedCount:action==='generate'?(target==='slide'?1:count):undefined,sourceText:sourceText||savedSource,context:{...contextFor(doc,group,scope==='slide'?slideId:undefined),artworkStyle:visualStyles[visualStyle],palette:palette==='auto'?'Выбери по теме и стилизации':palettes[palette],visualDirection:directions[doc.direction??'auto'].style,scenario:scenarioLabels[doc.brief?.scenario??'educational'],headingFont:font==='auto'?'Выбери выразительную пару шрифтов':font},history:messages.slice(-6)}
      let result
      if(action==='analyze'&&!references.length){
        const selectedSlides=group.slides.filter(s=>scope==='group'||s.id===slideId),parts:string[]=[]
        let cost=0
        for(let start=0;start<selectedSlides.length;start+=3){
          setProgress(`Анализирую слайды ${start+1}-${Math.min(start+3,selectedSlides.length)} из ${selectedSlides.length}`)
          const batch=selectedSlides.slice(start,start+3),batchGroup={...group,slides:batch}
          const answer=await requestCompletion({...payload,context:{...contextFor(doc,batchGroup),positions:batch.map(s=>group.slides.findIndex(x=>x.id===s.id)+1),totalSlides:group.slides.length},references:await Promise.all(batch.map(snapshot))},abort.current.signal)
          parts.push(`${selectedSlides.length>3?`Слайды ${start+1}-${Math.min(start+3,selectedSlides.length)}\n`:''}${answer.text}`)
          cost+=Number(answer.usage?.cost)||0
          setMessages(old=>[...old.filter(m=>m.role!=='assistant'||!m.content.startsWith('Текущий разбор:')),{role:'assistant',content:`Текущий разбор:\n${parts.join('\n\n')}`}].slice(-12) as Message[])
        }
        result={text:parts.join('\n\n'),usage:{cost}}
      }else {const original=action==='image'&&replacement&&!references.length&&models.find(m=>m.id===model)?.vision?(group.slides.find(s=>s.id===slideId)?.elements.find(e=>e.type==='image'&&e.id===selectedLayerId)??group.slides.find(s=>s.id===slideId)?.elements.find(e=>e.type==='image'&&e.role!=='brand')):undefined;result=await requestCompletion({...payload,references:original?.type==='image'?[original.src]:references},abort.current.signal)}
      if (result.image) setPhoto(result.image)
      else {
        setMessages(old => [...old.filter(m=>m.role!=='assistant'||!m.content.startsWith('Текущий разбор:')), { role: 'user', content: prompt }, { role: 'assistant', content: result.text }].slice(-12) as Message[])
        if(action==='edit'){const plan=parseEditPlan(result.text);applyEditPlan(doc,requestTarget,plan);setEditPlan(plan)}
        else if (action !== 'analyze') {
          let parsed: Proposal
          try { parsed = parseProposal(result.text); if (!modifiesExisting && target === 'slide' && parsed.slides.length !== 1) throw new Error('count') } catch { throw new Error('Модель вернула неподходящую структуру слайдов. Повторите запрос или выберите другую модель. Исходный текст и проект сохранены.') }
          if(font!=='auto')parsed.slides=parsed.slides.map(s=>({...s,headingFont:font as typeof s.headingFont}))
          if(palette!=='auto')parsed={...parsed,...palettes[palette],slides:parsed.slides.map(s=>({...s,background:null,foreground:null,accent:null}))}
          parsed=artDirectProposal(modifiesExisting&&!doc.brand?.enabled?{...doc,direction:'auto'}:doc,parsed)
          if(modifiesExisting&&parsed.slides.length!==requestTarget.slideIds.length)throw new Error('Модель вернула другое количество слайдов. Проект сохранён.')
          if(createsSlides&&modifiesExisting&&!regenerateImages)parsed={...parsed,slides:parsed.slides.map((s,i)=>{const original=group.slides.find(slide=>slide.id===requestTarget.slideIds[i]);const image=original?.elements.find(e=>e.type==='image'&&e.role==='artwork')??original?.elements.find(e=>e.type==='image'&&e.role!=='brand');return {...s,artwork:image?.type==='image'?{src:image.src,width:image.width,height:image.height}:undefined}})}
          setProposal(parsed)
          if(action!=='rewrite'&&!reviewFirst){setPicturesStarted(true);await createPictures(parsed)}
        }
      }
      setJournal(old=>[`${new Date().toLocaleString()}: результат сохранён${result.usage?.cost!=null?`, расход $${result.usage.cost}`:''}`,...old].slice(0,30))
    } catch (e) { const message=abort.current?.signal.aborted?'Остановлено. Результат сохранён.':editError(e);setError(message);setJournal(old=>[`${new Date().toLocaleString()}: ${message}`,...old].slice(0,30)) }
    finally { setBusy(false); onBusy(false); setProgress('') }
  }
  return <Card>{!wide&&<CardHeader><CardTitle>Создание слайдов</CardTitle></CardHeader>}<CardContent className={wide?'pt-6':undefined}><div className={wide?'grid items-start gap-8 lg:grid-cols-[360px_minmax(0,1fr)]':'space-y-6'}><section className="min-w-0 space-y-5">
    {action==='generate'&&target==='group'&&<div className="space-y-2"><Label htmlFor="generation-count">Количество слайдов</Label><NativeSelect id="generation-count" value={count} disabled={busy||!!proposal} onChange={e=>setCount(Number(e.target.value))}>{Array.from({length:12},(_,i)=><NativeSelectOption key={i} value={i+1}>{i+1}</NativeSelectOption>)}</NativeSelect></div>}
    {action==='generate'&&<div className="space-y-2"><Label htmlFor="creation-target">Что создать</Label><NativeSelect id="creation-target" value={target} disabled={busy||!!proposal} onChange={e => setTarget(e.target.value as 'slide' | 'group')}><NativeSelectOption value="group">Группу слайдов</NativeSelectOption><NativeSelectOption value="slide">Один слайд</NativeSelectOption></NativeSelect></div>}
    {sourceText && <p className="text-sm">Источник: ответ из чата.</p>}
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="action">Действие</Label><NativeSelect id="action" value={action} disabled={busy||!!proposal||!!photo||!!editPlan} onChange={e => {setAction(e.target.value);setRegenerateImages(e.target.value==='retopic')}}>
        <NativeSelectOption value="generate">Создать слайды</NativeSelectOption><NativeSelectOption value="analyze">Анализ слайдов</NativeSelectOption><NativeSelectOption value="edit">Изменить по запросу</NativeSelectOption><NativeSelectOption value="redesign">Переделать дизайн</NativeSelectOption><NativeSelectOption value="retopic">Сменить тему</NativeSelectOption><NativeSelectOption value="rewrite">Переписать текст</NativeSelectOption><NativeSelectOption value="image">Создать фото</NativeSelectOption></NativeSelect></div>
      <div className="space-y-2"><Label htmlFor="scope">Контекст</Label><NativeSelect id="scope" value={scope} disabled={busy||!!proposal||!!photo||!!editPlan} onChange={e => setScope(e.target.value)}><NativeSelectOption value="group">Текущая группа</NativeSelectOption><NativeSelectOption value="slide">Текущий слайд</NativeSelectOption></NativeSelect></div>
    </div>

    <div className="space-y-2"><Label htmlFor="prompt">Запрос</Label><Textarea id="prompt" className="max-h-48 overflow-y-auto" rows={4} maxLength={4000} value={prompt} disabled={busy} onChange={e => setPrompt(e.target.value)} /></div>
<Disclosure title="Настройки" description={models.find(m=>m.id===model)?.name||'Выберите модель'} className="rounded-lg border p-3"><div className="space-y-4 pt-4">    <div className="space-y-2"><Label htmlFor="model-search">Поиск модели</Label><Input id="model-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Название модели" /></div>
    <div className="space-y-2"><Label htmlFor="model">Модель</Label><NativeSelect id="model" value={valid ? model : ''} disabled={busy} onChange={e => setModel(e.target.value)}><NativeSelectOption value="">Выберите модель</NativeSelectOption>{displayed.map(m => <NativeSelectOption key={m.id} value={m.id}>{m.name}{m.vision ? ' · изображения' : ''}</NativeSelectOption>)}</NativeSelect></div>
    {!models.length && <Button variant="outline" onClick={loadModels}>Обновить модели</Button>}
    {createsSlides && <div className="space-y-3">
      <div className="space-y-2"><Label htmlFor="image-model">Модель изображений</Label><NativeSelect id="image-model" value={validImageModel ? imageModel : ''} disabled={busy} onChange={e => setImageModel(e.target.value)}><NativeSelectOption value="">Выберите модель изображений</NativeSelectOption>{imageModels.map(m => <NativeSelectOption key={m.id} value={m.id}>{m.name}</NativeSelectOption>)}</NativeSelect></div>
      <div className="grid gap-2 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="palette">Оформление</Label><NativeSelect id="palette" value={palette} disabled={busy||doc.brand?.enabled} onChange={e => { const next=e.target.value as keyof typeof palettes;setPalette(next);if(next!=='auto')setProposal(old=>old?{...old,...palettes[next],slides:old.slides.map(s=>({...s,background:null,foreground:null,accent:null}))}:null) }}><NativeSelectOption value="auto">По теме и запросу</NativeSelectOption><NativeSelectOption value="light">Светлое</NativeSelectOption><NativeSelectOption value="dark">Тёмное</NativeSelectOption><NativeSelectOption value="editorial">Бумага и зелень</NativeSelectOption><NativeSelectOption value="vivid">Контраст и лайм</NativeSelectOption><NativeSelectOption value="warm">Тёплый коралл</NativeSelectOption></NativeSelect></div>
      <div className="space-y-2"><Label htmlFor="visual-style">Изображения</Label><NativeSelect id="visual-style" value={visualStyle} disabled={busy} onChange={e => setVisualStyle(e.target.value as keyof typeof visualStyles)}>{Object.entries(visualStyles).map(([value, label]) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}</NativeSelect></div></div>
      <Label htmlFor="generation-font">Шрифт заголовков</Label><NativeSelect id="generation-font" disabled={busy||doc.brand?.enabled} value={font} onChange={e=>{setFont(e.target.value);if(e.target.value!=='auto')setProposal(old=>old?{...old,slides:old.slides.map(s=>({...s,headingFont:e.target.value as typeof s.headingFont}))}:null)}}><NativeSelectOption value="auto">Подобрать пару по теме</NativeSelectOption>{fonts.map(f=><NativeSelectOption key={f}>{f}</NativeSelectOption>)}</NativeSelect>

    </div>}
    {action==='image'&&<div className="space-y-2"><Label htmlFor="image-operation">Применить изображение</Label><NativeSelect id="image-operation" value={replacement?'replace':'add'} disabled={busy} onChange={e=>setReplacement(e.target.value==='replace')}><NativeSelectOption value="add">Добавить слоем</NativeSelectOption><NativeSelectOption value="replace">Заменить выбранное или первое фото</NativeSelectOption></NativeSelect></div>}
</div></Disclosure>    {models.length>0&&!valid&&<p role="alert" className="text-sm text-destructive">Выберите модель в «Настройках».</p>}
    {savedSource&&!sourceText&&<p className="text-sm">Текст из чата ({savedSource.length} символов). <Button variant="outline" disabled={busy} onClick={()=>setSavedSource('')}>Убрать текст</Button></p>}
    <div className="space-y-2"><Label htmlFor="references">Референсы: до 3 изображений</Label><Input id="references" type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={busy} onChange={async e => {
      const files = Array.from(e.target.files ?? []); e.target.value = ''
      try { if (files.length + references.length > 3) throw new Error('Не больше трёх референсов.'); const loaded = await Promise.all(files.map(imageFile)); setReferences(old => [...old, ...loaded]); setError('') } catch (err) { setError(String(err)) }
    }} /></div>
    <div className="flex flex-wrap gap-2">{references.map((src, i) => <div key={src.slice(-40)} className="space-y-1"><img src={src} className="h-20 w-20 object-contain" alt={`Референс ${i + 1}`} /><Button variant="outline" disabled={busy} onClick={() => setReferences(refs => refs.filter((_, n) => n !== i))}>Убрать {i + 1}</Button></div>)}</div>

<p className="text-xs text-muted-foreground">{createsSlides?`Платно: 1 запрос на план${!modifiesExisting||regenerateImages?` + ${modifiesExisting?(scope==='slide'?1:group.slides.length):target==='slide'?1:count} на изображения`:'. Существующие фото сохранятся'}.`:action==='analyze'?`Платно. Запросов: ${scope==='group'&&!references.length?Math.ceil(group.slides.length/3):1}.`:'Платный запрос.'}</p>

    {createsSlides&&modifiesExisting&&<Label className="flex items-center gap-2"><input type="checkbox" checked={regenerateImages} disabled={busy||!!proposal} onChange={e=>setRegenerateImages(e.target.checked)}/>Обновить изображения</Label>}
    {createsSlides&&<Label className="flex items-center gap-2"><input type="checkbox" checked={!reviewFirst} disabled={busy||!!proposal} onChange={e=>setReviewFirst(!e.target.checked)}/>Сразу создавать изображения</Label>}
    <Button className="w-full" disabled={busy || !valid || !!proposal || !!photo || !!editPlan || (createsSlides && !reviewFirst && !validImageModel)} onClick={run}>{busy ? 'Запрос выполняется' : sourceText ? 'Создать слайды из ответа' : 'Отправить запрос'}</Button>
    {busy&&!applying.current&&<Button variant="outline" onClick={()=>{abort.current?.abort();setError('Остановлено. Результат сохранён.')}}>Остановить</Button>}
    {busy&&<Pending>{progress||'Подготавливаю результат…'}</Pending>}
    <p role="status" className="text-xs text-muted-foreground">{persistenceStatus}</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section><section className="min-w-0 space-y-5" aria-label="Результат запроса" aria-busy={busy}>
    <div className="flex flex-wrap gap-2" aria-label="Этапы запроса"><Badge variant={!proposal&&!photo&&!editPlan?'secondary':'outline'}>1 · Запрос</Badge><Badge variant={busy||proposal||photo||editPlan?'secondary':'outline'}>2 · Просмотр</Badge><Badge variant="outline">3 · Применение</Badge></div>
    {!proposal&&!photo&&!editPlan&&<div className="flex min-h-80 flex-col justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-6"><h2 className="text-lg font-semibold">{busy?'Готовлю результат':'Результат появится здесь'}</h2><p className="max-w-md text-sm leading-relaxed text-muted-foreground">{modifiesExisting?'Опишите правки текущего слайда или группы. Перед применением можно проверить результат.':action==='image'?'Опишите изображение и при необходимости добавьте референс.':'Опишите тему и отправьте запрос. Сначала можно проверить план, затем создать изображения.'}</p>{busy&&<Pending>{progress||'Запрос отправлен'}</Pending>}</div>}

    {editPlan&&binding&&<MotionRegion changeKey="edits"><EditPreview doc={doc} plan={editPlan} target={binding} busy={busy} onClear={()=>{setEditPlan(null);setError('')}} onApply={()=>applyResult(async()=>{await assertTarget(doc,binding);if(await onEdit(editPlan,binding)){setEditPlan(null);setSavedSource('')}})}/></MotionRegion>}
    {proposal && <MotionRegion changeKey="proposal" className="space-y-5"><p className="font-medium">{proposal.name} · Слайдов: {proposal.slides.length}</p><p className="text-sm">Изображения: {proposal.slides.filter(s => s.artwork).length} / {proposal.slides.length}</p>{(modifiesExisting&&binding?<ContentPreview doc={doc} proposal={proposal} target={binding} mode={action==='rewrite'?'rewrite':'replace'}/>:<ProposalPreview doc={doc} proposal={proposal}/>)}<Disclosure title="Править план" defaultOpen={!picturesStarted}><fieldset disabled={busy}>{proposal.slides.map((s,i)=><div key={i} className="space-y-2 border-b py-3"><Label htmlFor={`proposal-title-${i}`}>Заголовок {i+1}</Label><Input id={`proposal-title-${i}`} value={s.title} maxLength={120} onChange={e=>setProposal(old=>old?{...old,slides:old.slides.map((slide,n)=>n===i?{...slide,title:e.target.value}:slide)}:old)}/><Label htmlFor={`proposal-body-${i}`}>Текст {i+1}</Label><Textarea id={`proposal-body-${i}`} value={s.body} maxLength={450} onChange={e=>setProposal(old=>old?{...old,slides:old.slides.map((slide,n)=>n===i?{...slide,body:e.target.value}:slide)}:old)}/><Label htmlFor={`proposal-layout-${i}`}>Композиция {i+1}</Label><NativeSelect id={`proposal-layout-${i}`} value={s.layout} onChange={e=>setProposal(old=>old?{...old,slides:old.slides.map((slide,n)=>n===i?{...slide,layout:e.target.value as typeof s.layout}:slide)}:old)}>{Object.entries(layoutLabels).map(([key,label])=><NativeSelectOption key={key} value={key}>{label}</NativeSelectOption>)}</NativeSelect><Label htmlFor={`proposal-image-${i}`}>Сюжет изображения {i+1}</Label><Textarea id={`proposal-image-${i}`} value={s.imagePrompt} maxLength={800} rows={2} onChange={e=>setProposal(old=>old?{...old,slides:old.slides.map((slide,n)=>n===i?{...slide,imagePrompt:e.target.value}:slide)}:old)}/><Button disabled={busy} variant="outline" onClick={()=>setProposal(old=>old?{...old,slides:old.slides.map((slide,n)=>n===i?{...slide,artwork:undefined}:slide)}:old)}>Заменить картинку {i+1}</Button></div>)}</fieldset></Disclosure>{!busy && action!=='rewrite'&&proposal.slides.some(s => !s.artwork) && <Button variant="outline" disabled={!validImageModel} onClick={retryPictures}>{picturesStarted?'Повторить недостающие':'Создать изображения'}</Button>}<Button disabled={busy || (action!=='rewrite'&&proposal.slides.some(s => !s.artwork))} onClick={() => applyResult(async()=>{if(!modifiesExisting&&target==='slide'&&destination!==group.id){setError('Выберите исходную группу для применения результата.');return}if (await onProposal(proposal, action==='rewrite'?'rewrite':modifiesExisting?'replace':target,binding??undefined)) {setProposal(null);setSavedSource('')} })}>{action==='rewrite'?'Применить новый текст':modifiesExisting?'Заменить текущие слайды':target === 'slide' ? 'Добавить слайд' : 'Добавить группу'}</Button><Button variant="outline" disabled={busy} onClick={()=>{setProposal(null);setError('')}}>Убрать результат</Button></MotionRegion>}
    {photo && <MotionRegion changeKey="photo" className="space-y-5"><img src={photo} className="max-h-72 w-full object-contain" alt="Предложенное фото" /><Button disabled={busy} onClick={()=>applyResult(async()=>{ if(destination!==group.id||destinationSlide!==slideId){setError('Выберите исходный слайд для применения изображения.');return}try{if(binding)await assertTarget(doc,binding);if(await onImage(photo,replacement,imageLayer)) setPhoto('')}catch(e){setError(e instanceof Error?e.message:'Не удалось применить изображение.')} })}>{replacement?'Заменить фото на слайде':'Добавить фото в текущий слайд'}</Button><Button variant="outline" disabled={busy} onClick={()=>setPhoto('')}>Убрать фото</Button></MotionRegion>}
    <Disclosure title={`Подробности (${journal.length})`}>{journal.map((entry,i)=><p key={i} className="py-1 text-xs">{entry}</p>)}</Disclosure>
    <Disclosure title={`История (${messages.length})`}><div className="max-h-96 space-y-4 overflow-auto py-3">{messages.map((m, i) => <div key={i}><p className="text-xs font-semibold">{m.role === 'user' ? 'Ваш запрос' : 'Ответ модели'}</p><p className="whitespace-pre-wrap break-words text-sm">{m.content}</p></div>)}</div></Disclosure>
  </section></div></CardContent></Card>
}
