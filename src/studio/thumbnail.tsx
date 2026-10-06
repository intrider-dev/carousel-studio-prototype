import { useEffect, useState } from 'react'
import type { Doc, Slide } from './model'
import { renderSlide } from './canvas'
import { blobDataUrl } from './media'
export function SlideThumbnail({doc,slide,large=false}:{doc:Doc;slide:Slide;large?:boolean}) {
  const [src,setSrc]=useState('')
  const {width,height,defaultFont}=doc
  useEffect(()=>{let active=true; const timer=setTimeout(()=>{void renderSlide({width,height,defaultFont} as Doc,slide,{preview:true,width:large?360:150}).then(blobDataUrl).then(value=>{if(active)setSrc(value)}).catch(()=>{})},150);return()=>{active=false;clearTimeout(timer)}},[width,height,defaultFont,slide,large])
  return <span className={large?'relative block w-full overflow-hidden rounded border bg-muted':'relative block h-14 w-12 shrink-0 overflow-hidden rounded border bg-muted'} style={large?{aspectRatio:`${width} / ${height}`}:undefined}>{src?<img src={src} alt={large?slide.title:''} className="preview-image absolute inset-0 h-full w-full object-contain"/>:<span aria-hidden="true" className="absolute inset-0 bg-muted"/>}</span>
}
