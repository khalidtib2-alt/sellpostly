"use strict";

const messages = {
"Active Shop":{"fr":"Boutique active","ar":"المتجر النشط"},
"Primary Personal Store":{"fr":"Boutique personnelle principale","ar":"المتجر الشخصي الأساسي"},
"Primary Affiliate Deals Shop":{"fr":"Boutique affiliée principale","ar":"متجر العروض بالعمولة الأساسي"},
"+ New Niche Shop":{"fr":"+ Nouvelle boutique spécialisée","ar":"+ متجر متخصص جديد"},
"Create Niche Shop":{"fr":"Créer une boutique spécialisée","ar":"إنشاء متجر متخصص"},
"Creating shop…":{"fr":"Création de la boutique…","ar":"جارٍ إنشاء المتجر…"},
"Custom URL Slug":{"fr":"Identifiant URL personnalisé","ar":"معرّف الرابط المخصص"},
"Niche Name":{"fr":"Nom de la spécialité","ar":"اسم التخصص"},
"Niche Collection":{"fr":"Collection spécialisée","ar":"تشكيلة متخصصة"},
"Pro includes up to 10 niche shops across both store types.":{"fr":"Pro inclut jusqu’à 10 boutiques spécialisées, tous types confondus.","ar":"تتيح Pro إنشاء ما يصل إلى 10 متاجر متخصصة عبر كلا النوعين."},
"Free includes one primary personal store and one primary affiliate shop. Upgrade to Pro for niche shops.":{"fr":"L’offre gratuite inclut une boutique personnelle principale et une boutique affiliée principale. Passez à Pro pour les boutiques spécialisées.","ar":"تشمل الخطة المجانية متجرًا شخصيًا أساسيًا ومتجرًا أساسيًا للعروض بالعمولة. اختر Pro لإضافة متاجر متخصصة."},
"A niche shop has its own catalog, settings and permanent public URL. Broad category tabs are hidden.":{"fr":"Chaque boutique spécialisée possède son catalogue, ses réglages et son URL permanente. Les catégories générales sont masquées.","ar":"لكل متجر متخصص كتالوجه وإعداداته ورابطه العام الدائم. تُخفى تبويبات الفئات العامة."},
"This URL slug is already taken.":{"fr":"Cet identifiant URL est déjà utilisé.","ar":"معرّف الرابط هذا مستخدم بالفعل."},
"The 10 niche shop limit has been reached.":{"fr":"La limite de 10 boutiques spécialisées est atteinte.","ar":"تم بلوغ الحد الأقصى البالغ 10 متاجر متخصصة."},
"Could not create the shop. Check your Pro license and try again.":{"fr":"Création impossible. Vérifiez votre licence Pro et réessayez.","ar":"تعذر إنشاء المتجر. تحقق من ترخيص Pro وحاول مجددًا."},
"Free Primary Stores":{"fr":"Boutiques principales gratuites","ar":"المتاجر الأساسية المجانية"},
"Start Free Primary Stores":{"fr":"Créer mes boutiques gratuites","ar":"ابدأ متاجرك الأساسية مجانًا"},
"Exact Target Shop":{"fr":"Boutique de destination précise","ar":"المتجر المستهدف بالتحديد"},
"Primary store (selected type)":{"fr":"Boutique principale (type sélectionné)","ar":"المتجر الأساسي (النوع المحدد)"},
"Sync My Shops":{"fr":"Synchroniser mes boutiques","ar":"مزامنة متاجري"},
"Niche collection: category is assigned automatically.":{"fr":"Collection spécialisée : catégorie attribuée automatiquement.","ar":"تشكيلة متخصصة: تُعيّن الفئة تلقائيًا."},
"Shops synced. Choose your import destination.":{"fr":"Boutiques synchronisées. Choisissez la destination de l’import.","ar":"تمت مزامنة المتاجر. اختر وجهة الاستيراد."},
"Sign in to My Shop on the website, then sync again.":{"fr":"Connectez-vous à Ma boutique sur le site, puis relancez la synchronisation.","ar":"سجّل الدخول إلى متجري على الموقع ثم أعد المزامنة."},
"Representative style photo":{"fr":"Photo de style représentative","ar":"صورة توضيحية للأسلوب"},
"Next Similar Photo":{"fr":"Photo similaire suivante","ar":"الصورة المشابهة التالية"},
"Finding photos…":{"fr":"Recherche de photos…","ar":"جارٍ البحث عن صور…"},
"Generic photo search":{"fr":"Recherche de photo générique","ar":"بحث عن صورة عامة"},
"Representative photos show a style, not the exact branded product. Upload your own photo for an exact match.":{"fr":"Ces photos illustrent un style, pas le produit de marque exact. Importez votre propre photo pour une correspondance exacte.","ar":"تُظهر هذه الصور أسلوبًا مشابهًا، وليس المنتج الأصلي بعلامته التجارية. ارفع صورتك لعرض المنتج نفسه."},
"Could not select this photo. Try another photo or upload your own.":{"fr":"Impossible de sélectionner cette photo. Essayez une autre photo ou importez la vôtre.","ar":"تعذّر اختيار هذه الصورة. جرّب صورة أخرى أو ارفع صورتك."},
"Use this photo":{"fr":"Utiliser cette photo","ar":"استخدم هذه الصورة"},
"Photo credit":{"fr":"Crédit photo","ar":"مصدر الصورة"},
"Photo license":{"fr":"Licence photo","ar":"ترخيص الصورة"},
"Amazon image blocked. My Shop will match a representative photo automatically.":{"fr":"Image Amazon bloquée. Ma boutique sélectionnera automatiquement une photo représentative.","ar":"تم حظر صورة أمازون. سيختار متجري صورة توضيحية مناسبة تلقائيًا."},
"Amazon listing images cannot be hotlinked directly-upload your own review photo, use a brand press-kit image, or keep a representative style photo.":{"fr":"Les images Amazon ne peuvent pas être utilisées par lien direct. Importez votre photo, une image de presse autorisée ou conservez une photo représentative.","ar":"لا يمكن ربط صور منتجات أمازون مباشرة. ارفع صورتك أو صورة صحفية مرخّصة، أو احتفظ بصورة توضيحية مشابهة."},
"men running shoes":{"fr":"Chaussures de course pour hommes","ar":"أحذية جري رجالية"},
"women shoes":{"fr":"Chaussures pour femmes","ar":"أحذية نسائية"},
"kids sneakers":{"fr":"Baskets pour enfants","ar":"أحذية رياضية للأطفال"},
"wireless headphones":{"fr":"Casque sans fil","ar":"سماعات لاسلكية"},
"wireless noise cancelling headphones":{"fr":"Casque sans fil à réduction de bruit","ar":"سماعات لاسلكية بعزل الضوضاء"},
"smartwatch":{"fr":"Montre connectée","ar":"ساعة ذكية"},
"coffee kitchen":{"fr":"Café et cuisine","ar":"القهوة والمطبخ"},
"fitness equipment":{"fr":"Équipement de fitness","ar":"معدات اللياقة"},
"skincare beauty":{"fr":"Beauté et soins de la peau","ar":"الجمال والعناية بالبشرة"},
"office technology":{"fr":"Équipement de bureau","ar":"تقنيات المكتب"},
"travel bag":{"fr":"Sac de voyage","ar":"حقيبة سفر"},
"Amazon listing images cannot be hotlinked directly—upload your own review photo, use a brand press-kit image, or keep this studio illustration.":{"fr":"Les images des fiches Amazon ne peuvent pas être utilisées par lien direct : importez votre propre photo de test, utilisez une image du dossier de presse de la marque ou conservez cette illustration de studio.","ar":"لا يمكن ربط صور إعلانات أمازون مباشرةً — ارفع صورة مراجعة التقطتها بنفسك، أو استخدم صورة من الملف الإعلامي للعلامة التجارية، أو احتفظ بهذا الرسم التوضيحي."},
"Stock (Optional)":{"fr":"Stock (facultatif)","ar":"المخزون (اختياري)"},
"Affiliate Deals Shop":{"fr":"Boutique de bonnes affaires affiliées","ar":"متجر العروض بالعمولة"},
"Personal Seller Shop":{"fr":"Boutique personnelle du vendeur","ar":"متجر البائع الشخصي"},
"Destination Store":{"fr":"Boutique de destination","ar":"المتجر المستهدف"},
"Affiliate tags are kept for deals. Personal products use your seller checkout.":{"fr":"Les liens affiliés conservent leurs paramètres. Les produits personnels utilisent votre paiement vendeur.","ar":"تُحفظ وسوم روابط العمولة للعروض. تستخدم المنتجات الشخصية طرق الدفع الخاصة بمتجرك."},
  "Could not load or save email preferences.": {
    "fr": "Impossible de charger ou d’enregistrer les préférences e-mail.",
    "ar": "تعذّر تحميل تفضيلات البريد أو حفظها."
  },
  "Email preferences saved.": {
    "fr": "Préférences e-mail enregistrées.",
    "ar": "تم حفظ تفضيلات البريد."
  },
  "Save Email Preferences": {
    "fr": "Enregistrer les préférences e-mail",
    "ar": "حفظ تفضيلات البريد"
  },
  "Payout updates use this private email and your current language. Leave blank to disable seller emails.": {
    "fr": "Les mises à jour des retraits utilisent cet e-mail privé et votre langue actuelle. Laissez vide pour désactiver les e-mails vendeur.",
    "ar": "تُرسل تحديثات السحب إلى هذا البريد الخاص بلغتك الحالية. اتركه فارغاً لتعطيل رسائل البائع."
  },
  "Seller Notification Email": {
    "fr": "E-mail de notification du vendeur",
    "ar": "البريد الإلكتروني لإشعارات البائع"
  },
  "WhatsApp Phone (Optional)": {
    "fr": "Téléphone WhatsApp (facultatif)",
    "ar": "رقم واتساب (اختياري)"
  },
  "A buyer international phone number is needed for WhatsApp replies.": {
    "fr": "Un numéro de téléphone international de l’acheteur est nécessaire pour les réponses WhatsApp.",
    "ar": "يلزم رقم هاتف المشتري بالصيغة الدولية للرد عبر واتساب."
  },
  "Delivery Follow-Up": {
    "fr": "Suivi de la livraison",
    "ar": "متابعة التسليم"
  },
  "Digital Key / Tracking Delivered": {
    "fr": "Clé numérique / suivi envoyé",
    "ar": "تم إرسال المفتاح الرقمي أو التتبع"
  },
  "Order Confirmed": {
    "fr": "Commande confirmée",
    "ar": "تم تأكيد الطلب"
  },
  "WhatsApp Quick Replies": {
    "fr": "Réponses rapides WhatsApp",
    "ar": "ردود واتساب السريعة"
  },
  "Gender / Target Audience": {
    "fr": "Genre / public cible",
    "ar": "الجنس أو الجمهور المستهدف"
  },
  "Sport": {
    "fr": "Sport",
    "ar": "رياضة"
  },
  "Art": {
    "fr": "Art",
    "ar": "فن"
  },
  "Digital Product": {
    "fr": "Produit numérique",
    "ar": "منتج رقمي"
  },
  "Kids": {
    "fr": "Enfants",
    "ar": "الأطفال"
  },
  "Send to My Shop (Pro)": {
    "fr": "Envoyer vers ma boutique (Pro)",
    "ar": "إرسال إلى متجري (Pro)"
  },
  "Sending to My Shop…": {
    "fr": "Envoi vers ma boutique…",
    "ar": "جارٍ الإرسال إلى متجري…"
  },
  "Enter a product name or import the current page first.": {
    "fr": "Saisissez un nom de produit ou importez d’abord la page actuelle.",
    "ar": "أدخل اسم المنتج أو استورد الصفحة الحالية أولًا."
  },
  "Opening My Shop. Activate Pro on the website if requested.": {
    "fr": "Ouverture de Ma boutique. Activez Pro sur le site si nécessaire.",
    "ar": "جارٍ فتح متجري. فعّل Pro على الموقع إذا طُلب ذلك."
  },
  "Could not open My Shop. Reload the extension and try again.": {
    "fr": "Impossible d’ouvrir Ma boutique. Rechargez l’extension et réessayez.",
    "ar": "تعذر فتح متجري. أعد تحميل الإضافة وحاول مجددًا."
  },
  "Promo image copied! Press Ctrl+V in Facebook, then click Copy Text for your caption": {
    "fr": "Image promotionnelle copiée ! Collez-la dans Facebook avec Ctrl+V, puis cliquez sur Copier le texte pour la légende.",
    "ar": "تم نسخ الصورة الترويجية! اضغط Ctrl+V في فيسبوك، ثم اضغط نسخ النص للحصول على التعليق."
  },
  "Shop Category": {
    "fr": "Catégorie de boutique",
    "ar": "فئة المتجر"
  },
  "Gender / Audience": {
    "fr": "Genre / Public",
    "ar": "الجنس أو الجمهور"
  },
  "All / Unisex": {
    "fr": "Tous / Mixte",
    "ar": "الكل / للجنسين"
  },
  "Men": {
    "fr": "Hommes",
    "ar": "الرجال"
  },
  "Women": {
    "fr": "Femmes",
    "ar": "النساء"
  },
  "Unisex": {
    "fr": "Mixte",
    "ar": "للجميع"
  },
  "Edit Product": {
    "fr": "Modifier le produit",
    "ar": "تعديل المنتج"
  },
  "Category": {
    "fr": "Catégorie",
    "ar": "الفئة"
  },
  "Tech & Gadgets": {
    "fr": "Tech et gadgets",
    "ar": "التقنية والأجهزة"
  },
  "Fashion": {
    "fr": "Mode",
    "ar": "الأزياء"
  },
  "Home & Kitchen": {
    "fr": "Maison et cuisine",
    "ar": "المنزل والمطبخ"
  },
  "Beauty": {
    "fr": "Beauté",
    "ar": "الجمال"
  },
  "Fitness": {
    "fr": "Fitness",
    "ar": "اللياقة البدنية"
  },
  "Top Deals": {
    "fr": "Meilleures offres",
    "ar": "أفضل العروض"
  },
  "Other": {
    "fr": "Autre",
    "ar": "أخرى"
  },
  "Open Full Studio": {
    "fr": "Ouvrir le studio complet",
    "ar": "فتح الاستوديو الكامل"
  },
  "Website": {
    "fr": "Site web",
    "ar": "Ø§Ù„Ù…ÙˆÙ‚Ø¹"
  },
  "Prompt Generator": {
    "fr": "GÃ©nÃ©rateur de prompts",
    "ar": "Ù…ÙˆÙ„Ù‘Ø¯ Ø§Ù„ØªØ¹Ù„ÙŠÙ…Ø§Øª"
  },
  "Seller Guides": {
    "fr": "Guides pour les vendeurs",
    "ar": "Ø£Ø¯Ù„Ø© Ø§Ù„Ø¨Ø§Ø¦Ø¹ÙŠÙ†"
  },
  "Text & Image copied! Paste (Ctrl+V) directly into your post or chat.": {
    "fr": "Texte et image copiÃ©s ! Collez-les (Ctrl+V) dans votre publication ou conversation.",
    "ar": "ØªÙ… Ù†Ø³Ø® Ø§Ù„Ù†Øµ ÙˆØ§Ù„ØµÙˆØ±Ø©! Ø§Ù„ØµÙ‚ (Ctrl+V) ÙÙŠ Ø§Ù„Ù…Ù†Ø´ÙˆØ± Ø£Ùˆ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø©."
  },
  "Upload or import a product photo first.": {
    "fr": "Importez dâ€™abord une photo produit.",
    "ar": "Ø§Ø±ÙØ¹ Ø£Ùˆ Ø§Ø³ØªÙˆØ±Ø¯ ØµÙˆØ±Ø© Ø§Ù„Ù…Ù†ØªØ¬ Ø£ÙˆÙ„Ù‹Ø§."
  },
  "Please paste a specific product page URL (not a store homepage), or use the SellPostly Chrome Extension on the product page.": {
    "fr": "Collez lâ€™URL dâ€™une fiche produit prÃ©cise, ou utilisez lâ€™extension Chrome SellPostly sur cette fiche.",
    "ar": "Ø§Ù„ØµÙ‚ Ø±Ø§Ø¨Ø· ØµÙØ­Ø© Ù…Ù†ØªØ¬ Ù…Ø­Ø¯Ø¯ Ø¨Ø¯Ù„ Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© Ù„Ù„Ù…ØªØ¬Ø±ØŒ Ø£Ùˆ Ø§Ø³ØªØ®Ø¯Ù… Ø¥Ø¶Ø§ÙØ© SellPostly Ø¹Ù„Ù‰ ØµÙØ­Ø© Ø§Ù„Ù…Ù†ØªØ¬."
  },
  "Image copied! Press Ctrl+V in chat to attach the photo.": {
    "fr": "Image copiÃ©e ! Appuyez sur Ctrl+V dans la conversation pour joindre la photo.",
    "ar": "ØªÙ… Ù†Ø³Ø® Ø§Ù„ØµÙˆØ±Ø©! Ø§Ø¶ØºØ· Ctrl+V ÙÙŠ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø© Ù„Ø¥Ø±ÙØ§Ù‚Ù‡Ø§."
  },
  "Send Text": {
    "fr": "Envoyer le texte",
    "ar": "Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù†Øµ"
  },
  "Send Image + Text": {
    "fr": "Envoyer lâ€™image et le texte",
    "ar": "Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØµÙˆØ±Ø© ÙˆØ§Ù„Ù†Øµ"
  },
  "Image downloaded. Attach it and paste the caption.": {
    "fr": "Image tÃ©lÃ©chargÃ©e. Joignez-la et collez la lÃ©gende.",
    "ar": "ØªÙ… ØªÙ†Ø²ÙŠÙ„ Ø§Ù„ØµÙˆØ±Ø©. Ø£Ø±ÙÙ‚Ù‡Ø§ ÙˆØ§Ù„ØµÙ‚ Ø§Ù„Ù†Øµ."
  },
  "Sharing failed. Copy the text or download the image.": {
    "fr": "Ã‰chec du partage. Copiez le texte ou tÃ©lÃ©chargez lâ€™image.",
    "ar": "ØªØ¹Ø°Ù‘Ø±Øª Ø§Ù„Ù…Ø´Ø§Ø±ÙƒØ©. Ø§Ù†Ø³Ø® Ø§Ù„Ù†Øµ Ø£Ùˆ Ù†Ø²Ù‘Ù„ Ø§Ù„ØµÙˆØ±Ø©."
  },
  "Delivery": {
    "fr": "Livraison",
    "ar": "Ø§Ù„ØªÙˆØµÙŠÙ„"
  },
  "Reply *ORDER* now to claim yours!": {
    "fr": "RÃ©pondez *COMMANDER* pour passer commande !",
    "ar": "Ø£Ø±Ø³Ù„ *Ø·Ù„Ø¨* Ø§Ù„Ø¢Ù† Ù„Ø·Ù„Ø¨ Ù…Ù†ØªØ¬Ùƒ!"
  },
  "Import From Current Page": {
    "fr": "Importer depuis cette page",
    "ar": "Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ù…Ù† Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©"
  },
  "Page imported. Review the details.": {
    "fr": "Page importÃ©e. VÃ©rifiez les dÃ©tails.",
    "ar": "ØªÙ… Ø§Ù„Ø§Ø³ØªÙŠØ±Ø§Ø¯. Ø±Ø§Ø¬Ø¹ Ø§Ù„ØªÙØ§ØµÙŠÙ„."
  },
  "Could not read this page. Open a product page and try again.": {
    "fr": "Lecture impossible. Ouvrez une page produit et rÃ©essayez.",
    "ar": "ØªØ¹Ø°Ù‘Ø±Øª Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„ØµÙØ­Ø©. Ø§ÙØªØ­ ØµÙØ­Ø© Ù…Ù†ØªØ¬ ÙˆØ­Ø§ÙˆÙ„ Ù…Ø¬Ø¯Ø¯Ù‹Ø§."
  },
  "Formatting mode": {
    "fr": "Mode de mise en forme",
    "ar": "ÙˆØ¶Ø¹ Ø§Ù„ØªÙ†Ø³ÙŠÙ‚"
  },
  "Seller Mode": {
    "fr": "Mode Vendeur",
    "ar": "ÙˆØ¶Ø¹ Ø§Ù„Ø¨Ø§Ø¦Ø¹"
  },
  "Creator Mode": {
    "fr": "Mode CrÃ©ateur",
    "ar": "ÙˆØ¶Ø¹ ØµØ§Ù†Ø¹ Ø§Ù„Ù…Ø­ØªÙˆÙ‰"
  },
  "Product Name": {
    "fr": "Nom du produit",
    "ar": "Ø§Ø³Ù… Ø§Ù„Ù…Ù†ØªØ¬"
  },
  "Price": {
    "fr": "Prix",
    "ar": "Ø§Ù„Ø³Ø¹Ø±"
  },
  "$29": {
    "fr": "29 â‚¬",
    "ar": "29 Ø¯Ø±Ù‡Ù…Ù‹Ø§"
  },
  "Delivery / Location": {
    "fr": "Livraison / lieu de retrait",
    "ar": "Ø§Ù„ØªÙˆØµÙŠÙ„ Ø£Ùˆ Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…"
  },
  "Key Features": {
    "fr": "CaractÃ©ristiques principales",
    "ar": "Ø£Ù‡Ù… Ø§Ù„Ù…ÙŠØ²Ø§Øª"
  },
  "One feature per line": {
    "fr": "Une caractÃ©ristique par ligne",
    "ar": "Ù…ÙŠØ²Ø© ÙˆØ§Ø­Ø¯Ø© ÙÙŠ ÙƒÙ„ Ø³Ø·Ø±"
  },
  "Format Posts": {
    "fr": "Formater les publications",
    "ar": "Ù†Ø³Ù‘Ù‚ Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª"
  },
  "Quick Post": {
    "fr": "Texte de dÃ©part",
    "ar": "Ù†Øµ Ø§Ù„Ù…Ù†Ø´ÙˆØ±"
  },
  "Paste your post or hook": {
    "fr": "Collez votre texte ou votre accroche",
    "ar": "Ø§Ù„ØµÙ‚ Ù…Ù†Ø´ÙˆØ±Ùƒ Ø£Ùˆ Ø¹Ø¨Ø§Ø±ØªÙƒ Ø§Ù„Ø§ÙØªØªØ§Ø­ÙŠØ©"
  },
  "Formatted posts": {
    "fr": "Publications mises en forme",
    "ar": "Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª Ø§Ù„Ù…Ù†Ø³Ù‘Ù‚Ø©"
  },
  "Platforms": {
    "fr": "Plateformes",
    "ar": "Ø§Ù„Ù…Ù†ØµØ§Øª"
  },
  "Web Formatter": {
    "fr": "Outil web de mise en forme",
    "ar": "Ù…Ù†Ø³Ù‘Ù‚ Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª Ø¹Ù„Ù‰ Ø§Ù„ÙˆÙŠØ¨"
  },
  "Seller Resources": {
    "fr": "Ressources pour les vendeurs",
    "ar": "Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø§Ø¦Ø¹ÙŠÙ†"
  },
  "Language": {
    "fr": "Langue",
    "ar": "Ø§Ù„Ù„ØºØ©"
  },
  "Delivery / pickup": {
    "fr": "Livraison / retrait",
    "ar": "Ø§Ù„ØªÙˆØµÙŠÙ„ Ø£Ùˆ Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…"
  },
  "Message to order.": {
    "fr": "Envoyez un message pour commander.",
    "ar": "Ø±Ø§Ø³Ù„Ù†Ø§ Ù„Ù„Ø·Ù„Ø¨."
  },
  "Meet": {
    "fr": "DÃ©couvrez",
    "ar": "ØªØ¹Ø±Ù‘Ù Ø¹Ù„Ù‰"
  },
  "Product": {
    "fr": "Produit",
    "ar": "Ø§Ù„Ù…Ù†ØªØ¬"
  },
  "Features": {
    "fr": "CaractÃ©ristiques",
    "ar": "Ø§Ù„Ù…ÙŠØ²Ø§Øª"
  },
  "#ProductFinds #ShopNow": {
    "fr": "#BellesTrouvailles #AcheterEnLigne",
    "ar": "#Ù…Ù†ØªØ¬Ø§Øª_Ù…Ø®ØªØ§Ø±Ø© #ØªØ³ÙˆÙ‚_Ø§Ù„Ø¢Ù†"
  },
  "What has worked for you?": {
    "fr": "Quâ€™est-ce qui a fonctionnÃ© pour vous ?",
    "ar": "Ù…Ø§ Ø§Ù„Ø°ÙŠ Ù†Ø¬Ø­ Ù…Ø¹ÙƒÙ…ØŸ"
  },
  "Your take?": {
    "fr": "Votre avis ?",
    "ar": "Ù…Ø§ Ø±Ø£ÙŠÙƒÙ…ØŸ"
  },
  "Share your experience below.": {
    "fr": "Partagez votre expÃ©rience en commentaire.",
    "ar": "Ø´Ø§Ø±ÙƒÙˆÙ†Ø§ ØªØ¬Ø§Ø±Ø¨ÙƒÙ… ÙÙŠ Ø§Ù„ØªØ¹Ù„ÙŠÙ‚Ø§Øª."
  },
  "formatted post": {
    "fr": "publication mise en forme",
    "ar": "Ù…Ù†Ø´ÙˆØ± Ù…Ù†Ø³Ù‘Ù‚"
  },
  "Copy": {
    "fr": "Copier",
    "ar": "Ù†Ø³Ø®"
  },
  "Copied!": {
    "fr": "CopiÃ© !",
    "ar": "ØªÙ… Ø§Ù„Ù†Ø³Ø®!"
  },
  "Text selected. Press Ctrl+C or Command+C to copy.": {
    "fr": "Texte sÃ©lectionnÃ©. Appuyez sur Ctrl+C ou Cmd+C pour le copier.",
    "ar": "ØªÙ… ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù†Øµ. Ø§Ø¶ØºØ· Ctrl+C Ø£Ùˆ Cmd+C Ù„Ù†Ø³Ø®Ù‡."
  },
  "Posts formatted.": {
    "fr": "Publications mises en forme.",
    "ar": "ØªÙ… ØªÙ†Ø³ÙŠÙ‚ Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª."
  },
  "Enter a product name.": {
    "fr": "Saisissez un nom de produit.",
    "ar": "Ø£Ø¯Ø®Ù„ Ø§Ø³Ù… Ø§Ù„Ù…Ù†ØªØ¬."
  },
  "Enter a post.": {
    "fr": "Saisissez un texte.",
    "ar": "Ø£Ø¯Ø®Ù„ Ù†Øµ Ø§Ù„Ù…Ù†Ø´ÙˆØ±."
  },
  "Wireless headphones": {
    "fr": "Casque sans fil",
    "ar": "Ø³Ù…Ø§Ø¹Ø§Øª Ù„Ø§Ø³Ù„ÙƒÙŠØ©"
  },
  "Local pickup or shipping": {
    "fr": "Retrait sur place ou livraison",
    "ar": "Ø§Ø³ØªÙ„Ø§Ù… Ù…Ø­Ù„ÙŠ Ø£Ùˆ ØªÙˆØµÙŠÙ„"
  }
};
const languageKey = "sellpostly-language";
let language = "en";
let lastRequest = null;
const t = (message) => messages[message]?.[language] ?? message;

