'use client';
import {useEffect,useRef,useState} from 'react';
import {safeImage} from './shop-data';
import ShopLogo from './shop-logo';
import {useLanguage} from '../language-context';
import type {Message} from '../translations';
export default function ShopLogoEditor({value,name,onChange,onSave,disabled=false}:{value:string;name:string;onChange:(value:string)=>void;onSave?:(value:string)=>void;disabled?:boolean}){
 const {t}=useLanguage(),[url,setUrl]=useState(value),[busy,setBusy]=useState(false),[error,setError]=useState<Message|''>(''),revision=useRef(0);
 useEffect(()=>{setUrl(value);},[value]);useEffect(()=>()=>{revision.current++;},[]);
 async function upload(file?:File){if(!file)return;if(file.size>5000000||!/^image\/(png|jpeg|webp)$/.test(file.type)){setError('Photo must be under 5 MB.');return;}const id=++revision.current;setBusy(true);setError('');try{
  const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(Error());reader.onload=()=>resolve(String(reader.result));reader.readAsDataURL(file);});
  const image=await new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error());image.src=data;});
  const canvas=document.createElement('canvas'),scale=Math.min(1,256/Math.max(image.width,image.height));canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const ctx=canvas.getContext('2d');if(!ctx)throw Error();ctx.drawImage(image,0,0,canvas.width,canvas.height);if(id===revision.current)onChange(canvas.toDataURL('image/png'));
 }catch{if(id===revision.current)setError('Could not read this image. Try another file.');}finally{if(id===revision.current)setBusy(false);}}
 function apply(){const text=url.trim();if(text&&!safeImage(text)){setError('Enter a valid logo image URL.');return false;}revision.current++;setBusy(false);setError('');onChange(safeImage(text));return true;}
 return <fieldset disabled={disabled} className="shop-logo-editor bg-slate-900/90 border-white/10 text-white"><legend>{t('Shop Logo')}</legend><div className="shop-logo-editor-row"><ShopLogo logo={value} name={name}/><div><label className="shop-logo-upload">{t(busy?'Loading...':'Upload Logo')}<input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>void upload(e.target.files?.[0])}/></label>{value&&<button type="button" className="ms-3 underline" onClick={()=>{revision.current++;setBusy(false);setUrl('');onChange('');}}>{t('Remove Logo')}</button>}</div></div><label className="mt-3 block text-sm font-semibold">{t('Logo Image URL')}<input dir="ltr" className="mt-2 w-full rounded-xl border bg-white p-3" value={url.startsWith('data:')?'':url} placeholder="https://example.com/logo.png" maxLength={20000} onChange={e=>{revision.current++;setBusy(false);setUrl(e.target.value);setError('');}} onBlur={()=>{if(!url.startsWith('data:'))apply();}}/></label>{onSave&&<button type="button" className="shop-logo-upload mt-3" disabled={busy} onClick={()=>{if(apply())onSave(safeImage(url.trim()));}}>{t('Save Logo')}</button>}<p role="status" className="mt-2 text-sm">{error?t(error):t('PNG, JPG or WebP. Up to 5 MB. Your logo appears on your store and lookbook.')}</p></fieldset>;
}
