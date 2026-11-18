import { notFound } from 'next/navigation';
import { publicShop } from '../../../lib/db';
import ShopBuilder from '../../shop/shop-builder';
export const dynamic='force-dynamic';
export const metadata={title:'Storefront | SellPostly'};
export default async function PublicStore({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const shop=await publicShop(slug);
  if(!shop)notFound();
  return <><style>{'body > header, body > footer { display: none; }'}</style><ShopBuilder isSharedBuyerView initialShop={shop}/></>;
}
