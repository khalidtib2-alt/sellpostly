import {DOMParser, parseHTML} from 'linkedom';
import {array, catalogUrl, field, normalizeCatalogItem, record, type CatalogPlatform, type NormalizedCatalogItem} from './external-catalog-data';
import {downloadPublicResource, publicImageUrl} from './public-image-download';

export function catalogSummary(value: unknown) {
  const {document} = parseHTML('<div id="summary">'+field(value, 24000)
    .replace(/<[^>]*>/g, tag => /^(?:<br\b|<\/(?:p|div|li|h[1-6])\b)/i.test(tag) ? tag+' ' : tag)+'</div>');
  document.querySelectorAll('script,style,template').forEach(node => node.remove());
  return (document.querySelector('#summary')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 4000);
}

const productList = (items: unknown[], map: (item: Record<string,unknown>) => unknown) =>
  items.map(item => normalizeCatalogItem(map(record(item)))).filter((item): item is NormalizedCatalogItem => item !== null);

export function parseShopify(value: unknown, base: string) {
  const feed = record(value);
  return productList(array(feed.products).slice(0,250), product => {
    const variants = array(product.variants).map(record);
    const variant = variants.find(row => row.available !== false) || variants[0] || {};
    const quantities = variants.map(row => field(row.inventory_quantity));
    const stock = quantities.length && quantities.every(q => /^\d+$/.test(q)) ? quantities.reduce((sum,q) => sum + Number(q), 0)
      : variants.length && variants.every(row => row.available === false) ? 0 : undefined;
    return {
      title: product.title, description: catalogSummary(product.body_html), price: variant.price,
      compareAtPrice: variant.compare_at_price, currency: feed.currency || product.currency,
      images: array(product.images).map(image => catalogUrl(record(image).src, base)),
      sourceUrl: product.handle && catalogUrl('/products/'+encodeURIComponent(field(product.handle)), base),
      category: product.product_type, stock, options: product.options,
    };
  });
}

function minorPrice(value: unknown, unit: unknown) {
  const digits = field(value);
  const decimals = Number(unit ?? 2);
  if (!/^\d{1,30}$/.test(digits) || !Number.isInteger(decimals) || decimals < 0 || decimals > 8) return '';
  const padded = digits.padStart(decimals+1,'0');
  return decimals ? padded.slice(0,-decimals)+'.'+padded.slice(-decimals) : digits;
}

export function parseWooCommerce(value: unknown, base: string) {
  return productList(array(value).slice(0,100), product => {
    const prices = record(product.prices);
    return {
      title: catalogSummary(product.name), description: catalogSummary(product.short_description || product.description),
      price: minorPrice(prices.price, prices.currency_minor_unit),
      compareAtPrice: product.on_sale ? minorPrice(prices.regular_price, prices.currency_minor_unit) : '',
      currency: prices.currency_code, category: record(array(product.categories)[0]).name,
      images: array(product.images).map(image => catalogUrl(record(image).src, base)), sourceUrl: catalogUrl(product.permalink, base),
      stock: product.is_in_stock === false ? 0 : undefined,
      options: array(product.attributes).map(record).map(attribute => ({
        name: attribute.name, values: array(attribute.terms).map(term => record(term).name),
      })),
    };
  });
}

function productNodes(value: unknown, depth = 0): Record<string,unknown>[] {
  if (!value || typeof value !== 'object' || depth > 12) return [];
  const node = record(value);
  if ([node['@type'], ...array(node['@type'])].some(type => typeof type === 'string' && /(?:^|\/)Product$/.test(type))) return [node];
  return Object.values(value).flatMap(child => productNodes(child, depth+1));
}

const productPath = /\/(?:products?|produits?|productos?|p)\//i;
export function parseProductPage(html: string, url: string) {
  const {document} = parseHTML(html);
  const meta = (key: string) => document.querySelector('meta[property="'+key+'"],meta[name="'+key+'"]')?.getAttribute('content') || '';
  const nodes = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(script => {
    try { return productNodes(JSON.parse(script.textContent || '')); } catch { return []; }
  });
  const markedProduct = /^(?:og:)?product$/i.test(meta('og:type')) || !!meta('product:price:amount');
  if (!nodes.length && (markedProduct || productPath.test(new URL(url).pathname))) nodes.push({});
  return productList(nodes.slice(0,40), product => {
    const offer = record(array(product.offers)[0] || product.offers);
    const images = Array.isArray(product.image) ? product.image : [product.image];
    return {
      title: product.name || meta('og:title'), description: catalogSummary(product.description || meta('og:description')),
      price: offer.price ?? offer.lowPrice ?? meta('product:price:amount'),
      currency: offer.priceCurrency || meta('product:price:currency'),
      images: [...images, ...[...document.querySelectorAll('meta[property="og:image"]')].map(node => node.getAttribute('content'))]
        .map(image => catalogUrl(record(image).url || record(image).contentUrl || image, url)),
      sourceUrl: catalogUrl(product.url || document.querySelector('link[rel="canonical"]')?.getAttribute('href') || meta('og:url'), url) || url,
      category: product.category, stock: /\/(OutOfStock|SoldOut)$/.test(field(offer.availability)) ? 0 : undefined,
      options: ['size','color'].map(name => ({name, values: Array.isArray(product[name]) ? product[name] : [product[name]]})),
    };
  });
}

