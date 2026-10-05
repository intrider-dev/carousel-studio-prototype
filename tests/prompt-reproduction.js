// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
  if (await page.getByRole('button', { name: 'Создать проект', exact: true }).count()) await page.getByRole('button', { name: 'Создать проект', exact: true }).click()
  await page.getByRole('button', { name: 'Передать текущий слайд', exact: true }).waitFor()
  await page.frameLocator('iframe').getByRole('textbox', { name: 'Ваше сообщение', exact: true }).waitFor()
  const frame = page.frames().find(f => f.url().includes('/legacy/'))
  const source = Array.from({ length: 6 }, (_, i) => `**Слайд ${i + 1}**\nНазвание: В поисках смысла жизни ${i + 1}\nТекст: Заметьте, после каких дел вы чувствуете себя живым. Что я сделал сегодня, что меня по-настоящему зарядило? С кем мне легче дышится? Сохраните этот вопрос и вернитесь к нему вечером.\nИзображение: блокнот и чашка чая у окна.\n`).join('\n---\n')
  await frame.evaluate(text => parent.postMessage({ type: 'studio:response', text }, location.origin), source)
  await page.getByLabel('Текст из чата', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Добавить ответ новой группой', exact: true }).click()
  const message = await page.getByRole('alert').innerText()
  if (!message.includes('1000')) throw new Error('Original failure did not reproduce')
  return { sourceLength: source.length, reproduced: message }
}
