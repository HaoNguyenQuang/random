import { ALL_CHAMPIONS, POSITIONS } from '../data/champions';

export async function fetchTierLQMeta() {
  const url = 'https://tierlq.github.io/assets/data.js';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  let code = '';
  try {
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    code = await resp.text();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }

  const runner = new Function(code + '\nreturn { HEROES, PATCH, PREV_DATE, SRC };');
  const exported = runner();
  const heroesList = exported.HEROES || [];
  const patchInfo = exported.PATCH || '';
  const prevDate = exported.PREV_DATE || '';

  if (!heroesList.length) {
    throw new Error('Dữ liệu tướng từ TierLQ rỗng');
  }

  const laneKeyMap = {
    top: 'TOP',
    jg: 'JUNGLE',
    mid: 'MID',
    ad: 'AD',
    sp: 'SUPPORT'
  };

  const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/['’\s\-_.]/g, '').toLowerCase();
  const champMap = new Map();
  ALL_CHAMPIONS.forEach(c => {
    champMap.set(norm(c.name), c.name);
  });

  const newLaneMeta = {
    TOP: { S: [], A: [], B: [], C: [], D: [], removed: [] },
    JUNGLE: { S: [], A: [], B: [], C: [], D: [], removed: [] },
    MID: { S: [], A: [], B: [], C: [], D: [], removed: [] },
    SUPPORT: { S: [], A: [], B: [], C: [], D: [], removed: [] },
    AD: { S: [], A: [], B: [], C: [], D: [], removed: [] }
  };

  heroesList.forEach(h => {
    const targetLane = laneKeyMap[h.lane];
    if (!targetLane || !newLaneMeta[targetLane]) return;

    const exactName = champMap.get(norm(h.name)) || h.name;
    if (!ALL_CHAMPIONS.some(c => c.name === exactName)) return;

    const t = h.tier || 'D';
    if (['S', 'A', 'B', 'C', 'D'].includes(t)) {
      if (!newLaneMeta[targetLane][t].includes(exactName)) {
        newLaneMeta[targetLane][t].push(exactName);
      }
    }
  });

  POSITIONS.forEach(pos => {
    const activeInLane = new Set([
      ...newLaneMeta[pos].S,
      ...newLaneMeta[pos].A,
      ...newLaneMeta[pos].B,
      ...newLaneMeta[pos].C,
      ...newLaneMeta[pos].D
    ]);
    newLaneMeta[pos].removed = ALL_CHAMPIONS
      .filter(c => !activeInLane.has(c.name))
      .map(c => c.name);
  });

  newLaneMeta._buildId = Date.now();
  newLaneMeta._tierlqSync = {
    syncedAt: new Date().toLocaleString('vi-VN'),
    patch: patchInfo,
    prevDate: prevDate
  };

  return newLaneMeta;
}

export async function fetchTierLQData() {
  try {
    const laneMeta = await fetchTierLQMeta();
    return {
      success: true,
      laneMeta,
      patch: laneMeta._tierlqSync?.patch || 'S4 2026'
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

