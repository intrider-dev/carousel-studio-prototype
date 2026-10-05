// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
 await page.goto('http://localhost:3080/')
 await page.waitForFunction(()=>[...document.querySelectorAll('h1')].some(e=>['Новая карусель','Редактор слайдов'].includes(e.textContent)))
 if(await page.getByRole('button',{name:'Создать проект',exact:true}).count())await page.getByRole('button',{name:'Создать проект',exact:true}).click()
 await page.getByRole('heading',{name:'Редактор слайдов',exact:true}).waitFor()
 await page.getByLabel('Открыть JSON',{exact:true}).setInputFiles('output/playwright/production-project.json')
 await page.waitForFunction(()=>document.querySelectorAll('#group option').length>=2)
 await page.locator('#group').selectOption(await page.locator('#group option').last().getAttribute('value'))
 await page.waitForFunction(()=>document.querySelectorAll('button[aria-label^="Открыть слайд"]').length===4)
 await page.setViewportSize({width:1600,height:1100})
 await page.getByRole('button',{name:'Дизайн',exact:true}).click()
 await page.getByRole('button',{name:'Свойства',exact:true}).click()
 await page.waitForFunction(()=>{const images=[...document.querySelectorAll('button[aria-label^="Открыть слайд"] img')];return images.length===4&&images.every(e=>e.complete&&e.naturalWidth>0)})
 await page.waitForFunction(()=>document.querySelector('header [role="status"]')?.textContent==='Сохранено в этом браузере')
 await page.screenshot({path:'docs/screenshots/editor.png',fullPage:true})
 await page.getByRole('button',{name:'Проверка серии',exact:true}).click()
 await page.getByText('Серия прошла техническую проверку.',{exact:true}).waitFor()
 await page.screenshot({path:'docs/screenshots/review.png',fullPage:true})
 await page.getByRole('button',{name:'Бриф и бренд',exact:true}).click()
 await page.screenshot({path:'docs/screenshots/brand.png',fullPage:true})
 return {screenshots:3,slides:4}
}
