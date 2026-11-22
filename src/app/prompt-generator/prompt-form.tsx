'use client';
import {useLanguage} from '../language-context';
import {ContentPage} from '../site-shell';
import GeminiWriterPanel from '../generation/gemini-writer-panel';
export default function PromptForm(){const {t}=useLanguage();return <ContentPage title={t('Content Creator')} intro={t('Keywords to prompt to finished content. Write, edit and export in one place.')}><GeminiWriterPanel/></ContentPage>;}
