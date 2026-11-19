import type { Order,Payout } from '../dashboard/dashboard-types';
export type AdminOrder=Order & {shop_id:string;shop_name:string;payment_verified_at:string|null};
export type AdminPayout=Payout & {shop_id:string;shop_name:string};
export type AdminShop={id:string;name:string;slug:string;owner_key:string;verified:boolean;suspended:boolean;published:boolean;escrow_hold_days:number;created_at:string};
export type Subscription={owner_key:string;provider:string;status:string;expires_at?:string|null;verified_at:string;created_at:string};
export type Accounting={coin:string;network:string;total_gmv:string;total_commission_5pct:string;active_escrow_held:string;pending_payouts:string;paid_payouts:string};
export type Overview={balances:Accounting[];active_subscriptions:string;orders:AdminOrder[];payouts:AdminPayout[];shops:AdminShop[]};