function applyLanguage(next) {
  language = next;
  if(globalThis.sellpostlySyncedShops)renderSyncedShops(globalThis.sellpostlySyncedShops);
  document.documentElement.lang = next;
  document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  for (const item of document.querySelectorAll("[data-message]")) item.textContent = t(item.dataset.message);
  for (const item of document.querySelectorAll("[data-placeholder]")) item.placeholder = t(item.dataset.placeholder);
  for (const item of document.querySelectorAll("[data-label]")) item.setAttribute("aria-label", t(item.dataset.label));
  for (const button of document.querySelectorAll("[data-language]")) {
    button.setAttribute("aria-pressed", String(button.dataset.language === next));
  }
  if (lastRequest) {
    const active = [...tabs.children].findIndex(tab => tab.getAttribute("aria-selected") === "true");
    renderPosts(lastRequest.seller ? sellerPosts(lastRequest.data) : creatorPosts(lastRequest.value), Math.max(0, active));
  } else {
    feedback.textContent = "";
  }
}


const feedback = document.querySelector("#status");
const results = document.querySelector("#results");
const tabs = document.querySelector("#tabs");
const panels = document.querySelector("#panels");
const modes = [...document.querySelectorAll("[data-mode]")];

const lines = (...parts) => parts.filter(Boolean).join("\n");

