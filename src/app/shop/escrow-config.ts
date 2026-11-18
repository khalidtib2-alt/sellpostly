import { normalizeNetwork, validWallet } from './crypto-data';
export const escrowWallet=(process.env.NEXT_PUBLIC_ESCROW_WALLET||'').trim();
export const escrowNetwork=normalizeNetwork(process.env.NEXT_PUBLIC_ESCROW_NETWORK||'Polygon');
export const escrowReady=validWallet(escrowWallet,escrowNetwork);
export function holdDays(value:unknown){return typeof value==='number'&&Number.isInteger(value)&&value>=3&&value<=15?value:7;}
