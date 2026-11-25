import type {ShopMode} from './shop-data';
export const lookbookPins=[{x:52,y:23},{x:48,y:43},{x:72,y:58},{x:48,y:85}] as const;
export function lookbookPath(slug:string|undefined,mode:ShopMode,snapshot?:string){
 if(slug)return '/s/'+encodeURIComponent(slug)+(mode==='affiliate'?'/affiliate':'')+'/look';
 return '/shop/look?'+new URLSearchParams({...snapshot?{s:snapshot}:{},mode});
}
export function lookbookImage(gender:'men'|'women'){return '/lookbook/'+gender+'.jpg';}

export const lookbookPhotoCredits={women:{name:'rehman yousaf',url:'https://www.pexels.com/photo/a-woman-in-beige-dress-standing-while-looking-afar-13816069/'},men:{name:'Bruno Casttro',url:'https://www.pexels.com/photo/elegant-man-in-stylish-cream-suit-fashion-portrait-29242239/'}} as const;
