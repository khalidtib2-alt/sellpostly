import 'server-only';
import {db} from './db';
import type {Query} from './order-service';
export async function sellerPlan(owner:string,query:Query=async(sql,args)=>db().query(sql,args)){
 const rows=await query('SELECT seller_effective_plan($1) AS plan',[owner]);return rows[0]?.plan==='pro'?'pro' as const:'free' as const;
}
