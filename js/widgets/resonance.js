// Interactives for chapter o5 (forced oscillations and resonance): the resonance lab and the "push the swing" game.
// Lab model: m·y'' = −k·y − b·y' + F0·cos(2π·f_d·t) on a frictionless horizontal track, stepped with RK4 at a fixed 1 ms.
// The response curve stays qualitative: the student builds it point by point from what the simulation settles to.
import { h, s } from "../dom.js";
import { springFrequency, pendulumFrequency, fmt } from "../physics.js";

const DT = 0.001;                         // s, fixed sub-step (omega·dt ≤ 0.02 at the stiffest setting)
const BUCKET = 0.05;                      // s, amplitude bookkeeping
const NB = Math.round(BUCKET / DT);
const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const plain = (t) => String(t).replace(/_\{([^}]+)\}/g, "$1");

// ---------- the model (pure: importable in node for checking) ----------
export const K = 20;                      // N/m, fixed spring
export const F0 = 1.0;                    // N, peak driving force (fixed)
export const YMAX = 0.40;                 // m, the spring "snaps" beyond this
export const FD_MAX = 2.5;                // Hz, top of the driving-frequency slider
export const M_MIN = 0.20, M_MAX = 1.00;  // kg
export const QS = { strong: 2.5, light: 5, vlight: 20 };  // damping levels, as quality factors (never infinite: damping is never 0)
export const dampCoef = (m, Q) => Math.sqrt(K * m) / Q;   // b = m·ω0/Q, in N·s/m

// PHYSICS (move to physics.js): steady-state amplitude of m·y'' + b·y' + k·y = F0·cos(ω·t). Used only to check the simulation
// and in the bonus text; the core chapter never shows this formula.
export const steadyAmp = (m, b, fd, k = K, f0 = F0) => {
  const w = 2 * Math.PI * fd, w0sq = k / m;
  return (f0 / m) / Math.sqrt((w0sq - w * w) ** 2 + ((b * w) / m) ** 2);
};
/** Averaging window (s) for the amplitude meter: about one driving period, clamped. */
export const windowFor = (fd) => (fd > 0 ? Math.min(10, Math.max(2, 1 / fd)) : 2);

