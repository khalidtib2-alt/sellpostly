import 'server-only';
import {storePolicyReady} from '../app/shop/store-policy-data';
import {deliverySnapshot} from '../app/shop/digital-data';
import {validTronTx} from '../app/shop/tron-data';
import {validTronChecksum} from './tron-validation';
import {db} from './db';
import {ApiError,object,text,uuid,resolveOrderLines,orderLineItem} from './order-validation';
import {submitOrder,type Query} from './order-service';
import {emailAddress} from './email';
import {buyerPhone} from './whatsapp-replies';
import {locale} from './locale';
import {validateShop} from '../app/shop/shop-data';
import {paymentMethods,normalizePayments,governance,chooseEscrow,methodReady,containsCardData,type PaymentMethod} from '../app/shop/payment-config';
import {directPrice,directTotal,decimalMoney} from '../app/shop/direct-prices';
export async function submitPeerOrder(value:unknown,query:Query=async(sql,args)=>(await db()).query(sql,args)){
 const raw=object(value);if(containsCardData(raw))throw new ApiError('CARD_DATA_NOT_ALLOWED');
 const slug=text(raw.slug,64),requestId=uuid(raw.request_id),method=raw.method as PaymentMethod;if(!paymentMethods.includes(method))throw new ApiError('INVALID_INPUT');
 if(raw.escrow!==undefined&&typeof raw.escrow!=='boolean')throw new ApiError('INVALID_INPUT');
 const row=(await query(`SELECT id,coalesce(personal_catalog,catalog) AS catalog,suspended FROM shops WHERE slug=$1 AND deleted_at IS NULL AND published=true AND (store_mode='general' OR seller_effective_plan(owner_key)='pro')`,[slug]))[0];if(!row)throw new ApiError('SHOP_NOT_FOUND',404);if(row.suspended)throw new ApiError('STORE_SUSPENDED',403);
 const shop=validateShop(row.catalog);if(!storePolicyReady(shop))throw new ApiError('STORE_POLICY_REQUIRED',409);if(shop.shopMode!=='personal')throw new ApiError('CHECKOUT_UNAVAILABLE');
 const p=normalizePayments(shop.payments,shop),useEscrow=chooseEscrow(governance(shop.escrowGovernance),method,raw.escrow===true);
 if(!methodReady(p,method,useEscrow))throw new ApiError('PAYMENT_METHOD_UNAVAILABLE',409);
 if(useEscrow){const order=await submitOrder({...raw,coin:'USDC',network:'Polygon',tx_id:text(raw.reference,100)},query);return {...order,governance_status:order.status==='pending'?'pending_funding':order.status};}
 const buyer=object(raw.buyer),email=emailAddress(text(buyer.contact,254));if(!email)throw new ApiError('INVALID_CONTACT');const name=text(buyer.name,100),phone=buyer.phone?buyerPhone(text(buyer.phone,30)):'';
 const lines=resolveOrderLines(shop.products,raw.items,false);
 const total=directTotal(lines);if(!total)throw new ApiError('PRICE_UNAVAILABLE');if(method==='USDC_DIRECT'&&!['USD','USDC'].includes(total.currency))throw new ApiError('PRICE_UNAVAILABLE');
 const reference=text(raw.reference||'',100,false),note=text(raw.delivery_note||'',400,false);
 if(method==='TRON_USDT'&&(!validTronChecksum(p.TRON_USDT.wallet)||!validTronTx(reference)))throw new ApiError('INVALID_TRON_PAYMENT');
 if(method==='TRON_USDT'&&!['USD','USDT'].includes(total.currency))throw new ApiError('PRICE_UNAVAILABLE');
 const delivery=deliverySnapshot(lines);
 const details={...delivery,...(raw.visitorId?{visitor_id:uuid(raw.visitorId)}:{}),request_id:requestId,store_name:shop.name,language:locale(raw.language),buyer:{name,contact:email,phone,...(buyer.city?{city:text(buyer.city,100,false)}:{})},delivery_note:delivery.digital_only?'':note,payment_reference:method==='TRON_USDT'?reference.toLowerCase():reference,payment_verification:'seller_must_verify',items:lines.map(({product,quantity,variant})=>({...orderLineItem(product,quantity,variant),unit_price:decimalMoney(directPrice(product.price)!.amount),line_total:decimalMoney(directPrice(product.price)!.amount*BigInt(quantity))})),...(method==='TRON_USDT'?{receiving_wallet:p.TRON_USDT.wallet,receiving_network:'TRON'}:{}),...(method==='USDC_DIRECT'?{receiving_wallet:p.USDC_DIRECT.wallet,receiving_network:p.USDC_DIRECT.network}:{})};
 const args=[row.id,total.amount,method==='TRON_USDT'?'USDT':method==='USDC_DIRECT'?'USDC':total.currency,method==='TRON_USDT'?'TRON':method==='USDC_DIRECT'?p.USDC_DIRECT.network:method,method,JSON.stringify(details),JSON.stringify(row.catalog)];
 const rows=await query(`INSERT INTO orders(shop_id,gross_amount,coin,network,payment_method,escrow_status,details)
 SELECT id,$2::numeric,$3,$4,$5,'NONE',$6::jsonb FROM shops WHERE id=$1::uuid AND published=true AND suspended=false AND (store_mode='general' OR seller_effective_plan(owner_key)='pro') AND coalesce(personal_catalog,catalog)=$7::jsonb FOR NO KEY UPDATE
 ON CONFLICT DO NOTHING RETURNING id,status,payment_method,escrow_status,gross_amount::text,coin,network`,args);
 if(rows.length)return rows[0];const previous=await query("SELECT id,status,payment_method,escrow_status,gross_amount::text,coin,network FROM orders WHERE shop_id=$1::uuid AND payment_method=$2 AND details->>'request_id'=$3 AND details=$4::jsonb",[row.id,method,requestId,JSON.stringify(details)]);if(previous.length)return previous[0];if(method==='TRON_USDT')throw new ApiError('TRANSACTION_ALREADY_SUBMITTED',409);throw new ApiError('CATALOG_CHANGED',409);
}
