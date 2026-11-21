'use client';
import {useLanguage} from '../language-context';
import type {Shop} from './shop-data';
import {refundPolicyLabels,storePolicyReady} from './store-policy-data';
export default function StorePolicy({shop}:{shop:Shop}){const {t}=useLanguage();if(shop.shopMode!=='personal')return null;return <section className="my-5 rounded-2xl border bg-slate-50 p-5" aria-label={t('Refund & Delivery Policy')}><h3 className="font-bold">{t('Refund & Delivery Policy')}</h3>{storePolicyReady(shop)?<><p className="mt-3 font-semibold">{t(refundPolicyLabels[shop.refundPolicy!])}</p><p className="mt-2 whitespace-pre-wrap text-sm">{shop.deliveryTimeframe}</p></>:<p role="alert" className="mt-3 text-sm">{t('This seller has not provided a refund and delivery policy yet. Checkout is unavailable until it is configured.')}</p>}<p className="mt-3 text-xs text-slate-600">{t('This is the independent seller’s policy. Mandatory consumer rights still apply where required by law.')}</p></section>;}
