// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async(page)=>{
 await page.getByRole('button',{name:'Заменить фото на слайде',exact:true}).waitFor()
 await page.screenshot({path:'output/playwright/dialog-photo-preview.png',fullPage:true})
 await page.getByRole('button',{name:'Заменить фото на слайде',exact:true}).click();await page.getByRole('link',{name:'Редактор',exact:true}).click()
 await page.waitForFunction(()=>document.querySelector('header [role="status"]')?.textContent==='Сохранено в этом браузере')
 for(const [button,file]of [['Сохранить JSON','dialog-photo.json'],['ZIP группы','dialog-final.zip']]){const dl=page.waitForEvent('download');await page.getByRole('button',{name:button,exact:true}).click();await(await dl).saveAs('output/playwright/'+file)}
 await page.getByRole('tab',{name:'Свойства',exact:true}).click();await page.screenshot({path:'output/playwright/dialog-final.png',fullPage:true})
 return {photoApplied:true}
}
