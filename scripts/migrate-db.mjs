import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {neon} from '@neondatabase/serverless';
import {migrateSchema} from '../src/db/migrate-schema.mjs';

try {
  for (const file of ['.env.local','.env']) {
    if (process.env.DATABASE_URL) break;
    try { process.loadEnvFile(fileURLToPath(new URL('../'+file,import.meta.url))); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (!process.env.DATABASE_URL) throw Error('MISSING_DATABASE_URL');
  const schema = await readFile(new URL('../src/db/schema.sql',import.meta.url),'utf8');
  const result = await migrateSchema(neon(process.env.DATABASE_URL),schema);
  console.log(result.applied ? `Schema migration applied (${result.statements} statements).` : 'Database schema is up to date.');
} catch (error) {
  const code = typeof error.code === 'string' && /^[A-Z0-9_]{1,32}$/.test(error.code) ? ' ('+error.code+')' : '';
  console.error(error.message === 'MISSING_DATABASE_URL'
    ? 'Configure DATABASE_URL in the environment or .env.local.'
    : 'Database migration failed'+code+'. Check connectivity, migration permissions, and schema compatibility.');
  process.exitCode = 1;
}
