import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, Download, Layers, RotateCcw } from 'lucide-react'
import JSZip from 'jszip'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { createProject, restoreProject, storageKey, roles, validateProject } from '@/lib/project'
import type { Project } from '@/lib/project'
import { download, slidePng, slideUrl } from '@/lib/slide'

function initialProject() {
  try { return restoreProject(localStorage.getItem(storageKey)) ?? createProject() } catch { return createProject() }
}

export default function App() {
  const [project, setProject] = useState<Project>(initialProject)
  const [step, setStep] = useState(0)
  const [active, setActive] = useState(0)
  const [saveStatus, setSaveStatus] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [exporting, setExporting] = useState(false)
  const [loadingLogo, setLoadingLogo] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const touchStart = useRef<number | null>(null)
  const uploadId = useRef(0)
  const slide = project.slides[active]

  useLayoutEffect(() => { heading.current?.focus(); window.scrollTo({ top: 0 }) }, [step])

  useEffect(() => {
    let message: string
    try { localStorage.setItem(storageKey, JSON.stringify(project)); message = 'Сохранено в этом браузере' }
    catch { message = 'Не удалось сохранить. Скачайте результат до закрытия вкладки.' }
    const timer = setTimeout(() => setSaveStatus(message), 0)
    return () => clearTimeout(timer)
  }, [project])

  function go(next: number) {
    setStep(next); setError(''); setStatus('')
  }

  function submitBrand(event: FormEvent) {
    event.preventDefault()
    if (!project.brand.trim()) { setError('Укажите название бренда.'); document.getElementById('brand')?.focus(); return }
    go(1)
  }

  function submitSlides(event: FormEvent) {
    event.preventDefault()
    const message = validateProject(project)
    if (message) {
      setError(message)
      const invalid = project.slides.findIndex(s => !s.title.trim() || !s.body.trim())
      if (invalid >= 0) setActive(invalid)
      requestAnimationFrame(() => document.getElementById('slide-title')?.focus())
      return
    }
    setActive(0); go(2)
  }

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 1_000_000) {
      setError('Выберите PNG или JPEG размером до 1 МБ.'); return
    }
    const id = ++uploadId.current
    setLoadingLogo(true)
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error())
        reader.readAsDataURL(file)
      })
      const img = new Image(); img.src = data; await img.decode()
      if (id === uploadId.current) setProject(p => ({ ...p, logo: data }))
    } catch { if (id === uploadId.current) setError('Не удалось открыть изображение. Выберите другой файл.') }
    finally { if (id === uploadId.current) setLoadingLogo(false) }
  }

  async function exportSlides(all: boolean) {
    const message = validateProject(project)
    if (message) { setError(message); return }
    setExporting(true); setError(''); setStatus('Подготавливаю изображения…')
    try {
      if (all) {
        const zip = new JSZip()
        for (let i = 0; i < 6; i++) {
          setStatus(`Подготавливаю слайд ${i + 1} из 6…`)
          zip.file(`slide-${String(i + 1).padStart(2, '0')}.png`, await slidePng(project, i))
        }
        download(await zip.generateAsync({ type: 'blob' }), 'carousel-checklist.zip')
        setStatus('ZIP скачан.')
      } else {
        download(await slidePng(project, active), `slide-${String(active + 1).padStart(2, '0')}.png`)
        setStatus(`Слайд ${active + 1} скачан.`)
      }
    } catch { setError('Не удалось скачать изображения. Попробуйте ещё раз.'); setStatus('') }
    finally { setExporting(false) }
  }

  const selectSlide = (index: number) => { setActive(Math.max(0, Math.min(5, index))); setStatus('') }
  const reset = () => {
    uploadId.current++; setLoadingLogo(false); setProject(createProject()); setActive(0); go(0); setResetOpen(false)
  }

  const preview = <div className="space-y-4">
    <div className="mx-auto max-w-sm" tabIndex={0} role="region" aria-label="Просмотр слайдов. Используйте стрелки влево и вправо."
      onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); selectSlide(active + (e.key === 'ArrowRight' ? 1 : -1)) } }}
      onTouchStart={e => { touchStart.current = e.touches[0].clientX }}
      onTouchEnd={e => { if (touchStart.current !== null) { const delta = e.changedTouches[0].clientX - touchStart.current; if (Math.abs(delta) > 50) selectSlide(active + (delta < 0 ? 1 : -1)); touchStart.current = null } }}>
      <img className="w-full rounded-lg border" src={slideUrl(project, active)} width={1080} height={1350}
        alt={`Слайд ${active + 1}. ${slide.title}. ${slide.body}. ${project.brand}. ${project.contact}`} draggable={false} />
    </div>
    <div className="flex items-center justify-center gap-4">
      <Button variant="outline" size="icon-lg" aria-label="Предыдущий слайд" disabled={active === 0} onClick={() => selectSlide(active - 1)}><ArrowLeft aria-hidden="true" /></Button>
      <span className="text-sm text-muted-foreground" aria-live="polite">{active + 1} / 6</span>
      <Button variant="outline" size="icon-lg" aria-label="Следующий слайд" disabled={active === 5} onClick={() => selectSlide(active + 1)}><ArrowRight aria-hidden="true" /></Button>
    </div>
  </div>

  return <>
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3"><Layers aria-hidden="true" className="size-5" /><span className="font-semibold">Карусель</span><Badge variant="secondary">Прототип</Badge></div>
        <Button variant="ghost" disabled={exporting || loadingLogo} onClick={() => setResetOpen(true)}><RotateCcw aria-hidden="true" />Начать заново</Button>
      </div>
    </header>
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="space-y-3">
        <h1 ref={heading} tabIndex={-1} className="text-2xl font-semibold tracking-tight sm:text-3xl">{['Новая карусель', 'Отредактируйте слайды', 'Скачать карусель'][step]}</h1>
        <p className="max-w-2xl text-muted-foreground">{[
          'Добавьте бренд к готовому чек-листу.',
          'Выберите слайд и измените текст.',
          'Проверьте слайды перед скачиванием.',
        ][step]}</p>
      </div>

      <nav aria-label="Этапы создания" className="flex flex-wrap gap-2">
        {['Бренд', 'Слайды', 'Скачать'].map((label, i) => <Button key={label} variant={step === i ? 'default' : 'outline'}
          aria-current={step === i ? 'step' : undefined} disabled={i > step || exporting || loadingLogo} onClick={() => go(i)}>
          {i < step ? <Check aria-hidden="true" /> : `${i + 1}.`} {label}
        </Button>)}
      </nav>

      {error && <div role="alert" className="text-sm text-destructive">{error}</div>}

      {step === 0 && <div className="grid items-start gap-6 lg:grid-cols-2">
        <form onSubmit={submitBrand} noValidate>
          <Card>
            <CardHeader><CardTitle>Ваш бренд</CardTitle><CardDescription>Название и подпись появятся на всех слайдах.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2"><Label htmlFor="brand">Название бренда *</Label>
                <Input id="brand" name="brand" autoComplete="organization" maxLength={40} value={project.brand}
                  aria-invalid={!!error && !project.brand.trim()} onChange={e => setProject({ ...project, brand: e.target.value })} />
                </div>
              <div className="space-y-2"><Label htmlFor="contact">Контакт или подпись</Label>
                <Input id="contact" name="contact" maxLength={60} value={project.contact} placeholder="@yourbrand или адрес сайта" onChange={e => setProject({ ...project, contact: e.target.value })} />
                </div>
              <div className="space-y-2"><Label htmlFor="logo">Логотип</Label>
                <Input type="file" id="logo" accept="image/png,image/jpeg" disabled={loadingLogo} onChange={uploadLogo} />
                <p className="text-xs text-muted-foreground">PNG или JPEG до 1 МБ</p>
                {loadingLogo && <p role="status" className="text-sm">Проверяю изображение…</p>}
                {project.logo && <div className="flex items-center gap-3"><img src={project.logo} alt="Загруженный логотип" className="size-12 object-contain" /><Button variant="outline" type="button" onClick={() => setProject({ ...project, logo: '' })}>Удалить логотип</Button></div>}
              </div>
            </CardContent>
            <CardFooter><Button size="lg" type="submit" disabled={loadingLogo}>К слайдам<ArrowRight aria-hidden="true" /></Button></CardFooter>
          </Card>
        </form>
        <Card>
          <CardHeader><div className="flex flex-wrap gap-2"><Badge variant="outline">Чек-лист</Badge><Badge variant="outline">6 слайдов</Badge><Badge variant="outline">4:5</Badge></div>
            <CardTitle>Перед публикацией</CardTitle></CardHeader>
          <CardContent>{preview}</CardContent>
        </Card>
      </div>}

      {step === 1 && <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-2" aria-label="Выбор слайда">
            {roles.map((role, i) => <Button variant={active === i ? 'default' : 'outline'} key={role} aria-label={`Редактировать слайд ${i + 1}: ${role}`} aria-pressed={active === i} onClick={() => selectSlide(i)}>{i + 1}. {i === 0 ? 'Обложка' : i === 5 ? 'Финал' : `Пункт ${i}`}</Button>)}
          </div>
          <form onSubmit={submitSlides} noValidate>
            <Card>
              <CardHeader><CardTitle>Слайд {active + 1}: {roles[active]}</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2"><Label htmlFor="slide-title">Заголовок *</Label>
                  <Textarea id="slide-title" value={slide.title} maxLength={80} rows={3} aria-invalid={!!error && !slide.title.trim()}
                    onChange={e => setProject({ ...project, slides: project.slides.map((s, i) => i === active ? { ...s, title: e.target.value } : s) })} />
                  <p className="text-xs text-muted-foreground">{slide.title.length} / 80 символов</p></div>
                <div className="space-y-2"><Label htmlFor="slide-body">Текст *</Label>
                  <Textarea id="slide-body" value={slide.body} maxLength={220} rows={5} aria-invalid={!!error && !slide.body.trim()}
                    onChange={e => setProject({ ...project, slides: project.slides.map((s, i) => i === active ? { ...s, body: e.target.value } : s) })} />
                  <p className="text-xs text-muted-foreground">{slide.body.length} / 220 символов</p></div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-3"><Button variant="outline" type="button" onClick={() => go(0)}><ArrowLeft aria-hidden="true" />Бренд</Button><Button type="submit">К просмотру<ArrowRight aria-hidden="true" /></Button></CardFooter>
            </Card>
          </form>
        </div>
        <Card><CardHeader><CardTitle>Предпросмотр</CardTitle><CardDescription>1080 × 1350 px</CardDescription></CardHeader><CardContent>{preview}</CardContent></Card>
      </div>}

      {step === 2 && <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Проверьте серию</CardTitle></CardHeader><CardContent>{preview}</CardContent></Card>
        <div className="space-y-6">
          <Card><CardHeader><CardTitle>Скачать</CardTitle><CardDescription>6 изображений PNG, каждое 1080 × 1350 px.</CardDescription></CardHeader>
            <CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Слайды в архиве идут по порядку.</p><Separator /></CardContent>
            <CardFooter className="flex flex-wrap gap-3"><Button size="lg" disabled={exporting} onClick={() => exportSlides(true)}><Download aria-hidden="true" />{exporting ? 'Подготовка…' : 'Скачать ZIP'}</Button><Button variant="outline" disabled={exporting} onClick={() => exportSlides(false)}>Скачать слайд {active + 1}</Button></CardFooter>
          </Card>
          <Button variant="outline" disabled={exporting} onClick={() => go(1)}><ArrowLeft aria-hidden="true" />К текстам</Button>
        </div>
      </div>}
      <p role="status" className="text-sm">{status}</p>
      <Separator />
      <footer className="flex flex-wrap justify-between gap-3 text-xs text-muted-foreground"><span role="status">{saveStatus}</span><span>Чек-лист · 6 слайдов</span></footer>
    </main>
    <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Начать с готового примера?</AlertDialogTitle><AlertDialogDescription>Текущие тексты, название бренда и логотип будут заменены. Скачанные файлы сохранятся.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Отмена</AlertDialogCancel><AlertDialogAction onClick={reset}>Заменить примером</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
}
