import 'server-only';
import {validTronChecksum} from './tron-validation';
import {randomBytes} from 'node:crypto';
import {db,PUBLISH_SHOP_SQL} from './db';
import {validateShop} from '../app/shop/shop-data';
export async function publishFreePrimary(owner:string,value:unknown){const {escrowHoldDays:_ignored,...shop}=validateShop(value);if(shop.payments?.TRON_USDT.enabled&&!validTronChecksum(shop.payments.TRON_USDT.wallet))throw Error('INVALID_TRON_WALLET');const rows=await db().query(PUBLISH_SHOP_SQL,[owner,'store-'+randomBytes(9).toString('hex'),shop.name,shop.logo||'',JSON.stringify(shop)]);if(!rows[0])throw Error('ACCOUNT_REQUIRED');return rows[0].slug as string;}
