import type { Settings, Proposal } from './model'
import { directions } from '../../shared/design.ts'

export function artDirectProposal(doc:Settings,proposal:Proposal):Proposal {
  const preset=directions[doc.direction??'auto'], brand=doc.brand?.enabled?doc.brand:undefined
  const palette=brand??(doc.direction&&doc.direction!=='auto'?preset:undefined)
  const first=proposal.slides[0]
  const heading=brand?.headingFont??(doc.direction&&doc.direction!=='auto'?preset.heading:['Arial','Geist Variable','Manrope Variable','Montserrat Variable','Oswald Variable','Rubik Variable','Unbounded Variable'].includes(first.headingFont)?first.headingFont:'Manrope Variable')
  const body=brand?.bodyFont??(doc.direction&&doc.direction!=='auto'?preset.body:'Manrope Variable')
  return {...proposal,...(palette?{background:palette.background,foreground:palette.foreground,accent:palette.accent}:{}),slides:proposal.slides.map(s=>({...s,
    ...(palette?{background:null,foreground:null,accent:null}:{}),
    headingFont:heading as typeof s.headingFont,bodyFont:body as typeof s.bodyFont,
    ...(brand?{kicker:brand.name||s.kicker,footer:brand.contact||s.footer}:{}),
    ...(doc.direction==='minimal'||doc.direction==='luxe'?{decorations:[]}:{}),
  }))}
}
