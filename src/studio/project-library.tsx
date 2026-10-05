import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { listProjects, openProject } from './storage'
import type { ProjectSummary } from './storage'
import type { Doc } from './model'
export function ProjectLibrary({onOpen,onClose}:{onOpen:(doc:Doc)=>void;onClose:()=>void}) {
 const [projects,setProjects]=useState<ProjectSummary[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('')
 useEffect(()=>{let active=true;listProjects().then(value=>{if(active)setProjects(value)}).catch(()=>{if(active)setError('Не удалось прочитать список проектов.')});return()=>{active=false}},[])
 return <Card><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>Проекты</CardTitle><Button variant="outline" onClick={onClose} disabled={busy}>Закрыть</Button></div><CardDescription>Сохранены в этом браузере.</CardDescription></CardHeader><CardContent className="space-y-3">{projects.length===0&&!error&&<p className="text-sm text-muted-foreground">Нет сохранённых проектов.</p>}<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{projects.map(project=><Button key={project.id} variant="outline" disabled={busy} className="h-auto justify-start whitespace-normal p-4 text-left" onClick={async()=>{setBusy(true);setError('');try{onOpen(await openProject(project.id))}catch{setError('Не удалось открыть проект. Проверьте сохранённый JSON или резервную копию.')}finally{setBusy(false)}}}><span className="min-w-0 space-y-2"><span className="block font-semibold">{project.title}</span><span className="block text-xs font-normal text-muted-foreground">{project.width}×{project.height} · Групп: {project.groups} · Слайдов: {project.slides}</span><span className="block text-xs font-normal text-muted-foreground">{new Date(project.updatedAt).toLocaleString()}</span></span></Button>)}</div>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</CardContent></Card>
}
