const fs=require('fs');let p='src/app/shop/shop-builder.tsx',s=fs.readFileSync(p,'utf8').replace("publishing?'Saving.':", "publishing?'Saving…':");fs.writeFileSync(p,s);
for(const p of ['src/lib/marketing-seo.ts','src/lib/storefront-seo.ts']){let s=fs.readFileSync(p,'utf8').replace("availableLanguage:['en','fr','ar'],",'');fs.writeFileSync(p,s);}
