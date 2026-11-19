// Interactives for chapter f3 (current makes a magnet): the coil + straight-wire lab, the "which end is north?" game
// and the "build a 2 mT electromagnet" game.
//
// Conventions (ONE place, so the drawings, the games and the test recipe cannot disagree):
//  * Maths coordinates: x to the right, y UP, z towards the viewer (right-handed). The coil axis is x.
//  * Screen (SVG) coordinates are converted from maths coordinates only in toX()/toY() and needleDeg().
//  * Current I > 0 in the coil: it flows round the turns from +y towards +z, so on the FRONT strands (nearest the viewer,
//    z > 0) it flows DOWN the screen. Right-hand grip rule: fingers follow the current, thumb = B inside = +x, so the
//    RIGHT end is the north end. I < 0 reverses everything.
//  * Straight wire along z: I > 0 means out of the screen (towards the viewer, drawn as a dot). B goes round
//    ANTICLOCKWISE as seen by the viewer (grip rule). I < 0: into the screen (cross), clockwise.
import { h, s, clear, richInline } from "../dom.js";
import { MU0, fmt, solenoidB } from "../physics.js";

export const EARTH_B = 50e-6;                 // T, "about 50 μT" (a typical size; it varies from place to place)
const D2R = Math.PI / 180;
const PI = Math.PI;
const VW = 400, VH = 250, CX = 200, CY = 125; // lab scene, px
const S = 600;                                // px per metre in the lab scene (50 cm coil = 300 px)
const toX = (x) => CX + x * S;
const toY = (y) => CY - y * S;                // maths y is up, screen y is down
/** Screen rotation (degrees, clockwise-positive) of a needle pointing along the maths vector (bx, by). */
export const needleDeg = (bx, by) => -Math.atan2(by, bx) / D2R;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// PHYSICS (move to physics.js): straight-wire field B = μ0·I/(2π·r). BONUS ONLY in this chapter (used in the bonus panel;
// the lab uses it only for an unlabeled, number-free strength bar).
export const wireB = (I, r) => (MU0 * I) / (2 * PI * r);

/** "Which end is north?" Pure and DOM-free. orient 0 = coil axis horizontal, -90 = axis vertical (picture turned 90° anticlockwise).
 *  frontDown = the current on the strands facing you flows downwards (in the unturned picture). Returns left|right|top|bottom. */
export function northSide(orient, frontDown) {
  const base = frontDown ? "right" : "left";            // unturned picture (see the conventions above)
  if (orient === 0) return base;
  return base === "right" ? "top" : "bottom";           // turning the picture 90° anticlockwise: right -> top, left -> bottom
}
/** The direction the front-strand current has on screen after turning by orient (words used in the question). */
export function frontWord(orient, frontDown) {
  if (orient === 0) return frontDown ? "down" : "up";
  return frontDown ? "right" : "left";                  // down turned 90° anticlockwise = right, up = left
}
/** Which end of the lab coil is north (axis x): +x end for I > 0. */
export const northEnd = (I) => (I > 0 ? "right" : I < 0 ? "left" : null);

/** Format a field strength with a sensible unit, always to 3 significant figures (628 μT, 62.8 mT, 1.26 mT, 2.51 mT). */
export function formatB(B) {
  const sig3 = (v) => { const r = Number(Math.abs(v).toPrecision(3)); return r === 0 ? fmt(0, 2) : fmt(v, Math.max(0, 2 - Math.floor(Math.log10(r)))); };
  const a = Number(Math.abs(B).toPrecision(3));
  if (a < 1e-3) return `${sig3(B * 1e6)} μT`;
  if (a < 1) return `${sig3(B * 1e3)} mT`;
  return `${sig3(B)} T`;
}
/** B as a multiple of Earth's field, printed with sensible digits. */
export function earthTimes(B) {
  const r = Math.abs(B) / EARTH_B;
  return `${fmt(r, r < 1 ? 2 : r < 10 ? 1 : 0).replace(/,/g, " ")} ×`;
}

