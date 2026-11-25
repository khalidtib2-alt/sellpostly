import {notFound} from 'next/navigation';
import {loadPublicStore} from '../../../../../lib/public-storefront';
import {lookbookMetadata} from '../../../../../lib/lookbook-seo';
import Lookbook from '../../../../shop/lookbook';
import StoreSuspended from '../../../../shop/store-suspended';
export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string;storeType:string}>};
export async function generateMetadata({params}:Props){const {slug,storeType}=await params;if(storeType!=='affiliate'&&storeType!=='personal')return {robots:{index:false,follow:false}};return lookbookMetadata(slug,storeType,await loadPublicStore(slug,storeType));}
export default async function Page({params}:Props){const {slug,storeType}=await params;if(storeType!=='affiliate'&&storeType!=='personal')notFound();const shop=await loadPublicStore(slug,storeType);if(!shop)notFound();return <><style>{'body > header,body > footer{display:none}'}</style>{shop.suspended?<StoreSuspended/>:<Lookbook shop={shop} slug={slug}/>}</>;}
