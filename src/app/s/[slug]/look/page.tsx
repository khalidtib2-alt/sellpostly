import {notFound} from 'next/navigation';
import {loadPublicStore} from '../../../../lib/public-storefront';
import {lookbookMetadata} from '../../../../lib/lookbook-seo';
import Lookbook from '../../../shop/lookbook';
import StoreSuspended from '../../../shop/store-suspended';
export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props){const {slug}=await params;return lookbookMetadata(slug,'personal',await loadPublicStore(slug,'personal'));}
export default async function Page({params}:Props){const {slug}=await params;const shop=await loadPublicStore(slug,'personal');if(!shop)notFound();return <><style>{'body > header,body > footer{display:none}'}</style>{shop.suspended?<StoreSuspended/>:<Lookbook shop={shop} slug={slug}/>}</>;}
