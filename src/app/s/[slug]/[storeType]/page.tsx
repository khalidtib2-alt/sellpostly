import {loadPublicStore} from '../../../../lib/public-storefront';
import {storefrontMetadata} from '../../../../lib/storefront-seo';
import {notFound} from 'next/navigation';
import {publicShop} from '../../../../lib/db';
import {productShareUrl,storePath} from '../../../shop/product-links';
import ShopBuilder from '../../../shop/shop-builder';
import StoreSuspended from '../../../shop/store-suspended';
export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string;storeType:string}>};
export async function generateMetadata({params}:Props){const {slug,storeType}=await params;if(storeType!=='affiliate'&&storeType!=='personal')return {robots:{index:false,follow:false}};return storefrontMetadata(slug,storeType,await loadPublicStore(slug,storeType));}
export default async function Page({params}:Props){
 const {slug,storeType}=await params;if(storeType!=='affiliate'&&storeType!=='personal')notFound();
 const shop=await loadPublicStore(slug,storeType);if(!shop)notFound();
 return <><style>{'body > header, body > footer {display:none;}'}</style>{shop.suspended?<StoreSuspended/>:<ShopBuilder isSharedBuyerView initialShop={shop} publicSlug={slug} verifiedStore={shop.verified}/>}</>;
}
