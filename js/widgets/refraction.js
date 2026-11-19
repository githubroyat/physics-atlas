// Interactives for chapter o10 (superposition, reflection, refraction, TIR, dispersion):
//  1. pulseDemo      two pulses on a rope: add the displacements, they pass through each other
//  2. refractionLab  a ray at a boundary: rays / wavefronts / Huygens wavelets, material picks, TIR
//  3. criticalGame   find the critical angle of a mystery material
//  4. prismLab       a white beam through a prism, with and without n depending on the colour (qualitative)
// Angles are measured from the normal. Booklet: α_i = α_r and sin α1 / sin α2 = n2/n1 = c1/c2.
import { h, s, richInline } from "../dom.js";
import { DEG, refractAngle, criticalAngle, fmt } from "../physics.js";

const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Typical textbook indices for yellow light (about 589 nm), rounded: air 1.0003 (used as 1.00), water 1.333,
// crown glass about 1.5, diamond 2.417. Rounded to the values the chapter prints.
export const MATERIALS = [
  { key: "air", n: 1.0 },
  { key: "water", n: 1.33 },
  { key: "glass", n: 1.5 },
  { key: "diamond", n: 2.42 },
];
export const MYSTERY_N = 1.6;

const C_IN = "#ffe14d", C_REF = "#7ee7ff", C_TRA = "#ff8ad8";
const dash = (c) => ({ stroke: c, "stroke-width": 1.5, "stroke-dasharray": "4 5" });

function pill(label, on) {
  const b = h("button", { class: "pill", type: "button", "aria-pressed": "false" }, label);
  b.addEventListener("click", () => on(b));
  return b;
}
function slider(label, min, max, step, val, show, set) {
  const out = h("output");
  const inp = h("input", { type: "range", min, max, step, value: val, "aria-label": label });
  const sync = () => { out.textContent = show(Number(inp.value)); };
  inp.addEventListener("input", () => { set(Number(inp.value)); sync(); });
  sync();
  return { nodes: [h("label", {}, label, out), inp], inp, sync, out };
}
/** Put a text with subscripts (α_{1}) into an SVG <text>: textContent would print the braces. */
function setSub(el, str) {
  const tmp = s("text", {}, str);
  el.replaceChildren(...tmp.childNodes);
}
const arrowD = (x, y, dx, dy) => { // small triangle with its tip at (x, y) pointing along (dx, dy)
  const px = -dy, py = dx;
  return `M${x.toFixed(1)} ${y.toFixed(1)}L${(x - 11 * dx + 5 * px).toFixed(1)} ${(y - 11 * dy + 5 * py).toFixed(1)}L${(x - 11 * dx - 5 * px).toFixed(1)} ${(y - 11 * dy - 5 * py).toFixed(1)}Z`;
};
const toSvgFactory = (svg) => (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };

// ======================================================================================
// Pure physics helpers (exported so node can check every number)
// ======================================================================================

/**
 * One ray from medium 1 (index n1) to medium 2 (index n2) at angle a (degrees from the normal, 0..90).
 * kind: "same" (equal indices, nothing happens), "refract", "critical" (refracted ray skims the boundary),
 *       "tir" (total internal reflection). beta = refracted angle (NaN for tir), reflect = α_r, crit = critical angle (NaN if none).
 */
// PHYSICS (move to physics.js): one ray at a boundary, built on refractAngle and criticalAngle.
export function traceRay(n1, n2, a) {
  const alpha = Math.min(90, Math.max(0, a));
  const crit = criticalAngle(n1, n2);
  if (Math.abs(n1 - n2) < 1e-9) return { kind: "same", alpha, beta: alpha, reflect: NaN, crit };
  const sv = (n1 * Math.sin(alpha * DEG)) / n2;
  if (sv > 1 + 1e-9) return { kind: "tir", alpha, beta: NaN, reflect: alpha, crit };
  if (Math.abs(sv - 1) <= 1e-9) return { kind: "critical", alpha, beta: 90, reflect: alpha, crit };
  return { kind: "refract", alpha, beta: refractAngle(n1, n2, alpha), reflect: alpha, crit };
}

/** Two pulses on a rope (Gaussian bumps, width w). Pulse 1 starts at x = −x0 moving right, pulse 2 at +x0 moving left, speed v. */
export const PULSE = { v: 50, x0: 100, w: 18, T: 4 };
export const pulseShape = (u, w = PULSE.w) => Math.exp(-((u / w) ** 2));
export function pulseAt(A1, A2, x, tau) {
  const y1 = A1 * pulseShape(x - (-PULSE.x0 + PULSE.v * tau));
  const y2 = A2 * pulseShape(x - (PULSE.x0 - PULSE.v * tau));
  return { y1, y2, y: y1 + y2 };
}

/** Vector form of Snell's law. d: unit travel direction, m: unit normal pointing to the side the ray comes from. null = TIR. */
// PHYSICS (move to physics.js): Snell's law in vector form.
export function refractVec(d, m, n1, n2) {
  const cos1 = -(d.x * m.x + d.y * m.y);
  const r = n1 / n2;
  const k = 1 - r * r * (1 - cos1 * cos1);
  if (k < 0) return null;
  const c = r * cos1 - Math.sqrt(k);
  return { x: r * d.x + c * m.x, y: r * d.y + c * m.y };
}

