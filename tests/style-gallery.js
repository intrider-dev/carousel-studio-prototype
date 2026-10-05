// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
 const entries=[
  {file:'direction-auto',direction:'По теме',picture:'photo',layout:'poster',label:'По теме'},
  {file:'direction-editorial',direction:'Журнальный',picture:'photo',layout:'editorial',label:'Журнальный'},
  {file:'direction-bold',direction:'Смелый',picture:'object',layout:'cards',label:'Смелый'},
  {file:'direction-minimal',direction:'Чистый',picture:'photo',layout:'split',label:'Чистый'},
  {file:'direction-luxe',direction:'Премиальный',picture:'cinematic',layout:'quote',label:'Премиальный'},
  {file:'picture-object',direction:'По теме',picture:'object',label:'Объёмные 3D-объекты'},
  {file:'picture-photo',direction:'По теме',picture:'photo',label:'Предметные фотографии'},
  {file:'picture-illustration',direction:'По теме',picture:'illustration',label:'Иллюстрации'},
  {file:'picture-collage',direction:'По теме',picture:'collage',label:'Редакционный коллаж'},
  {file:'picture-cinematic',direction:'По теме',picture:'cinematic',label:'Кинематографическая фотография'},
  {file:'picture-paper',direction:'По теме',picture:'paper',label:'Бумага и фактуры'},
 ]
 const index=await page.evaluate(()=>Number(sessionStorage.getItem('style-gallery-index')||0))
 const entry=entries[index]
 if(!entry)return {complete:true,examples:entries.length}
 const layout=entry.layout||'poster'
 const phase=await page.evaluate(()=>sessionStorage.getItem('style-gallery-phase'))
 const savePhase=value=>page.evaluate(value=>sessionStorage.setItem('style-gallery-phase',value),value)
 const title='Место для мысли',body='Оставьте на столе ноутбук, блокнот и ручку. Остальное уберите.'
 let textResult,imageResult,plan=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('style-gallery-plan')||'null'))
 await page.setViewportSize({width:1600,height:1100})
 if(!phase){
  await page.goto('http://localhost:3080/')
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('h1')).some(h=>['Новая карусель','Редактор слайдов'].includes(h.textContent)))
  if(await page.getByRole('button',{name:'Новый проект',exact:true}).count()){
   await page.getByRole('button',{name:'Новый проект',exact:true}).click()
   await page.getByRole('button',{name:'Выбрать новый формат',exact:true}).click()
  }
  await page.getByRole('heading',{name:'Новая карусель',exact:true}).waitFor()
  await page.getByLabel('Соотношение сторон',{exact:true}).selectOption('4:5')
  await page.getByLabel('Тема *',{exact:true}).fill('Место для мысли: домашний рабочий стол')
  await page.getByLabel('Стиль',{exact:true}).fill('Настольная лампа с округлым купольным абажуром и цилиндрическим основанием. Визуальная метафора свободного места для работы. Техника определяется выбранным стилем изображений; композиция и палитра направлением оформления. Предмет целиком в кадре. Без людей, надписей, устройств и постеров внутри изображения.')
  await page.getByRole('button',{name:'Задача и аудитория',exact:true}).click()
  await page.getByLabel('Слайдов в серии',{exact:true}).selectOption('1')
  await page.getByLabel('Для кого',{exact:true}).fill('Люди, которые работают дома')
  await page.getByLabel('Цель',{exact:true}).fill('Освободить рабочий стол от лишних вещей')
  await page.getByLabel('Призыв к действию',{exact:true}).fill('Уберите со стола одну лишнюю вещь')
  await page.getByRole('button',{name:new RegExp(`^${entry.direction}`)}).click()
  await page.getByRole('button',{name:'Создать проект',exact:true}).click()
  await page.getByRole('link',{name:'Диалог',exact:true}).click()
  await page.getByRole('button',{name:/^Настройки/}).first().click()
  await page.waitForFunction(()=>document.querySelector('#model')?.options.length>2)
  await page.locator('#model').selectOption('openai/gpt-4.1-nano')
  await page.locator('#image-model').selectOption('google/gemini-2.5-flash-image')
  await page.locator('#visual-style').selectOption(entry.picture)
  if(entry.file.startsWith('picture-')){
   await page.locator('#palette').selectOption('editorial')
   await page.locator('#generation-font').selectOption('Manrope Variable')
  }
  await page.getByLabel('Сразу создавать изображения',{exact:true}).uncheck()
  await page.getByRole('button',{name:/^Настройки/}).first().click()
  await page.getByLabel('Запрос',{exact:true}).fill(`Создай ровно один слайд. Имя группы «${entry.label}». Композиция ${layout}: ${entry.file.startsWith('picture-')?'один постер для сравнения техники изображения':'рекомендованная для этого направления обложка'}. Заголовок точно «${title}». Основной текст точно «${body}». Рубрика «Домашний офис», highlight «Начните с одной вещи», footer «Уберите со стола одну лишнюю вещь». Не повторяй основной текст в других полях. Декор только по смыслу и без перегруза. Сюжет изображения: настольная лампа с округлым купольным абажуром и цилиндрическим основанием, визуальная метафора свободного места для работы. Техника определяется выбранным стилем изображений. Возьми палитру из направления оформления. ImagePrompt описывает самостоятельную картинку без надписей, текста, логотипов, карточек и рамок. Главный предмет целиком в кадре, с выразительным силуэтом и ракурсом. Окружение, формы и материалы должны подчёркивать выбранную технику. Цвета и шрифты должны учитывать настройки проекта.`)
  const response=page.waitForResponse(r=>r.url().endsWith('/studio-api/complete')&&r.request().postDataJSON().action==='generate',{timeout:190000})
  await page.getByRole('button',{name:'Отправить запрос',exact:true}).click()
  const textResponse=await response
  if(textResponse.request().postDataJSON().context.artworkStyle!==entry.picture)throw new Error('Selected picture style did not reach the text connector')
  textResult=await textResponse.json()
  if(textResult.error)throw new Error(textResult.error)
  plan=JSON.parse(textResult.text)
  if(plan.slides.length!==1||plan.slides[0].title!==title||plan.slides[0].body!==body||plan.slides[0].layout!==layout)throw new Error('The requested comparison copy or layout changed')
  await page.evaluate(plan=>sessionStorage.setItem('style-gallery-plan',JSON.stringify(plan)),plan)
  await page.getByRole('button',{name:'Создать изображения',exact:true}).waitFor()
  await savePhase('plan')
 }
 if(phase!=='applied'){
  if(!page.url().endsWith('/chat'))await page.getByRole('link',{name:'Диалог',exact:true}).click()
  const pictures=page.getByRole('button',{name:/^(Создать изображения|Повторить недостающие)$/})
  if(await pictures.count()){
   const response=page.waitForResponse(r=>r.url().endsWith('/studio-api/complete')&&r.request().postDataJSON().action==='image',{timeout:190000})
   await pictures.click()
   const imageResponse=await response
   if(imageResponse.request().postDataJSON().context.artworkStyle!==entry.picture)throw new Error('Selected picture style did not reach the image connector')
   imageResult=await imageResponse.json()
   if(imageResult.error)throw new Error(imageResult.error)
   if(!imageResult.image?.startsWith('data:image/'))throw new Error('No generated picture received')
  }
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Добавить группу'&&!b.disabled))
  await page.getByRole('button',{name:'Добавить группу',exact:true}).click()
  await page.getByRole('heading',{name:'Редактор слайдов',exact:true}).waitFor()
  await savePhase('applied')
 }
 await page.waitForFunction(()=>document.querySelector('header [role="status"]')?.textContent==='Сохранено в этом браузере')
 if(await page.getByRole('button',{name:/^Открыть слайд/}).count()!==1)throw new Error('Expected one slide in the generated group')
 for(const [button,path]of [['Сохранить JSON',`output/playwright/${entry.file}.json`],['PNG',`docs/examples/${entry.file}.png`],['ZIP группы',`output/playwright/${entry.file}.zip`]]){
  const download=page.waitForEvent('download')
  await page.getByRole('button',{name:button,exact:true}).click()
  await(await download).saveAs(path)
 }
 await page.getByRole('button',{name:'Проверка серии',exact:true}).click()
 await page.getByText('Критических ошибок нет',{exact:true}).waitFor()
 await page.waitForFunction(()=>{const images=Array.from(document.querySelectorAll('[aria-label="Просмотр серии"] img'));return images.length===1&&images.every(img=>img.complete&&img.naturalWidth>0)})
 const warnings=await page.getByText(/^Замечаний: /).textContent()
 await page.evaluate(index=>{sessionStorage.setItem('style-gallery-index',String(index+1));sessionStorage.removeItem('style-gallery-phase');sessionStorage.removeItem('style-gallery-plan')},index)
 return {example:entry.file,ordinal:index+1,total:entries.length,title,body,layout:plan?.slides[0].layout,imagePrompt:plan?.slides[0].imagePrompt,medium:entry.picture,png:`docs/examples/${entry.file}.png`,textModel:textResult?.model,imageModel:imageResult?.model,textCost:textResult?.usage?.cost,quality:'no critical errors',warnings,mocked:false}
}
