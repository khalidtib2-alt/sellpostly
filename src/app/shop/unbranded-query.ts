export type FootwearSubtype='sneakers'|'boots'|'formal'|'flats'|'sandals';
export function footwearSubtype(title:string):FootwearSubtype|undefined {
 const s=String(title||'').normalize('NFKC').toLowerCase();
 if(/\b(boots?|bottines?|bottes?)\b/.test(s))return 'boots';
 if(/\b(sandals?|flip[ -]?flops?|sandales?)\b/.test(s))return 'sandals';
 if(/\b(flats?|ballerinas?|ballet shoes|ballerines?)\b/.test(s))return 'flats';
 if(/\b(sneakers?|trainers?|running shoes?|athletic shoes?|tennis shoes?|baskets?)\b/.test(s))return 'sneakers';
 if(/\b(dress shoes?|formal shoes?|oxfords?|loafers?|brogues?|derb(?:y|ies)|heels?|pumps?)\b/.test(s))return 'formal';
}
/** Controlled generic terms: no imported brand, model, SKU or URL reaches a photo provider. */
export function unbrandedQuery(title:string,category='',gender='unisex') {
 const s=String(title||'').slice(0,2000).normalize('NFKC').toLowerCase();
 const kids=/\b(kids?|children|child|toddler|baby|junior|enfants?)\b/.test(s)||gender==='kids';
 const women=/\b(women|woman|womens|female|ladies|femme)\b/.test(s)||gender==='women';
 const subtype=footwearSubtype(s);
 if(subtype==='sneakers')return kids?'kids athletic sneakers':women?'women athletic sneakers':'men athletic sneakers';
 if(subtype==='boots')return 'boots';
 if(subtype==='formal')return 'formal shoes';
 if(subtype==='flats')return 'flat shoes';
 if(subtype==='sandals')return 'sandals';
 if(/\b(shoes?|footwear|chaussures?)\b/.test(s))return 'footwear';
 if(/headphones?|earbuds?|earphones?|airpods|quietcomfort|wh[- ]?1000|wf[- ]?1000|casque|écouteur|سماعات/.test(s))return /noise|cancell|wh[- ]?1000|quietcomfort/.test(s)?'wireless noise cancelling headphones':'wireless headphones';
 if(/watch|forerunner|fenix|montre|ساعة/.test(s))return 'smartwatch';
 if(/coffee|espresso|nespresso|breville|delonghi|kitchen|kettle|café|cuisine|قهوة/.test(s))return 'coffee kitchen';
 if(/backpack|handbag|tote|\bbag\b|sac\b|حقيبة/.test(s))return 'travel bag';
 if(/skincare|cerave|serum|beauty|cream|cosmetic|dyson|airwrap|moisturi|sunscreen|beauté|بشرة/.test(s))return 'skincare beauty';
 if(/fitness|dumbbell|yoga|gym|workout|kettlebell|sport|musculation|رياضة/.test(s))return 'fitness equipment';
 if(/\b(nike|adidas|puma)\b/.test(s))return kids?'kids athletic sneakers':women?'women athletic sneakers':'men athletic sneakers';
 if(category==='Fashion')return 'travel bag';
 if(category==='Beauty')return 'skincare beauty';
 if(category==='Home & Kitchen')return 'coffee kitchen';
 if(['Fitness','Sport'].includes(category))return 'fitness equipment';
 return 'office technology';
}

/** Reject ambiguous or wrong-subtype provider results; use a tagged local photo instead. */
export function matchesFootwearQuery(query:string,description:string){
 const expected=footwearSubtype(query);if(!expected)return true;
 if(footwearSubtype(description)!==expected)return false;
 if(query.startsWith('kids ')&&!/\b(kids?|child(?:ren)?|toddler|baby|junior)\b/i.test(description))return false;
 return true;
}
