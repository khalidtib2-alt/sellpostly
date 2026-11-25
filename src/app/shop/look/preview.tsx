'use client';
import {useEffect,useState} from 'react';
import {decodeShop,validateShop,shopKey,type Shop} from '../shop-data';
import {modeCatalogKey} from '../catalog-modes';
import Lookbook from '../lookbook';
import {useLanguage} from '../../language-context';
export default function LookbookPreview(){const {t}=useLanguage(),[shop,setShop]=useState<Shop|null>(null),[snapshot,setSnapshot]=useState(''),[failed,setFailed]=useState(false);
 useEffect(()=>{let active=true;async function load(){try{const p=new URLSearchParams(location.search),s=p.get('s');const mode=p.get('mode')==='personal'?'personal':'affiliate';const value=s?await decodeShop(s):validateShop(JSON.parse(localStorage.getItem(shopKey)||localStorage.getItem(modeCatalogKey(mode))||'null'));if(active){setShop(value);setSnapshot(s||'');}}catch{if(active)setFailed(true);}}void load();return()=>{active=false;};},[]);
 return shop?<Lookbook shop={shop} slug={shop.customSlug} snapshot={snapshot||undefined} preview/>:<main className="mx-auto max-w-3xl p-8"><p role="status">{t(failed?'Could not open this shop link.':'Loading storefront…')}</p><a className="mt-4 inline-block underline" href="/shop">{t('Back to Store')}</a></main>;
}
