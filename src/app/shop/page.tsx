import { pageMetadata } from "../site";
import ShopBuilder from "./shop-builder";
export const metadata = pageMetadata("/shop","My Shop | SellPostly","Build and share your product storefront.");
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;
 const isSharedBuyerView=Object.prototype.hasOwnProperty.call(params,"s");
 return <>{isSharedBuyerView&&<style>{"body > header, body > footer { display: none; }"}</style>}<ShopBuilder key={isSharedBuyerView?"buyer":"builder"} isSharedBuyerView={isSharedBuyerView}/></>;
}