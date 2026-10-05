import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp,writeFile,rm,rmdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('Provider validates edit contracts, count, limits and context without external requests',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'provider-contract-')),file=join(directory,'fixture.env'),originalFetch=globalThis.fetch,oldConfig=process.env.PROVIDER_CONFIG
 await writeFile(file,'CHAT_API_KEY=fixture\nCHAT_BASE_URL=https://provider.invalid\nCHAT_MODEL=fixture-text\n')
 process.env.PROVIDER_CONFIG=file
 let response:any={summary:'Обновить текст',operations:[{op:'update_layer',slideId:'s1',layerId:'t1',patch:{text:'Новый текст'}}]},request:any
 globalThis.fetch=async(url,options)=>{
  if(String(url).endsWith('/images/models'))return Response.json({data:[]})
  if(String(url).endsWith('/models'))return Response.json({data:[{id:'fixture-text',architecture:{output_modalities:['text']},supported_parameters:['structured_outputs']}]})
  request=JSON.parse(String(options?.body));return Response.json({choices:[{message:{content:JSON.stringify(response)},finish_reason:'stop'}]})
 }
 try{
  const {complete}=await import('../provider.mjs')
  const base={prompt:'Измени заголовок',model:'fixture-text',action:'edit',context:{slides:[{id:'s1',layers:[{id:'t1',type:'text'}]}]}}
  const result=await complete(base);assert.equal(JSON.parse(result.text).operations[0].layerId,'t1');assert(!request.response_format)
  response={summary:'Недопустимое действие',operations:[{op:'execute',code:'arbitrary'}]};await assert.rejects(complete(base),/плану изменений/)
  response={name:'Новый текст',slides:[{title:'Один',body:'Коротко'}]}
  const rewritten=await complete({...base,action:'rewrite',target:'group'});assert.equal(JSON.parse(rewritten.text).slides.length,1)
  response={...response,slides:[...response.slides,...response.slides]};await assert.rejects(complete({...base,action:'redesign',target:'group'}),/количество слайдов/)
  await assert.rejects(complete({...base,action:'rewrite',context:{slides:Array(13).fill({id:'s'})}}),/до 12 слайдов/)
  await assert.rejects(complete({...base,context:{data:'x'.repeat(200001)}}),/большой контекст/)
  await assert.rejects(complete({...base,action:'unknown'}),/Неизвестное действие/)
 }finally{globalThis.fetch=originalFetch;if(oldConfig===undefined)delete process.env.PROVIDER_CONFIG;else process.env.PROVIDER_CONFIG=oldConfig;await rm(file);await rmdir(directory)}
})
