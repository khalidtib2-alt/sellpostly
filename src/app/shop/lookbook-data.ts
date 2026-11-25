import type {ShopMode} from './shop-data';
export const lookbookPins=[{x:52,y:23},{x:48,y:43},{x:72,y:58},{x:48,y:85}] as const;
export function lookbookPath(slug:string|undefined,mode:ShopMode,snapshot?:string){
 if(slug)return '/s/'+encodeURIComponent(slug)+(mode==='affiliate'?'/affiliate':'')+'/look';
 return '/shop/look?'+new URLSearchParams({...snapshot?{s:snapshot}:{},mode});
}
export function lookbookImage(gender:'men'|'women'){return '/lookbook/'+gender+'.svg';}