function sellerPosts(data) {
  const read = (field) => String(data.get(field) ?? "").trim();
  const name = read("name");
  const price = read("price");
  const delivery = read("delivery");
  const features = featureLines(read("features"));
  const bullets = features.map(feature => "âœ… " + feature).join("\n");
  const location = delivery && t("Delivery / pickup") + ": " + delivery;
  const cta = "ðŸ‘‰ " + t("Reply *ORDER* now to claim yours!");
  return [
    ["WhatsApp Business", lines("*" + name + "*", price && "ðŸ’° *" + t("Price") + ":* " + price, delivery && "ðŸšš *" + t("Delivery") + ":* " + delivery) + "\n\n" + bullets + "\n\n" + cta],
    ["Instagram", [features[0] ? name + " â€” " + features[0] : t("Meet") + " " + name, lines(price, location, bullets), cta, t("#ProductFinds #ShopNow")].filter(Boolean).join("\n\n")],
    ["Facebook Marketplace", lines(t("Product") + ": " + name, price && t("Price") + ": " + price, location, bullets && t("Features") + ":\n" + bullets, cta)],
    ["TikTok", lines([name, features[0], price].filter(Boolean).join(" Â· "), cta + " " + t("#ProductFinds #ShopNow"))],
  ];
}

function creatorPosts(post) {
  const compact = post.replace(/\s+/g, " ");
  const shorten = (limit, cta) => {
    limit -= Array.from(cta).length + 2;
    const characters = Array.from(compact);
    const text = characters.length > limit ? characters.slice(0, limit - 1).join("").trimEnd() + "â€¦" : compact;
    return text + "\n\n" + cta;
  };
  return [
    ["LinkedIn", post.split(/\n+/).map((line) => line.trim()).filter(Boolean).join("\n\n") + "\n\n" + t("What has worked for you?")],
    ["X", shorten(140, t("Your take?"))],
    ["Threads", shorten(500, t("Share your experience below."))],
  ];
}

