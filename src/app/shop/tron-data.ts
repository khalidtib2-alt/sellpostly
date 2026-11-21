/** Structural Base58 decoding for a TRON mainnet receiving address. */
export function tronAddressBytes(value:string){
 if(!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value))return null;
 const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';let n=BigInt(0);
 for(const c of value)n=n*BigInt(58)+BigInt(alphabet.indexOf(c));
 const bytes:number[]=[];while(n>BigInt(0)){bytes.unshift(Number(n&BigInt(255)));n>>=BigInt(8);}
 return bytes.length===25&&bytes[0]===65?Uint8Array.from(bytes):null;
}
export const validTronAddress=(value:string)=>!!tronAddressBytes(value);
export const validTronTx=(value:string)=>/^[a-f0-9]{64}$/i.test(value);
