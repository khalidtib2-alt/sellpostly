export function socialShareLinks(url:string,title:string){
 const link=new URL(url);
 if(!['https:','http:'].includes(link.protocol))throw Error('INVALID_SHARE_URL');
 const text=title+'\n'+link.href,encoded=encodeURIComponent(link.href);
 return {WhatsApp:'https://wa.me/?text='+encodeURIComponent(text),Facebook:'https://www.facebook.com/sharer/sharer.php?u='+encoded,X:'https://twitter.com/intent/tweet?text='+encodeURIComponent(title)+'&url='+encoded,Telegram:'https://t.me/share/url?url='+encoded+'&text='+encodeURIComponent(title),LinkedIn:'https://www.linkedin.com/sharing/share-offsite/?url='+encoded,Email:'mailto:?subject='+encodeURIComponent(title)+'&body='+encodeURIComponent(text)};
}
