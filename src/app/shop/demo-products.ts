import {defaultStock} from './stock-photos';
import type {Shop} from './shop-data';
export const demoProducts=[
 {name:'Wireless headphones',price:'49 USD',category:'Tech & Gadgets',image:defaultStock('wireless headphones').url,url:'https://www.amazon.com/',source:'Amazon'},
 {name:'Travel backpack',price:'39 USD',category:'Fashion',image:defaultStock('travel bag').url,url:'https://www.aliexpress.com/',source:'AliExpress'},
 {name:'Kitchen organizer',price:'24 USD',category:'Home & Kitchen',image:defaultStock('coffee kitchen').url,url:'https://www.shopify.com/',source:'Shopify'},
 {name:'Fitness bottle',price:'19 USD',category:'Fitness',image:defaultStock('fitness equipment').url,url:'https://www.amazon.com/',source:'Amazon'}
] as const;
export function createSampleShop():Shop{
 return {name:'My Shop',bio:'',phone:'',shopMode:'affiliate',shopTheme:'white',products:demoProducts.map((p,index)=>({...p,id:'sample-'+index,gender:'unisex' as const}))};
}
function legacyPhoto(index:number){
 if(typeof document==='undefined')return null;
 try{ const canvas=document.createElement("canvas");canvas.width=320;canvas.height=240;
    const context=canvas.getContext("2d")!;context.fillStyle=["#d1fae5","#e2e8f0","#fef3c7","#fce7f3"][index];context.fillRect(0,0,320,240);
    context.font="80px system-ui";context.textAlign="center";context.fillText(["🎧","🎒","🍽️","💧"][index],160,145);
return canvas.toDataURL();}catch{return null;}
}
// Only replace an untouched, exact legacy demo render; never seller photos.
export function upgradeDemoPhotos(shop:Shop):Shop{
 return {...shop,products:shop.products.map(product=>{
 const index=demoProducts.findIndex((p,i)=>product.id==='sample-'+i&&product.name===p.name);
 if(index<0)return product;
 if(!product.image||product.image===legacyPhoto(index))return {...product,image:demoProducts[index].image};
 return product;
 })};
}
