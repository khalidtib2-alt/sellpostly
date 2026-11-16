import { pageMetadata } from "../site";
import { ContentPage } from "../site-shell";

const title = "Terms of Use";
const intro = "These terms apply to the SellPostly website, formatter, and guides.";

export const metadata = pageMetadata("/terms", title + " | SellPostly", intro);

export default function Page() {
  return <ContentPage title={title} intro={intro}>
    <section><h2 className="text-2xl font-bold">Using SellPostly</h2><p>You may use and adapt the templates and formatted drafts for your own posts. Use content you have permission to publish. Do not use SellPostly to create deceptive listings, infringe someone’s rights, or interfere with the site.</p></section>
    <section><h2 className="text-2xl font-bold">Review before publishing</h2><p>Check prices, availability, product claims, and delivery terms before posting. You are responsible for your listings and compliance with applicable rules and platform policies. Third-party platforms control their own features and accounts.</p></section>
    <section><h2 className="text-2xl font-bold">Availability</h2><p>SellPostly is provided as available. We may update templates or change features. We do not guarantee platform acceptance or sales results.</p></section>
    <p>Questions about these terms can go to <a className="text-emerald-800 underline" href="mailto:support@sellpostly.com">support@sellpostly.com</a>.</p>
  </ContentPage>;
}
