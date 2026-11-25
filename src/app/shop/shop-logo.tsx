'use client';
import {useEffect,useState} from 'react';
export default function ShopLogo({logo,name,className=''}:{logo?:string;name:string;className?:string}){
 const [failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[logo]);
 return <span className={'shop-logo '+className}>{logo&&!failed?<img src={logo} alt={name} onError={()=>setFailed(true)}/>:<span aria-label={name}>{(name||'SP').trim().slice(0,2).toUpperCase()}</span>}</span>;
}
