import {publicStorefrontEntries} from '../lib/public-storefront';
import {productShareUrl} from './shop/product-links';
import type { MetadataRoute } from "next";
import guides from "./guide-data.json";
import { siteUrl } from "./site";

// Refresh published storefront URLs without requiring a new deployment.
export const revalidate=300;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ["/pricing","/tools","/how-it-works","/", "/shop", "/prompt-generator", "/extension", "/guides", "/about", "/contact", "/privacy-policy", "/terms",
    ...guides.map(([slug]) => "/guides/" + slug)];
  let stores:MetadataRoute.Sitemap=[];try{stores=await publicStorefrontEntries();}catch{console.warn('Public storefront sitemap unavailable; static pages remain listed.');}
  return [...paths.map(path => ({ url: productShareUrl(path) })),...stores];
}


