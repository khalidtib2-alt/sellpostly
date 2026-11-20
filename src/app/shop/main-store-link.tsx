'use client';
import {useLanguage} from '../language-context';
import type {Shop} from './shop-data';
import {mainStoreHref} from './main-store-link-data';
export default function MainStoreLink({shop}:{shop:Shop}){const {t}=useLanguage(),href=mainStoreHref(shop);if(!href)return null;return <a href={href} className="main-store-link my-6 flex items-center justify-between gap-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 font-bold text-emerald-900"><span>{t('Browse All Categories in Our Main Store')}</span><span aria-hidden="true" className="main-store-arrow text-2xl">→</span></a>;}
