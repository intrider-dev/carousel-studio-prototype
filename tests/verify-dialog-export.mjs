import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import JSZip from 'jszip'
const before=JSON.parse(await readFile('output/playwright/dialog-before.json','utf8')),after=JSON.parse(await readFile('output/playwright/dialog-after.json','utf8'))
const source=before.groups.at(-1),edited=after.groups.find(g=>g.id===source.id)
assert.equal(after.groups.length,before.groups.length);assert.equal(edited.name,'Мой ориентир')
assert.deepEqual(edited.slides.map(s=>s.id),source.slides.map(s=>s.id))
assert.deepEqual(after.groups.slice(0,-1),before.groups.slice(0,-1))
for(const [i,s]of edited.slides.entries())for(const element of s.elements){
 const original=source.slides[i].elements.find(e=>e.id===element.id);assert(original)
 if(i===0&&element.role==='heading'){assert.equal(element.fill,'#ffffff');assert.equal(element.gradient,undefined);const {fill:_fill,gradient:_gradient,...rest}=element,{fill:_,gradient:__,...old}=original;assert.deepEqual(rest,old)}
 else if(i===3&&element.role==='body'){assert.equal(element.text,'Выберите одно действие на завтра. Запишите его сейчас.');const {text:_text,size:_size,...rest}=element,{text:_,size:__,...old}=original;assert.deepEqual(rest,old)}
 else assert.deepEqual(element,original)
}
const zip=await JSZip.loadAsync(await readFile('output/playwright/dialog-live.zip'),{checkCRC32:true});assert.equal(Object.keys(zip.files).length,6)
for(const file of Object.values(zip.files)){const bytes=await file.async('nodebuffer');assert.equal(bytes.readUInt32BE(16),1080);assert.equal(bytes.readUInt32BE(20),1080)}
console.log(JSON.stringify({liveEdit:true,unchangedPictures:true,unchangedSurroundingGroups:true,unchangedSlideOrder:true,requestedText:true,gradientRemoved:true,zip:6,crc:true}))
const redesigned=JSON.parse(await readFile('output/playwright/dialog-redesigned.json','utf8')),rebuilt=redesigned.groups.find(g=>g.id===edited.id)
assert.equal(redesigned.groups.length,after.groups.length);assert.deepEqual(rebuilt.slides.map(s=>s.id),edited.slides.map(s=>s.id))
assert.equal(rebuilt.slides[3].title,'Один шаг на завтра');assert.equal(rebuilt.slides[3].background,'#ffffff')
assert.equal(rebuilt.slides[3].elements.find(e=>e.type==='image').src,edited.slides[3].elements.find(e=>e.type==='image').src)
for(const [i,s]of rebuilt.slides.entries())if(i!==3)assert.deepEqual(s,edited.slides[i])
assert.deepEqual(redesigned.groups.slice(0,-1),after.groups.slice(0,-1))
console.log(JSON.stringify({liveRedesign:true,scope:'single-slide',background:'#ffffff',samePicture:true,otherSlidesUnchanged:true}))
const final=JSON.parse(await readFile('output/playwright/dialog-photo.json','utf8')),finalGroup=final.groups.find(g=>g.id===rebuilt.id)
assert.equal(final.groups.length,redesigned.groups.length)
assert.deepEqual(final.groups.slice(0,-1),redesigned.groups.slice(0,-1))
assert.deepEqual(finalGroup.slides.map(s=>s.id),rebuilt.slides.map(s=>s.id))
for(const [i,s]of finalGroup.slides.entries()){
 if(i!==3){assert.deepEqual(s,rebuilt.slides[i]);continue}
 const oldSlide=rebuilt.slides[i],picture=oldSlide.elements.find(e=>e.type==='image')
 const replacement=s.elements.find(e=>e.id===picture.id)
 assert.notEqual(replacement.src,picture.src)
 assert.deepEqual({...replacement,src:picture.src},picture)
 assert.deepEqual({...s,elements:oldSlide.elements},oldSlide)
 for(const layer of s.elements)if(layer.id!==picture.id)assert.deepEqual(layer,oldSlide.elements.find(e=>e.id===layer.id))
}
const finalZip=await JSZip.loadAsync(await readFile('output/playwright/dialog-final.zip'),{checkCRC32:true})
assert.equal(Object.keys(finalZip.files).length,6)
for(const file of Object.values(finalZip.files)){const bytes=await file.async('nodebuffer');assert.equal(bytes.readUInt32BE(16),1080);assert.equal(bytes.readUInt32BE(20),1080)}
console.log(JSON.stringify({livePhotoReplacement:true,sameLayerIdentityAndGeometry:true,otherLayersAndSlidesUnchanged:true,finalZip:6,dimensions:'1080x1080',crc:true}))
