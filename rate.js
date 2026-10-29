(function (root) {
  'use strict';
  function positive(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return NaN;
    const raw = String(value).replace(/,/g, '').trim();
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) return NaN;
    const number = Number(raw);
    return Number.isFinite(number) && number > 0 ? number : NaN;
  }
  function hourlyRate(mode, inputs) {
    let rate;
    if (mode === 'hourly') rate = positive(inputs.hourly);
    else if (mode === 'session') rate = positive(inputs.sessionPay) / positive(inputs.sessions) / positive(inputs.sessionHours);
    else if (mode === 'weekly') rate = positive(inputs.weeklyPay) / positive(inputs.weeklyHours) / 4;
    return Number.isFinite(rate) && rate > 0 ? rate : NaN;
  }
  function wonPerSecond(mode, inputs) {
    const rate = hourlyRate(mode, inputs) / 3600;
    return Number.isFinite(rate) && rate > 0 ? rate : NaN;
  }
  const api = { positive, hourlyRate, wonPerSecond };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PayRate = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
