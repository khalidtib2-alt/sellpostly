'use client';
import {useEffect} from 'react';
import type {Metadata} from 'next';
import {useLanguage} from './language-context';
import {pageSeo,marketingSchema,type SeoPage} from '../lib/marketing-seo';
export function metadataToHead(meta:Metadata){
 document.title=String(meta.title||'SellPostly');
 const update=(name:string,value:unknown,property=false)=>{if(typeof value!=='string')return;const attr=property?'property':'name',nodes=document.head.querySelectorAll<HTMLMetaElement>('meta['+attr+'="'+name+'"]');if(nodes.length)nodes.forEach(node=>node.content=value);else{const node=document.createElement('meta');node.setAttribute(attr,name);node.content=value;document.head.append(node);}};
 update('description',meta.description);update('keywords',Array.isArray(meta.keywords)?meta.keywords.join(', '):meta.keywords);
 const og=meta.openGraph as {title?:string;description?:string;locale?:string}|undefined;update('og:title',og?.title,true);update('og:description',og?.description,true);update('og:locale',og?.locale,true);
 const twitter=meta.twitter as {title?:string;description?:string}|undefined;update('twitter:title',twitter?.title);update('twitter:description',twitter?.description);
}
export function schemaText(value:unknown){return JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');}
export default function LocalizedSeo({kind}:{kind:SeoPage}){const {language}=useLanguage();useEffect(()=>{metadataToHead(pageSeo(kind,language));},[kind,language]);return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:schemaText(marketingSchema(kind,language))}}/>;}
