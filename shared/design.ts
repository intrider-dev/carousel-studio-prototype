import { z } from 'zod'
import { hex, pictureSource } from './proposal.ts'

export const scenarioLabels = { educational:'Обучение', selling:'Продажа', expert:'Экспертный разбор', case:'Кейс', comparison:'Сравнение', faq:'Вопросы и ответы', checklist:'Чек-лист', story:'История' } as const
export const briefSchema = z.object({ scenario:z.enum(Object.keys(scenarioLabels) as [keyof typeof scenarioLabels,...(keyof typeof scenarioLabels)[]]).default('educational'), audience:z.string().max(300).default(''), goal:z.string().max(300).default(''), callToAction:z.string().max(100).default(''), count:z.number().int().min(1).max(12).default(6) })
export const brandSchema = z.object({ enabled:z.boolean().default(false), name:z.string().max(60).default(''), contact:z.string().max(100).default(''), background:hex.default('#f5f2eb'), foreground:hex.default('#20201d'), accent:hex.default('#ba462d'), headingFont:z.string().max(100).default('Playfair Display Variable'), bodyFont:z.string().max(100).default('Manrope Variable'), logo:pictureSource.optional(), logoAspect:z.number().positive().max(100).optional() })
export const directions = {
  auto:{label:'По теме', description:'Палитра и типографика по вашему описанию', heading:'Manrope Variable',body:'Manrope Variable',background:'#ffffff',foreground:'#171717',accent:'#ba462d',style:'Выбери выразительное направление по теме. Избегай шаблонных украшений.'},
  editorial:{label:'Журнальный',description:'Крупная антиква, спокойные поля, фактуры',heading:'Playfair Display Variable',body:'Manrope Variable',background:'#f3eee5',foreground:'#24221f',accent:'#a94c31',style:'Редакционный дизайн премиального журнала. Тактильные материалы, естественный свет, крупные контрастные заголовки, много свободного пространства.'},
  bold:{label:'Смелый',description:'Крупный текст, цвет и объём',heading:'Manrope Variable',body:'Manrope Variable',background:'#111322',foreground:'#ffffff',accent:'#8858ff',style:'Современная рекламная графика. Глубокий чернильный фон, фиолетовые и голубые световые акценты, один крупный объёмный объект с выразительным силуэтом, студийный свет и фактура. Без рамок, макетов устройств и плакатов внутри кадра.'},
  minimal:{label:'Чистый',description:'Строгая сетка и ясная иерархия',heading:'Manrope Variable',body:'Manrope Variable',background:'#f7f8f6',foreground:'#172824',accent:'#317061',style:'Чистый минималистичный дизайн. Строгая сетка, ясная визуальная иерархия, простая предметная фотография, свободное пространство. Без звёзд, стрелок и лишних декоративных деталей.'},
  luxe:{label:'Премиальный',description:'Глубокие цвета, элегантные шрифты',heading:'Cormorant Garamond Variable',body:'Montserrat Variable',background:'#202722',foreground:'#f5eedf',accent:'#d5b982',style:'Элегантный премиальный дизайн. Глубокие природные цвета, мягкий направленный свет, благородные фактуры, выразительная антиква. Лаконичная композиция без клише и значков.'},
} as const
export const directionSchema=z.enum(['auto','editorial','bold','minimal','luxe'])
export type Brief=z.infer<typeof briefSchema>
export type Brand=z.infer<typeof brandSchema>
export type Direction=z.infer<typeof directionSchema>
