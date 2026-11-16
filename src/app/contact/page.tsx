import { pageMetadata } from "../site";
import { ContentPage } from "../site-shell";
import ContactForm from "./contact-form";

const title = "Contact SellPostly";
const intro = "Get help with the formatter, report a bug, or suggest a guide.";

export const metadata = pageMetadata("/contact", title + " | SellPostly", intro);

export default function Page() {
  return <ContentPage title={title} intro={intro}>
    <p>Email <a className="text-emerald-800 underline" href="mailto:support@sellpostly.com">support@sellpostly.com</a> directly or use the form to prepare a draft in your email app.</p><ContactForm />
  </ContentPage>;
}
