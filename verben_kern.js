/* Wörtli-Panda – Bereich «Deutsch: Verben mit Mio»: der Lern-Kern ohne Bildschirm-Code (window.VerbenKern bzw. module.exports),
   damit Scripts/test.mjs alles mit Node prüfen kann. Seit 2026-11-16.

   Ein Verb hat 18 Formen: 3 Zeitformen (pr = Präsens, pt = Präteritum, pf = Perfekt) x 6 Personen. Gelernt wird je Verb und
   Zeitform = ein «Teil» (96 Teile). Jeder Teil hat eine Stufe 0–5:
     0 neu · 1 kennengelernt (Lernkarte) · 2, 3 erkannt (richtige Form gewählt) · 4 eine Form richtig geschrieben
     5 sicher = die ganze Reihe (ich … sie) in einer späteren Runde richtig geschrieben – oder im Verbentest.
   Entscheide des Benutzers (2026-11-16): alle Formen konjugieren; Gruppe 1 («Lernziel erreicht») muss sitzen und kommt zuerst
   und gründlicher, Gruppe 2 danach; Sticker nicht alle sofort (der Einstieg zählt nicht für Sticker, siehe base). */
(function (root) {
'use strict';

const MAX = 5;
const ZEITEN = ['pr', 'pt', 'pf'];
const ZEIT_NAME = { pr: 'Präsens', pt: 'Präteritum', pf: 'Perfekt' };
const PERS = ['ich', 'du', 'er', 'wir', 'ihr', 'sie'];
const PERS_ZEIGEN = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie'];
const HILF = { haben: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'], sein: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'] };
const BLATT_PERSON = { pr: 1, pt: 2, pf: 3 };          // die Formen vom Blatt: du (Präsens), er (Präteritum), wir (Perfekt)

function blank() { return { box: 0, right: 0, wrong: 0, last: 0, r4: -1 }; }
const key = (v, zeit) => `${v.id}.${zeit}`;

/* ============================================================== Formen */
function form(v, zeit, p) {
  if (zeit === 'pf') return `${HILF[v.hilf][p]} ${v.pp}`;
  return v[zeit][p];
}
/* alle erlaubten Antworten (die erste ist die, die wir zeigen) */
function antworten(v, zeit, p) {
  const alt = (v.alt && v.alt[zeit + p]) || [];
  return [form(v, zeit, p)].concat(zeit === 'pf' ? alt.map(a => `${HILF[v.hilf][p]} ${a}`) : alt);
}
/* Ohne Gross/klein und überzählige Leerzeichen; ß zählt wie ss (Schweizer Schreibweise) */
function norm(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/ß/g, 'ss').replace(/[.!?,;:]+$/g, '').replace(/\s+/g, ' ').trim();
}
const richtig = (v, zeit, p, eingabe) => antworten(v, zeit, p).some(a => norm(a) === norm(eingabe));

/* Satz in einer Zeitform: { text, woerter: [{ t, verb }] } – verb = gehört zum Verb (im Perfekt zwei Teile) */
function satz(v, i, zeit) {
  const s = v.saetze[i], rest = s.rest.split(' ');
  const w = s.subj.split(' ').map(t => ({ t, verb: false }));
  w.push({ t: zeit === 'pf' ? HILF[v.hilf][s.p] : v[zeit][s.p], verb: true });
  rest.forEach(t => w.push({ t, verb: false }));
  if (zeit === 'pf') w.push({ t: v.pp, verb: true });
  return { text: w.map(x => x.t).join(' ') + '.', woerter: w, p: s.p, blatt: !!s.blatt };
}

/* ============================================================ Falsche Formen zum Wählen
   Typische Fehler: regelmässig gebildet («er gehte», «du fahrst», «ist gegeht»), falsches Hilfsverb («hat gegangen»),
   andere Zeit oder andere Person. Nie eine erlaubte Antwort. */
