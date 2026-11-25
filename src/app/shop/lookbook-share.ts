export type LookPlatform='Instagram'|'TikTok'|'WhatsApp'|'Pinterest'|'Facebook'|'X'|'Telegram'|'Copy';
const home={Instagram:'https://www.instagram.com/',TikTok:'https://www.tiktok.com/',WhatsApp:'https://web.whatsapp.com/',Pinterest:'https://www.pinterest.com/',Facebook:'https://www.facebook.com/',X:'https://x.com/',Telegram:'https://t.me/',Copy:''};
/** Instagram/TikTok require pasting; large legacy snapshot links stay out of provider query strings. */
export function lookShareAction(platform:LookPlatform,url:string,title:string,photo:string){
 const parsed=new URL(url);if(!['http:','https:'].includes(parsed.protocol))throw Error('INVALID_SHARE_URL');
 if(platform==='Copy')return {href:'',copy:true};
 if(platform==='Instagram'||platform==='TikTok'||url.length>700)return {href:home[platform],copy:true};
 if(platform==='Facebook')return {href:'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url),copy:false};
 if(platform==='X')return {href:'https://twitter.com/intent/tweet?text='+encodeURIComponent(title.slice(0,120))+'&url='+encodeURIComponent(url),copy:false};
 if(platform==='Telegram')return {href:'https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(title.slice(0,120)),copy:false};
 if(platform==='WhatsApp'){const text=title.slice(0,100)+'\n'+url;return {href:'https://wa.me/?text='+encodeURIComponent(text.length<=800?text:url),copy:false};}
 const query=new URLSearchParams({url,description:title.slice(0,150)});
 try{if(photo.length<1500&&!/^(data|blob):/.test(photo)){const image=new URL(photo,parsed.origin);if(['http:','https:'].includes(image.protocol))query.set('media',image.href);}}catch{}
 let href='https://www.pinterest.com/pin/create/button/?'+query;
 if(href.length>3500){query.delete('media');href='https://www.pinterest.com/pin/create/button/?'+query;}
 return href.length>3500?{href:home.Pinterest,copy:true}:{href,copy:false};
}
