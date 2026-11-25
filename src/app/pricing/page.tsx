import {b2bPlanPrice} from '../../lib/b2b-plan';
import PricingContent from './pricing-content';
import {monthlyProPrice,pricingMetadata} from './pricing-data';
export const metadata=pricingMetadata();
export default function PricingPage(){return <PricingContent b2bPrice={b2bPlanPrice(process.env.NEXT_PUBLIC_B2B_PLAN_PRICE)} proPrice={monthlyProPrice(process.env.NEXT_PUBLIC_PRO_PRICE_USD)}/>;}