function selectTab(index, focus = false) {
  [...tabs.children].forEach((tab, position) => {
    const selected = position === index;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    panels.children[position].hidden = !selected;
    if (selected && focus) tab.focus();
  });
  feedback.textContent = "";
}

function renderPosts(posts, active = 0) {
  tabs.replaceChildren();
  panels.replaceChildren();
  posts.forEach(([platform, post], index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.id = "tab-" + index;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "post-" + index);
    tab.textContent = platform;
    tab.addEventListener("click", () => selectTab(index));
    tab.addEventListener("keydown", (event) => {
      const targets = { ArrowLeft: (index + posts.length + (language === "ar" ? 1 : -1)) % posts.length, ArrowRight: (index + posts.length + (language === "ar" ? -1 : 1)) % posts.length, Home: 0, End: posts.length - 1 };
      if (!Object.hasOwn(targets, event.key)) return;
      event.preventDefault();
      selectTab(targets[event.key], true);
    });
    tabs.append(tab);

    const panel = document.createElement("div");
    panel.id = "post-" + index;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    const output = document.createElement("textarea");
    output.readOnly = true;
    output.dir = "auto";
    output.rows = 5;
    output.value = post;
    output.setAttribute("aria-label", platform + " Â· " + t("formatted post"));
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "primary";
    copy.textContent = t("Copy");
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(post);
        feedback.textContent = t("Copied!");
      } catch {
        output.select();
        feedback.textContent = t("Text selected. Press Ctrl+C or Command+C to copy.");
      }
    });

    const sendText = document.createElement("button");
    sendText.type="button";sendText.textContent=t("Send Text");
    sendText.addEventListener("click",()=>sendPost(platform,post,false));
    const sendImage = document.createElement("button");
    sendImage.type="button";sendImage.className="primary";sendImage.textContent=t("Send Image + Text");
    sendImage.addEventListener("click",()=>sendPost(platform,post,true));
    const actions=document.createElement("div");actions.className="send-actions";actions.append(copy,sendText,sendImage);
    panel.append(output,actions);
    panels.append(panel);
  });
  results.hidden = false;
  selectTab(active);
  feedback.textContent = posts.length + " Â· " + t("Posts formatted.");
}

