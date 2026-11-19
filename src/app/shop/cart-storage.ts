import {normalizeCart} from './product-links';
type StorageLike=Pick<Storage,'getItem'|'setItem'>;
export const cartChangedEvent='sellpostly:cart-changed';
export function readCart(storage:StorageLike,key:string,ids:string[],legacy?:string,fallback:Record<string,number>={}){
 try{
  const saved=storage.getItem(key),old=saved===null&&legacy?storage.getItem(legacy):null;
  const cart=normalizeCart(JSON.parse(saved??old??'{}'),ids);
  if(saved===null&&old!==null)writeCart(storage,key,cart);
  return cart;
 }catch{return normalizeCart(fallback,ids);}
}
export function writeCart(storage:StorageLike,key:string,cart:Record<string,number>){
 try{storage.setItem(key,JSON.stringify(cart));return true;}catch{return false;}
}
