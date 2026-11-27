import {clampCrop,type Crop} from './media-utils';
export type Corner='nw'|'ne'|'sw'|'se';
export type CropHandle=Corner|'n'|'e'|'s'|'w';
export function cropHandles(c:Crop):[CropHandle,number,number][]{return [['nw',c.x,c.y],['ne',c.x+c.w,c.y],['sw',c.x,c.y+c.h],['se',c.x+c.w,c.y+c.h],['n',c.x+c.w/2,c.y],['e',c.x+c.w,c.y+c.h/2],['s',c.x+c.w/2,c.y+c.h],['w',c.x,c.y+c.h/2]];}
export function hitCropHandle(c:Crop,x:number,y:number,padX:number,padY:number){return cropHandles(c).find(([,hx,hy])=>Math.abs(x-hx)<=padX&&Math.abs(y-hy)<=padY)?.[0];}
export function resizeHandle(c:Crop,handle:CropHandle,dx:number,dy:number,aspect=0):Crop{
 if(handle.length===2)return resizeCorner(c,handle as Corner,dx,dy,aspect);
 const horizontal=handle==='w'||handle==='e',reverse=handle==='w'||handle==='n';
 if(horizontal){const anchor=reverse?c.x+c.w:c.x,center=c.y+c.h/2,maxW=reverse?anchor:1-anchor;let w=Math.max(.01,c.w+(reverse?-dx:dx));w=Math.min(w,maxW,aspect?2*Math.min(center,1-center)*aspect:1);const h=aspect?w/aspect:c.h;return {x:reverse?anchor-w:anchor,y:aspect?center-h/2:c.y,w,h};}
 const anchor=reverse?c.y+c.h:c.y,center=c.x+c.w/2,maxH=reverse?anchor:1-anchor;let h=Math.max(.01,c.h+(reverse?-dy:dy));h=Math.min(h,maxH,aspect?2*Math.min(center,1-center)/aspect:1);const w=aspect?h*aspect:c.w;return {x:aspect?center-w/2:c.x,y:reverse?anchor-h:anchor,w,h};
}
export function resizeCorner(c:Crop,corner:Corner,dx:number,dy:number,aspect=0):Crop{
 const west=corner.includes('w'),north=corner.includes('n'),anchorX=west?c.x+c.w:c.x,anchorY=north?c.y+c.h:c.y;
 let w=Math.max(.01,c.w+(west?-dx:dx)),h=Math.max(.01,c.h+(north?-dy:dy));
 const maxW=west?anchorX:1-anchorX,maxH=north?anchorY:1-anchorY;
 if(aspect){w=Math.min(w,maxW,maxH*aspect);h=w/aspect;}else{w=Math.min(w,maxW);h=Math.min(h,maxH);}
 const next={x:west?anchorX-w:anchorX,y:north?anchorY-h:anchorY,w,h};return aspect?next:clampCrop(next);
}
