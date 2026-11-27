import 'server-only';
import {db} from './db';
import type {Query} from './order-service';
import {ApiError,object,text,uuid,resolveOrderLines,orderLineItem} from './order-validation';
import {validateShop} from '../app/shop/shop-data';
import {safeImage} from '../app/shop/shop-data';
import {customerTags,type BackOfficePlan,type Sale} from '../app/dashboard/back-office-data';
import {aggregateCustomers,analyticsReport,analyticsCsv,canExportReports,moneyText,moneyUnits,isPaid} from './back-office-report';

const run:Query=async(sql,args)=>(await db()).query(sql,args);
const shopScope=`SELECT id,name,slug,logo,store_mode,coalesce(personal_catalog,catalog) AS catalog,seller_email
 FROM shops WHERE owner_key=$1 AND deleted_at IS NULL AND coalesce(personal_catalog,catalog)->>'shopMode'='personal'
 AND ($2::uuid IS NULL OR id=$2::uuid)`;
const saleFields=`o.id,o.shop_id,s.name AS store_name,o.invoice_number,o.source,o.status,o.payment_method,o.coin,
 o.gross_amount::text,o.shipping_amount::text,o.discount_amount::text,o.created_at,
 jsonb_build_object('items',o.details->'items','buyer',o.details->'buyer','delivery_note',o.details->'delivery_note',
 'channel',o.details->'channel','manual_paid',o.details->'manual_paid','manual_method',o.details->'manual_method','visitor_id',o.details->'visitor_id',
 'inventory_returned_at',o.details->'inventory_returned_at') AS details`;

export async function backOfficePlan(owner:string,query:Query=run):Promise<BackOfficePlan>{
 const [row]=await query(`SELECT CASE WHEN seller_effective_plan($1)<>'pro' OR r.plan='lifetime' THEN 'free'
  WHEN r.plan='b2b' THEN 'b2b' ELSE 'pro' END AS plan
 FROM (SELECT $1::text AS owner) requested
 LEFT JOIN subscriptions a ON a.owner_key=requested.owner
 LEFT JOIN shop_account_links l ON l.account_owner=a.owner_key
 LEFT JOIN pro_upgrade_requests r ON r.status='approved' AND r.issued_license_key IS NOT NULL
  AND encode(sha256(convert_to('sellpostly-license:'||r.issued_license_key,'UTF8')),'hex')=coalesce(a.plan_source,l.pro_owner,a.owner_key)`,[owner]);
 return row?.plan||'free';
}

export function reportRange(params:URLSearchParams,now=new Date()){
 const day=86400000, midnight=Date.parse(now.toISOString().slice(0,10)+'T00:00:00.000Z');
 const parse=(value:string|null)=>{
  if(!value||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new ApiError('INVALID_RANGE');
  const date=new Date(value+'T00:00:00.000Z');
  if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==value)throw new ApiError('INVALID_RANGE');
  return +date;
 };
 const period=params.get('period')||'30';
 const days=Number(period);
 const start=period==='custom'?parse(params.get('from')):midnight-(days-1)*day;
 const end=period==='custom'?parse(params.get('to'))+day:midnight+day;
 if((period!=='custom'&&![7,30,90].includes(days))||!Number.isFinite(start)||start>=end||end-start>366*day)throw new ApiError('INVALID_RANGE');
 return [new Date(start).toISOString(),new Date(end).toISOString()];
}

async function salesFor(owner:string,shopId:string|null,range:string[]|null,query:Query){
 return await query(`WITH owned AS (${shopScope})
  SELECT ${saleFields} FROM orders o JOIN owned s ON s.id=o.shop_id
  WHERE ($3::timestamptz IS NULL OR (o.created_at >= $3 AND o.created_at < $4::timestamptz))
  ORDER BY o.created_at DESC,o.id`,[owner,shopId,range?.[0]||null,range?.[1]||null]) as Sale[];
}

