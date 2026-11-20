import {pendingShopKey} from '../../lib/shop-handoff';
import type {ShopMode} from '../shop/shop-data';
import {mimeExtension} from './media-utils';
export function downloadBlob(blob:Blob,name='sellpostly-image'){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name+'.'+mimeExtension(blob.type);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function canvasBlob(canvas:HTMLCanvasElement,mime='image/png',quality=.9){return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('EXPORT_FAILED')),mime,quality));}
export function sendImageToShop(canvas:HTMLCanvasElement,title:string,destination:ShopMode){
 const copy=document.createElement('canvas');let size=1200,data='';
 do{const scale=Math.min(1,size/Math.max(canvas.width,canvas.height));copy.width=Math.max(1,Math.round(canvas.width*scale));copy.height=Math.max(1,Math.round(canvas.height*scale));const ctx=copy.getContext('2d');if(!ctx)throw Error('CANVAS_UNAVAILABLE');ctx.drawImage(canvas,0,0,copy.width,copy.height);data=copy.toDataURL('image/webp',.82);size=Math.floor(size*.75);}while(data.length>1400000&&size>=300);
 if(data.length>1400000)throw Error('IMAGE_TOO_LARGE');
 localStorage.setItem(pendingShopKey,JSON.stringify({id:crypto.randomUUID(),title:title.trim().slice(0,120)||'Product Image',price:'',image:data,url:'',description:'',category:'Other',gender:'unisex',source:'Other',destination}));
 window.location.assign('/shop');
}
