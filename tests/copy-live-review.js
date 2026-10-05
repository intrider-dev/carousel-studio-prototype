// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
 await page.getByRole('button',{name:'Создать изображения',exact:true}).waitFor()
 const plan=page.getByRole('button',{name:'Править план',exact:true})
 if(await plan.getAttribute('aria-expanded')!=='true')await plan.click()
 await page.getByLabel('Заголовок 1',{exact:true}).waitFor()
 const text=[]
 for(let i=1;i<=4;i++)text.push({title:await page.getByLabel(`Заголовок ${i}`,{exact:true}).inputValue(),body:await page.getByLabel(`Текст ${i}`,{exact:true}).inputValue()})
 const markers=/в современном мире|стоит отметить|важно понимать|подводя итог|раскрыть потенциал|вывести на новый уровень|комплексное решение|осуществлени|ощутите лёгкость|маленький шаг к больш|идеальному пространству|мысли становятся ясн/iu
 for(const slide of text){
  if(slide.title.length>60||slide.body.length>140)throw new Error('Slide text exceeds editorial limits: '+JSON.stringify(slide))
  if(markers.test(`${slide.title} ${slide.body}`))throw new Error('Template language remains: '+JSON.stringify(slide))
 }
 if(await plan.getAttribute('aria-expanded')==='true')await plan.click()
 await page.getByLabel('Заголовок 1',{exact:true}).waitFor({state:'hidden'})
 await page.waitForFunction(()=>{const images=Array.from(document.querySelectorAll('[aria-label="Предпросмотр группы"] img'));return images.length===4&&images.every(img=>img.complete&&img.naturalWidth>0)})
 await page.waitForFunction(()=>document.getAnimations().every(animation=>animation.playState!=='running'))
 await page.getByLabel('Предпросмотр группы',{exact:true}).screenshot({path:'output/playwright/copy-plan.png',style:'header { visibility: hidden !important; }'})
 return {slides:text,limitsPassed:true,markersFound:0,picturesPurchased:false}
}