async function profilesFor(owner:string,shopId:string|null,query:Query){
 return query(`WITH owned AS (${shopScope}) SELECT p.* FROM shop_customer_profiles p JOIN owned ON owned.id=p.shop_id`,[owner,shopId]);
}

export async function readBackOffice(owner:string,params:URLSearchParams,query:Query=run){
 const plan=await backOfficePlan(owner,query);
 const view=params.get('view')||'customers',format=params.get('export'),all=params.get('shopId')==='all';
 if(!['customers','analytics'].includes(view)||(format&&!['orders','revenue','customers'].includes(format)))throw new ApiError('INVALID_INPUT');
 if((all&&plan!=='b2b')||(format&&!canExportReports(plan,all)))throw new ApiError('REPORT_EXPORT_PRO_REQUIRED',403);
 const selected=params.get('shopId');
 const shops=await query(shopScope+" ORDER BY (store_mode='general') DESC,name,id",[owner,null]);
 const shopId=all?null:selected?uuid(selected):shops[0]?.id;
 const active=shops.find(row=>row.id===shopId);
 if(selected&&!all&&!active)throw new ApiError('SHOP_NOT_FOUND',404);
 const options=shops.map(row=>({id:row.id,name:row.name}));
 if(view==='customers'&&!format){
  const [sales,profiles]=shopId||all?await Promise.all([salesFor(owner,shopId,null,query),profilesFor(owner,shopId,query)]):[[],[]];
  const term=(params.get('search')||'').trim().slice(0,120).toLowerCase();
  const customers=aggregateCustomers(sales,profiles as Parameters<typeof aggregateCustomers>[1]).filter(row=>[row.name,row.email,row.phone,row.city].join(' ').toLowerCase().includes(term));
  const requestedOffset=Number(params.get('offset'));
  const offset=Number.isSafeInteger(requestedOffset)&&requestedOffset>0?requestedOffset:0;
  return {plan,shops:options,shopId,customers:customers.slice(offset,offset+50),hasMore:customers.length>offset+50,
   receipts:sales.filter(sale=>sale.source==='manual').slice(0,20).map(({id,invoice_number})=>({id,invoice_number}))};
 }
 if(!active&&!all&&format)throw new ApiError('SHOP_NOT_FOUND',404);
 const range=view==='analytics'?reportRange(params):null;
 const sales=active||all?await salesFor(owner,shopId,range,query):[];
 let visitors=0,converted=0;
 if(range&&(active||all)){
  const [row]=await query(`WITH owned AS (${shopScope}), visits AS (
   SELECT DISTINCT v.shop_id,v.visitor_id FROM storefront_visits v JOIN owned s ON s.id=v.shop_id
   WHERE v.visit_day >= ($3::timestamptz AT TIME ZONE 'UTC')::date AND v.visit_day < ($4::timestamptz AT TIME ZONE 'UTC')::date
  ) SELECT count(*)::int AS visitors,count(*) FILTER (WHERE EXISTS (
   SELECT 1 FROM orders o WHERE o.shop_id=v.shop_id AND o.source='storefront' AND o.status NOT IN ('cancelled','refunded')
    AND NOT o.details ? 'inventory_returned_at' AND o.created_at >= $3 AND o.created_at < $4 AND o.details->>'visitor_id'=v.visitor_id::text))::int AS converted FROM visits v`,
  [owner,shopId,...range]);
  visitors=row.visitors;converted=row.converted;
 }
 const report=analyticsReport(sales,visitors,converted);
 if(format){
  const profiles=format==='customers'?await profilesFor(owner,shopId,query):[];
  const customerSales=format==='customers'&&range?await salesFor(owner,shopId,null,query):sales;
  const customers=format==='customers'?aggregateCustomers(customerSales,profiles as Parameters<typeof aggregateCustomers>[1],
   range?new Set(sales.map(sale=>sale.id)):undefined):[];
  return {csv:analyticsCsv(format as 'orders'|'revenue'|'customers',sales,customers,report),filename:format+'.csv'};
 }
 return {plan,shops:options,shopId,report};
}

