// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
  await page.setViewportSize({ width: 1600, height: 1100 })
  if (await page.getByRole('heading', { name: 'Новая карусель', exact: true }).count()) {
  await page.getByLabel('Соотношение сторон').selectOption('4:5')
  await page.getByLabel('Тема *', { exact: true }).fill('Как создать полезную обучающую карусель')
  await page.getByLabel('Стиль', { exact: true }).fill('Минимализм, белый фон, крупная типографика, объёмные фиолетовые, синие и розовые предметы с мягкими тенями.')
  await page.getByRole('button', { name: 'Создать проект', exact: true }).click()
  await page.getByRole('link', { name: 'Диалог', exact: true }).click()
  }
  await page.locator('#image-model option').nth(1).waitFor({ state: 'attached' })
  await page.getByLabel('Запрос', { exact: true }).fill('Создай ровно 3 слайда обучающей карусели «Как создать полезную карусель». Первый: обещание пользы. Второй: одна мысль на слайд. Третий: сохранить и применить. Заголовки до 6 слов, пояснения до 100 символов. Иллюстрации: объёмная мишень со стрелой, стопка карточек, закладка с галочкой. Без текста на картинках.')
  await page.getByRole('button', { name: 'Отправить запрос', exact: true }).click()
  return { started: true, imageModel: await page.locator('#image-model').inputValue() }
}
