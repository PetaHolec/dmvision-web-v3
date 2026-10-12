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

  /* --- Showreel ---------------------------------------------------------
     Buď vlastní soubor (mp4 + poster), nebo YouTube ID. Dokud chybí,
     sekce ukáže označené místo pro doplnění. */
  showreel: null,
  // showreel: { youtube: "XXXXXXXXXXX", poster: "assets/img/showreel-poster.webp" },
  // showreel: { mp4: "assets/video/showreel.mp4", poster: "assets/img/showreel-poster.webp" },

  /* --- Doporučení klienta --------------------------------------------------
     Zobrazí se pod realizacemi, jen když je vyplněné (a máte souhlas):
     { quote: "…", name: "Jméno Příjmení", role: "starosta obce Říčany", photo: "assets/img/…webp" } */
  testimonial: null,

  /* --- Balíčky -----------------------------------------------------------
     price: text ceny, např. "25 000 Kč" (+ priceNote "měsíčně"); null = „Cena na míru“
     items: obsah balíčku – text, nebo { t: "název", d: "popis" }
     prefill: text, který se po kliknutí vloží do zprávy ve formuláři
     (vybraný je vždy první balíček – Standard) */
  packages: [
    {
      id: "obec",
      featured: true,
      label: "Hlavní nabídka · pro obce",
      name: "Standard",
      lead: "Pravidelný videozpravodaj a k němu krátká videa na sociální sítě. Jeden partner, jedna cena, každý měsíc.",
      items: [
        { t: "1× videozpravodaj měsíčně", d: "Přibližně 3–8 minut podle množství aktuálního dění." },
        { t: "3× krátké video měsíčně", d: "Vertikální formát 9:16, zpravidla 30–60 sekund. Například pozvánka na akci, reportáž nebo informace o projektu." },
        { t: "Animovaná grafická identita", d: "Animované logo, vlastní jmenovky, titulky a přechody – animovaný design na míru podle vizuální identity obce, z dodaných podkladů." },
        { t: "Kompletní produkce a postprodukce", d: "Kamera, stabilizace, zvuk, střih, barvy a sjednocený vzhled všech výstupů." },
        { t: "Plánování a koordinace", d: "Pravidelná domluva témat, natáčecích termínů a předání hotových videí." },
      ],
      price: "25 000 Kč",
      priceNote: "měsíčně",
      priceSub: "Konečná cena – nejsme plátci DPH.",
      cta: "Chci balíček Standard",
      prefill: "Dobrý den, máme zájem o balíček Standard (videozpravodaj + 3 krátká videa měsíčně). Prosíme o nabídku.",
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
      name: "Samostatné video",
      lead: "Prezentační video obce, záznam akce nebo video o investici.",
      items: [
        "Prezentační video obce nebo projektu",
        "Záznam a sestřih kulturní akce",
        "Video o rekonstrukci či investici",
      ],
      price: null,
      cta: "Poptat video",
      prefill: "Dobrý den, poptáváme jednorázové video: ",
    },
  ],

  /* --- Portfolio --------------------------------------------------------
     group:   "obce" | "volby"  (volební videa jsou samostatná kategorie)
     status:  přesný popis vztahu – NEUVÁDĚT pokračování, které není potvrzené
     image:   náhled 16:9 (min. 1600×900, webp/avif); null = placeholder
     video:   { youtube: "ID" } | { mp4: "cesta.mp4" } | { instagram: "URL příspěvku" } | null
              (Instagram se otevírá v novém okně, nic se nenačítá z Meta předem)
     todo:    co je potřeba doplnit (zobrazí se v placeholderu)
     videoOnly: true = místo textu jen samotné video (popisek „caption“ pod ním)
     hideName:  true = jméno se nikde nezobrazí (ani v pásu „Natáčeli jsme pro“) – chybí souhlas */
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
      image: {
        avif: "../assets/img/foto/obec-ricany-dronovy-zaber-1200.avif",
        webp: "../assets/img/foto/obec-ricany-dronovy-zaber-1200.webp",
        alt: "Letecký záběr obce Říčany u Brna z dronu – natočila D&M Vision",
      },
      video: null,
      todo: "Doplnit odkaz na ukázkový díl videozpravodaje (YouTube ID nebo MP4).",
      featured: true,
    },
    {
      id: "modrice",
      videoOnly: true,
      caption: "Modřice",
      group: "obce",
      client: "Modřice",
      kind: "Město",
      status: "Dlouhodobější spolupráce",
      title: "Video produkce pro město Modřice",
      text: "Dlouhodobější video produkce pro město Modřice.",
      tags: ["Video produkce"],
      image: null,
      video: null,
      todo: "Doplnit náhled 16:9, odkaz na video a jednu větu o obsahu. Až se potvrdí pokračování, změnit status na „Dlouhodobá spolupráce · pokračuje“.",
    },
    {
      id: "oresin",
      videoOnly: true,
      caption: "Brno-Ořešín",
      group: "obce",
      client: "Brno-Ořešín",
      kind: "Městská část Brna",
      status: "Realizovaná delší zakázka",
      title: "Video produkce pro MČ Brno-Ořešín",
      text: "Delší realizovaná zakázka pro městskou část Brno-Ořešín.",
      tags: ["Video produkce"],
      image: null,
      video: null,
      todo: "Doplnit náhled 16:9, odkaz na video a stručný popis rozsahu zakázky.",
    },
    {
      id: "chvatal",
      videoOnly: true,
      caption: "Volební video",
      hideName: true,
      group: "volby",
      client: "Filip Chvátal",
      kind: "Kandidát",
      status: "Volební video",
      highlight: "Volby vyhrál",
      title: "Volební video",
      text: "Natočili jsme volební video pro Filipa Chvátala, který letos volby vyhrál.",
      tags: ["Volební kampaň"],
      image: null,
      video: { instagram: "https://www.instagram.com/p/Dd1l_lDMp7U/" },
      todo: "Doplnit náhledový snímek z videa (16:9). Ověřit souhlas se zveřejněním.",
    },
    {
      id: "kol",
      videoOnly: true,
      caption: "Volební videa",
      hideName: true,
      group: "volby",
      client: "Kuřimská občanská liga · Drago Sukalovský",
      kind: "Politický subjekt a kandidát",
      status: "Volební videa",
      title: "Volební videa",
      text: "Volební videa pro Kuřimskou občanskou ligu a Draga Sukalovského.",
      tags: ["Volební kampaň"],
      image: null,
      video: null,
      todo: "Doplnit náhled 16:9 a odkaz na video. Ověřit souhlas se zveřejněním.",
    },
  ],
};
