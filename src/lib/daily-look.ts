import type {Product} from '../app/shop/shop-data';
export const outfitZones=['upper','lower','accessory','footwear'] as const;
export type OutfitZone=typeof outfitZones[number];
export const zoneLabels={upper:'Upper Body / Outerwear',lower:'Lower Body / Bottoms',accessory:'Accessories / Bag',footwear:'Footwear'} as const;
export const zonePositions={upper:{x:50,y:30,width:52,height:24},lower:{x:49,y:64,width:36,height:28},accessory:{x:70,y:48,width:26,height:20},footwear:{x:50,y:92,width:46,height:13}} as const;
export function utcLookDay(date=new Date()){return date.toISOString().slice(0,10);}
export function validLookDay(value:string|null){return !!value&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&utcLookDay(new Date(value))===value;}
export function lookShuffle(value:string|null){return value&&/^\d{1,6}$/.test(value)?Math.min(999999,Number(value)):0;}
export function garmentZone(product:Product):OutfitZone|undefined{
 const text=(product.name+' '+product.category).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').normalize('NFC');
 if(/sneaker|trainer|footwear|shoe|boot|sandal|chaussure|basket|botte|zapato|zapatilla|bota|حذاء|أحذية|صندل/.test(text))return 'footwear';
 if(/crossbody|bag\b|backpack|handbag|purse|watch|belt|scarf|sunglass|accessor|sac\b|montre|bolso|mochila|reloj|حقيبة|ساعة|حزام|إكسسوار/.test(text))return 'accessory';
 if(/trouser|jeans|pants|bottom|skirt|shorts|pantalon|jupe|falda|بنطال|سروال|تنورة/.test(text))return 'lower';
 if(/coat|jacket|windbreaker|parka|cardigan|outerwear|knit|sweater|shirt|blouse|hoodie|top\b|dress|manteau|veste|blouson|pull\b|robe|abrigo|chaqueta|camisa|vestido|معطف|سترة|جاكيت|قميص|كنزة|فستان/.test(text))return 'upper';
}
/** Non-wearable suggestions remain cards; never paint an appliance onto a garment. */
export function wearableOutfit<T extends {zone:OutfitZone;product:Product}>(outfit:T[]){return outfit.filter(item=>garmentZone(item.product)===item.zone);}
export function wearCatalogProduct(outfit:{zone:OutfitZone;product:Product}[],product:Product){const zone=garmentZone(product);if(!zone||product.isDigital||product.stock===0)return outfit;return outfitZones.flatMap(slot=>{const piece=slot===zone?{zone,product}:outfit.find(piece=>piece.zone===slot);return piece?[piece]:[];});}
function hash(value:string){let h=2166136261;for(const char of value)h=Math.imul(h^char.charCodeAt(0),16777619);return h>>>0;}
/** Stable across catalog ordering, locale and time zone; only the published catalog is passed in. */
export function dailyOutfit(products:Product[],gender:'women'|'men',day:string,shuffle=0,identity='',mode?:'affiliate'|'personal'){
 const seen=new Set<string>();
 const pool=products.filter(p=>!p.isDigital&&p.category!=='Digital Product'&&p.stock!==0&&(!mode||!p.catalogMode||p.catalogMode===mode)&&(p.gender===gender||p.gender==='unisex')&&!seen.has(p.id)&&!!seen.add(p.id));
 const rank=(p:Product)=>hash([identity,day,gender,p.id].join('|'));
 const sorted=[...pool].sort((a,b)=>rank(a)-rank(b)||a.id.localeCompare(b.id,'en'));
 const chosen=new Map<OutfitZone,Product>(),used=new Set<string>();
 for(const zone of outfitZones){const candidates=sorted.filter(p=>!used.has(p.id)&&garmentZone(p)===zone),p=candidates[shuffle%candidates.length];if(p){chosen.set(zone,p);used.add(p.id);}}
 for(const zone of outfitZones){if(chosen.has(zone))continue;const candidates=sorted.filter(p=>!used.has(p.id)),p=candidates[shuffle%candidates.length];if(p){chosen.set(zone,p);used.add(p.id);}}
 return outfitZones.flatMap(zone=>{const product=chosen.get(zone);return product?[{zone,product}]:[];});
}
