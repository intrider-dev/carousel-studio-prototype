import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { readLocal, writeLocal } from './storage'

type Draft = Record<string, unknown>
const drafts = new Map<string,Draft>(), listeners = new Map<string,Set<()=>void>>(), loading = new Map<string,Promise<void>>()
const revision = new Map<string,number>()
const persistence=new Map<string,string>()
function notify(key:string) { for(const fn of listeners.get(key)??[]) fn() }
function ensure(key:string) {
  if(loading.has(key)) return
  drafts.set(key,{})
  const start=revision.get(key)||0
  loading.set(key,readLocal(key).then(value=>{
    if(value && typeof value==='object') { const saved=value as Draft; drafts.set(key,{...saved,busy:false,...(saved.busy ? {error:'Запрос прерван. Готовые этапы сохранены. Продолжите создание недостающих изображений.',progress:''}: {}),...((revision.get(key)||0)!==start?drafts.get(key):{})});notify(key) }
  }).catch(()=>{drafts.set(key,{error:'Не удалось прочитать черновик генерации.'});notify(key)}))
}
export function useGenerationField<T>(project:string,field:string,fallback:T): [T,Dispatch<SetStateAction<T>>] {
  const key=`generation:${project}`
  const initial=useRef(fallback)
  ensure(key)
  const value=useSyncExternalStore(fn=>{if(!listeners.has(key))listeners.set(key,new Set());listeners.get(key)!.add(fn);return()=>{listeners.get(key)?.delete(fn)}},()=>drafts.get(key)?.[field] as T)
  useEffect(()=>{ensure(key)},[key])
  const set:Dispatch<SetStateAction<T>> = useCallback(next=>{
    const old=drafts.get(key)??{},current=field in old?old[field] as T:initial.current
    const resolved=typeof next==='function'?(next as (value:T)=>T)(current):next
    const update={...old,[field]:resolved}; drafts.set(key,update);revision.set(key,(revision.get(key)||0)+1);notify(key)
    const currentRevision=revision.get(key);persistence.set(key,'Сохраняю план…');notify(key)
    void writeLocal(key,update).then(()=>{if(revision.get(key)===currentRevision){persistence.set(key,'План сохранён');notify(key)}}).catch(()=>{persistence.set(key,'Черновик не сохранился');drafts.set(key,{...drafts.get(key),error:'Черновик не сохранился. Добавьте результат в проект и скачайте файл.'});notify(key)})
  },[key,field])
  return [value===undefined?fallback:value,set]
}
export function useGenerationStatus(project:string) {
 const key=`generation:${project}`
 return useSyncExternalStore(fn=>{if(!listeners.has(key))listeners.set(key,new Set());listeners.get(key)!.add(fn);return()=>{listeners.get(key)?.delete(fn)}},()=>persistence.get(key)||'')
}
