"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useLanguage } from "../language-context";
import type { Message } from "../translations";
import type { Product, Shop } from "./shop-data";
import { escrowWallet, escrowNetwork, escrowReady, holdDays } from "./escrow-config";
import { stableAmount } from "./crypto-data";

export default function CryptoCheckout({ product, shop, onClose, orderDetails = "" }: {product:Product;shop:Shop;onClose:()=>void;orderDetails?:string}){
  const {t}=useLanguage();
  const payment=stableAmount(product.price);
  const [coin,setCoin]=useState(payment?.coin||"USDC");
  const [txid,setTxid]=useState("");
  const [status,setStatus]=useState<Message|"">("");
  const dialog=useRef<HTMLDialogElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const network=escrowNetwork;
  useEffect(()=>{dialog.current?.showModal();},[]);
  useEffect(()=>{
    let active=true;
    if(!escrowReady)return;
    // The QR encodes the exact receiving address, leaving token/network selection explicit.
    const temporary=document.createElement("canvas");
    QRCode.toCanvas(temporary,escrowWallet,{width:256,margin:4,errorCorrectionLevel:"M",color:{dark:"#000000",light:"#ffffff"}})
      .then(()=>{if(active&&canvas.current){canvas.current.width=256;canvas.current.height=256;canvas.current.getContext("2d")?.drawImage(temporary,0,0);}})
      .catch(()=>{if(active)setStatus("QR code unavailable. Copy the address.");});
    return()=>{active=false;};
  },[]);
  async function copy(value:string){
    try{await navigator.clipboard.writeText(value);setStatus("Copied!");}
    catch{setStatus("Copy failed. Select the text to copy it manually.");}
  }
  const receipt=[t("Payment receipt"),product.name,orderDetails,payment?payment.amount+" "+coin:"",t("Network")+": "+network,t("Wallet Address")+": "+escrowWallet,txid?t("Transaction Hash (TxID)")+": "+txid:""].filter(Boolean).join("\n");
  return <dialog ref={dialog} onClose={onClose} className="m-auto max-h-[90vh] w-[min(95vw,32rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 backdrop:bg-black/50">
    <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-bold">{t("Pay with USDC / USDT")}</h2><button type="button" onClick={()=>dialog.current?.close()} className="rounded-lg border px-3 py-2">{t("Close")}</button></div>
    {escrowReady?<p className="my-4 rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-900">{t("Escrow Protected")} · {holdDays(shop.escrowHoldDays)} {t("days")}</p>:<p role="alert" className="my-4 rounded-xl border border-amber-300 p-3">{t("Escrow checkout is unavailable. The platform escrow wallet has not been configured.")}</p>}
    <p className="my-3 text-sm">{t("Escrow settings are recorded for future verified payments. Automatic release is not enabled in Milestone 1.")}</p>
    <p className="mt-4 font-semibold">{product.name}</p>
    {orderDetails&&<pre className="my-3 whitespace-pre-wrap text-sm">{orderDetails}</pre>}
    <label className="mt-4 block">{t("Coin")}<select className="mt-1 w-full rounded-lg border p-2" value={coin} onChange={e=>setCoin(e.target.value)} disabled={!!payment?.coin}><option>USDC</option><option>USDT</option></select></label>
    {payment?<p className="my-3 text-2xl font-bold" dir="ltr">{payment.amount} {coin}</p>:<p role="alert" className="my-3">{t("Set a single USD, USDC, or USDT price to display a payment amount. Other currencies require seller confirmation.")}</p>}
    <p className="my-3 inline-block rounded-full bg-emerald-50 px-3 py-1">{t("Network")}: {network}</p>
    <p className="my-3 text-sm">{t("Confirm the exact token and network with the seller before sending. Network fees are additional.")}</p>
    <p className="text-sm">{t("QR contains the wallet address only. Choose the coin, network, and amount in your own wallet.")}</p>
    {escrowReady&&<canvas ref={canvas} width={256} height={256} aria-label={t("Wallet QR Code")} className="mx-auto my-4" />}
    <label className="block">{t("Wallet Address")}<input readOnly dir="ltr" value={escrowWallet} className="my-2 w-full rounded-lg border p-2 font-mono text-sm"/></label>
    <div className="flex flex-wrap gap-2"><button type="button" disabled={!escrowReady} onClick={()=>copy(escrowWallet)} className="rounded-lg border px-4 py-2">{t("Copy Address")}</button><button type="button" disabled={!payment} onClick={()=>payment&&copy(payment.amount)} className="rounded-lg border px-4 py-2 disabled:opacity-50">{t("Copy Amount")}</button></div>
    <label className="mt-4 block">{t("Transaction Hash (TxID)")}<input dir="ltr" maxLength={150} value={txid} onChange={e=>setTxid(e.target.value.replace(/[\r\n]/g,""))} className="mt-1 w-full rounded-lg border p-2"/></label>
    <p className="my-3 text-sm">{t("Optional receipt only. The seller must verify the transfer on-chain before fulfilling the order.")}</p>
    {escrowReady&&payment&&shop.phone.replace(/\D/g,"")&&<a href={"https://wa.me/"+shop.phone.replace(/\D/g,"")+"?text="+encodeURIComponent(receipt)} target="_blank" rel="noopener noreferrer" className="mt-3 block rounded-lg bg-emerald-700 px-4 py-3 text-center font-semibold text-white">{t("Send Payment Receipt on WhatsApp")}</a>}
    {!shop.phone.replace(/\D/g,"")&&<p className="my-3">{t("Seller WhatsApp number is unavailable.")}</p>}
    <p role="status" className="mt-3">{status&&t(status)}</p>
  </dialog>;
}
