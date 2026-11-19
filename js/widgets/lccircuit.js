// Interactives for chapter o6 "The circuit that rings": the LC lab (circuit + mass-spring twin + energy bars + U/I graph),
// the "tune the radio" game, and the "match the twins" game. Notation follows the formula booklet: Q, U, I, C, L, W, ω0.
// Pure helpers (trace, radio functions, constants) are exported so numbers can be checked in node; DOM code stays inside functions.
// Slow motion: the real LC ring takes milliseconds, so the lab shows it ×SLOW slower (stated in the lab text).
import { h, s } from "../dom.js";
import { lcOmega, lcFrequency, capEnergy, inductorEnergy, springOmega, fmt, sci } from "../physics.js";

const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const fill = (str, v) => String(str).replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k]) : m));
const minus = (str) => String(str).replace(/^-/, "−");   // typographic minus for signed readouts

export const U0 = 10;                  // V: the capacitor starts charged to this voltage (the "full" state)
export const SLOW = 1000;              // the lab shows the ring this many times slower than real life
export const DTAU = 0.01;              // simulation step in "phase" τ = ω0·t (a full ring is 2π)
export const TAU_MAX = 40 * Math.PI;   // 20 full rings are simulated after each start
export const L_RANGE = { min: 5, max: 50, step: 1, val: 10 };   // mH
export const C_RANGE = { min: 5, max: 50, step: 1, val: 10 };   // µF
// Damping levels 0..5 = none, very light, light, medium, strong, heavy: each is the damping ratio ζ = (R/2)·√(C/L),
// so one word looks the same for every L and C. The student only ever sees the words (R is "resistance" in the text).
export const LEVELS = [0, 0.02, 0.06, 0.2, 0.5, 1.5];
const COL = { E: "#ff4fd8", B: "#2ef2ff", W: "#ffe14d", H: "#ff8a3d" };

/**
 * Dimensionless LC ring: x = Q/Q0 (the capacitor's charge, starts at +1), xd = dx/dτ (minus the current, scaled).
 * x'' + 2ζ·x' + x = 0 with τ = ω0·t. ζ = 0 uses the exact cos/sin (so the total energy is exactly flat); otherwise RK4.
 * Energies in units of W0 = ½·C·U0²: capacitor x², coil xd², heat 1 − x² − xd².
 */
export function trace(zeta, tauEnd = TAU_MAX, dt = DTAU) {
  const n = Math.floor(tauEnd / dt) + 1;
  const x = new Float64Array(n), xd = new Float64Array(n);
  let p = 1, v = 0;
  const acc = (pp, vv) => -pp - 2 * zeta * vv;
  for (let i = 0; i < n; i++) {
    if (zeta === 0) { const t = i * dt; p = Math.cos(t); v = -Math.sin(t); }
    x[i] = p; xd[i] = v;
    if (zeta > 0) {
      const k1p = v, k1v = acc(p, v);
      const k2p = v + (dt / 2) * k1v, k2v = acc(p + (dt / 2) * k1p, v + (dt / 2) * k1v);
      const k3p = v + (dt / 2) * k2v, k3v = acc(p + (dt / 2) * k2p, v + (dt / 2) * k2v);
      const k4p = v + dt * k3v, k4v = acc(p + dt * k3p, v + dt * k3v);
      p += (dt / 6) * (k1p + 2 * k2p + 2 * k3p + k4p);
      v += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    }
  }
  return { n, dt, x, xd };
}

/** Numbers the lab shows for L in mH and C in µF (every readout comes from physics.js). */
export function labNumbers(LmH, CuF) {
  const L = LmH * 1e-3, C = CuF * 1e-6;
  const w0 = lcOmega(L, C), f0 = lcFrequency(L, C), T = 1 / f0;
  const Imax = C * U0 * w0;
  return { L, C, w0, f0, T, Imax, W0: capEnergy(C, U0), twinM: L, twinK: 1 / C, twinW: springOmega(L, 1 / C) };
}

// PHYSICS (move to physics.js): how strongly a circuit tuned to f0 answers an AC drive of frequency f (a Q-factor resonance curve,
// 1 at f = f0). It is an illustrative curve shape only (the syllabus does not investigate impedance); Q = 8 sets how sharp the peak is.
export const RADIO_Q = 8;
export const strengthAt = (f, f0, Q = RADIO_Q) => 1 / Math.sqrt(1 + Q * Q * (f / f0 - f0 / f) ** 2);

