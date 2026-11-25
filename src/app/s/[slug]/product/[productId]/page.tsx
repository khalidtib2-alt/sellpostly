import {cache} from 'react';
import {notFound} from 'next/navigation';
import {publicShop} from '../../../../../lib/db';
import {findProductStore} from '../../../../../lib/product-store';
import {productShareUrl,productPath} from '../../../../shop/product-links';
import ProductLanding from '../../../../shop/product-landing';
import StoreSuspended from '../../../../shop/store-suspended';
const getShop=cache((slug:string,id:string,type?:string)=>findProductStore(slug,id,type,(slug,mode)=>publicShop(slug,undefined,mode)));
export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string;productId:string}>;searchParams?:Promise<{type?:string}>};
export async function generateMetadata({params,searchParams}:Props){const {slug,productId}=await params,query=await searchParams,shop=await getShop(slug,productId,query?.type),product=!shop?.suspended?shop?.products.find(p=>p.id===productId):undefined;const canonical=productShareUrl(productPath(productId,slug)+(shop?.shopMode==='affiliate'?'?type=affiliate':'')),title=product?product.name+' | '+shop!.name:'Product | SellPostly',description=product?.description?.slice(0,160),images=product?.image?.startsWith('https://')?[product.image]:[];return {title,description,alternates:{canonical},openGraph:{title,description,url:canonical,images},twitter:{card:'summary_large_image' as const,title,description,images},...!product?{robots:{index:false,follow:false}}:{}};}
export default async function Page({params,searchParams}:Props){const {slug,productId}=await params,query=await searchParams,shop=await getShop(slug,productId,query?.type);if(!shop)notFound();return <><style>{'body > header, body > footer {display:none;}'}</style>{shop.suspended?<StoreSuspended/>:<ProductLanding shop={shop} productId={productId} slug={slug} verified={shop.verified}/>}</>;}
