import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Doc, Group } from './model'
import { inspectSlide } from './quality'
import type { QualityIssue } from './quality'
import { textFits } from './text-layout'
import { loadSlideFonts } from './fonts'

export function QualityPanel({doc,group,onSelect}:{doc:Doc;group:Group;onSelect:(slideId:string,layerId?:string)=>void}) {
  const [issues,setIssues]=useState<QualityIssue[]>([]),[loading,setLoading]=useState(true)
  useEffect(()=>{let active=true
    const timer=setTimeout(async()=>{try{await loadSlideFonts(doc,group.slides);const result=group.slides.flatMap(slide=>[...inspectSlide(doc,slide),...slide.elements.filter(e=>e.visible&&e.type==='text'&&!textFits(e,doc.defaultFont)).map(e=>({slideId:slide.id,layerId:e.id,severity:'error' as const,code:'overflow',message:`«${e.name}»: текст не помещается в слой.`}))]);await Promise.all(group.slides.flatMap(slide=>slide.elements.filter(e=>e.type==='image'&&e.visible).map(async e=>{if(e.type!=='image')return;try{const image=new Image();image.src=e.src;await image.decode();const scale=e.fit==='cover'?Math.max(e.width/image.width,e.height/image.height):Math.min(e.width/image.width,e.height/image.height);if(scale>1.25)result.push({slideId:slide.id,layerId:e.id,severity:'warning',code:'resolution',message:`«${e.name}»: изображение увеличено выше исходного разрешения. Проверьте резкость или загрузите более крупный файл.`})}catch{result.push({slideId:slide.id,layerId:e.id,severity:'error',code:'image',message:`«${e.name}»: изображение не открывается.`})}})));if(active){setIssues(result);setLoading(false)}}catch{if(active){setIssues([{slideId:group.slides[0].id,severity:'error',code:'fonts',message:'Не удалось загрузить шрифты для проверки.'}]);setLoading(false)}}},250)
    return()=>{active=false;clearTimeout(timer)}
  },[doc,group])
  const errors=issues.filter(i=>i.severity==='error').length
  return <Card><CardHeader><CardTitle>Проверка серии</CardTitle><CardDescription>Факты и детали фото проверьте вручную.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap gap-2"><Badge variant={errors?'destructive':'secondary'}>{loading?'Проверяю…':errors?`Ошибок: ${errors}`:'Критических ошибок нет'}</Badge><Badge variant="outline">Замечаний: {issues.length-errors}</Badge></div>{!loading&&!issues.length&&<p className="text-sm text-muted-foreground">Серия прошла техническую проверку.</p>}<div className="max-h-80 space-y-2 overflow-auto">{issues.map((issue,i)=><Button key={`${issue.slideId}-${issue.layerId}-${i}`} variant="outline" className="h-auto w-full justify-start whitespace-normal text-left" onClick={()=>onSelect(issue.slideId,issue.layerId)}><span className="space-y-1"><span className="block text-xs text-muted-foreground">Слайд {group.slides.findIndex(s=>s.id===issue.slideId)+1} · {issue.severity==='error'?'Исправить':'Проверить'}</span><span className="block">{issue.message}</span></span></Button>)}</div></CardContent></Card>
}
