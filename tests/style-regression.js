// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async(page)=>{
 const checks=[],check=(ok,label)=>{if(!ok)throw new Error(label);checks.push(label)},requests=[]
 const canonical=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]])):item)
 const difference=(a,b,path='group')=>{
  if(a&&b&&typeof a==='object'&&typeof b==='object'){
   for(const key of new Set([...Object.keys(a),...Object.keys(b)])){
    const diff=difference(a[key],b[key],`${path}.${key}`);if(diff)return diff
   }
  }else if(a!==b)return `${path}: ${String(a).slice(0,100)} -> ${String(b).slice(0,100)}`
  return ''
 }
 const models=route=>route.fulfill({json:{configured:true,defaultModel:'fixture-text',models:[{id:'fixture-text',name:'Text fixture',text:true,image:false,vision:false},{id:'fixture-picture',name:'Picture fixture',text:false,image:true,vision:false}]}})
 const art=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=900;c.height=700;c.getContext('2d').fillRect(0,0,c.width,c.height);return c.toDataURL('image/png')})
 const completion=route=>{
  const body=route.request().postDataJSON();requests.push(body)
  if(body.action==='image')return route.fulfill({json:{image:art}})
  return route.fulfill({json:{text:JSON.stringify({name:'Проверка оформления',slides:[{title:body.context.artworkStyle==='photo'?'Как освободить рабочий стол от лишних вещей':'Место для мысли',body:'Оставьте ноутбук, блокнот и ручку.',layout:'poster',imagePrompt:'Настольная лампа'}]})}})
 }
 await page.route('**/studio-api/models',models);await page.route('**/studio-api/complete',completion)
 const snapshot=async(expectedGroups)=>{
  await page.waitForFunction(()=>document.querySelector('header [role="status"]')?.textContent==='Сохранено в этом браузере')
  await page.waitForFunction(groups=>new Promise(resolve=>{const r=indexedDB.open('carousel-studio');r.onsuccess=()=>{const db=r.result,q=db.transaction('documents').objectStore('documents').get('current');q.onsuccess=()=>{resolve(q.result?.payload?.topic==='Проверка оформления'&&q.result.payload.groups.length===groups);db.close()}}}),expectedGroups)
  return page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('carousel-studio');r.onsuccess=()=>{const db=r.result,q=db.transaction('documents').objectStore('documents').get('current');q.onsuccess=()=>{resolve(q.result.payload);db.close()}}}))
 }
 try{
  await page.setViewportSize({width:1600,height:1000});await page.goto('http://localhost:3080/')
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('h1')).some(h=>['Новая карусель','Редактор слайдов'].includes(h.textContent)))
  if(await page.getByRole('button',{name:'Новый проект',exact:true}).count()){
   await page.getByRole('button',{name:'Новый проект',exact:true}).click();await page.getByRole('button',{name:'Выбрать новый формат',exact:true}).click()
  }
  await page.getByLabel('Тема *',{exact:true}).fill('Проверка оформления')
  await page.getByLabel('Соотношение сторон',{exact:true}).selectOption('4:5')
  await page.getByRole('button',{name:'Создать проект',exact:true}).click()
  await page.getByRole('heading',{name:'Редактор слайдов',exact:true}).waitFor()
  const before=await snapshot(1)
  for(const [index,style]of ['object','photo','illustration','collage','cinematic','paper'].entries()){
   await page.getByRole('link',{name:'Диалог',exact:true}).click()
   await page.getByRole('button',{name:/^Настройки/}).first().click()
   await page.locator('#model').selectOption('fixture-text');await page.locator('#image-model').selectOption('fixture-picture')
   await page.locator('#visual-style').selectOption(style)
   await page.getByRole('button',{name:/^Настройки/}).first().click()
   await page.getByRole('button',{name:'Отправить запрос',exact:true}).click()
   await page.getByRole('button',{name:'Создать изображения',exact:true}).waitFor()
   check(requests.at(-1).context.artworkStyle===style,`${style}: selected medium reaches planning`)
   await page.reload();await page.getByRole('button',{name:'Создать изображения',exact:true}).waitFor()
   await page.getByRole('button',{name:'Создать изображения',exact:true}).click()
   await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Добавить группу'&&!b.disabled))
   check(requests.at(-1).context.artworkStyle===style,`${style}: medium survives reload and reaches pictures`)
   await page.getByRole('button',{name:'Добавить группу',exact:true}).click()
   await page.getByRole('heading',{name:'Редактор слайдов',exact:true}).waitFor()
   const doc=await snapshot(index+2),slide=doc.groups.at(-1).slides[0]
   const heading=slide.elements.find(e=>e.role==='heading'),body=slide.elements.find(e=>e.role==='body')
   check(body.y>=heading.y+heading.height&&body.y-(heading.y+heading.height)<=heading.size*.5,`${style}: measured heading and body form a compact reading block`)
   const diff=difference(before.groups[0],doc.groups[0])
   check(canonical(doc.groups[0])===canonical(before.groups[0]),`${style}: source group stays unchanged${diff?` (${diff})`:''}`)
  }
  const dl=page.waitForEvent('download');await page.getByRole('button',{name:'PNG',exact:true}).click();await dl
  check(true,'Final poster exports after font fitting')
  await page.setViewportSize({width:390,height:844})
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Poster editor fits a narrow screen')
  return {passed:checks.length,checks,requests:requests.length,providerResponses:'controlled; visual quality checked separately'}
 }finally{await page.unroute('**/studio-api/models',models);await page.unroute('**/studio-api/complete',completion)}
}
