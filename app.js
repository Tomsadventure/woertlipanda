/* Wörtli-Panda – Englisch-Wörtli lernen mit Bao, dem Panda (4. Klasse, Schweiz).
   Eine Seite, kein Framework. Wörter aus daten.js, Lernlogik aus lernen.js, Fortschritt auf dem Gerät (localStorage). */
(() => {
'use strict';
const L = window.Lernen;
const D = window.DATEN;
const WORD = Object.fromEntries(D.woerter.map(w => [w.id, w]));
const UNIT = Object.fromEntries(D.units.map(u => [u.n, u]));
const img = name => `img/${name}.webp`;

/* ================================================================ Speicher */
const KEY = 'woertlipanda.v1';
const DEFAULTS = { name: '', length: 10, hilfe: 'auto', testLength: 0, voice: true, autoplay: true, sounds: true };
let S = load();
function load() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* privates Fenster o. Ä. */ }
  d = d && typeof d === 'object' ? d : {};
  const firstActive = (D.units.find(u => u.aktiv) || D.units[0]).n;
  return {
    settings: Object.assign({}, DEFAULTS, d.settings || {}),
    w: d.w && typeof d.w === 'object' ? d.w : {},          // Wort-ID -> Lernstand (lernen.js)
    unit: d.unit && UNIT[d.unit] && UNIT[d.unit].aktiv ? d.unit : firstActive,
    round: d.round || 0,                                      // gezählte Runden (für »in einer späteren Runde«)
    tests: Array.isArray(d.tests) ? d.tests.slice(-20) : [],
    waldSeen: !!d.waldSeen,
    hintClosed: !!d.hintClosed,
    installed: !!d.installed,
  };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* egal */ } }
const st = id => S.w[id] || L.blank();
const unitWords = n => D.woerter.filter(w => w.unit === n);
const grown = n => unitWords(n).filter(w => st(w.id).box === L.MAX).length;
const name = () => (S.settings.name || '').trim();
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const show = en => esc(en).replace(/\.\.\./g, '…');   // »...« im Schulbuch = Lücke im Satz

/* ================================================================== Icons */
const I = p => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICON = {
  gear: I('<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1.1z"/>'),
  close: I('<path d="M6 6l12 12M18 6L6 18"/>'),
  back: I('<path d="M15 18l-6-6 6-6"/>'),
  next: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  prev: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  speaker: I('<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
  slow: I('<path d="M3 17c1.2-4.5 4.4-7 8.5-7 3.2 0 5.4 1.6 6.5 3.5"/><path d="M18 13.5l2.6-1.3c.7-.3 1.4.3 1.1 1L21 15.5"/><path d="M6 17v2M14 17v2M3 17h17"/><circle cx="17.6" cy="12" r=".5"/>'),
  abc: I('<path d="M3 17l3-9 3 9M4 14h4"/><path d="M11 8h3a2 2 0 0 1 0 4h-3V8zM11 12h3.5a2.5 2.5 0 0 1 0 5H11v-5z"/><path d="M22 9.5a3 3 0 1 0 0 5.5"/>'),
  del: I('<path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="M17 9.5l-5 5M12 9.5l5 5"/>'),
  check: I('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  again: I('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'),
  share: I('<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>'),
  install: I('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>'),
  cards: I('<rect x="3" y="6" width="13" height="15" rx="2.5"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/>'),
  ear: I('<path d="M6 9a6 6 0 1 1 12 0c0 3-2 4.2-3 5.5S14 17 14 18.5a3 3 0 0 1-6 .3"/><path d="M9.5 9.5a2.5 2.5 0 1 1 5 0c0 1.6-1.6 2-1.6 3.5"/>'),
  choose: I('<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><path d="M14.5 17l2 2 3.5-4"/>'),
  pencil: I('<path d="M4 20l4-1L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4z"/><path d="M14 7l3 3"/>'),
  memory: I('<rect x="3" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8"/><path d="M6.7 6.7h.1M17.2 17.2h.1"/>'),
  test: I('<path d="M8 4h8M9 2h6v4H9z"/><rect x="5" y="4" width="14" height="18" rx="2"/><path d="M8.5 12l2 2 4-4M8.5 18h7"/>'),
  list: I('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
  lock: I('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
};
/* Bambus-Symbol (Fortschritt): Höhe = Stufe 0–5 */
function bambooSVG(box, cls = '') {
  const segs = Math.max(0, Math.min(5, box));
  if (!segs) return `<svg class="bmb ${cls}" viewBox="0 0 24 60" aria-hidden="true"><path class="bmb-soil" d="M4 58c2-5 14-5 16 0z"/><path class="bmb-sprout" d="M12 56c0-4 1-7 4-9-1 3-2 6-4 9z"/></svg>`;
  // Halm aus Gliedern mit dunklen Knoten; an jedem 2. Knoten ein Blatt (abwechselnd links/rechts), ausgewachsen eine Blattkrone
  let s = '', leaves = '';
  for (let i = 0; i < segs; i++) {
    const y = 56 - (i + 1) * 10.4;
    s += `<rect class="bmb-seg" x="9.5" y="${y.toFixed(1)}" width="5" height="10.4" rx="1.6"/><rect class="bmb-node" x="8.8" y="${(y - 0.6).toFixed(1)}" width="6.4" height="1.6" rx=".8"/>`;
    if (i % 2 === 1 && i < 4) {
      leaves += i % 4 === 1
        ? `<path class="bmb-leaf" d="M14 ${(y + 1).toFixed(1)}c4-3 7-3 9-1-3 1.4-6 1.5-9 1z"/>`
        : `<path class="bmb-leaf" d="M10 ${(y + 1).toFixed(1)}c-4-3-7-3-9-1 3 1.4 6 1.5 9 1z"/>`;
    }
  }
  const top = 56 - segs * 10.4;
  if (segs >= 5) {
    leaves += `<path class="bmb-leaf" d="M12 ${top}c-5-3-9-3-12 0 4 1.5 8 1.4 12 0z"/><path class="bmb-leaf" d="M12 ${top}c5-4 9-4 12-1-4 1.8-8 2-12 1z"/>`
      + `<path class="bmb-leaf" d="M12 ${top + 1}c-1-5 0-8 3-10 0 4-1 7-3 10z"/><path class="bmb-leaf" d="M12 ${top + 1}c-3-4-4-7-3-10 2 3 3 6 3 10z"/>`;
  }
  return `<svg class="bmb ${cls} ${segs >= 5 ? 'full' : ''}" viewBox="0 0 24 60" aria-hidden="true"><path class="bmb-soil" d="M4 58c2-5 14-5 16 0z"/>${s}${leaves}</svg>`;
}
const LEVEL = ['neu', 'kennengelernt', 'einmal erkannt', 'erkannt – bereit zum Schreiben', 'einmal richtig geschrieben', 'sicher – Bambus ausgewachsen'];

/* ============================================================== Ton
   Stimme: MP3s aus audio/ nacheinander (Web Audio, damit auf dem iPhone nichts stockt). Geräusche: direkt erzeugt. */
const Sound = (() => {
  let ctx = null, out = null, sfxBus = null, voiceBus = null;
  const bytes = new Map();
  let bufs = new Map(), src = null, queue = [], playing = false, tok = 0;
  function make() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* alt */ }
    try { ctx = new AC(); } catch (e) { ctx = null; return null; }
    bufs = new Map();
    out = ctx.createDynamicsCompressor();
    out.threshold.value = -12; out.knee.value = 10; out.ratio.value = 4; out.attack.value = 0.003; out.release.value = 0.25;
    out.connect(ctx.destination);
    voiceBus = ctx.createGain(); voiceBus.gain.value = 1; voiceBus.connect(out);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(out);
    return ctx;
  }
  function ready() {
    if (!ctx || ctx.state === 'closed') make();
    if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
    return ctx;
  }
  function drop() { stop(); if (ctx) { try { ctx.close(); } catch (e) { /* zu */ } } ctx = null; }
  document.addEventListener('visibilitychange', () => { if (document.hidden) drop(); });
  window.addEventListener('pagehide', drop);
  ['pointerup', 'touchend', 'keydown'].forEach(ev => window.addEventListener(ev, ready, { capture: true, passive: true }));
  function fetchBytes(n) {
    if (!bytes.has(n)) bytes.set(n, fetch(`audio/${n}.mp3`).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null));
    return bytes.get(n);
  }
  async function buffer(n) {
    const c = ctx;
    if (!c) return null;
    if (bufs.has(n)) return bufs.get(n);
    const ab = await fetchBytes(n);
    if (!ab || c !== ctx) return null;
    try {
      const b = await new Promise((res, rej) => c.decodeAudioData(ab.slice(0), res, rej));
      if (c === ctx) bufs.set(n, b);
      return b;
    } catch (e) { return null; }
  }
  const wait = ms => new Promise(res => setTimeout(res, ms));
  function playBuf(b) {
    return new Promise(res => {
      const s = ctx.createBufferSource();
      s.buffer = b; s.connect(voiceBus);
      let done = false;
      const end = () => { if (!done) { done = true; res(); } };
      s.onended = end; src = s;
      const t0 = ctx.currentTime, c = ctx;
      s.start();
      setTimeout(end, b.duration * 1000 + 500);
      setTimeout(() => { if (c === ctx && c.currentTime === t0) drop(); }, 800);   // iOS nach dem Hintergrund
    });
  }
  function stop() { tok++; queue = []; playing = false; if (src) { try { src.stop(); } catch (e) { /* fertig */ } src = null; } }
  /* Zeilen nacheinander; append = hinten anhängen; {pause: ms} = kleine Pause */
  function say(names, append = false) {
    if (!append) stop();
    queue.push(...[].concat(names).filter(Boolean));
    if (!playing) pump();
  }
  async function pump() {
    if (!ready()) { queue = []; return; }
    playing = true;
    const my = tok;
    while (queue.length && my === tok) {
      const item = queue.shift();
      if (typeof item === 'object') { await wait(item.pause); continue; }
      const b = await buffer(item);
      if (my !== tok) return;
      if (!b) continue;
      await playBuf(b);
      if (my !== tok) return;
      await wait(40);
    }
    if (my === tok) { playing = false; src = null; }
  }
  const preload = names => names.forEach(n => typeof n === 'string' && fetchBytes(n));
  const busy = () => playing;
  const note = m => 440 * Math.pow(2, (m - 69) / 12);
  function env(g, t, a, peak, decay) {
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + decay);
  }
  function osc(type, f, t, dur, peak, dest, a = 0.004) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); env(g, t, a, peak, dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + a + dur + 0.05);
  }
  const marimba = (f, t, v = 1) => { osc('sine', f, t, 0.55, 0.3 * v, sfxBus); osc('sine', f * 3.93, t, 0.1, 0.06 * v, sfxBus, 0.002); };
  const bell = (f, t, v = 1) => { osc('sine', f, t, 1.2, 0.14 * v, sfxBus); osc('sine', f * 2.76, t, 0.55, 0.05 * v, sfxBus); };
  const PENTA = [0, 2, 4, 7, 9], step = i => 72 + 12 * Math.floor(i / 5) + PENTA[i % 5];
  const on = () => S.settings.sounds && ready();
  const sfx = {
    tap() {
      if (!on()) return;
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(1300, t); o.frequency.exponentialRampToValueAtTime(620, t + 0.045);
      env(g, t, 0.002, 0.1, 0.055); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.12);
    },
    right(streak) { if (!on()) return; const t = ctx.currentTime + 0.01, i = Math.min(Math.max(streak - 1, 0), 9); marimba(note(step(i)), t); marimba(note(step(i + 2)), t + 0.085, 0.9); },
    wrong() {
      if (!on()) return;
      const t = ctx.currentTime + 0.01;
      [[55, 0], [52, 0.15]].forEach(([m, dt]) => {
        const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = note(m); f.type = 'lowpass'; f.frequency.value = 900;
        env(g, t + dt, 0.012, 0.22, 0.34); o.connect(f); f.connect(g); g.connect(sfxBus); o.start(t + dt); o.stop(t + dt + 0.5);
      });
    },
    done() { if (!on()) return; const t = ctx.currentTime + 0.05, seq = [72, 76, 79, 84, 88]; seq.forEach((m, i) => marimba(note(m), t + i * 0.11, 0.85)); bell(note(100), t + 0.55, 0.8); },
    sparkle() { if (!on()) return; const t = ctx.currentTime + 0.02; [84, 88, 91, 96, 100].forEach((m, i) => bell(note(m), t + i * 0.065, 0.55)); },
    flip() { if (!on()) return; const t = ctx.currentTime; osc('triangle', 520, t, 0.08, 0.08, sfxBus); osc('triangle', 780, t + 0.05, 0.08, 0.06, sfxBus); },
  };
  return { say, stop, preload, sfx, ready, busy };
})();
const sfx = Sound.sfx;
const voiceOn = () => S.settings.voice;
/* Bao spricht (Lob, Hilfe) nur, wenn eingeschaltet; Wörter selbst immer, wenn man sie antippt */
function bao(names, append) { if (voiceOn()) Sound.say(names, append); }
const rnd = n => 1 + Math.floor(Math.random() * n);
const pad2 = n => String(n).padStart(2, '0');
const line = { hallo: () => `bao_hallo_${pad2(rnd(3))}`, lob: () => `bao_lob_${pad2(rnd(12))}`, fast: () => `bao_fast_${pad2(rnd(4))}`, fertig: () => `bao_fertig_${pad2(rnd(3))}`, los: () => `bao_los_${pad2(rnd(2))}` };
function sayWord(id, slow) { Sound.say(slow ? `${id}_slow` : id); }
/* Buchstabieren: die englischen Buchstabennamen nacheinander, zwischen Wörtern eine Pause */
function spell(id) {
  const parts = [];
  WORD[id].en.toLowerCase().split('').forEach(c => {
    if (/[a-z]/.test(c)) parts.push(`letter_${c}`, { pause: 120 });
    else if (c === ' ') parts.push({ pause: 450 });
  });
  Sound.say(parts);
}