for (const button of modes) {
  button.addEventListener("click", () => {
    if (button.getAttribute("aria-pressed") === "true") return;
    for (const mode of modes) {
      const active = mode === button;
      mode.setAttribute("aria-pressed", String(active));
      document.getElementById(mode.dataset.mode).hidden = !active;
    }
    lastRequest = null;
    results.hidden = true;
    feedback.textContent = "";
  });
  const form = document.getElementById(button.dataset.mode);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const seller = form.id === "seller";
    const data = new FormData(form);
    const value = String(data.get(seller ? "name" : "post") ?? "").trim();
    if (!value) {
      feedback.textContent = seller ? t("Enter a product name.") : t("Enter a post.");
      return;
    }
    lastRequest = { seller, data, value };
    renderPosts(seller ? sellerPosts(data) : creatorPosts(value));
  });
}

let savedLanguage;
try {
  savedLanguage = localStorage.getItem(languageKey);
} catch {
  // The switcher can still be used for this session.
}
applyLanguage(savedLanguage === "fr" || savedLanguage === "ar" ? savedLanguage : "en");
for (const button of document.querySelectorAll("[data-language]")) {
  button.addEventListener("click", () => {
    const next = button.dataset.language;
    applyLanguage(next);
    try {
      localStorage.setItem(languageKey, next);
    } catch {
      // Keep the selection for the current popup.
    }
  });
}

