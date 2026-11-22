// Remove obsolete image-generation entry points when applying a source patch.
import {rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,relative} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const name of ['src/app/api/tools/generate-product-image/route.ts','src/app/generation/product-image-generator.tsx']){
 const target=resolve(root,name);if(relative(root,target).startsWith('..'))throw Error('Invalid cleanup path');
 rmSync(target,{force:true});
}
