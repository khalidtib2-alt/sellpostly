import type { MetadataRoute } from "next";
import guides from "./guide-data.json";
import { siteUrl } from "./site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/prompt-generator", "/extension", "/guides", "/about", "/contact", "/privacy-policy", "/terms",
    ...guides.map(([slug]) => "/guides/" + slug)];
  return paths.map(path => ({ url: new URL(path, siteUrl).href }));
}


