// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
  const checks = [], errors = []
  const check = (ok, label) => { if (!ok) throw new Error(label); checks.push(label) }
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://localhost:3080/')
  await page.getByRole('heading', { name: 'Редактор слайдов', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Новый проект', exact: true }).click()
  const confirmation = page.getByRole('alertdialog', { name: 'Создать новый проект?', exact: true })
  await confirmation.waitFor()
  check(await confirmation.evaluate(element => element.contains(document.activeElement)), 'Confirmation receives keyboard focus')
  await page.getByRole('button', { name: 'Отмена', exact: true }).click()
  await confirmation.waitFor({ state: 'hidden' })
  await page.waitForFunction(() => document.activeElement?.textContent === 'Новый проект')
  check(await page.getByRole('button', { name: 'Новый проект', exact: true }).evaluate(element => element === document.activeElement), 'Cancel restores focus to the project action')
  await page.getByRole('button', { name: 'Новый проект', exact: true }).click()
  await page.getByRole('button', { name: 'Выбрать новый формат', exact: true }).click()
  check(await page.getByLabel('Тема *', { exact: true }).count() === 1, 'Required field keeps one unambiguous external label')
  await page.getByLabel('Тема *', { exact: true }).fill('Ритуалы рабочего дня')
  await page.getByRole('button', { name: 'Бренд', exact: true }).click()
  const brand = page.getByRole('checkbox', { name: 'Использовать бренд', exact: true })
  await brand.locator('xpath=ancestor::label').click()
  check(await brand.isChecked(), 'Visible kit checkbox toggles by pointer')
  await brand.focus(); await page.keyboard.press('Space')
  check(!await brand.isChecked(), 'Kit checkbox toggles by keyboard')
  await page.getByRole('button', { name: 'Создать проект', exact: true }).click()
  await page.getByRole('heading', { name: 'Редактор слайдов', exact: true }).waitFor()
  const groupName = 'Подробная серия о спокойных ежедневных ритуалах и рабочем пространстве'
  await page.getByLabel('Название группы', { exact: true }).fill(groupName)
  for (const width of [320, 390, 768, 1280, 1600]) {
    await page.setViewportSize({ width, height: 1000 })
    check(await page.evaluate(() => {
      const field = document.querySelector('#group'), bounds = field.getBoundingClientRect(), panel = field.closest('[data-panel]').getBoundingClientRect()
      return bounds.left >= panel.left && bounds.right <= panel.right + 1 && document.documentElement.scrollWidth <= innerWidth + 1
    }), `Long select labels stay inside the panel at ${width}px`)
  }
  check(await page.locator('#group').evaluate(element => parseFloat(getComputedStyle(element).paddingRight) >= 24), 'Select text reserves space for its trailing icon')
  await page.setViewportSize({ width: 1600, height: 1000 })
  check(await page.evaluate(() => getComputedStyle(document.body).fontFamily.includes('Inter Variable')), 'Interface uses the default Inter family')
  check(await page.getByRole('tabpanel', { name: 'Дизайн', exact: true }).count() === 1, 'Selected workspace has a named tab panel')
  const design = page.getByRole('tab', { name: 'Дизайн', exact: true })
  await design.focus(); await page.keyboard.press('ArrowRight')
  check(await design.getAttribute('aria-selected') === 'true', 'Arrow navigation moves focus without prematurely changing the workspace')
  await page.keyboard.press('Enter')
  check(await page.getByRole('tabpanel', { name: 'Бриф и бренд', exact: true }).isVisible(), 'Keyboard activation opens the matching named panel')
  await design.click()
  await page.getByRole('tab', { name: 'Свойства', exact: true }).click()
  check(await page.getByRole('tabpanel', { name: 'Свойства', exact: true }).count() === 1, 'Inspector tab has a named panel')
  await page.getByRole('button', { name: 'Заголовок', exact: true }).click()
  const text = page.getByLabel('Текст слоя', { exact: true })
  await text.fill('Новый ритуал')
  await page.getByRole('tab', { name: 'Бриф и бренд', exact: true }).click(); await design.click()
  check(await text.inputValue() === 'Новый ритуал', 'Workspace switches retain mounted controls and edited text')
  const x = page.getByLabel('X', { exact: true }), previousX = await x.inputValue()
  await x.fill('3000'); await x.press('Tab')
  await page.getByRole('tab', { name: 'Проверка серии', exact: true }).click()
  const issueCount = page.getByText(/^Ошибок: \d+$/)
  await issueCount.waitFor()
  const hasErrorColor = locator => locator.evaluate(element => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1
    const context = canvas.getContext('2d'); context.fillStyle = getComputedStyle(element).color
    context.fillRect(0, 0, 1, 1)
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data
    return red > green + 40 && red > blue + 40
  })
  check(await hasErrorColor(issueCount), 'Series errors retain a visibly red status')
  const slideIssue = page.getByRole('button', { name: 'Проверить слайд 1', exact: true }).locator('span').filter({ hasText: /^\d+$/ }).last()
  check(await hasErrorColor(slideIssue), 'Affected slide retains a visibly red issue count')
  await design.click(); await x.fill(previousX); await x.press('Tab')
  const upload = page.getByLabel('Открыть JSON', { exact: true })
  check(await upload.evaluate(element => element.tagName === 'INPUT' && element.type === 'file'), 'Upload label targets the actual file input')
  await upload.setInputFiles('output/playwright/production-project.json')
  await page.waitForFunction(() => document.querySelectorAll('#group option').length === 2)
  await upload.setInputFiles('output/playwright/production-project.json')
  await page.waitForFunction(() => document.querySelector('header [role="status"]')?.textContent === 'Сохранено в этом браузере')
  check(await page.locator('#group option').count() === 2, 'The same project file can be opened repeatedly without duplicate groups')
  await page.getByRole('link', { name: 'Диалог', exact: true }).click()
  await page.getByLabel('Действие', { exact: true }).selectOption('generate')
  await page.getByRole('button', { name: /^Настройки/ }).first().click()
  check((await page.locator('#model option').allTextContents()).some(value => value.length > 8 && value !== 'Выберите модель'), 'Model options retain their names after conversion to kit select data')
  await page.route('**/studio-api/models', route => route.fulfill({json:{defaultModel:'catalog-default',models:[
    {id:'catalog-default',name:'Default text model',text:true,vision:true,image:false},
    {id:'catalog-selected',name:'Selected text model',text:true,vision:true,image:false},
    {id:'catalog-picture',name:'Picture model',text:false,vision:true,image:true}
  ]}}))
  await page.reload(); await page.getByRole('button', {name:/^Настройки/}).first().click()
  await page.locator('#model').selectOption('catalog-selected')
  await page.locator('#image-model').selectOption('catalog-picture')
  const immediate=page.getByRole('checkbox',{name:'Сразу создавать изображения',exact:true})
  if (!await immediate.isChecked()) await immediate.locator('xpath=ancestor::label').click()
  await page.getByText('План сохранён',{exact:true}).waitFor()
  await page.reload(); await page.getByRole('button', {name:/^Настройки/}).first().click()
  await page.waitForFunction(()=>document.querySelector('#model')?.value==='catalog-selected')
  check(await page.locator('#model').inputValue()==='catalog-selected', 'Fast catalog loading preserves the saved text model')
  check(await page.locator('#image-model').inputValue()==='catalog-picture', 'Fast catalog loading preserves the saved picture model')
  check(await immediate.isChecked(), 'Reload preserves the image-generation preference')
  await page.unroute('**/studio-api/models')
  check(errors.length === 0, 'No page errors during the component workflows')
  return { passed: checks.length, checks }
}
