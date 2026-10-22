/* Additive classroom observation windows. Native exam actions retain authority. */
(() => {
  'use strict';
  const M = window.GraduationMagic, Store = window.AcademyGraduationStore;
  const room = document.body.dataset.academyRoom;
  if (!['hall', ...M.IDS].includes(room)) return;
  const urls = { hall: 'index.html', fire: 'fire-studio.html', water: 'water-insight-experiment.html', wind: 'wind-ribbon-experiment.html', earth: 'earth-studio.html' };
  const selectors = { fire: '.panel.lab', water: '#experiment', wind: '#observatory', earth: '.box.scene' };
  let returnFocus = null, frame = null, bridging = false;
  const dialog = document.createElement('dialog');
  dialog.className = 'academy-observation-dialog';
  dialog.setAttribute('aria-label', room === 'hall' ? '最終卒業試験' : M.ROOMS[room].name + '・術の余韻');
  const header = document.createElement('div');
  header.className = 'academy-observation-head';
  const title = document.createElement('h2');
  title.textContent = room === 'hall' ? '最終卒業試験 · 手を離した、その先に' : M.ROOMS[room].name + ' · 術の余韻';
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.textContent = room === 'hall' ? '回廊に戻る' : '通常の観測へ戻る';
  header.append(title, closeButton);
  dialog.append(header);
  document.body.append(dialog);

  function replayAllowed() {
    return room === 'hall' && Store.read().graduated === true;
  }
  function open({ replay = false } = {}) {
    if (replay && !replayAllowed()) { refresh(); return; }
    if (room === 'hall' && !Store.admitted()) { refresh(); return; }
    if (dialog.open) return;
    returnFocus = document.activeElement;
    if (!frame) {
      frame = document.createElement('iframe');
      frame.title = title.textContent;
      const url = new URL('graduation.html', location.href);
      url.search = new URLSearchParams({ room, embedded: '1', v: '3' });
      frame.src = url.href;
      frame.addEventListener('load', () => {
        if (replay) {
          if (replayAllowed()) frame.contentWindow.GraduationPresentation?.replay();
          else close();
        }
      }, { once: true });
      dialog.append(frame);
    } else {
      frame.contentWindow.dispatchEvent(new Event('academy-observation-open'));
      if (replay) frame.contentWindow.GraduationPresentation?.replay();
    }
    document.body.classList.add('academy-observing');
    dialog.showModal();
    closeButton.focus({ preventScroll: true });
  }
  function close() {
    if (dialog.classList.contains('is-celebrating')) return;
    dialog.close();
  }
  closeButton.addEventListener('click', close);
  dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('academy-observing');
    returnFocus?.focus({ preventScroll: true });
    refresh();
  });

  // Looking at the corridor lights never opens the exam or a spell workspace.
  // This window only reads the earned-light record and has no game actions.
  if (room === 'hall') {
    const inspection = document.createElement('dialog');
    inspection.id = 'welcomeLightsDialog';
    inspection.className = 'welcome-light-inspection';
    inspection.setAttribute('aria-labelledby', 'welcomeLightsTitle');
    inspection.innerHTML = '<h2 id="welcomeLightsTitle">回廊の灯り</h2><div id="welcomeLightsScene"></div><p>薄い透明の封緘の内側に、灯・映・巡・形と同じ四つの色。術者の手へ伸びる尾はありません。灯座には、かつて学んだ生徒の期印が刻まれています。</p><details><summary>灯座の保守記録</summary><p>院務記録：灯座は七夜ごとに炎の魔力を補給。卒業生の術をほどかず、同じ形のまま光を保ちます。無限の燃料ではありません。</p></details><button type="button" id="closeWelcomeLights">回廊に戻る</button>';
    document.body.append(inspection);
    let inspectionFocus;
    function lantern(x, y, scale, label, mine = false) {
      const strands = M.IDS.map((id, i) => `<path d="M${-20+i*7} 20Q${-40+i*6} ${-55-i*10} ${12-i*5} ${-72+i*4}Q${46-i*6} ${-28+i*6} ${20-i*7} 20" stroke="${M.META[id].color}" fill="none" stroke-width="1.6"/>`).join('');
      return `<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cx="0" cy="-42" rx="72" ry="105" fill="url(#welcomeLightHalo)"/><path d="M-42 40V-60Q-42-113 0-138Q42-113 42-60V40Z" fill="#213b44" stroke="#bcac7b" stroke-width="2"/><path d="M-25 29V-51Q-25-90 0-109Q25-90 25-51V29" fill="#112b37" stroke="#758a8b"/>${strands}<ellipse cx="0" cy="-42" rx="10" ry="24" fill="${mine?'#fff1bd':'#e6d6ac'}"/><path d="M-34 41H34" stroke="#b5c5b4" stroke-width="8"/></g><text x="${x}" y="${y+scale*70}" text-anchor="middle" fill="#d5cfb7" font-size="17">${label}</text>`;
    }
    document.getElementById('inspectWelcomeLights')?.addEventListener('click', () => {
      inspectionFocus = document.activeElement;
      const mine = Store.read().graduated;
      document.getElementById('welcomeLightsScene').innerHTML = '<svg viewBox="0 0 800 400" role="img" aria-label="期印のある回廊の灯り"><defs><radialGradient id="welcomeLightHalo"><stop stop-color="#e7d5a7" stop-opacity=".24"/><stop offset="1" stop-color="#e7d5a7" stop-opacity="0"/></radialGradient></defs><path d="M30 285V105Q30 35 130 5Q230 35 230 105V285M290 285V105Q290 20 400-20Q510 20 510 105V285M570 285V105Q570 35 670 5Q770 35 770 105V285" fill="none" stroke="#6b889046" stroke-width="3"/>' + lantern(130,240,1,'第百七十四期') + lantern(400,240,1.12,'第百七十五期') + lantern(670,240,1,'第百七十六期') + (mine?lantern(540,340,.5,'あなたの灯り',true):'') + '</svg>';
      document.body.classList.add('academy-inspecting');
      inspection.showModal();
    });
    document.getElementById('closeWelcomeLights').addEventListener('click', () => inspection.close());
    inspection.addEventListener('close', () => {
      document.body.classList.remove('academy-inspecting');
      inspectionFocus?.focus({ preventScroll: true });
    });
  }

  function raw(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function json(key) { try { return JSON.parse(raw(key)); } catch { return null; } }
  function svgData(svg) {
    if (!svg) return null;
    const copy = svg.cloneNode(true);
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(copy));
  }
  function snapshot() {
    const result = { room };
    if (room === 'fire') {
      const d = window.FireArchive.restore(raw(window.FireArchive.KEY)) || window.FireArchive.initial();
      result.fire = { lit: Boolean(d.lit.first || d.lit.second), view: d.view === 'second' ? 1 : 0 };
      result.art = svgData(document.getElementById('room'));
      result.projection = d.view ? svgData(document.getElementById(d.view === 'first' ? 'observFirst' : 'observSecond')) : null;
    } else if (room === 'water') {
      const d = window.WaterInsight.restore(raw(window.WaterInsight.KEY)) || window.WaterInsight.initial();
      // No sealed-water volume is exposed to the graduation layer.
      result.water = { open: d.physical.open, art: true };
      result.art = svgData(document.querySelector('#scene svg'));
    } else if (room === 'wind') {
      const d = window.WindRibbonModel.restore(json('magic-academy-wind-ribbon-v1'));
      result.wind = { blown: d.wind !== 'still', wind: d.wind, view: d.view };
      // The observation uses the same material model directly; do not encode
      // the large canvas again on every spell selection.
    } else if (room === 'earth') {
      const E = window.EarthExam, d = E.restore(raw('magic-academy-earth-v2')) || E.initial();
      const occupied = E.occupied(d);
      result.earth = {
        lifted: d.pieces.C.at === null,
        grid: Array.from({ length: 6 }, (_, y) => Array.from({ length: 6 }, (_, x) => occupied.get(`${x},${y}`) || '')),
        marks: E.TARGETS.map(t => ({ glyph: t.glyph, at: t.at })),
        c: { ...d.pieces.C, cells: E.shapeFor('C', d.pieces.C.rot, d.pieces.C.flip).cells }
      };
    }
    return result;
  }
  function selectNative(spell) {
    document.querySelector(room === 'fire' ? `.magics [data-magic="${spell}"]` : `[data-spell="${spell}"]`)?.click();
  }
  function castNative(spell) {
    if (room === 'hall') return snapshot();
    bridging = true;
    try {
      selectNative(spell);
      if (room === 'fire') {
        const side = document.querySelector('[data-lamp][aria-pressed="true"]')?.dataset.lamp || 'first';
        document.querySelector(`[data-lamp="${side}"]`).click();
      } else if (room === 'water') {
        document.getElementById(spell === 'water' ? 'bathPour' : 'otherMagic').click();
      } else if (room === 'wind') {
        (spell === 'wind' ? document.querySelector('[data-wind="right"]') : document.getElementById('otherMagic')).click();
      } else if (room === 'earth') {
        const d = window.EarthExam.restore(raw('magic-academy-earth-v2')) || window.EarthExam.initial();
        const at = d.pieces.C.at;
        const target = at ? document.querySelector(`#board [data-x="${at[0]}"][data-y="${at[1]}"]`) : document.querySelector('[data-piece="C"]');
        target.click();
      }
    } finally { bridging = false; }
    return snapshot();
  }
  function noteNative(spell) {
    if (!M.IDS.includes(spell)) return;
    const s = Store.read();
    s.room = room;
    M.cast(M.circuit(s), spell, null);
    if (room === 'fire' && ['water', 'wind'].includes(spell)) {
      const n = M.circuit(s).nodes.fire;
      if (!n.from) { n.exists = false; n.manual = false; }
    }
    Store.saveRoom(s);
  }
  document.addEventListener('click', e => {
    if (bridging || room === 'hall') return;
    const selector = { fire: '[data-lamp],[data-target^="lamp:"]', water: '#bathPour,#otherMagic', wind: '[data-wind],#otherMagic', earth: '#board .cell,[data-piece],#cast' }[room];
    if (!e.target.closest?.(selector)) return;
    const chosen = document.querySelector(room === 'fire' ? '.magics [aria-pressed="true"]' : '[data-spell][aria-pressed="true"]');
    const spell = chosen?.dataset.magic || chosen?.dataset.spell;
    if (room === 'wind' && e.target.closest('[data-wind="still"]')) return;
    if (room === 'earth' && spell === 'earth') {
      const d = window.EarthExam.restore(raw('magic-academy-earth-v2'));
      if (d?.pieces.C.at !== null && !e.target.closest('#cast')) return;
    }
    noteNative(spell);
    refresh();
  });

  function refresh() {
    const progress = Store.progress(), s = Store.read();
    if (room === 'hall') {
      const enter = document.getElementById('enterGraduation');
      const allowed = Store.admitted(s);
      if (enter) { enter.disabled = !allowed; enter.textContent = s.graduated ? '灯座をもう一度観測する' : '卒業試験を始める'; }
      const replay = document.getElementById('hallGraduationReplay');
      if (replay) { replay.hidden = !s.graduated; replay.disabled = !s.graduated; }
      const replayArea = document.getElementById('hallGraduationReplayArea');
      if (replayArea) replayArea.hidden = !s.graduated;
      const mine = document.querySelector('.welcome-lantern.mine');
      if (mine) mine.hidden = !s.graduated;
      document.querySelector('.hall-welcome-lights')?.setAttribute('aria-label', s.graduated ? '回廊を照らす、先輩たちとあなたの四つの灯り' : '回廊を照らす三つの灯り');
      const note = document.getElementById('graduation-note');
      if (note) note.textContent = s.graduated ? '卒業の記録が、回廊に残っています。灯座の観測はいつでも続けられます。' : progress.passed === 4 ? '四科目の修了を確認しました。最後の課題へ進めます。' : `合格 ${progress.passed} / 4 科目。四科目を修了すると、最後の課題が開かれます。`;
    } else {
      const pass = document.getElementById(room === 'earth' ? 'success' : 'pass');
      if (pass && !pass.querySelector('.academy-next-trial')) {
        const p = document.createElement('p'); p.className = 'academy-next-trial';
        const a = document.createElement('a'); a.href = 'index.html#graduation-exam'; p.append(a); pass.append(p);
      }
      const a = pass?.querySelector('.academy-next-trial a');
      if (a) a.textContent = progress.passed === 4 ? '四科目修了 · 最終卒業試験へ →' : `合格 ${progress.passed} / 4 科目 · 次の教室を選ぶ →`;
    }
  }
  if (room === 'hall') {
    document.getElementById('enterGraduation')?.addEventListener('click', () => { if (Store.admitted()) open(); });
    document.getElementById('hallGraduationReplay')?.addEventListener('click', () => open({ replay: true }));
  } else {
    const panel = document.createElement('section'); panel.className = 'academy-afterglow'; panel.id = 'afterglow';
    const kicker = document.createElement('p'); kicker.className = 'afterglow-kicker'; kicker.textContent = 'AFTERGLOW · 装置のそばに';
    const copy = document.createElement('p'); copy.textContent = '術を使った場所に、ごく細い光の尾が残っています。装置と、そのまわりを見比べられます。';
    const button = document.createElement('button'); button.type = 'button'; button.textContent = '術の余韻を観測する'; button.addEventListener('click', () => open());
    panel.append(kicker, copy, button);
    (document.querySelector(selectors[room]) || document.querySelector('main')).append(panel);
    const pass = document.getElementById(room === 'earth' ? 'success' : 'pass');
    if (pass) new MutationObserver(refresh).observe(pass, { attributes: true, attributeFilter: ['hidden'] });
  }
  window.AcademyRevisit = Object.freeze({
    room, snapshot, cast: castNative, close,
    setCelebrating(value) { dialog.classList.toggle('is-celebrating', value === true); }
  });
  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', refresh);
  document.addEventListener('submit', () => setTimeout(refresh, 0));
  window.addEventListener('hashchange', () => { if (location.hash === '#afterglow') open(); });
  refresh();
  if (location.hash === '#afterglow') open();
  if (room === 'hall' && location.hash === '#graduation-exam' && Store.admitted() && !Store.read().graduated) open();
})();
