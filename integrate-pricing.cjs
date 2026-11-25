const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('src/app/site-shell.tsx',s=>s.replace('const links = [','const links = [\n ["/pricing","Pricing"],').replace('<Link aria-current={currentLink(pathname,"/shop")} href="/shop">', '<Link aria-current={currentLink(pathname,"/pricing")} href="/pricing">{t("Pricing")}</Link><Link aria-current={currentLink(pathname,"/shop")} href="/shop">'));
edit('src/app/sitemap.ts',s=>s.replace('const paths = [','const paths = ["/pricing",'));
edit('src/app/shop/pro-gate.tsx',s=>s.replace('  const dialog=useRef<HTMLDialogElement>(null);',`  const [upgradeRequested,setUpgradeRequested]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{setUpgradeRequested(new URLSearchParams(location.search).get('upgrade')==='pro');},[]);
  useEffect(()=>{if(checking||!upgradeRequested)return;if(!verified)dialog.current?.showModal();const url=new URL(location.href);url.searchParams.delete('upgrade');history.replaceState(history.state,'',url.pathname+url.search+url.hash);},[checking,verified,upgradeRequested]);`)
.replace('if(free&&!verified&&!children)return', 'if(free&&!verified&&!children&&!upgradeRequested)return')
.replace('<dialog ref={dialog} onClick=', '<dialog ref={dialog} onClose={()=>setUpgradeRequested(false)} onClick='));
edit('src/app/pricing/pricing-content.tsx',s=>s.replace('External providers and networks may charge fees. Optional escrow applies to eligible USDC payments only. SellPostly never collects raw card details.','Direct payments may incur provider or network fees. Escrow applies to eligible USDC payments only and carries a 5% platform commission. SellPostly never collects raw card details.'));
const entries={
'Pricing':{fr:'Tarifs',ar:'الأسعار'},
'Free & Pro Pricing | SellPostly':{fr:'Tarifs Gratuit et Pro | SellPostly',ar:'أسعار الخطة المجانية وPro | SellPostly'},
'Compare two free primary storefronts with Pro specialty niche stores, browser media tools and direct seller payment options.':{fr:'Comparez deux boutiques principales gratuites aux boutiques spécialisées Pro, avec outils média et paiements directs aux vendeurs.',ar:'قارن متجرين أساسيين مجانيين بمتاجر Pro المتخصصة، مع أدوات الوسائط وطرق الدفع المباشر للبائعين.'},
'Start with two stores. Grow with Pro.':{fr:'Deux boutiques pour commencer. Pro pour grandir.',ar:'ابدأ بمتجرين. توسّع مع Pro.'},
'Build your main catalogs for free, then launch focused niche collections when you are ready.':{fr:'Créez gratuitement vos catalogues principaux, puis lancez des collections spécialisées quand vous le souhaitez.',ar:'أنشئ كتالوجاتك الأساسية مجانًا، ثم أطلق تشكيلات متخصصة عندما تكون مستعدًا.'},
'Compare Plans':{fr:'Comparer les offres',ar:'مقارنة الخطط'},
'Free Plan':{fr:'Offre gratuite',ar:'الخطة المجانية'},
'Pro Plan':{fr:'Offre Pro',ar:'خطة Pro'},
'Your two primary multi-category storefronts.':{fr:'Vos deux boutiques principales multirubriques.',ar:'متجراك الأساسيان متعددا الفئات.'},
'Independent niche shops for every audience.':{fr:'Des boutiques spécialisées indépendantes pour chaque public.',ar:'متاجر متخصصة مستقلة لكل جمهور.'},
'per month':{fr:'par mois',ar:'شهريًا'},
'per 30 days':{fr:'pour 30 jours',ar:'لكل 30 يومًا'},
'1 Primary Personal Store':{fr:'1 boutique personnelle principale',ar:'متجر شخصي أساسي واحد'},
'1 Primary Affiliate Deals Shop':{fr:'1 boutique affiliée principale',ar:'متجر أساسي واحد للعروض بالعمولة'},
'Chrome Extension product imports':{fr:'Imports de produits via l’extension Chrome',ar:'استيراد المنتجات عبر إضافة Chrome'},
'Amazon affiliate compliance guardrails':{fr:'Garde-fous pour les produits affiliés Amazon',ar:'ضوابط امتثال للتسويق بالعمولة عبر Amazon'},
'All 7 peer-to-peer payment methods':{fr:'Les 7 moyens de paiement direct entre particuliers',ar:'طرق الدفع المباشر السبع بين البائع والمشتري'},
'Browser-based /tools Media Studio':{fr:'Studio média /tools dans le navigateur',ar:'استوديو الوسائط /tools داخل المتصفح'},
'Everything in Free':{fr:'Tout ce qui est inclus dans l’offre gratuite',ar:'كل مزايا الخطة المجانية'},
'Up to 10 Specialty Niche Stores':{fr:'Jusqu’à 10 boutiques spécialisées',ar:'ما يصل إلى 10 متاجر متخصصة'},
'Mix Personal and Affiliate niche shops':{fr:'Combinez boutiques personnelles et affiliées spécialisées',ar:'اجمع بين متاجر شخصية ومتاجر بالعمولة متخصصة'},
'Toggleable links to your matching Main Store':{fr:'Liens activables vers votre boutique principale du même type',ar:'روابط قابلة للتفعيل إلى متجرك الأساسي من النوع نفسه'},
'Independent custom branding for each niche shop':{fr:'Identité visuelle personnalisée pour chaque boutique spécialisée',ar:'هوية مخصصة ومستقلة لكل متجر متخصص'},
'Priority support':{fr:'Assistance prioritaire',ar:'دعم ذو أولوية'},
'Start Free':{fr:'Commencer gratuitement',ar:'ابدأ مجانًا'},
'For focused growth':{fr:'Pour développer vos spécialités',ar:'للتوسع في تخصصك'},
'See upgrade options':{fr:'Voir les options de mise à niveau',ar:'عرض خيارات الترقية'},
'Upgrade to Pro':{fr:'Passer à Pro',ar:'الترقية إلى Pro'},
'Activate an existing license or use the built-in Pro payment checkout.':{fr:'Activez une licence existante ou utilisez le paiement Pro intégré.',ar:'فعّل ترخيصًا موجودًا أو استخدم نافذة الدفع المدمجة لـPro.'},
'The displayed Pro price is for monthly crypto access: 30 days from payment approval. Available plans and payment instructions appear in the upgrade window.':{fr:'Le tarif Pro affiché correspond à l’accès mensuel payé en crypto : 30 jours à compter de l’approbation du paiement. Les offres et instructions figurent dans la fenêtre de mise à niveau.',ar:'سعر Pro المعروض للاشتراك الشهري بالعملات الرقمية: 30 يومًا من الموافقة على الدفع. تظهر الخطط المتاحة وتعليمات الدفع في نافذة الترقية.'},
'Seven direct payment methods, on both plans':{fr:'Sept paiements directs, dans les deux offres',ar:'سبع طرق دفع مباشر في كلتا الخطتين'},
'Personal sellers choose which payment methods to enable. Affiliate purchases take place on the partner merchant website.':{fr:'Chaque vendeur personnel choisit les paiements à activer. Les achats affiliés ont lieu sur le site du marchand partenaire.',ar:'يختار بائعو المتاجر الشخصية طرق الدفع التي يفعّلونها. تتم مشتريات العمولة على موقع التاجر الشريك.'},
'Direct payments may incur provider or network fees. Escrow applies to eligible USDC payments only and carries a 5% platform commission. SellPostly never collects raw card details.':{fr:'Les paiements directs peuvent entraîner des frais de prestataire ou de réseau. Le séquestre concerne uniquement les paiements USDC admissibles, avec une commission de plateforme de 5 %. SellPostly ne collecte jamais les données brutes de carte.',ar:'قد تترتب على المدفوعات المباشرة رسوم لمزود الخدمة أو الشبكة. يقتصر الضمان على مدفوعات USDC المؤهلة بعمولة منصة قدرها 5%. لا يجمع SellPostly أبدًا بيانات البطاقات الخام.'},
'Brand your stores your way':{fr:'Une identité à votre image',ar:'امنح متاجرك هويتك الخاصة'},
'Free includes branding for your primary stores. Pro adds independent names, niche heroes, logos and palettes for each specialty storefront.':{fr:'L’offre gratuite inclut la personnalisation des boutiques principales. Pro ajoute des noms, bannières, logos et palettes indépendants pour chaque boutique spécialisée.',ar:'تتضمن الخطة المجانية تخصيص هوية متجريك الأساسيين. تضيف Pro أسماء وواجهات وشعارات وألوانًا مستقلة لكل متجر متخصص.'},
'Questions before upgrading?':{fr:'Des questions avant de passer à Pro ?',ar:'هل لديك أسئلة قبل الترقية؟'},
'Contact our team for plan questions or Pro priority support.':{fr:'Contactez notre équipe pour toute question sur les offres ou pour l’assistance prioritaire Pro.',ar:'تواصل مع فريقنا للاستفسار عن الخطط أو للحصول على دعم Pro ذي الأولوية.'}
};
edit('src/app/translations.ts',s=>s.replace('export const translations = {','export const translations = {\n'+Object.entries(entries).filter(([k])=>!new RegExp(JSON.stringify(k).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*:').test(s)).map(([k,v])=>JSON.stringify(k)+':'+JSON.stringify(v)+',').join('\n')));
