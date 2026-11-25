export function marketplaceSource(value:string){
 try{const url=new URL(value),host=url.hostname.toLowerCase();
  if(/(^|\.)(amazon\.[a-z.]+|amzn\.(to|eu))$/.test(host))return 'Amazon';
  if(/(^|\.)aliexpress\.[a-z.]+$/.test(host))return 'AliExpress';
  if(/(^|\.)temu\.com$/.test(host))return 'Temu';
  if(host.endsWith('.myshopify.com')||/^\/products\/[^/]+/.test(url.pathname))return 'Shopify';
 }catch{}return 'Other';
}
/** Derive only what the URL actually contains; never fabricate price, images or features. */
export function productUrlFallback(value:string){
 const url=new URL(value),source=marketplaceSource(value);
 let segments=url.pathname.split('/').filter(Boolean);
 const dp=segments.findIndex(s=>s==='dp'||s==='gp');
 if(dp>0)segments=segments.slice(0,dp);
 let slug=segments.at(-1)||'';
 try{slug=decodeURIComponent(slug);}catch{}
 slug=slug.replace(/\.(?:html?|json)$/i,'').replace(/(?:[-_]g[-_]?|[-_])\d{8,}.*$/i,'')
  .replace(/\b[A-Z0-9]{10,}\b/g,'').replace(/[-_+]+/g,' ').replace(/\s+/g,' ').trim();
 if(!/[\p{L}]{2}/u.test(slug)||/^(?:item|product|products|dp|gp)$/i.test(slug))slug=source==='Other'?'':source+' product';
 if(!slug)return null;
 return {name:slug.charAt(0).toUpperCase()+slug.slice(1,119),price:'',currency:'',description:'',image:'',source,url:url.href,fallback:true};
}
