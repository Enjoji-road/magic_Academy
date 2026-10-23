/* Anonymous, idempotent academy statistics. The game never waits for this module. */
(() => {
  'use strict';
  if (window.AcademyStatistics) return;

  const CONFIG = window.AcademyStatisticsConfig || {};
  const BROWSER_KEY = 'magic-academy-statistics-browser-v1';
  const ACK_KEY = 'magic-academy-statistics-ack-v1';
  const KEYS = Object.freeze({
    fire: 'magic-academy-fire-experiment-v4',
    water: 'magic-academy-water-insight-v1',
    wind: 'magic-academy-wind-ribbon-v1',
    earth: 'magic-academy-earth-v2',
    graduation: 'magic-academy-graduation-v1'
  });
  const SUBJECTS = Object.freeze([
    ['fire', '炎魔法学'],
    ['water', '水魔法学'],
    ['wind', '風魔法学'],
    ['earth', '土魔法学'],
    ['graduation', '最終卒業試験']
  ]);
  let browserId = null, inflight = null, returnFocus = null;

  function storedJson(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    const hex = [...bytes].map(v => v.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  function identity() {
    if (browserId) return browserId;
    try {
      const old = localStorage.getItem(BROWSER_KEY);
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(old || '')) return browserId = old;
      browserId = uuid(); localStorage.setItem(BROWSER_KEY, browserId); return browserId;
    } catch { return null; }
  }
  function knownEvents() {
    const events = new Set(['enrollment']);
    const pageRoom = document.body.dataset.academyRoom;
    if (['fire', 'water', 'wind', 'earth'].includes(pageRoom)) events.add(pageRoom + '_attempt');
    for (const room of ['fire', 'water', 'wind', 'earth']) if (storedJson(KEYS[room])?.passed === true) events.add(room + '_pass');
    const graduation = storedJson(KEYS.graduation);
    const finalPage = location.pathname.endsWith('/graduation.html') && new URLSearchParams(location.search).get('room') === 'hall';
    if (finalPage && window.AcademyGraduationStore?.admitted()) events.add('graduation_attempt');
    if (graduation?.graduated === true) events.add('graduation_pass');
    return [...events];
  }
  async function request(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error('Statistics unavailable');
      return await response.json();
    } finally { clearTimeout(timer); }
  }
  function sync() {
    const id = identity();
    if (!id || !CONFIG.endpoint || inflight || !navigator.onLine) return Promise.resolve(false);
    const events = knownEvents().sort(), signature = events.join('|');
    try { if (localStorage.getItem(ACK_KEY) === signature) return Promise.resolve(true); } catch { return Promise.resolve(false); }
    inflight = request(CONFIG.endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'record', browser_id: id, events })
    }).then(data => {
      if (data?.ok !== true) return false;
      try { localStorage.setItem(ACK_KEY, signature); } catch { /* progress remains unaffected */ }
      return true;
    }).catch(() => false).finally(() => { inflight = null; });
    return inflight;
  }

  const dialog = document.createElement('dialog');
  dialog.id = 'academyStatistics'; dialog.className = 'academy-statistics';
  dialog.setAttribute('aria-labelledby', 'academyStatisticsTitle');
  dialog.innerHTML = '<div class="statistics-heading"><div><span>ARCANE ACADEMY · LEDGER</span><h2 id="academyStatisticsTitle">学院運営記録</h2></div><button type="button" id="academyStatisticsClose" aria-label="学院運営記録を閉じる">閉じる</button></div><p class="statistics-intro">統計の記録を読み込んでいます。</p><div id="academyStatisticsBody" aria-live="polite" aria-busy="true"></div><p class="statistics-foot">この記録は統計開始後の匿名ブラウザ単位の推計です。個人を特定する情報、解答、自由メモは収集していません。</p>';
  document.body.append(dialog);
  const body = dialog.querySelector('#academyStatisticsBody');
  function n(value) { return Number.isSafeInteger(value) && value >= 0 ? value.toLocaleString('ja-JP') : '—'; }
  function rate(passed, attempted) { return attempted > 0 ? (passed / attempted * 100).toFixed(1) + '%' : '0.0%'; }
  function sigil(id) {
    if (id !== 'graduation' && window.AcademyElementIcons?.glyph) return window.AcademyElementIcons.glyph(id);
    if (id === 'graduation') return '<svg class="academy-element-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m12 2.8 2.5 6.4 6.7 2.8-6.7 2.8-2.5 6.4-2.5-6.4L2.8 12l6.7-2.8Z"/></svg>';
    return { fire: '炎', water: '水', wind: '風', earth: '土' }[id] || '·';
  }
  function show(data) {
    const entrants = data?.entrants;
    if (!Number.isSafeInteger(entrants) || entrants < 0) throw new Error('Invalid statistics');
    const cards = SUBJECTS.map(([id, label]) => {
      const item = data[id] || {}, attempted = item.attempted, passed = item.passed;
      if (!Number.isSafeInteger(attempted) || attempted < 0 || !Number.isSafeInteger(passed) || passed < 0 || passed > attempted) throw new Error('Invalid statistics');
      return `<article class="statistics-card statistics-${id}"><span class="statistics-sigil" aria-hidden="true">${sigil(id)}</span><div><h3>${label}</h3><p><strong>${n(attempted)}</strong>人が挑戦　<strong>${n(passed)}</strong>人が${id === 'graduation' ? '卒業' : '合格'}</p></div><output><small>合格率</small>${rate(passed, attempted)}</output></article>`;
    }).join('');
    const graduates = data.graduation?.passed || 0;
    body.innerHTML = `<section class="statistics-enrollment"><span>入学者数</span><strong>${n(entrants)}<small>人</small></strong></section><div class="statistics-grid">${cards}</div><section class="statistics-overall"><span>入学者全体に対する総合卒業率</span><strong>${rate(graduates, entrants)}</strong></section>`;
    body.setAttribute('aria-busy', 'false');
    dialog.querySelector('.statistics-intro').textContent = data.started_at ? '記録開始：' + new Intl.DateTimeFormat('ja-JP', { dateStyle: 'long', timeZone: 'Asia/Tokyo' }).format(new Date(data.started_at)) : '統計開始後の記録は、まだありません。';
  }
  function unavailable() {
    body.setAttribute('aria-busy', 'false');
    body.innerHTML = '<div class="statistics-unavailable" role="status"><p>現在、学院運営記録を取得できません。</p><button type="button" id="academyStatisticsRetry">もう一度読み込む</button></div>';
    body.querySelector('button').addEventListener('click', load);
    dialog.querySelector('.statistics-intro').textContent = '通信状態を確認して、もう一度お試しください。';
  }
  async function load() {
    body.setAttribute('aria-busy', 'true');
    body.innerHTML = '<p class="statistics-loading">記録庫へ照会しています…</p>';
    try { show(await request(CONFIG.endpoint + '?action=summary')); } catch { unavailable(); }
  }
  function open() {
    returnFocus = document.activeElement; dialog.showModal(); load();
  }
  dialog.querySelector('#academyStatisticsClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => returnFocus?.focus({ preventScroll: true }));

  const title = document.getElementById('academySettingsTitle');
  if (title) {
    title.tabIndex = 0; title.setAttribute('role', 'button'); title.setAttribute('aria-label', '学院の設定');
    let taps = 0, last = 0;
    function tap() {
      const now = performance.now(); taps = now - last <= 2500 ? taps + 1 : 1; last = now;
      if (taps === 5) { taps = 0; document.getElementById('academySettings')?.close(); open(); }
    }
    title.addEventListener('click', tap);
    title.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); tap(); } });
    document.addEventListener('pointerdown', event => { if (event.target !== title && !title.contains(event.target)) taps = 0; }, true);
    document.addEventListener('keydown', event => { if (event.target !== title) taps = 0; }, true);
  }
  document.addEventListener('submit', () => setTimeout(sync, 100));
  document.addEventListener('click', () => setTimeout(sync, 180), { capture: true });
  window.addEventListener('online', sync);
  window.addEventListener('pageshow', sync);
  window.addEventListener('storage', event => { if (Object.values(KEYS).includes(event.key)) sync(); });
  window.AcademyStatistics = Object.freeze({ sync, open, knownEvents });
  sync();
})();