/* ================================================================ Bildschirm */
const app = document.getElementById('app');
const sheetRoot = document.getElementById('sheet-root');
const fxRoot = document.getElementById('fx');
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let view = { name: 'home' };
let Q = null;           // laufende Übung
let timer = null;
let reloadPending = false;

function nav(name, params = {}, push = true) {
  closeSheet(true);
  clearTimeout(timer);
  if (['task', 'memory'].includes(view.name) && !['task', 'result', 'memory'].includes(name)) { Q = null; Sound.stop(); }
  view = Object.assign({ name }, params);
  if (push) { try { history.pushState({ name }, ''); } catch (e) { /* file:// */ } }
  render();
  window.scrollTo(0, 0);
  if (name === 'home' && reloadPending) location.reload();
}
window.addEventListener('popstate', e => {
  const s = e.state || { name: 'home' };
  clearTimeout(timer);
  if (['task', 'memory', 'result'].includes(view.name)) { Q = null; Sound.stop(); }
  view = ['wald', 'karten'].includes(s.name) ? { name: s.name } : { name: 'home' };
  closeSheet(true);
  render();
});
function render() {
  document.body.dataset.view = view.name;
  const R = { home: homeHTML, wald: waldHTML, karten: kartenHTML, result: () => resultHTML(view.res), memory: memoryHTML };
  if (view.name === 'task') { app.innerHTML = taskShellHTML(); showTask(); return; }
  app.innerHTML = R[view.name]();
  if (view.name === 'karten') afterKarte();
}

