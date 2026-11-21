import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {savePaymentSettings} from '../src/lib/save-payment-settings';
import {validateShop,shopKey} from '../src/app/shop/shop-data';
import {modeCatalogKey} from '../src/app/shop/catalog-modes';
import {pageSeo,seoKeywords,marketingSchema} from '../src/lib/marketing-seo';
import {storefrontMetadata,storefrontSchema} from '../src/lib/storefront-seo';
import guide from '../src/app/user-guide-data.json';
import {translations} from '../src/app/translations';

test('payment save persists the Personal catalog without invoking sharing or navigation',async()=>{
 const map=new Map<string,string>([['sellpostly-pro-key','synthetic-pro-key']]),storage={getItem:(k:string)=>map.get(k)||null,setItem:(k:string,v:string)=>{map.set(k,v);}};
 const shop=validateShop({name:'Test Shop',refundPolicy:'7_day',deliveryTimeframe:'Delivery within 2-3 business days',shopMode:'personal',escrowGovernance:'optional_for_buyer',payments:{COD:{enabled:true},USDC_DIRECT:{enabled:true,wallet:'0x'+'2'.repeat(40),network:'Polygon'}},products:[]});let calls=0;
 const result=await savePaymentSettings(shop,storage,async(url,options)=>{calls++;assert.equal(url,'/api/shops');assert.equal((options?.headers as Record<string,string>)['x-pro-key'],'synthetic-pro-key');assert.equal(JSON.parse(String(options?.body)).escrowGovernance,'optional_for_buyer');return Response.json({slug:'test-shop'});});
 assert.equal(calls,1);assert.equal(result.slug,'test-shop');assert.equal(result.localSaved,true);assert.equal(JSON.parse(map.get(shopKey)!).payments.COD.enabled,true);assert.equal(JSON.parse(map.get(modeCatalogKey('personal'))!).escrowGovernance,'optional_for_buyer');
 await assert.rejects(savePaymentSettings(shop,storage,async()=>Response.json({error:'PRO_REQUIRED'},{status:403})));
 const full=await savePaymentSettings(shop,{getItem:()=>null,setItem:()=>{throw Error('FULL');}},async()=>Response.json({slug:'test-shop'}));assert.equal(full.localSaved,false);
 const source=await readFile('src/app/shop/shop-builder.tsx','utf8'),start=source.indexOf('async function savePayments()'),end=source.indexOf('async function shareMode',start),action=source.slice(start,end);assert.ok(!/setShareTarget|location\.|scrollIntoView|scrollTo|router\./.test(action));assert.ok(source.includes('onSave={()=>void savePayments()}'));
});
test('all image sources use the same contained 4:3 frame and fixed action slots',async()=>{
 const source=await readFile('src/app/shop/storefront-templates.tsx','utf8'),css=await readFile('src/app/globals.css','utf8');assert.ok(source.includes('store-card-visual aspect-[4/3] w-full'));assert.equal((source.match(/className="h-full w-full object-contain p-4"/g)||[]).length,2);assert.ok(source.includes('store-card-actions'));assert.ok(source.includes('store-video-slot'));
 assert.ok(!css.includes('.editorial-product:first-child'));assert.ok(!css.includes('has-representative-photo .store-photo-frame'));assert.match(css,/\.store-card-visual \{[^}]*aspect-ratio:4\/3/);assert.match(css,/\.store-card-actions \{[^}]*margin-top:auto/);
});
test('the shared guide documents all current tools, payment methods, escrow and truthful Pro pricing',()=>{
 assert.equal(guide.features.length,6);assert.equal(guide.faq.length,5);assert.equal(guide.seller.length,4);assert.equal(guide.buyer.length,3);
 const text=[...guide.features,...guide.seller,...guide.buyer,...guide.faq].flat().join(' ');for(const phrase of ['Personal Store','Affiliate Deals Shop','Amazon','AliExpress','Etsy','RIB / IBAN / SWIFT','CMI','Payzone','YouCan Pay','Stripe','Gumroad','Creem','PayPal','Payoneer','Wise','USDC','Cash on Delivery','pending_funding','held','released','/tools','WebP','PNG','JPG','QR','YouTube','TikTok','Reels','Vimeo','MP4','Pro license'])assert.ok(text.includes(phrase),phrase);
 for(const key of [...guide.features,...guide.faq,...guide.seller,...guide.buyer].flat()){const translated=translations[key as keyof typeof translations];assert.ok(translated?.fr,key);assert.match(translated?.ar||'',/[\u0600-\u06ff]/,key);}
});
test('localized metadata and structured data target commerce without unsupported free-store claims or private payment data',()=>{
 for(const language of ['en','fr','ar'] as const){for(const page of ['home','guide','tools'] as const){const meta=pageSeo(page,language),schema=marketingSchema(page,language);assert.ok(meta.title);assert.ok(meta.description);assert.equal((meta.openGraph as any).title,meta.title);assert.equal((meta.twitter as any).card,'summary_large_image');assert.equal(schema.inLanguage,language);assert.ok(seoKeywords(language).length>=7);assert.ok(!JSON.stringify(meta).includes('without monthly fees'));if(language==='ar')assert.match(String(meta.title),/[\u0600-\u06ff]/);}
 const shop=validateShop({refundPolicy:'7_day',deliveryTimeframe:'Delivery within 2-3 business days',shopMode:'personal',name:'Independent Store',bio:'',cryptoWallet:'0x'+'2'.repeat(40),payments:{BANK:{enabled:true,bank:'Private Bank',account:'123456789012345678901234',holder:'Seller',swift:'ABCDMA22'}},products:[]});const meta=storefrontMetadata('independent-store','personal',shop,language),schema=storefrontSchema('independent-store','personal',shop,language);assert.equal(schema.inLanguage,language);assert.ok(!JSON.stringify(schema).includes('123456789012345678901234'));assert.ok(!JSON.stringify(meta).includes('Private Bank'));
 }
});
