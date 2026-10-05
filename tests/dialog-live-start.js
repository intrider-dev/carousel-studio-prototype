// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async(page)=>{
 await page.setViewportSize({width:1600,height:1100})
 if(await page.getByRole('button',{name:'Создать проект',exact:true}).count())await page.getByRole('button',{name:'Создать проект',exact:true}).click()
 await page.getByLabel('Открыть JSON',{exact:true}).setInputFiles('output/playwright/design-project.json')
 await page.waitForFunction(()=>document.querySelector('#group')?.options.length===3)
 await page.locator('#group').selectOption(await page.locator('#group option').last().getAttribute('value'))
 const dl=page.waitForEvent('download');await page.getByRole('button',{name:'Сохранить JSON',exact:true}).click();await(await dl).saveAs('output/playwright/dialog-before.json')
 await page.getByRole('link',{name:'Диалог',exact:true}).click()
 await page.getByLabel('Действие',{exact:true}).selectOption('edit')
 await page.getByLabel('Контекст',{exact:true}).selectOption('group')
 await page.getByText('Настройки',{exact:false}).first().click()
 await page.waitForFunction(()=>document.querySelector('#model')?.options.length>2)
 await page.locator('#model').selectOption('openai/gpt-4.1')
 await page.getByLabel('Запрос',{exact:true}).fill('Переименуй текущую группу в «Мой ориентир». На четвёртом слайде замени только основной текст на «Выберите одно действие на завтра. Запишите его сейчас.». На первом слайде убери градиент заголовка и оставь белый текст. Все фотографии, шрифты, координаты, прочие тексты и порядок слайдов сохрани. Не добавляй новые слайды или группы.')
 await page.getByRole('button',{name:'Отправить запрос',exact:true}).click()
 return {started:true,model:'openai/gpt-4.1',scope:'group'}
}
