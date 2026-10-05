import { z } from 'zod'
import { hex, fontNames,layouts } from './proposal.ts'

const id=z.string().min(1).max(80),position=z.number().finite().min(-4096).max(4096),length=z.number().min(1).max(8192)
export const layerPatchSchema=z.object({
 name:z.string().max(100).optional(),x:position.optional(),y:position.optional(),width:length.optional(),height:length.optional(),rotation:z.number().min(-360).max(360).optional(),visible:z.boolean().optional(),locked:z.boolean().optional(),opacity:z.number().min(0).max(1).optional(),
 text:z.string().max(2000).optional(),font:z.string().max(100).optional(),size:z.number().min(8).max(300).optional(),bold:z.boolean().optional(),italic:z.boolean().optional(),fill:hex.optional(),gradient:hex.nullable().optional(),align:z.enum(['left','center','right']).optional(),lineHeight:z.number().min(.8).max(2).optional(),letterSpacing:z.number().min(-10).max(40).optional(),
 fit:z.enum(['contain','cover']).optional(),cropX:z.number().min(0).max(1).optional(),cropY:z.number().min(0).max(1).optional(),kind:z.enum(['rect','ellipse','arrow','star','line','curve']).optional(),radius:z.number().min(0).max(500).optional(),stroke:hex.optional(),strokeWidth:z.number().min(0).max(50).optional(),
}).strict()
const geometry={x:position,y:position,width:length,height:length}
export const editPlanSchema=z.object({summary:z.string().min(1).max(300),operations:z.array(z.discriminatedUnion('op',[
 z.object({op:z.literal('update_layer'),slideId:id,layerId:id,patch:layerPatchSchema}).strict(),
 z.object({op:z.literal('update_slide'),slideId:id,background:hex}).strict(),
 z.object({op:z.literal('add_text'),slideId:id,text:z.string().min(1).max(2000),...geometry,font:z.enum(fontNames).optional(),size:z.number().min(8).max(300),fill:hex,bold:z.boolean().optional()}).strict(),
 z.object({op:z.literal('add_shape'),slideId:id,kind:z.enum(['rect','ellipse','arrow','star','line','curve']),...geometry,fill:hex,gradient:hex.optional()}).strict(),
 z.object({op:z.literal('duplicate_layer'),slideId:id,layerId:id}).strict(),
 z.object({op:z.literal('delete_layer'),slideId:id,layerId:id}).strict(),
 z.object({op:z.literal('layer_order'),slideId:id,order:z.array(id).min(1).max(40)}).strict(),
 z.object({op:z.literal('slide_order'),order:z.array(id).min(1).max(20)}).strict(),
 z.object({op:z.literal('duplicate_slide'),slideId:id}).strict(),
 z.object({op:z.literal('add_slide'),afterSlideId:id,title:z.string().min(1).max(120),body:z.string().min(1).max(450),layout:z.enum(layouts),imageFromLayerId:id.optional()}).strict(),
 z.object({op:z.literal('delete_slide'),slideId:id}).strict(),
 z.object({op:z.literal('rename_group'),name:z.string().min(1).max(100)}).strict(),
 z.object({op:z.literal('duplicate_group'),name:z.string().min(1).max(100)}).strict(),
 z.object({op:z.literal('delete_group')}).strict(),
])).min(1).max(80)}).strict()
export type EditPlan=z.infer<typeof editPlanSchema>
export function parseEditPlan(text:string):EditPlan {return editPlanSchema.parse(JSON.parse(text.trim().replace(/^```(?:json)?\s*/iu,'').replace(/\s*```$/u,'')))}
export const editPlanJsonSchema=()=>z.toJSONSchema(editPlanSchema,{target:'draft-7'})
