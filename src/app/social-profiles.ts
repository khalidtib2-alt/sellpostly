export const socialPlatforms=['TikTok','Instagram','Facebook','YouTube','Pinterest','X'] as const;
export type Platform=typeof socialPlatforms[number];
const hosts:Record<Platform,string[]>={TikTok:['tiktok.com'],Instagram:['instagram.com'],Facebook:['facebook.com'],YouTube:['youtube.com','youtu.be'],Pinterest:['pinterest.com'],X:['x.com','twitter.com']};
export function socialProfiles(profiles:Partial<Record<Platform,string>>,site:string){return socialPlatforms.map(name=>{
 let profile='';try{const u=new URL(profiles[name]||'');if(u.protocol==='https:'&&!u.username&&!u.password&&hosts[name].some(host=>u.hostname===host||u.hostname.endsWith('.'+host)))profile=u.href;}catch{}
 const fallback=name==='Facebook'?'https://www.facebook.com/sharer/sharer.php?'+new URLSearchParams({u:site}):name==='X'?'https://twitter.com/intent/tweet?'+new URLSearchParams({url:site,text:'SellPostly'}):name==='Pinterest'?'https://www.pinterest.com/pin/create/button/?'+new URLSearchParams({url:site,description:'SellPostly'}):'/how-it-works#share-anywhere';
 return {name,href:profile||fallback,kind:profile?'profile':fallback.startsWith('/')?'guide':'share'};
});}
