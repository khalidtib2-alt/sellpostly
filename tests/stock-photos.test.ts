import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {unbrandedQuery,footwearSubtype,matchesFootwearQuery} from '../src/app/shop/unbranded-query';
import {localPhotos,stockMetadata,defaultStock} from '../src/app/shop/stock-photos';
import pool from '../src/app/shop/stock-photo-pool.json';
import {validateShop,encodeShop,decodeShop} from '../src/app/shop/shop-data';
import {normalizePending,pendingProduct} from '../src/lib/shop-handoff';
import {GET,POST} from '../src/app/api/affiliate/stock-photo/route';
import {translations} from '../src/app/translations';

test('generic queries remove brands/models by construction and agree in extension and website',async()=>{
 const context=vm.createContext({});vm.runInContext(await readFile('chrome-extension/unbranded-query.js','utf8'),context);
 const cases=[['Adidas Ultraboost 22 Mens Running Shoes SKU GX5462','men athletic sneakers'],['Nike Air Max Womens Sneakers','women athletic sneakers'],['Puma Kids Sneakers 389287-01','kids athletic sneakers'],['Nike Brasilia Duffel Bag SKU BA5955','travel bag'],['Sony WH-1000XM5 Wireless Noise Cancelling Headphones','wireless noise cancelling headphones'],['Apple Watch Series 9 45mm GPS','smartwatch'],['Nespresso Vertuo Pop Coffee Maker','coffee kitchen'],['Dyson Airwrap HS05','skincare beauty'],['Samsung Galaxy S24 Ultra 256GB','office technology']];
 for(const [title,expected] of cases){assert.equal(unbrandedQuery(title),expected);assert.equal((context as any).SellPostlyUnbrandedQuery(title),expected);assert.doesNotMatch(expected,/adidas|nike|puma|sony|apple|nespresso|dyson|samsung|\d/i);}
 assert.equal(unbrandedQuery('Sneakers','Fashion','women'),'women athletic sneakers');assert.equal(unbrandedQuery('Sneakers','Fashion','kids'),'kids athletic sneakers');
});

