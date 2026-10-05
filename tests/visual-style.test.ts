import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm, rmdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { visualStyles } from '../shared/visual-styles.ts'

test('Selected medium reaches planning and both picture APIs despite conflicting scene descriptions', async () => {
 const directory=await mkdtemp(join(tmpdir(),'visual-contract-')),file=join(directory,'fixture.env')
 const originalFetch=globalThis.fetch,oldConfig=process.env.PROVIDER_CONFIG
 await writeFile(file,'CHAT_API_KEY=fixture\nCHAT_BASE_URL=https://provider.invalid\nCHAT_MODEL=fixture-text\n')
 process.env.PROVIDER_CONFIG=file
 let request:any
 globalThis.fetch=async(url,options)=>{
  if(String(url).endsWith('/images/models'))return Response.json({data:[{id:'fixture-render',supported_parameters:{aspect_ratio:{values:['1:1','4:5','16:9']}}}]})
  if(String(url).endsWith('/models'))return Response.json({data:[{id:'fixture-text',architecture:{output_modalities:['text']}},{id:'fixture-picture',architecture:{output_modalities:['image']}}]})
  request=JSON.parse(String(options?.body))
  if(String(url).endsWith('/images'))return Response.json({data:[{b64_json:'AAAA',media_type:'image/png'}]})
  return Response.json({choices:[{message:{content:JSON.stringify({name:'Серия',slides:[{title:'Место для мысли',body:'Уберите лишнее.'}]}),images:[{image_url:{url:'data:image/png;base64,AAAA'}}]},finish_reason:'stop'}]})
 }
 try{
  const {complete}=await import('../provider.mjs')
  const context={artworkStyle:'illustration',style:'Предметная фотография при студийном свете',width:1200,height:800}
  await complete({action:'generate',prompt:'Лампа',model:'fixture-text',context})
  assert.match(request.messages[0].content,/Строго плоская 2D-иллюстрация/)
  assert(!request.messages[0].content.includes('предметная или объёмная визуальная метафора'))
  for(const [key,label]of Object.entries(visualStyles)){
   for(const model of ['fixture-picture','fixture-render']){
    const result=await complete({action:'image',prompt:'Лампа на столе, фотография.',model,context:{...context,artworkStyle:key}})
    assert.equal(result.image,'data:image/png;base64,AAAA')
    const prompt=request.prompt??request.messages[0].content[0].text
    assert(prompt.includes(`Техника изображения «${label}»`),`${key}: medium lost in ${model}`)
    assert(prompt.indexOf('Выбранная техника обязательна')>prompt.indexOf(context.style),'Technique must remain explicit after general project styling')
    assert(!prompt.includes('фотографию или выразительную объёмную иллюстрацию'))
    if(model==='fixture-render')assert.equal(request.aspect_ratio,'16:9')
   }
  }
  await complete({action:'image',prompt:'Лампа',model:'fixture-picture',context:{...context,artworkStyle:visualStyles.paper}})
  assert.match(request.messages[0].content[0].text,/сам предмет собран из вырезанных и сложенных листов/)
  await complete({action:'image',prompt:'Акварельный пейзаж',model:'fixture-picture'})
  assert(!request.messages[0].content[0].text.includes('Предметная фотография реального предмета'),'Unspecified medium must not force photography')
 }finally{
  globalThis.fetch=originalFetch
  if(oldConfig===undefined)delete process.env.PROVIDER_CONFIG;else process.env.PROVIDER_CONFIG=oldConfig
  await rm(file);await rmdir(directory)
 }
})
