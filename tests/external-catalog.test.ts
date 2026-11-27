import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {catalogSummary, discoverCatalog, normalizeStoreUrl, parseProductPage, parseShopify, parseWooCommerce} from '../src/lib/external-catalog-discovery';
import {mapCatalogCsv, parseCatalogCsv} from '../src/lib/external-catalog-csv';
import {selectedCatalogItems} from '../src/lib/external-catalog-products';
import {commitExternalCatalog, ensurePrimaryCatalogShop} from '../src/lib/external-catalog-service';
import {createNicheShop, listSellerShops} from '../src/lib/multi-shop-service';
import {publicShop} from '../src/lib/db';
import {POST} from '../src/app/api/shops/import-external-catalog/route';
import type {Query} from '../src/lib/order-service';

const base = 'https://shop.example';
test('Shopify feed maps sale price, stock, cleaned HTML, images and variant options', async () => {
  const feed = {products:[{
    title:'Canvas bag', handle:'canvas-bag', body_html:'<p>Canvas &amp; cotton</p><script>ignore()</script><p>Washable</p>',
    variants:[{price:'12.50',compare_at_price:'18.00',inventory_quantity:4},{price:'14.00',inventory_quantity:2}],
    images:[{src:'/front.jpg'},{src:'https://cdn.example/back.jpg'}],
    options:[{name:'Color',values:['Blue','Red']},{name:'Size',values:['S','L']}],
  }]};
  const [product] = parseShopify(feed,base);
  assert.equal(product.description,'Canvas & cotton Washable');
  assert.equal(product.price,'12.50');
  assert.equal(product.compareAtPrice,'18.00');
  assert.equal(product.sourceUrl,base+'/products/canvas-bag');
  assert.equal(product.stock,6);
  assert.deepEqual(product.images,[base+'/front.jpg','https://cdn.example/back.jpg']);
  assert.deepEqual(product.options[1],{name:'Size',values:['S','L']});
  const scan = await discoverCatalog(new URL(base+'/collections/bags'),async url =>
    url.endsWith('/collections/bags/products.json?limit=250') ? {url,text:JSON.stringify(feed)} : null);
  assert.equal(scan.platformDetected,'Shopify');
  assert.equal(scan.products.length,1);
});

test('WooCommerce uses integer minor units and imports categories, attributes and availability', () => {
  const [product] = parseWooCommerce([{
    name:'Jacket', short_description:'<b>Rainproof</b>', permalink:base+'/product/jacket/',
    images:[{src:base+'/jacket.jpg'}], categories:[{name:'Clothing'}], on_sale:true, is_in_stock:false,
    prices:{price:'1200',regular_price:'1800',currency_minor_unit:3,currency_code:'KWD'},
    attributes:[{name:'Size',terms:[{name:'Small'},{name:'Large'}]}],
  }],base);
  assert.equal(product.price,'1.200');
  assert.equal(product.compareAtPrice,'1.800');
  assert.equal(product.currency,'KWD');
  assert.equal(product.description,'Rainproof');
  assert.equal(product.category,'Clothing');
  assert.equal(product.stock,0);
  assert.deepEqual(product.options,[{name:'Size',values:['Small','Large']}]);
});

test('generic scans use sitemap product pages and JSON-LD with OpenGraph fallbacks', async () => {
  const html = '<link rel="canonical" href="/products/bag"><meta property="og:image" content="/bag.jpg">'+
    '<script type="application/ld+json">{"@graph":[{"@type":["Thing","Product"],"name":"Bag","offers":[{"price":"35","priceCurrency":"MAD"}]}]}</script>';
  const pages = new Map([
    [base,'<script src="https://cdn.youcan.shop/assets.js"></script>'],
    [base+'/sitemap.xml','<sitemapindex><sitemap><loc>'+base+'/products.xml</loc></sitemap></sitemapindex>'],
    [base+'/products.xml','<urlset><url><loc>'+base+'/products/bag?ref=sitemap</loc></url></urlset>'],
    [base+'/products/bag?ref=sitemap',html],
  ]);
  const result = await discoverCatalog(normalizeStoreUrl('shop.example'),async url => {
    const text = pages.get(url.replace(/\/$/,''));
    return text ? {url,text} : null;
  });
  assert.equal(result.platformDetected,'YouCan');
  assert.deepEqual(result.products.map(({title,sourceUrl,images,price,currency})=>({title,sourceUrl,images,price,currency})),[
    {title:'Bag',sourceUrl:base+'/products/bag',images:[base+'/bag.jpg'],price:'35',currency:'MAD'},
  ]);
  const [og] = parseProductPage('<meta property="og:type" content="product"><meta property="og:title" content="Hat"><meta property="product:price:amount" content="20">',base+'/unusual-path');
  assert.equal(og.title,'Hat');
  assert.equal(og.price,'20');
  assert.throws(()=>normalizeStoreUrl('http://127.0.0.1'));
});

