const fs=require('fs');const p='src/app/shop/unbranded-query.ts';let s=fs.readFileSync(p,'utf8');s=s.replace('/** Controlled',`export type FootwearSubtype='sneakers'|'boots'|'formal'|'flats'|'sandals';
export function footwearSubtype(title:string):FootwearSubtype|undefined {
 const s=String(title||'').normalize('NFKC').toLowerCase();
 if(/\\b(boots?|bottines?|bottes?)\\b/.test(s))return 'boots';
 if(/\\b(sandals?|flip[ -]?flops?|sandales?)\\b/.test(s))return 'sandals';
 if(/\\b(flats?|ballerinas?|ballet shoes|ballerines?)\\b/.test(s))return 'flats';
 if(/\\b(sneakers?|trainers?|running shoes?|athletic shoes?|tennis shoes?|baskets?)\\b/.test(s))return 'sneakers';
 if(/\\b(dress shoes?|formal shoes?|oxfords?|loafers?|brogues?|derb(?:y|ies)|heels?|pumps?)\\b/.test(s))return 'formal';
}
/** Controlled`);
s=s.replace(" if(/\\b(shoes?|sneakers?|trainers?|sandals?|heels?|boots?|footwear|chaussures?)\\b/.test(s))return kids?'kids sneakers':women?'women shoes':'men running shoes';",` const subtype=footwearSubtype(s);
 if(subtype==='sneakers')return kids?'kids athletic sneakers':women?'women athletic sneakers':'men athletic sneakers';
 if(subtype==='boots')return 'boots';
 if(subtype==='formal')return 'formal shoes';
 if(subtype==='flats')return 'flat shoes';
 if(subtype==='sandals')return 'sandals';
 if(/\\b(shoes?|footwear|chaussures?)\\b/.test(s))return 'footwear';`);
s=s.replace("return kids?'kids sneakers':women?'women shoes':'men running shoes'", "return kids?'kids athletic sneakers':women?'women athletic sneakers':'men athletic sneakers'");
s=s.replace("if(category==='Fashion')return kids?'kids sneakers':women?'women shoes':'travel bag';", "if(category==='Fashion')return 'travel bag';");
fs.writeFileSync(p,s);
// Generate the extension's plain JavaScript from the exact same classifier.
let js=s.replace(/export type FootwearSubtype=[^;]+;\n/,'').replace('export function footwearSubtype(title:string):FootwearSubtype|undefined','function footwearSubtype(title)').replace('export function unbrandedQuery(title:string,category=','function unbrandedQuery(title,category=');fs.writeFileSync('chrome-extension/unbranded-query.js','"use strict";\n'+js+'\nglobalThis.SellPostlyUnbrandedQuery=unbrandedQuery;\n');
