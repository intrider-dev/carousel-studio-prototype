import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm, rmdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('Editorial guidance reaches every text action while preserving source and response contracts', async () => {
 const directory=await mkdtemp(join(tmpdir(),'editorial-contract-')),file=join(directory,'fixture.env')
 const originalFetch=globalThis.fetch,oldConfig=process.env.PROVIDER_CONFIG
 await writeFile(file,'CHAT_API_KEY=fixture\nCHAT_BASE_URL=https://provider.invalid\nCHAT_MODEL=fixture-text\n')
 process.env.PROVIDER_CONFIG=file
 let action='',request:any
 const source='Цитата клиента: «Данный формат». Цена 1200 рублей.'
 const proposal={name:'Короткая серия',slides:[{title:'Уберите лишнее',body:'Оставьте на столе то, чем пользуетесь.'}]}
 globalThis.fetch=async(url,options)=>{
  if(String(url).endsWith('/images/models'))return Response.json({data:[]})
  if(String(url).endsWith('/models'))return Response.json({data:[{id:'fixture-text',architecture:{input_modalities:['text','image'],output_modalities:['text']},supported_parameters:['structured_outputs']}]})
  request=JSON.parse(String(options?.body))
  const text=action==='analyze'?'Крупный заголовок хорошо читается.':JSON.stringify(action==='edit'?{summary:'Обновить заголовок',operations:[{op:'update_layer',slideId:'s1',layerId:'t1',patch:{text:'Уберите лишнее'}}]}:proposal)
  return Response.json({choices:[{message:{content:text},finish_reason:'stop'}]})
 }
 try{
  const {complete}=await import('../provider.mjs')
  for(action of ['generate','retopic','rewrite','redesign','edit','analyze']){
   const result=await complete({prompt:'Следуй брифу.',action,model:'fixture-text',target:'slide',sourceText:source,context:{slides:[{id:'s1',layers:[{id:'t1',type:'text',text:source}]}]},references:action==='analyze'?['data:image/png;base64,AAAA']:[]})
   const system=request.messages.filter((message:any)=>message.role==='system')
   assert.equal(system.length,1,action)
   const editorial=system[0].content.slice(system[0].content.indexOf('Редакционные правила'))
   assert.match(editorial,/основной текст до 140 символов/,action)
   assert.match(editorial,/глаголы вместо канцелярита/,action)
   assert.match(editorial,/Не заменяй канцелярит рекламной водой/,action)
   assert.match(editorial,/Сохраняй факты, имена, числа и смысл исходника/,action)
   assert.match(editorial,/остальные элементы и тексты сохраняй/,action)
   assert.match(editorial,/Не показывай эту проверку/,action)
   assert(request.messages.at(-1).content[0].text.includes(source),action)
   assert.equal(action==='analyze'?result.text:action==='edit'?JSON.parse(result.text).operations[0].patch.text:JSON.parse(result.text).slides[0].body,action==='analyze'?'Крупный заголовок хорошо читается.':action==='edit'?'Уберите лишнее':proposal.slides[0].body)
   if(!['edit','analyze'].includes(action))assert.equal(request.response_format.type,'json_schema',action)
  }
 }finally{
  globalThis.fetch=originalFetch
  if(oldConfig===undefined)delete process.env.PROVIDER_CONFIG;else process.env.PROVIDER_CONFIG=oldConfig
  await rm(file);await rmdir(directory)
 }
})
