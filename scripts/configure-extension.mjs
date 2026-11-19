import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// Match Next's .env precedence without exposing any server-only settings.
const {loadEnvConfig}=createRequire(import.meta.url)('@next/env');
loadEnvConfig(root);
let base='https://sellpostly.vercel.app';
try{const url=new URL(process.env.NEXT_PUBLIC_APP_URL||base);if(url.protocol==='https:'&&!url.username&&!url.password&&!/-git-/i.test(url.hostname)&&url.hostname!=='vercel.app'&&!/(^|\.)vercel\.com$/i.test(url.hostname))base=url.origin;}catch{}
fs.writeFileSync(path.join(root,'chrome-extension/app-config.js'),'"use strict";\nglobalThis.SELLPOSTLY_APP_URL = '+JSON.stringify(base)+';\n');
const manifestPath=path.join(root,'chrome-extension/manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));manifest.homepage_url=base;
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
const htmlPath=path.join(root,'chrome-extension/popup.html');
let html=fs.readFileSync(htmlPath,'utf8');
html=html.replace(/href="https:\/\/[^"]+"(?= target="_blank")/g,match=>{const old=new URL(match.slice(6,-1));return 'href="'+base+(old.pathname==='/'?'':old.pathname)+'"';});
fs.writeFileSync(htmlPath,html);
console.log('Extension public URL: '+base);

