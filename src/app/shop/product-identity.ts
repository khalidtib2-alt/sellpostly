export const visualNiches=['audio','watch','phone-tech','camera','coffee-kitchen','fitness','fashion-bag','beauty-skincare','gaming','home-office'] as const;
export type VisualNiche=typeof visualNiches[number];
export const nicheLabels=['Audio','Watches','Phones & Tech','Cameras','Coffee & Kitchen','Fitness','Fashion & Bags','Beauty & Skincare','Gaming','Home & Office'] as const;
const keywords:Record<VisualNiche,string>={audio:'headphones audio listening',watch:'wristwatch timepiece', 'phone-tech':'smartphone technology','camera':'camera photography','coffee-kitchen':'coffee espresso kitchen','fitness':'fitness gym workout','fashion-bag':'fashion leather bag','beauty-skincare':'skincare cosmetics beauty','gaming':'gaming controller setup','home-office':'minimal workspace desk'};
const brands:[string,RegExp,RegExp?][]=[
 ['Sony',/\bSony\b/i,/\b(?:WH|WF)[- ]?1000XM\d\b|\b(?:Alpha\s+)?(?:A[1679](?:\s*(?:IV|III|II|V))?|ILCE[- ]?[\w-]+)\b/i],
 ['Apple',/\bApple\b/i,/\b(?:iPhone\s*\d{1,2}(?:\s*(?:Pro\s*Max|Pro|Plus|mini))?|AirPods(?:\s*(?:Pro|Max))?(?:\s*\d+)?|Watch\s*(?:Ultra\s*\d*|Series\s*\d+|SE(?:\s*\d+)?))\b/i],
 ['Samsung',/\bSamsung\b/i,/\bGalaxy\s*(?:S\d{1,2}(?:\s*(?:Ultra|Plus|FE))?|Z\s*(?:Fold|Flip)\s*\d+|Watch\s*\d+(?:\s*(?:Classic|Pro))?|Buds\s*(?:\d+|Pro|FE)?)/i],
 ['Canon',/\bCanon\b/i,/\b(?:EOS\s+)?(?:R\d+(?:\s*Mark\s*(?:II|III|IV))?|[5789]D(?:\s*Mark\s*(?:II|III|IV))?)\b/i],
 ['Nikon',/\bNikon\b/i,/\b(?:Z\s*\d+(?:\s*(?:II|III))?|D\d{3,4})\b/i],
 ['Fujifilm',/\bFujifilm\b/i,/\bX[- ](?:T\d+|S\d+|H\d+|\d+[A-Z]*)\b/i],
 ['GoPro',/\bGoPro\b/i,/\bHERO\s*\d+(?:\s*Black)?\b/i],
 ['Bose',/\bBose\b/i,/\b(?:QuietComfort(?:\s*(?:Ultra|\d+))?|SoundLink\s*(?:Flex|Mini|Revolve)|700)\b/i],
 ['JBL',/\bJBL\b/i,/\b(?:Tune\s*\d+[A-Z]*|Charge\s*\d+|Flip\s*\d+|Live\s*\d+[A-Z]*)\b/i],
 ['Garmin',/\bGarmin\b/i,/\b(?:Forerunner\s*\d+|Fenix\s*\d+(?:\s*Pro)?|Venu\s*\d+|Epix\s*(?:Pro|\d+))\b/i],
 ['Casio',/\bCasio\b/i,/\b(?:G[- ]Shock\s*)?(?:GA[- ]\d+[A-Z]*|F[- ]\d+[A-Z]*|A\d+[A-Z]*)\b/i],
 ['Breville',/\bBreville\b/i,/\b(?:Bambino(?:\s*Plus)?|Barista\s*(?:Express|Pro|Touch)|BES\d+[A-Z]*)\b/i],
 ['Nespresso',/\bNespresso\b/i,/\b(?:Vertuo\s*(?:Pop(?:\s*Plus)?|Next|Plus)?|Pixie|Essenza\s*Mini)\b/i],
 ['DeLonghi',/\bDe['’ ]?Longhi\b/i,/\b(?:Dedica\s*)?EC\d+[A-Z]*\b/i],
 ['Logitech',/\bLogitech\b/i,/\b(?:MX\s*(?:Master\s*\d+[A-Z]*|Keys(?:\s*S)?)|G\d+(?:\s*HERO)?|Brio(?:\s*4K)?)\b/i],
 ['Anker',/\bAnker\b/i,/\b(?:Soundcore\s*(?:Life\s*)?Q\d+|\d{3})(?:\s*Power\s*Bank)?\b/i],
 ['Soundcore',/\bSoundcore\b/i,/\b(?:Life\s*)?Q\d+\b/i],
 ['Dyson',/\bDyson\b/i,/\b(?:V\d+(?:\s*Detect)?|Supersonic|Airwrap)\b/i],
 ['Dell',/\bDell\b/i,/\b(?:UltraSharp\s*)?[UP]\d{4}[A-Z]*\b/i],
 ['Lenovo',/\bLenovo\b/i,/\bThinkPad\s*(?:X1\s*Carbon|[TXE]\d{2,3})(?:\s*Gen\s*\d+)?\b/i],
 ['ASUS',/\bASUS\b/i,/\bROG\s*(?:Ally(?:\s*X)?|Strix(?:\s*[A-Z]\d+)?)\b/i],
 ['Nintendo',/\bNintendo\b/i,/\bSwitch(?:\s*(?:2|OLED|Lite))?\b/i],
 ['Amazon Basics',/\bAmazon\s*Basics\b/i],['CeraVe',/\bCeraVe\b/i],['La Roche-Posay',/\bLa\s*Roche[- ]Posay\b/i],['Nike',/\bNike\b/i],['Adidas',/\bAdidas\b/i],['Fossil',/\bFossil\b/i],['Fjallraven',/\bFj[aä]llr[aä]ven\b/i],
];
function cleanTitle(value:string){return String(value||'').slice(0,2000).normalize('NFKC').replace(/[\u2010-\u2015]/g,'-').replace(/&amp;/g,'&').replace(/\bVisit the (.+?) Store\b/gi,'$1').replace(/\b(?:Amazon['’]s? Choice|Best Seller|Bestseller|Limited Time Deal|Official Store|New Release|Free Shipping|Free Returns|Renewed|Refurbished|Latest Version|Latest Model)\b/gi,' ').replace(/\b20\d{2}\s*(?:New|Upgrade[ds]?|Model|Version)\b/gi,' ').replace(/\[[^\]]*\]/g,' ').replace(/\s+/g,' ').trim().replace(/^[|,:\s-]+|[|,:\s-]+$/g,'');}
function nicheFor(text:string,category:string):VisualNiche{
 const rules:[VisualNiche,RegExp][]=[['gaming',/gaming|playstation|xbox|nintendo|\bROG\b|\bG502\b|manette|ألعاب/i],['watch',/watch|smartwatch|forerunner|fenix|casio|montre|ساعة/i],['audio',/headphones?|earbuds?|earphones?|speaker|soundcore|quietcomfort|WH[- ]?1000|WF[- ]?1000|airpods|casque|écouteur|سماعات/i],['camera',/camera|canon|nikon|fujifilm|gopro|photograph|\bAlpha\b|كاميرا/i],['coffee-kitchen',/coffee|espresso|nespresso|breville|delonghi|kitchen|kettle|café|cuisine|قهوة|مطبخ/i],['beauty-skincare',/skincare|cerave|roche.posay|cosmetic|serum|moisturi|sunscreen|beauty|cream|beauté|بشرة|تجميل/i],['phone-tech',/iphone|smartphone|galaxy\s+[sz]|power\s*bank|charger|tablet|phone|téléphone|هاتف/i],['fashion-bag',/backpack|handbag|leather|tote|\bbag\b|kanken|fashion|chaussure|sac\b|حقيبة|أزياء/i],['fitness',/fitness|dumbbell|yoga|gym|workout|kettlebell|sport|musculation|رياضة/i],['home-office',/office|desk|monitor|chair|keyboard|mouse|MX\s*Master|thinkpad|ultrasharp|bureau|مكتب/i]];
 for(const [niche,pattern] of rules)if(pattern.test(text))return niche;
 return category==='Fashion'?'fashion-bag':category==='Beauty'?'beauty-skincare':['Fitness','Sport'].includes(category)?'fitness':category==='Home & Kitchen'?'coffee-kitchen':category==='Tech & Gadgets'?'phone-tech':'home-office';
}
export function extractProductIdentity(title:string,category=''){
 const cleaned=cleanTitle(title),known=brands.find(([,pattern])=>pattern.test(cleaned));
 let brand=known?.[0]||'',model=known?.[2]?.exec(cleaned)?.[0]||'',confidence:'matched'|'inferred'|'uncertain'=model?'matched':'uncertain';
 if(model&&/^(?:WH|WF)[- ]?1000XM\d$/i.test(model))model=model.replace(/^(WH|WF)[- ]?1000XM(\d)$/i,'$1-1000XM$2').toUpperCase();
 if(brand&&!model){const rest=cleaned.slice((known![1].exec(cleaned)?.index||0)+(known![1].exec(cleaned)?.[0].length||0)).split(/[|,:;()]/)[0].replace(/\b(?:with|for|featuring|including)\b.*$/i,'').trim();const code=rest.match(/\b[A-Z]{1,6}[- ]?\d{2,}[A-Z\d-]*\b/i);model=code?.[0]||rest.split(/\s+/).slice(0,4).join(' ');confidence=model?'inferred':'uncertain';}
 if(!brand){const generic=cleaned.match(/^([\p{L}][\p{L}\d&.-]{1,25})\s+([A-Z]{1,6}-\d{2,}[A-Z\d-]*)\b/u);if(generic){brand=generic[1];model=generic[2];confidence='inferred';}}
 if(/\b(?:case|cover|ear\s*pads?|screen protector|strap|adapter)\b/i.test(cleaned)&&/\b(?:for|compatible|replacement)\b/i.test(cleaned)){brand='';model='';confidence='uncertain';}
 const coreName=(brand?[brand,model].filter(Boolean).join(' '):cleaned.split(/[|,:;]/)[0].split(/\s+/).slice(0,8).join(' ')).trim();
 const visualNiche=nicheFor(cleaned,category),variant=cleaned.match(/\b(?:\d+\s*(?:GB|TB)|black|silver|white|blue|pink|graphite|midnight)\b/gi)?.join(' ')||'';
 return {brand,model,coreName:coreName||cleaned,visualNiche,visualKeywords:keywords[visualNiche],confidence,variant,searchQuery:[coreName,variant].filter(Boolean).join(' ')};
}
export const studioCover=(niche:VisualNiche)=>'/studio-covers/'+niche+'.svg';
export function isStudioCover(value:string){return /^\/studio-covers\/(audio|watch|phone-tech|camera|coffee-kitchen|fitness|fashion-bag|beauty-skincare|gaming|home-office)\.svg$/.test(value);}
export function coverNiche(value:unknown):VisualNiche|undefined{return visualNiches.includes(value as VisualNiche)?value as VisualNiche:undefined;}
export function imageSearchLinks(title:string,category=''){
 const identity=extractProductIdentity(title,category),query=identity.searchQuery;
 return {official:'https://www.google.com/search?'+new URLSearchParams({q:query+' official product press kit images'}),commons:'https://commons.wikimedia.org/w/index.php?'+new URLSearchParams({title:'Special:MediaSearch',type:'image',search:query}),unsplash:'https://unsplash.com/s/photos/'+encodeURIComponent(identity.visualKeywords.replace(/ /g,'-'))};
}

