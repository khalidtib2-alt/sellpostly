const fs=require('fs'),zlib=require('zlib');
(async()=>{const tabs=await fetch('http://127.0.0.1:9340/json/list').then(r=>r.json()),tab=tabs.find(t=>t.type==='page'),ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}});const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error((r.exceptionDetails.exception?.description||r.exceptionDetails.text)+' EXPRESSION '+expression);return r.result.value;};const until=async expression=>{const end=Date.now()+25000;while(Date.now()<end){if(await evaluate('Boolean(('+expression+'))'))return;await new Promise(r=>setTimeout(r,150));}throw Error('Timed out: '+expression);};






console.log(JSON.stringify(await evaluate("({url:location.href,lang:document.documentElement.lang,body:document.body.innerText.slice(0,8000)})")));ws.close();})().catch(e=>{console.error(e);process.exit(1)});