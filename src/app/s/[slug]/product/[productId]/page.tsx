import {cache} from 'react';
import {notFound,redirect} from 'next/navigation';
import {publicShop} from '../../../../../lib/db';
import {productShareUrl} from '../../../../shop/product-links';
import ProductLanding from '../../../../shop/product-landing';
import StoreSuspended from '../../../../shop/store-suspended';
const getShop=cache((slug:string)=>publicShop(slug,undefined,'personal'));
export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string;productId:string}>};
export async function generateMetadata({params}:Props){const {slug,productId}=await params,shop=await getShop(slug),product=!shop?.suspended?shop?.products.find(p=>p.id===productId):undefined;return {title:product?product.name+' | '+shop!.name:'Product | SellPostly',description:product?.description?.slice(0,160),alternates:{canonical:productShareUrl('/s/'+encodeURIComponent(slug)+'/product/'+encodeURIComponent(productId))}};}
export default async function Page({params}:Props){
 const {slug,productId}=await params,shop=await getShop(slug);
 if(!shop)notFound();
 if(shop.suspended)return <><style>{'body > header, body > footer {display:none;}'}</style><StoreSuspended/></>;
 if(shop.shopMode!=='personal')redirect('/s/'+encodeURIComponent(slug));
 if(!shop.products.some(p=>p.id===productId))notFound();
 return <><style>{'body > header, body > footer {display:none;}'}</style><ProductLanding shop={shop} productId={productId} slug={slug} verified={shop.verified}/></>;
}

