import {lookup} from 'node:dns/promises';
import {BlockList,isIP} from 'node:net';
import http from 'node:http';
import https from 'node:https';
const blocked=new BlockList();
for(const [ip,bits] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]] as const)blocked.addSubnet(ip,bits);
const globalV6=new BlockList();globalV6.addSubnet('2000::',3,'ipv6');
export function isPublicImageAddress(ip:string){return isIP(ip)===4?!blocked.check(ip,'ipv4'):isIP(ip)===6&&globalV6.check(ip,'ipv6')&&!/^(2001:|2002:|3fff:)/i.test(ip);}
export function publicImageUrl(input:string){const url=new URL(input),host=url.hostname.replace(/^\[|\]$/g,'');if(input.length>20000||!['http:','https:'].includes(url.protocol)||url.username||url.password||(url.port&&!['80','443'].includes(url.port))||host==='localhost'||host.endsWith('.localhost')||(isIP(host)&&!isPublicImageAddress(host)))throw Error('INVALID_IMAGE_URL');return url;}
export function imageSignature(bytes:Buffer,type:string){return type==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:type==='image/webp'&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';}
export async function downloadPublicImage(input:string,signal?:AbortSignal,redirects=0,deadline=Date.now()+16000){
 const result=await downloadPublicResource(input,['image/png','image/jpeg','image/webp'],8000000,signal,redirects,deadline,'Mozilla/5.0 SellPostlyImage/1.0');
 if(!imageSignature(result.bytes,result.type))throw Error('INVALID_IMAGE_DATA');
 return {bytes:result.bytes,type:result.type};
}
export async function downloadPublicResource(input:string,types:readonly string[],maxBytes:number,signal?:AbortSignal,redirects=0,deadline=Date.now()+16000,userAgent='SellPostlyCatalog/1.0'):Promise<{bytes:Buffer;type:string;url:string}>{
 const url=publicImageUrl(input),host=url.hostname.replace(/^\[|\]$/g,'');if(signal?.aborted||Date.now()>=deadline)throw Error('IMAGE_TIMEOUT');
 let timer:ReturnType<typeof setTimeout>|undefined;
 const addresses=await Promise.race([lookup(host,{all:true}),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('DNS_TIMEOUT')),Math.min(4000,deadline-Date.now()));})]).finally(()=>clearTimeout(timer));
 if(!addresses.length||addresses.some(p=>!isPublicImageAddress(p.address)))throw Error('PRIVATE_IMAGE_ADDRESS');const selected=addresses[0];
 return new Promise((resolve,reject)=>{
  const options:http.RequestOptions&{autoSelectFamily:boolean}={agent:false,autoSelectFamily:false,signal,headers:{'User-Agent':userAgent,'Accept':types.join(','),'Accept-Encoding':'identity'},lookup:(_host,_options,callback)=>callback(null,selected.address,selected.family)};
  const request=(url.protocol==='https:'?https:http).get(url,options,response=>{
   const code=response.statusCode||500;
   const location=response.headers.location;
   if(code>=300&&code<400&&location){response.resume();if(redirects>=3){reject(Error('IMAGE_REDIRECT_LIMIT'));return;}Promise.resolve().then(()=>downloadPublicResource(new URL(location,url).href,types,maxBytes,signal,redirects+1,deadline,userAgent)).then(resolve,reject);return;}
   const type=(response.headers['content-type']||'').split(';')[0].toLowerCase();
   if(code!==200||!types.includes(type)){response.resume();reject(Error('IMAGE_UNAVAILABLE'));return;}
   const chunks:Buffer[]=[];let size=0;response.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>maxBytes){request.destroy(Error('IMAGE_TOO_LARGE'));return;}chunks.push(chunk);});
   response.on('error',reject);response.on('end',()=>{const bytes=Buffer.concat(chunks);resolve({bytes,type,url:url.href});});
  });
  const timeout=setTimeout(()=>request.destroy(Error('IMAGE_TIMEOUT')),Math.max(1,Math.min(8000,deadline-Date.now())));request.on('close',()=>clearTimeout(timeout));request.on('error',reject);
 });
}
