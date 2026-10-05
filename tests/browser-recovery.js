// oxlint-disable-next-line no-unused-expressions -- The CLI evaluates this function expression.
async (page) => {
  const checks = []
  const check = (ok, label) => { if (!ok) throw new Error(label); checks.push(label) }
  await page.goto('http://localhost:3080/basic')
  await page.getByLabel('Логотип', { exact: true }).setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('broken') })
  await page.getByRole('alert').waitFor()
  check((await page.getByRole('alert').innerText()).includes('Не удалось открыть'), 'Corrupt PNG rejected')
  await page.getByLabel('Логотип', { exact: true }).setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(1_000_001) })
  check((await page.getByRole('alert').innerText()).includes('до 1 МБ'), 'Oversized image rejected')
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Quota', 'QuotaExceededError') } })
  await page.getByLabel('Название бренда *').fill('Несохранённый бренд')
  await page.getByText('Не удалось сохранить. Скачайте результат до закрытия вкладки.', { exact: true }).waitFor()
  check(await page.getByText('Не удалось сохранить. Скачайте результат до закрытия вкладки.', { exact: true }).count() === 1, 'Storage failure shown')
  await page.getByRole('button', { name: 'К слайдам', exact: true }).click()
  await page.getByRole('button', { name: 'К просмотру', exact: true }).click()
  check(await page.getByRole('button', { name: 'Скачать ZIP', exact: true }).isEnabled(), 'Export remains available without persistence')
  await page.evaluate(() => { HTMLCanvasElement.prototype.toBlob = function (callback) { callback(null) } })
  await page.getByRole('button', { name: 'Скачать слайд 1', exact: true }).click()
  await page.getByRole('alert').waitFor()
  check((await page.getByRole('alert').innerText()).includes('Не удалось скачать'), 'Failed export shown')
  check(await page.getByRole('button', { name: 'Скачать ZIP', exact: true }).isEnabled(), 'Export controls recover after failure')
  await page.reload()
  check(await page.getByLabel('Название бренда *').inputValue() !== 'Несохранённый бренд', 'Failed save does not replace previous draft')
  await page.getByRole('button', { name: 'К слайдам', exact: true }).click()
  await page.getByRole('button', { name: 'К просмотру', exact: true }).click()
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Скачать слайд 1', exact: true }).click()
  check(await (await pending).failure() === null, 'Export succeeds after recovery')
  await page.goto('http://localhost:3080/basic')
  return { passed: checks.length, checks }
}
