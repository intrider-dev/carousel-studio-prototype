// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
  await page.setViewportSize({width:1600,height:1100})
  await page.getByRole('heading',{name:'Новая карусель',exact:true}).waitFor()
  await page.getByLabel('Тема *',{exact:true}).fill('Кофе как искусство. Авторская кофейня Atelier Coffee')
  await page.getByLabel('Стиль',{exact:true}).fill('Редакционный дизайн премиального журнала: кремовая бумага, глубокий кофейный, терракота. Выразительные заголовки с засечками, чистый гротеск для пояснений. Кинематографический свет, тактильная керамика, пар, зерно, очень выразительные предметные фотографии. Никакого фиолетового.')
  await page.getByRole('button',{name:'Создать проект',exact:true}).click()
  await page.getByRole('link',{name:'Диалог',exact:true}).click()
  await page.waitForFunction(()=>document.querySelector('#model')?.options.length>2)
  if(await page.locator('#model option[value="openai/gpt-4.1"]').count())await page.locator('#model').selectOption('openai/gpt-4.1')
  await page.getByLabel('Изображения',{exact:true}).selectOption('cinematic')
  await page.getByLabel('Запрос',{exact:true}).fill('Создай ровно 4 готовых слайда для Atelier Coffee: 1) Кофе как искусство, обложка poster. 2) Вкус рождается в деталях, editorial. 3) Твой маленький ритуал, split. 4) Замедлись. Попробуй., finale. Это готовые рекламные тексты, не советы дизайнеру. На каждом короткий заголовок, основной текст до 100 символов, короткая рубрика и подпись Atelier Coffee. Уместные геометрические акценты. Заголовки Playfair Display Variable или Cormorant Garamond Variable, пояснения Manrope Variable. Общая кремово-кофейная палитра с терракотовым акцентом. Четыре разных сюжета: керамическая чашка с паром, россыпь зёрен и помол, утро у окна с кофе, красивый капучино крупным планом. Без надписей на фотографиях.')
  await page.getByRole('button',{name:'Отправить запрос',exact:true}).click()
  return {started:true,model:await page.locator('#model').inputValue()}
}