test('all required fallback categories have multiple genuine bundled JPEGs and source licenses',async()=>{
 for(const q of ['men athletic sneakers','women athletic sneakers','kids athletic sneakers','wireless headphones','smartwatch','travel bag','coffee kitchen','fitness equipment','skincare beauty','office technology']){
  const photos=localPhotos(q);assert.ok(photos.length>=2,q);assert.equal(new Set(photos.map(p=>p.url)).size,photos.length);
  for(const photo of photos){const bytes=await readFile('public'+photo.url);assert.ok(bytes.length>10000);assert.equal(bytes[0],0xff);assert.equal(bytes[1],0xd8);assert.match(photo.pageUrl,/^https:\/\/www\.pexels\.com\/photo\//);assert.equal(photo.licenseUrl,'https://www.pexels.com/license/');}
 }
 assert.equal(pool.length,23);const sources=JSON.parse(await readFile('public/stock-photos/SOURCES.json','utf8'));assert.equal(sources.photos.length,pool.length);
});

test('imports assign representative photos, retain provenance in shared catalogs and preserve custom uploads',async()=>{
 const pending=normalizePending({title:'Sony WH-1000XM5 Wireless Headphones',destination:'affiliate',image:'',url:'https://amazon.com/dp/B012345678?tag=ourshop-20'});
 assert.equal(pending.unbrandedQuery,'wireless noise cancelling headphones');
 const shop=validateShop({shopMode:'affiliate',products:[pendingProduct(pending)]}),product=shop.products[0];
 assert.equal(product.image,defaultStock(pending.title).url);assert.equal(product.stockPhoto?.url,product.image);assert.ok(product.url.includes('tag=ourshop-20'));
 const restored=(await decodeShop(await encodeShop(shop))).products[0];assert.deepEqual(restored.stockPhoto,product.stockPhoto);assert.equal(restored.unbrandedQuery,product.unbrandedQuery);
 const photo='data:image/jpeg;base64,AAAA';const custom=validateShop({...shop,products:[{...product,image:photo}]}).products[0];assert.equal(custom.image,photo);assert.equal(custom.stockPhoto,undefined);
 assert.equal(stockMetadata({...product.stockPhoto,url:'https://evil.example/a.jpg'},'https://evil.example/a.jpg'),undefined);
});

test('photo endpoint is keyless-safe, fails over locally, sanitizes provider queries, and tracks Unsplash selections privately',async()=>{
 const previous={pexels:process.env.PEXELS_API_KEY,unsplash:process.env.UNSPLASH_ACCESS_KEY,fetch:globalThis.fetch};
 try{
  delete process.env.PEXELS_API_KEY;delete process.env.UNSPLASH_ACCESS_KEY;
  globalThis.fetch=async()=>{throw Error('No network expected');};
  const local=await GET(new Request('https://app.example/api/affiliate/stock-photo?q=men+running+shoes'));assert.equal(local.status,200);assert.ok((await local.json()).photos[0].url.startsWith('/stock-photos/'));
  assert.equal((await GET(new Request('https://app.example/api/affiliate/stock-photo?q='+'x'.repeat(301)))).status,400);
  process.env.PEXELS_API_KEY='private-test-key';const calls:string[]=[];
  globalThis.fetch=async(input,options)=>{const url=String(input);calls.push(url);assert.equal(new URL(url).hostname,'api.pexels.com');assert.ok(!url.includes('Nike'));assert.equal((options?.headers as any).Authorization,'private-test-key');return Response.json({photos:[{id:10,alt:'Nike logo',url:'https://www.pexels.com/photo/logo-10/',src:{large:'https://images.pexels.com/logo.jpg'}},{id:11,alt:'Plain women athletic sneakers on neutral floor',url:'https://www.pexels.com/photo/footwear-11/',photographer:'Photographer',photographer_url:'https://www.pexels.com/@photographer/',src:{large:'https://images.pexels.com/footwear.jpg'}}]});};
  const external=await GET(new Request('https://app.example/api/affiliate/stock-photo?q=Nike+Women+Sneakers+SKU123'));const response=await external.json();assert.equal(response.photos.length,1);assert.equal(response.photos[0].id,'pexels-11');assert.ok(!JSON.stringify(response).includes('private-test-key'));assert.equal(new URL(calls[0]).searchParams.get('query'),'women athletic sneakers product minimal background');
  globalThis.fetch=async()=>{throw Error('Provider blocked');};const fallback=await GET(new Request('https://app.example/api/affiliate/stock-photo?q=coffee+kitchen'));assert.ok((await fallback.json()).photos[0].url.startsWith('/stock-photos/'));
  delete process.env.PEXELS_API_KEY;process.env.UNSPLASH_ACCESS_KEY='private-unsplash-key';let downloads=0;
  globalThis.fetch=async(input)=>{const url=new URL(String(input));assert.equal(url.hostname,'api.unsplash.com');if(url.pathname.includes('/download')){downloads++;return Response.json({url:'https://images.unsplash.com/photo-test'});}return Response.json({results:[{id:'abc',alt_description:'Plain dumbbells',urls:{regular:'https://images.unsplash.com/photo-test?w=900'},links:{html:'https://unsplash.com/photos/abc',download_location:'https://api.unsplash.com/photos/abc/download'},user:{name:'Creator',links:{html:'https://unsplash.com/@creator'}}}]});};
  const unsplash=await GET(new Request('https://app.example/api/affiliate/stock-photo?q=fitness+equipment'));const found=(await unsplash.json()).photos[0];assert.equal(found.provider,'Unsplash');assert.equal(found.url,'https://images.unsplash.com/photo-test?w=900');assert.ok(found.pageUrl.includes('utm_source=sellpostly'));assert.equal(downloads,0);
  const pick=(id:string,origin='https://app.example')=>POST(new Request('https://app.example/api/affiliate/stock-photo',{method:'POST',headers:{Origin:origin},body:JSON.stringify({q:'fitness equipment',id})}));
  assert.equal((await pick('unsplash-abc')).status,200);assert.equal(downloads,1);assert.equal((await pick('https://localhost/secret')).status,409);assert.equal(downloads,1);assert.equal((await pick('unsplash-abc','https://evil.example')).status,403);
 }finally{globalThis.fetch=previous.fetch;for(const [key,value] of [['PEXELS_API_KEY',previous.pexels],['UNSPLASH_ACCESS_KEY',previous.unsplash]]){if(value===undefined)delete process.env[key!];else process.env[key!]=value;}}
});

test('new photo controls and disclosure helper have French and Arabic translations',()=>{
 for(const key of ['Representative style photo','Next Similar Photo','Finding photos…','Generic photo search','Use this photo','Photo credit','Photo license','Amazon image blocked. My Shop will match a representative photo automatically.'] as const){assert.ok(translations[key].fr);assert.match(translations[key].ar,/[\u0600-\u06ff]/);}
});

test('specific footwear subtypes survive de-branding, round trips and strict fallback selection',async()=>{
 const cases=[
  ["Puma Kids' ST Runner Hook and Loop Sneakers",'kids athletic sneakers','sneakers'],
  ['Nike Women Running Shoes Air Max','women athletic sneakers','sneakers'],
  ['Adidas Mens Trainers GX1234','men athletic sneakers','sneakers'],
  ['Kids Leather Dress Shoes','formal shoes','formal'],
  ['Women Ballet Flats','flat shoes','flats'],
  ['Puma Leather Boots','boots','boots'],
  ['Nike Summer Sandals','sandals','sandals'],
 ] as const;
 for(const [title,query,subtype] of cases){
  assert.equal(unbrandedQuery(title),query);assert.equal(unbrandedQuery(query),query);
  const photos=localPhotos(query);assert.ok(photos.length>0,title);assert.ok(photos.every(p=>p.footwearSubtype===subtype),title);
  assert.equal(footwearSubtype(query),subtype);
 }
 const kids=localPhotos('kids athletic sneakers');assert.ok(kids.length>=2&&kids.length<=3);assert.ok(kids.every(p=>p.audiences?.includes('kids')));
 assert.ok(!pool.some(p=>p.id==='pexels-27128273'));assert.ok(!kids.some(p=>p.photographer==='José Martin Segura Benites'));
 assert.equal(matchesFootwearQuery('kids athletic sneakers','white bow ballet flats for a child'),false);
 assert.equal(matchesFootwearQuery('kids athletic sneakers','man wearing sneakers'),false);
 assert.equal(matchesFootwearQuery('kids athletic sneakers','child wearing athletic sneakers'),true);
 assert.equal(matchesFootwearQuery('women athletic sneakers','women wearing sandals'),false);
 // Repair a previously auto-assigned wrong local subtype, while keeping custom seller photos.
 const old={id:'shoe',url:'https://amazon.com/dp/B012345678',name:cases[0][0],category:'Fashion',gender:'kids',image:'/stock-photos/pexels-27174555.jpg'};
 const repaired=validateShop({shopMode:'affiliate',products:[old]}).products[0];assert.equal(repaired.stockPhoto?.footwearSubtype,'sneakers');
 const custom=validateShop({shopMode:'affiliate',products:[{...old,stockPhoto:repaired.stockPhoto,image:'https://seller.example/own-photo.jpg'}]}).products[0];assert.equal(custom.image,'https://seller.example/own-photo.jpg');
 const missingTag=validateShop({shopMode:'affiliate',products:[{...old,image:'https://images.pexels.com/old.jpg',stockPhoto:{provider:'Pexels',url:'https://images.pexels.com/old.jpg',pageUrl:'https://www.pexels.com/photo/old-1/'}}]}).products[0];assert.equal(missingTag.stockPhoto?.footwearSubtype,'sneakers');
 const restored=(await decodeShop(await encodeShop({name:'S',bio:'',phone:'',shopMode:'affiliate',shopTheme:'white',products:[repaired]}))).products[0];assert.equal(restored.stockPhoto?.footwearSubtype,'sneakers');
});
