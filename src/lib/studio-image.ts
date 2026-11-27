/** Client-safe image references; never accept script, file or SVG data payloads. */
export function studioImage(value:unknown){
 if(typeof value!=='string')return '';const raw=value.trim();
 if(raw.length<=12000000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/.test(raw))return raw.replace(/[\r\n\t]/g,'').replace(/ /g,'+');
 if(/^\/(?:stock-photos|demo-products|studio-covers)\/[\w.-]+\.(?:jpg|jpeg|png|webp|svg)$/.test(raw))return raw;
 try{const url=new URL(raw);return raw.length<=20000&&['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.href:'';}catch{return '';}
}
export function studioImageProxy(value:string){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)?'/api/studio/image?'+new URLSearchParams({url:u.href}):'';}catch{return '';}}
export const studioQueryKeys=['title','name','price','delivery','features','description','image','img','src','productImage','link','url','destination'] as const;
export function studioQuery(params:URLSearchParams){const image=studioImage(params.get('image')||params.get('img')||params.get('src')||params.get('productImage'));if(!image&&!params.get('title')&&!params.get('name'))return null;return {title:params.get('title')||params.get('name')||'',price:params.get('price')||'',delivery:params.get('delivery')||'',description:params.get('description')||params.get('features')||'',image,url:params.get('link')||params.get('url')||'',destination:params.get('destination')};}
