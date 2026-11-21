"use client";

import { useLanguage } from "./language-context";
import PlatformNotice from './platform-notice';
import BrandLogo from "./brand-logo";
import ThemePicker from "./theme-picker";
import Link from "next/link";
import {usePathname} from "next/navigation";
function currentLink(path:string,href:string){const route=href.split("#")[0];return path===route||(route!=="/"&&path.startsWith(route+"/"))?"page" as const:undefined;}

const links = [
 ["/pricing","Pricing"],
 ["/tools","Seller Media Tools"],
 ["/how-it-works","How SellPostly Works"],
 ["/shop","My Shop"],
  ["/prompt-generator", "Prompt Generator"], ["/guides", "Seller Guides"], ["/about", "About"], ["/contact", "Contact"],
  ["/privacy-policy", "Privacy Policy"], ["/terms", "Terms"],
] as const;

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const pathname=usePathname();
  return <header className="border-b border-slate-200"><nav aria-label={t("Main navigation")} className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
    <Link aria-current={currentLink(pathname,"/")} href="/" className="text-xl font-black tracking-tight"><BrandLogo /></Link>
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-700">
      <Link aria-current={currentLink(pathname,"/tools")} href="/tools">{t("Seller Media Tools")}</Link><Link aria-current={currentLink(pathname,"/pricing")} href="/pricing">{t("Pricing")}</Link><Link aria-current={currentLink(pathname,"/shop")} href="/shop">{t("My Shop")}</Link><Link aria-current={currentLink(pathname,"/#formatter")} href="/#formatter">{t("Post Formatter")}</Link><Link aria-current={currentLink(pathname,"/prompt-generator")} href="/prompt-generator">{t("Prompt Generator")}</Link><Link aria-current={currentLink(pathname,"/guides")} href="/guides">{t("Seller Guides")}</Link><Link aria-current={currentLink(pathname,"/extension")} href="/extension">{t("Chrome Extension")}</Link><Link aria-current={currentLink(pathname,"/how-it-works")} href="/how-it-works">{t("How SellPostly Works")}</Link><Link aria-current={currentLink(pathname,"/about")} href="/about">{t("About")}</Link><Link aria-current={currentLink(pathname,"/contact")} href="/contact">{t("Contact")}</Link>
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
  const { t } = useLanguage();const pathname=usePathname();
  return <footer className="border-t border-slate-200"><nav aria-label={t("Footer navigation")} className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-3 px-5 py-8 text-sm font-semibold text-slate-700">
    <Link aria-current={currentLink(pathname,"/")} href="/">SellPostly</Link>{links.map(([href, label]) => <Link key={href} aria-current={currentLink(pathname,href)} href={href}>{t(label)}</Link>)}
  </nav><PlatformNotice/></footer>;
}

export function ContentPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
    <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
    <p className="mt-5 text-lg leading-relaxed text-slate-600">{intro}</p>
    <div className="mt-10 grid gap-8 leading-relaxed text-slate-700">{children}</div>
  </main>;
}


