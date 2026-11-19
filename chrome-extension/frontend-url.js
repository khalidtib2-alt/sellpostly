"use strict";
globalThis.SellPostlyFrontend=(()=>{
 const fallback="https://sellpostly.vercel.app";
 function frontendOrigin(value){
  try{const u=new URL(value);if(u.username||u.password)return null;
   const h=u.hostname.toLowerCase();
   if(h==="localhost"&&["http:","https:"].includes(u.protocol))return u.origin;
   if(u.protocol==="https:"&&(h==="sellpostly.vercel.app"||h==="sellpostly.com"||h.endsWith(".sellpostly.com")))return u.origin;
  }catch{}return null;
 }
 function dashboardUrl(value){
  if(typeof value==="string"){try{const h=new URL(value).hostname.toLowerCase();return h==="vercel.com"||h.endsWith(".vercel.com");}catch{return false;}}
  if(value&&typeof value==="object")return Object.values(value).some(dashboardUrl);
  return false;
 }
 async function clearInvalidSavedUrls(){
  try{if(!chrome.storage?.local)return;const saved=await chrome.storage.local.get(null);const keys=Object.keys(saved).filter(key=>dashboardUrl(saved[key]));if(keys.length)await chrome.storage.local.remove(keys);}catch{}
 }
 const ready=clearInvalidSavedUrls();
 async function resolve(){
  await ready;
  try{const tabs=await chrome.tabs.query({});const live=tabs.filter(tab=>!tab.discarded&&frontendOrigin(tab.url)).sort((a,b)=>Number(!!b.active)-Number(!!a.active)||(b.lastAccessed||0)-(a.lastAccessed||0));return live.length?frontendOrigin(live[0].url):fallback;}catch{return fallback;}
 }
 return {frontendOrigin,clearInvalidSavedUrls,resolve,ready};
})();