// Equilateral prism, apex 60°, side 180 (screen units, y down).
const SQ3 = Math.sqrt(3);
const PA = { x: 150, y: 60 }, PB = { x: 60, y: 60 + 90 * SQ3 }, PC = { x: 240, y: 60 + 90 * SQ3 };
const N_AB = { x: -SQ3 / 2, y: -0.5 }, N_AC = { x: SQ3 / 2, y: -0.5 };      // outward normals of the two sloping faces
const P1 = { x: (PA.x + PB.x) / 2, y: (PA.y + PB.y) / 2 };
const cross = (a, b) => a.x * b.y - a.y * b.x;
export const PRISM_ANGLE = 60;

/** Trace a beam of index n through the prism, entering the left face at incidence angle a1 (degrees from the normal). */
export function prismTrace(a1, n) {
  const phi = (30 - a1) * DEG;                       // the inward normal of the left face points 30° below the x axis
  const d0 = { x: Math.cos(phi), y: Math.sin(phi) };
  const t1 = refractVec(d0, N_AB, 1, n);
  const e = { x: PC.x - PA.x, y: PC.y - PA.y };
  const sP = cross({ x: PA.x - P1.x, y: PA.y - P1.y }, e) / cross(t1, e);
  const P2 = { x: P1.x + sP * t1.x, y: P1.y + sP * t1.y };
  const t2 = refractVec(t1, { x: -N_AC.x, y: -N_AC.y }, n, 1);   // null: total internal reflection at the second face
  const dev = t2 ? Math.acos(Math.max(-1, Math.min(1, d0.x * t2.x + d0.y * t2.y))) / DEG : NaN;
  return { d0, t1, P1, P2, t2, dev, tir: !t2 };
}
// Illustrative indices for the picture only: a deliberately exaggerated spread (real glass spreads the colours much less).
export const COLOURS = [
  { key: "red", n: 1.50, col: "#ff4d4d" }, { key: "orange", n: 1.52, col: "#ff9f43" }, { key: "yellow", n: 1.54, col: "#ffe14d" },
  { key: "green", n: 1.56, col: "#4dff88" }, { key: "blue", n: 1.58, col: "#4da6ff" }, { key: "violet", n: 1.60, col: "#b266ff" },
];
export const PRISM_MEAN_N = 1.55;

