// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
 const checks=[],errors=[],check=(ok,label)=>{if(!ok)throw new Error(label);checks.push(label)}
 page.on('pageerror',e=>errors.push(e.message))
 await page.goto('http://localhost:3080/basic')
 await page.getByRole('heading',{name:'Новая карусель',exact:true}).waitFor()
 check(await page.getByRole('link',{name:'Простой шаблон',exact:true}).getAttribute('aria-current')==='page','Basic navigation identifies its active page')
 await page.getByLabel('Название бренда *',{exact:true}).fill('FORM')
 await page.getByLabel('Контакт или подпись',{exact:true}).fill('@form')
 await page.getByRole('button',{name:'К слайдам',exact:true}).click()
 await page.getByRole('heading',{name:'Отредактируйте слайды',exact:true}).waitFor()
 check(await page.getByRole('heading',{name:'Отредактируйте слайды',exact:true}).evaluate(e=>e===document.activeElement),'Step navigation moves focus to the new heading')
 await page.getByLabel('Заголовок *',{exact:true}).fill('Перед публикацией')
 await page.getByRole('button',{name:'К просмотру',exact:true}).click()
 await page.getByRole('heading',{name:'Скачать карусель',exact:true}).waitFor()
 const preview=page.getByRole('region',{name:'Просмотр слайдов. Используйте стрелки влево и вправо.',exact:true})
 await preview.focus();await page.keyboard.press('ArrowRight')
 check(await page.getByRole('button',{name:'Скачать слайд 2',exact:true}).isVisible(),'Keyboard changes the slide and its download target')
 const download=page.waitForEvent('download')
 await page.getByRole('button',{name:'Скачать ZIP',exact:true}).click()
 await (await download).saveAs('output/playwright/basic-navigation.zip')
 await page.getByText('ZIP скачан.',{exact:true}).waitFor()
 check(await page.getByRole('button',{name:'Скачать ZIP',exact:true}).isEnabled(),'ZIP export completes and restores controls')
 for(const width of [320,390,768]){
  await page.setViewportSize({width,height:900})
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Basic preview has no page overflow at ${width}px`)
 }
 await page.getByRole('button',{name:'К текстам',exact:true}).click()
 await page.getByRole('button',{name:/^Редактировать слайд 1:/}).click()
 check(await page.getByLabel('Заголовок *',{exact:true}).inputValue()==='Перед публикацией','Returning from download preserves the edited text')
 await page.reload()
 check(await page.getByLabel('Название бренда *',{exact:true}).inputValue()==='FORM','Reload restores the basic project')
 await page.getByRole('link',{name:'Редактор',exact:true}).click()
 await page.getByRole('heading',{name:'Редактор слайдов',exact:true}).waitFor()
 check(await page.locator('#group option').count()>0,'Basic navigation returns to the independent saved editor project')
 check(errors.length===0,'No runtime errors in the basic flow')
 return {passed:checks.length,checks}
}
