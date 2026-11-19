'use client';
import {useEffect,useState} from 'react';
import {useLanguage} from '../language-context';
import {decodeShop,shopKey,validateShop,type Shop} from './shop-data';
import ProductLanding from './product-landing';
export default function LocalProduct({productId}:{productId:string}){
 const {t}=useLanguage(),[shop,setShop]=useState<Shop|null>(null),[snapshot,setSnapshot]=useState<string|undefined>(),[loaded,setLoaded]=useState(false);
 useEffect(()=>{let active=true;(async()=>{try{const value=new URLSearchParams(location.search).get('s')||undefined;const next=value?await decodeShop(value):validateShop(JSON.parse(localStorage.getItem(shopKey)||'null'));if(active&&next.shopMode==='personal'){setShop(next);setSnapshot(value);}}catch{}finally{if(active)setLoaded(true);}})();return()=>{active=false;};},[]);
 if(!loaded)return <p role="status" className="p-8">{t('Loading Product')}</p>;
 if(!shop)return <main className="p-8"><p>{t('Product Not Found')}</p><a className="underline" href="/shop">{t('Back to Store')}</a></main>;
 return <ProductLanding shop={shop} productId={productId} snapshot={snapshot}/>;
}