/** Segment (p, q) clipped to the half-plane above (y ≤ cy) or below (y ≥ cy); null if nothing is left. */
export function clipHalf(p, q, cy, keepAbove) {
  const f = (pt) => (keepAbove ? cy - pt.y : pt.y - cy);
  const a = f(p), b = f(q);
  if (a < 0 && b < 0) return null;
  if (a >= 0 && b >= 0) return [p, q];
  const t = a / (a - b);
  const m = { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
  return a >= 0 ? [p, m] : [m, q];
}

// ======================================================================================
// 1. Two pulses on a rope
// ======================================================================================
export function pulseDemo(L, onEvent) {
  const W = 340, H = 230, BASE = 118, PX = 1.3, CMPX = 13;               // 1 cm of pulse height = 13 px
  let A1 = 3, A2 = 3, tau = 0.8, raf = 0, last = 0, playing = false;
  const reduced = rm();
  const seen = { up: false, cancel: false };
  const X = (x) => W / 2 + x * PX;
  const path = (fn) => { let d = ""; for (let x = -125; x <= 125; x += 2.5) d += `${d ? "L" : "M"}${X(x).toFixed(1)} ${(BASE - fn(x) * CMPX).toFixed(1)}`; return d; };

  const pA = s("path", { fill: "none", stroke: C_REF, "stroke-width": 2.5, "stroke-dasharray": "6 5" });
  const pB = s("path", { fill: "none", stroke: C_IN, "stroke-width": 2.5, "stroke-dasharray": "6 5" });
  const pS = s("path", { fill: "none", stroke: "#fff", "stroke-width": 4.5, "stroke-linecap": "round", "stroke-linejoin": "round" });
  const svg = s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: "#0a0826" }),
    s("path", { d: `M0 ${BASE}H${W}`, ...dash("rgba(255,255,255,.35)") }),
    s("path", { d: `M${W / 2} 14V${H - 14}`, ...dash("rgba(255,255,255,.25)") }),
    pA, pB, pS,
    s("text", { x: 8, y: 20, fill: C_REF, "font-size": 12, "font-weight": 800 }, L.legend_a),
    s("text", { x: 8, y: 36, fill: C_IN, "font-size": 12, "font-weight": 800 }, L.legend_b),
    s("text", { x: 8, y: 52, fill: "#fff", "font-size": 12, "font-weight": 800 }, L.legend_sum));

  const aVal = h("b"), bVal = h("b"), sVal = h("b");
  const status = h("p", { class: "small", "aria-live": "polite" });
  const sa = slider(L.height_a, -4, 4, 1, A1, (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)} cm`, (v) => { A1 = v; draw(); });
  const sb = slider(L.height_b, -4, 4, 1, A2, (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)} cm`, (v) => { A2 = v; draw(); });
  const st = slider(L.time, 0, PULSE.T, 0.05, tau, (v) => `${fmt(v, 2)} s`, (v) => { tau = v; draw(); });
  const play = h("button", { class: "btn primary", type: "button" }, L.play);
  const sgn = (v) => (Math.abs(v) < 0.005 ? "0.0 cm" : `${v > 0 ? "+" : "−"}${fmt(Math.abs(v), 1)} cm`);

  function draw() {
    pA.setAttribute("d", path((x) => pulseAt(A1, A2, x, tau).y1));
    pB.setAttribute("d", path((x) => pulseAt(A1, A2, x, tau).y2));
    pS.setAttribute("d", path((x) => pulseAt(A1, A2, x, tau).y));
    const m = pulseAt(A1, A2, 0, tau);
    aVal.textContent = sgn(m.y1); bVal.textContent = sgn(m.y2); sVal.textContent = sgn(m.y);
    st.inp.value = String(tau); st.sync();
    const meeting = Math.abs(tau - PULSE.T / 2) <= 0.2;
    if (A1 === 0 || A2 === 0) status.textContent = L.st_one;
    else if (meeting) status.textContent = A1 * A2 > 0 ? L.st_up : (A1 + A2 === 0 ? L.st_flat : L.st_part);
    else status.textContent = tau < PULSE.T / 2 - 0.2 ? L.st_before : L.st_after;
    if (meeting && A1 !== 0 && A2 !== 0) {
      if (A1 * A2 > 0) seen.up = true; else seen.cancel = true;
      if (seen.up && seen.cancel && !seen.done) { seen.done = true; onEvent?.("pulses", sVal); }
    }
  }
  function stop() { cancelAnimationFrame(raf); playing = false; play.textContent = L.play; }
  function frame(now) {
    if (!playing) return;
    if (!root.isConnected) { stop(); return; }
    tau += Math.min(now - last, 50) / 1000; last = now;
    if (tau > PULSE.T) tau = 0;
    draw();
    raf = requestAnimationFrame(frame);
  }
  play.addEventListener("click", () => {
    if (playing) { stop(); return; }
    playing = true; play.textContent = L.pause; last = performance.now(); raf = requestAnimationFrame(frame);
  });
  for (const el of [sa.inp, sb.inp, st.inp]) el.addEventListener("input", () => { if (el === st.inp && playing) stop(); });

  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:380px;margin:0 auto" }, svg)),
    h("div", { class: "controls" }, ...sa.nodes, ...sb.nodes, ...st.nodes,
      reduced ? null : h("div", { class: "btn-row" }, play),
      status,
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.r_a), aVal),
        h("div", {}, h("span", {}, L.r_b), bVal),
        h("div", {}, h("span", {}, L.r_sum), sVal))));
  if (reduced) tau = PULSE.T / 2;                        // still picture at the moment they overlap
  draw();
  return root;
}

