import { pageMetadata } from "../site";
import { ContentPage } from "../site-shell";

const title = "Privacy Policy";
const intro = "SellPostly formats your drafts locally in your browser.";

export const metadata = pageMetadata("/privacy-policy", title + " | SellPostly", intro);

export default function Page() {
  return <ContentPage title={title} intro={intro}>
    <section><h2 className="text-2xl font-bold">Product data and drafts</h2><p>SellPostly does not send your formatter inputs or outputs to our servers, store them in a database, or sell your product data. When you click Copy Text, the draft goes to your device clipboard. Any platform where you paste the draft handles it under its own privacy policy.</p></section>
    <section><h2 className="text-2xl font-bold">Support and hosting</h2><p>If you email support, we receive your email address and the information you send and use it to respond. Our hosting provider may process standard connection data, such as IP addresses and request logs, to serve and protect the site.</p></section>
    <section><h2 className="text-2xl font-bold">Advertising and cookies</h2><p>If Google AdSense is enabled, Google and other ad vendors may place or read cookies or use web beacons, IP addresses, and similar identifiers to serve and measure ads. Google and its partners may personalize ads based on visits to this and other sites.</p><p className="mt-3">Read <a className="text-emerald-800 underline" href="https://policies.google.com/technologies/partner-sites">how Google uses data from partner sites</a> or manage personalized ads in <a className="text-emerald-800 underline" href="https://myadcenter.google.com/">Google My Ad Center</a>.</p></section>
    <p>Privacy questions can go to <a className="text-emerald-800 underline" href="mailto:support@sellpostly.com">support@sellpostly.com</a>.</p>
  </ContentPage>;
}
