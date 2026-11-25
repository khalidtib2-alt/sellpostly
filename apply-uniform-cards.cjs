const fs=require('fs');let p='src/app/shop/storefront-templates.tsx',s=fs.readFileSync(p,'utf8');const start=s.indexOf('export function StorefrontProducts'),end=s.indexOf('function QuickView',start);s=s.slice(0,start)+fs.readFileSync('uniform-card-function.txt','utf8')+'\n'+s.slice(end);fs.writeFileSync(p,s);
p='src/app/globals.css';s=fs.readFileSync(p,'utf8');s=s.replace(/\.editorial-product:first-child[^\n]+\n/g,'');const marker=s.indexOf('/* Full-bleed editorial studio illustrations');if(marker>=0)s=s.slice(0,marker);s+=`\n/* Uniform studio frames and action baselines for every product source and mode. */
.editorial-product,.boutique-product {display:flex;flex-direction:column;height:100%;min-width:0;}
.store-card-visual {position:relative;padding:0;aspect-ratio:4/3;width:100%;flex:none;background:#f8fafc;overflow:hidden;}
.store-photo-frame {position:absolute;inset:0;display:flex;width:100%;height:100%;padding:0;border-radius:0;align-items:center;justify-content:center;background:#f8fafc;overflow:hidden;}
.store-photo-frame img {display:block;width:100%;height:100%;max-width:100%;max-height:100%;padding:1rem;object-fit:contain;mix-blend-mode:multiply;transform:none;}
.boutique-product:hover .store-photo-frame img {transform:none;}
.shop-surface[data-surface='slate'] .store-photo-frame {background:#fff;}
.shop-surface[data-surface='slate'] .store-photo-frame img {mix-blend-mode:normal;}
.store-card-number {z-index:2;background:#f8fafce8;color:#334155;padding:.25rem .5rem;border-radius:999px;pointer-events:none;}
.store-card-body {display:flex;flex-direction:column;flex:1;min-width:0;}
.store-photo-credit {height:2rem;overflow:hidden;font-size:.65rem;line-height:1rem;color:var(--secondary);}
.store-card-body .store-eyebrow {white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:1rem;}
.store-card-body h3 {height:3.3em;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;}
.store-price-slot {min-height:2.5rem;}
.store-card-description {height:3.5em;flex:none;}
.store-stock {min-height:1.5rem;}
.store-highlights {min-height:7rem;max-height:7rem;overflow:hidden;}
.store-highlights li span {display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;}
.store-card-actions {margin-top:auto;display:flex;flex-direction:column;gap:.75rem;padding-top:1rem;}
.store-primary-action {min-height:46px;}
.store-share-action {min-height:2rem;text-align:start;}
.store-video-slot {min-height:3rem;}
.studio-cover-caption {position:absolute;bottom:.65rem;inset-inline-start:.65rem;z-index:2;border-radius:999px;background:#f8fafce8;color:#334155;padding:.3rem .6rem;font-size:.6rem;pointer-events:none;}
`;fs.writeFileSync(p,s);