// ======================================================================================
// 2. The boundary lab
// ======================================================================================
export function refractionLab(L, onEvent) {
  const W = 360, H = 300, CX = 180, CY = 150, R = 128;
  let armed = false, i1 = 0, i2 = 2, alpha = 40, mode = "rays", dragging = false, raf = 0, last = 0, phase = 0.25;
  const reduced = rm();
  const seen = { bend: false, tir: false };
  const nA = () => MATERIALS[i1].n, nB = () => MATERIALS[i2].n;

  // ----- scene -----
  const bgTop = s("rect", { x: 0, y: 0, width: W, height: CY });
  const bgBot = s("rect", { x: 0, y: CY, width: W, height: H - CY });
  const tag1 = s("text", { x: 10, y: 20, fill: "#fff", "font-size": 13, "font-weight": 800 });
  const tag2 = s("text", { x: 10, y: H - 10, fill: "#fff", "font-size": 13, "font-weight": 800 });
  const line = (c, w) => s("path", { fill: "none", stroke: c, "stroke-width": w, "stroke-linecap": "round" });
  const fronts = { inc: line(C_IN, 2), ref: line(C_REF, 2), tra: line(C_TRA, 2) };
  const frontsG = s("g", {}, fronts.inc, fronts.ref, fronts.tra);
  const wvG = s("g");
  const rIn = line(C_IN, 4), rRe = line(C_REF, 4), rTr = line(C_TRA, 4);
  const aIn = s("path", { fill: C_IN }), aRe = s("path", { fill: C_REF }), aTr = s("path", { fill: C_TRA });
  const arcIn = s("path", { fill: "none", stroke: C_IN, "stroke-width": 2 });
  const arcRe = s("path", { fill: "none", stroke: C_REF, "stroke-width": 2 });
  const arcTr = s("path", { fill: "none", stroke: C_TRA, "stroke-width": 2 });
  const halo = { style: "paint-order: stroke; stroke: #0a0826; stroke-width: 3px", "font-size": 13, "font-weight": 800, "text-anchor": "middle" };
  const lIn = s("text", { fill: C_IN, ...halo }), lRe = s("text", { fill: C_REF, ...halo }), lTr = s("text", { fill: C_TRA, ...halo });
  const disc = s("circle", { r: 13, fill: C_IN, stroke: "#fff", "stroke-width": 3 });
  const handle = s("g", { class: "drag-handle", tabindex: "0", role: "slider", "aria-label": L.drag,
    "aria-valuemin": 0, "aria-valuemax": 90, "aria-valuenow": 40 }, disc);
  const svg = s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: "#0a0826" }), bgTop, bgBot,
    s("path", { d: `M0 ${CY}H${W}`, stroke: "#fff", "stroke-width": 2 }),
    s("path", { d: `M${CX} ${CY - 140}V${CY + 140}`, ...dash("rgba(255,255,255,.55)") }),
    frontsG, wvG, rIn, rRe, rTr, aIn, aRe, aTr, arcIn, arcRe, arcTr, lIn, lRe, lTr,
    s("circle", { cx: CX, cy: CY, r: 4, fill: "#fff" }), tag1, tag2, handle);

  // ----- controls & readouts -----
  const v = { a1: h("b"), ar: h("b"), a2: h("b"), crit: h("b"), spd: h("b"), wav: h("b") };
  const live = h("div", { class: "formula" });
  const status = h("p", { class: "small", "aria-live": "polite" });
  const note = h("p", { class: "small muted" });
  const sl = slider(L.angle, 0, 90, 1, alpha, (x) => `${fmt(x, 0)}°`, (x) => { alpha = x; draw(); });
  const pillsOf = (which) => MATERIALS.map((m, i) => {
    const b = pill(`${L.materials[m.key]} (${fmt(m.n, 2)})`, () => { if (which === 1) i1 = i; else i2 = i; syncPills(); draw(); });
    b.dataset.i = String(i);
    return b;
  });
  const pills1 = pillsOf(1), pills2 = pillsOf(2);
  const syncPills = () => {
    pills1.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.i) === i1)));
    pills2.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.i) === i2)));
  };
  const critBtn = h("button", { class: "btn", type: "button" }, L.go_crit);
  critBtn.addEventListener("click", () => { const c = criticalAngle(nA(), nB()); if (Number.isFinite(c)) setAlpha(c); });
  const modes = [["rays", L.m_rays], ["fronts", L.m_fronts], ["wavelets", L.m_wavelets]];
  const modePills = modes.map(([key, label]) => { const b = pill(label, () => setMode(key)); b.dataset.mode = key; return b; });
  const syncModes = () => modePills.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));

  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:400px;margin:0 auto" }, svg),
      h("p", { class: "small muted", style: "margin:8px 0 0;text-align:center" }, L.drag_hint)),
    h("div", { class: "controls" },
      h("label", {}, L.view), h("div", { class: "toggle-row", style: "margin-top:4px" }, modePills),
      h("label", { style: "margin-top:10px" }, L.top), h("div", { class: "toggle-row", style: "margin-top:4px" }, pills1),
      h("label", { style: "margin-top:10px" }, L.bottom), h("div", { class: "toggle-row", style: "margin-top:4px" }, pills2),
      ...sl.nodes,
      h("div", { class: "btn-row" }, critBtn),
      status, note,
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, "α_{1}"), v.a1),
        h("div", {}, h("span", {}, "α_{r}"), v.ar),
        h("div", {}, h("span", {}, "α_{2}"), v.a2),
        h("div", {}, h("span", {}, L.r_crit), v.crit),
        h("div", {}, h("span", {}, L.r_speed), v.spd),
        h("div", {}, h("span", {}, L.r_wave), v.wav)),
      live));

  // ----- drawing -----
  const P = (x, y) => ({ x, y });
  const pt = (p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  /** Wavefront lines of one beam: crests at s = (k + phase)·lam along d, each a segment of length w across the beam. */
  function beamPath(d, e, lam, w, s0, s1, above) {
    let out = "";
    for (let k = Math.floor(s0 / lam - phase); (k + phase) * lam <= s1; k++) {
      const sp = (k + phase) * lam;
      const p = P(CX + sp * d.x - (w / 2) * e.x, CY + sp * d.y - (w / 2) * e.y);
      const q = P(CX + sp * d.x + (w / 2) * e.x, CY + sp * d.y + (w / 2) * e.y);
      const c = clipHalf(p, q, CY, above);
      if (c) out += `M${pt(c[0])}L${pt(c[1])}`;
    }
    return out;
  }
  function drawFronts(N1, N2) {
    const av = Math.min(alpha, 89), tv = traceRay(N1, N2, av);       // at 90° the beam is infinitely wide on the boundary: stop at 89°
    const sa = Math.sin(av * DEG), ca = Math.cos(av * DEG), lam = 24, w = 64;
    fronts.inc.setAttribute("d", beamPath(P(sa, ca), P(ca, -sa), lam, w, -330, 120, true));
    fronts.ref.setAttribute("d", tv.kind === "same" ? "" : beamPath(P(sa, -ca), P(ca, sa), lam, w, -120, 330, true));
    let tra = "";
    if (tv.kind === "refract" || tv.kind === "same") {
      const sb = Math.sin(tv.beta * DEG), cb = Math.cos(tv.beta * DEG), w2 = (w * cb) / ca;
      if (w2 >= 1) tra = beamPath(P(sb, cb), P(cb, -sb), (lam * N1) / N2, w2, -120, 330, false);
    }
    fronts.tra.setAttribute("d", tra);
  }
  const arcPath = (cx, cy, r, x, y, sweep) => `M${cx.toFixed(1)} ${cy.toFixed(1)}A${r} ${r} 0 0 ${sweep} ${x.toFixed(1)} ${y.toFixed(1)}`;
  function drawWavelets(tr, N1, N2) {
    const items = [];
    const sa = Math.sin(alpha * DEG), ca = Math.cos(alpha * DEG), X0 = CX - 100, D = 18, NW = 9, R0 = 80;
    const xLast = X0 + (NW - 1) * D, ratio = N1 / N2;
    const xHit = sa > 1e-9 ? X0 + R0 / sa : Infinity;               // where the incident wavefront touches the boundary now
    for (let i = 0; i < NW; i++) {
      const x = X0 + i * D, r1 = R0 - (x - X0) * sa;
      items.push(s("circle", { cx: x, cy: CY, r: 2.5, fill: "#fff" }));
      if (r1 < 1) continue;
      if (tr.kind !== "same") items.push(s("path", { d: arcPath(x - r1, CY, r1, x + r1, CY, 1), fill: "none", stroke: C_REF, "stroke-width": 1.3, opacity: 0.8 }));
      items.push(s("path", { d: arcPath(x - r1 * ratio, CY, r1 * ratio, x + r1 * ratio, CY, 0), fill: "none", stroke: C_TRA, "stroke-width": 1.3, opacity: tr.kind === "tir" ? 0.35 : 0.85,
        ...(tr.kind === "tir" ? { "stroke-dasharray": "3 4" } : {}) }));
    }
    const xb = Math.min(xLast, xHit);
    const env = (colour, f) => { const p = f(X0), q = f(xb); return s("path", { d: `M${pt(p)}L${pt(q)}`, stroke: colour, "stroke-width": 3.5, "stroke-linecap": "round" }); };
    if (tr.kind !== "same") items.push(env(C_REF, (x) => P(x + (R0 - (x - X0) * sa) * sa, CY - (R0 - (x - X0) * sa) * ca)));
    if (tr.kind === "refract" || tr.kind === "critical" || tr.kind === "same") {
      const sb = Math.sin(tr.beta * DEG), cb = Math.cos(tr.beta * DEG);
      items.push(env(C_TRA, (x) => { const r2 = (R0 - (x - X0) * sa) * ratio; return P(x + r2 * sb, CY + r2 * cb); }));
    }
    if (sa > 1e-9 && xHit <= W + 80) items.push(s("path", { d: `M${xHit.toFixed(1)} ${CY}L${(xHit + 90 * ca).toFixed(1)} ${(CY - 90 * sa).toFixed(1)}`, stroke: C_IN, "stroke-width": 3.5, "stroke-linecap": "round" }));
    wvG.replaceChildren(...items);
  }

  function draw() {
    const N1 = nA(), N2 = nB(), tr = traceRay(N1, N2, alpha), a = tr.alpha;
    const sa = Math.sin(a * DEG), ca = Math.cos(a * DEG);
    bgTop.setAttribute("fill", `rgba(126,231,255,${(0.04 + 0.13 * (N1 - 1)).toFixed(3)})`);
    bgBot.setAttribute("fill", `rgba(126,231,255,${(0.04 + 0.13 * (N2 - 1)).toFixed(3)})`);
    setSub(tag1, `${L.materials[MATERIALS[i1].key]}  n = ${fmt(N1, 2)}`);
    setSub(tag2, `${L.materials[MATERIALS[i2].key]}  n = ${fmt(N2, 2)}`);
    sl.inp.value = String(Math.round(a)); sl.sync(); sl.out.textContent = `${fmt(a, Number.isInteger(a) ? 0 : 1)}°`;

    // rays: thick in "rays" view, thin hints in the wave views
    const thick = mode === "rays" ? 4 : 1.5, op = mode === "rays" ? 1 : 0.6;
    for (const r of [rIn, rRe, rTr]) { r.setAttribute("stroke-width", thick); r.setAttribute("opacity", op); }
    rIn.setAttribute("d", `M${(CX - R * sa).toFixed(1)} ${(CY - R * ca).toFixed(1)}L${CX} ${CY}`);
    aIn.setAttribute("d", arrowD(CX - 62 * sa, CY - 62 * ca, sa, ca));
    const showRe = tr.kind !== "same";
    rRe.setAttribute("d", showRe ? `M${CX} ${CY}L${(CX + R * sa).toFixed(1)} ${(CY - R * ca).toFixed(1)}` : "");
    aRe.setAttribute("d", showRe ? arrowD(CX + 90 * sa, CY - 90 * ca, sa, -ca) : "");
    rRe.setAttribute("opacity", mode === "rays" ? (tr.kind === "tir" || tr.kind === "critical" ? 1 : 0.4) : 0.6);
    aRe.setAttribute("opacity", tr.kind === "tir" || tr.kind === "critical" ? 1 : 0.4);
    const showTr = tr.kind !== "tir";
    const sb = showTr ? Math.sin(tr.beta * DEG) : 0, cb = showTr ? Math.cos(tr.beta * DEG) : 0;
    rTr.setAttribute("d", showTr ? `M${CX} ${CY}L${(CX + R * sb).toFixed(1)} ${(CY + R * cb).toFixed(1)}` : "");
    aTr.setAttribute("d", showTr ? arrowD(CX + 90 * sb, CY + 90 * cb, sb, cb) : "");

    // angle arcs and labels (measured from the dashed normal)
    const r1 = 44, r2 = 56;
    arcIn.setAttribute("d", a > 0.5 ? arcPath(CX, CY - r1, r1, CX - r1 * sa, CY - r1 * ca, 0) : "");
    arcRe.setAttribute("d", showRe && a > 0.5 ? arcPath(CX, CY - r2, r2, CX + r2 * sa, CY - r2 * ca, 1) : "");
    arcTr.setAttribute("d", showTr && tr.beta > 0.5 ? arcPath(CX, CY + r1, r1, CX + r1 * sb, CY + r1 * cb, 0) : "");
    const lab = (el, txt, sign, ang, rad, flip) => { setSub(el, txt); el.setAttribute("x", (CX + sign * rad * Math.sin(ang * DEG)).toFixed(1)); el.setAttribute("y", (CY + flip * rad * Math.cos(ang * DEG) + 5).toFixed(1)); };
    lab(lIn, `α_{1} ${fmt(a, 1)}°`, -1, Math.max(a / 2, 22), 88, -1);
    if (showRe) lab(lRe, `α_{r} ${fmt(a, 1)}°`, 1, Math.max(a / 2, 22), 88, -1); else lRe.replaceChildren();
    if (showTr) lab(lTr, `α_{2} ${fmt(tr.beta, 1)}°`, 1, Math.max(tr.beta / 2, 22), 88, 1); else lTr.replaceChildren();

    handle.setAttribute("transform", `translate(${(CX - R * sa).toFixed(1)} ${(CY - R * ca).toFixed(1)})`);
    handle.setAttribute("aria-valuenow", String(Math.round(a)));
    handle.setAttribute("aria-valuetext", `${fmt(a, 1)}°`);

    // wave views
    frontsG.style.display = mode === "fronts" ? "" : "none";
    wvG.style.display = mode === "wavelets" ? "" : "none";
    if (mode === "fronts") drawFronts(N1, N2);
    else if (mode === "wavelets") drawWavelets(tr, N1, N2);

    // readouts
    v.a1.textContent = `${fmt(a, 1)}°`;
    v.ar.textContent = showRe ? `${fmt(a, 1)}°` : L.none;
    v.a2.textContent = showTr ? `${fmt(tr.beta, 1)}°` : L.none;
    v.crit.textContent = Number.isFinite(tr.crit) ? `${fmt(tr.crit, 1)}°` : L.none;
    v.spd.textContent = fmt(N2 / N1, 2);
    v.wav.textContent = fmt(N1 / N2, 2);
    critBtn.disabled = !Number.isFinite(tr.crit);
    // live Snell line (0/0 at 0°: say so instead of printing nonsense)
    if (tr.kind === "tir") live.replaceChildren(richInline(L.live_tir.replace("{x}", fmt((N1 * sa) / N2, 2))));
    else if (a < 1e-9) live.replaceChildren(richInline(L.live_zero.replace("{r}", fmt(N2 / N1, 2))));
    else live.replaceChildren(richInline(`sin ${fmt(a, 1)}° / sin ${fmt(tr.beta, 1)}° = ${fmt(sa / Math.sin(tr.beta * DEG), 2)}  =  n_{2} / n_{1} = ${fmt(N2, 2)} / ${fmt(N1, 2)} = ${fmt(N2 / N1, 2)}`));

    // status
    let msg;
    if (tr.kind === "same") msg = L.st_same;
    else if (tr.kind === "tir") msg = L.st_tir;
    else if (tr.kind === "critical") msg = L.st_crit;
    else if (a < 1e-9) msg = L.st_zero;
    else if (a >= 90) msg = L.st_graze;
    else msg = N2 > N1 ? L.st_toward : L.st_away;
    status.replaceChildren(richInline(msg));
    note.replaceChildren(richInline(mode === "fronts" ? (a > 89 ? L.n_fronts89 : (tr.kind === "tir" ? L.n_fronts_tir : L.n_fronts))
      : mode === "wavelets" ? (tr.kind === "tir" ? L.n_wave_tir : (a < 1e-9 ? L.n_wave_zero : L.n_wave)) : ""));

    if (armed && !seen.bend && tr.kind === "refract" && Math.abs(tr.beta - a) >= 5) { seen.bend = true; onEvent?.("bend", status); }
    if (!seen.tir && tr.kind === "tir") { seen.tir = true; onEvent?.("tir", status); }
  }

  // ----- animation (wavefront view only) -----
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  function frame(now) {
    if (mode !== "fronts") { raf = 0; return; }
    if (!root.isConnected) { raf = 0; return; }
    phase = (phase + (Math.min(now - last, 50) / 1000) * 0.5) % 1; last = now;     // the same frequency (0.5 Hz here) in both media
    drawFronts(nA(), nB());
    raf = requestAnimationFrame(frame);
  }
  function setMode(m) {
    mode = m; syncModes(); stop(); draw();
    if (mode === "fronts" && !reduced) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function setAlpha(a) { alpha = Math.max(0, Math.min(90, a)); draw(); }

  // ----- dragging -----
  const toSvg = toSvgFactory(svg);
  handle.addEventListener("pointerdown", (e) => {
    dragging = true; e.preventDefault();
    try { handle.setPointerCapture(e.pointerId); } catch { /* capture is a nicety */ }
  });
  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const p = toSvg(e), ux = CX - p.x, uy = CY - p.y;
    if (Math.hypot(ux, uy) < 1) return;                         // exactly on the pivot: keep the old angle
    const a = Math.atan2(ux, uy) / DEG;                           // 0 = straight up, 90 = along the boundary on the left
    setAlpha(a < -90 ? 90 : a);
  });
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) handle.addEventListener(ev, () => { dragging = false; });
  handle.addEventListener("keydown", (e) => {
    const step = { ArrowRight: -1, ArrowUp: -1, ArrowLeft: 1, ArrowDown: 1, PageUp: 10, PageDown: -10 }[e.key];
    if (step) { e.preventDefault(); setAlpha(Math.round(alpha) + step); }
    else if (e.key === "Home") { e.preventDefault(); setAlpha(0); }
    else if (e.key === "End") { e.preventDefault(); setAlpha(90); }
  });

  syncPills(); syncModes(); draw(); armed = true;
  return root;
}

