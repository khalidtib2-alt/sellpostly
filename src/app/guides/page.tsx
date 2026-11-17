import Link from "next/link";
import guides from "../guide-data.json";
import { pageMetadata } from "../site";
import { Localized, LocalizedPage } from "../localized";
import type { Message } from "../translations";

export const metadata = pageMetadata("/guides", "Seller Guides | SellPostly", "Copy-ready product listing and caption templates for WhatsApp Business, Facebook Marketplace, Instagram, and TikTok Shop.");

export default function GuidesPage() {
  return <LocalizedPage title="Seller Guides" intro="Find a listing or caption template for the platform you sell on. Replace the bracketed details with your own product information before posting.">
    <ul className="grid gap-4 sm:grid-cols-2">{guides.map(([slug, title, intro]) => (
      <li key={slug as string} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <Link href={"/guides/" + slug} className="font-bold text-emerald-800 underline underline-offset-4"><Localized message={title as Message} /></Link>
        <p className="mt-2 text-sm"><Localized message={intro as Message} /></p>
      </li>
    ))}</ul>
    <Link href="/#formatter" className="font-semibold text-emerald-800 underline"><Localized message={"Open the free post formatter"} /></Link>
  </LocalizedPage>;
}
