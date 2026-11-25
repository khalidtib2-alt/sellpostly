import {readFileSync} from 'node:fs';
import {translations} from './src/app/translations';
import {paymentLabels} from './src/app/shop/payment-config';
for(const file of ['src/app/shop/payment-settings.tsx','src/app/shop/shop-builder.tsx','src/app/shop/peer-checkout.tsx']){for(const m of readFileSync(file,'utf8').matchAll(/\b(?:t|tr)\(['"]([^'"]+)['"]/g)){if(!(m[1] in translations))console.log(file,JSON.stringify(m[1]));}}for(const value of Object.values(paymentLabels))if(!(value in translations))console.log('PAYMENT LABEL',value);
