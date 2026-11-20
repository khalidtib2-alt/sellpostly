"use client";

import { useLanguage } from "./language-context";
import PlatformNotice from './platform-notice';
import BrandLogo from "./brand-logo";
import ThemePicker from "./theme-picker";
import Link from "next/link";

const links = [
 ["/tools","Seller Media Tools"],
 ["/how-it-works","How SellPostly Works"],
 ["/shop","My Shop"],
  ["/prompt-generator", "Prompt Generator"], ["/guides", "Seller Guides"], ["/about", "About"], ["/contact", "Contact"],
  ["/privacy-policy", "Privacy Policy"], ["/terms", "Terms"],
] as const;

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  return <header className="border-b border-slate-200"><nav aria-label={t("Main navigation")} className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
    <Link href="/" className="text-xl font-black tracking-tight"><BrandLogo /></Link>
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-700">
      <Link href="/tools">{t("Seller Media Tools")}</Link><Link href="/shop">{t("My Shop")}</Link><Link href="/#formatter">{t("Post Formatter")}</Link><Link href="/prompt-generator">{t("Prompt Generator")}</Link><Link href="/guides">{t("Seller Guides")}</Link><Link href="/extension">{t("Chrome Extension")}</Link><Link href="/how-it-works">{t("How SellPostly Works")}</Link><Link href="/about">{t("About")}</Link><Link href="/contact">{t("Contact")}</Link>
    </div>
    <div role="group" aria-label={language === "ar" ? "اللغة" : language === "fr" ? "Langue" : "Language"} className="inline-flex rounded-full bg-slate-100 p-1 text-sm font-bold">
      {([["en", "EN"], ["fr", "FR"], ["ar", "العربية"]] as const).map(([code, label]) => (
        <button key={code} type="button" lang={code} aria-pressed={language === code} onClick={() => setLanguage(code)}
          className={"rounded-full px-3 py-1 " + (language === code ? "bg-emerald-700 text-white" : "text-slate-800")}>{label}</button>
      ))}
    </div>
    <ThemePicker />
  </nav></header>;
}

export function Footer() {
  const { t } = useLanguage();
  return <footer className="border-t border-slate-200"><nav aria-label={t("Footer navigation")} className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-3 px-5 py-8 text-sm font-semibold text-slate-700">
    <Link href="/">SellPostly</Link>{links.map(([href, label]) => <Link key={href} href={href}>{t(label)}</Link>)}
  </nav><PlatformNotice/></footer>;
}

export function ContentPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
    <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
    <p className="mt-5 text-lg leading-relaxed text-slate-600">{intro}</p>
    <div className="mt-10 grid gap-8 leading-relaxed text-slate-700">{children}</div>
  </main>;
}