async function importCurrentProduct(preserveEdits=false) {
  const button = document.querySelector("#import-page");
  button.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:/.test(tab.url || "")) throw Error();
    const [execution] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const text = (selector) => {
          const element = document.querySelector(selector);
          return (element?.getAttribute("content") || element?.textContent || "").replace(/\s+/g, " ").trim();
        };
        function findProduct(value, depth = 0) {
          if (!value || typeof value !== "object" || depth > 12) return;
          if (Array.isArray(value)) {
            for (const child of value) { const found = findProduct(child, depth + 1); if (found) return found; }
          } else {
            if ([value["@type"]].flat().includes("Product")) return value;
            for (const child of Object.values(value)) { const found = findProduct(child, depth + 1); if (found) return found; }
          }
        }
        let product;
        for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
          try { product = findProduct(JSON.parse(script.textContent)); if (product) break; } catch {}
        }

        const offer = [product?.offers].flat()[0];
        const schemaPrice = offer?.price ?? offer?.lowPrice;
        let price = schemaPrice != null ? String(schemaPrice) + " " + (offer.priceCurrency || "") : "";
        for (const selector of ['[itemprop="price"]', ".a-price .a-offscreen", ".price-item", '[data-testid*="price"]']) {
          if (!price) price = text(selector);
        }
        if (!price) {
          const pattern = /(?:[$â‚¬Â£]|MAD|AED|SAR)\s*\d[\d.,]*(?:\s*\d{3})*(?:[.,]\d{2})?/i;
          for (const element of [...document.querySelectorAll("span,p,strong,b")].slice(0,6000)) {
            if (!element.getClientRects().length || getComputedStyle(element).visibility === "hidden") continue;
            const value = (element.textContent || "").trim();
            if (value.length > 100) continue;
            const match = value.match(pattern);
            if (match) { price = match[0]; break; }
          }
        }
        const bullets = [...document.querySelectorAll("#feature-bullets li")].map(item => item.textContent.replace(/\s+/g," ").trim()).filter(Boolean);
        const description = bullets.length ? bullets : [
          text('[data-testid*="description"]') || text(".product__description") ||
          text('meta[property="og:description"]') || text('meta[name="description"]')
        ];
        const image = document.querySelector('meta[property="og:image"]')?.content ||
          document.querySelector("#landingImage, .product__media img, [itemprop=image]")?.src || "";
        return {
          name: (text('meta[property="og:title"]') || text("#productTitle") || text("h1")).slice(0,120),
          price: price.trim().slice(0,35),
          features: description.filter(Boolean).flatMap(line=>line.split(/(?<=[.!?])\s+/)).filter(line=>!/^about this item$/i.test(line) && !/our wide selection|free shipping and free returns|buy .+ at amazon\.com/i.test(line)).slice(0,4).join("\n").slice(0,1200),
          image: (()=>{if(!image)return "";try{const url=new URL(image,location.href);return /^https?:$/.test(url.protocol)?url.href:"";}catch{return "";}})()
        };
      }
    });
    const product = execution?.result;
    if (!product?.name) throw Error();
    const form = document.querySelector("#seller");
    for (const key of ["name", "price", "features"]) {const field=form.elements.namedItem(key);if(!preserveEdits||!field.value.trim())field.value = product[key] || "";}
    const preview = document.querySelector("#imported-image");
    preview.hidden = !product.image;
    preview.onerror = () => { preview.hidden = true; };
    if(product.image){preview.dataset.rawImage=product.image;refreshAffiliateImageGuard();}
    else if(!preserveEdits){preview.removeAttribute("src");delete preview.dataset.rawImage;delete preview.dataset.shopImage;refreshAffiliateImageGuard();}
    lastRequest = null;
    results.hidden = true;
    feedback.textContent = t("Page imported. Review the details.");
    return {...product,url:tab.url};
  } catch {
    feedback.textContent = t("Could not read this page. Open a product page and try again.");
  } finally {
    button.disabled = false;
  }
}
document.querySelector("#import-page").addEventListener("click",()=>importCurrentProduct());

