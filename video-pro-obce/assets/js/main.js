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
    if (typeof window.gtag === "function") window.gtag("event", name, props); // jen po souhlasu s měřením (cookies.js)
    else if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: name, ...props });
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

  /* ---------- úvod: záběr se jemně pohne za myší (jen počítač) ---------- */
  const heroEl = $(".hero");
  if (heroEl && !reduceMotion.matches && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let mxRaf = 0;
    heroEl.addEventListener("pointermove", (e) => {
      if (mxRaf) return;
      mxRaf = requestAnimationFrame(() => {
        mxRaf = 0;
        const r = heroEl.getBoundingClientRect();
        heroEl.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        heroEl.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
    });
    heroEl.addEventListener("pointerleave", () => { heroEl.style.setProperty("--mx", "0"); heroEl.style.setProperty("--my", "0"); });
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
      return `<video src="${esc(res(video.mp4))}" controls playsinline ${autoplay ? "autoplay" : ""} ${video.poster ? `poster="${esc(res(video.poster))}"` : ""}></video>`;
    }
    return "";
  };

  // modal pro realizace
  const modal = $("[data-modal]") || document.createElement("dialog");
  if (!modal.isConnected) { modal.innerHTML = "<p data-modal-title></p><div data-modal-media></div><button data-modal-close></button>"; document.body.append(modal); }
  const openVideo = (p, opener) => {
    $("[data-modal-title]", modal).textContent = `${p.client} – ${p.title}`;
    modal.classList.toggle("modal--tall", !!p.video.tall); // video na výšku: užší okno
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
  const renderProject = (p) => {
    const ig = p.video && p.video.instagram;
    const hasVideo = p.video && (p.video.youtube || p.video.mp4);
    const tall = !!(p.image && p.image.tall); // náhled na výšku: celý snímek, za ním rozmazaná kopie
    const media = p.image
      ? `${tall && !p.featured ? `<img class="proj__blur" src="${esc(res(p.image.webp || p.image.src))}" alt="" loading="lazy" decoding="async">` : ""}<picture>
           ${p.image.avif ? `<source type="image/avif" srcset="${esc(res(p.image.avif))}">` : ""}
           <img src="${esc(res(p.image.webp || p.image.src))}" alt="${esc(p.image.alt || p.client)}" loading="lazy" decoding="async" width="${tall ? 720 : 1600}" height="${tall ? 1280 : 900}">
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
      <article class="proj reveal ${p.featured ? "proj--featured" : ""} ${tall ? "proj--tall" : ""}">
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
  const trust = $("[data-trust]");
  if (trust) {
    // „Strana · Kandidát“ s typem „Politický subjekt a kandidát“ rozdělíme na dvě jména
    const names = (DMV.projects || []).filter((p) => !p.noTrust).flatMap((p) => {
      const who = p.client.split(" · "), kinds = p.kind.split(" a ");
      return who.length > 1 && kinds.length === who.length
        ? who.map((c, i) => ({ client: c, kind: kinds[i].charAt(0).toUpperCase() + kinds[i].slice(1), group: p.group }))
        : [{ client: p.client, kind: p.trustKind || p.kind, group: p.group }];
    });
    trust.innerHTML = names.map((p) => `
      <li class="trust__item reveal" data-group="${esc(p.group)}">
        <a href="#realizace"><span class="trust__kind">${esc(p.kind)}</span><span class="trust__name">${esc(p.client)}</span></a>
      </li>`).join("");
  }
  $$("[data-work]").forEach((grid) => {
    const group = grid.dataset.work;
    grid.innerHTML = (DMV.projects || []).filter((p) => p.group === group && !p.noCard).map(renderProject).join("");
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-play]");
    if (!b) return;
    const p = (DMV.projects || []).find((x) => x.id === b.dataset.play);
    if (p) openVideo(p, b);
  });

  /* ---------- balíčky: přepínací tlačítka a vždy jeden balíček (vejde se na obrazovku) ---------- */
  const pkgPanels = $("[data-packages]");
  const pkgTabs = $("[data-pk-tabs]");
  if (pkgPanels && pkgTabs && (DMV.packages || []).length) {
    const list = DMV.packages;
    const priceShort = (k) => (k.price ? `${k.price}${k.priceNote ? ` / ${k.priceNote}` : ""}` : "Cena na míru");
    pkgTabs.innerHTML = list.map((k) => `
      <button class="pkt__tab" type="button" role="tab" id="pkt-${esc(k.id)}" aria-controls="pk-${esc(k.id)}" aria-selected="false" tabindex="-1" data-pk="${esc(k.id)}"${k.aud ? ` data-aud="${esc(k.aud)}"` : ""}>
        <span class="pkt__label">${esc(k.label)}</span>
        <span class="pkt__name">${esc(k.name)}</span>
        <span class="pkt__price">${esc(priceShort(k))}</span>
      </button>`).join("");
    pkgPanels.innerHTML = list.map((k) => {
      const items = k.items.map((it) => typeof it === "string"
        ? `<li>${esc(it)}</li>`
        : `<li><strong>${esc(it.t)}</strong>${it.d ? `<span>${esc(it.d)}</span>` : ""}</li>`).join("");
      return `
        <article class="pk ${k.featured ? "pk--featured" : ""}" role="tabpanel" id="pk-${esc(k.id)}" aria-labelledby="pkt-${esc(k.id)}" hidden>
          <div class="pk__head">
            <div>
              <p class="pk__label">${esc(k.label)}</p>
              <h3 class="pk__name">${esc(k.name)}</h3>
            </div>
            <p class="pk__price ${k.price ? "pk__price--set" : ""}">${k.price ? `${esc(k.price)}${k.priceNote ? ` <small>/ ${esc(k.priceNote)}</small>` : ""}` : "Cena na míru podle rozsahu"}</p>
          </div>
          <p class="pk__lead">${esc(k.lead)}</p>
          <ul class="pk__list">${items}</ul>
          <div class="pk__foot">
            <a class="btn ${k.featured ? "btn--accent" : "btn--dark"}" href="#kontakt" data-pk-pick="${esc(k.id)}" data-prefill="${esc(k.prefill || "")}" data-track="cta_package_${esc(k.id)}">${esc(k.cta)} <span class="btn__arr" aria-hidden="true">→</span></a>
            ${k.priceSub ? `<p class="pk__sub">${esc(k.priceSub)}</p>` : ""}
          </div>
          ${k.todo ? `<p class="proj__todo"><strong>K doplnění:</strong> ${esc(k.todo)}</p>` : ""}
        </article>`;
    }).join("");
    const tabs = $$(".pkt__tab", pkgTabs);
    const pick = (id) => {
      tabs.forEach((t) => {
        const on = t.dataset.pk === id;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
      $$(".pk", pkgPanels).forEach((el) => { el.hidden = el.id !== "pk-" + id; });
    };
    tabs.forEach((t) => t.addEventListener("click", () => pick(t.dataset.pk)));
    // šipky mezi tlačítky
    pkgTabs.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(document.activeElement);
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (i < 0 || !step) return;
      e.preventDefault();
      const t = tabs[(i + step + tabs.length) % tabs.length];
      t.focus();
      pick(t.dataset.pk);
    });
    pick(tabs[0].dataset.pk);
    if (!reduceMotion.matches && "IntersectionObserver" in window) {
      $$(".pk__price--set", pkgPanels).forEach((el) => {
        const node = [...el.childNodes].find((n) => n.nodeType === 3 && /\d/.test(n.textContent));
        if (!node) return;
        const final = node.textContent, target = parseInt(final.replace(/\D/g, ""), 10);
        const obs = new IntersectionObserver(([en]) => {
          if (!en.isIntersecting) return;
          obs.disconnect();
          const t0 = performance.now(), dur = 1400;
          const tick = (t) => {
            const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
            node.textContent = k < 1 ? final.replace(/\d[\d \u00a0]*\d|\d/, Math.round(target * e).toLocaleString("cs-CZ")) : final;
            if (k < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }, { threshold: 0.6 });
        obs.observe(el);
      });
    }
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

  /* ---------- štítky nad nadpisy: písmena se doladí jako na monitoru kamery ---------- */
  const GLYPHS = "ABCDEFGHIJKLMNOPRSTUVZ0123456789#/·";
  const decode = (el) => {
    const final = el.textContent;
    const len = final.length;
    const t0 = performance.now(), dur = 700;
    el.style.minWidth = el.offsetWidth + "px";
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const fixed = Math.floor(k * len);
      let out = final.slice(0, fixed);
      for (let i = fixed; i < len; i++) out += final[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = out;
      if (k < 1) requestAnimationFrame(step); else { el.textContent = final; el.style.minWidth = ""; }
    };
    requestAnimationFrame(step);
  };
  if (!reduceMotion.matches) {
    const decodeObs = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      decodeObs.unobserve(en.target);
      decode(en.target);
    }), { rootMargin: "0px 0px -12% 0px" });
    $$(".eyebrow, .trust__lbl").forEach((el) => { if (el.children.length === 0) decodeObs.observe(el); });
  }
  $$(".svc__fig, .grade__frame, .proj__media").forEach((el) => el.classList.add("wipe"));

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
  // stěrka: oříznutý prvek sám „není vidět“, proto hlídáme jeho rodiče
  const wipeObs = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    wipeObs.unobserve(en.target);
    en.target._wipe.classList.add("is-in");
  }), { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });
  $$(".wipe").forEach((el) => { el.parentElement._wipe = el; wipeObs.observe(el.parentElement); });
  $$("[data-form]").forEach((el) => revealObs.observe(el));
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
  const hud = $("[data-hud]");
  const hudSc = $("[data-hud-sc]"), hudName = $("[data-hud-name]"), hudTc = $("[data-hud-tc]"), hudBar = $("[data-hud-bar]");
  const scenes = $$("[data-scene]");
  const clamp = (v) => Math.min(1, Math.max(0, v));
  let fxQueued = false;
  const fx = () => {
    fxQueued = false;
    const vh = window.innerHeight, y = window.scrollY;
    if (!reduceMotion.matches && hero) hero.style.setProperty("--p", clamp(y / (vh * 0.9)).toFixed(3));
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

  /* ---------- časová osa průběhu: běžec jede jen po ose nahoře, kroky se rozsvítí, když k nim dojede ---------- */
  const tl = $("[data-timeline]");
  if (tl) {
    const clips = $$(".tl__clip", tl);
    const wide = window.matchMedia("(min-width: 900px)");
    let ticking = false;
    const update = () => {
      ticking = false;
      const live = wide.matches && !reduceMotion.matches;
      tl.classList.toggle("is-live", live);
      if (!live) return;
      const r = tl.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp((vh * 0.95 - r.top) / (vh * 0.45));
      tl.style.setProperty("--ph", `${(p * (r.width - 2)).toFixed(1)}px`);
      clips.forEach((c, i) => c.classList.toggle("is-on", p >= i / clips.length + 0.03));
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }


  /* ---------- formulář: krátký dotazník (počítač celý, mobil po krocích jako na hlavním webu) ---------- */
  const form = $("[data-form]");
  if (form) {
    const status = $("[data-status]", form);
    const submit = $("button[type=submit]", form);
    const loadedAt = Date.now();
    const phoneMq = window.matchMedia("(max-width: 760px)");
    const radios = $$('input[name="balicek"]', form);
    // [pole, kontrola, hláška, krok]
    const rules = [
      ["f-pk", () => radios.some((r) => r.checked), "Vyberte prosím balíček, nebo „Ještě nevím“.", 1],
      ["f-msg", (v) => v.trim().length >= 5, "Napište prosím pár slov o tom, co potřebujete.", 2],
      ["f-name", (v) => v.trim().length >= 2, "Vyplňte prosím jméno.", 3],
      ["f-org", (v) => v.trim().length >= 2, "Uveďte prosím obec, stranu nebo instituci.", 3],
      ["f-email", (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), "Zadejte platný e-mail.", 3],
    ];
    const validate = (onlyStep) => {
      let first = null;
      rules.forEach(([id, ok, msg, st]) => {
        if (onlyStep && st !== onlyStep) return;
        const group = id === "f-pk";
        const el = group ? radios[0] : $("#" + id), err = $("#" + id + "-err");
        const valid = group ? ok() : ok(el.value);
        (group ? radios : [el]).forEach((f) => f.setAttribute("aria-invalid", String(!valid)));
        if (valid) { err.textContent = ""; el.removeAttribute("aria-describedby"); }
        else { err.textContent = msg; el.setAttribute("aria-describedby", err.id); first = first || el; }
      });
      return first;
    };
    // opravené pole se přepočítá hned, ale jen v rámci své otázky (jinde chyby nevyskakují předem)
    form.addEventListener("input", (e) => {
      const host = e.target.closest("[data-step]");
      if (host && e.target.getAttribute("aria-invalid") === "true") validate(+host.dataset.step);
    });

    /* mobil: jedna otázka na obrazovku – Krok X z 3, Zpět / Dál */
    const parts = $$("[data-step]", form);
    const total = Math.max(...parts.map((el) => +el.dataset.step));
    const wzTop = document.createElement("div");
    wzTop.className = "wz__top";
    wzTop.innerHTML = `<p class="wz__count" aria-live="polite"></p><span class="wz__bar">${"<i></i>".repeat(total)}</span>`;
    $(".form__intro", form).after(wzTop);
    const wzNav = document.createElement("div");
    wzNav.className = "wz__nav";
    wzNav.innerHTML = `<button class="wz__back" type="button"><span aria-hidden="true">←</span> Zpět</button><button class="btn btn--accent btn--lg wz__next" type="button">Dál <span class="btn__arr" aria-hidden="true">→</span></button>`;
    form.append(wzNav);
    const wzBack = $(".wz__back", wzNav), wzNext = $(".wz__next", wzNav);
    let step = 1, wizard = false;
    const show = (n, move) => {
      step = Math.min(total, Math.max(1, n));
      parts.forEach((el) => el.classList.toggle("is-step", +el.dataset.step === step));
      $(".wz__count", wzTop).textContent = `Krok ${step} z ${total}`;
      $$(".wz__bar i", wzTop).forEach((t, i) => t.classList.toggle("is-on", i < step));
      wzBack.hidden = step === 1;
      wzNext.hidden = step === total;
      if (!move) return;
      const top = form.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.4) form.scrollIntoView({ block: "start", behavior: reduceMotion.matches ? "auto" : "smooth" });
      const q = parts.find((el) => +el.dataset.step === step && el.matches("fieldset"));
      if (q) { q.tabIndex = -1; q.focus({ preventScroll: true }); }
    };
    wzNext.addEventListener("click", () => {
      const bad = validate(step);
      if (bad) bad.focus();
      else show(step + 1, true);
    });
    wzBack.addEventListener("click", () => show(step - 1, true));
    // výběr balíčku na mobilu sám posune dál
    form.addEventListener("change", (e) => {
      if (!wizard || e.target.name !== "balicek" || step !== 1) return;
      setTimeout(() => step === 1 && show(2, true), 280);
    });
    // Enter v políčku = Dál (ne odeslání)
    form.addEventListener("keydown", (e) => {
      if (!wizard || e.key !== "Enter" || step === total || e.target.matches("textarea, button")) return;
      e.preventDefault();
      wzNext.click();
    });
    const mode = () => {
      wizard = phoneMq.matches;
      form.classList.toggle("is-wizard", wizard);
      if (wizard) show(step);
    };
    mode();
    phoneMq.addEventListener("change", mode);

    // tlačítko u balíčku rovnou vybere balíček v dotazníku
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-pk-pick]");
      if (!a) return;
      const r = radios.find((x) => x.dataset.pk === a.dataset.pkPick);
      if (r) { r.checked = true; validate(1); }
      if (wizard) show(2);
    });
    // „Domluvit konzultaci“ → kurzor do první nevyplněné otázky
    $$("[data-focus-form]").forEach((a) => a.addEventListener("click", () => {
      setTimeout(() => {
        const target = !radios.some((r) => r.checked) ? radios[0] : $("#f-msg").value.trim() ? $("#f-name") : $("#f-msg");
        if (wizard) show(target === radios[0] ? 1 : target.id === "f-msg" ? 2 : 3);
        target.focus({ preventScroll: true });
      }, reduceMotion.matches ? 0 : 700);
    }));

    const setStatus = (cls, html) => { status.className = "form__status " + cls; status.innerHTML = html; };
    const mailtoFallback = () => {
      const d = new FormData(form);
      const body = `Jméno: ${d.get("jmeno")}\nObec / instituce: ${d.get("obec")}\nBalíček: ${d.get("balicek") || "-"}\nE-mail: ${d.get("email")}\nTelefon: ${d.get("telefon") || "-"}\n\n${d.get("zprava")}`;
      return `mailto:${DMV.contactEmail || "info@dmvision.cz"}?subject=${encodeURIComponent("Poptávka video produkce – " + d.get("obec"))}&body=${encodeURIComponent(body)}`;
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const invalid = validate();
      if (invalid) {
        setStatus("is-error", "Zkontrolujte prosím zvýrazněná pole.");
        if (wizard) show(+invalid.closest("[data-step]").dataset.step);
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

  /* ---------- ukázka videa ve Službách: hraje bez zvuku, jde pozastavit a pustit zvuk ---------- */
  $$("[data-clip-video]").forEach((fig) => {
    const v = $("video", fig);
    const pb = $("[data-clip-pause]", fig);
    const sb = $("[data-clip-sound]", fig);
    let held = reduceMotion.matches; // bez animací se samo nespustí
    let seen = false;
    const load = () => {
      if (v.getAttribute("src")) return;
      v.muted = true;
      v.src = v.dataset.src;
    };
    const sync = () => {
      pb.setAttribute("aria-pressed", String(v.paused));
      $("[data-label]", pb).textContent = v.paused ? "Přehrát" : "Pozastavit";
      sb.setAttribute("aria-pressed", String(!v.muted));
      $("[data-label]", sb).textContent = v.muted ? "Zapnout zvuk" : "Vypnout zvuk";
    };
    const play = () => { load(); v.play().catch(() => {}); };
    pb.addEventListener("click", () => {
      if (v.paused) { held = false; play(); } else { held = true; v.pause(); }
    });
    sb.addEventListener("click", () => {
      v.muted = !v.muted;
      if (!v.muted) { held = false; play(); }
      sync();
    });
    ["play", "pause", "volumechange"].forEach((ev) => v.addEventListener(ev, sync));
    sync();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => {
        seen = en.isIntersecting;
        if (seen && !held) play();
        else if (!seen) v.pause();
      }, { threshold: 0.35 }).observe(fig);
    } else if (!held) play();
  });

  /* ---------- porovnání barev: jezdec se sám lehce houpe, dokud na něj nikdo nesáhne ---------- */
  $$("[data-grade-range]").forEach((r) => {
    const frame = r.parentElement;
    const set = (v) => frame.style.setProperty("--g", v + "%");
    r.addEventListener("input", () => set(r.value));
    if (reduceMotion.matches || !("IntersectionObserver" in window)) return;
    let raf = 0, t0 = 0, running = false, done = false;
    const loop = (t) => {
      if (!t0) t0 = t;
      // 4 s houpnutí 50 → 32 → 50 → 68 → 50 %, pak 1,5 s klid
      const k = ((t - t0) / 1000) % 5.5;
      const v = k < 4 ? 50 - 18 * Math.sin((k / 4) * Math.PI * 2) : 50;
      set(v.toFixed(2));
      r.value = String(Math.round(v));
      raf = requestAnimationFrame(loop);
    };
    const stop = () => { done = true; running = false; cancelAnimationFrame(raf); };
    ["pointerdown", "touchstart", "keydown", "focus"].forEach((ev) => r.addEventListener(ev, stop, { passive: true }));
    new IntersectionObserver(([en]) => {
      if (done) return;
      if (en.isIntersecting && !running) { running = true; t0 = 0; raf = requestAnimationFrame(loop); }
      else if (!en.isIntersecting && running) { running = false; cancelAnimationFrame(raf); set(50); r.value = "50"; }
    }, { threshold: 0.4 }).observe(frame);
  });

  /* ---------- mobil: dlouhé seznamy na rozbalení (služby, průběh, proč my) ---------- */
  const small = window.matchMedia("(max-width: 760px)");
  const accItems = [];
  [[".svc__row", ".svc__title", "p"], [".tl__clip", "h3", "p"], [".why__list > div", "dt", "dd"]].forEach(([row, head, body]) => {
    $$(row).forEach((el) => {
      const h = $(":scope > " + head, el), b = $(":scope > " + body, el);
      if (h && b) accItems.push({ el, h, b });
    });
  });
  let accN = 0;
  const accSync = () => accItems.forEach((it) => {
    if (small.matches && !it.btn) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "acc__btn";
      btn.setAttribute("aria-expanded", "false");
      it.b.id = it.b.id || "acc-" + ++accN;
      it.b.classList.add("acc__body");
      btn.setAttribute("aria-controls", it.b.id);
      btn.append(...it.h.childNodes);
      it.h.append(btn);
      it.el.classList.add("is-acc");
      btn.addEventListener("click", () => {
        const open = btn.getAttribute("aria-expanded") !== "true";
        btn.setAttribute("aria-expanded", String(open));
        it.el.classList.toggle("is-open", open);
      });
      it.btn = btn;
    } else if (!small.matches && it.btn) {
      it.h.append(...it.btn.childNodes);
      it.btn.remove();
      it.btn = null;
      it.el.classList.remove("is-acc", "is-open");
    }
  });
  accSync();
  small.addEventListener("change", accSync);

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
