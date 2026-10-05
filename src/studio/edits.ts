import { editPlanSchema } from '../../shared/edit-plan.ts'
import type { EditPlan } from '../../shared/edit-plan.ts'
import { cloneSlide,docSchema,elementSchema,fonts,makeGroup,normalizeDoc,textElement,uid,parseProposal } from './model.ts'
import type { Doc,Element,Group,Proposal } from './model.ts'
import { shapeElement } from './layouts.ts'

export type EditTarget={groupId:string;slideIds:string[];scope:'slide'|'group';revision:string}
export function editError(error:unknown) {return error instanceof Error&&error.name!=='ZodError'?error.message:'Изменения не подходят проекту. Проверьте типы слоёв, длину текста и ограничения размеров.'}
export function editDescriptions(doc:Doc,target:EditTarget,plan:EditPlan):string[] {
 const group=doc.groups.find(g=>g.id===target.groupId)
 const labels:Record<string,string>={text:'Текст',fill:'Цвет',font:'Шрифт',size:'Размер шрифта',x:'X',y:'Y',width:'Ширина',height:'Высота',rotation:'Поворот',locked:'Закрепление',visible:'Видимость',gradient:'Градиент',opacity:'Прозрачность',name:'Название',bold:'Жирный',italic:'Курсив',align:'Выравнивание',fit:'Кадрирование',cropX:'Кадр по X',cropY:'Кадр по Y',lineHeight:'Интервал',letterSpacing:'Межбуквенный интервал',kind:'Фигура',stroke:'Контур',strokeWidth:'Толщина контура',radius:'Скругление'}
 return plan.operations.map(op=>{
  if(op.op==='rename_group')return `Название группы: ${op.name}`
  if(op.op==='delete_group')return `Удалить группу «${group?.name}»`
  if(op.op==='duplicate_group')return `Создать копию группы: ${op.name}`
  if(op.op==='slide_order')return `Порядок слайдов: ${op.order.map(id=>(group?.slides.findIndex(s=>s.id===id)??-1)+1).join(', ')}`
  if(op.op==='add_slide')return `Добавить слайд «${op.title}»${op.imageFromLayerId?' с существующей картинкой':''}`
  const slide=group?.slides.find(s=>s.id===op.slideId),prefix=`Слайд ${(group?.slides.findIndex(s=>s.id===op.slideId)??-1)+1}`
  if(op.op==='update_slide')return `${prefix}: фон ${op.background}`
  if(op.op==='delete_slide')return `${prefix}: удалить`
  if(op.op==='duplicate_slide')return `${prefix}: создать копию`
  if(op.op==='add_text')return `${prefix}: добавить текст «${op.text.slice(0,100)}»`
  if(op.op==='add_shape')return `${prefix}: добавить фигуру`
  if(op.op==='layer_order')return `${prefix}: изменить порядок слоёв`
  const name=slide?.elements.find(e=>e.id===op.layerId)?.name||'Слой'
  if(op.op==='delete_layer')return `${prefix}: удалить «${name}»`
  if(op.op==='duplicate_layer')return `${prefix}: копия «${name}»`
  return `${prefix} · ${name}: ${Object.entries(op.patch).map(([key,value])=>`${labels[key]||key}: ${value===null?'убрать':String(value).slice(0,100)}`).join('; ')}`
 })
}
export async function targetRevision(doc:Doc,group:Group,slideIds:string[]) {
 // Validation fixes property order so a save/load roundtrip cannot look like an edit.
 const canonical=docSchema.parse(doc),source=canonical.groups.find(g=>g.id===group.id)
 const data=JSON.stringify({width:canonical.width,height:canonical.height,defaultFont:canonical.defaultFont,fonts:canonical.fonts,direction:canonical.direction,brand:canonical.brand,group:source?.name,slides:source?.slides.filter(s=>slideIds.includes(s.id))})
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(data))),v=>v.toString(16).padStart(2,'0')).join('')
}
export async function bindTarget(doc:Doc,group:Group,slideId:string,scope:'slide'|'group'):Promise<EditTarget> {
 const slideIds=scope==='group'?group.slides.map(s=>s.id):[slideId]
 return {groupId:group.id,slideIds,scope,revision:await targetRevision(doc,group,slideIds)}
}
export async function assertTarget(doc:Doc,target:EditTarget) {
 const group=doc.groups.find(g=>g.id===target.groupId)
 if(!group||target.slideIds.some(id=>!group.slides.some(s=>s.id===id))||(target.scope==='group'&&JSON.stringify(group.slides.map(s=>s.id))!==JSON.stringify(target.slideIds))||await targetRevision(doc,group,target.slideIds)!==target.revision)throw new Error('Исходные слайды изменились. Отправьте новый запрос с текущим контекстом.')
 return group
}
function orderBy<T extends {id:string}>(items:T[],order:string[]):T[] {
 if(order.length!==items.length||new Set(order).size!==items.length||order.some(id=>!items.some(item=>item.id===id)))throw new Error('Неверный порядок элементов.')
 return order.map(id=>items.find(item=>item.id===id)!)
}
function checkedLayer(doc:Doc,element:Element):Element {
 const parsed=elementSchema.options.find(option=>option.shape.type.value===element.type)!.strict().parse(element)
 if(parsed.type==='text'&&parsed.font&&!([...fonts,...doc.fonts.map(f=>f.family)] as string[]).includes(parsed.font))throw new Error('Шрифт недоступен в проекте.')
 return parsed
}
export function applyEditPlan(doc:Doc,target:EditTarget,input:EditPlan):Doc {
 const plan=editPlanSchema.parse(input),next=structuredClone(doc),group=next.groups.find(g=>g.id===target.groupId)
 if(!group)throw new Error('Исходная группа не найдена.')
 for(const op of plan.operations) {
  if(!next.groups.includes(group))throw new Error('Группа уже удалена предыдущей операцией.')
  if(op.op==='delete_group'){if(target.scope!=='group'||next.groups.length<=1)throw new Error('Нельзя удалить последнюю группу.');next.groups=next.groups.filter(g=>g.id!==group.id);continue}
  if(op.op==='duplicate_group'){if(target.scope!=='group'||next.groups.length>=12)throw new Error('Можно создать до 12 групп.');next.groups.push({id:uid(),name:op.name,slides:group.slides.map(cloneSlide)});continue}
  if(op.op==='add_slide'){
   if(target.scope!=='group'||group.slides.length>=20||!target.slideIds.includes(op.afterSlideId))throw new Error('Не удалось добавить слайд в выбранный контекст.')
   const after=group.slides.find(s=>s.id===op.afterSlideId)
   if(!after)throw new Error('Исходный слайд не найден.')
   const image=op.imageFromLayerId?group.slides.filter(s=>target.slideIds.includes(s.id)).flatMap(s=>s.elements).find(e=>e.id===op.imageFromLayerId&&e.type==='image'):undefined
   if(op.imageFromLayerId&&!image)throw new Error('Картинка не найдена в выбранной группе.')
   const proposal=parseProposal(JSON.stringify({name:group.name,slides:[{title:op.title,body:op.body,layout:op.layout,artwork:image?.type==='image'?{src:image.src,width:image.width,height:image.height}:undefined}]}))
   group.slides.splice(group.slides.indexOf(after)+1,0,makeGroup(doc,proposal).slides[0]);continue
  }
  if(op.op==='rename_group'){if(target.scope!=='group')throw new Error('Выберите всю группу для переименования.');group.name=op.name;continue}
  if(op.op==='slide_order'){if(target.scope!=='group')throw new Error('Выберите всю группу для изменения порядка.');group.slides=orderBy(group.slides,op.order);continue}
  if(!target.slideIds.includes(op.slideId))throw new Error('Изменение затрагивает слайд вне выбранного контекста.')
  const slide=group.slides.find(s=>s.id===op.slideId)
  if(!slide)throw new Error('Слайд не найден.')
  if(op.op==='delete_slide'){if(target.scope!=='group'||group.slides.length<=1)throw new Error('Нельзя удалить последний слайд или изменить состав вне контекста группы.');group.slides=group.slides.filter(s=>s.id!==slide.id);continue}
  if(op.op==='duplicate_slide'){if(target.scope!=='group'||group.slides.length>=20)throw new Error('Для дублирования выберите группу с менее чем 20 слайдами.');group.slides.splice(group.slides.indexOf(slide)+1,0,cloneSlide(slide));continue}
  if(op.op==='update_slide'){slide.background=op.background;continue}
  if(op.op==='layer_order'){slide.elements=orderBy(slide.elements,op.order);continue}
  if(op.op==='add_text'){const {op:_,slideId:__,...properties}=op;slide.elements.push(checkedLayer(doc,{...textElement(doc,op.text),...properties,origin:'manual'}));continue}
  if(op.op==='add_shape'){const {op:_,slideId:__,...properties}=op;slide.elements.push(checkedLayer(doc,{...shapeElement(doc,op.kind),...properties,origin:'manual'}));continue}
  const element=slide.elements.find(e=>e.id===op.layerId)
  if(!element)throw new Error('Слой не найден.')
  if(element.locked&&(op.op!=='update_layer'||op.patch.locked!==false))throw new Error('Слой закреплён. Сначала разрешите его изменение.')
  if(op.op==='delete_layer'){slide.elements=slide.elements.filter(e=>e.id!==element.id);continue}
  if(op.op==='duplicate_layer'){slide.elements.push({...element,id:uid(),name:element.name+' / копия',origin:'manual'});continue}
  if(element.role==='counter'&&op.patch.text!==undefined)throw new Error('Номера слайдов рассчитываются автоматически.')
  const patch={...op.patch,...(op.patch.gradient===null?{gradient:undefined}:{})}
  const changed=checkedLayer(doc,{...element,...patch} as Element)
  slide.elements=slide.elements.map(e=>e.id===element.id?changed:e)
  if(changed.type==='text'&&changed.role==='heading')slide.title=changed.text.trim().slice(0,120)||'Слайд'
 }
 return docSchema.parse(normalizeDoc(next))
}
export function applyContentProposal(doc:Doc,target:EditTarget,proposal:Proposal,mode:'rewrite'|'replace'):Doc {
 const group=doc.groups.find(g=>g.id===target.groupId)
 if(!group||proposal.slides.length!==target.slideIds.length)throw new Error('Количество слайдов не соответствует выбранному контексту.')
 const replacements=mode==='replace'?makeGroup({...doc,direction:doc.brand?.enabled?doc.direction:'auto'},proposal).slides:[]
 const next={...doc,groups:doc.groups.map(g=>g.id!==group.id?g:{...g,slides:g.slides.map(s=>{
  const i=target.slideIds.indexOf(s.id);if(i<0)return s
  if(mode==='rewrite')return {...s,title:proposal.slides[i].title,elements:s.elements.map(e=>e.type==='text'&&(e.role==='heading'||e.role==='body')?{...e,text:e.role==='heading'?proposal.slides[i].title:proposal.slides[i].body}:e)}
  const custom=s.elements.filter(e=>e.origin==='manual'||e.origin!=='generated'&&(!e.role||e.type==='image'&&e.name==='Фото'||e.role==='decoration'&&!/^(Плашка|Овал|Стрелка|Звезда|Линия|Рисованная стрелка) \d+$/u.test(e.name)))
  return {...replacements[i],id:s.id,elements:[...replacements[i].elements,...custom]}
 })})}
 return docSchema.parse(normalizeDoc(next))
}
