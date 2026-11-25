const fs=require('fs');const prefix=fs.readFileSync('ui-polish-browser-test.cjs','utf8').split("await call('Page.enable');")[0];
fs.writeFileSync('pricing-browser-test.cjs',prefix+`
await call('Page.enable');await call('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
await call('Page.addScriptToEvaluateOnNewDocument',{source: \x60(()=>{const original=fetch;window.fetch=async(input,options)=>{const u=new URL(typeof input==='string'?input:input.url,location.origin);if(u.pathname==='/api/pro/verify'){const active=localStorage.getItem('sellpostly-pro-key')==='SYNTHETIC_ACTIVE';return Response.json({valid:active},{status:active?200:401});}if(u.pathname==='/api/shops')return Response.json({tier:'free',shops:[],escrow_hold_days:7});return original(input,options);};})()\x60});
await call('Page.navigate',{url:'http://127.0.0.1:3030/pricing'});await until(\x22document.querySelector('#upgrade-pro')&&document.querySelectorAll('main article').length===2\x22);const report={languages:[],flows:[]};
report.navigation=await evaluate(\x22({header:!!document.querySelector('body>header a[href=\\\"/pricing\\\"][aria-current=page]'),footer:!!document.querySelector('body>footer a[href=\\\"/pricing\\\"][aria-current=page]'),prices:Array.from(document.querySelectorAll('main article')).map(a=>a.querySelector('span[dir=ltr]')?.textContent),cta:document.querySelector('#upgrade-pro').getAttribute('href')})\x22);
if(!report.navigation.header||!report.navigation.footer)throw Error('Missing pricing navigation');
for(const lang of ['fr','ar','en']){await evaluate(\x22Array.from(document.querySelectorAll('header button')).find(b=>b.lang==='\x22+lang+\x22').click()\x22);await until(\x22document.documentElement.lang==='\x22+lang+\x22'\x22);await new Promise(r=>setTimeout(r,100));report.languages.push(await evaluate(\x22({lang:document.documentElement.lang,dir:document.documentElement.dir,title:document.title,heading:document.querySelector('main h1').textContent,plans:Array.from(document.querySelectorAll('main article h2')).map(h=>h.textContent)})\x22));}
for(const mode of ['guest','free','active']){
 await evaluate(\x22localStorage.removeItem('sellpostly-pro-key');localStorage.removeItem('sellpostly-free-shop-key');\x22+(mode==='free'?\x22localStorage.setItem('sellpostly-free-shop-key','SYNTHETIC_FREE');\x22:mode==='active'?\x22localStorage.setItem('sellpostly-pro-key','SYNTHETIC_ACTIVE');\x22:''));
 await evaluate(\x22document.querySelector('#upgrade-pro').click()\x22);
 if(mode==='active'){await until(\x22location.pathname==='/shop'&&document.body.textContent.includes('Deactivate Pro on this device')\x22);if(await evaluate(\x22!!document.querySelector('dialog[open]')\x22))throw Error('Active Pro was prompted to pay');}
 else{await until(\x22location.pathname==='/shop'&&!!document.querySelector('dialog[open] input[type=password]')\x22);}
 report.flows.push(await evaluate(\x22({path:location.pathname,query:location.search,dialog:!!document.querySelector('dialog[open]'),license:!!document.querySelector('dialog[open] input[type=password]'),crypto:document.querySelector('dialog[open]')?.textContent.includes('Pay with USDC / USDT (Polygon)')||false})\x22));
 if(mode==='free'){await evaluate(\x22Array.from(document.querySelectorAll('dialog[open] button')).find(b=>b.textContent.trim()==='Close').click()\x22);await until(\x22document.body.textContent.includes('Free Primary Stores')&&!document.querySelector('dialog[open]')\x22);}
 if(mode!=='active'){await call('Page.navigate',{url:'http://127.0.0.1:3030/pricing'});await until(\x22document.querySelector('#upgrade-pro')\x22);}
}
fs.writeFileSync('pricing-browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await call('Browser.close');
})().catch(e=>{console.error(e.message);process.exitCode=1;process.exit();});
`);
