 'use client';
import {useEffect,useRef,useState} from 'react';
import {useLanguage,type Language} from '../language-context';
import {writingMessages,type WritingErrorCode} from '../../lib/creator-writing';
export default function GeminiWriterPanel(){
 const {t,language,setLanguage}=useLanguage();
 const [topic,setTopic]=useState(''),[contentType,setContentType]=useState('article'),[prompt,setPrompt]=useState(''),[content,setContent]=useState(''),[busy,setBusy]=useState<''|'prompt'|'write'>(''),[notice,setNotice]=useState<WritingErrorCode|''>(''),[copied,setCopied]=useState('');
 const task=useRef(0),controller=useRef<AbortController|null>(null);
 useEffect(()=>{task.current++;controller.current?.abort();setBusy('');setPrompt('');setContent('');setNotice('');setCopied('');},[language]);
 useEffect(()=>()=>{task.current++;controller.current?.abort();},[]);
 function reset(){task.current++;controller.current?.abort();setBusy('');setPrompt('');setContent('');setNotice('');setCopied('');}
 async function generate(action:'prompt'|'write'){
  if(action==='prompt'&&!topic.trim()||action==='write'&&!prompt.trim())return;
  const version=++task.current;controller.current?.abort();controller.current=new AbortController();
  setBusy(action);setNotice('');setCopied('');if(action==='prompt'){setPrompt('');setContent('');}else setContent('');
  try{const response=await fetch('/api/ai/write',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.current.signal,body:JSON.stringify({action,topic,contentType,language,...(action==='write'?{prompt}:{})})});
   const data=await response.json();if(version!==task.current)return;
   if(!response.ok){setNotice(data.error in writingMessages?data.error:'UNAVAILABLE');return;}
   if(data.source!=='gemini'||typeof data.text!=='string'||!data.text.trim()){setNotice('UNAVAILABLE');return;}
   if(action==='prompt')setPrompt(data.text);else setContent(data.text);
  }catch{if(version===task.current)setNotice('UNAVAILABLE');}finally{if(version===task.current)setBusy('');}
 }
 async function copy(which:'prompt'|'content'){try{await navigator.clipboard.writeText(which==='prompt'?prompt:content);setCopied(which);}catch{setCopied('failed');}}
 function download(){const url=URL.createObjectURL(new Blob([content],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=(topic.normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,'-').slice(0,70)||'content')+'-'+language+'.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 const field='mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 disabled:opacity-60',button='rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50';
 return <section className="my-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7" aria-label={t('Content Creator')}>
  <div className="grid gap-4 sm:grid-cols-2">
   <label className="sm:col-span-2">{t('Keywords / Topic')}<input className={field} dir="auto" maxLength={300} value={topic} placeholder={t('Enter keywords or a topic to begin.')} onChange={e=>{reset();setTopic(e.target.value);}}/></label>
   <label>{t('Content Type')}<select className={field} value={contentType} onChange={e=>{reset();setContentType(e.target.value);}}><option value="article">{t('Article')}</option><option value="social">{t('Social Post')}</option><option value="video">{t('Video Script')}</option><option value="newsletter">{t('Newsletter')}</option></select></label>
   <label>{t('Writing Language')}<select className={field} value={language} onChange={e=>setLanguage(e.target.value as Language)}><option value="en">EN</option><option value="fr">FR</option><option value="ar">العربية</option></select></label>
  </div>
  <button type="button" className={button} disabled={!!busy||!topic.trim()} aria-busy={busy==='prompt'} onClick={()=>generate('prompt')}>{t(busy==='prompt'?'Generating…':'Generate Prompt')}</button>
  <p className="text-sm text-slate-600">{t('Gemini writes from your topic and edited prompt. No template content is substituted.')}</p>
  <p role="status" aria-live="polite" className="text-sm text-amber-900">{notice&&t(writingMessages[notice])}</p>
  <div className="space-y-3"><label className="block font-semibold">{t('Step 1 — Writing Prompt')}<textarea className={field} rows={9} dir="auto" value={prompt} maxLength={6000} disabled={!!busy} placeholder={t('Your editable writing prompt will appear here.')} onChange={e=>{setPrompt(e.target.value);setContent('');setCopied('');}}/></label>
   <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 font-semibold disabled:opacity-50" disabled={!prompt.trim()||!!busy} onClick={()=>copy('prompt')}>{t(copied==='prompt'?'Copied!':'Copy Prompt')}</button>
  </div>
  <button type="button" className={button} disabled={!!busy||!prompt.trim()} aria-busy={busy==='write'} onClick={()=>generate('write')}>{t(busy==='write'?'Generating…':'Write Article from Prompt')}</button>
  <div className="space-y-3"><label className="block font-semibold">{t('Step 2 — Finished Content')}<textarea className={field+' font-mono text-sm leading-relaxed'} rows={20} dir="auto" value={content} disabled={!!busy} placeholder={t('Your complete article or content will appear here.')} onChange={e=>{setContent(e.target.value);setCopied('');}}/></label>
   <div className="flex flex-wrap gap-3"><button type="button" className="rounded-lg border border-slate-300 px-4 py-2 font-semibold disabled:opacity-50" disabled={!content.trim()||!!busy} onClick={()=>copy('content')}>{t(copied==='content'?'Copied!':'Copy Content')}</button><button type="button" className={button} disabled={!content.trim()||!!busy} onClick={download}>{t('Download .md')}</button></div>
  </div>
  {copied==='failed'&&<p role="alert">{t('Copy failed. Select the text to copy it manually.')}</p>}
 </section>;
}
