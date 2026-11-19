'use client';
import {useCallback,useEffect,useRef,useState,type SetStateAction} from 'react';
import {cartStorageKey,legacyCartStorageKey,normalizeCart} from './product-links';
import {readCart,writeCart,cartChangedEvent} from './cart-storage';
import type {Shop} from './shop-data';
export function useShopCart(shop:Shop,slug?:string,snapshot?:string,ready=true){
 const key=cartStorageKey(slug,snapshot),legacy=legacyCartStorageKey(slug,snapshot);
 const [cart,setState]=useState<Record<string,number>>({});
 const current=useRef({key:'',cart:{} as Record<string,number>});
 const ids=JSON.stringify(shop.products.map(p=>p.id));
 useEffect(()=>{
  if(!ready)return;
  const hydrate=()=>{const next=readCart(localStorage,key,JSON.parse(ids),legacy,current.current.key===key?current.current.cart:{});current.current={key,cart:next};setState(next);};
  const storage=(event:StorageEvent)=>{if(event.key===key||event.key===null)hydrate();};
  const changed=(event:Event)=>{if((event as CustomEvent).detail===key)hydrate();};
  const visible=()=>{if(document.visibilityState==='visible')hydrate();};
  hydrate();
  window.addEventListener('storage',storage);window.addEventListener(cartChangedEvent,changed);
  window.addEventListener('focus',hydrate);window.addEventListener('pageshow',hydrate);document.addEventListener('visibilitychange',visible);
  return()=>{window.removeEventListener('storage',storage);window.removeEventListener(cartChangedEvent,changed);window.removeEventListener('focus',hydrate);window.removeEventListener('pageshow',hydrate);document.removeEventListener('visibilitychange',visible);};
 },[key,legacy,ready,ids]);
 const setCart=useCallback((action:SetStateAction<Record<string,number>>)=>{
  if(!ready)return;
  const previous=readCart(localStorage,key,JSON.parse(ids),legacy,current.current.key===key?current.current.cart:{});
  const next=normalizeCart(typeof action==='function'?action(previous):action,JSON.parse(ids));
  current.current={key,cart:next};setState(next);
  if(writeCart(localStorage,key,next))window.dispatchEvent(new CustomEvent(cartChangedEvent,{detail:key}));
 },[key,legacy,ready,ids]);
 return [cart,setCart] as const;
}
