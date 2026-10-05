import { parseProposal } from './model.ts'
import type { Group, Proposal } from './model.ts'

// Rebuild into a new group. The source layers are never replaced.
export function groupProposal(group:Group):Proposal {
 return parseProposal(JSON.stringify({name:`${group.name.replace(/ \/ новый дизайн$/u,'').slice(0,80)} / новый дизайн`,slides:group.slides.map(slide=>{
  const text=(role:string)=>slide.elements.find(e=>e.type==='text'&&e.role===role)
  const heading=text('heading'),body=text('body'),label=text('label')
  const image=slide.elements.find(e=>e.type==='image'&&e.role!=='brand')
  const brands=slide.elements.filter(e=>e.type==='text'&&e.role==='brand'),kicker=brands[0],footer=brands.at(-1)
  return {title:heading?.type==='text'?heading.text:slide.title,body:body?.type==='text'?body.text:' ',highlight:label?.type==='text'?label.text:'',kicker:kicker?.type==='text'?kicker.text:'',footer:footer?.type==='text'?footer.text:'',layout:slide.layout??'poster',artwork:image?.type==='image'?{src:image.src,width:image.width,height:image.height}:undefined}
 })}))
}
