import {defaultStock} from '../src/app/shop/stock-photos';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {extractProductIdentity,visualNiches,studioCover,imageSearchLinks} from '../src/app/shop/product-identity';
import {validateShop,encodeShop,decodeShop,safeImage} from '../src/app/shop/shop-data';
import {affiliateImage} from '../src/app/shop/affiliate-compliance';
import {translations} from '../src/app/translations';

test('brand/model recognition strips sales filler without inventing an unknown model',()=>{
 const examples=[
  ["Amazon's Choice Sony WH-1000XM5 Wireless Noise Cancelling Headphones, Bluetooth, Black (Renewed)",'Sony WH-1000XM5','audio'],
  ['Visit the Apple Store Apple Watch Series 9 GPS 45mm Midnight','Apple Watch Series 9','watch'],
  ['Samsung Galaxy S24 Ultra 256GB Smartphone Unlocked','Samsung Galaxy S24 Ultra','phone-tech'],
  ['Canon EOS R6 Mark II Mirrorless Camera Body','Canon EOS R6 Mark II','camera'],
  ['Breville Bambino Plus Espresso Machine with Milk Frother','Breville Bambino Plus','coffee-kitchen'],
  ['Nintendo Switch OLED Gaming Console','Nintendo Switch OLED','gaming'],
  ['Logitech MX Master 3S Wireless Mouse for Home Office','Logitech MX Master 3S','home-office'],
 ] as const;
 for(const [title,name,niche] of examples){const identity=extractProductIdentity(title);assert.equal(identity.coreName,name,title);assert.equal(identity.visualNiche,niche,title);assert.equal(identity.confidence,'matched');}
 const unknown=extractProductIdentity('Premium lightweight adjustable everyday accessory');assert.equal(unknown.brand,'');assert.equal(unknown.model,'');assert.equal(unknown.confidence,'uncertain');
 const variant=extractProductIdentity('Sony WH-1000XM5 Wireless Headphones - Silver');assert.match(variant.searchQuery,/Silver/);assert.equal(variant.coreName,'Sony WH-1000XM5');assert.equal(extractProductIdentity('Sony WH1000XM5 Headphones').coreName,'Sony WH-1000XM5');assert.equal(extractProductIdentity('Replacement ear pads for Sony WH-1000XM5').confidence,'uncertain');
 assert.equal(extractProductIdentity('Unbranded travel backpack').visualNiche,'fashion-bag');assert.equal(extractProductIdentity('CeraVe Moisturizing Cream').visualNiche,'beauty-skincare');assert.equal(extractProductIdentity('Adjustable dumbbell set').visualNiche,'fitness');
});
test('image search links carry exact identity and variation without unsafe navigation',()=>{
 const links=imageSearchLinks('Sony WH-1000XM5 Headphones Black');
 assert.equal(new URL(links.official).hostname,'www.google.com');assert.equal(new URL(links.official).searchParams.get('q'),'Sony WH-1000XM5 Black official product press kit images');
 assert.equal(new URL(links.commons).hostname,'commons.wikimedia.org');assert.equal(new URL(links.commons).searchParams.get('search'),'Sony WH-1000XM5 Black');assert.equal(new URL(links.commons).searchParams.get('type'),'image');
 assert.equal(new URL(links.unsplash).hostname,'unsplash.com');assert.ok(links.unsplash.includes('headphones-audio-listening'));
 for(const link of Object.values(imageSearchLinks('javascript:alert(1) & bad #title')))assert.equal(new URL(link).protocol,'https:');
});
test('ten safe covers are full-bleed SVG scenes, auto-selected and independently persisted',async()=>{
 assert.equal(visualNiches.length,10);
 for(const niche of visualNiches){const path=studioCover(niche),svg=await readFile('public'+path,'utf8');assert.match(svg,/viewBox="0 0 1200 900"/);assert.match(svg,/<linearGradient/);assert.match(svg,/feDropShadow/);assert.ok(!/<script|foreignObject|href=|<text/i.test(svg));assert.equal(safeImage(path),path);}
 const raw={shopMode:'affiliate',products:[{id:'sony',url:'https://amazon.com/dp/B012345678',name:'Sony WH-1000XM5 Wireless Headphones',category:'Tech & Gadgets',image:'https://m.media-amazon.com/photo.jpg'}]};
 const auto=validateShop(raw);assert.equal(auto.products[0].image,defaultStock('wireless headphones').url);
 const empty=validateShop({...raw,products:[{...raw.products[0],image:''}]});assert.equal(empty.products[0].image,defaultStock('wireless headphones').url);
 const manual=validateShop({...raw,products:[{...raw.products[0],editorialCover:'camera'}]});assert.equal(manual.products[0].image,defaultStock('wireless headphones').url);assert.equal((await decodeShop(await encodeShop(manual))).products[0].editorialCover,'camera');
 const photo=validateShop({...raw,products:[{...raw.products[0],image:'https://press.example/authorized.jpg'}]});assert.equal(photo.products[0].image,'https://press.example/authorized.jpg');
 const personal=validateShop({...raw,shopMode:'personal',products:[{...raw.products[0],image:''}]});assert.equal(personal.products[0].image,'');
 assert.equal(affiliateImage('https://images-amazon.com/a.jpg','Other','Canon EOS R6 Mark II'),defaultStock('office technology').url);assert.equal(safeImage('/studio-covers/../../unsafe.svg'),'');
 const corrected=validateShop({...raw,products:[{...raw.products[0],identityOverride:'Garmin Forerunner 265'}]});assert.equal(corrected.products[0].image,defaultStock('smartwatch').url);
});
test('editor renders all cover controls and image-source links with translated helper copy',()=>{
 for(const key of ['Detected:','Find Identical Compliant Image','Official Brand Media Kit','Free Licensed Photos (Unsplash)','Auto-select Cover','Editorial illustration','Upload Custom Photo'] as const){assert.ok(translations[key].fr);assert.match(translations[key].ar,/[\u0600-\u06ff]/);}
 const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import assert from 'node:assert/strict';import Editor from './src/app/shop/affiliate-image-editor.tsx';import {LanguageProvider} from './src/app/language-context.tsx';
 const html=renderToStaticMarkup(React.createElement(LanguageProvider,null,React.createElement(Editor,{title:'Sony WH-1000XM5 Wireless Headphones',category:'Tech & Gadgets',override:'',onOverride:()=>{},onSelect:()=>{},customImage:''})));
 assert.ok(html.includes('Sony WH-1000XM5'));assert.ok(html.includes('www.google.com/search'));assert.ok(html.includes('commons.wikimedia.org'));assert.ok(html.includes('unsplash.com/s/photos'));assert.equal((html.match(/aria-pressed=/g)||[]).length,2);assert.ok(html.includes('not the exact branded product'));
 `],{cwd:process.cwd(),encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr||result.stdout);
});
