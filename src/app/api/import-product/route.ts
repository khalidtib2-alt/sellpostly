import {marketplaceSource,productUrlFallback} from '../../../lib/product-url-fallback';
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import http from "node:http";
import https from "node:https";

export const runtime = "nodejs";
const blocked = new BlockList();
for (const [ip, bits] of [["0.0.0.0",8],["10.0.0.0",8],["100.64.0.0",10],["127.0.0.0",8],["169.254.0.0",16],["172.16.0.0",12],["192.0.0.0",24],["192.168.0.0",16],["198.18.0.0",15],["224.0.0.0",4],["240.0.0.0",4]] as const) blocked.addSubnet(ip,bits);
const globalV6 = new BlockList();
globalV6.addSubnet("2000::",3,"ipv6");

function publicAddress(ip: string) {
  if (isIP(ip) === 4) return !blocked.check(ip,"ipv4");
  // Accept only global unicast IPv6, excluding transition and documentation ranges.
  return globalV6.check(ip,"ipv6") && !/^(2001:|2002:|3fff:)/i.test(ip);
}

async function download(input: string, image = false, redirects = 0, json = false): Promise<{ bytes: Buffer; type: string; url: string }> {
  const url = new URL(input);
  const host = url.hostname.replace(/^\[|\]$/g,"");
  if (!["http:","https:"].includes(url.protocol) || url.username || url.password || (url.port && !["80","443"].includes(url.port)) || host === "localhost" || host.endsWith(".localhost")) throw Error("Invalid URL");
  const addresses = await Promise.race([lookup(host,{all:true}), new Promise<never>((_,reject)=>{ const timer=setTimeout(()=>reject(Error("DNS timeout")),4000); timer.unref(); })]);
  if (!addresses.length || addresses.some(({address})=>!publicAddress(address))) throw Error("Private address");
  const selected = addresses[0];
  return new Promise((resolve,reject)=>{
    const request = (url.protocol === "https:" ? https : http).get(url,{
      agent:false,
      headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36","Accept":json ? "application/json" : image ? "image/*" : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","Accept-Language":"en-US,en;q=0.9,fr;q=0.8,ar;q=0.7","Accept-Encoding":"identity"},
      lookup: (_host, _options, callback) => callback(null,selected.address,selected.family),
    },response=>{
      const code = response.statusCode ?? 500;
      if (code >= 300 && code < 400 && response.headers.location) {
        response.resume();
        if (redirects >= 3) return reject(Error("Too many redirects"));
        download(new URL(response.headers.location,url).href,image,redirects+1,json).then(resolve,reject);
        return;
      }
      const type = response.headers["content-type"]?.split(";")[0] ?? "";
      if (code !== 200 || !(json ? ["application/json","text/json"].includes(type) : image ? ["image/png","image/jpeg","image/webp"].includes(type) : ["text/html","application/xhtml+xml"].includes(type))) {
        response.resume(); reject(Error("Store blocked the request")); return;
      }
      const chunks: Buffer[] = [];
      let size=0;
      response.on("data",(chunk:Buffer)=>{
        size+=chunk.length;
        if (size > (image ? 5_000_000 : 2_000_000)) { request.destroy(Error("Response too large")); return; }
        chunks.push(chunk);
      });
      response.on("end",()=>resolve({bytes:Buffer.concat(chunks),type,url:url.href}));
      response.on("error",reject);
    });
    const timer=setTimeout(()=>request.destroy(Error("Timeout")),8000);
    request.on("close",()=>clearTimeout(timer));
    request.on("error",reject);
  });
}


function descriptionLines(value: unknown) {
  return clean(value).split(/(?<=[.!?])\s+/).filter(line=>! /our wide selection|free shipping and free returns|buy .+ at amazon\.com/i.test(line)).slice(0,4).join("\n");
}
function clean(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/<[^>]*>/g," ").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Math.min(Number(n),0x10ffff))).replace(/\s+/g," ").trim().slice(0,1500);
}
type RecordValue = Record<string, unknown>;
function productIn(value: unknown, depth=0): RecordValue | undefined {
  if (!value || typeof value !== "object" || depth > 12) return;
  if (Array.isArray(value)) {
    for (const child of value) { const found=productIn(child,depth+1); if(found) return found; }
  } else {
    const record=value as RecordValue;
    if ([record["@type"]].flat().includes("Product")) return record;
    for (const child of Object.values(record)) { const found=productIn(child,depth+1); if(found) return found; }
  }
}
async function publicImageReference(value:string,base:string){
 try{const url=new URL(value,base),host=url.hostname.replace(/^\[|\]$/g,'');if(!['http:','https:'].includes(url.protocol)||url.username||url.password||(url.port&&!['80','443'].includes(url.port)))return '';const addresses=await Promise.race([lookup(host,{all:true}),new Promise<never>((_,reject)=>{const timer=setTimeout(()=>reject(Error('DNS timeout')),4000);timer.unref();})]);return addresses.length&&addresses.every(a=>publicAddress(a.address))?url.href:'';}catch{return '';}
}
export async function POST(request: Request) {
  let fallback:ReturnType<typeof productUrlFallback>=null;
  try {
    if (Number(request.headers.get("content-length")) > 5000) throw Error("Too large");
    const reader=request.body?.getReader();
    if(!reader)throw Error("Missing body");
    const chunks: Uint8Array[]=[]; let length=0;
    while(true) { const {done,value}=await reader.read(); if(done)break; length+=value.length; if(length>5000){await reader.cancel();throw Error("Too large");} chunks.push(value); }
    const raw=Buffer.concat(chunks).toString("utf8");
    const {url}=JSON.parse(raw);
    if(typeof url!=="string" || url.length>2048) throw Error("Invalid URL");

    const submitted=new URL(url),host=submitted.hostname.replace(/^\[|\]$/g,'');
    if(!['http:','https:'].includes(submitted.protocol)||submitted.username||submitted.password||(submitted.port&&!['80','443'].includes(submitted.port))||host==='localhost'||host.endsWith('.localhost'))throw Error('Invalid URL');
    const addresses=await Promise.race([lookup(host,{all:true}),new Promise<never>((_,reject)=>{const timer=setTimeout(()=>reject(Error('DNS timeout')),4000);timer.unref();})]);
    if(!addresses.length||addresses.some(({address})=>!publicAddress(address)))throw Error('Private address');
    fallback=productUrlFallback(url);
    const handle=submitted.pathname.match(/\/products\/([^/]+)/)?.[1];
    const homepage = submitted.pathname === "/" || submitted.pathname === "";
    if(handle || homepage) {
      try {
        const response=await download(new URL(homepage ? "/products.json?limit=1" : "/products/"+handle!.replace(/\.json$/,"")+".json",submitted.origin).href,false,0,true);
        const payload=JSON.parse(response.bytes.toString("utf8"));
        const product=homepage ? payload.products?.[0] : payload.product;
        if(!product || typeof product.title!=="string" || !product.title.trim())throw Error("No product");
        const imageUrl=product.image?.src || product.images?.[0]?.src;
        let image=typeof imageUrl==="string"?await publicImageReference(imageUrl,response.url):"";
        if(typeof imageUrl==="string") {
          try {const asset=await download(new URL(imageUrl,response.url).href,true);image="data:"+asset.type+";base64,"+asset.bytes.toString("base64");} catch {}
        }
        const description=String(product.body_html||"").replace(/<\/(?:li|p|div|h[1-6])>|<br\s*\/?>/gi,"\n").split("\n").map(clean).filter(Boolean).slice(0,12).join("\n");
        return Response.json({source:"Shopify",name:clean(product.title),price:clean(product.variants?.[0]?.price),currency:clean(product.currency||payload.currency||product.variants?.[0]?.priceCurrency),description,image},{headers:{"Cache-Control":"no-store"}});
      } catch { if(homepage)return Response.json({error:"PRODUCT_URL_REQUIRED"},{status:400}); }
    }
    const page=await download(url);
    const html=page.bytes.toString("utf8");

    const featureBlock=html.match(/<[^>]+id=["']feature-bullets["'][^>]*>([\s\S]*?)<\/ul>/i)?.[1] || "";
    const featureBullets=[...featureBlock.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(match=>clean(match[1])).filter(line=>line && !/^about this item$/i.test(line)).slice(0,4).join("\n");
    const meta: Record<string,string>={};
    for(const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
      const attrs: Record<string,string>={};
      for(const a of tag[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) attrs[a[1].toLowerCase()]=a[2]??a[3]??a[4];
      const key=attrs.property??attrs.name;
      if(key) meta[key.toLowerCase()]=clean(attrs.content);
    }
    let product: RecordValue | undefined;
    for(const script of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try { product=productIn(JSON.parse(script[1])); if(product)break; } catch { /* Other blocks may contain valid Product data. */ }
    }
    const offer=([product?.offers].flat()[0]??{}) as RecordValue;
    const imageValue=([product?.image].flat()[0]);
    const image=clean(typeof imageValue==="object" && imageValue ? (imageValue as RecordValue).url : imageValue) || meta["og:image"];
    let imageData=image?await publicImageReference(image,page.url):"";
    if(image) {
      try {
        const result=await download(new URL(image,page.url).href,true);
        imageData="data:"+result.type+";base64,"+result.bytes.toString("base64");
      } catch { /* The product can be imported even if its image is unavailable. */ }
    }
    const name=clean(product?.name)||meta["og:title"]||"";
    if(!name) throw Error("No product details");
    return Response.json({source:marketplaceSource(url),name,description:featureBullets || descriptionLines(product?.description||meta["og:description"]||meta.description||""),price:clean(offer.price??offer.lowPrice)||meta["product:price:amount"]||meta["og:price:amount"]||"",currency:clean(offer.priceCurrency)||meta["product:price:currency"]||meta["og:price:currency"]||"",image:imageData},{headers:{"Cache-Control":"no-store"}});
  } catch {
    if(fallback)return Response.json(fallback,{headers:{"Cache-Control":"no-store"}});
    return Response.json({error:"IMPORT_FAILED"},{status:400});
  }
}


