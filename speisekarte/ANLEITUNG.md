# 2 Bros Bistro – Speisekarten-Website

> Anleitung zur Pflege der Seite.

Digitale Speisekarte für das **2 Bros Bistro** in Osnabrück. Eine einzelne
HTML-Datei ohne Build-Schritt, ohne Framework, ohne externe Anfragen.

## Inhalt

```
speisekarte/
├── index.html          gesamte Seite (HTML, CSS, Speisekarten-Daten, JS)
└── assets/
    ├── logo.png        freigestelltes Logo (aus der Original-Karte)
    ├── doener.jpg      Speisefotos, aus den Original-Kartenbildern geschnitten
    ├── duerum.jpg
    ├── falafel.jpg
    ├── tabouleh.jpg
    ├── pasta.jpg
    ├── burger.jpg
    ├── drinks.jpg
    ├── karte-1.jpg     Original-Karte Seite 1 (Lichtkasten)
    ├── karte-2.jpg     Original-Karte Seite 2 (Lichtkasten)
    └── fonts/          Anton, Oswald, Barlow als woff2, lokal eingebunden
```

## Pflege

**Gerichte und Preise** stehen als JavaScript-Liste am Ende der `index.html`
in der Konstanten `KARTE`. Ein Eintrag sieht so aus:

```js
{n:30, name:"Bros Burger", a:"A1, C, G, J", p:10.00,
 d:"Rindfleisch-Patty ca. 140 g, …",
 m:"Menü mit Pommes &amp; Getränk <b>14,90 €</b>"},
```

| Feld | Bedeutung                                            |
|------|------------------------------------------------------|
| `n`  | Nummer auf der Karte (weglassen bei Getränken)        |
| `a`  | Allergen-Kürzel                                       |
| `p`  | Preis in Euro als Zahl                                |
| `p2` | zweiter Preis (Pizza Ø 45 cm)                         |
| `d`  | Beschreibung                                          |
| `m`  | Menü-Zusatzzeile                                      |
| `v`  | `true` → Kennzeichnung „Vegan“ und Vegan-Filter       |
| `gr` | Größenangabe hinter dem Namen (Getränke)              |

**Adresse, Telefon, Öffnungszeiten** stehen im Block `const BISTRO = {…}`
oben in der Datei. Leere Felder werden nicht angezeigt — sobald sie
ausgefüllt sind, erscheinen sie automatisch in der Fußzeile.

## Veröffentlichen

`netlify.toml` im Projekt-Wurzelverzeichnis veröffentlicht diesen Ordner als
Seiten-Wurzel. Kein Build-Befehl nötig — alternativ den Ordner `speisekarte/`
direkt auf app.netlify.com/drop ziehen.

## Hinweise

* Die Speisefotos stammen aus den beiden Original-Kartenbildern des Bistros.
  Sobald bessere Aufnahmen vorliegen, einfach die Dateien in `assets/`
  ersetzen — die Dateinamen bleiben gleich.
* Die Allergen-Legende folgt der üblichen deutschen Buchstaben-Kennzeichnung
  und ist **vom Bistro zu bestätigen**, bevor die Seite öffentlich geht.
