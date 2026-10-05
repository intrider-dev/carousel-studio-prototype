import type { Proposal } from './model'
import { artworkRatio } from './layouts'

export const palettes = {
  auto: { background: '#f3f0e9', foreground: '#171717', accent: '#ba462d' },
  light: { background: '#ffffff', foreground: '#171717', accent: '#7047eb' },
  dark: { background: '#101018', foreground: '#ffffff', accent: '#bb91ff' },
  editorial: { background: '#f2ecdf', foreground: '#282b22', accent: '#48654c' },
  vivid: { background: '#131d37', foreground: '#ffffff', accent: '#e8fa68' },
  warm: { background: '#fff1de', foreground: '#3b231e', accent: '#e55939' },
}
export const visualStyles = { object: 'Объёмные 3D-объекты', photo: 'Предметные фотографии', illustration: 'Иллюстрации', collage:'Редакционный коллаж', cinematic:'Кинематографическая фотография', paper:'Бумага и фактуры' }

export async function requestCompletion(body: object, signal?: AbortSignal) {
  const response = await fetch('/studio-api/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: signal?AbortSignal.any([signal,AbortSignal.timeout(190_000)]):AbortSignal.timeout(190_000) })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || `Ошибка запроса: ${response.status}`)
  return result
}

async function decodeArtwork(src: string): Promise<NonNullable<Proposal['slides'][number]['artwork']>> {
  if (!/^data:image\/(png|jpeg|webp);base64,/.test(src) || src.length > 16_000_000) throw new Error('Получено неподдерживаемое изображение.')
  const image = new Image(); image.src = src; await image.decode()
  const scale = Math.min(1, 1536 / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
  return { src: canvas.toDataURL('image/webp', .92), width: canvas.width, height: canvas.height }
}

// Keep successful images on failure; a retry requests only the missing illustrations.
export async function illustrate(proposal: Proposal, options: { model: string; style: string; topic: string; projectStyle: string; width?:number;height?:number;references: string[]; vision?: boolean; signal?: AbortSignal }, progress: (proposal: Proposal, index: number) => void) {
  const next: Proposal = { ...proposal, slides: proposal.slides.map(s => ({ ...s })) }
  const failures: string[] = []
  for (const [index, slide] of next.slides.entries()) {
    if (slide.artwork) continue
    if(options.signal?.aborted) break
    progress({ ...next, slides: [...next.slides] }, index + 1)
    try {
      const ratio=artworkRatio(slide.layout,options.width??1080,options.height??1350)
      const result = await requestCompletion({ action: 'image', model: options.model,
        prompt: `Создай самостоятельный визуальный материал для композиции: фотографию или выразительную объёмную иллюстрацию. ${options.style}. Сюжет: ${slide.imagePrompt || `${slide.title}. ${slide.body}`}. Продуманная рекламная композиция, интересное освещение, фактуры, крупный главный объект. Изображение заполняет весь кадр, главный объект крупный и целиком помещается. Без белых полей, рамок, карточек, макетов телефонов, постеров внутри картинки и резких прямоугольных подложек. Не оставляй место для заголовка: текст добавляется отдельно. Без надписей, букв, логотипов и водяных знаков. Серия: ${proposal.name}. Палитра: фон ${slide.background||proposal.background}, акцент ${slide.accent||proposal.accent}. Следуй стилизации проекта. Приложенный первый готовый кадр, если есть, задаёт визуальный язык серии, но сюжет нового кадра должен отличаться.`,
        context: { width:Math.round(ratio>=1?1536:1536*ratio),height:Math.round(ratio<1?1536:1536/ratio),topic: options.topic, style: options.projectStyle, framing:'Главный объект целиком в центре кадра. Важные детали не ближе 10% к краям; изображение будет кадрироваться в рамке.' }, references: options.vision ? [...options.references,...(next.slides[0].artwork&&index>0?[next.slides[0].artwork.src]:[])].slice(-3):[],
      },options.signal)
      slide.artwork = await decodeArtwork(result.image)
    } catch (error) { if(options.signal?.aborted) break; failures.push(`Слайд ${index + 1}: ${error instanceof Error ? error.message : 'Не удалось создать изображение.'}`) }
    progress({ ...next, slides: [...next.slides] }, index + 1)
  }
  return { proposal: next, failures }
}
