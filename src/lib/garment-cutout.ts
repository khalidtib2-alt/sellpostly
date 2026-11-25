import {titleColor} from './mannequin-data';
export type GarmentCutout={src:string;color:string;mode:'cutout'|'color'};
/** Edge-connected pale backgrounds only. No semantic segmentation or remote image service. */
export function clearPhotoBackground(input:Uint8ClampedArray,width:number,height:number){
 const data=new Uint8ClampedArray(input),size=width*height,seen=new Uint8Array(size),queue=new Int32Array(size);let first=0,last=0,removed=0;
 const pale=(i:number)=>{const p=i*4,r=data[p],g=data[p+1],b=data[p+2];return data[p+3]<8||Math.min(r,g,b)>232&&Math.max(r,g,b)-Math.min(r,g,b)<22;};
 const add=(i:number)=>{if(i>=0&&i<size&&!seen[i]&&pale(i)){seen[i]=1;queue[last++]=i;}};
 let edge=0,plain=0;for(let x=0;x<width;x++)for(const y of [0,height-1]){edge++;if(pale(y*width+x))plain++;add(y*width+x);}for(let y=1;y<height-1;y++)for(const x of [0,width-1]){edge++;if(pale(y*width+x))plain++;add(y*width+x);}
 if(plain/Math.max(1,edge)<.65)return null;
 while(first<last){const i=queue[first++];data[i*4+3]=0;removed++;if(i%width)add(i-1);if(i%width<width-1)add(i+1);if(i>=width)add(i-width);if(i<size-width)add(i+width);}
 if(removed<size*.08||removed>size*.98)return null;
 let left=width,top=height,right=-1,bottom=-1;for(let i=0;i<size;i++)if(data[i*4+3]>30){const x=i%width,y=Math.floor(i/width);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 return right<left?null:{data,left,top,width:right-left+1,height:bottom-top+1};
}
const cache=new Map<string,Promise<GarmentCutout>>();
export function garmentCutout(src:string,title:string):Promise<GarmentCutout>{
 const key=src+'|'+title;if(cache.has(key))return cache.get(key)!;
 const fallback:GarmentCutout={src:'',color:titleColor(title),mode:'color'};
 const result=new Promise<GarmentCutout>(resolve=>{
  if(!src||typeof document==='undefined'||typeof Image==='undefined'){resolve(fallback);return;}
  const image=new Image();let done=false;const finish=(value:GarmentCutout)=>{if(done)return;done=true;clearTimeout(timer);resolve(value);};const timer=setTimeout(()=>finish(fallback),7000);
  image.crossOrigin='anonymous';image.onerror=()=>finish(fallback);image.onload=()=>{try{
   const canvas=document.createElement('canvas'),scale=Math.min(1,800/Math.max(image.width,image.height));canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const ctx=canvas.getContext('2d');if(!ctx)throw Error();ctx.drawImage(image,0,0,canvas.width,canvas.height);
   const cleaned=clearPhotoBackground(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);if(!cleaned){finish(fallback);return;}
   const pixels=ctx.createImageData(canvas.width,canvas.height);pixels.data.set(cleaned.data);ctx.putImageData(pixels,0,0);const crop=document.createElement('canvas');crop.width=cleaned.width;crop.height=cleaned.height;crop.getContext('2d')!.drawImage(canvas,cleaned.left,cleaned.top,cleaned.width,cleaned.height,0,0,cleaned.width,cleaned.height);finish({src:crop.toDataURL('image/png'),color:fallback.color,mode:'cutout'});
  }catch{finish(fallback);}};image.src=src;
 });if(cache.size>=24)cache.delete(cache.keys().next().value!);cache.set(key,result);return result;
}
