import {pageSeo} from '../lib/marketing-seo';
import { LanguageProvider } from "./language-context";
import { Header, Footer } from "./site-shell";
import { siteUrl } from "./site";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  ...pageSeo('home'),metadataBase: new URL(siteUrl),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><LanguageProvider><Header />{children}<Footer /></LanguageProvider></body></html>;
}

