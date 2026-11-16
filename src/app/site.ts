import type { Metadata } from "next";

export const siteUrl = "https://sellpostly.com";

export function pageMetadata(path: string, title: string, description: string): Metadata {
  return { title, description, alternates: { canonical: path } };
}
