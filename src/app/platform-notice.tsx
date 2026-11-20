'use client';
import {useLanguage} from './language-context';
export const platformNotice='SellPostly is strictly a SaaS storefront software provider. Independent shops do not represent the SellPostly brand. Products, fulfillment, payments and direct transactions are solely between the buyer and the independent seller.';
export default function PlatformNotice(){const {t}=useLanguage();return <aside className="mx-auto my-5 max-w-6xl rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">{t(platformNotice)}</aside>;}
