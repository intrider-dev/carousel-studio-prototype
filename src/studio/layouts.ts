import type { Element, Group, Proposal, Settings } from './model.ts'
import { textElement, uid } from './model.ts'
import { contrastRatio } from './quality.ts'
import { artDirectProposal } from './art-direction.ts'

export const layoutLabels = { poster: 'Постер', split: 'Две колонки', editorial: 'Журнальная обложка', quote: 'Типографика', cards: 'Карточки', finale: 'Призыв к действию' }
export function artworkRatio(layout:Proposal['slides'][number]['layout'],width:number,height:number) {
  if(width/height>1.25)return width*.39/(height*.8)
  const frames={poster:[.89,.40],split:[.39,.52],editorial:[.87,.40],quote:[.32,.27],cards:[.41,.43],finale:[.31,.29]}
  const [w,h]=frames[layout];return width*w/(height*h)
}
export function contrastColor(background: string) {
  const rgb = background.slice(1).match(/../g)!.map(v => parseInt(v,16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
  if(rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722 <= .179)return '#ffffff'
  return contrastRatio('#171717',background)>=4.5?'#171717':'#000000'
}
export function shapeElement(doc: Settings, kind: Extract<Element, {type:'shape'}>['kind'] = 'rect'): Extract<Element, {type:'shape'}> {
  return { id: uid(), name: 'Фигура', role: 'decoration', type: 'shape', kind, fill: '#7047eb', x: doc.width * .15, y: doc.height * .2, width: doc.width * .3, height: doc.height * .2, rotation: 0, visible: true, locked: false, radius: 24 }
}
export function composeGroup(doc: Settings, proposal: Proposal): Group {
  proposal=artDirectProposal(doc,proposal)
  const w = doc.width, h = doc.height, u = Math.min(w,h)
  return { id: uid(), name: proposal.name, slides: proposal.slides.map((s,index) => {
    const bg = s.background || proposal.background, requestedFg=s.foreground||proposal.foreground, fg = contrastRatio(requestedFg,bg)>=4.5?requestedFg:contrastColor(bg), accent = s.accent || proposal.accent
    const elements: Element[] = []
    const shape = (kind: Extract<Element,{type:'shape'}>['kind'], x:number,y:number,width:number,height:number,fill:string, opacity = 1, rotation = 0) => {
      const names={rect:'Плашка',ellipse:'Овал',arrow:'Стрелка',star:'Звезда',line:'Линия',curve:'Рисованная стрелка'}
      const e = { ...shapeElement(doc,kind),name:`${names[kind]} ${elements.filter(e=>e.type==='shape').length+1}`, x:x*w,y:y*h,width:Math.max(1,width*w),height:Math.max(1,height*h),fill,opacity,rotation,radius:u*.025 }
      elements.push(e); return e
    }
    const text = (value:string, role: Extract<Element,{type:'text'}>['role'], x:number,y:number,width:number,height:number,size:number,fill=fg,font=s.bodyFont,bold=false,align:'left'|'center'|'right'='left') => {
      if (!value) return
      const readableFill=role==='label'&&fill===accent&&contrastRatio(fill,bg)<4.5?fg:fill
      elements.push({ ...textElement(doc,value), role, name: role === 'heading' ? 'Заголовок' : role === 'body' ? 'Основной текст' : role === 'counter' ? 'Номер слайда' : role==='brand'?y>.9?'Подпись бренда':'Бренд':'Акцент', x:x*w,y:y*h,width:width*w,height:height*h,size:Math.min(300,Math.max(8,size*u)),fill:readableFill,font,bold,align,lineHeight:role==='heading'?1.08:1.35,letterSpacing:role==='heading'?-u*.001:0,...(doc.direction==='bold'&&role==='heading'&&fill===fg?{gradient:accent}:{}) })
    }
    const picture = (x:number,y:number,width:number,height:number) => {
      if (s.artwork) elements.push({ id:uid(),type:'image',role:'artwork',name:'Иллюстрация',src:s.artwork.src,x:x*w,y:y*h,width:width*w,height:height*h,rotation:0,visible:true,locked:false,fit:'cover',cropX:.5,cropY:.5 })
    }
    // Decoration is always behind the reading areas and remains individually editable.
    if(doc.direction!=='minimal'){const wash = shape('rect',0,0,1,1,bg); wash.gradient = accent; wash.opacity = .08; wash.radius = 0}
    // Generated freeform decorations stay inside the visual zone, away from copy.
    for (const d of s.decorations.slice(0,2)) shape(d.kind,.62+d.x*.12,.63+d.y*.08,Math.min(d.width,.16),Math.min(d.height,.12),accent,Math.min(d.opacity,.22),0)
    if(w/h>1.25) {
      // Landscape is reflowed into two reading zones instead of flattening a portrait.
      picture(.56,.1,.39,.80)
      text(s.title,'heading',.055,.19,.46,.33,.10,fg,s.headingFont,true)
      shape('line',.055,.56,.12,.005,accent)
      text(s.body,'body',.055,.62,.45,.20,.032)
      text(s.highlight,'label',.055,.86,.44,.04,.025,fg,s.headingFont,true)
    } else if (s.layout === 'poster') {
      picture(.055,.12,.89,.40)
      shape('line',.065,.56,.13,.006,accent)
      text(s.title,'heading',.065,.60,.87,.17,.093,fg,s.headingFont,true)
      text(s.body,'body',.065,.795,.87,.09,.029)
      if(s.highlight){text(s.highlight,'label',.24,.55,.69,.035,.023,accent,s.bodyFont,true,'right')}
    } else if (s.layout === 'split') {
      text(s.title,'heading',.065,.13,.87,.19,.095,fg,s.headingFont,true)
      shape('ellipse',.53,.37,.42,.39,accent,.17)
      picture(.55,.36,.39,.52)
      text(s.body,'body',.065,.42,.42,.26,.034)
      if(s.highlight){const pill=shape('rect',.065,.77,.40,.085,bg);pill.stroke=accent;pill.strokeWidth=u*.002;text(s.highlight,'label',.09,.785,.35,.055,.027,fg,s.headingFont,true)}
      if(doc.direction!=='minimal'&&doc.direction!=='luxe')shape('curve',.425,.72,.12,.17,accent)
    } else if (s.layout === 'editorial') {
      text(s.title,'heading',.065,.12,.87,.19,.102,fg,s.headingFont,true)
      text(s.body,'body',.065,.34,.87,.105,.030)
      picture(.065,.48,.87,.40)
      if(s.highlight){const label=shape('rect',.09,.81,.72,.05,bg);label.radius=u*.012;text(s.highlight,'label',.11,.815,.68,.035,.023,accent,s.bodyFont,true)}
    } else if (s.layout === 'quote') {
      shape('ellipse',.61,.60,.32,.25,accent,.2)
      shape('line',.075,.15,.13,.008,accent)
      text(s.title,'heading',.075,.23,.84,.34,.11,fg,s.headingFont,true)
      text(s.body,'body',.075,.65,.46,.2,.03)
      picture(.60,.62,.32,.27)
    } else if (s.layout === 'cards') {
      text(s.title,'heading',.065,.13,.87,.22,.092,fg,s.headingFont,true)
      shape('rect',.06,.43,.43,.43,accent)
      text(s.body,'body',.095,.47,.35,.27,.031,contrastColor(accent))
      text(s.highlight,'label',.095,.78,.35,.05,.029,contrastColor(accent),s.headingFont,true)
      picture(.53,.43,.41,.43)
      if(doc.direction!=='minimal'&&doc.direction!=='luxe')shape('curve',.76,.29,.17,.12,accent)
    } else {
      shape('rect',.05,.12,.9,.39,accent)
      text(s.title,'heading',.09,.17,.82,.24,.098,contrastColor(accent),s.headingFont,true,'center')
      text(s.body,'body',.09,.57,.48,.22,.035)
      picture(.62,.56,.31,.29)
      if(doc.direction!=='minimal'&&doc.direction!=='luxe')shape('curve',.09,.80,.30,.09,accent)
      text(s.highlight,'label',.44,.85,.48,.05,.026,fg,s.headingFont,true)
    }
    text(doc.brand?.enabled?(doc.brand.name||s.kicker||proposal.name):(s.kicker || proposal.name),'brand',.065,.035,.64,.04,.022,fg,s.bodyFont,true)
    text(`${index+1} / ${proposal.slides.length}`,'counter',.8,.035,.13,.04,.022,fg,s.bodyFont,true,'right')
    shape('line',.065,.925,.87,.002,fg,.3)
    text(doc.brand?.enabled?(doc.brand.contact||s.footer||proposal.name):(s.footer || proposal.name),'brand',.065,.94,.87,.03,.019)
    if(doc.brand?.enabled&&doc.brand.logo){const aspect=doc.brand.logoAspect??1,width=Math.min(w*.055,u*.05*aspect),height=width/aspect;elements.push({id:uid(),type:'image',role:'brand',name:'Логотип',src:doc.brand.logo,x:w*.735,y:h*.03,width,height,fit:'contain',rotation:0,locked:true,visible:true})}
    return { id:uid(), layout:s.layout, title:s.title, background:bg, elements }
  }) }
}
