"use strict";
if(typeof importScripts==="function")importScripts("app-config.js","frontend-url.js");
const SHOP_SITE = globalThis.SELLPOSTLY_APP_URL || "https://sellpostly.vercel.app";
function publicUrl(value) {
 if(typeof value!=="string"||value.length>20000)return "";
 try { const url=new URL(value);return ["https:","http:"].includes(url.protocol)?url.href:""; } catch { return ""; }
}
function shopImportUrl(value,base=SHOP_SITE) {
 if(!value||typeof value!=="object")throw Error("INVALID_PRODUCT");
 const clean=(value,max)=>typeof value==="string"?value.trim().slice(0,max):"";
 const title=clean(value.title||value.name,120);
 if(!title)throw Error("INVALID_PRODUCT");
 const url=publicUrl(value.url),host=url?new URL(url).hostname:"";
 const source=/(^|\.)amazon\./i.test(host)?"Amazon":/(^|\.)aliexpress\./i.test(host)?"AliExpress":/(^|\.)myshopify\.com$/i.test(host)?"Shopify":"Other";
 const product={id:crypto.randomUUID(),title,price:clean(value.price,50),description:clean(value.description||value.features,4000),image:publicUrl(value.image),url,category:["Tech & Gadgets","Fashion","Home & Kitchen","Beauty","Fitness","Top Deals","Digital Product","Art","Sport","Other"].includes(value.category)?value.category:"Top Deals",gender:["unisex","women","men","kids"].includes(value.gender)?value.gender:"unisex",source};
 const target=new URL("/shop",base);
 target.hash=new URLSearchParams({importProduct:JSON.stringify(product)}).toString();
 if(target.hash.length>250000)throw Error("IMPORT_TOO_LARGE");
 return target.href;
}
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 if(message?.type!=="SELLPOSTLY_SEND_TO_SHOP")return false;
 if(sender.id!==chrome.runtime.id){respond({ok:false,error:"INVALID_SENDER"});return false;}
 (async()=>{try{const base=await globalThis.SellPostlyFrontend.resolve();const url=shopImportUrl(message.product,base);await chrome.tabs.create({url});respond({ok:true});}catch{respond({ok:false,error:"SHOP_IMPORT_FAILED"});}})();
 return true;
});