/** A driven oscillator. d.step() advances 1 ms. amp() = biggest |y| over the last window; steady() = settled; snapped = past YMAX. */
export function makeDriven(m, Q, fd) {
  const d = { m, Q, b: dampCoef(m, Q), fd, y: 0, v: 0, ph: 0, t: 0, hist: [], cur: 0, nIn: 0, tChange: 0, snapped: false, F: F0 };
  const acc = (y, v, p) => (-K * y - d.b * v + F0 * Math.cos(p)) / d.m;
  d.step = () => {
    const w = 2 * Math.PI * d.fd, hh = DT, y = d.y, v = d.v, p = d.ph;
    const a1 = acc(y, v, p);
    const y2 = y + 0.5 * hh * v, v2 = v + 0.5 * hh * a1, a2 = acc(y2, v2, p + 0.5 * hh * w);
    const y3 = y + 0.5 * hh * v2, v3 = v + 0.5 * hh * a2, a3 = acc(y3, v3, p + 0.5 * hh * w);
    const y4 = y + hh * v3, v4 = v + hh * a3, a4 = acc(y4, v4, p + hh * w);
    d.y = y + (hh / 6) * (v + 2 * v2 + 2 * v3 + v4);
    d.v = v + (hh / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
    d.ph = p + hh * w;                       // phase is continuous when f_d is changed, so no jolt
    d.t += DT;
    const ay = Math.abs(d.y);
    if (ay > d.cur) d.cur = ay;
    if (++d.nIn === NB) {
      d.hist.push(d.cur); d.cur = 0; d.nIn = 0;
      if (d.hist.length > 1000) d.hist.splice(0, 200);
    }
    if (ay > YMAX) d.snapped = true;
  };
  /** Biggest |y| over the window [now − shift − W, now − shift]; null if there isn't that much history yet (unless partial). */
  d.amp = (W, shift = 0, partial = false) => {
    const n = Math.round(W / BUCKET), sn = Math.round(shift / BUCKET), hi = d.hist.length - sn, lo = hi - n;
    if (lo < 0 && !partial) return null;
    let a = shift === 0 ? d.cur : 0;
    for (let i = Math.max(0, lo); i < hi; i++) if (d.hist[i] > a) a = d.hist[i];
    return a;
  };
  d.steady = () => {
    const W = windowFor(d.fd);
    if (d.t - d.tChange < Math.max(2 * W + 0.5, (4.5 * 2 * d.m) / d.b)) return false;   // also wait ~4.5 decay times (2m/b) for the start-up to fade
    const a1 = d.amp(W, 0), a2 = d.amp(W, W);
    return a1 != null && a2 != null && a1 > 0 && Math.abs(a1 - a2) <= 0.006 * a1;
  };
  /** Run ahead (no drawing) until steady or snapped or maxT seconds. */
  d.settle = (maxT = 120) => {
    const end = d.t + maxT;
    while (d.t < end && !d.snapped) { d.step(); if (d.nIn === 0 && d.steady()) break; }
    return d;
  };
  d.setFd = (f) => { d.fd = f; d.tChange = d.t; };
  d.setQ = (q) => { d.Q = q; d.b = dampCoef(d.m, q); d.tChange = d.t; };
  return d;
}
/** Settled amplitude (m) for given settings, from rest; {A, snapped, t}. */
export function settledAmp(m, Q, fd) {
  const d = makeDriven(m, Q, fd).settle();
  return { A: d.amp(windowFor(fd), 0), snapped: d.snapped, t: d.t };
}

// ---------- small UI helpers ----------
function pill(label, on) {
  const b = h("button", { class: "pill", type: "button", "aria-pressed": "false" }, label);
  b.addEventListener("click", () => on(b));
  return b;
}
function slider(label, min, max, step, val, show, set) {
  const out = h("output");
  const inp = h("input", { type: "range", min, max, step, value: val, "aria-label": plain(label) });
  const sync = () => { out.textContent = show(Number(inp.value)); };
  inp.addEventListener("input", () => { set(Number(inp.value)); sync(); });
  sync();
  return { inp, sync, nodes: [h("label", {}, label, out), inp] };
}
const dash = (c) => ({ stroke: c, "stroke-width": 1.5, "stroke-dasharray": "4 5" });
const COL = { strong: "#2ef2ff", light: "#ff4fd8", vlight: "#ffe14d" };

// ======================================================================================
// 1. The resonance lab
// ======================================================================================
const SX0 = 190, SC = 270, SY = 80;             // scene: equilibrium x (px), px per metre, spring height
const GX0 = 40, GX1 = 326, GY0 = 168, GY1 = 14, GCM = 45;   // graph: plot box, top of y axis in cm

export function resonanceLab(L, onEvent) {
  let m = 0.5, damp = "light", fd = 0.6;
  let sim = makeDriven(m, QS[damp], fd), playing = false, raf = 0, last = 0, acc = 0, snapTimer = 0, armed = true;
  let points = [], snaps = [];                   // points: {damp, fd, A}; snaps: [fd]
  const reduced = rm();
  const events = { plot: false, peak: false, damp: false };
  const f0 = () => springFrequency(m, K);

  // ----- scene -----
  const zig = s("path", { fill: "none", style: "stroke: var(--a1)", "stroke-width": 3, "stroke-linejoin": "round" });
  const zig2 = s("path", { fill: "none", style: "stroke: var(--a1)", "stroke-width": 3, "stroke-linejoin": "round" });
  const block = s("rect", { y: SY - 20, width: 44, height: 40, rx: 6, style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 3 });
  const pushLine = s("path", { stroke: "#ffe14d", "stroke-width": 5, "stroke-linecap": "round", fill: "none" });
  const pushHead = s("path", { fill: "#ffe14d" });
  const ampL = s("path", { ...dash("#ffe14d"), fill: "none" }), ampR = s("path", { ...dash("#ffe14d"), fill: "none" });
  const limitL = s("path", { stroke: "#ff5a7a", "stroke-width": 2, "stroke-dasharray": "2 4", d: `M${SX0 - YMAX * SC} 30V112` });
  const limitR = s("path", { stroke: "#ff5a7a", "stroke-width": 2, "stroke-dasharray": "2 4", d: `M${SX0 + YMAX * SC} 30V112` });
  const snapTxt = s("text", { x: 170, y: 40, "text-anchor": "middle", fill: "#ffe14d", "font-size": 40, "font-weight": 900, style: "font-family: var(--font-display)", opacity: 0 }, L.snap_word);
  const scene = s("svg", { class: "scene", viewBox: "0 0 340 150", role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: 340, height: 150, fill: "#0a0826" }),
    s("rect", { x: 6, y: 36, width: 10, height: 76, fill: "#3a2f80" }),
    s("path", { d: "M16 100H334", stroke: "rgba(255,255,255,.4)", "stroke-width": 2 }),
    limitL, limitR, ampL, ampR, zig, zig2, block, pushLine, pushHead, snapTxt);

  // ----- graph -----
  const px = (f) => GX0 + (f / FD_MAX) * (GX1 - GX0);
  const py = (cm) => GY0 - (Math.min(cm, GCM) / GCM) * (GY0 - GY1);
  const gridNodes = [];
  for (let f = 0; f <= FD_MAX + 1e-9; f += 0.5) {
    gridNodes.push(s("path", { d: `M${px(f)} ${GY1}V${GY0}`, stroke: "rgba(255,255,255,.12)" }),
      s("text", { x: px(f), y: GY0 + 14, "text-anchor": "middle", fill: "#c4bce8", "font-size": 11 }, fmt(f, 1)));
  }
  for (let a = 0; a <= 40; a += 10) {
    gridNodes.push(s("path", { d: `M${GX0} ${py(a)}H${GX1}`, stroke: "rgba(255,255,255,.12)" }),
      s("text", { x: GX0 - 6, y: py(a) + 4, "text-anchor": "end", fill: "#c4bce8", "font-size": 11 }, String(a)));
  }
  const f0Line = s("path", { ...dash("#fff"), fill: "none" });
  const f0Txt = s("text", { y: GY1 + 10, "text-anchor": "middle", fill: "#fff", "font-size": 12, "font-weight": 800 }, "f_{0}");
  const limitLine = s("path", { d: `M${GX0} ${py(YMAX * 100)}H${GX1}`, stroke: "#ff5a7a", "stroke-width": 1.5, "stroke-dasharray": "2 4" });
  const curveLayer = s("g"), liveDot = s("circle", { r: 6, fill: "none", stroke: "#fff", "stroke-width": 2 });
  const graph = s("svg", { class: "scene", viewBox: "0 0 340 200", role: "img", "aria-label": L.graph, style: "touch-action: pan-y" },
    s("rect", { width: 340, height: 200, fill: "#0a0826" }),
    ...gridNodes, limitLine, f0Line, f0Txt, curveLayer, liveDot,
    s("text", { x: (GX0 + GX1) / 2, y: 196, "text-anchor": "middle", fill: "#c4bce8", "font-size": 11 }, L.axis_x),
    s("text", { x: 4, y: 10, fill: "#c4bce8", "font-size": 11 }, L.axis_y));

  // ----- controls -----
  const driveSl = slider(L.drive, 0, FD_MAX, 0.01, fd, (v) => `${fmt(v, 2)} Hz`, (v) => { fd = v; changed("fd"); });
  const massSl = slider(L.mass, M_MIN, M_MAX, 0.05, m, (v) => `${fmt(v, 2)} kg`, (v) => { m = v; changed("m"); });
  const nudge = (d) => { const i = driveSl.inp; i.value = String(Math.max(0, Math.min(FD_MAX, Math.round((Number(i.value) + d) * 100) / 100))); i.dispatchEvent(new Event("input")); };
  const minus = h("button", { class: "pill", type: "button", "aria-label": L.nudge_down }, "− 0.01");
  const plus = h("button", { class: "pill", type: "button", "aria-label": L.nudge_up }, "+ 0.01");
  minus.addEventListener("click", () => nudge(-0.01)); plus.addEventListener("click", () => nudge(0.01));
  if (reduced) { // no animation: settle and plot once the slider is released (or a nudge button is pressed)
    driveSl.inp.addEventListener("change", () => settleNow());
    massSl.inp.addEventListener("change", () => settleNow());
    minus.addEventListener("click", () => settleNow()); plus.addEventListener("click", () => settleNow());
  }
  const dampPills = Object.keys(QS).map((key) => {
    const b = pill("", () => { damp = key; sync(); sim.setQ(QS[key]); armed = true; unsnap(); status.textContent = "";
      if (reduced) settleNow(); else if (!playing) { playing = true; setGo(); startLoop(); }
      draw(); });
    b.dataset.key = key;
    b.append(h("span", { style: `color:${COL[key]}`, "aria-hidden": "true" }, "● "), L[`damp_${key}`]);
    return b;
  });
  const sync = () => dampPills.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.key === damp)));
  sync();
  const go = h("button", { class: "btn primary", type: "button" }, L.start);
  const skip = h("button", { class: "btn", type: "button" }, L.settle);
  const wipe = h("button", { class: "btn", type: "button" }, L.wipe);
  const status = h("p", { class: "small", "aria-live": "polite" });
  const fVal = h("b"), dVal = h("b"), aVal = h("b"), pVal = h("b");
  const formula = h("div", { class: "formula" });

  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:380px;margin:0 auto" }, scene),
      h("div", { class: "scene-box", style: "max-width:380px;margin:12px auto 0" }, graph),
      h("p", { class: "small muted", style: "margin:8px 0 0;text-align:center" }, L.graph_hint)),
    h("div", { class: "controls" },
      ...driveSl.nodes, h("div", { class: "toggle-row", style: "margin-top:4px" }, minus, plus),
      ...massSl.nodes,
      h("label", {}, L.damping),
      h("div", { class: "toggle-row", style: "margin-top:4px" }, dampPills),
      h("div", { class: "btn-row" }, go, skip, wipe),
      status,
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, "f_{0}"), fVal),
        h("div", {}, h("span", {}, "f_{d}"), dVal),
        h("div", {}, h("span", {}, L.amp), aVal),
        h("div", {}, h("span", {}, L.points), pVal)),
      formula));
  if (reduced) go.hidden = true;

  // ----- model events -----
  function unsnap() { clearTimeout(snapTimer); if (sim.snapped) { sim = makeDriven(m, QS[damp], fd); playing = false; setGo(); } }
  function resetSim() { clearTimeout(snapTimer); sim = makeDriven(m, QS[damp], fd); armed = true; }
  function setGo() { go.textContent = playing ? L.pause : L.start; }
  function changed(what) {
    clearTimeout(snapTimer);
    if (what === "m") {
      points = []; snaps = []; resetSim(); playing = false; setGo();
      status.textContent = L.new_mass;
    } else {
      if (sim.snapped) { resetSim(); playing = false; setGo(); }
      sim.setFd(fd); armed = true; status.textContent = "";
    }
    if (!reduced && what === "fd" && !playing) { playing = true; setGo(); startLoop(); }   // reduced motion: settle when the slider is released
    draw();
  }
  function plot(A) {
    const i = points.findIndex((p) => p.damp === damp && Math.abs(p.fd - fd) < 1e-9);
    const p = { damp, fd, A };
    if (i >= 0) points[i] = p; else points.push(p);
    snaps = snaps.filter((x) => Math.abs(x - fd) > 1e-9);
    armed = false;
    status.textContent = L.plotted;
    const near = (q) => Math.abs(q.fd - f0()) <= 0.06;
    if (!events.plot && points.length >= 3) { events.plot = true; onEvent?.("plot", pVal); }
    const mine = points.filter((q) => q.damp === damp);
    const peak = mine.find(near), far = mine.filter((q) => Math.abs(q.fd - f0()) >= 0.4);
    if (!events.peak && peak && far.length && far.every((q) => peak.A >= 1.25 * q.A)) { events.peak = true; onEvent?.("peak", pVal); }
    if (!events.damp && new Set(points.filter(near).map((q) => q.damp)).size >= 2) { events.damp = true; onEvent?.("damp", pVal); }
  }
  function doSnap() {
    playing = false; setGo(); armed = false;
    if (!snaps.some((x) => Math.abs(x - fd) < 1e-9)) snaps.push(fd);
    points = points.filter((q) => !(q.damp === damp && Math.abs(q.fd - fd) < 1e-9));
    status.textContent = reduced ? L.snap_still : L.snap_status;
    onEvent?.("snap", go);
    if (!reduced) snapTimer = setTimeout(() => { if (root.isConnected) { resetSim(); status.textContent = L.snap_status; draw(); } }, 1700);
  }
  function settleNow() {
    cancelAnimationFrame(raf); raf = 0;
    if (sim.snapped) resetSim();
    sim.settle();
    if (sim.snapped) doSnap(); else plot(sim.amp(windowFor(fd), 0, true));
    draw();
    if (playing) startLoop();
  }

  // ----- drawing -----
  function springPath(x0, x1) {
    const n = 9, seg = (x1 - x0) / (2 * n + 2);
    let d = `M${x0.toFixed(1)} ${SY}L${(x0 + seg).toFixed(1)} ${SY}`;
    for (let i = 0; i < 2 * n; i++) d += `L${(x0 + seg * (i + 1.5)).toFixed(1)} ${SY + (i % 2 ? 11 : -11)}`;
    return d + `L${(x1 - seg).toFixed(1)} ${SY}L${x1} ${SY}`;
  }
  function draw() {
    const W = windowFor(fd), A = sim.amp(W, 0, true) || 0;
    const broken = sim.snapped;
    const xc = SX0 + Math.max(-YMAX * 1.1, Math.min(YMAX * 1.1, sim.y)) * SC, xl = xc - 22;
    block.setAttribute("x", (xc - 22).toFixed(1));
    if (broken) {
      const mid = 16 + (xl - 16) * 0.45;
      zig.setAttribute("d", springPath(16, mid)); zig2.setAttribute("d", springPath(mid + 22, xl + 14));
      zig2.setAttribute("transform", `rotate(-14 ${(mid + 22).toFixed(1)} ${SY})`);
    } else { zig.setAttribute("d", springPath(16, xl)); zig2.setAttribute("d", ""); zig2.removeAttribute("transform"); }
    snapTxt.setAttribute("opacity", broken ? 1 : 0);
    // driving force arrow (length ∝ the force right now)
    const fr = Math.cos(sim.ph), len = 52 * fr, ay = SY - 38;
    if (broken || Math.abs(len) < 2) { pushLine.setAttribute("d", ""); pushHead.setAttribute("d", ""); }
    else {
      const x1 = xc + len, dir = Math.sign(len);
      pushLine.setAttribute("d", `M${xc.toFixed(1)} ${ay}H${(x1 - dir * 6).toFixed(1)}`);
      pushHead.setAttribute("d", `M${x1.toFixed(1)} ${ay}l${-dir * 12} -8v16z`);
    }
    ampL.setAttribute("d", A > 0.003 ? `M${SX0 - A * SC} 30V112` : ""); ampR.setAttribute("d", A > 0.003 ? `M${SX0 + A * SC} 30V112` : "");
    // readouts
    fVal.textContent = `${fmt(f0(), 2)} Hz`; dVal.textContent = `${fmt(fd, 2)} Hz`;
    aVal.textContent = `${fmt(A * 100, 1)} cm`; pVal.textContent = String(points.length);
    formula.replaceChildren(h("span", {}, `f_{0} = 1/(2π)·√(k/m) = 1/(2π)·√(${fmt(K, 0)} / ${fmt(m, 2)}) = ${fmt(f0(), 2)} Hz`));
    // graph
    f0Line.setAttribute("d", `M${px(f0())} ${GY1}V${GY0}`); f0Txt.setAttribute("x", px(f0()) + 12);
    liveDot.setAttribute("cx", px(fd).toFixed(1)); liveDot.setAttribute("cy", py(A * 100).toFixed(1));
    liveDot.setAttribute("opacity", broken ? 0 : 1);
    const layer = [];
    for (const key of Object.keys(QS)) {
      const mine = points.filter((q) => q.damp === key).sort((a, b) => a.fd - b.fd);
      if (mine.length > 1) layer.push(s("path", { d: mine.map((q, i) => `${i ? "L" : "M"}${px(q.fd).toFixed(1)} ${py(q.A * 100).toFixed(1)}`).join(""), fill: "none", stroke: COL[key], "stroke-width": 2, opacity: 0.6 }));
      for (const q of mine) layer.push(s("circle", { cx: px(q.fd).toFixed(1), cy: py(q.A * 100).toFixed(1), r: 4.5, fill: COL[key], stroke: "#fff", "stroke-width": 1 }));
    }
    for (const sf of snaps) layer.push(s("path", { d: `M${px(sf) - 6} ${py(YMAX * 100) - 6}l12 12m0 -12l-12 12`, stroke: "#ff5a7a", "stroke-width": 3, "stroke-linecap": "round" }));
    curveLayer.replaceChildren(...layer);
  }

  // ----- run loop -----
  function startLoop() { cancelAnimationFrame(raf); last = performance.now(); acc = 0; raf = requestAnimationFrame(frame); }
  function frame(now) {
    if (!root.isConnected) { raf = 0; return; }
    if (!playing) { raf = 0; draw(); return; }
    acc += Math.min(now - last, 50) / 1000; last = now;
    for (let n = 0; acc >= DT && n < 60 && !sim.snapped; n++, acc -= DT) sim.step();
    if (sim.snapped) { doSnap(); draw(); raf = 0; return; }
    if (armed && sim.steady()) plot(sim.amp(windowFor(fd), 0));
    draw();
    raf = requestAnimationFrame(frame);
  }
  go.addEventListener("click", () => {
    if (sim.snapped) { resetSim(); status.textContent = ""; }
    playing = !playing; setGo();
    if (playing) startLoop(); else draw();
  });
  skip.addEventListener("click", () => { if (!playing && !reduced) { playing = true; setGo(); } settleNow(); });
  wipe.addEventListener("click", () => { points = []; snaps = []; armed = true; status.textContent = ""; draw(); });

  // ----- fixed states for the keyboard/slider ends -----
  setGo(); draw();
  return root;
}

