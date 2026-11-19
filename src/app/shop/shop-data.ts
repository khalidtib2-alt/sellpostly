import {stockMetadata,isLocalStock,type StockPhoto} from './stock-photos';
import {unbrandedQuery} from './unbranded-query';
import {coverNiche,isStudioCover,type VisualNiche} from './product-identity';
import {affiliateImage} from './affiliate-compliance';
import {shopAccents,type ShopAccent} from './storefront-style';
export type ShopMode = "affiliate" | "personal";
export const dealBadges = ["none","hot","sale","limited","new"] as const;
export type DealBadge = typeof dealBadges[number];
import { normalizeNetwork, type CryptoNetwork } from "./crypto-data";
export type Gender = "unisex" | "men" | "women" | "kids";
export function normalizeGender(value: unknown): Gender { return value === "men" || value === "women" || value === "kids" ? value : "unisex"; }
import type { Surface } from "../theme-picker";
export type Product = { unbrandedQuery?:string; stockPhoto?:StockPhoto; photoResolvedFor?:string; editorialCover?:VisualNiche; identityOverride?:string; stock?:number; catalogMode?:ShopMode; images?:string[]; description?: string; id: string; name: string; price: string; compareAtPrice?: string; badge?: DealBadge; category: string; gender: Gender; image: string; url: string; source: string };
export type Shop = { heroTitle?:string; heroSubtitle?:string; heroImage?:string; shopAccent?:ShopAccent; codEnabled?:boolean; escrowEnabled?:boolean; sellerEmail?:string; logo?: string; escrowHoldDays?: number; name: string; bio: string; phone: string; shopMode: ShopMode; affiliateDisclosure?: string; cryptoWallet?: string; cryptoNetwork?: CryptoNetwork; shopTheme: Surface; products: Product[] };
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
  return {heroTitle:text(raw.heroTitle,140),heroSubtitle:text(raw.heroSubtitle,400),heroImage:raw.shopMode==='personal'?safeImage(text(raw.heroImage,1500000)):(safeImage(text(raw.heroImage,1500000))?affiliateImage(safeImage(text(raw.heroImage,1500000)),'Other'):''),shopAccent:shopAccents.includes(raw.shopAccent as ShopAccent)?raw.shopAccent:raw.shopMode==='personal'?'emerald':'amber',codEnabled:raw.codEnabled!==false,escrowEnabled:raw.escrowEnabled!==false,sellerEmail:text(raw.sellerEmail,254).trim(),logo:safeImage(text(raw.logo,500000)),escrowHoldDays:typeof raw.escrowHoldDays==="number"&&Number.isInteger(raw.escrowHoldDays)&&raw.escrowHoldDays>=3&&raw.escrowHoldDays<=15?raw.escrowHoldDays:7,shopMode:raw.shopMode==="personal"?"personal":"affiliate",affiliateDisclosure:text(raw.affiliateDisclosure,500),cryptoWallet:text(raw.cryptoWallet,100).trim(),cryptoNetwork:normalizeNetwork(raw.cryptoNetwork),shopTheme: ["white","sand","mint","slate"].includes(raw.shopTheme||"") ? raw.shopTheme! : "white",name:text(raw.name,100),bio:text(raw.bio,500),phone:text(raw.phone,30),products:raw.products.filter(p=>!p.catalogMode||p.catalogMode===(raw.shopMode==="personal"?"personal":"affiliate")).map(p=>({unbrandedQuery:unbrandedQuery(text(p.identityOverride||p.name,140),text(p.category,80),normalizeGender(p.gender)),photoResolvedFor:text(p.photoResolvedFor,100),stockPhoto:stockMetadata(p.stockPhoto,raw.shopMode==='personal'?safeImage(text(p.image,1500000)):affiliateImage(safeImage(text(p.image,1500000)),text(p.category,80),text(p.identityOverride||p.name,140),undefined,normalizeGender(p.gender))),editorialCover:coverNiche(p.editorialCover),identityOverride:text(p.identityOverride,140),stock:typeof p.stock==='number'&&Number.isInteger(p.stock)&&p.stock>=0?Math.min(p.stock,1000000):undefined,catalogMode:raw.shopMode==="personal"?"personal" as const:"affiliate" as const,
    images:Array.isArray(p.images)?p.images.filter((v:unknown)=>typeof v==="string"&&v.trim()).slice(0,8).map(v=>raw.shopMode==='personal'?safeImage(text(v,1500000)):affiliateImage(safeImage(text(v,1500000)),text(p.category,80),text(p.identityOverride||p.name,140))).filter(Boolean):[],description:text(p.description,4000),badge:dealBadges.includes(p.badge as DealBadge)?p.badge:"none",compareAtPrice:text(p.compareAtPrice,50),gender:normalizeGender(p.gender),id:text(p.id,100),name:text(p.name,120),price:text(p.price,50),category:text(p.category,80),image:raw.shopMode==='personal'?safeImage(text(p.image,1500000)):affiliateImage(safeImage(text(p.image,1500000)),text(p.category,80),text(p.identityOverride||p.name,140),coverNiche(p.editorialCover),normalizeGender(p.gender)),url:safeUrl(text(p.url,20000)),source:text(p.source,50)
  })).filter(p=>p.id && p.name)};
}
export async function encodeShop(shop: Shop) {
  const bytes=new TextEncoder().encode(JSON.stringify(shop));
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
