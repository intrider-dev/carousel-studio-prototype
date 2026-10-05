// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
  const checks = []
  const check = (ok, label) => { if (!ok) throw new Error(label); checks.push(label) }
  const saved = await page.evaluate(() => new Promise(resolve => {
    const open = indexedDB.open('carousel-studio', 1)
    open.onsuccess = () => { const req = open.result.transaction('documents').objectStore('documents').get('current'); req.onsuccess = () => { resolve(req.result); open.result.close() } }
  }))
  const original = saved.groups.find(g => g.slides.length === 3 && g.slides.every(s => s.elements.some(e => e.type === 'image')))
  const fixture = { name: original.name, slides: original.slides.map(s => ({ title: s.title, body: s.elements.find(e => e.name === 'Основной текст').text, imagePrompt: s.title })) }
  const images = original.slides.map(s => s.elements.find(e => e.type === 'image').src)
  let imageCalls = 0
  let textCalls = 0
  let sentSource = ''
  await page.goto('http://localhost:3080/chat')
  await page.frameLocator('iframe').getByRole('textbox', { name: 'Ваше сообщение', exact: true }).waitFor()
  const source = fixture.slides.map((s, i) => `**Слайд ${i + 1}**\n${s.title}\n${s.body}\n${'Подробное пояснение темы и пользы для читателя. '.repeat(12)}`).join('\n---\n')
  await page.frames().find(f => f.url().includes('/legacy/')).evaluate(text => parent.postMessage({ type: 'studio:response', text }, location.origin), source)
  await page.route('**/studio-api/complete', route => {
    const body = route.request().postDataJSON()
    if (body.action !== 'image') { textCalls++; sentSource = body.sourceText; return route.fulfill({ json: { text: JSON.stringify(fixture) } }) }
    imageCalls++
    if (imageCalls === 2) return route.fulfill({ status: 502, json: { error: 'Контрольный сбой изображения' } })
    return route.fulfill({ json: { image: images[imageCalls === 4 ? 1 : (imageCalls - 1) % 3] } })
  })
  await page.getByRole('button', { name: 'Создать слайды из ответа', exact: true }).click()
  await page.getByRole('button', { name: 'Повторить недостающие', exact: true }).waitFor()
  check(source.length > 1000 && sentSource === source, 'Long chat response sent intact with automatic pictures')
  check(imageCalls === 3 && textCalls === 1, 'Image failure does not stop remaining slides')
  check(await page.getByRole('button', { name: 'Добавить группу', exact: true }).isDisabled(), 'Incomplete illustrated group cannot be applied silently')
  check(await page.getByLabel('Текст из чата', { exact: true }).inputValue() === source, 'Source preserved after partial image failure')
  await page.getByRole('button', { name: 'Повторить недостающие', exact: true }).click()
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent === 'Добавить группу' && !b.disabled))
  check(imageCalls === 4 && textCalls === 1, 'Retry only requests the failed picture, without regenerating text')
  await page.getByLabel('Предпросмотр группы', { exact: true }).locator('img').nth(2).waitFor()
  await page.getByLabel('Предпросмотр группы', { exact: true }).screenshot({ path: 'output/playwright/illustrated-preview.png' })
  await page.getByRole('button', { name: 'Добавить группу', exact: true }).click()
  await page.getByRole('heading', { name: 'Редактор слайдов', exact: true }).waitFor()
  check(await page.locator('#group option').count() === saved.groups.length + 1, 'Recovered group added without replacing existing groups')
  const count = await page.getByRole('button', { name: /^Открыть слайд/ }).count()
  await page.getByRole('button', { name: 'Заголовок', exact: true }).click()
  await page.getByLabel('Текст слоя', { exact: true }).fill('Как создать полезную карусель?')
  check((await page.getByRole('button', { name: /^Открыть слайд/ }).first().innerText()).includes('Как создать полезную карусель?'), 'Editing heading updates slide title')
  await page.getByRole('button', { name: 'Подогнать текст', exact: true }).click()
  for (const [button, path] of [['Сохранить JSON', 'illustrated-project.json'], ['PNG', 'illustrated-cover.png'], ['ZIP группы', 'illustrated-group.zip']]) {
    const download = page.waitForEvent('download'); await page.getByRole('button', { name: button, exact: true }).click(); await (await download).saveAs('output/playwright/' + path)
  }
  await page.screenshot({ path: 'output/playwright/illustrated-editor.png', fullPage: true })
  await page.getByRole('link', { name: 'Диалог', exact: true }).click()
  check(await page.getByLabel('Текст из чата', { exact: true }).count() === 0, 'Successful conversion clears source')
  await page.getByLabel('Что создать', { exact: true }).selectOption('slide')
  await page.getByLabel('Оформление', { exact: true }).selectOption('dark')
  fixture.slides = fixture.slides.slice(0, 1)
  await page.getByRole('button', { name: 'Отправить запрос', exact: true }).click()
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent === 'Добавить слайд' && !b.disabled))
  await page.getByRole('button', { name: 'Добавить слайд', exact: true }).click()
  check(await page.getByRole('button', { name: /^Открыть слайд/ }).count() === count + 1, 'Single illustrated slide appended to current group')
  check(await page.getByLabel('Фон слайда', { exact: true }).inputValue() === '#101018', 'Dark palette applied')
  await page.unroute('**/studio-api/complete')
  return { passed: checks.length, checks, imageCalls, textCalls }
}
