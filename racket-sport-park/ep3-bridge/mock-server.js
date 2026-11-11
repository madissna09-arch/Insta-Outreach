#!/usr/bin/env node
/*
 * Platzhalter für das Buchungssystem, solange kein ep-3 läuft.
 *
 * Spricht exakt dieselbe Schnittstelle wie das Modul RspBridge (/bridge/slots, /book,
 * /cancel, /status) und liefert die Oberfläche im Live-Modus aus. Unter /verwaltung
 * zeigt er alle Buchungen, als Ersatz für die ep-3-Verwaltung.
 *
 * Start:  node mock-server.js [Port]      Standard-Port: 8090
 * Daten liegen nur im Arbeitsspeicher.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.argv[2] || process.env.PORT || 8090);
const SITE = path.resolve(__dirname, '..');

/* ---- Stammdaten, wie sie in ep-3 für die Padel-Installation des Parks stünden ---- */
const SQUARES = [{ sid: 1, name: 'Padel-Tennis', block: 3600, cancelRange: 86400, timeStart: 10 * 3600, timeEnd: 22 * 3600 }];
// Preisregeln (Cent pro Stunde): Di–Do vor 15 Uhr 20 €, sonst 24 €
function priceFor(date, startSec) {
  const d = new Date(date + 'T00:00:00').getDay();
  return d >= 2 && d <= 4 && startSec < 15 * 3600 ? 2000 : 2400;
}
// ep-3 kennt nur eine Öffnungszeit pro Platz. Zeiten außerhalb der echten Öffnungszeiten
// sperrt der Park deshalb über Dauerbuchungen. Das bildet der Platzhalter nach.
const OPEN = { 1: [[15, 22]], 2: [[10, 12], [15, 22]], 3: [[10, 12], [15, 22]], 4: [[10, 12], [15, 22]], 5: [[15, 22]], 6: [[13, 19]], 0: [[10, 20]] };
const isBlocked = (date, startSec, endSec) => {
  const open = OPEN[new Date(date + 'T00:00:00').getDay()];
  return !open.some(([a, b]) => startSec >= a * 3600 && endSec <= b * 3600);
};

const bookings = []; // { bid, token, sid, date, start, end, status, name, email, phone, note, price, created, source }
let nextBid = 1041;

const clock = sec => String(Math.floor(sec / 3600)).padStart(2, '0') + ':' + String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
const toSec = t => { const p = String(t).split(':'); return Number(p[0]) * 3600 + Number(p[1] || 0) * 60; };
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const validDate = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v)) && !isNaN(new Date(v + 'T00:00:00'));
const startOf = (date, sec) => new Date(new Date(date + 'T00:00:00').getTime() + sec * 1000);

function seed() {
  // Ein paar fremde Buchungen, damit der Plan nicht leer ist
  const base = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(base); d.setDate(d.getDate() + i);
    const date = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    [17, 18, 20].forEach((h, k) => {
      if ((i + k) % 3 === 0) return;
      if (isBlocked(date, h * 3600, (h + 1) * 3600)) return;
      bookings.push({ bid: nextBid++, token: crypto.randomBytes(16).toString('hex'), sid: 1, date, start: clock(h * 3600), end: clock((h + 1) * 3600),
        status: 'single', name: 'Stammkunde ' + (k + 1), email: '', phone: '', note: 'Telefonisch an der Theke', price: priceFor(date, h * 3600), created: new Date().toISOString(), source: 'Theke' });
    });
  }
}

function slotState(sq, date, startSec) {
  const endSec = startSec + sq.block;
  if (startSec < sq.timeStart || endSec > sq.timeEnd) return 'closed';
  // wie ep-3: vorbei, sobald die halbe Spielzeit verstrichen ist
  if (startOf(date, startSec).getTime() < Date.now() - (sq.block / 2) * 1000) return 'past';
  if (isBlocked(date, startSec, endSec)) return 'taken';
  const hit = bookings.some(b => b.status !== 'cancelled' && b.sid === sq.sid && b.date === date && toSec(b.start) < endSec && toSec(b.end) > startSec);
  return hit ? 'taken' : 'free';
}
const cancelUntil = (sq, date, startSec) => sq.cancelRange ? new Date(startOf(date, startSec).getTime() - sq.cancelRange * 1000).toISOString() : null;

class ApiError extends Error { constructor(msg, status) { super(msg); this.status = status; } }