// ======================================================================================
// Field of a coil: Biot–Savart summed over M loops (each stands for N/M real turns). Used for drawing the field lines
// and for the compass needles. The label B in the lab always comes from the booklet formula (solenoidB).
// ======================================================================================
const SEG = 16, MAX_STEPS = 800;
/** Enough loops that neighbouring ones are closer than ~0.6 radius (a thin long coil needs many), between 10 and 60. */
export const loopCount = (l, D) => clamp(Math.ceil(l / (0.3 * D)), 10, 60);
export function makeCoil(N, l, D, M = loopCount(l, D)) {
  const a = D / 2, segs = new Float64Array(M * SEG * 5);
  let k = 0;
  for (let i = 0; i < M; i++) {
    const xi = -l / 2 + ((i + 0.5) * l) / M;
    for (let j = 0; j < SEG; j++) {
      const phi = ((j + 0.5) * 2 * PI) / SEG, dphi = (2 * PI) / SEG;
      segs[k++] = xi; segs[k++] = a * Math.cos(phi); segs[k++] = a * Math.sin(phi);
      segs[k++] = -Math.sin(phi) * a * dphi; segs[k++] = Math.cos(phi) * a * dphi;   // dl = (0, dly, dlz): increasing phi (y -> z)
    }
  }
  return { N, l, a, M, segs };
}
/** B (tesla) at the point (x, y) of the plane z = 0 (the plane of the picture), for current I. Returns [Bx, By] (y up). */
export function coilFieldAt(coil, x, y, I) {
  const { segs, a } = coil, soft = (0.1 * a) * (0.1 * a);
  let bx = 0, by = 0;
  for (let k = 0; k < segs.length; k += 5) {
    const rx = x - segs[k], ry = y - segs[k + 1], rz = -segs[k + 2], dly = segs[k + 3], dlz = segs[k + 4];
    const r2 = rx * rx + ry * ry + rz * rz + soft, inv = 1 / (r2 * Math.sqrt(r2));
    bx += (dly * rz - dlz * ry) * inv;       // x component of dl × r
    by += dlz * rx * inv;                    // y component of dl × r
  }                                          // (the z component cancels in the plane z = 0 by symmetry)
  const c = ((MU0 / (4 * PI)) * I * coil.N) / coil.M;
  return [c * bx, c * by];
}
function unitDir(coil, x, y) {
  const [bx, by] = coilFieldAt(coil, x, y, 1), m = Math.hypot(bx, by);
  return m > 0 && Number.isFinite(m) ? [bx / m, by / m] : [0, 0];
}
/** Follow the field one way from (x0, y0). sign +1 along B, -1 against it. Returns { pts: [[x, y]...], closed }. Metres. */
export function traceHalf(coil, x0, y0, sign, bounds, maxSteps = MAX_STEPS) {
  const pts = [[x0, y0]];
  let x = x0, y = y0, closed = false, move0 = 0;
  for (let i = 0; i < maxSteps; i++) {
    const dx = Math.max(0, Math.abs(x) - coil.l / 2), dist = Math.hypot(dx, y);
    const ds = clamp(0.1 * (dist + coil.a), 1.5 / S, 5 / S);
    const [d1x, d1y] = unitDir(coil, x, y);
    if (d1x === 0 && d1y === 0) break;
    const [d2x, d2y] = unitDir(coil, x + sign * d1x * ds / 2, y + sign * d1y * ds / 2);   // midpoint (RK2)
    if (d2x === 0 && d2y === 0) break;
    const px = x;
    x += sign * d2x * ds; y += sign * d2y * ds;
    pts.push([x, y]);
    if (i === 0) move0 = Math.sign(x - px);
    if (!Number.isFinite(x) || !Number.isFinite(y)) { pts.pop(); break; }
    if (Math.abs(x) > bounds.x || Math.abs(y) > bounds.y) break;
    // closed: the line comes back through the mid-plane x = 0, moving the same way, on the same side (inside / outside the winding)
    if (i > 20 && move0 !== 0 && px * x <= 0 && Math.sign(x - px) === move0 && y * y0 > 0 && (Math.abs(y0) < coil.a ? Math.abs(y) < coil.a : Math.abs(y) >= coil.a)) { closed = true; pts.push([x0, y0]); break; }
  }
  return { pts, closed };
}
/** Field lines through seeds on the mid-plane x = 0. Returns [{ pts (metres, ordered along B), seedIndex }]. */
export function coilLines(coil, core = false) {
  const a = coil.a, bounds = { x: (VW / 2 + 10) / S, y: (VH / 2 + 10) / S };
  const fr = core ? [-0.9, -0.75, -0.4, -0.2, 0, 0.2, 0.4, 0.75, 0.9, -2.5, 2.5, -4, 4] : [-0.75, -0.4, 0, 0.4, 0.75, -2.5, 2.5, -4, 4];
  const out = [];
  for (const f of fr) {
    const y0 = f * a;
    const fwd = traceHalf(coil, 0, y0, +1, bounds);
    let back = { pts: [[0, y0]], closed: false };
    if (!fwd.closed) back = traceHalf(coil, 0, y0, -1, bounds);
    if (fwd.pts.length > MAX_STEPS || back.pts.length > MAX_STEPS) continue;   // a line that never ends (trapped round one wire) is not drawn
    const pts = back.pts.slice(1).reverse().concat(fwd.pts);
    if (pts.length < 8) continue;
    out.push({ pts, seedIndex: back.pts.length - 1 });
  }
  return out;
}

