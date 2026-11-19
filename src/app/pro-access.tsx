'use client';
import { createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode } from 'react';
import { proKey,verifyStoredPro } from '../lib/shop-handoff';
const ProAccess=createContext({active:false,recheck:async()=>false});
export function HomepageProProvider({children}:{children:ReactNode}){
 const [active,setActive]=useState(false),mounted=useRef(true),generation=useRef(0);
 const recheck=useCallback(async()=>{
  const attempt=++generation.current;
  let verified=false;try{verified=await verifyStoredPro(localStorage);}catch{}
  if(!mounted.current||attempt!==generation.current)return false;
  setActive(verified);return verified;
 },[]);
 useEffect(()=>{
  mounted.current=true;recheck();
  const refresh=()=>{if(document.visibilityState==='visible')recheck();};
  const storage=(event:StorageEvent)=>{if(event.key===proKey||event.key===null)recheck();};
  window.addEventListener('focus',refresh);window.addEventListener('storage',storage);
  const timer=window.setInterval(refresh,60000);
  return()=>{mounted.current=false;generation.current++;window.clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('storage',storage);};
 },[recheck]);
 return <ProAccess.Provider value={{active,recheck}}>{children}</ProAccess.Provider>;
}
export function useHomepagePro(){return useContext(ProAccess);}