/* ------------------------------------------------------------------ Start */
const MODES = [
  { k: 'karten', t: 'Lernkarten', s: 'Anschauen und anhören', ic: 'cards' },
  { k: 'hoeren', t: 'Hören', s: 'Hören und Bild wählen', ic: 'ear' },
  { k: 'waehlen', t: 'Wählen', s: 'Deutsch ↔ Englisch', ic: 'choose' },
  { k: 'schreiben', t: 'Schreiben', s: 'Richtig buchstabieren', ic: 'pencil' },
  { k: 'memory', t: 'Memory', s: 'Bild und Wort finden', ic: 'memory' },
  { k: 'test', t: 'Wörtlitest', s: 'Wie in der Schule', ic: 'test' },
];
function sessionPreview() {
  const tasks = L.buildSession(unitWords(S.unit), S, { length: S.settings.length, hilfe: S.settings.hilfe, round: S.round + 1 });
  const neu = tasks.filter(t => t.kind === 'karte').length;
  return `${tasks.length} Aufgaben${neu ? ` · ${neu === 1 ? '1 neues Wort' : `${neu} neue Wörter`}` : ''}`;
}
function homeHTML() {
  const u = UNIT[S.unit], words = unitWords(S.unit), g = grown(S.unit), nm = name();
  return `<div class="screen home">
    <header class="bar">
      <button class="brand" data-act="hello" aria-label="Wörtli-Panda – Bao sagt Hallo"><img src="icons/favicon.png" alt=""><span>Wörtli-Panda</span></button>
      <div class="bar-right">
        <button class="pill" data-act="wald" aria-label="Bambuswald: ${g} von ${words.length} Bambus ausgewachsen">${bambooSVG(5, 'pill-bmb')}<span class="pill-t">Bambuswald</span><b>${g}/${words.length}</b></button>
        <button class="icon-btn" data-act="settings" aria-label="Einstellungen">${ICON.gear}</button>
      </div>
    </header>
    <section class="hero">
      <button class="hero-bao" data-act="bao" aria-label="Bao antippen"><img src="${img('bao_hallo')}" alt="Bao, der Panda, winkt"></button>
      <div class="bubble">
        <p class="bubble-hi" lang="en">Hi${nm ? ` ${esc(nm)}` : ''}! I'm Bao.</p>
        <p>Wir üben die Wörter von <b>${u.titel}</b>: ${esc(u.thema)}.</p>
        <button class="btn primary big" data-act="start-bao"><span><b>Üben mit Bao</b><small>${sessionPreview()}</small></span>${ICON.next}</button>
      </div>
    </section>
    <section class="unit-head" style="--u:${u.farbe}">
      <div><h2>${u.titel} <span>${esc(u.thema)}</span></h2>
        <div class="progress" aria-label="${g} von ${words.length} Wörtern sicher"><i style="width:${(100 * g / words.length).toFixed(1)}%"></i></div>
        <p class="unit-sub">${g} von ${words.length} Wörtern sicher · ${words.filter(w => st(w.id).box > 0).length} angefangen</p></div>
    </section>
    <section class="modes">
      ${MODES.map(m => `<button class="mode" data-act="mode" data-mode="${m.k}"><span class="mode-ic">${ICON[m.ic]}</span><span class="mode-t">${m.t}</span><span class="mode-s">${m.s}</span></button>`).join('')}
    </section>
    <h3 class="more-title">Weitere Units</h3>
    <section class="units">
      ${D.units.filter(x => x.n !== S.unit).map(x => `<button class="unit-tile ${x.aktiv ? '' : 'soon'}" style="--u:${x.farbe}" data-act="unit" data-unit="${x.n}" ${x.aktiv ? '' : 'disabled'}>
        <span class="unit-n">${x.n}</span><span class="unit-t">${esc(x.thema)}</span><span class="unit-s">${x.aktiv ? `${grown(x.n)} von ${unitWords(x.n).length} sicher` : `${ICON.lock} kommt bald`}</span></button>`).join('')}
    </section>
    <div id="install-home">${installHomeHTML()}</div>
    <footer class="foot">Englisch 4. Klasse · Wörter aus dem Schulbuch · funktioniert auch ohne Internet</footer>
  </div>`;
}

/* ---- Als App auf den Startbildschirm (wie Rechentiger/Einmaleins) ---- */
const UA = navigator.userAgent;
const isIOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/i.test(UA);
const androidBrowser = /SamsungBrowser/i.test(UA) ? 'samsung' : /Firefox/i.test(UA) ? 'firefox' : 'chrome';
const standalone = () => !!navigator.standalone || ['standalone', 'fullscreen', 'minimal-ui'].some(m => window.matchMedia(`(display-mode: ${m})`).matches);
let installEvent = null;
window.addEventListener('beforeinstallprompt', e => { if (!isAndroid) return; e.preventDefault(); installEvent = e; refreshInstall(); });
window.addEventListener('appinstalled', () => { installEvent = null; S.installed = true; save(); refreshInstall(); });
const INSTALL_STEPS = {
  ios: 'Tippe auf <b>Teilen</b> (das Quadrat mit dem Pfeil) und dann auf <b>«Zum Home-Bildschirm»</b>.',
  chrome: 'Tippe oben rechts auf <b>⋮</b> und dann auf <b>«App installieren»</b> (oder «Zum Startbildschirm hinzufügen»).',
  samsung: 'Tippe unten auf <b>≡</b>, dann auf <b>«Seite hinzufügen zu»</b> und <b>«Startbildschirm»</b>.',
  firefox: 'Tippe auf <b>⋮</b> und dann auf <b>«Installieren»</b> (oder «Zum Startbildschirm hinzufügen»).',
};
const installable = () => (isIOS || isAndroid) && !standalone();
function installInner(where) {
  if (!installable()) return '';
  if (S.installed && !installEvent) return where === 'set' ? '<p class="set-note">Wörtli-Panda ist schon installiert – öffne die App über das Symbol auf dem Startbildschirm.</p>' : '';
  const close = where === 'home' ? `<button class="icon-btn small" data-act="hint-close" aria-label="Tipp schliessen">${ICON.close}</button>` : '';
  if (isAndroid && installEvent) {
    return `<div class="tip ${where === 'home' ? 'card' : 'flat'}"><span class="tip-ic">${ICON.install}</span>
      <div class="tip-body"><p><b>Als App installieren:</b> Dann ist Wörtli-Panda auf dem Startbildschirm und funktioniert auch ohne Internet.</p>
      <button class="btn primary" data-act="install">${ICON.install}<span>App installieren</span></button></div>${close}</div>`;
  }
  return `<div class="tip ${where === 'home' ? 'card' : 'flat'}"><span class="tip-ic">${isIOS ? ICON.share : ICON.install}</span>
    <div class="tip-body"><p><b>${where === 'home' ? 'Tipp für Eltern' : 'So geht’s'}:</b> ${INSTALL_STEPS[isIOS ? 'ios' : androidBrowser]} Dann ist Wörtli-Panda wie eine echte App da und funktioniert auch ohne Internet.</p></div>${close}</div>`;
}
const installHomeHTML = () => (S.hintClosed ? '' : installInner('home'));
function installSetHTML() { const i = installInner('set'); return i ? `<section class="set-group"><h3>Auf den ${isIOS ? 'Home-Bildschirm' : 'Startbildschirm'}</h3>${i}</section>` : ''; }
function refreshInstall() {
  const h = document.getElementById('install-home'); if (h) h.innerHTML = installHomeHTML();
  const s = document.getElementById('install-set'); if (s) s.innerHTML = installSetHTML();
}

/* --------------------------------------------------------------- Übungen
   Q.mode: { typ: 'bao' | 'drill' | 'test', drill } – Q.list: [{kind, id}] aus lernen.js */
const MODE_LINE = { hoeren: 'bao_modus_hoeren', waehlen: 'bao_modus_waehlen', schreiben: 'bao_modus_schreiben', test: 'bao_modus_test' };
function startTasks(mode, list) {
  S.round++; save();
  Q = { mode, list, i: 0, tries: 0, hinted: false, input: '', placed: [], streak: 0, results: [], before: {}, locked: false, extra: 0 };
  unitWords(S.unit).forEach(w => { Q.before[w.id] = st(w.id).box; });
  Sound.preload([...new Set(list.flatMap(t => [t.id]))].concat(['bao_lob_01', 'bao_lob_02', 'bao_lob_03', 'bao_fast_01', 'bao_fast_02', 'bao_loesung']));
  [...new Set(list.map(t => t.id))].forEach(id => { new Image().src = img(id); });
  nav('task');
  const intro = mode.typ === 'test' ? 'bao_modus_test' : mode.typ === 'drill' ? MODE_LINE[mode.drill] : line.los();
  bao([intro, { pause: 250 }]);
  autoSpeak(true);
}
function startBao() { startTasks({ typ: 'bao' }, L.buildSession(unitWords(S.unit), S, { length: S.settings.length, hilfe: S.settings.hilfe, round: S.round + 1 })); }
function startDrill(kind, ids) {
  const words = ids ? ids.map(id => WORD[id]) : unitWords(S.unit);
  const list = L.buildDrill(words, kind, { hilfe: S.settings.hilfe, S, length: ids ? words.length : Math.min(words.length, 12) });
  startTasks({ typ: 'drill', drill: kind }, list);
}
function startTest() {
  const words = unitWords(S.unit);
  startTasks({ typ: 'test' }, L.buildTest(words, S.settings.testLength || words.length));
}
const cur = () => Q.list[Q.i];

