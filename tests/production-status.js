// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => ({url:page.url(),alerts:await page.getByRole('alert').allTextContents(),status:await page.getByRole('status').allTextContents(),applyEnabled:await page.getByRole('button',{name:'Добавить группу',exact:true}).isEnabled()})
