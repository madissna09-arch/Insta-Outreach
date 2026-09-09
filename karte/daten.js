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
    name:    { de: "Zazaland",           ar: "زازالاند" },
    zusatz:  { de: "Restaurant",         ar: "مطعم" },
    unter:   { de: "Levantinische Küche", ar: "مطبخ شامي" },
    spruch:  {
      de: "Mezze, Grill und Süßes — so, wie es zu Hause gemacht wird.",
      ar: "مقبّلات ومشاوي وحلويات — كما تُصنع في البيت."
    }
  },

  kontakt: {
    telefon:  "+49 000 0000000",
    whatsapp: "",                        /* z. B. "4915112345678" — leer lassen blendet den Knopf aus */
    strasse:  { de: "Straße und Hausnummer", ar: "الشارع ورقم البناء" },
    ort:      { de: "PLZ Ort",               ar: "الرمز البريدي والمدينة" },
    karteLink: "",                       /* Google-Maps-Link, leer lassen blendet den Knopf aus */
    instagram: ""                        /* z. B. "https://instagram.com/..." */
  },

  /* 0 = Sonntag, 1 = Montag … 6 = Samstag. null = Ruhetag. */
  oeffnung: [
    { von: "12:00", bis: "23:00" },
    { von: "11:30", bis: "23:00" },
    { von: "11:30", bis: "23:00" },
    { von: "11:30", bis: "23:00" },
    { von: "11:30", bis: "23:00" },
    { von: "11:30", bis: "00:00" },
    { von: "11:30", bis: "00:00" }
  ],

  /* Fotostrecke. Dateien in karte/bilder/ legen und hier eintragen:
     { datei: "bilder/saal.jpg", text: { de: "Der Gastraum", ar: "الصالة" } }
     Bleibt die Liste leer, wird der ganze Abschnitt weggelassen. */
  galerie: [],

  /* merkmale je Gericht: "vegetarisch", "vegan", "scharf", "beliebt"
     bild: optional, z. B. "bilder/hummus.jpg" */
  karten: [
    {
      id: "mezze",
      titel: { de: "Mezze", ar: "المقبلات" },
      unter: { de: "Kalt und warm, zum Teilen gedacht", ar: "باردة وساخنة، للمشاركة" },
      gerichte: [
        { name: { de: "Hummus",      ar: "حمص" },        text: { de: "Kichererbsen, Tahina, Zitrone, Olivenöl", ar: "حمص، طحينة، ليمون، زيت زيتون" }, preis: 5.90, merkmale: ["vegan", "beliebt"] },
        { name: { de: "Mutabbal",    ar: "متبل" },       text: { de: "Gegrillte Aubergine, Tahina, Knoblauch",   ar: "باذنجان مشوي، طحينة، ثوم" },   preis: 6.50, merkmale: ["vegan"] },
        { name: { de: "Muhammara",   ar: "محمرة" },      text: { de: "Paprika, Walnuss, Granatapfelmelasse",     ar: "فليفلة، جوز، دبس رمان" },      preis: 6.90, merkmale: ["vegan", "scharf"] },
        { name: { de: "Labneh",      ar: "لبنة" },       text: { de: "Frischkäse, Olivenöl, Za'atar",            ar: "لبنة، زيت زيتون، زعتر" },      preis: 5.90, merkmale: ["vegetarisch"] },
        { name: { de: "Tabbouleh",   ar: "تبولة" },      text: { de: "Petersilie, Bulgur, Tomate, Zitrone",      ar: "بقدونس، برغل، بندورة، ليمون" }, preis: 6.50, merkmale: ["vegan"] },
        { name: { de: "Fattoush",    ar: "فتوش" },       text: { de: "Salat mit geröstetem Fladenbrot, Sumach",  ar: "سلطة مع خبز محمص وسماق" },     preis: 7.20, merkmale: ["vegan"] },
        { name: { de: "Warak Enab",  ar: "ورق عنب" },    text: { de: "Gefüllte Weinblätter, Reis, Kräuter",      ar: "ورق عنب محشي بالأرز والأعشاب" }, preis: 6.90, merkmale: ["vegan"] },
        { name: { de: "Falafel",     ar: "فلافل" },      text: { de: "Sechs Stück, dazu Tahina",                 ar: "ست حبات مع طحينة" },           preis: 5.50, merkmale: ["vegan", "beliebt"] },
        { name: { de: "Kibbeh",      ar: "كبة" },        text: { de: "Vier Stück, Bulgur, Hackfleisch, Pinienkerne", ar: "أربع حبات، برغل، لحمة، صنوبر" }, preis: 7.50, merkmale: [] },
        { name: { de: "Sambousek",   ar: "سمبوسك" },     text: { de: "Vier Teigtaschen, Käse oder Hackfleisch",  ar: "أربع قطع، جبنة أو لحمة" },     preis: 6.90, merkmale: [] }
      ]
    },
    {
      id: "grill",
      titel: { de: "Vom Grill", ar: "من الشواية" },
      unter: { de: "Über Holzkohle, mit Reis und Salat", ar: "على الفحم، مع الأرز والسلطة" },
      gerichte: [
        { name: { de: "Shish Taouk",     ar: "شيش طاووق" },  text: { de: "Hähnchenspieße, Knoblauchcreme, Reis", ar: "شيش طاووق، ثومية، أرز" },     preis: 15.90, merkmale: ["beliebt"] },
        { name: { de: "Kafta Halabi",    ar: "كفتة حلبية" }, text: { de: "Hackspieße, Petersilie, Zwiebel",      ar: "كفتة، بقدونس، بصل" },         preis: 15.50, merkmale: ["scharf"] },
        { name: { de: "Shish Kebab",     ar: "شيش كباب" },   text: { de: "Lammspieße, gegrilltes Gemüse",        ar: "شيش كباب، خضار مشوية" },      preis: 18.90, merkmale: [] },
        { name: { de: "Lammkoteletts",   ar: "ريش غنم" },    text: { de: "Vier Stück, Kräutermarinade",          ar: "أربع قطع، تتبيلة أعشاب" },    preis: 22.90, merkmale: [] },
        { name: { de: "Grillteller für zwei", ar: "مشاوي مشكلة لشخصين" }, text: { de: "Auswahl vom Grill, Reis, Salat, Brot", ar: "تشكيلة مشاوي، أرز، سلطة، خبز" }, preis: 42.00, merkmale: ["beliebt"] }
      ]
    },
    {
      id: "shawarma",
      titel: { de: "Shawarma & Sandwich", ar: "شاورما وسندويش" },
      unter: { de: "Im Brot oder als Teller", ar: "بالخبز أو صحن" },
      gerichte: [
        { name: { de: "Shawarma Hähnchen, im Brot", ar: "شاورما دجاج بالخبز" }, text: { de: "Knoblauchcreme, Essiggurke, Pommes", ar: "ثومية، مخلل، بطاطا" }, preis: 8.50, merkmale: ["beliebt"] },
        { name: { de: "Shawarma Kalb, im Brot",     ar: "شاورما لحمة بالخبز" }, text: { de: "Tahina, Tomate, Petersilie",         ar: "طحينة، بندورة، بقدونس" }, preis: 9.50, merkmale: [] },
        { name: { de: "Shawarma Teller",            ar: "صحن شاورما" },        text: { de: "Mit Reis, Salat und Brot",           ar: "مع أرز وسلطة وخبز" },     preis: 14.90, merkmale: [] },
        { name: { de: "Falafel Sandwich",           ar: "سندويش فلافل" },      text: { de: "Tahina, Salat, Essiggurke",          ar: "طحينة، سلطة، مخلل" },     preis: 6.50, merkmale: ["vegan"] },
        { name: { de: "Kafta Sandwich",             ar: "سندويش كفتة" },       text: { de: "Tomate, Zwiebel, Sumach",            ar: "بندورة، بصل، سماق" },     preis: 7.90, merkmale: ["scharf"] }
      ]
    },
    {
      id: "haupt",
      titel: { de: "Hauptgerichte", ar: "الأطباق الرئيسية" },
      unter: { de: "Töpfe und Aufläufe aus der Küche", ar: "أطباق من المطبخ" },
      gerichte: [
        { name: { de: "Maqluba",  ar: "مقلوبة" },  text: { de: "Gestürzter Reistopf, Aubergine, Hähnchen", ar: "أرز مقلوب، باذنجان، دجاج" },  preis: 17.90, merkmale: ["beliebt"] },
        { name: { de: "Mansaf",   ar: "منسف" },    text: { de: "Lamm, Joghurtsauce, Reis, Mandeln",        ar: "لحم غنم، جميد، أرز، لوز" },   preis: 21.90, merkmale: [] },
        { name: { de: "Molokhia", ar: "ملوخية" },  text: { de: "Malvengemüse, Hähnchen, Reis",             ar: "ملوخية، دجاج، أرز" },         preis: 16.90, merkmale: [] },
        { name: { de: "Ouzi",     ar: "أوزي" },    text: { de: "Blätterteig, Reis, Lamm, Nüsse",           ar: "عجين، أرز، لحم غنم، مكسرات" }, preis: 19.90, merkmale: [] },
        { name: { de: "Fatteh",   ar: "فتة" },     text: { de: "Kichererbsen, Joghurt, Brot, Pinienkerne", ar: "حمص، لبن، خبز، صنوبر" },      preis: 13.90, merkmale: ["vegetarisch"] }
      ]
    },
    {
      id: "vegetarisch",
      titel: { de: "Ohne Fleisch", ar: "أطباق نباتية" },
      unter: { de: "Sättigend, nicht als Beilage gedacht", ar: "أطباق كاملة، لا مجرد مقبلات" },
      gerichte: [
        { name: { de: "Mujaddara",      ar: "مجدرة" },       text: { de: "Linsen, Reis, Röstzwiebeln, Joghurt", ar: "عدس، أرز، بصل مقلي، لبن" },  preis: 11.90, merkmale: ["vegetarisch"] },
        { name: { de: "Gemüse-Tajine",  ar: "طاجن خضار" },   text: { de: "Saisongemüse, Kichererbsen, Couscous", ar: "خضار الموسم، حمص، كسكس" },  preis: 13.50, merkmale: ["vegan"] },
        { name: { de: "Falafel Teller", ar: "صحن فلافل" },   text: { de: "Falafel, Hummus, Salat, Brot",         ar: "فلافل، حمص، سلطة، خبز" },   preis: 12.90, merkmale: ["vegan", "beliebt"] }
      ]
    },
    {
      id: "suess",
      titel: { de: "Süßes", ar: "الحلويات" },
      unter: { de: "Frisch aus der eigenen Konditorei", ar: "طازجة من الحلونجي" },
      gerichte: [
        { name: { de: "Knafeh",           ar: "كنافة" },        text: { de: "Käse, Engelshaar, Zuckersirup, Pistazie", ar: "جبنة، شعرية، قطر، فستق" }, preis: 7.90, merkmale: ["beliebt"] },
        { name: { de: "Baklava",          ar: "بقلاوة" },       text: { de: "Drei Stück, Pistazie, Honig",             ar: "ثلاث قطع، فستق، عسل" },    preis: 5.50, merkmale: ["vegetarisch"] },
        { name: { de: "Halawet el Jibn",  ar: "حلاوة الجبن" },  text: { de: "Käseröllchen, Sahne, Rosensirup",         ar: "لفائف جبن، قشطة، ماء ورد" }, preis: 6.90, merkmale: ["vegetarisch"] },
        { name: { de: "Mahalabia",        ar: "مهلبية" },       text: { de: "Milchpudding, Rosenwasser, Pistazie",     ar: "مهلبية، ماء ورد، فستق" },   preis: 4.90, merkmale: ["vegetarisch"] }
      ]
    },
    {
      id: "getraenke",
      titel: { de: "Getränke", ar: "المشروبات" },
      unter: { de: "", ar: "" },
      gerichte: [
        { name: { de: "Minz-Limonade",     ar: "ليموناضة بالنعناع" }, text: { de: "Frisch gepresst",        ar: "طازجة" },        preis: 4.50, merkmale: ["beliebt"] },
        { name: { de: "Jallab",            ar: "جلاب" },              text: { de: "Dattelsirup, Pinienkerne, Rosinen", ar: "دبس تمر، صنوبر، زبيب" }, preis: 4.50, merkmale: [] },
        { name: { de: "Ayran",             ar: "عيران" },             text: { de: "",                       ar: "" },             preis: 2.90, merkmale: [] },
        { name: { de: "Tee mit Minze",     ar: "شاي بالنعناع" },      text: { de: "",                       ar: "" },             preis: 3.00, merkmale: [] },
        { name: { de: "Arabischer Kaffee", ar: "قهوة عربية" },        text: { de: "Mit Kardamom",           ar: "مع هيل" },       preis: 3.20, merkmale: [] },
        { name: { de: "Softdrinks",        ar: "مشروبات غازية" },     text: { de: "0,33 l",                 ar: "٣٣٠ مل" },       preis: 2.90, merkmale: [] }
      ]
    }
  ],

  fussnote: {
    de: "Alle Preise in Euro, inklusive Mehrwertsteuer. Angaben zu Allergenen und Zusatzstoffen erhalten Sie bei unserem Personal.",
    ar: "جميع الأسعار باليورو وتشمل الضريبة. معلومات المواد المسببة للحساسية متوفرة لدى الموظفين."
  }
};