function taskShellHTML() {
  const title = Q.mode.typ === 'test' ? 'Wörtlitest' : Q.mode.typ === 'bao' ? 'Üben mit Bao' : (MODES.find(m => m.k === Q.mode.drill) || {}).t;
  return `<div class="screen task" id="task">
    <header class="qbar">
      <button class="icon-btn" data-act="quit" aria-label="Beenden">${ICON.close}</button>
      <div class="qprog"><span class="qtitle">${title}</span><div class="leaves" id="leaves"></div></div>
      <span class="qbao"><img id="bao" src="${img('bao_denkt')}" alt=""></span>
    </header>
    <section class="qcard" id="qcard"></section>
    <div class="qfoot" id="qfoot"></div>
  </div>`;
}
function setBao(pose) {
  const el = document.getElementById('bao');
  if (!el) return;
  el.src = img(pose);
  el.classList.remove('bounce', 'wobble'); void el.offsetWidth;
  if (!reduced()) el.classList.add(pose === 'bao_jubel' ? 'bounce' : pose === 'bao_mut' ? 'wobble' : 'x');
}
function updateLeaves() {
  const el = document.getElementById('leaves');
  if (!el) return;
  el.innerHTML = Q.list.map((t, i) => {
    const r = Q.results[i];
    return `<i class="${i < Q.i ? (r && r.first ? 'ok' : 'help') : i === Q.i ? 'now' : ''}"></i>`;
  }).join('');
}
/* Das Wort vorlesen, wenn die Aufgabe es erlaubt (bei »Wählen Englisch« und beim Schreiben nicht – das wäre die Lösung) */
function autoSpeak(append) {
  if (!Q || !S.settings.autoplay) return;
  const t = cur();
  if (['karte', 'hoeren', 'waehlen_de'].includes(t.kind)) Sound.say([{ pause: 200 }, t.id], append);
}
const soundBtns = (id, withSpell) => `<div class="snd">
  <button class="snd-btn" data-act="say" data-id="${id}" aria-label="Anhören">${ICON.speaker}</button>
  <button class="snd-btn" data-act="say-slow" data-id="${id}" aria-label="Langsam anhören">${ICON.slow}</button>
  ${withSpell ? `<button class="snd-btn" data-act="spell" data-id="${id}" aria-label="Buchstabieren">${ICON.abc}</button>` : ''}</div>`;
const picHTML = (id, cls = '') => `<img class="pic ${cls}" src="${img(id)}" alt="">`;

function showTask() {
  const t = cur(), w = WORD[t.id], card = document.getElementById('qcard'), foot = document.getElementById('qfoot');
  Q.tries = 0; Q.hinted = false; Q.input = ''; Q.placed = []; Q.locked = false;
  setBao('bao_denkt');
  updateLeaves();
  card.className = `qcard k-${t.kind}`;
  foot.innerHTML = '';
  if (t.kind === 'karte') {
    card.innerHTML = `<p class="ask">Neues Wort</p>${picHTML(w.id, 'big')}
      <p class="en" lang="en">${show(w.en)}</p>${soundBtns(w.id, w.typ === 'wort')}<p class="de">${esc(w.de)}</p>`;
    foot.innerHTML = `<button class="btn primary big" data-act="next" id="next-btn"><span><b>Weiter</b></span>${ICON.next}</button>`;
    return;
  }
  if (t.kind === 'hoeren') {
    const ch = L.choices(unitWords(w.unit), w);
    card.innerHTML = `<p class="ask">Hör gut zu – welches Bild passt?</p>${soundBtns(w.id, false)}
      <div class="fb" id="fb" aria-live="polite"></div>
      <div class="grid4 pics">${ch.map(c => `<button class="opt pic-opt" data-act="choice" data-id="${c.id}">${picHTML(c.id)}<span>${esc(c.de)}</span></button>`).join('')}</div>`;
    return;
  }
  if (t.kind === 'waehlen_en') {
    const ch = L.choices(unitWords(w.unit), w);
    card.innerHTML = `<p class="ask">Wie heisst das auf Englisch?</p>${picHTML(w.id)}<p class="de big">${esc(w.de)}</p>
      <div class="fb" id="fb" aria-live="polite"></div>
      <div class="grid4 words">${ch.map(c => `<button class="opt word-opt" data-act="choice" data-id="${c.id}" lang="en">${show(c.en)}</button>`).join('')}</div>`;
    return;
  }
  if (t.kind === 'waehlen_de') {
    const ch = L.choices(unitWords(w.unit), w);
    card.innerHTML = `<p class="ask">Was heisst das auf Deutsch?</p><p class="en" lang="en">${show(w.en)}</p>${soundBtns(w.id, false)}
      <div class="fb" id="fb" aria-live="polite"></div>
      <div class="grid4 words de-opts">${ch.map(c => `<button class="opt word-opt" data-act="choice" data-id="${c.id}">${esc(c.de)}</button>`).join('')}</div>`;
    return;
  }
  const isTest = t.kind === 'test';
  const usePuzzle = t.kind === 'puzzle' || (isTest && w.typ === 'satz');
  // Bild, deutsches Wort und Ton nebeneinander, damit Antwort und Tastatur auf denselben Bildschirm passen
  card.innerHTML = `<p class="ask">${isTest ? 'Schreib das englische Wort' : 'Schreib das Wort auf Englisch'}</p>
    <div class="prompt">${isTest ? '' : picHTML(w.id, 'side')}<div class="prompt-t"><p class="de big">${esc(w.de)}</p>${isTest ? '' : soundBtns(w.id, false)}</div></div>
    <div class="answer" id="answer"></div><div class="fb" id="fb" aria-live="polite"></div>`;
  if (usePuzzle) {
    Q.puzzle = L.puzzleKind(w) === 'buchstaben' && !isTest ? Object.assign({ typ: 'b' }, L.letterPuzzle(w)) : Object.assign({ typ: 'w' }, L.wordPuzzle(w));
    renderPuzzle();
  } else {
    Q.puzzle = null;
    renderTyping();
  }
}

/* ---- Auswahl ---- */
function choose(id, btn) {
  if (!Q || Q.locked) return;
  const t = cur();
  if (id === t.id) {
    btn.classList.add('right');
    return right(t);
  }
  btn.classList.add('wrong'); btn.disabled = true;
  wrong(t, () => {
    document.querySelectorAll('#qcard [data-act="choice"]').forEach(b => { if (b.dataset.id === t.id) b.classList.add('solution'); b.disabled = true; });
  }, t.kind === 'hoeren' ? () => Sound.say(t.id, true) : null);   // beim Hören das Wort nochmals abspielen
}

