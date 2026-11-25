import type {Product} from '../app/shop/shop-data';

/** New products carry timestamps; legacy catalogs retain their existing display order. */
export function newestProducts(products:Product[],limit=4){
 return products.map((product,index)=>({product,index,time:Date.parse(product.createdAt||'')||0}))
  .sort((a,b)=>b.time-a.time||a.index-b.index).slice(0,limit).map(row=>row.product);
}
export function featuredProduct(products:Product[]){return newestProducts(products.filter(p=>p.image),1)[0];}
