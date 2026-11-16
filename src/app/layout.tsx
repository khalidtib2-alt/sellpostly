import { LanguageProvider } from "./language-context";
import { Header, Footer } from "./site-shell";
import { siteUrl } from "./site";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "SellPostly — Turn One Product Into Ready-to-Post Ads for WhatsApp, Instagram, Facebook & TikTok in Seconds",
  description: "Format a product once and copy ready-to-post ads for WhatsApp Business, Instagram, Facebook Marketplace, and TikTok. Free and no API logins required.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><LanguageProvider><Header />{children}<Footer /></LanguageProvider></body></html>;
}

