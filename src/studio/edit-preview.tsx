import { useEffect,useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Doc,Proposal } from './model'
import type { EditPlan } from '../../shared/edit-plan'
import { applyEditPlan,applyContentProposal,assertTarget,editDescriptions,editError } from './edits'
import type { EditTarget } from './edits'
import { SlideThumbnail } from './thumbnail'
import { fitEditedDocument } from './text-layout'

export function ContentPreview({doc,proposal,target,mode}:{doc:Doc;proposal:Proposal;target:EditTarget;mode:'rewrite'|'replace'}) {
 const [preview,setPreview]=useState<Doc|null>(null),[error,setError]=useState('')
 useEffect(()=>{let active=true;const run=async()=>{await assertTarget(doc,target);return fitEditedDocument(doc,applyContentProposal(doc,target,proposal,mode))};run().then(value=>{if(active){setPreview(value);setError('')}}).catch(e=>{if(active){setPreview(null);setError(editError(e))}});return()=>{active=false}},[doc,proposal,target,mode])
 return <>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<div className="grid gap-3 sm:grid-cols-2">{preview?.groups.find(g=>g.id===target.groupId)?.slides.filter(s=>target.slideIds.includes(s.id)).map(s=><SlideThumbnail key={s.id} doc={preview} slide={s} large/>)}</div></>
}
export function EditPreview({doc,plan,target,busy,onApply,onClear}:{doc:Doc;plan:EditPlan;target:EditTarget;busy:boolean;onApply:()=>Promise<void>;onClear:()=>void}) {
 const [preview,setPreview]=useState<Doc|null>(null),[error,setError]=useState('')
 useEffect(()=>{let active=true;const run=async()=>{await assertTarget(doc,target);return fitEditedDocument(doc,applyEditPlan(doc,target,plan))};run().then(value=>{if(active){setPreview(value);setError('')}}).catch(e=>{if(active){setPreview(null);setError(editError(e))}});return()=>{active=false}},[doc,plan,target])
 return <div className="space-y-3"><h2 className="font-medium">Изменения готовы</h2><p className="text-sm">{plan.summary}</p><p className="text-xs text-muted-foreground">{plan.operations.length} изменений. Применение можно отменить в редакторе.</p><details open={plan.operations.some(op=>op.op.startsWith('delete_'))}><summary className="cursor-pointer text-sm">Что изменится</summary><div className="space-y-2 pt-2">{editDescriptions(doc,target,plan).map((text,i)=><p key={i} className="break-words text-sm">{text}</p>)}</div></details>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<div className="grid gap-2 sm:grid-cols-2">{preview?.groups.find(g=>g.id===target.groupId)?.slides.filter(s=>target.scope==='group'||target.slideIds.includes(s.id)).map((s,i)=><div key={s.id} className="space-y-2 rounded-lg border p-3"><SlideThumbnail doc={preview} slide={s} large/><span className="text-sm">{i+1}. {s.title}</span></div>)}</div><div className="flex flex-wrap gap-2"><Button disabled={busy||!preview||!!error} onClick={onApply}>Применить изменения</Button><Button variant="outline" disabled={busy} onClick={onClear}>Убрать результат</Button></div></div>
}
