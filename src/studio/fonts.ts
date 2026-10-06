import '@fontsource-variable/manrope'
import '@fontsource-variable/montserrat'
import '@fontsource-variable/oswald'
import '@fontsource-variable/rubik'
import '@fontsource-variable/unbounded'
import '@fontsource-variable/playfair-display'
import '@fontsource-variable/cormorant-garamond'
import '@fontsource-variable/roboto-slab'
import type { Doc, Slide } from './model'

export async function loadSlideFonts(doc: Pick<Doc, 'defaultFont'>, slides: Slide[]) {
  const styles = new Set(slides.flatMap(s => s.elements.flatMap(e => e.type === 'text' ? [`${e.italic ? 'italic ' : ''}${e.bold ? '700' : '400'} 32px "${e.font || doc.defaultFont}"`] : [])))
  await Promise.all([...styles].map(style => document.fonts.load(style, 'Карусель Carousel 0123')))
  await document.fonts.ready
}
