import type { Metadata } from "next";
import { HomepageProProvider } from "./pro-access";
import HomeContent from "./home-content";

export const metadata: Metadata = { title:"SellPostly | Product Posts, Personal Stores & Affiliate Deals",description:"Create product posts, build a Personal Store or Affiliate Deals Shop, and share across social channels. Explore the seller and buyer guide.", alternates: { canonical: "/" } };

export default function Home() {
  return <HomepageProProvider><HomeContent /></HomepageProProvider>;
}
