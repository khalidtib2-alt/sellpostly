import type { Metadata } from "next";
import { HomepageProProvider } from "./pro-access";
import HomeContent from "./home-content";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return <HomepageProProvider><HomeContent /></HomepageProProvider>;
}