const routes = {
  'GET /bridge/slots'(q) {
    if (!validDate(q.date)) throw new ApiError('Ungültiges Datum.', 422);
    const slots = [];
    SQUARES.forEach(sq => {
      for (let t = sq.timeStart; t + sq.block <= sq.timeEnd; t += sq.block) {
        const state = slotState(sq, q.date, t);
        slots.push({ sid: sq.sid, start: clock(t), end: clock(t + sq.block), state, price: state === 'free' ? priceFor(q.date, t) : null });
      }
    });
    return { date: q.date, now: new Date().toISOString(), squares: SQUARES.map(({ sid, name, block, cancelRange }) => ({ sid, name, block, cancelRange })), slots };
  },

  'POST /bridge/book'(q, body) {
    const name = String(body.name || '').trim(), email = String(body.email || '').trim();
    const items = Array.isArray(body.items) ? body.items : [];
    if (!validDate(body.date)) throw new ApiError('Ungültiges Datum.', 422);
    if (name.length < 3) throw new ApiError('Bitte gib deinen Vor- und Nachnamen an.', 422);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new ApiError('Bitte gib eine gültige E-Mail-Adresse an.', 422);
    if (!items.length || items.length > 4) throw new ApiError('Bitte wähle eine bis 4 Spielzeiten.', 422);

    const checked = items.map(it => {
      const sq = SQUARES.find(s => s.sid === Number(it.sid));
      if (!sq) throw new ApiError('Die Zeit ' + it.start + ' Uhr ist nicht buchbar.', 409);
      const st = slotState(sq, body.date, toSec(it.start));
      if (st === 'taken') throw new ApiError('Die Zeit ' + it.start + ' Uhr ist inzwischen belegt.', 409);
      if (st !== 'free') throw new ApiError('Die Zeit ' + it.start + ' Uhr ist nicht buchbar.', 409);
      return { sq, startSec: toSec(it.start) };
    });

    const created = [], failed = [];
    checked.forEach(({ sq, startSec }) => {
      if (slotState(sq, body.date, startSec) !== 'free') { failed.push({ sid: sq.sid, start: clock(startSec), reason: 'taken' }); return; }
      const b = { bid: nextBid++, token: crypto.randomBytes(16).toString('hex'), sid: sq.sid, date: body.date, start: clock(startSec), end: clock(startSec + sq.block),
        status: 'single', name, email, phone: String(body.phone || '').slice(0, 40), note: ('Gebucht über die neue Website.\n' + String(body.note || '').slice(0, 500)).trim(),
        price: priceFor(body.date, startSec), created: new Date().toISOString(), source: 'Neue Website' };
      bookings.push(b);
      created.push({ bid: b.bid, token: b.token, sid: sq.sid, square: sq.name, date: b.date, start: b.start, end: b.end, price: b.price, cancelUntil: cancelUntil(sq, b.date, startSec) });
    });
    if (!created.length) throw new ApiError('Die gewählten Zeiten sind inzwischen belegt. Es wurde nichts gebucht.', 409);
    return { bookings: created, failed };
  },

  'POST /bridge/cancel'(q, body) {
    const b = bookings.find(x => x.bid === Number(body.bid) && x.token === String(body.token));
    if (!b) throw new ApiError('Buchung nicht gefunden.', 404);
    if (b.status === 'cancelled') return { bid: b.bid, status: 'cancelled' };
    const sq = SQUARES.find(s => s.sid === b.sid), until = cancelUntil(sq, b.date, toSec(b.start));
    if (!until || new Date(until) <= new Date()) throw new ApiError('Die Stornofrist ist abgelaufen. Bitte ruf an der Theke an.', 409);
    b.status = 'cancelled';
    return { bid: b.bid, status: 'cancelled' };
  },

  'GET /bridge/status'(q) {
    const pairs = String(q.b || '').split(',').filter(Boolean);
    if (pairs.length > 25) throw new ApiError('Zu viele Buchungen angefragt.', 422);
    return { bookings: pairs.map(p => {
      const [bid, token] = p.split('.'), b = bookings.find(x => x.bid === Number(bid) && x.token === token);
      if (!b) return { bid: Number(bid), status: 'unknown' };
      const sq = SQUARES.find(s => s.sid === b.sid);
      return { bid: b.bid, status: b.status === 'cancelled' ? 'cancelled' : 'confirmed', cancelUntil: cancelUntil(sq, b.date, toSec(b.start)) };
    }) };
  },

  // Nur im Platzhalter: Die Theke storniert eine Buchung in der Verwaltung
  'POST /verwaltung/storno'(q, body) {
    const b = bookings.find(x => x.bid === Number(body.bid));
    if (!b) throw new ApiError('Buchung nicht gefunden.', 404);
    b.status = 'cancelled';
    return { ok: true };
  }
};

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function adminPage() {
  const rows = bookings.slice().sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).filter(b => b.date >= today()).map(b => `
    <tr class="${b.status === 'cancelled' ? 'off' : ''} ${b.source === 'Neue Website' ? 'new' : ''}">
      <td>${b.bid}</td><td>${esc(b.date.split('-').reverse().join('.'))}</td><td>${esc(b.start)}–${esc(b.end)}</td><td>${esc(SQUARES.find(s => s.sid === b.sid).name)}</td>
      <td><b>${esc(b.name)}</b><br><small>${esc(b.email)} ${esc(b.phone)}</small></td><td>${(b.price / 100).toFixed(2).replace('.', ',')} €</td>
      <td><small>${esc(b.note).replace(/\n/g, '<br>')}</small></td><td>${esc(b.source)}</td>
      <td>${b.status === 'cancelled' ? 'storniert' : `gebucht <button data-bid="${b.bid}">stornieren</button>`}</td>
    </tr>`).join('');
  return `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Verwaltung (Platzhalter)</title>
  <style>body{font:15px/1.45 system-ui,sans-serif;margin:24px;color:#1b2a33;background:#f4f6f8}h1{font-size:22px;margin:0 0 4px}p{color:#5b6b76;margin:0 0 18px}
  table{border-collapse:collapse;width:100%;background:#fff}th,td{border:1px solid #d9e0e5;padding:8px 10px;text-align:left;vertical-align:top}th{background:#547B97;color:#fff;font-size:13px}
  tr.new td{background:#eef7e4}tr.off td{color:#9aa6ad;text-decoration:line-through}tr.off td:last-child{text-decoration:none}small{color:#6b7a84}button{margin-left:8px}</style>
  <h1>Buchungen · Verwaltung</h1><p>Platzhalter für die ep-3-Verwaltung. Grün hinterlegt: über die neue Website gebucht.</p>
  <table><thead><tr><th>Nr.</th><th>Datum</th><th>Zeit</th><th>Platz</th><th>Kunde</th><th>Preis</th><th>Notiz</th><th>Herkunft</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
  <script>document.addEventListener('click',function(e){var b=e.target.dataset.bid;if(!b)return;fetch('/verwaltung/storno',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bid:Number(b)})}).then(function(){location.reload()})})</script></html>`;
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

