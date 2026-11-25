const fs=require('fs');const entries={
'Active Shop':{fr:'Boutique active',ar:'المتجر النشط'},
'Primary Personal Store':{fr:'Boutique personnelle principale',ar:'المتجر الشخصي الأساسي'},
'Primary Affiliate Deals Shop':{fr:'Boutique affiliée principale',ar:'متجر العروض بالعمولة الأساسي'},
'+ New Niche Shop':{fr:'+ Nouvelle boutique spécialisée',ar:'+ متجر متخصص جديد'},
'Create Niche Shop':{fr:'Créer une boutique spécialisée',ar:'إنشاء متجر متخصص'},
'Creating shop…':{fr:'Création de la boutique…',ar:'جارٍ إنشاء المتجر…'},
'Custom URL Slug':{fr:'Identifiant URL personnalisé',ar:'معرّف الرابط المخصص'},
'Niche Name':{fr:'Nom de la spécialité',ar:'اسم التخصص'},
'Niche Collection':{fr:'Collection spécialisée',ar:'تشكيلة متخصصة'},
'Pro includes up to 10 niche shops across both store types.':{fr:'Pro inclut jusqu’à 10 boutiques spécialisées, tous types confondus.',ar:'تتيح Pro إنشاء ما يصل إلى 10 متاجر متخصصة عبر كلا النوعين.'},
'Free includes one primary personal store and one primary affiliate shop. Upgrade to Pro for niche shops.':{fr:'L’offre gratuite inclut une boutique personnelle principale et une boutique affiliée principale. Passez à Pro pour les boutiques spécialisées.',ar:'تشمل الخطة المجانية متجرًا شخصيًا أساسيًا ومتجرًا أساسيًا للعروض بالعمولة. اختر Pro لإضافة متاجر متخصصة.'},
'A niche shop has its own catalog, settings and permanent public URL. Broad category tabs are hidden.':{fr:'Chaque boutique spécialisée possède son catalogue, ses réglages et son URL permanente. Les catégories générales sont masquées.',ar:'لكل متجر متخصص كتالوجه وإعداداته ورابطه العام الدائم. تُخفى تبويبات الفئات العامة.'},
'This URL slug is already taken.':{fr:'Cet identifiant URL est déjà utilisé.',ar:'معرّف الرابط هذا مستخدم بالفعل.'},
'The 10 niche shop limit has been reached.':{fr:'La limite de 10 boutiques spécialisées est atteinte.',ar:'تم بلوغ الحد الأقصى البالغ 10 متاجر متخصصة.'},
'Could not create the shop. Check your Pro license and try again.':{fr:'Création impossible. Vérifiez votre licence Pro et réessayez.',ar:'تعذر إنشاء المتجر. تحقق من ترخيص Pro وحاول مجددًا.'},
'Free Primary Stores':{fr:'Boutiques principales gratuites',ar:'المتاجر الأساسية المجانية'},
'Start Free Primary Stores':{fr:'Créer mes boutiques gratuites',ar:'ابدأ متاجرك الأساسية مجانًا'},
'Exact Target Shop':{fr:'Boutique de destination précise',ar:'المتجر المستهدف بالتحديد'},
'Primary store (selected type)':{fr:'Boutique principale (type sélectionné)',ar:'المتجر الأساسي (النوع المحدد)'},
'Sync My Shops':{fr:'Synchroniser mes boutiques',ar:'مزامنة متاجري'},
'Niche collection: category is assigned automatically.':{fr:'Collection spécialisée : catégorie attribuée automatiquement.',ar:'تشكيلة متخصصة: تُعيّن الفئة تلقائيًا.'},
'Shops synced. Choose your import destination.':{fr:'Boutiques synchronisées. Choisissez la destination de l’import.',ar:'تمت مزامنة المتاجر. اختر وجهة الاستيراد.'},
'Sign in to My Shop on the website, then sync again.':{fr:'Connectez-vous à Ma boutique sur le site, puis relancez la synchronisation.',ar:'سجّل الدخول إلى متجري على الموقع ثم أعد المزامنة.'}
};
let p='src/app/translations.ts',s=fs.readFileSync(p,'utf8');s=s.replace('export const translations = {','export const translations = {\n'+Object.entries(entries).map(([k,v])=>JSON.stringify(k)+':'+JSON.stringify(v)+',').join('\n'));fs.writeFileSync(p,s);
p='chrome-extension/popup.js';s=fs.readFileSync(p,'utf8').replace('const messages = {','const messages = {\n'+Object.entries(entries).map(([k,v])=>JSON.stringify(k)+':'+JSON.stringify(v)+',').join('\n')).replace('product:{unbrandedQuery:', 'product:{targetShopId:exactShopTarget()?.id,unbrandedQuery:');fs.writeFileSync(p,s);
