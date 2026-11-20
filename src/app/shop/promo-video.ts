export type PromoVideo={url:string;embed:string;kind:'direct'|'embed';provider:string};
/** Only explicit seller-supplied public HTTPS links; never scrape or proxy videos. */
export function promoVideo(value:unknown):PromoVideo|null{
 try{if(typeof value!=='string'||value.length>2048)return null;const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return null;const host=u.hostname.toLowerCase().replace(/\.$/,'');if(!host.includes('.')||host==='localhost'||host.endsWith('.local')||host.endsWith('.localhost')||/^\d+\./.test(host)||host.includes(':')||/(^|\.)(media-amazon|images-amazon|ssl-images-amazon|amazonvideo)\.com$/.test(host))return null;
  const is=(h:string)=>host===h||host==='www.'+h;
  if(is('youtube.com')||is('m.youtube.com')||is('youtu.be')){const id=is('youtu.be')?u.pathname.slice(1).split('/')[0]:u.pathname.match(/^\/(?:shorts|embed)\/([\w-]{11})(?:\/|$)/)?.[1]||u.searchParams.get('v');if(!id||!/^[\w-]{11}$/.test(id))return null;return {url:'https://www.youtube.com/watch?v='+id,embed:'https://www.youtube-nocookie.com/embed/'+id,kind:'embed',provider:'YouTube'};}
  if(is('vimeo.com')||is('player.vimeo.com')){const id=u.pathname.match(/^\/(?:video\/)?(\d{5,12})(?:\/|$)/)?.[1];if(!id)return null;return {url:'https://vimeo.com/'+id,embed:'https://player.vimeo.com/video/'+id,kind:'embed',provider:'Vimeo'};}
  if(is('tiktok.com')){const id=u.pathname.match(/^\/@[^/]+\/video\/(\d{10,25})(?:\/|$)/)?.[1];if(!id)return null;return {url:u.origin+u.pathname,embed:'https://www.tiktok.com/player/v1/'+id,kind:'embed',provider:'TikTok'};}
  if(is('instagram.com')){const id=u.pathname.match(/^\/(?:reel|reels|p)\/([\w-]{4,80})(?:\/|$)/)?.[1];if(!id)return null;return {url:'https://www.instagram.com/reel/'+id+'/',embed:'https://www.instagram.com/reel/'+id+'/embed/',kind:'embed',provider:'Instagram'};}
  if(/\.mp4$/i.test(u.pathname))return {url:u.href,embed:u.href,kind:'direct',provider:'MP4'};
 }catch{}return null;
}
