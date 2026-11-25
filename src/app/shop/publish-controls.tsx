'use client';
import {useLanguage} from '../language-context';
export type PublishState='draft'|'saving'|'saved'|'publishing'|'published'|'error';
const labels={draft:'Unpublished changes',saving:'Saving draft...',saved:'Draft saved on this device.',publishing:'Publishing shop...',published:'Live shop is up to date.',error:'Could not save or publish. Your edits are still here.'} as const;
export default function PublishControls({state,busy,onDraft,onPublish}:{state:PublishState;busy:boolean;onDraft:()=>void;onPublish:()=>void}){
 const {t}=useLanguage();
 return <section aria-label={t('Save & Publish')} className="my-6 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
  <button type="button" disabled={busy} onClick={onDraft} className="rounded-xl border border-emerald-700 px-5 py-3 font-bold text-emerald-800 disabled:opacity-50">{t('Save Draft')}</button>
  <button type="button" disabled={busy} onClick={onPublish} className="rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white disabled:opacity-50">{t(state==='publishing'?'Publishing shop...':'Publish Live Shop')}</button>
  <p role="status" aria-live="polite" className="text-sm text-slate-600">{state==='published'?'✓ ':''}{t(labels[state])}</p>
 </section>;
}
