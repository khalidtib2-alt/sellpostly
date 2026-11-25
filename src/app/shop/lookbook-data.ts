import type {ShopMode} from './shop-data';
export const lookbookRotationStep=45;
export const editorialViews=[{key:'front',angle:0,label:'Front'},{key:'left',angle:45,label:'3/4 Left'},{key:'side',angle:90,label:'Side'},{key:'back',angle:180,label:'Back'},{key:'right',angle:315,label:'3/4 Right'}] as const;
export type EditorialView=typeof editorialViews[number]['key'];
export function editorialImage(gender:'men'|'women',view:EditorialView){return view==='front'?lookbookImage(gender):'/lookbook/'+gender+'-'+view+'.jpg';}
export function editorialView(angle:number){const value=((angle%360)+360)%360;return [...editorialViews].sort((a,b)=>Math.min(Math.abs(a.angle-value),360-Math.abs(a.angle-value))-Math.min(Math.abs(b.angle-value),360-Math.abs(b.angle-value)))[0];}
export function lookbookPath(slug:string|undefined,mode:ShopMode,snapshot?:string){
 if(slug)return '/s/'+encodeURIComponent(slug)+(mode==='affiliate'?'/affiliate':'')+'/look';
 return '/shop/look?'+new URLSearchParams({...snapshot?{s:snapshot}:{},mode});
}
export function lookbookImage(gender:'men'|'women'){return '/lookbook/'+gender+'-editorial.jpg';}

export const lookbookPhotoCredits={women:{name:'rehman yousaf',url:'https://www.pexels.com/photo/a-woman-in-beige-dress-standing-while-looking-afar-13816069/'},men:{name:'Bruno Casttro',url:'https://www.pexels.com/photo/elegant-man-in-stylish-cream-suit-fashion-portrait-29242239/'}} as const;
