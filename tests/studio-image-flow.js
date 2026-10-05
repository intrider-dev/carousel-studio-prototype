// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
  await page.reload()
  await page.getByRole('button', { name: 'Создание слайдов', exact: true }).click()
  await page.getByLabel('Действие', { exact: true }).selectOption('image')
  await page.getByLabel('Модель', { exact: true }).selectOption('google/gemini-2.5-flash-image')
  await page.getByLabel('Запрос', { exact: true }).fill('Одна белая чашка кофе на светлом столе у окна. Естественная предметная фотография, без текста, вертикальный кадр 4:5.')
  await page.getByRole('button', { name: 'Отправить запрос', exact: true }).click()
  await page.getByRole('button', { name: 'Добавить фото в текущий слайд', exact: true }).waitFor({ timeout: 190000 })
  await page.screenshot({ path: 'output/playwright/studio-photo-result.png', fullPage: true })
  await page.getByRole('button', { name: 'Добавить фото в текущий слайд', exact: true }).click()
  await page.getByRole('button', { name: 'Свойства', exact: true }).click()
  await page.getByLabel('Название слоя', { exact: true }).waitFor()
  await page.getByLabel('Название слоя', { exact: true }).fill('Сгенерированное фото')
  return { passed: ['Live photo generation', 'Preview before applying', 'Photo inserted as editable layer'] }
}
