import type { Settings, Proposal } from './model'
import { directions } from '../../shared/design.ts'

export function artDirectProposal(doc:Settings,proposal:Proposal):Proposal {
  const preset=directions[doc.direction??'auto'], brand=doc.brand?.enabled?doc.brand:undefined
  const palette=brand??(doc.direction&&doc.direction!=='auto'?preset:undefined)
  return {...proposal,...(palette?{background:palette.background,foreground:palette.foreground,accent:palette.accent}:{}),slides:proposal.slides.map(s=>({...s,
    ...(palette?{background:null,foreground:null,accent:null}:{}),
    ...(brand?{headingFont:brand.headingFont as typeof s.headingFont,bodyFont:brand.bodyFont as typeof s.bodyFont,kicker:brand.name||s.kicker,footer:brand.contact||s.footer}:doc.direction&&doc.direction!=='auto'?{headingFont:preset.heading as typeof s.headingFont,bodyFont:preset.body as typeof s.bodyFont}:{}),
    ...(doc.direction==='minimal'||doc.direction==='luxe'?{decorations:[]}:{}),
  }))}
}
