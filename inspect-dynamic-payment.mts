import {translations} from './src/app/translations';
for(const key of ['Off - direct USDC','Optional for buyer','Required for USDC','Bank Name','Account Holder Name','IBAN / 24-digit RIB','SWIFT / BIC','Hosted Card Checkout URL','Payment Link / Email','Wisetag / Payment Link'])if(!(key in translations))console.log('MISSING',JSON.stringify(key));