// ======================================================================================
// 2. Push the swing: tap to push; the push always goes the same way, so timing is everything
// ======================================================================================
export const SWING = { len: 2.5, goalDeg: 20 };            // the swing: chain length (m) and the amplitude (degrees) that wins
const GAME = { len: SWING.len, q: 40, dv: 0.12, cool: 0.8, th0: 0.10, goalDeg: SWING.goalDeg };
const SW_PX = 150, SW_PY = 28, SW_LEN = 150;
export const swingOmega = () => 2 * Math.PI * pendulumFrequency(GAME.len);   // = √(g/L), rad/s

export function pushGame(L, winContent, onWin) {
  const w0 = swingOmega(), c = w0 / GAME.q;
  let th = GAME.th0, om = 0, t = 0, swAcc = 0, pushes = 0, best = 0, won = false, running = false, raf = 0, last = 0, acc = 0, flash = 0;
  const gaps = [];
  let lastPush = null;
  const reduced = rm();

  const chain = s("path", { style: "stroke: var(--a1)", "stroke-width": 3, "stroke-linecap": "round" });
  const seat = s("g", {}, s("rect", { x: -18, y: 0, width: 36, height: 7, rx: 3, fill: "#3a2f80", stroke: "#fff", "stroke-width": 2 }),
    s("circle", { cx: 0, cy: -9, r: 9, style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 2 }));
  const arrow = s("path", { d: "M0 0h30l-8 -7m8 7l-8 7", stroke: "#ffe14d", "stroke-width": 5, "stroke-linecap": "round", "stroke-linejoin": "round", fill: "none", opacity: 0 });
  const svg = s("svg", { class: "scene", viewBox: "0 0 300 230", role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: 300, height: 230, fill: "#0a0826" }),
    s("path", { d: `M${SW_PX} ${SW_PY}V${SW_PY + SW_LEN + 10}`, ...dash("rgba(255,255,255,.35)") }),
    s("rect", { x: SW_PX - 60, y: SW_PY - 8, width: 120, height: 8, rx: 3, fill: "#3a2f80" }),
    chain, seat, arrow, s("circle", { cx: SW_PX, cy: SW_PY, r: 5, fill: "#fff" }));

  const aVal = h("b"), nVal = h("b"), gVal = h("b"), tVal = h("b");
  const verdict = h("p", { class: "verdict", "aria-live": "polite" });
  const win = h("div", { class: "reveal", hidden: true }, winContent);
  const push = h("button", { class: "btn primary", type: "button", style: "min-height:64px;font-size:22px;flex:1" }, L.push);
  const letgo = h("button", { class: "btn", type: "button" }, L.letgo);
  const reset = h("button", { class: "btn", type: "button" }, L.reset);
  const wait = h("button", { class: "btn", type: "button", hidden: !reduced }, L.wait);
  const root = h("div", { class: "lab" },
    h("div", { class: "scene-box", style: "max-width:340px;margin:0 auto" }, svg),
    h("div", { class: "controls" },
      h("div", { class: "btn-row" }, push),
      h("div", { class: "btn-row" }, letgo, wait, reset),
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.amp), aVal),
        h("div", {}, h("span", {}, L.pushes), nVal),
        h("div", {}, h("span", {}, L.gap), gVal),
        h("div", {}, h("span", {}, L.period), tVal)),
      verdict, win));

  const ampNow = () => Math.sqrt(th * th + (om / w0) ** 2);       // steady swing size: exact for a linear oscillator
  function draw() {
    const x = SW_PX + SW_LEN * Math.sin(th), y = SW_PY + SW_LEN * Math.cos(th);
    chain.setAttribute("d", `M${SW_PX} ${SW_PY}L${x.toFixed(1)} ${y.toFixed(1)}`);
    seat.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(th * 57.2958).toFixed(1)})`);
    arrow.setAttribute("transform", `translate(${(x + 24).toFixed(1)} ${(y + 4).toFixed(1)})`);
    arrow.setAttribute("opacity", flash > 0 ? 1 : 0);
    const a = ampNow() * 57.2958;
    aVal.textContent = `${fmt(a, 1)}°`; nVal.textContent = String(pushes);
    gVal.textContent = gaps.length ? `${fmt(gaps[gaps.length - 1], 1)} s` : "—";
    tVal.textContent = `${fmt((2 * Math.PI) / w0, 2)} s`;
  }
  function advance(sec) {              // accumulator: whole 1 ms steps only, and t counts the steps actually taken
    swAcc += sec;
    const n = Math.floor(swAcc / DT + 1e-9);
    swAcc -= n * DT;
    for (let i = 0; i < n; i++) {       // semi-implicit Euler at 1 ms: stable and (nearly) energy-true for ω·dt = 0.002
      om += (-w0 * w0 * th - c * om) * DT;
      th += om * DT;
    }
    t += n * DT; if (flash > 0) flash -= n * DT;
    const a = ampNow() * 57.2958;
    if (a > best) best = a;
    if (!won && a >= GAME.goalDeg) { won = true; win.hidden = false; verdict.textContent = L.win_head; onWin?.(push); }
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; running = false; }
  function frame(now) {
    if (!root.isConnected) { stop(); return; }
    advance(Math.min(now - last, 50) / 1000); last = now;
    draw();
    raf = requestAnimationFrame(frame);
  }
  function start() { if (reduced || running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  push.addEventListener("click", () => {
    if (lastPush != null && t - lastPush < GAME.cool) { verdict.textContent = L.too_soon; return; }   // arms need a moment: no spamming
    om += GAME.dv; pushes++; flash = 0.25;
    if (lastPush != null) { gaps.push(t - lastPush); if (gaps.length > 6) gaps.shift(); }
    lastPush = t;
    if (!won) verdict.textContent = "";
    start(); draw();
  });
  letgo.addEventListener("click", () => { if (!running) start(); });
  wait.addEventListener("click", () => { advance(0.25); draw(); });
  reset.addEventListener("click", () => {
    stop(); th = GAME.th0; om = 0; t = 0; swAcc = 0; pushes = 0; best = 0; flash = 0; gaps.length = 0; lastPush = null;
    verdict.textContent = ""; draw();
  });
  draw();
  return root;
}
