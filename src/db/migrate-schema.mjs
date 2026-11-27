import {createHash} from 'node:crypto';

export function splitSql(sql) {
  const statements = [];
  let start = 0, state = '', depth = 0, dollar = '', escapeString = false, hasCode = false;
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i], next = sql[i+1];
    if (state === 'line') { if (char === '\n' || char === '\r') state = ''; continue; }
    if (state === 'block') {
      if (char === '/' && next === '*') { depth++; i++; }
      else if (char === '*' && next === '/') { if (!--depth) state = ''; i++; }
      continue;
    }
    if (state === 'dollar') {
      if (char === '$' && sql.startsWith(dollar,i)) { i += dollar.length-1; state = ''; }
      continue;
    }
    if (state === "'" || state === '"') {
      if (char === '\\' && escapeString) i++;
      else if (char === state) { if (next === state) i++; else state = ''; }
      continue;
    }
    if (char === '-' && next === '-') { state = 'line'; i++; continue; }
    if (char === '/' && next === '*') { state = 'block'; depth = 1; i++; continue; }
    if (char === ';') {
      if (hasCode) statements.push(sql.slice(start,i+1).trim());
      start = i+1; hasCode = false; continue;
    }
    if (/\s/.test(char)) continue;
    hasCode = true;
    if (char === "'" || char === '"') {
      state = char;
      escapeString = char === "'" && /[eE]/.test(sql[i-1] || '') && !/[\p{L}\p{N}_$]/u.test(sql[i-2] || '');
    } else if (char === '$' && !/[\p{L}\p{N}_$]/u.test(sql[i-1] || '')) {
      const tag = sql.slice(i).match(/^\$(?:[\p{L}_][\p{L}\p{N}_]*)?\$/u)?.[0];
      if (tag) { dollar = tag; state = 'dollar'; i += tag.length-1; }
    }
  }
  if (state && state !== 'line') throw Error('UNTERMINATED_SCHEMA_SQL');
  if (hasCode) statements.push(sql.slice(start).trim());
  return statements;
}

export async function migrateSchema(sql, schema) {
  const digest = createHash('sha256').update(schema.replace(/\r\n/g,'\n')).digest('hex');
  const [table] = await sql.query("SELECT to_regclass('public.sellpostly_schema_migrations') IS NOT NULL AS present");
  if (table.present) {
    const existing = await sql.query('SELECT 1 FROM public.sellpostly_schema_migrations WHERE digest=$1',[digest]);
    if (existing.length) return {applied:false, statements:0};
  }
  const statements = splitSql(schema);
  await sql.transaction([
    sql.query("SELECT pg_advisory_xact_lock(74618257)"),
    sql.query('CREATE TABLE IF NOT EXISTS public.sellpostly_schema_migrations (digest text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())'),
    ...statements.map(statement => sql.query(statement)),
    sql.query('INSERT INTO public.sellpostly_schema_migrations(digest) VALUES($1) ON CONFLICT DO NOTHING',[digest]),
  ]);
  return {applied:true, statements:statements.length};
}
