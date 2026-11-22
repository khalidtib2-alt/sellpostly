'use client';
import {useLanguage} from '../language-context';
import {amazonAffiliateProduct} from './affiliate-compliance';
import {safeUrl,type Product,type ShopMode} from './shop-data';
export function originalPrice(product:Product){const original=product.compareAtPrice?.trim()||'';if(!/^\d[\d.,\s]*$/.test(original))return original;const currency=product.price.match(/\b[A-Z]{3}\b|[$€£]/u)?.[0];return currency?original+' '+currency:original;}
export default function ProductPrice({product,mode}:{product:Product;mode:ShopMode}){
 const {t}=useLanguage(),affiliate=mode==='affiliate',restricted=affiliate&&amazonAffiliateProduct(product),url=safeUrl(product.url);
 return <div className="store-product-offer">
  <div className="store-offer-row">{!restricted&&product.price&&<p className="store-card-price" title={affiliate?t('Reference Price'):undefined}>{affiliate&&<span className="sr-only">{t('Reference Price')}: </span>}<span dir="auto">{product.price}</span>{product.compareAtPrice&&<del dir="auto">{originalPrice(product)}</del>}</p>}
   {affiliate&&url&&<a className="store-live-price" href={url} target="_blank" rel="nofollow sponsored noopener noreferrer" title={t('Prices and offers may change. Confirm the current price at the merchant.')}>{t('Check Live Price')}</a>}
  </div>
  {!restricted&&product.dealTag&&<span className="store-deal-tag" dir="auto">{product.dealTag}</span>}
 </div>;
}
