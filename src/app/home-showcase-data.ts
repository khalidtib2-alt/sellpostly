import {productUrlFallback} from '../lib/product-url-fallback';
export const showcaseProducts=[
 {title:'City Weekender Backpack',image:'/stock-photos/pexels-15246346.jpg',position:'50% 58%',price:'$49',original:'$85',discount:42,rating:'4.9',reviews:312},
 {title:'Everyday Canvas High-Tops',image:'/stock-photos/pexels-13560373.jpg',position:'50% 58%',price:'$39',original:'$87',discount:55,rating:'4.8',reviews:184},
 {title:'Studio Wireless Headphones',image:'/stock-photos/pexels-9371408.jpg',position:'50% 63%',price:'$79',original:'$122',discount:35,rating:'4.9',reviews:429},
 {title:'Daily Skincare Ritual',image:'/stock-photos/pexels-7691110.jpg',position:'50% 52%',price:'$26',original:'$50',discount:48,rating:'4.7',reviews:96},
 {title:'Everyday Smartwatch',image:'/stock-photos/pexels-26775343.jpg',position:'50% 50%',price:'$59',original:'$99',discount:40,rating:'4.8',reviews:207},
 {title:'Morning Coffee Essentials',image:'/stock-photos/pexels-4349831.jpg',position:'50% 50%',price:'$34',original:'$59',discount:42,rating:'4.9',reviews:153},
] as const;
export function showcaseWindow(start:number){return Array.from({length:3},(_,offset)=>{const index=((start+offset)%showcaseProducts.length+showcaseProducts.length)%showcaseProducts.length;return {item:showcaseProducts[index],index};});}
export function showcaseTitleFromUrl(value:string){
 try{const url=new URL(value);if(!['http:','https:'].includes(url.protocol))return '';return productUrlFallback(url.href)?.name||'';}catch{return '';}
}
export function showcaseImage(value:unknown){
 if(typeof value!=='string')return '';
 try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.href:'';}catch{return '';}
}
