import { pageMetadata } from '../site';
import DashboardTabs from './dashboard-tabs';
export const metadata={...pageMetadata('/dashboard','Seller Dashboard | SellPostly','Manage your shop orders, fulfillment, escrow balances and payout requests.'),robots:{index:false,follow:false}};
export default function Page(){return <DashboardTabs/>;}
