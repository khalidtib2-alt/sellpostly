import type {Shop} from '../app/shop/shop-data';
type PublicShop=Shop&{verified:boolean;suspended:boolean};
export async function findProductStore(slug:string,id:string,mode:string|undefined,load:(slug:string,mode:'personal'|'affiliate')=>Promise<PublicShop|null>){
 const modes:('personal'|'affiliate')[]=mode==='affiliate'?['affiliate']:mode==='personal'?['personal']:['personal','affiliate'];
 for(const type of modes){const shop=await load(slug,type);if(shop?.suspended)return shop;if(shop?.products.some(product=>product.id===id))return shop;}return null;
}
