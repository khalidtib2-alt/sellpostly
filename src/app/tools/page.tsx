import {pageSeo} from '../../lib/marketing-seo';
import LocalizedSeo from '../localized-seo';
import type {Metadata} from 'next';
import MediaTools from './media-tools';
export const metadata:Metadata=pageSeo('tools');
export default function Page(){return <><LocalizedSeo kind="tools"/><MediaTools/></>;}
