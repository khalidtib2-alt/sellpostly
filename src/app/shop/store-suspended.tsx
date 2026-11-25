'use client';
import { useLanguage } from '../language-context';
export default function StoreSuspended(){
 const {t,language,setLanguage}=useLanguage();
 return <main className="mx-auto flex min-h-[80vh] max-w-2xl flex-col justify-center px-5 py-16 text-center"><div role="group" aria-label={t('Language')} className="mb-10 flex justify-center gap-2">{(['en','fr','es','ar'] as const).map(code=><button key={code} lang={code} aria-pressed={language===code} onClick={()=>setLanguage(code)} className={language===code?'rounded-full bg-emerald-700 px-4 py-2 text-white':'rounded-full border px-4 py-2'}>{code.toUpperCase()}</button>)}</div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-8"><div aria-hidden="true" className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full border border-slate-300 text-2xl">!</div><h1 className="text-3xl font-black">{t('Store Suspended for Policy Review')}</h1><p className="mt-4 text-slate-600">{t('This store is temporarily unavailable. New orders are disabled while the store is reviewed.')}</p></div></main>;
}

