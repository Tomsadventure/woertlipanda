/* Wörtli-Panda – Bereich «Deutsch: Verben mit Mio», dem roten Panda (4. Klasse; seit 2026-11-16).
   Eigenes Modul: Bildschirme und Übungen der Verben. Der Lern-Kern steht in verben_kern.js, die Verben in verben_daten.js.
   Angehängt an die App über window.PANDA (Werkzeuge von app.js) und window.PANDA_EXT (Bildschirme, Knöpfe, Tasten).
   Lernziele der Schule: 1 Verben im Text erkennen (Verben-Jagd) · 2 Präsens, Präteritum, Perfekt kennen und setzen
   (Welche Zeit?, Verwandeln) · 3 unregelmässige Verben konjugieren (Lernkarten, Wählen, Schreiben, Konjugieren, Verbentest). */
(() => {
'use strict';
const P = window.PANDA, X = window.PANDA_EXT, K = window.VerbenKern, D = window.VERBEN;
if (!P || !X || !K || !D) return;
const VERB = Object.fromEntries(D.verben.map(v => [v.id, v]));
const { esc, ICON, sfx, img } = P;
const G = n => D.verben.filter(v => v.g === n);
/* Mios Stimme (Deutsch): nur, wenn alle Tondateien da sind (verben_daten.py setzt ton). sag = Verben und Sätze (immer, wenn man
   sie antippt oder sie zur Aufgabe gehören), mioSagt = Lob und Hilfe (nur wenn «Bao spricht» in den Einstellungen an ist). */
const TON = !!D.ton;
const sag = (namen, anhaengen) => { if (TON) P.Sound.say(namen, anhaengen); };
const mioSagt = (namen, anhaengen) => { if (TON && P.voiceOn()) P.Sound.say(namen, anhaengen); };
const einer = (name, n) => `${name}_0${1 + Math.floor(Math.random() * n)}`;
const tonBtn = (name, label) => (TON ? `<button class="snd-btn vsnd" data-act="v-sag" data-n="${name}" aria-label="${label}">${ICON.speaker}</button>` : '');

/* ================================================================ Speicher (in woertlipanda.v1 unter »verben«) */
function SV() {
  const S = P.S;
  if (!S.verben || typeof S.verben !== 'object') S.verben = {};
  const s = S.verben;
  if (!s.t || typeof s.t !== 'object') s.t = {};               // Teil (Verb.Zeit) -> Lernstand
  if (!s.e || typeof s.e !== 'object') s.e = {};               // im Einstieg schon gefragt
  s.runde = s.runde || 0;
  s.base = s.base || 0;                                        // Lernpunkte aus dem Einstieg: zählen nicht für Sticker
  s.wahl = [1, 2, 'alle'].includes(s.wahl) ? s.wahl : 1;       // Gruppe für die einzelnen Übungen
  if (!Array.isArray(s.tests)) s.tests = [];
  return s;
}
const gewaehlt = () => (SV().wahl === 'alle' ? D.verben : G(SV().wahl));
const wahlName = () => (SV().wahl === 'alle' ? 'Alle Verben' : `Gruppe ${SV().wahl}`);
function buche(v, zeit, art, ergebnis) {
  const s = SV(), k = K.key(v, zeit), vorher = K.stand(s, v, zeit).box;
  s.t[k] = K.record(K.stand(s, v, zeit), art, ergebnis, s.runde, Date.now());
  if (art === 'einstieg') { s.e[k] = 1; s.base += s.t[k].box - vorher; }
  P.save();
}

/* ================================================================ Bausteine */
const zeitChip = z => `<span class="vchip z-${z}">${K.ZEIT_NAME[z]}</span>`;
const mio = pose => img(`mio_${pose}`);
function tabelleHTML(v, nur) {
  return `<div class="vtab ${nur ? 'eins' : ''}">${(nur ? [nur] : K.ZEITEN).map(z => `<div class="vt-block z-${z}">
    <h4>${K.ZEIT_NAME[z]}${tonBtn(`${v.id}_${z}`, `${K.ZEIT_NAME[z]} anhören`)}</h4>
    <div class="vt-grid">${[0, 1, 2, 3, 4, 5].map(p => `<span class="vt-f"><i>${K.PERS_ZEIGEN[p]}</i> <b>${esc(K.form(v, z, p))}</b></span>`).join('')}</div>
  </div>`).join('')}</div>`;
}
const satzHTML = (v, i, z) => `<p class="vsatz" ${TON ? `data-act="v-sag" data-n="${v.id}_s${i}_${z}" role="button"` : ''}>${K.satz(v, i, z).woerter.map(w => (w.verb ? `<b class="z-${z}">${esc(w.t)}</b>` : esc(w.t))).join(' ')}.</p>`;
const gruppeBadge = v => `<span class="vgr g${v.g}">${v.g === 1 ? 'Gruppe 1 · muss sitzen' : 'Gruppe 2'}</span>`;
function kartenInhalt(v) {
  return `<div class="vk-kopf"><h2 class="vinf">${esc(v.inf)}</h2>${tonBtn(v.id, 'Verb anhören')}${gruppeBadge(v)}</div>
    ${tabelleHTML(v)}
    <div class="vsaetze">${K.ZEITEN.map(z => satzHTML(v, 0, z)).join('')}</div>`;
}

/* ================================================================ Startseite des Bereichs */
function bannerHTML() {                                          // Kachel auf der Startseite der App
  const n = K.sichere(D.verben, SV());
  return `<button class="mio-banner" data-act="v-auf" aria-label="Deutsch: Verben mit Mio, dem roten Panda">
    <img src="${mio('hallo')}" alt=""><span class="mio-banner-t"><b>Deutsch: Verben mit Mio</b>
    <small>32 unregelmässige Verben · ${n} sicher</small></span>${ICON.fwd}</button>`;
}
function vorschau() {
  const s = SV(), tasks = K.buildSession(D.verben, s, { length: P.S.settings.length, runde: s.runde + 1 });
  const neu = tasks.filter(t => t.art === 'karte').length;
  return `${tasks.length} Aufgaben${neu ? ` · ${neu === 1 ? '1 neues Verb' : `${neu} neue Verben`}` : ''}`;
}
const MODI = [
  { k: 'karten', t: 'Lernkarten', s: 'Alle Formen anschauen', ic: 'cards' },
  { k: 'waehlen', t: 'Wählen', s: 'Welche Form stimmt?', ic: 'choose' },
  { k: 'form', t: 'Schreiben', s: 'Eine Form schreiben', ic: 'pencil' },
  { k: 'reihe', t: 'Konjugieren', s: 'Ich, du, er … alle sechs', ic: 'list' },
  { k: 'jagd', t: 'Verben-Jagd', s: 'Verben im Text finden', ic: 'ear' },
  { k: 'zeit', t: 'Welche Zeit?', s: 'Präsens, Präteritum, Perfekt', ic: 'choose' },
  { k: 'satz', t: 'Verwandeln', s: 'Satz in eine andere Zeit', ic: 'again' },
  { k: 'test', t: 'Verbentest', s: 'Wie in der Schule', ic: 'test' },
];
function gruppeKarte(n, titel, sub) {
  const vs = G(n), si = K.sichere(vs, SV()), pts = K.punkte(vs, SV()), max = K.maxPunkte(vs);
  return `<section class="vgruppe g${n}"><div><h3>${titel} <span>${sub}</span></h3>
    <div class="progress" aria-label="${si} von ${vs.length} Verben sicher"><i style="width:${(100 * pts / max).toFixed(1)}%"></i></div>
    <p class="unit-sub">${si} von ${vs.length} Verben sicher · ${pts} von ${max} Lernpunkten</p></div></section>`;
}
function homeHTML() {
  const s = SV(), nm = P.name(), offen = K.einstiegOffen(G(1), s), offen2 = K.einstiegOffen(G(2), s);
  const g1fertig = K.sichere(G(1), s) === G(1).length;
  const einstieg = offen > 0
    ? `<button class="btn primary big" data-act="v-einstieg" data-g="1"><span><b>Was kannst du schon?</b><small>${offen === 45 ? '45 Formen · etwa 10 Minuten' : `noch ${offen} Formen`}</small></span>${ICON.next}</button>
       <button class="btn vbtn2" data-act="v-mio"><span>Gleich üben mit Mio</span>${ICON.fwd}</button>`
    : `<button class="btn primary big" data-act="v-mio"><span><b>Üben mit Mio</b><small>${vorschau()}</small></span>${ICON.next}</button>
       ${offen2 > 0 && K.dran(D.verben, s, 'auto').length > G(1).length ? `<button class="btn vbtn2" data-act="v-einstieg" data-g="2"><span>Was kannst du schon von Gruppe 2?</span>${ICON.fwd}</button>` : ''}`;
  const seg = [[1, 'Gruppe 1'], [2, 'Gruppe 2'], ['alle', 'Alle']].map(([w, l]) => `<button role="radio" aria-checked="${s.wahl === w}" data-act="v-wahl-g" data-v="${w}">${l}</button>`).join('');
  return `<div class="screen home vhome">
    <header class="bar">
      <button class="icon-btn" data-act="home" aria-label="Zurück zur Startseite">${ICON.back}</button>
      <h1 class="bar-title">Verben mit Mio</h1>
      <div class="bar-right"><button class="pill" data-act="v-liste" aria-label="Meine Verben: ${K.sichere(D.verben, s)} von 32 sicher">${P.bambooSVG(5, 'pill-bmb')}<span class="pill-t">Meine Verben</span><b>${K.sichere(D.verben, s)}/32</b></button></div>
    </header>
    <section class="hero vhero">
      <button class="hero-bao" data-act="v-hallo" aria-label="Mio antippen"><img src="${mio('hallo')}" alt="Mio, der rote Panda, winkt"></button>
      <div class="bubble">
        <p class="bubble-hi">Hallo${nm ? ` ${esc(nm)}` : ''}! Ich bin Mio.</p>
        <p>Wir üben die <b>unregelmässigen Verben</b>: Präsens, Präteritum und Perfekt.${g1fertig ? ' Gruppe 1 sitzt – super!' : ''}</p>
        ${einstieg}
      </div>
    </section>
    ${gruppeKarte(1, 'Gruppe 1', 'Diese 15 Verben müssen sitzen')}
    ${gruppeKarte(2, 'Gruppe 2', '17 Verben für Profis')}
    ${hausBannerHTML()}
    <div class="vwahl"><span>Einzeln üben mit:</span><div class="seg" role="radiogroup">${seg}</div></div>
    <section class="modes vmodes">
      ${MODI.map(m => `<button class="mode" data-act="v-modus" data-mode="${m.k}"><span class="mode-ic">${ICON[m.ic]}</span><span class="mode-t">${m.t}</span><span class="mode-s">${m.s}</span></button>`).join('')}
    </section>
    <footer class="foot">Deutsch 4. Klasse · 32 unregelmässige Verben · alle Formen in drei Zeiten</footer>
  </div>`;
}
function listeHTML() {
  const s = SV();
  const zeile = v => `<button class="vl-row" data-act="v-karte-zeigen" data-id="${v.id}"><span class="vl-inf">${esc(v.inf)}</span>
    <span class="vl-st">${K.ZEITEN.map(z => `<span class="vl-z z-${z}" title="${K.ZEIT_NAME[z]}">${P.bambooSVG(K.stand(s, v, z).box)}</span>`).join('')}</span></button>`;
  return `<div class="sheet-head"><h2>Meine Verben</h2><button class="icon-btn" data-act="close-sheet" aria-label="Schliessen">${ICON.close}</button></div>
    <div class="sheet-body"><p class="set-note">Je Verb drei Bambus: ${K.ZEITEN.map(z => zeitChip(z)).join(' ')} – ausgewachsen heisst sicher. Tippe ein Verb an.</p>
      <h3 class="vl-h">Gruppe 1 · muss sitzen</h3><div class="vl">${G(1).map(zeile).join('')}</div>
      <h3 class="vl-h">Gruppe 2</h3><div class="vl">${G(2).map(zeile).join('')}</div></div>`;
}

/* ================================================================ Lernkarten */
let kI = 0;
function kartenHTML() {
  const vs = gewaehlt(); kI = Math.min(kI, vs.length - 1);
  const v = vs[kI];
  return `<div class="screen vkarten">
    <header class="bar"><button class="icon-btn" data-act="v-auf" aria-label="Zurück">${ICON.back}</button>
      <h1 class="bar-title">Lernkarten <span class="vk-n">${kI + 1} / ${vs.length} · ${wahlName()}</span></h1></header>
    <section class="qcard vkarte">${kartenInhalt(v)}
      <div class="vsaetze eigen">${satzHTML(v, 1, 'pr')}${satzHTML(v, 1, 'pt')}${satzHTML(v, 1, 'pf')}</div></section>
    <div class="vk-nav"><button class="btn" data-act="v-k-prev" aria-label="Vorheriges Verb">${ICON.prev}</button>
      <button class="btn primary" data-act="v-k-next"><span>Nächstes Verb</span>${ICON.next}</button></div>
  </div>`;
}
function karteGesehen() {
  const v = gewaehlt()[kI];
  if (v) K.ZEITEN.forEach(z => { if (K.stand(SV(), v, z).box === 0) buche(v, z, 'karte', 'first'); });
}

/* ================================================================ Übungen
   Q.modus: { typ: 'mio' | 'drill' | 'test' | 'einstieg', art } – Q.list: [{ art, v, zeit, p, … }] */
let Q = null, tv = null;
const TITEL = { mio: 'Üben mit Mio', test: 'Verbentest', einstieg: 'Was kannst du schon?' };
const cur = () => Q.list[Q.i];
function start(modus, list) {
  if (!list.length) return;
  const s = SV(); s.runde++; P.save();
  Q = { modus, list, i: 0, tries: 0, input: '', rows: null, row: 0, results: [], streak: 0, maxStreak: 0, locked: false,
    vorher: K.punkte(D.verben, s), sicherVorher: K.sichere(D.verben, s) };
  if (TON) P.Sound.preload(['mio_lob_01', 'mio_lob_02', 'mio_fast_01', 'mio_loesung'].concat(list.slice(0, 12).flatMap(t => (t.zeit ? [`${t.v}_${t.zeit}`] : [t.v]))));
  P.Sound.stop();
  mioSagt([modus.typ === 'mio' ? einer('mio_los', 2) : modus.typ === 'einstieg' ? 'mio_einstieg' : modus.typ === 'test' ? 'mio_modus_test' : `mio_modus_${modus.art}`, { pause: 250 }]);
  P.nav('vtask');
}
function startMio() { const s = SV(); start({ typ: 'mio' }, K.buildSession(D.verben, s, { length: P.S.settings.length, runde: s.runde + 1 })); }
function startEinstieg(g) { start({ typ: 'einstieg', g }, K.buildEinstieg(G(g), SV())); }
function startTest() { start({ typ: 'test' }, K.buildTest(gewaehlt(), SV(), 10)); }
function startDrill(art) {
  const vs = gewaehlt();
  if (art === 'jagd') return start({ typ: 'drill', art }, jagdListe(vs, 6));
  if (art === 'zeit') return start({ typ: 'drill', art }, K.shuffle(vs.slice()).slice(0, 10).map(v => ({ art: 'zeit', v: v.id, zeit: K.ZEITEN[Math.floor(Math.random() * 3)], si: Math.floor(Math.random() * 2) })));
  if (art === 'satz') return start({ typ: 'drill', art }, satzListe(vs, 8));
  start({ typ: 'drill', art }, K.buildDrill(vs, SV(), art, { length: art === 'reihe' ? 6 : 10 }));
}
/* Verben-Jagd: je Aufgabe drei Sätze in verschiedenen Zeiten; alle Verben antippen (im Perfekt beide Teile) */
function jagdListe(vs, n) {
  const pool = K.shuffle(vs.slice()), out = [];
  for (let i = 0; i < n; i++) {
    const drei = [0, 1, 2].map(k => pool[(i * 3 + k) % pool.length]);
    const zeiten = K.shuffle(K.ZEITEN.slice());
    out.push({ art: 'jagd', v: drei[0].id, saetze: drei.map((v, k) => ({ v: v.id, zeit: zeiten[k], si: Math.floor(Math.random() * 2) })) });
  }
  return out;
}
/* Verwandeln: ein Satz in einer Zeit, dieselbe Aussage in einer anderen Zeit schreiben (nur das Verb, im Perfekt zwei Wörter) */
function satzListe(vs, n) {
  const s = SV();
  return K.shuffle(vs.slice()).sort((a, b) => K.verbStufe(s, a) - K.verbStufe(s, b)).slice(0, n).map(v => {
    const von = K.ZEITEN[Math.floor(Math.random() * 3)], nach = K.shuffle(K.ZEITEN.filter(z => z !== von))[0], si = Math.floor(Math.random() * 2);
    return { art: 'satz', v: v.id, zeit: nach, von, si, p: v.saetze[si].p };
  });
}

function shellHTML() {
  const n = Q.list.length, titel = TITEL[Q.modus.typ] || (MODI.find(m => m.k === Q.modus.art) || {}).t;
  return `<div class="screen task vtask" id="task">
    <header class="qbar">
      <button class="icon-btn" data-act="v-quit" aria-label="Beenden">${ICON.close}</button>
      <div class="qprog"><span class="qtitle">${titel}</span>${n > 20 ? `<span class="vzaehler" id="vz"></span>` : `<div class="leaves" id="leaves"></div>`}</div>
      <span class="qbao"><img id="mio" src="${mio('denkt')}" alt=""></span>
    </header>
    <section class="qcard" id="qcard"></section>
    <div class="qfoot" id="qfoot"></div>
  </div>`;
}
function setMio(pose) {
  const el = document.getElementById('mio');
  if (!el) return;
  el.src = mio(pose);
  el.classList.remove('bounce', 'wobble'); void el.offsetWidth;
  if (!P.reduced()) el.classList.add(pose === 'jubel' ? 'bounce' : pose === 'mut' ? 'wobble' : 'x');
}
function fortschritt() {
  const z = document.getElementById('vz'), l = document.getElementById('leaves');
  if (z) z.textContent = `${Q.i + 1} von ${Q.list.length}`;
  if (l) l.innerHTML = Q.list.map((t, i) => { const r = Q.results[i]; return `<i class="${i < Q.i ? (r && r.first ? 'ok' : 'help') : i === Q.i ? 'now' : ''}"></i>`; }).join('');
}
const weiterBtn = (letzte) => `<button class="btn primary big" id="next-btn" data-act="v-next"><span><b>${letzte ? 'Fertig' : 'Weiter'}</b></span>${ICON.next}</button>`;
const istLetzte = () => Q.i === Q.list.length - 1;
/* Frage-Kopf: Verb, Zeit, Person mit Lücke */
function frageHTML(t, v) {
  const luecke = t.zeit === 'pf' ? '<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u> <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>' : '<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>';
  return `<div class="vfrage"><span class="vinf">${esc(v.inf)}</span>${zeitChip(t.zeit)}</div>
    <p class="vluecke"><i>${K.PERS_ZEIGEN[t.p]}</i> ${luecke}</p>`;
}
const KEYS = ['qwertzuiopü', 'asdfghjklöä', 'yxcvbnm'];
function tastaturHTML(mitLeer) {
  return `<div class="kbd vkbd">${KEYS.map((row, r) => `<div class="krow">${r === 2 ? `<button class="k fn" data-act="v-bksp" aria-label="Löschen">${ICON.del}</button>` : ''}${row.split('').map(c => `<button class="k" data-act="v-key" data-v="${c}">${c}</button>`).join('')}${r === 2 ? `<button class="k ok" data-act="v-ok" aria-label="Prüfen">${ICON.check}</button>` : ''}</div>`).join('')}
    ${mitLeer ? `<div class="krow"><button class="k space" data-act="v-key" data-v=" ">Leerschlag</button></div>` : ''}</div>`;
}

function zeige() {
  const t = cur(), v = VERB[t.v], card = document.getElementById('qcard'), foot = document.getElementById('qfoot');
  if (!card) return;
  Q.tries = 0; Q.input = ''; Q.locked = false; Q.rows = null; Q.row = 0; Q.picked = null;
  const task = document.getElementById('task');
  task.dataset.kind = t.art; task.dataset.i = Q.i;
  card.className = `qcard k-${t.art}`;
  // was gefragt ist, auch für die Browser-Tests (Scripts/browser.mjs → Verben)
  Object.assign(card.dataset, { v: t.v, zeit: t.zeit || '', p: t.p == null ? '' : t.p, saetze: t.saetze ? JSON.stringify(t.saetze) : '' });
  setMio('denkt'); fortschritt();
  if (t.art === 'karte') {
    card.innerHTML = `<p class="ask">Ein neues Verb – schau dir alle Formen an</p>${kartenInhalt(v)}`;
    foot.innerHTML = weiterBtn(istLetzte());
    K.ZEITEN.forEach(z => buche(v, z, 'karte', 'first'));
    Q.results[Q.i] = { first: true, karte: true };
    mioSagt(['mio_neu', { pause: 200 }], true); sag([t.v], true);
    Q.locked = true;
  } else if (t.art === 'waehlen') {
    Q.opts = K.auswahl(v, t.zeit, t.p);
    card.innerHTML = `<p class="ask">Welche Form ist richtig?</p>${frageHTML(t, v)}
      <div class="grid4 vopts">${Q.opts.map((o, i) => `<button class="opt word-opt" data-act="v-wahl" data-i="${i}">${esc(o)}</button>`).join('')}</div><p class="fb" id="fb"></p>`;
    foot.innerHTML = '';
  } else if (t.art === 'form' || t.art === 'einstieg' || t.art === 'satz') {
    const kopf = t.art === 'satz'
      ? `<p class="ask">Setze den Satz ins ${zeitChip(t.zeit)}</p><div class="vvon">${zeitChip(t.von)}${satzHTML(v, t.si, t.von)}</div>${satzLuecke(v, t)}`
      : `<p class="ask">${t.art === 'einstieg' ? 'Schreibe die Form – ein Versuch' : 'Schreibe die Form'}</p>${frageHTML(t, v)}`;
    card.innerHTML = `${kopf}<div class="answer" id="answer"></div><p class="fb" id="fb"></p>`;
    foot.innerHTML = tastaturHTML(t.zeit === 'pf');
    zeigeEingabe();
  } else if (t.art === 'reihe' || t.art === 'test') {
    Q.rows = ['', '', '', '', '', '']; Q.marks = null;
    card.innerHTML = `<p class="ask">${t.art === 'test' ? 'Konjugiere – ein Versuch' : 'Konjugiere: alle sechs Formen'}</p>
      <div class="vfrage"><span class="vinf">${esc(v.inf)}</span>${zeitChip(t.zeit)}</div><div class="vreihe" id="vreihe"></div><p class="fb" id="fb"></p>`;
    foot.innerHTML = tastaturHTML(t.zeit === 'pf');
    zeigeReihe();
  } else if (t.art === 'zeit') {
    card.innerHTML = `<p class="ask">In welcher Zeit steht das Verb?</p>${satzOhne(v, t)}
      <div class="vzeiten">${K.ZEITEN.map(z => `<button class="opt word-opt vz-${z}" data-act="v-zeit" data-z="${z}">${K.ZEIT_NAME[z]}</button>`).join('')}</div><p class="fb" id="fb"></p>`;
    foot.innerHTML = '';
    if (P.S.settings.autoplay) sag([{ pause: 150 }, `${t.v}_s${t.si}_${t.zeit}`], true);
  } else if (t.art === 'jagd') {
    Q.sel = new Set();
    Q.woerter = [];
    t.saetze.forEach((s, si) => K.satz(VERB[s.v], s.si, s.zeit).woerter.forEach((w, wi, alle) => Q.woerter.push({ t: w.t + (wi === alle.length - 1 ? '.' : ''), verb: w.verb, si })));
    card.innerHTML = `<p class="ask">Tippe alle Verben an</p><p class="vhinweis">Achtung: Im Perfekt hat das Verb zwei Teile.</p><div class="vtext" id="vtext"></div><p class="fb" id="fb"></p>`;
    foot.innerHTML = `<button class="btn primary big" data-act="v-jagd-ok"><span><b>Prüfen</b></span>${ICON.check}</button>`;
    zeigeJagd();
  }
}
/* Satz mit Lücke für das Verb (Verwandeln) */
function satzLuecke(v, t) {
  const w = K.satz(v, t.si, t.zeit).woerter;
  return `<p class="vsatz ziel">${w.map(x => (x.verb ? '<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>' : esc(x.t))).join(' ')}.</p>`;
}
/* Satz ohne farbige Verben (Welche Zeit?) */
const satzOhne = (v, t) => `<p class="vsatz gross">${esc(K.satz(v, t.si, t.zeit).text)}</p>`;

function zeigeEingabe(zustand = '') {
  const el = document.getElementById('answer'), t = cur();
  if (!el) return;
  el.innerHTML = `<div class="vline">${t.art === 'satz' ? '' : `<span class="vpron">${K.PERS_ZEIGEN[t.p]}</span>`}<div class="typed ${zustand}" id="typed">${esc(Q.input).replace(/ /g, '&nbsp;')}<i class="caret"></i></div></div>`;
}
function zeigeReihe() {
  const el = document.getElementById('vreihe'), t = cur();
  if (!el) return;
  el.innerHTML = [0, 1, 2, 3, 4, 5].map(p => {
    const m = Q.marks ? Q.marks[p] : '', aktiv = !Q.locked && p === Q.row;
    return `<button class="vrow ${m} ${aktiv ? 'aktiv' : ''}" data-act="v-row" data-i="${p}"><span class="vpron">${K.PERS_ZEIGEN[p]}</span>
      <span class="vin">${esc(Q.rows[p]).replace(/ /g, '&nbsp;')}${aktiv ? '<i class="caret"></i>' : ''}</span>${Q.loesung && m === 'bad' ? `<span class="vsoll">${esc(K.form(VERB[t.v], t.zeit, p))}</span>` : ''}</button>`;
  }).join('');
}
function zeigeJagd(zeigen) {
  const el = document.getElementById('vtext');
  if (!el) return;
  let html = '', si = 0;
  Q.woerter.forEach((w, i) => {
    if (w.si !== si) { html += '<br>'; si = w.si; }
    const cls = zeigen ? (w.verb ? (Q.sel.has(i) ? 'right' : 'fehlt') : (Q.sel.has(i) ? 'bad' : '')) : (Q.sel.has(i) ? 'sel' : '');
    html += `<button class="vw ${cls}" data-act="v-wort" data-i="${i}">${esc(w.t)}</button> `;
  });
  el.innerHTML = html;
}

/* ---- Eingabe ---- */
function taste(c) {
  if (!Q || Q.locked) return;
  const t = cur();
  if (Q.rows) {
    if (Q.rows[Q.row].length >= 26) return;
    if (c === ' ' && (!Q.rows[Q.row] || Q.rows[Q.row].endsWith(' '))) return;
    Q.rows[Q.row] += c; if (Q.marks) Q.marks[Q.row] = ''; sfx.tap(); zeigeReihe();
  } else if (['form', 'einstieg', 'satz'].includes(t.art)) {
    if (Q.input.length >= 26 || (c === ' ' && (!Q.input || Q.input.endsWith(' ')))) return;
    Q.input += c; sfx.tap(); zeigeEingabe();
  }
}
function loeschen() {
  if (!Q || Q.locked) return;
  if (Q.rows) { if (!Q.rows[Q.row] && Q.row > 0 && !Q.marks) Q.row--; else Q.rows[Q.row] = Q.rows[Q.row].slice(0, -1); sfx.tap(); zeigeReihe(); }
  else if (Q.input) { Q.input = Q.input.slice(0, -1); sfx.tap(); zeigeEingabe(); }
}
function ok() {
  if (!Q || Q.locked) return;
  const t = cur(), v = VERB[t.v];
  if (Q.rows) {
    if (!Q.rows[Q.row].trim()) { P.nope(document.querySelector('.vrow.aktiv')); return; }
    const leer = [0, 1, 2, 3, 4, 5].filter(p => !Q.rows[p].trim() || (Q.marks && Q.marks[p] === 'bad' && p > Q.row));
    const naechste = [0, 1, 2, 3, 4, 5].find(p => p > Q.row && (!Q.rows[p].trim() || (Q.marks && Q.marks[p] === 'bad')));
    if (naechste != null) { Q.row = naechste; sfx.tap(); zeigeReihe(); return; }
    const erste = [0, 1, 2, 3, 4, 5].find(p => !Q.rows[p].trim());
    if (erste != null) { Q.row = erste; sfx.tap(); zeigeReihe(); return; }
    void leer; return pruefeReihe();
  }
  if (!Q.input.trim()) { P.nope(document.getElementById('typed')); return; }
  if (K.richtig(v, t.zeit, t.p, Q.input)) { zeigeEingabe('right'); return richtig(); }
  zeigeEingabe('wrong');
  if (t.art === 'einstieg') return falsch(true, K.form(v, t.zeit, t.p));
  falsch(Q.tries >= 1, K.form(v, t.zeit, t.p), () => { zeigeEingabe(); });
}
function pruefeReihe() {
  const t = cur(), v = VERB[t.v];
  Q.marks = [0, 1, 2, 3, 4, 5].map(p => (K.richtig(v, t.zeit, p, Q.rows[p]) ? 'right' : 'bad'));
  const fehler = Q.marks.filter(m => m === 'bad').length;
  if (!fehler) { Q.locked = true; zeigeReihe(); return richtig(); }
  if (t.art === 'test' || Q.tries >= 1) {
    Q.locked = true; Q.loesung = true; zeigeReihe(); Q.loesung = false;
    return falsch(true, null, null, [0, 1, 2, 3, 4, 5].filter(p => Q.marks[p] === 'bad').map(p => ({ p, eingabe: Q.rows[p] })));
  }
  Q.row = Q.marks.indexOf('bad'); zeigeReihe();
  falsch(false, null, () => {}, null, `${fehler === 1 ? 'Eine Form stimmt' : `${fehler} Formen stimmen`} noch nicht – verbessere ${fehler === 1 ? 'sie' : 'die roten'}.`);
}

/* ---- richtig / falsch ---- */
const LOB = ['Super!', 'Richtig!', 'Genau!', 'Stark!', 'Bravo!'];
function richtig() {
  const t = cur(), v = VERB[t.v];
  Q.locked = true;
  const first = Q.tries === 0;
  Q.results[Q.i] = { first, t };
  if (t.zeit && !['zeit', 'jagd'].includes(t.art)) buche(v, t.zeit, t.art === 'satz' ? 'form' : t.art, first ? 'first' : 'second');
  Q.streak = first ? Q.streak + 1 : 0; Q.maxStreak = Math.max(Q.maxStreak, Q.streak);
  setMio('jubel'); sfx.right(Q.streak);
  const fb = document.getElementById('fb');
  if (fb) { fb.className = 'fb good'; fb.textContent = [3, 5, 10].includes(Q.streak) ? `${Q.streak} richtig hintereinander!` : LOB[Math.floor(Math.random() * LOB.length)]; }
  if (!P.reduced()) P.burst(document.querySelector('#qcard .right, #answer, #vreihe') || document.getElementById('qcard'), 10);
  const hoeren = !TON ? null : t.art === 'reihe' ? `${t.v}_${t.zeit}` : t.art === 'satz' ? `${t.v}_s${t.si}_${t.zeit}` : null;
  if (hoeren) sag([hoeren]);
  if (!['test', 'einstieg'].includes(t.art)) mioSagt([{ pause: 150 }, [3, 5, 10].includes(Q.streak) ? `mio_serie_${Q.streak}` : einer('mio_lob', 8)], !!hoeren);
  // Weiter, sobald Mio fertig gesprochen hat (die ganze Reihe dauert einige Sekunden); wer nicht warten will, tippt «Weiter»
  if (hoeren) document.getElementById('qfoot').innerHTML = `<button class="btn primary big" id="skip-btn" data-act="v-next"><span><b>${istLetzte() ? 'Fertig' : 'Weiter'}</b></span>${ICON.next}</button>`;
  const min = t.art === 'test' || t.art === 'einstieg' ? 650 : hoeren ? 1500 : 1100, t0 = Date.now();
  const warte = () => { if (!Q) return; const d = Date.now() - t0; if (d < min || (TON && P.Sound.busy() && d < 14000)) tv = setTimeout(warte, 150); else weiter(); };
  clearTimeout(tv); tv = setTimeout(warte, 150);
}
/* Falsch. fertig = keine weiteren Versuche: Lösung zeigen, «Weiter». Sonst nochmals versuchen (retry). */
function falsch(fertig, loesung, retry, zeilen, text) {
  const t = cur(), v = VERB[t.v], fb = document.getElementById('fb');
  Q.tries++; Q.streak = 0; sfx.wrong();
  if (!fertig) {
    setMio('mut');
    if (fb) { fb.className = 'fb soft'; fb.textContent = text || 'Noch nicht ganz – probier es nochmals.'; }
    P.nope(document.getElementById('typed') || document.getElementById('vreihe'));
    mioSagt([einer('mio_fast', 3)]);
    clearTimeout(tv); tv = setTimeout(() => { if (Q && !Q.locked && retry) retry(); }, 700);
    return;
  }
  Q.locked = true; setMio('mut');
  Q.results[Q.i] = { first: false, falsch: true, t, eingabe: Q.input, zeilen };
  if (t.art !== 'test' && t.art !== 'einstieg') { mioSagt(['mio_loesung', { pause: 200 }]); if (t.art === 'reihe') sag([`${t.v}_${t.zeit}`], true); }
  if (t.zeit && !['zeit', 'jagd'].includes(t.art)) buche(v, t.zeit, t.art === 'satz' ? 'form' : t.art, 'wrong');
  if (fb) { fb.className = 'fb soft'; fb.innerHTML = loesung ? `Richtig ist: <b class="vloesung">${t.p != null && t.art !== 'satz' ? K.PERS_ZEIGEN[t.p] + ' ' : ''}${esc(loesung)}</b>` : (text || (t.art === 'test' ? 'Die richtigen Formen stehen daneben.' : 'Schau dir die richtigen Formen an.')); }
  document.getElementById('qfoot').innerHTML = weiterBtn(istLetzte());
}
function waehle(i, btn) {
  if (!Q || Q.locked) return;
  const t = cur(), v = VERB[t.v];
  if (K.richtig(v, t.zeit, t.p, Q.opts[i])) { btn.classList.add('right'); return richtig(); }
  btn.classList.add('wrong'); btn.disabled = true;
  if (Q.tries >= 1) {
    document.querySelectorAll('.vopts .opt').forEach((b, k) => { b.disabled = true; if (K.richtig(v, t.zeit, t.p, Q.opts[k])) b.classList.add('solution'); });
    return falsch(true, K.form(v, t.zeit, t.p));
  }
  falsch(false);
}
function waehleZeit(z, btn) {
  if (!Q || Q.locked) return;
  const t = cur();
  if (z === t.zeit) { btn.classList.add('right'); return richtig(); }
  btn.classList.add('wrong'); btn.disabled = true;
  if (Q.tries >= 1) {
    document.querySelectorAll('.vzeiten .opt').forEach(b => { b.disabled = true; if (b.dataset.z === t.zeit) b.classList.add('solution'); });
    return falsch(true, null, null, null, `Das ist ${K.ZEIT_NAME[t.zeit]}.`);
  }
  falsch(false, null, null, null, t.zeit === 'pf' ? 'Tipp: Hat das Verb zwei Teile?' : 'Noch nicht – schau das Verb genau an.');
}
function pruefeJagd() {
  if (!Q || Q.locked) return;
  const soll = Q.woerter.map((w, i) => (w.verb ? i : -1)).filter(i => i >= 0);
  const gut = soll.every(i => Q.sel.has(i)) && Q.sel.size === soll.length;
  if (gut) { zeigeJagd(true); return richtig(); }
  if (Q.tries >= 1) { zeigeJagd(true); return falsch(true, null, null, null, 'Grün = Verb gefunden, gelb = Verb übersehen, rot = kein Verb.'); }
  const fehlt = soll.filter(i => !Q.sel.has(i)).length, zuviel = [...Q.sel].filter(i => !soll.includes(i)).length;
  falsch(false, null, () => {}, null, `${fehlt ? `${fehlt === 1 ? 'Ein Verbteil fehlt' : `${fehlt} Verbteile fehlen`} noch. ` : ''}${zuviel ? `${zuviel === 1 ? 'Ein Wort ist' : `${zuviel} Wörter sind`} kein Verb.` : ''}`);
}
function weiter() {
  clearTimeout(tv);
  if (!Q) return;
  P.Sound.stop();
  if (Q.i < Q.list.length - 1) { Q.i++; zeige(); return; }
  fertig();
}
function fertig() {
  const s = SV(), n = Q.results.filter(r => r && !r.karte).length, gut = Q.results.filter(r => r && r.first && !r.karte).length;
  const res = { modus: Q.modus, n, gut, punkte: K.punkte(D.verben, s) - Q.vorher, sicherNeu: K.sichere(D.verben, s) - Q.sicherVorher,
    fehler: Q.results.filter(r => r && r.falsch), serie: Q.maxStreak, abgebrochen: Q.abgebrochen };
  if (Q.modus.typ === 'test') { s.tests.push({ n, gut, d: Date.now() }); s.tests = s.tests.slice(-20); P.save(); }
  const art = Q.modus.art, alle = n > 0 && gut === n;
  res.neu = stickerPruefen({ fertig: Q.results.some(r => r), test100: Q.modus.typ === 'test' && n >= 10 && alle,
    jagd: art === 'jagd' && n >= 6 && alle, zeit10: art === 'zeit' && n >= 10 && alle });
  Q = null;
  P.nav('vresult', { res }, false);
  if (res.n && res.gut === res.n) { sfx.done(); if (!P.reduced()) P.confetti(40); } else sfx.sparkle();
  if (res.neu.length) setTimeout(() => sfx.sticker(), 500);
  mioSagt([{ pause: 400 }, res.modus.typ === 'einstieg' ? 'mio_einstieg_fertig' : res.n && res.gut === res.n ? 'mio_perfekt' : einer('mio_fertig', 3)]
    .concat(res.neu.length ? [{ pause: 300 }, res.neu.some(id => STK[id].art === 'glitzer') ? 'mio_sticker_glitzer' : 'mio_sticker'] : []));
}
function fehlerHTML(r) {
  const t = r.t, v = VERB[t.v];
  if (t.art === 'jagd' || t.art === 'zeit') return '';
  if (r.zeilen) return `<li><b>${esc(v.inf)}</b> ${zeitChip(t.zeit)}<span class="vf-l">${r.zeilen.map(z => `<span><i>${K.PERS_ZEIGEN[z.p]}</i> <b>${esc(K.form(v, t.zeit, z.p))}</b>${z.eingabe ? ` <s>${esc(z.eingabe)}</s>` : ''}</span>`).join('')}</span></li>`;
  return `<li><b>${esc(v.inf)}</b> ${zeitChip(t.zeit)}<span class="vf-l"><span><i>${K.PERS_ZEIGEN[t.p]}</i> <b>${esc(K.form(v, t.zeit, t.p))}</b>${r.eingabe ? ` <s>${esc(r.eingabe)}</s>` : ''}</span></span></li>`;
}
function resultHTML() {
  const r = P.view.res || {}, s = SV(), typ = r.modus && r.modus.typ, alle = r.n && r.gut === r.n;
  const titel = typ === 'einstieg' ? `Du kannst schon ${r.gut} von ${r.n} Formen!` : alle ? 'Alles richtig!' : r.n ? `${r.gut} von ${r.n} beim ersten Versuch` : 'Geschafft!';
  const text = typ === 'einstieg' ? (K.einstiegOffen(G(r.modus.g), s) ? 'Du kannst später weitermachen. Was du schon kannst, üben wir nur noch kurz.' : 'Jetzt weiss ich, was wir üben müssen. Was du schon kannst, kommt nur noch kurz dran.')
    : typ === 'test' ? `Verbentest: ${r.gut} von ${r.n} Reihen ohne Fehler.` : r.sicherNeu > 0 ? `${r.sicherNeu === 1 ? 'Ein Verb ist' : `${r.sicherNeu} Verben sind`} neu sicher!` : 'Jede Runde macht dich sicherer.';
  const fehler = (r.fehler || []).map(fehlerHTML).filter(Boolean);
  return `<div class="screen result vresult">
    <div class="res-top"><img class="res-bao" src="${mio(alle ? 'jubel' : 'mut')}" alt="">
      <div class="res-text"><h1>${titel}</h1><p class="res-count">${text}</p></div></div>
    <div class="vstats"><span><b>${r.punkte > 0 ? '+' + r.punkte : r.punkte || 0}</b> Lernpunkte</span><span><b>${K.sichere(G(1), s)}/15</b> Gruppe 1 sicher</span><span><b>${K.sichere(G(2), s)}/17</b> Gruppe 2 sicher</span></div>
    ${(r.neu || []).length ? `<section class="res-stk mh-neu"><h2>${r.neu.length === 1 ? 'Ein neuer Sticker für Mios Baumhaus!' : `${r.neu.length} neue Sticker für Mios Baumhaus!`}</h2>
      <div class="mh-neu-r">${r.neu.map(id => `<span class="mh-neu-i">${stkBild(id)}<small>${esc(STK[id].titel)}</small></span>`).join('')}</div>
      <button class="btn" data-act="v-haus">${ICON.sticker}<span>Ins Baumhaus</span></button></section>` : ''}
    ${fehler.length ? `<section class="mistakes vfehler"><h2>Das schauen wir nochmals an</h2><ul>${fehler.join('')}</ul></section>` : ''}
    <div class="res-actions"><button class="btn primary big" data-act="${typ === 'einstieg' ? 'v-mio' : 'v-nochmal'}"><span><b>${typ === 'einstieg' ? 'Üben mit Mio' : 'Nochmals üben'}</b></span>${ICON.next}</button>
      <button class="btn" data-act="v-auf"><span>Fertig</span></button></div>
  </div>`;
}

/* ================================================================ Mios Baumhaus (Belohnung)
   Ein kleines Büchlein: Umschlag, drei gemalte Seiten des leeren Baumhauses und 11 Sticker zum Einrichten (frei hinsetzen,
   verschieben, zurücklegen). Sticker: mh_01 «Mio zieht ein» nach der ersten fertigen Runde (auch nach dem Einstieg) – der
   Einstieg selbst gibt sonst nichts (Entscheid 2026-11-16: «man soll nicht alles sofort erhalten»); mh_02 … mh_08 für die
   Lernpunkte NACH dem Einstieg (base), der letzte erst, wenn alle 32 Verben sicher sind; drei Glitzer-Sticker: Verbentest ohne
   Fehler, Verben-Jagd ohne Fehler, zehn Zeitformen richtig. Bilder: SourceData/Baumhaus.csv. */
const HAUS = D.haus && D.haus.da ? D.haus : null;
const STK = Object.fromEntries(((D.haus || {}).sticker || []).map(x => [x.id, x]));
const NORMAL = HAUS ? HAUS.sticker.filter(x => x.art === 'normal' && x.bedingung !== 'willkommen') : [];
const WILLKOMMEN = HAUS ? HAUS.sticker.find(x => x.bedingung === 'willkommen') : null;
function SH() {
  const s = SV();
  if (!Array.isArray(s.stk)) s.stk = [];
  if (!Array.isArray(s.neu)) s.neu = [];
  if (!s.haus || typeof s.haus !== 'object') s.haus = {};
  s.stk = s.stk.filter(id => STK[id]); s.neu = s.neu.filter(id => STK[id]);
  s.haus.placed = (Array.isArray(s.haus.placed) ? s.haus.placed : []).filter((x, i, a) => x && STK[x.s] && s.stk.includes(x.s) && a.findIndex(y => y.s === x.s) === i);
  s.haus.p = Math.min(Math.max(0, s.haus.p | 0), HAUS ? HAUS.seiten.length - 1 : 0);
  return s;
}
/* Neu verdiente Sticker eintragen. ctx: { fertig, test100, jagd, zeit10 } aus der eben beendeten Übung */
function stickerPruefen(ctx = {}) {
  if (!HAUS) return [];
  const s = SH(), neu = [];
  const hat = id => s.stk.includes(id) || neu.includes(id);
  if (ctx.fertig && WILLKOMMEN && !hat(WILLKOMMEN.id)) neu.push(WILLKOMMEN.id);
  const habe = NORMAL.filter(x => s.stk.includes(x.id)).length;
  const k = K.stickersVerdient(NORMAL.length, habe, K.punkte(D.verben, s), K.maxPunkte(D.verben), s.base);
  NORMAL.slice(habe, k).forEach(x => neu.push(x.id));
  HAUS.sticker.filter(x => x.art === 'glitzer').forEach(x => { if (ctx[x.bedingung] && !hat(x.id)) neu.push(x.id); });
  if (neu.length) { s.stk.push(...neu); s.neu.push(...neu); P.save(); }
  return neu;
}
function naechsterText() {
  const s = SH(), habe = NORMAL.filter(x => s.stk.includes(x.id)).length;
  if (WILLKOMMEN && !s.stk.includes(WILLKOMMEN.id)) return 'Den ersten Sticker gibt es nach deiner ersten Runde';
  const n = K.bisNaechster(NORMAL.length, habe, K.punkte(D.verben, s), K.maxPunkte(D.verben), s.base);
  return n == null ? 'Alle Sticker für Lernpunkte gesammelt!' : `Nächster Sticker: noch ${n} ${n === 1 ? 'Lernpunkt' : 'Lernpunkte'}`;
}
const stkBild = (id, cls = '') => `<img class="mh-b ${STK[id].art === 'glitzer' ? 'glitzer' : ''} ${cls}" src="${img(id)}" alt="${esc(STK[id].titel)}" draggable="false">`;
function hausBannerHTML() {
  if (!HAUS) return '';
  const s = SH();
  return `<button class="mh-banner ${s.neu.length ? 'has-new' : ''}" data-act="v-haus"><img src="${img('mh_umschlag')}" alt="">
    <span class="mio-banner-t"><b>Mios Baumhaus</b><small>${s.stk.length} von ${HAUS.sticker.length} Stickern · ${naechsterText()}</small></span>${ICON.fwd}</button>`;
}
const BEDINGUNG = { willkommen: 'Für deine erste Runde', alle: 'Alle 32 Verben sicher', test100: 'Verbentest ohne Fehler', jagd: 'Verben-Jagd ohne Fehler', zeit10: '10 Zeitformen richtig' };
let hausAuf = false, hSel = null;
function hausHTML() {
  const s = SH();
  if (!hausAuf) {
    return `<div class="screen vhaus zu"><header class="bar"><button class="icon-btn" data-act="v-auf" aria-label="Zurück">${ICON.back}</button><h1 class="bar-title">Mios Baumhaus</h1></header>
      <button class="mh-umschlag" data-act="mh-auf" aria-label="Büchlein aufschlagen"><img src="${img('mh_umschlag')}" alt=""><span class="mh-u-bild"><img src="${mio('hallo')}" alt=""></span><span class="mh-u-titel">Mios Baumhaus</span></button>
      <p class="mh-hinweis">${s.stk.length ? `${s.stk.length} von ${HAUS.sticker.length} Stickern gesammelt` : 'Noch leer – die Sticker verdienst du beim Üben'}</p>
      <div class="vk-nav"><button class="btn primary" data-act="mh-auf"><span>Aufschlagen</span>${ICON.next}</button></div></div>`;
  }
  const seite = HAUS.seiten[s.haus.p], frei = s.stk.filter(id => !s.haus.placed.some(x => x.s === id)).reverse();
  const fehlen = HAUS.sticker.filter(x => !s.stk.includes(x.id));
  return `<div class="screen vhaus auf"><header class="bar"><button class="icon-btn" data-act="v-auf" aria-label="Zurück">${ICON.back}</button>
      <h1 class="bar-title">Mios Baumhaus</h1><div class="bar-right"><span class="mh-zahl">${ICON.sticker}<b>${s.stk.length}/${HAUS.sticker.length}</b></span></div></header>
    <div class="seg mh-tabs" role="radiogroup">${HAUS.seiten.map((x, i) => `<button role="radio" aria-checked="${i === s.haus.p}" data-act="mh-seite" data-i="${i}">${esc(x.titel)}</button>`).join('')}</div>
    <div class="mh-szene" id="mh-szene"><img class="mh-grund" src="${img(seite.id)}" alt="${esc(seite.titel)}" draggable="false">
      ${s.haus.placed.filter(x => x.p === s.haus.p).map(x => `<button class="mh-st ${STK[x.s].bedingung === 'alle' ? 'gross' : ''} ${hSel === x.s ? 'sel' : ''}" data-s="${x.s}" style="left:${x.x}%;top:${x.y}%" aria-label="${esc(STK[x.s].titel)}">${stkBild(x.s)}</button>`).join('')}</div>
    <div class="mh-leiste" id="mh-leiste">${leisteHTML()}</div>
    <div class="mh-kiste" id="mh-kiste" aria-label="Sticker-Kiste">
      ${frei.map(id => `<button class="mh-k ${s.neu.includes(id) ? 'neu' : ''}" data-act="mh-nimm" data-s="${id}" aria-label="${esc(STK[id].titel)} hinsetzen">${stkBild(id)}</button>`).join('')}
      ${fehlen.map(x => `<span class="mh-k leer" title="${esc(BEDINGUNG[x.bedingung] || 'Für Lernpunkte')}">${x.art === 'glitzer' ? ICON.star : ICON.lock}</span>`).join('')}
    </div></div>`;
}
function leisteHTML() {
  const s = SH();
  if (hSel && STK[hSel]) return `<span class="mh-name">${esc(STK[hSel].titel)}</span><button class="btn mh-weg" data-act="mh-weg">${ICON.peel}<span>Zurück in die Kiste</span></button>`;
  const frei = s.stk.filter(id => !s.haus.placed.some(x => x.s === id)).length;
  return `<span class="mh-tipp">${!s.stk.length ? 'Noch keine Sticker – übe mit Mio, dann füllt sich die Kiste.' : frei ? 'Tippe einen Sticker in der Kiste an. Im Bild kannst du ihn verschieben.' : 'Alle Sticker sind im Baumhaus. Du kannst sie verschieben.'}</span>`;
}
function hausAfter() {
  const s = SH();
  if (hausAuf && s.neu.length) { s.neu = []; P.save(); }
}
/* Sticker im Bild verschieben: Zeiger-Ereignisse (Finger und Maus), Lage in Prozent der Seite */
let zieh = null;
function ziehStart(e) {
  const b = e.target.closest && e.target.closest('.mh-st');
  if (!b || P.view.name !== 'vhaus') return;
  const sz = document.getElementById('mh-szene'), r = sz.getBoundingClientRect(), q = b.getBoundingClientRect();
  zieh = { s: b.dataset.s, b, r, dx: e.clientX - (q.left + q.width / 2), dy: e.clientY - (q.top + q.height / 2), x0: e.clientX, y0: e.clientY, weit: false, id: e.pointerId };
  try { b.setPointerCapture(e.pointerId); } catch (err) { /* alt */ }
  e.preventDefault();
}
function ziehBewegen(e) {
  if (!zieh || e.pointerId !== zieh.id) return;
  if (!zieh.weit && Math.hypot(e.clientX - zieh.x0, e.clientY - zieh.y0) < 6) return;
  zieh.weit = true;
  const x = Math.min(97, Math.max(3, 100 * (e.clientX - zieh.dx - zieh.r.left) / zieh.r.width));
  const y = Math.min(96, Math.max(4, 100 * (e.clientY - zieh.dy - zieh.r.top) / zieh.r.height));
  zieh.b.style.left = x + '%'; zieh.b.style.top = y + '%'; zieh.x = x; zieh.y = y;
  zieh.b.classList.add('zieht');
}
function ziehEnde(e) {
  if (!zieh || (e && e.pointerId !== zieh.id)) return;
  const z = zieh, s = SH(); zieh = null;
  z.b.classList.remove('zieht');
  if (z.weit && z.x != null) {
    const p = s.haus.placed.find(x => x.s === z.s);
    if (p) { p.x = Math.round(z.x * 10) / 10; p.y = Math.round(z.y * 10) / 10; P.save(); P.Sound.fx('kleben'); }
    return;
  }
  hSel = hSel === z.s ? null : z.s; sfx.tap(); P.render();          // nur angetippt: auswählen
}
const appEl = document.getElementById('app');
appEl.addEventListener('pointerdown', ziehStart);
appEl.addEventListener('pointermove', ziehBewegen);
appEl.addEventListener('pointerup', ziehEnde);
appEl.addEventListener('pointercancel', ziehEnde);
X.views.vhaus = { html: hausHTML, after: hausAfter, leave() { hSel = null; zieh = null; } };
X.back.vhaus = false;
Object.assign(X.acts, {
  'v-haus'() { sfx.tap(); hausAuf = false; hSel = null; P.nav('vhaus'); },
  'mh-auf'() { hausAuf = true; P.Sound.fx('blaettern'); P.render(); const s = SH(); if (!s.haus.seen) { s.haus.seen = true; P.save(); mioSagt([{ pause: 300 }, 'mio_haus_start']); } },
  'mh-seite'(b) { SH().haus.p = +b.dataset.i; hSel = null; P.save(); sfx.flip(); P.render(); },
  'mh-nimm'(b) {
    const s = SH(), id = b.dataset.s;
    if (s.haus.placed.some(x => x.s === id)) return;
    const n = s.haus.placed.filter(x => x.p === s.haus.p).length;
    s.haus.placed.push({ s: id, p: s.haus.p, x: 30 + (n * 17) % 45, y: 40 + (n * 11) % 30 });
    hSel = id; P.save(); P.Sound.fx('kleben'); sfx.sparkle(); P.render();
    if (s.haus.placed.length === HAUS.sticker.length && !s.haus.voll) { s.haus.voll = true; P.save(); mioSagt([{ pause: 400 }, 'mio_haus_voll']); if (!P.reduced()) P.confetti(40); }
  },
  'mh-weg'() { const s = SH(); s.haus.placed = s.haus.placed.filter(x => x.s !== hSel); hSel = null; P.save(); P.Sound.fx('abloesen'); P.render(); },
});

/* ================================================================ Anmelden bei der App */
let letzter = null;                                             // letzter Modus für «Nochmals üben»
function wiederholen() {
  const m = letzter;
  if (!m) return startMio();
  if (m.typ === 'mio') return startMio();
  if (m.typ === 'test') return startTest();
  if (m.typ === 'einstieg') return K.einstiegOffen(G(m.g), SV()) ? startEinstieg(m.g) : startMio();
  startDrill(m.art);
}
const leave = () => { clearTimeout(tv); Q = null; P.Sound.stop(); };
X.views.verben = { html: homeHTML };
X.views.vkarten = { html: kartenHTML, after: karteGesehen, key(e) { if (e.key === 'ArrowRight') X.acts['v-k-next'](); if (e.key === 'ArrowLeft') X.acts['v-k-prev'](); } };
X.views.vtask = { html: () => (Q ? shellHTML() : homeHTML()), after() { if (Q) zeige(); else P.nav('verben', {}, false); }, leave, busy: true,
  key(e) {
    if (!Q) return;
    if (e.key === 'Enter') { e.preventDefault(); if (document.getElementById('next-btn')) weiter(); else if (cur().art === 'jagd') pruefeJagd(); else ok(); return; }
    if (e.key === 'Backspace') { e.preventDefault(); loeschen(); return; }
    if (Q.rows && (e.key === 'ArrowDown' || e.key === 'Tab')) { e.preventDefault(); if (!Q.locked) { Q.row = (Q.row + 1) % 6; zeigeReihe(); } return; }
    if (Q.rows && e.key === 'ArrowUp') { e.preventDefault(); if (!Q.locked) { Q.row = (Q.row + 5) % 6; zeigeReihe(); } return; }
    if (/^[a-zäöü ]$/i.test(e.key)) { e.preventDefault(); taste(e.key.toLowerCase()); } else if (e.key === 'ß') { e.preventDefault(); taste('s'); taste('s'); }
  } };
X.views.vresult = { html: resultHTML };
X.back.verben = true;
X.home = bannerHTML;
X.reset = () => { P.S.verben = null; };
Object.assign(X.acts, {
  'v-auf'() { sfx.tap(); P.nav('verben'); },
  'v-hallo'() { sfx.tap(); const t = document.querySelector('.vhero .hero-bao img'); if (t && !P.reduced()) { t.classList.remove('bounce'); void t.offsetWidth; t.classList.add('bounce'); } sag([einer('mio_hallo', 3)]); },
  'v-sag'(b) { sag([b.dataset.n]); },
  'v-mio'() { sfx.tap(); letzter = { typ: 'mio' }; startMio(); },
  'v-einstieg'(b) { sfx.tap(); letzter = { typ: 'einstieg', g: +b.dataset.g }; startEinstieg(+b.dataset.g); },
  'v-wahl-g'(b) { const w = b.dataset.v === 'alle' ? 'alle' : +b.dataset.v; SV().wahl = w; P.save(); sfx.tap(); kI = 0; P.render(); },
  'v-modus'(b) {
    sfx.tap();
    const m = b.dataset.mode;
    if (m === 'karten') { kI = 0; P.nav('vkarten'); mioSagt(['mio_modus_karten', { pause: 200 }]); if (P.S.settings.autoplay) sag([gewaehlt()[0].id], true); return; }
    letzter = m === 'test' ? { typ: 'test' } : { typ: 'drill', art: m };
    if (m === 'test') startTest(); else startDrill(m);
  },
  'v-liste'() { sfx.tap(); P.openSheet('vliste', listeHTML()); },
  'v-karte-zeigen'(b) {
    const v = VERB[b.dataset.id]; sfx.flip();
    P.openSheet('vkarte', `<div class="sheet-head"><h2>${esc(v.inf)}</h2><button class="icon-btn" data-act="close-sheet" aria-label="Schliessen">${ICON.close}</button></div>
      <div class="sheet-body vkarte">${gruppeBadge(v)}${tabelleHTML(v)}<div class="vsaetze">${K.ZEITEN.map(z => satzHTML(v, 0, z)).join('')}</div>
      <div class="confirm-actions"><button class="btn" data-act="v-liste">${ICON.back}<span>Alle Verben</span></button></div></div>`);
  },
  'v-k-next'() { const n = gewaehlt().length; kI = (kI + 1) % n; sfx.flip(); P.render(); window.scrollTo(0, 0); if (P.S.settings.autoplay) sag([gewaehlt()[kI].id]); },
  'v-k-prev'() { const n = gewaehlt().length; kI = (kI + n - 1) % n; sfx.flip(); P.render(); window.scrollTo(0, 0); if (P.S.settings.autoplay) sag([gewaehlt()[kI].id]); },
  'v-key'(b) { taste(b.dataset.v); },
  'v-bksp'() { loeschen(); },
  'v-ok'() { ok(); },
  'v-row'(b) { if (Q && Q.rows && !Q.locked) { Q.row = +b.dataset.i; sfx.tap(); zeigeReihe(); } },
  'v-wahl'(b) { waehle(+b.dataset.i, b); },
  'v-zeit'(b) { waehleZeit(b.dataset.z, b); },
  'v-wort'(b) { if (!Q || Q.locked) return; const i = +b.dataset.i; if (Q.sel.has(i)) Q.sel.delete(i); else Q.sel.add(i); sfx.tap(); zeigeJagd(); },
  'v-jagd-ok'() { pruefeJagd(); },
  'v-next'() { weiter(); },
  'v-quit'() { sfx.tap(); P.openSheet('vquit', P.confirmHTML('Beenden?', 'Was du schon geübt hast, bleibt gespeichert.', 'Beenden', 'v-quit-yes')); },
  'v-quit-yes'() {
    P.closeSheet(true);
    if (Q && Q.modus.typ === 'einstieg' && Q.results.some(r => r)) { Q.abgebrochen = true; Q.list = Q.list.slice(0, Q.results.length); return fertig(); }
    Q = null; P.nav('verben');
  },
  'v-nochmal'() { sfx.tap(); wiederholen(); },
});
/* Nur mit ?schwer in der Adresse (Browser-Tests): eine Übung mit genau diesen Aufgaben starten – die längsten Formen und Sätze */
if (location.search === '?schwer') window.VERBEN_TEST = list => start({ typ: 'drill', art: list[0].art }, list);
['hallo', 'denkt', 'jubel', 'mut'].forEach(n => { new Image().src = mio(n); });
P.render();                                                     // die Kachel auf der Startseite erscheint
})();
