import {publicDigitalProduct} from './digital-data';
import {promoVideo} from './promo-video';
import {normalizePayments,governance,type PaymentSettings,type EscrowGovernance} from './payment-config';
import {stockMetadata,isLocalStock,type StockPhoto} from './stock-photos';
import {unbrandedQuery,footwearSubtype} from './unbranded-query';
import {coverNiche,isStudioCover,type VisualNiche} from './product-identity';
import {affiliateImage,isAmazonCdnImage,amazonAffiliateProduct} from './affiliate-compliance';
import {shopAccents,type ShopAccent} from './storefront-style';
export type ShopMode = "affiliate" | "personal";
export const dealBadges = ["none","hot","sale","limited","new"] as const;
export type DealBadge = typeof dealBadges[number];
import { normalizeNetwork, type CryptoNetwork } from "./crypto-data";
export type Gender = "unisex" | "men" | "women" | "kids";
export function normalizeGender(value: unknown): Gender { return value === "men" || value === "women" || value === "kids" ? value : "unisex"; }
import type { Surface } from "../theme-picker";
export type Product = { isDigital?:boolean; digitalDeliveryNote?:string; digitalDownloadUrl?:string; promo_video_url?:string; amazonImageBlocked?:boolean; unbrandedQuery?:string; stockPhoto?:StockPhoto; photoResolvedFor?:string; editorialCover?:VisualNiche; identityOverride?:string; stock?:number; catalogMode?:ShopMode; images?:string[]; description?: string; id: string; name: string; price: string; compareAtPrice?: string; badge?: DealBadge; category: string; gender: Gender; image: string; url: string; source: string };
export type Shop = { showMainStoreLink?:boolean; mainStoreSlug?:string; shopId?:string; customSlug?:string; storeMode?:"general"|"niche"; nicheName?:string; payments?:PaymentSettings; escrowGovernance?:EscrowGovernance; heroTitle?:string; heroSubtitle?:string; heroImage?:string; shopAccent?:ShopAccent; codEnabled?:boolean; escrowEnabled?:boolean; sellerEmail?:string; logo?: string; escrowHoldDays?: number; name: string; bio: string; phone: string; shopMode: ShopMode; affiliateDisclosure?: string; cryptoWallet?: string; cryptoNetwork?: CryptoNetwork; shopTheme: Surface; products: Product[] };
export const shopKey = "sellpostly-shop-v1";
export const categories = ["All", "Tech & Gadgets", "Fashion", "Home & Kitchen", "Beauty", "Fitness", "Top Deals", "Digital Product", "Art", "Sport", "Other"] as const;
export function safeUrl(value: string) {
  try { const url=new URL(value); return ["http:","https:"].includes(url.protocol) ? url.href : ""; } catch { return ""; }
}
export function safeImage(value: string) {
  if(isLocalStock(value))return value;
  if(isStudioCover(value))return value;
  if(/^\/demo-products\/(headphones|backpack|organizer|bottle|studio-product)\.svg$/.test(value))return value;
  return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : safeUrl(value);
}
export function validateShop(value: unknown): Shop {
  const raw=value as Partial<Shop>;
  if(!raw || !Array.isArray(raw.products)) throw Error("Invalid shop");
  const text=(value:unknown,max=300)=>typeof value==="string"?value.slice(0,max):"";
  return {showMainStoreLink:raw.showMainStoreLink!==false,mainStoreSlug:typeof raw.mainStoreSlug==='string'&&/^[a-z0-9][a-z0-9-]{2,63}$/.test(raw.mainStoreSlug)?raw.mainStoreSlug:undefined,shopId:typeof raw.shopId==='string'&&/^[0-9a-f-]{36}$/i.test(raw.shopId)?raw.shopId:undefined,customSlug:typeof raw.customSlug==='string'&&/^[a-z0-9][a-z0-9-]{2,63}$/.test(raw.customSlug)?raw.customSlug:undefined,storeMode:raw.storeMode==='niche'?'niche':'general',nicheName:text(raw.nicheName,100),payments:raw.shopMode==='personal'?normalizePayments(raw.payments,raw):undefined,escrowGovernance:raw.shopMode==='personal'?governance(raw.escrowGovernance,raw.escrowEnabled!==false):undefined,heroTitle:text(raw.heroTitle,140),heroSubtitle:text(raw.heroSubtitle,400),heroImage:safeImage(text(raw.heroImage,1500000)),shopAccent:shopAccents.includes(raw.shopAccent as ShopAccent)?raw.shopAccent:raw.shopMode==='personal'?'emerald':'amber',codEnabled:normalizePayments(raw.payments,raw).COD.enabled,escrowEnabled:normalizePayments(raw.payments,raw).USDC_DIRECT.enabled,sellerEmail:text(raw.sellerEmail,254).trim(),logo:safeImage(text(raw.logo,500000)),escrowHoldDays:typeof raw.escrowHoldDays==="number"&&Number.isInteger(raw.escrowHoldDays)&&raw.escrowHoldDays>=3&&raw.escrowHoldDays<=15?raw.escrowHoldDays:7,shopMode:raw.shopMode==="personal"?"personal":"affiliate",affiliateDisclosure:text(raw.affiliateDisclosure,500),cryptoWallet:text(raw.cryptoWallet,100).trim(),cryptoNetwork:normalizeNetwork(raw.cryptoNetwork),shopTheme: ["white","sand","mint","slate"].includes(raw.shopTheme||"") ? raw.shopTheme! : "white",name:text(raw.name,100),bio:text(raw.bio,500),phone:text(raw.phone,30),products:raw.products.filter(p=>!p.catalogMode||p.catalogMode===(raw.shopMode==="personal"?"personal":"affiliate")).map(p=>{
 const blocked=raw.shopMode!=='personal'&&(isAmazonCdnImage(p.image||'')||!!p.images?.some(isAmazonCdnImage)||p.amazonImageBlocked===true);
 const restricted=raw.shopMode!=='personal'&&amazonAffiliateProduct({...p,amazonImageBlocked:blocked});
 const expected=footwearSubtype(unbrandedQuery(p.identityOverride||p.name||'',p.category,p.gender)),previousPhoto=stockMetadata(p.stockPhoto,p.image);
 if(restricted&&expected&&previousPhoto&&previousPhoto.footwearSubtype!==expected)p={...p,image:''};
 return ({isDigital:typeof p.isDigital==='boolean'?p.isDigital:p.category==='Digital Product',digitalDeliveryNote:text(p.digitalDeliveryNote,2000),digitalDownloadUrl:(()=>{const url=safeUrl(text(p.digitalDownloadUrl,2048));return url.startsWith('https://')?url:'';})(),promo_video_url:promoVideo(p.promo_video_url)?.url||'',amazonImageBlocked:blocked,unbrandedQuery:unbrandedQuery(text(p.identityOverride||p.name,140),text(p.category,80),normalizeGender(p.gender)),photoResolvedFor:text(p.photoResolvedFor,100),stockPhoto:stockMetadata(p.stockPhoto,raw.shopMode==='personal'?safeImage(text(p.image,1500000)):affiliateImage(safeImage(text(p.image,1500000)),text(p.category,80),text(p.identityOverride||p.name,140),undefined,normalizeGender(p.gender),text(p.url,20000),blocked)),editorialCover:coverNiche(p.editorialCover),identityOverride:text(p.identityOverride,140),stock:typeof p.stock==='number'&&Number.isInteger(p.stock)&&p.stock>=0?Math.min(p.stock,1000000):undefined,catalogMode:raw.shopMode==="personal"?"personal" as const:"affiliate" as const,
    images:Array.isArray(p.images)?p.images.filter((v:unknown)=>typeof v==="string"&&v.trim()).slice(0,8).map(v=>raw.shopMode==='personal'?safeImage(text(v,1500000)):affiliateImage(safeImage(text(v,1500000)),text(p.category,80),text(p.identityOverride||p.name,140),undefined,normalizeGender(p.gender),text(p.url,20000),blocked)).filter(Boolean):[],description:text(p.description,4000),badge:dealBadges.includes(p.badge as DealBadge)?p.badge:"none",compareAtPrice:text(p.compareAtPrice,50),gender:normalizeGender(p.gender),id:text(p.id,100),name:text(p.name,120),price:text(p.price,50),category:text(p.category,80),image:raw.shopMode==='personal'?safeImage(text(p.image,1500000)):affiliateImage(safeImage(text(p.image,1500000)),text(p.category,80),text(p.identityOverride||p.name,140),coverNiche(p.editorialCover),normalizeGender(p.gender),text(p.url,20000),blocked),url:safeUrl(text(p.url,20000)),source:text(p.source,50)
  });}).filter(p=>p.id && p.name)};
}
export async function encodeShop(shop: Shop) {
  const bytes=new TextEncoder().encode(JSON.stringify({...shop,products:shop.products.map(publicDigitalProduct)}));
  const compressed=await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
  if(compressed.byteLength>45000)throw Error("Too large");
  return btoa(Array.from(new Uint8Array(compressed),n=>String.fromCharCode(n)).join("")).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
export async function decodeShop(value: string) {
  if(value.length>60000)throw Error("Too large");
  const bytes=Uint8Array.from(atob(value.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")).getReader();
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1500000){await reader.cancel();throw Error("Too large");}chunks.push(value);}
  return validateShop(JSON.parse(await new Blob(chunks as BlobPart[]).text()));
}
