import Link from "next/link";
import { pageMetadata } from "../site";
import { Localized, LocalizedPage } from "../localized";

const intro = "Format seller listings and creator posts from the Chrome toolbar. SellPostly processes your drafts inside the popup and requests zero Chrome permissions.";

export const metadata = pageMetadata("/extension", "SellPostly Chrome Extension | Installation Guide", intro);

export default function ExtensionPage() {
  return <LocalizedPage title={"SellPostly Chrome Extension"} intro={intro}>
    <section>
      <h2 className="text-2xl font-bold text-slate-900"><Localized message={"Install the unpacked extension"} /></h2>
      <ol className="mt-3 list-decimal space-y-2 ps-5">
        <li><Localized message={"Find the "} /><code>chrome-extension</code><Localized message={" folder in your copy of the SellPostly project. If you received it in a ZIP file, extract it first."} /></li>
        <li><Localized message={"Open "} /><code>chrome://extensions</code><Localized message={" in Chrome and turn on "} /><strong><Localized message={"Developer mode"} /></strong>.</li>
        <li><Localized message={"Select "} /><strong><Localized message={"Load unpacked"} /></strong><Localized message={" and choose the folder that contains "} /><code>manifest.json</code>.</li>
        <li><Localized message={"Open Chrome’s Extensions menu and pin SellPostly so you can launch it from the toolbar."} /></li>
      </ol>
    </section>
    <section>
      <h2 className="text-2xl font-bold text-slate-900"><Localized message={"Format and copy a post"} /></h2>
      <p className="mt-3"><Localized message={"In Seller Mode, enter your product name, price, delivery details, and features. In Creator Mode, paste your draft or hook."} /></p>
      <p className="mt-3"><Localized message={"Select "} /><strong><Localized message={"Format Posts"} /></strong><Localized message={", choose a platform tab, and click "} /><strong><Localized message={"Copy"} /></strong><Localized message={". Paste the text into the platform, review it, and publish when ready."} /></p>
    </section>
    <Link className="font-semibold text-emerald-800 underline" href="/#formatter"><Localized message={"Use the free web formatter"} /></Link>
  </LocalizedPage>;
}
