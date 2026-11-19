'use client';
import {useEffect,useState} from 'react';
import {cartStorageKey,normalizeCart} from './product-links';
import type {Shop} from './shop-data';
export function useShopCart(shop:Shop,slug?:string,snapshot?:string,ready=true){
 const key=cartStorageKey(slug,snapshot),[cart,setCart]=useState<Record<string,number>>({}),[initialized,setInitialized]=useState('');
 useEffect(()=>{if(!ready)return;try{setCart(normalizeCart(JSON.parse(localStorage.getItem(key)||'{}'),shop.products.map(p=>p.id)));}catch{setCart({});}setInitialized(key);},[key,ready]);
 useEffect(()=>{if(ready&&initialized===key)try{localStorage.setItem(key,JSON.stringify(normalizeCart(cart,shop.products.map(p=>p.id))));}catch{}},[cart,key,ready,initialized,shop.products]);
 return [cart,setCart] as const;
}

