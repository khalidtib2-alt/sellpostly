"use strict";
globalThis.SellPostlyAffiliate=(()=>{
 const host=value=>{try{const url=new URL(value);return ["http:","https:"].includes(url.protocol)?url.hostname.toLowerCase().replace(/\.$/,""):"";}catch{return "";}};
 const isAmazon=value=>/(^|\.)amzn\.to$/.test(host(value))||/(^|\.)amazon\.(?:com(?:\.[a-z]{2})?|co\.[a-z]{2}|[a-z]{2})$/.test(host(value));
 const isImage=value=>/(^|\.)(?:media-amazon|images-amazon|ssl-images-amazon)\.com$/.test(host(value));
 const illustration=category=>"/demo-products/"+(category==="Tech & Gadgets"?"headphones":category==="Fashion"?"backpack":category==="Home & Kitchen"?"organizer":["Beauty","Fitness","Sport"].includes(category)?"bottle":"studio-product")+".svg";
 const isStudio=value=>/^\/demo-products\/(headphones|backpack|organizer|bottle|studio-product)\.svg$/.test(value);
 return {isAmazon,isImage,illustration,isStudio};
})();