export async function saveCustomerProfile(owner:string,value:unknown,query:Query=run){
 const raw=object(value),shopId=uuid(raw.shopId),key=uuid(raw.key);
 if(!Array.isArray(raw.tags)||raw.tags.some(tag=>!customerTags.includes(tag)))throw new ApiError('INVALID_INPUT');
 const note=text(raw.note||'',2000,false);
 const sales=await salesFor(owner,shopId,null,query);
 if(!aggregateCustomers(sales).some(customer=>customer.key===key))throw new ApiError('CUSTOMER_NOT_FOUND',404);
 await query(`WITH owned AS (${shopScope})
  INSERT INTO shop_customer_profiles(shop_id,customer_key,tags,delivery_note)
  SELECT id,$3::uuid,$4::text[],$5 FROM owned
  ON CONFLICT(shop_id,customer_key) DO UPDATE SET tags=excluded.tags,delivery_note=excluded.delivery_note,updated_at=now()`,
  [owner,shopId,key,[...new Set(raw.tags)],note]);
 return {ok:true};
}

function amount(value:unknown,optional=false){
 if(optional&&(value===undefined||value===''))return BigInt(0);
 const raw=text(value,21);
 if(!/^\d{1,14}(?:\.\d{1,6})?$/.test(raw))throw new ApiError('INVALID_AMOUNT');
 return moneyUnits(raw);
}

export async function createManualReceipt(owner:string,value:unknown,query:Query=run){
 const raw=object(value),shopId=uuid(raw.shopId),requestId=uuid(raw.requestId),buyer=object(raw.buyer);
 const name=text(buyer.name,100),phone=text(buyer.phone||'',32,false),email=text(buyer.email||'',254,false).toLowerCase();
 if((!phone&&!email)||(phone&&!/^\+?(?:[\d ()+.-]*\d){8,15}$/.test(phone))||(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))throw new ApiError('INVALID_CONTACT');
 const method=text(raw.method,20),currency=text(raw.currency,4),channel=text(raw.channel||'other',20);
 if(!['whatsapp','instagram','inPerson','other'].includes(channel))throw new ApiError('INVALID_INPUT');
 if(!['COD','CASH','BANK','ONLINE'].includes(method)||!['USD','EUR','GBP','MAD','AED','SAR','USDC','USDT'].includes(currency)||typeof raw.paid!=='boolean')throw new ApiError('INVALID_INPUT');
 if(!raw.paid&&method!=='COD')throw new ApiError('INVALID_INPUT');
 const shipping=amount(raw.shipping,true),discount=amount(raw.discount,true);
 const city=text(buyer.city||'',100,false),address=text(buyer.address||'',400,false);
 const [previous]=await query(`SELECT o.id,o.invoice_number FROM orders o JOIN shops s ON s.id=o.shop_id
  WHERE s.owner_key=$1 AND s.deleted_at IS NULL AND o.shop_id=$2::uuid AND o.source='manual' AND o.details->>'request_id'=$3`,[owner,shopId,requestId]);
 if(previous)return previous;
 const [row]=await query(shopScope,[owner,shopId]);
 if(!row)throw new ApiError('SHOP_NOT_FOUND',404);
 if(!Array.isArray(raw.items))throw new ApiError('INVALID_ITEMS');
 const input=raw.items.map(object);
 const shop=validateShop(row.catalog),lines=resolveOrderLines(shop.products,input,false);
 if(lines.length!==input.length)throw new ApiError('INVALID_ITEMS');
 let subtotal=BigInt(0);
 const items=lines.map(({product,variant,quantity},index)=>{
  const price=amount(input[index].unitPrice),total=price*BigInt(quantity);
  subtotal+=total;
  return {...orderLineItem(product,quantity,variant),size:variant?.size||'',color:variant?.color||'',unit_price:moneyText(price),line_total:moneyText(total)};
 });
 const gross=subtotal+shipping-discount;
 if(gross<=BigInt(0)||gross>=BigInt('100000000000000000000')||discount>subtotal+shipping)throw new ApiError('INVALID_AMOUNT');
 const details={request_id:requestId,buyer:{name,phone,contact:email,city},delivery_note:address,items,manual_paid:raw.paid,manual_method:method,channel,
  invoice_seller:{name:shop.name||row.name,logo:shop.logo||row.logo,email:shop.sellerEmail||row.seller_email,phone:shop.phone,slug:row.slug}};
 const [saved]=await query(`WITH owned AS (${shopScope} FOR NO KEY UPDATE)
  INSERT INTO orders(shop_id,gross_amount,coin,network,payment_method,escrow_status,status,details,source,shipping_amount,discount_amount)
  SELECT id,$3::numeric,$4,$10,$10,'NONE',$5,$6::jsonb,'manual',$7::numeric,$8::numeric
  FROM owned WHERE catalog=$9::jsonb ON CONFLICT DO NOTHING RETURNING id,invoice_number`,
 [owner,shopId,moneyText(gross),currency,raw.paid?'fulfilled':'pending',JSON.stringify(details),moneyText(shipping),moneyText(discount),JSON.stringify(row.catalog),method==='COD'?'COD':'BANK']);
 if(saved)return saved;
 const [retry]=await query(`SELECT o.id,o.invoice_number FROM orders o JOIN shops s ON s.id=o.shop_id
  WHERE s.owner_key=$1 AND o.shop_id=$2::uuid AND o.source='manual' AND o.details->>'request_id'=$3`,[owner,shopId,requestId]);
 if(retry)return retry;
 throw new ApiError('CATALOG_CHANGED',409);
}

