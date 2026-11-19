import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createSampleShop,demoProducts,upgradeDemoPhotos} from '../src/app/shop/demo-products';
import {validateShop,encodeShop,decodeShop,safeImage} from '../src/app/shop/shop-data';
import {supportEmail} from '../src/lib/support';
import {emailTemplate,sendEmail} from '../src/lib/email';
test('studio demos are local SVG assets and survive saved/shared catalog validation',async()=>{
 const shop=createSampleShop();assert.equal(shop.products.length,4);assert.equal(shop.shopMode,'affiliate');
 for(const product of demoProducts){const svg=await readFile('public'+product.image,'utf8');assert.ok(svg.includes('viewBox="0 0 1200 900"'));assert.ok(svg.includes('<linearGradient'));assert.ok(!/<script|foreignObject|href="https?:/i.test(svg));assert.equal(safeImage(product.image),product.image);}
 const restored=validateShop(shop);assert.deepEqual(restored.products.map(p=>p.image),shop.products.map(p=>p.image));assert.deepEqual((await decodeShop(await encodeShop(shop))).products.map(p=>p.image),shop.products.map(p=>p.image));
 assert.equal(safeImage('/demo-products/../../bad.svg'),'');assert.equal(safeImage('data:image/svg+xml,<svg/>'),'');
});
test('legacy preview migration replaces exact old artwork and preserves seller photos',()=>{
 const root=globalThis as unknown as {document?:unknown},old=root.document;
 root.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){}}),toDataURL:()=> 'legacy-image'})};
 try{
  const shop=createSampleShop();shop.products[0].image='legacy-image';shop.products[1].image='https://seller.example/custom.jpg';shop.products[2].id='real-imported-id';shop.products[2].image='legacy-image';
  const next=upgradeDemoPhotos(shop);assert.equal(next.products[0].image,demoProducts[0].image);assert.equal(next.products[1].image,'https://seller.example/custom.jpg');assert.equal(next.products[2].image,'legacy-image');assert.equal(shop.products[0].image,'legacy-image');
 }finally{if(old===undefined)delete root.document;else root.document=old;}
});
test('support mail appears in localized receipts and reply-to without replacing verified sender',async()=>{
 assert.equal(supportEmail,'sellpostly.support@gmail.com');
 for(const language of ['en','fr','ar']){const result=emailTemplate({kind:'pro',language,id:'test'});assert.ok(result.text.includes(supportEmail));assert.ok(result.html.includes('mailto:'+supportEmail));}
 const previousKey=process.env.RESEND_API_KEY,previousSender=process.env.EMAIL_FROM;process.env.RESEND_API_KEY='fake-key';process.env.EMAIL_FROM='Verified Sender <sender@example.com>';
 try{let called=false;const result=await sendEmail('recipient@example.com',{kind:'pro',id:'test'},'test-reply',async(_url,options)=>{called=true;const payload=JSON.parse(String(options?.body));assert.equal(payload.reply_to,supportEmail);assert.equal(payload.from,process.env.EMAIL_FROM);return Response.json({id:'test-email'});});assert.equal(result,'sent');assert.equal(called,true);}
 finally{if(previousKey===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=previousKey;if(previousSender===undefined)delete process.env.EMAIL_FROM;else process.env.EMAIL_FROM=previousSender;}
});

