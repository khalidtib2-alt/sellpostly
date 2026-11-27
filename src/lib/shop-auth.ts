import 'server-only';
import {randomBytes} from 'node:crypto';
import {db} from './db';
import {freeOwner} from './resolve-seller-plan';
export {freeOwner};
export {resolveSellerPlan as shopIdentity} from './resolve-seller-plan';
export async function createFreeAccount(){const key=randomBytes(32).toString('hex');await (await db()).query("INSERT INTO subscriptions(owner_key,provider) VALUES($1,'free')",[freeOwner(key)]);return key;}
