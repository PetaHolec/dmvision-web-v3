/* D&M Vision – lišta se souhlasem s cookies a měření návštěvnosti (Google Analytics 4).
   Google Analytics se načte až po souhlasu. Dokud není vyplněné GA_ID, lišta se vůbec nezobrazí. */
(() => {
  // ID měření z Google Analytics (Správce → Datové proudy → web), např. "G-AB12CD34EF"
  const GA_ID = "";
  const STORAGE_KEY = "dmv-cookies"; // volba návštěvníka, platí 12 měsíců
  const VALID_MS = 365 * 24 * 60 * 60 * 1000;

  if (!/^G-[A-Z0-9]+$/.test(GA_ID)) return;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  let loaded = false;
  let bar = null;

  /* ---------- uložená volba ---------- */
  const readChoice = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Date.now() - saved.at < VALID_MS) return saved.analytics;
    } catch (e) {}
    return null;
  };
  const saveChoice = (analytics) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics, at: Date.now() }));
    } catch (e) {}
  };

  /* ---------- Google Analytics jen pro měření, bez reklamních funkcí ---------- */
  const loadAnalytics = () => {
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    gtag("js", new Date());
    gtag("config", GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(script);
  };

  const deleteAnalyticsCookies = () => {
    const host = location.hostname;
    const domains = ["", host, "." + host.replace(/^www\./, "")];
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      if (!name.startsWith("_ga")) return;
      domains.forEach((d) => {
        document.cookie = name + "=; Max-Age=0; path=/" + (d ? "; domain=" + d : "");
      });
    });
  };

  const setAnalytics = (on) => {
    window["ga-disable-" + GA_ID] = !on;
    if (loaded) gtag("consent", "update", { analytics_storage: on ? "granted" : "denied" });
    if (on && !loaded) loadAnalytics();
    if (!on) deleteAnalyticsCookies();
  };

  /* ---------- kliknutí na telefon, e-mail a WhatsApp (Analytics je samo neměří) ---------- */
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="tel:"], a[href^="mailto:"], a[href*="wa.me/"]');
    if (!link || !loaded || window["ga-disable-" + GA_ID]) return;
    const href = link.getAttribute("href");
    const method = href.startsWith("tel:") ? "telefon" : href.startsWith("mailto:") ? "e-mail" : "whatsapp";
    gtag("event", "kontakt", { method });
  });

  /* ---------- lišta ---------- */
  const openBar = (focus) => {
    if (!bar) {
      const privacy = $('.ftr__bottom a[href*="zasady-ochrany-osobnich-udaju"]');
      const more = privacy ? ` – <a href="${privacy.getAttribute("href")}">více o zpracování údajů</a>` : "";
      bar = document.createElement("div");
      bar.className = "cookie-bar";
      bar.setAttribute("role", "region");
      bar.setAttribute("aria-label", "Souhlas s cookies");
      bar.innerHTML = `
        <p class="cookie-bar__title">Můžeme měřit návštěvnost webu?</p>
        <p class="cookie-bar__text">S vaším souhlasem použijeme cookies Google Analytics, abychom věděli, kolik lidí web navštěvuje a co je zajímá. Reklamní cookies nepoužíváme. Volbu můžete kdykoli změnit v patičce webu${more}.</p>
        <div class="cookie-bar__actions">
          <button type="button" class="cookie-bar__btn cookie-bar__btn--yes" data-analytics="1">Povolit měření</button>
          <button type="button" class="cookie-bar__btn" data-analytics="0">Odmítnout</button>
        </div>`;
      bar.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-analytics]");
        if (!btn) return;
        const on = btn.dataset.analytics === "1";
        saveChoice(on);
        setAnalytics(on);
        bar.hidden = true;
      });
      document.body.appendChild(bar);
    }
    bar.hidden = false;
    if (focus) $("button", bar).focus();
  };

  // odkaz „Nastavení cookies“ v patičce
  $$("[data-cookies]").forEach((el) => {
    el.hidden = false;
    $("button", el).addEventListener("click", () => openBar(true));
  });

  const choice = readChoice();
  if (choice === null) openBar(false);
  else if (choice) setAnalytics(true);
})();
