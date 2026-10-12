/* D&M Vision – landing page pro města a obce */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const DMV = window.DMV || {};
  // cesty v content.js jsou relativní ke kořeni webu – na podstránkách je přepočítáme
  const ROOT = new URL("../../", document.currentScript ? document.currentScript.src : location.href);
  const onRoot = location.pathname === ROOT.pathname || location.pathname === ROOT.pathname + "index.html";
  const res = (p) => (!p || /^(https?:|mailto:|tel:|data:)/.test(p) || (p[0] === "#" && onRoot) ? p : new URL(p, ROOT).href);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- měření (jen pokud je analytika na webu nasazená) ----------
     Nic nepřidává. Pokud stránka později dostane schválený nástroj
     (GTM / dataLayer, Plausible…), události se začnou posílat samy. */
  const track = (name, props = {}) => {
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: name, ...props });
    if (typeof window.plausible === "function") window.plausible(name, { props });
  };
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-track]");
    if (el) track(el.dataset.track, { label: el.textContent.trim().slice(0, 60) });
  });

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const tc = (frames) => {
    const f = frames % 25, s = Math.floor(frames / 25);
    const p = (n) => String(n).padStart(2, "0");
    return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}:${p(f)}`;
  };

  /* ---------- hlavička a menu ---------- */
  const hdr = $("[data-hdr]");
  const burger = $("[data-burger]");
  const nav = $("#nav");
  const onScroll = () => hdr.classList.toggle("is-solid", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setMenu = (open) => {
    burger.setAttribute("aria-expanded", String(open));
    $(".sr-only", burger).textContent = open ? "Zavřít menu" : "Otevřít menu";
    nav.classList.toggle("is-open", open);
    hdr.classList.toggle("menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); burger.focus(); }
  });
  window.matchMedia("(min-width: 1200px)").addEventListener("change", () => setMenu(false));

  // zvýraznění aktuální sekce v navigaci
  const navLinks = $$(".nav__list a");
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.setAttribute("aria-current", String(a.hash === "#" + en.target.id)));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main > section").forEach((s) => sectionObs.observe(s));

  /* ---------- časový kód v hero ---------- */
  const heroTc = $("[data-timecode]");
  if (heroTc && !reduceMotion.matches) {
    const t0 = performance.now();
    const tick = (t) => { heroTc.textContent = tc(Math.floor((t - t0) / 40)); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  /* ---------- hero video (volitelné) ---------- */
  if (DMV.heroVideo && !reduceMotion.matches) {
    const v = document.createElement("video");
    Object.assign(v, { muted: true, loop: true, playsInline: true, autoplay: true, preload: "metadata" });
    v.setAttribute("aria-hidden", "true");
    if (DMV.heroVideo.webm) v.insertAdjacentHTML("beforeend", `<source src="${esc(DMV.heroVideo.webm)}" type="video/webm">`);
    if (DMV.heroVideo.mp4) v.insertAdjacentHTML("beforeend", `<source src="${esc(DMV.heroVideo.mp4)}" type="video/mp4">`);
    $(".hero__media").append(v);
  }

  /* ---------- přehrávání videí ---------- */
  const embed = (video, title, autoplay = true) => {
    if (video.youtube) {
      const id = encodeURIComponent(video.youtube);
      return `<iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0${autoplay ? "&autoplay=1" : ""}" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    }
    if (video.mp4) {
      return `<video src="${esc(video.mp4)}" controls playsinline ${autoplay ? "autoplay" : ""} ${video.poster ? `poster="${esc(video.poster)}"` : ""}></video>`;
    }
    return "";
  };

  // showreel
  const player = $("[data-player]");
  const reel = DMV.showreel;
  if (player && reel && (reel.youtube || reel.mp4)) {
    player.innerHTML = `
      <button class="player__poster" type="button" aria-label="Přehrát showreel D&amp;M Vision se zvukem">
        ${reel.poster ? `<img src="${esc(reel.poster)}" alt="" loading="lazy" decoding="async">` : ""}
        <span class="play">Přehrát showreel</span>
      </button>`;
    $(".player__poster", player).addEventListener("click", () => {
      player.innerHTML = embed(reel, "Showreel D&M Vision");
      track("showreel_play");
      const el = $("iframe, video", player); if (el) el.focus();
    });
  }

  // modal pro realizace
  const modal = $("[data-modal]") || document.createElement("dialog");
  if (!modal.isConnected) { modal.innerHTML = "<p data-modal-title></p><div data-modal-media></div><button data-modal-close></button>"; document.body.append(modal); }
  const openVideo = (p, opener) => {
    $("[data-modal-title]", modal).textContent = `${p.client} – ${p.title}`;
    $("[data-modal-media]", modal).innerHTML = embed(p.video, p.title);
    modal.showModal();
    modal._opener = opener;
    track("portfolio_play", { project: p.id });
  };
  const closeModal = () => modal.close();
  $("[data-modal-close]", modal).addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  modal.addEventListener("close", () => {
    $("[data-modal-media]", modal).innerHTML = "";
    if (modal._opener) modal._opener.focus();
  });

  /* ---------- portfolio ---------- */
  const renderProject = (p, compact) => {
    const ig = p.video && p.video.instagram;
    const hasVideo = p.video && (p.video.youtube || p.video.mp4);
    const media = p.image
      ? `<picture>
           ${p.image.avif ? `<source type="image/avif" srcset="${esc(res(p.image.avif))}">` : ""}
           <img src="${esc(res(p.image.webp || p.image.src))}" alt="${esc(p.image.alt || p.client)}" loading="lazy" decoding="async" width="1600" height="900">
         </picture>`
      : `<div class="placeholder">
           <span class="vf vf--tl"></span><span class="vf vf--tr"></span><span class="vf vf--bl"></span><span class="vf vf--br"></span>
           <p class="placeholder__label">Místo pro náhled videa</p>
           <p class="placeholder__spec">Snímek z videa 16:9 · min. 1600×900 px</p>
         </div>`;
    const play = hasVideo
      ? `<button class="proj__playbtn" type="button" data-play="${esc(p.id)}" aria-label="Přehrát video: ${esc(p.client)}"><span class="play">Přehrát</span></button>`
      : ig
        ? `<a class="proj__playbtn" href="${esc(ig)}" target="_blank" rel="noopener" data-track="portfolio_instagram" aria-label="Přehrát video na Instagramu: ${esc(p.client)} (otevře se v novém okně)"><span class="play">Instagram ↗</span></a>`
        : "";
    const live = /pokračuje/i.test(p.status);
    return `
      <article class="proj reveal ${p.featured ? "proj--featured" : ""} ${compact ? "proj--compact" : ""}">
        <div class="proj__media">${media}${play}</div>
        <div class="proj__body">
          <div class="proj__meta">
            <span class="chip ${live ? "chip--live" : "chip--status"}">${esc(p.status)}</span>
            ${p.highlight ? `<span class="chip chip--win">${esc(p.highlight)}</span>` : ""}
            ${(p.tags || []).map((t) => `<span class="chip">${esc(t)}</span>`).join("")}
          </div>
          <h4 class="proj__client">${esc(p.client)}</h4>
          <p class="proj__kind">${esc(p.kind)}</p>
          <p class="proj__text">${esc(p.text)}</p>
          ${p.link ? `<a class="link-arrow proj__link" href="${esc(res(p.link.href))}">${esc(p.link.label)} <span aria-hidden="true">→</span></a>` : ""}
          ${p.todo && (!hasVideo || !p.image) ? `<p class="proj__todo"><strong>K doplnění:</strong> ${esc(p.todo)}</p>` : ""}
        </div>
      </article>`;
  };
  $$("[data-work]").forEach((grid) => {
    const group = grid.dataset.work;
    grid.innerHTML = (DMV.projects || []).filter((p) => p.group === group).map((p) => renderProject(p, group === "volby")).join("");
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-play]");
    if (!b) return;
    const p = (DMV.projects || []).find((x) => x.id === b.dataset.play);
    if (p) openVideo(p, b);
  });

  /* ---------- balíčky ---------- */
  const pkgGrid = $("[data-packages]");
  if (pkgGrid) {
    pkgGrid.innerHTML = (DMV.packages || []).map((k) => {
      const items = k.items.map((it) => typeof it === "string"
        ? `<li>${esc(it)}</li>`
        : `<li><strong>${esc(it.t)}</strong>${it.d ? `<span>${esc(it.d)}</span>` : ""}</li>`).join("");
      return `
        <article class="pk reveal ${k.featured ? "pk--featured" : ""}">
          <p class="pk__label">${esc(k.label)}</p>
          <h3 class="pk__name">${esc(k.name)}</h3>
          <p class="pk__lead">${esc(k.lead)}</p>
          <p class="pk__price ${k.price ? "pk__price--set" : ""}">${k.price ? `${esc(k.price)}${k.priceNote ? ` <small>/ ${esc(k.priceNote)}</small>` : ""}` : "Cena na míru podle rozsahu"}</p>
          ${k.priceSub ? `<p class="pk__sub">${esc(k.priceSub)}</p>` : ""}
          <ul class="pk__list">${items}</ul>
          <div class="pk__foot">
            <a class="btn ${k.featured ? "btn--accent" : "btn--dark"}" href="#kontakt" data-prefill="${esc(k.prefill || "")}" data-track="cta_package_${esc(k.id)}">${esc(k.cta)} <span class="btn__arr" aria-hidden="true">→</span></a>
          </div>
          ${k.todo ? `<p class="proj__todo"><strong>K doplnění:</strong> ${esc(k.todo)}</p>` : ""}
        </article>`;
    }).join("");
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-prefill]");
    if (!a) return;
    const msg = $("#f-msg");
    if (a.dataset.prefill && (!msg.value.trim() || msg.dataset.prefilled === "1")) {
      msg.value = a.dataset.prefill;
      msg.dataset.prefilled = "1";
    }
    setTimeout(() => msg.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 700);
  });
  document.addEventListener("input", (e) => { if (e.target.id === "f-msg") e.target.dataset.prefilled = "0"; });

  /* ---------- odhalování při scrollu ---------- */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); revealObs.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  // nadpisy nastupují "střihem": ořez se animuje na vnitřním obalu, pozorujeme samotný nadpis
  $$(".h2, .final__title").forEach((el) => {
    const inner = document.createElement("span");
    inner.className = "cut-in__in";
    inner.append(...el.childNodes);
    el.append(inner);
    el.classList.add("cut-in");
    revealObs.observe(el);
  });
  $$(".reveal").forEach((el, i) => {
    const sib = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
    el.style.transitionDelay = `${Math.min(sib, 5) * 70}ms`;
    revealObs.observe(el);
  });

  /* ---------- filmové efekty řízené scrollem ---------- */
  // slova se "rozsvěcují" postupně při čtení
  const wordBlocks = $$("[data-words]");
  wordBlocks.forEach((el) => {
    const frag = document.createDocumentFragment();
    [...el.childNodes].forEach((node) => {
      if (node.nodeType !== 3) { frag.append(node.cloneNode(true)); return; }
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) frag.append(part);
        else { const w = document.createElement("span"); w.className = "w"; w.textContent = part; frag.append(w); }
      });
    });
    el.textContent = "";
    el.append(frag);
    el._words = $$(".w", el);
  });

  const hero = $(".hero");
  const reelPlayer = $("[data-player]");
  const hud = $("[data-hud]");
  const hudSc = $("[data-hud-sc]"), hudName = $("[data-hud-name]"), hudTc = $("[data-hud-tc]"), hudBar = $("[data-hud-bar]");
  const scenes = $$("[data-scene]");
  const clamp = (v) => Math.min(1, Math.max(0, v));
  let fxQueued = false;
  const fx = () => {
    fxQueued = false;
    const vh = window.innerHeight, y = window.scrollY;
    if (!reduceMotion.matches) {
      if (hero) hero.style.setProperty("--p", clamp(y / (vh * 0.9)).toFixed(3));
      if (reelPlayer) {
        const r = reelPlayer.getBoundingClientRect();
        reelPlayer.style.setProperty("--s", (0.86 + 0.14 * clamp((vh - r.top) / (vh * 0.75))).toFixed(3));
      }
    }
    wordBlocks.forEach((el) => {
      const r = el.getBoundingClientRect();
      const p = reduceMotion.matches ? 1 : clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
      const lit = Math.round(p * el._words.length);
      el._words.forEach((w, i) => w.classList.toggle("on", i < lit));
    });
    if (hud) {
      const max = document.documentElement.scrollHeight - vh;
      const f = max > 0 ? y / max : 0;
      hud.classList.toggle("is-on", y > vh * 0.7);
      hudTc.textContent = tc(Math.floor(f * 180 * 25));
      hudBar.style.transform = `scaleX(${f.toFixed(4)})`;
      let cur = 0;
      scenes.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * 0.5) cur = i; });
      hudSc.textContent = "SC " + String(cur + 1).padStart(2, "0");
      hudName.textContent = scenes[cur] ? scenes[cur].dataset.scene : "";
    }
  };
  const queueFx = () => { if (!fxQueued) { fxQueued = true; requestAnimationFrame(fx); } };
  window.addEventListener("scroll", queueFx, { passive: true });
  window.addEventListener("resize", queueFx);
  fx();

  /* ---------- časová osa průběhu – playhead podle scrollu ---------- */
  const tl = $("[data-timeline]");
  const head = $("[data-playhead]");
  if (tl && head && !reduceMotion.matches) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = tl.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.85 - vh * 0.25 + r.height * 0.3)));
      head.style.setProperty("--ph", `${p * (r.width - 2)}px`);
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- CTA "Domluvit konzultaci" → fokus do formuláře ---------- */
  $$("[data-focus-form]").forEach((a) => a.addEventListener("click", () => {
    setTimeout(() => $("#f-name").focus({ preventScroll: true }), reduceMotion.matches ? 0 : 700);
  }));

  /* ---------- formulář ---------- */
  const form = $("[data-form]");
  if (form) {
    const status = $("[data-status]", form);
    const submit = $("button[type=submit]", form);
    const loadedAt = Date.now();
    const rules = [
      ["f-name", (v) => v.trim().length >= 2, "Vyplňte prosím jméno."],
      ["f-org", (v) => v.trim().length >= 2, "Uveďte prosím obec nebo instituci."],
      ["f-email", (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), "Zadejte platný e-mail."],
      ["f-msg", (v) => v.trim().length >= 5, "Napište prosím pár slov o tom, co potřebujete."],
    ];
    const validate = () => {
      let first = null;
      rules.forEach(([id, ok, msg]) => {
        const el = $("#" + id), err = $("#" + id + "-err");
        const valid = ok(el.value);
        el.setAttribute("aria-invalid", String(!valid));
        if (valid) { err.textContent = ""; el.removeAttribute("aria-describedby"); }
        else { err.textContent = msg; el.setAttribute("aria-describedby", err.id); first = first || el; }
      });
      return first;
    };
    form.addEventListener("input", (e) => {
      if (e.target.getAttribute("aria-invalid") === "true") validate();
    });

    const setStatus = (cls, html) => { status.className = "form__status " + cls; status.innerHTML = html; };
    const mailtoFallback = () => {
      const d = new FormData(form);
      const body = `Jméno: ${d.get("jmeno")}\nObec / instituce: ${d.get("obec")}\nE-mail: ${d.get("email")}\nTelefon: ${d.get("telefon") || "-"}\n\n${d.get("zprava")}`;
      return `mailto:${DMV.contactEmail || "info@dmvision.cz"}?subject=${encodeURIComponent("Poptávka video produkce – " + d.get("obec"))}&body=${encodeURIComponent(body)}`;
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const invalid = validate();
      if (invalid) {
        setStatus("is-error", "Zkontrolujte prosím zvýrazněná pole.");
        invalid.focus();
        return;
      }
      if (form.web.value) return; // honeypot

      // Formulář zatím není napojen na odesílací službu → nic nepředstíráme.
      if (!DMV.formEndpoint) {
        setStatus("is-info",
          `Online odesílání zatím není zapnuté, zpráva se <strong>neodeslala</strong>. ` +
          `<a href="${esc(mailtoFallback())}" data-track="form_mailto">Otevřít e-mail s vyplněnou zprávou</a> ` +
          `nebo nám napište na <a href="mailto:${esc(DMV.contactEmail)}">${esc(DMV.contactEmail)}</a>.`);
        track("form_submit_unconfigured");
        return;
      }

      submit.disabled = true;
      const label = submit.innerHTML;
      submit.textContent = "Odesílám…";
      setStatus("", "");
      try {
        const fd = new FormData(form);
        fd.append("elapsed", String(Math.round((Date.now() - loadedAt) / 1000)));
        const res = await fetch(new URL(DMV.formEndpoint, ROOT).href, { method: "POST", body: fd, headers: { Accept: "application/json" } });
        const data = await res.json().catch(() => ({}));
        if (!(res.ok && data.ok)) throw new Error(data.error || "Odeslání se nepovedlo.");
        form.reset();
        setStatus("is-ok", "Děkujeme, zpráva odešla. Ozveme se vám do 24 hodin.");
        track("form_submit_success");
      } catch (err) {
        setStatus("is-error", `${esc(err.message)} Zkuste to prosím znovu, nebo nám napište na <a href="mailto:${esc(DMV.contactEmail)}">${esc(DMV.contactEmail)}</a>.`);
        track("form_submit_error");
      } finally {
        submit.disabled = false;
        submit.innerHTML = label;
      }
    });
  }

  /* ---------- přepínač publika: obce / politika ---------- */
  const audBtns = $$("[data-aud-set]");
  const setAud = (aud, save) => {
    document.documentElement.dataset.aud = aud;
    audBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.audSet === aud)));
    $$("[data-aud-show]").forEach((el) => { el.hidden = el.dataset.audShow !== aud; });
    $$("[data-aud-hide]").forEach((el) => { el.hidden = el.dataset.audHide === aud; });
    if (save) { try { localStorage.setItem("dmv-aud", aud); } catch (e) {} track("audience_switch", { aud }); }
  };
  audBtns.forEach((b) => b.addEventListener("click", () => setAud(b.dataset.audSet, true)));
  let aud = new URLSearchParams(location.search).get("pro");
  if (aud !== "politika" && aud !== "obce") { try { aud = localStorage.getItem("dmv-aud"); } catch (e) { aud = null; } }
  setAud(aud === "politika" ? "politika" : "obce", false);

  /* ---------- porovnání barev ---------- */
  $$("[data-grade-range]").forEach((r) => r.addEventListener("input", () => r.parentElement.style.setProperty("--g", r.value + "%")));

  /* ---------- doporučení klienta (jen když je vyplněné) ---------- */
  const tm = $("[data-testimonial]");
  if (tm && DMV.testimonial && DMV.testimonial.quote) {
    const t = DMV.testimonial;
    tm.innerHTML = `${t.photo ? `<img src="${esc(t.photo)}" alt="" width="96" height="96" loading="lazy">` : ""}<blockquote><p>„${esc(t.quote)}“</p></blockquote><figcaption><b>${esc(t.name)}</b>${t.role ? ` · ${esc(t.role)}` : ""}</figcaption>`;
    tm.hidden = false;
  }

  /* ---------- plovoucí tlačítko Zavolat (mobil) ---------- */
  const fab = $("[data-fab]");
  if (fab) {
    const contact = $("#kontakt");
    let contactIn = false;
    if (contact) new IntersectionObserver(([en]) => { contactIn = en.isIntersecting; upd(); }).observe(contact);
    const upd = () => fab.classList.toggle("is-on", window.scrollY > window.innerHeight * 0.8 && !contactIn);
    window.addEventListener("scroll", upd, { passive: true });
    upd();
  }

  const y = $("[data-year]"); if (y) y.textContent = new Date().getFullYear();
})();
