export function blobDataUrl(blob:Blob):Promise<string> {
 return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Не удалось прочитать изображение.'));reader.readAsDataURL(blob)})
}
