/** Controlled generic terms: no imported brand, model, SKU or URL reaches a photo provider. */
export function unbrandedQuery(title:string,category='',gender='unisex') {
 const s=String(title||'').slice(0,2000).normalize('NFKC').toLowerCase();
 const kids=/\b(kids?|children|child|toddler|baby|junior|enfants?)\b/.test(s)||gender==='kids';
 const women=/\b(women|woman|womens|female|ladies|femme)\b/.test(s)||gender==='women';
 if(/\b(shoes?|sneakers?|trainers?|sandals?|heels?|boots?|footwear|chaussures?)\b/.test(s))return kids?'kids sneakers':women?'women shoes':'men running shoes';
 if(/headphones?|earbuds?|earphones?|airpods|quietcomfort|wh[- ]?1000|wf[- ]?1000|casque|écouteur|سماعات/.test(s))return /noise|cancell|wh[- ]?1000|quietcomfort/.test(s)?'wireless noise cancelling headphones':'wireless headphones';
 if(/watch|forerunner|fenix|montre|ساعة/.test(s))return 'smartwatch';
 if(/coffee|espresso|nespresso|breville|delonghi|kitchen|kettle|café|cuisine|قهوة/.test(s))return 'coffee kitchen';
 if(/backpack|handbag|tote|\bbag\b|sac\b|حقيبة/.test(s))return 'travel bag';
 if(/skincare|cerave|serum|beauty|cream|cosmetic|dyson|airwrap|moisturi|sunscreen|beauté|بشرة/.test(s))return 'skincare beauty';
 if(/fitness|dumbbell|yoga|gym|workout|kettlebell|sport|musculation|رياضة/.test(s))return 'fitness equipment';
 if(/\b(nike|adidas|puma)\b/.test(s))return kids?'kids sneakers':women?'women shoes':'men running shoes';
 if(category==='Fashion')return kids?'kids sneakers':women?'women shoes':'travel bag';
 if(category==='Beauty')return 'skincare beauty';
 if(category==='Home & Kitchen')return 'coffee kitchen';
 if(['Fitness','Sport'].includes(category))return 'fitness equipment';
 return 'office technology';
}
