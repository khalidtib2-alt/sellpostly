import { pageMetadata } from "../site";
import { Localized, LocalizedPage } from "../localized";

const title = "About SellPostly";
const intro = "SellPostly helps online sellers and creators turn one set of product details into posts for several platforms.";

export const metadata = pageMetadata("/about", title + " | SellPostly", intro);

export default function Page() {
  return <LocalizedPage title={title} intro={intro}>
    <section><h2 className="text-2xl font-bold"><Localized message={"Format once, publish where you sell"} /></h2><p><Localized message={"Seller Mode creates drafts for WhatsApp Business, Instagram, Facebook Marketplace, and TikTok. Creator Mode adapts a core post for LinkedIn, X, and Threads. Copy the draft, review it, and publish from your own account."} /></p></section>
    <section><h2 className="text-2xl font-bold"><Localized message={"Keep control of your accounts"} /></h2><p><Localized message={"SellPostly formats text in your browser without asking for platform passwords, API tokens, or account access."} /></p></section>
    <a className="text-emerald-800 underline" href="/#formatter"><Localized message={"Try the formatter"} /></a>
  </LocalizedPage>;
}
