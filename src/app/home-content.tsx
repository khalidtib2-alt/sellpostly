"use client";

import { useLanguage } from "./language-context";
import Formatter from "./formatter";


export default function HomeContent() {
  const { t } = useLanguage();
  return (
      <main>
        <section className="bg-emerald-50 px-5 py-16 text-center sm:py-24">
          <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{t("Turn One Product Into Ready-to-Post Ads in 10 Seconds")}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-700">{t("Format once and copy-paste into WhatsApp Business, Instagram, Facebook Marketplace, and TikTok with zero API logins")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white" href="#formatter">{t("Use Free Web Tool")}</a>
            <a className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold" href="/extension">{t("Get Chrome Extension")}</a>
          </div>
        </section>
        <section id="formatter" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-14"><Formatter /></section>
        <section id="guides" className="bg-slate-50 px-5 py-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight">{t("How It Works in 3 Steps")}</h2>
            <ol className="mt-7 grid list-decimal gap-5 ps-5 sm:grid-cols-3">
              <li className="ps-1"><strong>{t("Enter your details")}</strong><p className="mt-1 text-slate-600">{t("Add product details in Seller Mode or paste a hook in Creator Mode.")}</p></li>
              <li className="ps-1"><strong>{t("Generate posts")}</strong><p className="mt-1 text-slate-600">{t("Review the text formatted for each platform.")}</p></li>
              <li className="ps-1"><strong>{t("Copy and publish")}</strong><p className="mt-1 text-slate-600">{t("Paste the text into the platform and add your photos or video before publishing.")}</p></li>
            </ol>
          </div>
        </section>
        <section id="extension" className="mx-auto max-w-6xl px-5 py-10">
          <h2 className="text-2xl font-bold">{t("Chrome Extension")}</h2><p className="mt-2 text-slate-600">{t("Format and copy posts from the Chrome toolbar.")}</p><a href="/extension" className="mt-3 inline-block font-semibold text-emerald-800 underline">{t("Install the Chrome extension")}</a>
        </section>
      </main>
  );
}


