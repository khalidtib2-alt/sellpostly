import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
export type ProIdentity = { ownerKey: string; provider: 'master' | 'gumroad' | 'development' };
export function constantEqual(a: string, b: string) {
  const digest=(value:string)=>createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(a),digest(b));
}
export async function verifyProKey(key: string): Promise<ProIdentity | null> {
  if(!key || key.length>256)return null;
  const configured=process.env.PRO_MASTER_KEYS?.trim();
  const masters=configured?configured.split(/[,\n]/).map(value=>value.trim()).filter(Boolean):[];
  const ownerKey=createHash('sha256').update('sellpostly-license:'+key).digest('hex');
  if(masters.some(master=>constantEqual(key,master)))return {ownerKey,provider:'master'};
  if(!configured&&process.env.NODE_ENV!=='production'&&constantEqual(key,'SELLPOSTLY-PRO-DEV'))return {ownerKey,provider:'development'};
  if(!process.env.GUMROAD_PRODUCT_ID)return null;
  try {
    const response=await fetch('https://api.gumroad.com/v2/licenses/verify',{
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({product_id:process.env.GUMROAD_PRODUCT_ID,license_key:key,increment_uses_count:'false'}),
      signal:AbortSignal.timeout(8000),cache:'no-store'
    });
    if(!response.ok)return null;
    const data=await response.json();
    const purchase=data.purchase;
    if(!data.success||!purchase||purchase.product_id!==process.env.GUMROAD_PRODUCT_ID||purchase.refunded||purchase.disputed||purchase.chargebacked||purchase.subscription_cancelled_at||purchase.subscription_ended_at||purchase.subscription_failed_at)return null;
    return {ownerKey,provider:'gumroad'};
  }catch{return null;}
}
export async function proIdentity(request: Request){
 const identity=await verifyProKey(request.headers.get("x-pro-key")?.trim()||"");
 if(!identity||!process.env.DATABASE_URL)return identity;
 try {const {ensureActiveSubscription}=await import("./subscription-access");return await ensureActiveSubscription(identity)?identity:null;}catch{return null;}
}