/* ---- Puzzle: Buchstaben (b) oder Wörter (w) ---- */
function renderPuzzle(state = '') {
  const p = Q.puzzle, a = document.getElementById('answer');
  if (p.typ === 'b') {
    let k = 0;
    a.innerHTML = `<div class="slots ${state}" lang="en">${p.groups.map(g => `<span class="slot-group">${Array.from({ length: g }, () => {
      const i = k++, pl = Q.placed[i];
      return `<button class="slot ${pl != null ? 'filled' : ''} ${state && Q.marks ? Q.marks[i] : ''}" data-act="unplace" data-i="${i}">${pl != null ? p.tiles[pl] : ''}</button>`;
    }).join('')}</span>`).join('')}</div>
    <div class="tiles" lang="en">${p.tiles.map((c, i) => `<button class="tile" data-act="place" data-i="${i}" ${Q.placed.includes(i) ? 'disabled' : ''}>${c}</button>`).join('')}</div>`;
  } else {
    a.innerHTML = `<div class="line ${state}" lang="en">${Q.placed.length ? Q.placed.map((ti, k) => `<button class="wtile placed ${state && Q.marks ? Q.marks[k] : ''}" data-act="unplace" data-i="${k}">${esc(p.tiles[ti].t)}</button>`).join('') : '<span class="line-hint">Tippe die Wörter in der richtigen Reihenfolge an</span>'}</div>
    <div class="tiles" lang="en">${p.tiles.map((x, i) => `<button class="wtile" data-act="place" data-i="${i}" ${Q.placed.includes(i) ? 'disabled' : ''}>${esc(x.t)}</button>`).join('')}</div>`;
  }
}
function place(i) {
  if (!Q || Q.locked || !Q.puzzle || Q.placed.includes(i)) return;
  const p = Q.puzzle, need = p.answer.length;      // Buchstaben (Text) oder Wörter (Liste)
  if (Q.placed.length >= need) return;
  Q.placed.push(i); sfx.tap(); renderPuzzle();
  if (Q.placed.length === need) checkPuzzle();
}
function unplace(i) {
  if (!Q || Q.locked || !Q.puzzle) return;
  Q.placed = Q.placed.slice(0, i); sfx.tap(); renderPuzzle();
}
function checkPuzzle() {
  const p = Q.puzzle, t = cur();
  const got = p.typ === 'b' ? Q.placed.map(i => p.tiles[i]) : Q.placed.map(i => p.tiles[i].t);
  const want = p.typ === 'b' ? p.answer.split('') : p.answer;
  const okAll = got.every((x, k) => x === want[k]);
  Q.marks = got.map((x, k) => (x === want[k] ? 'ok' : 'bad'));
  if (okAll) { renderPuzzle('right'); return right(t); }
  if (t.kind === 'test') { renderPuzzle('wrong'); Q.testAnswer = got.join(p.typ === 'b' ? '' : ' '); return wrong(t); }
  renderPuzzle('wrong');
  wrong(t, () => {
    // Lösung zeigen
    Q.placed = solveOrder(p, want);
    Q.marks = want.map(() => 'sol');
    renderPuzzle('solution');
  }, () => {
    // nochmals: nur die falschen Teile zurück in den Vorrat
    const keep = [];
    for (let k = 0; k < Q.placed.length; k++) { if (Q.marks[k] === 'ok') keep.push(Q.placed[k]); else break; }
    Q.placed = keep; Q.marks = null; renderPuzzle();
  });
}
function solveOrder(p, want) {
  const used = new Set();
  return want.map(x => {
    const i = p.tiles.findIndex((tt, k) => !used.has(k) && (p.typ === 'b' ? tt : tt.t) === x);
    used.add(i); return i;
  });
}

/* ---- Tippen (eigene Tastatur, auch PC-Tastatur) ---- */
const KEYS = ['qwertzuiop', 'asdfghjkl\'', 'yxcvbnm'];
function renderTyping(state = '') {
  const a = document.getElementById('answer');
  a.innerHTML = `<div class="typed ${state}" lang="en" id="typed">${Q.input ? esc(Q.input) : ''}<i class="caret"></i></div>`;
  const foot = document.getElementById('qfoot');
  if (!foot.querySelector('.kbd')) {
    foot.innerHTML = `<div class="kbd" lang="en">${KEYS.map((r, ri) => `<div class="krow">${r.split('').map(c => `<button class="k" data-act="key" data-v="${c}">${c}</button>`).join('')}${ri === 2 ? `<button class="k fn" data-act="bksp" aria-label="Löschen">${ICON.del}</button>` : ''}</div>`).join('')}
      <div class="krow"><button class="k space" data-act="key" data-v=" ">Leerschlag</button><button class="k ok" data-act="ok" aria-label="Fertig">${ICON.check}</button></div></div>`;
  }
}
function typeKey(c) {
  if (!Q || Q.locked || Q.puzzle !== null || !document.getElementById('typed')) return;
  if (Q.input.length >= 40) return;
  if (c === ' ' && (!Q.input || Q.input.endsWith(' '))) return;
  Q.input += c; sfx.tap(); renderTyping();
}
function backspace() {
  if (!Q || Q.locked || !Q.input) return;
  Q.input = Q.input.slice(0, -1); sfx.tap(); renderTyping();
}
function submitTyping() {
  if (!Q || Q.locked || !document.getElementById('typed')) return;
  const t = cur(), w = WORD[t.id];
  if (!Q.input.trim()) { nope(document.getElementById('typed')); return; }
  if (L.isRight(w, Q.input)) { renderTyping('right'); return right(t); }
  if (t.kind === 'test') { Q.testAnswer = Q.input; renderTyping('wrong'); return wrong(t); }
  const near = L.closest(w, Q.input);
  renderTyping('wrong');
  wrong(t, () => {
    const d = L.diff(near.answer, Q.input);
    document.getElementById('answer').innerHTML = `<div class="typed diff" lang="en">${d.map(x => `<span class="d-${x.s}">${x.c === ' ' ? '&nbsp;' : esc(x.c)}</span>`).join('')}</div>
      <p class="solution" lang="en">${show(near.answer)}</p>`;
  }, () => { renderTyping(); }, near.dist === 1 ? 'Fast! Nur ein Buchstabe stimmt nicht.' : near.dist === 2 ? 'Fast! Zwei Buchstaben stimmen nicht.' : null);
}

/* ---- richtig / falsch ---- */
function right(t) {
  Q.locked = true;
  const first = Q.tries === 0 && !Q.hinted;
  Q.results[Q.i] = { first, id: t.id, kind: t.kind };
  record(t, first ? 'first' : 'second');
  Q.streak = first ? Q.streak + 1 : 0;
  setBao('bao_jubel');
  sfx.right(Q.streak);
  const fb = document.getElementById('fb');
  const serie = { 3: 'bao_serie_3', 5: 'bao_serie_5', 10: 'bao_serie_10' }[Q.streak];
  if (fb) { fb.className = 'fb good'; fb.textContent = serie ? `${Q.streak} richtig hintereinander!` : ['Super!', 'Well done!', 'Great!', 'Richtig!'][Math.floor(Math.random() * 4)]; }
  if (!reduced()) burst(document.querySelector('#qcard .right, #answer') || document.getElementById('qcard'), 10);
  if (t.kind === 'test') { timer = setTimeout(advance, 600); return; }
  // Das richtige Wort nochmals hören (ausser es wurde gerade vorgelesen), dann Lob
  const speakWord = !['karte', 'hoeren', 'waehlen_de'].includes(t.kind);
  Sound.say(speakWord ? [t.id] : []);
  bao([{ pause: 150 }, serie || line.lob()], true);
  timer = setTimeout(advance, speakWord ? 2000 : 1300);
}
/* Falsch: beim 1. Mal »nochmal« (retry), beim 2. Mal Lösung (solve) und »Weiter«. Im Wörtlitest gibt es nur einen Versuch. */
function wrong(t, solve, retry, msg) {
  Q.tries++;
  Q.streak = 0;
  sfx.wrong();
  nope(document.querySelector('#answer, #qcard .wrong'));
  const fb = document.getElementById('fb');
  if (t.kind === 'test') {
    Q.results[Q.i] = { first: false, id: t.id, kind: t.kind, answer: Q.testAnswer };
    record(t, 'wrong');
    Q.locked = true;
    timer = setTimeout(advance, 700);
    return;
  }
  if (Q.tries === 1) {
    Q.locked = true;
    setBao('bao_mut');
    if (fb) { fb.className = 'fb soft'; fb.textContent = msg || 'Nicht ganz. Versuch es nochmal!'; }
    bao(line.fast());
    setTimeout(() => { if (!Q || cur() !== t) return; Q.locked = false; if (retry) retry(); }, 1000);
    return;
  }
  Q.locked = true;
  Q.results[Q.i] = { first: false, id: t.id, kind: t.kind };
  record(t, 'wrong');
  setBao('bao_mut');
  if (solve) solve();
  if (fb) { fb.className = 'fb soft'; fb.innerHTML = 'So heisst es richtig:'; }
  Sound.say([...(voiceOn() ? ['bao_loesung'] : []), t.id]);
  // später in der Runde nochmals (höchstens 3 Wiederholungen)
  if (!t.repeat && Q.extra < 3 && Q.mode.typ !== 'test') { Q.list.push(Object.assign({}, t, { repeat: true, kind: t.kind === 'tippen' ? L.spellKind(WORD[t.id], 3, 'auto') : t.kind })); Q.extra++; }
  document.getElementById('qfoot').innerHTML = `<button class="btn primary big" data-act="next" id="next-btn"><span><b>Weiter</b></span>${ICON.next}</button>`;
  updateLeaves();
}
function record(t, result) {
  if (t.repeat && result !== 'wrong') result = 'second';           // Wiederholung zählt nicht doppelt
  const before = st(t.id).box;
  S.w[t.id] = L.record(st(t.id), t.kind, result, S.round, Date.now());
  save();
  return { before, after: S.w[t.id].box };
}
function advance() {
  clearTimeout(timer);
  if (!Q) return;
  if (cur().kind === 'karte' && !Q.results[Q.i]) { Q.results[Q.i] = { first: true, id: cur().id, kind: 'karte' }; record(cur(), 'first'); }
  Q.i++;
  if (Q.i >= Q.list.length) return finish();
  document.getElementById('qfoot').innerHTML = '';
  showTask();
  if (!Sound.busy()) autoSpeak(false); else autoSpeak(true);
}

