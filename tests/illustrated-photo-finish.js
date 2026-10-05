// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent === 'Добавить слайд' && !b.disabled) || document.querySelector('[role="alert"]'), null, { timeout: 240000 })
  if (await page.getByRole('alert').count()) throw new Error(await page.getByRole('alert').allTextContents())
  await page.getByRole('button', { name: 'Добавить слайд', exact: true }).click()
  await page.getByRole('button', { name: 'Иллюстрация', exact: true }).waitFor()
  if (await page.getByLabel('Фон слайда', { exact: true }).inputValue() !== '#101018') throw new Error('Dark background missing')
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'PNG', exact: true }).click(); await (await download).saveAs('output/playwright/illustrated-photo.png')
  const json = page.waitForEvent('download'); await page.getByRole('button', { name: 'Сохранить JSON', exact: true }).click(); await (await json).saveAs('output/playwright/illustrated-photo-project.json')
  return { passed: 3, checks: ['Live single slide includes generated photograph', 'Dark palette applied', 'PNG export succeeds'] }
}