// ======================================================================================
// 3. Critical-angle game: find the angle where the refracted ray just disappears
// ======================================================================================
export function criticalGame(L, winContent, onWin) {
  const W = 360, H = 270, CX = 180, CY = 135, R = 118, TOL = 1;
  let alpha = 20, tries = 0, won = false;
  const line = (c, w) => s("path", { fill: "none", stroke: c, "stroke-width": w, "stroke-linecap": "round" });
  const rIn = line(C_IN, 4), rRe = line(C_REF, 4), rTr = line(C_TRA, 4);
  const disc = s("circle", { cx: 0, cy: 0, r: 11, fill: C_IN, stroke: "#fff", "stroke-width": 3 });
  const src = s("g", {}, disc);
  const svg = s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: "#0a0826" }),
    s("rect", { x: 0, y: 0, width: W, height: CY, fill: "rgba(126,231,255,.16)" }),
    s("path", { d: `M0 ${CY}H${W}`, stroke: "#fff", "stroke-width": 2 }),
    s("path", { d: `M${CX} ${CY - 125}V${CY + 125}`, ...dash("rgba(255,255,255,.5)") }),
    rIn, rRe, rTr, src,
    s("text", { x: 10, y: 20, fill: "#fff", "font-size": 13, "font-weight": 800 }, L.top_tag),
    s("text", { x: 10, y: H - 10, fill: "#fff", "font-size": 13, "font-weight": 800 }, L.bottom_tag));
  const aVal = h("b"), eVal = h("b"), tVal = h("b");
  const verdict = h("p", { class: "verdict", "aria-live": "polite" });
  const win = h("div", { class: "reveal", hidden: true }, winContent);
  const sl = slider(L.angle, 0, 90, 0.5, alpha, (x) => `${fmt(x, 1)}°`, (x) => { alpha = x; draw(); });
  const go = h("button", { class: "btn primary", type: "button" }, L.check);

  function draw() {
    const tr = traceRay(MYSTERY_N, 1, alpha), sa = Math.sin(alpha * DEG), ca = Math.cos(alpha * DEG);
    rIn.setAttribute("d", `M${(CX - R * sa).toFixed(1)} ${(CY - R * ca).toFixed(1)}L${CX} ${CY}`);
    rRe.setAttribute("d", `M${CX} ${CY}L${(CX + R * sa).toFixed(1)} ${(CY - R * ca).toFixed(1)}`);
    rRe.setAttribute("opacity", tr.kind === "tir" ? 1 : 0.35);
    if (tr.kind === "tir") rTr.setAttribute("d", "");
    else { const sb = Math.sin(tr.beta * DEG), cb = Math.cos(tr.beta * DEG); rTr.setAttribute("d", `M${CX} ${CY}L${(CX + R * sb).toFixed(1)} ${(CY + R * cb).toFixed(1)}`); }
    src.setAttribute("transform", `translate(${(CX - R * sa).toFixed(1)} ${(CY - R * ca).toFixed(1)})`);
    aVal.textContent = `${fmt(alpha, 1)}°`;
    eVal.textContent = tr.kind === "tir" ? L.no : L.yes;
    sl.inp.value = String(alpha); sl.sync();
  }
  go.addEventListener("click", () => {
    tries++; tVal.textContent = String(tries);
    const crit = criticalAngle(MYSTERY_N, 1), d = alpha - crit;
    if (Math.abs(d) <= TOL) {
      verdict.textContent = L.ok;
      if (!won) { won = true; win.hidden = false; onWin?.(go); }
    } else verdict.textContent = d < 0 ? L.too_small : L.too_big;
  });
  tVal.textContent = "0";
  draw();
  return h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:400px;margin:0 auto" }, svg)),
    h("div", { class: "controls" }, ...sl.nodes, h("div", { class: "btn-row" }, go),
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, "α_{1}"), aVal),
        h("div", {}, h("span", {}, L.escapes), eVal),
        h("div", {}, h("span", {}, L.tries), tVal),
        h("div", {}, h("span", {}, L.target), h("b", {}, `± ${TOL}°`))),
      verdict, win));
}

