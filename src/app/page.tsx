import {pageSeo} from '../lib/marketing-seo';
import type { Metadata } from "next";
import { HomepageProProvider } from "./pro-access";
import HomeContent from "./home-content";

export const metadata: Metadata = pageSeo('home');

export default function Home() {
  return <HomepageProProvider><HomeContent /></HomepageProProvider>;
}