function finish() {
  const done = Q.results.filter((r, i) => r && !Q.list[i].repeat && Q.list[i].kind !== 'karte');
  const firstRight = done.filter(r => r.first).length;
  const words = unitWords(S.unit);
  const newGrown = words.filter(w => Q.before[w.id] < L.MAX && st(w.id).box === L.MAX).map(w => w.id);
  const grew = words.filter(w => st(w.id).box > Q.before[w.id]).map(w => w.id);
  const res = { mode: Q.mode, firstRight, total: done.length, newGrown, grew, mistakes: [] };
  if (Q.mode.typ === 'test') {
    res.mistakes = Q.results.filter(r => r && !r.first).map(r => ({ id: r.id, answer: r.answer || '' }));
    S.tests.push({ unit: S.unit, t: Date.now(), right: firstRight, total: done.length });
  }
  save();
  Q = null;
  nav('result', { res });
  sfx.done();
  if (!reduced()) confetti(res.total && firstRight === res.total ? 70 : 40);
  bao([res.total && firstRight === res.total ? 'bao_perfekt' : line.fertig(), { pause: 300 }]);
  if (res.mode.typ === 'test' && res.mistakes.length) bao('bao_test_ueben', true);
  else if (newGrown.length) bao(grown(S.unit) === words.length ? 'bao_wald_voll' : 'bao_bambus', true);
}
function resultHTML(res) {
  const words = unitWords(S.unit), g = grown(S.unit);
  const pct = res.total ? res.firstRight / res.total : 0;
  const isTest = res.mode.typ === 'test';
  const msg = !res.total ? 'Gut gemacht!' : pct === 1 ? (isTest ? 'Alles richtig – super!' : 'Alles auf Anhieb richtig!') : pct >= 0.8 ? 'Super gemacht!' : pct >= 0.5 ? 'Gut gemacht!' : 'Geschafft! Übung macht den Panda stark.';
  const again = res.mode.typ === 'bao' ? 'start-bao' : isTest ? 'mode' : 'mode';
  return `<div class="screen result">
    <div class="res-top"><img class="res-bao" src="${img('bao_jubel')}" alt="Bao jubelt">
      <div class="res-text"><h1>${msg}</h1>
        ${res.total ? `<p class="res-count"><b>${res.firstRight}</b> von ${res.total} ${isTest ? 'richtig geschrieben' : 'beim ersten Mal richtig'}</p>` : ''}
        ${isTest ? `<p class="res-note">${res.total ? Math.round(100 * pct) : 0} % – ${pct >= 0.9 ? 'bereit für den Test in der Schule!' : pct >= 0.7 ? 'fast bereit. Übe die Wörter unten nochmals.' : 'übe die Wörter unten mit Bao, dann nochmals testen.'}</p>` : ''}
      </div></div>
    ${res.mistakes.length ? `<section class="mistakes"><h2>Diese Wörter nochmals üben</h2>
      ${res.mistakes.map(m => { const w = WORD[m.id]; return `<div class="mis">${picHTML(w.id, 'mini')}<div><p class="de">${esc(w.de)}</p>
        <p class="en" lang="en">${show(w.en)}</p>${m.answer ? `<p class="yours" lang="en">Deine Antwort: <s>${show(m.answer)}</s></p>` : ''}</div>
        <button class="snd-btn" data-act="say" data-id="${w.id}" aria-label="Anhören">${ICON.speaker}</button></div>`; }).join('')}
      <button class="btn primary" data-act="drill-mistakes">${ICON.pencil}<span>Diese ${res.mistakes.length} Wörter üben</span></button></section>` : ''}
    <section class="grow">
      <div class="grow-row">${(res.grew.length ? res.grew : []).slice(0, 12).map(id => `<span class="grow-w">${bambooSVG(st(id).box)}<span lang="en">${show(WORD[id].en)}</span></span>`).join('')}</div>
      <p>${res.newGrown.length ? `<b>${res.newGrown.length} ${res.newGrown.length === 1 ? 'Bambus ist' : 'Bambusse sind'} ausgewachsen!</b> ` : res.grew.length ? `${res.grew.length} ${res.grew.length === 1 ? 'Bambus ist' : 'Bambusse sind'} gewachsen. ` : ''}Im Bambuswald: ${g} von ${words.length}.</p>
      <div class="progress"><i style="width:${(100 * g / words.length).toFixed(1)}%"></i></div>
    </section>
    <div class="res-actions">
      <button class="btn primary big" data-act="${again}" ${again === 'mode' ? `data-mode="${isTest ? 'test' : res.mode.drill}"` : ''}>${ICON.again}<span><b>Nochmal</b></span></button>
      <button class="btn" data-act="wald">${bambooSVG(5, 'btn-bmb')}<span>Bambuswald</span></button>
      <button class="btn" data-act="home">${ICON.back}<span>Übersicht</span></button>
    </div>
  </div>`;
}

/* ------------------------------------------------------------ Lernkarten */
let karteI = 0;
function kartenHTML() {
  const words = unitWords(S.unit), w = words[karteI % words.length];
  return `<div class="screen karten">
    <header class="bar"><button class="icon-btn" data-act="home" aria-label="Zurück">${ICON.back}</button><h1 class="bar-title">Lernkarten</h1>
      <span class="count">${karteI + 1}/${words.length}</span><button class="icon-btn" data-act="liste" aria-label="Alle Wörter als Liste">${ICON.list}</button></header>
    <section class="flash" style="--u:${UNIT[S.unit].farbe}">
      ${picHTML(w.id, 'big')}
      <p class="en" lang="en">${show(w.en)}</p>${soundBtns(w.id, w.typ === 'wort')}<p class="de">${esc(w.de)}</p>
      <p class="lvl">${bambooSVG(st(w.id).box, 'lvl-bmb')}<span>${LEVEL[st(w.id).box]}</span></p>
    </section>
    <div class="flash-nav">
      <button class="btn" data-act="karte-prev">${ICON.prev}<span>Zurück</span></button>
      <button class="btn primary" data-act="karte-next"><span>Weiter</span>${ICON.next}</button>
    </div>
  </div>`;
}
function afterKarte() {
  const w = unitWords(S.unit)[karteI];
  if (st(w.id).box === 0) { S.w[w.id] = L.record(st(w.id), 'karte', 'first', S.round, Date.now()); save(); }
  if (S.settings.autoplay) Sound.say([{ pause: 150 }, w.id]);
}
function listeHTML() {
  return `<div class="sheet-head"><h2>Alle Wörter · ${UNIT[S.unit].titel}</h2><button class="icon-btn" data-act="close-sheet" aria-label="Schliessen">${ICON.close}</button></div>
  <div class="sheet-body liste">${unitWords(S.unit).map((w, i) => `<div class="li">${bambooSVG(st(w.id).box, 'li-bmb')}
    <button class="li-main" data-act="karte-go" data-i="${i}"><span class="en" lang="en">${show(w.en)}</span><span class="de">${esc(w.de)}</span></button>
    <button class="snd-btn" data-act="say" data-id="${w.id}" aria-label="Anhören">${ICON.speaker}</button></div>`).join('')}</div>`;
}

