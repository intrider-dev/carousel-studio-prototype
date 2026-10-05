// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async(page)=>{
 await page.getByRole('button',{name:'Иллюстрация',exact:true}).click()
 await page.getByRole('link',{name:'Диалог',exact:true}).click();await page.getByLabel('Действие',{exact:true}).selectOption('image');await page.getByLabel('Контекст',{exact:true}).selectOption('slide')
 await page.getByText('Настройки',{exact:false}).first().click();await page.locator('#model').selectOption('google/gemini-2.5-flash-image');await page.getByLabel('Применить изображение',{exact:true}).selectOption('replace')
 await page.getByLabel('Запрос',{exact:true}).fill('Отредактируй приложенную фотографию лестницы: сохрани саму лестницу и её форму, сделай фон светлым холодным серым, а свет ступеней насыщенным фиолетовым и голубым. Крупная выразительная композиция, без надписей, рамок и белых полей. Это самостоятельная иллюстрация.')
 await page.getByRole('button',{name:'Отправить запрос',exact:true}).click();return {started:true,reference:'current-picture',model:'google/gemini-2.5-flash-image'}
}
