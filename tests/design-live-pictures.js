// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
 await page.getByRole('button',{name:'Создать изображения',exact:true}).waitFor()
 await page.screenshot({path:'output/playwright/design-plan.png',fullPage:true})
 await page.getByRole('button',{name:'Создать изображения',exact:true}).click()
 return {startedPictures:true}
}
