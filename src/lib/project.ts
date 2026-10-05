export type Slide = { title: string; body: string }
export type Project = { version: 1; brand: string; contact: string; logo: string; slides: Slide[] }
export const storageKey = 'carousel-studio:project:v1'
export const roles = ['Обложка', 'Пункт 1', 'Пункт 2', 'Пункт 3', 'Пункт 4', 'Призыв к действию']

export function createProject(): Project {
  return {
    version: 1, brand: 'Студия контента', contact: '@yourbrand', logo: '',
    slides: [
      { title: 'Перед тем как нажать «Опубликовать»', body: '4 проверки, которые сделают ваш пост понятнее. Сохраните этот чек-лист для следующей публикации.' },
      { title: 'Один пост, одна мысль', body: 'Сформулируйте главную идею одним предложением. Уберите всё, что не помогает её раскрыть.' },
      { title: 'Заголовок обещает пользу', body: 'Скажите, что читатель узнает или сможет сделать. Замените общие слова конкретным результатом.' },
      { title: 'Текст легко читать', body: 'Разбейте длинные предложения. Проверьте опечатки и прочитайте текст вслух: он должен звучать естественно.' },
      { title: 'Понятен следующий шаг', body: 'Попросите сделать одно действие: сохранить пост, ответить на вопрос или написать вам. Проверьте ссылку и контакты.' },
      { title: 'Сохраните перед публикацией', body: 'Одна мысль. Понятная польза. Читаемый текст. Следующий шаг. Нужна помощь с контентом? Напишите нам.' },
    ],
  }
}

export function isProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false
  const p = value as Project
  return p.version === 1 && typeof p.brand === 'string' && p.brand.length <= 40
    && typeof p.contact === 'string' && p.contact.length <= 60
    && typeof p.logo === 'string' && p.logo.length < 1_500_000
    && (!p.logo || /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(p.logo))
    && Array.isArray(p.slides) && p.slides.length === 6
    && p.slides.every(s => s && typeof s.title === 'string' && s.title.length <= 80
      && typeof s.body === 'string' && s.body.length <= 220)
}

export function restoreProject(raw: string | null): Project | null {
  try { const value: unknown = JSON.parse(raw ?? 'null'); return isProject(value) ? value : null } catch { return null }
}

export function validateProject(p: Project): string | null {
  if (!isProject(p)) return 'Данные проекта повреждены. Начните с примера.'
  if (!p.brand.trim()) return 'Укажите название бренда.'
  const empty = p.slides.findIndex(s => !s.title.trim() || !s.body.trim())
  return empty >= 0 ? `Заполните заголовок и текст слайда ${empty + 1}.` : null
}
