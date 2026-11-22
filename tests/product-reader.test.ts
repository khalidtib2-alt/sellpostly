import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {normalizePending,pendingProduct} from '../src/lib/shop-handoff';
import {validateShop} from '../src/app/shop/shop-data';
import {amazonImageNotice} from '../src/app/shop/affiliate-compliance';
import {translations} from '../src/app/translations';

test('price parsing separates symbols, currencies and locale separators without inventing a placeholder amount',async()=>{
 const context=vm.createContext({});vm.runInContext(await readFile('chrome-extension/product-reader.js','utf8'),context);
 for(const [raw,amount,currency] of [['$14.99','14.99','USD'],['149 MAD','149','MAD'],['€19,99','19.99','EUR'],['1 299,99 €','1299.99','EUR'],['US $1,299.00','1299.00','USD'],['£24.50','24.50','GBP'],['١٤٩ MAD','149','MAD']]){const result=context.SellPostlyProductReader.priceParts(raw);assert.equal(result.amount,amount,raw);assert.equal(result.currency,currency,raw);}
 assert.equal(context.SellPostlyProductReader.priceParts('Price unavailable'),null);assert.equal(context.SellPostlyProductReader.priceParts(''),null);
});

test('DOM fixtures select live buy-box prices and high-resolution gallery photos across five sites',async()=>{
 const reader=await readFile('chrome-extension/product-reader.js','utf8');
 const fixtures=[
  {site:'Temu',price:'14.99 USD',image:'https://img.kwcdn.com/main-large.jpg',html:'<main><h1>Fashion Outfit</h1><del>$99.00</del><div class="goods-price"><span>$14.99</span></div><div class="gallery"><img src="https://img.kwcdn.com/thumb.jpg" style="width:60px;height:60px"><img data-src="https://img.kwcdn.com/main-large.jpg" style="width:400px;height:500px"></div></main>'},
  {site:'AliExpress',price:'19.99 EUR',image:'https://ae01.alicdn.com/gallery-large.jpg',html:'<main><h1>Fashion Outfit</h1><span class="product-price-current">€19,99</span><div class="image-view"><img src="https://ae01.alicdn.com/small.jpg" srcset="https://ae01.alicdn.com/small.jpg 300w, https://ae01.alicdn.com/gallery-large.jpg 1200w" style="width:400px;height:500px"></div></main>'},
  {site:'Jumia',price:'149 MAD',image:'https://ma.jumia.is/main.jpg',html:'<main><h1>Fashion Outfit</h1><span class="-prc">149 MAD</span><img data-src="https://ma.jumia.is/main.jpg" style="width:450px;height:500px"></main>'},
  {site:'Amazon',price:'24.50 USD',image:'https://m.media-amazon.com/hires.jpg',html:'<main><h1 id="productTitle">Fashion Outfit</h1><div id="corePrice_feature_div"><span class="a-price"><span class="a-offscreen" style="position:absolute;width:1px;height:1px;overflow:hidden">$24.50</span></span></div><img id="landingImage" src="https://m.media-amazon.com/low.jpg" data-old-hires="https://m.media-amazon.com/hires.jpg" style="width:400px;height:500px"></main>'},
  {site:'Generic',price:'35.75 GBP',image:'https://merchant.example/product.jpg',html:'<h1>Fashion Outfit</h1><script type="application/ld+json">{"@type":"Product","name":"Fashion Outfit","offers":{"@type":"AggregateOffer","lowPrice":"35.75","priceCurrency":"GBP"},"image":"https://merchant.example/product.jpg"}</script>'}
 ];
 for(const fixture of fixtures){
  const {document,HTMLElement}=parseHTML('<!doctype html><html><head><meta property="og:image" content="https://merchant.example/stale.jpg"></head><body>'+fixture.html+'</body></html>');
  // Explicit fixture layout model: LinkeDOM supplies selectors/DOM, not browser layout.
  const rect=(el:any)=>({top:50,left:0,width:parseFloat(el.style.width)||100,height:parseFloat(el.style.height)||25});
  HTMLElement.prototype.getBoundingClientRect=function(){return rect(this) as any;};
  HTMLElement.prototype.getClientRects=function(){return this.style.display==='none'?[]:[rect(this)] as any;};
  const context=vm.createContext({document,URL,location:{href:'https://merchant.example/product',hostname:'merchant.example'},innerHeight:900,getComputedStyle:(el:any)=>({display:el.style.display||'block',visibility:el.style.visibility||'visible',opacity:el.style.opacity||'1'})});
  vm.runInContext(reader,context);const data=context.SellPostlyProductReader.read();assert.equal(data.price,fixture.price,fixture.site);assert.equal(data.image,fixture.image,fixture.site);
 }

});

test('all merchant images survive both catalogs and studio/shop handoffs, including Amazon and long CDN query strings',()=>{
 for(const image of ['https://img.kwcdn.com/p.jpg','https://ae01.alicdn.com/p.jpg','https://ma.jumia.is/p.jpg','https://m.media-amazon.com/p.jpg?'+('x'.repeat(5000))])for(const destination of ['affiliate','personal'] as const){const pending=normalizePending({title:'Imported item',price:'149 MAD',image,url:'https://amazon.com/dp/B012345678',destination,amazonImageBlocked:true});assert.equal(pending.image,image);assert.equal(pending.amazonImageBlocked,false);const shop=validateShop({shopMode:destination,products:[pendingProduct(pending)]});assert.equal(shop.products[0].image,image);assert.equal(shop.products[0].price,'149 MAD');}
 assert.ok(translations[amazonImageNotice].fr);assert.match(translations[amazonImageNotice].ar,/[\u0600-\u06ff]/);
});
