import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import JSZip from 'jszip'

const archive=await JSZip.loadAsync(await readFile('output/playwright/basic-navigation.zip'),{checkCRC32:true})
const names=Object.keys(archive.files)
assert.deepEqual(names,Array.from({length:6},(_,i)=>`slide-${String(i+1).padStart(2,'0')}.png`))
for(const name of names){
 const png=await archive.file(name).async('nodebuffer')
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a')
 assert.equal(png.readUInt32BE(16),1080)
 assert.equal(png.readUInt32BE(20),1350)
}
console.log(JSON.stringify({files:names.length,width:1080,height:1350,crc:true,order:true}))