export async function readInvoice(owner:string,id:string,query:Query=run){
 uuid(id);
 const [row]=await query(`WITH owned AS (${shopScope})
  SELECT ${saleFields},s.logo,s.seller_email,s.slug,s.catalog,o.details->'invoice_seller' AS invoice_seller
  FROM orders o JOIN owned s ON s.id=o.shop_id WHERE o.id=$3::uuid`,[owner,null,id]);
 if(!row)throw new ApiError('ORDER_NOT_FOUND_OR_NOT_ELIGIBLE',404);
 const sale=row as Sale,shop=validateShop(row.catalog),snapshot=row.invoice_seller;
 return {sale,paid:isPaid(sale),hideBrand:(await backOfficePlan(owner,query))==='b2b',
  seller:{name:snapshot?.name||shop.name||row.store_name,logo:safeImage(snapshot?.logo||shop.logo||row.logo||''),
   email:snapshot?.email||shop.sellerEmail||row.seller_email||'',phone:snapshot?.phone||shop.phone||'',slug:snapshot?.slug||row.slug}};
}

export async function receiptCatalog(owner:string,id:string,query:Query=run){
 const [row]=await query(shopScope,[owner,uuid(id)]);
 if(!row)throw new ApiError('SHOP_NOT_FOUND',404);
 return validateShop(row.catalog).products.map(({id,name,price,variants,stock})=>({id,name,price,variants,stock}));
}

export async function recordStorefrontVisit(value:unknown,query:Query=run){
 const raw=object(value),slug=text(raw.slug,64),visitor=uuid(raw.visitorId);
 await query(`INSERT INTO storefront_visits(shop_id,visitor_id)
  SELECT id,$2::uuid FROM shops WHERE slug=$1 AND published=true AND suspended=false AND deleted_at IS NULL
   AND (store_mode='general' OR seller_effective_plan(owner_key)='pro')
   AND coalesce(personal_catalog,catalog)->>'shopMode'='personal' ON CONFLICT DO NOTHING`,[slug,visitor]);
}
