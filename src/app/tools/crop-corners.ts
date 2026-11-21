import {clampCrop,type Crop} from './media-utils';
export type Corner='nw'|'ne'|'sw'|'se';
export function resizeCorner(c:Crop,corner:Corner,dx:number,dy:number,aspect=0):Crop{
 const west=corner.includes('w'),north=corner.includes('n'),anchorX=west?c.x+c.w:c.x,anchorY=north?c.y+c.h:c.y;
 let w=Math.max(.01,c.w+(west?-dx:dx)),h=Math.max(.01,c.h+(north?-dy:dy));
 const maxW=west?anchorX:1-anchorX,maxH=north?anchorY:1-anchorY;
 if(aspect){w=Math.min(w,maxW,maxH*aspect);h=w/aspect;}else{w=Math.min(w,maxW);h=Math.min(h,maxH);}
 const next={x:west?anchorX-w:anchorX,y:north?anchorY-h:anchorY,w,h};return aspect?next:clampCrop(next);
}
