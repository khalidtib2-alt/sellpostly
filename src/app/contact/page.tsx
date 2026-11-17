import { pageMetadata } from "../site";
import { Localized, LocalizedPage } from "../localized";
import ContactForm from "./contact-form";

const title = "Contact SellPostly";
const intro = "Get help with the formatter, report a bug, or suggest a guide.";

export const metadata = pageMetadata("/contact", title + " | SellPostly", intro);

export default function Page() {
  return <LocalizedPage title={title} intro={intro}>
    <p><Localized message={"Email "} /><a className="text-emerald-800 underline" href="mailto:support@sellpostly.com">support@sellpostly.com</a><Localized message={" directly or use the form to prepare a draft in your email app."} /></p><ContactForm />
  </LocalizedPage>;
}
