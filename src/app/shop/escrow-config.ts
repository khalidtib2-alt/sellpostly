import { validWallet } from './crypto-data';
// Platform configuration only. Never fall back to a seller-supplied wallet.
export function resolveEscrowWallet(admin:unknown,legacy:unknown){
 const primary=typeof admin==='string'?admin.trim():'';
 return primary||(typeof legacy==='string'?legacy.trim():'');
}
export const escrowWallet=resolveEscrowWallet(process.env.NEXT_PUBLIC_ADMIN_ESCROW_USDC_WALLET,process.env.NEXT_PUBLIC_ESCROW_WALLET);
export const escrowNetwork='Polygon' as const;
export function polygonEscrowReady(wallet:string,configuredNetwork='Polygon'){return configuredNetwork==='Polygon'&&validWallet(wallet,'Polygon');}
export const escrowReady=polygonEscrowReady(escrowWallet,(process.env.NEXT_PUBLIC_ESCROW_NETWORK||'Polygon').trim());
export function holdDays(value:unknown){return typeof value==='number'&&Number.isInteger(value)&&value>=3&&value<=15?value:7;}
