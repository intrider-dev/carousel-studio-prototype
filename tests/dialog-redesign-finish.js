// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async(page)=>{
 await page.getByRole('button',{name:'Заменить текущие слайды',exact:true}).waitFor()
 await page.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Заменить текущие слайды')?.disabled)
 await page.waitForFunction(()=>document.querySelectorAll('img[alt="Один шаг на завтра"]').length>0)
 await page.screenshot({path:'output/playwright/dialog-redesign-preview.png',fullPage:true})
 await page.getByRole('button',{name:'Заменить текущие слайды',exact:true}).click()
 await page.waitForFunction(()=>document.querySelector('header [role="status"]')?.textContent==='Сохранено в этом браузере')
 const dl=page.waitForEvent('download');await page.getByRole('button',{name:'Сохранить JSON',exact:true}).click();await(await dl).saveAs('output/playwright/dialog-redesigned.json')
 await page.getByRole('button',{name:'Свойства',exact:true}).click()
 await page.screenshot({path:'output/playwright/dialog-redesigned.png',fullPage:true})
 return {title:await page.getByRole('button',{name:/^Открыть слайд 4/}).textContent(),slides:await page.getByRole('button',{name:/^Открыть слайд/}).count()}
}
