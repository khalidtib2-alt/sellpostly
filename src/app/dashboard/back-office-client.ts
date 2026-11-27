import {shopHeaders} from '../shop/multi-shop-data';
export async function officeRequest(params:URLSearchParams,options:RequestInit={}){
 const response=await fetch('/api/seller/back-office?'+params,{...options,cache:'no-store',
  headers:{'Content-Type':'application/json',...shopHeaders(localStorage)}});
 if(!response.ok){
  const result=await response.json().catch(()=>null);
  throw Error(result?.error||'REQUEST_FAILED');
 }
 return response;
}
export function officePost(value:object){
 return officeRequest(new URLSearchParams(),{method:'POST',body:JSON.stringify(value)});
}
