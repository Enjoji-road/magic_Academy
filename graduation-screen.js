/* Presentation only. No spell rules, grading, storage reads, or storage writes. */
(() => {
  'use strict';

  // Edit these two constants to change the spoiler-free post draft.
  const SHARE_TEXT = [
    '🪄 魔法学校を卒業しました！🎓',
    '',
    '四つの魔法を学び、最後の卒業試験にも合格しました。',
    '',
    'あなたも魔法学校に入学してみませんか？',
    '',
    '#road謎'
  ].join('\n');
  const SHARE_URL = 'https://enjoji-road.github.io/magic_Academy/';
  const OBSERVE_MS = 900;
  const FADE_OUT_MS = 1100;
  const FADE_IN_MS = 550;

  const screen = document.getElementById('graduationScreen');
  const observation = document.getElementById('graduationObservation');
  const observedScene = document.getElementById('graduationObservedScene');
  const ready = document.getElementById('graduationReady');
  const heading = document.getElementById('graduationTitle');
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const timers = new Set();
  let available = false;
  let phase = 'closed';
  let returnFocus = null;
  let generation = 0;

  const share = new URL('https://x.com/intent/tweet');
  share.search = new URLSearchParams({ text: SHARE_TEXT, url: SHARE_URL });
  document.getElementById('shareGraduation').href = share.href;
  screen.style.setProperty('--graduation-fade-out', FADE_OUT_MS + 'ms');
  screen.style.setProperty('--graduation-fade-in', FADE_IN_MS + 'ms');

  function reducedMotion() {
    return Boolean(media?.matches || document.body.classList.contains('reduced'));
  }

  function setPhase(value) {
    phase = value;
    screen.dataset.phase = value;
    screen.setAttribute('aria-busy', String(value !== 'ready' && value !== 'closed'));
  }

  function clearTimers() {
    for (const timer of timers) window.clearTimeout(timer);
    timers.clear();
    generation++;
  }

  function later(callback, delay) {
    const current = generation;
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      if (current === generation && screen.open) callback();
    }, delay);
    timers.add(timer);
  }

  function openScreen() {
    if (!available || screen.open || phase !== 'closed') return false;
    returnFocus = document.activeElement;
    document.body.classList.add('graduation-showing');
    screen.showModal();
    window.parent !== window && window.parent.AcademyRevisit?.setCelebrating(true);
    screen.focus({ preventScroll: true });
    return true;
  }

  function showReady() {
    clearTimers();
    observation.hidden = true;
    ready.hidden = false;
    ready.inert = false;
    setPhase('ready');
    heading.focus({ preventScroll: true });
  }

  function celebrate(scene) {
    if (!available || screen.open || phase !== 'closed') return false;
    // Copy the already-rendered successful scene. This does not determine success.
    observedScene.replaceChildren(scene.cloneNode(true));
    observation.hidden = false;
    ready.hidden = true;
    ready.inert = true;
    if (!openScreen()) return false;
    setPhase('observe');
    later(() => {
      if (reducedMotion()) {
        showReady();
        return;
      }
      setPhase('fade-out');
      later(() => {
        observation.hidden = true;
        ready.hidden = false;
        setPhase('fade-in');
        // Keep one painted dark frame between the two scenes.
        window.requestAnimationFrame(() => {
          if (!screen.open || phase !== 'fade-in') return;
          setPhase('revealing');
          later(showReady, FADE_IN_MS);
        });
      }, FADE_OUT_MS);
    }, reducedMotion() ? 600 : OBSERVE_MS);
    return true;
  }

  function replay() {
    if (!openScreen()) return false;
    showReady();
    return true;
  }

  function close() {
    if (phase !== 'ready' || !screen.open) return;
    screen.close();
  }

  function setAvailable(value) {
    available = value === true;
    for (const area of document.querySelectorAll('.graduation-replay')) area.hidden = !available;
    if (!available && screen.open) screen.close();
  }

  document.getElementById('returnToStudy').addEventListener('click', close);
  document.querySelectorAll('[data-replay-graduation]').forEach(button => {
    button.addEventListener('click', replay);
  });
  screen.addEventListener('cancel', event => {
    event.preventDefault();
    close();
  });
  screen.addEventListener('close', () => {
    clearTimers();
    setPhase('closed');
    document.body.classList.remove('graduation-showing');
    window.parent !== window && window.parent.AcademyRevisit?.setCelebrating(false);
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  });
  media?.addEventListener?.('change', () => {
    if (screen.open && reducedMotion() && phase !== 'ready') showReady();
  });

  window.GraduationPresentation = Object.freeze({ celebrate, replay, setAvailable });
})();
