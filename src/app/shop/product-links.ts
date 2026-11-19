import {appUrl} from '../../lib/public-url';
export function productShareUrl(path:string){
 let base='https://sellpostly.vercel.app';
 try{const url=new URL(appUrl);if(url.protocol==='https:'&&url.hostname!=='vercel.app'&&url.hostname!=='localhost'&&!/(^|\.)vercel\.com$/i.test(url.hostname))base=url.origin;}catch{}
 return new URL(path.startsWith('/')&&!path.startsWith('//')?path:'/',base).href;
}
export function productPath(id:string,slug?:string,snapshot?:string){
 const path=slug?'/s/'+encodeURIComponent(slug)+'/product/'+encodeURIComponent(id):'/shop/p/'+encodeURIComponent(id);
 return path+(!slug&&snapshot?'?'+new URLSearchParams({s:snapshot}):'');
}
export function legacyCartStorageKey(slug?:string,snapshot?:string){
 let hash=2166136261;for(const char of snapshot||'')hash=Math.imul(hash^char.charCodeAt(0),16777619);
 return 'sellpostly-cart-v1:'+(slug?'public:'+slug:(snapshot?'shared-'+(hash>>>0).toString(36):'local'));
}
export function normalizeCart(value:unknown,ids:string[]){
 const result:Record<string,number>={};if(!value||typeof value!=='object'||Array.isArray(value))return result;
 for(const id of ids){const quantity=(value as Record<string,unknown>)[id];if(typeof quantity==='number'&&Number.isInteger(quantity)&&quantity>0)result[id]=Math.min(quantity,99);}
 return result;
}


export function cartStorageKey(slug?:string,snapshot?:string){
 return slug?'sellpostly_cart_'+slug:'sellpostly_cart_preview:'+(snapshot?legacyCartStorageKey(undefined,snapshot).split(':').pop():'local');
}


export function storePath(slug:string,mode:'affiliate'|'personal'){return '/s/'+encodeURIComponent(slug)+'/'+mode;}
