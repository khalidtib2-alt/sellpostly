import type { Metadata } from "next";
import Formatter from "./formatter";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
      <main>
        <section className="bg-emerald-50 px-5 py-16 text-center sm:py-24">
          <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Turn One Product Into Ready-to-Post Ads in 10 Seconds</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-700">Format once and copy-paste into WhatsApp Business, Instagram, Facebook Marketplace, and TikTok with zero API logins</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white" href="#formatter">Use Free Web Tool</a>
            <a className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold" href="#extension">Get Chrome Extension</a>
          </div>
        </section>
        <section id="formatter" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-14"><Formatter /></section>
        <section id="guides" className="bg-slate-50 px-5 py-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight">How It Works in 3 Steps</h2>
            <ol className="mt-7 grid list-decimal gap-5 pl-5 sm:grid-cols-3">
              <li className="pl-1"><strong>Enter your details</strong><p className="mt-1 text-slate-600">Add product details in Seller Mode or paste a hook in Creator Mode.</p></li>
              <li className="pl-1"><strong>Generate posts</strong><p className="mt-1 text-slate-600">Review the text formatted for each platform.</p></li>
              <li className="pl-1"><strong>Copy and publish</strong><p className="mt-1 text-slate-600">Paste the text into the platform and add your photos or video before publishing.</p></li>
            </ol>
          </div>
        </section>
        <section id="extension" className="mx-auto max-w-6xl px-5 py-10">
          <h2 className="text-2xl font-bold">Chrome Extension</h2><p className="mt-2 text-slate-600">Coming soon. The free web formatter is available now.</p>
        </section>
      </main>
  );
}

