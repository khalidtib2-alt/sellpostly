"use strict";

const messages = {
  "Amazon Associates Notice: Verify image usage rights or replace with your own/studio photo before publishing": {
    "fr": "Avis Amazon Associates : vérifiez les droits d’utilisation de l’image ou remplacez-la par votre propre photo ou une photo de studio avant publication.",
    "ar": "تنبيه Amazon Associates: تحقّق من حقوق استخدام الصورة أو استبدلها بصورتك الخاصة أو صورة استوديو قبل النشر.",
    "es": "Aviso de Amazon Afiliados: comprueba los derechos de uso de la imagen o sustitúyela por una foto propia o de estudio antes de publicar"
  },
  "Product Image URL": {
    "fr": "URL de la photo du produit",
    "ar": "رابط صورة المنتج",
    "es": "URL de la imagen del producto"
  },
  "Price on this page": {
    "fr": "Prix affiché sur cette page",
    "ar": "السعر المعروض في هذه الصفحة",
    "es": "Precio en esta página"
  },
  "Import failed. Open a product page and try again.": {
    "fr": "Importation impossible. Ouvrez une fiche produit et réessayez.",
    "ar": "تعذّر الاستيراد. افتح صفحة المنتج وحاول مجدداً.",
    "es": "No se ha podido importar. Abre una página de producto e inténtalo de nuevo."
  },
  "Active Shop": {
    "fr": "Boutique active",
    "ar": "المتجر النشط",
    "es": "Tienda activa"
  },
  "Primary Personal Store": {
    "fr": "Boutique personnelle principale",
    "ar": "المتجر الشخصي الأساسي",
    "es": "Tienda personal principal"
  },
  "Primary Affiliate Deals Shop": {
    "fr": "Boutique affiliée principale",
    "ar": "متجر العروض بالعمولة الأساسي",
    "es": "Tienda principal de ofertas de afiliados"
  },
  "+ New Niche Shop": {
    "fr": "+ Nouvelle boutique spécialisée",
    "ar": "+ متجر متخصص جديد",
    "es": "+ Nueva tienda de nicho"
  },
  "Create Niche Shop": {
    "fr": "Créer une boutique spécialisée",
    "ar": "إنشاء متجر متخصص",
    "es": "Crear tienda de nicho"
  },
  "Creating shop…": {
    "fr": "Création de la boutique…",
    "ar": "جارٍ إنشاء المتجر…",
    "es": "Creando tienda…"
  },
  "Custom URL Slug": {
    "fr": "Identifiant URL personnalisé",
    "ar": "معرّف الرابط المخصص",
    "es": "Identificador de URL personalizado"
  },
  "Niche Name": {
    "fr": "Nom de la spécialité",
    "ar": "اسم التخصص",
    "es": "Nombre del nicho"
  },
  "Niche Collection": {
    "fr": "Collection spécialisée",
    "ar": "تشكيلة متخصصة",
    "es": "Colección de nicho"
  },
  "Pro includes up to 10 niche shops across both store types.": {
    "fr": "Pro inclut jusqu’à 10 boutiques spécialisées, tous types confondus.",
    "ar": "تتيح Pro إنشاء ما يصل إلى 10 متاجر متخصصة عبر كلا النوعين.",
    "es": "Pro incluye hasta 10 tiendas de nicho entre ambos tipos."
  },
  "Free includes one primary personal store and one primary affiliate shop. Upgrade to Pro for niche shops.": {
    "fr": "L’offre gratuite inclut une boutique personnelle principale et une boutique affiliée principale. Passez à Pro pour les boutiques spécialisées.",
    "ar": "تشمل الخطة المجانية متجرًا شخصيًا أساسيًا ومتجرًا أساسيًا للعروض بالعمولة. اختر Pro لإضافة متاجر متخصصة.",
    "es": "Free incluye una tienda personal principal y una de afiliados. Pasa a Pro para crear tiendas de nicho."
  },
  "A niche shop has its own catalog, settings and permanent public URL. Broad category tabs are hidden.": {
    "fr": "Chaque boutique spécialisée possède son catalogue, ses réglages et son URL permanente. Les catégories générales sont masquées.",
    "ar": "لكل متجر متخصص كتالوجه وإعداداته ورابطه العام الدائم. تُخفى تبويبات الفئات العامة.",
    "es": "Cada tienda de nicho tiene su propio catálogo, configuración y URL pública permanente. Se ocultan las pestañas de categorías generales."
  },
  "This URL slug is already taken.": {
    "fr": "Cet identifiant URL est déjà utilisé.",
    "ar": "معرّف الرابط هذا مستخدم بالفعل.",
    "es": "Este identificador de URL ya está en uso."
  },
  "The 10 niche shop limit has been reached.": {
    "fr": "La limite de 10 boutiques spécialisées est atteinte.",
    "ar": "تم بلوغ الحد الأقصى البالغ 10 متاجر متخصصة.",
    "es": "Se ha alcanzado el límite de 10 tiendas de nicho."
  },
  "Could not create the shop. Check your Pro license and try again.": {
    "fr": "Création impossible. Vérifiez votre licence Pro et réessayez.",
    "ar": "تعذر إنشاء المتجر. تحقق من ترخيص Pro وحاول مجددًا.",
    "es": "No se ha podido crear la tienda. Comprueba tu licencia Pro e inténtalo de nuevo."
  },
  "Free Primary Stores": {
    "fr": "Boutiques principales gratuites",
    "ar": "المتاجر الأساسية المجانية",
    "es": "Tiendas principales Free"
  },
  "Start Free Primary Stores": {
    "fr": "Créer mes boutiques gratuites",
    "ar": "ابدأ متاجرك الأساسية مجانًا",
    "es": "Crear tiendas principales gratis"
  },
  "Exact Target Shop": {
    "fr": "Boutique de destination précise",
    "ar": "المتجر المستهدف بالتحديد",
    "es": "Tienda de destino exacta"
  },
  "Primary store (selected type)": {
    "fr": "Boutique principale (type sélectionné)",
    "ar": "المتجر الأساسي (النوع المحدد)",
    "es": "Tienda principal (tipo seleccionado)"
  },
  "Sync My Shops": {
    "fr": "Synchroniser mes boutiques",
    "ar": "مزامنة متاجري",
    "es": "Sincronizar mis tiendas"
  },
  "Niche collection: category is assigned automatically.": {
    "fr": "Collection spécialisée : catégorie attribuée automatiquement.",
    "ar": "تشكيلة متخصصة: تُعيّن الفئة تلقائيًا.",
    "es": "Colección de nicho: la categoría se asigna automáticamente."
  },
  "Shops synced. Choose your import destination.": {
    "fr": "Boutiques synchronisées. Choisissez la destination de l’import.",
    "ar": "تمت مزامنة المتاجر. اختر وجهة الاستيراد.",
    "es": "Tiendas sincronizadas. Elige el destino de la importación."
  },
  "Sign in to My Shop on the website, then sync again.": {
    "fr": "Connectez-vous à Ma boutique sur le site, puis relancez la synchronisation.",
    "ar": "سجّل الدخول إلى متجري على الموقع ثم أعد المزامنة.",
    "es": "Inicia sesión en Mi tienda en el sitio web y vuelve a sincronizar."
  },
  "Representative style photo": {
    "fr": "Photo de style représentative",
    "ar": "صورة توضيحية للأسلوب",
    "es": "Foto de estilo representativa"
  },
  "Next Similar Photo": {
    "fr": "Photo similaire suivante",
    "ar": "الصورة المشابهة التالية",
    "es": "Siguiente foto similar"
  },
  "Finding photos…": {
    "fr": "Recherche de photos…",
    "ar": "جارٍ البحث عن صور…",
    "es": "Buscando fotos…"
  },
  "Generic photo search": {
    "fr": "Recherche de photo générique",
    "ar": "بحث عن صورة عامة",
    "es": "Búsqueda de fotos genéricas"
  },
  "Representative photos show a style, not the exact branded product. Upload your own photo for an exact match.": {
    "fr": "Ces photos illustrent un style, pas le produit de marque exact. Importez votre propre photo pour une correspondance exacte.",
    "ar": "تُظهر هذه الصور أسلوبًا مشابهًا، وليس المنتج الأصلي بعلامته التجارية. ارفع صورتك لعرض المنتج نفسه.",
    "es": "Las fotos representativas muestran un estilo, no el producto de marca exacto. Sube tu foto para una coincidencia exacta."
  },
  "Could not select this photo. Try another photo or upload your own.": {
    "fr": "Impossible de sélectionner cette photo. Essayez une autre photo ou importez la vôtre.",
    "ar": "تعذّر اختيار هذه الصورة. جرّب صورة أخرى أو ارفع صورتك.",
    "es": "No se ha podido seleccionar esta foto. Prueba otra o sube la tuya."
  },
  "Use this photo": {
    "fr": "Utiliser cette photo",
    "ar": "استخدم هذه الصورة",
    "es": "Usar esta foto"
  },
  "Photo credit": {
    "fr": "Crédit photo",
    "ar": "مصدر الصورة",
    "es": "Crédito de foto"
  },
  "Photo license": {
    "fr": "Licence photo",
    "ar": "ترخيص الصورة",
    "es": "Licencia de foto"
  },
  "Amazon image blocked. My Shop will match a representative photo automatically.": {
    "fr": "Image Amazon bloquée. Ma boutique sélectionnera automatiquement une photo représentative.",
    "ar": "تم حظر صورة أمازون. سيختار متجري صورة توضيحية مناسبة تلقائيًا.",
    "es": "Imagen de Amazon bloqueada. Mi tienda buscará una foto representativa automáticamente."
  },
  "Amazon listing images cannot be hotlinked directly-upload your own review photo, use a brand press-kit image, or keep a representative style photo.": {
    "fr": "Les images Amazon ne peuvent pas être utilisées par lien direct. Importez votre photo, une image de presse autorisée ou conservez une photo représentative.",
    "ar": "لا يمكن ربط صور منتجات أمازون مباشرة. ارفع صورتك أو صورة صحفية مرخّصة، أو احتفظ بصورة توضيحية مشابهة.",
    "es": "No se pueden enlazar imágenes de anuncios de Amazon directamente. Sube tu foto de reseña, utiliza una del kit de prensa o conserva una foto representativa."
  },
  "men running shoes": {
    "fr": "Chaussures de course pour hommes",
    "ar": "أحذية جري رجالية",
    "es": "zapatillas de correr para hombre"
  },
  "women shoes": {
    "fr": "Chaussures pour femmes",
    "ar": "أحذية نسائية",
    "es": "zapatos de mujer"
  },
  "kids sneakers": {
    "fr": "Baskets pour enfants",
    "ar": "أحذية رياضية للأطفال",
    "es": "zapatillas infantiles"
  },
  "wireless headphones": {
    "fr": "Casque sans fil",
    "ar": "سماعات لاسلكية",
    "es": "auriculares inalámbricos"
  },
  "wireless noise cancelling headphones": {
    "fr": "Casque sans fil à réduction de bruit",
    "ar": "سماعات لاسلكية بعزل الضوضاء",
    "es": "auriculares inalámbricos con cancelación de ruido"
  },
  "smartwatch": {
    "fr": "Montre connectée",
    "ar": "ساعة ذكية",
    "es": "reloj inteligente"
  },
  "coffee kitchen": {
    "fr": "Café et cuisine",
    "ar": "القهوة والمطبخ",
    "es": "café y cocina"
  },
  "fitness equipment": {
    "fr": "Équipement de fitness",
    "ar": "معدات اللياقة",
    "es": "equipo de fitness"
  },
  "skincare beauty": {
    "fr": "Beauté et soins de la peau",
    "ar": "الجمال والعناية بالبشرة",
    "es": "belleza y cuidado de la piel"
  },
  "office technology": {
    "fr": "Équipement de bureau",
    "ar": "تقنيات المكتب",
    "es": "tecnología de oficina"
  },
  "travel bag": {
    "fr": "Sac de voyage",
    "ar": "حقيبة سفر",
    "es": "bolsa de viaje"
  },
  "Amazon listing images cannot be hotlinked directly—upload your own review photo, use a brand press-kit image, or keep this studio illustration.": {
    "fr": "Les images des fiches Amazon ne peuvent pas être utilisées par lien direct : importez votre propre photo de test, utilisez une image du dossier de presse de la marque ou conservez cette illustration de studio.",
    "ar": "لا يمكن ربط صور إعلانات أمازون مباشرةً — ارفع صورة مراجعة التقطتها بنفسك، أو استخدم صورة من الملف الإعلامي للعلامة التجارية، أو احتفظ بهذا الرسم التوضيحي.",
    "es": "No se pueden enlazar directamente imágenes de anuncios de Amazon. Sube tu propia foto de reseña, utiliza una imagen del kit de prensa de la marca o conserva esta ilustración de estudio."
  },
  "Stock (Optional)": {
    "fr": "Stock (facultatif)",
    "ar": "المخزون (اختياري)",
    "es": "Existencias (opcional)"
  },
  "Affiliate Deals Shop": {
    "fr": "Boutique de bonnes affaires affiliées",
    "ar": "متجر العروض بالعمولة",
    "es": "Tienda de ofertas de afiliados"
  },
  "Personal Seller Shop": {
    "fr": "Boutique personnelle du vendeur",
    "ar": "متجر البائع الشخصي",
    "es": "Tienda personal del vendedor"
  },
  "Destination Store": {
    "fr": "Boutique de destination",
    "ar": "المتجر المستهدف",
    "es": "Tienda de destino"
  },
  "Affiliate tags are kept for deals. Personal products use your seller checkout.": {
    "fr": "Les liens affiliés conservent leurs paramètres. Les produits personnels utilisent votre paiement vendeur.",
    "ar": "تُحفظ وسوم روابط العمولة للعروض. تستخدم المنتجات الشخصية طرق الدفع الخاصة بمتجرك.",
    "es": "Las ofertas conservan las etiquetas de afiliado. Los productos personales utilizan el pago del vendedor."
  },
  "Could not load or save email preferences.": {
    "fr": "Impossible de charger ou d’enregistrer les préférences e-mail.",
    "ar": "تعذّر تحميل تفضيلات البريد أو حفظها.",
    "es": "No se han podido cargar o guardar las preferencias de correo."
  },
  "Email preferences saved.": {
    "fr": "Préférences e-mail enregistrées.",
    "ar": "تم حفظ تفضيلات البريد.",
    "es": "Preferencias de correo guardadas."
  },
  "Save Email Preferences": {
    "fr": "Enregistrer les préférences e-mail",
    "ar": "حفظ تفضيلات البريد",
    "es": "Guardar preferencias de correo"
  },
  "Payout updates use this private email and your current language. Leave blank to disable seller emails.": {
    "fr": "Les mises à jour des retraits utilisent cet e-mail privé et votre langue actuelle. Laissez vide pour désactiver les e-mails vendeur.",
    "ar": "تُرسل تحديثات السحب إلى هذا البريد الخاص بلغتك الحالية. اتركه فارغاً لتعطيل رسائل البائع.",
    "es": "Las actualizaciones de retiros utilizan este correo privado y tu idioma actual. Déjalo vacío para desactivar los correos al vendedor."
  },
  "Seller Notification Email": {
    "fr": "E-mail de notification du vendeur",
    "ar": "البريد الإلكتروني لإشعارات البائع",
    "es": "Correo de notificaciones del vendedor"
  },
  "WhatsApp Phone (Optional)": {
    "fr": "Téléphone WhatsApp (facultatif)",
    "ar": "رقم واتساب (اختياري)",
    "es": "Teléfono de WhatsApp (opcional)"
  },
  "A buyer international phone number is needed for WhatsApp replies.": {
    "fr": "Un numéro de téléphone international de l’acheteur est nécessaire pour les réponses WhatsApp.",
    "ar": "يلزم رقم هاتف المشتري بالصيغة الدولية للرد عبر واتساب.",
    "es": "Se necesita un teléfono internacional del comprador para responder por WhatsApp."
  },
  "Delivery Follow-Up": {
    "fr": "Suivi de la livraison",
    "ar": "متابعة التسليم",
    "es": "Seguimiento de entrega"
  },
  "Digital Key / Tracking Delivered": {
    "fr": "Clé numérique / suivi envoyé",
    "ar": "تم إرسال المفتاح الرقمي أو التتبع",
    "es": "Clave digital o seguimiento entregado"
  },
  "Order Confirmed": {
    "fr": "Commande confirmée",
    "ar": "تم تأكيد الطلب",
    "es": "Pedido confirmado"
  },
  "WhatsApp Quick Replies": {
    "fr": "Réponses rapides WhatsApp",
    "ar": "ردود واتساب السريعة",
    "es": "Respuestas rápidas de WhatsApp"
  },
  "Gender / Target Audience": {
    "fr": "Genre / public cible",
    "ar": "الجنس أو الجمهور المستهدف",
    "es": "Género o público objetivo"
  },
  "Sport": {
    "fr": "Sport",
    "ar": "رياضة",
    "es": "Deporte"
  },
  "Art": {
    "fr": "Art",
    "ar": "فن",
    "es": "Arte"
  },
  "Digital Product": {
    "fr": "Produit numérique",
    "ar": "منتج رقمي",
    "es": "Producto digital"
  },
  "Kids": {
    "fr": "Enfants",
    "ar": "الأطفال",
    "es": "Niños"
  },
  "Send to My Shop (Pro)": {
    "fr": "Envoyer vers ma boutique (Pro)",
    "ar": "إرسال إلى متجري (Pro)",
    "es": "Enviar a Mi tienda (Pro)"
  },
  "Sending to My Shop…": {
    "fr": "Envoi vers ma boutique…",
    "ar": "جارٍ الإرسال إلى متجري…",
    "es": "Enviando a Mi tienda…"
  },
  "Enter a product name or import the current page first.": {
    "fr": "Saisissez un nom de produit ou importez d’abord la page actuelle.",
    "ar": "أدخل اسم المنتج أو استورد الصفحة الحالية أولًا.",
    "es": "Introduce un nombre de producto o importa primero la página actual."
  },
  "Opening My Shop. Activate Pro on the website if requested.": {
    "fr": "Ouverture de Ma boutique. Activez Pro sur le site si nécessaire.",
    "ar": "جارٍ فتح متجري. فعّل Pro على الموقع إذا طُلب ذلك.",
    "es": "Abriendo Mi tienda. Activa Pro en el sitio web si se solicita."
  },
  "Could not open My Shop. Reload the extension and try again.": {
    "fr": "Impossible d’ouvrir Ma boutique. Rechargez l’extension et réessayez.",
    "ar": "تعذر فتح متجري. أعد تحميل الإضافة وحاول مجددًا.",
    "es": "No se ha podido abrir Mi tienda. Recarga la extensión e inténtalo de nuevo."
  },
  "Promo image copied! Press Ctrl+V in Facebook, then click Copy Text for your caption": {
    "fr": "Image promotionnelle copiée ! Collez-la dans Facebook avec Ctrl+V, puis cliquez sur Copier le texte pour la légende.",
    "ar": "تم نسخ الصورة الترويجية! اضغط Ctrl+V في فيسبوك، ثم اضغط نسخ النص للحصول على التعليق.",
    "es": "Imagen promocional copiada. Pulsa Ctrl+V en Facebook y después Copiar texto para añadir la descripción"
  },
  "Shop Category": {
    "fr": "Catégorie de boutique",
    "ar": "فئة المتجر",
    "es": "Categoría de tienda"
  },
  "Gender / Audience": {
    "fr": "Genre / Public",
    "ar": "الجنس أو الجمهور",
    "es": "Género o público"
  },
  "All / Unisex": {
    "fr": "Tous / Mixte",
    "ar": "الكل / للجنسين",
    "es": "Todos / unisex"
  },
  "Men": {
    "fr": "Hommes",
    "ar": "الرجال",
    "es": "Hombres"
  },
  "Women": {
    "fr": "Femmes",
    "ar": "النساء",
    "es": "Mujeres"
  },
  "Unisex": {
    "fr": "Mixte",
    "ar": "للجميع",
    "es": "Unisex"
  },
  "Edit Product": {
    "fr": "Modifier le produit",
    "ar": "تعديل المنتج",
    "es": "Editar producto"
  },
  "Category": {
    "fr": "Catégorie",
    "ar": "الفئة",
    "es": "Categoría"
  },
  "Tech & Gadgets": {
    "fr": "Tech et gadgets",
    "ar": "التقنية والأجهزة",
    "es": "Tecnología y dispositivos"
  },
  "Fashion": {
    "fr": "Mode",
    "ar": "الأزياء",
    "es": "Moda"
  },
  "Home & Kitchen": {
    "fr": "Maison et cuisine",
    "ar": "المنزل والمطبخ",
    "es": "Hogar y cocina"
  },
  "Beauty": {
    "fr": "Beauté",
    "ar": "الجمال",
    "es": "Belleza"
  },
  "Fitness": {
    "fr": "Fitness",
    "ar": "اللياقة البدنية",
    "es": "Fitness"
  },
  "Top Deals": {
    "fr": "Meilleures offres",
    "ar": "أفضل العروض",
    "es": "Mejores ofertas"
  },
  "Other": {
    "fr": "Autre",
    "ar": "أخرى",
    "es": "Otro"
  },
  "Open in Studio First": {
    "fr": "Ouvrir d’abord dans le studio",
    "ar": "فتح في الاستوديو أولاً",
    "es": "Abrir primero en el estudio"
  },
  "Website": {
    "fr": "Site web",
    "ar": "Ø§Ù„Ù…ÙˆÙ‚Ø¹",
    "es": "Sitio web"
  },
  "Prompt Generator": {
    "fr": "GÃ©nÃ©rateur de prompts",
    "ar": "Ù…ÙˆÙ„Ù‘Ø¯ Ø§Ù„ØªØ¹Ù„ÙŠÙ…Ø§Øª",
    "es": "Generador de instrucciones"
  },
  "Seller Guides": {
    "fr": "Guides pour les vendeurs",
    "ar": "Ø£Ø¯Ù„Ø© Ø§Ù„Ø¨Ø§Ø¦Ø¹ÙŠÙ†",
    "es": "Guías para vendedores"
  },
  "Text & Image copied! Paste (Ctrl+V) directly into your post or chat.": {
    "fr": "Texte et image copiÃ©s ! Collez-les (Ctrl+V) dans votre publication ou conversation.",
    "ar": "ØªÙ… Ù†Ø³Ø® Ø§Ù„Ù†Øµ ÙˆØ§Ù„ØµÙˆØ±Ø©! Ø§Ù„ØµÙ‚ (Ctrl+V) ÙÙŠ Ø§Ù„Ù…Ù†Ø´ÙˆØ± Ø£Ùˆ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø©.",
    "es": "Texto e imagen copiados. Pégalos con Ctrl+V directamente en tu publicación o chat."
  },
  "Upload or import a product photo first.": {
    "fr": "Importez dâ€™abord une photo produit.",
    "ar": "Ø§Ø±ÙØ¹ Ø£Ùˆ Ø§Ø³ØªÙˆØ±Ø¯ ØµÙˆØ±Ø© Ø§Ù„Ù…Ù†ØªØ¬ Ø£ÙˆÙ„Ù‹Ø§.",
    "es": "Sube o importa primero una foto del producto."
  },
  "Please paste a specific product page URL (not a store homepage), or use the SellPostly Chrome Extension on the product page.": {
    "fr": "Collez lâ€™URL dâ€™une fiche produit prÃ©cise, ou utilisez lâ€™extension Chrome SellPostly sur cette fiche.",
    "ar": "Ø§Ù„ØµÙ‚ Ø±Ø§Ø¨Ø· ØµÙØ­Ø© Ù…Ù†ØªØ¬ Ù…Ø­Ø¯Ø¯ Ø¨Ø¯Ù„ Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© Ù„Ù„Ù…ØªØ¬Ø±ØŒ Ø£Ùˆ Ø§Ø³ØªØ®Ø¯Ù… Ø¥Ø¶Ø§ÙØ© SellPostly Ø¹Ù„Ù‰ ØµÙØ­Ø© Ø§Ù„Ù…Ù†ØªØ¬.",
    "es": "Pega la URL de un producto concreto, no la página de inicio, o utiliza la extensión de SellPostly en la página del producto."
  },
  "Image copied! Press Ctrl+V in chat to attach the photo.": {
    "fr": "Image copiÃ©e ! Appuyez sur Ctrl+V dans la conversation pour joindre la photo.",
    "ar": "ØªÙ… Ù†Ø³Ø® Ø§Ù„ØµÙˆØ±Ø©! Ø§Ø¶ØºØ· Ctrl+V ÙÙŠ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø© Ù„Ø¥Ø±ÙØ§Ù‚Ù‡Ø§.",
    "es": "Imagen copiada. Pulsa Ctrl+V en el chat para adjuntar la foto."
  },
  "Send Text": {
    "fr": "Envoyer le texte",
    "ar": "Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù†Øµ",
    "es": "Enviar texto"
  },
  "Send Image + Text": {
    "fr": "Envoyer lâ€™image et le texte",
    "ar": "Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØµÙˆØ±Ø© ÙˆØ§Ù„Ù†Øµ",
    "es": "Enviar imagen y texto"
  },
  "Image downloaded. Attach it and paste the caption.": {
    "fr": "Image tÃ©lÃ©chargÃ©e. Joignez-la et collez la lÃ©gende.",
    "ar": "ØªÙ… ØªÙ†Ø²ÙŠÙ„ Ø§Ù„ØµÙˆØ±Ø©. Ø£Ø±ÙÙ‚Ù‡Ø§ ÙˆØ§Ù„ØµÙ‚ Ø§Ù„Ù†Øµ.",
    "es": "Imagen descargada. Adjúntala y pega el texto."
  },
  "Sharing failed. Copy the text or download the image.": {
    "fr": "Ã‰chec du partage. Copiez le texte ou tÃ©lÃ©chargez lâ€™image.",
    "ar": "ØªØ¹Ø°Ù‘Ø±Øª Ø§Ù„Ù…Ø´Ø§Ø±ÙƒØ©. Ø§Ù†Ø³Ø® Ø§Ù„Ù†Øµ Ø£Ùˆ Ù†Ø²Ù‘Ù„ Ø§Ù„ØµÙˆØ±Ø©.",
    "es": "No se ha podido compartir. Copia el texto o descarga la imagen."
  },
  "Delivery": {
    "fr": "Livraison",
    "ar": "Ø§Ù„ØªÙˆØµÙŠÙ„",
    "es": "Entrega"
  },
  "Reply *ORDER* now to claim yours!": {
    "fr": "RÃ©pondez *COMMANDER* pour passer commande !",
    "ar": "Ø£Ø±Ø³Ù„ *Ø·Ù„Ø¨* Ø§Ù„Ø¢Ù† Ù„Ø·Ù„Ø¨ Ù…Ù†ØªØ¬Ùƒ!",
    "es": "Responde *PEDIDO* ahora para pedir el tuyo."
  },
  "Import From Current Page": {
    "fr": "Importer depuis cette page",
    "ar": "Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ù…Ù† Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©",
    "es": "Importar desde la página actual"
  },
  "Page imported. Review the details.": {
    "fr": "Page importÃ©e. VÃ©rifiez les dÃ©tails.",
    "ar": "ØªÙ… Ø§Ù„Ø§Ø³ØªÙŠØ±Ø§Ø¯. Ø±Ø§Ø¬Ø¹ Ø§Ù„ØªÙØ§ØµÙŠÙ„.",
    "es": "Página importada. Revisa los datos."
  },
  "Could not read this page. Open a product page and try again.": {
    "fr": "Lecture impossible. Ouvrez une page produit et rÃ©essayez.",
    "ar": "ØªØ¹Ø°Ù‘Ø±Øª Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„ØµÙØ­Ø©. Ø§ÙØªØ­ ØµÙØ­Ø© Ù…Ù†ØªØ¬ ÙˆØ­Ø§ÙˆÙ„ Ù…Ø¬Ø¯Ø¯Ù‹Ø§.",
    "es": "No se ha podido leer esta página. Abre una página de producto e inténtalo de nuevo."
  },
  "Formatting mode": {
    "fr": "Mode de mise en forme",
    "ar": "ÙˆØ¶Ø¹ Ø§Ù„ØªÙ†Ø³ÙŠÙ‚",
    "es": "Modo de formato"
  },
  "Seller Mode": {
    "fr": "Mode Vendeur",
    "ar": "ÙˆØ¶Ø¹ Ø§Ù„Ø¨Ø§Ø¦Ø¹",
    "es": "Modo vendedor"
  },
  "Creator Mode": {
    "fr": "Mode CrÃ©ateur",
    "ar": "ÙˆØ¶Ø¹ ØµØ§Ù†Ø¹ Ø§Ù„Ù…Ø­ØªÙˆÙ‰",
    "es": "Modo creador"
  },
  "Product Name": {
    "fr": "Nom du produit",
    "ar": "Ø§Ø³Ù… Ø§Ù„Ù…Ù†ØªØ¬",
    "es": "Nombre del producto"
  },
  "Price": {
    "fr": "Prix",
    "ar": "Ø§Ù„Ø³Ø¹Ø±",
    "es": "Precio"
  },
  "$29": {
    "fr": "29 â‚¬",
    "ar": "29 Ø¯Ø±Ù‡Ù…Ù‹Ø§",
    "es": "$29"
  },
  "Delivery / Location": {
    "fr": "Livraison / lieu de retrait",
    "ar": "Ø§Ù„ØªÙˆØµÙŠÙ„ Ø£Ùˆ Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…",
    "es": "Entrega o ubicación"
  },
  "Key Features": {
    "fr": "CaractÃ©ristiques principales",
    "ar": "Ø£Ù‡Ù… Ø§Ù„Ù…ÙŠØ²Ø§Øª",
    "es": "Características principales"
  },
  "One feature per line": {
    "fr": "Une caractÃ©ristique par ligne",
    "ar": "Ù…ÙŠØ²Ø© ÙˆØ§Ø­Ø¯Ø© ÙÙŠ ÙƒÙ„ Ø³Ø·Ø±",
    "es": "Una característica por línea"
  },
  "Format Posts": {
    "fr": "Formater les publications",
    "ar": "Ù†Ø³Ù‘Ù‚ Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª",
    "es": "Dar formato a publicaciones"
  },
  "Quick Post": {
    "fr": "Texte de dÃ©part",
    "ar": "Ù†Øµ Ø§Ù„Ù…Ù†Ø´ÙˆØ±",
    "es": "Publicación rápida"
  },
  "Paste your post or hook": {
    "fr": "Collez votre texte ou votre accroche",
    "ar": "Ø§Ù„ØµÙ‚ Ù…Ù†Ø´ÙˆØ±Ùƒ Ø£Ùˆ Ø¹Ø¨Ø§Ø±ØªÙƒ Ø§Ù„Ø§ÙØªØªØ§Ø­ÙŠØ©",
    "es": "Pega tu publicación o gancho"
  },
  "Formatted posts": {
    "fr": "Publications mises en forme",
    "ar": "Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª Ø§Ù„Ù…Ù†Ø³Ù‘Ù‚Ø©",
    "es": "Publicaciones con formato"
  },
  "Platforms": {
    "fr": "Plateformes",
    "ar": "Ø§Ù„Ù…Ù†ØµØ§Øª",
    "es": "Plataformas"
  },
  "Web Formatter": {
    "fr": "Outil web de mise en forme",
    "ar": "Ù…Ù†Ø³Ù‘Ù‚ Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª Ø¹Ù„Ù‰ Ø§Ù„ÙˆÙŠØ¨",
    "es": "Formateador web"
  },
  "Seller Resources": {
    "fr": "Ressources pour les vendeurs",
    "ar": "Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø§Ø¦Ø¹ÙŠÙ†",
    "es": "Recursos para vendedores"
  },
  "Language": {
    "fr": "Langue",
    "ar": "Ø§Ù„Ù„ØºØ©",
    "es": "Idioma"
  },
  "Delivery / pickup": {
    "fr": "Livraison / retrait",
    "ar": "Ø§Ù„ØªÙˆØµÙŠÙ„ Ø£Ùˆ Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…",
    "es": "Entrega o recogida"
  },
  "Message to order.": {
    "fr": "Envoyez un message pour commander.",
    "ar": "Ø±Ø§Ø³Ù„Ù†Ø§ Ù„Ù„Ø·Ù„Ø¨.",
    "es": "Envía un mensaje para pedirlo."
  },
  "Meet": {
    "fr": "DÃ©couvrez",
    "ar": "ØªØ¹Ø±Ù‘Ù Ø¹Ù„Ù‰",
    "es": "Descubre"
  },
  "Product": {
    "fr": "Produit",
    "ar": "Ø§Ù„Ù…Ù†ØªØ¬",
    "es": "Producto"
  },
  "Features": {
    "fr": "CaractÃ©ristiques",
    "ar": "Ø§Ù„Ù…ÙŠØ²Ø§Øª",
    "es": "Características"
  },
  "#ProductFinds #ShopNow": {
    "fr": "#BellesTrouvailles #AcheterEnLigne",
    "ar": "#Ù…Ù†ØªØ¬Ø§Øª_Ù…Ø®ØªØ§Ø±Ø© #ØªØ³ÙˆÙ‚_Ø§Ù„Ø¢Ù†",
    "es": "#ProductosDescubiertos #CompraAhora"
  },
  "What has worked for you?": {
    "fr": "Quâ€™est-ce qui a fonctionnÃ© pour vous ?",
    "ar": "Ù…Ø§ Ø§Ù„Ø°ÙŠ Ù†Ø¬Ø­ Ù…Ø¹ÙƒÙ…ØŸ",
    "es": "¿Qué te ha funcionado?"
  },
  "Your take?": {
    "fr": "Votre avis ?",
    "ar": "Ù…Ø§ Ø±Ø£ÙŠÙƒÙ…ØŸ",
    "es": "¿Qué opinas?"
  },
  "Share your experience below.": {
    "fr": "Partagez votre expÃ©rience en commentaire.",
    "ar": "Ø´Ø§Ø±ÙƒÙˆÙ†Ø§ ØªØ¬Ø§Ø±Ø¨ÙƒÙ… ÙÙŠ Ø§Ù„ØªØ¹Ù„ÙŠÙ‚Ø§Øª.",
    "es": "Comparte tu experiencia abajo."
  },
  "formatted post": {
    "fr": "publication mise en forme",
    "ar": "Ù…Ù†Ø´ÙˆØ± Ù…Ù†Ø³Ù‘Ù‚",
    "es": "publicación con formato"
  },
  "Copy": {
    "fr": "Copier",
    "ar": "Ù†Ø³Ø®",
    "es": "Copiar"
  },
  "Copied!": {
    "fr": "CopiÃ© !",
    "ar": "ØªÙ… Ø§Ù„Ù†Ø³Ø®!",
    "es": "Copiado"
  },
  "Text selected. Press Ctrl+C or Command+C to copy.": {
    "fr": "Texte sÃ©lectionnÃ©. Appuyez sur Ctrl+C ou Cmd+C pour le copier.",
    "ar": "ØªÙ… ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù†Øµ. Ø§Ø¶ØºØ· Ctrl+C Ø£Ùˆ Cmd+C Ù„Ù†Ø³Ø®Ù‡.",
    "es": "Texto seleccionado. Pulsa Ctrl+C o Command+C para copiar."
  },
  "Posts formatted.": {
    "fr": "Publications mises en forme.",
    "ar": "ØªÙ… ØªÙ†Ø³ÙŠÙ‚ Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª.",
    "es": "Publicaciones preparadas."
  },
  "Enter a product name.": {
    "fr": "Saisissez un nom de produit.",
    "ar": "Ø£Ø¯Ø®Ù„ Ø§Ø³Ù… Ø§Ù„Ù…Ù†ØªØ¬.",
    "es": "Introduce un nombre de producto."
  },
  "Enter a post.": {
    "fr": "Saisissez un texte.",
    "ar": "Ø£Ø¯Ø®Ù„ Ù†Øµ Ø§Ù„Ù…Ù†Ø´ÙˆØ±.",
    "es": "Introduce una publicación."
  },
  "Wireless headphones": {
    "fr": "Casque sans fil",
    "ar": "Ø³Ù…Ø§Ø¹Ø§Øª Ù„Ø§Ø³Ù„ÙƒÙŠØ©",
    "es": "Auriculares inalámbricos"
  },
  "Local pickup or shipping": {
    "fr": "Retrait sur place ou livraison",
    "ar": "Ø§Ø³ØªÙ„Ø§Ù… Ù…Ø­Ù„ÙŠ Ø£Ùˆ ØªÙˆØµÙŠÙ„",
    "es": "Recogida local o envío"
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
applyLanguage(savedLanguage === "fr" || savedLanguage === "es" || savedLanguage === "ar" ? savedLanguage : "en");
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
    await chrome.scripting.executeScript({target:{tabId:tab.id},files:['product-reader.js']});
    const [execution] = await chrome.scripting.executeScript({target:{tabId:tab.id},func:async()=>{
      let value=globalThis.SellPostlyProductReader.read();
      for(let i=0;i<2&&(!value.price||!value.image);i++){await new Promise(resolve=>setTimeout(resolve,350));const next=globalThis.SellPostlyProductReader.read();value={...value,...Object.fromEntries(Object.entries(next).filter(([,v])=>v!==''))};}
      return value;
    }});
    const product = execution?.result;
    const selectedImage=document.querySelector("#product-image-url")?.value?.trim();if(preserveEdits&&selectedImage&&product)product.image=selectedImage;
    if (!product?.name) throw Error();
    const form = document.querySelector("#seller");
    for (const key of ["name", "price", "features"]) {const field=form.elements.namedItem(key);if(!preserveEdits||!field.value.trim())field.value = product[key] || "";}
    const preview = document.querySelector("#imported-image");
    preview.dataset.sourceUrl=tab.url;document.querySelector("#product-image-url").value=product.image||"";
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




document.querySelector('#open-studio').addEventListener('click',async()=>{const data=new FormData(document.querySelector('#seller')),preview=document.querySelector('#imported-image');try{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});const result=await chrome.runtime.sendMessage({type:'SELLPOSTLY_OPEN_STUDIO',product:{title:String(data.get('name')||''),price:String(data.get('price')||''),description:String(data.get('features')||''),url:tab?.url||'',image:preview.dataset.rawImage||preview.dataset.shopImage||preview.getAttribute('src')||'',destination:String(data.get('destination')||'affiliate'),targetShopId:exactShopTarget()?.id,category:String(data.get('category')||'Top Deals'),gender:String(data.get('gender')||'unisex')}});if(!result?.ok)throw Error();}catch{setSendStatus('Import failed. Open a product page and try again.');}});



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
 const blocked=false;notice.hidden=!SellPostlyAffiliate.isAmazon(preview.dataset.sourceUrl||'');notice.textContent=t('Amazon Associates Notice: Verify image usage rights or replace with your own/studio photo before publishing');
 delete preview.dataset.shopImage;
 if(source){preview.src=source;preview.hidden=false;}else{preview.removeAttribute('src');preview.hidden=true;}

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

document.querySelector('#product-image-url').addEventListener('input',event=>{const preview=document.querySelector('#imported-image');try{const url=new URL(event.target.value);preview.dataset.rawImage=/^https?:$/.test(url.protocol)?url.href:'';}catch{preview.dataset.rawImage='';}refreshAffiliateImageGuard();});
