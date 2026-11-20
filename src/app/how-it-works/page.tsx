import {pageSeo} from '../../lib/marketing-seo';
import LocalizedSeo from '../localized-seo';
import type {Metadata} from 'next';
import UserGuide from '../user-guide';
export const metadata:Metadata=pageSeo('guide');
export default function Page(){return <main><LocalizedSeo kind="guide"/><UserGuide standalone/></main>;}