function stamm(v) { return v.inf.replace(/en$/, '').replace(/n$/, ''); }
function schwach(v, zeit, p) {
  const st = stamm(v), e = /[td]$/.test(st) ? 'e' : '';
  if (v.inf === 'sein' || v.inf === 'haben' || v.inf === 'wissen') return null;
  if (zeit === 'pt') return st + e + ['te', 'test', 'te', 'ten', 'tet', 'ten'][p];
  if (zeit === 'pr') {
    if (p === 1) return st + (e ? 'est' : /(s|ss|z)$/.test(st) ? 't' : 'st');
    if (p === 2 || p === 4) return st + e + 't';
    return null;
  }
  const m = /^(ver|be|ge|er|ent|zer)(.+)$/.exec(st);
  return `${HILF[v.hilf][p]} ${m ? st : 'ge' + st}${e}t`;
}
function shuffle(a, rnd = Math.random) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function falsche(v, zeit, p, rnd = Math.random) {
  const ok = antworten(v, zeit, p).map(norm), kand = [];
  const add = f => { if (f && !ok.includes(norm(f)) && !kand.includes(f)) kand.push(f); };
  add(schwach(v, zeit, p));
  if (zeit === 'pf') {
    add(`${HILF[v.hilf === 'sein' ? 'haben' : 'sein'][p]} ${v.pp}`);          // falsches Hilfsverb
    add(`${HILF[v.hilf][p]} ${v.pt[2]}`);                                       // Präteritum statt Partizip
  }
  const vorne = kand.slice();                                                   // die typischen Fehler zuerst
  const rest = [];
  ZEITEN.filter(z => z !== zeit).forEach(z => rest.push(form(v, z, p)));
  [0, 1, 2, 3, 4, 5].filter(q => q !== p).forEach(q => rest.push(form(v, zeit, q)));
  shuffle(rest, rnd).forEach(add);
  const wahl = vorne.slice(0, 2).concat(kand.filter(f => !vorne.slice(0, 2).includes(f))).slice(0, 3);
  return wahl;
}
function auswahl(v, zeit, p, rnd = Math.random) {
  return shuffle([form(v, zeit, p)].concat(falsche(v, zeit, p, rnd)), rnd);
}

/* ============================================================ Lernstand
   art: karte | waehlen | form | reihe | test | einstieg
   ergebnis: 'first' (beim 1. Versuch richtig) | 'second' (beim 2. Versuch) | 'wrong' */
function record(st, art, ergebnis, runde, jetzt) {
  const s = Object.assign(blank(), st);
  s.last = jetzt || 0;
  if (ergebnis === 'wrong') s.wrong++; else s.right++;
  if (art === 'karte') { if (s.box === 0) s.box = 1; return s; }
  if (art === 'waehlen') {
    if (ergebnis === 'first') s.box = Math.max(s.box, Math.min(3, Math.max(s.box, 1) + 1));
    else if (ergebnis === 'wrong') s.box = Math.max(1, Math.min(s.box, 3) - 1);
    else s.box = Math.max(s.box, 1);
    return s;
  }
  if (art === 'form') {
    if (ergebnis === 'first') { if (s.box < 4) { s.box = 4; s.r4 = runde; } }
    else if (ergebnis === 'wrong') { s.box = Math.max(1, Math.min(s.box, 3)); s.r4 = -1; }
    else s.box = Math.max(s.box, 1);
    return s;
  }
  if (art === 'reihe') {
    if (ergebnis === 'first') {
      if (s.box < 4) { s.box = 4; s.r4 = runde; }
      else if (s.box === 4 && runde !== s.r4) s.box = 5;
    } else if (ergebnis === 'wrong') { s.box = Math.max(1, Math.min(s.box, 3)); s.r4 = -1; }
    else s.box = Math.max(s.box, 1);
    return s;
  }
  if (art === 'test') {
    if (ergebnis === 'first') s.box = MAX;
    else { s.box = Math.max(1, Math.min(s.box, 2)); s.r4 = -1; }
    return s;
  }
  if (art === 'einstieg') {                       // «Was kannst du schon?»: eine Form, ein Versuch
    if (ergebnis === 'first') { if (s.box < 4) { s.box = 4; s.r4 = -1; } }
    else s.box = Math.max(s.box, 1);
    return s;
  }
  return s;
}
const stand = (S, v, zeit) => (S.t && S.t[key(v, zeit)]) || blank();
const punkte = (verben, S) => verben.reduce((sum, v) => sum + ZEITEN.reduce((a, z) => a + stand(S, v, z).box, 0), 0);
const maxPunkte = verben => verben.length * ZEITEN.length * MAX;
const verbSicher = (S, v) => ZEITEN.every(z => stand(S, v, z).box === MAX);
const verbStufe = (S, v) => Math.min(...ZEITEN.map(z => stand(S, v, z).box));
const sichere = (verben, S) => verben.filter(v => verbSicher(S, v)).length;

/* ============================================================ Runden */
const TAG = 864e5;
/* Person für eine Aufgabe: die Form vom Blatt dreimal so oft wie die anderen */
function person(zeit, rnd = Math.random) {
  const lose = [0, 1, 2, 3, 4, 5].concat([BLATT_PERSON[zeit], BLATT_PERSON[zeit]]);
  return lose[Math.floor(rnd() * lose.length)];
}
function artFuer(box) { return box <= 2 ? 'waehlen' : box === 3 ? 'form' : 'reihe'; }
/* Welche Verben sind dran? gruppe: 'auto' | 1 | 2 | 'alle'
   auto = Gruppe 1, bis jeder ihrer Teile mindestens Stufe 4 hat; danach kommt Gruppe 2 dazu. */
