export type SeoProductCopy={title:string;meta:string;keywords:string;faq:string;caption:string;hashtags:string;prompt:string};
type Translate=(key:any)=>string;
export function generateProductSeo(title:string,facts:string,audience:string,t:Translate,language='en'):SeoProductCopy{
 const clean=(s:string)=>s.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
 const name=clean(title).slice(0,120),details=clean(facts);
 const words=Array.from(new Set((name+' '+details).toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w=>w.length>2))).slice(0,12);
 return {title:name.slice(0,60),meta:clean(name+'. '+(details||t('Review the listed details and confirm availability with the seller.'))).slice(0,155),keywords:words.join(', '),
  faq:[t('What should I know about this product?'),details||t('Ask the seller for the missing product specifications.'),t('How can I confirm the current price and availability?'),t('Check the linked store or contact the seller before ordering.'),t('What are the delivery and return terms?'),t('Read the independent seller policy before paying.')].join('\n\n'),
  caption:[name,details,t('Check the linked store or contact the seller before ordering.')].filter(Boolean).join('\n\n'),hashtags:words.slice(0,6).map(w=>'#'+w).join(' '),
  prompt:[t('Writing Language')+': '+({en:'English',fr:'français',es:'español',ar:'\u0627\u0644\u0639\u0631\u0628\u064a\u0629'}[language as 'en'|'fr'|'es'|'ar']),t('Act as an e-commerce SEO editor. Write in the selected language for the specified audience.'),t('Product or topic: ')+name,t('Verified Product Details')+': '+(facts.trim()||t('Ask the seller for the missing product specifications.')),t('Target tone and audience: ')+audience,
   t('Return an SEO product title, a meta description, search keywords, buyer FAQs, a social caption and relevant hashtags. Use only supplied facts. Never invent specifications, reviews, discounts or delivery promises. Mark information that needs seller confirmation.')].join('\n\n')};
}