function serveSite(res, urlPath) {
  const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const file = path.resolve(SITE, rel);
  if (file !== SITE && !file.startsWith(SITE + path.sep)) { res.writeHead(403); return res.end(); }
  if (rel.startsWith('ep3-bridge')) { res.writeHead(404); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Nicht gefunden'); }
    let out = buf;
    if (rel === 'index.html') {
      // Live-Modus einschalten: Adresse der Schnittstelle als Meta-Angabe
      out = Buffer.from(buf.toString('utf8').replace('<title>', '<meta name="rsp-api" content="/bridge">\n<meta name="rsp-api-sport" content="padel">\n<title>'));
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(out);
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const key = req.method + ' ' + url.pathname;
  const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };

  if (routes[key]) {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 20000) req.destroy(); });
    req.on('end', () => {
      try {
        let body = {};
        if (req.method === 'POST') { try { body = JSON.parse(raw || '{}'); } catch (e) { throw new ApiError('Ungültige Anfrage.', 400); } }
        send(200, routes[key](Object.fromEntries(url.searchParams), body));
      } catch (e) {
        if (e instanceof ApiError) send(e.status, { error: e.message });
        else { console.error(e); send(500, { error: 'Das hat gerade nicht geklappt. Bitte versuch es erneut.' }); }
      }
    });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/verwaltung') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(adminPage()); }
  if (req.method === 'GET') return serveSite(res, url.pathname);
  res.writeHead(405); res.end();
}).listen(PORT, '127.0.0.1', () => {
  seed();
  console.log('Oberfläche im Live-Modus:  http://127.0.0.1:' + PORT + '/');
  console.log('Verwaltung (Platzhalter):  http://127.0.0.1:' + PORT + '/verwaltung');
});