function dran(verben, S, gruppe) {
  if (gruppe === 1 || gruppe === 2) return verben.filter(v => v.g === gruppe);
  if (gruppe === 'alle') return verben;
  const g1 = verben.filter(v => v.g === 1);
  const offen1 = g1.some(v => ZEITEN.some(z => stand(S, v, z).box < 4));
  return offen1 ? g1 : verben;
}
/* Runde mit Mio. opts: { length, runde, now, gruppe, rnd } -> [{ art, v (id), zeit, p }]
   Zuerst Teile in Arbeit (tiefste Stufe zuerst, Gruppe 1 vor Gruppe 2), dazu 1–2 neue Verben (Lernkarte, gleich danach wählen)
   und fällige Wiederholungen: sichere Teile der Gruppe 1 nach 1 Tag, der Gruppe 2 nach 3 Tagen (Gruppe 1 gründlicher). */
function buildSession(verben, S, opts = {}) {
  const rnd = opts.rnd || Math.random, now = opts.now || Date.now(), len = opts.length || 10;
  const pool = dran(verben, S, opts.gruppe || 'auto');
  const teile = [];
  pool.forEach(v => ZEITEN.forEach(z => teile.push({ v, zeit: z, st: stand(S, v, z) })));
  const neuVerben = pool.filter(v => ZEITEN.every(z => stand(S, v, z).box === 0));
  const arbeit = teile.filter(t => t.st.box > 0 && t.st.box < MAX)
    .sort((a, b) => a.v.g - b.v.g || a.st.box - b.st.box || a.st.last - b.st.last || rnd() - 0.5);
  const faellig = teile.filter(t => t.st.box === MAX && now - t.st.last > (t.v.g === 1 ? 1 : 3) * TAG)
    .sort((a, b) => a.v.g - b.v.g || a.st.last - b.st.last);
  const out = [];
  const task = t => ({ art: artFuer(t.st.box), v: t.v.id, zeit: t.zeit, p: person(t.zeit, rnd) });
  const nNeu = Math.min(neuVerben.length, arbeit.length >= len - 2 ? 1 : 2);
  const nWdh = Math.min(faellig.length, 2);
  // neue Verben: Karte, dann eine Form der Blatt-Zeitform wählen
  neuVerben.slice(0, nNeu).forEach(v => {
    out.push({ art: 'karte', v: v.id });
    const z = ZEITEN[Math.floor(rnd() * 3)];
    out.push({ art: 'waehlen', v: v.id, zeit: z, p: BLATT_PERSON[z] });
  });
  const platz = Math.max(0, len - out.length - nWdh);
  // nicht dreimal dasselbe Verb hintereinander: je Verb höchstens 2 Teile pro Runde
  const jeVerb = {};
  arbeit.forEach(t => {
    if (out.length - 2 * nNeu >= platz) return;
    jeVerb[t.v.id] = (jeVerb[t.v.id] || 0) + 1;
    if (jeVerb[t.v.id] <= 2) out.push(task(t));
  });
  faellig.slice(0, nWdh).forEach(t => out.push({ art: 'reihe', v: t.v.id, zeit: t.zeit, p: 0 }));
  // noch Platz und nichts mehr in Arbeit: weitere neue Verben
  let i = nNeu;
  while (out.length < len - 1 && i < neuVerben.length) {
    const v = neuVerben[i++], z = ZEITEN[Math.floor(rnd() * 3)];
    out.push({ art: 'karte', v: v.id }, { art: 'waehlen', v: v.id, zeit: z, p: BLATT_PERSON[z] });
  }
  // immer noch Platz (alles sicher, nichts fällig): die am längsten nicht geübten Reihen
  if (out.length < Math.min(len, 4)) {
    teile.filter(t => t.st.box === MAX && !out.some(o => o.v === t.v.id && o.zeit === t.zeit))
      .sort((a, b) => a.st.last - b.st.last).slice(0, len - out.length)
      .forEach(t => out.push({ art: 'reihe', v: t.v.id, zeit: t.zeit, p: 0 }));
  }
  // Karten bleiben vor ihrer Wähl-Aufgabe; der Rest so mischen, dass dasselbe Verb nicht direkt zweimal kommt
  const kopf = out.filter((o, k) => o.art === 'karte' || (k > 0 && out[k - 1].art === 'karte'));
  const rest = entzerren(out.filter(o => !kopf.includes(o)), rnd);
  return kopf.concat(rest).slice(0, Math.max(len, kopf.length));
}
function entzerren(liste, rnd) {
  const a = liste.slice();
  for (let i = 1; i < a.length; i++) {
    if (a[i].v !== a[i - 1].v) continue;
    const j = a.findIndex((x, k) => k > i && x.v !== a[i - 1].v && (k + 1 >= a.length || a[k + 1].v !== a[i].v));
    if (j > 0) [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/* Einzelne Übung: art = waehlen | form | reihe über die gewählte Gruppe; schwächste Teile zuerst */
function buildDrill(verben, S, art, opts = {}) {
  const rnd = opts.rnd || Math.random, len = opts.length || 10;
  const teile = [];
  verben.forEach(v => ZEITEN.forEach(z => teile.push({ v, zeit: z, st: stand(S, v, z) })));
  teile.sort((a, b) => a.st.box - b.st.box || a.st.last - b.st.last || rnd() - 0.5);
  const jeVerb = {}, out = [];
  teile.forEach(t => {
    if (out.length >= len) return;
    jeVerb[t.v.id] = (jeVerb[t.v.id] || 0) + 1;
    if (jeVerb[t.v.id] <= (art === 'reihe' ? 1 : 2)) out.push({ art, v: t.v.id, zeit: t.zeit, p: person(t.zeit, rnd) });
  });
  return entzerren(shuffle(out, rnd), rnd);
}
/* «Was kannst du schon?»: je Verb die drei Formen vom Blatt (du Präsens, er Präteritum, wir Perfekt), ein Versuch.
   Nur Teile, die noch nicht dran waren (S.e[key]) – man kann jederzeit aufhören und später weitermachen. */
function buildEinstieg(verben, S) {
  const out = [];
  verben.forEach(v => ZEITEN.forEach(z => { if (!(S.e && S.e[key(v, z)])) out.push({ art: 'einstieg', v: v.id, zeit: z, p: BLATT_PERSON[z] }); }));
  return out;
}
const einstiegOffen = (verben, S) => buildEinstieg(verben, S).length;
/* Verbentest wie in der Schule: n ganze Reihen, ein Versuch, keine Hilfe; schwächere Teile etwas häufiger */
function buildTest(verben, S, n, rnd = Math.random) {
  const teile = [];
  verben.forEach(v => ZEITEN.forEach(z => teile.push({ v, zeit: z, w: rnd() + (stand(S, v, z).box < MAX ? 0.35 : 0) })));
  teile.sort((a, b) => b.w - a.w);
  const jeVerb = {}, out = [];
  teile.forEach(t => {
    if (out.length >= n) return;
    jeVerb[t.v.id] = (jeVerb[t.v.id] || 0) + 1;
    if (jeVerb[t.v.id] <= 1 || n > verben.length) out.push({ art: 'test', v: t.v.id, zeit: t.zeit, p: 0 });
  });
  return shuffle(out, rnd);
}

/* ============================================================ Sticker (Mios Baumhaus)
   Normale Sticker verteilen sich gleichmässig auf die Lernpunkte, die nach dem Einstieg noch zu holen sind (base = Punkte,
   die nicht zählen: was «Was kannst du schon?» gebracht hat). Der letzte kommt erst, wenn alles sicher ist.
   So gibt der Einstieg nicht alle Sticker auf einmal (Entscheid 2026-11-16: «man soll nicht alles sofort erhalten»). */
function stickerNeed(k, n, max, base = 0) {
  const b = Math.min(Math.max(0, base), max);
  if (k >= n) return max;
  return Math.round(b + (max - b) * k / n);
}
function stickersVerdient(n, hat, pts, max, base = 0) {
  let k = hat;
  while (k < n && pts >= stickerNeed(k + 1, n, max, base) && (k + 1 < n || pts >= max) && stickerNeed(k + 1, n, max, base) > base) k++;
  if (k < n && pts >= max) k = n;                 // alles sicher: alle normalen Sticker
  return k;
}
function bisNaechster(n, hat, pts, max, base = 0) {
  if (hat >= n) return null;
  return Math.max(1, stickerNeed(hat + 1, n, max, base) - pts);
}

const api = { MAX, ZEITEN, ZEIT_NAME, PERS, PERS_ZEIGEN, HILF, BLATT_PERSON, blank, key, form, antworten, norm, richtig, satz, falsche,
  auswahl, record, stand, punkte, maxPunkte, verbSicher, verbStufe, sichere, dran, buildSession, buildDrill, buildEinstieg,
  einstiegOffen, buildTest, stickerNeed, stickersVerdient, bisNaechster, shuffle, person };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.VerbenKern = api;
})(typeof window !== 'undefined' ? window : globalThis);
