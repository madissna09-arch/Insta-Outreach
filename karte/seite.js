/* Baut die Seite aus DATEN (siehe daten.js). */

const TEXTE = {
  de: {
    suche: "Gericht suchen …",
    vegetarisch: "Vegetarisch", vegan: "Vegan", scharf: "Scharf", beliebt: "Beliebt",
    nichtsGefunden: "Dazu haben wir nichts auf der Karte.",
    anrufen: "Anrufen", route: "Route", whatsapp: "WhatsApp", instagram: "Instagram",
    geoeffnet: "Jetzt geöffnet", geschlossen: "Zurzeit geschlossen",
    bis: "bis", ab: "ab",
    zeiten: "Öffnungszeiten", hierSindWir: "Hier sind wir", galerie: "Bei uns",
    ruhetag: "Ruhetag",
    tage: ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"],
    entwurfTitel: "Designentwurf",
    entwurfText: "Gerichte, Preise und Kontaktdaten sind Platzhalter."
  },
  ar: {
    suche: "ابحث عن طبق …",
    vegetarisch: "نباتي", vegan: "نباتي صرف", scharf: "حار", beliebt: "الأكثر طلباً",
    nichtsGefunden: "لا يوجد شيء بهذا الاسم في القائمة.",
    anrufen: "اتصل بنا", route: "الموقع", whatsapp: "واتساب", instagram: "إنستغرام",
    geoeffnet: "مفتوح الآن", geschlossen: "مغلق حالياً",
    bis: "حتى", ab: "من",
    zeiten: "أوقات الدوام", hierSindWir: "أين نحن", galerie: "من عندنا",
    ruhetag: "عطلة",
    tage: ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"],
    entwurfTitel: "مسودة تصميم",
    entwurfText: "الأطباق والأسعار وبيانات التواصل مؤقتة."
  }
};

const ICONS = {
  stern: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="6" y="6" width="12" height="12"/><path d="M12 3 21 12 12 21 3 12Z"/></svg>',
  telefon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  lupe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.9-.9L3 20.5l1.6-4.9A8.4 8.4 0 0 1 3.6 11 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/></svg>',
  kamera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg>'
};

let sprache = "de";
let suchbegriff = "";
let merkmalAktiv = null;

/* ---------- kleine Helfer ---------- */

const el = (s) => document.querySelector(s);
const t = () => TEXTE[sprache];
const w = (feld) => (feld && feld[sprache]) || (feld && feld.de) || "";
const sicher = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

function preisText(p) {
  return p.toFixed(2).replace(".", ",") + " €";
}

