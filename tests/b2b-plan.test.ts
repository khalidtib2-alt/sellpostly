import {test} from 'node:test';
import assert from 'node:assert/strict';
import {b2bPlanPrice} from '../src/lib/b2b-plan';
test('B2B monthly pricing defaults safely and accepts configured prices',()=>{
 for(const invalid of [undefined,'','0','-1','NaN','49.001','1000000'])assert.equal(b2bPlanPrice(invalid),'49');
 assert.equal(b2bPlanPrice(' 59.95 '),'59.95');
});
