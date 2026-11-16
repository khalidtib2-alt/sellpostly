import Link from "next/link";
import { notFound } from "next/navigation";
import rawGuides from "../../guide-data.json";
import { pageMetadata } from "../../site";
import { ContentPage } from "../../site-shell";

type Guide = [slug: string, title: string, intro: string, sections: [heading: string, body: string, template: string][]];
const guides = rawGuides as Guide[];
type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return guides.map(([slug]) => ({ slug }));
}

async function getGuide(params: Props["params"]) {
  const { slug } = await params;
  const guide = guides.find(([id]) => id === slug);
  if (!guide) notFound();
  return guide;
}

export async function generateMetadata({ params }: Props) {
  const [slug, title, intro] = await getGuide(params);
  return pageMetadata("/guides/" + slug, title + " | SellPostly", intro);
}

export default async function GuidePage({ params }: Props) {
  const [slug, title, intro, sections] = await getGuide(params);
  return <ContentPage title={title} intro={intro}>
    {sections.map(([heading, body, template]) => <section key={heading}>
      <h2 className="text-2xl font-bold text-slate-900">{heading}</h2>
      <p className="mt-2">{body}</p>
      <pre className="mt-4 whitespace-pre-wrap wrap-break-word rounded-xl border border-emerald-100 bg-emerald-50 p-5 text-sm leading-relaxed">{template}</pre>
    </section>)}
    <Link className="font-semibold text-emerald-800 underline" href="/#formatter">Format your product details</Link>
    <section>
      <h2 className="text-xl font-bold text-slate-900">More seller guides</h2>
      <ul className="mt-2 space-y-2">{guides.filter(([id]) => id !== slug).map(([id, name]) => <li key={id}><Link className="text-emerald-800 underline" href={"/guides/" + id}>{name}</Link></li>)}</ul>
      <Link className="mt-3 inline-block text-emerald-800 underline" href="/guides">All seller guides</Link>
    </section>
  </ContentPage>;
}
