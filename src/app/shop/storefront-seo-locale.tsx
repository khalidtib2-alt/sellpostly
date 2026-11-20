'use client';
import {useEffect} from 'react';
import {useLanguage} from '../language-context';
import {metadataToHead,schemaText} from '../localized-seo';
import {storefrontMetadata,storefrontSchema} from '../../lib/storefront-seo';
import type {Shop} from './shop-data';
export default function StorefrontSeoLocale({shop,slug}:{shop:Shop;slug:string}){const {language}=useLanguage();useEffect(()=>{metadataToHead(storefrontMetadata(slug,shop.shopMode,shop,language));},[shop,slug,language]);return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:schemaText(storefrontSchema(slug,shop.shopMode,shop,language))}}/>;}
