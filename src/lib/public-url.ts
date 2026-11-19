export function normalizeAppUrl(value:unknown){
 try{const url=new URL(typeof value==='string'?value:'');if(url.protocol!=='https:'||url.username||url.password||/-git-/i.test(url.hostname))throw Error();return url.origin;}catch{return 'https://vercel.app';}
}
export const appUrl=normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);
export function publicLink(path:string){return new URL(path.startsWith('/')&&!path.startsWith('//')?path:'/',appUrl).href;}

