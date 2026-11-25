const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('chrome-extension/background.js',s=>s.replace('return {amazonImageBlocked,unbrandedQuery:',`return {targetShopId:typeof value.targetShopId==='string'&&/^[0-9a-f-]{36}$/i.test(value.targetShopId)?value.targetShopId:undefined,amazonImageBlocked,unbrandedQuery:`));
edit('chrome-extension/background.js',s=>s.replace('chrome.runtime.onMessage.addListener',`async function syncShopDestinations(){
 const base=await SellPostlyFrontend.resolve(),tabs=await chrome.tabs.query({});
 let tab=tabs.find(t=>SellPostlyFrontend.frontendOrigin(t.url)===base);
 if(!tab)tab=await chrome.tabs.create({url:new URL('/shop',base).href});
 for(let attempt=0;attempt<20;attempt++){
 try{const result=await chrome.scripting.executeScript({target:{tabId:tab.id},args:[base],func:async(origin)=>{
 if(location.origin!==origin)return null;
 const headers={'x-pro-key':localStorage.getItem('sellpostly-pro-key')||'','x-shop-key':localStorage.getItem('sellpostly-free-shop-key')||''};
 const response=await fetch('/api/shops',{headers,cache:'no-store'});if(!response.ok)return {error:'SIGN_IN_REQUIRED'};
 const data=await response.json();return {shops:(data.shops||[]).map(s=>({id:s.shopId,slug:s.customSlug,name:s.name,type:s.shopMode,storeMode:s.storeMode,nicheName:s.nicheName}))};
 }});const value=result?.[0]?.result;if(value?.error)throw Error(value.error);if(Array.isArray(value?.shops)){await chrome.storage.local.set({sellpostlyShops:value.shops,sellpostlyShopsOrigin:base});return value.shops;}}
 catch(e){if(e.message==='SIGN_IN_REQUIRED')throw e;}
 await new Promise(resolve=>setTimeout(resolve,500));
 }throw Error('SYNC_FAILED');
}
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 if(message?.type!=='SELLPOSTLY_SYNC_SHOPS')return false;if(sender.id!==chrome.runtime.id){respond({ok:false});return false;}
 syncShopDestinations().then(shops=>respond({ok:true,shops})).catch(()=>respond({ok:false}));return true;
});
chrome.runtime.onMessage.addListener`));
edit('chrome-extension/popup.html',s=>s.replace('<div class="studio-shortcuts">',`<div class="destination-picker"><label><span data-message="Exact Target Shop">Exact Target Shop</span><select id="exact-shop"><option value="" data-message="Primary store (selected type)">Primary store (selected type)</option></select></label><button type="button" id="sync-shops" data-message="Sync My Shops">Sync My Shops</button><small id="niche-import-note" hidden data-message="Niche collection: category is assigned automatically.">Niche collection: category is assigned automatically.</small></div><div class="studio-shortcuts">`));
edit('chrome-extension/popup.js',s=>s.replace('product:{\nunbrandedQuery:',"product:{targetShopId:exactShopTarget()?.id,\nunbrandedQuery:"));
// Existing formatting varies: use the message argument anchor too.
edit('chrome-extension/popup.js',s=>s.replace('product:{ unbrandedQuery:', 'product:{targetShopId:exactShopTarget()?.id, unbrandedQuery:').replace('product:{\r\nunbrandedQuery:', 'product:{targetShopId:exactShopTarget()?.id,\r\nunbrandedQuery:')+`
let syncedShopList=[];
function exactShopTarget(){return syncedShopList.find(s=>s.id+':'+s.type===document.querySelector('#exact-shop').value);}
function refreshExactShop(){const selected=exactShopTarget(),category=document.querySelector('#seller').elements.namedItem('category');
 if(selected)destinationPicker.value=selected.type;
 category.disabled=selected?.storeMode==='niche';category.closest('label').hidden=category.disabled;
 document.querySelector('#niche-import-note').hidden=!category.disabled;refreshAffiliateImageGuard();
}
function renderSyncedShops(list){syncedShopList=Array.isArray(list)?list.filter(s=>s&&/^[0-9a-f-]{36}$/i.test(s.id)&&['personal','affiliate'].includes(s.type)):[];
 const select=document.querySelector('#exact-shop'),previous=select.value;select.replaceChildren(new Option(t('Primary store (selected type)'),''));
 for(const s of syncedShopList)select.add(new Option((s.name||t(s.type==='personal'?'Personal Seller Shop':'Affiliate Deals Shop'))+' — '+(s.storeMode==='niche'?s.nicheName:t(s.type==='personal'?'Personal Seller Shop':'Affiliate Deals Shop')),s.id+':'+s.type));
 if([...select.options].some(o=>o.value===previous))select.value=previous;refreshExactShop();
}
document.querySelector('#exact-shop').addEventListener('change',refreshExactShop);
destinationPicker.addEventListener('change',()=>{document.querySelector('#exact-shop').value='';refreshExactShop();});
document.querySelector('#sync-shops').addEventListener('click',async()=>{const button=document.querySelector('#sync-shops');button.disabled=true;try{const result=await chrome.runtime.sendMessage({type:'SELLPOSTLY_SYNC_SHOPS'});if(!result?.ok)throw Error();renderSyncedShops(result.shops);feedback.textContent=t('Shops synced. Choose your import destination.');}catch{feedback.textContent=t('Sign in to My Shop on the website, then sync again.');}finally{button.disabled=false;}});
chrome.storage.local.get(['sellpostlyShops','sellpostlyShopsOrigin']).then(async saved=>{const base=await SellPostlyFrontend.resolve();if(saved.sellpostlyShopsOrigin===base)renderSyncedShops(saved.sellpostlyShops);}).catch(()=>{});
`);
edit('chrome-extension/manifest.json',s=>s.replace('"version": "1.0.5"','"version": "1.0.6"'));
