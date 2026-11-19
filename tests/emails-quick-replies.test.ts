import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {PGlite} from '@electric-sql/pglite';
import {emailTemplate,sendEmail} from '../src/lib/email';
import {notifyEvent} from '../src/lib/notifications';
import {requestUpgrade,decideUpgrade,digest} from '../src/lib/pro-upgrade';
import {updateOrder,updatePayout} from '../src/lib/admin-service';
import {fulfill,buyerAction,type Query} from '../src/lib/order-service';
import {normalizeAppUrl,publicLink} from '../src/lib/public-url';
import {buyerPhone,quickReplyUrl} from '../src/lib/whatsapp-replies';
import {importFromHash,normalizePending} from '../src/lib/shop-handoff';
import {validateShop,encodeShop,decodeShop} from '../src/app/shop/shop-data';
import {GET as settingsGet,POST as settingsPost} from '../src/app/api/seller/notifications/route';

test('extension config builds use only the canonical public environment value',async()=>{
 const {spawnSync}=await import('node:child_process');const {writeFile}=await import('node:fs/promises');
 const paths=['chrome-extension/app-config.js','chrome-extension/manifest.json','chrome-extension/popup.html'];const originals=await Promise.all(paths.map(path=>readFile(path,'utf8')));
 try{
  for(const [input,expected]of [['','https://sellpostly.vercel.app'],['https://shop.example.com','https://shop.example.com'],['https://sellpostly-git-main-team.vercel.app','https://sellpostly.vercel.app'],['https://vercel.com/usidk-it','https://sellpostly.vercel.app']]){
   const result=spawnSync(process.execPath,['scripts/configure-extension.mjs'],{env:{...process.env,NEXT_PUBLIC_APP_URL:input,RESEND_API_KEY:'never-bundle-this-secret'},encoding:'utf8'});assert.equal(result.status,0,result.stderr);
   const config=await readFile(paths[0],'utf8'),context=vm.createContext({});vm.runInContext(config,context);assert.equal(context.SELLPOSTLY_APP_URL,expected);assert.ok(!config.includes('never-bundle-this-secret'));
   assert.equal(JSON.parse(await readFile(paths[1],'utf8')).homepage_url,expected);
   assert.ok(!(await readFile(paths[2],'utf8')).includes('-git-main-'));
  }
 }finally{await Promise.all(paths.map((path,index)=>writeFile(path,originals[index])));}
});


