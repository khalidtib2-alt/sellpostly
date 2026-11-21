import 'server-only';
import {createHash} from 'node:crypto';
import {tronAddressBytes} from '../app/shop/tron-data';
export function validTronChecksum(value:string){const bytes=tronAddressBytes(value);if(!bytes)return false;const digest=createHash('sha256').update(createHash('sha256').update(bytes.slice(0,21)).digest()).digest();return bytes.slice(21).every((v,i)=>v===digest[i]);}
