'use client';
import {useEffect} from 'react';
import {useSearchParams} from 'next/navigation';
/** Also handles client-side header navigation when the homepage stays mounted. */
export default function FormatterTabSync({onPrompt}:{onPrompt:()=>void}){
 const params=useSearchParams();
 useEffect(()=>{if(params.get('tab')!=='prompt')return;onPrompt();const url=new URL(location.href);url.searchParams.delete('tab');history.replaceState(history.state,'',url.pathname+url.search+'#formatter');document.getElementById('formatter')?.scrollIntoView({block:'start'});},[params,onPrompt]);
 return null;
}
