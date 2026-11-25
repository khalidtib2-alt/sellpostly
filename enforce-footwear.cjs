const fs=require('fs');const edit=(p,fn)=>fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));
edit('src/app/shop/unbranded-query.ts',s=>s+`\n/** Reject ambiguous or wrong-subtype provider results; use a tagged local photo instead. */
export function matchesFootwearQuery(query:string,description:string){
 const expected=footwearSubtype(query);if(!expected)return true;
 if(footwearSubtype(description)!==expected)return false;
 if(query.startsWith('kids ')&&!/\\b(kids?|child(?:ren)?|toddler|baby|junior)\\b/i.test(description))return false;
 return true;
}\n`);
let source=fs.readFileSync('src/app/shop/unbranded-query.ts','utf8');let js=source.replace(/export type FootwearSubtype=[^;]+;\n/,'').replace('export function footwearSubtype(title:string):FootwearSubtype|undefined','function footwearSubtype(title)').replace('export function unbrandedQuery(title:string,category=','function unbrandedQuery(title,category=').replace('export function matchesFootwearQuery(query:string,description:string)','function matchesFootwearQuery(query,description)');fs.writeFileSync('chrome-extension/unbranded-query.js','"use strict";\n'+js+'\nglobalThis.SellPostlyUnbrandedQuery=unbrandedQuery;\n');
edit('src/lib/stock-photo-service.ts',s=>s.replace("import {unbrandedQuery}","import {unbrandedQuery,footwearSubtype,matchesFootwearQuery}").replace("branded.test(p.alt||''))","branded.test(p.alt||'')||!matchesFootwearQuery(query,p.alt||''))").replace("photos.push({id:'pexels-'","photos.push({footwearSubtype:footwearSubtype(query),id:'pexels-'").replace("branded.test([p.alt_description,p.description].join(' ')))","branded.test([p.alt_description,p.description].join(' '))||!matchesFootwearQuery(query,[p.alt_description,p.description].join(' ')))").replace('photos.push({id,url,provider:', 'photos.push({footwearSubtype:footwearSubtype(query),id,url,provider:'));
edit('src/app/shop/stock-photos.ts',s=>s.replace('return {id:String(p.id)',"return {footwearSubtype:['sneakers','boots','formal','flats','sandals'].includes(p.footwearSubtype||'')?p.footwearSubtype:undefined,id:String(p.id)"));
edit('src/app/shop/affiliate-compliance.ts',s=>s.replace("import {defaultStock}","import {defaultStock,localPhoto}").replace("import {extractProductIdentity", "import {footwearSubtype} from './unbranded-query';\nimport {extractProductIdentity").replace(' const oldStudio='," const expected=footwearSubtype(title),local=localPhoto(value);\n if(expected&&local&&local.footwearSubtype!==expected)return defaultStock(title,category,gender).url;\n if(expected==='sneakers'&&local&&gender==='kids'&&!local.audiences?.includes('kids'))return defaultStock(title,category,gender).url;\n const oldStudio="));
// Old automatic remote images without trustworthy subtype metadata are re-matched too.
edit('src/app/shop/shop-data.ts',s=>s.replace("import {unbrandedQuery}","import {unbrandedQuery,footwearSubtype}").replace('.map(p=>({unbrandedQuery:',`.map(p=>{
 const expected=footwearSubtype(p.identityOverride||p.name||'');
 if(raw.shopMode!=='personal'&&expected&&p.stockPhoto&&p.stockPhoto.footwearSubtype!==expected)p={...p,image:''};
 return ({unbrandedQuery:`).replace('})).filter(p=>p.id && p.name)', '});}).filter(p=>p.id && p.name)'));
// New canonical footwear names retain translated UI labels.
const labels={'men athletic sneakers':{fr:'Baskets de sport pour hommes',ar:'أحذية رياضية رجالية'},'women athletic sneakers':{fr:'Baskets de sport pour femmes',ar:'أحذية رياضية نسائية'},'kids athletic sneakers':{fr:'Baskets de sport pour enfants',ar:'أحذية رياضية للأطفال'},'boots':{fr:'Bottes et bottines',ar:'أحذية برقبة طويلة'},'formal shoes':{fr:'Chaussures habillées',ar:'أحذية رسمية'},'flat shoes':{fr:'Chaussures plates',ar:'أحذية مسطحة'},'sandals':{fr:'Sandales',ar:'صنادل'},'footwear':{fr:'Chaussures',ar:'أحذية'}};
const entries=Object.entries(labels).map(([k,v])=>JSON.stringify(k)+':'+JSON.stringify(v)).join(',\n');edit('src/app/translations.ts',s=>s.replace('} as const;',','+entries+'\n} as const;'));
