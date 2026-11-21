import {pageMetadata} from '../site';
import ProGate from '../shop/pro-gate';
export const metadata={...pageMetadata('/settings','Seller Settings | SellPostly','Manage your store identity, policies and payment settings.'),robots:{index:false,follow:false}};
export default function Page(){return <ProGate workspace="settings"/>;}
