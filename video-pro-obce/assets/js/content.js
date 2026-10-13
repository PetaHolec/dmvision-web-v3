/* ==========================================================================
   D&M Vision – obsah landing page pro města a obce
   --------------------------------------------------------------------------
   Tady se mění všechno, co se bude doplňovat: videa, portfolio, napojení
   formuláře. Strukturu HTML/CSS není potřeba upravovat.
   ========================================================================== */

window.DMV = {
  /* --- Formulář ---------------------------------------------------------
     URL, na kterou se odešle poptávka (POST, FormData).
     Očekávaná odpověď: JSON { "ok": true } – stejný kontrakt jako
     odeslat-poptavku.php na hlavním webu. Dokud je null, formulář
     zprávu NEODESÍLÁ a návštěvníkovi to otevřeně řekne (nabídne e-mail). */
  formEndpoint: "../odeslat-poptavku.php",
  contactEmail: "info@dmvision.cz",

  /* --- Hero video (volitelné) ------------------------------------------
     Krátká smyčka bez zvuku, 10–20 s, 1920×1080, MP4 (H.264), ideálně
     do 6 MB + WebM. Dokud je null, zobrazí se statický záběr. */
  heroVideo: null,
  // heroVideo: { mp4: "assets/video/hero-loop.mp4", webm: "assets/video/hero-loop.webm" },

  /* --- Doporučení klienta --------------------------------------------------
     Zobrazí se pod realizacemi, jen když je vyplněné (a máte souhlas):
     { quote: "…", name: "Jméno Příjmení", role: "starosta obce Říčany", photo: "assets/img/…webp" } */
  testimonial: null,

  /* --- Balíčky -----------------------------------------------------------
     price: text ceny, např. "25 000 Kč" (+ priceNote "měsíčně"); null = „Cena na míru“
     items: obsah balíčku – text, nebo { t: "název", d: "popis" }
     prefill: text, který se po kliknutí vloží do zprávy ve formuláři
     (vybraný je vždy první balíček – Komfort) */
  packages: [
    {
      id: "komfort",
      featured: true,
      label: "Nejvýhodnější · pro obce a města",
      name: "Komfort",
      lead: "Videozpravodaj, čtyři krátká videa každý měsíc a animovaná grafika obce. Neomezené korektury a cestovné po celém Jihomoravském kraji v ceně.",
      items: [
        { t: "1× videozpravodaj měsíčně", d: "Přibližně 3–8 minut podle množství aktuálního dění." },
        { t: "4× krátké video měsíčně", d: "Vertikální formát 9:16, zpravidla 30–60 sekund. Například pozvánka na akci, reportáž nebo informace o projektu." },
        { t: "Dronové záběry" },
        { t: "Animovaná grafická identita", d: "Animované logo, vlastní jmenovky, titulky a přechody – animovaný design na míru podle vizuální identity obce, z dodaných podkladů." },
        { t: "Kompletní produkce a postprodukce", d: "Kamera, stabilizace, zvuk, střih, barvy a sjednocený vzhled všech výstupů." },
        { t: "Plánování a koordinace", d: "Pravidelná domluva témat, natáčecích termínů a předání hotových videí." },
        { t: "Neomezený počet korektur a úprav", d: "V rámci balíčku zdarma." },
        { t: "Cestovné v ceně", d: "Pro celý Jihomoravský kraj, jinak 9 Kč/km." },
      ],
      price: "18 990 Kč",
      priceNote: "měsíčně",
      priceSub: "Konečná cena – nejsme plátci DPH.",
      cta: "Chci balíček Komfort",
      prefill: "Dobrý den, máme zájem o balíček Komfort (videozpravodaj + 4 krátká videa měsíčně). Prosíme o nabídku.",
    },
    {
      id: "start",
      label: "Na začátek",
      name: "Start",
      lead: "Videozpravodaj a jedno krátké video měsíčně. Dobrý začátek pravidelné spolupráce.",
      items: [
        { t: "1× videozpravodaj měsíčně", d: "Přibližně 3–8 minut podle množství aktuálního dění." },
        { t: "1× krátké video měsíčně", d: "Vertikální formát 9:16, zpravidla 30–60 sekund. Například pozvánka na akci, reportáž nebo informace o projektu." },
        { t: "Dronové záběry" },
        { t: "Kompletní produkce a postprodukce", d: "Kamera, stabilizace, zvuk, střih, barvy a sjednocený vzhled všech výstupů." },
        { t: "Plánování a koordinace", d: "Pravidelná domluva témat, natáčecích termínů a předání hotových videí." },
        { t: "První korektura nebo úprava zdarma" },
        { t: "Cestovné v ceně", d: "Pro Brno-město a Brno-venkov, jinak 9 Kč/km." },
      ],
      price: "9 990 Kč",
      priceNote: "měsíčně",
      priceSub: "Konečná cena – nejsme plátci DPH.",
      cta: "Chci balíček Start",
      prefill: "Dobrý den, máme zájem o balíček Start (videozpravodaj + 1 krátké video měsíčně). Prosíme o nabídku.",
    },
    {
      id: "kampan",
      label: "Pro strany a kandidáty",
      name: "Volební kampaň",
      lead: "Video obsah na celou kampaň v barvách a grafice vaší strany.",
      items: [
        "Volební spot nebo představení kandidátů",
        "Krátká videa pro sítě během kampaně",
        "Rozhovory a výstupy z akcí",
        "Grafika podle vizuálu kampaně",
      ],
      price: null,
      cta: "Probrat kampaň",
      prefill: "Dobrý den, chystáme volební kampaň a rádi bychom probrali video produkci.",
    },
    {
      id: "jednorazove",
      label: "Jednorázově",
      name: "Jedno video",
      lead: "Prezentační video obce, záznam akce nebo video o investici.",
      items: [
        "Prezentační video obce nebo projektu",
        "Záznam a sestřih kulturní akce",
        "Video o rekonstrukci či investici",
      ],
      price: null,
      cta: "Poptat video",
      prefill: "Dobrý den, poptáváme jedno video: ",
    },
    {
      id: "dron",
      label: "Jednorázově",
      name: "Dronové záběry",
      lead: "Letecké záběry vaší obce nebo města.",
      items: [
        "Video i fotky z dronu",
        "Pro web, sociální sítě i prezentace",
      ],
      price: null,
      cta: "Poptat dronové záběry",
      prefill: "Dobrý den, poptáváme dronové záběry naší obce: ",
    },
  ],

  /* --- Portfolio --------------------------------------------------------
     group:   "obce" | "volby"  (volební videa jsou samostatná kategorie)
     status:  přesný popis vztahu – NEUVÁDĚT pokračování, které není potvrzené
     image:   náhled 16:9 (min. 1600×900, webp/avif), u videa na výšku tall: true; null = placeholder
     video:   { youtube: "ID" } | { mp4: "cesta.mp4", tall: true = na výšku } | { instagram: "URL příspěvku" } | null
              (Instagram se otevírá v novém okně, nic se nenačítá z Meta předem)
     todo:    co je potřeba doplnit (zobrazí se v placeholderu)
     noTrust:   true = jméno se nezobrazí v pásu „Natáčeli jsme pro“ – chybí souhlas
     noCard:    true = jen v pásu „Natáčeli jsme pro“, bez karty v Realizacích (chybí video) */
  projects: [
    {
      id: "ricany",
      group: "obce",
      client: "Říčany u Brna",
      kind: "Obec",
      status: "Dlouhodobá spolupráce · pokračuje",
      title: "Videozpravodaj obce Říčany",
      text:
        "Pravidelně natáčíme videozpravodaj obce formou krátkých videí a pomáháme se správou sociálních sítí, aby se občané o dění v obci dozvěděli rychle. Pro obec jsme připravili i animovanou grafickou sadu podle jejího manuálu.",
      tags: ["Videozpravodaj", "Grafická sada", "Dron", "Sociální sítě"],
      link: { href: "#motion-design", label: "Prohlédnout grafickou sadu Říčan" },
      image: { webp: "assets/video/ricany-svc-rubiko-hasicka-poster.webp", alt: "Úvodní záběr z videa o SVČ Rubiko v Říčanech", tall: true },
      video: { mp4: "assets/video/ricany-svc-rubiko-hasicka.mp4", tall: true },
      featured: true,
    },
    {
      id: "modrice",
      group: "obce",
      client: "Modřice",
      kind: "Město",
      status: "Dlouhodobější spolupráce",
      title: "Video produkce pro město Modřice",
      text: "Dlouhodobější video produkce pro město Modřice.",
      tags: ["Video produkce"],
      image: { webp: "assets/video/modrice-skola-poster.webp", alt: "Záběr z videa o škole v Modřicích", tall: true },
      video: { mp4: "assets/video/modrice-skola.mp4", tall: true },
      featured: true,
    },
    {
      id: "oresin",
      noCard: true,
      group: "obce",
      client: "Brno-Ořešín",
      kind: "Městská část Brna",
      status: "Realizovaná delší zakázka",
      title: "Video produkce pro MČ Brno-Ořešín",
      text: "Delší realizovaná zakázka pro městskou část Brno-Ořešín.",
      tags: ["Video produkce"],
      image: null,
      video: null,
    },
    {
      id: "chvatal",
      noTrust: true,
      group: "volby",
      client: "Filip Chvátal",
      kind: "Kandidát",
      status: "Volební video",
      highlight: "Volby vyhrál",
      title: "Volební video",
      text: "Natočili jsme volební video pro Filipa Chvátala, který letos volby vyhrál.",
      tags: ["Volební kampaň"],
      image: { webp: "assets/video/volebni-video-filip-chvatal-poster.webp", alt: "Záběr z volebního videa Filipa Chvátala", tall: true },
      video: { mp4: "assets/video/volebni-video-filip-chvatal.mp4", tall: true },
      featured: true,
    },
    {
      id: "kol",
      noTrust: true,
      group: "volby",
      client: "Kuřimská občanská liga · Drago Sukalovský",
      kind: "Politický subjekt a kandidát",
      status: "Volební videa",
      title: "Volební videa",
      text: "Volební videa pro Kuřimskou občanskou ligu a Draga Sukalovského.",
      tags: ["Volební kampaň"],
      image: { webp: "assets/video/kurim-kol-dron-poster.webp", alt: "Úvod volebního videa Kuřimské občanské ligy" },
      video: { mp4: "assets/video/kurim-kol-dron.mp4" },
      featured: true,
    },
  ],
};
