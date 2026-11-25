const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
const entries={
'TRON (USDT-TRC20)':{fr:'TRON (USDT-TRC20)',ar:'ترون (USDT-TRC20)'},
'TRON Wallet Address':{fr:'Adresse du portefeuille TRON',ar:'عنوان محفظة TRON'},
'USDT-TRC20 on TRON only. Direct seller payment; no admin escrow.':{fr:'USDT-TRC20 sur TRON uniquement. Paiement direct au vendeur, sans séquestre administrateur.',ar:'USDT-TRC20 على شبكة TRON فقط. دفع مباشر للبائع دون ضمان المسؤول.'},
'TRON Transaction ID (TxID)':{fr:'Identifiant de transaction TRON (TxID)',ar:'معرّف معاملة TRON ‏(TxID)'},
'Enter a valid TRON wallet and 64-character transaction ID.':{fr:'Saisissez un portefeuille TRON valide et un identifiant de transaction de 64 caractères.',ar:'أدخل محفظة TRON صالحة ومعرّف معاملة مكوّنًا من 64 حرفًا.'},
'Digital items need no shipping address. Access is released after payment verification or seller confirmation.':{fr:'Les produits numériques ne nécessitent aucune adresse de livraison. L’accès est fourni après vérification du paiement ou confirmation du vendeur.',ar:'لا تتطلب المنتجات الرقمية عنوان شحن. تُتاح بعد التحقق من الدفع أو تأكيد البائع.'},
'Post-payment Delivery Note':{fr:'Instructions de livraison après paiement',ar:'تعليمات التسليم بعد الدفع'},
'Private Download Link':{fr:'Lien de téléchargement privé',ar:'رابط التنزيل الخاص'},
'Saved privately. Never put download secrets in the public product description.':{fr:'Enregistré de façon privée. Ne placez jamais de liens ou codes confidentiels dans la description publique.',ar:'تُحفظ بشكل خاص. لا تضع أسرار التنزيل في وصف المنتج العام.'},
'Digital order: no shipping address needed. Delivery is sent to your email after payment confirmation.':{fr:'Commande numérique : aucune adresse postale nécessaire. La livraison est envoyée par e-mail après confirmation du paiement.',ar:'طلب رقمي: لا حاجة إلى عنوان شحن. يُرسل التسليم إلى بريدك الإلكتروني بعد تأكيد الدفع.'},
'Open Digital Download':{fr:'Ouvrir le téléchargement numérique',ar:'فتح التنزيل الرقمي'},
'Digital Delivery':{fr:'Livraison numérique',ar:'التسليم الرقمي'},
'Your download or delivery note becomes available after payment verification or seller confirmation. Keep your Order ID and email.':{fr:'Votre téléchargement ou vos instructions seront disponibles après vérification du paiement ou confirmation du vendeur. Conservez votre numéro de commande et votre e-mail.',ar:'يصبح التنزيل أو تعليمات التسليم متاحًا بعد التحقق من الدفع أو تأكيد البائع. احتفظ بمعرّف طلبك وبريدك الإلكتروني.'},
'Check Digital Delivery':{fr:'Vérifier la livraison numérique',ar:'التحقق من التسليم الرقمي'},
'Digital access is not ready yet. The seller must confirm payment first.':{fr:'L’accès numérique n’est pas encore prêt. Le vendeur doit d’abord confirmer le paiement.',ar:'الوصول الرقمي غير جاهز بعد. يجب أن يؤكد البائع الدفع أولًا.'},
'Could not load delivery details. Try again.':{fr:'Impossible de charger les détails de livraison. Réessayez.',ar:'تعذر تحميل تفاصيل التسليم. حاول مجددًا.'},
'All 8 peer-to-peer payment methods':{fr:'Les 8 moyens de paiement direct entre particuliers',ar:'طرق الدفع المباشر الثماني بين البائع والمشتري'},
'Eight direct payment methods, on both plans':{fr:'Huit paiements directs, dans les deux offres',ar:'ثماني طرق دفع مباشر في كلتا الخطتين'}
};edit('src/app/translations.ts',s=>s.replace('export const translations = {','export const translations = {\n'+Object.entries(entries).map(([k,v])=>JSON.stringify(k)+':'+JSON.stringify(v)+',').join('\n')));
edit('src/app/pricing/pricing-data.ts',s=>s.replace('All 7 peer-to-peer','All 8 peer-to-peer').replace("'USDC','Cash on Delivery", "'USDC','TRON (USDT-TRC20)','Cash on Delivery"));
edit('src/app/pricing/pricing-content.tsx',s=>s.replace('Seven direct payment methods, on both plans','Eight direct payment methods, on both plans'));
edit('tests/pricing.test.ts',s=>s.replace('pricingPaymentMethods.length,7','pricingPaymentMethods.length,8'));
// A deterministic public test address, not a real seller destination.
const crypto=require('crypto'),payload=Buffer.concat([Buffer.from([65]),Buffer.alloc(20,1)]),checksum=crypto.createHash('sha256').update(crypto.createHash('sha256').update(payload).digest()).digest().subarray(0,4);let n=BigInt('0x'+Buffer.concat([payload,checksum]).toString('hex')),addr='';const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';while(n){addr=alphabet[Number(n%58n)]+addr;n/=58n;}
edit('tests/peer-payments.test.ts',s=>s.replace('const payments=normalizePayments({','const payments=normalizePayments({TRON_USDT:{enabled:true,wallet:'+JSON.stringify(addr)+'},').replace('submitPeerOrder({...base,method,escrow:',"submitPeerOrder({...base,reference:method==='TRON_USDT'?'b'.repeat(64):base.reference,method,escrow:"));
// Saving through the dedicated niche service also validates the TRON checksum.
edit('src/lib/multi-shop-service.ts',s=>s.replace("import 'server-only';", "import 'server-only';\nimport {validTronChecksum} from './tron-validation';").replace("if(!shop.shopId)throw", "if(shop.payments?.TRON_USDT.enabled&&!validTronChecksum(shop.payments.TRON_USDT.wallet))throw new ShopError('INVALID_TRON_WALLET');\n if(!shop.shopId)throw"));
