// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
  await page.getByRole('link', { name: 'Диалог', exact: true }).click()
  await page.getByLabel('Что создать', { exact: true }).selectOption('slide')
  await page.getByLabel('Оформление', { exact: true }).selectOption('dark')
  await page.getByLabel('Изображения', { exact: true }).selectOption('photo')
  await page.getByLabel('Запрос', { exact: true }).fill('Создай один слайд о кофе с заголовком «Начни утро со вкуса». Текст: «Свежие зёрна. Точный помол. Твой идеальный кофе.» На изображении красивая чашка капучино с латте-артом на тёмном фоне. Предметная рекламная фотография. Никаких 3D-объектов и надписей на фото.')
  await page.getByRole('button', { name: 'Отправить запрос', exact: true }).click()
  return { started: true }
}
