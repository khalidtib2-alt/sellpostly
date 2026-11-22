import type {WritingInput} from './creator-writing';
export const tones=['professional','casual','persuasive','seo','empathetic'] as const;
export const lengths=['short','medium','long'] as const;
export type CreatorWorkspace={topic:string;contentType:WritingInput['contentType'];language:WritingInput['language'];tone:typeof tones[number];length:typeof lengths[number];humanitarian:boolean;humanitarianNote:string;prompt:string;content:string};
export type CreatorDraft=CreatorWorkspace&{id:string;timestamp:string};
export const draftStorageKey='sellpostly-creator-drafts-v1';
export const freshWorkspace=(language:CreatorWorkspace['language']='en'):CreatorWorkspace=>({topic:'',contentType:'article',language,tone:'professional',length:'medium',humanitarian:false,humanitarianNote:'',prompt:'',content:''});
export function normalizeWorkspace(raw:unknown):CreatorWorkspace{
 const v=raw&&typeof raw==='object'?raw as Record<string,unknown>:{};
 const text=(key:string,max:number)=>typeof v[key]==='string'?(v[key] as string).slice(0,max):'';
 return {topic:text('topic',300),contentType:['article','social','video','newsletter'].includes(String(v.contentType))?v.contentType as CreatorWorkspace['contentType']:'article',language:v.language==='fr'||v.language==='ar'?v.language:'en',tone:tones.includes(v.tone as any)?v.tone as CreatorWorkspace['tone']:'professional',length:lengths.includes(v.length as any)?v.length as CreatorWorkspace['length']:'medium',humanitarian:v.humanitarian===true,humanitarianNote:text('humanitarianNote',300),prompt:text('prompt',6000),content:text('content',100000)};
}
export function normalizeDrafts(raw:unknown):CreatorDraft[]{
 if(!Array.isArray(raw))return [];
 const seen=new Set<string>();return raw.filter(v=>v&&typeof v==='object'&&typeof v.id==='string'&&v.id.length<=100&&v.id&&typeof v.timestamp==='string'&&Number.isFinite(Date.parse(v.timestamp))).sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp)).flatMap(v=>{if(seen.has(v.id))return [];seen.add(v.id);return [{...normalizeWorkspace(v),id:v.id,timestamp:new Date(v.timestamp).toISOString()}];}).slice(0,20);
}
export function readCreatorDrafts(storage:Pick<Storage,'getItem'>){try{return {drafts:normalizeDrafts(JSON.parse(storage.getItem(draftStorageKey)||'[]')),ok:true};}catch{return {drafts:[] as CreatorDraft[],ok:false};}}
export function saveCreatorDrafts(storage:Pick<Storage,'setItem'>,drafts:CreatorDraft[]){try{storage.setItem(draftStorageKey,JSON.stringify(normalizeDrafts(drafts)));return true;}catch{return false;}}
export function upsertCreatorDraft(drafts:CreatorDraft[],draft:CreatorDraft){return normalizeDrafts([draft,...drafts.filter(d=>d.id!==draft.id)]);}
export const deleteCreatorDraft=(drafts:CreatorDraft[],id:string)=>drafts.filter(d=>d.id!==id);
export function creatorRequest(workspace:CreatorWorkspace,action:'prompt'|'write'):WritingInput{
 return {action,topic:workspace.topic,prompt:action==='write'?workspace.prompt:'',contentType:workspace.contentType,language:workspace.language,tone:workspace.tone,length:workspace.length,humanitarian:workspace.humanitarian,humanitarianNote:workspace.humanitarian?workspace.humanitarianNote:''};
}
/** Plain-text export preserves readable text, link destinations and code content. */
export function markdownToPlainText(markdown:string){
 const code:string[]=[];let text=markdown.replace(/\r\n?/g,'\n');
 text=text.replace(/^\s*(`{3,}|~{3,})[^\n]*\n([\s\S]*?)^\s*\1\s*$/gm,(_m,_f,value)=>{code.push(value.replace(/\n$/,''));return '\uE000'+(code.length-1)+'\uE001';});
 text=text.replace(/(`+)([^\n]*?)\1/g,(_m,_f,value)=>{code.push(value);return '\uE000'+(code.length-1)+'\uE001';});
 text=text.replace(/^\s*(`{3,}|~{3,})[^\n]*\n/gm,'').replace(/^\s*(`{3,}|~{3,})\s*$/gm,'');
 text=text.replace(/!\[([^\]]*)\]\([^\n]*?\)/g,'$1').replace(/\[([^\]]+)\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g,'$1 ($2)');
 const references=new Map<string,string>();text=text.replace(/^\s*\[([^\]]+)\]:\s*(\S+).*$/gm,(_m,id,url)=>{references.set(id.toLowerCase(),url);return '';});
 text=text.replace(/\[([^\]]+)\]\[([^\]]*)\]/g,(_m,label,id)=>{const url=references.get((id||label).toLowerCase());return url?`${label} (${url})`:label;});
 text=text.replace(/^ {0,3}#{1,6}\s+(.+?)(?:\s+#+)?$/gm,'$1').replace(/^\s*(?:={3,}|-{3,})\s*$/gm,'').replace(/^\s*>\s?/gm,'').replace(/^\s*[-+*]\s+(?:\[[ xX]\]\s*)?/gm,'• ');
 text=text.replace(/\*\*([\s\S]+?)\*\*|__([\s\S]+?)__/g,(_m,a,b)=>a||b).replace(/~~([^\n]+?)~~/g,'$1').replace(/(?<!\w)\*([^*\n]+)\*(?!\w)/g,'$1').replace(/(?<!\w)_([^_\n]+)_(?!\w)/g,'$1').replace(/`+([^`\n]+)`+/g,'$1');
 text=text.replace(/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/gm,'').replace(/^\s*\|(.+)\|\s*$/gm,(_m,row)=>row.split('|').map((v:string)=>v.trim()).join('\t'));
 text=text.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/?(?:p|div|h[1-6]|li|ul|ol|blockquote|pre|code|strong|em|b|i|span)(?:\s[^>]*)?>/gi,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\\([\\`*_{}\[\]()#+.!>~-])/g,'$1');
 return text.replace(/[ \t]+$/gm,'').replace(/\n{3,}/g,'\n\n').replace(/\uE000(\d+)\uE001/g,(_m,index)=>code[Number(index)]||'').trim();
}
export function creatorExport(workspace:CreatorWorkspace,format:'md'|'txt'){
 const name=workspace.topic.normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,'-').slice(0,70).replace(/^-|-$/g,'')||'content';
 return {filename:`${name}-${workspace.language}.${format}`,mime:format==='md'?'text/markdown;charset=utf-8':'text/plain;charset=utf-8',text:format==='md'?workspace.content:markdownToPlainText(workspace.content)};
}
