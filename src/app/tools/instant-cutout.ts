/** Edge-connected color removal. Enclosed regions are deliberately preserved. */
export function instantCutout(data:Uint8ClampedArray,width:number,height:number,tolerance=16){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>1280*1280||data.length!==width*height*4)throw new Error('Invalid cutout dimensions');
 const result=new Uint8ClampedArray(data),count=width*height;
 const bins=new Map<number,{n:number;r:number;g:number;b:number}>();
 const sample=(p:number)=>{const i=p*4;if(data[i+3]<128)return;const r=data[i],g=data[i+1],b=data[i+2],key=(r>>4)*256+(g>>4)*16+(b>>4),v=bins.get(key)||{n:0,r:0,g:0,b:0};v.n++;v.r+=r;v.g+=g;v.b+=b;bins.set(key,v);};
 const step=Math.max(1,Math.floor(Math.max(width,height)/256));
 for(let x=0;x<width;x+=step){sample(x);sample((height-1)*width+x);}
 for(let y=0;y<height;y+=step){sample(y*width);sample(y*width+width-1);}
 let dominant:{n:number;r:number;g:number;b:number}|undefined;
 for(const bin of bins.values())if(!dominant||bin.n>dominant.n)dominant=bin;
 if(!dominant)return result;
 const r=dominant.r/dominant.n,g=dominant.g/dominant.n,b=dominant.b/dominant.n;
 const t=Math.max(0,Math.min(100,Number.isFinite(tolerance)?tolerance:16)),feather=6,limit=3*(t+feather)**2;
 const seen=new Uint8Array(count),queue=new Uint32Array(count);let head=0,tail=0;
 const edge=3*Math.max(2,Math.min(8,t/4))**2;
 const visit=(p:number,from=-1)=>{if(seen[p])return;const i=p*4,dr=data[i]-r,dg=data[i+1]-g,db=data[i+2]-b,d=dr*dr+dg*dg+db*db;if(d>limit&&data[i+3]!==0){seen[p]=2;return;}if(from>=0&&data[i+3]!==0){const j=from*4,rr=data[i]-data[j],gg=data[i+1]-data[j+1],bb=data[i+2]-data[j+2];if(rr*rr+gg*gg+bb*bb>edge)return;const ahead=p+(p-from);if(ahead>=0&&ahead<count&&(p-from===width||p-from===-width||Math.floor(ahead/width)===Math.floor(p/width))){const k=ahead*4,ar=data[k]-data[j],ag=data[k+1]-data[j+1],ab=data[k+2]-data[j+2];if(ar*ar+ag*ag+ab*ab>edge*2.25)return;}}if(data[i+3]===0||d<=limit){seen[p]=1;queue[tail++]=p;const a=Math.max(0,Math.min(1,(Math.sqrt(d/3)-t)/feather));result[i+3]=Math.round(data[i+3]*a*a*(3-2*a));}};
 for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}
 for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1);}
 while(head<tail){const p=queue[head++],x=p%width;if(x>0)visit(p-1,p);if(x<width-1)visit(p+1,p);if(p>=width)visit(p-width,p);if(p+width<count)visit(p+width,p);}
 // Feather only reached background pixels. Protected product pixels retain exact RGBA.
 return result;
}
export function instantCutoutSize(width:number,height:number){const scale=Math.min(1,1280/Math.max(width,height));return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};}
