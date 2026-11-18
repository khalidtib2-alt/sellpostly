import { pageMetadata } from '../site';
import ShopBuilder from './shop-builder';
import ProGate from './pro-gate';
export const metadata=pageMetadata('/shop','SellPostly Pro Storefront','Create a branded Pro storefront. The social formatter stays free.');
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const params=await searchParams;
  // Preserve existing buyer snapshot links; these never expose the seller builder.
  const shared=Object.prototype.hasOwnProperty.call(params,'s');
  return shared?<><style>{'body > header, body > footer { display: none; }'}</style><ShopBuilder isSharedBuyerView/></>:<ProGate/>;
}
