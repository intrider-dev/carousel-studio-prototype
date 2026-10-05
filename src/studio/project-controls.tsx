import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { directions, briefSchema, brandSchema, scenarioLabels } from '../../shared/design'
import { fonts } from './model'
import type { Settings } from './model'
import { imageFile } from './storage'

export function BriefControls({value,onChange}:{value:Settings;onChange:(value:Settings)=>void}) {
  const brief=value.brief??briefSchema.parse({})
  return <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="brief-scenario">Задача серии</Label><NativeSelect id="brief-scenario" value={brief.scenario} onChange={e=>onChange({...value,brief:{...brief,scenario:e.target.value as typeof brief.scenario}})}>{Object.entries(scenarioLabels).map(([id,label])=><NativeSelectOption key={id} value={id}>{label}</NativeSelectOption>)}</NativeSelect></div><div className="space-y-2"><Label htmlFor="brief-count">Слайдов в серии</Label><NativeSelect id="brief-count" value={brief.count} onChange={e=>onChange({...value,brief:{...brief,count:Number(e.target.value)}})}>{Array.from({length:12},(_,i)=><NativeSelectOption key={i} value={i+1}>{i+1}</NativeSelectOption>)}</NativeSelect></div></div>
    <div className="space-y-2"><Label htmlFor="brief-audience">Для кого</Label><Input id="brief-audience" value={brief.audience} maxLength={300} placeholder="Владельцы кофеен" onChange={e=>onChange({...value,brief:{...brief,audience:e.target.value}})}/></div>
    <div className="space-y-2"><Label htmlFor="brief-goal">Цель</Label><Textarea id="brief-goal" value={brief.goal} maxLength={300} rows={2} placeholder="Показать новую коллекцию" onChange={e=>onChange({...value,brief:{...brief,goal:e.target.value}})}/></div>
    <div className="space-y-2"><Label htmlFor="brief-cta">Призыв к действию</Label><Input id="brief-cta" value={brief.callToAction} maxLength={100} placeholder="Посмотрите коллекцию" onChange={e=>onChange({...value,brief:{...brief,callToAction:e.target.value}})}/></div>
  </div>
}
export function DirectionControls({value,onChange}:{value:Settings;onChange:(value:Settings)=>void}) {
  return <div className="space-y-3"><p className="text-sm font-medium">Оформление</p><div className="grid gap-2 sm:grid-cols-2">{Object.entries(directions).map(([id,preset])=><Button key={id} variant={value.direction===id?'default':'outline'} className="h-auto justify-start whitespace-normal px-3 py-3 text-left" aria-pressed={(value.direction??'auto')===id} onClick={()=>onChange({...value,direction:id as Settings['direction']})}><span className="flex min-w-0 items-center gap-3"><span className="flex shrink-0 gap-1" aria-hidden="true">{[preset.background,preset.foreground,preset.accent].map(color=><span key={color} className="size-3 rounded-full border" style={{background:color}}/>)}</span><span><span className="block">{preset.label}</span><span className="block text-xs font-normal opacity-75">{preset.description}</span></span></span></Button>)}</div></div>
}
export function BrandControls({value,onChange,extraFonts=[]}:{value:Settings;onChange:(value:Settings)=>void;extraFonts?:string[]}) {
  const [error,setError]=useState('')
  const brand=value.brand??brandSchema.parse({})
  const update=(change:Partial<typeof brand>)=>onChange({...value,brand:{...brand,...change}})
  return <div className="space-y-4"><Label className="flex items-center gap-2"><input type="checkbox" checked={brand.enabled} onChange={e=>update({enabled:e.target.checked})}/>Использовать бренд</Label><p className="text-xs text-muted-foreground">Для новых слайдов. Готовые останутся без изменений.</p>
    {brand.enabled&&<><div className="space-y-2"><Label htmlFor="brand-name">Название бренда</Label><Input id="brand-name" value={brand.name} maxLength={60} onChange={e=>update({name:e.target.value})}/></div><div className="space-y-2"><Label htmlFor="brand-contact">Контакт или подпись</Label><Input id="brand-contact" value={brand.contact} maxLength={100} onChange={e=>update({contact:e.target.value})}/></div>
    <div className="grid grid-cols-3 gap-3">{(['background','foreground','accent'] as const).map((key,i)=><div key={key} className="space-y-2"><Label htmlFor={`brand-${key}`}>{['Фон','Текст','Акцент'][i]}</Label><Input id={`brand-${key}`} type="color" value={brand[key]} onChange={e=>update({[key]:e.target.value})}/></div>)}</div>
    {(['headingFont','bodyFont'] as const).map((key,i)=><div key={key} className="space-y-2"><Label htmlFor={`brand-${key}`}>{i?'Шрифт основного текста':'Шрифт заголовков'}</Label><NativeSelect id={`brand-${key}`} value={brand[key]} onChange={e=>update({[key]:e.target.value})}>{[...fonts,...extraFonts].map(font=><NativeSelectOption key={font}>{font}</NativeSelectOption>)}</NativeSelect></div>)}
    <div className="space-y-2"><Label htmlFor="brand-logo">Логотип: PNG, JPEG или WebP</Label><Input id="brand-logo" type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{const logo=await imageFile(file);const image=new Image();image.src=logo;await image.decode();update({logo,logoAspect:image.width/image.height});setError('')}catch(err){setError(err instanceof Error?err.message:'Не удалось открыть логотип.')}}}/>{brand.logo&&<div className="flex items-center gap-3"><img src={brand.logo} className="size-16 rounded border object-contain" alt="Логотип бренда"/><Button variant="outline" onClick={()=>update({logo:undefined})}>Удалить логотип</Button></div>}</div></>}
    {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>
}
