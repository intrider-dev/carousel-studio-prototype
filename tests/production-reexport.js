// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
 await page.reload();await page.getByRole('heading',{name:'Редактор слайдов',exact:true}).waitFor()
 await page.locator('#group').selectOption(await page.locator('#group option').last().getAttribute('value'))
 await page.getByRole('button',{name:'Дизайн',exact:true}).click()
 await page.getByRole('button',{name:'Свойства',exact:true}).click()
 const slides=page.getByRole('button',{name:/^Открыть слайд/})
 for(let i=0;i<4;i++){
  await slides.nth(i).click()
  const labels=page.getByRole('button',{name:'Подпись',exact:true})
  for(let n=0;n<await labels.count();n++){await labels.nth(n).click();const y=Number(await page.getByLabel('Y',{exact:true}).inputValue());if(y>1250){await page.getByLabel('Y',{exact:true}).fill('1269');await page.getByLabel('Y',{exact:true}).press('Tab')}}
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'PNG',exact:true}).click();await(await download).saveAs(`output/playwright/production-slide-${i+1}.png`)
 }
 for(const [button,file] of [['Сохранить JSON','production-project.json'],['ZIP группы','production-group.zip']]){const download=page.waitForEvent('download');await page.getByRole('button',{name:button,exact:true}).click();await(await download).saveAs('output/playwright/'+file)}
 await slides.first().click();await page.getByLabel('Формат экспорта',{exact:true}).selectOption('landscape')
 const dl=page.waitForEvent('download');await page.getByRole('button',{name:'PNG',exact:true}).click();await(await dl).saveAs('output/playwright/production-landscape.png')
 await page.getByLabel('Формат экспорта',{exact:true}).selectOption('project')
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
 await page.screenshot({path:'output/playwright/production-editor.png',fullPage:true})
 await page.getByRole('button',{name:'Проверка серии',exact:true}).click();await page.getByText('Критических ошибок нет',{exact:true}).waitFor()
 await page.waitForFunction(()=>[...document.querySelectorAll('p')].some(x=>x.textContent==='Серия прошла техническую проверку.'))
 await page.screenshot({path:'output/playwright/production-quality.png',fullPage:true})
 return {slides:4,quality:'No remaining technical warnings',sourceFooter:'Adjusted in editor'}
}
