import type {BackOfficePlan,Customer,CustomerTag,MoneyTotal,Sale} from '../app/dashboard/back-office-data';

const scale=BigInt(1000000);
export function moneyUnits(value:string){
 const [whole,fraction='']=value.split('.');
 return BigInt(whole||'0')*scale+BigInt(fraction.padEnd(6,'0'));
}
export function moneyText(value:bigint){
 const sign=value<BigInt(0)?'-':'',positive=value<BigInt(0)?-value:value;
 return sign+(positive/scale)+'.'+(positive%scale).toString().padStart(6,'0');
}
export function totals(rows:Iterable<[string,bigint]>):MoneyTotal[]{
 const result=new Map<string,bigint>();
 for(const [currency,value] of rows)result.set(currency,(result.get(currency)||BigInt(0))+value);
 return [...result].map(([currency,value])=>({currency,amount:moneyText(value)}));
}
export const isReturned=(sale:Sale)=>['cancelled','refunded'].includes(sale.status)||!!sale.details.inventory_returned_at;
export const isDelivered=(sale:Sale)=>sale.status==='fulfilled'||sale.status==='released';
export const isPaid=(sale:Sale)=>!isReturned(sale)&&(sale.source==='manual'?(sale.details.manual_paid===true||sale.payment_method==='COD'&&isDelivered(sale)):
 sale.payment_method==='CRYPTO'?['held','released','disputed'].includes(sale.status):isDelivered(sale));
export const isCollected=(sale:Sale)=>isPaid(sale);
export const paymentLabel=(sale:Sale)=>sale.details.manual_method||sale.payment_method;
export const canExportReports=(plan:BackOfficePlan,consolidated=false)=>consolidated?plan==='b2b':plan!=='free';

const email=(value:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)?value.toLowerCase():'';
function phone(value:string){
 const number=value.trim().replace(/[\s()+.-]/g,'').replace(/^00/,'');
 return /^\d{8,15}$/.test(number)?number:'';
}
type Profile={shop_id:string;customer_key:string;tags:CustomerTag[];delivery_note:string;updated_at:string};

export function aggregateCustomers(sales:Sale[],profiles:Profile[]=[],included?:Set<string>):Customer[]{
 const contacts=new Map<string,string>(), parents=new Map<string,string>();
 const find=(id:string):string=>{
  let root=id;
  while(parents.has(root))root=parents.get(root)!;
  let child=id;
  while(parents.has(child)&&parents.get(child)!==root){const next=parents.get(child)!;parents.set(child,root);child=next;}
  return root;
 };
 const buyers=sales.flatMap(sale=>{
  const buyer=sale.details.buyer;
  const address=email(buyer?.contact?.trim()||''),number=phone(buyer?.phone||buyer?.contact||'');
  if(!address&&!number)return [];
  for(const key of [address,number].filter(Boolean)){
   const identity=sale.shop_id+':'+key,previous=contacts.get(identity);
   if(previous){const a=find(sale.id),b=find(previous);if(a!==b)parents.set(a,b);}
   contacts.set(identity,sale.id);
  }
  return [{sale,address,number}];
 });
 const groups=new Map<string,typeof buyers>();
 for(const buyer of buyers){
  const key=find(buyer.sale.id),group=groups.get(key);
  if(group)group.push(buyer);else groups.set(key,[buyer]);
 }
 const profileKeys=new Map(profiles.map(profile=>[profile.shop_id+':'+profile.customer_key,profile]));
 return [...groups.values()].flatMap(group=>{
  group.sort((a,b)=>Date.parse(b.sale.created_at)-Date.parse(a.sale.created_at)||b.sale.id.localeCompare(a.sale.id));
  const {sale}=group[0],key=group[group.length-1].sale.id;
  const cohort=included?group.filter(row=>included.has(row.sale.id)):group;
  if(!cohort.length)return [];
  const profile=group.flatMap(row=>profileKeys.get(sale.shop_id+':'+row.sale.id)||[])
   .sort((a,b)=>Date.parse(b.updated_at)-Date.parse(a.updated_at))[0];
  const counts={cod:0,online:0,cash:0};
  cohort.forEach(({sale})=>{const method=paymentLabel(sale);counts[method==='COD'?'cod':method==='CASH'?'cash':'online']++;});
  const latest=(read:(row:(typeof group)[number])=>string|undefined)=>group.map(read).find(Boolean)||'';
  return {key,shopId:sale.shop_id,shopName:sale.store_name,name:latest(row=>row.sale.details.buyer?.name),
   phone:latest(row=>row.number),email:latest(row=>row.address),city:latest(row=>row.sale.details.buyer?.city),
   orders:cohort.length,spent:totals(cohort.filter(row=>isCollected(row.sale)).map(({sale})=>[sale.coin,moneyUnits(sale.gross_amount)])),
   lastOrder:cohort[0].sale.created_at,lastOrderId:cohort[0].sale.id,preferred:(Object.keys(counts) as Customer['preferred'][]).sort((a,b)=>counts[b]-counts[a])[0],
   tags:profile?.tags||[],note:profile?.delivery_note||''};
 }).sort((a,b)=>Date.parse(b.lastOrder)-Date.parse(a.lastOrder));
}

