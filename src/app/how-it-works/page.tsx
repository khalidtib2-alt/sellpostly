import type {Metadata} from 'next';
import UserGuide from '../user-guide';
export const metadata:Metadata={title:'How SellPostly Works & User Guide',description:'A practical guide for sellers and buyers: Personal Stores, Affiliate Deals Shops, product imports, photos, sharing, and checkout.',alternates:{canonical:'/how-it-works'}};
export default function Page(){return <main><UserGuide standalone/></main>;}