function minuten(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/* Prüft, ob gerade offen ist. Zeiten über Mitternacht ("00:00") zählen zum Vortag. */
function istGeoeffnet(jetzt = new Date()) {
  const tag = jetzt.getDay();
  const nun = jetzt.getHours() * 60 + jetzt.getMinutes();

  const prueflinge = [
    { zeit: DATEN.oeffnung[tag], versatz: 0 },
    { zeit: DATEN.oeffnung[(tag + 6) % 7], versatz: -1440 }   // gestern, falls es über Mitternacht ging
  ];

  for (const { zeit, versatz } of prueflinge) {
    if (!zeit) continue;
    const von = minuten(zeit.von) + versatz;
    let bis = minuten(zeit.bis) + versatz;
    if (bis <= von) bis += 1440;                              // 00:00 heißt: nach Mitternacht
    if (nun >= von && nun < bis) return { offen: true, bis: zeit.bis };
  }
  const heute = DATEN.oeffnung[tag];
  return { offen: false, ab: heute && nun < minuten(heute.von) ? heute.von : null };
}

/* ---------- Aufbau ---------- */

function baueKopf() {
  el("#marke").innerHTML =
    sicher(w(DATEN.marke.name)) + "<span>" + sicher(w(DATEN.marke.zusatz)) + "</span>";

  const zustand = istGeoeffnet();
  const knoten = el("#zustand");
  knoten.className = "zustand" + (zustand.offen ? " offen" : "");

  const uhr = (zeit) => ` <span class="zahl">${sicher(zeit)}</span>`;
  knoten.innerHTML = "<i></i>" + (
      zustand.offen ? sicher(t().geoeffnet + " · " + t().bis) + uhr(zustand.bis)
    : zustand.ab    ? sicher(t().geschlossen + " · " + t().ab) + uhr(zustand.ab)
    :                 sicher(t().geschlossen)
  );
}

function baueBuehne() {
  const m = DATEN.marke;
  const k = DATEN.kontakt;
  const knoepfe = [];

  if (k.telefon) knoepfe.push(
    `<a class="knopf voll" href="tel:${sicher(k.telefon.replace(/\s/g, ""))}">${ICONS.telefon}${sicher(t().anrufen)}</a>`);
  if (k.karteLink) knoepfe.push(
    `<a class="knopf" href="${sicher(k.karteLink)}" target="_blank" rel="noopener">${ICONS.pin}${sicher(t().route)}</a>`);
  if (k.whatsapp) knoepfe.push(
    `<a class="knopf" href="https://wa.me/${sicher(k.whatsapp)}" target="_blank" rel="noopener">${ICONS.chat}${sicher(t().whatsapp)}</a>`);
  if (k.instagram) knoepfe.push(
    `<a class="knopf" href="${sicher(k.instagram)}" target="_blank" rel="noopener">${ICONS.kamera}${sicher(t().instagram)}</a>`);

  /* Der Zweitname steht immer in der jeweils anderen Schrift — das gibt der Marke Tiefe. */
  const zweit = sprache === "de" ? m.name.ar : m.name.de;

  el("#buehne").innerHTML = `
    <p class="obendrueber versalien">${sicher(w(m.unter))}</p>
    <h1>${sicher(w(m.name))}</h1>
    ${zweit ? `<p class="zweitname">${sicher(zweit)}</p>` : ""}
    <div class="zierlinie">${ICONS.stern}</div>
    <p class="spruch">${sicher(w(m.spruch))}</p>
    <div class="knopfreihe">${knoepfe.join("")}</div>`;
}

function baueSprungleiste() {
  el("#sprungleiste ul").innerHTML = DATEN.karten
    .map((g) => `<li><a href="#${sicher(g.id)}">${sicher(w(g.titel))}</a></li>`)
    .join("");
}

function passt(gericht) {
  if (merkmalAktiv && !gericht.merkmale.includes(merkmalAktiv)) return false;
  if (!suchbegriff) return true;
  const heuhaufen = [
    gericht.name.de, gericht.name.ar, gericht.text.de, gericht.text.ar
  ].join(" ").toLowerCase();
  return heuhaufen.includes(suchbegriff);
}

function baueGericht(g) {
  const zweitname = sprache === "de" ? g.name.ar : g.name.de;
  const abzeichen = g.merkmale.length
    ? `<span class="abzeichen">${g.merkmale
        .map((m) => `<span class="ab-${sicher(m)}">${sicher(t()[m] || m)}</span>`).join("")}</span>`
    : "";
  const text = w(g.text);
  const bild = g.bild
    ? `<img class="bild" src="${sicher(g.bild)}" alt="${sicher(w(g.name))}" loading="lazy"
            onerror="this.remove()">` : "";

  return `<article class="gericht">
    ${bild}
    <div class="text">
      <div class="kopfzeile">
        <h3>${sicher(w(g.name))}</h3>
        ${zweitname ? `<span class="arabisch">${sicher(zweitname)}</span>` : ""}
        ${abzeichen}
        <span class="leiter" aria-hidden="true"></span>
        <span class="preis">${sicher(preisText(g.preis))}</span>
      </div>
      ${text ? `<p class="beschreibung">${sicher(text)}</p>` : ""}
    </div>
  </article>`;
}

function baueKarte() {
  let etwasSichtbar = false;

  const abschnitte = DATEN.karten.map((gang) => {
    const treffer = gang.gerichte.filter(passt);
    if (!treffer.length) return "";
    etwasSichtbar = true;

    const zweittitel = sprache === "de" ? gang.titel.ar : gang.titel.de;
    const unter = w(gang.unter);

    return `<section class="gang" id="${sicher(gang.id)}">
      <div class="gang-kopf">
        <h2>${sicher(w(gang.titel))}</h2>
        ${zweittitel ? `<p class="arabisch">${sicher(zweittitel)}</p>` : ""}
        ${unter ? `<p class="unter">${sicher(unter)}</p>` : ""}
      </div>
      <div class="gerichte">${treffer.map(baueGericht).join("")}</div>
    </section>`;
  }).join("");

  el("#karte").innerHTML = etwasSichtbar
    ? abschnitte
    : `<p class="leer">${sicher(t().nichtsGefunden)}</p>`;
}

function baueGalerie() {
  const bereich = el("#galerie");
  if (!DATEN.galerie.length) { bereich.hidden = true; return; }
  bereich.hidden = false;
  bereich.innerHTML = `<div class="huelle">
    <div class="gang-kopf"><h2>${sicher(t().galerie)}</h2></div>
    <div class="galerie-gitter">${DATEN.galerie.map((b) => `
      <figure>
        <img src="${sicher(b.datei)}" alt="${sicher(w(b.text))}" loading="lazy">
        ${w(b.text) ? `<figcaption>${sicher(w(b.text))}</figcaption>` : ""}
      </figure>`).join("")}</div>
  </div>`;
}

function baueAngaben() {
  const k = DATEN.kontakt;
  const heute = new Date().getDay();

  const zeilen = DATEN.oeffnung.map((zeit, i) => {
    const wert = zeit ? `${zeit.von} – ${zeit.bis === "00:00" ? "24:00" : zeit.bis}` : t().ruhetag;
    return `<li class="${i === heute ? "heute" : ""}">
      <span class="tag">${sicher(t().tage[i])}</span><span>${sicher(wert)}</span></li>`;
  });
  /* Woche mit Montag beginnen lassen, Sonntag ans Ende. */
  zeilen.push(zeilen.shift());

  el("#angaben").innerHTML = `<div class="huelle angaben-gitter">
    <div>
      <h3 class="versalien">${sicher(t().zeiten)}</h3>
      <ul class="zeitenliste">${zeilen.join("")}</ul>
    </div>
    <div>
      <h3 class="versalien">${sicher(t().hierSindWir)}</h3>
      <p>${sicher(w(k.strasse))}<br>${sicher(w(k.ort))}</p>
      ${k.telefon ? `<p><a class="zahl" href="tel:${sicher(k.telefon.replace(/\s/g, ""))}">${sicher(k.telefon)}</a></p>` : ""}
      ${k.karteLink ? `<p><a href="${sicher(k.karteLink)}" target="_blank" rel="noopener">${sicher(t().route)}</a></p>` : ""}
      ${k.instagram ? `<p><a href="${sicher(k.instagram)}" target="_blank" rel="noopener">${sicher(t().instagram)}</a></p>` : ""}
    </div>
  </div>`;

  el("#fussnote").innerHTML =
    `<div class="zierlinie">${ICONS.stern}</div><p>${sicher(w(DATEN.fussnote))}</p>`;
}

function baueFilter() {
  el("#suchfeld").placeholder = t().suche;
  el("#suchfeld").value = suchbegriff;
  el("#merkmalfilter").innerHTML = ["beliebt", "vegetarisch", "vegan", "scharf"]
    .map((m) => `<button type="button" data-merkmal="${m}"
        aria-pressed="${merkmalAktiv === m}">${sicher(t()[m])}</button>`).join("");
}

/* ---------- Sprungleiste mitlaufen lassen ---------- */

let beobachter = null;
function beobachteAbschnitte() {
  if (beobachter) beobachter.disconnect();
  const sichtbar = new Set();

  beobachter = new IntersectionObserver((eintraege) => {
    for (const e of eintraege) {
      if (e.isIntersecting) sichtbar.add(e.target.id);
      else sichtbar.delete(e.target.id);
    }
    /* Der oberste sichtbare Abschnitt gewinnt. */
    const erster = DATEN.karten.map((g) => g.id).find((id) => sichtbar.has(id));
    document.querySelectorAll("#sprungleiste a").forEach((a) => {
      const dran = a.getAttribute("href") === "#" + erster;
      a.classList.toggle("aktiv", dran);
      if (dran) a.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }, { rootMargin: "-140px 0px -55% 0px" });

  document.querySelectorAll(".gang").forEach((s) => beobachter.observe(s));
}

/* ---------- Anzeigen ---------- */

function zeichne() {
  document.documentElement.lang = sprache;
  document.documentElement.dir = sprache === "ar" ? "rtl" : "ltr";
  document.title = w(DATEN.marke.name) + " — " + w(DATEN.marke.unter);

  const balken = el("#entwurfsbalken");
  balken.hidden = !DATEN.entwurf;
  if (DATEN.entwurf) {
    balken.innerHTML = "<b>" + sicher(t().entwurfTitel) + "</b> · " + sicher(t().entwurfText);
  }

  baueKopf();
  baueBuehne();
  baueSprungleiste();
  baueFilter();
  baueKarte();
  baueGalerie();
  baueAngaben();
  beobachteAbschnitte();

  document.querySelectorAll(".sprachschalter button").forEach((b) =>
    b.setAttribute("aria-pressed", b.dataset.sprache === sprache));
}

/* ---------- Bedienung ---------- */

document.addEventListener("input", (e) => {
  if (e.target.id !== "suchfeld") return;
  suchbegriff = e.target.value.trim().toLowerCase();
  baueKarte();
  beobachteAbschnitte();
});

document.addEventListener("click", (e) => {
  const merkmalKnopf = e.target.closest("#merkmalfilter button");
  if (merkmalKnopf) {
    const gewaehlt = merkmalKnopf.dataset.merkmal;
    merkmalAktiv = merkmalAktiv === gewaehlt ? null : gewaehlt;
    baueFilter();
    baueKarte();
    beobachteAbschnitte();
    return;
  }
  const sprachKnopf = e.target.closest(".sprachschalter button");
  if (sprachKnopf) {
    sprache = sprachKnopf.dataset.sprache;
    try { localStorage.setItem("karte-sprache", sprache); } catch (_) {}
    zeichne();
  }
});

try {
  const gemerkt = localStorage.getItem("karte-sprache");
  if (gemerkt === "de" || gemerkt === "ar") sprache = gemerkt;
} catch (_) {}

zeichne();
setInterval(baueKopf, 60000);   /* "geöffnet/geschlossen" aktuell halten */