export function analyticsReport(sales:Sale[],visitCount:number,convertedCount:number){
 const active=sales.filter(sale=>!isReturned(sale)),collected=active.filter(isCollected);
 const revenue=totals(collected.map(sale=>[sale.coin,moneyUnits(sale.gross_amount)]));
 const countByCurrency=new Map<string,bigint>();
 const methods=new Map<string,Sale[]>(),products=new Map<string,{shop:string;name:string;variant:string;quantity:number}>();
 for(const sale of collected){
  countByCurrency.set(sale.coin,(countByCurrency.get(sale.coin)||BigInt(0))+BigInt(1));
  const method=paymentLabel(sale);
  const bucket=methods.get(method);
  if(bucket)bucket.push(sale);else methods.set(method,[sale]);
 }
 for(const sale of active){
  for(const item of sale.details.items||[]){
   const key=JSON.stringify([sale.shop_id,item.id,item.variantId||'']);
   const row=products.get(key)||{shop:sale.store_name,name:item.name,variant:item.variantLabel||'',quantity:0};
   row.quantity+=item.quantity;products.set(key,row);
  }
 }
 return {sales:sales.length,delivered:active.filter(isDelivered).length,pending:active.filter(sale=>!isDelivered(sale)).length,
  pendingCod:active.filter(sale=>sale.payment_method==='COD'&&!isDelivered(sale)).length,
  revenue,average:revenue.map(row=>({...row,amount:moneyText(moneyUnits(row.amount)/countByCurrency.get(row.currency)!)})),
  conversion:visitCount?convertedCount/visitCount:null,visitors:visitCount,
  products:[...products.values()].sort((a,b)=>b.quantity-a.quantity).slice(0,25),
  methods:[...methods].flatMap(([method,rows])=>totals(rows.map(sale=>[sale.coin,moneyUnits(sale.gross_amount)])).map(row=>({...row,method})))};
}

export function reportCsv(rows:(string|number|null|undefined)[][]){
 return '\uFEFF'+rows.map(row=>row.map(value=>{
  let cell=String(value??'');
  if(typeof value==='string'&&(/^[\s\uFEFF]*[=+\-@]/.test(cell)||/^[\r\n\t]/.test(cell)))cell="'"+cell;
  return '"'+cell.replace(/"/g,'""')+'"';
 }).join(',')).join('\r\n')+'\r\n';
}

export function analyticsCsv(kind:'orders'|'revenue'|'customers',sales:Sale[],customers:Customer[],report:ReturnType<typeof analyticsReport>){
 if(kind==='orders')return reportCsv([
  ['shop','invoice_number','source','channel','date','status','payment_method','currency','gross','shipping','discount','product','variant','sku','quantity','unit_price','line_total'],
  ...sales.flatMap(sale=>(sale.details.items?.length?sale.details.items:[null]).map(item=>[
   sale.store_name,sale.invoice_number,sale.source,sale.details.channel,sale.created_at,sale.status,paymentLabel(sale),sale.coin,sale.gross_amount,sale.shipping_amount,sale.discount_amount,
   item?.name,item?.variantLabel,item?.sku,item?.quantity,item?.unit_price,item?.line_total])),
 ]);
 if(kind==='revenue')return reportCsv([
  ['metric','payment_method','currency','value'],
  ...report.revenue.map(row=>['gross_revenue','',row.currency,row.amount]),
  ...report.average.map(row=>['average_order_value','',row.currency,row.amount]),
  ...report.methods.map(row=>['payment_revenue',row.method,row.currency,row.amount]),
  ['delivered_orders','','',report.delivered],['pending_orders','','',report.pending],['pending_cod_orders','','',report.pendingCod],
  ['storefront_sessions','','',report.visitors],['conversion_rate','','',report.conversion],
 ]);
 return reportCsv([
  ['shop','name','phone','email','city','orders','spent','last_order','preferred_payment','tags','private_delivery_note'],
  ...customers.map(customer=>[customer.shopName,customer.name,customer.phone,customer.email,customer.city,customer.orders,
   customer.spent.map(row=>row.amount+' '+row.currency).join(' | '),customer.lastOrder,customer.preferred,customer.tags.join(' | '),customer.note]),
 ]);
}
