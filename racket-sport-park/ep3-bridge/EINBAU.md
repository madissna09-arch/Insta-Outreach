# Anbindung an das ep-3 Buchungssystem

Die neue Oberfläche (`../index.html`) kann auf zwei Arten laufen:

- **Entwurf:** Belegung simuliert, Buchungen nur im Browser. So läuft sie ohne weitere Einstellung.
- **Live:** Zeiten und Preise kommen aus ep-3, Buchungen werden dort eingetragen. Dafür braucht ep-3 das Modul `RspBridge` aus diesem Ordner.

## Stand

| Teil | Stand |
|---|---|
| Oberfläche im Live-Modus | im Browser getestet gegen `mock-server.js` |
| `mock-server.js` | Platzhalter mit derselben Schnittstelle wie das Modul |
| Modul `RspBridge` | anhand des ep-3-Quellcodes (Version 1.9.1) geschrieben, PHP-Syntax geprüft, **noch nicht gegen ein laufendes ep-3 getestet** |

## Ausprobieren ohne ep-3

```
node mock-server.js
```

- Oberfläche: http://127.0.0.1:8090/
- Verwaltung (Platzhalter für die ep-3-Verwaltung): http://127.0.0.1:8090/verwaltung

## Einbau in ep-3

1. Ordner `RspBridge` nach `modulex/RspBridge` der ep-3-Installation kopieren. ep-3 lädt Module aus `modulex/` automatisch.
2. Dateien in `data/cache/` löschen, damit ep-3 die neue Route kennt.
3. Liegt die Oberfläche auf einer anderen Adresse als ep-3, diese in `config/autoload/local.php` freigeben:
   ```php
   'rsp_bridge' => array('allowed_origins' => array('https://www.example.de')),
   ```
4. In der Oberfläche die Adresse der Schnittstelle eintragen, im `<head>` von `index.html`:
   ```html
   <meta name="rsp-api" content="https://buchung.example.de/padel/public/bridge">
   <meta name="rsp-api-sport" content="padel">
   ```
5. In der ep-3-Verwaltung Preisregeln und Stornofrist für den Platz hinterlegen. Die Oberfläche zeigt genau diese Werte.

Der Park betreibt je Sportart eine eigene ep-3-Installation. Das Modul muss in jede, die angebunden werden soll.

## Schnittstelle

| Aufruf | Zweck |
|---|---|
| `GET /bridge/slots?date=JJJJ-MM-TT` | Plätze und Zeiten eines Tages mit Zustand (`free`, `taken`, `past`, `closed`) und Preis in Cent |
| `POST /bridge/book` | Bucht 1 bis 4 Zeiten. Körper: `{date, name, email, phone, note, items:[{sid,start,end}]}` |
| `POST /bridge/cancel` | Storniert innerhalb der Stornofrist. Körper: `{bid, token}` |
| `GET /bridge/status?b=BID.TOKEN,…` | Stand eigener Buchungen, z. B. wenn die Theke storniert hat |

Verfügbarkeit, Preise, Buchung und Storno laufen über die ep-3-eigenen Dienste. Das Modul rechnet nichts davon selbst.

## Vor einem echten Einsatz offen

- **Gastbuchung:** Gebucht wird ohne Konto, nur mit Name und E-Mail. Es gibt noch keine Bestätigung der E-Mail-Adresse und keine Begrenzung pro Absender. Beides braucht es gegen Spaßbuchungen.
- **Gleichzeitige Buchungen:** ep-3 prüft erst und schreibt dann, ohne Sperre in der Datenbank. Das Modul prüft direkt vor dem Schreiben noch einmal, schließt eine Doppelbuchung im selben Augenblick aber nicht völlig aus. Das gilt für ep-3 selbst genauso.
- **Leihmaterial und Ermäßigungen:** stehen als Notiz in der Buchung und werden an der Theke berechnet. In ep-3 hinterlegt ist nur der Platzpreis.
- **Preise pro Person** (Tennis, Badminton) sind noch nicht abgebildet.
- **Updates:** Nach einem ep-3-Update das Modul erneut durchtesten.