/** Turn traced lines (metres) into SVG path strings and arrow positions (px) once per geometry. */
export function prepareLines(lines) {
  return lines.map((ln) => {
    const d = ln.pts.filter((_, i) => i % 2 === 0 || i === ln.pts.length - 1).map((p, i) => `${i ? "L" : "M"}${toX(p[0]).toFixed(1)} ${toY(p[1]).toFixed(1)}`).join("");
    const arrows = [];
    for (const idx of [ln.seedIndex, Math.round(ln.seedIndex + (ln.pts.length - ln.seedIndex) * 0.6)]) {
      const p = ln.pts[idx], q = ln.pts[Math.min(idx + 2, ln.pts.length - 1)], pr = ln.pts[Math.max(idx - 2, 0)];
      if (!p || !q || !pr || (q[0] === pr[0] && q[1] === pr[1])) continue;
      arrows.push({ x: toX(p[0]).toFixed(1), y: toY(p[1]).toFixed(1), ang: needleDeg(q[0] - pr[0], q[1] - pr[1]) });
    }
    return { d, arrows };
  });
}

// ---------- drawing helpers ----------
const dash = (c) => ({ stroke: c, "stroke-width": 1.5, "stroke-dasharray": "4 5" });
const arrowPts = (down) => (down ? "M0 4.5L-4 -3.5L4 -3.5Z" : "M0 -4.5L-4 3.5L4 3.5Z");
function slider(label, min, max, step, val, show, set) {
  const out = h("output");
  const inp = h("input", { type: "range", min, max, step, value: val, "aria-label": label });
  const sync = () => { out.textContent = show(Number(inp.value)); };
  inp.addEventListener("input", () => { set(Number(inp.value)); sync(); });
  sync();
  return { nodes: [h("label", {}, label, out), inp], inp, sync };
}
function pill(label, on, pressed = false) {
  const b = h("button", { class: "pill", type: "button", "aria-pressed": String(pressed) }, label);
  b.addEventListener("click", () => on(b));
  return b;
}
/** A small compass: a dark disc with a red north tip. place(x, y, deg, opacity) moves it. */
function makeCompass(r = 10) {
  const needle = s("g", {},
    s("path", { d: `M${r} 0L0 -3.5L0 3.5Z`, fill: "#ff4d6d" }),
    s("path", { d: `M${-r} 0L0 -3.5L0 3.5Z`, fill: "#ffffff" }));
  const g = s("g", {}, s("circle", { r: r + 4, fill: "#16123a", "fill-opacity": 0.88, stroke: "rgba(255,255,255,.55)", "stroke-width": 1.5 }), needle);
  return { g, place(x, y, deg, op = 1) { g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`); needle.setAttribute("transform", `rotate(${deg.toFixed(1)})`); g.setAttribute("opacity", op); } };
}
/** Side-on coil picture: each turn is a faint ellipse; the bright right half is the front strand (nearest the viewer). */
function turns(x0, x1, cy, a, count, rx, frontDown, arrowEvery = 1) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const xi = count === 1 ? (x0 + x1) / 2 : x0 + ((i + 0.5) * (x1 - x0)) / count;
    out.push(s("path", { d: `M${xi} ${cy - a}A${rx} ${a} 0 0 0 ${xi} ${cy + a}`, fill: "none", stroke: "rgba(255,225,77,.35)", "stroke-width": 2 }));
    out.push(s("path", { d: `M${xi} ${cy - a}A${rx} ${a} 0 0 1 ${xi} ${cy + a}`, fill: "none", style: "stroke: var(--a2)", "stroke-width": 3 }));
    if (i % arrowEvery === 0 && frontDown != null) {
      out.push(s("path", { d: arrowPts(frontDown), transform: `translate(${(xi + rx).toFixed(1)} ${cy})`, fill: "#fff" }));
    }
  }
  return out;
}
// (The lab is static: no animation, so there is nothing to switch off for prefers-reduced-motion; every state is a full picture.)

// ======================================================================================
// 1. The lab: coil view and straight-wire view in ONE widget
// ======================================================================================
export const LAB_LIMITS = { Nmin: 10, Nmax: 500, lmin: 5, lmax: 50, Dmin: 2, Dmax: 10, Imax: 5, wireImax: 10, rmin: 2, rmax: 10 };

export function solenoidLab(L, onEvent) {
  const st = { view: "wire", N: 200, lcm: 20, Dcm: 4, Ti: 10 /* tenths of an ampere */, core: false, earth: false, wI2: 6 /* half-amperes */, rcm: 5 };
  let coil = null, prep = null, linesKey = "";

  // ----- scene -----
  const fieldG = s("g", { fill: "none" });
  const coilG = s("g", {});
  const coreR = s("rect", { fill: "#8d92ad", "fill-opacity": 0.5, stroke: "rgba(255,255,255,.4)", "stroke-width": 1.5, rx: 3 });
  const nLab = s("text", { "text-anchor": "middle", "font-size": 16, "font-weight": 800, style: "fill: #ff6b86; font-family: var(--font-body)" }, "N");
  const sLab = s("text", { "text-anchor": "middle", "font-size": 16, "font-weight": 800, style: "fill: #66b8ff; font-family: var(--font-body)" }, "S");
  const earthTag = s("text", { x: 30, y: 36, "font-size": 12, "font-weight": 700, style: "fill: #ffe14d; font-family: var(--font-body)" }, "");
  const earthArrow = s("path", { d: "M18 40L18 26M13 31L18 25L23 31", stroke: "#ffe14d", "stroke-width": 2, fill: "none" });
  const compassesCoil = Array.from({ length: 6 }, () => makeCompass(10));
  const compassesWire = Array.from({ length: 8 }, () => makeCompass(9));
  const coilView = s("g", {}, coreR, fieldG, coilG, nLab, sLab, ...compassesCoil.map((c) => c.g), earthTag, earthArrow);
  const wireField = s("g", { fill: "none" });
  const wireMark = s("g", {});
  const wireView = s("g", {}, wireField, wireMark, ...compassesWire.map((c) => c.g));
  const svg = s("svg", { class: "scene", viewBox: `0 0 ${VW} ${VH}`, role: "img", "aria-label": L.scene_wire, style: "touch-action: pan-y" },
    s("rect", { width: VW, height: VH, fill: "#0a0826" }), coilView, wireView);

  // ----- controls -----
  const iText = (v) => (v === 0 ? `0.0 A` : `${v > 0 ? "+" : "−"}${fmt(Math.abs(v) / 10, 1)} A`);
  const sN = slider(L.turns, LAB_LIMITS.Nmin, LAB_LIMITS.Nmax, 10, st.N, (v) => `${v}`, (v) => { st.N = v; draw(); });
  const sL = slider(L.length, LAB_LIMITS.lmin, LAB_LIMITS.lmax, 1, st.lcm, (v) => `${v} cm`, (v) => { st.lcm = v; draw(); });
  const sD = slider(L.width, LAB_LIMITS.Dmin, LAB_LIMITS.Dmax, 1, st.Dcm, (v) => `${v} cm`, (v) => { st.Dcm = v; draw(); });
  const sI = slider(L.current, -LAB_LIMITS.Imax * 10, LAB_LIMITS.Imax * 10, 1, st.Ti, iText, (v) => { const prev = st.Ti; st.Ti = v; flip(prev, v, "coil"); draw(); });
  const sW = slider(L.current, -LAB_LIMITS.wireImax * 2, LAB_LIMITS.wireImax * 2, 1, st.wI2, (v) => (v === 0 ? "0.0 A" : `${v > 0 ? "+" : "−"}${fmt(Math.abs(v) / 2, 1)} A`), (v) => { const prev = st.wI2; st.wI2 = v; flip(prev, v, "wire"); draw(); });
  const sR = slider(L.ring, LAB_LIMITS.rmin, LAB_LIMITS.rmax, 1, st.rcm, (v) => `${v} cm`, (v) => { st.rcm = v; draw(); });
  function flip(prev, now, ev) { if (prev !== 0 && now !== 0 && Math.sign(prev) !== Math.sign(now)) onEvent?.(ev, root); }
  const revCoil = h("button", { class: "btn", type: "button" }, L.reverse);
  revCoil.addEventListener("click", () => { const prev = st.Ti; st.Ti = -st.Ti; sI.inp.value = st.Ti; sI.sync(); flip(prev, st.Ti, "coil"); draw(); });
  const revWire = h("button", { class: "btn", type: "button" }, L.reverse);
  revWire.addEventListener("click", () => { const prev = st.wI2; st.wI2 = -st.wI2; sW.inp.value = st.wI2; sW.sync(); flip(prev, st.wI2, "wire"); draw(); });
  const coreBtn = pill(L.core, (b) => { st.core = !st.core; b.setAttribute("aria-pressed", String(st.core)); draw(); });
  const earthBtn = pill(L.earth, (b) => { st.earth = !st.earth; b.setAttribute("aria-pressed", String(st.earth)); draw(); });
  const viewBtns = [["wire", L.view_wire], ["coil", L.view_coil]].map(([k, label]) => {
    const b = pill(label, () => { st.view = k; draw(); }, k === st.view);
    b.dataset.view = k;
    return b;
  });

  const nVal = h("b"), bVal = h("b"), eVal = h("b"), endVal = h("b");
  const formula = h("div", { class: "formula", style: "white-space: pre-wrap" });
  const status = h("p", { class: "small", "aria-live": "polite" });
  const shortNote = h("p", { class: "small muted", hidden: true }, L.short_note);
  const dirVal = h("b"), strVal = h("b");
  const bar = h("div", { style: "height:14px;border-radius:7px;background:rgba(255,255,255,.14);overflow:hidden;margin-top:6px" });
  const barFill = h("div", { style: "height:100%;width:0%;background:var(--a2)" });
  bar.append(barFill);
  const wireStatus = h("p", { class: "small", "aria-live": "polite" });

  const coilCtl = h("div", {}, ...sN.nodes, ...sL.nodes, ...sD.nodes, ...sI.nodes,
    h("div", { class: "toggle-row" }, coreBtn, earthBtn),
    h("div", { class: "btn-row" }, revCoil), status, shortNote,
    h("div", { class: "readout" },
      h("div", {}, h("span", {}, L.n_per_m), nVal),
      h("div", {}, h("span", {}, L.b_inside), bVal),
      h("div", {}, h("span", {}, L.vs_earth), eVal),
      h("div", {}, h("span", {}, L.north_end), endVal)),
    formula);
  const wireCtl = h("div", {}, ...sW.nodes, ...sR.nodes,
    h("div", { class: "btn-row" }, revWire), wireStatus,
    h("div", { class: "readout" },
      h("div", {}, h("span", {}, L.w_dir), dirVal),
      h("div", {}, h("span", {}, L.w_strength), strVal, bar)));

  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:480px;margin:0 auto" }, svg)),
    h("div", { class: "controls" }, h("div", { class: "toggle-row", style: "margin-top:0" }, viewBtns), coilCtl, wireCtl));

  // ----- drawing -----
  function drawCoil() {
    const N = st.N, l = st.lcm / 100, D = st.Dcm / 100, I = st.Ti / 10, a = D / 2;
    const key = `${l}|${D}|${st.core}`;
    if (key !== linesKey) { coil = makeCoil(N, l, D); prep = prepareLines(coilLines(coil, st.core)); linesKey = key; }
    coil.N = N;                                   // N only scales the field, not its shape
    const halfPx = (l / 2) * S, aPx = a * S, cy = CY;
    // iron core
    coreR.setAttribute("x", CX - halfPx); coreR.setAttribute("y", cy - aPx * 0.62); coreR.setAttribute("width", 2 * halfPx); coreR.setAttribute("height", aPx * 1.24);
    coreR.setAttribute("opacity", st.core ? 1 : 0);
    // field lines
    clear(fieldG);
    const B = solenoidB(N, l, I);
    if (I !== 0) {
      const strong = clamp(0.45 + (0.55 * Math.log10(1 + Math.abs(B) / 1e-5)) / 3.5, 0.45, 1);
      const w = st.core ? 2.6 : 1.7, flipArrow = I < 0 ? 180 : 0;
      for (const ln of prep) {
        fieldG.append(s("path", { d: ln.d, stroke: "#ffe14d", "stroke-width": w, "stroke-opacity": strong, "stroke-linecap": "round" }));
        for (const ar of ln.arrows) {
          fieldG.append(s("path", { d: "M5 0L-4 -4L-4 4Z", transform: `translate(${ar.x} ${ar.y}) rotate(${(ar.ang + flipArrow).toFixed(1)})`, fill: "#ffe14d", "fill-opacity": strong }));
        }
      }
    }
    // windings
    clear(coilG);
    const drawn = Math.round(6 + ((N - LAB_LIMITS.Nmin) / (LAB_LIMITS.Nmax - LAB_LIMITS.Nmin)) * 18);
    const spacing = (2 * halfPx) / drawn;
    coilG.append(...turns(CX - halfPx, CX + halfPx, cy, aPx, drawn, Math.min(5, aPx * 0.4), I === 0 ? null : I > 0, Math.max(1, Math.ceil(16 / spacing))));
    // pole labels
    const end = northEnd(I);
    nLab.setAttribute("opacity", end ? 1 : 0); sLab.setAttribute("opacity", end ? 1 : 0);
    const xr = CX + halfPx, xl = CX - halfPx, ly = cy - aPx - 10;
    nLab.setAttribute("x", end === "left" ? xl : xr); sLab.setAttribute("x", end === "left" ? xr : xl);
    nLab.setAttribute("y", ly); sLab.setAttribute("y", ly);
    // compasses: the field of the coil (+ Earth's, if switched on, pointing up the screen)
    const pos = [[0, 0], [-l / 2 - 0.05, 0], [l / 2 + 0.05, 0], [0, a + 0.05], [0, -(a + 0.05)], [0.35 * l, a + 0.05]];
    pos.forEach(([x, y], i) => {
      let [bx, by] = coilFieldAt(coil, x, y, I);
      if (st.earth) by += EARTH_B;
      const m = Math.hypot(bx, by);
      compassesCoil[i].place(toX(x), toY(y), m > 0 ? needleDeg(bx, by) : -90, I === 0 && !st.earth ? 0.4 : 1);   // no field at all: needle drawn pointing up, faded
    });
    earthTag.textContent = st.earth ? L.earth_tag : ""; earthArrow.setAttribute("opacity", st.earth ? 1 : 0);
    // readouts (the label B is always the booklet formula)
    nVal.textContent = `${fmt(N / l, 0).replace(/,/g, " ")} ${L.per_m}`;
    bVal.textContent = st.core && I !== 0 ? L.core_b : formatB(Math.abs(B));   // size of B (the direction is shown by the N end)
    eVal.textContent = st.core && I !== 0 ? L.core_vs : I === 0 ? "—" : earthTimes(B);
    endVal.textContent = end === "right" ? L.right_end : end === "left" ? L.left_end : "—";
    formula.textContent = st.core && I !== 0
      ? L.core_formula
      : `B = μ0·n·I = 4π × 10⁻⁷ × ${fmt(N / l, 0).replace(/,/g, " ")} × ${fmt(Math.abs(I), 1)} = ${formatB(Math.abs(B))}`;
    status.textContent = I === 0 ? L.s_zero : st.core ? L.s_core : end === "right" ? L.s_right : L.s_left;
    shortNote.hidden = l >= 5 * D;
    svg.setAttribute("aria-label", L.scene_coil);
  }

  function drawWire() {
    const I = st.wI2 / 2, rPx = 8 + 9.5 * st.rcm;
    clear(wireField); clear(wireMark);
    const rel = Math.abs(I) / st.rcm / (LAB_LIMITS.wireImax / LAB_LIMITS.rmin);   // 0..1, only used for a number-free bar
    barFill.style.width = `${(clamp(rel, 0, 1) * 100).toFixed(0)}%`;
    // circles: field lines; thinner and fainter further out
    for (const r of [30, 50, 75, 100]) {
      const op = I === 0 ? 0 : clamp(0.3 + 0.7 * (30 / r) * Math.min(1, Math.abs(I) / 4), 0.2, 1);
      wireField.append(s("circle", { cx: CX, cy: CY, r, stroke: "#ffe14d", "stroke-width": (3.2 * (30 / r) ** 0.6).toFixed(2), "stroke-opacity": op.toFixed(2), "stroke-dasharray": I === 0 ? "3 6" : null }));
      if (I !== 0) {
        const th = 45 * D2R, px = CX + r * Math.cos(th), py = CY - r * Math.sin(th);
        const tx = -Math.sin(th) * Math.sign(I), ty = Math.cos(th) * Math.sign(I);        // tangent in maths coordinates: anticlockwise for I > 0
        wireField.append(s("path", { d: "M6 0L-4 -5L-4 5Z", transform: `translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${needleDeg(tx, ty).toFixed(1)})`, fill: "#ffe14d", "fill-opacity": op.toFixed(2) }));
      }
    }
    // the wire itself: dot (out of the screen) or cross (into the screen)
    wireMark.append(s("circle", { cx: CX, cy: CY, r: 11, fill: "#b4562f", stroke: "#fff", "stroke-width": 2 }));
    if (I > 0) wireMark.append(s("circle", { cx: CX, cy: CY, r: 3.5, fill: "#fff" }));
    else if (I < 0) wireMark.append(s("path", { d: `M${CX - 5} ${CY - 5}L${CX + 5} ${CY + 5}M${CX + 5} ${CY - 5}L${CX - 5} ${CY + 5}`, stroke: "#fff", "stroke-width": 2.5 }));
    // ring of compasses: each needle lies along the circle, anticlockwise for I > 0
    compassesWire.forEach((c, k) => {
      const th = k * 45 * D2R, x = Math.cos(th), y = Math.sin(th);
      if (I === 0) { c.place(CX + rPx * x, CY - rPx * y, -90, 0.4); return; }
      const sg = Math.sign(I);
      c.place(CX + rPx * x, CY - rPx * y, needleDeg(-y * sg, x * sg), 1);
    });
    dirVal.textContent = I > 0 ? L.w_out : I < 0 ? L.w_in : "—";
    strVal.textContent = I === 0 ? L.w_none : rel > 0.66 ? L.w_strong : rel > 0.25 ? L.w_medium : L.w_weak;
    wireStatus.textContent = I === 0 ? L.ws_zero : I > 0 ? L.ws_out : L.ws_in;
    svg.setAttribute("aria-label", L.scene_wire);
  }

  function draw() {
    const coilOn = st.view === "coil";
    coilView.setAttribute("display", coilOn ? "inline" : "none"); wireView.setAttribute("display", coilOn ? "none" : "inline");
    coilCtl.hidden = !coilOn; wireCtl.hidden = coilOn;
    viewBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === st.view)));
    if (coilOn) drawCoil(); else drawWire();
  }
  draw();
  return root;
}

// ======================================================================================
// 2. "Which end is north?" game (4 rounds, grip rule)
// ======================================================================================
export const ENDS_ROUNDS = [{ orient: 0, frontDown: true }, { orient: 0, frontDown: false }, { orient: -90, frontDown: true }, { orient: -90, frontDown: false }];

export function endsGame(L, onWin) {
  let round = 0, score = 0;
  const body = h("div");
  const root = h("div", {}, body);
  const GC = 150, GY = 100, HALF = 70, A = 30;
  function sideLabel(side) { return L[side]; }
  function endPos(side) { // where the N/S letters go
    return { left: [GC - HALF - 22, GY + 6], right: [GC + HALF + 22, GY + 6], top: [GC, GY - HALF - 14], bottom: [GC, GY + HALF + 22] }[side];
  }
  function next() {
    clear(body);
    if (round >= ENDS_ROUNDS.length) {
      body.append(h("div", { class: "verdict-row" }, h("p", { class: "verdict" }, score === ENDS_ROUNDS.length ? L.perfect : L.done.replace("{n}", score))),
        h("button", { class: "btn", type: "button", onclick: () => { round = 0; score = 0; next(); } }, L.again));
      if (score >= 3) onWin?.(root);
      return;
    }
    const r = ENDS_ROUNDS[round], ans = northSide(r.orient, r.frontDown), word = frontWord(r.orient, r.frontDown);
    const horizontal = r.orient === 0;
    const sides = horizontal ? ["left", "right"] : ["top", "bottom"];
    const g = s("g", { transform: r.orient ? `rotate(${r.orient} ${GC} ${GY})` : null },
      s("path", { d: `M${GC - HALF - 18} ${GY - A}L${GC - HALF} ${GY - A}M${GC + HALF} ${GY + A}L${GC + HALF + 18} ${GY + A}`, stroke: "rgba(255,255,255,.5)", "stroke-width": 2 }),
      ...turns(GC - HALF, GC + HALF, GY, A, 7, 7, r.frontDown, 1));
    const letters = s("g", {});
    const svg = s("svg", { class: "scene", viewBox: "0 0 300 200", role: "img", style: "touch-action: pan-y",
      "aria-label": L.scene.replace("{dir}", L["dir_" + word]) }, s("rect", { width: 300, height: 200, fill: "#0a0826" }), g, letters);
    const fb = h("div", { "aria-live": "polite" });
    const btns = sides.map((sd) => h("button", { class: "choice", type: "button" }, sideLabel(sd)));
    btns.forEach((b, i) => b.addEventListener("click", () => {
      const ok = sides[i] === ans;
      if (ok) score++;
      btns.forEach((x, j) => { x.disabled = true; x.classList.toggle("correct", sides[j] === ans); x.classList.toggle("wrong", j === i && !ok); });
      const other = sides.find((sd) => sd !== ans);
      const [nx, ny] = endPos(ans), [sx, sy] = endPos(other);
      letters.append(s("text", { x: nx, y: ny, "text-anchor": "middle", "font-size": 22, "font-weight": 800, style: "fill:#ff6b86;font-family:var(--font-body)" }, "N"),
        s("text", { x: sx, y: sy, "text-anchor": "middle", "font-size": 22, "font-weight": 800, style: "fill:#66b8ff;font-family:var(--font-body)" }, "S"));
      fb.append(h("p", { class: "small" }, h("strong", {}, ok ? L.ok_label : L.no_label), " ", richInline(L.grip.replace("{dir}", L["dir_" + word]).replace("{end}", sideLabel(ans)))),
        h("button", { class: "btn primary", type: "button", onclick: () => { round++; next(); } }, round + 1 < ENDS_ROUNDS.length ? L.next : L.finish));
    }));
    body.append(h("div", { class: "qf-count" }, `${round + 1} / ${ENDS_ROUNDS.length}`),
      h("p", { class: "qf-q" }, L.prompt.replace("{dir}", L["dir_" + word])),
      h("div", { class: "scene-box", style: "max-width:340px;margin:0 auto" }, svg),
      h("div", { class: "choices grid2" }, btns), fb);
  }
  next();
  return root;
}

// ======================================================================================
// 3. "Build a 2 mT electromagnet" game
// ======================================================================================
export const BUILD = { target: 2e-3, tol: 0.05, Imax: 3.0, defaults: { N: 100, lcm: 20, Ti: 10 } };
/** The B (T) of a coil of N turns, length l (cm) and current I (tenths of an ampere). Air core. */
export const buildB = (N, lcm, Ti) => solenoidB(N, lcm / 100, Ti / 10);
export const buildOK = (B) => Math.abs(B - BUILD.target) <= BUILD.tol * BUILD.target;

export function buildGame(L, winEl, onWin) {
  const st = { ...BUILD.defaults };
  let tries = 0, won = false;
  const sN = slider(L.turns, 10, 500, 10, st.N, (v) => `${v}`, (v) => { st.N = v; clearResult(); syncN(); });
  const sL = slider(L.length, 5, 50, 1, st.lcm, (v) => `${v} cm`, (v) => { st.lcm = v; clearResult(); syncN(); });
  const sI = slider(L.current, 1, BUILD.Imax * 10, 1, st.Ti, (v) => `${fmt(v / 10, 1)} A`, (v) => { st.Ti = v; clearResult(); });
  const nVal = h("b"), bVal = h("b"), tVal = h("b");
  const verdict = h("p", { class: "verdict", "aria-live": "polite" });
  const win = h("div", { hidden: true }, winEl);
  const hint = h("p", { class: "small muted", hidden: true }, L.hint);
  const test = h("button", { class: "btn primary", type: "button" }, L.test);
  const hintBtn = pill(L.hint_btn, (b) => { hint.hidden = !hint.hidden; b.setAttribute("aria-pressed", String(!hint.hidden)); });
  function syncN() { nVal.textContent = `${fmt(st.N / (st.lcm / 100), 0).replace(/,/g, " ")} ${L.per_m}`; }
  function clearResult() { bVal.textContent = "—"; verdict.textContent = ""; }
  test.addEventListener("click", () => {
    const B = buildB(st.N, st.lcm, st.Ti);
    tries++; tVal.textContent = String(tries);
    bVal.textContent = formatB(B);
    if (buildOK(B)) {
      verdict.textContent = L.ok;
      win.hidden = false;
      if (!won) { won = true; onWin?.(test); }
    } else verdict.textContent = B < BUILD.target ? L.too_weak : L.too_strong;
  });
  syncN(); clearResult(); tVal.textContent = "0";
  return h("div", { class: "lab" }, h("div", { class: "controls" },
    ...sN.nodes, ...sL.nodes, ...sI.nodes,
    h("div", { class: "btn-row" }, test, hintBtn), hint, verdict,
    h("div", { class: "readout" },
      h("div", {}, h("span", {}, L.n_per_m), nVal),
      h("div", {}, h("span", {}, L.target), h("b", {}, L.target_val)),
      h("div", {}, h("span", {}, L.measured), bVal),
      h("div", {}, h("span", {}, L.tests), tVal)),
    win));
}
