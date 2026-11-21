"use strict";
importScripts("app-config.js","frontend-url.js","affiliate-guard.js","unbranded-query.js");
function cleanProductLink(value){
 try{const u=new URL(value);if(!["http:","https:"].includes(u.protocol))return "";
 if(/(^|\.)amazon\.[a-z.]+$/i.test(u.hostname)){const match=u.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:\/|$)/i);if(match)return u.origin+"/dp/"+match[1].toUpperCase();}
 for(const key of [...u.searchParams.keys()])if(/^(utm_|ref|tag$|fbclid$|gclid$|ascsubtag$|linkCode$|camp$|creative$|affiliate|aff_|tracking)/i.test(key))u.searchParams.delete(key);
 u.hash="";return u.href;
 }catch{return "";}
}
function prepareProduct(value){
 if(!value||typeof value!=="object")throw Error("INVALID_PRODUCT");
 const text=(v,n)=>typeof v==="string"?v.trim().slice(0,n):"";
 const title=text(value.title||value.name,120);if(!title)throw Error("INVALID_PRODUCT");
 const destination=["affiliate","personal"].includes(value.destination)?value.destination:undefined,category=text(value.category,80)||"Top Deals";
 const url=destination==="affiliate"?(()=>{try{const u=new URL(value.url);return ["http:","https:"].includes(u.protocol)?u.href:"";}catch{return "";}})():cleanProductLink(value.url);
 let image=typeof value.image==="string"&&(SellPostlyAffiliate.isStudio(value.image)||/^https?:\/\//i.test(value.image))?value.image.slice(0,20000):"";
 const amazonImageBlocked=destination==="affiliate"&&SellPostlyAffiliate.isImage(image);
 if(amazonImageBlocked)image="";
 return {targetShopId:typeof value.targetShopId==='string'&&/^[0-9a-f-]{36}$/i.test(value.targetShopId)?value.targetShopId:undefined,amazonImageBlocked,unbrandedQuery:SellPostlyUnbrandedQuery(title,category,value.gender),destination,stock:Number.isInteger(value.stock)&&value.stock>=0?Math.min(value.stock,1000000):undefined,id:crypto.randomUUID(),title,price:text(value.price,50),description:text(value.description||value.features,240),image,url,category,gender:["men","women","kids"].includes(value.gender)?value.gender:"unisex",source:/amazon\./i.test(url)?"Amazon":/aliexpress\./i.test(url)?"AliExpress":"Other"};
}
async function sendProduct(value,studio=false){
 const product=prepareProduct(value),base=await SellPostlyFrontend.resolve();
 const path=studio?'/studio':'/shop';const tab=await chrome.tabs.create({url:new URL(path,base).href});if(!tab.id)throw Error("TAB_UNAVAILABLE");
 for(let attempt=0;attempt<30;attempt++){
  try{
   const result=await chrome.scripting.executeScript({target:{tabId:tab.id},args:[product,base,studio],func:(item,origin,studio)=>{
    if(location.origin!==origin||location.pathname!==(studio?"/studio":"/shop"))return false;
    try{localStorage.setItem(studio?"sellpostly_pending_studio_item":"sellpostly_pending_shop_item",JSON.stringify(item));window.postMessage({type:studio?"SELLPOSTLY_STUDIO_IMPORT":"SELLPOSTLY_PRODUCT_IMPORT",product:item},origin);return true;}catch{return false;}
   }});
   if(result?.[0]?.result===true)return;
  }catch{}
  await new Promise(resolve=>setTimeout(resolve,500));
 }
 throw Error("BRIDGE_UNAVAILABLE");
}
async function syncShopDestinations(){
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
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 if(!["SELLPOSTLY_SEND_TO_SHOP","SELLPOSTLY_OPEN_STUDIO"].includes(message?.type))return false;
 if(sender.id!==chrome.runtime.id){respond({ok:false,error:"INVALID_SENDER"});return false;}
 sendProduct(message.product,message.type==="SELLPOSTLY_OPEN_STUDIO").then(()=>respond({ok:true})).catch(()=>respond({ok:false,error:"SHOP_IMPORT_FAILED"}));return true;
});

