import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Konva from 'konva'
import { Stage, Layer, Rect, Text, Shape, Line, Image as CanvasImage, Transformer } from 'react-konva'
import type { Doc, Element, Slide } from './model'
import { textFits } from './text-layout'
import { drawingAttrs as attrs, pictureAttrs, shapeAttrs } from './drawing'
import { loadSlideFonts } from './fonts'

async function loadImage(src: string) { const img = new Image(); img.src = src; await img.decode(); return img }
function Photo({ element, ...props }: { element: Extract<Element, { type: 'image' }> } & Record<string, unknown>) {
  const [img, setImg] = useState<HTMLImageElement>()
  useEffect(() => { let alive = true; loadImage(element.src).then(value => { if (alive) setImg(value) }).catch(() => { if (alive) setImg(undefined) }); return () => { alive = false } }, [element.src])
  return <CanvasImage {...(img ? pictureAttrs(element,img) : attrs(element,''))} {...props} image={img} />
}
export function SlideCanvas({ doc, slide, selected, onSelect, onChange, zoom = 1, safeGuides = false }: { doc: Doc; slide: Slide; selected: string; onSelect: (id: string) => void; onChange: (e: Element) => void; zoom?: number; safeGuides?: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const stage = useRef<Konva.Stage>(null)
  const transform = useRef<Konva.Transformer>(null)
  const [width, setWidth] = useState(500)
  const [guides,setGuides] = useState<number[]>([])
  useLayoutEffect(() => {
    const observer = new ResizeObserver(entries => setWidth(Math.max(150, entries[0].contentRect.width)))
    observer.observe(host.current!); return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const node = selected ? stage.current?.findOne((node: Konva.Node) => node.id() === selected) : undefined
    const e = slide.elements.find(e => e.id === selected)
    transform.current?.nodes(node && e?.visible && !e.locked ? [node] : [])
  }, [selected, slide])
  const scale = Math.min(width / doc.width, 680 / doc.height) * zoom
  const current = slide.elements.find(e => e.id === selected)
  return <div ref={host} className="w-full" role="region" aria-label="Холст слайда" tabIndex={0}
    onKeyDown={ev => {
      if (!current || current.locked) return
      const delta = ev.shiftKey ? 10 : 1
      const movement: Record<string, [number, number]> = { ArrowLeft: [-delta, 0], ArrowRight: [delta, 0], ArrowUp: [0, -delta], ArrowDown: [0, delta] }
      if (movement[ev.key]) { ev.preventDefault(); const [x, y] = movement[ev.key]; onChange({ ...current, x: current.x + x, y: current.y + y }) }
    }}>
    <div className="max-w-full overflow-auto"><div className="mx-auto w-fit border" style={{ touchAction: 'none' }}>
      <Stage ref={stage} width={doc.width * scale} height={doc.height * scale} scaleX={scale} scaleY={scale}
        onMouseDown={e => { if (e.target === e.target.getStage() || e.target.name() === 'background') onSelect('') }}
        onTouchStart={e => { if (e.target.name() === 'background') onSelect('') }}>
        <Layer>
          <Rect name="background" width={doc.width} height={doc.height} fill={slide.background} />
          {slide.elements.map(e => {
            const events = { draggable: !e.locked, onClick: () => onSelect(e.id), onTap: () => onSelect(e.id),
              onDragStart: () => onSelect(e.id),
              onDragMove: (event: Konva.KonvaEventObject<DragEvent>) => {const node=event.target,next:number[]=[]; if(Math.abs(node.x()+e.width/2-doc.width/2)<8/scale){node.x((doc.width-e.width)/2);next.push(0)}if(Math.abs(node.y()+e.height/2-doc.height/2)<8/scale){node.y((doc.height-e.height)/2);next.push(1)}setGuides(next)},
              onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => { setGuides([]); onChange({ ...e, x: Math.round(event.target.x()), y: Math.round(event.target.y()) }) },
              onTransformEnd: (event: Konva.KonvaEventObject<Event>) => {
                const node = event.target; const sx = node.scaleX(); const sy = node.scaleY()
                node.scaleX(1); node.scaleY(1)
                const change = { ...e, x: Math.round(node.x()), y: Math.round(node.y()), width: Math.max(10, Math.round(e.width * sx)), height: Math.max(10, Math.round(e.height * sy)), rotation: Math.round(node.rotation()) }
                onChange(change.type === 'text' ? { ...change, size: Math.max(8, Math.min(300, Math.round(change.size * sy))) } : change)
              } }
            return e.type === 'text' ? <Text key={e.id} {...attrs(e, doc.defaultFont)} {...events} /> : e.type === 'shape' ? <Shape key={e.id} {...shapeAttrs(e)} {...events}/> : <Photo key={e.id} element={e} {...events} />
          })}
          {safeGuides&&<Rect listening={false} x={Math.min(doc.width,doc.height)*.04} y={Math.min(doc.width,doc.height)*.04} width={doc.width-Math.min(doc.width,doc.height)*.08} height={doc.height-Math.min(doc.width,doc.height)*.08} stroke="#3b82f6" strokeWidth={1/scale} dash={[6/scale,4/scale]}/>}
          {guides.map(axis=><Line key={axis} listening={false} points={axis===0?[doc.width/2,0,doc.width/2,doc.height]:[0,doc.height/2,doc.width,doc.height/2]} stroke="#3b82f6" strokeWidth={1/scale} dash={[6/scale,4/scale]}/>)}
          <Transformer ref={transform} flipEnabled={false} keepRatio={true} enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']} boundBoxFunc={(old, next) => next.width < 10 || next.height < 10 ? old : next} />
        </Layer>
      </Stage>
    </div></div>
  </div>
}
// oxlint-disable-next-line react/only-export-components -- Preview and export intentionally share the same drawing attributes.
export async function renderSlide(doc: Doc, slide: Slide, options: { preview?: boolean; width?: number } = {}): Promise<Blob> {
  await loadSlideFonts(doc,[slide])
  const host = document.createElement('div')
  const stage = new Konva.Stage({ container: host, width: doc.width, height: doc.height })
  try {
    const layer = new Konva.Layer(); stage.add(layer)
    layer.add(new Konva.Rect({ width: doc.width, height: doc.height, fill: slide.background }))
    for (const e of slide.elements.filter(e => e.visible)) {
      if (!options.preview && !textFits(e, doc.defaultFont)) throw new Error(`Слайд «${slide.title}»: текст слоя «${e.name}» не помещается. Увеличьте высоту слоя или нажмите «Подогнать текст».`)
      const node = e.type === 'text' ? new Konva.Text(attrs(e,doc.defaultFont)) : e.type === 'shape' ? new Konva.Shape(shapeAttrs(e)) : new Konva.Image(pictureAttrs(e,await loadImage(e.src)))
      layer.add(node)
      if (!options.preview && e.type === 'text' && e.text.trim()) { const bounds=node.getClientRect(); if(bounds.x<-.5||bounds.y<-.5||bounds.x+bounds.width>doc.width+.5||bounds.y+bounds.height>doc.height+.5) throw new Error(`Слайд «${slide.title}»: текст «${e.name}» выходит за границы холста. Переместите слой внутрь слайда.`) }
    }
    layer.draw()
    const blob = await stage.toBlob({ pixelRatio: options.width ? options.width/doc.width : 1 })
    if (!blob) throw new Error('Не удалось создать PNG.')
    return blob
  } finally { stage.destroy() }
}
