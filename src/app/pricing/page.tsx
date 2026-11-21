import PricingContent from './pricing-content';
import {monthlyProPrice,pricingMetadata} from './pricing-data';
export const metadata=pricingMetadata();
export default function PricingPage(){return <PricingContent proPrice={monthlyProPrice(process.env.NEXT_PUBLIC_PRO_PRICE_USD)}/>;}
