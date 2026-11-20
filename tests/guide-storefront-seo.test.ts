import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {PGlite} from '@electric-sql/pglite';
import guide from '../src/app/user-guide-data.json';
import {translations} from '../src/app/translations';
import {socialProfiles} from '../src/app/social-profiles';
import {storefrontMetadata,cardShareUrl} from '../src/lib/storefront-seo';
import {publicStorefrontEntries} from '../src/lib/public-storefront';
import {storefrontPreviewImage} from '../src/app/shop/storefront-preview-image';
import {validateShop} from '../src/app/shop/shop-data';
import type {Query} from '../src/lib/order-service';

const shop=validateShop({shopMode:'affiliate',name:'Curated Studio',bio:'Useful picks for everyday life.',products:[{id:'p',name:'Wireless headphones',url:'https://amazon.com/dp/B012345678',price:'49 USD',image:'https://m.media-amazon.com/a.jpg'}]});

test('guide includes 4 seller steps, 3 buyer steps, 4 audiences and 5 complete translated answers',()=>{
 assert.equal(guide.seller.length,4);assert.equal(guide.buyer.length,3);assert.equal(guide.audiences.length,4);assert.equal(guide.faq.length,5);
 for(const pair of [...guide.seller,...guide.buyer,...guide.audiences,...guide.faq])for(const key of pair){assert.ok(key.length>5);const localized=translations[key as keyof typeof translations];assert.ok(localized?.fr,key);assert.match(localized?.ar||'',/[\u0600-\u06ff]/,key);}
 const prose=guide.seller.flat().join(' ');for(const channel of ['TikTok','Instagram','Facebook','YouTube','Pinterest','WhatsApp','Google'])assert.ok(prose.includes(channel));
});

test('rendered guide FAQ matches its JSON-LD exactly and all social icons have accessible labels',()=>{
 const child=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import assert from 'node:assert/strict';import UserGuide,{jsonLd} from './src/app/user-guide.tsx';import Social from './src/app/social-connect.tsx';import {LanguageProvider} from './src/app/language-context.tsx';
 const html=renderToStaticMarkup(React.createElement(LanguageProvider,null,React.createElement(UserGuide,{standalone:true}),React.createElement(Social)));
 assert.equal((html.match(/<h1/g)||[]).length,1);const data=JSON.parse(html.match(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/)[1]);assert.equal(data['@type'],'FAQPage');assert.equal(data.mainEntity.length,5);
 for(const q of data.mainEntity){assert.ok(html.includes(q.name.replaceAll('&','&amp;')));assert.ok(q.acceptedAnswer.text.length>80);}
 for(const name of ['TikTok','Instagram','Facebook','YouTube','Pinterest','X'])assert.ok(html.includes('aria-label="'+name));assert.ok(!jsonLd({text:'</script><script>bad</script>'}).includes('<'));
 `],{cwd:process.cwd(),encoding:'utf8',timeout:60000});assert.equal(child.status,0,child.stderr||child.stdout);
});

test('social profile configuration validates domains and supplies functional sharing or guide fallbacks',()=>{
 const site='https://sellpostly.vercel.app/',links=socialProfiles({Instagram:'https://www.instagram.com/sellpostly/',TikTok:'javascript:alert(1)',Facebook:'https://facebook.com.evil.example/x',X:'https://x.com/sellpostly'},site);
 assert.equal(links.find(x=>x.name==='Instagram')?.kind,'profile');assert.equal(links.find(x=>x.name==='X')?.kind,'profile');assert.equal(links.find(x=>x.name==='TikTok')?.href,'/how-it-works#share-anywhere');assert.equal(new URL(links.find(x=>x.name==='Facebook')!.href).searchParams.get('u'),site);
 assert.ok(socialProfiles({},site).every(p=>p.href.startsWith('https:')||p.href.startsWith('/how-it-works')));
});

test('store metadata has canonical, OpenGraph and Twitter fields without payment, wallet or Amazon price leakage',()=>{
 for(const mode of ['affiliate','personal'] as const){const data=storefrontMetadata('our-shop',mode,{...shop,shopMode:mode});assert.ok(String(data.title).includes(shop.name));assert.equal(data.description,shop.bio);assert.ok(String(data.alternates?.canonical).endsWith('/s/our-shop/'+mode));assert.equal((data.openGraph as any).images[0].width,1200);assert.equal((data.twitter as any).card,'summary_large_image');assert.ok(!JSON.stringify(data).includes('49 USD'));assert.ok(!JSON.stringify(data).includes('media-amazon.com'));}
 const suspended=storefrontMetadata('our-shop','affiliate',{...shop,suspended:true});assert.equal((suspended.robots as any).index,false);assert.equal(suspended.openGraph,null);assert.equal(storefrontMetadata('our-shop','affiliate',null).openGraph,null);
 assert.equal(new URL(cardShareUrl('affiliate','p 1','our-shop')).hash,'#product-p%201');assert.equal(new URL(cardShareUrl('personal','p 1','our-shop')).pathname,'/s/our-shop/product/p%201');assert.equal(new URL(cardShareUrl('personal','p',undefined,'snapshot')).searchParams.get('s'),'snapshot');
});

test('public sitemap entries include both published catalogs and exclude suspended or unpublished shops',async()=>{
 const pg=new PGlite(),query:Query=async(sql,args)=>(await pg.query(sql,args)).rows as any[];
 try{await pg.exec(await readFile('src/db/schema.sql','utf8'));const personal={...shop,shopMode:'personal',products:shop.products.map(p=>({...p,catalogMode:'personal'}))};
  for(const [i,published,suspended] of [[0,true,false],[1,false,false],[2,true,true]] as const){await query('INSERT INTO subscriptions(owner_key,provider) VALUES($1,$2)',['owner-'+i,'master']);await query('INSERT INTO shops(owner_key,slug,name,catalog,affiliate_catalog,personal_catalog,published,suspended) VALUES($1,$2,$3,$4::jsonb,$4::jsonb,$5::jsonb,$6,$7)',['owner-'+i,'store-'+i,'Store',JSON.stringify(shop),JSON.stringify(personal),published,suspended]);}
  const rows=await publicStorefrontEntries(query);assert.equal(rows.length,2);assert.ok(rows.every(p=>p.url.includes('/s/store-0/')));assert.ok(rows.some(p=>p.url.endsWith('/affiliate')));assert.ok(rows.some(p=>p.url.endsWith('/personal')));
 }finally{await pg.close();}
});

test('social preview renders a real 1200 by 630 PNG without fetching product photos',async()=>{
 const response=storefrontPreviewImage(shop),bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(bytes.readUInt32BE(16),1200);assert.equal(bytes.readUInt32BE(20),630);
});
