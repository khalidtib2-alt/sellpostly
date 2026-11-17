export type Product = { id: string; name: string; price: string; category: string; image: string; url: string; source: string };
export type Shop = { name: string; bio: string; phone: string; products: Product[] };
export const shopKey = "sellpostly-shop-v1";
export const categories = ["All", "Tech & Gadgets", "Fashion", "Home & Kitchen", "Beauty", "Fitness", "Top Deals"] as const;
export function safeUrl(value: string) {
  try { const url=new URL(value); return ["http:","https:"].includes(url.protocol) ? url.href : ""; } catch { return ""; }
}
export function safeImage(value: string) {
  return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : safeUrl(value);
}
export function validateShop(value: unknown): Shop {
  const raw=value as Partial<Shop>;
  if(!raw || !Array.isArray(raw.products) || raw.products.length>40) throw Error("Invalid shop");
  const text=(value:unknown,max=300)=>typeof value==="string"?value.slice(0,max):"";
  return {name:text(raw.name,100),bio:text(raw.bio,500),phone:text(raw.phone,30),products:raw.products.map(p=>({
    id:text(p.id,100),name:text(p.name,120),price:text(p.price,50),category:text(p.category,80),image:safeImage(text(p.image,300000)),url:safeUrl(text(p.url,2048)),source:text(p.source,50)
  })).filter(p=>p.id && p.name)};
}
export async function encodeShop(shop: Shop) {
  const bytes=new TextEncoder().encode(JSON.stringify(shop));
  const compressed=await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
  if(compressed.byteLength>45000)throw Error("Too large");
  return btoa(Array.from(new Uint8Array(compressed),n=>String.fromCharCode(n)).join("")).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
export async function decodeShop(value: string) {
  if(value.length>60000)throw Error("Too large");
  const bytes=Uint8Array.from(atob(value.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")).getReader();
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1500000){await reader.cancel();throw Error("Too large");}chunks.push(value);}
  return validateShop(JSON.parse(await new Blob(chunks as BlobPart[]).text()));
}
