import Link from "next/link";
import { pageMetadata } from "../site";
import { ContentPage } from "../site-shell";

const intro = "Format seller listings and creator posts from the Chrome toolbar. SellPostly processes your drafts inside the popup and requests zero Chrome permissions.";

export const metadata = pageMetadata("/extension", "SellPostly Chrome Extension | Installation Guide", intro);

export default function ExtensionPage() {
  return <ContentPage title="SellPostly Chrome Extension" intro={intro}>
    <section>
      <h2 className="text-2xl font-bold text-slate-900">Install the unpacked extension</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        <li>Find the <code>chrome-extension</code> folder in your copy of the SellPostly project. If you received it in a ZIP file, extract it first.</li>
        <li>Open <code>chrome://extensions</code> in Chrome and turn on <strong>Developer mode</strong>.</li>
        <li>Select <strong>Load unpacked</strong> and choose the folder that contains <code>manifest.json</code>.</li>
        <li>Open Chrome’s Extensions menu and pin SellPostly so you can launch it from the toolbar.</li>
      </ol>
    </section>
    <section>
      <h2 className="text-2xl font-bold text-slate-900">Format and copy a post</h2>
      <p className="mt-3">In Seller Mode, enter your product name, price, delivery details, and features. In Creator Mode, paste your draft or hook.</p>
      <p className="mt-3">Select <strong>Format Posts</strong>, choose a platform tab, and click <strong>Copy</strong>. Paste the text into the platform, review it, and publish when ready.</p>
    </section>
    <Link className="font-semibold text-emerald-800 underline" href="/#formatter">Use the free web formatter</Link>
  </ContentPage>;
}
