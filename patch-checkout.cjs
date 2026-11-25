const fs=require('fs');const base=process.cwd();const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);const edit=(p,f)=>write(p,f(read(p)));
write('src/app/shop/checkout-amount.ts',`/** Display only: accounting and payment payloads retain their exact precision. */
export function checkoutAmount(value:string){
 if(!/^\\d+(?:\\.\\d{1,6})?$/.test(value))return value;
 const [whole,fraction='']=value.split('.');
 const micros=BigInt(whole)*1000000n+BigInt(fraction.padEnd(6,'0'));
 const cents=(micros+5000n)/10000n;
 return (cents/100n).toString()+'.'+(cents%100n).toString().padStart(2,'0');
}
`);
edit('src/app/shop/escrow-config.ts',s=>s.replace("export const escrowWallet=(process.env.NEXT_PUBLIC_ESCROW_WALLET||'').trim();",`// Platform configuration only. Never fall back to a seller-supplied wallet.
export function resolveEscrowWallet(admin:unknown,legacy:unknown){
 const primary=typeof admin==='string'?admin.trim():'';
 return primary||(typeof legacy==='string'?legacy.trim():'');
}
export const escrowWallet=resolveEscrowWallet(process.env.NEXT_PUBLIC_ADMIN_ESCROW_USDC_WALLET,process.env.NEXT_PUBLIC_ESCROW_WALLET);`));
edit('src/app/shop/peer-checkout.tsx',s=>s.replace("import {escrowReady} from './escrow-config';","import {escrowReady,escrowWallet,escrowNetwork} from './escrow-config';\nimport {checkoutAmount} from './checkout-amount';").replace("total.amount+' '+total.currency","checkoutAmount(total.amount)+' '+total.currency").replace("{useEscrow?<><p",`{useEscrow?<><section className="my-4 rounded-xl border p-4"><label className="block font-semibold">{tr('Admin Escrow USDC Wallet (Locked)')}<input readOnly dir="ltr" value={escrowWallet} className={field}/></label><p className="mt-2 text-sm">{tr('This address is controlled by the platform and cannot be edited at checkout.')}</p><span className="my-2 inline-block rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-900">{escrowNetwork} · USDC</span><button type="button" disabled={!escrowReady} onClick={()=>void copy(escrowWallet)} className="ms-2 rounded-lg border px-3 py-2 disabled:opacity-50">{t('Copy Address')}</button></section><p`));
edit('src/app/shop/crypto-checkout.tsx',s=>s.replace('import { stableAmount }',"import { checkoutAmount } from './checkout-amount';\nimport { stableAmount }").replace('{payment.amount} {coin}','{checkoutAmount(payment.amount)} {coin}').replace('{t("Wallet Address")}<input readOnly','{t("Admin Escrow USDC Wallet (Locked)")}<input readOnly').replace('<div className="flex flex-wrap gap-2"><button','<p className="mb-3 text-sm">{t("This address is controlled by the platform and cannot be edited at checkout.")}</p>\n    <div className="flex flex-wrap gap-2"><button'));
edit('src/app/translations.ts',s=>s.replace('export const translations = {',`export const translations = {
 "Admin Escrow USDC Wallet (Locked)":{"fr":"Portefeuille USDC de séquestre administrateur (verrouillé)","ar":"محفظة USDC لضمان المسؤول (مقفلة)"},
 "This address is controlled by the platform and cannot be edited at checkout.":{"fr":"Cette adresse est gérée par la plateforme et ne peut pas être modifiée lors du paiement.","ar":"تدير المنصة هذا العنوان ولا يمكن تعديله عند الدفع."},`));
