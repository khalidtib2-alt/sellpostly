const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('src/app/shop/payment-config.ts',s=>s.replace("import {normalizeNetwork", "import {validTronAddress} from './tron-data';\nimport {normalizeNetwork")
.replace("'USDC_DIRECT','COD'","'USDC_DIRECT','TRON_USDT','COD'")
.replace('COD:{enabled:boolean}}','TRON_USDT:{enabled:boolean;wallet:string};COD:{enabled:boolean}}')
.replace('},COD:{enabled:p.COD',"},TRON_USDT:{enabled:p.TRON_USDT?.enabled===true,wallet:validTronAddress(str(p.TRON_USDT?.wallet,100))?str(p.TRON_USDT?.wallet,100):''},COD:{enabled:p.COD")
.replace("case 'USDC_DIRECT':return", "case 'TRON_USDT':return validTronAddress(p.TRON_USDT.wallet);case 'USDC_DIRECT':return")
.replace("USDC_DIRECT:'USDC',COD:","USDC_DIRECT:'USDC',TRON_USDT:'TRON (USDT-TRC20)',COD:"));
edit('src/app/shop/shop-data.ts',s=>s.replace("import {promoVideo}","import {publicDigitalProduct} from './digital-data';\nimport {promoVideo}")
.replace('export type Product = {','export type Product = { isDigital?:boolean; digitalDeliveryNote?:string; digitalDownloadUrl?:string;')
.replace('return ({promo_video_url:',"return ({isDigital:typeof p.isDigital==='boolean'?p.isDigital:p.category==='Digital Product',digitalDeliveryNote:text(p.digitalDeliveryNote,2000),digitalDownloadUrl:(()=>{const url=safeUrl(text(p.digitalDownloadUrl,2048));return url.startsWith('https://')?url:'';})(),promo_video_url:")
.replace('JSON.stringify(shop));','JSON.stringify({...shop,products:shop.products.map(publicDigitalProduct)}));'));
edit('src/lib/db.ts',s=>s.replace("import 'server-only';","import 'server-only';\nimport {publicDigitalProduct} from '../app/shop/digital-data';\nimport {validTronChecksum} from './tron-validation';")
.replace("if(shop.shopMode==='personal'&&shop.cryptoWallet", "if(shop.shopMode==='personal'&&shop.payments?.TRON_USDT.enabled&&!validTronChecksum(shop.payments.TRON_USDT.wallet))throw Error('INVALID_TRON_WALLET');\n  if(shop.shopMode==='personal'&&shop.cryptoWallet")
.replace('return {...shop,mainStoreSlug:', 'return {...shop,products:shop.products.map(publicDigitalProduct),mainStoreSlug:'));
edit('src/lib/free-shop-service.ts',s=>s.replace("import 'server-only';","import 'server-only';\nimport {validTronChecksum} from './tron-validation';").replace('const rows=await db().query',"if(shop.payments?.TRON_USDT.enabled&&!validTronChecksum(shop.payments.TRON_USDT.wallet))throw Error('INVALID_TRON_WALLET');const rows=await db().query"));
edit('src/db/schema.sql',s=>s.replaceAll("'WISE','USDC_DIRECT'","'WISE','USDC_DIRECT','TRON_USDT'").replace("'WISE','Polygon'","'WISE','TRON','Polygon'")+`
-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS orders_tron_payment_reference ON orders(network,lower(details->>'payment_reference')) WHERE payment_method='TRON_USDT';
`);