function featureLines(value) {
  return String(value).replace(/\*\*/g,"").split(/\n+|(?<=[.!?])\s+/)
    .map(line=>line.replace(/^[-â€¢âœ…\s]+/u,"").trim())
    .filter(line=>line && !/^about this item$/i.test(line) && !/our wide selection|free shipping and free returns|buy .+ at amazon\.com/i.test(line))
    .flatMap(line=>line.match(/.{1,100}(?:\s|$)|.{1,100}/g)||[]).map(line=>line.trim()).slice(0,4);
}

function shareUrl(platform, post) {
  const text=encodeURIComponent(post);
  if(platform==="WhatsApp Business")return whatsappUrl(post);
  if(platform==="X")return "https://twitter.com/intent/tweet?text="+text;
  if(platform==="Threads")return "https://threads.net/intent/post?text="+text;
  if(platform==="Pinterest")return "https://pinterest.com/pin/create/button/?description="+text;
  return {"Instagram":"https://instagram.com/","Facebook Marketplace":"https://facebook.com","TikTok":"https://tiktok.com/","LinkedIn":"https://linkedin.com/"}[platform];
}
async function sendPost(platform,post,withImage) {
  const preview=document.querySelector("#imported-image");
  if(withImage && (!preview || preview.hidden || !preview.complete || !preview.naturalWidth)) {
    feedback.textContent=t("Upload or import a product photo first.");return;
  }

  try {
    await navigator.clipboard.writeText(post);
    if(withImage) {
      const blobPromise=new Promise((resolve,reject)=>{
        const image=new Image();image.crossOrigin="anonymous";
        image.onload=()=>{
          try {
            const scale=Math.min(1,2048/Math.max(image.width,image.height));
            const canvas=document.createElement("canvas");canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);
            canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);
            canvas.toBlob(blob=>blob?resolve(blob):reject(Error()),"image/png");
          } catch(error){reject(error);}
        };
        image.onerror=()=>reject(Error());image.src=preview.src;
      });
      const blob=await blobPromise;

      const file=new File([blob],"sellpostly-promo.png",{type:"image/png"});
      if(navigator.canShare?.({files:[file]})){
        try{await navigator.share({files:[file],text:post});}
        catch(error){if(!(error instanceof DOMException && error.name==="AbortError"))throw error;}
        return;
      }
      const download=()=>{
        const url=URL.createObjectURL(blob),link=document.createElement("a");
        link.href=url;link.download="sellpostly-promo.png";link.click();
        setTimeout(()=>URL.revokeObjectURL(url),10000);
      };
      if(["Instagram","TikTok","Pinterest"].includes(platform)){
        download();await navigator.clipboard.writeText(post);
        setSendStatus("Image downloaded. Attach it and paste the caption.");
      }else{
        try{
          await navigator.clipboard.write([new ClipboardItem({"image/png":blob})]);
          setSendStatus(platform==="Facebook Marketplace"?"Promo image copied! Press Ctrl+V in Facebook, then click Copy Text for your caption":"Image copied! Press Ctrl+V in chat to attach the photo.");
        }catch{
          download();await navigator.clipboard.writeText(post);
          setSendStatus("Image downloaded. Attach it and paste the caption.");
        }
      }

    } else {await navigator.clipboard.writeText(post);feedback.textContent=t("Copied!");}

    window.open(shareUrl(platform,post),"_blank","noopener,noreferrer");
  } catch {feedback.textContent=t("Sharing failed. Copy the text or download the image.");}
}




document.querySelector("#open-studio").addEventListener("click",async()=>{
  const form=document.querySelector("#seller");
  const data=new FormData(form);
  const preview=document.querySelector("#imported-image");
  let link="";
  try {
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    if(/^https?:/.test(tab?.url||""))link=tab.url;
  }catch{}
  const base=await globalThis.SellPostlyFrontend.resolve();
  const query=new URLSearchParams({
    title:String(data.get("name")||""),
    price:String(data.get("price")||""),
    delivery:String(data.get("delivery")||""),
    features:String(data.get("features")||""),
    image:preview&&!preview.hidden?(preview.dataset.shopImage?new URL(preview.dataset.shopImage,base).href:preview.src):"",
    link
  });
  chrome.tabs.create({url:base+"/?"+query+"#formatter"});
});



