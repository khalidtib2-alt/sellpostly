import { pageMetadata } from "../site";
import { Localized, LocalizedPage } from "../localized";

const title = "Privacy Policy";
const intro = "SellPostly formats your drafts locally in your browser.";

export const metadata = pageMetadata("/privacy-policy", title + " | SellPostly", intro);

export default function Page() {
  return <LocalizedPage title={title} intro={intro}>
    <section><h2 className="text-2xl font-bold"><Localized message={"Product data and drafts"} /></h2><p><Localized message={"Standard text formatting and canvas media edits run locally. Optional Gemini features send the text you submit through our server to Google when configured; product photos are not uploaded to Gemini. Published shop catalogs and order records are stored for storefront and checkout features. We do not sell your product data. Clipboard actions stay on your device; external platforms apply their own privacy policies."} /></p></section>
    <section><h2 className="text-2xl font-bold"><Localized message={"Support and hosting"} /></h2><p><Localized message={"If you email support, we receive your email address and the information you send and use it to respond. Our hosting provider may process standard connection data, such as IP addresses and request logs, to serve and protect the site."} /></p></section>
    <section><h2 className="text-2xl font-bold"><Localized message={"Advertising and cookies"} /></h2><p><Localized message={"If Google AdSense is enabled, Google and other ad vendors may place or read cookies or use web beacons, IP addresses, and similar identifiers to serve and measure ads. Google and its partners may personalize ads based on visits to this and other sites."} /></p><p className="mt-3"><Localized message={"Read "} /><a className="text-emerald-800 underline" href="https://policies.google.com/technologies/partner-sites"><Localized message={"how Google uses data from partner sites"} /></a><Localized message={" or manage personalized ads in "} /><a className="text-emerald-800 underline" href="https://myadcenter.google.com/"><Localized message={"Google My Ad Center"} /></a>.</p></section>
    <p><Localized message={"Privacy questions can go to "} /><a className="text-emerald-800 underline" href="mailto:sellpostly.support@gmail.com">sellpostly.support@gmail.com</a>.</p>
  </LocalizedPage>;
}
