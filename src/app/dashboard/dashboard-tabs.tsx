'use client';

import {useState} from 'react';
import {useLanguage} from '../language-context';
import ProGate from '../shop/pro-gate';
import {inventoryMessage} from '../shop/inventory-messages';
import InventoryDashboard from './inventory-dashboard';
import BackOfficeDashboard from './back-office-dashboard';
import {officeMessage} from './back-office-messages';
import SellerDashboard from './seller-dashboard';

export default function DashboardTabs(){
 const {t,language}=useLanguage();
 const [tabName,setTab]=useState<'overview'|'inventory'|'customers'|'analytics'>('overview');
 const tab='rounded-lg border px-4 py-2 font-semibold aria-pressed:border-emerald-700 aria-pressed:bg-emerald-50';
 return <>
  <nav className="mx-auto flex max-w-7xl flex-wrap gap-2 px-5 pt-6" aria-label={t('Seller Dashboard')}>
   <button type="button" className={tab} aria-pressed={tabName==='overview'} onClick={()=>setTab('overview')}>{t('Your store overview')}</button>
   <button type="button" className={tab} aria-pressed={tabName==='inventory'} onClick={()=>setTab('inventory')}>{inventoryMessage(language,'inventory')}</button>
   {(['customers','analytics'] as const).map(key=><button key={key} type="button" className={tab} aria-pressed={tabName===key} onClick={()=>setTab(key)}>{officeMessage(language,key)}</button>)}
  </nav>
  {tabName==='inventory'?<InventoryDashboard/>:tabName==='overview'?<ProGate><SellerDashboard/></ProGate>:<BackOfficeDashboard key={tabName} view={tabName}/>}
 </>;
}
