import {array, catalogImageLimit, catalogLimit, catalogUrl, field, normalizeCatalogItem, record, type NormalizedCatalogItem} from './external-catalog-data';

export function parseCatalogCsv(input: string) {
  const text = input.replace(/^\uFEFF/, '');
  const first = text.split(/\r?\n/, 1)[0].replace(/"(?:[^"]|"")*"/g, '');
  const delimiter = [',', ';', '\t'].sort((a,b) => first.split(b).length - first.split(a).length)[0];
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i <= text.length; i++) {
    const char = text[i];
    if (char === '"' && quoted && text[i+1] === '"') { cell += '"'; i++; }
    else if (char === '"' && (quoted || !cell.length)) quoted = !quoted;
    else if (char === undefined || (!quoted && (char === '\n' || char === '\r' || char === delimiter))) {
      if (quoted) throw Error('INVALID_CSV');
      row.push(cell);
      cell = '';
      if (char === delimiter) continue;
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
      if (char === '\r' && text[i+1] === '\n') i++;
    } else cell += char;
  }
  const headers = rows.shift() || [];
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
}

export function mapCatalogCsv(rows: unknown, summary: (value: unknown) => string, base?: string) {
  const products: NormalizedCatalogItem[] = [];
  const handles = new Map<string, NormalizedCatalogItem>();
  for (const value of array(rows)) {
    const row = new Map(Object.entries(record(value)).map(([name, cell]) =>
      [name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''), field(cell, 12000)]));
    const get = (...names: string[]) => names.map(name => row.get(name)).find(Boolean) || '';
    const handle = get('handle', 'urlhandle');
    const imageList = get('imagesrc', 'images', 'image', 'imageurl', 'productimageurl', 'image1', 'featuredimage');
    const images = imageList.split(/\s*[,|]\s*(?=https?:|\/)/i).map(image => catalogUrl(image, base)).filter(Boolean);
    const options = [1,2,3].map(n => ({
      name: get('option'+n+'name','attribute'+n+'name'),
      values: get('option'+n+'value','attribute'+n+'values').split(/\s*[,|]\s*/),
    }));
    const previous = handle ? handles.get(handle) : undefined;
    const stock = get('variantinventoryqty','inventoryquantity','inventory','stock','stockquantity','quantity','qty');
    if (previous) {
      previous.images = [...new Set([...previous.images, ...images])].slice(0, catalogImageLimit);
      for (const {name, values} of options) {
        const option = previous.options.find(option => option.name === name);
        if (option) option.values = [...new Set([...option.values, ...values.filter(Boolean)])].slice(0,100);
        else if (name && values.some(Boolean)) previous.options.push({name, values:values.filter(Boolean)});
      }
      if (/^\d+$/.test(stock)) previous.stock = Math.min((previous.stock || 0) + Number(stock), 1000000);
      continue;
    }
    const item = normalizeCatalogItem({
      title: get('title','producttitle','name','productname','nom','nombre'), images, options, stock,
      description: summary(get('bodyhtml','descriptionhtml','shortdescription','description')),
      price: get('saleprice','variantprice','price','regularprice','prix','precio'),
      compareAtPrice: get('variantcompareatprice','compareatprice') || (get('saleprice') ? get('regularprice') : ''),
      currency: get('currency','currencycode'),
      sourceUrl: catalogUrl(get('externallink','externalurl','affiliateurl','producturl','permalink','link','url') || (base && handle ? '/products/'+encodeURIComponent(handle) : ''), base),
      category: get('category','categories','productcategory','type','producttype').split(',')[0],
    });
    if (item) {
      if (products.length >= catalogLimit) throw Error('CATALOG_TOO_LARGE');
      products.push(item);
      if (handle) handles.set(handle, item);
    }
  }
  return products;
}
