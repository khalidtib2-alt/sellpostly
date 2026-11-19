import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {resolveDatabaseUrl,safeDatabaseError} from '../database-config.mjs';
import {neon} from '@neondatabase/serverless';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
try{
 if(!resolveDatabaseUrl()){
  try{process.loadEnvFile(resolve(root,'.env.local'));}catch(error){if(error.code!=='ENOENT')throw error;}
 }
 if(!resolveDatabaseUrl())throw Error('MISSING_DATABASE_URL');
 const sql=neon(resolveDatabaseUrl());
 const schema=await readFile(resolve(root,'src/db/schema.sql'),'utf8');
 const blocks=schema.split(/^[ \t]*-- statement-breakpoint[ \t]*\r?$/m).map(value=>value.trim()).filter(Boolean);
 await sql.transaction(blocks.map(block=>sql.query(block)),{isolationLevel:'Serializable'});
 const expected=['orders','payout_requests','pro_upgrade_requests','shops','subscriptions','transactional_email_deliveries'];
 const rows=await sql.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name");
 const names=rows.map(row=>row.table_name);
 if(expected.some(name=>!names.includes(name)))throw Error('MISSING_TABLES');
 console.log('Database initialized successfully. Tables:');
 for(const name of names)console.log(' - '+name);
}catch(error){
 const diagnostic=safeDatabaseError(error);console.error('Database initialization failed:',diagnostic.code,diagnostic.message);
 console.error(error.message==='MISSING_DATABASE_URL'?'Database initialization failed: configure DATABASE_URL, POSTGRES_URL, STORAGE_URL or STORAGE_POSTGRES_URL in process.env or .env.local.':'Database initialization failed. Check credentials, network access and schema compatibility. No credentials are printed.');
 process.exitCode=1;
}

