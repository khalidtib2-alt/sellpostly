'use client';
import {useEffect,useRef,useState} from 'react';
import {lookbookMetadata} from '../../lib/lookbook-seo';
import {metadataToHead} from '../localized-seo';
import {useLanguage} from '../language-context';
import {lookProducts} from '../../lib/storefront-selection';
import {safeImage,safeUrl,type Shop,type Product} from './shop-data';
import {productPath,productShareUrl,storePath} from './product-links';
import {lookbookPath,lookbookImage,lookbookPins} from './lookbook-data';
import {isAmazonDestination,disclosurePresets,amazonAffiliateProduct} from './affiliate-compliance';
import ProductPrice from './product-price';
import ShareModal from './share-modal';
import BuyerStoreFooter from './buyer-store-footer';
import {translations,type Message} from '../translations';
export default function Lookbook({shop,slug,snapshot,preview=false}:{shop:Shop;slug?:string;snapshot?:string;preview?:boolean}){
 const {t,language,setLanguage}=useLanguage(),[gender,setGender]=useState<'women'|'men'>('women'),[selected,setSelected]=useState(''),[custom,setCustom]=useState<Partial<Record<'women'|'men',string>>>({}),[share,setShare]=useState(false),[story,setStory]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState<Message|''>('');
 useEffect(()=>{if(slug)metadataToHead(lookbookMetadata(slug,shop.shopMode,shop,language));},[slug,shop,language]);
 const request=useRef(0),storyUrl=useRef('');
 const products=lookProducts(shop.products,gender),photo=custom[gender]||shop.lookbookImages?.[gender]||lookbookImage(gender);
 const path=lookbookPath(slug,shop.shopMode,snapshot),url=productShareUrl(path+(path.includes('?')?'&':'?')+'gender='+gender);
 useEffect(()=>{const value=new URLSearchParams(location.search).get('gender');if(value==='men'||value==='women')setGender(value);return()=>{request.current++;if(storyUrl.current)URL.revokeObjectURL(storyUrl.current);};},[]);
 useEffect(()=>{request.current++;setSelected('');setStory('');setNotice('');if(storyUrl.current){URL.revokeObjectURL(storyUrl.current);storyUrl.current='';}},[gender,photo,language]);
 function choose(value:'men'|'women'){if(value===gender)return;setGender(value);const next=new URL(location.href);next.searchParams.set('gender',value);history.replaceState(history.state,'',next.pathname+next.search);}
 function productName(p:Product){return p.id.startsWith('sample-')&&p.name in translations?t(p.name as Message):p.name;}
 function destination(p:Product){return shop.shopMode==='affiliate'?safeUrl(p.url):productPath(p.id,slug,snapshot);}
 async function upload(file?:File){if(!file)return;if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>5000000){setNotice('Photo must be under 5 MB.');return;}
  const reader=new FileReader();reader.onerror=()=>setNotice('Could not read this image. Try another file.');reader.onload=()=>{const image=new Image();image.onerror=()=>setNotice('Could not read this image. Try another file.');image.onload=()=>{try{const c=document.createElement('canvas'),scale=Math.min(1,1400/Math.max(image.width,image.height));c.width=Math.max(1,Math.round(image.width*scale));c.height=Math.max(1,Math.round(image.height*scale));c.getContext('2d')!.drawImage(image,0,0,c.width,c.height);const value=c.toDataURL('image/jpeg',.88);setCustom(current=>({...current,[gender]:value}));}catch{setNotice('Could not read this image. Try another file.');}};image.src=String(reader.result);};reader.readAsDataURL(file);
 }
 async function renderStory(){
  if(busy)return;setBusy(true);setNotice('');const id=++request.current;
  try{const c=document.createElement('canvas');c.width=1080;c.height=1920;const ctx=c.getContext('2d');if(!ctx)throw Error();
   const load=(src:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();const timer=setTimeout(()=>{image.src='';reject(Error());},10000);image.crossOrigin='anonymous';image.onload=()=>{clearTimeout(timer);resolve(image);};image.onerror=()=>{clearTimeout(timer);reject(Error());};image.src=src;});
   ctx.fillStyle='#f5f2ec';ctx.fillRect(0,0,1080,1920);ctx.direction=language==='ar'?'rtl':'ltr';ctx.textAlign=language==='ar'?'right':'left';ctx.fillStyle='#0f172a';
   const start=language==='ar'?1008:72;ctx.font='bold 42px sans-serif';ctx.fillText(shop.name.slice(0,40),start,88,936);ctx.font='bold 64px sans-serif';ctx.fillText(t('Shop the Look'),start,172,936);
   let model:HTMLImageElement;try{model=await load(photo);}catch{model=await load(lookbookImage(gender));}
   // Contain the complete outfit. The exported card never requires a cross-origin proxy.
   const scale=Math.min(900/model.width,1120/model.height),w=model.width*scale,h=model.height*scale;ctx.drawImage(model,(1080-w)/2,210+(1120-h)/2,w,h);
   products.forEach((p,index)=>{const pin=lookbookPins[index],x=90+pin.x*9,y=210+pin.y*11.2;ctx.beginPath();ctx.fillStyle='#059669';ctx.arc(x,y,27,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 26px sans-serif';ctx.fillText(String(index+1),x,y+9);});
   ctx.textAlign=language==='ar'?'right':'left';ctx.fillStyle='#0f172a';ctx.font='bold 31px sans-serif';ctx.fillText(t(gender==='women'?'Women':'Men'),start,1380);
   for(let i=0;i<products.length;i++){const p=products[i],y=1440+i*78;ctx.font='bold 27px sans-serif';ctx.fillText((i+1)+'. '+productName(p).slice(0,70),start,y,936);if(!(shop.shopMode==='affiliate'&&amazonAffiliateProduct(p))){ctx.font='24px sans-serif';ctx.fillText(p.price,start,y+29,936);}}
   ctx.font='24px sans-serif';ctx.fillStyle='#475569';ctx.fillText(t('Created with SellPostly.com'),start,1820,936);ctx.font='20px sans-serif';ctx.fillText(slug?productShareUrl(storePath(slug,shop.shopMode)):'SellPostly.com',start,1870,936);
   const blob=await new Promise<Blob>((resolve,reject)=>c.toBlob(value=>value?resolve(value):reject(Error()),'image/png'));if(id!==request.current)return;
   if(storyUrl.current)URL.revokeObjectURL(storyUrl.current);const next=URL.createObjectURL(blob);storyUrl.current=next;setStory(next);
  }catch{setNotice('Could not create the story card. Try a local outfit photo.');}finally{setBusy(false);}
 }
 const disclosure=shop.affiliateDisclosure||disclosurePresets[0].text;
 const preset=disclosurePresets.find(p=>[p.text,translations[p.text].fr,translations[p.text].es,translations[p.text].ar].some(candidate=>candidate===disclosure));
 return <main className="shop-surface mx-auto max-w-7xl px-5 py-8" data-surface={shop.shopTheme} data-accent={shop.shopAccent||'emerald'}>
  <header className="mb-7 flex flex-wrap items-center justify-between gap-4"><a href={slug?storePath(slug,shop.shopMode):'/shop'} className="font-semibold underline">{t('Back to Store')}</a><div role="group" aria-label={t('Language')} className="flex rounded-full border bg-white p-1">{(['en','fr','es','ar'] as const).map(code=><button key={code} type="button" aria-pressed={language===code} onClick={()=>setLanguage(code)} className={'rounded-full px-3 py-2 text-sm font-bold '+(language===code?'bg-emerald-700 text-white':'')}>{code.toUpperCase()}</button>)}</div></header>
  <p className="text-sm font-bold uppercase tracking-widest text-emerald-800">{shop.name}</p><h1 className="mt-3 text-4xl font-black sm:text-6xl">{'✨ '}{t('Shop the Look')}</h1><p className="mt-4 max-w-2xl text-slate-600">{t('Explore an editorial outfit and the latest matching finds. Pins identify curated picks; illustrations do not show the exact products.')}</p>
  {shop.shopMode==='affiliate'&&<aside className="mt-5 rounded-xl border bg-slate-50 p-4 text-sm"><strong>{t('Affiliate Disclosure')}: </strong>{preset?t(preset.text):disclosure}</aside>}
  <div className="my-6 flex flex-wrap items-center gap-3"><div role="group" aria-label={t('Gender / Audience')} className="flex rounded-full border bg-white p-1">{(['women','men'] as const).map(value=><button key={value} type="button" aria-pressed={gender===value} onClick={()=>choose(value)} className={'rounded-full px-6 py-3 font-bold '+(gender===value?'bg-emerald-700 text-white':'')}>{t(value==='women'?'Women':'Men')}</button>)}</div><button disabled={!slug&&!snapshot} type="button" onClick={()=>setShare(true)} className="rounded-xl border px-5 py-3 font-bold">{t('Share This Look')}</button><button disabled={busy} type="button" onClick={()=>void renderStory()} className="rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white disabled:opacity-50">{t(busy?'Creating story card...':'Create 9:16 Story Card')}</button></div>
  <section className="lookbook-scene grid gap-7 lg:grid-cols-[1.2fr_1fr]" aria-label={t('Shop the Look')}>
   <div><div className="lookbook-model relative mx-auto aspect-[3/4] max-h-[76vh] overflow-hidden rounded-3xl bg-stone-100">{(['women','men'] as const).map(value=><img key={value} src={custom[value]||shop.lookbookImages?.[value]||lookbookImage(value)} alt={t('Editorial outfit preview')} aria-hidden={gender!==value} className={'lookbook-model-photo absolute inset-0 h-full w-full object-contain '+(gender===value?'lookbook-visible':'lookbook-hidden')}/>)}{products.map((p,i)=><button key={p.id} type="button" aria-label={t('View Product')+': '+productName(p)} aria-pressed={selected===p.id} onClick={()=>{setSelected(p.id);document.getElementById('look-'+p.id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});}} className="lookbook-pin absolute grid h-11 w-11 place-items-center rounded-full border-2 border-white bg-emerald-700 font-bold text-white shadow-lg focus-visible:ring-4" style={{left:lookbookPins[i].x+'%',top:lookbookPins[i].y+'%',transform:'translate(-50%,-50%)'}}>{i+1}</button>)}</div><p className="mt-3 text-center text-xs text-slate-600">{custom[gender]||shop.lookbookImages?.[gender]?t('Custom outfit photo. Product matches are curated suggestions.'):t('Editorial illustration')}</p><label className="mt-4 inline-block cursor-pointer rounded-xl border px-4 py-3 font-semibold">{t('Try Your Outfit Photo')}<input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp" onChange={e=>void upload(e.target.files?.[0])}/></label>{custom[gender]&&<button type="button" className="ms-3 underline" onClick={()=>setCustom(current=>({...current,[gender]:undefined}))}>{t('Reset')}</button>}<p className="mt-2 text-xs text-slate-600">{t('Your preview photo stays in this browser and is included only in your downloaded story card.')}</p></div>
   <div key={gender} className="lookbook-products space-y-4">{!products.length&&<p className="rounded-2xl border p-6">{t('No products in this collection yet. Try the other audience.')}</p>}{products.map((p,i)=><article key={p.id} id={'look-'+p.id} className={'flex gap-4 rounded-2xl border bg-white p-4 transition-shadow '+(selected===p.id?'ring-2 ring-emerald-700 shadow-lg':'')}><span className="self-start rounded-full bg-emerald-50 px-3 py-1 font-bold">{i+1}</span>{p.image&&<img src={p.image} alt={productName(p)} className="h-28 w-24 rounded-xl bg-slate-50 object-contain"/>}<div className="min-w-0 flex-1"><h2 className="line-clamp-2 font-bold">{productName(p)}</h2><ProductPrice product={p} mode={shop.shopMode}/>{destination(p)&&<a href={destination(p)} target={shop.shopMode==='affiliate'?'_blank':undefined} rel={shop.shopMode==='affiliate'?'nofollow sponsored noopener noreferrer':undefined} className="mt-3 inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">{t(shop.shopMode==='affiliate'?isAmazonDestination(p.url)?'Check Price on Amazon':'View Best Deal':'View Product')}</a>}</div></article>)}</div>
  </section>
  {story&&<section className="mt-10 rounded-2xl border p-5"><h2 className="text-xl font-bold">{t('Social Story Preview')}</h2><img src={story} alt={t('Social Story Preview')} className="mx-auto my-5 max-h-[70vh] rounded-xl"/><a download={'sellpostly-look-'+gender+'.png'} href={story} className="inline-flex rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white">{t('Download Story PNG')}</a></section>}
  <p role="status" className="my-4 text-sm">{notice&&t(notice)}</p>{preview&&<p className="text-sm text-slate-600">{t('Preview only')}</p>}
  {share&&<ShareModal url={url} title={shop.name+' — '+t('Shop the Look')} onClose={()=>setShare(false)}/>}
  <BuyerStoreFooter storeSlug={slug} allowDisputes={shop.shopMode==='personal'}/>
 </main>;
}
