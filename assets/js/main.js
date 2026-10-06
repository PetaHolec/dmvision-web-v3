/* D&M Vision v2 – interakce a animace „hledáčku“ (bez závislostí) */
(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const loadedAt = Date.now();
  const root = document.documentElement;
  const mobile = window.matchMedia("(max-width: 760px)");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const hasIO = "IntersectionObserver" in window;
  root.classList.add("js");

  /* ---------- společná smyčka pro rolování (jeden výpočet na snímek) ---------- */
  const scrollFns = [];
  let ticking = false;
  const runScroll = () => {
    ticking = false;
    scrollFns.forEach((fn) => fn());
  };
  const onScroll = (fn) => {
    scrollFns.push(fn);
    fn();
  };
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(runScroll);
    }
  }, { passive: true });
  window.addEventListener("resize", () => requestAnimationFrame(runScroll));

  /* ---------- hlavička: pozadí po odrolování, ukazatel průběhu; schovává se jen na mobilu ---------- */
  const hdr = $("[data-hdr]");
  if (hdr) {
    let lastY = window.scrollY;
    onScroll(() => {
      const y = window.scrollY;
      const max = root.scrollHeight - window.innerHeight;
      hdr.classList.toggle("is-scrolled", y > 20);
      hdr.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : "0");
      if (!mobile.matches) hdr.classList.remove("is-hidden");
      else if (y > 400 && y > lastY + 6 && !document.body.classList.contains("menu-open")) hdr.classList.add("is-hidden");
      else if (y < lastY - 6 || y <= 400) hdr.classList.remove("is-hidden");
      lastY = y;
    });
  }

  /* ---------- čárka pod menu: jezdí pod položku podle sekce (hlavní stránka) nebo stránky (počítač) ---------- */
  const nav = $(".hdr__nav");
  const bar = $(".hdr__progress");
  if (hdr && nav && bar) {
    const wide = window.matchMedia("(min-width: 1081px)");
    const links = $$("a", nav);
    const current = $("a[aria-current]", nav);
    const spy = $$("[data-nav]")
      .map((sec) => [sec, links.find((a) => a.getAttribute("href") === sec.dataset.nav)])
      .filter(([, a]) => a);
    let hover = null;
    const target = () => {
      if (hover) return hover;
      if (!spy.length) return current;
      const line = window.innerHeight * 0.35;
      const atEnd = window.scrollY >= root.scrollHeight - window.innerHeight - 2;
      let hit = null;
      spy.forEach(([sec, a]) => {
        const r = sec.getBoundingClientRect();
        if ((r.top <= line && r.bottom > line) || (atEnd && r.top < window.innerHeight)) hit = a;
      });
      return hit;
    };
    const place = () => {
      hdr.classList.toggle("is-spy", wide.matches);
      if (!wide.matches) return;
      const a = target();
      hdr.classList.toggle("is-spy-on", !!a);
      if (!a) return;
      const r = a.getBoundingClientRect();
      hdr.style.setProperty("--nx", `${(r.left - hdr.getBoundingClientRect().left).toFixed(1)}px`);
      hdr.style.setProperty("--nw", `${r.width.toFixed(1)}px`);
    };
    onScroll(place);
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    links.forEach((a) => {
      a.addEventListener("pointerenter", () => { hover = a; place(); });
      a.addEventListener("focus", () => { hover = a; place(); });
      a.addEventListener("blur", () => { hover = null; place(); });
    });
    nav.addEventListener("pointerleave", () => { hover = null; place(); });
    // první umístění bez animace, pak už čárka jezdí
    requestAnimationFrame(() => requestAnimationFrame(() => hdr.classList.add("is-spy-run")));
  }

  /* ---------- menu (vysouvací panel) ---------- */
  const menu = $("#menu");
  const toggle = $(".hdr__menu");
  if (menu && toggle) {
    const setOpen = (open) => {
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
      (open ? $(".menu__close", menu) : toggle).focus();
    };
    toggle.addEventListener("click", () => setOpen(true));
    $$("[data-menu-close]", menu).forEach((el) => el.addEventListener("click", () => setOpen(false)));
    menu.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "Tab") return;
      const items = $$("a, button", $(".menu__panel", menu));
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        menu.hidden = true;
        document.body.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- mobil: obsah na rozbalení ---------- */
  // <details data-desktop-open>: na počítači otevřené (jako běžný obsah), na mobilu sbalené pod tlačítkem
  $$("details[data-desktop-open]").forEach((d) => {
    const sum = d.querySelector(":scope > summary");
    const sync = () => {
      d.open = !mobile.matches;
    };
    sync();
    mobile.addEventListener("change", sync);
    // na počítači se nesbaluje (bez tabindex na <summary> – Chrome ho hlásí jako chybu přístupnosti)
    if (sum) sum.addEventListener("click", (e) => {
      if (!mobile.matches) e.preventDefault();
    });
    d.addEventListener("toggle", () => {
      if (!mobile.matches && !d.open) d.open = true;
    });
  });
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("anim-ready")));

  // dlouhé popisy (data-clamp): na mobilu jen pár řádků + „Číst celý popis“
  $$("[data-clamp]").forEach((el) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "read-more";
    btn.textContent = "Číst celý popis";
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", () => {
      const open = el.classList.toggle("is-open");
      btn.textContent = open ? "Skrýt popis" : "Číst celý popis";
      btn.setAttribute("aria-expanded", String(open));
    });
    el.after(btn);
  });

  /* ---------- rozdělení textu na slova ---------- */
  const splitWords = (el, mode) => {
    let n = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/([ \n\t]+)/).forEach((part) => {
            if (!part) return;
            if (/^[ \n\t]+$/.test(part)) {
              frag.append(" ");
              return;
            }
            const s = document.createElement("span");
            if (mode === "w") {
              s.className = "w";
              const i = document.createElement("span");
              i.className = "w__i";
              i.style.setProperty("--d", n);
              i.textContent = part;
              s.append(i);
            } else {
              s.className = "sw";
              s.textContent = part;
            }
            n += 1;
            frag.append(s);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1) {
          walk(ch);
        }
      });
    };
    walk(el);
    return n;
  };

  /* ---------- nadpisy: slova vyjíždějí zespodu; fotky se odkrývají; bloky najíždějí ---------- */
  $$("[data-split]").forEach((el) => {
    if (!reduce.matches && hasIO) splitWords(el, "w");
    el.classList.add("is-split");
  });
  const reveal = (el) => el.classList.add("is-in");
  const io = hasIO && !reduce.matches
    ? new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      reveal(en.target);
      io.unobserve(en.target);
    }), { rootMargin: "0px 0px -8% 0px" })
    : null;
  $$("[data-split], .clip, .zz__row").forEach((el) => (io ? io.observe(el) : reveal(el)));
  if (io) {
    const selector = [
      ".shead__lead", ".shead__link", ".card", ".tile", ".work", ".story", ".person", ".qa", ".pair", ".lists > *",
      ".stats li", ".clist li", ".team__p", ".logos li", ".gitem", ".case__head", ".case__body", ".split__text", ".advice",
      ".band__cta", ".cta__main .actions", ".lrows li", ".reels__feed", ".quote", ".package__month", ".statement .label",
    ].join(",");
    $$(selector).forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // už na obrazovce – bez animace
      const i = Array.prototype.indexOf.call(el.parentElement.children, el) % 6;
      el.style.transitionDelay = `${i * 70}ms`;
      el.classList.add("rv");
      io.observe(el);
    });
  }

  /* ---------- počítadla ---------- */
  if (hasIO && !reduce.matches) {
    const countUp = (el) => {
      const to = parseFloat(el.dataset.count);
      const from = parseFloat(el.dataset.from || "0");
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / 1600);
        el.textContent = String(Math.round(from + (to - from) * (1 - (1 - p) ** 4)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const cio = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      countUp(en.target);
      cio.unobserve(en.target);
    }), { threshold: 0.6 });
    $$("[data-count]").forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight) el.textContent = el.dataset.from || "0";
      cio.observe(el);
    });
  }

  /* ---------- věta, která se při rolování postupně rozsvěcuje ---------- */
  if (!reduce.matches) {
    $$("[data-scrub]").forEach((el) => {
      splitWords(el, "sw");
      const words = $$(".sw", el);
      onScroll(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = Math.min(1, Math.max(0, (vh * 0.82 - r.top) / (r.height + vh * 0.3)));
        const lit = Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle("is-on", i < lit));
      });
    });
  }

  /* ---------- úvod: prolínání fotek a běžící časový kód ---------- */
  const slides = $$(".hero__slide");
  if (slides.length > 1 && !reduce.matches) {
    let cur = 0;
    setInterval(() => {
      if (document.hidden) return;
      slides[cur].classList.remove("is-on");
      cur = (cur + 1) % slides.length;
      slides[cur].classList.add("is-on");
    }, 5200);
  }
  const tcs = $$("[data-timecode]");
  if (tcs.length && !reduce.matches) {
    const visible = new Set(hasIO ? [] : tcs);
    if (hasIO) {
      const tio = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))));
      tcs.forEach((el) => tio.observe(el));
    }
    const pad = (x) => String(x).padStart(2, "0");
    const t0 = performance.now();
    let last = -1;
    const tick = (t) => {
      const f = Math.floor((t - t0) / 40); // 25 snímků za sekundu
      if (f !== last && visible.size) {
        last = f;
        const txt = `${pad(Math.floor(f / 90000))}:${pad(Math.floor(f / 1500) % 60)}:${pad(Math.floor(f / 25) % 60)}:${pad(f % 25)}`;
        visible.forEach((el) => {
          el.textContent = txt;
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- služby na úvodu: fotka se mění podle služby pod myší ---------- */
  $$(".svc").forEach((box) => {
    const items = $$(".svc__item[data-i]", box);
    const panels = $$(".svc__panel", box);
    if (!items.length || !panels.length) return;
    let cur = 0;
    items[0].classList.add("is-on");
    const set = (i) => {
      if (i === cur) return;
      panels.forEach((p) => p.classList.remove("was-on"));
      panels[cur].classList.remove("is-on");
      panels[cur].classList.add("was-on");
      panels[i].classList.add("is-on");
      items.forEach((it, k) => it.classList.toggle("is-on", k === i));
      cur = i;
    };
    items.forEach((it) => {
      const i = Number(it.dataset.i);
      it.addEventListener("mouseenter", () => set(i));
      it.addEventListener("focus", () => set(i));
    });
  });

  /* ---------- kroky: modré zvýraznění a rámeček jedou na krok pod myší i při rolování ---------- */
  $$(".steps").forEach((list) => {
    const steps = $$(".step", list);
    if (steps.length < 2) return;
    const glow = document.createElement("span");
    glow.className = "steps__glow";
    glow.setAttribute("aria-hidden", "true");
    list.append(glow);
    let active = 0;
    const set = (i) => {
      active = i;
      steps.forEach((s, k) => {
        s.classList.toggle("is-active", k === i);
        s.classList.toggle("is-done", k < i);
      });
      const box = list.getBoundingClientRect();
      if (!box.width) return; // seznam je schovaný ve sbaleném bloku
      const first = $(".step__n", steps[0]).getBoundingClientRect();
      const num = $(".step__n", steps[i]).getBoundingClientRect();
      const r = steps[i].getBoundingClientRect();
      list.style.setProperty("--fill-y", `${num.top - first.top}px`);
      list.style.setProperty("--glow-x", `${r.left - box.left}px`);
      list.style.setProperty("--glow-y", `${r.top - box.top}px`);
      list.style.setProperty("--glow-w", `${r.width}px`);
      list.style.setProperty("--glow-h", `${r.height}px`);
    };
    steps.forEach((s, i) => {
      s.addEventListener("mouseenter", () => set(i));
      s.addEventListener("click", () => set(i));
    });
    list.closest("details")?.addEventListener("toggle", () => set(active));
    window.addEventListener("resize", () => set(active));
    if (list.classList.contains("steps--scroll") && hasIO) {
      const sio = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) set(steps.indexOf(e.target));
      }), { rootMargin: "-45% 0px -45% 0px" });
      steps.forEach((s) => sio.observe(s));
    }
    set(0);
  });

  /* ---------- realizace na úvodu: karty se skládají na sebe ---------- */
  const stack = $$(".stack__card");
  if (stack.length > 1 && !reduce.matches) {
    onScroll(() => {
      if (mobile.matches) return;
      stack.forEach((c, i) => {
        const next = stack[i + 1];
        if (!next) return;
        const top = c.getBoundingClientRect().top;
        const k = Math.min(1, Math.max(0, (top + c.offsetHeight - next.getBoundingClientRect().top) / c.offsetHeight));
        c.style.setProperty("--s", (1 - k * 0.07).toFixed(4));
        c.style.setProperty("--o", (k * 0.45).toFixed(3));
      });
    });
  }

  /* ---------- stránka Reference: karty se skládají na sebe (i na mobilu) ---------- */
  $$(".zz--stack").forEach((group) => {
    const cards = $$(".zz__row", group);
    if (cards.length < 2 || reduce.matches) return;
    onScroll(() => {
      cards.forEach((c, i) => {
        const next = cards[i + 1];
        if (!next) return;
        const top = c.getBoundingClientRect().top;
        const k = Math.min(1, Math.max(0, (top + c.offsetHeight - next.getBoundingClientRect().top) / c.offsetHeight));
        c.style.setProperty("--s", (1 - k * 0.07).toFixed(4));
        c.style.setProperty("--o", (k * 0.45).toFixed(3));
      });
    });
  });

  /* ---------- tlačítka se lehce přitahují k myši ---------- */
  if (fine.matches && !reduce.matches) {
    $$(".btn").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        b.style.transform = `translate(${(x * 10).toFixed(1)}px, ${(y * 8).toFixed(1)}px)`;
      });
      b.addEventListener("pointerleave", () => {
        b.style.transform = "";
      });
    });
  }

  /* ---------- spodní lišta na mobilu: schovat při psaní do formuláře ---------- */
  document.addEventListener("focusin", (e) => {
    if (e.target.matches("input, textarea, select")) document.body.classList.add("is-typing");
  });
  document.addEventListener("focusout", (e) => {
    if (e.target.matches("input, textarea, select")) document.body.classList.remove("is-typing");
  });

  /* ---------- běžící pásy (loga klientů, reels): samy plynule jedou, tažením / švihnutím se dají popostrčit a zrychlit ---------- */
  const liveStrip = (box, track, axisFn, speedPx) => {
    box.classList.add("is-live");
    const speed = reduce.matches ? 0 : speedPx; // běžná rychlost v px za sekundu
    let pos = 0;
    let boost = 0; // rychlost navíc z vlastního posunu, postupně doznívá
    let drag = false;
    let last = 0;
    let lastT = 0;
    let prev = performance.now();
    const tick = (t) => {
      const dt = Math.min(0.05, (t - prev) / 1000);
      prev = t;
      const axis = axisFn();
      if (!drag) {
        pos -= (speed + boost) * dt;
        boost *= Math.pow(0.08, dt);
      }
      const half = (axis === "x" ? track.scrollWidth : track.scrollHeight) / 2;
      if (half > 0) {
        pos %= half;
        if (pos > 0) pos -= half;
      }
      track.style.transform = axis === "x" ? `translate3d(${pos.toFixed(2)}px, 0, 0)` : `translate3d(0, ${pos.toFixed(2)}px, 0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const coord = (e) => (axisFn() === "x" ? e.clientX : e.clientY);
    box.addEventListener("pointerdown", (e) => {
      drag = true;
      boost = 0;
      last = coord(e);
      lastT = performance.now();
      box.classList.add("is-drag");
      box.setPointerCapture(e.pointerId);
    });
    box.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const d = coord(e) - last;
      const now = performance.now();
      pos += d;
      if (now > lastT) boost = Math.max(-2500, Math.min(2500, (-d / (now - lastT)) * 1000 - speed));
      last = coord(e);
      lastT = now;
    });
    const end = () => {
      drag = false;
      box.classList.remove("is-drag");
      if (performance.now() - lastT > 120) boost = 0; // pustil bez švihnutí
    };
    box.addEventListener("pointerup", end);
    box.addEventListener("pointercancel", end);
    box.addEventListener("wheel", (e) => {
      if (axisFn() !== "x" || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      pos -= e.deltaX;
    }, { passive: false });
  };
  $$(".logos-band__marquee").forEach((box) => {
    const track = $(".logos-band__track", box);
    if (track) liveStrip(box, track, () => "x", 45);
  });
  $$(".feed").forEach((box) => {
    const track = $(".feed__track", box);
    if (track) liveStrip(box, track, () => (mobile.matches ? "x" : "y"), 40);
  });

  /* ---------- reference: jedna po druhé jako střihy z rozhovorů; samy se po chvíli přepnou (dílky, švihnutí) ---------- */
  $$("[data-slider]").forEach((box) => {
    const slides = $$(".ref", box);
    if (!slides.length) return;
    if (!reduce.matches) slides.forEach((s) => $$(".ref__q p", s).forEach((q) => splitWords(q, "w")));
    const start = () => box.classList.add("is-live");
    if (slides.length < 2) return start();
    const DURATION = 4000;
    const nav = document.createElement("div");
    nav.className = "refs__nav";
    nav.innerHTML =
      `<div class="refs__bars">${slides.map((_, i) => `<button type="button" aria-label="Reference ${i + 1}"><i></i></button>`).join("")}</div>`;
    box.append(nav);
    const bars = $$(".refs__bars button", nav);
    let cur = 0;
    let t0 = performance.now();
    let seen = !hasIO;
    let held = false; // klávesnicí uvnitř: nepřepínat
    let outTimer = 0;
    const mark = () => {
      bars.forEach((b, i) => {
        b.classList.toggle("is-on", i === cur);
        b.classList.toggle("is-done", i < cur);
        b.toggleAttribute("aria-current", i === cur);
        b.style.setProperty("--p", "0");
      });
      t0 = performance.now();
    };
    const go = (n) => {
      const next = (n + slides.length) % slides.length;
      if (next === cur) return;
      clearTimeout(outTimer);
      slides.forEach((s) => s.classList.remove("is-out"));
      const from = slides[cur];
      from.classList.remove("is-on");
      from.classList.add("is-out"); // stará fotka zůstane pod novou, dokud se nezatáhne
      slides[next].classList.add("is-on");
      outTimer = setTimeout(() => from.classList.remove("is-out"), 1000);
      from.inert = true;
      slides[next].inert = false;
      cur = next;
      mark();
    };
    slides.forEach((s, i) => {
      s.classList.toggle("is-on", i === 0);
      s.inert = i !== 0;
    });
    mark();
    bars.forEach((b, i) => b.addEventListener("click", () => go(i)));
    box.addEventListener("focusin", (e) => { held = e.target.matches(":focus-visible"); });
    box.addEventListener("focusout", () => { held = false; });
    if (hasIO) {
      new IntersectionObserver((es) => {
        seen = es[0].isIntersecting;
        if (seen && !box.classList.contains("is-live")) {
          start();
          t0 = performance.now();
        }
      }, { threshold: 0.35 }).observe(box);
    } else start();
    // švihnutí prstem nebo tažení myší
    let sx = null;
    box.addEventListener("pointerdown", (e) => { sx = e.clientX; });
    box.addEventListener("pointerup", (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx;
      sx = null;
      if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
    });
    box.addEventListener("pointercancel", () => { sx = null; });
    if (reduce.matches) return; // bez animací: jen ručně
    let last = performance.now();
    const tick = (t) => {
      const dt = t - last;
      last = t;
      if (held || !seen || document.hidden) t0 += dt;
      const p = Math.min(1, (t - t0) / DURATION);
      bars[cur].style.setProperty("--p", p.toFixed(4));
      if (p >= 1) go(cur + 1);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  /* ---------- filtry s jezdcem (realizace, galerie) ---------- */
  $$("[data-filter-group]").forEach((group) => {
    const target = document.getElementById(group.dataset.filterGroup);
    if (!target) return;
    const items = $$("[data-tags]", target);
    const status = $("[data-filter-status]", group.parentElement);
    const ind = document.createElement("span");
    ind.className = "seg__ind";
    ind.setAttribute("aria-hidden", "true");
    group.prepend(ind);
    const current = () => $('[aria-pressed="true"]', group);
    const move = (b) => {
      if (!b) return;
      group.style.setProperty("--x", `${b.offsetLeft}px`);
      group.style.setProperty("--w", `${b.offsetWidth}px`);
    };
    move(current());
    if (document.fonts) document.fonts.ready.then(() => move(current()));
    window.addEventListener("resize", () => move(current()));
    group.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      $$("[data-filter]", group).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      move(btn);
      const f = btn.dataset.filter;
      let shown = 0;
      items.forEach((it) => {
        const match = f === "vse" || it.dataset.tags.split(" ").includes(f);
        it.hidden = !match;
        if (match) {
          shown += 1;
          it.classList.add("is-in");
        }
      });
      if (status) status.textContent = f === "vse" ? "" : `Zobrazeno ${shown} z ${items.length}`;
    });
  });

  /* ---------- zvětšení fotek v galerii ---------- */
  const dlg = $("#lightbox");
  if (dlg && typeof dlg.showModal === "function") {
    const img = $("img", dlg);
    const cap = $("figcaption", dlg);
    let list = [];
    let idx = 0;
    const show = (i) => {
      idx = (i + list.length) % list.length;
      const el = list[idx];
      img.src = el.dataset.full;
      img.alt = el.dataset.alt || "";
      cap.textContent = el.dataset.caption || "";
    };
    $$("[data-full]").forEach((el) =>
      el.addEventListener("click", () => {
        list = $$("[data-full]").filter((x) => !x.hidden);
        show(list.indexOf(el));
        dlg.showModal();
      })
    );
    $("[data-lb-prev]", dlg)?.addEventListener("click", () => show(idx - 1));
    $("[data-lb-next]", dlg)?.addEventListener("click", () => show(idx + 1));
    $("[data-lb-close]", dlg)?.addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg || e.target.tagName === "FIGURE") dlg.close();
    });
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
    dlg.addEventListener("close", () => img.removeAttribute("src"));
  }

  /* ---------- formuláře poptávky ---------- */
  const MAX_FILES_BYTES = 10 * 1024 * 1024;
  const messages = {
    valueMissing: "Toto pole prosím vyplňte.",
    typeMismatch: "Zadejte e-mail ve tvaru jmeno@firma.cz.",
    tooShort: "Napište prosím pár slov víc.",
    patternMismatch: "Zkontrolujte prosím formát.",
  };

  const setError = (field, text) => {
    const wrap = field.closest(".field");
    if (!wrap) return;
    let err = $(".field__error", wrap);
    if (text) {
      if (!err) {
        err = document.createElement("p");
        err.className = "field__error";
        err.id = `${field.id || field.name}-chyba`;
        wrap.append(err);
      }
      err.textContent = text;
      wrap.classList.add("is-invalid");
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", err.id);
    } else {
      err?.remove();
      wrap.classList.remove("is-invalid");
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
    }
  };

  const validate = (form, only) => {
    let first = null;
    $$("input, select, textarea", form).forEach((field) => {
      if (field.type === "hidden" || field.closest(".hp") || (only && !only(field))) return;
      const v = field.validity;
      let msg = "";
      if (!v.valid) {
        msg = Object.keys(messages).find((k) => v[k]);
        msg = msg ? messages[msg] : field.validationMessage;
      }
      if (field.type === "file") {
        const total = Array.from(field.files || []).reduce((s, f) => s + f.size, 0);
        if (total > MAX_FILES_BYTES) msg = "Přílohy mají dohromady víc než 10 MB. Pošlete prosím odkaz (např. WeTransfer).";
        if ((field.files || []).length > 3) msg = "Nahrajte nejvýš 3 soubory.";
      }
      setError(field, msg);
      if (msg && !first) first = field;
    });
    return first;
  };

  // /poptavka/?sluzba=reels-day → rovnou zaškrtne vybranou službu
  const preselect = new URLSearchParams(window.location.search).get("sluzba");
  if (preselect) {
    $$('input[name="sluzby[]"][data-key]').forEach((input) => {
      if (input.dataset.key === preselect) input.checked = true;
    });
  }

  $$("form[data-ajax]").forEach((form) => {
    const status = $(".form-status", form);
    const submit = $('button[type="submit"]', form);

    form.setAttribute("novalidate", "");
    form.addEventListener("input", (e) => {
      if (e.target.closest(".field.is-invalid")) setError(e.target, "");
    });

    const fileInput = $('input[type="file"]', form);
    if (fileInput) {
      const label = $("[data-file-label]", form);
      const original = label ? label.textContent : "";
      fileInput.addEventListener("change", () => {
        const names = Array.from(fileInput.files).map((f) => f.name);
        if (label) label.textContent = names.length ? names.join(", ") : original;
        validate(form);
      });
    }

    // „Zavolejte mi“ → telefon je povinný
    const phone = $('input[name="telefon"]', form);
    const how = $$('input[name="kontakt"]', form);
    if (phone && how.length) {
      const optional = $("label span", phone.closest(".field"));
      const sync = () => {
        const need = how.some((r) => r.checked && r.value === "Telefonem");
        phone.required = need;
        if (optional) optional.hidden = need;
        if (!need) setError(phone, "");
      };
      how.forEach((r) => r.addEventListener("change", sync));
      sync();
    }

    /* na mobilu jako dotazník: jedna otázka na obrazovku (na počítači zůstává celý formulář) */
    let showStepOf = null;
    if (form.hasAttribute("data-wizard")) {
      const parts = $$("[data-step]", form);
      const total = Math.max(...parts.map((el) => +el.dataset.step));
      const ico = (d) =>
        `<svg class="ico" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
        `stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">${d}</svg>`;
      const head = document.createElement("div");
      head.className = "wz__top";
      head.innerHTML = `<p class="wz__count" aria-live="polite"></p><span class="wz__bar">${"<i></i>".repeat(total)}</span>`;
      $(".form__title", form).after(head);
      const bar = document.createElement("div");
      bar.className = "wz__nav";
      bar.innerHTML =
        `<button class="wz__back" type="button">${ico('<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>')}Zpět</button>` +
        `<button class="btn btn--submit wz__next" type="button"><span class="btn__roll"><span data-t="Dál">Dál</span></span>` +
        `${ico('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>')}</button>`;
      form.append(bar);
      const back = $(".wz__back", bar);
      const next = $(".wz__next", bar);
      const nextText = $(".btn__roll > span", next);
      const count = $(".wz__count", head);
      const ticks = $$(".wz__bar i", head);
      const fieldsOf = (n) =>
        parts.filter((el) => +el.dataset.step === n).flatMap((el) => (el.matches("input, select, textarea") ? [el] : $$("input, select, textarea", el)));
      let step = 1;
      let on = false;
      // u kroku jen s nepovinnými textovými poli (kdy a kde) je místo „Dál“ „Přeskočit“, dokud nic nevyplní
      const relabel = () => {
        const texts = fieldsOf(step).filter((f) => f.type !== "checkbox" && f.type !== "radio");
        const skip = texts.length > 0 && texts.every((f) => !f.required && !f.value.trim());
        nextText.textContent = nextText.dataset.t = skip ? "Přeskočit" : "Dál";
      };
      const show = (n, move = false) => {
        step = n;
        parts.forEach((el) => el.classList.toggle("is-step", +el.dataset.step === n));
        count.textContent = `Krok ${n} z ${total}`;
        ticks.forEach((t, i) => t.classList.toggle("is-on", i < n));
        back.hidden = n === 1;
        next.hidden = n === total;
        relabel();
        if (!move) return;
        const top = form.getBoundingClientRect().top;
        if (top < 0 || top > window.innerHeight * 0.4) form.scrollIntoView({ block: "start", behavior: reduce.matches ? "auto" : "smooth" });
        const q = parts.find((el) => +el.dataset.step === n && el.matches("fieldset"));
        if (q) {
          q.tabIndex = -1;
          q.focus({ preventScroll: true });
        }
      };
      next.addEventListener("click", () => {
        const bad = validate(form, (f) => fieldsOf(step).includes(f));
        if (bad) bad.focus();
        else show(step + 1, true);
      });
      back.addEventListener("click", () => show(step - 1, true));
      form.addEventListener("input", relabel);
      // otázka s jednou volbou (jak vás kontaktovat) po ťuknutí sama posune dál
      form.addEventListener("change", (e) => {
        if (!on || e.target.type !== "radio") return;
        const at = step;
        setTimeout(() => step === at && at < total && show(at + 1, true), 280);
      });
      // Enter v políčku = Dál (ne odeslání celého formuláře)
      form.addEventListener("keydown", (e) => {
        if (!on || e.key !== "Enter" || step === total || e.target.matches("textarea, button")) return;
        e.preventDefault();
        next.click();
      });
      const mode = () => {
        on = mobile.matches;
        form.classList.toggle("is-wizard", on);
        if (on) show(step);
      };
      mode();
      mobile.addEventListener("change", mode);
      showStepOf = (field) => {
        const host = on && field.closest("[data-step]");
        if (host) show(+host.dataset.step);
      };
    }

    form.addEventListener("submit", async (e) => {
      const invalid = validate(form);
      if (invalid) {
        e.preventDefault();
        showStepOf?.(invalid);
        invalid.focus();
        if (status) {
          status.className = "form-status is-error";
          status.textContent = "Zkontrolujte prosím zvýrazněná pole.";
        }
        return;
      }
      const elapsed = $('input[name="elapsed"]', form);
      if (elapsed) elapsed.value = String(Math.round((Date.now() - loadedAt) / 1000));
      if (!window.fetch || !window.FormData) return; // odeslání klasicky, bez JS

      e.preventDefault();
      submit.disabled = true;
      const label = submit.innerHTML;
      const roll = $(".btn__roll > span", submit);
      if (roll) {
        roll.textContent = "Odesílám…";
        roll.dataset.t = "Odesílám…";
      }
      if (status) {
        status.className = "form-status";
        status.textContent = "";
      }
      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          window.location.href = form.dataset.success || "/dekujeme/";
          return;
        }
        throw new Error(data.error || "Odeslání se nepovedlo.");
      } catch (err) {
        if (status) {
          status.className = "form-status is-error";
          status.innerHTML = "";
          status.append(
            document.createTextNode(`${err.message} Zkuste to prosím znovu, nebo nám napište na `),
            Object.assign(document.createElement("a"), { href: "mailto:info@dmvision.cz", textContent: "info@dmvision.cz" }),
            document.createTextNode(".")
          );
        }
        submit.disabled = false;
        submit.innerHTML = label;
      }
    });
  });
})();
