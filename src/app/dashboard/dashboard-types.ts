export type Balance={coin:string;network:string;gross_sales:string;total_commission:string;pending_escrow:string;available_balance:string;total_redeemed:string};
export type Order={id:string;gross_amount:string;commission_amount:string;net_amount:string;coin:string;network:string;status:string;tx_id:string;escrow_hold_days:number;escrow_release_at:string|null;created_at:string;details:{buyer?:{name:string;contact:string};items?:{id:string;name:string;quantity:number;unit_price:string;line_total:string}[];delivery_note?:string;fulfillment?:{tracking:string;delivery_notes:string;updated_at:string};dispute?:{reason:string;opened_at:string};buyer_confirmed_at?:string}};
export type Payout={id:string;amount:string;coin:string;network:string;status:string;wallet:string;tx_id:string|null;created_at:string};
export type Dashboard={shop:{id:string;name:string;slug:string}|null;balances:Balance[];orders:Order[];payouts:Payout[]};

