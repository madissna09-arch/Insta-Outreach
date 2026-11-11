/* Racket Sport Park – Design-Entwurf
   Fakten (Preise, Zeiten, Plätze) laut racketsportpark.de, Stand 10.11.2026.
   Belegung ist simuliert. Buchungen liegen nur im localStorage dieses Browsers. */
(function () {
  'use strict';

  /* ---------------- Daten ---------------- */
  // Öffnungszeiten in Minuten ab Mitternacht, Index = Date.getDay()
  const HOURS = {
    1: [[900, 1320]],
    2: [[600, 720], [900, 1320]],
    3: [[600, 720], [900, 1320]],
    4: [[600, 720], [900, 1320]],
    5: [[900, 1320]],
    6: [[780, 1140]],
    0: [[600, 1200]]
  };
  const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
  const DAY_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const DAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const GRID_START = 600, GRID_END = 1320;
  const MAX_SLOTS = 4;
  const EMBED = !!window.RSP_EMBED; // eingebettete Vorschau: keine Datei-Downloads, fester Seitentitel

  // Live-Modus: Ist eine Schnittstellen-Adresse gesetzt, kommen Zeiten und Preise aus dem
  // Buchungssystem (ep-3 mit Bridge-Modul) und Buchungen werden dort eingetragen.
  // <meta name="rsp-api" content="https://…/padel/public/bridge">, Sportart über name="rsp-api-sport".
  const metaOf = n => { const el = document.querySelector('meta[name="' + n + '"]'); return el ? el.content : ''; };
  const API = String(window.RSP_API || metaOf('rsp-api') || '').replace(/\/$/, '');
  const LIVE = !!API;
  const LIVE_SPORT = window.RSP_API_SPORT || metaOf('rsp-api-sport') || 'padel';

  const SPORTS = {
    padel: {
      name: 'Padel', color: 'var(--padel)', unit: 60, per: 'court',
      courts: ['Padel-Court'], players: { min: 2, max: 4, def: 4 },
      from: 'ab 20 €', fromUnit: 'pro Platz / Std.',
      teaser: 'Der erste Padelcourt in Osnabrück. Gespielt wird im Doppel, die Glaswände spielen mit.',
      intro: 'Padel verbindet Tennis und Squash: kleines Feld, Glaswände, die mitspielen, und ein Schläger ohne Saiten. Gespielt wird zu viert im Doppel, gezählt wie beim Tennis. Nach wenigen Minuten Einweisung laufen die ersten Ballwechsel.',
      rules: ['Aufschlag von unten, unterhalb der Hüfte', 'Der Ball darf nach dem Aufsprung an die Wand', 'Zweiter Aufsprung im eigenen Feld = Punkt für die anderen'],
      shoes: 'Saubere Hallenschuhe mit heller Sohle. Keine Joggingschuhe.',
      rent: { racket: 3, balls: 1 }, students: true,
      facts: [['Plätze', '1 Court'], ['Spieldauer', '60 Min.'], ['Preis', '20–24 € / Platz'], ['Leihschläger', '3 € p. P.']]
    },
    tennis: {
      name: 'Tennis', color: 'var(--tennis)', unit: 60, per: 'person',
      courts: ['Platz 1', 'Platz 2', 'Platz 3'], players: { min: 2, max: 4, def: 2 },
      from: 'ab 7 €', fromUnit: 'pro Person / Std.',
      teaser: 'Drei Hallenplätze mit blauem Teppich und LED-Licht.',
      intro: 'Drei Hallenplätze mit blauem Teppichboden: Der gelbe Ball hebt sich klar ab. Die Beleuchtung ist auf LED umgerüstet. Schuhe, Schläger und Bälle kannst du leihen oder im Shop kaufen.',
      rules: ['Einzel, zu dritt oder Doppel buchbar', 'Lichtgeld: 3 € pro Platz und Stunde', 'Tennis-Abo und Training auf Anfrage'],
      shoes: 'Nur Teppich-Hallenschuhe ohne Profil. Leihschuhe für 3 € vor Ort.',
      rent: { racket: 2, balls: 1, shoes: 3 }, students: true, light: 3,
      facts: [['Plätze', '3 Teppichplätze'], ['Spieldauer', '60 Min.'], ['Preis', '7–12 € p. P.'], ['Lichtgeld', '3 € / Std.']]
    },
    badminton: {
      name: 'Badminton', color: 'var(--badminton)', unit: 45, per: 'person',
      courts: ['Court 1', 'Court 2', 'Court 3', 'Court 4', 'Court 5'], players: { min: 2, max: 6, def: 2 },
      from: 'ab 6 €', fromUnit: 'pro Person / 45 Min.',
      teaser: 'Fünf Courts für Einzel, Doppel und den offenen Spielertreff am Montag.',
      intro: 'Fünf Courts für Einzel und Doppel. Badminton ist schnell gelernt und fordert trotzdem Ausdauer, Reaktion und Koordination. Wer Mitspieler sucht, kommt montags zum offenen Spielertreff.',
      rules: ['Eine Einheit dauert 45 Minuten', 'Licht ist im Preis enthalten', 'Spielertreff: montags 18:15–19:45 Uhr'],
      shoes: 'Saubere Hallenschuhe mit heller Sohle. Keine Joggingschuhe.',
      rent: { racket: 2 }, students: true,
      facts: [['Plätze', '5 Courts'], ['Spieldauer', '45 Min.'], ['Preis', '6–9 € p. P.'], ['Leihschläger', '2 € p. P.']]
    },
    touchtennis: {
      name: 'Touchtennis', color: 'var(--touch)', unit: 60, per: 'person',
      courts: ['Touchtennis-Feld'], players: { min: 2, max: 4, def: 2 },
      from: '6 €', fromUnit: 'pro Person / Std.',
      teaser: 'Tennis im Kleinformat: kurzer Schläger, weicher Ball, schnelle Ballwechsel.',
      intro: 'Touchtennis kommt aus Großbritannien: kleineres Feld, kürzere Schläger, weicher Ball. Gezählt wird wie beim Tennis, ein Satz geht aber nur bis 4. Ideal zum Reinschnuppern und für Familien mit Kindern.',
      rules: ['Zählweise wie Tennis, Sätze bis 4', 'Licht ist im Preis enthalten', 'Der Ball wird gekauft (6 €)'],
      shoes: 'Saubere Hallenschuhe mit heller Sohle. Keine Joggingschuhe.',
      rent: { racket: 2, ttball: 6 }, students: false,
      facts: [['Plätze', '1 Feld'], ['Spieldauer', '60 Min.'], ['Preis', '6 € p. P.'], ['Ball', '6 € (Kauf)']]
    }
  };
  const SPORT_KEYS = Object.keys(SPORTS);

  /* ---------------- Helfer ---------------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = n => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);
  const hm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parseDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const dateLong = s => { const d = parseDate(s); return DAY_SHORT[d.getDay()] + ', ' + pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.'; };
  const dateFull = s => { const d = parseDate(s); return DAY_LONG[d.getDay()] + ', ' + pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); };
  const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
  const slotDate = (dateStr, min) => { const d = parseDate(dateStr); d.setMinutes(min); return d; };
  const stamp = d => dateLong(iso(d)) + ' ' + hm(d.getHours() * 60 + d.getMinutes()) + ' Uhr';
  const hoursText = day => HOURS[day].map(([a, b]) => hm(a) + '–' + hm(b)).join(' · ');

  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }

  const store = {
    get() { try { return JSON.parse(localStorage.getItem('rsp-demo-bookings') || '[]'); } catch (e) { return memory; } },
    set(v) { memory = v; try { localStorage.setItem('rsp-demo-bookings', JSON.stringify(v)); } catch (e) { /* privater Modus */ } }
  };
  let memory = [];

  /* ---------------- Live-Anbindung ---------------- */
  const live = { days: {}, busy: false };
  const toMin = t => { const p = String(t).split(':'); return +p[0] * 60 + +p[1]; };

  function api(path, body) {
    const opt = body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {};
    return fetch(API + path, opt).then(r => r.json().catch(() => ({})).then(d => {
      if (!r.ok) { const err = new Error(d.error || 'Der Buchungsserver hat einen Fehler gemeldet.'); err.status = r.status; throw err; }
      return d;
    }));
  }
  function loadDay(dateStr, force) {
    const cur = live.days[dateStr];
    if (cur && !force) return;
    if (cur && cur.loading) return;
    live.days[dateStr] = { loading: true };
    api('/slots?date=' + dateStr)
      .then(d => { live.days[dateStr] = { ready: true, squares: d.squares || [], slots: d.slots || [] }; },
            () => { live.days[dateStr] = { error: 'Die freien Zeiten konnten nicht geladen werden.' }; })
      .then(() => { if (B.date === dateStr && B.step === 1 && !$('#view-buchen').hidden) renderBooking(); });
  }
  const liveSlot = sl => {
    const day = live.days[B.date]; if (!day || !day.ready || !day.squares[sl.court]) return null;
    const sid = day.squares[sl.court].sid;
    return day.slots.find(x => x.sid === sid && toMin(x.start) === sl.start) || null;
  };

  // Einheitliche Sicht auf einen Tag: Plätze, Zeiten und der Zustand jeder Zelle.
  // Im Entwurf simuliert, im Live-Modus aus dem Buchungssystem.
  function dayModel() {
    const s = SPORTS[B.sport];
    if (!LIVE) {
      const short = s.courts.length > 1;
      return {
        ready: true, courts: s.courts, unit: s.unit, times: slotsFor(B.sport, B.date),
        cell: (c, t) => ({
          state: isPast(B.date, t) ? 'past' : isTaken(B.sport, B.date, c, t) ? 'taken' : 'free',
          label: slotLabelPrice(B.sport, B.date, t, B.players, short), spoken: slotLabelPrice(B.sport, B.date, t, B.players)
        })
      };
    }
    const day = live.days[B.date];
    if (!day) { loadDay(B.date); return { ready: false }; }
    if (day.loading) return { ready: false };
    if (day.error) return { ready: false, error: day.error };
    const sids = day.squares.map(q => q.sid), map = {};
    day.slots.forEach(x => { map[x.sid + '-' + toMin(x.start)] = x; });
    const times = Array.from(new Set(day.slots.filter(x => x.state !== 'closed').map(x => toMin(x.start)))).sort((a, b) => a - b);
    return {
      ready: true, courts: day.squares.map(q => q.name), unit: day.squares[0] ? day.squares[0].block / 60 : s.unit, times,
      cell: (c, t) => {
        const x = map[sids[c] + '-' + t];
        if (!x || x.state === 'closed') return { state: 'taken' };
        const label = x.price == null ? 'frei' : eur(x.price / 100).replace(',00', '');
        return { state: x.state, label, spoken: label };
      }
    };
  }
  // Stornofrist in Sekunden vor Spielbeginn (0 = online nicht stornierbar)
  function cancelSeconds() {
    if (!LIVE) return 86400;
    const day = live.days[B.date];
    return day && day.ready && day.squares[0] ? day.squares[0].cancelRange : 86400;
  }

  /* ---------------- Zeiten, Belegung, Preise ---------------- */
  function slotsFor(sportKey, dateStr) {
    const unit = SPORTS[sportKey].unit, open = HOURS[parseDate(dateStr).getDay()], out = [];
    for (let t = GRID_START; t + unit <= GRID_END; t += unit) {
      if (open.some(([a, b]) => t >= a && t + unit <= b)) out.push(t);
    }
    return out;
  }
  function isPast(dateStr, start) {
    const today = iso(new Date());
    return dateStr < today || (dateStr === today && start <= nowMin());
  }
  function isTaken(sportKey, dateStr, court, start) {
    const mine = store.get().some(b => b.status === 'confirmed' && b.sport === sportKey && b.date === dateStr && b.slots.some(s => s.court === court && s.start === start));
    if (mine) return true;
    const base = sportKey === 'padel' ? 0.34 : 0.22;
    const p = start >= 1020 ? base + 0.3 : base; // abends voller
    return hash(sportKey + dateStr + court + start) < p; // simulierte Belegung
  }
  // 0 = Nebenzeit (günstiger), 1 = Hauptzeit
  function tariff(sportKey, dateStr, start) {
    const d = parseDate(dateStr).getDay(), we = d === 0 || d === 6;
    if (sportKey === 'padel') return (!we && start < 900) ? 0 : 1;
    if (sportKey === 'tennis') return (we || start < 900) ? 0 : 1;
    if (sportKey === 'badminton') return (we || start < 1050) ? 0 : 1;
    return 0;
  }
  function personRate(sportKey, players, t) {
    if (sportKey === 'tennis') return ({ 2: [10, 12], 3: [8, 9], 4: [7, 8] }[Math.min(4, Math.max(2, players))])[t];
    if (sportKey === 'badminton') return (players <= 2 ? [8, 9] : players === 3 ? [7, 8] : [6, 7])[t];
    if (sportKey === 'touchtennis') return 6;
    return 0;
  }
  const courtRate = t => [20, 24][t];

  function slotLabelPrice(sportKey, dateStr, start, players, short) {
    const t = tariff(sportKey, dateStr, start);
    if (SPORTS[sportKey].per === 'court') return eur(courtRate(t)).replace(',00', '');
    return eur(personRate(sportKey, players, t)).replace(',00', '') + (short ? '' : ' p. P.');
  }

  // Preis einer Spielzeit inkl. Ermäßigungen. Annahme Padel: Ein Kind (4,50 €) ersetzt ein Viertel des Platzpreises.
  function slotCost(sportKey, dateStr, start, party) {
    const s = SPORTS[sportKey], t = tariff(sportKey, dateStr, start);
    const kids = party.kids, studs = s.students ? party.students : 0, adults = Math.max(0, party.players - kids - studs);
    let amount, detail;
    if (s.per === 'court') {
      const c = courtRate(t), kidCut = kids * Math.max(0, c / 4 - 4.5), studCut = studs * 1;
      amount = c - kidCut - studCut;
      detail = 'Platzpreis ' + eur(c) + (kidCut + studCut ? ' · Ermäßigung −' + eur(kidCut + studCut) : '');
    } else {
      const r = personRate(sportKey, party.players, t), kidRate = sportKey === 'tennis' ? 5 : 4.5;
      amount = adults * r + kids * Math.min(kidRate, r) + studs * (r - 1);
      const parts = [];
      if (adults) parts.push(adults + ' × ' + eur(r));
      if (studs) parts.push(studs + ' × ' + eur(r - 1) + ' (erm.)');
      if (kids) parts.push(kids + ' × ' + eur(Math.min(kidRate, r)) + ' (Kind)');
      detail = parts.join(' + ');
      if (s.light) { amount += s.light; detail += ' + ' + eur(s.light) + ' Licht'; }
    }
    return { amount, detail, tariff: t };
  }

  function quote(b) {
    const s = SPORTS[b.sport], lines = [], m = dayModel();
    const courts = m.ready ? m.courts : s.courts, unit = m.ready ? m.unit : s.unit;
    b.slots.slice().sort((x, y) => x.start - y.start || x.court - y.court).forEach(sl => {
      let c;
      if (LIVE) {
        const x = liveSlot(sl), known = x && x.price != null;
        c = { amount: known ? x.price / 100 : 0, detail: known ? 'Platzpreis laut Buchungssystem' : 'Preis an der Theke' };
      } else c = slotCost(b.sport, b.date, sl.start, b);
      lines.push({ kind: 'slot', slot: sl, label: hm(sl.start) + '–' + hm(sl.start + unit) + ' Uhr · ' + courts[sl.court], sub: c.detail, amount: c.amount });
    });
    if (b.rackets) lines.push({ label: b.rackets + ' × Leihschläger', sub: 'einmal pro Buchung', amount: b.rackets * s.rent.racket });
    if (b.shoes && s.rent.shoes) lines.push({ label: b.shoes + ' × Leihschuhe', sub: 'einmal pro Buchung', amount: b.shoes * s.rent.shoes });
    if (b.balls && s.rent.balls) lines.push({ label: 'Leihbälle', sub: 'einmal pro Buchung', amount: s.rent.balls });
    if (b.ttball && s.rent.ttball) lines.push({ label: 'Touchtennisball', sub: 'Kauf, bleibt bei dir', amount: s.rent.ttball });
    const total = lines.reduce((a, l) => a + l.amount, 0);
    return { lines, total };
  }

  /* ---------------- Buchungszustand ---------------- */
  const B = { sport: 'padel', date: iso(new Date()), step: 1, players: 4, kids: 0, students: 0, slots: [], rackets: 0, shoes: 0, balls: false, ttball: false, name: '', email: '', phone: '', agree: false, errors: {}, last: null };

  function firstBookableDate() {
    if (LIVE) return iso(new Date());
    const d = new Date();
    for (let i = 0; i < 14; i++) {
      const s = iso(d);
      if (slotsFor(B.sport, s).some(t => !isPast(s, t))) return s;
      d.setDate(d.getDate() + 1);
    }
    return iso(new Date());
  }
  function setSport(key) {
    if (LIVE) key = LIVE_SPORT;
    if (!SPORTS[key]) return;
    B.sport = key; B.slots = []; B.players = SPORTS[key].players.def; B.kids = 0; B.students = 0;
    B.rackets = 0; B.shoes = 0; B.balls = false; B.ttball = false; B.step = 1;
  }
  function clampParty() {
    const p = SPORTS[B.sport].players;
    B.players = Math.min(p.max, Math.max(p.min, B.players));
    B.kids = Math.min(B.kids, B.players);
    B.students = Math.min(B.students, B.players - B.kids);
    B.rackets = Math.min(B.rackets, B.players);
    B.shoes = Math.min(B.shoes, B.players);
  }
  const firstStart = () => Math.min.apply(null, B.slots.map(s => s.start));
  function cancelDeadline(dateStr, start) { const sec = cancelSeconds(); if (!sec) return new Date(0); const d = slotDate(dateStr, start); d.setSeconds(d.getSeconds() - sec); return d; }

  /* ---------------- Platz-Grafiken ---------------- */
  function courtSvg(key) {
    const L = 'fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"';
    const net = '<line x1="100" y1="6" x2="100" y2="114" stroke="#fff" stroke-width="3.2" stroke-dasharray="2 4"/>';
    const art = {
      padel: `<rect x="20" y="16" width="160" height="88" rx="3" ${L}/><rect x="12" y="8" width="176" height="104" rx="6" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="5"/>${net}<line x1="56" y1="16" x2="56" y2="104" ${L}/><line x1="144" y1="16" x2="144" y2="104" ${L}/><line x1="56" y1="60" x2="20" y2="60" ${L}/><line x1="144" y1="60" x2="180" y2="60" ${L}/>`,
      tennis: `<rect x="16" y="14" width="168" height="92" ${L}/><line x1="16" y1="26" x2="184" y2="26" ${L}/><line x1="16" y1="94" x2="184" y2="94" ${L}/>${net}<line x1="56" y1="26" x2="56" y2="94" ${L}/><line x1="144" y1="26" x2="144" y2="94" ${L}/><line x1="56" y1="60" x2="144" y2="60" ${L}/>`,
      badminton: `<rect x="22" y="14" width="156" height="92" ${L}/><line x1="22" y1="22" x2="178" y2="22" ${L}/><line x1="22" y1="98" x2="178" y2="98" ${L}/><line x1="34" y1="14" x2="34" y2="106" ${L}/><line x1="166" y1="14" x2="166" y2="106" ${L}/>${net}<line x1="80" y1="14" x2="80" y2="106" ${L}/><line x1="120" y1="14" x2="120" y2="106" ${L}/><line x1="22" y1="60" x2="80" y2="60" ${L}/><line x1="120" y1="60" x2="178" y2="60" ${L}/>`,
      touchtennis: `<rect x="34" y="24" width="132" height="72" ${L}/>${net}<line x1="66" y1="24" x2="66" y2="96" ${L}/><line x1="134" y1="24" x2="134" y2="96" ${L}/><line x1="66" y1="60" x2="134" y2="60" ${L}/><circle cx="52" cy="46" r="5" fill="#fff"/>`
    };
    return `<svg viewBox="0 0 200 120" role="img" aria-label="Spielfeld ${esc(SPORTS[key].name)}">${art[key]}</svg>`;
  }

  /* ---------------- Start, Sportarten ---------------- */
  function sportCards() {
    return SPORT_KEYS.map(k => {
      const s = SPORTS[k];
      return `<article class="sport-card" style="--acc:${s.color}">
        <div class="sport-art">${courtSvg(k)}</div>
        <div class="sport-body">
          <h3>${esc(s.name)}</h3>
          <div class="sport-price">${esc(s.from)} <small>${esc(s.fromUnit)}</small></div>
          <p>${esc(s.teaser)}</p>
          <div class="sport-actions">
            ${LIVE && k !== LIVE_SPORT ? '<span class="btn btn-ghost" aria-disabled="true">Nicht angebunden</span>' : `<a class="btn btn-dark" href="#buchen-${k}">Buchen</a>`}
            <a class="btn btn-ghost" href="#sport-${k}">Infos</a>
          </div>
        </div>
      </article>`;
    }).join('');
  }

  function renderHours() {
    const today = new Date().getDay();
    const html = DAY_ORDER.map(d => `<dt class="${d === today ? 'today' : ''}">${DAY_LONG[d]}${d === today ? ' (heute)' : ''}</dt><dd class="${d === today ? 'today' : ''}">${hoursText(d)}</dd>`).join('');
    $('#hoursList').innerHTML = html; $('#hoursList2').innerHTML = html;
    const m = nowMin(), cur = HOURS[today].find(([a, b]) => m >= a && m < b), next = HOURS[today].find(([a]) => a > m);
    const pill = $('#openPill');
    pill.classList.toggle('closed', !cur);
    let txt;
    if (cur) txt = 'Jetzt geöffnet · bis ' + hm(cur[1]) + ' Uhr';
    else if (next) txt = 'Gerade geschlossen · öffnet um ' + hm(next[0]) + ' Uhr';
    else { const tm = (today + 1) % 7; txt = 'Geschlossen · morgen ab ' + hm(HOURS[tm][0][0]) + ' Uhr'; }
    $('span', pill).textContent = txt;
  }

  function renderSport(key) {
    const s = SPORTS[key], v = $('#view-sport');
    if (!s) { location.hash = '#sportarten'; return; }
    v.innerHTML = `<div class="wrap section" style="--acc:${s.color}">
      <p class="crumb"><a href="#sportarten">Sportarten</a> / ${esc(s.name)}</p>
      <div class="sport-hero">
        <div>
          <p class="eyebrow">Sportart</p>
          <h1>${esc(s.name)}</h1>
          <p class="lead-dark">${esc(s.intro)}</p>
          <div class="hero-actions">
            <a class="btn btn-dark btn-lg" href="#buchen-${key}">${esc(s.name)} buchen</a>
            <a class="btn btn-ghost btn-lg" href="#preise" data-jump="p-${key}">Preise</a>
          </div>
        </div>
        <div class="art">${courtSvg(key)}</div>
      </div>
      <div class="facts">${s.facts.map(f => `<div class="fact"><small>${esc(f[0])}</small><b>${esc(f[1])}</b></div>`).join('')}</div>
      <div class="info-row two">
        <article class="info-card"><h2>Kurz erklärt</h2><ul class="checks">${s.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul></article>
        <article class="info-card"><h2>Schuhe &amp; Material</h2><p>${esc(s.shoes)}</p><p>Schläger${s.rent.balls ? ' und Bälle' : ''} kannst du bei der Buchung gleich mitbestellen.</p></article>
      </div>
    </div>`;
  }

  /* ---------------- Buchung: Ansichten ---------------- */
  function stepperHtml() {
    const names = ['Platz & Zeit', 'Mitspieler & Material', 'Prüfen & buchen'];
    return `<ol class="stepper" aria-label="Buchungsschritte">${names.map((n, i) => {
      const st = B.step > i + 1 ? 'done' : B.step === i + 1 ? 'on' : '';
      return `<li class="${st}"${st === 'on' ? ' aria-current="step"' : ''}><b>${st === 'done' ? '✓' : i + 1}</b><span>${n}</span></li>`;
    }).join('')}</ol>`;
  }

  function numStepper(key, val, min, max, label) {
    return `<div class="stepper-num" role="group" aria-label="${esc(label)}">
      <button type="button" data-num="${key}" data-d="-1" aria-label="${esc(label)} verringern" ${val <= min ? 'disabled' : ''}>−</button>
      <output aria-live="polite">${val}</output>
      <button type="button" data-num="${key}" data-d="1" aria-label="${esc(label)} erhöhen" ${val >= max ? 'disabled' : ''}>+</button>
    </div>`;
  }

  function step1() {
    const s = SPORTS[B.sport], m = dayModel();
    const courts = m.ready ? m.courts : s.courts, unit = m.ready ? m.unit : s.unit;
    const tabs = (LIVE ? [LIVE_SPORT] : SPORT_KEYS).map(k => `<button type="button" class="sport-tab" data-sport="${k}" aria-pressed="${k === B.sport}">${esc(SPORTS[k].name)}<small>${esc(SPORTS[k].from)} ${SPORTS[k].per === 'court' ? '/ Platz' : 'p. P.'}</small></button>`).join('');

    let days = '';
    const d = new Date();
    for (let i = 0; i < 14; i++) {
      const ds = iso(d);
      days += `<button type="button" class="day" data-date="${ds}" aria-pressed="${ds === B.date}" aria-label="${dateFull(ds)}"><small>${i === 0 ? 'Heute' : DAY_SHORT[d.getDay()]}</small><b>${d.getDate()}</b><span>${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}</span></button>`;
      d.setDate(d.getDate() + 1);
    }

    const times = m.ready ? m.times : [];
    const sel = (c, t) => B.slots.some(x => x.court === c && x.start === t);
    const cell = (c, t, showTime) => {
      const k = m.cell(c, t), on = sel(c, t), time = hm(t) + '–' + hm(t + unit);
      if (k.state !== 'free') { const why = k.state === 'past' ? 'vorbei' : 'belegt'; return `<button type="button" class="slot" disabled aria-label="${time} Uhr, ${esc(courts[c])}, ${why}">${showTime ? `<span class="t">${time}</span>` : ''}<span class="p">${why}</span></button>`; }
      return `<button type="button" class="slot" data-court="${c}" data-start="${t}" aria-pressed="${on}" aria-label="${time} Uhr, ${esc(courts[c])}, frei, ${k.spoken}${on ? ', ausgewählt' : ''}">${showTime ? `<span class="t">${time}</span>` : ''}<span class="p">${on ? '✓ ' : ''}${k.label}</span></button>`;
    };

    let grid;
    if (!m.ready) grid = m.error
      ? `<div class="empty"><p>${esc(m.error)}</p><button type="button" class="btn btn-dark" style="margin-top:12px" data-reload>Erneut versuchen</button></div>`
      : `<div class="empty" role="status">Freie Zeiten werden geladen …</div>`;
    else if (!times.length) grid = `<div class="empty">An diesem Tag gibt es keine buchbaren Zeiten.</div>`;
    else if (courts.length === 1) grid = `<div class="slot-tiles">${times.map(t => cell(0, t, true)).join('')}</div>`;
    else grid = `<div class="grid-scroll"><table class="slot-grid"><thead><tr><th scope="col">Zeit</th>${courts.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${times.map(t => `<tr><th scope="row">${hm(t)}<span class="end">–${hm(t + unit)}</span></th>${courts.map((_, c) => `<td>${cell(c, t, false)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

    const dayIdx = parseDate(B.date).getDay();
    const playerBox = s.per === 'person'
      ? `<div class="opt"><div><b>Wie viele spielen?</b><span>Der Preis pro Person hängt von der Gruppengröße ab.</span></div>${numStepper('players', B.players, s.players.min, s.players.max, 'Anzahl Spieler')}</div>`
      : '';

    return `<div class="panel">
        <h2>1. Sportart</h2>
        <div class="sport-tabs">${tabs}</div>
        ${playerBox ? `<div style="margin-top:16px">${playerBox}</div>` : ''}
        ${LIVE ? `<p class="hint">Testbetrieb: Angebunden ist das Buchungssystem für ${esc(s.name)}. Zeiten und Preise kommen direkt von dort.</p>` : ''}
      </div>
      <div class="panel">
        <div class="row-between"><h2 style="margin:0">2. Tag</h2><span class="open-note">${LIVE ? 'Belegung live aus dem Buchungssystem' : DAY_LONG[dayIdx] + ' geöffnet: ' + hoursText(dayIdx) + ' Uhr'}</span></div>
        <div class="days" style="margin-top:14px">${days}</div>
      </div>
      <div class="panel">
        <div class="row-between"><h2 style="margin:0">3. Uhrzeit${courts.length > 1 ? ' &amp; Platz' : ''}</h2><span class="open-note">${dateFull(B.date)} · ${unit} Min. je Einheit</span></div>
        <div class="legend"><span><i class="lg-free"></i>frei, mit Preis${s.per === 'person' ? ' pro Person' : ' pro Platz'}</span><span><i class="lg-sel"></i>deine Auswahl</span><span><i class="lg-taken"></i>belegt oder vorbei</span></div>
        ${grid}
        <p class="hint">Tippe eine oder mehrere freie Zeiten an (maximal ${MAX_SLOTS}). Mit der Auswahl ist noch nichts gebucht.</p>
      </div>`;
  }

  function step2() {
    const s = SPORTS[B.sport];
    let h = `<div class="panel"><h2>Wer spielt?</h2>
      <div class="opt"><div><b>Spieler insgesamt</b><span>${s.per === 'court' ? 'Der Platzpreis bleibt gleich und wird nur aufgeteilt.' : 'Der Preis pro Person hängt von der Gruppengröße ab.'}</span></div>${numStepper('players', B.players, s.players.min, s.players.max, 'Anzahl Spieler')}</div>
      ${LIVE ? '' : `<div class="opt"><div><b>davon Kinder bis 12 Jahre</b><span>${B.sport === 'tennis' ? '5 € je Einheit' : '4,50 € je Einheit'}</span></div>${numStepper('kids', B.kids, 0, B.players - B.students, 'Kinder bis 12')}</div>`}`;
    if (s.students && !LIVE) h += `<div class="opt"><div><b>davon Schüler bis 18 / Studierende</b><span>1 € Ermäßigung je Einheit, Ausweis mitbringen</span></div>${numStepper('students', B.students, 0, B.players - B.kids, 'Schüler und Studierende')}</div>`;
    h += `</div><div class="panel"><h2>Leihmaterial</h2>
      <div class="opt"><div><b>Leihschläger</b><span>${eur(s.rent.racket)} pro Person, einmal pro Buchung</span></div>${numStepper('rackets', B.rackets, 0, B.players, 'Leihschläger')}</div>`;
    if (s.rent.shoes) h += `<div class="opt"><div><b>Leih-Tennisschuhe</b><span>${eur(s.rent.shoes)} pro Person. Pflicht sind Teppichschuhe ohne Profil.</span></div>${numStepper('shoes', B.shoes, 0, B.players, 'Leihschuhe')}</div>`;
    if (s.rent.balls) h += `<div class="opt"><label class="check"><input type="checkbox" id="b-balls" data-flag="balls" ${B.balls ? 'checked' : ''}><span><b>Leihbälle</b> · ${eur(s.rent.balls)} pro Buchung</span></label></div>`;
    if (s.rent.ttball) h += `<div class="opt"><label class="check"><input type="checkbox" id="b-ttball" data-flag="ttball" ${B.ttball ? 'checked' : ''}><span><b>Touchtennisball kaufen</b> · ${eur(s.rent.ttball)}. Ohne eigenen Ball geht es nicht.</span></label></div>`;
    h += `</div>
      ${LIVE ? '<div class="notice info"><div><b>Ermäßigungen</b>Kinder, Schüler, Studierende und Hansefit werden an der Theke abgezogen. Das Leihmaterial wird mit der Buchung vorgemerkt.</div></div>' : '<div class="notice info"><div><b>Hansefit-Mitglied?</b>Eine Einheit pro Tag ist für dich enthalten. Dein Anteil wird an der Theke abgezogen, Mitspieler zahlen ihren Anteil.</div></div>'}
      <div class="notice warn"><div><b>Schuhe</b>${esc(s.shoes)}</div></div>`;
    return h;
  }

  function step3() {
    const s = SPORTS[B.sport], dl = cancelDeadline(B.date, firstStart()), late = dl <= new Date();
    const e = B.errors;
    return `<div class="panel"><h2>Deine Angaben</h2>
        <div class="form-grid">
          <label class="full">Vor- und Nachname <input id="b-name" data-field="name" autocomplete="name" value="${esc(B.name)}" class="${e.name ? 'err' : ''}">${e.name ? `<span class="field-err">${e.name}</span>` : ''}</label>
          <label>E-Mail für die Bestätigung <input id="b-email" data-field="email" type="email" autocomplete="email" inputmode="email" value="${esc(B.email)}" class="${e.email ? 'err' : ''}">${e.email ? `<span class="field-err">${e.email}</span>` : ''}</label>
          <label>Telefon (optional) <input id="b-phone" data-field="phone" type="tel" autocomplete="tel" value="${esc(B.phone)}"></label>
        </div>
        <p class="hint">Kein Kundenkonto nötig. Mit einem Konto könntest du später Stammdaten speichern.</p>
      </div>
      <div class="panel"><h2>Das gilt für deine Buchung</h2>
        <div class="notice ${late ? 'warn' : 'ok'}"><div><b>${late ? 'Nicht mehr kostenlos stornierbar' : 'Kostenlos stornierbar bis ' + stamp(dl)}</b>${late ? (LIVE ? 'Die Stornofrist ist bereits abgelaufen. Eine Absage geht dann nur noch telefonisch, der Platz wird voll berechnet.' : 'Der Termin beginnt in weniger als 24 Stunden. Bei einer Absage wird der Platz voll berechnet.') : 'Danach wird der Platz voll berechnet.'}</div></div>
        <div class="notice info"><div><b>Bezahlung vor Ort</b>Du zahlst an der Theke. Online wird nichts abgebucht.</div></div>
        <div class="notice warn"><div><b>Schuhe</b>${esc(s.shoes)}</div></div>
        <label class="check" style="margin-top:16px"><input type="checkbox" id="b-agree" data-flag="agree" ${B.agree ? 'checked' : ''}><span>Ich habe die Stornoregel und die Schuhregel gelesen.</span></label>
        ${e.agree ? `<span class="field-err">${e.agree}</span>` : ''}
      </div>`;
  }

  function summaryHtml() {
    const s = SPORTS[B.sport], q = quote(B), n = B.slots.length;
    const btnLabel = live.busy ? 'Wird gebucht …' : B.step === 1 ? 'Weiter zu Mitspielern' : B.step === 2 ? 'Weiter zur Prüfung' : 'Jetzt verbindlich buchen · ' + eur(q.total);
    const lines = q.lines.map(l => `<li><span>${esc(l.label)}<small>${esc(l.sub)}</small>${l.kind === 'slot' && B.step === 1 ? `<button type="button" class="rm" data-rm="${l.slot.court}-${l.slot.start}">entfernen</button>` : ''}</span><b>${eur(l.amount)}</b></li>`).join('');
    return `<div class="panel">
      <span class="state-chip"><i></i>Noch nicht gebucht</span>
      <h2>${esc(s.name)} · ${dateLong(B.date)}</h2>
      <p class="sum-sub">${n ? n + (n === 1 ? ' Spielzeit' : ' Spielzeiten') + ' · ' + B.players + ' Personen' : 'Wähle links eine freie Zeit.'}</p>
      ${n ? `<ul class="sum-lines">${lines}</ul>
        <div class="sum-total"><span>Gesamt</span><b>${eur(q.total)}</b></div>
        <p class="sum-pp">${eur(q.total / B.players)} pro Person bei ${B.players} Personen</p>` : ''}
      <button type="button" class="btn ${B.step === 3 ? 'btn-accent' : 'btn-dark'} btn-block ${B.step < 3 ? 'btn-next' : ''}" data-next ${n && !live.busy ? '' : 'disabled'}>${btnLabel}</button>
      <p class="sum-foot">${B.step === 3 ? 'Erst dieser Knopf bucht verbindlich. Bezahlt wird vor Ort.' : 'Gebucht wird erst im letzten Schritt.'}</p>
    </div>`;
  }

  function confirmedHtml(bk) {
    const s = SPORTS[bk.sport], dl = new Date(bk.deadline), late = dl <= new Date(bk.created);
    return `<div class="panel confirm" style="--acc:${s.color}">
      <div class="big-check" aria-hidden="true"></div>
      <span class="state-chip ok"><i></i>Verbindlich gebucht</span>
      <h2 tabindex="-1" id="confirmTitle" style="margin-top:12px">Dein Platz ist gebucht.</h2>
      <p>Die Bestätigung geht an ${esc(bk.email)}.</p>
      <div class="code" aria-label="Buchungsnummer">${bk.live ? 'Nr. ' : ''}${esc(bk.id)}</div>
      <div class="ticket"><dl>
        <dt>Sportart</dt><dd>${esc(s.name)}</dd>
        <dt>Tag</dt><dd>${dateFull(bk.date)}</dd>
        <dt>Zeit &amp; Platz</dt><dd>${bk.slots.map(x => hm(x.start) + '–' + hm(x.start + (bk.unit || s.unit)) + ' · ' + esc(x.name || s.courts[x.court])).join('<br>')}</dd>
        <dt>Personen</dt><dd>${bk.players}</dd>
        <dt>Zu zahlen vor Ort</dt><dd>${eur(bk.total)}</dd>
        <dt>Kostenlos stornierbar</dt><dd>${late ? 'nicht mehr möglich' : 'bis ' + stamp(dl)}</dd>
      </dl></div>
      <div class="confirm-actions">
        ${EMBED ? '' : `<button type="button" class="btn btn-dark" data-ics="${esc(bk.id)}">In den Kalender eintragen</button>`}
        <a class="btn ${EMBED ? 'btn-dark' : 'btn-ghost'}" href="#meine-buchungen">Meine Buchungen</a>
        <button type="button" class="btn btn-ghost" data-again>Weitere Zeit buchen</button>
      </div>
      ${bk.failed && bk.failed.length ? `<div class="notice warn" style="margin-top:18px;text-align:left"><div><b>Nicht alles gebucht</b>${bk.failed.length === 1 ? 'Eine Zeit war' : bk.failed.length + ' Zeiten waren'} inzwischen belegt und wurde nicht gebucht: ${bk.failed.map(f => esc(f.start) + ' Uhr').join(', ')}.</div></div>` : ''}
      <p class="hint" style="margin-top:18px">${bk.live ? 'Testbetrieb: Die Buchung ist im angebundenen Buchungssystem eingetragen und dort in der Verwaltung sichtbar.' : 'Design-Entwurf: Es wurde nichts an den Racket Sport Park übermittelt und keine E-Mail verschickt.'}</p>
    </div>`;
  }

  function renderBooking() {
    clampParty();
    const root = $('#bookRoot'), bar = $('#bookBar');
    if (B.step === 4 && B.last) {
      $('#bookTitle').textContent = 'Buchung bestätigt';
      root.innerHTML = confirmedHtml(B.last);
      bar.classList.remove('show'); document.body.classList.remove('has-bar');
      return;
    }
    $('#bookTitle').textContent = 'Platz buchen';
    const body = B.step === 1 ? step1() : B.step === 2 ? step2() : step3();
    const back = B.step > 1 ? `<button type="button" class="back-link" data-back>← Zurück</button>` : '';
    root.innerHTML = `${stepperHtml()}<div class="book-layout"><div>${body}${back}</div><aside class="summary" aria-label="Deine Auswahl">${summaryHtml()}</aside></div>`;

    const n = B.slots.length, q = quote(B);
    if (n && B.step < 3) {
      bar.innerHTML = `<div><small>Noch nicht gebucht · ${n} ${n === 1 ? 'Zeit' : 'Zeiten'}</small><b>${eur(q.total)}</b></div><button type="button" class="btn btn-accent" data-next>Weiter</button>`;
      bar.hidden = false; bar.classList.add('show'); document.body.classList.add('has-bar');
    } else { bar.classList.remove('show'); document.body.classList.remove('has-bar'); }
    const active = $('.day[aria-pressed="true"]', root);
    if (active) {
      const strip = active.parentElement, left = active.offsetLeft - strip.offsetLeft;
      if (left + active.offsetWidth > strip.clientWidth) strip.scrollLeft = left - strip.clientWidth + active.offsetWidth + 8;
    }
  }

  function goStep(n) {
    B.step = n; B.errors = {};
    renderBooking();
    window.scrollTo({ top: Math.max(0, $('#view-buchen').offsetTop - 70) });
    const t = $('#confirmTitle') || $('#bookTitle'); if (t && n === 4) t.focus();
  }

  function next() {
    if (!B.slots.length) return;
    if (B.step < 3) return goStep(B.step + 1);
    // Schritt 3: prüfen, dann verbindlich buchen
    const e = {};
    if (B.name.trim().length < 3) e.name = 'Bitte gib deinen Namen an.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(B.email.trim())) e.email = 'Bitte gib eine gültige E-Mail-Adresse an.';
    if (!B.agree) e.agree = 'Bitte bestätige die Regeln, bevor du buchst.';
    // Zwischenzeitlich vergeben? (Im Live-Modus prüft das der Server beim Buchen.)
    const gone = LIVE ? [] : B.slots.filter(sl => isPast(B.date, sl.start) || isTaken(B.sport, B.date, sl.court, sl.start));
    if (gone.length) { B.slots = B.slots.filter(sl => gone.indexOf(sl) < 0); B.step = 1; renderBooking(); alertDlg('Zeit nicht mehr frei', 'Mindestens eine deiner Zeiten ist inzwischen vergeben oder vorbei. Bitte wähle neu. Es wurde nichts gebucht.'); return; }
    B.errors = e;
    if (Object.keys(e).length) { renderBooking(); const bad = $('.err') || $('[data-flag="agree"]'); if (bad) bad.focus(); return; }
    if (LIVE) return submitLive();
    const q = quote(B), start = firstStart();
    const bk = {
      id: 'RSP-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
      sport: B.sport, date: B.date, slots: B.slots.slice().sort((a, b) => a.start - b.start), players: B.players,
      total: q.total, lines: q.lines.map(l => ({ label: l.label, amount: l.amount })),
      name: B.name.trim(), email: B.email.trim(), status: 'confirmed',
      created: new Date().toISOString(), deadline: cancelDeadline(B.date, start).toISOString()
    };
    const all = store.get(); all.unshift(bk); store.set(all);
    B.last = bk; B.slots = []; B.agree = false;
    updateCount(); goStep(4);
  }

  // Live: Buchung an das Buchungssystem senden. Erst die Antwort des Servers gilt als gebucht.
  function submitLive() {
    if (live.busy) return;
    const m = dayModel(), day = live.days[B.date];
    if (!m.ready) return;
    const q = quote(B), sids = day.squares.map(x => x.sid), date = B.date;
    const sorted = B.slots.slice().sort((a, b) => a.start - b.start || a.court - b.court);
    const items = sorted.map(sl => ({ sid: sids[sl.court], start: hm(sl.start), end: hm(sl.start + m.unit) }));
    const note = ['Spieler: ' + B.players, B.rackets ? 'Leihschläger: ' + B.rackets : '', B.shoes ? 'Leihschuhe: ' + B.shoes : '',
      B.balls ? 'Leihbälle: ja' : '', B.ttball ? 'Touchtennisball: ja' : ''].filter(Boolean).join(' · ');
    const extras = q.lines.filter(l => l.kind !== 'slot').reduce((a, l) => a + l.amount, 0);

    live.busy = true; renderBooking();
    api('/book', { date, name: B.name.trim(), email: B.email.trim(), phone: B.phone.trim(), note, items }).then(res => {
      live.busy = false;
      const done = res.bookings || [], deadlines = done.map(x => x.cancelUntil).filter(Boolean).sort();
      const bk = {
        id: done.map(x => x.bid).join(' / '), live: true, remote: done.map(x => ({ bid: x.bid, token: x.token })),
        sport: B.sport, date, unit: m.unit, players: B.players,
        slots: done.map(x => ({ court: Math.max(0, sids.indexOf(x.sid)), start: toMin(x.start), name: x.square })),
        total: done.reduce((a, x) => a + (x.price || 0), 0) / 100 + extras,
        name: B.name.trim(), email: B.email.trim(), status: 'confirmed', failed: res.failed || [],
        created: new Date().toISOString(), deadline: deadlines[0] || new Date(0).toISOString()
      };
      const all = store.get(); all.unshift(bk); store.set(all);
      delete live.days[date];
      B.last = bk; B.slots = []; B.agree = false;
      updateCount(); goStep(4);
    }, err => {
      live.busy = false; delete live.days[date];
      if (err.status === 409) { B.slots = []; B.step = 1; renderBooking(); alertDlg('Zeit nicht mehr frei', err.message + ' Bitte wähle neu.'); }
      else if (err.status) { renderBooking(); alertDlg('Buchung nicht möglich', err.message + ' Es wurde nichts gebucht.'); }
      else { renderBooking(); alertDlg('Verbindung unterbrochen', 'Wir konnten nicht prüfen, ob deine Buchung angekommen ist. Schau bitte in dein Postfach oder ruf an der Theke an (0541 4410-10), bevor du es erneut versuchst.'); }
    });
  }

  // Live: Status aus dem Buchungssystem nachziehen, z. B. wenn die Theke storniert hat.
  function syncLive() {
    const all = store.get(), pairs = [];
    all.forEach(b => { if (b.live && b.status === 'confirmed') b.remote.forEach(r => pairs.push(r.bid + '.' + r.token)); });
    if (!pairs.length) return;
    api('/status?b=' + pairs.slice(0, 25).join(',')).then(res => {
      const st = {}; (res.bookings || []).forEach(x => { st[x.bid] = x.status; });
      let changed = false;
      all.forEach(b => {
        if (b.live && b.status === 'confirmed' && b.remote.length && b.remote.every(r => st[r.bid] === 'cancelled')) {
          b.status = 'cancelled'; b.cancelledAt = new Date().toISOString(); b.byPark = true; changed = true;
        }
      });
      if (changed) { store.set(all); updateCount(); if (!$('#view-meine-buchungen').hidden) renderMine(); }
    }, () => {});
  }

  /* ---------------- Meine Buchungen ---------------- */
  function bookingState(bk) {
    if (bk.status === 'cancelled') return 'cancelled';
    const s = SPORTS[bk.sport], last = bk.slots[bk.slots.length - 1];
    return slotDate(bk.date, last.start + (bk.unit || s.unit)) < new Date() ? 'past' : 'confirmed';
  }
  function updateCount() {
    const n = store.get().filter(b => bookingState(b) === 'confirmed').length, el = $('#mineCount');
    el.textContent = n; el.hidden = !n;
  }
  function renderMine() {
    const all = store.get(), root = $('#mineRoot');
    if (!all.length) {
      root.innerHTML = `<div class="panel empty"><p><b>Du hast noch nichts gebucht.</b></p><p style="margin:6px 0 16px">Sobald du eine Buchung abschließt, erscheint sie hier mit Buchungsnummer und Stornofrist.</p><a class="btn btn-dark" href="#buchen">Freie Plätze ansehen</a></div>`;
      return;
    }
    root.innerHTML = all.map(bk => {
      const s = SPORTS[bk.sport], st = bookingState(bk), dl = new Date(bk.deadline), free = dl > new Date();
      const chip = st === 'confirmed' ? '<span class="state-chip ok"><i></i>Gebucht</span>' : st === 'cancelled' ? '<span class="state-chip bad"><i></i>Storniert</span>' : '<span class="state-chip past"><i></i>Vorbei</span>';
      const foot = st === 'confirmed'
        ? `<span>${free ? 'Kostenlos stornierbar bis ' + stamp(dl) : bk.live ? 'Stornofrist abgelaufen. Absage nur telefonisch: 0541 4410-10' : 'Stornofrist abgelaufen: Absage wird voll berechnet'}</span><div>${EMBED ? '' : `<button type="button" class="btn btn-ghost" data-ics="${esc(bk.id)}">Kalender</button>`}${bk.live && !free ? '' : `<button type="button" class="btn btn-ghost" data-cancel="${esc(bk.id)}">Stornieren</button>`}</div>`
        : st === 'cancelled' ? `<span>Storniert am ${stamp(new Date(bk.cancelledAt))}${bk.byPark ? ' · im Buchungssystem storniert' : bk.fee ? ' · Platz wird berechnet' : ' · kostenlos'}</span>` : `<span>Dieser Termin liegt in der Vergangenheit.</span>`;
      return `<article class="booking ${st}" style="--acc:${s.color}">
        <div class="booking-head"><div>${chip}<h2>${esc(s.name)} · ${dateFull(bk.date)}</h2>
          <p class="meta">${bk.slots.map(x => hm(x.start) + '–' + hm(x.start + (bk.unit || s.unit)) + ' Uhr · ' + esc(x.name || s.courts[x.court])).join(' | ')} · ${bk.players} Personen · Nr. ${esc(bk.id)}</p></div>
          <div class="total">${eur(bk.total)}</div></div>
        <div class="booking-foot">${foot}</div>
      </article>`;
    }).join('') + `<p class="hint">${LIVE ? 'Testbetrieb: Die Buchungen stehen im Buchungssystem. Diese Übersicht merkt sich dein Browser.' : 'Design-Entwurf: Die Buchungen liegen nur in diesem Browser.'}</p>`;
  }

  function askCancel(id) {
    const bk = store.get().find(b => b.id === id); if (!bk) return;
    const s = SPORTS[bk.sport], free = new Date(bk.deadline) > new Date(), dlg = $('#dlg');
    dlg.innerHTML = `<h2>Buchung stornieren?</h2>
      <p>${esc(s.name)} am ${dateFull(bk.date)}, ${hm(bk.slots[0].start)} Uhr.</p>
      <div class="notice ${free ? 'ok' : 'warn'}" style="margin-top:14px"><div><b>${free ? 'Die Stornierung ist kostenlos.' : 'Der Platz wird voll berechnet (' + eur(bk.total) + ').'}</b>${free ? 'Der Platz wird sofort wieder freigegeben.' : 'Die Frist von 24 Stunden vor Spielbeginn ist abgelaufen.'}</div></div>
      <div class="dlg-actions"><button type="button" class="btn btn-ghost" data-close>Buchung behalten</button><button type="button" class="btn btn-danger" data-do-cancel="${esc(id)}">Jetzt stornieren</button></div>`;
    dlg.showModal();
  }
  function alertDlg(title, text) {
    const dlg = $('#dlg');
    dlg.innerHTML = `<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="dlg-actions"><button type="button" class="btn btn-dark" data-close>Verstanden</button></div>`;
    dlg.showModal();
  }

  function downloadIcs(id) {
    const bk = store.get().find(b => b.id === id); if (!bk) return;
    const s = SPORTS[bk.sport];
    const f = d => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
    const ev = bk.slots.map((x, i) => ['BEGIN:VEVENT', 'UID:' + bk.id + '-' + i + '@rsp-entwurf', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(slotDate(bk.date, x.start)), 'DTEND:' + f(slotDate(bk.date, x.start + (bk.unit || s.unit))), 'SUMMARY:' + s.name + ' – Racket Sport Park (' + (x.name || s.courts[x.court]) + ')', 'LOCATION:Große Schulstraße 75a\\, 49078 Osnabrück', 'DESCRIPTION:Buchungsnummer ' + bk.id, 'END:VEVENT'].join('\r\n')).join('\r\n');
    const blob = new Blob(['BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//RSP Entwurf//DE\r\n' + ev + '\r\nEND:VCALENDAR\r\n'], { type: 'text/calendar' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = bk.id + '.ics';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ---------------- Router ---------------- */
  const VIEWS = ['home', 'sportarten', 'sport', 'buchen', 'meine-buchungen', 'preise', 'angebote', 'park', 'kontakt'];
  const TITLES = { home: 'Start', sportarten: 'Sportarten', sport: 'Sportart', buchen: 'Platz buchen', 'meine-buchungen': 'Meine Buchungen', preise: 'Preise', angebote: 'Angebote', park: 'Der Park', kontakt: 'Kontakt' };
  let pendingJump = null;

  function route() {
    // Adressen sind schlichte Anker: #preise, #sport-padel, #buchen-padel
    const raw = location.hash.slice(1);
    let view = raw || 'home', arg = null;
    if (raw === 'start') view = 'home';
    else if (raw.indexOf('sport-') === 0) { view = 'sport'; arg = raw.slice(6); }
    else if (raw.indexOf('buchen-') === 0) { view = 'buchen'; arg = raw.slice(7); }
    if (VIEWS.indexOf(view) < 0) view = 'home';

    if (view === 'sport') renderSport(arg);
    if (view === 'buchen') {
      const sp = arg;
      if (sp && SPORTS[sp] && (sp !== B.sport || B.step === 4)) { setSport(sp); B.date = firstBookableDate(); }
      else if (B.step === 4) { B.step = 1; }
      if (isPast(B.date, GRID_END)) B.date = firstBookableDate();
      if (LIVE && B.step === 1) loadDay(B.date, true);
      renderBooking();
      if (LIVE && sp && sp !== LIVE_SPORT && SPORTS[sp]) alertDlg('Nur ' + SPORTS[LIVE_SPORT].name + ' angebunden', 'Im Testbetrieb ist nur das Buchungssystem für ' + SPORTS[LIVE_SPORT].name + ' verbunden. Du siehst deshalb diesen Plan.');
    } else { $('#bookBar').classList.remove('show'); document.body.classList.remove('has-bar'); }
    if (view === 'meine-buchungen') { renderMine(); if (LIVE) syncLive(); }

    VIEWS.forEach(v => { const el = $('#view-' + v); if (el) el.hidden = v !== view; });
    $$('.nav a[data-nav]').forEach(a => {
      const on = a.dataset.nav === view || (a.dataset.nav === 'sportarten' && view === 'sport');
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (!EMBED) document.title = (view === 'sport' && SPORTS[arg] ? SPORTS[arg].name : TITLES[view]) + ' – Racket Sport Park Osnabrück (Entwurf)';
    $('#nav').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false');

    if (pendingJump) { const t = document.getElementById(pendingJump); pendingJump = null; if (t) { t.scrollIntoView(); return; } }
    window.scrollTo(0, 0);
  }

  /* ---------------- Ereignisse ---------------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('button, a'); if (!t) return;

    if (t.hasAttribute('data-skip')) { e.preventDefault(); $('#main').focus(); return; }
    if (t.dataset.jump) {
      pendingJump = t.dataset.jump;
      if (location.hash === t.getAttribute('href')) { e.preventDefault(); route(); }
      return;
    }
    if (t.id === 'menuBtn') { const open = $('#nav').classList.toggle('open'); t.setAttribute('aria-expanded', open); return; }
    if (t.dataset.sport) { setSport(t.dataset.sport); B.date = firstBookableDate(); return renderBooking(); }
    if (t.dataset.date) { B.date = t.dataset.date; B.slots = []; if (LIVE) loadDay(B.date, true); return renderBooking(); }
    if (t.hasAttribute('data-reload')) { loadDay(B.date, true); return renderBooking(); }
    if (t.dataset.start !== undefined && t.classList.contains('slot')) {
      const c = +t.dataset.court, st = +t.dataset.start, i = B.slots.findIndex(x => x.court === c && x.start === st);
      if (i >= 0) B.slots.splice(i, 1);
      else if (B.slots.length >= MAX_SLOTS) return alertDlg('Maximal ' + MAX_SLOTS + ' Zeiten', 'Pro Buchung kannst du bis zu ' + MAX_SLOTS + ' Spielzeiten wählen. Entferne eine Zeit oder schließe diese Buchung erst ab.');
      else B.slots.push({ court: c, start: st });
      return renderBooking();
    }
    if (t.dataset.rm) { const [c, st] = t.dataset.rm.split('-').map(Number); B.slots = B.slots.filter(x => !(x.court === c && x.start === st)); return renderBooking(); }
    if (t.dataset.num) {
      const k = t.dataset.num; B[k] += +t.dataset.d; clampParty(); renderBooking();
      const again = $(`[data-num="${k}"][data-d="${t.dataset.d}"]:not([disabled])`) || $(`[data-num="${k}"]:not([disabled])`); if (again) again.focus();
      return;
    }
    if (t.hasAttribute('data-next')) return next();
    if (t.hasAttribute('data-back')) return goStep(B.step - 1);
    if (t.hasAttribute('data-again')) { B.step = 1; B.last = null; renderBooking(); return window.scrollTo(0, 0); }
    if (t.dataset.ics) return downloadIcs(t.dataset.ics);
    if (t.dataset.cancel) return askCancel(t.dataset.cancel);
    if (t.hasAttribute('data-close')) return $('#dlg').close();
    if (t.dataset.doCancel) {
      const all = store.get(), bk = all.find(b => b.id === t.dataset.doCancel);
      if (bk && bk.live) {
        t.disabled = true; t.textContent = 'Wird storniert …';
        Promise.all(bk.remote.map(r => api('/cancel', r))).then(() => {
          bk.fee = false; bk.status = 'cancelled'; bk.cancelledAt = new Date().toISOString(); store.set(all);
          delete live.days[bk.date]; $('#dlg').close(); updateCount(); renderMine();
        }, err => { $('#dlg').close(); alertDlg('Stornierung nicht möglich', err.status ? err.message : 'Der Buchungsserver ist gerade nicht erreichbar. Bitte versuch es erneut.'); });
        return;
      }
      if (bk) { bk.fee = new Date(bk.deadline) <= new Date(); bk.status = 'cancelled'; bk.cancelledAt = new Date().toISOString(); store.set(all); }
      $('#dlg').close(); updateCount(); renderMine();
    }
  });

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.field) {
      B[t.dataset.field] = t.value;
      if (B.errors[t.dataset.field]) { B.errors[t.dataset.field] = ''; t.classList.remove('err'); const m = t.parentElement.querySelector('.field-err'); if (m) m.remove(); }
    }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.flag) { B[t.dataset.flag] = t.checked; if (t.dataset.flag !== 'agree') renderBooking(); else { B.errors.agree = ''; const m = t.closest('.panel').querySelector(':scope > .field-err'); if (m) m.remove(); } }
  });

  $('#contactForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, note = $('#contactNote');
    if (!f.checkValidity()) { note.style.color = 'var(--bad)'; note.textContent = 'Bitte fülle Name, E-Mail und Nachricht aus.'; return; }
    note.style.color = ''; note.textContent = 'Danke! (Design-Entwurf: Die Nachricht wurde nicht verschickt.)'; f.reset();
  });

  /* ---------------- Start ---------------- */
  memory = store.get();
  if (LIVE) {
    setSport(LIVE_SPORT);
    const bar = $('.demo-bar');
    if (bar) bar.innerHTML = '<strong>Testbetrieb</strong> · keine offizielle Seite<span class="long"> des Racket Sport Park</span> · verbunden mit einer Test-Installation des Buchungssystems';
  }
  $('#homeSports').innerHTML = sportCards();
  $('#allSports').innerHTML = sportCards();
  renderHours(); updateCount();
  B.date = firstBookableDate();
  window.addEventListener('hashchange', route);
  route();
})();
