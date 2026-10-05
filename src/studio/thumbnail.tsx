import { useEffect, useState } from 'react'
import type { Doc, Slide } from './model'
import { renderSlide } from './canvas'
import { blobDataUrl } from './media'
export function SlideThumbnail({doc,slide}:{doc:Doc;slide:Slide}) {
  const [src,setSrc]=useState('')
  const {width,height,defaultFont}=doc
  useEffect(()=>{let active=true; const timer=setTimeout(()=>{void renderSlide({width,height,defaultFont} as Doc,slide,{preview:true,width:150}).then(blobDataUrl).then(value=>{if(active)setSrc(value)}).catch(()=>{})},150);return()=>{active=false;clearTimeout(timer)}},[width,height,defaultFont,slide])
  return src?<img src={src} alt="" className="h-14 w-12 shrink-0 rounded border object-contain"/>:<span className="h-14 w-12 shrink-0 rounded border"/>
}
