"use client";

import { useLanguage } from "./language-context";
import LocalizedSeo from './localized-seo';
import UserGuide from './user-guide';
import HomeShowcase from './home-showcase';
import {ArrowRight,Sparkles} from 'lucide-react';
import Formatter from "./formatter";


export default function HomeContent() {
  const { t } = useLanguage();
  return (
      <main className="saas-home"><LocalizedSeo kind="home"/>
        <section className="saas-hero"><div className="saas-hero-copy"><p className="saas-hero-badge"><Sparkles size={14} aria-hidden="true"/>{t('No-Code Affiliate Storefronts + Social Post Studio')}</p><h1>{t('Launch Your Curated Affiliate Storefront & Turn Any Product Link Into Ready-to-Post Ads in 10 Seconds')}</h1><p className="saas-hero-subtitle">{t('Temu, AliExpress, Amazon, and Shopify affiliate no-code storefront')}</p><div className="saas-hero-actions"><a className="saas-primary" href="/shop">{t('Create My Free Shop')}<ArrowRight size={17} aria-hidden="true" className="rtl:rotate-180"/></a><a className="saas-secondary" href="#formatter">{t('Try Post Formatter Free')}</a></div></div><HomeShowcase/></section>
        <section className="mx-auto max-w-6xl px-5 py-12" aria-labelledby="business-audiences"><h2 id="business-audiences" className="max-w-3xl text-3xl font-bold">{t('Built for Creators, E-Commerce Brands & Agencies (B2B)')}</h2><div className="mt-6 grid gap-5 md:grid-cols-3">{([
          ['Affiliate Creators','Curate partner deals, disclose affiliate links and share a focused storefront.'],
          ['Shopify / WooCommerce Brands','Import verified product details and prepare consistent copy and media for your brand.'],
          ['Social Commerce Agencies','Manage separate niche catalogs and prepare channel-ready content in one workspace.']
        ] as const).map(([title,description])=><article key={title} className="rounded-2xl border bg-white p-6"><h3 className="text-lg font-bold">{t(title)}</h3><p className="mt-3 text-sm leading-relaxed text-slate-600">{t(description)}</p></article>)}</div><a className="mt-6 inline-flex rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white" href="/pricing#brand-agency">{t('Explore Brand / Agency pricing')}</a></section>
        <section id="formatter" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-14"><Formatter /></section>
        <UserGuide />
      </main>
  );
}




