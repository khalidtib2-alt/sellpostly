'use client';
import {useEffect,useRef,useState} from 'react';
import type {Message} from '../translations';
import {useLanguage} from '../language-context';
import {extractProductIdentity,imageSearchLinks,isStudioCover,type VisualNiche} from './product-identity';
import {isAmazonCdnImage} from './affiliate-compliance';
import {unbrandedQuery} from './unbranded-query';
import {isLocalStock,localPhotos,resolvePhotos,selectStock,type StockPhoto} from './stock-photos';
export default function AffiliateImageEditor({title,category,gender='unisex',override,onOverride,customImage,stockPhoto,onPhoto}:{title:string;category:string;gender?:string;override:string;onOverride:(v:string)=>void;selected?:VisualNiche;onSelect?:(v:VisualNiche|undefined)=>void;customImage:string;stockPhoto?:StockPhoto;onPhoto?:(v:StockPhoto)=>void}){
 const {t}=useLanguage(),identity=extractProductIdentity(override||title,category),links=imageSearchLinks(override||title,category),query=unbrandedQuery(override||title,category,gender);
 const [photos,setPhotos]=useState<StockPhoto[]>(()=>localPhotos(query)),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 const callback=useRef(onPhoto);callback.current=onPhoto;const previousQuery=useRef(query),latestImage=useRef(customImage);latestImage.current=customImage;
 const custom=!!customImage&&!isLocalStock(customImage)&&!stockPhoto&&!isAmazonCdnImage(customImage)&&!isStudioCover(customImage)&&!customImage.startsWith('/demo-products/');
 useEffect(()=>{
  const controller=new AbortController(),queryChanged=previousQuery.current!==query;previousQuery.current=query;setBusy(true);setError(false);
  resolvePhotos(query,controller.signal).then(async choices=>{if(controller.signal.aborted)return;setPhotos(choices);
   if(!custom&&choices[0]&&(!stockPhoto||queryChanged)){try{const p=await selectStock(choices[0],query);if(!controller.signal.aborted)callback.current?.(p);}catch{if(!controller.signal.aborted){setPhotos(localPhotos(query));callback.current?.(localPhotos(query)[0]);}}}
  }).catch(()=>{}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});return()=>controller.abort();
 },[query,custom]);
 async function choose(photo:StockPhoto){setBusy(true);setError(false);try{const before=latestImage.current;await selectStock(photo,query);if(latestImage.current===before)callback.current?.(photo);}catch{setError(true);}finally{setBusy(false);}}
 const next=photos[(Math.max(-1,photos.findIndex(p=>p.url===customImage))+1)%photos.length];
 return <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:col-span-2" aria-label={t('Product Identity & Images')}>
  <p className="text-sm font-semibold text-emerald-800">{t('Detected:')} <span dir="auto">{identity.coreName||t('Enter a product title')}</span></p>
  <label className="my-4 block text-sm font-semibold">{t('Confirm Brand / Model')}<input type="text" maxLength={140} value={override} placeholder={identity.coreName} onChange={e=>onOverride(e.target.value)} className="mt-2 w-full rounded-xl border p-3 font-normal"/></label>
  <h3 className="font-bold">{t('Representative style photo')}</h3><p className="my-2 text-xs text-slate-600">{t('Generic photo search')}: <span dir="ltr">{t(query as Message)}</span></p>
  <p className="mb-4 text-sm text-slate-600">{t('Representative photos show a style, not the exact branded product. Upload your own photo for an exact match.')}</p>
  <button type="button" disabled={busy||!next} onClick={()=>next&&void choose(next)} className="mb-4 rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{t(busy?'Finding photos…':'Next Similar Photo')}</button>
  {error&&<p role="status" className="mb-3 text-sm">{t('Could not select this photo. Try another photo or upload your own.')}</p>}
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{photos.map(p=><button key={p.id} type="button" disabled={busy} aria-label={t('Use this photo')} aria-pressed={customImage===p.url} onClick={()=>void choose(p)} className={'overflow-hidden rounded-xl border-2 bg-white '+(customImage===p.url?'border-emerald-700':'border-transparent')}><img src={p.url} alt={t('Representative style photo')} className="aspect-[4/3] w-full object-cover" loading="lazy"/></button>)}</div>
  {stockPhoto&&<p className="my-3 text-xs"><a href={stockPhoto.pageUrl} target="_blank" rel="noopener noreferrer">{t('Photo credit')}: {stockPhoto.photographer==='Pexels contributor'?t('Pexels contributor'):stockPhoto.photographer} / {stockPhoto.provider}</a> · <a href={stockPhoto.licenseUrl} target="_blank" rel="noopener noreferrer">{t('Photo license')}</a></p>}
  <h3 className="mb-3 mt-6 font-bold">{t('Find Identical Compliant Image')}</h3><div className="grid gap-2 sm:grid-cols-3"><a href={links.official} target="_blank" rel="noopener noreferrer" className="rounded-xl border bg-white p-3 text-center text-sm font-semibold">{t('Official Brand Media Kit')}</a><a href={links.commons} target="_blank" rel="noopener noreferrer" className="rounded-xl border bg-white p-3 text-center text-sm font-semibold">Wikimedia Commons</a><a href={links.unsplash} target="_blank" rel="noopener noreferrer" className="rounded-xl border bg-white p-3 text-center text-sm font-semibold">{t('Free Licensed Photos (Unsplash)')}</a></div>
  <p className="mt-3 text-xs text-slate-600">{t('Check the exact model, image license, attribution and brand permissions. Unsplash searches lifestyle photos; results are not guaranteed to show your exact product.')}</p>
 </section>;
}
