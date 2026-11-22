import {footwearSubtype,unbrandedQuery} from './unbranded-query';
import {extractProductIdentity,studioCover,isStudioCover,type VisualNiche} from './product-identity';
import {defaultStock,localPhoto} from './stock-photos';
function host(value:string){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.hostname.toLowerCase().replace(/\.$/,''):'';}catch{return '';}}
export function isAmazonDestination(value:string){const hostname=host(value);return /(^|\.)amzn\.(?:to|eu)$/.test(hostname)||/(^|\.)amazon\.(?:com(?:\.[a-z]{2})?|co\.[a-z]{2}|[a-z]{2})$/.test(hostname);}
export function isAmazonCdnImage(value:string){return /(^|\.)(?:media-amazon|images-amazon|ssl-images-amazon)\.com$/.test(host(value));}
export function studioCategoryImage(category:string){
 const file=category==='Tech & Gadgets'?'headphones':category==='Fashion'?'backpack':category==='Home & Kitchen'?'organizer':['Beauty','Fitness','Sport'].includes(category)?'bottle':'studio-product';
 return '/demo-products/'+file+'.svg';
}
export function affiliateImage(value:string,category:string,title='',selected?:VisualNiche,gender='unisex',destination='',amazonImageBlocked=false){
 // Imported photos are seller-controlled. Only missing photos receive a default.
 return value||defaultStock(title,category,gender).url;
}
export function amazonAffiliateProduct(p:{url?:string;image?:string;images?:string[];amazonImageBlocked?:boolean}){return isAmazonDestination(p.url||'')||isAmazonCdnImage(p.image||'')||!!p.images?.some(isAmazonCdnImage)||p.amazonImageBlocked===true;}
export const amazonImageNotice="Amazon Associates Notice: Verify image usage rights or replace with your own/studio photo before publishing";
export const disclosurePresets=[
 {label:'Multi-Network Default',text:'Disclosure: This storefront contains affiliate links across multiple partner programs. If you click a link and make a purchase, I may earn a commission at no extra cost to you.'},
 {label:'Amazon + Multi-Network',text:'As an Amazon Associate and affiliate partner, I earn from qualifying purchases. Links on this page may earn a commission at no extra cost to you.'},
 {label:'Amazon Only',text:'As an Amazon Associate I earn from qualifying purchases.'},
] as const;
