export type SharePlatform='Instagram'|'TikTok'|'WhatsApp'|'Pinterest'|'Facebook'|'X'|'Telegram'|'Copy';
const home:Record<SharePlatform,string>={Instagram:'https://www.instagram.com/',TikTok:'https://www.tiktok.com/',WhatsApp:'https://web.whatsapp.com/',Pinterest:'https://www.pinterest.com/',Facebook:'https://www.facebook.com/',X:'https://x.com/',Telegram:'https://t.me/',Copy:''};
export function socialBrandAction(platform:SharePlatform,url:string,title:string,photo='',text=''){
 const parsed=new URL(url);if(!['http:','https:'].includes(parsed.protocol))throw Error('INVALID_SHARE_URL');
 const copyText=(text?text+'\n\n':'')+url;
 if(platform==='Copy')return {href:'',copy:true,copyText};
 if(platform==='Instagram'||platform==='TikTok'||url.length>700)return {href:home[platform],copy:true,copyText};
 if(platform==='Facebook')return {href:'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url),copy:!!text,copyText};
 if(platform==='X')return {href:'https://twitter.com/intent/tweet?text='+encodeURIComponent((text||title).slice(0,180))+'&url='+encodeURIComponent(url),copy:true,copyText};
 if(platform==='Telegram')return {href:'https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent((text||title).slice(0,300)),copy:!!text,copyText};
 if(platform==='WhatsApp'){const message=(text||title).slice(0,Math.max(0,799-url.length))+'\n'+url;return {href:'https://wa.me/?text='+encodeURIComponent(message.trim()),copy:true,copyText};}
 const query=new URLSearchParams({url,description:(text||title).slice(0,300)});
 try{if(photo.length<1500&&!/^(data|blob):/.test(photo)){const image=new URL(photo,parsed.origin);if(['http:','https:'].includes(image.protocol))query.set('media',image.href);}}catch{}
 return {href:'https://www.pinterest.com/pin/create/button/?'+query,copy:!!text,copyText};
}
