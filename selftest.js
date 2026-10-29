'use strict';
const assert = require('node:assert/strict');
const { positive, hourlyRate, wonPerSecond } = require('./rate.js');
assert.equal(hourlyRate('hourly', { hourly: '10,320' }), 10320);
assert.equal(hourlyRate('session', { sessionPay: '100,000', sessions: '2', sessionHours: '4' }), 12500);
assert.equal(hourlyRate('weekly', { weeklyPay: '1,000,000', weeklyHours: '20' }), 12500);
assert.equal(hourlyRate('session', { sessionPay: 30000, sessions: 2, sessionHours: '1.5' }), 10000);
assert.equal(wonPerSecond('hourly', { hourly: 3600 }), 1);
assert.ok(Math.abs(wonPerSecond('hourly', { hourly: 10320 }) - 2.8666666666666667) < 1e-12);
for (const value of ['', ' ', 0, -1, 'abc', '12abc', Infinity, null, {}, '1e9']) {
  assert.ok(Number.isNaN(positive(value)), `invalid: ${String(value)}`);
}
assert.ok(Number.isNaN(hourlyRate('session', { sessionPay: 10000, sessions: 0, sessionHours: 4 })));
assert.ok(Number.isNaN(hourlyRate('weekly', { weeklyPay: 10000, weeklyHours: -1 })));
assert.ok(Number.isNaN(hourlyRate('unknown', {})));
console.log('PASS: rate conversion, decimals, won/second, and invalid inputs');

const { createRecord, totals, mergeData, normalizeData } = require('./store.js');
const endTime = new Date(2026, 9, 29, 18).getTime();
const record = createRecord({ id:'r1', jobName:'카페', startTime:endTime - 7200000, endTime, workedMs:3600123, hourlyRate:10320 });
assert.equal(record.amount, 10320);
assert.equal(record.workedMs, 3600123); // Paused time is excluded from pay.
assert.equal(createRecord({ ...record, id:'unnamed', jobName:' ' }).jobName, '이름 없음');
assert.equal(createRecord({ ...record, workedMs:999, hourlyRate:3600 }).amount, 0);
assert.throws(() => createRecord({ ...record, workedMs:-1 }));
assert.throws(() => createRecord({ ...record, hourlyRate:Infinity }));
assert.throws(() => createRecord({ ...record, startTime:endTime + 1 }));
const prior = createRecord({ ...record, id:'r2', startTime:new Date(2026, 8, 30, 22).getTime(), endTime:new Date(2026, 8, 30, 23).getTime() });
const nextYear = createRecord({ ...record, id:'r3', startTime:new Date(2027, 9, 29, 16).getTime(), endTime:new Date(2027, 9, 29, 18).getTime() });
assert.deepEqual(totals([record, prior, nextYear], new Date(2026, 9, 1)), { workedMs:record.workedMs, amount:10320 });
assert.deepEqual(totals([record, prior]), { workedMs:record.workedMs * 2, amount:20640 });
assert.deepEqual(totals([], new Date()), { workedMs:0, amount:0 });
const job = { id:'j1', name:'카페', mode:'hourly', inputs:{ hourly:'10,320', sessionHours:'', sessions:'', sessionPay:'', weeklyHours:'', weeklyPay:'' } };
const current = { jobs:[job], records:[record] };
const backup = { version:1, ...current };
assert.deepEqual(mergeData(current, backup), current);
assert.deepEqual(mergeData(current, { ...backup, records:[record, prior] }).records.map(item => item.id), ['r1', 'r2']);
assert.equal(mergeData(current, { ...backup, jobs:[{ ...job, name:'old' }] }).jobs[0].name, '카페');
assert.deepEqual(normalizeData({ jobs:[null, job, job], records:[{}, record, record] }), current);
assert.deepEqual(normalizeData(null), { jobs:[], records:[] });
assert.throws(() => mergeData(current, { version:2, jobs:[], records:[] }));
assert.throws(() => mergeData(current, { version:1, jobs:[], records:[{}] }));
assert.throws(() => mergeData(current, { version:1, jobs:[{ ...job, inputs:{} }], records:[] }));
assert.deepEqual(current, { jobs:[job], records:[record] });
console.log('PASS: records, paused duration, won flooring, monthly/year totals, backup merge, dedupe, corrupt data');
