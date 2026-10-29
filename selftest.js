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
