import { validWallet } from './crypto-data';
export const escrowWallet=(process.env.NEXT_PUBLIC_ESCROW_WALLET||'').trim();
export const escrowNetwork='Polygon' as const;
export function polygonEscrowReady(wallet:string,configuredNetwork='Polygon'){return configuredNetwork==='Polygon'&&validWallet(wallet,'Polygon');}
export const escrowReady=polygonEscrowReady(escrowWallet,(process.env.NEXT_PUBLIC_ESCROW_NETWORK||'Polygon').trim());
export function holdDays(value:unknown){return typeof value==='number'&&Number.isInteger(value)&&value>=3&&value<=15?value:7;}