/* ---------------------------------------------------------------- Memory */
function startMemory() {
  const deck = L.memoryDeck(unitWords(S.unit), 6);
  Q = { memory: true, deck, open: [], found: new Set(), moves: 0, locked: false };
  deck.forEach(c => { new Image().src = img(c.id); });
  Sound.preload(deck.map(c => c.id));
  nav('memory');
  bao('bao_modus_memory');
}
function memoryHTML() {
  return `<div class="screen memory">
    <header class="bar"><button class="icon-btn" data-act="quit" aria-label="Beenden">${ICON.close}</button><h1 class="bar-title">Memory</h1>
      <span class="count" id="moves">${Q.moves} Züge</span></header>
    <p class="mem-hint">Finde zu jedem Bild das englische Wort.</p>
    <section class="mem-grid">${Q.deck.map((c, i) => `<button class="mcard ${Q.found.has(c.id) ? 'found open' : Q.open.includes(i) ? 'open' : ''}" data-act="flip" data-i="${i}" aria-label="Karte ${i + 1}">
      <span class="mback"><img src="icons/favicon.png" alt=""></span>
      <span class="mfront">${c.side === 'bild' ? `<img src="${img(c.id)}" alt="">` : `<b lang="en">${show(WORD[c.id].en)}</b>`}</span></button>`).join('')}</section>
  </div>`;
}
function flip(i) {
  if (!Q || !Q.memory || Q.locked) return;
  const c = Q.deck[i];
  if (Q.found.has(c.id) || Q.open.includes(i)) return;
  Q.open.push(i);
  sfx.flip();
  const el = document.querySelector(`.mcard[data-i="${i}"]`);
  if (el) el.classList.add('open');
  if (c.side === 'wort') sayWord(c.id);
  if (Q.open.length < 2) return;
  Q.moves++;
  document.getElementById('moves').textContent = `${Q.moves} Züge`;
  const [a, b] = Q.open.map(k => Q.deck[k]);
  if (a.id === b.id) {
    Q.found.add(a.id); Q.open = [];
    document.querySelectorAll(`.mcard`).forEach(m => { if (Q.deck[+m.dataset.i].id === a.id) m.classList.add('found'); });
    if (st(a.id).box === 0) { S.w[a.id] = L.record(st(a.id), 'karte', 'first', S.round, Date.now()); save(); }
    setTimeout(() => { sfx.right(Q.found.size); if (c.side !== 'wort') sayWord(a.id); }, 250);
    if (Q.found.size === 6) {
      setTimeout(() => { sfx.done(); if (!reduced()) confetti(50); bao('bao_memory_fertig'); }, 900);
      setTimeout(() => { if (Q && Q.memory) openSheet('mem-done', memDoneHTML()); }, 1600);
    } else bao([{ pause: 600 }, 'bao_memory_paar'], true);
    return;
  }
  Q.locked = true;
  setTimeout(() => {
    if (!Q || !Q.memory) return;
    Q.open.forEach(k => { const m = document.querySelector(`.mcard[data-i="${k}"]`); if (m) m.classList.remove('open'); });
    Q.open = []; Q.locked = false;
  }, 1300);
}
const memDoneHTML = () => `<div class="sheet-head"><h2>Alle Paare gefunden!</h2></div><div class="sheet-body center">
  <img class="sheet-bao" src="${img('bao_jubel')}" alt=""><p class="confirm-text">Du hast ${Q ? Q.moves : ''} Züge gebraucht.</p>
  <div class="confirm-actions"><button class="btn" data-act="home">Übersicht</button><button class="btn primary" data-act="mode" data-mode="memory">${ICON.again}<span>Nochmal</span></button></div></div>`;

/* ----------------------------------------------------------- Bambuswald */
function waldHTML() {
  const words = unitWords(S.unit), g = grown(S.unit);
  // Plätze: drei Reihen hinten (klein) bis vorne (gross), rechts von Bao, leicht versetzt, damit der Wald natürlich aussieht
  const rows = [0.66, 0.8, 0.95], perRow = Math.ceil(words.length / rows.length);
  const stalks = words.map((w, i) => {
    const r = i % rows.length, k = Math.floor(i / rows.length);
    const x0 = r === 0 ? 8 : 24, span = 96 - x0;
    const x = x0 + (k + (r % 2 ? 0.5 : 0.15)) * (span / perRow) + ((i * 37) % 5) - 2;
    const y = rows[r] * 100, scale = 0.7 + r * 0.15;
    return `<button class="stalk" data-act="stalk" data-id="${w.id}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;--s:${scale.toFixed(2)};z-index:${r + 1}" aria-label="${esc(w.en)}: ${LEVEL[st(w.id).box]}">${bambooSVG(st(w.id).box)}</button>`;
  }).join('');
  return `<div class="screen wald">
    <header class="bar"><button class="icon-btn" data-act="home" aria-label="Zurück">${ICON.back}</button><h1 class="bar-title">Bambuswald</h1><span class="count">${g}/${words.length}</span></header>
    <p class="wald-intro">Jedes Wort ist ein Bambus. Er wächst, wenn du das Wort erkennst und schreiben kannst – ganz gross ist er, wenn das Wort sicher sitzt. Tippe auf einen Bambus.</p>
    <section class="forest" style="background-image:url(${img('wald')})">${stalks}<img class="forest-bao" src="${img(g === words.length ? 'bao_jubel' : 'bao_isst')}" alt="Bao"></section>
    <div class="wald-legend">${[0, 1, 2, 3, 4, 5].map(b => `<span>${bambooSVG(b)}<small>${b === 0 ? 'neu' : b === 5 ? 'sicher' : b}</small></span>`).join('')}</div>
  </div>`;
}
function stalkSheetHTML(id) {
  const w = WORD[id], b = st(id).box;
  return `<div class="sheet-head"><h2 lang="en">${show(w.en)}</h2><button class="icon-btn" data-act="close-sheet" aria-label="Schliessen">${ICON.close}</button></div>
  <div class="sheet-body center word-sheet">${picHTML(id, 'big')}${soundBtns(id, w.typ === 'wort')}<p class="de">${esc(w.de)}</p>
    <p class="lvl">${bambooSVG(b, 'lvl-bmb')}<span>Stufe ${b} von 5: ${LEVEL[b]}</span></p></div>`;
}

/* --------------------------------------------------------- Einstellungen */
let sheetOpen = null;
function openSheet(n, html) {
  sheetOpen = n;
  sheetRoot.innerHTML = `<div class="sheet-bg" data-act="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  requestAnimationFrame(() => sheetRoot.classList.add('open'));
}
function closeSheet(now) {
  if (!sheetOpen) return;
  sheetOpen = null;
  sheetRoot.classList.remove('open');
  if (now) sheetRoot.innerHTML = ''; else setTimeout(() => { if (!sheetOpen) sheetRoot.innerHTML = ''; }, 260);
}
const sw = (key, label, sub) => `<div class="set-row"><div><div class="set-label">${label}</div>${sub ? `<div class="set-sub">${sub}</div>` : ''}</div>
  <button class="switch" role="switch" aria-checked="${!!S.settings[key]}" data-act="toggle" data-key="${key}" aria-label="${label}"><i></i></button></div>`;
const seg = (key, opts) => `<div class="seg" role="radiogroup">${opts.map(([v, l]) => `<button role="radio" aria-checked="${S.settings[key] === v}" data-act="seg" data-key="${key}" data-v="${v}">${l}</button>`).join('')}</div>`;
function settingsHTML() {
  return `<div class="sheet-head"><h2>Einstellungen</h2><button class="icon-btn" data-act="close-sheet" aria-label="Schliessen">${ICON.close}</button></div>
  <div class="sheet-body">
    <section class="set-group"><h3>Name</h3>
      <input class="name-in" id="name-in" type="text" maxlength="20" autocomplete="off" placeholder="Wie heisst du?" value="${esc(S.settings.name)}">
      <p class="set-note">Bao schreibt deinen Namen auf die Startseite. Er bleibt nur auf diesem Gerät.</p></section>
    <section class="set-group"><h3>Üben</h3>
      <div class="set-row col"><div class="set-label">Aufgaben pro Runde mit Bao</div>${seg('length', [[10, '10'], [15, '15'], [20, '20']])}</div>
      <div class="set-row col"><div class="set-label">Schreiben</div>${seg('hilfe', [['auto', 'Automatisch'], ['puzzle', 'Immer Puzzle'], ['tastatur', 'Immer Tastatur']])}
        <div class="set-sub">Automatisch: zuerst mit Buchstaben-Puzzle, wenn das Wort sitzt mit der Tastatur.</div></div>
      <div class="set-row col"><div class="set-label">Wörtlitest</div>${seg('testLength', [[10, '10 Wörter'], [20, '20 Wörter'], [0, 'Alle Wörter']])}</div>
    </section>
    <section class="set-group"><h3>Ton</h3>
      ${sw('autoplay', 'Wörter automatisch vorlesen')}
      ${sw('voice', 'Bao spricht', 'Lob und Hilfe auf Englisch')}
      ${sw('sounds', 'Klänge')}
      <button class="btn" data-act="test-sound">${ICON.speaker}<span>Ton testen</span></button>
    </section>
    <div id="install-set">${installSetHTML()}</div>
    <section class="set-group"><h3>Fortschritt</h3>
      <p class="set-note">${S.round} ${S.round === 1 ? 'Runde' : 'Runden'} geübt${S.tests.length ? ` · letzter Wörtlitest: ${S.tests[S.tests.length - 1].right} von ${S.tests[S.tests.length - 1].total}` : ''}.</p>
      <button class="btn danger" data-act="reset">Alles zurücksetzen</button>
    </section>
    <p class="version">Wörtli-Panda · Stand ${esc(window.BUILD || 'dev')} · Stimme: ElevenLabs · Bilder: OpenAI · Schriften: Nunito, Andika (SIL OFL)</p>
  </div>`;
}
const confirmHTML = (title, text, yes, act) => `<div class="sheet-head"><h2>${title}</h2></div><div class="sheet-body"><p class="confirm-text">${text}</p>
  <div class="confirm-actions"><button class="btn" data-act="close-sheet">Abbrechen</button><button class="btn danger" data-act="${act}">${yes}</button></div></div>`;

/* --------------------------------------------------------------- Effekte */
function nope(el) { if (!el || reduced()) return; el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); }
const FX_COLORS = ['#6CB85C', '#FFC93C', '#F7A8B8', '#8CC8EE', '#2B2F33'];
function burst(el, n) {
  if (!el) return;
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 60;
    p.className = 'spark';
    p.style.cssText = `left:${cx}px;top:${cy}px;background:${FX_COLORS[i % FX_COLORS.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
    fxRoot.appendChild(p); setTimeout(() => p.remove(), 800);
  }
}
function confetti(n) {
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = 'conf';
    p.style.cssText = `left:${Math.random() * 100}vw;background:${FX_COLORS[i % FX_COLORS.length]};--d:${1.6 + Math.random() * 1.4}s;--x:${(Math.random() - 0.5) * 160}px;--r:${Math.random() * 720}deg;animation-delay:${Math.random() * 0.5}s`;
    fxRoot.appendChild(p); setTimeout(() => p.remove(), 3600);
  }
}