test('emails escape dynamic content, localize all templates and fail safely without sending',async()=>{
 for(const language of ['en','fr','ar'])for(const kind of ['pro','held','delivered','dispute','payout'] as const){
  const result=emailTemplate({kind,language,id:'order-1',store:'<script>alert(1)</script>',slug:'store-one',key:'SP-PRO-private',amount:'15.00',coin:'USDC',days:7,notes:'<img src=x onerror=alert(1)>',reason:'bad <a>'});
  assert.ok(result.subject);assert.ok(result.text);assert.ok(result.html.includes('lang="'+language+'"'));assert.ok(result.html.includes('dir="'+(language==='ar'?'rtl':'ltr')+'"'));
  assert.ok(!result.html.includes('<script>'));assert.ok(!result.html.includes('<img src=x'));assert.ok(result.html.includes('&lt;script&gt;'));assert.ok(result.html.includes(publicLink(kind==='pro'?'/shop':kind==='payout'?'/dashboard':kind==='dispute'?'/admin':'/s/store-one')));
 }
 const old=process.env.RESEND_API_KEY;let calls=0;
 try{
  delete process.env.RESEND_API_KEY;
  const request:typeof fetch=async()=>{calls++;throw Error('offline');};
  assert.equal(await sendEmail('buyer@example.com',{kind:'held',id:'id'},'event',request),'skipped');assert.equal(calls,0);
  process.env.RESEND_API_KEY='test-only-key';
  assert.equal(await sendEmail('buyer@example.com',{kind:'held',id:'id'},'event',request),'failed');
  assert.equal(await sendEmail('buyer@example.com',{kind:'held',id:'id'},'event',async()=>Response.json({error:'limit'},{status:429})),'failed');
  assert.equal(await sendEmail('not-an-email',{kind:'held',id:'id'},'event',request),'skipped');
 }finally{if(old===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=old;}
});

test('all five notifications use committed database facts and deduplicate successful sends',async()=>{
 const pg=new PGlite();const query:Query=async(sql,args)=>(await pg.query(sql,args)).rows as Record<string,any>[];
 const old={...process.env};const messages:{to:string[];html:string;subject:string}[]=[];
 const request:typeof fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');assert.equal((options?.headers as Record<string,string>).Authorization,'Bearer test-only');assert.ok((options?.headers as Record<string,string>)['Idempotency-Key']);messages.push(JSON.parse(String(options?.body)));return Response.json({id:'mock-email'});};
 process.env.RESEND_API_KEY='test-only';process.env.NEXT_PUBLIC_ESCROW_WALLET='0x'+'1'.repeat(40);process.env.NEXT_PUBLIC_ESCROW_NETWORK='Polygon';process.env.ADMIN_NOTIFY_EMAIL='admin@example.com';process.env.ADMIN_NOTIFY_LANGUAGE='fr';delete process.env.NEXT_PUBLIC_PRO_PRICE_USD;
 try{
  const schema=await readFile('src/db/schema.sql','utf8');await pg.exec(schema);await pg.exec(schema);
  const upgrade=await requestUpgrade({email:'seller@example.com',coin:'USDT',tx_id:'0x'+'a'.repeat(64),language:'ar'},query);
  const issued=await decideUpgrade({id:upgrade.id,action:'approve'},query);
  await notifyEvent('pro',upgrade.id,query,request);await notifyEvent('pro',upgrade.id,query,request);assert.equal(messages.length,1);assert.deepEqual(messages[0].to,['seller@example.com']);assert.ok(messages[0].html.includes(issued.issued_license_key));assert.ok(messages[0].html.includes('dir="rtl"'));
  const owner=digest('sellpostly-license:'+issued.issued_license_key);
  const sub=(await query('SELECT email,language FROM subscriptions WHERE owner_key=$1',[owner]))[0];assert.equal(sub.email,'seller@example.com');assert.equal(sub.language,'ar');
  const shop=(await query("INSERT INTO shops(owner_key,slug,name) VALUES($1,'email-shop','Email Shop') RETURNING id",[owner]))[0];
  const order=(await query("INSERT INTO orders(shop_id,gross_amount,coin,network,tx_id,details) VALUES($1,100,'USDC','Polygon',$2,$3::jsonb) RETURNING id",[shop.id,'0x'+'b'.repeat(64),JSON.stringify({language:'fr',buyer:{name:'Buyer',contact:'buyer@example.com',phone:'212612345678'}})]))[0];
  await updateOrder(order.id,{action:'verify'},query);await notifyEvent('held',order.id,query,request);
  assert.deepEqual(messages[1].to,['buyer@example.com']);assert.ok(messages[1].html.includes('Paiement vérifié'));assert.ok(messages[1].html.includes('100.000000'));assert.ok(messages[1].html.includes('>7<'));
  await fulfill(order.id,owner,{tracking:'TRACK-123',delivery_notes:'KEY-123 <unsafe>'},query);await notifyEvent('delivered',order.id,query,request);await notifyEvent('delivered',order.id,query,request);
  assert.equal(messages.length,3);assert.ok(messages[2].html.includes('KEY-123 &lt;unsafe&gt;'));
  await buyerAction(order.id,{contact:'buyer@example.com',reason:'Wrong digital key'},query);await notifyEvent('dispute',order.id,query,request);
  assert.deepEqual(messages[3].to,['admin@example.com']);assert.ok(messages[3].html.includes('Wrong digital key'));
  // Existing payout constraints remain enforced; test paid delivery on a valid reserved request.
  const second=(await query("INSERT INTO orders(shop_id,gross_amount,coin,network,tx_id,details) VALUES($1,100,'USDC','Polygon',$2,'{}') RETURNING id",[shop.id,'0x'+'c'.repeat(64)]))[0];
  await updateOrder(second.id,{action:'verify'},query);
  await query("UPDATE orders SET details=jsonb_build_object('buyer',jsonb_build_object('contact','buyer@example.com')) WHERE id=$1",[second.id]);
  await buyerAction(second.id,{contact:'buyer@example.com',action:'confirm_receipt'},query);await updateOrder(second.id,{action:'release',forceRelease:true},query);
  const payout=(await query("SELECT request_seller_payout($1,$2,10,'USDC','Polygon',$3) AS id",[shop.id,owner,'0x'+'1'.repeat(40)]))[0];
  await updatePayout(payout.id,{action:'approve'},query);await updatePayout(payout.id,{action:'paid',tx_id:'0x'+'d'.repeat(64)},query);await notifyEvent('payout',payout.id,query,request);
  assert.deepEqual(messages[4].to,['seller@example.com']);assert.ok(messages[4].html.includes('dir="rtl"'));
  await notifyEvent('payout',payout.id,query,request);assert.equal(messages.length,5);
  // Provider and DB outages never reject a saved business action.
  await notifyEvent('pro',upgrade.id,async()=>{throw Error('db offline');},request);
 }finally{for(const key of ['RESEND_API_KEY','NEXT_PUBLIC_ESCROW_WALLET','NEXT_PUBLIC_ESCROW_NETWORK','NEXT_PUBLIC_PRO_PRICE_USD','ADMIN_NOTIFY_EMAIL','ADMIN_NOTIFY_LANGUAGE']){if(old[key]===undefined)delete process.env[key];else process.env[key]=old[key];}await pg.close();}
});

test('canonical URLs reject previews and quick replies reject email contacts as phone numbers',async()=>{
 assert.equal(normalizeAppUrl(undefined),'https://vercel.app');assert.equal(normalizeAppUrl('https://sellpostly-git-main-team.vercel.app'),'https://vercel.app');
 assert.equal(normalizeAppUrl('https://shop.example.com/path?secret=value'),'https://shop.example.com');assert.equal(normalizeAppUrl('javascript:alert(1)'),'https://vercel.app');
 assert.equal(buyerPhone('buyer1234567890@example.com'),'');assert.equal(buyerPhone('+212 612-345-678'),'212612345678');
 const order={id:'order-1',details:{buyer:{contact:'buyer@example.com'},fulfillment:{tracking:'TRACK',delivery_notes:'KEY'}}};
 assert.equal(quickReplyUrl('confirmed','en',order,'My Shop'),null);
 for(const language of ['en','fr','ar']){
  const url=quickReplyUrl('delivered',language,{...order,details:{...order.details,buyer:{phone:'+212612345678'}}},'My Shop')!;
  assert.equal(new URL(url).pathname,'/212612345678');const text=new URL(url).searchParams.get('text')!;assert.ok(text.includes('order-1'));assert.ok(text.includes('My Shop'));assert.ok(text.includes('TRACK'));assert.ok(text.includes('KEY'));assert.ok(text.length<=800);
 }
 assert.equal((await settingsGet(new Request('https://example.com/api/seller/notifications'))).status,401);
 assert.equal((await settingsPost(new Request('https://example.com/api/seller/notifications',{method:'POST',body:'{}'}))).status,401);
});

test('extension category and Kids audience survive the full storefront handoff and shared catalog',async()=>{
 const code=await readFile('chrome-extension/background.js','utf8');let listener:any,bridged:any;let opened='';
 const context=vm.createContext({importScripts:()=>{},SellPostlyFrontend:{resolve:async()=> 'https://sellpostly.vercel.app'},URL,URLSearchParams,crypto:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'},chrome:{scripting:{executeScript:async({args}:{args:any[]})=>{bridged=args[0];return [{result:true}];}},runtime:{id:'test',onMessage:{addListener:(value:any)=>listener=value}},tabs:{create:async({url}:{url:string})=>{opened=url;return {id:1};}}}});
 vm.runInContext(await readFile('chrome-extension/affiliate-guard.js','utf8'),context);vm.runInContext(code,context);
 for(const category of ['Digital Product','Art','Sport','Fashion']){
  const result:any=await new Promise(resolve=>listener({type:'SELLPOSTLY_SEND_TO_SHOP',product:{title:'Product',category,gender:'kids',image:'https://images.example.com/large.jpg'}},{id:'test'},resolve));assert.equal(result.ok,true);
  assert.equal(new URL(opened).origin,'https://sellpostly.vercel.app');const incoming={item:normalizePending(bridged)};assert.equal(incoming.item.gender,'kids');assert.equal(incoming.item.category,category);
  const catalog=validateShop({name:'Kids store',products:[{...incoming.item,name:incoming.item.title}]});assert.equal((await decodeShop(await encodeShop(catalog))).products[0].gender,'kids');
 }
});

