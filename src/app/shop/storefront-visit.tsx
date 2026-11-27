'use client';
import {useEffect} from 'react';

let visitor: string|undefined;
export function storefrontVisitor(){
 if(visitor)return visitor;
 try {
  const key='sellpostly-storefront-session';
  visitor=sessionStorage.getItem(key)||crypto.randomUUID();
  sessionStorage.setItem(key,visitor);
  return visitor;
 }catch{
  visitor=globalThis.crypto?.randomUUID?.();
  return visitor;
 }
}

export function StorefrontVisit({slug}:{slug?:string}){
 useEffect(()=>{
  if(!slug)return;
  const visitorId=storefrontVisitor();
  if(visitorId)void fetch('/api/storefront/visit',{method:'POST',headers:{'Content-Type':'application/json'},
   keepalive:true,body:JSON.stringify({slug,visitorId})}).catch(()=>{});
 },[slug]);
 return null;
}
