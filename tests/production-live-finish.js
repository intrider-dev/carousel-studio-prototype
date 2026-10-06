// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
 await page.reload()
 await page.getByRole('button',{name:'Добавить группу',exact:true}).click()
 await page.getByRole('heading',{name:'Редактор слайдов',exact:true}).waitFor()
 await page.getByRole('button',{name:'Свойства',exact:true}).click()
 const slides=page.getByRole('button',{name:/^Открыть слайд/})
 if(await slides.count()!==4)throw new Error('Expected 4 slides')
 for(let i=0;i<4;i++){
  await slides.nth(i).click()
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'PNG',exact:true}).click();await(await download).saveAs(`output/playwright/production-slide-${i+1}.png`)
 }
 for(const [button,file] of [['Сохранить JSON','production-project.json'],['ZIP группы','production-group.zip']]){const download=page.waitForEvent('download');await page.getByRole('button',{name:button,exact:true}).click();await(await download).saveAs('output/playwright/'+file)}
 await slides.first().click()
 await page.getByLabel('Формат экспорта',{exact:true}).selectOption('landscape')
 const dl=page.waitForEvent('download');await page.getByRole('button',{name:'PNG',exact:true}).click();await(await dl).saveAs('output/playwright/production-landscape.png')
 await page.getByLabel('Формат экспорта',{exact:true}).selectOption('project')
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
 await page.screenshot({path:'output/playwright/production-editor.png',fullPage:true})
 await page.getByRole('button',{name:'Проверка серии',exact:true}).click()
 await page.getByText('Критических ошибок нет',{exact:true}).waitFor()
 await page.screenshot({path:'output/playwright/production-quality.png',fullPage:true})
 return {slides:4,quality:await page.getByText('Критических ошибок нет',{exact:true}).textContent(),warnings:await page.getByRole('button',{name:/Слайд [1-4] · Проверить/}).allTextContents()}
}
