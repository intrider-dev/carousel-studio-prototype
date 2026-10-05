import { z } from 'zod'

export const fontNames = ['Arial', 'Georgia', 'Courier New', 'Geist Variable', 'Manrope Variable', 'Montserrat Variable', 'Oswald Variable', 'Rubik Variable', 'Unbounded Variable', 'Playfair Display Variable', 'Cormorant Garamond Variable', 'Roboto Slab Variable'] as const
export const layouts = ['poster', 'split', 'editorial', 'quote', 'cards', 'finale'] as const
export const hex = z.string().regex(/^#[0-9a-f]{6}$/i)
export const pictureSource = z.string().max(16_000_000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/)
export const decorationSchema = z.object({ kind: z.enum(['rect', 'ellipse', 'arrow', 'star', 'line', 'curve']), x: z.number().min(0).max(.95), y: z.number().min(0).max(.95), width: z.number().min(.02).max(1), height: z.number().min(.02).max(1), fill: hex, opacity: z.number().min(.05).max(1), rotation: z.number().min(-30).max(30) })
export const contentSlideSchema = z.object({
  title: z.string().min(1).max(120), body: z.string().min(1).max(450), imagePrompt: z.string().max(800).default(''),
  layout: z.enum(layouts).default('poster'), kicker: z.string().max(50).default(''), highlight: z.string().max(80).default(''), footer: z.string().max(80).default(''),
  headingFont: z.enum(fontNames).default('Manrope Variable'), bodyFont: z.enum(fontNames).default('Manrope Variable'),
  background: hex.nullable().default(null), foreground: hex.nullable().default(null), accent: hex.nullable().default(null),
  decorations: z.array(decorationSchema).max(6).default([]),
})
export const contentProposalSchema = z.object({ name: z.string().min(1).max(100), background: hex.default('#ffffff'), foreground: hex.default('#171717'), accent: hex.default('#7047eb'), slides: z.array(contentSlideSchema).min(1).max(12) })
export const artworkSchema = z.object({ src: pictureSource, width: z.number().positive(), height: z.number().positive() })
export const proposalSchema = contentProposalSchema.extend({ slides: z.array(contentSlideSchema.extend({ artwork: artworkSchema.optional() })).min(1).max(12) })
export type Proposal = z.infer<typeof proposalSchema>
export function proposalJsonSchema(count?: number) {
  const schema = z.toJSONSchema(contentProposalSchema, { target: 'draft-07' })
  // Defaults are applied by the validator; the generation contract requires explicit choices.
  const clean = (value: unknown): void => { if (value && typeof value === 'object') { delete (value as Record<string, unknown>).default; for (const next of Object.values(value)) clean(next) } }
  clean(schema); delete schema.$schema
  if (count && schema.properties?.slides) Object.assign(schema.properties.slides, { minItems: count, maxItems: count })
  return schema
}
