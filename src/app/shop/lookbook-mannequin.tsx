'use client';
import {useMemo,memo,type CSSProperties} from 'react';
import {pieceAppearance,ringMesh,type OutfitPiece,type Ring} from '../../lib/mannequin-data';
import {zoneLabels,type OutfitZone} from '../../lib/daily-look';
import {useLanguage} from '../language-context';
export type BodyPart={name:string;zone?:OutfitZone;x:number;y:number;z:number;rotate?:number;rings:Ring[];segments?:number};
export function mannequinParts(gender:'women'|'men'):BodyPart[]{
 const shoulder=gender==='women'?44:49,waist=gender==='women'?31:37;
 return [
  {name:'head',x:0,y:4,z:0,rings:[{y:0,x:1,z:1},{y:5,x:16,z:16},{y:18,x:22,z:20},{y:40,x:21,z:19},{y:56,x:12,z:13},{y:60,x:2,z:3}]},
  {name:'neck',x:0,y:61,z:0,rings:[{y:0,x:10,z:10},{y:19,x:12,z:11}]},
  {name:'torso',zone:'upper',x:0,y:79,z:0,rings:[{y:0,x:19,z:16},{y:13,x:shoulder,z:23},{y:68,x:waist,z:21},{y:132,x:waist+7,z:23}]},
  ...[-1,1].map(side=>({name:'sleeve'+side,zone:'upper' as const,x:side*(shoulder-2),y:94,z:0,rotate:-side*10,rings:[{y:0,x:15,z:16},{y:68,x:12,z:13},{y:129,x:9,z:10}]})),
  ...[-1,1].map(side=>({name:'hand'+side,x:side*67,y:221,z:0,rotate:-side*10,rings:[{y:0,x:8,z:8},{y:23,x:7,z:7},{y:28,x:2,z:3}]})),
  {name:'waist',zone:'lower',x:0,y:208,z:0,rings:[{y:0,x:waist+7,z:23},{y:27,x:waist+8,z:24}]},
  ...[-1,1].map(side=>({name:'trouser'+side,zone:'lower' as const,x:side*21,y:228,z:0,rings:[{y:0,x:21,z:23},{y:98,x:16,z:17},{y:196,x:14,z:14}]})),
  ...[-1,1].map(side=>({name:'shoe'+side,zone:'footwear' as const,x:side*23,y:423,z:10,rings:[{y:0,x:13,z:19},{y:10,x:17,z:32},{y:25,x:17,z:34},{y:29,x:14,z:31}]})),
  {name:'strap',zone:'accessory',x:1,y:89,z:27,rotate:-27,rings:[{y:0,x:3,z:2},{y:158,x:3,z:2}],segments:4},
  {name:'bag',zone:'accessory',x:51,y:216,z:25,rings:[{y:0,x:16,z:9},{y:5,x:23,z:12},{y:49,x:23,z:12},{y:56,x:17,z:9}],segments:8}
 ];
}
function LookbookMannequin({outfit,gender,active,onSelect}:{outfit:OutfitPiece[];gender:'women'|'men';active:string;onSelect:(id:string)=>void}){
 const {t}=useLanguage(),parts=useMemo(()=>mannequinParts(gender).map(part=>({...part,faces:ringMesh(part.rings,part.segments)})),[gender]);
 return <div className="lookbook-avatar-world" data-gender={gender}>{parts.map(part=>{
  const piece=part.zone?outfit.find(piece=>piece.zone===part.zone):undefined;
  const appearance=pieceAppearance(piece?.product),selected=!!piece&&active===piece.product.id;
  const props={className:'lookbook-avatar-part '+(part.zone?'lookbook-avatar-garment':''),style:{transform:`translate3d(${part.x}px,${part.y}px,${part.z}px) rotateZ(${part.rotate||0}deg)`} as CSSProperties,'data-product-id':piece?.product.id,'data-active':selected,'data-part':part.name};
  const faces=part.faces.map((face,i)=><span key={i} className="lookbook-avatar-facet" aria-hidden="true" style={{width:face.width,height:face.height,transform:face.matrix,clipPath:face.clip,backgroundColor:part.zone?appearance.color:'#b5b4ac',backgroundImage:appearance.image&&part.zone?`linear-gradient(#00000012,#00000012),url(${JSON.stringify(appearance.image)})`:undefined,backgroundPosition:`${face.u*100}% center`,backgroundSize:'220% 100%',filter:`brightness(${selected?Math.min(1.2,face.shade+.25):face.shade})`}}/>);
  return piece?<button key={part.name} type="button" {...props} aria-pressed={selected} aria-label={t(zoneLabels[piece.zone])+': '+piece.product.name} onClick={()=>onSelect(piece.product.id)}>{faces}</button>:<div key={part.name} {...props} aria-hidden="true">{faces}</div>;
 })}</div>;
}

export default memo(LookbookMannequin);
