import Link from "next/link";

const links = [
  ["/prompt-generator", "Prompt Generator"], ["/guides", "Seller Guides"], ["/about", "About"], ["/contact", "Contact"],
  ["/privacy-policy", "Privacy Policy"], ["/terms", "Terms"],
];

export function Header() {
  return <header className="border-b border-slate-200"><nav aria-label="Main navigation" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
    <Link href="/" className="text-xl font-black tracking-tight"><span className="text-emerald-700">Sell</span>Postly</Link>
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-700">
      <Link href="/#formatter">Post Formatter</Link><Link href="/prompt-generator">Prompt Generator</Link><Link href="/guides">Seller Guides</Link><Link href="/#extension">Chrome Extension</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link>
    </div>
  </nav></header>;
}

export function Footer() {
  return <footer className="border-t border-slate-200"><nav aria-label="Footer navigation" className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-3 px-5 py-8 text-sm font-semibold text-slate-700">
    <Link href="/">SellPostly</Link>{links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
  </nav></footer>;
}

export function ContentPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
    <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
    <p className="mt-5 text-lg leading-relaxed text-slate-600">{intro}</p>
    <div className="mt-10 grid gap-8 leading-relaxed text-slate-700">{children}</div>
  </main>;
}

