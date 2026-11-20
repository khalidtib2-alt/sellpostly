import type {Metadata} from 'next';
import MediaTools from './media-tools';
export const metadata:Metadata={title:'Seller Media & Storefront Tools | SellPostly',description:'Browser-based image crop, resize, WebP/JPEG/PNG conversion, photo polish, local video frame capture and storefront QR tools.',alternates:{canonical:'/tools'}};
export default function Page(){return <MediaTools/>;}
