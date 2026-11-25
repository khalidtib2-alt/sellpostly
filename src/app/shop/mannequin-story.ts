import {wearableOutfit} from '../../lib/daily-look';
import {photoGarmentPlacement,type OutfitPiece} from '../../lib/mannequin-data';
import {garmentCutout} from '../../lib/garment-cutout';
import {editorialView} from './lookbook-data';
/** Export the same illustrative photograph and safe cutouts, never a raw white card background. */
export async function paintMannequin(ctx:CanvasRenderingContext2D,outfit:OutfitPiece[],gender:'women'|'men',angle:number,model:HTMLImageElement){
 const view=editorialView(angle),scale=Math.min(900/model.width,1120/model.height),width=model.width*scale,height=model.height*scale,x=(1080-width)/2,y=215+(1120-height)/2;
 ctx.drawImage(model,x,y,width,height);
 for(const piece of wearableOutfit(outfit)){
  const texture=await garmentCutout(piece.product.image,piece.product.name),box=photoGarmentPlacement(piece.zone,view.key),left=x+width*box.x/100,top=y+height*box.y/100,w=width*box.w/100,h=height*box.h/100;
  ctx.save();ctx.globalAlpha=.22;ctx.globalCompositeOperation='color';ctx.fillStyle=texture.color;ctx.fillRect(left,top,w,h);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  if(texture.src&&view.key!=='back'&&view.key!=='side'){const image=await new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error());image.src=texture.src;});const ratio=Math.min(w/image.width,h/image.height),iw=image.width*ratio,ih=image.height*ratio;ctx.drawImage(image,left+(w-iw)/2,top+(h-ih)/2,iw,ih);}
  ctx.restore();
 }
}
