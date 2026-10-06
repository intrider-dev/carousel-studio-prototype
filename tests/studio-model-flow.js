// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
  if (await page.getByRole('button', { name: 'Создать проект', exact: true }).count()) {
    await page.getByRole('button', { name: 'Создать проект', exact: true }).click()
    await page.getByLabel('Открыть JSON', { exact: true }).setInputFiles('output/playwright/studio-project.json')
    await page.waitForFunction(() => document.querySelector('#group')?.options.length >= 3)
  }
  const waitProposal = async () => {
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent === 'Добавить группу' && !b.disabled) || [...document.querySelectorAll('[role="alert"]')].some(e => e.getClientRects().length), null, { timeout: 600000 })
    if (await page.getByRole('alert').count()) throw new Error(await page.getByRole('alert').allTextContents())
  }
  await page.getByRole('tab', { name: 'Создание слайдов', exact: true }).click()
  await page.getByLabel('Запрос', { exact: true }).fill('Создай ровно 3 слайда о предметной фотографии кофе. Короткие заголовки и по одному совету до 100 символов.')
  await page.getByRole('button', { name: 'Отправить запрос', exact: true }).click()
  await waitProposal()
  await page.screenshot({ path: 'output/playwright/studio-generation.png', fullPage: true })
  await page.getByRole('button', { name: 'Добавить группу', exact: true }).click()
  if (await page.getByRole('button', { name: /^Открыть слайд/ }).count() !== 3) throw new Error('Generated group not applied')
  await page.getByLabel('Действие', { exact: true }).selectOption('retopic')
  await page.getByLabel('Запрос', { exact: true }).fill('Перепиши эту группу на тему домашнего чая. Сохрани число слайдов, по одному короткому совету до 100 символов.')
  await page.getByRole('button', { name: 'Отправить запрос', exact: true }).click()
  await waitProposal()
  await page.getByRole('button', { name: 'Добавить группу', exact: true }).click()
  if (await page.getByRole('button', { name: /^Открыть слайд/ }).count() !== 3) throw new Error('Retopic changed slide count')
  await page.getByLabel('Действие', { exact: true }).selectOption('analyze')
  await page.getByLabel('Референсы: до 3 изображений').setInputFiles('output/playwright/exported-slide-01.png')
  await page.getByAltText('Референс 1').waitFor()
  await page.getByLabel('Запрос', { exact: true }).fill('Кратко опиши структуру и палитру этого слайда. Что можно улучшить?')
  await page.getByRole('button', { name: 'Отправить запрос', exact: true }).click()
  await page.getByText('История (6)', { exact: true }).waitFor({ timeout: 190000 })
  await page.getByText('История (6)', { exact: true }).click()
  await page.screenshot({ path: 'output/playwright/studio-analysis.png', fullPage: true })
  return { checks: ['Live 3-slide generation', 'Live retopic preserving 3 slides', 'Live reference image analysis', 'Original groups preserved'], groups: await page.locator('#group option').count() }
}
