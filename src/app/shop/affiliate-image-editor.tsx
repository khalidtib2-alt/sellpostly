'use client';
import {useLanguage} from '../language-context';
import {extractProductIdentity,imageSearchLinks,isStudioCover,type VisualNiche} from './product-identity';
import type {StockPhoto} from './stock-photos';
export default function AffiliateImageEditor({title,category,autoMatch=false,gender='unisex',override,onOverride,customImage,stockPhoto,onPhoto}:{title:string;category:string;autoMatch?:boolean;gender?:string;override:string;onOverride:(v:string)=>void;selected?:VisualNiche;onSelect?:(v:VisualNiche|undefined)=>void;customImage:string;stockPhoto?:StockPhoto;onPhoto?:(v:StockPhoto)=>void}){
 const {t}=useLanguage(),identity=extractProductIdentity(override||title,category),links=imageSearchLinks(override||title,category);
 return <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:col-span-2" aria-label={t('Product Identity & Images')}>
  <p className="text-sm font-semibold text-emerald-800">{t('Detected:')} <span dir="auto">{identity.coreName||t('Enter a product title')}</span></p>
  <label className="my-4 block text-sm font-semibold">{t('Confirm Brand / Model')}<input type="text" maxLength={140} value={override} placeholder={identity.coreName} onChange={e=>onOverride(e.target.value)} className="mt-2 w-full rounded-xl border p-3 font-normal"/></label>
  <h3 className="mb-3 mt-6 font-bold">{t('Find Identical Compliant Image')}</h3><div className="grid gap-2 sm:grid-cols-3"><a href={links.official} target="_blank" rel="noopener noreferrer" className="rounded-xl border bg-white p-3 text-center text-sm font-semibold">{t('Official Brand Media Kit')}</a><a href={links.commons} target="_blank" rel="noopener noreferrer" className="rounded-xl border bg-white p-3 text-center text-sm font-semibold">Wikimedia Commons</a><a href={links.unsplash} target="_blank" rel="noopener noreferrer" className="rounded-xl border bg-white p-3 text-center text-sm font-semibold">{t('Free Licensed Photos (Unsplash)')}</a></div>
  <p className="mt-3 text-xs text-slate-600">{t('Check the exact model, image license, attribution and brand permissions. Unsplash searches lifestyle photos; results are not guaranteed to show your exact product.')}</p>
 </section>;
}