// ======================================================================================
// 4. Prism: a white beam, with and without n depending on the colour (qualitative picture)
// ======================================================================================
export function prismLab(L, onEvent) {
  const W = 380, H = 270;
  let a1 = 50, disp = true, seen = false, sawOff = false;
  const prism = s("path", { d: `M${PA.x} ${PA.y}L${PC.x} ${PC.y}L${PB.x} ${PB.y}Z`, fill: "rgba(126,231,255,.16)", stroke: "#fff", "stroke-width": 2, "stroke-linejoin": "round" });
  const inc = s("path", { fill: "none", stroke: "#fff", "stroke-width": 4, "stroke-linecap": "round" });
  const rayG = s("g");
  const svg = s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: "#0a0826" }), prism, inc, rayG);
  const rVal = h("b"), vVal = h("b"), eVal = h("b");
  const status = h("p", { class: "small", "aria-live": "polite" });
  const sl = slider(L.angle, 40, 80, 1, a1, (x) => `${fmt(x, 0)}°`, (x) => { a1 = x; draw(); });
  const bDisp = pill(L.disp, () => { disp = !disp; bDisp.setAttribute("aria-pressed", String(disp)); draw(); });
  bDisp.setAttribute("aria-pressed", "true");
  const seg = (p, q, col, w, op = 1) => s("path", { d: `M${p.x.toFixed(1)} ${p.y.toFixed(1)}L${q.x.toFixed(1)} ${q.y.toFixed(1)}`, stroke: col, "stroke-width": w, "stroke-linecap": "round", opacity: op });

  function draw() {
    const list = disp ? COLOURS : [{ key: "white", n: PRISM_MEAN_N, col: "#fff" }];
    const t0 = prismTrace(a1, list[0].n);
    inc.setAttribute("d", `M${(P1.x - 100 * t0.d0.x).toFixed(1)} ${(P1.y - 100 * t0.d0.y).toFixed(1)}L${P1.x.toFixed(1)} ${P1.y.toFixed(1)}`);
    const items = [];
    const res = {};
    for (const c of list) {
      const tr = prismTrace(a1, c.n);
      res[c.key] = tr;
      items.push(seg(tr.P1, tr.P2, c.col, 2.5, 0.9));
      if (tr.t2) items.push(seg(tr.P2, { x: tr.P2.x + 150 * tr.t2.x, y: tr.P2.y + 150 * tr.t2.y }, c.col, 2.5, 0.95));
    }
    rayG.replaceChildren(...items);
    const red = prismTrace(a1, COLOURS[0].n), vio = prismTrace(a1, COLOURS[5].n);
    rVal.textContent = disp && red.t2 ? `${fmt(red.dev, 1)}°` : (disp ? L.trapped : "—");
    vVal.textContent = disp && vio.t2 ? `${fmt(vio.dev, 1)}°` : (disp ? L.trapped : "—");
    const wt = prismTrace(a1, PRISM_MEAN_N);
    eVal.textContent = wt.t2 ? `${fmt(wt.dev, 1)}°` : L.trapped;
    status.textContent = disp ? (red.t2 && vio.t2 ? L.st_on : L.st_trap) : L.st_off;
    if (!disp) sawOff = true;
    if (disp && sawOff && red.t2 && vio.t2 && !seen) { seen = true; onEvent?.("prism", status); }
  }
  draw();
  return h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:420px;margin:0 auto" }, svg)),
    h("div", { class: "controls" }, ...sl.nodes,
      h("div", { class: "toggle-row" }, bDisp), status,
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.r_red), rVal),
        h("div", {}, h("span", {}, L.r_violet), vVal),
        h("div", {}, h("span", {}, L.r_mean), eVal))));
}
