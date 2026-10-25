/* Wörtli-Panda – der Lern-Kern: Lernstand je Wort, Runden zusammenstellen, Antworten prüfen, Puzzles, Sticker.
   Ohne Bildschirm-Code, damit Scripts/test.mjs alles mit Node prüfen kann (window.Lernen bzw. module.exports). */
(function (root) {
'use strict';

/* ============================================================ Lernstand
   Jedes Wort hat eine Stufe 0–5 = so hoch ist sein Bambus im Bambuswald:
   0 neu · 1 kennengelernt (Karte) · 2 einmal erkannt · 3 zweimal erkannt (bereit zum Schreiben)
   4 einmal richtig geschrieben · 5 sicher = in einer späteren Runde nochmals richtig geschrieben (oder im Wörtlitest richtig).
   Erkennen (Hören, Wählen, Memory) bringt ein Wort höchstens auf 3, Schreiben auf 4 und 5. */
const MAX = 5;
const RECOGNIZE = ['hoeren', 'waehlen_en', 'waehlen_de', 'memory'];
const SPELL = ['puzzle', 'tippen'];

function blank() { return { box: 0, right: 0, wrong: 0, last: 0, r4: -1 }; }

/* kind = Aufgabenart, result = 'first' (beim 1. Versuch richtig) | 'second' (beim 2. Versuch) | 'wrong' (zweimal falsch)
   round = Nummer der Runde (für »in einer späteren Runde«), now = Zeitstempel. Gibt den neuen Stand zurück (Kopie). */
function record(st, kind, result, round, now) {
  const s = Object.assign(blank(), st);
  s.last = now || 0;
  if (result === 'wrong') s.wrong++; else s.right++;
  if (kind === 'karte') { if (s.box === 0) s.box = 1; return s; }
  if (kind === 'test') {
    if (result === 'first') s.box = MAX;
    else if (result === 'wrong') s.box = Math.min(s.box, 2);
    return s;
  }
  if (RECOGNIZE.includes(kind)) {
    if (result === 'first') s.box = Math.max(s.box, Math.min(3, Math.max(s.box, 1) + 1));
    else if (result === 'wrong') s.box = Math.max(1, Math.min(s.box, 3) - 1);
    return s;
  }
  if (SPELL.includes(kind)) {
    if (result === 'first') {
      if (s.box < 4) { s.box = 4; s.r4 = round; }
      else if (s.box === 4 && round !== s.r4) s.box = 5;
    } else if (result === 'wrong' && s.box >= 4) { s.box = 3; s.r4 = -1; }
    return s;
  }
  return s;
}

/* ================================================== Antworten prüfen
   Ohne Gross/klein, Leerzeichen am Rand und Satzzeichen am Ende; ’ = '; »waiter,waitress« = »waiter, waitress«,
   »left / right« = »left/right«. */
function norm(s) {
  return String(s == null ? '' : s).toLowerCase()
    .replace(/[’‘`´]/g, "'").replace(/…/g, '...').replace(/\s*\.\.\.\s*/g, ' ... ')
    .replace(/\s*,\s*/g, ', ').replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ').trim().replace(/[.!?,;:]+$/, '').trim();
}
const isRight = (w, input) => w.antworten.some(a => norm(a) === norm(input));

function lev(a, b) {
  const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d;
}
/* Wie nah ist die Eingabe? { dist, answer } zur nächsten erlaubten Antwort */
function closest(w, input) {
  const x = norm(input);
  let best = null;
  w.antworten.forEach(a => { const y = norm(a), d = lev(y, x)[y.length][x.length]; if (!best || d < best.dist) best = { dist: d, answer: a }; });
  return best;
}
/* Buchstabe für Buchstabe vergleichen (für die Anzeige nach dem 2. Fehler):
   [{c, s}] mit s = 'ok' | 'falsch' (anderer Buchstabe) | 'fehlt' (hätte da sein müssen) | 'zuviel' (gehört weg) */
function diff(answer, input) {
  const a = norm(answer), b = norm(input), d = lev(a, b), out = [];
  let i = a.length, j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      out.push(a[i - 1] === b[j - 1] ? { c: a[i - 1], s: 'ok' } : { c: a[i - 1], s: 'falsch', got: b[j - 1] }); i--; j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) { out.push({ c: a[i - 1], s: 'fehlt' }); i--; }
    else { out.push({ c: b[j - 1], s: 'zuviel' }); j--; }
  }
  return out.reverse();
}

/* ================================================================ Puzzles */
const SIMILAR = { a: 'e', e: 'i', i: 'e', o: 'u', u: 'o', c: 'k', k: 'c', s: 'z', z: 's', b: 'p', p: 'b', d: 't', t: 'd',
  g: 'k', v: 'w', w: 'v', y: 'j', j: 'y', f: 'v', m: 'n', n: 'm', r: 'l', l: 'r', h: 'k', x: 's', q: 'k' };
function shuffle(a, rnd = Math.random) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/* Buchstaben-Puzzle (Typ »wort«): je Wort eine Gruppe; in der Gruppe Lücken (null) und feste Zeichen (das Komma in
   »waiter, waitress«, der Schrägstrich in »left/right«), dazu die gemischten Buchstaben und 2–3 ähnliche Ablenker.
   Gelegt wird nur, was eine Lücke ist. */
const LETTER = /[a-z]/;
function letterPuzzle(w, rnd = Math.random) {
  const src = norm(w.en);
  const groups = src.split(' ').map(g => g.split('').map(c => (LETTER.test(c) ? null : c)));
  const letters = src.split('').filter(c => LETTER.test(c));
  const pool = [...new Set(letters.map(c => SIMILAR[c]).filter(c => c && !letters.includes(c)))];
  const want = letters.length > 6 ? 3 : 2;
  // Zu wenig ähnliche (»cinema« hat nur k): mit häufigen Buchstaben auffüllen, die nicht im Wort sind
  const more = 'eiaoustrnlkd'.split('').filter(c => !letters.includes(c) && !pool.includes(c));
  const decoys = shuffle(pool, rnd).slice(0, want).concat(shuffle(more, rnd)).slice(0, want);
  let tiles;
  do { tiles = shuffle(letters.concat(decoys), rnd); } while (tiles.join('') === letters.join('') && letters.length > 1);
  return { groups, answer: letters.join(''), tiles };
}
/* Wort-Puzzle (Typ »phrase« und »satz«): die Wörter in die richtige Reihenfolge; »...« wird ein eigenes Kärtchen */
function wordTokens(en) { return norm(en) === '' ? [] : en.replace(/\s*\.\.\.\s*/g, ' … ').trim().split(/\s+/); }
function wordPuzzle(w, rnd = Math.random) {
  const tokens = wordTokens(w.en);
  let tiles;
  do { tiles = shuffle(tokens.map((t, i) => ({ t, i })), rnd); } while (tiles.map(x => x.t).join(' ') === tokens.join(' ') && tokens.length > 1);
  return { answer: tokens, tiles };
}
const puzzleKind = w => (w.typ === 'wort' ? 'buchstaben' : 'woerter');

/* ================================================================ Auswahl */
/* 4 Möglichkeiten aus derselben Unit, wenn möglich vom selben Typ */
function choices(words, target, n = 4, rnd = Math.random) {
  const same = words.filter(w => w.id !== target.id && w.unit === target.unit);
  const pref = shuffle(same.filter(w => w.typ === target.typ), rnd);
  const rest = shuffle(same.filter(w => w.typ !== target.typ), rnd);
  return shuffle([target, ...pref.concat(rest).slice(0, n - 1)], rnd);
}

/* ============================================================ Runde mit Bao
   opts: { length (Aufgaben), hilfe: 'auto'|'puzzle'|'tastatur', rnd, now, round }
   Ergebnis: [{ kind, id }] – kind: karte | hoeren | waehlen_en | waehlen_de | puzzle | tippen */
const DAY = 864e5;
function spellKind(w, box, hilfe) {
  if (w.typ === 'satz') return 'puzzle';
  if (hilfe === 'puzzle') return 'puzzle';
  if (hilfe === 'tastatur') return 'tippen';
  return box >= 4 ? 'tippen' : 'puzzle';
}
function kindFor(w, box, hilfe, rnd) {
  if (box <= 1) return rnd() < 0.5 ? 'hoeren' : 'waehlen_de';
  if (box === 2) return rnd() < 0.6 ? 'waehlen_en' : 'hoeren';
  return spellKind(w, box, hilfe);
}
function buildSession(words, S, opts) {
  const rnd = opts.rnd || Math.random, now = opts.now || Date.now(), len = opts.length || 10;
  const st = id => (S.w && S.w[id]) || blank();
  const open = words.filter(w => st(w.id).box < MAX)
    .sort((a, b) => st(a.id).box - st(b.id).box || st(a.id).last - st(b.id).last || rnd() - 0.5);
  const fresh = open.filter(w => st(w.id).box === 0);
  const learning = open.filter(w => st(w.id).box > 0);
  const review = words.filter(w => st(w.id).box === MAX).sort((a, b) => st(a.id).last - st(b.id).last);
  const dueReview = review.filter(w => now - st(w.id).last > 3 * DAY);

  // Ein neues Wort kostet 2 Aufgaben (Karte + Hören), alle anderen 1. Zuerst Wörter in Arbeit (tiefste Stufe zuerst),
  // dabei Platz lassen für bis zu 3 neue (bei vielen offenen nur 1) und 2 fällige Wiederholungen; dann auffüllen.
  const cost = w => (st(w.id).box === 0 ? 2 : 1);
  let budget = len;
  const picked = [];
  const take = w => { if (w && !picked.includes(w) && cost(w) <= budget) { picked.push(w); budget -= cost(w); } };
  const reserve = Math.min(fresh.length * 2, learning.length >= len ? 2 : 6);
  const reviewSlots = Math.min(dueReview.length, 2);
  for (const w of learning) { if (budget - reserve - reviewSlots <= 0) break; take(w); }
  dueReview.slice(0, reviewSlots).forEach(take);
  fresh.slice(0, reserve / 2).forEach(take);
  [...learning, ...fresh, ...review].forEach(take);

  const tasks = [];
  picked.forEach(w => {
    const box = st(w.id).box;
    if (box === 0) tasks.push({ kind: 'karte', id: w.id, pair: true }, { kind: 'hoeren', id: w.id });
    else tasks.push({ kind: kindFor(w, box, opts.hilfe, rnd), id: w.id });
  });
  return spread(tasks, rnd);
}
/* Mischen: Karte direkt vor ihr Hören, sonst kein Wort zweimal hintereinander */
function spread(tasks, rnd) {
  const blocks = [];
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].pair) { blocks.push([tasks[i], tasks[i + 1]]); i++; } else blocks.push([tasks[i]]);
  }
  shuffle(blocks, rnd);
  const out = [];
  while (blocks.length) {
    const lastId = out.length ? out[out.length - 1].id : null;
    let k = blocks.findIndex(b => b[0].id !== lastId);
    if (k < 0) k = 0;
    out.push(...blocks.splice(k, 1)[0]);
  }
  return out.map(t => ({ kind: t.kind, id: t.id }));
}

/* Übungen einzeln (vom Startbildschirm): alle Wörter der Unit in einer Art, gemischt */
function buildDrill(words, kind, opts) {
  const rnd = (opts && opts.rnd) || Math.random, hilfe = (opts && opts.hilfe) || 'auto', S = (opts && opts.S) || { w: {} };
  const len = (opts && opts.length) || words.length;
  return shuffle(words.slice(), rnd).slice(0, len).map(w => {
    let k = kind;
    if (kind === 'schreiben') k = spellKind(w, ((S.w || {})[w.id] || blank()).box, hilfe);
    if (kind === 'waehlen') k = rnd() < 0.5 ? 'waehlen_en' : 'waehlen_de';
    return { kind: k, id: w.id };
  });
}
/* Wörtlitest: Deutsch -> Englisch schreiben (Satzanfänge als Wort-Puzzle), ohne Hilfe */
function buildTest(words, count, rnd = Math.random) {
  return shuffle(words.slice(), rnd).slice(0, count || words.length).map(w => ({ kind: 'test', id: w.id }));
}
/* Memory: n Paare Bild <-> englisches Wort */
function memoryDeck(words, pairs = 6, rnd = Math.random) {
  const pick = shuffle(words.slice(), rnd).slice(0, pairs);
  return shuffle(pick.flatMap(w => [{ id: w.id, side: 'bild' }, { id: w.id, side: 'wort' }]), rnd);
}

/* ============================================================ Stickeralbum
   Jede Unit hat eine Albumseite. Lernpunkte = Summe der Stufen der Wörter der Unit (Unit 1: 31 Wörter x 5 = 155).
   Die normalen Sticker der Unit verteilen sich gleichmässig bis »alle Wörter sicher« (dann ist auch der letzte da) –
   bei 15 Stickern und 155 Punkten etwa alle 10 Punkte einer. base = Lernpunkte, die es schon vor den Stickern gab:
   sie zählen nicht (Wunsch 2026-10-25: bei null anfangen), die Sticker verteilen sich dann auf den Rest.
   Einmal verdient bleibt verdient, auch wenn Stufen wieder sinken. Glitzer-Sticker: Bedingung in Stickers.csv, geprüft in app.js. */
const points = (words, W) => words.reduce((s, w) => s + (((W || {})[w.id] || {}).box || 0), 0);
/* Ab wie vielen Lernpunkten gibt es den k-ten (1 …) von n normalen Stickern? max = Wörter x 5 */
function stickerNeed(k, n, max, base = 0) {
  const need = base + Math.ceil(k * Math.max(max - base, n) / n);
  return max > base ? Math.min(need, max) : need;
}
/* Neu verdiente normale Sticker einer Unit (normal = ihre normalen Sticker in der Reihenfolge von Stickers.csv) */
function stickersEarned(normal, have, pts, max, base = 0) {
  let k = 0;
  while (k < normal.length && pts >= stickerNeed(k + 1, normal.length, max, base)) k++;
  return normal.slice(0, k).map(s => s.id).filter(id => !have.includes(id));
}
/* Wie viele Lernpunkte noch bis zum nächsten normalen Sticker der Unit? null = alle schon da */
function toNextSticker(normal, have, pts, max, base = 0) {
  const owned = normal.filter(s => have.includes(s.id)).length;
  if (owned >= normal.length) return null;
  return Math.max(1, stickerNeed(owned + 1, normal.length, max, base) - pts);
}

const api = { MAX, blank, record, norm, isRight, closest, diff, letterPuzzle, wordPuzzle, wordTokens, puzzleKind,
  choices, buildSession, buildDrill, buildTest, memoryDeck, shuffle, spellKind, points, stickerNeed, stickersEarned, toNextSticker };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
else root.Lernen = api;
})(typeof window !== 'undefined' ? window : globalThis);
