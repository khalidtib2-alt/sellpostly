'use client';
import {useEffect,useState} from 'react';
import SocialBrandIcon from './social-brand-icon';
import {socialBrandAction,type SharePlatform} from './social-brand-links';
import {useLanguage} from '../language-context';
export default function SocialShareBar({url,title,image='',getText,heading='Share this page'}:{url:string;title:string;image?:string;getText?:()=>string;heading?:'Share this page'|'Share Store'|'Share Product'}){
 const {t}=useLanguage(),[status,setStatus]=useState<'copied'|'error'|''>('');
 useEffect(()=>{if(status){const timer=setTimeout(()=>setStatus(''),2500);return()=>clearTimeout(timer);}},[status]);
 function share(platform:SharePlatform){if(!url)return;try{const action=socialBrandAction(platform,url,title,image,getText?.()||'');if(action.copy)try{void navigator.clipboard.writeText(action.copyText).then(()=>setStatus('copied')).catch(()=>setStatus('error'));}catch{setStatus('error');}if(action.href)window.open(action.href,'_blank','noopener,noreferrer');}catch{setStatus('error');}}
 return <section className="social-share-bar" aria-label={t(heading)}><h2>{t(heading)}</h2><div className="social-share-buttons">{(['WhatsApp','Facebook','X','Pinterest','Instagram','TikTok','Telegram','Copy'] as const).map(platform=><button key={platform} type="button" disabled={!url} data-brand={platform.toLowerCase()} className="social-brand" onClick={()=>share(platform)} aria-label={platform==='Copy'?t('Copy Link'):platform} title={platform==='Copy'?t('Copy Link'):platform==='Instagram'||platform==='TikTok'?t('Copy Link')+' + '+platform:platform}><SocialBrandIcon name={platform}/><span>{platform==='Copy'?t('Copy Link'):platform}</span></button>)}</div><p role="status">{status?t(status==='copied'?'Copied!':'Copy failed. Select the text to copy it manually.'):!url?t('Publish your shop to create a shareable product link.'):t('Instagram and TikTok: copy the link or caption, then paste it into your post or bio.')}</p></section>;
}
