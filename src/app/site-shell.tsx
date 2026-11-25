"use client";
import {useLanguage} from './language-context';
import {platformNotice} from './platform-notice';
import BrandLogo from './brand-logo';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {ArrowRight,Menu} from 'lucide-react';
function currentLink(path:string,href:string){const route=href.split('#')[0];return path===route||(route!=='/'&&path.startsWith(route+'/'))?'page' as const:undefined;}
const primaryLinks=[['/#formatter','Post Formatter'],['/shop','My Shop'],['/pricing','Pricing']] as const;
function LanguagePill(){const {language,setLanguage,t}=useLanguage();return <div className="saas-language" role="group" aria-label={t('Language')}>{(['en','fr','es','ar'] as const).map(code=><button key={code} type="button" lang={code} aria-pressed={language===code} onClick={()=>setLanguage(code)}>{code.toUpperCase()}</button>)}</div>;}
export function Header(){const {t}=useLanguage(),pathname=usePathname();return <header className="saas-header"><nav className="saas-header-row" aria-label={t('Main navigation')}>
 <Link href="/" aria-label="SellPostly" className="saas-brand"><BrandLogo/></Link>
 <div className="saas-primary-nav">{primaryLinks.map(([href,label])=><Link key={href} href={href} aria-current={currentLink(pathname,href)}>{t(label)}</Link>)}</div>
 <div className="saas-header-actions"><LanguagePill/><Link className="saas-extension-link" href="/extension">{t('Chrome Extension')}</Link><Link className="saas-primary saas-start" href="/shop" aria-label={t('Start Free')}><span className="saas-start-full">{t('Start Free')}</span><span className="saas-start-short">{t('Free')}</span><ArrowRight size={16} aria-hidden="true" className="rtl:rotate-180"/></Link>
 <details className="saas-mobile-menu"><summary aria-label={t('Open navigation')}><Menu size={21}/></summary><div>{primaryLinks.map(([href,label])=><Link key={href} href={href} aria-current={currentLink(pathname,href)} onClick={e=>e.currentTarget.closest('details')?.removeAttribute('open')}>{t(label)}</Link>)}<Link href="/extension">{t('Chrome Extension')}</Link></div></details></div>
 </nav></header>;}
export function Footer(){const {t}=useLanguage();return <footer className="saas-footer"><div className="saas-footer-grid">
 <div><Link href="/" className="saas-brand" aria-label="SellPostly"><BrandLogo/></Link><p className="saas-footer-tagline">{t('No-Code Affiliate Storefronts + Social Post Studio')}</p></div>
 <nav aria-label={t('Explore SellPostly')}><Link href="/how-it-works">{t('How SellPostly Works')}</Link><Link href="/about">{t('About')}</Link></nav>
 <nav aria-label={t('Support & Legal')}><Link href="/contact">{t('Contact')}</Link><Link href="/privacy-policy">{t('Privacy Policy')}</Link><Link href="/terms">{t('Terms')}</Link></nav>
 </div><div className="saas-footer-bottom"><p>© {new Date().getUTCFullYear()} SellPostly. {t('All rights reserved.')}</p><p className="saas-footer-legal">{t(platformNotice)}</p></div></footer>;}

export function ContentPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
    <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
    <p className="mt-5 text-lg leading-relaxed text-slate-600">{intro}</p>
    <div className="mt-10 grid gap-8 leading-relaxed text-slate-700">{children}</div>
  </main>;
}


