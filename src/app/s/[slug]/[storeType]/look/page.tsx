import {notFound} from 'next/navigation';
import {loadPublicStore} from '../../../../../lib/public-storefront';
import {lookbookMetadata} from '../../../../../lib/lookbook-seo';
import Lookbook from '../../../../shop/lookbook';
import StoreSuspended from '../../../../shop/store-suspended';
export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string;storeType:string}>};
export async function generateMetadata({params}:Props){const {slug,storeType}=await params;if(storeType!=='affiliate')return {robots:{index:false,follow:false}};return lookbookMetadata(slug,'affiliate',await loadPublicStore(slug,'affiliate'));}
export default async function Page({params}:Props){const {slug,storeType}=await params;if(storeType!=='affiliate')notFound();const shop=await loadPublicStore(slug,'affiliate');if(!shop)notFound();return <><style>{'body > header,body > footer{display:none}'}</style>{shop.suspended?<StoreSuspended/>:<Lookbook shop={shop} slug={slug}/>}</>;}
