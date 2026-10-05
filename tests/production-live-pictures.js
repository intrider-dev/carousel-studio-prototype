// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
 await page.getByRole('button',{name:'Создать изображения',exact:true}).waitFor()
 const count=await page.getByLabel('Количество слайдов',{exact:true}).inputValue()
 if(count!=='4')throw new Error('Expected four slides')
 await page.screenshot({path:'output/playwright/production-plan.png',fullPage:true})
 await page.getByRole('button',{name:'Создать изображения',exact:true}).click()
 return {startedPictures:true,count:Number(count)}
}
