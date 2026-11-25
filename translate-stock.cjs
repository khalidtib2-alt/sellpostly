const fs=require('fs');const edit=(p,fn)=>fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));
const entries={
'Representative style photo':['Photo de style représentative','صورة توضيحية للأسلوب'],
'Next Similar Photo':['Photo similaire suivante','الصورة المشابهة التالية'],
'Finding photos…':['Recherche de photos…','جارٍ البحث عن صور…'],
'Generic photo search':['Recherche de photo générique','بحث عن صورة عامة'],
'Representative photos show a style, not the exact branded product. Upload your own photo for an exact match.':['Ces photos illustrent un style, pas le produit de marque exact. Importez votre propre photo pour une correspondance exacte.','تُظهر هذه الصور أسلوبًا مشابهًا، وليس المنتج الأصلي بعلامته التجارية. ارفع صورتك لعرض المنتج نفسه.'],
'Could not select this photo. Try another photo or upload your own.':['Impossible de sélectionner cette photo. Essayez une autre photo ou importez la vôtre.','تعذّر اختيار هذه الصورة. جرّب صورة أخرى أو ارفع صورتك.'],
'Use this photo':['Utiliser cette photo','استخدم هذه الصورة'],
'Photo credit':['Crédit photo','مصدر الصورة'],
'Photo license':['Licence photo','ترخيص الصورة'],
'Amazon image blocked. My Shop will match a representative photo automatically.':['Image Amazon bloquée. Ma boutique sélectionnera automatiquement une photo représentative.','تم حظر صورة أمازون. سيختار متجري صورة توضيحية مناسبة تلقائيًا.'],
'Amazon listing images cannot be hotlinked directly-upload your own review photo, use a brand press-kit image, or keep a representative style photo.':['Les images Amazon ne peuvent pas être utilisées par lien direct. Importez votre photo, une image de presse autorisée ou conservez une photo représentative.','لا يمكن ربط صور منتجات أمازون مباشرة. ارفع صورتك أو صورة صحفية مرخّصة، أو احتفظ بصورة توضيحية مشابهة.'],
'men running shoes':['Chaussures de course pour hommes','أحذية جري رجالية'],
'women shoes':['Chaussures pour femmes','أحذية نسائية'],
'kids sneakers':['Baskets pour enfants','أحذية رياضية للأطفال'],
'wireless headphones':['Casque sans fil','سماعات لاسلكية'],
'wireless noise cancelling headphones':['Casque sans fil à réduction de bruit','سماعات لاسلكية بعزل الضوضاء'],
'smartwatch':['Montre connectée','ساعة ذكية'],
'coffee kitchen':['Café et cuisine','القهوة والمطبخ'],
'fitness equipment':['Équipement de fitness','معدات اللياقة'],
'skincare beauty':['Beauté et soins de la peau','الجمال والعناية بالبشرة'],
'office technology':['Équipement de bureau','تقنيات المكتب'],
 'travel bag':['Sac de voyage','حقيبة سفر']};
const literal=Object.entries(entries).map(([k,[fr,ar]])=>JSON.stringify(k)+':'+JSON.stringify({fr,ar})).join(',\n');
edit('src/app/translations.ts',s=>s.replace('} as const;',','+literal+'\n} as const;'));
edit('chrome-extension/popup.js',s=>s.replace('const messages = {','const messages = {\n'+literal+','));
edit('src/app/shop/affiliate-image-editor.tsx',s=>s.replace("import {useLanguage}","import type {Message} from '../translations';\nimport {useLanguage}").replace('{query}</span>','{t(query as Message)}</span>'));
edit('src/app/shop/affiliate-compliance.ts',s=>s.replace('or keep this studio illustration.','or keep a representative style photo.'));
edit('src/app/globals.css',s=>s+'\n/* Real editorial photographs keep their natural lighting and fill the cover. */\n.editorial-product.has-representative-photo .store-photo-frame {height:100%; padding:0; background:transparent;}\n.editorial-product.has-representative-photo .store-photo-frame img {width:100%;height:100%;max-width:none;max-height:none;object-fit:cover;mix-blend-mode:normal;}\n');
