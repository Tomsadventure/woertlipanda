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
    <h4>${K.ZEIT_NAME[z]}</h4>
    <div class="vt-grid">${[0, 1, 2, 3, 4, 5].map(p => `<span class="vt-f"><i>${K.PERS_ZEIGEN[p]}</i> <b>${esc(K.form(v, z, p))}</b></span>`).join('')}</div>
  </div>`).join('')}</div>`;
}
const satzHTML = (v, i, z) => `<p class="vsatz">${K.satz(v, i, z).woerter.map(w => (w.verb ? `<b class="z-${z}">${esc(w.t)}</b>` : esc(w.t))).join(' ')}.</p>`;
const gruppeBadge = v => `<span class="vgr g${v.g}">${v.g === 1 ? 'Gruppe 1 · muss sitzen' : 'Gruppe 2'}</span>`;
function kartenInhalt(v) {
  return `<div class="vk-kopf"><h2 class="vinf">${esc(v.inf)}</h2>${gruppeBadge(v)}</div>
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
  clearTimeout(tv); tv = setTimeout(weiter, t.art === 'test' || t.art === 'einstieg' ? 650 : 1100);
}
/* Falsch. fertig = keine weiteren Versuche: Lösung zeigen, «Weiter». Sonst nochmals versuchen (retry). */
function falsch(fertig, loesung, retry, zeilen, text) {
  const t = cur(), v = VERB[t.v], fb = document.getElementById('fb');
  Q.tries++; Q.streak = 0; sfx.wrong();
  if (!fertig) {
    setMio('mut');
    if (fb) { fb.className = 'fb soft'; fb.textContent = text || 'Noch nicht ganz – probier es nochmals.'; }
    P.nope(document.getElementById('typed') || document.getElementById('vreihe'));
    clearTimeout(tv); tv = setTimeout(() => { if (Q && !Q.locked && retry) retry(); }, 700);
    return;
  }
  Q.locked = true; setMio('mut');
  Q.results[Q.i] = { first: false, falsch: true, t, eingabe: Q.input, zeilen };
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
  if (Q.i < Q.list.length - 1) { Q.i++; zeige(); return; }
  fertig();
}
function fertig() {
  const s = SV(), n = Q.results.filter(r => r && !r.karte).length, gut = Q.results.filter(r => r && r.first && !r.karte).length;
  const res = { modus: Q.modus, n, gut, punkte: K.punkte(D.verben, s) - Q.vorher, sicherNeu: K.sichere(D.verben, s) - Q.sicherVorher,
    fehler: Q.results.filter(r => r && r.falsch), serie: Q.maxStreak, abgebrochen: Q.abgebrochen };
  if (Q.modus.typ === 'test') { s.tests.push({ n, gut, d: Date.now() }); s.tests = s.tests.slice(-20); P.save(); }
  Q = null;
  P.nav('vresult', { res }, false);
  if (res.n && res.gut === res.n) { sfx.done(); if (!P.reduced()) P.confetti(40); } else sfx.sparkle();
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
    ${fehler.length ? `<section class="mistakes vfehler"><h2>Das schauen wir nochmals an</h2><ul>${fehler.join('')}</ul></section>` : ''}
    <div class="res-actions"><button class="btn primary big" data-act="${typ === 'einstieg' ? 'v-mio' : 'v-nochmal'}"><span><b>${typ === 'einstieg' ? 'Üben mit Mio' : 'Nochmals üben'}</b></span>${ICON.next}</button>
      <button class="btn" data-act="v-auf"><span>Fertig</span></button></div>
  </div>`;
}

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
const leave = () => { clearTimeout(tv); Q = null; };
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
  'v-hallo'() { sfx.tap(); const t = document.querySelector('.vhero .hero-bao img'); if (t && !P.reduced()) { t.classList.remove('bounce'); void t.offsetWidth; t.classList.add('bounce'); } },
  'v-mio'() { sfx.tap(); letzter = { typ: 'mio' }; startMio(); },
  'v-einstieg'(b) { sfx.tap(); letzter = { typ: 'einstieg', g: +b.dataset.g }; startEinstieg(+b.dataset.g); },
  'v-wahl-g'(b) { const w = b.dataset.v === 'alle' ? 'alle' : +b.dataset.v; SV().wahl = w; P.save(); sfx.tap(); kI = 0; P.render(); },
  'v-modus'(b) {
    sfx.tap();
    const m = b.dataset.mode;
    if (m === 'karten') { kI = 0; return P.nav('vkarten'); }
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
  'v-k-next'() { const n = gewaehlt().length; kI = (kI + 1) % n; sfx.flip(); P.render(); window.scrollTo(0, 0); },
  'v-k-prev'() { const n = gewaehlt().length; kI = (kI + n - 1) % n; sfx.flip(); P.render(); window.scrollTo(0, 0); },
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
