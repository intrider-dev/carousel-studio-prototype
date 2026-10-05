import type { Doc, Slide, Element } from './model'

export type QualityIssue={slideId:string;layerId?:string;severity:'error'|'warning';code:string;message:string}
export function contrastRatio(a:string,b:string) {
  const luminance=(hex:string)=>hex.slice(1).match(/../g)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0)
  const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)
}
export function elementBounds(e:Element) {
  const angle=e.rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle)
  const corners=[[0,0],[e.width,0],[0,e.height],[e.width,e.height]].map(([x,y])=>({x:e.x+x*c-y*s,y:e.y+x*s+y*c}))
  return {left:Math.min(...corners.map(p=>p.x)),top:Math.min(...corners.map(p=>p.y)),right:Math.max(...corners.map(p=>p.x)),bottom:Math.max(...corners.map(p=>p.y))}
}
export function inspectSlide(doc:Pick<Doc,'width'|'height'>,slide:Slide):QualityIssue[] {
  const issues:QualityIssue[]=[],u=Math.min(doc.width,doc.height),visible=slide.elements.filter(e=>e.visible)
  for(const [i,e]of visible.entries()) {
    if(e.type!=='text'||!e.text.trim())continue
    const add=(severity:QualityIssue['severity'],code:string,message:string)=>issues.push({slideId:slide.id,layerId:e.id,severity,code,message:`«${e.name}»: ${message}`})
    const b=elementBounds(e)
    if(b.left<-.5||b.top<-.5||b.right>doc.width+.5||b.bottom>doc.height+.5)add('error','bounds','текст выходит за границы холста.')
    else if(b.left<u*.025||b.top<u*.025||b.right>doc.width-u*.025||b.bottom>doc.height-u*.025)add('warning','margin','текст расположен близко к краю. Проверьте поля.')
    const floor=e.role==='heading'?u*.034:e.role==='body'?u*.021:u*.013
    if(e.size<Math.max(8,floor))add('warning','readability',`мелкий текст (${Math.round(e.size)} px). Увеличьте размер или сократите текст.`)
    const center={x:e.x+e.width/2,y:e.y+e.height/2}
    let background:string|undefined=slide.background
    for(const under of visible.slice(0,i)){if(under.x<=center.x&&under.y<=center.y&&under.x+under.width>=center.x&&under.y+under.height>=center.y){if(under.type==='image')background=undefined;else if(under.type==='shape'&&under.kind==='rect'&&(under.opacity??1)>=.95&&!under.gradient&&under.rotation===0)background=under.fill}}
    if(background&&Math.min(contrastRatio(e.fill,background),e.gradient?contrastRatio(e.gradient,background):21)<(e.bold&&e.size>=u*.028?3:4.5))add('warning','contrast','низкий контраст текста и подложки.')
    if(!background)add('warning','photo-contrast','текст поверх фотографии. Проверьте читаемость или добавьте подложку.')
  }
  const headings=visible.filter(e=>e.type==='text'&&e.role==='heading'&&e.text.trim())
  if(headings.length>1)issues.push({slideId:slide.id,severity:'warning',code:'hierarchy',message:'Несколько основных заголовков: проверьте визуальную иерархию.'})
  return issues
}
