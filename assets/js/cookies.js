/* D&M Vision – lišta se souhlasem s cookies (nezbytné vždy, analytické = Google Analytics 4 jen se souhlasem).
   Google Analytics se načte až po souhlasu (platí pro hlavní web i stránku pro obce). Bez GA_ID se lišta nezobrazí. */
(() => {
  // ID měření z Google Analytics (Správce → Datové proudy → web), např. "G-AB12CD34EF"
  const GA_ID = "G-KYP651WCP0";
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

  /* ---------- lišta: Přijmout vše / Jen nezbytné / Nastavení ---------- */
  const decide = (analytics) => {
    saveChoice(analytics);
    setAnalytics(analytics);
    bar.hidden = true;
  };

  const showPrefs = (on) => {
    $(".cookie-bar__main", bar).hidden = on;
    $(".cookie-bar__prefs", bar).hidden = !on;
    $("[data-analytics-toggle]", bar).checked = readChoice() === true;
  };

  const openBar = (prefs, focus) => {
    if (!bar) {
      const privacy = $('footer a[href*="zasady-ochrany-osobnich-udaju"]');
      const more = privacy ? ` Více v <a href="${privacy.getAttribute("href")}">zásadách ochrany osobních údajů</a>.` : "";
      bar = document.createElement("div");
      bar.className = "cookie-bar";
      bar.setAttribute("role", "region");
      bar.setAttribute("aria-label", "Nastavení cookies");
      bar.innerHTML = `
        <p class="cookie-bar__title">Cookies na tomto webu</p>
        <div class="cookie-bar__main">
          <p class="cookie-bar__text">Nezbytné cookies potřebuje web, aby fungoval. S vaším souhlasem použijeme i analytické cookies Google Analytics, abychom věděli, kolik lidí web navštěvuje a co je zajímá. Reklamní cookies nepoužíváme.${more}</p>
          <div class="cookie-bar__actions">
            <button type="button" class="cookie-bar__btn cookie-bar__btn--yes" data-consent="all">Přijmout vše</button>
            <button type="button" class="cookie-bar__btn" data-consent="necessary">Jen nezbytné</button>
          </div>
          <button type="button" class="cookie-bar__more" data-consent="prefs">Upravit nastavení</button>
        </div>
        <div class="cookie-bar__prefs" hidden>
          <label class="cookie-opt cookie-opt--fixed">
            <span class="cookie-opt__body">
              <span class="cookie-opt__name">Nezbytné</span>
              <span class="cookie-opt__desc">Vždy zapnuté. Pamatují si vaši volbu cookies a zajišťují základní funkce webu.</span>
            </span>
            <input type="checkbox" class="cookie-switch" checked disabled>
          </label>
          <label class="cookie-opt">
            <span class="cookie-opt__body">
              <span class="cookie-opt__name">Analytické</span>
              <span class="cookie-opt__desc">Google Analytics 4: kolik lidí web navštěvuje, odkud přicházejí a co je zajímá. Reklamní funkce máme vypnuté.</span>
            </span>
            <input type="checkbox" class="cookie-switch" data-analytics-toggle>
          </label>
          <div class="cookie-bar__actions">
            <button type="button" class="cookie-bar__btn" data-consent="save">Uložit výběr</button>
            <button type="button" class="cookie-bar__btn cookie-bar__btn--yes" data-consent="all">Přijmout vše</button>
          </div>
        </div>`;
      bar.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-consent]");
        if (!btn) return;
        const action = btn.dataset.consent;
        if (action === "prefs") {
          showPrefs(true);
          $("[data-analytics-toggle]", bar).focus();
        } else if (action === "all") decide(true);
        else if (action === "necessary") decide(false);
        else decide($("[data-analytics-toggle]", bar).checked);
      });
      document.body.appendChild(bar);
    }
    showPrefs(prefs);
    bar.hidden = false;
    if (focus) $(prefs ? "[data-analytics-toggle]" : ".cookie-bar__main button", bar).focus();
  };

  // odkaz „Nastavení cookies“ v patičce – rovnou otevře volbu kategorií
  $$("[data-cookies]").forEach((el) => {
    el.hidden = false;
    $("button", el).addEventListener("click", () => openBar(true, true));
  });

  const choice = readChoice();
  if (choice === null) openBar(false, false);
  else if (choice) setAnalytics(true);
})();
