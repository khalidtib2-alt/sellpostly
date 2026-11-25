const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('src/lib/peer-order-service.ts',s=>s.replace("import 'server-only';", "import 'server-only';\nimport {deliverySnapshot} from '../app/shop/digital-data';\nimport {validTronTx} from '../app/shop/tron-data';\nimport {validTronChecksum} from './tron-validation';")
.replace("const reference=text(raw.reference||'',100,false),note=", "const reference=text(raw.reference||'',100,false),note=")
.replace(' const details={request_id:', ` if(method==='TRON_USDT'&&(!validTronChecksum(p.TRON_USDT.wallet)||!validTronTx(reference)))throw new ApiError('INVALID_TRON_PAYMENT');
 if(method==='TRON_USDT'&&!['USD','USDT'].includes(total.currency))throw new ApiError('PRICE_UNAVAILABLE');
 const delivery=deliverySnapshot(lines);
 const details={...delivery,request_id:`)
.replace('delivery_note:note,payment_reference:reference',"delivery_note:delivery.digital_only?'':note,payment_reference:method==='TRON_USDT'?reference.toLowerCase():reference")
.replace("...(method==='USDC_DIRECT'?{receiving_wallet:", "...(method==='TRON_USDT'?{receiving_wallet:p.TRON_USDT.wallet,receiving_network:'TRON'}:{}),...(method==='USDC_DIRECT'?{receiving_wallet:")
.replace("method==='USDC_DIRECT'?'USDC':total.currency", "method==='TRON_USDT'?'USDT':method==='USDC_DIRECT'?'USDC':total.currency")
.replace("method==='USDC_DIRECT'?p.USDC_DIRECT.network:method", "method==='TRON_USDT'?'TRON':method==='USDC_DIRECT'?p.USDC_DIRECT.network:method")
.replace("if(previous.length)return previous[0];throw", "if(previous.length)return previous[0];if(method==='TRON_USDT')throw new ApiError('TRANSACTION_ALREADY_SUBMITTED',409);throw"));
edit('src/lib/order-service.ts',s=>s.replace("import 'server-only';", "import 'server-only';\nimport {deliverySnapshot} from '../app/shop/digital-data';")
.replace('const details={store_name:',"const delivery=deliverySnapshot(priced.items.map(item=>({product:shop.products.find(p=>p.id===item.id)!,quantity:item.quantity})));\n const details={...delivery,store_name:")
.replace("delivery_note:typeof raw.delivery_note==='string'?text(raw.delivery_note,400,false):''", "delivery_note:!delivery.digital_only&&typeof raw.delivery_note==='string'?text(raw.delivery_note,400,false):''")
.replace("SELECT id,status,gross_amount::text,coin,network,escrow_release_at,details->'fulfillment' AS fulfillment,", "SELECT id,status,gross_amount::text,coin,network,escrow_release_at,details->'fulfillment' AS fulfillment,CASE WHEN (payment_method='CRYPTO' AND payment_verified_at IS NOT NULL AND status IN ('held','released','disputed')) OR (payment_method<>'CRYPTO' AND status='fulfilled') THEN details->'digital_items' ELSE NULL END AS digital_delivery,"));
edit('src/lib/cod-service.ts',s=>s.replace("import 'server-only';", "import 'server-only';\nimport {deliverySnapshot} from '../app/shop/digital-data';")
.replace('address=text(raw.delivery_address,400)',"address=text(raw.delivery_address||'',400,false)")
.replace(' const details={store_name:'," const delivery=deliverySnapshot(priced.items.map(item=>({product:shop.products.find(p=>p.id===item.id)!,quantity:item.quantity})));if(!delivery.digital_only&&!address)throw new ApiError('INVALID_INPUT');\n const details={...delivery,store_name:")
.replace('delivery_note:address','delivery_note:delivery.digital_only?\'\':address'));
edit('src/lib/notifications.ts',s=>s.replace("...(kind==='delivered'?{tracking:fulfillment.tracking,carrier:fulfillment.carrier,notes:fulfillment.delivery_notes}:{}),", "...(kind==='delivered'?{tracking:fulfillment.tracking,carrier:fulfillment.carrier,notes:[fulfillment.delivery_notes,...(details.digital_items||[]).map((item:{name:string;note:string;download_url:string})=>[item.name,item.note,item.download_url].filter(Boolean).join('\\n'))].filter(Boolean).join('\\n\\n')}:{}),...(kind==='held'?{notes:(details.digital_items||[]).map((item:{name:string;note:string;download_url:string})=>[item.name,item.note,item.download_url].filter(Boolean).join('\\n')).join('\\n\\n')}:{}),"));