test('CSV maps Shopify continuation rows, WooCommerce columns and common headers', () => {
  const csv = '\uFEFFHandle,Title,Body (HTML),Variant Price,Image Src,Option1 Name,Option1 Value,Variant Inventory Qty\r\n'+
    'hat,"Hat, large","<b>Warm</b>\nWashable",12,/hat.jpg,Color,Blue,2\r\n'+
    'hat,,,,/hat-red.jpg,Color,Red,3';
  const [product] = mapCatalogCsv(parseCatalogCsv(csv),catalogSummary,base);
  assert.equal(product.title,'Hat, large');
  assert.equal(product.description,'Warm Washable');
  assert.equal(product.price,'12');
  assert.equal(product.stock,5);
  assert.equal(product.sourceUrl,base+'/products/hat');
  assert.deepEqual(product.images,[base+'/hat.jpg',base+'/hat-red.jpg']);
  assert.deepEqual(product.options,[{name:'Color',values:['Blue','Red']}]);
  const [woo] = mapCatalogCsv(parseCatalogCsv('Name;Regular price;Sale price;External URL;Categories;Stock\nMug;12;8;'+base+'/mug;Kitchen;5'),catalogSummary);
  assert.equal(woo.compareAtPrice,'12');
  assert.equal(woo.price,'8');
  assert.equal(woo.category,'Kitchen');
  assert.equal(woo.stock,5);
  const [generic] = mapCatalogCsv([{Title:'Rug',Price:'25',Image:base+'/rug.jpg',Link:base+'/rug',Category:'Home',Stock:'0'}],catalogSummary);
  assert.equal(generic.stock,0);
  assert.equal(generic.images[0],base+'/rug.jpg');
  assert.throws(()=>parseCatalogCsv('Title\n"unterminated'),/INVALID_CSV/);
});

test('commit checks ownership, skips normalized duplicates and writes only the selected catalog', async () => {
  const pg = new PGlite();
  const query:Query = async (sql,args) => (await pg.query(sql,args)).rows as Awaited<ReturnType<Query>>;
  try {
    await pg.exec(await readFile('src/db/schema.sql','utf8'));
    await pg.exec("INSERT INTO subscriptions(owner_key,provider) VALUES('owner','master'),('other','master')");
    const id = await ensurePrimaryCatalogShop('owner','Primary',query);
    assert.equal(await ensurePrimaryCatalogShop('owner','Primary',query),id);
    const products = selectedCatalogItems([
      {title:'Canvas Bag',price:'15',currency:'MAD',sourceUrl:base+'/bag?utm_source=scan',stock:0,options:[{name:'Size',values:['S','M']}]},
      {title:'CANVAS   BAG'},
      {title:'Market Bag',sourceUrl:'http://shop.example/bag/#deal'},
    ]);
    await assert.rejects(commitExternalCatalog('other',id,products,'personal',true,query),/SHOP_NOT_FOUND/);
    const result = await commitExternalCatalog('owner',id,products,'personal',true,query);
    assert.equal(result.importedCount,1);
    assert.equal(result.skippedCount,2);
    const repeat = await commitExternalCatalog('owner',id,products,'personal',true,query);
    assert.equal(repeat.importedCount,0);
    const affiliate = await commitExternalCatalog('owner',id,products,'affiliate',false,query);
    assert.equal(affiliate.importedCount,3);
    const shops = await listSellerShops('owner',query);
    const saved = shops.find(shop=>shop.shopMode==='personal')?.products[0];
    assert.equal(saved?.price,'15 MAD');
    assert.equal(saved?.url,'');
    assert.equal(saved?.stock,0);
    assert.deepEqual(saved?.variantOptions,products[0].options);
    assert.equal(shops.find(shop=>shop.shopMode==='affiliate')?.products[0].url,products[0].sourceUrl);
    const [row] = await query('SELECT slug FROM shops WHERE id=$1',[id]);
    assert.equal(await publicShop(row.slug,query),null);
    const niche = await createNicheShop('owner',{
      name:'Bags',customSlug:'niche-bags',shopMode:'personal',nicheName:'Handbags',externalCatalog:products,
    },query);
    assert.equal(niche.products.length,1);
    assert.deepEqual(niche.catalogImport,{importedCount:1,skippedCount:2});
    await assert.rejects(commitExternalCatalog('owner',niche.shopId,products,'affiliate',true,query),/SHOP_NOT_FOUND/);
  } finally { await pg.close(); }
});

test('import route rejects requests without a seller identity', async () => {
  const response = await POST(new Request('https://sellpostly.example/api/shops/import-external-catalog',{
    method:'POST',body:JSON.stringify({action:'commit',targetShopId:'00000000-0000-0000-0000-000000000000',items:[{title:'Bag'}]}),
  }));
  assert.equal(response.status,401);
  assert.deepEqual(await response.json(),{error:'AUTH_REQUIRED'});
});
