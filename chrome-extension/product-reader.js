"use strict";
// Isolated-world, read-only DOM inspection. No store cookies, requests or page scripts.
globalThis.SellPostlyProductReader = (() => {
  const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
  const currencyPattern = '(?:US\\s*\\$|USD|EUR|GBP|MAD|AED|SAR|CAD|AUD|EGP|NGN|KES|ZAR|DH[S]?|د\\.?\\s*م\\.?|[$€£])';
  const numberPattern = '[0-9](?:[0-9.,\\u00a0\\u202f ]*[0-9])?';
  function priceParts(value, hint = '') {
    let text = clean(value).replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632));
    const before = text.match(new RegExp('(' + currencyPattern + ')\\s*(' + numberPattern + ')', 'i'));
    const after = text.match(new RegExp('(' + numberPattern + ')\\s*(' + currencyPattern + ')', 'i'));
    let numeric = before?.[2] || after?.[1], unit = before?.[1] || after?.[2] || hint;
    if (!numeric && /^\d[\d.,\s]*$/.test(text)) numeric = text;
    if (!numeric) return null;
    numeric = numeric.replace(/[\s\u00a0\u202f]/g, '');
    const dot = numeric.lastIndexOf('.'), comma = numeric.lastIndexOf(',');
    if (dot >= 0 && comma >= 0) { const decimal = dot > comma ? '.' : ','; numeric = numeric.replace(decimal === '.' ? /,/g : /\./g, '').replace(',', '.'); }
    else if (comma >= 0) numeric = /,\d{1,2}$/.test(numeric) ? numeric.replace(/,/g, (c, i) => i === comma ? '.' : '') : numeric.replace(/,/g, '');
    else if ((numeric.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(numeric)) numeric = numeric.replace(/\./g, '');
    if (!/^\d+(?:\.\d{1,2})?$/.test(numeric) || !Number.isFinite(Number(numeric)) || Number(numeric) < 0 || Number(numeric) > 1e9) return null;
    unit = clean(unit).toUpperCase().replace(/\s/g, '');
    const currency = ({'$':'USD','US$':'USD','€':'EUR','£':'GBP','DH':'MAD','DHS':'MAD','د.م.':'MAD','دم':'MAD'})[unit] || (/^[A-Z]{3}$/.test(unit) ? unit : '');
    return {amount:numeric, currency, price:[numeric, currency].filter(Boolean).join(' ')};
  }
  function read() {
    const all = selector => { try { return [...document.querySelectorAll(selector)]; } catch { return []; } };
    const attr = (el, key) => el?.getAttribute(key) || '';
    const text = el => clean(attr(el, 'content') || el?.textContent);
    const meta = name => text(document.querySelector(`meta[property="${name}"],meta[name="${name}"]`));
    const visible = el => { if (!el || el.closest('[hidden],[aria-hidden="true"]')) return false; const style=getComputedStyle(el); return style.display!=='none' && style.visibility!=='hidden' && style.opacity!=='0' && !!el.getClientRects().length; };
    const url = value => { try { const u=new URL(value,location.href);return /^https?:$/.test(u.protocol)?u.href:''; } catch { return ''; } };
    const titleElement = document.querySelector('#productTitle,h1,[data-testid="product-title"]');
    const name = (text(titleElement) || meta('og:title') || document.title || '').slice(0,120);
    const products=[];
    function walk(value,depth=0){if(!value||typeof value!=='object'||depth>12)return;if(Array.isArray(value)){for(const v of value)walk(v,depth+1);}else{if([value['@type']].flat().includes('Product'))products.push(value);for(const v of Object.values(value))walk(v,depth+1);}}
    for(const script of all('script[type="application/ld+json"]').slice(0,30)){try{if(script.textContent.length<1500000)walk(JSON.parse(script.textContent));}catch{}}
    products.sort((a,b)=>Number(clean(b.name).toLowerCase()===name.toLowerCase())-Number(clean(a.name).toLowerCase()===name.toLowerCase()));
    const product=products[0];
    const offer=[product?.offers].flat().find(Boolean)||{};
    const host=location.hostname.toLowerCase();
    const hint=meta('product:price:currency')||meta('og:price:currency')||offer.priceCurrency||(/\.ma$/.test(host)?'MAD':/amazon\.co\.uk$/.test(host)?'GBP':/amazon\.(de|fr|it|es)$/.test(host)?'EUR':'');
    const titleRect=titleElement?.getBoundingClientRect();
    const prices=[];
    const addPrice=(value,score,source,el)=>{
      const context=el?.closest('[class*="price"],[class*="Price"],[data-testid*="price"]');
      if(el&&((getComputedStyle(el).textDecorationLine||'').includes('line-through')||el.closest('del,s,strike,.a-text-price,[aria-hidden="true"]')||/old|original|strike|list-price|was-price|installment|shipping|coupon|saving/i.test(String(el.className)+' '+String(context?.className))))return;
      if(/installment|shipping|save\s|coupon|payments?\s+of|\d+%/i.test(clean(value)))return;
      const parsed=priceParts(value,hint);if(!parsed)return;
      if(el){const rect=el.getBoundingClientRect();if(rect.top>Math.max(innerHeight*1.8,(titleRect?.top||0)+900))return;if(titleRect)score+=Math.max(0,12-Math.abs(rect.top-titleRect.top)/70);}
      prices.push({...parsed,score,source});
    };
    const priceSelectors=[
      '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen','#corePrice_feature_div .a-price .a-offscreen','#apex_desktop .a-price .a-offscreen','.a-price:not(.a-text-price) .a-offscreen',
      '[class*="product-price-current"]','[class*="price--current"]','[data-testid="product-price"]','[data-testid*="sale-price"]','[data-testid*="price"]',
      '.product__price','.price-item--sale','.price-item--regular','.-prc','[itemprop="price"]','[class*="goods-price"]','[class*="salePrice"]'
    ];
    for(const selector of priceSelectors)for(const el of all(selector).slice(0,25)){const anchor=el.classList.contains('a-offscreen')?el.parentElement:el;if(visible(anchor))addPrice(text(el),95,'displayed',anchor);}
    for(const el of all('.a-price').slice(0,10)){const whole=el.querySelector('.a-price-whole'),fraction=el.querySelector('.a-price-fraction');if(visible(el)&&whole&&fraction)addPrice(text(el.querySelector('.a-price-symbol'))+text(whole).replace(/[.,]$/,'')+'.'+text(fraction),96,'displayed',el);}
    for(const el of all('span,p,strong,b,div').slice(0,15000)){const value=text(el);if(value.length>65||!visible(el)||el.closest('nav,footer,header,[class*="recommend"],[class*="Recommend"],[class*="related"]'))continue;
      if(!new RegExp(currencyPattern,'i').test(value))continue;
      const box=el.closest('[class*="price"],[class*="Price"],[class*="buy"],[class*="Buy"],[class*="goods"],main');
      addPrice(value,box?83:30,'displayed',el);
    }
    for(const el of all('[itemprop="price"]'))addPrice(text(el),62,'microdata');
    addPrice(meta('product:price:amount')||meta('og:price:amount'),65,'metadata');
    addPrice(offer.price??offer.lowPrice??offer.priceSpecification?.price,60,'schema');
    if(Array.isArray(offer.offers))for(const o of offer.offers)addPrice(o.price??o.lowPrice,59,'schema');
    prices.sort((a,b)=>b.score-a.score);const price=prices[0];
    const images=[];
    const addImage=(value,score,el)=>{const src=url(value);if(!src||/\.(?:svg|gif)(?:\?|$)/i.test(src)||/sprite|favicon|logo|avatar|loading|placeholder/i.test(src))return;images.push({src,score});};
    function imageSources(el,score){
      let dynamic={};try{dynamic=JSON.parse(attr(el,'data-a-dynamic-image'));}catch{}
      const largest=Object.entries(dynamic||{}).filter(([,size])=>Array.isArray(size)).sort((a,b)=>b[1][0]*b[1][1]-a[1][0]*a[1][1])[0]?.[0];
      const srcsets=(attr(el,'srcset')||attr(el,'data-srcset')).split(',').map(v=>v.trim().split(/\s+/)).sort((a,b)=>parseFloat(b[1]||'0')-parseFloat(a[1]||'0'));
      for(const [i,src] of [attr(el,'data-old-hires'),largest,srcsets[0]?.[0],attr(el,'data-zoom-image'),attr(el,'data-src'),el.currentSrc,attr(el,'src')].entries())if(src)addImage(src,score+(7-i),el);
    }
    for(const el of all('#landingImage,#imgBlkFront,#main-image,[data-testid*="gallery"] img,[class*="image-view"] img,[class*="gallery"] img,[class*="Gallery"] img,.product__media img,[itemprop="image"],#imgs img,.sldr img')){if(el.tagName==='IMG'&&visible(el)){const r=el.getBoundingClientRect();imageSources(el,el.id==='landingImage'||el.id==='imgBlkFront'?145:(r.width<100||r.height<100?50:110+Math.min(30,r.width*r.height/10000)));}}
    for(const el of all('img').slice(0,3000)){if(!visible(el)||el.closest('nav,header,footer,[class*="recommend"],[class*="related"]'))continue;const r=el.getBoundingClientRect();if(r.width<90||r.height<90||r.top>Math.max(innerHeight*1.5,(titleRect?.top||0)+800))continue;const area=Math.min(20,r.width*r.height/20000);const domain=/kwcdn\.com|alicdn\.com|jumia|media-amazon|images-amazon/i.test(attr(el,'data-src')||el.currentSrc||attr(el,'src'));imageSources(el,65+area+(domain?10:0));}
    for(const value of [product?.image].flat())addImage(typeof value==='object'?value?.url||value?.contentUrl:value,82);
    addImage(meta('og:image:secure_url')||meta('og:image'),75);
    images.sort((a,b)=>b.score-a.score);
    const bullets=all('#feature-bullets li').map(text).filter(v=>v&&!/^about this item$/i.test(v));
    const description=bullets.length?bullets:[text(document.querySelector('[data-testid*="description"],.product__description'))||meta('og:description')||meta('description')||product?.description];
    return {name,price:price?.price||'',amount:price?.amount||'',currency:price?.currency||'',priceSource:price?.source||'',image:images[0]?.src||'',features:description.filter(Boolean).flatMap(v=>clean(v).split(/(?<=[.!?])\s+/)).filter(v=>!/^about this item$/i.test(v)&&!/our wide selection|free shipping and free returns|buy .+ at amazon\.com/i.test(v)).slice(0,4).join('\n').slice(0,1200)};
  }
  return {read,priceParts};
})();
