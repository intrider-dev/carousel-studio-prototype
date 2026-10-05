// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
  const checks = []
  const check = (ok, label) => { if (!ok) throw new Error(label); checks.push(label) }
  await page.goto('http://localhost:3080/chat')
  const chat = page.frameLocator('iframe[title="Чат исходного проекта"]')
  await page.getByRole('button', { name: 'Передать текущий слайд', exact: true }).click()
  const draft = chat.getByRole('textbox', { name: 'Ваше сообщение', exact: true })
  await page.waitForFunction(() => document.querySelector('iframe').contentDocument.querySelector('textarea').value.includes('Контекст:'))
  check((await draft.inputValue()).includes('1080'), 'Current slide context reaches original chat draft')
  await page.getByRole('button', { name: 'Передать группу', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('iframe').contentDocument.querySelector('textarea').value.includes('группу слайдов'))
  check((await draft.inputValue()).includes('slides'), 'Group context reaches original chat draft')
  await draft.fill('Предложи один короткий совет для слайда о предметной фотографии кофе. Ответ до 200 символов.')
  const replies = await chat.getByRole('button', { name: 'В слайды', exact: true }).count()
  await chat.getByRole('button', { name: 'Отправить сообщение', exact: true }).click()
  await chat.getByRole('button', { name: 'В слайды', exact: true }).nth(replies).waitFor({ timeout: 120000 })
  checks.push('Original chat receives real model response')
  await chat.getByRole('button', { name: 'В слайды', exact: true }).last().click()
  await page.getByLabel('Текст из чата', { exact: true }).waitFor()
  check((await page.getByLabel('Текст из чата', { exact: true }).inputValue()).length > 20, 'Response transferred back into studio')
  await page.screenshot({ path: 'output/playwright/studio-chat.png', fullPage: true })
  await page.getByLabel('Что создать', { exact: true }).selectOption('slide')
  await page.getByRole('button', { name: 'Создать слайды из ответа', exact: true }).click()
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent === 'Добавить слайд' && !b.disabled) || document.querySelector('[role="alert"]'), null, { timeout: 300000 })
  if (await page.getByRole('alert').count()) throw new Error(await page.getByRole('alert').allTextContents())
  await page.getByRole('button', { name: 'Добавить слайд', exact: true }).click()
  await page.getByRole('heading', { name: 'Редактор слайдов', exact: true }).waitFor()
  check(await page.getByRole('button', { name: 'Основной текст', exact: true }).isVisible(), 'Chat response becomes editable slide')
  await page.getByRole('link', { name: 'Диалог', exact: true }).click()
  await chat.getByRole('button', { name: 'В слайды', exact: true }).last().waitFor()
  checks.push('Original conversation persists after leaving and reopening page')
  return { passed: checks.length, checks }
}
