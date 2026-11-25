const fs=require('fs');const p='src/app/shop/product-landing.tsx';fs.writeFileSync(p,fs.readFileSync(p,'utf8').replaceAll("t('USDC')","t('Pay with USDC')"));
