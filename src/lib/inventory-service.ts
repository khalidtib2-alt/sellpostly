import 'server-only';
import {db} from './db';
import {ApiError,text,uuid} from './order-validation';
import type {Query} from './order-service';
import {stockReasons,variantLabel} from '../app/shop/inventory-data';
import {inventoryPageSize,type StockMovement} from '../app/shop/inventory-history-data';
import {validateShop} from '../app/shop/shop-data';

const run:Query=async(sql,args)=>(await db()).query(sql,args);
const personalShopSql=`SELECT id,coalesce(personal_catalog,catalog) AS catalog
 FROM shops WHERE owner_key=$1 AND deleted_at IS NULL AND coalesce(personal_catalog,catalog)->>'shopMode'='personal'
 AND (($2::uuid IS NULL AND store_mode='general') OR id=$2::uuid)`;

export async function readInventory(owner:string,params:URLSearchParams,query:Query=run){
 const shopId=params.get('shopId')?uuid(params.get('shopId')):null;
 const exporting=params.get('format')==='csv';
 const [entitlement]=await query(`SELECT seller_effective_plan($1)='pro' AND NOT EXISTS (
  SELECT 1 FROM subscriptions a
  LEFT JOIN shop_account_links l ON l.account_owner=a.owner_key
  JOIN pro_upgrade_requests r ON r.status='approved' AND r.plan='lifetime' AND r.issued_license_key IS NOT NULL
   AND encode(sha256(convert_to('sellpostly-license:'||r.issued_license_key,'UTF8')),'hex')=coalesce(a.plan_source,l.pro_owner,a.owner_key)
  WHERE a.owner_key=$1
 ) AS can_export`,[owner]);
 const canExport=entitlement?.can_export===true;
 if(exporting&&!canExport)throw new ApiError('INVENTORY_EXPORT_PRO_REQUIRED',403);
 const paramsReason=params.get('reason')||'';
 const reason=stockReasons.find(value=>value===paramsReason)||null;
 const search=params.get('search')?.trim().slice(0,120)||null;
 const rawOffset=Number(params.get('offset')||0);
 const offset=Number.isSafeInteger(rawOffset)&&rawOffset>0?Math.min(rawOffset,1000000):0;
 if(exporting){
  const [record]=await query(`WITH owned AS (${personalShopSql})
   SELECT catalog,coalesce((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.created_at DESC,m.id DESC)
   FROM stock_movements m WHERE m.shop_id=owned.id),'[]'::jsonb) AS movements FROM owned`,[owner,shopId]);
  if(!record)throw new ApiError('SHOP_NOT_FOUND',404);
  return {csv:formatInventoryCsv(record.catalog,record.movements)};
 }
 const [record]=await query(personalShopSql,[owner,shopId]);
 if(!record){if(shopId)throw new ApiError('SHOP_NOT_FOUND',404);return {canExport,shopId:null,movements:[],hasMore:false};}
 const movements=await query(`SELECT m.* FROM stock_movements m JOIN shops s ON s.id=m.shop_id
  WHERE m.shop_id=$1::uuid AND s.owner_key=$2 AND s.deleted_at IS NULL AND ($3::text IS NULL OR reason=$3)
  AND ($4::text IS NULL OR strpos(lower(concat_ws(' ',product_name,variant_label,sku)),lower($4))>0)
  ORDER BY m.created_at DESC,m.id DESC LIMIT $5 OFFSET $6`,[record.id,owner,reason,search,inventoryPageSize+1,offset]);
 return {canExport,shopId:record.id,movements:movements.slice(0,inventoryPageSize),hasMore:movements.length>inventoryPageSize};
}

function csvCell(value:string|number|null|undefined){
 let cell=String(value??'');
 if(typeof value==='string'&&(/^[\s\uFEFF]*[=+\-@]/.test(cell)||/^[\r\n\t]/.test(cell)))cell="'"+cell;
 return '"'+cell.replace(/"/g,'""')+'"';
}

export function formatInventoryCsv(catalog:unknown,movements:StockMovement[]){
 const rows:(string|number|null|undefined)[][]=[
  ['record_type','product_id','product_name','variant_id','size','color','variant_label','sku','stock_count','delta','reason','note','created_at','order_id'],
 ];
 for(const product of validateShop(catalog).products){
  if(product.variants?.length){
   for(const variant of product.variants){
    rows.push(['inventory',product.id,product.name,variant.id,variant.size,variant.color,variantLabel(variant),variant.sku,variant.stockCount]);
   }
  }else rows.push(['inventory',product.id,product.name,'','','','', '',product.stock]);
 }
 for(const movement of movements){
  rows.push(['movement',movement.product_id,movement.product_name,movement.variant_id,'','',movement.variant_label,movement.sku,
   '',movement.delta,movement.reason,movement.note,new Date(movement.created_at).toISOString(),movement.order_id]);
 }
 return '\uFEFF'+rows.map(row=>Array.from({length:14},(_,index)=>csvCell(row[index])).join(',')).join('\r\n')+'\r\n';
}

export async function restoreSellerOrder(owner:string,id:string,action:unknown,note:unknown,query:Query=run){
 uuid(id);
 if(action!=='cancel'&&action!=='return')throw new ApiError('INVALID_INPUT');
 const [record]=await query(`UPDATE orders o SET
  details=o.details||jsonb_build_object('inventory_return_note',$4::text,'inventory_returned_at',now()),
  status=CASE WHEN o.payment_method='CRYPTO' THEN o.status ELSE 'cancelled' END
  FROM shops s WHERE o.id=$1::uuid AND s.id=o.shop_id AND s.owner_key=$2 AND s.deleted_at IS NULL
   AND coalesce(s.personal_catalog,s.catalog)->>'shopMode'='personal'
   AND NOT o.details ? 'inventory_returned_at'
   AND (($3='cancel' AND o.payment_method<>'CRYPTO' AND o.status='pending')
     OR ($3='return' AND ((o.payment_method<>'CRYPTO' AND o.status='fulfilled') OR (o.payment_method='CRYPTO' AND o.status='released'))))
  RETURNING o.id,o.status`,[id,owner,action,note===undefined?'':text(note,500,false)]);
 if(!record)throw new ApiError('ORDER_NOT_FOUND_OR_NOT_ELIGIBLE',409);
 return record;
}
