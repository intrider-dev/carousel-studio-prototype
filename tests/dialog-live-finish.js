// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async(page)=>{
 await page.getByRole('button',{name:'Применить изменения',exact:true}).waitFor()
 await page.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Применить изменения')?.disabled)
 await page.screenshot({path:'output/playwright/dialog-preview.png',fullPage:true})
 await page.getByRole('button',{name:'Применить изменения',exact:true}).click()
 await page.getByRole('link',{name:'Редактор',exact:true}).click()
 await page.waitForFunction(()=>document.querySelector('header [role="status"]')?.textContent==='Сохранено в этом браузере')
 for(const [button,file]of [['Сохранить JSON','dialog-after.json'],['ZIP группы','dialog-live.zip']]){const dl=page.waitForEvent('download');await page.getByRole('button',{name:button,exact:true}).click();await(await dl).saveAs('output/playwright/'+file)}
 await page.getByRole('button',{name:/^Открыть слайд 4/}).click()
 await page.getByRole('button',{name:'Свойства',exact:true}).click()
 await page.screenshot({path:'output/playwright/dialog-edited.png',fullPage:true})
 return {group:await page.locator('#group-name').inputValue().catch(()=>page.locator('#group option:checked').textContent()),slides:await page.getByRole('button',{name:/^Открыть слайд/}).count()}
}
