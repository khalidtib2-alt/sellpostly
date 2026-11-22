import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GET as overview} from '../src/app/api/admin/overview/route';
import {POST as verify} from '../src/app/api/pro/verify/route';
import {POST as initialize} from '../src/app/api/db/init/route';
test('current setup endpoints fail closed before database access when credentials are absent',async()=>{
 const keys=['ADMIN_SECRET_KEY','DATABASE_URL','PRO_MASTER_KEYS','GUMROAD_PRODUCT_ID'] as const;
 const old=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 try{for(const key of keys)delete process.env[key];
  const admin=await overview(new Request('https://example.com/api/admin/overview'));
  assert.equal(admin.status,401);assert.equal((await admin.json()).error,'ADMIN_UNAUTHORIZED');
  const license=await verify(new Request('https://example.com/api/pro/verify',{method:'POST'}));
  assert.equal(license.status,401);assert.equal((await license.json()).error,'AUTH_REQUIRED');
  process.env.ADMIN_SECRET_KEY='SYNTHETIC_SETUP_ONLY';
  const init=await initialize(new Request('https://example.com/api/db/init',{method:'POST',headers:{'x-admin-secret':'SYNTHETIC_SETUP_ONLY'}}));
  assert.equal(init.status,503);assert.equal((await init.json()).error,'DATABASE_NOT_CONFIGURED');
 }finally{for(const key of keys){if(old[key]===undefined)delete process.env[key];else process.env[key]=old[key];}}
});
