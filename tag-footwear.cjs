const fs=require('fs');const p='src/app/shop/stock-photo-pool.json';let pool=JSON.parse(fs.readFileSync(p,'utf8'));
pool=pool.map(photo=>{if(photo.id==='pexels-27128273')return {...photo,id:'pexels-5275386',url:'/stock-photos/pexels-5275386.jpg',pageUrl:'https://www.pexels.com/photo/close-up-of-little-girl-reaching-to-her-shoes-5275386/',photographer:'Pexels contributor'};return photo;}).map(photo=>{
 if(photo.query==='men running shoes')return {...photo,query:'men athletic sneakers',footwearSubtype:'sneakers',audiences:['men','women']};
 if(photo.query==='kids sneakers')return {...photo,query:'kids athletic sneakers',footwearSubtype:'sneakers',audiences:['kids']};
 if(photo.query==='women shoes')return {...photo,query:'sandals',footwearSubtype:'sandals',audiences:['women']};return photo;
});
for(const [id,slug,query,subtype] of [[29999843,'stylish-leather-boots-on-dark-background','boots','boots'],[292999,'pair-of-black-dress-shoes','formal shoes','formal'],[6387628,'stylish-decorated-ballet-flats-placed-on-glass-table','flat shoes','flats']])pool.push({id:'pexels-'+id,query,url:'/stock-photos/pexels-'+id+'.jpg',provider:'Pexels',photographer:'Pexels contributor',pageUrl:'https://www.pexels.com/photo/'+slug+'-'+id+'/',licenseUrl:'https://www.pexels.com/license/',footwearSubtype:subtype,audiences:['men','women','kids']});
fs.writeFileSync(p,JSON.stringify(pool,null,2)+'\n');
fs.writeFileSync('public/stock-photos/SOURCES.json',JSON.stringify({license:'https://www.pexels.com/license/',checked:'2026-11-19',usage:'Representative category styles, not exact branded products. Footwear subtype tags prevent cross-type substitutions. Review source rights before reuse.',photos:pool},null,2)+'\n');
