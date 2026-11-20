import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {checkoutAmount} from '../src/app/shop/checkout-amount';
import {resolveEscrowWallet,polygonEscrowReady} from '../src/app/shop/escrow-config';
import {chooseEscrow} from '../src/app/shop/payment-config';
import {translations} from '../src/app/translations';
test('checkout display uses two decimals without changing exact accounting values',()=>{
 for(const [value,expected] of [['75.000000','75.00'],['75','75.00'],['1.235000','1.24'],['0.999999','1.00'],['99999999999999.990000','99999999999999.99']])assert.equal(checkoutAmount(value),expected);
});
test('escrow configuration prefers the admin wallet and fails closed on invalid admin config',()=>{
 const admin='0x'+'1'.repeat(40),legacy='0x'+'2'.repeat(40);
 assert.equal(resolveEscrowWallet(' '+admin+' ',legacy),admin);
 assert.equal(resolveEscrowWallet('',legacy),legacy);
 assert.equal(resolveEscrowWallet(undefined,undefined),'');
 assert.equal(polygonEscrowReady(resolveEscrowWallet('invalid',legacy)),false);
 for(const policy of ['required','optional_for_buyer'] as const)assert.equal(chooseEscrow(policy,'USDC_DIRECT',true),true);
 assert.equal(chooseEscrow('required','BANK',true),false);
});
test('active escrow exposes only locked platform addresses; direct wallet remains in the direct branch',async()=>{
 const peer=await readFile('src/app/shop/peer-checkout.tsx','utf8'),crypto=await readFile('src/app/shop/crypto-checkout.tsx','utf8');
 assert.match(peer,/checkoutAmount\(total.amount\)/);assert.match(crypto,/checkoutAmount\(payment.amount\)/);
 assert.match(peer,/readOnly dir="ltr" value=\{escrowWallet\}/);assert.match(crypto,/readOnly dir="ltr" value=\{escrowWallet\}/);
 assert.ok(peer.indexOf('p.USDC_DIRECT.wallet')>peer.indexOf('Continue with USDC Escrow'));
 assert.doesNotMatch(crypto,/shop\.cryptoWallet|p\.USDC_DIRECT\.wallet/);
 assert.match(crypto,/<BuyerOrderForm/);assert.match(crypto,/value=\{txid\}/);
 for(const key of ['Admin Escrow USDC Wallet (Locked)','This address is controlled by the platform and cannot be edited at checkout.'] as const){assert.ok(translations[key].fr);assert.match(translations[key].ar,/[\u0600-\u06ff]/);}
});
