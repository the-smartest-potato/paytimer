(function (root) {
  'use strict';
  const inputIds = ['hourly', 'sessionHours', 'sessions', 'sessionPay', 'weeklyHours', 'weeklyPay'];
  const modes = ['hourly', 'session', 'weekly'];
  const finite = value => Number.isFinite(value) && value >= 0;
  const timestamp = value => finite(value) && value <= 8640000000000000;
  const identity = value => typeof value === 'string' && value.length > 0 && value.length <= 200;
  function validJob(job) {
    return job && identity(job.id) && typeof job.name === 'string' && job.name.trim().length > 0 && job.name.length <= 60 &&
      modes.includes(job.mode) && job.inputs && inputIds.every(id => typeof job.inputs[id] === 'string' && job.inputs[id].length <= 100);
  }
  function validRecord(record) {
    return record && identity(record.id) && typeof record.jobName === 'string' && record.jobName.length <= 60 &&
      (record.jobId == null || identity(record.jobId)) &&
      timestamp(record.startTime) && timestamp(record.endTime) && record.endTime >= record.startTime &&
      finite(record.workedMs) && record.workedMs > 0 && finite(record.hourlyRate) && record.hourlyRate > 0 &&
      Number.isSafeInteger(record.amount) && record.amount >= 0;
  }
  function createRecord({ id, jobId, jobName, startTime, endTime, workedMs, hourlyRate }) {
    const record = { id, jobName:jobName?.trim() || '이름 없음', startTime, endTime, workedMs, hourlyRate,
      amount:Math.floor(workedMs / 1000 * (hourlyRate / 3600)) };
    if (jobId != null) record.jobId = jobId;
    if (!validRecord(record)) throw new Error('유효하지 않은 근무 기록입니다.');
    return record;
  }
  function cleanName(name) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 60) throw new Error('이름을 1~60자로 입력해 주세요.');
    return name.trim();
  }
  function renameJob(data, id, name) {
    const nextName = cleanName(name);
    const job = data.jobs.find(item => item.id === id);
    if (!job) throw new Error('알바를 찾을 수 없어요.');
    return { ...data,
      jobs:data.jobs.map(item => item.id === id ? { ...item, name:nextName } : item),
      records:data.records.map(record => (record.jobId != null ? record.jobId === id : record.jobName === job.name)
        ? { ...record, jobId:id, jobName:nextName } : record)
    };
  }
  function renameRecord(data, id, name) {
    const nextName = cleanName(name);
    if (!data.records.some(record => record.id === id)) throw new Error('근무 기록을 찾을 수 없어요.');
    return { ...data, records:data.records.map(record => record.id === id ? { ...record, jobName:nextName } : record) };
  }
  function dedupe(items) { return [...new Map(items.map(item => [item.id, item])).values()]; }
  function normalizeData(data) {
    return {
      jobs:dedupe((Array.isArray(data?.jobs) ? data.jobs : []).filter(validJob)),
      records:dedupe((Array.isArray(data?.records) ? data.records : []).filter(validRecord))
    };
  }
  function mergeData(current, incoming) {
    if (!incoming || incoming.version !== 1 || !Array.isArray(incoming.jobs) || !Array.isArray(incoming.records) ||
        !incoming.jobs.every(validJob) || !incoming.records.every(validRecord)) throw new Error('지원하지 않거나 손상된 백업 파일입니다.');
    const clean = normalizeData(current);
    // Existing IDs win so re-importing a backup never overwrites local changes.
    return { jobs:dedupe([...incoming.jobs, ...clean.jobs]), records:dedupe([...incoming.records, ...clean.records]) };
  }
  function totals(records, month = null) {
    return records.filter(validRecord).reduce((sum, record) => {
      const date = new Date(record.endTime);
      if (month && (date.getFullYear() !== month.getFullYear() || date.getMonth() !== month.getMonth())) return sum;
      sum.workedMs += record.workedMs;
      sum.amount += record.amount;
      return sum;
    }, { workedMs:0, amount:0 });
  }
  const api = { createRecord, renameJob, renameRecord, totals, mergeData, normalizeData };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PayStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
