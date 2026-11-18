"use client";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../language-context";
import type { Message } from "../translations";
import { normalizeNetwork, validWallet } from "./crypto-data";
import { cartTotal, type CartLine } from "./cart-data";
import type { Product, Shop } from "./shop-data";

export default function CartDrawer({lines,shop,change,onClose,onPay}:{lines:CartLine[];shop:Shop;change:(id:string,delta:number)=>void;onClose:()=>void;onPay:(product:Product,details:string)=>void}){
  const {t}=useLanguage();
  const dialog=useRef<HTMLDialogElement>(null);
  const [note,setNote]=useState(""),[status,setStatus]=useState<Message|"">("");
  useEffect(()=>{dialog.current?.showModal();},[]);
  const total=cartTotal(lines);
  const details=lines.map(({product,quantity})=>product.name+" × "+quantity+" — "+product.price).join("\n")+(note.trim()?"\n"+t("Delivery City / Note")+": "+note.trim():"");
  const receipt=t("Cart Order")+"\n"+shop.name+"\n"+details+"\n"+t("Total")+": "+(total?total.amount+" "+total.currency:t("Confirm prices with the seller."));
  async function whatsapp(){
    try{
      await navigator.clipboard.writeText(receipt);
      const preview=receipt.length<=1800?receipt:t("Cart Order")+"\n"+t("Full order copied. Paste it into WhatsApp.")+"\n"+t("Total")+": "+total?.amount+" "+total?.currency;
      window.open("https://wa.me/"+shop.phone.replace(/\D/g,"")+"?text="+encodeURIComponent(preview),"_blank","noopener,noreferrer");
      setStatus("Full order copied. Paste it into WhatsApp.");
    }catch{setStatus("Copy failed. Select the text to copy it manually.");}
  }
  return <dialog ref={dialog} onClose={onClose} aria-labelledby="cart-heading" className="fixed inset-y-0 end-0 start-auto m-0 h-dvh max-h-none w-[min(100vw,30rem)] max-w-none overflow-y-auto border border-slate-200 bg-white p-6 text-slate-900 backdrop:bg-black/50">
    <div className="flex justify-between gap-3"><h2 id="cart-heading" className="text-2xl font-bold">{t("Cart")}</h2><button type="button" onClick={()=>dialog.current?.close()}>{t("Close")}</button></div>
    {lines.length===0&&<p className="my-6">{t("Your cart is empty.")}</p>}
    <ul className="my-6 space-y-5">{lines.map(({product,quantity})=><li className="border-b border-slate-200 pb-4" key={product.id}>
      <p className="font-semibold">{product.name}</p><p className="my-2">{product.price}</p>
      <div className="flex items-center gap-4"><button type="button" className="rounded border px-3 py-1" aria-label={t("Decrease quantity")+" "+product.name} onClick={()=>change(product.id,-1)}>−</button><output aria-label={t("Quantity")}>{quantity}</output><button type="button" disabled={quantity>=99} className="rounded border px-3 py-1" aria-label={t("Increase quantity")+" "+product.name} onClick={()=>change(product.id,1)}>+</button></div>
    </li>)}</ul>
    <label>{t("Delivery City / Note")}<textarea maxLength={400} className="mt-2 w-full rounded-lg border p-3" value={note} onChange={e=>setNote(e.target.value)}/></label>
    <p className="my-4 text-xl font-bold">{t("Total")}: {total?total.amount+" "+total.currency:"—"}</p>
    {!total&&lines.length>0&&<p role="status">{t("Cart totals require compatible USD, USDC, or USDT prices. Confirm other currencies with the seller.")}</p>}
    <p className="my-3 text-sm">{t("Delivery fees are confirmed by the seller.")}</p>
    <div className="grid gap-3">
      <button type="button" disabled={!total||!shop.phone.replace(/\D/g,"")} onClick={whatsapp} className="rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{t("Order All on WhatsApp")}</button>
      {shop.cryptoWallet&&validWallet(shop.cryptoWallet,normalizeNetwork(shop.cryptoNetwork))&&<button type="button" disabled={!total} onClick={()=>{
        if(!total)return;
        const order:Product={id:"cart-order",name:t("Cart Order"),price:total.amount+" "+total.currency,category:"Other",gender:"unisex",image:"",url:"",source:"Other"};
        dialog.current?.close();onPay(order,details);
      }} className="rounded-lg border border-emerald-700 px-4 py-3 font-semibold disabled:opacity-50">{t("Pay Total with USDC / USDT")}</button>}
    </div>
    {!shop.phone.replace(/\D/g,"")&&<p className="my-3">{t("Seller WhatsApp number is unavailable.")}</p>}
    <p role="status" className="mt-4 text-sm">{status&&t(status)}</p>
  </dialog>;
}
