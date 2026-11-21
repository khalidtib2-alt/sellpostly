import type {Shop} from './shop-data';
export const refundPolicies=['final_sale','7_day','14_day'] as const;
export type RefundPolicy=typeof refundPolicies[number];
export const refundPolicyLabels={final_sale:'No Refunds / Final Sale','7_day':'7-Day Exchange/Return','14_day':'14-Day Return Policy'} as const;
export function storePolicyReady(shop:Pick<Shop,'shopMode'|'refundPolicy'|'deliveryTimeframe'>){return shop.shopMode!=='personal'||(refundPolicies.includes(shop.refundPolicy as RefundPolicy)&&!!shop.deliveryTimeframe?.trim());}
