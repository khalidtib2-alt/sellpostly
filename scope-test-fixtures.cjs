const fs=require('fs');const edit=(p,fn)=>fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));
edit('src/app/shop/shop-data.ts',s=>s.replace("(p.amazonImageBlocked===true&&(!p.image||!!stockMetadata(p.stockPhoto,p.image)))", "p.amazonImageBlocked===true"));
edit('src/app/shop/shop-builder.tsx',s=>s.replace(".join('\\n');setImageNotice(true);", ".join('\\n');setImageNotice(true);setDraftAmazonBlocked(true);"));
edit('tests/affiliate-guardrails.test.ts',s=>s.replace("assert.equal(shop.heroImage,'/stock-photos/pexels-28396251.jpg')", "assert.equal(shop.heroImage,raw.heroImage)"));
edit('tests/product-identity.test.ts',s=>s.replace("id:'sony',name:", "id:'sony',url:'https://amazon.com/dp/B012345678',name:"));
edit('tests/stock-photos.test.ts',s=>s.replace("const old={id:'shoe',", "const old={id:'shoe',url:'https://amazon.com/dp/B012345678',"));
