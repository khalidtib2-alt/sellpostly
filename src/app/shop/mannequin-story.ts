import {wearableOutfit} from '../../lib/daily-look';
import {mannequinParts} from './lookbook-mannequin';
import {pieceAppearance,ringMesh,type OutfitPiece} from '../../lib/mannequin-data';
/** Same mesh and active items as the DOM stage; unreadable remote images fall back to item colors. */
export function paintMannequin(ctx:CanvasRenderingContext2D,outfit:OutfitPiece[],gender:'women'|'men',angle:number,images:Map<string,HTMLImageElement>){
 outfit=wearableOutfit(outfit);
 const radians=angle*Math.PI/180,cos=Math.cos(radians),sin=Math.sin(radians);
 const faces=mannequinParts(gender).flatMap(part=>{const piece=outfit.find(p=>p.zone===part.zone),appearance=pieceAppearance(piece?.product),rotate=(part.rotate||0)*Math.PI/180;
  return ringMesh(part.rings,part.segments).map(face=>{const points=face.vertices.map(([x,y,z])=>{const px=x*Math.cos(rotate)-y*Math.sin(rotate)+part.x,py=x*Math.sin(rotate)+y*Math.cos(rotate)+part.y,pz=z+part.z;return {x:540+(px*cos+pz*sin)*2.35,y:240+py*2.35,z:-px*sin+pz*cos};});return {points,shade:face.shade,color:part.zone?appearance.color:'#b5b4ac',image:piece?images.get(piece.product.id):undefined};});
 }).sort((a,b)=>a.points.reduce((s,p)=>s+p.z,0)-b.points.reduce((s,p)=>s+p.z,0));
 ctx.save();ctx.fillStyle='#181b23';ctx.fillRect(90,215,900,1120);
 for(const face of faces){ctx.save();ctx.beginPath();face.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=face.color;ctx.fill();
  if(face.image){ctx.clip();const xs=face.points.map(p=>p.x),ys=face.points.map(p=>p.y);ctx.globalCompositeOperation='multiply';ctx.drawImage(face.image,Math.min(...xs),Math.min(...ys),Math.max(1,Math.max(...xs)-Math.min(...xs)),Math.max(1,Math.max(...ys)-Math.min(...ys)));ctx.globalCompositeOperation='source-over';}
  ctx.fillStyle=`rgba(0,0,0,${1-face.shade})`;ctx.fill();ctx.restore();}
 ctx.restore();
}
