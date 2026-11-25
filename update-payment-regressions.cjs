const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('tests/peer-payments.test.ts',s=>s.replace('submitPeerOrder({...base,method,escrow:false}',"submitPeerOrder({...base,reference:method==='TRON_USDT'?'b'.repeat(64):base.reference,method,escrow:false}"));
edit('tests/storefront-polish.test.ts',s=>s.replace("source.includes('onClick={()=>void savePayments()}')","source.includes('onSave={()=>void savePayments()}')"));
