export const cryptoNetworks = ["Polygon","Base","Arbitrum","BNB Smart Chain","Solana"] as const;
export type CryptoNetwork = typeof cryptoNetworks[number];
export function normalizeNetwork(value: unknown): CryptoNetwork {
  return cryptoNetworks.includes(value as CryptoNetwork) ? value as CryptoNetwork : "Polygon";
}
export function validWallet(address: string, network: CryptoNetwork) {
  if(network!=="Solana")return /^0x[0-9a-fA-F]{40}$/.test(address)&&!/^0x0{40}$/.test(address);
  if(!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address))return false;
  const alphabet="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let number=BigInt(0);
  for(const character of address)number=number*BigInt(58)+BigInt(alphabet.indexOf(character));
  let size=0;while(number>BigInt(0)){size++;number>>=BigInt(8);}
  return size+(address.match(/^1*/)?.[0].length||0)===32;
}
export function stableAmount(price: string) {
  const match=price.trim().match(/^(?:(USD|USDC|USDT|\$)\s*)?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,6})?)\s*(USD|USDC|USDT)?$/i);
  if(!match)return null;
  const prefix=(match[1]||"").toUpperCase(),suffix=(match[3]||"").toUpperCase();
  if(prefix&&suffix&&prefix!=="$"&&prefix!==suffix)return null;
  const amount=match[2].replace(/,/g,"").replace(/^0+(?=\d)/,"");
  if(!/[1-9]/.test(amount))return null;
  return {amount,coin:prefix==="USDC"||prefix==="USDT"?prefix:suffix==="USDC"||suffix==="USDT"?suffix:""};
}

