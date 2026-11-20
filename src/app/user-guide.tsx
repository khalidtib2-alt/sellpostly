'use client';
import {useLanguage} from './language-context';
import type {Message} from './translations';
import guide from './user-guide-data.json';
export function faqSchema(questions:{question:string;answer:string}[],language:string){return {'@context':'https://schema.org','@type':'FAQPage',inLanguage:language,mainEntity:questions.map(({question,answer})=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}))};}
export function jsonLd(value:unknown){return JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');}
export default function UserGuide({standalone=false}:{standalone?:boolean}){
 const {t,language}=useLanguage(),translate=(value:string)=>t(value as Message);
 const faqs=guide.faq.map(([question,answer])=>({question:translate(question),answer:translate(answer)}));
 const Heading=standalone?'h1':'h2';
 return <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-8 px-5 py-16">
  <p className="mb-3 text-sm font-bold uppercase tracking-widest text-emerald-700">SellPostly</p>
  <Heading className="max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">{t('How SellPostly Works & User Guide')}</Heading>
  <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600">{t('Create a store, share it anywhere, and make the next step clear for every buyer.')}</p>
  {(['seller','buyer'] as const).map(group=><section key={group} className="mt-12"><h2 className="text-2xl font-bold">{t(group==='seller'?'For sellers: from product to shared storefront':'For buyers: browse, check, then order')}</h2><ol className={'mt-6 grid gap-5 '+(group==='seller'?'md:grid-cols-2':'md:grid-cols-3')}>{guide[group].map(([title,body],i)=><li key={title} id={group==='seller'&&i===3?'share-anywhere':undefined} className="rounded-2xl border border-slate-200 bg-white p-6"><span className="mb-4 inline-flex size-9 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">{i+1}</span><h3 className="text-lg font-bold">{translate(title)}</h3><p className="mt-3 leading-relaxed text-slate-600">{translate(body)}</p></li>)}</ol></section>)}
  <section className="mt-14"><h2 className="text-2xl font-bold">{t('Who SellPostly Works Best For')}</h2><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{guide.audiences.map(([title,body])=><article key={title} className="rounded-2xl bg-slate-50 p-6"><h3 className="font-bold text-emerald-800">{translate(title)}</h3><p className="mt-3 text-sm leading-relaxed text-slate-600">{translate(body)}</p></article>)}</div></section>
  <section className="mt-14"><h2 className="mb-6 text-2xl font-bold">{t('Questions before you start')}</h2><div className="grid gap-3">{faqs.map(({question,answer})=><details key={question} className="rounded-xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer font-bold">{question}</summary><p className="mt-4 max-w-4xl leading-relaxed text-slate-600">{answer}</p></details>)}</div></section>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(faqSchema(faqs,language))}}/>
 </section>;
}
