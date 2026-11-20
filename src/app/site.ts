import {productShareUrl} from './shop/product-links';
import type { Metadata } from "next";

import {appUrl} from "../lib/public-url";
export const siteUrl = productShareUrl('/');

export function pageMetadata(path: string, title: string, description: string): Metadata {
  return { title, description, alternates: { canonical: path } };
}
