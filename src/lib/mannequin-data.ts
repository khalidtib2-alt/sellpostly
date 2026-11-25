import type {Product} from '../app/shop/shop-data';
import {safeImage} from '../app/shop/shop-data';
import type {OutfitZone} from './daily-look';
export type OutfitPiece={zone:OutfitZone;product:Product};
export function turntableAngle(value:number){return ((value%360)+360)%360;}
export function titleColor(title:string){
 const text=title.toLowerCase();
 const colors:[RegExp,string][]=[[/black|noir|negro|أسود|سوداء/,'#202126'],[/white|blanc|blanco|أبيض|بيضاء/,'#eeeeea'],[/navy|marine|marino|كحلي/,'#202c48'],[/blue|bleu|azul|أزرق/,'#527ea6'],[/green|vert|verde|أخضر|olive/,'#66735b'],[/red|rouge|rojo|أحمر/,'#ac4141'],[/pink|rose|rosa|وردي/,'#ce9baf'],[/brown|marron|marrón|بني/,'#84634d'],[/beige|sand|taupe|بيج/,'#b5a58c'],[/gray|grey|gris|رمادي|charcoal/,'#697078']];
 return colors.find(([pattern])=>pattern.test(text))?.[1]||'#9d9b94';
}
/** Every surface uses only the current item, never an editorial model photo. */
export function pieceAppearance(product?:Product){return {color:product?titleColor(product.name):'#a8a8a3',image:product?safeImage(product.image):''};}
export type Vec=[number,number,number];
export type Facet={width:number;height:number;matrix:string;clip:string;shade:number;u:number;vertices:Vec[]};
const sub=(a:Vec,b:Vec):Vec=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a:Vec,b:Vec)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const norm=(a:Vec):Vec=>{const length=Math.hypot(...a)||1;return a.map(n=>n/length) as Vec;};
const cross=(a:Vec,b:Vec):Vec=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
/** Project a real 3D triangle onto a local DOM plane; CSS handles depth/occlusion. */
function triangle(a:Vec,b:Vec,c:Vec,u:number):Facet{
 const ab=sub(b,a),ac=sub(c,a),x=norm(ab),normal=norm(cross(ab,ac)),y=norm(cross(normal,x));
 const length=Math.hypot(...ab),cx=dot(ac,x),cy=dot(ac,y),min=Math.min(0,cx),width=Math.max(length,cx)-min,height=Math.max(.1,cy);
 const origin=a.map((n,i)=>n+x[i]*min) as Vec;
 return {vertices:[a,b,c],width:Math.max(.1,width+.15),height:height+.15,matrix:'matrix3d('+[...x,0,...y,0,...normal,0,...origin,1].join(',')+')',clip:`polygon(${-min/width*100}% 0%,${(length-min)/width*100}% 0%,${(cx-min)/width*100}% 100%)`,shade:Math.max(.45,Math.min(1, .72+normal[0]*-.13+normal[2]*.2)),u};
}
export type Ring={y:number;x:number;z:number};
export function ringMesh(rings:Ring[],segments=12):Facet[]{
 const result:Facet[]=[];
 for(let row=0;row<rings.length-1;row++)for(let i=0;i<segments;i++){
  const point=(ring:Ring,angle:number):Vec=>[Math.sin(angle)*ring.x,ring.y,Math.cos(angle)*ring.z];
  const angle=i/segments*Math.PI*2,next=(i+1)/segments*Math.PI*2,a=point(rings[row],angle),b=point(rings[row],next),c=point(rings[row+1],next),d=point(rings[row+1],angle);
  result.push(triangle(a,b,c,i/segments),triangle(a,c,d,i/segments));
 }return result;
}
