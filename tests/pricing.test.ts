import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {monthlyProPrice,freeFeatures,proFeatures,pricingPaymentMethods,pricingMetadata,proUpgradeHref} from '../src/app/pricing/pricing-data';
import {upgradePrice} from '../src/lib/pro-upgrade';
import {translations,type Message} from '../src/app/translations';

test('pricing displays the actual monthly upgrade amount and suppresses invalid configurations',()=>{
 const previous=process.env.NEXT_PUBLIC_PRO_PRICE_USD;
 try{for(const value of [undefined,'','15','19.99','0','-1','abc','15.123','9999999']){if(value===undefined)delete process.env.NEXT_PUBLIC_PRO_PRICE_USD;else process.env.NEXT_PUBLIC_PRO_PRICE_USD=value;const price=monthlyProPrice(value);if(price===null)assert.throws(()=>upgradePrice('monthly'));else assert.equal(price,upgradePrice('monthly'));}}
 finally{if(previous===undefined)delete process.env.NEXT_PUBLIC_PRO_PRICE_USD;else process.env.NEXT_PUBLIC_PRO_PRICE_USD=previous;}
});

test('plan comparison and metadata cover requested capabilities in all languages and link to the real activation flow',async()=>{
 assert.equal(freeFeatures.length,6);assert.equal(proFeatures.length,6);assert.equal(pricingPaymentMethods.length,7);
 assert.ok(freeFeatures.includes('1 Primary Personal Store'));assert.ok(freeFeatures.includes('1 Primary Affiliate Deals Shop'));assert.ok(proFeatures.includes('Up to 10 Specialty Niche Stores'));
 const page=await readFile('src/app/pricing/pricing-content.tsx','utf8');
 const keys=[...freeFeatures,...proFeatures,...pricingPaymentMethods,...Array.from(page.matchAll(/t\('([^']+)'\)/g),m=>m[1])];
 for(const key of keys){const item=translations[key as Message];assert.ok(item?.fr,key);if(['PayPal','Payoneer','Wise','USDC'].includes(key))assert.equal(item?.ar,key);else assert.match(item?.ar||'',/[\u0600-\u06ff]/,key);}
 for(const lang of ['en','fr','ar'] as const){const meta=pricingMetadata(lang);assert.match(String(meta.alternates?.canonical),/\/pricing$/);assert.equal((meta.openGraph as any).title,meta.title);assert.equal((meta.twitter as any).card,'summary_large_image');if(lang==='ar')assert.match(String(meta.description),/[\u0600-\u06ff]/);}
 assert.equal(proUpgradeHref,'/shop?upgrade=pro');assert.match(page,/href=\{proUpgradeHref\}/);assert.match(page,/5% platform commission/);
 const gate=await readFile('src/app/shop/pro-gate.tsx','utf8');assert.match(gate,/!children&&!upgradeRequested/);assert.match(gate,/if\(!verified\)dialog.current\?\.showModal\(\)/);
 assert.match(await readFile('src/app/sitemap.ts','utf8'),/"\/pricing"/);
});
