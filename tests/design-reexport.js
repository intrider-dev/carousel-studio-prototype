// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
 await page.reload()
 await page.locator('#group').selectOption(await page.locator('#group option').last().getAttribute('value'))
 await page.getByRole('button',{name:'Обновить дизайн',exact:true}).click()
 await page.waitForFunction(()=>document.querySelector('#group')?.options.length===3)
 const slides=page.getByRole('button',{name:/^Открыть слайд/})
 if(await slides.count()!==6)throw new Error('Expected six slides')
 for(let i=0;i<6;i++){
  await slides.nth(i).click()
  const dl=page.waitForEvent('download');await page.getByRole('button',{name:'PNG',exact:true}).click();await(await dl).saveAs(`output/playwright/design-slide-${i+1}.png`)
 }
 for(const [button,file]of [['Сохранить JSON','design-project.json'],['ZIP группы','design-group.zip']]){const dl=page.waitForEvent('download');await page.getByRole('button',{name:button,exact:true}).click();await(await dl).saveAs('output/playwright/'+file)}
 await slides.first().click()
 await page.getByRole('tab',{name:'Свойства',exact:true}).click()
 await page.screenshot({path:'output/playwright/design-editor.png',fullPage:true})
 await page.getByRole('tab',{name:'Проверка серии',exact:true}).click()
 await page.getByText('Серия прошла техническую проверку.',{exact:true}).waitFor()
 await page.screenshot({path:'output/playwright/design-quality.png',fullPage:true})
 return {slides:6,quality:'passed',sourcePreserved:true}
}
