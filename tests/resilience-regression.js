// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
  const checks=[]
  const check=(ok,label)=>{if(!ok)throw new Error(label);checks.push(label)}
  await page.getByRole('button',{name:'Свойства',exact:true}).click()
  await page.getByRole('button',{name:'Заголовок',exact:true}).click()
  await page.getByLabel('Текст слоя',{exact:true}).fill('Твой маленький ритуал')
  await page.getByLabel('Шрифт слоя',{exact:true}).selectOption('Playfair Display Variable')
  for(const [label,value] of [['Ширина слоя','448'],['Высота слоя','500'],['Размер шрифта','103']]) {await page.getByLabel(label,{exact:true}).fill(value);await page.getByLabel(label,{exact:true}).press('Tab')}
  await page.getByRole('button',{name:'Подогнать текст',exact:true}).click()
  check(Number(await page.getByLabel('Размер шрифта',{exact:true}).inputValue())<103,'Long words reduce font instead of splitting mid-word')
  await page.getByLabel('Масштаб просмотра',{exact:true}).selectOption('2')
  check(await page.getByLabel('Масштаб просмотра',{exact:true}).inputValue()==='2','Canvas zoom switches to 200 percent')
  await page.getByLabel('Масштаб просмотра',{exact:true}).selectOption('1')
  await page.getByRole('button',{name:'Иллюстрация',exact:true}).click()
  await page.getByLabel('Кадрирование X',{exact:true}).fill('0.2');await page.getByLabel('Кадрирование X',{exact:true}).press('Tab')
  check(await page.getByLabel('Кадрирование X',{exact:true}).inputValue()==='0.2','Image crop changes')
  await page.waitForFunction(()=>document.querySelector('header [role="status"]')?.textContent==='Сохранено в этом браузере')
  await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('carousel-studio');r.onsuccess=()=>{const db=r.result,tx=db.transaction('documents','readwrite');tx.objectStore('documents').put({broken:true},'current');tx.oncomplete=()=>{db.close();resolve()}}}))
  await page.reload()
  await page.getByRole('button',{name:'Восстановить резервную копию',exact:true}).click()
  await page.getByRole('heading',{name:'Редактор слайдов',exact:true}).waitFor()
  await page.waitForFunction(()=>document.querySelector('header [role="status"]')?.textContent==='Сохранено в этом браузере')
  const healthy=await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('carousel-studio');r.onsuccess=()=>{const db=r.result,q=db.transaction('documents').objectStore('documents').get('backup');q.onsuccess=()=>{resolve(!!q.result?.payload?.groups);db.close()}}}))
  check(healthy,'Recovery preserves healthy backup instead of overwriting with corrupt current')
  await page.getByRole('link',{name:'Диалог',exact:true}).click()
  await page.getByLabel('Действие',{exact:true}).selectOption('generate')
  await page.route('**/studio-api/complete',async route=>{await new Promise(resolve=>setTimeout(resolve,1200));try{await route.fulfill({status:502,json:{error:'Cancelled request test'}})}catch{ /* Request was cancelled by the user. */ }})
  await page.getByRole('button',{name:'Отправить запрос',exact:true}).click()
  await page.getByRole('button',{name:'Остановить',exact:true}).click()
  await page.getByText('Остановлено. Результат сохранён.',{exact:true}).waitFor()
  check(await page.getByRole('button',{name:'Отправить запрос',exact:true}).isEnabled(),'Cancellation returns controls to working state')
  await page.unroute('**/studio-api/complete')
  return {passed:checks.length,checks}
}