// ---------------------------------------------------------------------------------------------
// shared drawing pieces
// ---------------------------------------------------------------------------------------------
const WIRE = { stroke: "#c4bce8", "stroke-width": 3, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };
const LX = 50, RX = 270, TY = 44, BY = 160;
// the current path (top plate → up → across the top → down the right → back along the bottom → up to the bottom plate)
const SEG = [[LX, 90, LX, TY], [LX, TY, RX, TY], [RX, TY, RX, BY], [RX, BY, LX, BY], [LX, BY, LX, 110]];
const SEG_LEN = SEG.map(([a, b, c, d]) => Math.hypot(c - a, d - b));
const PATH_LEN = SEG_LEN.reduce((p, q) => p + q, 0);
const COIL_SKIP = [SEG_LEN[0] + SEG_LEN[1] + (76 - TY), SEG_LEN[0] + SEG_LEN[1] + (128 - TY)];
function pathPoint(sArc) {
  let r = ((sArc % PATH_LEN) + PATH_LEN) % PATH_LEN;
  for (let i = 0; i < SEG.length; i++) {
    if (r <= SEG_LEN[i]) { const [a, b, c, d] = SEG[i], u = r / SEG_LEN[i]; return { x: a + (c - a) * u, y: b + (d - b) * u, s: sArc }; }
    r -= SEG_LEN[i];
  }
  return { x: LX, y: 110, s: sArc };
}
const DOTS = 14, DOT_K = 90;           // 14 charge dots; they shift by DOT_K·(1 − x): the charge that has flowed (exact, stateless)

function makeCircuit(L, onSwitch) {
  const q = (d, extra = {}) => s("path", { d, ...WIRE, ...extra });
  // coil: four bumps on the right
  let coil = `M${RX} 76`;
  for (let i = 0; i < 4; i++) coil += ` c22 0 22 13 0 13`;
  const rings = [[22, 40, 0.95], [34, 52, 0.65], [46, 64, 0.4]].map(([rx, ry]) => s("ellipse", { cx: RX, cy: 102, rx, ry, fill: "none", stroke: COL.B, "stroke-width": 2.5, opacity: 0 }));
  const efield = s("g", { fill: "none", stroke: COL.E, "stroke-width": 2, "stroke-linecap": "round", opacity: 0 },
    ...[32, 41, 50, 59, 68].map((x) => s("path", { d: `M${x} 93V107M${x - 3} 103L${x} 107L${x + 3} 103` })));
  const plusTop = s("text", { x: 14, y: 95, fill: COL.W, "font-size": 16, "font-weight": 800, "text-anchor": "middle", opacity: 0 }, "+");
  const plusBot = s("text", { x: 14, y: 117, fill: COL.W, "font-size": 16, "font-weight": 800, "text-anchor": "middle", opacity: 0 }, "−");
  const lever = s("path", { d: "M125 44L175 44", stroke: "#fff", "stroke-width": 4, "stroke-linecap": "round", fill: "none" });
  const hit = s("rect", { x: 112, y: 12, width: 76, height: 48, fill: "rgba(255,255,255,0.001)", style: "cursor: pointer" });
  const sw = s("g", { role: "button", tabindex: 0, "aria-label": L.switch_aria }, hit, lever,
    s("circle", { cx: 125, cy: 44, r: 4, fill: "#fff" }), s("circle", { cx: 175, cy: 44, r: 4, fill: "#fff" }));
  const activate = (e) => { if (e.type === "click" || e.key === "Enter" || e.key === " ") { e.preventDefault(); onSwitch(); } };
  sw.addEventListener("click", activate); sw.addEventListener("keydown", activate);
  const resistor = s("g", {});
  const dots = Array.from({ length: DOTS }, () => s("circle", { r: 3.2, fill: COL.W, opacity: 0 }));
  const svg = s("svg", { class: "scene", viewBox: "0 0 320 200", role: "img", "aria-label": L.circuit_aria, style: "touch-action: pan-y" },
    s("rect", { width: 320, height: 200, fill: "#0a0826" }),
    ...rings,
    q(`M${LX} 90V${TY}H125`), q(`M175 ${TY}H${RX}V76`), q(`M${RX} 128V${BY}H190`), q(`M130 ${BY}H${LX}V110`),
    resistor,
    s("path", { d: coil, ...WIRE, stroke: COL.B }),
    s("path", { d: "M28 90H72M28 110H72", stroke: "#fff", "stroke-width": 4, "stroke-linecap": "round" }),
    efield, plusTop, plusBot, ...dots, sw,
    s("text", { x: LX, y: 188, fill: COL.E, "font-size": 14, "font-weight": 800, "text-anchor": "middle" }, "C"),
    s("text", { x: RX, y: 188, fill: COL.B, "font-size": 14, "font-weight": 800, "text-anchor": "middle" }, "L"));
  function setLevel(level) {
    if (level === 0) resistor.replaceChildren(s("path", { d: `M190 ${BY}H130`, ...WIRE }));
    else resistor.replaceChildren(
      s("path", { d: `M190 ${BY}L184 ${BY - 8}L172 ${BY + 8}L160 ${BY - 8}L148 ${BY + 8}L136 ${BY - 8}L130 ${BY}`, ...WIRE, stroke: COL.H }),
      s("text", { x: 160, y: 188, fill: COL.H, "font-size": 14, "font-weight": 800, "text-anchor": "middle" }, "R"));
  }
  function set(x, xd, closed, showDots) {
    efield.setAttribute("opacity", Math.abs(x).toFixed(3));
    efield.setAttribute("transform", x >= 0 ? "" : "translate(0 200) scale(1 -1)");
    plusTop.textContent = x >= 0 ? "+" : "−"; plusBot.textContent = x >= 0 ? "−" : "+";
    plusTop.setAttribute("opacity", Math.abs(x).toFixed(3)); plusBot.setAttribute("opacity", Math.abs(x).toFixed(3));
    rings.forEach((r, i) => r.setAttribute("opacity", (Math.min(1, Math.abs(xd)) * [0.95, 0.65, 0.4][i]).toFixed(3)));
    lever.setAttribute("d", closed ? "M125 44L175 44" : "M125 44L168 22");
    dots.forEach((d, i) => {
      const sArc = (i * PATH_LEN) / DOTS + DOT_K * (1 - x);
      const m = ((sArc % PATH_LEN) + PATH_LEN) % PATH_LEN;
      const hide = !showDots || !closed || (m > COIL_SKIP[0] && m < COIL_SKIP[1]);
      if (hide) { d.setAttribute("opacity", 0); return; }
      const pt = pathPoint(sArc);
      d.setAttribute("cx", pt.x.toFixed(1)); d.setAttribute("cy", pt.y.toFixed(1)); d.setAttribute("opacity", 0.95);
    });
  }
  setLevel(0);
  return { svg, set, setLevel, sw };
}

