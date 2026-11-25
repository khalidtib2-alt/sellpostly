const fs=require('fs');const edit=(p,fn)=>fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));
edit('src/app/shop/shop-data.ts',s=>s.replace('text(p.url,20000),blocked))),editorialCover','text(p.url,20000),blocked)),editorialCover'));
edit('src/app/shop/storefront-templates.tsx',s=>s.replace('amazon=affiliate&&amazonAffiliateProduct(p),discount=amazon?', 'amazon=affiliate&&isAmazonDestination(p.url),restricted=affiliate&&amazonAffiliateProduct(p),discount=restricted?').replace('{!amazon&&', '{!restricted&&'));
