// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
  await page.goto('http://localhost:3080/chat')
  await page.frameLocator('iframe').getByRole('textbox', { name: 'Ваше сообщение', exact: true }).waitFor()
  const frame = page.frames().find(f => f.url().includes('/legacy/'))
  await frame.evaluate(() => parent.postMessage({ type: 'studio:response', text: 'Описание слайда и полезный совет.\n'.repeat(100) }, location.origin))
  const area = page.getByLabel('Текст из чата', { exact: true })
  await area.waitFor()
  if ((await area.boundingBox()).height > 260) throw new Error('Long answer covers the creation panel')
  await page.setViewportSize({ width: 390, height: 844 })
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Horizontal overflow')
  await page.setViewportSize({ width: 1600, height: 1100 })
  await page.getByRole('button', { name: 'Убрать текст', exact: true }).click()
  await page.getByRole('link', { name: 'Редактор', exact: true }).click()
  if (await page.locator('#group option').count() < 3) throw new Error('Generated groups not restored')
  return { passed: ['Long response field height bounded', 'Mobile layout fits', 'Generated groups survive reload'] }
}
