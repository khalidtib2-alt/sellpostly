"use strict";
importScripts("app-config.js","frontend-url.js","affiliate-guard.js");
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
 if(destination!=="personal"&&SellPostlyAffiliate.isImage(image))image=SellPostlyAffiliate.illustration(category);
 return {destination,stock:Number.isInteger(value.stock)&&value.stock>=0?Math.min(value.stock,1000000):undefined,id:crypto.randomUUID(),title,price:text(value.price,50),description:text(value.description||value.features,240),image,url,category,gender:["men","women","kids"].includes(value.gender)?value.gender:"unisex",source:/amazon\./i.test(url)?"Amazon":/aliexpress\./i.test(url)?"AliExpress":"Other"};
}
async function sendProduct(value){
 const product=prepareProduct(value),base=await SellPostlyFrontend.resolve();
 const tab=await chrome.tabs.create({url:new URL("/shop",base).href});if(!tab.id)throw Error("TAB_UNAVAILABLE");
 for(let attempt=0;attempt<30;attempt++){
  try{
   const result=await chrome.scripting.executeScript({target:{tabId:tab.id},args:[product,base],func:(item,origin)=>{
    if(location.origin!==origin||location.pathname!=="/shop")return false;
    try{localStorage.setItem("sellpostly_pending_shop_item",JSON.stringify(item));window.postMessage({type:"SELLPOSTLY_PRODUCT_IMPORT",product:item},origin);return true;}catch{return false;}
   }});
   if(result?.[0]?.result===true)return;
  }catch{}
  await new Promise(resolve=>setTimeout(resolve,500));
 }
 throw Error("BRIDGE_UNAVAILABLE");
}
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 if(message?.type!=="SELLPOSTLY_SEND_TO_SHOP")return false;
 if(sender.id!==chrome.runtime.id){respond({ok:false,error:"INVALID_SENDER"});return false;}
 sendProduct(message.product).then(()=>respond({ok:true})).catch(()=>respond({ok:false,error:"SHOP_IMPORT_FAILED"}));return true;
});

