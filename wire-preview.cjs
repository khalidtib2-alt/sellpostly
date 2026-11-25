const fs=require('fs'),path=require('path');
const email='sellpostly.support@gmail.com';
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const p of [...walk('src'),...walk('chrome-extension'),...walk('scripts'),...fs.readdirSync('.').filter(p=>p.endsWith('.md'))]){if(!/\.(tsx?|jsx?|mjs|json|html|css|md)$/.test(p))continue;const s=fs.readFileSync(p,'utf8'),next=s.replaceAll('support@sellpostly.com',email).replaceAll('YOUR_NEW_GMAIL@gmail.com',email);if(s!==next)fs.writeFileSync(p,next);}
let p='src/app/shop/shop-builder.tsx',s=fs.readFileSync(p,'utf8');
const legacy=s.match(/const canvas=document.createElement\("canvas"\);[\s\S]*?context.fillText\([\s\S]*?;\r?\n/);
if(!legacy)throw Error('Legacy sample renderer not found');
const demos=`import type {Shop} from './shop-data';
export const demoProducts=[
 {name:'Wireless headphones',price:'49 USD',category:'Tech & Gadgets',image:'/demo-products/headphones.svg',url:'https://www.amazon.com/',source:'Amazon'},
 {name:'Travel backpack',price:'39 USD',category:'Fashion',image:'/demo-products/backpack.svg',url:'https://www.aliexpress.com/',source:'AliExpress'},
 {name:'Kitchen organizer',price:'24 USD',category:'Home & Kitchen',image:'/demo-products/organizer.svg',url:'https://www.shopify.com/',source:'Shopify'},
 {name:'Fitness bottle',price:'19 USD',category:'Fitness',image:'/demo-products/bottle.svg',url:'https://www.amazon.com/',source:'Amazon'}
] as const;
export function createSampleShop():Shop{
 return {name:'My Shop',bio:'',phone:'',shopMode:'affiliate',shopTheme:'white',products:demoProducts.map((p,index)=>({...p,id:'sample-'+index,gender:'unisex' as const}))};
}
function legacyPhoto(index:number){
 if(typeof document==='undefined')return null;
 try{ `+legacy[0]+`return canvas.toDataURL();}catch{return null;}
}
// Only replace an untouched, exact legacy demo render; never seller photos.
export function upgradeDemoPhotos(shop:Shop):Shop{
 return {...shop,products:shop.products.map(product=>{
 const index=demoProducts.findIndex((p,i)=>product.id==='sample-'+i&&product.name===p.name);
 if(index<0)return product;
 if(!product.image||product.image===legacyPhoto(index))return {...product,image:demoProducts[index].image};
 return product;
 })};
}
`;
fs.writeFileSync('src/app/shop/demo-products.ts',demos);
const start=s.indexOf('function samples(): Shop {'),end=s.indexOf('export default function ShopBuilder',start);
s=s.slice(0,start)+s.slice(end);
s=s.replace('import {useShopCart}',"import {createSampleShop,upgradeDemoPhotos} from './demo-products';\nimport {useShopCart}").replace('let initial=samples();','let initial=createSampleShop();').replace('initial=validateShop(JSON.parse(saved))','initial=upgradeDemoPhotos(validateShop(JSON.parse(saved)))');
fs.writeFileSync(p,s);
p='src/app/shop/pro-gate.tsx';s=fs.readFileSync(p,'utf8').replace("import dynamic","import {demoProducts} from './demo-products';\nimport dynamic");
const startGrid=s.indexOf("{(['Tech & Gadgets','Fashion','Home & Kitchen','Fitness'] as const).map");
const endGrid=s.indexOf('</div></div>',startGrid);if(startGrid<0||endGrid<0)throw Error('Preview grid not found');
s=s.slice(0,startGrid)+`{demoProducts.map(product=><article key={product.category} className="group overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"><div className="aspect-[4/3] overflow-hidden rounded-xl"><img src={product.image} alt={t(product.name)} width={480} height={360} className="h-full w-full object-contain transition-transform duration-300 motion-safe:group-hover:scale-105" decoding="async"/></div><p className="mt-3 text-sm font-semibold">{t(product.category)}</p><p className="mt-1 text-base font-extrabold text-slate-900" dir="ltr">{product.price}</p></article>)}`+s.slice(endGrid);
fs.writeFileSync(p,s);
p='src/app/shop/shop-data.ts';s=fs.readFileSync(p,'utf8').replace('export function safeImage(value: string) {','export function safeImage(value: string) {\n  if(/^\\/demo-products\\/(headphones|backpack|organizer|bottle)\\.svg$/.test(value))return value;');fs.writeFileSync(p,s);
p='src/lib/email.ts';s=fs.readFileSync(p,'utf8').replace("import 'server-only';","import 'server-only';\nimport {supportEmail} from './support';").replace('words.open+\': \'+href,words.footer','words.open+\': \'+href,words.footer,supportEmail').replace("escapeHtml(words.footer)+'</p>","escapeHtml(words.footer)+'<br/><a href=\"mailto:'+supportEmail+'\">'+supportEmail+'</a></p>").replace('to:[to],...emailTemplate(data)','to:[to],reply_to:supportEmail,...emailTemplate(data)');fs.writeFileSync(p,s);

