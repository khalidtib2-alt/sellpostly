const fs=require('fs');let p='src/app/shop/storefront-templates.tsx';let s=fs.readFileSync(p,'utf8').replaceAll('{!amazon&&','{!restricted&&');fs.writeFileSync(p,s);