export function normalizeStoreUrl(input: unknown) {
  const value = field(input, 2048);
  if (!value) throw Error('INVALID_STORE_URL');
  const url = publicImageUrl(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : 'https://'+value);
  url.hash = '';
  return url;
}

const contentTypes = ['application/json','text/html','application/xhtml+xml','text/xml','application/xml','text/plain'];
type Page = {text: string; url: string};
async function fetchCatalogPage(url: string, deadline: number): Promise<Page | null> {
  try {
    const result = await downloadPublicResource(url,contentTypes,5000000,undefined,0,deadline);
    return {text:result.bytes.toString('utf8'),url:result.url};
  } catch { return null; }
}
const json = (page: Page | null): unknown => { try { return JSON.parse(page?.text || ''); } catch { return null; } };

function sitemapLinks(page: Page | null, tag: 'url' | 'sitemap') {
  if (!page) return [];
  const doc = new DOMParser().parseFromString(page.text,'text/xml');
  return [...doc.querySelectorAll(tag+' > loc')].map(node => node.textContent || '');
}

export async function discoverCatalog(url: URL, fetchPage = fetchCatalogPage): Promise<{platformDetected: CatalogPlatform; products: NormalizedCatalogItem[]}> {
  const deadline = Date.now()+18000;
  const collection = url.pathname.match(/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?collections\/[^/]+/i)?.[0].replace(/\.json$/,'');
  const shopifyPath = collection ? collection+'/products.json?limit=250' : '/products.json?limit=250';
  const feedDeadline = Math.min(deadline, Date.now()+5000);
  const [shopify,woo,landing,sitemap,collectionJson] = await Promise.all([
    fetchPage(url.origin+shopifyPath,feedDeadline),
    fetchPage(url.origin+'/wp-json/wc/store/v1/products?per_page=100',feedDeadline),
    fetchPage(url.href,feedDeadline), fetchPage(url.origin+'/sitemap.xml',feedDeadline),
    collection ? fetchPage(url.origin+collection+'.json',feedDeadline) : Promise.resolve(null),
  ]);
  const feed = shopify || collectionJson;
  const shopifyProducts = parseShopify(json(shopify),shopify?.url || url.href);
  if (!shopifyProducts.length && collectionJson) shopifyProducts.push(...parseShopify(json(collectionJson),collectionJson.url));
  if (shopifyProducts.length) {
    const currency = landing?.text.match(/Shopify\.currency\s*=\s*\{\s*"active"\s*:\s*"([A-Z]{3})"/)?.[1];
    if (currency) shopifyProducts.forEach(item => { item.currency ||= currency; });
    return {platformDetected:'Shopify',products:shopifyProducts};
  }
  const wooProducts = parseWooCommerce(json(woo),woo?.url || url.href);
  if (wooProducts.length) return {platformDetected:'WooCommerce',products:wooProducts};
  const signature = url.hostname+' '+(landing?.text || '');
  const platformDetected = /youcan\.(?:shop|store)|youcan.cdn/i.test(signature) ? 'YouCan'
    : /storeino\.(?:com|shop|store)/i.test(signature) ? 'Storeino'
    : Array.isArray(record(json(feed)).products) ? 'Shopify' : Array.isArray(json(woo)) ? 'WooCommerce' : 'Generic store';
  const landingUrl = new URL(landing?.url || url.href);
  const links = (values: string[], base: string) => [...new Set(values.map(value => catalogUrl(value,base)).filter(value => {
    if (!value) return false;
    const target = new URL(value);
    return target.origin === landingUrl.origin || target.origin === url.origin;
  }))];
  const linkedProducts = landing ? [...parseHTML(landing.text).document.querySelectorAll('a[href]')]
    .map(anchor => anchor.getAttribute('href') || '').filter(href => productPath.test(href)) : [];
  const children = links(sitemapLinks(sitemap,'sitemap'),sitemap?.url || url.href);
  children.sort((a,b) => Number(/product/i.test(b))-Number(/product/i.test(a)));
  const nested = await Promise.all(children.slice(0,4).map(child => fetchPage(child,Math.min(deadline,Date.now()+4000))));
  const sitemapProducts = [sitemap,...nested].flatMap(page => sitemapLinks(page,'url'));
  const candidates = links([...linkedProducts,...sitemapProducts.filter(url => productPath.test(url)),...sitemapProducts],landingUrl.href)
    .filter(link => link !== landingUrl.href).slice(0,40);
  const products = landing ? parseProductPage(landing.text,landing.url) : [];
  for (let i=0;i<candidates.length && products.length<40 && Date.now()<deadline;i+=8) {
    const pages = await Promise.all(candidates.slice(i,i+8).map(link => fetchPage(link,deadline)));
    for (const page of pages) {
      if (page) products.push(...parseProductPage(page.text,page.url));
    }
  }
  return {platformDetected,products:[...new Map(products.map(item => [item.sourceUrl,item])).values()].slice(0,40)};
}
