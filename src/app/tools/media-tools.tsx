'use client';
import {useState} from 'react';
import {useLanguage} from '../language-context';
import GeminiTools from './gemini-tools';
import ImageStudio from './image-studio';
import VideoSocial from './video-social';
export default function MediaTools(){const {t}=useLanguage(),[tab,setTab]=useState('image');return <main className="mx-auto max-w-6xl px-5 py-14"><h1 className="text-4xl font-black tracking-tight">{t('Seller Media & Storefront Tools')}</h1><p className="my-5 max-w-3xl text-lg text-slate-600">{t('Crop, polish, convert and resize locally. Capture video covers and create storefront QR codes without uploading your files.')}</p><div role="tablist" aria-label={t('Media Tools')} className="mb-8 flex flex-wrap gap-3">{(['image','video'] as const).map(id=><button type="button" role="tab" aria-selected={tab===id} aria-controls={'tools-'+id} id={'tab-'+id} key={id} className={tab===id?'rounded-full bg-emerald-700 px-5 py-3 font-bold text-white':'rounded-full border px-5 py-3 font-bold'} onClick={()=>setTab(id)}>{t(id==='image'?'Image Studio':'Video & Social')}</button>)}</div><div role="tabpanel" id="tools-image" aria-labelledby="tab-image" hidden={tab!=='image'}><ImageStudio/></div><div role="tabpanel" id="tools-video" aria-labelledby="tab-video" hidden={tab!=='video'}><VideoSocial/></div><GeminiTools/></main>;}
