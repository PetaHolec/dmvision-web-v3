/* ==========================================================================
   Grafika z praxe – živé ukázky převedené z After Effects do webu.
   • Kuřimská občanská liga (16:9): intro s mapou (render), logo, jmenovka
     – předlohy KOL_Logo_Animation.jsx a KOL_LowerThird_PRO.jsx
   • Říčany u Brna (Reels 9:16): jmenovka, pozvánka, mapa
     – předloha Ricany_Toolkit.jsx
   Texty v šablonách jsou ukázkové (stejné jako v předlohách).
   ========================================================================== */
(() => {
  "use strict";
  const root = document.querySelector("[data-sc]");
  if (!root) return;

  const SPRITE = "assets/img/ricany/ricany-sprite.svg";
  const COL = { dark: "#25353C", blue: "#6DC8E7", light: "#D7EEF9", white: "#FFFFFF" };
  const FONT = 'Arimo, Arial, "Helvetica Neue", Helvetica, sans-serif';
  // lokální ohraničení tvarů z loga (x, y, šířka, výška) – střed tvaru je v bodě 0,0
  const LB = {
    CHEV_TOP: [-126, -64, 252, 128], CHEV_BOT: [-126, -65, 252, 130],
    CHEV_L: [-65, -126, 130, 252], CHEV_R: [-65, -126, 130, 252],
  };
  const LOGO_PARTS = {
    CHEV_L: [-694, 0, -65, -126, 130, 252], CHEV_TOP: [-470, -225, -126, -64, 252, 128], CHEV_BOT: [-470, 224, -126, -65, 252, 130],
    R: [-461, 0, -114, -121, 228, 242], I: [-282.5, 28, -24.5, -93, 49, 186], ACUTE: [-268, -108.5, -44, -27.5, 88, 55],
    C: [-126.5, 28, -85.5, -96, 171, 192], CARON: [-126, -111, -63, -30, 126, 60], A: [84.5, 28, -93.5, -96, 187, 192],
    N: [294, 26.5, -85, -94.5, 170, 189], Y: [499, 64, -95, -129, 190, 258], CHEV_R: [694, 0, -65, -126, 130, 252],
  };
  const KOL_SPRITE = "assets/img/kol/kol-sprite.svg";
  const KOL = { purple: "#743D97", orange: "#F07D1E", white: "#FFFFFF" };
  const EASE = "cubic-bezier(.4, 0, .12, 1)";
  const NS = "http://www.w3.org/2000/svg";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const smooth = (a, b, t) => { const v = Math.min(1, Math.max(0, (t - a) / (b - a))); return v * v * (3 - 2 * v); };
  const CANVAS = { ric: root.querySelector('[data-canvas="ric"]'), kol: root.querySelector('[data-canvas="kol"]') };

  class Comp {
    constructor(dur, full, canvas) {
      this.dur = dur;
      this.el = document.createElement("div");
      this.el.className = "rk-comp" + (full ? " rk-comp--full" : "");
      canvas.append(this.el); // musí být v dokumentu kvůli měření šířky textů
      this.tracks = new Map();
      this.anims = [];
      this.frame = null;
    }
    key(el, prop, keys, easing) {
      const id = el.__rk || (el.__rk = Math.random().toString(36).slice(2));
      const k = id + "|" + prop;
      if (!this.tracks.has(k)) this.tracks.set(k, { el, prop, keys: [], easing });
      this.tracks.get(k).keys.push(...keys);
      return el;
    }
    build() {
      const D = this.dur;
      this.tracks.forEach(({ el, prop, keys, easing }) => {
        keys.sort((a, b) => a[0] - b[0]);
        const frames = keys.map(([t, v]) => ({ offset: Math.min(1, Math.max(0, t / D)), [prop]: v, easing: easing || EASE }));
        if (frames[0].offset > 0) frames.unshift({ ...frames[0], offset: 0 });
        if (frames[frames.length - 1].offset < 1) frames.push({ ...frames[frames.length - 1], offset: 1 });
        this.anims.push(el.animate(frames, { duration: D * 1000, iterations: Infinity, fill: "both" }));
      });
      this.clock = this.anims[0];
    }
    time() { return this.clock ? ((this.clock.currentTime || 0) / 1000) % this.dur : 0; }
    // pomocníci převzatí z toolkitu
    slideIn(el, t0, dx, dy) {
      this.key(el, "translate", [[t0, `${dx}px ${dy}px`], [t0 + 0.4, `${-dx * 0.04}px ${-dy * 0.04}px`], [t0 + 0.58, "0px 0px"]]);
      this.key(el, "opacity", [[t0, 0], [t0 + 0.15, 1]]);
    }
    popIn(el, t0, from) {
      this.key(el, "scale", [[t0, from / 100], [t0 + 0.28, 1.08], [t0 + 0.45, 1]]);
      this.key(el, "opacity", [[t0, 0], [t0 + 0.1, 1]]);
    }
    textIn(el, t0, dy, wipe) {
      this.key(el, "translate", [[t0, `0px ${dy}px`], [t0 + 0.7, "0px 0px"]]);
      this.key(el, "opacity", [[t0, 0], [t0 + 0.4, 1]]);
      this.key(el, "filter", [[t0, "blur(16px)"], [t0 + 0.6, "blur(0px)"]]);
      if (wipe) this.key(el, "clipPath", [[t0, "inset(-20% 100% -20% -5%)"], [t0 + 0.75, "inset(-20% -5% -20% -5%)"]]);
    }
    fadeOut(el, t0) { this.key(el, "opacity", [[t0, 1], [t0 + 0.35, 0]]); }
    sample(el, prop, t0, t1, fn, step = 0.05) {
      const keys = [];
      for (let t = t0; t <= t1 + 1e-6; t += step) keys.push([t, fn(t)]);
      this.key(el, prop, keys, "linear");
    }
    // prvky
    add(tag, cls, css, parent) {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (css) Object.assign(n.style, css);
      (parent || this.el).append(n);
      return n;
    }
    chev(which, x, y, pct, color, outline, parent) {
      const [lx, ly, w, h] = LB[which];
      const s = pct / 100;
      const n = this.add("div", "rk-chev", {
        left: x + lx * s + "px", top: y + ly * s + "px", width: w * s + "px", height: h * s + "px",
        transformOrigin: `${-lx * s}px ${-ly * s}px`, color,
      }, parent);
      n.innerHTML = `<svg width="100%" height="100%" overflow="visible"${outline ? ` style="fill:none;stroke:currentColor;stroke-width:${outline}px"` : ""}><use href="${SPRITE}#rk-${which}" width="100%" height="100%"/></svg>`;
      return n;
    }
    text(str, x, y, size, color, { bold = true, align = "center", tracking = 0, parent } = {}) {
      const n = this.add("div", "rk-text", {
        left: x + "px", top: y + "px", fontSize: size + "px", fontWeight: bold ? 700 : 400, color,
        letterSpacing: tracking / 1000 + "em", textAlign: align,
        transform: `translate(${align === "center" ? "-50%" : "0"}, -0.95em)`,
      }, parent);
      n.innerHTML = str.split("\n").map((l) => l.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))).join("<br>");
      return n;
    }
  }

  /* ---------- easing z KOL skriptů ---------- */
  const cl = (x) => Math.min(1, Math.max(0, x));
  const eo = (x) => { x = cl(x); return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); };
  const ei = (x) => { x = cl(x); return x * x * x; };
  const eb = (x) => { x = cl(x); const a = 1.70158, b = a + 1; return 1 + b * Math.pow(x - 1, 3) + a * Math.pow(x - 1, 2); };
  const svgEl = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.append(n); return n; };
  const kolLetters = (parent, x, y, w, h) => [0, 1, 2].map((i) => svgEl("use", { href: `${KOL_SPRITE}#kol-L${i}`, x, y, width: w, height: h, fill: "#fff" }, parent));

  const comps = {
    jmenovka() {
      const X = new Comp(5.2, false, CANVAS.ric), R = [90, 1440];
      const name = X.text("Jana Nováková", R[0] + 52, R[1] - 10, 56, COL.white, { align: "left", tracking: 10 });
      const role = X.text("starostka obce", R[0] + 52, R[1] + 46, 36, COL.blue, { bold: false, align: "left", tracking: 20 });
      const w = Math.max(name.offsetWidth, role.offsetWidth) + 92;
      const box = X.add("div", "rk-box", { left: R[0] + 6 + "px", top: R[1] - 84 + "px", width: w + "px", height: "168px", transformOrigin: "0 50%", opacity: 0.94 });
      X.el.prepend(box);
      const bar = X.add("div", "rk-box", { left: R[0] + "px", top: R[1] - 84 + "px", width: "8px", height: "168px", background: COL.blue });
      const ch = X.chev("CHEV_L", R[0] - 42, R[1], 30, COL.blue);
      X.key(box, "scale", [[0.15, "0.01 1"], [0.65, "1 1"], [4.25, "1 1"], [4.7, "0.01 1"]]);
      X.key(bar, "scale", [[0.1, "1 0.01"], [0.4, "1 1"], [4.5, "1 1"], [4.8, "1 0.01"]]);
      X.slideIn(ch, 0, -260, 0);
      X.key(ch, "translate", [[4.4, "0px 0px"], [4.8, "-258px 0px"]]);
      X.key(ch, "opacity", [[4.6, 1], [4.8, 0]]);
      X.textIn(name, 0.35, 0, true); X.textIn(role, 0.5, 0, true);
      X.fadeOut(name, 4.1); X.fadeOut(role, 4.15);
      return X;
    },

    pozvanka() {
      const X = new Comp(6, true, CANVAS.ric), R = [540, 960];
      const grid = [[-240, -650, COL.blue, 0], [0, -650, COL.white, 1], [240, -650, COL.light, 0],
                    [-240, -450, COL.white, 1], [0, -450, COL.blue, 0], [240, -450, COL.white, 1],
                    [-240, -250, COL.light, 0], [0, -250, COL.white, 1], [240, -250, COL.blue, 0]];
      grid.forEach(([x, y, c, o], i) => {
        const g = X.chev("CHEV_L", R[0] + x, R[1] + y, 62, c, o ? 9 : 0);
        const t0 = 0.1 + i * 0.06;
        X.slideIn(g, t0, -520, 0);
        X.key(g, "rotate", [[t0, "-60deg"], [t0 + 0.5, "0deg"]]);
      });
      const nm = X.text("RakFest", R[0], R[1] + 130, 150, COL.white, { tracking: 10 });
      const w = nm.offsetWidth;
      X.textIn(nm, 0.8, 40, true);
      const cl = X.chev("CHEV_L", R[0] - w / 2 - 50, R[1] + 78, 30, COL.blue);
      const cr = X.chev("CHEV_R", R[0] + w / 2 + 50, R[1] + 78, 30, COL.blue);
      X.slideIn(cl, 1.0, -150, 0); X.slideIn(cr, 1.0, 150, 0);
      X.textIn(X.text("2026", R[0], R[1] + 260, 110, COL.blue, { tracking: 20 }), 1.0, 30, false);
      X.textIn(X.text("Sobota 13. 6. od 14:00", R[0], R[1] + 420, 54, COL.white, { tracking: 10 }), 1.25, 25, true);
      const pl = X.text("Areál koupaliště", R[0] + 24, R[1] + 500, 50, COL.light, { bold: false, tracking: 10 });
      const pc = X.chev("CHEV_L", R[0] + 24 - pl.offsetWidth / 2 - 34, R[1] + 482, 16, COL.blue);
      X.textIn(pl, 1.4, 25, true); X.slideIn(pc, 1.45, -100, 0);
      X.textIn(X.text("www.ricanyubrna.cz", R[0], R[1] + 690, 38, COL.blue, { tracking: 40 }), 1.6, 20, false);
      return X;
    },

    mapa() {
      const X = new Comp(6, true, CANVAS.ric);
      const B0 = [790, 760], B3 = [300, 1110], t0 = 0.8, t1 = 2.6;
      const D = "M790 760 C640 690 380 860 300 1110";
      const grid = X.add("div", "rk-grid");
      X.key(grid, "opacity", [[0, 0], [1, 0.12]]);
      const ring = X.add("div", "rk-ring", { left: B0[0] - 35 + "px", top: B0[1] - 35 + "px", width: "70px", height: "70px", borderWidth: "8px", borderColor: COL.white });
      X.popIn(ring, 0.2, 1);
      X.textIn(X.text("Brno", B0[0], B0[1] - 70, 62, COL.white, { tracking: 10 }), 0.35, 20, false);
      const NS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "rk-bands"); svg.setAttribute("width", "1080"); svg.setAttribute("height", "1920");
      svg.innerHTML = `<defs><mask id="rk-route-m" maskUnits="userSpaceOnUse"><path d="${D}" pathLength="1" stroke="#fff" stroke-width="14" fill="none" stroke-dasharray="1 1" class="rk-route-mask"/></mask></defs>
        <path d="${D}" fill="none" stroke="${COL.light}" stroke-width="6" stroke-dasharray="16 14" mask="url(#rk-route-m)"/>`;
      X.el.append(svg);
      X.key(svg.querySelector(".rk-route-mask"), "strokeDashoffset", [[t0, 1], [t1, 0]], "ease-in-out");
      const tr = X.add("div", "rk-traveler", { offsetPath: `path("${D}")` });
      tr.innerHTML = `<svg width="100%" height="100%"><use href="${SPRITE}#rk-CHEV_L" width="100%" height="100%"/></svg>`;
      X.key(tr, "offsetDistance", [[t0, "0%"], [t1, "100%"]], "ease-in-out");
      X.key(tr, "opacity", [[t0 - 0.1, 0], [t0, 1], [t1, 1], [t1 + 0.15, 0]]);
      X.textIn(X.text("≈ 20 km", 640, 930, 46, COL.light, { tracking: 20 }), 1.6, 20, false);
      const dot = X.add("div", "rk-ring", { left: B3[0] - 22 + "px", top: B3[1] - 22 + "px", width: "44px", height: "44px", background: COL.blue, border: 0 });
      X.popIn(dot, t1, 1);
      for (let r = 0; r < 3; r++) {
        const p = X.add("div", "rk-ring", { left: B3[0] - 150 + "px", top: B3[1] - 150 + "px", width: "300px", height: "300px", borderWidth: "5px", borderColor: COL.blue });
        X.sample(p, "scale", 0, 6, (t) => { const u = t - t1 - r * 0.5; return u > 0 ? (40 + 260 * ((u % 1.5) / 1.5)) / 300 : 0.13; });
        X.sample(p, "opacity", 0, 6, (t) => { const u = t - t1 - r * 0.5; return u > 0 ? 0.8 * (1 - (u % 1.5) / 1.5) : 0; });
      }
      const logo = document.createElementNS(NS, "svg");
      logo.setAttribute("class", "rk-logo");
      logo.setAttribute("viewBox", "-760 -290 1520 580");
      Object.assign(logo.style, { left: B3[0] + 20 - 760 * 0.34 + "px", top: B3[1] + 230 - 290 * 0.34 + "px", width: 1520 * 0.34 + "px", height: 580 * 0.34 + "px", color: COL.blue });
      X.el.append(logo);
      Object.entries(LOGO_PARTS).forEach(([k, [px, py, lx, ly, w, h]], i) => {
        const u = document.createElementNS(NS, "use");
        u.setAttribute("href", `${SPRITE}#rk-${k}`);
        u.setAttribute("x", px + lx); u.setAttribute("y", py + ly);
        u.setAttribute("width", w); u.setAttribute("height", h);
        logo.append(u);
        X.popIn(u, t1 + 0.25 + i * 0.04, 30);
      });
      X.textIn(X.text("u Brna!", B3[0] + 20, B3[1] + 400, 60, COL.white, { tracking: 20 }), t1 + 0.9, 25, true);
      return X;
    },
    /* ---------- KOL: intro s mapou (renderované video) ---------- */
    kolIntro() {
      const X = new Comp(3.8, false, CANVAS.kol);
      X.video = true;
      X.key(X.el, "opacity", [[0, 1], [3.8, 1]], "linear"); // jen hodiny pro časový kód
      return X;
    },

    /* ---------- KOL: animace loga (KOL_Logo_Animation.jsx) ---------- */
    kolLogo() {
      const X = new Comp(5, true, CANVAS.kol);
      X.el.classList.add("kol-light");
      const svg = svgEl("svg", { viewBox: "-960 -540 1920 1080", width: 1920, height: 1080, class: "kol-svg" }, X.el);
      const rig = svgEl("g", {}, svg);
      const PC = [-284.88, 9], PW = 546, PH = 254, TL = 13.88, SLIDE = 669;
      const defs = svgEl("defs", {}, svg);
      const clipPill = svgEl("clipPath", { id: "kol-pill-clip" }, defs);
      const clipRect = svgEl("rect", {}, clipPill);
      const clipText = svgEl("clipPath", { id: "kol-text-clip" }, defs);
      svgEl("rect", { x: TL, y: -300, width: 2000, height: 600 }, clipText);
      const echo = svgEl("rect", { fill: "none", stroke: KOL.orange, "stroke-width": 6 }, rig);
      const pill = svgEl("rect", { fill: KOL.purple }, rig);
      const lg = svgEl("g", { "clip-path": "url(#kol-pill-clip)" }, rig);
      const letters = kolLetters(lg, PC[0] - PW / 2, PC[1] - PH / 2, PW, PH);
      const tg = svgEl("g", { "clip-path": "url(#kol-text-clip)" }, rig);
      const LB = [[51.99, -136.22, 479.37, 72.72], [50.19, -36.58, 508.03, 73.33], [52.35, 81.17, 205.18, 55.35]];
      const lines = LB.map(([x, y, w, h], j) => svgEl("use", { href: `${KOL_SPRITE}#kol-T${j}`, x, y, width: w, height: h, fill: KOL.purple }, tg));
      const P = (t, s, d, f = eo) => f((t - s) / d);
      X.key(X.el, "opacity", [[0, 1], [4.75, 1], [5, 0]], "linear");
      X.frame = (t) => {
        const k = 1.3 * (1 + 0.035 * cl((t - 1.2) / (5 - 1.2)));
        rig.setAttribute("transform", `scale(${k})`);
        const h = PH * P(t, 0, 0.45, eb), w = Math.max(h, PW * P(t, 0.18, 0.75));
        const set = (r, W, H) => { r.setAttribute("x", PC[0] - W / 2); r.setAttribute("y", PC[1] - H / 2); r.setAttribute("width", Math.max(0.01, W)); r.setAttribute("height", Math.max(0.01, H)); r.setAttribute("rx", Math.max(0, Math.min(W, H) / 2)); };
        set(pill, w, h); set(clipRect, w, h);
        const e = eo((t - 0.55) / 0.9);
        set(echo, PW + 90 * e, PH + 90 * e);
        echo.setAttribute("opacity", t < 0.55 || e >= 1 ? 0 : 0.9 * Math.pow(1 - e, 2));
        letters.forEach((u, i) => u.setAttribute("transform", `translate(0 ${PH * (1 - P(t, 0.5 + i * 0.07, 0.65, eb))})`));
        lines.forEach((u, j) => u.setAttribute("transform", `translate(${-SLIDE * (1 - P(t, 0.85 + j * 0.11, 0.95))} 0)`));
      };
      return X;
    },

    /* ---------- KOL: jmenovka (KOL_LowerThird_PRO.jsx) ---------- */
    kolJmenovka() {
      const X = new Comp(6, false, CANVAS.kol);
      const bg = X.add("div", "kol-bg");
      bg.innerHTML = '<img src="assets/video/kol-bg-mapa.jpg" alt="">';
      const C = { name: "Jan Novák", role: "kandidát do zastupitelstva", pos: [140, 860], pillW: 250, pillH: 116, nameH: 116, nameSize: 58, nameGap: 38, namePadR: 52, accent: 18, roleH: 70, roleSize: 34, rolePad: 30, roleX: 250 };
      const bx = C.pillW / 2, padL = C.pillW / 2 + C.nameGap;
      const svg = svgEl("svg", { viewBox: "0 0 1920 1080", width: 1920, height: 1080, class: "kol-svg kol-svg--shadow" }, X.el);
      const g = svgEl("g", { transform: `translate(${C.pos[0]} ${C.pos[1]})` }, svg);
      const defs = svgEl("defs", {}, svg);
      const nClip = svgEl("clipPath", { id: "kol-name-clip" }, defs);
      const nClipR = svgEl("rect", { y: -C.nameH / 2, height: C.nameH, rx: C.nameH / 2 }, nClip);
      const rClip = svgEl("clipPath", { id: "kol-role-clip" }, defs);
      const roleY = C.nameH / 2 + C.roleH / 2 + 4;
      const rClipR = svgEl("rect", { y: roleY - C.roleH / 2, height: C.roleH, rx: C.roleH / 2 }, rClip);
      const echo = svgEl("rect", { fill: "none", stroke: KOL.orange, "stroke-width": 5, x: -bx, y: -C.pillH / 2, width: C.pillW, height: C.pillH, rx: C.pillH / 2 }, svgEl("g", {}, g));
      const acc = svgEl("rect", { fill: KOL.orange, x: bx, y: -C.nameH / 2, height: C.nameH, rx: C.nameH / 2 }, g);
      const nb = svgEl("rect", { fill: "#fff", x: bx, y: -C.nameH / 2, height: C.nameH, rx: C.nameH / 2 }, g);
      const ng = svgEl("g", { "clip-path": "url(#kol-name-clip)" }, g);
      const nt = svgEl("text", { x: bx + padL, y: C.nameSize * 0.36, fill: KOL.purple, class: "kol-name", "font-size": C.nameSize }, ng);
      const rb = svgEl("rect", { fill: KOL.orange, x: C.roleX, y: roleY - C.roleH / 2, height: C.roleH, rx: C.roleH / 2 }, g);
      const rg = svgEl("g", { "clip-path": "url(#kol-role-clip)" }, g);
      const rt = svgEl("text", { x: C.roleX + C.rolePad, y: roleY + C.roleSize * 0.36, fill: "#fff", class: "kol-role", "font-size": C.roleSize }, rg);
      const chars = (txt, str) => [...str].map((ch) => { const s = svgEl("tspan", {}, txt); s.textContent = ch; return s; });
      const nC = chars(nt, C.name), rC = chars(rt, C.role);
      const kp = svgEl("g", {}, g);
      svgEl("rect", { fill: KOL.purple, x: -C.pillW / 2, y: -C.pillH / 2, width: C.pillW, height: C.pillH, rx: C.pillH / 2 }, kp);
      const kh = C.pillH, kw = 546 * (C.pillH / 254);
      kolLetters(kp, -kw / 2, -kh / 2, kw, kh);
      let nW, rW;
      const D = 6;
      const P = (t, s, d, os, od, f = eo) => f((t - s) / d) * (1 - ei(1 - (D - t - os) / od));
      // znakový „rise“: znaky zleva doprava vyjíždějí zespodu
      const rise = (list, k, dy, base) => { const edge = k * list.length; list.forEach((c, i) => { const v = cl(edge - i); c.setAttribute("y", base + dy * (1 - v)); c.setAttribute("fill-opacity", v); }); };
      X.key(X.el, "opacity", [[0, 1], [6, 1]], "linear");
      X.frame = (t) => {
        nW = nt.getComputedTextLength(); rW = rt.getComputedTextLength(); // měřit průběžně – font Archivo se může dočíst později
        const e = eo((t - 0.12) / 0.8);
        echo.parentNode.setAttribute("transform", `translate(${bx} 0) scale(${1 + 0.45 * e})`);
        echo.setAttribute("opacity", t < 0.12 || e >= 1 ? 0 : 0.85 * Math.pow(1 - e, 2));
        acc.setAttribute("width", Math.max(0.01, (nW + padL + C.namePadR + C.accent) * P(t, 0.22, 0.7, 0.25, 0.45)));
        const nbw = Math.max(0.01, (nW + padL + C.namePadR) * P(t, 0.3, 0.7, 0.3, 0.45));
        nb.setAttribute("width", nbw); nClipR.setAttribute("x", bx); nClipR.setAttribute("width", nbw);
        const rbw = Math.max(0.01, (rW + 2 * C.rolePad) * P(t, 0.6, 0.65, 0.55, 0.35));
        rb.setAttribute("width", rbw); rClipR.setAttribute("x", C.roleX); rClipR.setAttribute("width", rbw);
        rise(nC, P(t, 0.4, 0.8, 0.6, 0.3), 70, C.nameSize * 0.36);
        rise(rC, P(t, 0.7, 0.7, 0.75, 0.25), 24, roleY + C.roleSize * 0.36);
        const ps = P(t, 0, 0.6, 0, 0.35, eb);
        kp.setAttribute("transform", `translate(${bx} 0) rotate(${-12 * (1 - P(t, 0, 0.7, 0, 0.35))}) scale(${Math.max(0.001, ps)})`);
      };
      return X;
    },
  };

  const CLIPS = {
    kol: [
      { id: "kolIntro", n: "Intro s mapou", d: "úvod volebních videí", file: "KOL_Intro_s_mapou", poster: 2.1 },
      { id: "kolLogo", n: "Animace loga", d: "logo strany v pohybu", file: "KOL_Logo_Animation", poster: 3 },
      { id: "kolJmenovka", n: "Jmenovka", d: "jméno a funkce kandidáta", file: "KOL_LowerThird_PRO", poster: 2.5 },
    ],
    ric: [
      { id: "jmenovka", n: "Jmenovka", d: "jméno a funkce mluvčího", poster: 2 },
      { id: "pozvanka", n: "Pozvánka", d: "na akci v obci", poster: 2.5 },
      { id: "mapa", n: "Mapa", d: "kde Říčany leží", poster: 4 },
    ],
  };

  /* ---------- přehrávač ---------- */
  const caseTabs = [...root.querySelectorAll("[data-case]")];
  const clipsBox = root.querySelector("[data-clips]");
  const pauseBtn = root.querySelector("[data-sc-pause]");
  const pauseLabel = root.querySelector("[data-sc-pause-label]");
  const soundBtn = root.querySelector("[data-sc-sound]");
  const video = root.querySelector("[data-kol-video]");
  const fileLbl = root.querySelector("[data-sc-file]");
  const tcLbl = root.querySelector("[data-sc-tc]");
  const screens = { ric: root.querySelector('[data-screen="ric"]'), kol: root.querySelector('[data-screen="kol"]') };
  let caseId = "kol", current = null, clip = null, paused = false, userTook = false, inView = false, timer = null, soundOn = false;

  const fit = () => {
    if (screens.ric.clientWidth) CANVAS.ric.style.transform = `scale(${screens.ric.clientWidth / 1080})`;
    if (screens.kol.clientWidth) CANVAS.kol.style.transform = `scale(${screens.kol.clientWidth / 1920})`;
  };
  const ro = new ResizeObserver(fit); ro.observe(screens.ric); ro.observe(screens.kol);

  let actx = null;
  const whoosh = () => {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime, len = 0.45;
      const buf = actx.createBuffer(1, actx.sampleRate * len, actx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
      const src = actx.createBufferSource(); src.buffer = buf;
      const f = actx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.4;
      f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(3200, t + len);
      const g = actx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      src.connect(f).connect(g).connect(actx.destination); src.start(t);
      const o = actx.createOscillator(), og = actx.createGain();
      o.frequency.setValueAtTime(880, t + 0.05); og.gain.setValueAtTime(0.06, t + 0.05); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(og).connect(actx.destination); o.start(t + 0.05); o.stop(t + 0.22);
    } catch (e) { /* zvuk není podstatný */ }
  };

  const renderClips = () => {
    clipsBox.innerHTML = CLIPS[caseId].map((c, i) =>
      `<button type="button" class="sc__clip" data-clip="${c.id}" aria-pressed="false"><b>0${i + 1}</b><span>${c.n}<small>${c.d}</small></span></button>`).join("");
  };

  const playClip = (id) => {
    if (current) { current.anims.forEach((a) => a.cancel()); current.el.remove(); }
    clip = CLIPS[caseId].find((c) => c.id === id);
    clipsBox.querySelectorAll("[data-clip]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.clip === id)));
    if (fileLbl && clip.file) fileLbl.textContent = clip.file;
    screens.ric.classList.toggle("is-full", ["pozvanka", "mapa"].includes(id));
    current = comps[id]();
    current.build();
    // video intra KOL
    const isVideo = !!current.video;
    video.hidden = !isVideo;
    if (isVideo) {
      if (video.preload === "none") { video.preload = "auto"; video.load(); }
      video.currentTime = 0;
      if (!reduce.matches && !paused) video.play().catch(() => {});
    } else video.pause();
    if (reduce.matches) {
      current.anims.forEach((a) => { a.currentTime = clip.poster * 1000; a.pause(); });
      if (current.frame) current.frame(clip.poster);
      if (isVideo) { video.pause(); video.currentTime = clip.poster; }
    } else if (paused) current.anims.forEach((a) => a.pause());
    else if (current.frame) current.frame(0);
    whoosh();
    schedule();
  };

  const selectCase = (id, focus) => {
    caseId = id;
    caseTabs.forEach((t) => { const on = t.dataset.case === id; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    root.querySelectorAll("[data-case-show]").forEach((el) => { el.hidden = el.dataset.caseShow !== id; });
    renderClips();
    requestAnimationFrame(fit);
    playClip(CLIPS[id][0].id);
  };

  const schedule = () => {
    clearTimeout(timer);
    if (userTook || paused || !inView || reduce.matches || !current) return;
    const list = CLIPS[caseId], i = list.findIndex((c) => c.id === clip.id);
    timer = setTimeout(() => {
      if (i === list.length - 1) selectCase(caseId === "kol" ? "ric" : "kol");
      else playClip(list[i + 1].id);
    }, current.dur * 1000 * (current.dur < 4.5 ? 2 : 1));
  };

  const tick = () => {
    if (current) {
      const t = current.video ? (video.currentTime || 0) : current.time();
      if (current.frame && !reduce.matches && !paused) current.frame(t);
      const bar = root.querySelector(`[data-progress="${caseId}"]`);
      if (bar) bar.style.transform = `scaleX(${Math.min(1, t / current.dur).toFixed(4)})`;
      if (tcLbl && caseId === "kol") { const f = Math.floor(t * 25); tcLbl.textContent = `00:00:${String(Math.floor(f / 25)).padStart(2, "0")}:${String(f % 25).padStart(2, "0")}`; }
    }
    requestAnimationFrame(tick);
  };

  caseTabs.forEach((t, i) => {
    t.addEventListener("click", () => { userTook = true; selectCase(t.dataset.case); });
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault(); userTook = true;
      selectCase(caseTabs[(i + 1) % caseTabs.length].dataset.case, true);
    });
  });
  clipsBox.addEventListener("click", (e) => { const b = e.target.closest("[data-clip]"); if (b) { userTook = true; playClip(b.dataset.clip); } });
  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    if (current) current.anims.forEach((a) => (paused ? a.pause() : a.play()));
    if (current && current.video) { if (paused) video.pause(); else video.play().catch(() => {}); }
    pauseBtn.setAttribute("aria-pressed", String(paused));
    pauseLabel.textContent = paused ? "Spustit" : "Pozastavit";
    schedule();
  });
  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    soundBtn.setAttribute("aria-pressed", String(soundOn));
    soundBtn.querySelector("span").textContent = soundOn ? "Zvuk: zap." : "Zvuk: vyp.";
    whoosh();
  });
  new IntersectionObserver(([en]) => {
    inView = en.isIntersecting;
    if (current && current.video && !paused && !reduce.matches) { if (inView) video.play().catch(() => {}); else video.pause(); }
    schedule();
  }, { threshold: 0.35 }).observe(root.querySelector(".sc__stage"));

  fit();
  selectCase("kol");
  if (reduce.matches) pauseBtn.hidden = true; else requestAnimationFrame(tick);
})();
