import {validateShop,shopKey,type Shop,type ShopMode} from './shop-data';
type Store=Pick<Storage,'getItem'|'setItem'>;
export const modeCatalogKey=(mode:ShopMode)=>shopKey+':catalog:'+mode;
export function switchCatalog(shop:Shop,mode:ShopMode,storage:Store):Shop{
 if(mode===shop.shopMode)return shop;
 // Commit the outgoing inventory before switching; storage errors leave it visible.
 storage.setItem(modeCatalogKey(shop.shopMode),JSON.stringify(validateShop(shop)));
 const saved=storage.getItem(modeCatalogKey(mode));
 const archived=saved?validateShop(JSON.parse(saved)):null;
 const products=archived?.products||[];
 return validateShop({...shop,...archived,heroTitle:archived?.heroTitle||'',heroSubtitle:archived?.heroSubtitle||'',heroImage:archived?.heroImage||'',shopAccent:archived?.shopAccent||(mode==='affiliate'?'amber':'emerald'),shopMode:mode,products});
}
