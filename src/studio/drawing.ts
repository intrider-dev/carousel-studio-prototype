import type Konva from 'konva'
import type { Element } from './model'
export function drawingAttrs(e: Element, font: string) {
  const common = { id:e.id,x:e.x,y:e.y,width:e.width,height:e.height,rotation:e.rotation,visible:e.visible,opacity:e.opacity ?? 1 }
  if (e.type === 'text') return { ...common,text:e.text,fontFamily:e.font||font,fontSize:e.size,fontStyle:`${e.bold?'bold':''} ${e.italic?'italic':''}`.trim()||'normal',fill:e.fill,...(e.gradient?{fillPriority:'linear-gradient',fillLinearGradientStartPoint:{x:0,y:0},fillLinearGradientEndPoint:{x:e.width,y:0},fillLinearGradientColorStops:[0,e.fill,1,e.gradient]}:{}),align:e.align,lineHeight:e.lineHeight??1.2,letterSpacing:e.letterSpacing??0,wrap:'word',ellipsis:false }
  return common
}
export function pictureAttrs(e: Extract<Element,{type:'image'}>, image: HTMLImageElement) {
  const common = drawingAttrs(e,'')
  if (e.fit !== 'cover') return { ...common,image }
  const ratio = Math.max(e.width/image.width,e.height/image.height), width=e.width/ratio,height=e.height/ratio
  return { ...common,image,crop:{ x:(image.width-width)*(e.cropX??.5), y:(image.height-height)*(e.cropY??.5),width,height } }
}
export function shapeAttrs(e: Extract<Element,{type:'shape'}>) {
  return { ...drawingAttrs(e,''),fill:e.fill,stroke:e.kind==='curve'?e.fill:e.stroke,strokeWidth:e.kind==='curve'?Math.max(2,Math.min(e.width,e.height)*.035):e.strokeWidth??0,
    ...(e.gradient ? {fillPriority:'linear-gradient',fillLinearGradientStartPoint:{x:0,y:0},fillLinearGradientEndPoint:{x:e.width,y:e.height},fillLinearGradientColorStops:[0,e.fill,1,e.gradient]} : {}),
    sceneFunc:(context: Konva.Context,node: Konva.Shape)=>{
      const c=context._context,w=e.width,h=e.height; c.beginPath()
      if(e.kind==='curve') {
        const px=w*.83,py=h*.17
        c.moveTo(w*.06,h*.90);c.bezierCurveTo(w*.72,h*.91,w*.88,h*.69,px,py)
        c.lineCap='round';context.strokeShape(node)
        c.beginPath();c.moveTo(px-w*.15,py+h*.16);c.lineTo(px,py);c.lineTo(px+w*.10,py+h*.20);context.strokeShape(node)
        return
      }
      if(e.kind==='ellipse') c.ellipse(w/2,h/2,w/2,h/2,0,0,Math.PI*2)
      else if(e.kind==='star') { for(let i=0;i<24;i++){const angle=i*Math.PI/12-Math.PI/2,r=i%2?.36:.5,x=w/2+Math.cos(angle)*w*r,y=h/2+Math.sin(angle)*h*r;if(!i)c.moveTo(x,y);else c.lineTo(x,y)}c.closePath() }
      else if(e.kind==='arrow') {c.moveTo(0,h*.35);c.lineTo(w*.65,h*.35);c.lineTo(w*.65,0);c.lineTo(w,h/2);c.lineTo(w*.65,h);c.lineTo(w*.65,h*.65);c.lineTo(0,h*.65);c.closePath()}
      else c.roundRect(0,0,w,h,Math.min(e.radius??0,w/2,h/2))
      context.fillStrokeShape(node)
    } }
}
