import type {Language} from '../language-context';

const messages = {
  open: ['Import Store Catalog','Importer un catalogue','Importar catálogo','استيراد كتالوج متجر'],
  optional: ['Import a catalog from a store URL or CSV (optional)','Importer un catalogue depuis une URL ou un CSV (facultatif)','Importar un catálogo desde una URL o CSV (opcional)','استيراد كتالوج من رابط متجر أو ملف CSV (اختياري)'],
  urlTab: ['Store URL','URL du magasin','URL de la tienda','رابط المتجر'],
  csvTab: ['Upload Store CSV','Téléverser un CSV','Subir CSV de la tienda','رفع ملف CSV للمتجر'],
  urlLabel: ['Store or collection URL','URL du magasin ou de la collection','URL de la tienda o colección','رابط المتجر أو المجموعة'],
  scan: ['Scan Store Catalog','Analyser le catalogue','Buscar productos','فحص كتالوج المتجر'],
  scanning: ['Reading catalog…','Lecture du catalogue…','Leyendo catálogo…','جارٍ قراءة الكتالوج…'],
  upload: ['Drop a CSV file here or choose a file','Déposez un fichier CSV ici ou choisissez un fichier','Arrastra un archivo CSV aquí o selecciona uno','أسقط ملف CSV هنا أو اختر ملفًا'],
  csvUrl: ['Original store URL (optional, to resolve missing or relative links)','URL d’origine (facultative, pour compléter les liens manquants ou relatifs)','URL de origen (opcional, para completar enlaces ausentes o relativos)','رابط المتجر الأصلي (اختياري لإكمال الروابط المفقودة أو النسبية)'],
  csvHint: ['Shopify, WooCommerce, YouCan and other CSV exports up to 1 MB.','Exports Shopify, WooCommerce, YouCan et autres, jusqu’à 1 Mo.','Exportaciones de Shopify, WooCommerce, YouCan y otras, hasta 1 MB.','ملفات تصدير Shopify وWooCommerce وYouCan وغيرها حتى ١ ميغابايت.'],
  search: ['Search products','Rechercher des produits','Buscar productos','البحث عن منتجات'],
  all: ['Select all matching products','Sélectionner tous les résultats','Seleccionar todos los resultados','تحديد كل المنتجات المطابقة'],
  none: ['No products match your search.','Aucun produit ne correspond à votre recherche.','Ningún producto coincide con tu búsqueda.','لا توجد منتجات تطابق بحثك.'],
  emptyStore: ['No products found. If the store blocks automated scans, export its catalog and upload the CSV.','Aucun produit trouvé. Si le magasin bloque les analyses automatiques, exportez son catalogue et téléversez le CSV.','No se encontraron productos. Si la tienda bloquea las búsquedas automáticas, exporta su catálogo y sube el CSV.','لم يتم العثور على منتجات. إذا كان المتجر يحظر الفحص الآلي، فصدّر كتالوجه وارفع ملف CSV.'],
  emptyCsv: ['No products found. Check that the CSV includes a Title or Name column.','Aucun produit trouvé. Vérifiez que le CSV contient une colonne Titre ou Nom.','No se encontraron productos. Comprueba que el CSV incluya una columna de título o nombre.','لم يتم العثور على منتجات. تأكد من أن الملف يتضمن عمود العنوان أو الاسم.'],
  badUrl: ['Enter a valid public store URL.','Saisissez une URL de magasin publique valide.','Introduce una URL pública válida de la tienda.','أدخل رابطًا عامًا صالحًا للمتجر.'],
  badCsv: ['This CSV could not be read. Check the file and store URL, then try again.','Impossible de lire ce CSV. Vérifiez le fichier et l’URL du magasin, puis réessayez.','No se pudo leer el CSV. Comprueba el archivo y la URL de la tienda e inténtalo de nuevo.','تعذرت قراءة ملف CSV. تحقق من الملف ورابط المتجر ثم أعد المحاولة.'],
  tooLarge: ['This import is too large. Split the CSV or select fewer products.','L’import est trop volumineux. Fractionnez le CSV ou sélectionnez moins de produits.','La importación es demasiado grande. Divide el CSV o selecciona menos productos.','حجم الاستيراد كبير جدًا. قسّم ملف CSV أو حدّد منتجات أقل.'],
  auth: ['Sign in to import a catalog.','Connectez-vous pour importer un catalogue.','Inicia sesión para importar un catálogo.','سجّل الدخول لاستيراد كتالوج.'],
  failed: ['The import could not be completed. Try again.','Impossible de terminer l’import. Réessayez.','No se pudo completar la importación. Inténtalo de nuevo.','تعذر إكمال الاستيراد. أعد المحاولة.'],
  shopMissing: ['The target shop is unavailable. Select your shop and try again.','Le magasin cible est indisponible. Sélectionnez votre magasin et réessayez.','La tienda de destino no está disponible. Selecciona tu tienda e inténtalo de nuevo.','المتجر المستهدف غير متاح. اختر متجرك وأعد المحاولة.'],
  submit: ['Import Selected Products ({count})','Importer les produits sélectionnés ({count})','Importar productos seleccionados ({count})','استيراد المنتجات المحددة ({count})'],
  selected: ['{count} selected for import on creation','{count} sélectionnés pour l’import à la création','{count} seleccionados para importar al crear la tienda','عدد المنتجات المحددة للاستيراد عند الإنشاء: {count}'],
  importing: ['Importing…','Importation…','Importando…','جارٍ الاستيراد…'],
  done: ['Imported {count} products. Skipped {skipped} duplicates.','{count} produits importés. {skipped} doublons ignorés.','Se importaron {count} productos y se omitieron {skipped} duplicados.','تم استيراد {count} من المنتجات وتجاوز {skipped} من العناصر المكررة.'],
  generic: ['Generic store','Autre magasin','Otra tienda','متجر عام'],
  platforms: ['Shopify, WooCommerce, YouCan, Storeino','Shopify, WooCommerce, YouCan, Storeino','Shopify, WooCommerce, YouCan, Storeino','شوبيفاي، ووكومرس، يوكان، ستورينو'],
  Shopify: ['Shopify','Shopify','Shopify','شوبيفاي'],
  WooCommerce: ['WooCommerce','WooCommerce','WooCommerce','ووكومرس'],
  YouCan: ['YouCan','YouCan','YouCan','يوكان'],
  Storeino: ['Storeino','Storeino','Storeino','ستورينو'],
  CSV: ['CSV','CSV','CSV','CSV'],
} as const;

export function catalogMessage(language: Language, key: keyof typeof messages, values: Record<string,number> = {}) {
  return messages[key][['en','fr','es','ar'].indexOf(language)].replace(/\{(\w+)\}/g, (match,name) =>
    values[name] === undefined ? match : new Intl.NumberFormat(language).format(values[name]));
}
