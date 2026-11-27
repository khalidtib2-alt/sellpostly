/** Edge-connected color removal. Enclosed regions are deliberately preserved. */
export function instantCutout(data:Uint8ClampedArray,width:number,height:number,tolerance=32){
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
 const t=Math.max(0,Math.min(100,Number.isFinite(tolerance)?tolerance:32)),feather=12,limit=3*(t+feather)**2;
 const seen=new Uint8Array(count),queue=new Uint32Array(count);let head=0,tail=0;
 const visit=(p:number)=>{if(seen[p])return;seen[p]=1;const i=p*4,dr=data[i]-r,dg=data[i+1]-g,db=data[i+2]-b,d=dr*dr+dg*dg+db*db;if(data[i+3]===0||d<=limit){queue[tail++]=p;const a=Math.max(0,Math.min(1,(Math.sqrt(d/3)-t)/feather));result[i+3]=Math.round(data[i+3]*a*a*(3-2*a));}};
 for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}
 for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1);}
 while(head<tail){const p=queue[head++],x=p%width;if(x>0)visit(p-1);if(x<width-1)visit(p+1);if(p>=width)visit(p-width);if(p+width<count)visit(p+width);}
 // A narrow alpha-only feather avoids hard cutout edges without changing RGB.
 const alpha=new Uint8Array(count);for(let p=0;p<count;p++)alpha[p]=result[p*4+3];
 for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const p=y*width+x;if(alpha[p]===0)continue;const sum=alpha[p-1]+alpha[p+1]+alpha[p-width]+alpha[p+width];if(sum<alpha[p]*4)result[p*4+3]=Math.round((alpha[p]*4+sum)/8);}
 return result;
}
export function instantCutoutSize(width:number,height:number){const scale=Math.min(1,1280/Math.max(width,height));return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};}
