import {publicLink} from '../../../lib/public-url';
import { notFound } from 'next/navigation';
import { publicShop } from '../../../lib/db';
import BuyerStoreFooter from '../../shop/buyer-store-footer';
import StoreSuspended from '../../shop/store-suspended';
import ShopBuilder from '../../shop/shop-builder';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return {title:'Storefront | SellPostly',alternates:{canonical:publicLink('/s/'+encodeURIComponent(slug))}};}
export default async function PublicStore({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const shop=await publicShop(slug);
  if(!shop)notFound();
  if(shop.suspended)return <><style>{"body > header, body > footer { display: none; }"}</style><StoreSuspended/><div className="mx-auto max-w-2xl px-5 pb-10"><BuyerStoreFooter storeSlug={slug}/></div></>;
  return <><style>{'body > header, body > footer { display: none; }'}</style><ShopBuilder isSharedBuyerView initialShop={shop} publicSlug={slug} verifiedStore={shop.verified}/></>;
}
