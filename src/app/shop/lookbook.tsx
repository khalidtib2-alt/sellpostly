'use client';
import NextImage from 'next/image';
import {lookShareAction,type LookPlatform} from './lookbook-share';
import LookbookSocialIcon from './lookbook-social-icon';
import {useEffect,useRef,useState} from 'react';
import {lookbookMetadata} from '../../lib/lookbook-seo';
import {metadataToHead} from '../localized-seo';
import {useLanguage} from '../language-context';
import {dailyOutfit,utcLookDay,validLookDay,lookShuffle,zoneLabels,zonePositions} from '../../lib/daily-look';
import LookbookStage from './lookbook-stage';
import {useShopCart} from './use-shop-cart';
import {safeUrl,type Shop,type Product} from './shop-data';
import {productPath,productShareUrl,storePath} from './product-links';
import {lookbookPath,lookbookImage} from './lookbook-data';
import {isAmazonDestination,disclosurePresets,amazonAffiliateProduct} from './affiliate-compliance';
import ProductPrice from './product-price';
import ShareModal from './share-modal';
import BuyerStoreFooter from './buyer-store-footer';
import {translations,type Message} from '../translations';
export default function Lookbook({shop,slug,snapshot,preview=false}:{shop:Shop;slug?:string;snapshot?:string;preview?:boolean}){
 const {t,language,setLanguage}=useLanguage(),[gender,setGender]=useState<'women'|'men'>('women'),[selected,setSelected]=useState(''),[hovered,setHovered]=useState(''),[custom,setCustom]=useState<Partial<Record<'women'|'men',string>>>({}),[share,setShare]=useState(false),[story,setStory]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState<Message|''>('');
 useEffect(()=>{if(slug)metadataToHead(lookbookMetadata(slug,shop.shopMode,shop,language));},[slug,shop,language]);
 const request=useRef(0),storyUrl=useRef(''),currentDay=useRef('');
 const [day,setDay]=useState(''),[shuffle,setShuffle]=useState(0);
 const [cart,setCart]=useShopCart(shop,slug,snapshot,shop.shopMode==='personal');
 const active=hovered||selected;
 const outfit=dailyOutfit(shop.products,gender,day,shuffle,slug||shop.shopId||shop.customSlug||shop.name,shop.shopMode),products=outfit.map(item=>item.product),outfitKey=products.map(p=>p.id).join('|'),photo=custom[gender]||shop.lookbookImages?.[gender]||lookbookImage(gender);
 const path=lookbookPath(slug,shop.shopMode,snapshot),url=productShareUrl(path+(path.includes('?')?'&':'?')+new URLSearchParams({gender,...day?{day}:{},...shuffle?{look:String(shuffle)}:{}}));
 useEffect(()=>{
  const params=new URLSearchParams(location.search),value=params.get('gender'),sharedDay=params.get('day');
  if(value==='men'||value==='women')setGender(value);currentDay.current=validLookDay(sharedDay)?sharedDay!:utcLookDay();setDay(currentDay.current);setShuffle(lookShuffle(params.get('look')));
  const refresh=()=>{if(!validLookDay(sharedDay)){const next=utcLookDay();if(currentDay.current!==next){currentDay.current=next;setDay(next);setShuffle(0);}}};
  const timer=setInterval(refresh,30000);window.addEventListener('focus',refresh);
  return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);request.current++;if(storyUrl.current)URL.revokeObjectURL(storyUrl.current);};
 },[]);
 useEffect(()=>{request.current++;setSelected('');setHovered('');setStory('');setNotice('');if(storyUrl.current){URL.revokeObjectURL(storyUrl.current);storyUrl.current='';}},[gender,photo,language,day,shuffle,outfitKey]);
 function choose(value:'men'|'women'){if(value===gender)return;setGender(value);setShuffle(0);const next=new URL(location.href);next.searchParams.set('gender',value);next.searchParams.delete('look');history.replaceState(history.state,'',next.pathname+next.search);}
 function shuffleLook(){setShuffle(current=>(current+1)%1000000);}
 function addToCart(product:Product){if(shop.shopMode!=='personal'||product.stock===0)return;setSelected(product.id);setCart(current=>({...current,[product.id]:Math.min(99,product.stock??99,(current[product.id]||0)+1)}));setNotice('Added to cart');}
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
   const start=language==='ar'?1008:72;ctx.font='bold 42px sans-serif';ctx.fillText(shop.name.slice(0,40),start,88,936);ctx.font='bold 64px sans-serif';ctx.fillText(t('Shop the Look'),start,172,936);ctx.font='20px sans-serif';ctx.fillText(day,start,199,936);
   const source=photo===lookbookImage(gender)?'/_next/image?url='+encodeURIComponent(photo)+'&w=1080&q=75':photo;
   let model:HTMLImageElement;try{model=await load(source);}catch{model=await load(lookbookImage(gender));}
   // Contain the complete outfit. The exported card never requires a cross-origin proxy.
   const scale=Math.min(900/model.width,1120/model.height),w=model.width*scale,h=model.height*scale;ctx.drawImage(model,(1080-w)/2,210+(1120-h)/2,w,h);
   ctx.textAlign=language==='ar'?'right':'left';ctx.fillStyle='#0f172a';ctx.font='bold 31px sans-serif';ctx.fillText(t(gender==='women'?'Women':'Men'),start,1380);
   for(let i=0;i<products.length;i++){const p=products[i],y=1440+i*78;ctx.font='bold 27px sans-serif';ctx.fillText(productName(p).slice(0,70),start,y,936);if(!(shop.shopMode==='affiliate'&&amazonAffiliateProduct(p))){ctx.font='24px sans-serif';ctx.fillText(p.price,start,y+29,936);}}
   ctx.font='20px sans-serif';ctx.fillStyle='#475569';ctx.fillText(t('Style inspiration; product suggestions only.'),start,1750,936);
   ctx.font='24px sans-serif';ctx.fillStyle='#475569';ctx.fillText(t('Created with SellPostly.com'),start,1820,936);ctx.font='20px sans-serif';ctx.fillText(slug?productShareUrl(storePath(slug,shop.shopMode)):'SellPostly.com',start,1870,936);
   const blob=await new Promise<Blob>((resolve,reject)=>c.toBlob(value=>value?resolve(value):reject(Error()),'image/png'));if(id!==request.current)return;
   if(storyUrl.current)URL.revokeObjectURL(storyUrl.current);const next=URL.createObjectURL(blob);storyUrl.current=next;setStory(next);
  }catch{setNotice('Could not create the story card. Try a local outfit photo.');}finally{setBusy(false);}
 }
 function selectPin(product:Product){setSelected(product.id);document.getElementById('look-'+product.id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});}
 function quickShare(platform:LookPlatform){
  if(!slug&&!snapshot)return;
  const action=lookShareAction(platform,url,shop.name+' - '+t('Shop the Look'),photo);
  if(action.copy)try{void navigator.clipboard.writeText(url).then(()=>setNotice('Look link copied. Paste it into your post or bio.')).catch(()=>setNotice('Copy failed. Select the text to copy it manually.'));}catch{setNotice('Copy failed. Select the text to copy it manually.');}
  window.open(action.href,'_blank','noopener,noreferrer');
 }
 const disclosure=shop.affiliateDisclosure||disclosurePresets[0].text;
 const preset=disclosurePresets.find(p=>[p.text,translations[p.text].fr,translations[p.text].es,translations[p.text].ar].some(candidate=>candidate===disclosure));
 return <main className="shop-surface lookbook-page mx-auto max-w-7xl px-5 py-8" data-surface={shop.shopTheme} data-accent={shop.shopAccent||'emerald'}>
  <header className="mb-7 flex flex-wrap items-center justify-between gap-4"><a href={slug?storePath(slug,shop.shopMode):'/shop'} className="font-semibold underline">{t('Back to Store')}</a><div role="group" aria-label={t('Language')} className="flex rounded-full border bg-white p-1">{(['en','fr','es','ar'] as const).map(code=><button key={code} type="button" aria-pressed={language===code} onClick={()=>setLanguage(code)} className={'rounded-full px-3 py-2 text-sm font-bold '+(language===code?'bg-emerald-700 text-white':'')}>{code.toUpperCase()}</button>)}</div></header>
  <p className="text-sm font-bold uppercase tracking-widest text-emerald-800">{shop.name}</p><h1 className="mt-3 text-4xl font-black sm:text-6xl">{'\u2728 '}{t('Shop the Look')}</h1><p className="mt-4 max-w-2xl text-slate-600">{t('Discover an editorial look and the latest curated picks. Products are styling suggestions, not items worn or endorsed by the model.')}</p>
  {shop.shopMode==='affiliate'&&<aside className="mt-5 rounded-xl border bg-slate-50 p-4 text-sm"><strong>{t('Affiliate Disclosure')}: </strong>{preset?t(preset.text):disclosure}</aside>}
  <div className="lookbook-toolbar"><div role="group" aria-label={t('Gender / Audience')} className="flex rounded-full border bg-white p-1">{(['women','men'] as const).map(value=><button key={value} type="button" aria-pressed={gender===value} onClick={()=>choose(value)} className={'rounded-full px-6 py-3 font-bold '+(gender===value?'bg-emerald-700 text-white':'')}>{t(value==='women'?'Women':'Men')}</button>)}</div><div className="lookbook-sharing"><button disabled={!slug&&!snapshot} type="button" onClick={()=>setShare(true)} className="rounded-xl border px-5 py-3 font-bold">{t('Share This Look')}</button><div className="lookbook-socials" role="group" aria-label={t('Share This Look')}>{(['Instagram','TikTok','WhatsApp','Pinterest'] as const).map(platform=><button key={platform} type="button" disabled={!slug&&!snapshot} aria-label={platform} title={(platform==='Instagram'||platform==='TikTok'?t('Copy Link')+' + ':'')+platform} onClick={()=>quickShare(platform)}><LookbookSocialIcon name={platform}/></button>)}</div></div></div>
  <div className="lookbook-daily-toolbar"><p><strong>{t('Daily curated look')}</strong> <time dateTime={day}>{day}</time><span>{t('Rotates daily at midnight UTC')}</span></p><button type="button" disabled={!products.length} onClick={shuffleLook} className="lookbook-shuffle">{t('Shuffle New Look')}</button>{shop.shopMode==='personal'&&<a href={slug?storePath(slug,'personal'):'/shop'} className="font-semibold underline">{t('Cart')} ({Object.values(cart).reduce((a,b)=>a+b,0)})</a>}</div>
  <p className="mb-4 text-sm text-slate-600">{t('Tap a glowing garment dot or a product card to explore the look.')}</p>
  <section className="lookbook-scene grid gap-7 lg:grid-cols-[.9fr_1.1fr]" aria-label={t('Shop the Look')}>
   <div><LookbookStage><div className="lookbook-model lookbook-photography relative mx-auto aspect-[2/3] overflow-hidden rounded-3xl bg-stone-100">{(['women','men'] as const).map(value=>{const customPhoto=custom[value]||shop.lookbookImages?.[value],classes='lookbook-model-photo absolute inset-0 h-full w-full object-cover object-top '+(gender===value?'lookbook-visible':'lookbook-hidden');return customPhoto?<img key={value} src={customPhoto} alt={t('Editorial outfit preview')} aria-hidden={gender!==value} className={classes}/>:<NextImage key={value} fill sizes="(min-width:1024px) 45vw, 100vw" src={lookbookImage(value)} alt={t('Editorial fashion inspiration')} aria-hidden={gender!==value} className={classes}/>;})}{products.map((p,i)=><button key={p.id} type="button" aria-label={t(zoneLabels[outfit[i].zone])+': '+productName(p)} aria-pressed={selected===p.id} data-active={active===p.id} onMouseEnter={()=>setHovered(p.id)} onMouseLeave={()=>setHovered('')} onFocus={()=>setHovered(p.id)} onBlur={()=>setHovered('')} onClick={()=>selectPin(p)} className="lookbook-pin lookbook-garment-zone" title={t(zoneLabels[outfit[i].zone])+': '+productName(p)} style={{left:zonePositions[outfit[i].zone].x+'%',top:zonePositions[outfit[i].zone].y+'%',width:zonePositions[outfit[i].zone].width+'%',height:zonePositions[outfit[i].zone].height+'%'}}><span className="lookbook-zone-dot" aria-hidden="true"/><span className="lookbook-zone-label">{t(zoneLabels[outfit[i].zone])}</span></button>)}</div></LookbookStage><p className="mt-3 text-center text-xs text-slate-600">{custom[gender]||shop.lookbookImages?.[gender]?t('Custom outfit photo. Product matches are curated suggestions.'):t('AI-created editorial styling inspiration. Models do not wear or endorse these products.')}</p><label className="mt-4 inline-block cursor-pointer rounded-xl border px-4 py-3 font-semibold">{t('Try Your Outfit Photo')}<input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp" onChange={e=>void upload(e.target.files?.[0])}/></label>{custom[gender]&&<button type="button" className="ms-3 underline" onClick={()=>setCustom(current=>({...current,[gender]:undefined}))}>{t('Reset')}</button>}<p className="mt-2 text-xs text-slate-600">{t('Your preview photo stays in this browser and is included only in your downloaded story card.')}</p></div>
   <div key={gender} className="lookbook-products lookbook-products-grid">{!products.length&&<p className="rounded-2xl border p-6 sm:col-span-2">{t('No products in this collection yet. Try the other audience.')}</p>}{products.map((p,i)=><article key={p.id} id={'look-'+p.id} data-active={active===p.id} tabIndex={0} aria-label={productName(p)} onClick={event=>{if(!(event.target as HTMLElement).closest('a,button'))selectPin(p);}} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==='Enter'||event.key===' ')){event.preventDefault();selectPin(p);}}} onMouseEnter={()=>setHovered(p.id)} onMouseLeave={()=>setHovered('')} onFocus={()=>setHovered(p.id)} onBlur={()=>setHovered('')} className="lookbook-pick"><div className="lookbook-pick-image">{p.image&&<img src={p.image} alt={productName(p)} loading="lazy"/>}</div><div className="lookbook-pick-body"><h2 className="line-clamp-2 font-bold">{productName(p)}</h2><p className="lookbook-garment-label">{t(zoneLabels[outfit[i].zone])}</p><ProductPrice product={p} mode={shop.shopMode}/>{shop.shopMode==='personal'&&<button type="button" disabled={p.stock===0} onClick={()=>addToCart(p)} className="lookbook-add-cart">{t('Add to Cart')}</button>}{destination(p)&&<a href={destination(p)} target={shop.shopMode==='affiliate'?'_blank':undefined} rel={shop.shopMode==='affiliate'?'nofollow sponsored noopener noreferrer':undefined} className="mt-auto inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white">{t(shop.shopMode==='affiliate'?isAmazonDestination(p.url)?'Check Price on Amazon':'View Best Deal':'View Product')}</a>}</div></article>)}</div>
  </section>
  <section className="lookbook-bottom-strip" aria-label={t('Curated picks')}><div><p className="mb-2 text-xs font-bold uppercase tracking-wider">{t('Curated picks')}</p><div className="lookbook-curated-thumbs">{products.map((p,i)=><button key={p.id} type="button" aria-label={t('View Product')+': '+productName(p)} data-active={active===p.id} onClick={()=>selectPin(p)} onMouseEnter={()=>setHovered(p.id)} onMouseLeave={()=>setHovered('')} onFocus={()=>setHovered(p.id)} onBlur={()=>setHovered('')}>{p.image&&<img src={p.image} alt=""/>}</button>)}</div></div><div className="lookbook-story-action">{story?<img src={story} alt={t('Social Story Preview')}/>:<span className="lookbook-story-ratio" aria-hidden="true">9:16</span>}<div><button disabled={busy||!products.length} type="button" onClick={()=>void renderStory()} className="rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white disabled:opacity-50">{t(busy?'Creating story card...':'9:16 Social Story Preview')}</button>{story&&<a download={'sellpostly-look-'+gender+'.png'} href={story} className="mt-2 block text-center text-sm font-semibold underline">{t('Download Story PNG')}</a>}</div></div></section>
  {story&&<section className="mt-10 rounded-2xl border p-5"><h2 className="text-xl font-bold">{t('Social Story Preview')}</h2><img src={story} alt={t('Social Story Preview')} className="mx-auto my-5 max-h-[70vh] rounded-xl"/><a download={'sellpostly-look-'+gender+'.png'} href={story} className="inline-flex rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white">{t('Download Story PNG')}</a></section>}
  <p role="status" className="my-4 text-sm">{notice&&t(notice)}</p>{preview&&<p className="text-sm text-slate-600">{t('Preview only')}</p>}
  {share&&<ShareModal url={url} title={shop.name+' - '+t('Shop the Look')} onClose={()=>setShare(false)}/>}
  <BuyerStoreFooter storeSlug={slug} allowDisputes={shop.shopMode==='personal'}/>
 </main>;
}
