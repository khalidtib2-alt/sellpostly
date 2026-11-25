const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
const entries={
'Refund & Delivery Policy':{fr:'Politique de retour et de livraison',ar:'سياسة الاسترجاع والتسليم'},
'No Refunds / Final Sale':{fr:'Aucun remboursement / Vente définitive',ar:'لا استرداد / بيع نهائي'},
'7-Day Exchange/Return':{fr:'Échange ou retour sous 7 jours',ar:'استبدال أو إرجاع خلال 7 أيام'},
'14-Day Return Policy':{fr:'Retour sous 14 jours',ar:'سياسة إرجاع خلال 14 يومًا'},
'Refund Policy (Required)':{fr:'Politique de retour (obligatoire)',ar:'سياسة الاسترجاع (مطلوبة)'},
'Select a refund policy':{fr:'Choisir une politique de retour',ar:'اختر سياسة الاسترجاع'},
'Delivery Timeframe (Required)':{fr:'Délai de livraison (obligatoire)',ar:'مدة التسليم (مطلوبة)'},
'Include dispatch or digital delivery timing. Save Payment Settings to publish this policy.':{fr:'Indiquez le délai d’expédition ou de livraison numérique. Enregistrez les paiements pour publier cette politique.',ar:'اذكر وقت الشحن أو التسليم الرقمي. احفظ إعدادات الدفع لنشر هذه السياسة.'},
'This seller has not provided a refund and delivery policy yet. Checkout is unavailable until it is configured.':{fr:'Ce vendeur n’a pas encore fourni sa politique de retour et de livraison. Le paiement est indisponible tant qu’elle n’est pas configurée.',ar:'لم يحدد البائع سياسة الاسترجاع والتسليم بعد. الدفع غير متاح حتى يتم إعدادها.'},
'This is the independent seller’s policy. Mandatory consumer rights still apply where required by law.':{fr:'Il s’agit de la politique du vendeur indépendant. Les droits impératifs des consommateurs restent applicables selon la loi.',ar:'هذه سياسة البائع المستقل. تظل حقوق المستهلك الإلزامية سارية حيث يفرضها القانون.'},
'Select a refund policy and enter a delivery timeframe before saving.':{fr:'Choisissez une politique de retour et indiquez le délai de livraison avant d’enregistrer.',ar:'اختر سياسة استرجاع وأدخل مدة التسليم قبل الحفظ.'},
'Buyer Safety Checklist':{fr:'Conseils de sécurité pour l’acheteur',ar:'قائمة أمان المشتري'},
'Verify the wallet, network and payment details inside this storefront before paying. Treat replacement details sent in private messages as suspicious.':{fr:'Vérifiez le portefeuille, le réseau et les coordonnées de paiement dans cette boutique avant de payer. Méfiez-vous des coordonnées de remplacement envoyées en privé.',ar:'تحقق من المحفظة والشبكة وتفاصيل الدفع داخل هذا المتجر قبل الدفع. تعامل بحذر مع التفاصيل البديلة المرسلة عبر رسائل خاصة.'},
'Never share your passwords, one-time codes (OTPs), wallet seed phrase or private keys.':{fr:'Ne partagez jamais vos mots de passe, codes à usage unique (OTP), phrase de récupération ou clés privées.',ar:'لا تشارك كلمات المرور أو رموز التحقق لمرة واحدة (OTP) أو عبارة استرداد المحفظة أو المفاتيح الخاصة.'},
'For high-value orders, use USDC Escrow Protection when available. Other payment methods are direct transactions with the seller.':{fr:'Pour les achats importants, utilisez la protection par séquestre USDC lorsqu’elle est disponible. Les autres paiements sont directs avec le vendeur.',ar:'للطلبات مرتفعة القيمة، استخدم ضمان USDC عند توفره. طرق الدفع الأخرى معاملات مباشرة مع البائع.'},
'Seller Plan Manager':{fr:'Gestion des offres vendeurs',ar:'إدارة خطط البائعين'},
'Free includes two primary stores. Pro permits up to 10 niche shops. Downgrading hides niche storefronts and blocks new niche publishing without deleting catalogs or orders.':{fr:'L’offre gratuite inclut deux boutiques principales. Pro autorise jusqu’à 10 boutiques spécialisées. Le passage au gratuit masque les boutiques spécialisées et bloque leur publication sans supprimer catalogues ni commandes.',ar:'تشمل الخطة المجانية متجرين أساسيين. تسمح Pro بما يصل إلى 10 متاجر متخصصة. يخفي التخفيض المتاجر المتخصصة ويمنع نشرها دون حذف الكتالوجات أو الطلبات.'},
'Search seller email, store name or account ID':{fr:'Rechercher par e-mail, boutique ou identifiant de compte',ar:'ابحث ببريد البائع أو اسم المتجر أو معرّف الحساب'},
'Seller Account':{fr:'Compte vendeur',ar:'حساب البائع'},
'StoreS':{fr:'Boutiques',ar:'المتاجر'},
'Stores':{fr:'Boutiques',ar:'المتاجر'},
'Seller Plan':{fr:'Offre vendeur',ar:'خطة البائع'},
'Niche Shops':{fr:'Boutiques spécialisées',ar:'المتاجر المتخصصة'},
'No email provided':{fr:'Aucun e-mail renseigné',ar:'لم يُدخل بريد إلكتروني'},
'No stores yet':{fr:'Aucune boutique pour le moment',ar:'لا توجد متاجر بعد'},
'No matching seller accounts.':{fr:'Aucun compte vendeur correspondant.',ar:'لا توجد حسابات بائعين مطابقة.'},
'Seller plan saved.':{fr:'Offre vendeur enregistrée.',ar:'تم حفظ خطة البائع.'},
'Could not load or save seller plans. Try again.':{fr:'Impossible de charger ou d’enregistrer les offres vendeurs. Réessayez.',ar:'تعذر تحميل خطط البائعين أو حفظها. حاول مجددًا.'},
'Loading…':{fr:'Chargement…',ar:'جارٍ التحميل…'},
'Saved; Pro required':{fr:'enregistrées ; Pro requis',ar:'محفوظة؛ تتطلب Pro'}
};delete entries.StoreS;
edit('src/app/translations.ts',s=>s.replace('export const translations = {','export const translations = {\n'+Object.entries(entries).filter(([k])=>!new RegExp(JSON.stringify(k).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*:').test(s)).map(([k,v])=>JSON.stringify(k)+':'+JSON.stringify(v)+',').join('\n')));
edit('src/app/admin/seller-plan-manager.tsx',s=>s.replace("{account.niche_count} / {account.plan==='pro'?10:0}","{account.niche_count} {account.plan==='pro'?'/ 10':t('Saved; Pro required')}"));
edit('src/lib/shop-handoff.ts',s=>s.replace("const key=storage.getItem(proKey)?.trim();if(!key)return false;", "const key=storage.getItem(proKey)?.trim()||'',account=storage.getItem('sellpostly-free-shop-key')||'';if(!key&&!account)return false;").replace("headers:{'x-pro-key':key}","headers:{'x-pro-key':key,'x-shop-key':account}").replace("storage.getItem(proKey)?.trim()===key", "(storage.getItem(proKey)?.trim()||'')===key&&(storage.getItem('sellpostly-free-shop-key')||'')===account"));
