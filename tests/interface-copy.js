// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
 const errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.goto('http://localhost:3080/')
 await page.getByRole('heading',{name:'Редактор слайдов',exact:true}).waitFor()
 await page.setViewportSize({width:1600,height:1100})
 await page.getByRole('tab',{name:'Дизайн',exact:true}).click()
 await page.screenshot({path:'output/playwright/compact-editor.png',fullPage:true})
 await page.getByRole('link',{name:'Диалог',exact:true}).click()
 await page.getByRole('heading',{name:'Создание слайдов',exact:true}).waitFor()
 const retired=['Сначала содержание и композиции','Каждый элемент останется редактируемым','Здесь подключён исходный чат','визуальная система']
 const text=await page.locator('main').innerText()
 if(retired.some(s=>text.toLowerCase().includes(s.toLowerCase())))throw new Error('Obsolete explanatory copy remains visible')
 await page.screenshot({path:'output/playwright/compact-generation.png',fullPage:true})
 await page.setViewportSize({width:390,height:844})
 if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw new Error('Mobile overflow')
 await page.screenshot({path:'output/playwright/compact-mobile.png',fullPage:true})
 await page.setViewportSize({width:1600,height:1100})
 const basic=await page.context().newPage()
 await basic.goto('http://localhost:3080/basic')
 await basic.getByRole('heading',{name:'Новая карусель',exact:true}).waitFor()
 await basic.screenshot({path:'output/playwright/compact-template.png',fullPage:true})
 await basic.close()
 if(errors.length)throw new Error(errors.join(';'))
 return {screens:['editor','generation','mobile','template'],retiredCopy:'absent',mobileOverflow:false,runtimeErrors:0}
}
