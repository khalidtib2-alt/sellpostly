"use client";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../language-context";
import type { Message } from "../translations";
import {digitalOnly} from './digital-data';
import {VariantPicker} from "./variant-controls";
import {inventoryMessage} from "./inventory-messages";
import type {OrderItem} from "./inventory-data";
import {cartLineAvailable,cartLineName,checkoutItem,cartTotal,type CartLine} from "./cart-data";
import type { Product, Shop } from "./shop-data";

export default function CartDrawer({lines,shop,change,onVariant,onClose,onPay,onCod,isSharedBuyerView=false}:{onCod?:()=>void;onVariant?:(line:CartLine,id:string)=>void;isSharedBuyerView?:boolean;lines:CartLine[];shop:Shop;change:(id:string,delta:number)=>void;onClose:()=>void;onPay:(product:Product,details:string,items:OrderItem[])=>void}){
  const {t,language}=useLanguage();
  const dialog=useRef<HTMLDialogElement>(null);
  const [note,setNote]=useState(""),[status,setStatus]=useState<Message|"">("");
  useEffect(()=>{dialog.current?.showModal();},[]);
  const total=cartTotal(lines),ready=lines.length>0&&lines.every(cartLineAvailable);
  const details=lines.map(line=>cartLineName(line)+" × "+line.quantity+" — "+line.product.price).join("\n")+(!digitalOnly(lines)&&note.trim()?"\n"+t("Delivery City / Note")+": "+note.trim():"");
  const receipt=t("Cart Order")+"\n"+shop.name+"\n"+details+"\n"+t("Total")+": "+(total?total.amount+" "+total.currency:t("Confirm prices with the seller."));
  async function whatsapp(){
    try{
      await navigator.clipboard.writeText(receipt);
      const preview=receipt.length<=1800?receipt:t("Cart Order")+"\n"+t("Full order copied. Paste it into WhatsApp.")+"\n"+t("Total")+": "+(total?total.amount+" "+total.currency:t("Confirm prices with the seller."));
      window.open("https://wa.me/"+shop.phone.replace(/\D/g,"")+"?text="+encodeURIComponent(preview),"_blank","noopener,noreferrer");
      setStatus("Full order copied. Paste it into WhatsApp.");
    }catch{setStatus("Copy failed. Select the text to copy it manually.");}
  }
  return <dialog ref={dialog} onClose={onClose} aria-labelledby="cart-heading" className="fixed inset-y-0 end-0 start-auto m-0 h-dvh max-h-none w-[min(100vw,30rem)] max-w-none overflow-y-auto border border-slate-200 bg-white p-6 text-slate-900 backdrop:bg-black/50">
    <div className="flex justify-between gap-3"><h2 id="cart-heading" className="text-2xl font-bold">{t("Shopping Bag")}</h2><div className="flex flex-wrap items-center gap-3">{lines.length>0&&<button type="button" className="text-sm text-slate-600 underline" onClick={()=>{for(const line of lines)change(line.key||line.product.id,-line.quantity);}}>{t("Clear Cart")}</button>}<button type="button" onClick={()=>dialog.current?.close()}>{t("Close")}</button></div></div>
    {lines.length===0&&<p className="my-6">{t("Your cart is empty.")}</p>}
    <ul className="my-6 space-y-5">{lines.map(line=>{const {product,quantity,variant}=line,key=line.key||product.id;return <li className="border-b border-slate-200 pb-4" key={key}>
      <div className="flex items-center gap-4">{product.image&&<img src={product.image} alt="" className="h-16 w-16 rounded-xl bg-white object-contain p-2"/>}<p className="font-semibold">{product.name}</p></div><p className="my-2">{product.price}</p>
      <VariantPicker variants={product.variants||[]} value={variant?.id} minStock={quantity} onChange={id=>onVariant?.(line,id)}/>{!cartLineAvailable(line)&&!product.variants?.length&&<p role="status">{inventoryMessage(language,"unavailable")}</p>}
      <div className="flex flex-wrap items-center gap-4"><button type="button" className="rounded border px-3 py-1" aria-label={t("Decrease quantity")+" "+product.name} onClick={()=>change(key,-1)}>−</button><output aria-label={t("Quantity")}>{quantity}</output><button type="button" disabled={quantity>=Math.min(99,variant?.stockCount??product.stock??99)} className="rounded border px-3 py-1" aria-label={t("Increase quantity")+" "+product.name} onClick={()=>change(key,1)}>+</button><button type="button" className="rounded px-2 py-1 text-sm text-slate-600 underline" aria-label={t("Remove")+" "+product.name} onClick={()=>change(key,-quantity)}>{t("Remove")}</button></div>
    </li>;})}</ul>
    {!digitalOnly(lines)&&<label>{t("Delivery City / Note")}<textarea maxLength={400} className="mt-2 w-full rounded-lg border p-3" value={note} onChange={e=>setNote(e.target.value)}/></label>}{digitalOnly(lines)&&<p className="my-3 text-sm">{t('Digital order: no shipping address needed. Delivery is sent to your email after payment confirmation.')}</p>}
    <p className="my-4 text-xl font-bold">{t("Total")}: {total?total.amount+" "+total.currency:"—"}</p>
    {!total&&lines.length>0&&<p role="status">{t("Cart totals require compatible USD, USDC, or USDT prices. Confirm other currencies with the seller.")}</p>}
    <p className="my-3 text-sm">{t("Delivery fees are confirmed by the seller.")}</p>
    <div className="grid gap-3"><button type="button" disabled={!ready} className="rounded-lg border border-emerald-700 px-4 py-3 font-semibold" onClick={()=>{const order:Product={id:'cart-order',name:t('Cart Order'),price:total?total.amount+' '+total.currency:'',category:'Other',gender:'unisex',image:'',url:'',source:'Other'};dialog.current?.close();onPay(order,details,lines.map(checkoutItem));}}>{t('Payment Options')}</button>
      {shop.codEnabled!==false&&onCod&&<button type="button" disabled={!ready} className="rounded-lg border border-emerald-700 px-4 py-3 font-semibold disabled:opacity-50" onClick={onCod}>{t("Cash on Delivery (COD)")}</button>}
      <button type="button" disabled={!ready||!shop.phone.replace(/\D/g,"")} onClick={whatsapp} className="rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{t("Order All on WhatsApp")}</button>
      {shop.escrowEnabled!==false&&<button type="button" disabled={!total||!ready} onClick={()=>{
        if(!total)return;
        const order:Product={id:"cart-order",name:t("Cart Order"),price:total.amount+" "+total.currency,category:"Other",gender:"unisex",image:"",url:"",source:"Other"};
        dialog.current?.close();onPay(order,details,lines.map(checkoutItem));
      }} className="rounded-lg border border-emerald-700 px-4 py-3 font-semibold disabled:opacity-50">{t("USDC")}</button>}
    </div>
    {!shop.phone.replace(/\D/g,"")&&<p className="my-3">{t(isSharedBuyerView?"WhatsApp checkout is unavailable for this shop.":"Add your WhatsApp number in Shop Settings above to enable WhatsApp checkout.")}</p>}
    <p role="status" className="mt-4 text-sm">{status&&t(status)}</p>
  </dialog>;
}
