/*
  daten.js — die einzige Datei, die du anfassen musst.
  Gerichte, Preise, Zeiten, Kontakt: alles steht hier drin.
  Sprache: "de" = Deutsch, "ar" = Arabisch.
*/

const DATEN = {

  /* Solange true, steht oben ein Hinweisbalken "Designentwurf".
     Sobald die echten Gerichte und Preise drin sind: auf false setzen. */
  entwurf: true,

  marke: {
    logo:    "bilder/logo.jpg",
    name:    { de: "Zaza Land",  ar: "زازا لاند" },
    zusatz:  { de: "Restaurant", ar: "مطعم" },
    unter:   { de: "Syrische Küche · seit 1993", ar: "مطبخ سوري · منذ ١٩٩٣" },
    spruch:  {
      de: "Der Stolz des syrischen Geschmacks.",
      ar: "فخر المذاق السوري."
    }
  },

  /* Bestätigt: Anschrift und Telefonnummer. */
  kontakt: {
    telefon:  "0178 7704379",
    /* Es ist eine Mobilnummer, ob WhatsApp daran hängt, ist ungeprüft.
       Zum Freischalten hier "491787704379" eintragen. */
    whatsapp: "",
    strasse:  { de: "Heinrich-Heine-Straße 7", ar: "Heinrich-Heine-Straße 7" },
    ort:      { de: "49074 Osnabrück",         ar: "49074 Osnabrück" },
    karteLink: "https://www.google.com/maps/search/?api=1&query=Heinrich-Heine-Stra%C3%9Fe+7%2C+49074+Osnabr%C3%BCck",
    instagram: ""                        /* z. B. "https://instagram.com/..." */
  },

  /* 0 = Sonntag, 1 = Montag … 6 = Samstag. null = Ruhetag.
     ACHTUNG: Bestätigt ist nur, dass um 23:00 geschlossen wird. Öffnungszeit
     und Wochentage sind geschätzt und müssen noch abgefragt werden. */
  oeffnung: [
    { von: "11:00", bis: "23:00" },
    { von: "11:00", bis: "23:00" },
    { von: "11:00", bis: "23:00" },
    { von: "11:00", bis: "23:00" },
    { von: "11:00", bis: "23:00" },
    { von: "11:00", bis: "23:00" },
    { von: "11:00", bis: "23:00" }
  ],

  /* Fotostrecke. Dateien in karte/bilder/ legen und hier eintragen.
     Bleibt die Liste leer, wird der ganze Abschnitt weggelassen. */
  galerie: [
    { datei: "bilder/tabbouleh.jpg",  text: { de: "Tabbouleh, jeden Morgen frisch geschnitten", ar: "تبولة تُقطع طازجة كل صباح" } },
    { datei: "bilder/sambousek.jpg",  text: { de: "Teigtaschen aus der eigenen Backstube",      ar: "معجنات من مخبزنا" } },
    { datei: "bilder/hummus.jpg",     text: { de: "Mezze für die große Runde",                  ar: "مقبلات للجمعات الكبيرة" } },
    { datei: "bilder/sandwiches.jpg", text: { de: "Sandwiches, fertig für die Theke",           ar: "سندويشات جاهزة" } },
    { datei: "bilder/teller.jpg",     text: { de: "Teller mit Reis, Salat und Beilagen",        ar: "صحون مع أرز وسلطة ومقبلات" } },
    { datei: "bilder/falafel.jpg",    text: { de: "Falafel mit Sesam, dazu Tahina",             ar: "فلافل بالسمسم مع طحينة" } }
  ],

  /* ---------------------------------------------------------------------
     PLATZHALTER. Gerichte und Preise sind nicht vom Restaurant bestätigt.
     Die Preislage folgt der Google-Angabe "1–10 € pro Person" und ist damit
     auf Imbiss zugeschnitten, nicht auf Restaurant mit Bedienung.

     merkmale je Gericht: "vegetarisch", "vegan", "scharf", "beliebt"
     bild: optional, z. B. "bilder/hummus.jpg"
     --------------------------------------------------------------------- */
  karten: [
    {
      id: "shawarma",
      titel: { de: "Shawarma & Sandwich", ar: "شاورما وسندويش" },
      unter: { de: "Frisch vom Spieß, im Fladenbrot", ar: "طازج من السيخ، بالخبز" },
      gerichte: [
        { name: { de: "Shawarma Hähnchen", ar: "شاورما دجاج" },  text: { de: "Knoblauchcreme, Essiggurke, Pommes", ar: "ثومية، مخلل، بطاطا" }, preis: 5.50, merkmale: ["beliebt"], bild: "bilder/sandwiches.jpg" },
        { name: { de: "Shawarma Kalb",     ar: "شاورما لحمة" },  text: { de: "Tahina, Tomate, Petersilie, Zwiebel", ar: "طحينة، بندورة، بقدونس، بصل" }, preis: 6.50, merkmale: [] },
        { name: { de: "Falafel Sandwich",  ar: "سندويش فلافل" }, text: { de: "Tahina, Salat, Essiggurke",          ar: "طحينة، سلطة، مخلل" },        preis: 4.50, merkmale: ["vegan", "beliebt"] },
        { name: { de: "Kafta Sandwich",    ar: "سندويش كفتة" },  text: { de: "Hackspieß, Tomate, Zwiebel, Sumach", ar: "كفتة، بندورة، بصل، سماق" },  preis: 5.50, merkmale: ["scharf"] },
        { name: { de: "Halloumi Sandwich", ar: "سندويش حلوم" },  text: { de: "Gegrillter Käse, Salat, Za'atar",    ar: "حلوم مشوي، سلطة، زعتر" },    preis: 5.00, merkmale: ["vegetarisch"] }
      ]
    },
    {
      id: "teller",
      titel: { de: "Teller", ar: "الصحون" },
      unter: { de: "Mit Reis oder Pommes, Salat und Brot", ar: "مع أرز أو بطاطا، سلطة وخبز" },
      gerichte: [
        { name: { de: "Shawarma Teller Hähnchen", ar: "صحن شاورما دجاج" }, text: { de: "", ar: "" },                              preis: 9.50,  merkmale: ["beliebt"], bild: "bilder/teller.jpg" },
        { name: { de: "Shawarma Teller Kalb",     ar: "صحن شاورما لحمة" }, text: { de: "", ar: "" },                              preis: 10.50, merkmale: [] },
        { name: { de: "Shish Taouk Teller",       ar: "صحن شيش طاووق" },  text: { de: "Hähnchenspieße, Knoblauchcreme", ar: "شيش طاووق، ثومية" }, preis: 10.50, merkmale: [] },
        { name: { de: "Kafta Teller",             ar: "صحن كفتة" },       text: { de: "Hackspieße vom Grill",           ar: "كفتة مشوية" },        preis: 10.00, merkmale: ["scharf"] },
        { name: { de: "Falafel Teller",           ar: "صحن فلافل" },      text: { de: "Falafel, Hummus, Salat, Brot",   ar: "فلافل، حمص، سلطة، خبز" }, preis: 8.50, merkmale: ["vegan"], bild: "bilder/falafel.jpg" },
        { name: { de: "Gemischter Teller",        ar: "صحن مشكل" },       text: { de: "Auswahl vom Spieß und vom Grill", ar: "تشكيلة من السيخ والشواية" }, preis: 12.50, merkmale: ["beliebt"] }
      ]
    },
    {
      id: "mezze",
      titel: { de: "Mezze & Beilagen", ar: "مقبلات وإضافات" },
      unter: { de: "Zum Teilen oder als Beilage", ar: "للمشاركة أو كطبق جانبي" },
      gerichte: [
        { name: { de: "Hummus",     ar: "حمص" },      text: { de: "Kichererbsen, Tahina, Zitrone, Olivenöl", ar: "حمص، طحينة، ليمون، زيت زيتون" }, preis: 3.50, merkmale: ["vegan", "beliebt"], bild: "bilder/hummus.jpg" },
        { name: { de: "Mutabbal",   ar: "متبل" },     text: { de: "Gegrillte Aubergine, Tahina, Knoblauch",  ar: "باذنجان مشوي، طحينة، ثوم" },    preis: 3.90, merkmale: ["vegan"] },
        { name: { de: "Tabbouleh",  ar: "تبولة" },    text: { de: "Petersilie, Bulgur, Tomate, Zitrone",     ar: "بقدونس، برغل، بندورة، ليمون" },  preis: 3.90, merkmale: ["vegan"], bild: "bilder/tabbouleh.jpg" },
        { name: { de: "Fattoush",   ar: "فتوش" },     text: { de: "Salat mit geröstetem Fladenbrot, Sumach", ar: "سلطة مع خبز محمص وسماق" },      preis: 4.50, merkmale: ["vegan"] },
        { name: { de: "Warak Enab", ar: "ورق عنب" },  text: { de: "Gefüllte Weinblätter, Reis, Kräuter",     ar: "ورق عنب محشي بالأرز والأعشاب" }, preis: 4.50, merkmale: ["vegan"] },
        { name: { de: "Falafel",    ar: "فلافل" },    text: { de: "Fünf Stück, dazu Tahina",                 ar: "خمس حبات مع طحينة" },           preis: 3.00, merkmale: ["vegan"] },
        { name: { de: "Sambousek",  ar: "سمبوسك" },   text: { de: "Vier Teigtaschen, Käse oder Hackfleisch", ar: "أربع قطع، جبنة أو لحمة" },      preis: 4.00, merkmale: [], bild: "bilder/sambousek.jpg" },
        { name: { de: "Pommes",     ar: "بطاطا" },    text: { de: "",                                        ar: "" },                            preis: 2.50, merkmale: ["vegan"] }
      ]
    },
    {
      id: "backstube",
      titel: { de: "Aus der Backstube", ar: "من الفرن" },
      unter: { de: "Jeden Morgen frisch gebacken", ar: "تُخبز طازجة كل صباح" },
      gerichte: [
        { name: { de: "Manakish Za'atar", ar: "منقوشة زعتر" },  text: { de: "Thymian, Sesam, Olivenöl",     ar: "زعتر، سمسم، زيت زيتون" },  preis: 2.50, merkmale: ["vegan"] },
        { name: { de: "Manakish Käse",    ar: "منقوشة جبنة" },  text: { de: "",                             ar: "" },                       preis: 3.00, merkmale: ["vegetarisch"] },
        { name: { de: "Fatayer Spinat",   ar: "فطاير سبانخ" },  text: { de: "Spinat, Zwiebel, Zitrone",     ar: "سبانخ، بصل، ليمون" },      preis: 2.00, merkmale: ["vegan"] },
        { name: { de: "Sfiha",            ar: "صفيحة" },        text: { de: "Hackfleisch, Tomate, Pinienkerne", ar: "لحمة، بندورة، صنوبر" }, preis: 2.50, merkmale: [] }
      ]
    },
    {
      id: "suess",
      titel: { de: "Süßes", ar: "الحلويات" },
      unter: { de: "", ar: "" },
      gerichte: [
        { name: { de: "Knafeh",    ar: "كنافة" },   text: { de: "Käse, Engelshaar, Zuckersirup, Pistazie", ar: "جبنة، شعرية، قطر، فستق" }, preis: 4.50, merkmale: ["beliebt"] },
        { name: { de: "Baklava",   ar: "بقلاوة" },  text: { de: "Drei Stück, Pistazie, Honig",             ar: "ثلاث قطع، فستق، عسل" },    preis: 3.50, merkmale: ["vegetarisch"] },
        { name: { de: "Mahalabia", ar: "مهلبية" },  text: { de: "Milchpudding, Rosenwasser, Pistazie",     ar: "مهلبية، ماء ورد، فستق" },  preis: 3.00, merkmale: ["vegetarisch"] }
      ]
    },
    {
      id: "getraenke",
      titel: { de: "Getränke", ar: "المشروبات" },
      unter: { de: "", ar: "" },
      gerichte: [
        { name: { de: "Minz-Limonade",     ar: "ليموناضة بالنعناع" }, text: { de: "Frisch gepresst",  ar: "طازجة" },   preis: 3.00, merkmale: ["beliebt"] },
        { name: { de: "Jallab",            ar: "جلاب" },              text: { de: "Dattelsirup, Pinienkerne, Rosinen", ar: "دبس تمر، صنوبر، زبيب" }, preis: 3.00, merkmale: [] },
        { name: { de: "Arabischer Kaffee", ar: "قهوة عربية" },        text: { de: "Mit Kardamom",     ar: "مع هيل" },  preis: 2.50, merkmale: [] },
        { name: { de: "Tee mit Minze",     ar: "شاي بالنعناع" },      text: { de: "",                 ar: "" },        preis: 2.00, merkmale: [] },
        { name: { de: "Softdrinks",        ar: "مشروبات غازية" },     text: { de: "0,33 l",           ar: "٣٣٠ مل" },  preis: 2.00, merkmale: [] },
        { name: { de: "Ayran",             ar: "عيران" },             text: { de: "",                 ar: "" },        preis: 1.50, merkmale: [] }
      ]
    }
  ],

  fussnote: {
    de: "Alle Preise in Euro, inklusive Mehrwertsteuer. Angaben zu Allergenen und Zusatzstoffen erhalten Sie bei unserem Personal.",
    ar: "جميع الأسعار باليورو وتشمل الضريبة. معلومات المواد المسببة للحساسية متوفرة لدى الموظفين."
  }
};
