// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async(page)=>{
 await page.reload();await page.locator('#group').selectOption(await page.locator('#group option').last().getAttribute('value'))
 await page.getByRole('button',{name:/^Открыть слайд 4/}).click()
 await page.getByRole('link',{name:'Диалог',exact:true}).click()
 await page.getByLabel('Действие',{exact:true}).selectOption('redesign');await page.getByLabel('Контекст',{exact:true}).selectOption('slide')
 await page.getByLabel('Запрос',{exact:true}).fill('Переделай текущий слайд в светлую журнальную композицию poster. Белый фон, чёрный заголовок, синий акцент. Существующую картинку сохрани. Заголовок «Один шаг на завтра», основной текст «Запишите одно действие, которое хотите попробовать завтра.». Сделай крупный заголовок и ясную иерархию. Только один слайд, без новых групп.')
 await page.getByRole('button',{name:'Отправить запрос',exact:true}).click();return {started:true,scope:'slide',reusePictures:true}
}
