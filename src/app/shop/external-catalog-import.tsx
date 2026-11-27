'use client';

import {useRef, useState} from 'react';
import {useLanguage} from '../language-context';
import {catalogMessage} from './external-catalog-messages';
import {shopHeaders} from './multi-shop-data';
import type {CatalogPlatform, NormalizedCatalogItem} from '../../lib/external-catalog-data';

export type CatalogImportCounts = {importedCount:number; skippedCount:number};

export async function catalogRequest<T>(value: object): Promise<T> {
  const response = await fetch('/api/shops/import-external-catalog',{
    method:'POST', headers:{'Content-Type':'application/json',...shopHeaders(localStorage)},
    body:JSON.stringify(value),
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error);
  return result;
}

function errorLabel(error: unknown) {
  switch (error instanceof Error ? error.message : '') {
    case 'INVALID_STORE_URL': return 'badUrl';
    case 'INVALID_CSV': return 'badCsv';
    case 'CATALOG_TOO_LARGE': return 'tooLarge';
    case 'AUTH_REQUIRED': return 'auth';
    case 'SHOP_NOT_FOUND': return 'shopMissing';
    default: return 'failed';
  }
}

type Preview = {platformDetected:CatalogPlatform; products:NormalizedCatalogItem[]};
type Props = {
  onImport?: (items: NormalizedCatalogItem[]) => Promise<CatalogImportCounts>;
  onSelection?: (items: NormalizedCatalogItem[]) => void;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
};

const control = 'rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50';
const primary = 'rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50';

export default function ExternalCatalogImport({onImport,onSelection,onBusyChange,disabled}: Props) {
  const {language} = useLanguage();
  const tr = (key: Parameters<typeof catalogMessage>[1], values?: Record<string,number>) => catalogMessage(language,key,values);
  const [tab,setTab] = useState<'url'|'csv'>('url');
  const [url,setUrl] = useState('');
  const [csvUrl,setCsvUrl] = useState('');
  const [preview,setPreview] = useState<Preview>();
  const [selected,setSelected] = useState<Set<number>>(new Set());
  const [search,setSearch] = useState('');
  const [busy,setBusy] = useState<'scan'|'import'>();
  const [error,setError] = useState<ReturnType<typeof errorLabel>>();
  const [counts,setCounts] = useState<CatalogImportCounts>();
  const fileInput = useRef<HTMLInputElement>(null);
  const pending = useRef(false);
  const locked = disabled || !!busy;

  function select(next: Set<number>, products = preview?.products || []) {
    setSelected(next);
    onSelection?.(products.filter((_,index) => next.has(index)));
  }

  function reset() {
    setError(undefined);
    setCounts(undefined);
    setPreview(undefined);
    setSearch('');
    select(new Set(),[]);
  }

  async function scan(source: () => Promise<object> | object) {
    if (disabled || pending.current) return;
    pending.current = true;
    reset();
    setBusy('scan');
    onBusyChange?.(true);
    try {
      const result = await catalogRequest<Preview>({action:'preview',...await source()});
      setPreview(result);
      select(new Set(result.products.map((_,index) => index)),result.products);
    } catch (error) {
      setError(errorLabel(error));
    } finally {
      pending.current = false;
      setBusy(undefined);
      onBusyChange?.(false);
    }
  }

  function upload(file?: File) {
    if (!file) return;
    void scan(async () => {
      if (file.size > 1_000_000) throw Error('CATALOG_TOO_LARGE');
      return {csv:await file.text(),storeUrl:csvUrl.trim()};
    });
  }

  async function commit() {
    if (!onImport || !preview || !selected.size || pending.current || disabled) return;
    pending.current = true;
    setBusy('import');
    onBusyChange?.(true);
    setError(undefined);
    try {
      const result = await onImport(preview.products.filter((_,index) => selected.has(index)));
      setCounts(result);
      setPreview(undefined);
      select(new Set(),[]);
    } catch (error) {
      setError(errorLabel(error));
    } finally {
      pending.current = false;
      setBusy(undefined);
      onBusyChange?.(false);
    }
  }

  const matching = (preview?.products || []).map((item,index) => ({item,index})).filter(({item}) =>
    (item.title+' '+item.category).toLocaleLowerCase(language).includes(search.trim().toLocaleLowerCase(language)));
  const allSelected = matching.length > 0 && matching.every(({index}) => selected.has(index));

  return <fieldset disabled={locked} className="min-w-0 space-y-3">
    <div role="group" aria-label={tr('open')} className="flex flex-wrap gap-2">
      <button type="button" className={tab==='url'?primary:control} aria-pressed={tab==='url'} onClick={()=>{setTab('url');reset();}}>{tr('urlTab')}</button>
      <button type="button" className={tab==='csv'?primary:control} aria-pressed={tab==='csv'} onClick={()=>{setTab('csv');reset();}}>{tr('csvTab')}</button>
    </div>
    {tab==='url' ? <>
      <p className="text-sm text-slate-600">{tr('platforms')}</p>
      <label className="block text-sm">{tr('urlLabel')}
        <input value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>{
          if (e.key==='Enter') {e.preventDefault(); if (url.trim()) void scan(()=>({storeUrl:url.trim()}));}
        }} dir="ltr" inputMode="url" className={control+' mt-1 block w-full'} />
      </label>
      <button type="button" className={primary} disabled={!url.trim()} onClick={()=>void scan(()=>({storeUrl:url.trim()}))}>{tr('scan')}</button>
    </> : <>
      <label className="block text-sm">{tr('csvUrl')}
        <input value={csvUrl} onChange={e=>setCsvUrl(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')e.preventDefault();}} dir="ltr" inputMode="url" className={control+' mt-1 block w-full'} />
      </label>
      <div className="rounded-xl border border-dashed border-slate-400 p-4 text-center" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();upload(e.dataTransfer.files[0]);}}>
        <input ref={fileInput} type="file" accept=".csv,text/csv" hidden onChange={e=>{upload(e.target.files?.[0]);e.target.value='';}} />
        <button type="button" className={control} onClick={()=>fileInput.current?.click()}>{tr('upload')}</button>
        <p className="mt-2 text-sm text-slate-600">{tr('csvHint')}</p>
      </div>
    </>}
    {busy && <p role="status">{tr(busy==='scan'?'scanning':'importing')}</p>}
    {error && <p role="alert" className="text-red-700">{tr(error)}</p>}
    {counts && <p role="status" className="text-emerald-800">{tr('done',{count:counts.importedCount,skipped:counts.skippedCount})}</p>}
    {preview && <>
      <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-sm">{tr(preview.platformDetected==='Generic store'?'generic':preview.platformDetected)}</span>
      {!preview.products.length ? <p role="status">{tr(tab==='url'?'emptyStore':'emptyCsv')}</p> : <>
        <label className="block text-sm">{tr('search')}
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')e.preventDefault();}} className={control+' mt-1 block w-full'} />
        </label>
        {matching.length ? <>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allSelected} onChange={()=>{
            const next = new Set(selected);
            matching.forEach(({index})=>allSelected?next.delete(index):next.add(index));
            select(next);
          }} />{tr('all')}</label>
          <ul className="max-h-64 divide-y overflow-auto rounded-xl border">
            {matching.map(({item,index})=><li key={index}><label className="flex cursor-pointer items-center gap-3 p-3">
              <input type="checkbox" checked={selected.has(index)} onChange={e=>{
                const next = new Set(selected);
                if (e.target.checked) next.add(index); else next.delete(index);
                select(next);
              }} />
              {item.images[0] && <img src={item.images[0]} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-12 shrink-0 rounded object-cover" />}
              <span className="min-w-0 flex-1 truncate" dir="auto">{item.title}<small className="block text-slate-600">{item.category}</small></span>
              <span dir="auto" className="text-sm">{item.price} {item.currency}</span>
            </label></li>)}
          </ul>
        </> : <p role="status">{tr('none')}</p>}
        {onImport ? <button type="button" className={primary} disabled={!selected.size} onClick={()=>void commit()}>{tr('submit',{count:selected.size})}</button>
          : <p role="status" className="text-sm">{tr('selected',{count:selected.size})}</p>}
      </>}
    </>}
  </fieldset>;
}
