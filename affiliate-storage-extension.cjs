const fs=require('fs');const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
let p='src/lib/db.ts',s=read(p);
s=s.replace('seller_email,cod_enabled,escrow_enabled)', 'seller_email,cod_enabled,escrow_enabled,affiliate_disclosure)');
s=s.replace("coalesce(($5::jsonb->>'escrowEnabled')::boolean,true) FROM subscriptions", "coalesce(($5::jsonb->>'escrowEnabled')::boolean,true),CASE WHEN coalesce($5::jsonb->>'shopMode','affiliate')='affiliate' THEN coalesce($5::jsonb->>'affiliateDisclosure','') ELSE '' END FROM subscriptions");
s=s.replace('published=true,updated_at=now()', "affiliate_disclosure=CASE WHEN coalesce(excluded.catalog->>'shopMode','affiliate')='affiliate' THEN excluded.affiliate_disclosure ELSE shops.affiliate_disclosure END,published=true,updated_at=now()");
s=s.replace('SELECT catalog,affiliate_catalog,personal_catalog,', 'SELECT affiliate_disclosure,catalog,affiliate_catalog,personal_catalog,');
s=s.replace('return {...shop,...(shop.shopMode', "return {...shop,...(shop.shopMode==='affiliate'?{affiliateDisclosure:row.affiliate_disclosure??shop.affiliateDisclosure}:{}),...(shop.shopMode");
s=s.replace('SELECT id,slug,escrow_hold_days,affiliate_catalog,', 'SELECT id,slug,escrow_hold_days,affiliate_disclosure,affiliate_catalog,');write(p,s);
p='scripts/init-db.mjs';s=read(p).replace("[['shops','affiliate_catalog']", "[['shops','affiliate_disclosure'],['shops','affiliate_catalog']");write(p,s);
p='src/app/shop/shop-builder.tsx';s=read(p).replace('if(cancelled)return;setShop(initial);', 'if(cancelled)return;setShop(validateShop(initial));');s=s.replace('setImageNotice(false);setAdding(true);', "setImageNotice(isAmazonCdnImage(p.image)||p.images?.some(isAmazonCdnImage)||false);setAdding(true);");s=s.replace('rows={3} maxLength={16000} defaultValue={(editing?.images||[]).join("\\n")}', "rows={3} maxLength={16000} defaultValue={(editing?.images||[]).join(\"\\n\")} onBlur={e=>{if(shop.shopMode==='affiliate'&&e.target.value.split(/\\n/).some(isAmazonCdnImage)){const category=String(new FormData(e.target.form!).get('category')||'Other');e.target.value=e.target.value.split(/\\n/).map(value=>affiliateImage(value,category)).join('\\n');setImageNotice(true);}}" );write(p,s);
p='chrome-extension/background.js';s=read(p).replace('importScripts("app-config.js","frontend-url.js");', 'importScripts("app-config.js","frontend-url.js","affiliate-guard.js");');
const start=s.indexOf('function prepareProduct('),end=s.indexOf('async function sendProduct',start);
s=s.slice(0,start)+`function prepareProduct(value){
 if(!value||typeof value!=="object")throw Error("INVALID_PRODUCT");
 const text=(v,n)=>typeof v==="string"?v.trim().slice(0,n):"";
 const title=text(value.title||value.name,120);if(!title)throw Error("INVALID_PRODUCT");
 const destination=["affiliate","personal"].includes(value.destination)?value.destination:undefined,category=text(value.category,80)||"Top Deals";
 const url=destination==="affiliate"?(()=>{try{const u=new URL(value.url);return ["http:","https:"].includes(u.protocol)?u.href:"";}catch{return "";}})():cleanProductLink(value.url);
 let image=typeof value.image==="string"&&(SellPostlyAffiliate.isStudio(value.image)||/^https?:\\/\\//i.test(value.image))?value.image.slice(0,20000):"";
 if(destination!=="personal"&&SellPostlyAffiliate.isImage(image))image=SellPostlyAffiliate.illustration(category);
 return {destination,stock:Number.isInteger(value.stock)&&value.stock>=0?Math.min(value.stock,1000000):undefined,id:crypto.randomUUID(),title,price:text(value.price,50),description:text(value.description||value.features,240),image,url,category,gender:["men","women","kids"].includes(value.gender)?value.gender:"unisex",source:/amazon\\./i.test(url)?"Amazon":/aliexpress\\./i.test(url)?"AliExpress":"Other"};
}
`+s.slice(end);write(p,s);
p='chrome-extension/popup.html';s=read(p).replace('<script src="popup.js"', '<script src="affiliate-guard.js" defer></script>\n  <script src="popup.js"');s=s.replace('<img id="imported-image"', '<p id="affiliate-image-notice" class="image-notice" role="status" hidden data-message="Amazon listing images cannot be hotlinked directly—upload your own review photo, use a brand press-kit image, or keep this studio illustration.">Amazon listing images cannot be hotlinked directly—upload your own review photo, use a brand press-kit image, or keep this studio illustration.</p>\n      <img id="imported-image"');write(p,s);
p='chrome-extension/popup.js';s=read(p);
s=s.replace('if(product.image) preview.src = product.image;', 'if(product.image){preview.dataset.rawImage=product.image;refreshAffiliateImageGuard();}');s=s.replace('else if(!preserveEdits)preview.removeAttribute("src");', 'else if(!preserveEdits){preview.removeAttribute("src");delete preview.dataset.rawImage;delete preview.dataset.shopImage;refreshAffiliateImageGuard();}');
s=s.replace('  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});\n  const result=await chrome.runtime.sendMessage', '  refreshAffiliateImageGuard();\n  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});\n  const result=await chrome.runtime.sendMessage');
s=s.replace('image:preview.getAttribute("src")||"",url:tab?.url', 'image:preview.dataset.shopImage||preview.getAttribute("src")||"",url:tab?.url');
s+=`\nfunction refreshAffiliateImageGuard(){
 const form=document.querySelector('#seller'),preview=document.querySelector('#imported-image'),notice=document.querySelector('#affiliate-image-notice');
 const source=preview.dataset.rawImage||preview.getAttribute('src')||'',affiliate=form.elements.namedItem('destination').value==='affiliate';
 const blocked=affiliate&&SellPostlyAffiliate.isImage(source);notice.hidden=!blocked;
 if(blocked){const image=SellPostlyAffiliate.illustration(form.elements.namedItem('category').value);preview.dataset.shopImage=image;preview.src=chrome.runtime.getURL(image.slice(1));preview.hidden=false;notice.textContent=t('Amazon listing images cannot be hotlinked directly—upload your own review photo, use a brand press-kit image, or keep this studio illustration.');}
 else{delete preview.dataset.shopImage;if(preview.dataset.rawImage){preview.src=preview.dataset.rawImage;preview.hidden=false;}}
}
for(const name of ['destination','category'])document.querySelector('#seller').elements.namedItem(name).addEventListener('change',refreshAffiliateImageGuard);
`;write(p,s);
p='chrome-extension/manifest.json';const manifest=JSON.parse(read(p));manifest.version='1.0.4';write(p,JSON.stringify(manifest,null,2)+'\n');
for(const name of ['headphones','backpack','organizer','bottle','studio-product']){fs.mkdirSync('chrome-extension/demo-products',{recursive:true});fs.copyFileSync('public/demo-products/'+name+'.svg','chrome-extension/demo-products/'+name+'.svg');}
