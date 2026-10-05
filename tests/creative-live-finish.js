// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
  await page.getByRole('button',{name:'Добавить группу',exact:true}).click()
  await page.getByRole('heading',{name:'Редактор слайдов',exact:true}).waitFor()
  await page.setViewportSize({width:1600,height:1100})
  await page.screenshot({path:'output/playwright/creative-editor.png',fullPage:true})
  for(const [button,file] of [['Сохранить JSON','creative-project.json'],['ZIP группы','creative-group.zip']]) {
    const download=page.waitForEvent('download'); await page.getByRole('button',{name:button,exact:true}).click(); await(await download).saveAs('output/playwright/'+file)
  }
  const slides=page.getByRole('button',{name:/^Открыть слайд/})
  for(let i=0;i<await slides.count();i++) {
    await slides.nth(i).click()
    const download=page.waitForEvent('download'); await page.getByRole('button',{name:'PNG',exact:true}).click(); await(await download).saveAs(`output/playwright/creative-slide-${i+1}.png`)
  }
  return {slides:await slides.count(),url:page.url()}
}
