"use client";

import { useLanguage } from "./language-context";
import LocalizedSeo from './localized-seo';
import UserGuide from './user-guide';
import SocialConnect from './social-connect';
import Formatter from "./formatter";


export default function HomeContent() {
  const { t } = useLanguage();
  return (
      <main><LocalizedSeo kind="home"/>
        <section className="bg-emerald-50 px-5 py-16 text-center sm:py-24">
          <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{t("Turn One Product Into Ready-to-Post Ads in 10 Seconds")}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-700">{t("Format once and copy-paste into WhatsApp Business, Instagram, Facebook Marketplace, and TikTok with zero API logins")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white" href="#formatter">{t("Use Free Web Tool")}</a>
            <a className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold" href="/extension">{t("Get Chrome Extension")}</a>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-5 py-12" aria-labelledby="business-audiences"><h2 id="business-audiences" className="max-w-3xl text-3xl font-bold">{t('Built for Creators, E-Commerce Brands & Agencies (B2B)')}</h2><div className="mt-6 grid gap-5 md:grid-cols-3">{([
          ['Affiliate Creators','Curate partner deals, disclose affiliate links and share a focused storefront.'],
          ['Shopify / WooCommerce Brands','Import verified product details and prepare consistent copy and media for your brand.'],
          ['Social Commerce Agencies','Manage separate niche catalogs and prepare channel-ready content in one workspace.']
        ] as const).map(([title,description])=><article key={title} className="rounded-2xl border bg-white p-6"><h3 className="text-lg font-bold">{t(title)}</h3><p className="mt-3 text-sm leading-relaxed text-slate-600">{t(description)}</p></article>)}</div><a className="mt-6 inline-flex rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white" href="/pricing#brand-agency">{t('Explore Brand / Agency pricing')}</a></section>
        <section id="formatter" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-14"><Formatter /></section>
        <UserGuide />
        <SocialConnect />
        <section id="extension" className="mx-auto max-w-6xl px-5 py-10">
          <h2 className="text-2xl font-bold">{t("Chrome Extension")}</h2><p className="mt-2 text-slate-600">{t("Format and copy posts from the Chrome toolbar.")}</p><a href="/extension" className="mt-3 inline-block font-semibold text-emerald-800 underline">{t("Install the Chrome extension")}</a>
        </section>
      </main>
  );
}




