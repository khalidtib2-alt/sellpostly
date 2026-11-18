import { pageMetadata } from '../site';
import ProGate from '../shop/pro-gate';
import SellerDashboard from './seller-dashboard';
export const metadata={...pageMetadata('/dashboard','Seller Dashboard | SellPostly','Manage your shop orders, fulfillment, escrow balances and payout requests.'),robots:{index:false,follow:false}};
export default function Page(){return <ProGate><SellerDashboard/></ProGate>;}

