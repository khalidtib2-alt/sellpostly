import { pageMetadata } from "../site";
import ShopBuilder from "./shop-builder";
export const metadata = pageMetadata("/shop","My Shop | SellPostly","Build and share your product storefront.");
export default function Page(){return <ShopBuilder />;}