/* ---------------------------------------------------------------- Tippen */
app.addEventListener('click', onClick);
sheetRoot.addEventListener('click', onClick);
sheetRoot.addEventListener('input', e => { if (e.target.id === 'name-in') { S.settings.name = e.target.value.slice(0, 20); save(); } });
function onClick(e) {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const act = b.dataset.act;
  switch (act) {
    case 'hello': case 'bao': {
      sfx.tap();
      const t = document.querySelector('.hero-bao img');
      if (t && !reduced()) { t.classList.remove('bounce'); void t.offsetWidth; t.classList.add('bounce'); }
      Sound.say(line.hallo());
      break;
    }
    case 'start-bao': sfx.tap(); startBao(); break;
    case 'mode': {
      sfx.tap();
      const m = b.dataset.mode;
      if (m === 'karten') { karteI = 0; nav('karten'); if (voiceOn() && S.settings.autoplay) Sound.say(['bao_modus_karten', { pause: 200 }, unitWords(S.unit)[0].id]); }
      else if (m === 'memory') startMemory();
      else if (m === 'test') startTest();
      else startDrill(m);
      break;
    }
    case 'unit': S.unit = +b.dataset.unit; save(); nav('home', {}, false); break;
    case 'wald':
      sfx.tap(); nav('wald');
      if (!S.waldSeen) { S.waldSeen = true; save(); bao('bao_wald'); }
      break;
    case 'stalk': sfx.sparkle(); openSheet('stalk', stalkSheetHTML(b.dataset.id)); sayWord(b.dataset.id); break;
    case 'settings': sfx.tap(); openSheet('settings', settingsHTML()); break;
    case 'close-sheet': closeSheet(); if (view.name === 'home') render(); break;
    case 'home': sfx.tap(); nav('home'); break;
    case 'say': sayWord(b.dataset.id, false); break;
    case 'say-slow': sayWord(b.dataset.id, true); break;
    case 'spell': spell(b.dataset.id); if (Q && view.name === 'task') Q.hinted = true; break;
    case 'choice': choose(b.dataset.id, b); break;
    case 'place': place(+b.dataset.i); break;
    case 'unplace': unplace(+b.dataset.i); break;
    case 'key': typeKey(b.dataset.v); break;
    case 'bksp': backspace(); break;
    case 'ok': submitTyping(); break;
    case 'next': Sound.stop(); advance(); break;
    case 'quit':
      sfx.tap();
      openSheet('quit', confirmHTML('Beenden?', 'Was du schon geübt hast, bleibt gespeichert.', 'Beenden', 'quit-yes'));
      break;
    case 'quit-yes': Q = null; Sound.stop(); nav('home'); break;
    case 'drill-mistakes': startDrill('schreiben', view.res.mistakes.map(m => m.id)); break;
    case 'karte-next': case 'karte-prev': {
      const n = unitWords(S.unit).length;
      karteI = (karteI + (act === 'karte-next' ? 1 : n - 1)) % n;
      sfx.flip(); render();
      break;
    }
    case 'liste': openSheet('liste', listeHTML()); break;
    case 'karte-go': karteI = +b.dataset.i; closeSheet(true); render(); break;
    case 'flip': flip(+b.dataset.i); break;
    case 'toggle': {
      const key = b.dataset.key, val = !S.settings[key];
      S.settings[key] = val; save(); sfx.tap();
      b.setAttribute('aria-checked', String(val));
      if (!val && key === 'voice') Sound.stop();
      break;
    }
    case 'seg': {
      const key = b.dataset.key, v = ['length', 'testLength'].includes(key) ? +b.dataset.v : b.dataset.v;
      S.settings[key] = v; save(); sfx.tap();
      b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x === b)));
      break;
    }
    case 'test-sound': sfx.right(3); setTimeout(() => Sound.say(['bao_hallo_02', { pause: 200 }, 'u1_smell']), 350); break;
    case 'reset': openSheet('reset', confirmHTML('Alles zurücksetzen?', 'Der ganze Bambuswald und alle Lernstände werden gelöscht. Das lässt sich nicht rückgängig machen.', 'Zurücksetzen', 'reset-yes')); break;
    case 'reset-yes': S.w = {}; S.round = 0; S.tests = []; save(); closeSheet(true); nav('home', {}, false); break;
    case 'hint-close': S.hintClosed = true; save(); refreshInstall(); break;
    case 'install': {
      const ev = installEvent;
      if (!ev) break;
      installEvent = null;
      try { ev.prompt(); ev.userChoice.then(c => { if (c && c.outcome === 'accepted') { S.installed = true; save(); } refreshInstall(); }).catch(refreshInstall); } catch (err) { refreshInstall(); }
      break;
    }
  }
}
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target && e.target.tagName === 'INPUT') return;
  if (e.key === 'Escape' && sheetOpen) { closeSheet(); e.preventDefault(); return; }
  if (sheetOpen) return;
  if (view.name === 'karten') {
    if (e.key === 'ArrowRight') onClick({ target: document.querySelector('[data-act="karte-next"]') });
    if (e.key === 'ArrowLeft') onClick({ target: document.querySelector('[data-act="karte-prev"]') });
    return;
  }
  if (view.name !== 'task' || !Q) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    if (document.getElementById('next-btn')) { Sound.stop(); advance(); } else submitTyping();
    return;
  }
  if (!document.getElementById('typed')) {
    // Puzzle mit der PC-Tastatur: den nächsten passenden Buchstaben nehmen
    if (Q.puzzle && Q.puzzle.typ === 'b' && /^[a-z]$/i.test(e.key)) {
      const i = Q.puzzle.tiles.findIndex((c, k) => c === e.key.toLowerCase() && !Q.placed.includes(k));
      if (i >= 0) place(i);
      e.preventDefault();
    } else if (e.key === 'Backspace' && Q.puzzle && Q.placed.length) { unplace(Q.placed.length - 1); e.preventDefault(); }
    return;
  }
  if (/^[a-z' ]$/i.test(e.key)) { typeKey(e.key.toLowerCase()); e.preventDefault(); }
  else if (e.key === 'Backspace') { backspace(); e.preventDefault(); }
});

/* ================================================================== Start */
try { history.replaceState({ name: 'home' }, ''); } catch (e) { /* file:// */ }
render();
['bao_denkt', 'bao_jubel', 'bao_mut'].forEach(n => { new Image().src = img(n); });

if ('serviceWorker' in navigator && window.BUILD !== 'dev' && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    if (['task', 'result', 'memory'].includes(view.name)) reloadPending = true; else location.reload();
  });
}
})();