function whatsappUrl(message) {
  let preview=message.slice(0,800).replace(/[\uD800-\uDBFF]$/,"").trimEnd();
  if(message.length>800) {
    const boundary=preview.search(/\s+\S*$/u);
    if(boundary>0)preview=preview.slice(0,boundary).trimEnd();
  }
  return "https://wa.me/?text="+encodeURIComponent(preview);
}

function setSendStatus(message){feedback.textContent=t(message);}

document.querySelector("#send-shop").addEventListener("click",async()=>{
 const button=document.querySelector("#send-shop");
 if(button.disabled)return;button.disabled=true;feedback.textContent=t("Sending to My Shop…");
 try{
  const form=document.querySelector("#seller"),preview=document.querySelector("#imported-image");
  const missing=["name","price","features"].some(key=>!String(form.elements.namedItem(key).value||"").trim())||!preview.getAttribute("src");
  if(missing)await importCurrentProduct(true);
  const data=new FormData(form),title=String(data.get("name")||"").trim();
  if(!title){feedback.textContent=t("Enter a product name or import the current page first.");return;}
  refreshAffiliateImageGuard();
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  const result=await chrome.runtime.sendMessage({type:"SELLPOSTLY_SEND_TO_SHOP",product:{targetShopId:exactShopTarget()?.id,unbrandedQuery:SellPostlyUnbrandedQuery(title,String(data.get("category")||""),String(data.get("gender")||"")),destination:String(data.get("destination")||"affiliate"),stock:String(data.get("stock")||"").trim()===""?undefined:Math.max(0,Math.min(1000000,Math.trunc(Number(data.get("stock"))))),title,price:String(data.get("price")||""),description:String(data.get("features")||""),image:preview.dataset.rawImage||preview.dataset.shopImage||preview.getAttribute("src")||"",url:tab?.url||"",category:String(data.get("category")||"Top Deals"),gender:String(data.get("gender")||"unisex")}});
  if(!result?.ok)throw Error();
  feedback.textContent=t("Opening My Shop. Activate Pro on the website if requested.");
 }catch{feedback.textContent=t("Could not open My Shop. Reload the extension and try again.");}
 finally{button.disabled=false;}
});

void globalThis.SellPostlyFrontend.resolve().then(base=>{for(const link of document.querySelectorAll("footer a")){const path=new URL(link.href).pathname;link.href=base+(path==="/"?"":path);}});

const destinationPicker=document.querySelector('#store-destination');
try{const saved=localStorage.getItem('sellpostly-store-destination');if(saved==='affiliate'||saved==='personal')destinationPicker.value=saved;}catch{}
destinationPicker.addEventListener('change',()=>{try{localStorage.setItem('sellpostly-store-destination',destinationPicker.value);}catch{}});

function refreshAffiliateImageGuard(){
 const form=document.querySelector('#seller'),preview=document.querySelector('#imported-image'),notice=document.querySelector('#affiliate-image-notice');
 const source=preview.dataset.rawImage||preview.getAttribute('src')||'',affiliate=form.elements.namedItem('destination').value==='affiliate';
 const blocked=affiliate&&SellPostlyAffiliate.isImage(source);notice.hidden=!blocked;
 if(blocked){preview.dataset.shopImage='';preview.removeAttribute('src');preview.hidden=true;notice.textContent=t('Amazon image blocked. My Shop will match a representative photo automatically.');}
 else{delete preview.dataset.shopImage;if(preview.dataset.rawImage){preview.src=preview.dataset.rawImage;preview.hidden=false;}}
}
for(const name of ['destination','category'])document.querySelector('#seller').elements.namedItem(name).addEventListener('change',refreshAffiliateImageGuard);

let syncedShopList=[];
function exactShopTarget(){return syncedShopList.find(s=>s.id+':'+s.type===document.querySelector('#exact-shop').value);}
function refreshExactShop(){const selected=exactShopTarget(),category=document.querySelector('#seller').elements.namedItem('category');
 if(selected)destinationPicker.value=selected.type;
 category.disabled=selected?.storeMode==='niche';category.closest('label').hidden=category.disabled;
 document.querySelector('#niche-import-note').hidden=!category.disabled;refreshAffiliateImageGuard();
}
function renderSyncedShops(list){globalThis.sellpostlySyncedShops=list;syncedShopList=Array.isArray(list)?list.filter(s=>s&&/^[0-9a-f-]{36}$/i.test(s.id)&&['personal','affiliate'].includes(s.type)):[];
 const select=document.querySelector('#exact-shop'),previous=select.value;select.replaceChildren(new Option(t('Primary store (selected type)'),''));
 for(const s of syncedShopList)select.add(new Option((s.name||t(s.type==='personal'?'Personal Seller Shop':'Affiliate Deals Shop'))+' — '+(s.storeMode==='niche'?s.nicheName:t(s.type==='personal'?'Personal Seller Shop':'Affiliate Deals Shop')),s.id+':'+s.type));
 if([...select.options].some(o=>o.value===previous))select.value=previous;refreshExactShop();
}
document.querySelector('#exact-shop').addEventListener('change',refreshExactShop);
destinationPicker.addEventListener('change',()=>{document.querySelector('#exact-shop').value='';refreshExactShop();});
document.querySelector('#sync-shops').addEventListener('click',async()=>{const button=document.querySelector('#sync-shops');button.disabled=true;try{const result=await chrome.runtime.sendMessage({type:'SELLPOSTLY_SYNC_SHOPS'});if(!result?.ok)throw Error();renderSyncedShops(result.shops);feedback.textContent=t('Shops synced. Choose your import destination.');}catch{feedback.textContent=t('Sign in to My Shop on the website, then sync again.');}finally{button.disabled=false;}});
chrome.storage.local.get(['sellpostlyShops','sellpostlyShopsOrigin']).then(async saved=>{const base=await SellPostlyFrontend.resolve();if(saved.sellpostlyShopsOrigin===base)renderSyncedShops(saved.sellpostlyShops);}).catch(()=>{});
