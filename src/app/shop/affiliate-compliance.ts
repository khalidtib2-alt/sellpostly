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
 if(!amazonImageBlocked&&!isAmazonDestination(destination)&&!isAmazonCdnImage(value))return value;
 const expected=footwearSubtype(unbrandedQuery(title,category,gender)),local=localPhoto(value);
 if(expected&&local&&local.footwearSubtype!==expected)return defaultStock(title,category,gender).url;
 if(expected==='sneakers'&&local&&unbrandedQuery(title,category,gender).startsWith('kids ')&&!local.audiences?.includes('kids'))return defaultStock(title,category,gender).url;
 const oldStudio=/^\/demo-products\/(headphones|backpack|organizer|bottle|studio-product)\.svg$/.test(value);
 if(!value||isAmazonCdnImage(value)||oldStudio||isStudioCover(value))return defaultStock(title,category,gender).url;
 return value;
}
export function amazonAffiliateProduct(p:{url?:string;image?:string;images?:string[];amazonImageBlocked?:boolean}){return isAmazonDestination(p.url||'')||isAmazonCdnImage(p.image||'')||!!p.images?.some(isAmazonCdnImage)||p.amazonImageBlocked===true;}
export const amazonImageNotice='Amazon listing images cannot be hotlinked directly—upload your own review photo, use a brand press-kit image, or keep a representative style photo.';
export const disclosurePresets=[
 {label:'Multi-Network Default',text:'Disclosure: This storefront contains affiliate links across multiple partner programs. If you click a link and make a purchase, I may earn a commission at no extra cost to you.'},
 {label:'Amazon + Multi-Network',text:'As an Amazon Associate and affiliate partner, I earn from qualifying purchases. Links on this page may earn a commission at no extra cost to you.'},
 {label:'Amazon Only',text:'As an Amazon Associate I earn from qualifying purchases.'},
] as const;
