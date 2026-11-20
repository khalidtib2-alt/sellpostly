import 'server-only';
import {cache} from 'react';
import {publicShop,db} from './db';
import type {Query} from './order-service';
import {validateShop,type ShopMode} from '../app/shop/shop-data';
import {productShareUrl,storePath} from '../app/shop/product-links';
export const loadPublicStore=cache((slug:string,mode?:ShopMode)=>publicShop(slug,undefined,mode));
/** Read only public catalog fields; never expose owner keys, contacts, wallets or orders. */
export async function publicStorefrontEntries(query:Query=async(sql,args)=>db().query(sql,args)){
 const rows=await query('SELECT slug,updated_at,catalog,affiliate_catalog,personal_catalog FROM shops WHERE published=true AND suspended=false ORDER BY slug',[]);
 return rows.flatMap(row=>{
  if(!/^[a-z0-9][a-z0-9-]{2,63}$/.test(String(row.slug)))return [];
  return (['affiliate','personal'] as const).flatMap(mode=>{
   const raw=row[mode+'_catalog']??(row.catalog?.shopMode===mode?row.catalog:null);
   try{const shop=validateShop(raw);if(shop.shopMode!==mode||!shop.products.length)return [];const date=new Date(row.updated_at);return [{url:productShareUrl(storePath(row.slug,mode)),...(Number.isNaN(date.getTime())?{}:{lastModified:date})}];}catch{return [];}
  });
 });
}