const EQ = 190, PX = 90, YS = 100;     // twin scene: equilibrium x, pixels per unit of x, spring height
function makeTwin(L) {
  const spring = s("path", { fill: "none", stroke: COL.B, "stroke-width": 3.5, "stroke-linejoin": "round", "stroke-linecap": "round" });
  const block = s("g", {}, s("rect", { x: -20, y: -19, width: 40, height: 38, rx: 7, style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 3 }),
    s("text", { x: 0, y: 6, fill: "#fff", "font-size": 16, "font-weight": 800, "text-anchor": "middle" }, "m"));
  const arrow = s("path", { fill: "none", stroke: COL.W, "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0 });
  const vlab = s("text", { y: 62, fill: COL.W, "font-size": 14, "font-weight": 800, "text-anchor": "middle", opacity: 0 }, "v");
  const svg = s("svg", { class: "scene", viewBox: "0 0 320 200", role: "img", "aria-label": L.twin_aria, style: "touch-action: pan-y" },
    s("rect", { width: 320, height: 200, fill: "#0a0826" }),
    s("rect", { x: 0, y: 150, width: 320, height: 6, fill: "#3a2f80" }),
    s("rect", { x: 0, y: 50, width: 12, height: 100, fill: "#3a2f80" }),
    s("path", { d: `M${EQ} 40V150`, stroke: "#c4bce8", "stroke-width": 1.5, "stroke-dasharray": "4 5" }),
    s("text", { x: EQ, y: 32, fill: "#c4bce8", "font-size": 12, "font-weight": 800, "text-anchor": "middle" }, "y = 0 ↔ Q = 0"),
    spring, block, arrow, vlab,
    s("text", { x: 44, y: 130, fill: COL.B, "font-size": 13, "font-weight": 800 }, "k ↔ 1/C"),
    s("text", { x: 306, y: 178, fill: "#fff", "font-size": 13, "font-weight": 800, "text-anchor": "end" }, "m ↔ L"),
    s("text", { x: 306, y: 194, fill: COL.W, "font-size": 13, "font-weight": 800, "text-anchor": "end" }, "v ↔ I,  y ↔ Q"));
  function set(x, xd) {
    const xb = EQ + x * PX, n = 12, a0 = 18, len = Math.max(8, xb - 20 - 6 - a0);
    let d = `M12 ${YS}H${a0}`;
    for (let i = 0; i < n; i++) d += ` L${(a0 + (len * (i + 0.5)) / n).toFixed(1)} ${YS + (i % 2 ? -11 : 11)}`;
    d += ` L${a0 + len} ${YS}H${(xb - 20).toFixed(1)}`;
    spring.setAttribute("d", d);
    block.setAttribute("transform", `translate(${xb.toFixed(1)} ${YS})`);
    const a = Math.min(1, Math.abs(xd)) * 46, dir = Math.sign(xd) || 1;
    if (Math.abs(xd) < 0.03) { arrow.setAttribute("opacity", 0); vlab.setAttribute("opacity", 0); return; }
    const x0 = xb - dir * a / 2, x1 = xb + dir * a / 2;
    arrow.setAttribute("d", `M${x0.toFixed(1)} 72H${x1.toFixed(1)}M${(x1 - dir * 7).toFixed(1)} 66L${x1.toFixed(1)} 72L${(x1 - dir * 7).toFixed(1)} 78`);
    arrow.setAttribute("opacity", 1);
    vlab.setAttribute("x", xb.toFixed(1)); vlab.setAttribute("opacity", 1);
  }
  set(1, 0);
  return { svg, set };
}

function makeBars(rows, valText) {
  const H = 8 + rows.length * 26;
  const fills = rows.map((r, i) => s("rect", { x: 70, y: 6 + i * 26, width: 0, height: 20, rx: 5, fill: r.col }));
  const vals = rows.map((r, i) => s("text", { x: 312, y: 21 + i * 26, "text-anchor": "end", fill: "#fff", "font-size": 12, "font-weight": 800,
    style: "paint-order: stroke; stroke: #0a0826; stroke-width: 3px" }, ""));
  const svg = s("svg", { class: "scene", viewBox: `0 0 320 ${H}`, role: "img", "aria-label": rows.map((r) => r.label).join(", "), style: "touch-action: pan-y" },
    s("rect", { width: 320, height: H, fill: "#0a0826" }),
    ...rows.map((r, i) => s("rect", { x: 70, y: 6 + i * 26, width: 242, height: 20, rx: 5, fill: "rgba(255,255,255,.08)" })),
    ...fills,
    ...rows.map((r, i) => s("text", { x: 6, y: 21 + i * 26, fill: r.col, "font-size": 13, "font-weight": 800 }, r.label)),
    ...vals);
  function set(values) {
    values.forEach((v, i) => {
      fills[i].setAttribute("width", (242 * clamp(v, 0, 1)).toFixed(1));
      vals[i].textContent = valText(v);
    });
  }
  return { svg, set };
}

const GX0 = 20, GX1 = 312, GY0 = 20, GY1 = 160, GMID = 90;
function makeGraph(L) {
  const line = (col, w, extra = {}) => s("path", { fill: "none", stroke: col, "stroke-width": w, "stroke-linejoin": "round", ...extra });
  const quarters = s("g", {});
  const ghostU = line(COL.E, 2, { opacity: 0.22 }), ghostI = line(COL.B, 2, { opacity: 0.22 });
  const pU = line(COL.E, 3), pI = line(COL.B, 3);
  const cursor = s("path", { stroke: "rgba(255,255,255,.55)", "stroke-width": 1.5 });
  const svg = s("svg", { class: "scene", viewBox: "0 0 320 190", role: "img", "aria-label": L.graph, style: "touch-action: pan-y" },
    s("rect", { width: 320, height: 190, fill: "#0a0826" }),
    quarters,
    s("path", { d: `M${GX0} ${GMID}H${GX1}`, stroke: "rgba(255,255,255,.35)", "stroke-width": 1.5 }),
    ghostU, ghostI, pU, pI, cursor,
    s("text", { x: 4, y: 14, fill: COL.E, "font-size": 13, "font-weight": 800 }, "U"),
    s("text", { x: 22, y: 14, fill: COL.B, "font-size": 13, "font-weight": 800 }, "I"),
    s("text", { x: 44, y: 14, fill: "#c4bce8", "font-size": 11, "font-weight": 700 }, L.graph_legend),
    s("text", { x: GX1, y: 184, fill: "#c4bce8", "font-size": 12, "font-weight": 800, "text-anchor": "end" }, L.time_axis));
  /** from/win: visible phase window (τ); upto: how far the solid curves go; ghost: also draw the faint future. */
  function draw({ tr, from, win, upto, ghost }) {
    const px = (t) => GX0 + ((t - from) / win) * (GX1 - GX0);
    const py = (u) => GMID - clamp(u, -1.05, 1.05) * (GMID - GY0);
    const at = (arr, t) => arr[Math.min(tr.n - 1, Math.max(0, Math.round(t / tr.dt)))];
    const path = (get, tEnd) => {
      const nn = Math.max(2, Math.ceil((240 * (tEnd - from)) / win)), pts = [];
      for (let j = 0; j <= nn; j++) { const t = from + ((tEnd - from) * j) / nn; pts.push(`${j ? "L" : "M"}${px(t).toFixed(1)} ${py(get(t)).toFixed(1)}`); }
      return pts.join("");
    };
    const gU = (t) => at(tr.x, t), gI = (t) => -at(tr.xd, t);
    pU.setAttribute("d", path(gU, upto)); pI.setAttribute("d", path(gI, upto));
    ghostU.setAttribute("d", ghost ? path(gU, from + win) : ""); ghostI.setAttribute("d", ghost ? path(gI, from + win) : "");
    cursor.setAttribute("d", `M${px(upto).toFixed(1)} ${GY0 - 6}V${GY1}`);
    const lines = [];
    for (let n = Math.ceil(from / (Math.PI / 2) - 1e-9); n * (Math.PI / 2) <= from + win + 1e-9; n++) {
      lines.push(s("path", { d: `M${px(n * Math.PI / 2).toFixed(1)} ${GY0 - 6}V${GY1}`, stroke: n % 4 === 0 ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.14)", "stroke-width": 1, "stroke-dasharray": "2 4" }));
    }
    quarters.replaceChildren(...lines);
  }
  return { svg, draw };
}

function slider(label, min, max, step, val, show, set) {
  const out = h("output");
  const inp = h("input", { type: "range", min, max, step, value: val, "aria-label": label });
  const sync = () => { out.textContent = show(Number(inp.value)); };
  inp.addEventListener("input", () => { set(Number(inp.value)); sync(); });
  sync();
  return [h("label", {}, label, out), inp];
}

// ---------------------------------------------------------------------------------------------
// 1. The LC lab
// ---------------------------------------------------------------------------------------------
export function lcLab(L, onEvent) {
  let LmH = L_RANGE.val, CuF = C_RANGE.val, level = 0, tau = 0, closed = false, playing = false, slow = false, raf = 0, last = performance.now();
  let tr, N, win = 6 * Math.PI, flipped = false, damped = false, f0First = null, halved = false;
  const reduced = rm();
  const traces = LEVELS.map(() => null);
  const getTrace = (lv) => (traces[lv] ||= trace(LEVELS[lv]));

  const circuit = makeCircuit(L, toggleSwitch);
  const twin = makeTwin(L);
  const bars = makeBars([
    { label: L.bar_e, col: COL.E }, { label: L.bar_b, col: COL.B }, { label: L.bar_tot, col: COL.W }, { label: L.bar_heat, col: COL.H }],
  (v) => `${fmt(v * 100, 0)} %`);
  const graph = makeGraph(L);

  const swBtn = h("button", { class: "btn primary", type: "button" }, L.close_sw);
  const playBtn = h("button", { class: "btn", type: "button", hidden: reduced }, L.pause);
  const slowPill = h("button", { class: "pill", type: "button", "aria-pressed": "false", hidden: reduced }, L.slow);
  const scrub = h("input", { type: "range", min: 0, max: win, step: win / 400, value: 0, "aria-label": L.scrub });
  const rd = Array.from({ length: 10 }, () => h("b"));
  const rdItem = (lab, i) => h("div", {}, h("span", {}, lab), rd[i]);

  const root = h("div", { class: "lab" },
    h("div", { style: "max-width:680px;margin:0 auto;width:100%" },
      h("div", { style: "display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:8px" },
        h("div", {}, h("p", { class: "small muted", style: "margin:0 0 4px" }, L.cap_circuit), h("div", { class: "scene-box" }, circuit.svg)),
        h("div", {}, h("p", { class: "small muted", style: "margin:0 0 4px" }, L.cap_twin), h("div", { class: "scene-box" }, twin.svg))),
      h("div", { class: "scene-box", style: "margin-top:8px;max-width:420px;margin-left:auto;margin-right:auto" }, bars.svg),
      h("p", { class: "small muted", style: "max-width:420px;margin:4px auto 0" }, L.bars_note),
      h("div", { class: "scene-box", style: "margin-top:8px;max-width:420px;margin-left:auto;margin-right:auto" }, graph.svg),
      h("p", { class: "small muted", style: "max-width:420px;margin:4px auto 0" }, L.graph_note)),
    h("div", { class: "controls" },
      h("div", { class: "btn-row" }, swBtn, playBtn),
      h("div", { class: "toggle-row" }, slowPill),
      h("label", {}, L.scrub), scrub,
      ...slider(L.l, L_RANGE.min, L_RANGE.max, L_RANGE.step, LmH, (v) => `${fmt(v, 0)} mH`, (v) => { LmH = v; changed(); }),
      ...slider(L.c, C_RANGE.min, C_RANGE.max, C_RANGE.step, CuF, (v) => `${fmt(v, 0)} µF`, (v) => { CuF = v; changed(); }),
      ...slider(L.res, 0, 5, 1, level, (v) => L.levels[v], (v) => { level = v; changed(); }),
      h("p", { class: "small muted" }, L.slow_note)),
    h("div", { class: "readout" },
      rdItem(L.r_f0, 0), rdItem(L.r_w0, 1), rdItem(L.r_t, 2),
      rdItem(L.r_u, 3), rdItem(L.r_i, 4), rdItem(L.r_w, 5),
      rdItem(L.r_e, 6), rdItem(L.r_b, 7), rdItem(L.r_m, 8), rdItem(L.r_k, 9)));

  function toggleSwitch() {
    if (!closed) { closed = true; tau = 0; playing = !reduced; if (reduced) tau = Math.PI / 4; }
    else { closed = false; tau = 0; playing = false; }
    last = performance.now(); syncBtn(); draw();
  }
  swBtn.addEventListener("click", toggleSwitch);
  function syncBtn() {
    swBtn.textContent = closed ? L.open_sw : L.close_sw;
    playBtn.textContent = playing ? L.pause : L.play;
    playBtn.disabled = !closed;
  }
  // changing L, C or the resistance re-charges the capacitor: you cannot swap parts in a ringing circuit
  function changed() {
    tr = getTrace(level);
    N = labNumbers(LmH, CuF);
    circuit.setLevel(level);
    tau = closed && reduced ? Math.PI / 4 : 0;
    playing = closed && !reduced; flipped = false; damped = false;
    scrub.max = String(win); scrub.step = String(win / 400);
    rd[0].textContent = `${fmt(N.f0, 1)} Hz`; rd[1].textContent = `${fmt(N.w0, 0)} rad/s`; rd[2].textContent = `${fmt(N.T * 1000, 2)} ms`;
    rd[5].textContent = `${fmt(N.W0 * 1000, 3)} mJ`;
    rd[8].textContent = `${fmt(N.twinM * 1000, 1)} g`; rd[9].textContent = `${sci(N.twinK, 2)} N/m`;
    if (f0First == null) f0First = N.f0;
    if (!halved && (N.f0 <= 0.5 * f0First * (1 + 1e-6) || N.f0 >= 2 * f0First)) { halved = true; onEvent?.("halve", root); }
    last = performance.now(); syncBtn(); draw();
  }

  function draw() {
    const i = Math.min(tr.n - 1, Math.max(0, Math.round(tau / DTAU)));
    const x = closed ? tr.x[i] : 1, xd = closed ? tr.xd[i] : 0;
    const E = x * x, B = xd * xd, heat = Math.max(0, 1 - E - B);
    circuit.set(x, xd, closed, true); twin.set(x, xd);
    bars.set([E, B, E + B, heat]);
    graph.draw({ tr, from: tau < win ? 0 : tau - win, win, upto: closed ? tau : 0, ghost: !closed || tau < win });
    scrub.value = String(Math.min(tau, win));
    const z = (v, d) => (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v);   // no "−0.000" readouts
    const U = z(U0 * x, 2), I = z(-N.Imax * xd, 3);
    rd[3].textContent = minus(`${fmt(U, 2)} V`); rd[4].textContent = minus(`${fmt(I, 3)} A`);
    rd[6].textContent = `${fmt(capEnergy(N.C, U) * 1000, 3)} mJ`; rd[7].textContent = `${fmt(inductorEnergy(N.L, I) * 1000, 3)} mJ`;
    if (closed && !flipped && x <= -0.5) { flipped = true; onEvent?.("slosh", root); }
    if (closed && level > 0 && !damped && E + B < 0.5) { damped = true; onEvent?.("damp", root); }
  }

  function frame(now) {
    if (!root.isConnected) return;          // chapter left: stop animating
    if (playing) {
      // shown time runs SLOW times slower than real time: τ = ω0·t_real = ω0·t_shown / SLOW
      tau += N.w0 * (Math.min(now - last, 50) / 1000 / SLOW) * (slow ? 0.25 : 1);
      if (tau >= TAU_MAX) { tau = TAU_MAX; playing = false; syncBtn(); }
      draw();
    }
    last = now;
    raf = requestAnimationFrame(frame);
  }
  playBtn.addEventListener("click", () => {
    if (!closed) return;
    if (!playing && tau >= TAU_MAX) tau = 0;
    playing = !playing; last = performance.now(); syncBtn(); draw();
  });
  slowPill.addEventListener("click", () => { slow = !slow; slowPill.setAttribute("aria-pressed", String(slow)); });
  scrub.addEventListener("input", () => {
    if (!closed) { closed = true; }
    playing = false; tau = Number(scrub.value); syncBtn(); draw();
  });

  // reduced motion: start closed so the still picture is a meaningful moment (half the energy in each field)
  if (reduced) { closed = true; tau = Math.PI / 4; }
  changed();
  if (!reduced) raf = requestAnimationFrame(frame);
  return root;
}

// ---------------------------------------------------------------------------------------------
// 2. Tune the radio
// ---------------------------------------------------------------------------------------------
export const RADIO = {
  L: 250e-6,                       // H: the radio's coil, 250 µH (fixed)
  cMin: 35, cMax: 360, cStep: 1, cStart: 150,   // pF: the variable capacitor
  fMin: 450, fMax: 1800,           // kHz: the dial
  stations: [{ f: 700 }, { f: 1000 }, { f: 1400 }],   // kHz
  lock: 0.85,                      // reception needed to lock a station
};
/** f0 (kHz) of the radio's circuit for a capacitor of C pF. */
export const radioF0 = (CpF) => lcFrequency(RADIO.L, CpF * 1e-12) / 1000;
/** The capacitor (pF) that tunes exactly to f kHz (ω0 = 1/√(L·C) turned around). */
export const radioC = (fkHz) => (1 / ((2 * Math.PI * fkHz * 1000) ** 2 * RADIO.L)) * 1e12;

export function radioGame(L, onEvent, opts = {}) {
  const preview = !!opts.preview;
  let C = RADIO.cStart, target = 0;
  const found = RADIO.stations.map(() => false);
  const gx = (f) => 14 + ((f - RADIO.fMin) / (RADIO.fMax - RADIO.fMin)) * 292;
  const curve = s("path", { fill: "rgba(255,79,216,.25)", stroke: COL.E, "stroke-width": 3 });
  const marker = s("path", { stroke: COL.B, "stroke-width": 3 });
  const tags = RADIO.stations.map((st, i) => s("g", {},
    s("path", { d: `M${gx(st.f).toFixed(1)} 40V130`, stroke: "#fff", "stroke-width": 2, "stroke-dasharray": "3 4", opacity: 0.8 }),
    s("text", { x: gx(st.f).toFixed(1), y: 32, fill: "#fff", "font-size": 12, "font-weight": 800, "text-anchor": "middle" }, `${st.f}`),
    s("text", { x: gx(st.f).toFixed(1), y: 146, fill: "#c4bce8", "font-size": 11, "font-weight": 700, "text-anchor": "middle" }, L.stations[i])));
  const svg = s("svg", { class: "scene", viewBox: "0 0 320 190", role: "img", "aria-label": L.scene_aria, style: "touch-action: pan-y" },
    s("rect", { width: 320, height: 190, fill: "#0a0826" }),
    s("path", { d: "M14 130H306", stroke: "rgba(255,255,255,.4)", "stroke-width": 1.5 }),
    curve, marker, ...tags,
    s("text", { x: 306, y: 182, fill: "#c4bce8", "font-size": 12, "font-weight": 800, "text-anchor": "end" }, L.axis),
    s("text", { x: 8, y: 14, fill: COL.B, "font-size": 12, "font-weight": 800 }, L.legend));
  const meterFill = s("rect", { x: 6, y: 4, width: 0, height: 16, rx: 5, fill: COL.W });
  const meter = s("svg", { class: "scene", viewBox: "0 0 320 24", role: "img", "aria-label": L.meter_aria, style: "touch-action: pan-y" },
    s("rect", { width: 320, height: 24, fill: "#0a0826" }), s("rect", { x: 6, y: 4, width: 308, height: 16, rx: 5, fill: "rgba(255,255,255,.1)" }),
    s("path", { d: `M${(6 + 308 * RADIO.lock).toFixed(1)} 2V22`, stroke: "#fff", "stroke-width": 2 }), meterFill);
  const pills = RADIO.stations.map((st, i) => h("button", { class: "pill", type: "button", "aria-pressed": String(i === 0) }, `${L.stations[i]} · ${st.f} kHz`));
  const cIn = h("input", { type: "range", min: RADIO.cMin, max: RADIO.cMax, step: RADIO.cStep, value: C, "aria-label": L.c });
  const cOut = h("output");
  const cMinus = h("button", { class: "pill", type: "button", "aria-label": L.c_minus }, "−1 pF");
  const cPlus = h("button", { class: "pill", type: "button", "aria-label": L.c_plus }, "+1 pF");
  const lockBtn = h("button", { class: "btn primary", type: "button" }, L.lock);
  const status = h("p", { class: "verdict", "aria-live": "polite" });
  const rd = [h("b"), h("b"), h("b")];
  const root = h("div", { class: "lab" },
    h("div", { style: "max-width:420px;margin:0 auto;width:100%" }, h("div", { class: "scene-box" }, svg), h("div", { class: "scene-box", style: "margin-top:8px" }, meter)),
    h("div", { class: "controls" },
      h("label", {}, L.pick), h("div", { class: "toggle-row" }, pills),
      h("label", {}, L.c, cOut), cIn, h("div", { class: "toggle-row" }, cMinus, cPlus),
      h("div", { class: "btn-row" }, lockBtn), status),
    h("div", { class: "readout" },
      h("div", {}, h("span", {}, L.r_f0), rd[0]), h("div", {}, h("span", {}, L.r_target), rd[1]), h("div", {}, h("span", {}, L.r_sig), rd[2])));

  const sig = () => strengthAt(RADIO.stations[target].f, radioF0(C));
  function draw() {
    const f0 = radioF0(C);
    cOut.textContent = `${fmt(C, 0)} pF`;
    const pts = [];
    for (let k = 0; k <= 146; k++) {
      const f = RADIO.fMin + ((RADIO.fMax - RADIO.fMin) * k) / 146;
      pts.push(`${k ? "L" : "M"}${gx(f).toFixed(1)} ${(130 - 90 * strengthAt(f, f0)).toFixed(1)}`);
    }
    curve.setAttribute("d", `${pts.join("")}L306 130L14 130Z`);
    marker.setAttribute("d", `M${gx(f0).toFixed(1)} 20V130`);
    const sg = sig();
    meterFill.setAttribute("width", (308 * sg).toFixed(1));
    rd[0].textContent = `${fmt(f0, 0)} kHz`; rd[1].textContent = `${RADIO.stations[target].f} kHz`; rd[2].textContent = `${fmt(sg * 100, 0)} %`;
    pills.forEach((p, i) => { p.textContent = `${found[i] ? "✓ " : ""}${L.stations[i]} · ${RADIO.stations[i].f} kHz`; p.setAttribute("aria-pressed", String(i === target)); });
  }
  pills.forEach((p, i) => p.addEventListener("click", () => { target = i; status.textContent = ""; draw(); }));
  cIn.addEventListener("input", () => { C = Number(cIn.value); status.textContent = ""; draw(); });
  const nudge = (d) => { C = clamp(C + d, RADIO.cMin, RADIO.cMax); cIn.value = String(C); status.textContent = ""; draw(); };
  cMinus.addEventListener("click", () => nudge(-1)); cPlus.addEventListener("click", () => nudge(1));
  lockBtn.addEventListener("click", () => {
    const sg = sig();
    if (sg >= RADIO.lock) {
      found[target] = true; draw();
      status.textContent = fill(L.ok, { name: L.stations[target], f: RADIO.stations[target].f });
      if (found.every(Boolean)) { status.textContent += ` ${L.all}`; onEvent?.("radio", root); }
    } else status.textContent = sg > 0.5 ? L.close : L.static;
  });
  if (preview) { C = Math.round(radioC(RADIO.stations[0].f)); cIn.value = String(C); found.fill(true); }
  draw();
  return root;
}

// ---------------------------------------------------------------------------------------------
// 3. Match the twins (spring quantity → circuit quantity)
// ---------------------------------------------------------------------------------------------
/** L: {lead, prompt, options:[4 circuit names], items:[{spring, answer(index into options), why}], wrong, done_head, done}. */
export function twinMatch(L, onDone, opts = {}) {
  const preview = !!opts.preview;
  let i = 0;
  const body = h("div");
  const root = h("div", {}, body);
  function show() {
    body.replaceChildren();
    if (i >= L.items.length) {
      body.append(h("div", { class: "verdict-row" }, h("p", { class: "verdict" }, L.done_head)), h("p", { class: "small" }, L.done));
      if (!preview) onDone?.(root);
      return;
    }
    const it = L.items[i];
    const note = h("p", { class: "small muted", "aria-live": "polite" });
    const order = L.options.map((_, j) => (j + i * 3 + 1) % L.options.length);   // a different order each round
    const btns = order.map((j) => h("button", { class: "choice", type: "button" }, L.options[j]));
    btns.forEach((b, k) => b.addEventListener("click", () => {
      if (order[k] === it.answer) {
        btns.forEach((x) => (x.disabled = true)); b.classList.add("correct");
        note.textContent = "";
        body.append(h("p", { class: "small" }, it.why), h("button", { class: "btn primary", type: "button", onclick: () => { i++; show(); } }, i + 1 < L.items.length ? L.next : L.finish));
      } else { b.classList.add("wrong"); b.disabled = true; note.textContent = L.wrong; }
    }));
    body.append(h("div", { class: "qf-count" }, `${i + 1} / ${L.items.length}`), h("p", { class: "qf-q" }, fill(L.prompt, { spring: it.spring })), h("div", { class: "choices grid2" }, btns), note);
    if (preview) { btns[order.indexOf(it.answer)].classList.add("correct"); body.append(h("p", { class: "small" }, it.why)); }
  }
  if (preview) { body.replaceChildren(...L.items.map((it) => h("p", { class: "small" }, `${it.spring} ↔ ${L.options[it.answer]}. ${it.why}`))); }
  else show();
  return root;
}
