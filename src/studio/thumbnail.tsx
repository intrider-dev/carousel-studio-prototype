import { useEffect, useState } from 'react'
import type { Doc, Slide } from './model'
import { renderSlide } from './canvas'
import { blobDataUrl } from './media'
export function SlideThumbnail({doc,slide,large=false}:{doc:Doc;slide:Slide;large?:boolean}) {
  const [src,setSrc]=useState('')
  const {width,height,defaultFont}=doc
  useEffect(()=>{let active=true; const timer=setTimeout(()=>{void renderSlide({width,height,defaultFont} as Doc,slide,{preview:true,width:large?360:150}).then(blobDataUrl).then(value=>{if(active)setSrc(value)}).catch(()=>{})},150);return()=>{active=false;clearTimeout(timer)}},[width,height,defaultFont,slide,large])
  return src?<img src={src} alt={large?slide.title:''} className={large?'w-full rounded border object-contain':'h-14 w-12 shrink-0 rounded border object-contain'}/>:<span className={large?'block h-64 rounded border':'h-14 w-12 shrink-0 rounded border'}/>
}
