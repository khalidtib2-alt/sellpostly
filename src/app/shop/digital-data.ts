import type {Product} from './shop-data';
export const isDigitalProduct=(p:Pick<Product,'isDigital'|'category'>)=>p.isDigital===true||(p.isDigital===undefined&&p.category==='Digital Product');
export function digitalOnly(lines:{product:Product;quantity:number}[]){return lines.length>0&&lines.every(line=>isDigitalProduct(line.product));}
export function deliverySnapshot(lines:{product:Product;quantity:number}[]){return {digital_only:digitalOnly(lines),digital_items:lines.filter(l=>isDigitalProduct(l.product)).map(({product})=>({id:product.id,name:product.name,note:product.digitalDeliveryNote||'',download_url:product.digitalDownloadUrl||''}))};}
export function publicDigitalProduct(product:Product):Product{const {digitalDeliveryNote:_note,digitalDownloadUrl:_url,inventoryEdit:_inventoryEdit,inventoryVersion:_inventoryVersion,...safe}=product;return safe;}
