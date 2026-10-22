/* Only the graduation namespace is writable here. Exam records are read-only. */
(() => {
  'use strict';
  const M = window.GraduationMagic;
  function read() {
    try { return M.restore(localStorage.getItem(M.KEY)); }
    catch { return M.initial(); }
  }
  function write(state) {
    try { localStorage.setItem(M.KEY, JSON.stringify(state)); return true; }
    catch { return false; }
  }
  function progress() {
    try { return window.AcademyHallProgress.readProgress(localStorage); }
    catch { return window.AcademyHallProgress.readProgress(null); }
  }
  function admitted(state = read()) {
    return state.graduated || progress().passed === 4;
  }
  // Each classroom owns only its own circuit. A stale open window cannot
  // overwrite another classroom, the shared notebook, or an earned graduation.
  function saveRoom(state, { notes = false, settings = false } = {}) {
    const latest = read();
    latest.room = state.room;
    latest.spell = state.spell;
    latest.circuits[state.room] = M.clone(M.circuit(state));
    if (state.room !== 'hall') latest.physical[state.room] = M.clone(state.physical[state.room]);
    latest.graduated = latest.graduated || state.graduated;
    if (notes) latest.notes = state.notes;
    if (settings) latest.reduced = state.reduced;
    latest.records = [...new Set([...latest.records, ...state.records])].slice(-60);
    return { state: latest, ok: write(latest) };
  }
  window.AcademyGraduationStore = Object.freeze({ read, write, progress, admitted, saveRoom });
})();
