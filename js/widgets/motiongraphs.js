// Interactives for chapter i1 (position as a function of time): the motion-graphs lab, the match-the-graph game and
// the charge-in-a-field lab.
// Model: straight-line motion with constant acceleration, closed form (no integrator), the booklet's
//   s(t) = s0 + v0·t + ½·a·t²,   v(t) = v0 + a·t   (posAt / velAt in physics.js).
// The direction we call positive is chosen first; speeds, velocities and accelerations carry signs.
// Imports only dom.js and physics.js so the pure helpers can be loaded in node.
import { h, s, rich } from "../dom.js";
import { G, posAt, velAt, chargeAcc, uniformField, E_CHARGE, M_ELECTRON, M_PROTON, sci, fmt } from "../physics.js";

const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const COL = { s: "#ffe14d", v: "#2ef2ff", a: "#ff4fd8" };   // position yellow, velocity cyan, acceleration pink
let uid = 0;

// ---------- pure helpers (exported so they can be checked in node) ----------
export const LIMITS = { s0: [-10, 20], v0: [-10, 10], a: [-10, 10], T: [2, 10] };
/** Position, velocity, area under v–t (trapezoid, computed independently) and displacement at time t. */
export function motionAt(p, t) {
  const sv = posAt(p.s0, p.v0, p.a, t), v = velAt(p.v0, p.a, t);
  return { s: sv, v, a: p.a, area: ((p.v0 + v) / 2) * t, disp: sv - p.s0 };
}
/** Time at which v reaches 0 (only if the motion is slowing down at t = 0); null otherwise. No division when a = 0. */
export const stopTime = (v0, a) => (a !== 0 && v0 * a < 0 ? -v0 / a : null);
/** Slider snapping for a: the lab can hold exactly −g (free fall); everything else snaps to 0.5 m/s². */
export const snapA = (v) => (Math.abs(v + G) < 0.15 ? -G : clamp(Math.round(v * 2) / 2, LIMITS.a[0], LIMITS.a[1]));
const niceStep = (raw) => { const b = 10 ** Math.floor(Math.log10(raw)), m = raw / b; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * b; };
/** A tidy axis range that contains lo, hi and 0, with a little padding. */
export function niceRange(lo, hi, minSpan = 2) {
  lo = Math.min(lo, 0); hi = Math.max(hi, 0);
  if (hi - lo < minSpan) { const mid = (hi + lo) / 2; lo = mid - minSpan / 2; hi = mid + minSpan / 2; }
  const pad = 0.1 * (hi - lo);
  const step = niceStep((hi - lo + 2 * pad) / 4);
  return { lo: Math.floor((lo - pad) / step) * step, hi: Math.ceil((hi + pad) / step) * step, step };
}
/** Extremes of s, v and a over [0, T] (s may turn round inside the window). */
export function windowExtremes(p, T) {
  const ts = [0, T], tst = stopTime(p.v0, p.a);
  if (tst != null && tst < T) ts.push(tst);
  const sv = ts.map((t) => posAt(p.s0, p.v0, p.a, t)), vv = [p.v0, velAt(p.v0, p.a, T)];
  return { s: [Math.min(...sv), Math.max(...sv)], v: [Math.min(...vv), Math.max(...vv)], a: [p.a, p.a] };
}
const num = (x, d = 1) => fmt(Math.abs(x) < 0.5 * 10 ** -d ? 0 : x, d);   // never prints −0.0
const numA = (a) => (Number.isInteger(a * 2) ? num(a, 1) : num(a, 2));
const arrow = (x, y, dx, dy, color) => {
  const len = Math.hypot(dx, dy);
  if (len < 3) return s("circle", { cx: x, cy: y, r: 2, fill: color });
  const ux = dx / len, uy = dy / len, hx = x + dx, hy = y + dy;
  return s("g", {}, s("path", { d: `M${x} ${y}L${hx} ${hy}`, stroke: color, "stroke-width": 3, "stroke-linecap": "round" }),
    s("path", { d: `M${hx} ${hy}L${hx - 7 * ux + 4 * uy} ${hy - 7 * uy - 4 * ux}L${hx - 7 * ux - 4 * uy} ${hy - 7 * uy + 4 * ux}Z`, fill: color }));
};
const tickLabel = (v) => (Math.abs(v) >= 100 || Number.isInteger(v) ? String(Math.round(v)).replace("-", "−") : num(v, 1));

// ---------- the lab ----------
const PRESETS = {
  constant: { s0: 0, v0: 3, a: 0, T: 6, vert: false },
  brake: { s0: 0, v0: 10, a: -2.5, T: 6, vert: false },
  drop: { s0: 20, v0: 0, a: -G, T: 2, vert: true },
  up: { s0: 0, v0: 10, a: -G, T: 2, vert: true },
};
export const LAB_PRESETS = PRESETS;

/** The motion-graphs lab: an object on a track, with s–t, v–t and a–t drawn together. onEvent("run" | "brake", el). */
export function motionLab(L, onEvent) {
  const P = { s0: 0, v0: 2, a: 1, T: 6, vert: false };
  let t = 2, playing = false, last = 0, touched = false, byTime = false, dragging = false, rangeKey = "";
  const W = 340, GX = 40, GW = 292, GH = 100;
  const boxes = { s: { x: GX, y: 140, w: GW, h: GH }, v: { x: GX, y: 262, w: GW, h: GH }, a: { x: GX, y: 384, w: GW, h: GH } };
  const clipId = `mg${++uid}`;
  const clips = s("clipPath", { id: clipId }, ...Object.values(boxes).map((b) => s("rect", { x: b.x, y: b.y, width: b.w, height: b.h })));
  const clipS = s("clipPath", { id: `${clipId}s` }, s("rect", { x: boxes.s.x, y: boxes.s.y, width: boxes.s.w, height: boxes.s.h }));
  const gridG = s("g"), trackG = s("g"), objG = s("g");
  const clipAttr = { "clip-path": `url(#${clipId})` };
  const full = {}, live = {};
  for (const k of ["s", "v", "a"]) {
    full[k] = s("path", { fill: "none", stroke: COL[k], "stroke-width": 2, opacity: 0.35, ...clipAttr });
    live[k] = s("path", { fill: "none", stroke: COL[k], "stroke-width": 3.5, "stroke-linecap": "round", ...clipAttr });
  }
  const areaPos = s("path", { fill: COL.v, opacity: 0.4, ...clipAttr }), areaNeg = s("path", { fill: COL.a, opacity: 0.4, ...clipAttr });
  const tangent = s("path", { stroke: "#fff", "stroke-width": 2, "stroke-dasharray": "5 4", fill: "none", "clip-path": `url(#${clipId}s)` });
  const cursor = s("path", { stroke: "rgba(255,255,255,.55)", "stroke-width": 1.5, "stroke-dasharray": "3 4" });
  const dots = { v: s("circle", { r: 4.5, fill: "#fff" }), a: s("circle", { r: 4.5, fill: "#fff" }) };
  const handleDot = s("circle", { r: 7, fill: "#fff", stroke: COL.s, "stroke-width": 3 });
  const handle = s("g", { class: "drag-handle", tabindex: 0, role: "slider", "aria-label": L.drag, "aria-valuemin": 0, "aria-valuemax": P.T, "aria-valuenow": t, style: "outline-offset:2px" },
    s("circle", { r: 18, fill: "transparent" }), handleDot);
  const svg = s("svg", { class: "scene", viewBox: `0 0 ${W} 500`, role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: W, height: 500, fill: "#0a0826" }), clips, clipS, trackG, objG, gridG,
    areaPos, areaNeg, full.s, full.v, full.a, live.s, live.v, live.a, tangent, cursor, dots.v, dots.a, handle);

  // --- controls ---
  const outs = {};
  const mkSlider = (key, label, lim, step, set, show) => {
    const out = h("output"), inp = h("input", { type: "range", min: lim[0], max: lim[1], step, value: P[key], "aria-label": label });
    inp.addEventListener("input", () => { set(Number(inp.value)); touched = true; byTime = false; update(); });
    outs[key] = { out, inp, show };
    return [h("label", {}, label, out), inp];
  };
  const sS0 = mkSlider("s0", L.labels.s0, LIMITS.s0, 1, (v) => (P.s0 = v), (v) => `${num(v, 0)} m`);
  const sV0 = mkSlider("v0", L.labels.v0, LIMITS.v0, 0.5, (v) => (P.v0 = v), (v) => `${num(v, 1)} m/s`);
  const sA = mkSlider("a", L.labels.a, LIMITS.a, 0.01, (v) => { P.a = snapA(v); outs.a.inp.value = P.a; }, (v) => `${numA(v)} m/s²`);
  outs.a.inp.addEventListener("keydown", (e) => {            // arrow keys move in 0.5 steps and can reach both ends and −g
    const dir = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    P.a = snapA(P.a + dir * 0.5); outs.a.inp.value = P.a; touched = true; byTime = false; update();
  });
  const sT = mkSlider("T", L.labels.T, LIMITS.T, 1, (v) => { P.T = v; t = Math.min(t, v); }, (v) => `${num(v, 0)} s`);
  const tIn = h("input", { type: "range", min: 0, max: P.T, step: 0.05, value: t, "aria-label": L.time });
  const tOut = h("output");
  tIn.addEventListener("input", () => { playing = false; t = Number(tIn.value); touched = true; byTime = true; update(); });

  const runBtn = h("button", { class: "btn primary", type: "button" }, L.run);
  const resetBtn = h("button", { class: "btn", type: "button" }, L.reset);
  const vertBtn = h("button", { class: "pill", type: "button", "aria-pressed": "false" }, L.vertical);
  vertBtn.addEventListener("click", () => { P.vert = !P.vert; touched = true; byTime = false; update(); });
  const presetBtns = Object.keys(PRESETS).map((k) => {
    const b = h("button", { class: "pill", type: "button" }, L.presets[k]);
    b.addEventListener("click", () => { Object.assign(P, PRESETS[k]); t = Math.min(2, P.T); playing = false; touched = true; byTime = false; update(); });
    return b;
  });
  const ro = {};
  const roBox = (key) => { ro[key] = h("b"); return h("div", {}, h("span", {}, L.readout[key]), ro[key]); };
  const readout = h("div", { class: "readout" }, ...["t", "s", "v", "slope_s", "slope_v", "area", "disp"].map(roBox));
  const status = h("p", { class: "small", "aria-live": "polite" });
  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box" }, svg)),
    h("div", { class: "controls" },
      h("div", { class: "btn-row", style: "margin-top:0" }, ...presetBtns), h("div", { class: "btn-row", style: "margin-top:8px" }, vertBtn),
      ...sS0, ...sV0, ...sA, ...sT, h("label", {}, L.time, tOut), tIn,
      h("div", { class: "btn-row" }, runBtn, resetBtn), readout, status));

  // --- drawing ---
  const rng = {};
  const gx = (tt) => GX + (tt / P.T) * GW;
  const gy = (k, v) => { const b = boxes[k], r = rng[k]; return b.y + b.h - ((v - r.lo) / (r.hi - r.lo)) * b.h; };
  const pt = (sv) => {                                         // position on the track strip
    const f = (sv - rng.s.lo) / (rng.s.hi - rng.s.lo);
    return P.vert ? { x: 170, y: 112 - f * 104 } : { x: 24 + f * 292, y: 56 };
  };
  const curve = (k, fn, t1) => {
    let d = "";
    const n = Math.max(2, Math.round(60 * (t1 / P.T)));
    for (let i = 0; i <= n; i++) { const tt = (i / n) * t1; d += `${i ? "L" : "M"}${gx(tt).toFixed(1)} ${gy(k, fn(tt)).toFixed(1)}`; }
    return d;
  };
  const areaPath = (t1, sign) => {
    const n = 80, y0 = gy("v", 0);
    let d = `M${gx(0).toFixed(1)} ${y0.toFixed(1)}`;
    for (let i = 0; i <= n; i++) {
      const tt = (i / n) * t1, vv = velAt(P.v0, P.a, tt);
      d += `L${gx(tt).toFixed(1)} ${gy("v", sign > 0 ? Math.max(vv, 0) : Math.min(vv, 0)).toFixed(1)}`;
    }
    return `${d}L${gx(t1).toFixed(1)} ${y0.toFixed(1)}Z`;
  };
  const text = (x, y, str, extra = {}) => s("text", { x, y, fill: "#c4bce8", "font-size": 11, "font-weight": 800, ...extra }, str);

  function drawFrames() {                                      // axes, grid, track ruler: rebuilt only when a range changes
    const g = [];
    const titles = { s: L.graph.s, v: L.graph.v, a: L.graph.a };
    for (const k of ["s", "v", "a"]) {
      const b = boxes[k], r = rng[k];
      g.push(s("rect", { x: b.x, y: b.y, width: b.w, height: b.h, fill: "rgba(255,255,255,.04)", stroke: "rgba(255,255,255,.2)" }));
      g.push(text(b.x, b.y - 6, titles[k], { fill: COL[k] }));
      for (let v = Math.ceil(r.lo / r.step - 1e-9) * r.step; v <= r.hi + 1e-9; v += r.step) {
        const y = gy(k, v), zero = Math.abs(v) < 1e-9;
        g.push(s("path", { d: `M${b.x} ${y.toFixed(1)}H${b.x + b.w}`, stroke: zero ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.1)", "stroke-width": zero ? 1.5 : 1 }));
        g.push(text(b.x - 4, y + 4, tickLabel(v), { "text-anchor": "end", "font-size": 10 }));
      }
      for (let sec = 0; sec <= P.T; sec++) {
        const x = gx(sec);
        g.push(s("path", { d: `M${x.toFixed(1)} ${b.y}V${b.y + b.h}`, stroke: "rgba(255,255,255,.08)" }));
        if (k === "a") g.push(text(x, b.y + b.h + 14, String(sec), { "text-anchor": "middle", "font-size": 10 }));
      }
    }
    g.push(text(GX + GW, boxes.a.y + boxes.a.h + 28, L.graph.t, { "text-anchor": "end" }));
    gridG.replaceChildren(...g);
    const tr = [];                                              // the track strip
    const r = rng.s;
    if (P.vert) {
      tr.push(s("path", { d: "M170 4V116", stroke: "rgba(255,255,255,.5)", "stroke-width": 3 }));
      for (let v = Math.ceil(r.lo / r.step - 1e-9) * r.step; v <= r.hi + 1e-9; v += r.step) {
        const y = pt(v).y; tr.push(s("path", { d: `M164 ${y.toFixed(1)}H176`, stroke: "#fff" })); tr.push(text(158, y + 4, tickLabel(v), { "text-anchor": "end", "font-size": 10 }));
      }
      const gnd = pt(0).y; tr.push(s("path", { d: `M110 ${gnd.toFixed(1)}H230`, stroke: "#6bd36b", "stroke-width": 4 }));
    } else {
      tr.push(s("path", { d: "M16 56H324", stroke: "rgba(255,255,255,.5)", "stroke-width": 3 }));
      for (let v = Math.ceil(r.lo / r.step - 1e-9) * r.step; v <= r.hi + 1e-9; v += r.step) {
        const x = pt(v).x; tr.push(s("path", { d: `M${x.toFixed(1)} 50V62`, stroke: "#fff" })); tr.push(text(x, 118, tickLabel(v), { "text-anchor": "middle", "font-size": 10 }));
      }
      tr.push(text(324, 12, L.graph.track, { "text-anchor": "end", "font-size": 10 }));
    }
    trackG.replaceChildren(...tr);
  }

  function update() {
    // axes: fit the whole time window so the faint full curves are always visible
    const ex = windowExtremes(P, P.T);
    rng.s = niceRange(ex.s[0], ex.s[1], 4); rng.v = niceRange(ex.v[0], ex.v[1], 4); rng.a = niceRange(ex.a[0], ex.a[1], 4);
    const key = [rng.s.lo, rng.s.hi, rng.v.lo, rng.v.hi, rng.a.lo, rng.a.hi, P.T, P.vert].join("|");
    if (key !== rangeKey) { rangeKey = key; drawFrames(); }
    t = clamp(t, 0, P.T);
    const m = motionAt(P, t), hh = 1e-3;
    const slopeS = (posAt(P.s0, P.v0, P.a, t + hh) - posAt(P.s0, P.v0, P.a, t - hh)) / (2 * hh);   // tangent slope, numerically
    const slopeV = (velAt(P.v0, P.a, t + hh) - velAt(P.v0, P.a, t - hh)) / (2 * hh);
    // sliders
    for (const k of ["s0", "v0", "a", "T"]) { outs[k].inp.value = P[k]; outs[k].out.textContent = outs[k].show(P[k]); }
    tIn.max = P.T; tIn.value = t; tOut.textContent = `${num(t, 2)} s`;
    vertBtn.setAttribute("aria-pressed", String(P.vert));
    runBtn.textContent = playing ? L.pause : L.run;
    // graphs
    full.s.setAttribute("d", curve("s", (x) => posAt(P.s0, P.v0, P.a, x), P.T));
    full.v.setAttribute("d", curve("v", (x) => velAt(P.v0, P.a, x), P.T));
    full.a.setAttribute("d", curve("a", () => P.a, P.T));
    if (t > 0) {
      live.s.setAttribute("d", curve("s", (x) => posAt(P.s0, P.v0, P.a, x), t));
      live.v.setAttribute("d", curve("v", (x) => velAt(P.v0, P.a, x), t));
      live.a.setAttribute("d", curve("a", () => P.a, t));
      areaPos.setAttribute("d", areaPath(t, 1)); areaNeg.setAttribute("d", areaPath(t, -1));
    } else for (const e of [live.s, live.v, live.a, areaPos, areaNeg]) e.setAttribute("d", "");
    const x = gx(t), d0 = 0.8;
    tangent.setAttribute("d", `M${gx(t - d0).toFixed(1)} ${gy("s", m.s - slopeS * d0).toFixed(1)}L${gx(t + d0).toFixed(1)} ${gy("s", m.s + slopeS * d0).toFixed(1)}`);
    cursor.setAttribute("d", `M${x.toFixed(1)} ${boxes.s.y}V${boxes.a.y + boxes.a.h}`);
    handle.setAttribute("transform", `translate(${x.toFixed(1)} ${gy("s", m.s).toFixed(1)})`);
    handle.setAttribute("aria-valuemax", P.T); handle.setAttribute("aria-valuenow", num(t, 2));
    handle.setAttribute("aria-valuetext", `${num(t, 2)} s`);
    dots.v.setAttribute("cx", x); dots.v.setAttribute("cy", gy("v", m.v)); dots.a.setAttribute("cx", x); dots.a.setAttribute("cy", gy("a", m.a));
    // the object, its time-lapse dots (one per second) and its v and a arrows
    const p = pt(m.s), dir = P.vert ? [0, -1] : [1, 0];
    const els = [];
    for (let sec = 0; sec <= P.T; sec++) { const q = pt(posAt(P.s0, P.v0, P.a, sec)); els.push(s("circle", { cx: q.x, cy: q.y, r: 3, fill: "#fff", opacity: 0.45 })); }
    // arrows stay inside the track strip: horizontal mode v above and a below the ruler, vertical mode both to the right of it
    const lim = (v, from) => clamp(from + v, 4, P.vert ? 124 : W - 4) - from;      // v = screen offset of the arrow tip
    const lv = lim(P.vert ? -clamp(m.v * 5, -70, 70) : clamp(m.v * 5, -70, 70), P.vert ? p.y : p.x);
    const la = lim(P.vert ? -clamp(m.a * 12, -70, 70) : clamp(m.a * 12, -70, 70), P.vert ? p.y : p.x);
    const ov = P.vert ? [20, 0] : [0, -22], oa = P.vert ? [38, 0] : [0, 22];
    els.push(arrow(p.x + ov[0], p.y + ov[1], P.vert ? 0 : lv, P.vert ? lv : 0, COL.v));
    els.push(arrow(p.x + oa[0], p.y + oa[1], P.vert ? 0 : la, P.vert ? la : 0, COL.a));
    els.push(text(P.vert ? p.x + 20 + 8 : p.x - 4, P.vert ? p.y - 8 : p.y - 34, "v", { fill: COL.v, "font-size": 12 }));
    els.push(text(P.vert ? p.x + 38 + 8 : p.x - 4, P.vert ? p.y - 8 : p.y + 40, "a", { fill: COL.a, "font-size": 12 }));
    els.push(s("circle", { cx: p.x, cy: p.y, r: 9, fill: "#ff4fd8", stroke: "#fff", "stroke-width": 2.5 }));
    objG.replaceChildren(...els);
    // readouts
    ro.t.textContent = `${num(t, 2)} s`; ro.s.textContent = `${num(m.s, 2)} m`; ro.v.textContent = `${num(m.v, 2)} m/s`;
    ro.slope_s.textContent = `${num(slopeS, 2)} m/s`; ro.slope_v.textContent = `${num(slopeV, 2)} m/s²`;
    ro.area.textContent = `${num(m.area, 2)} m`; ro.disp.textContent = `${num(m.disp, 2)} m`;
    const tst = stopTime(P.v0, P.a);
    let msg;
    if (Math.abs(m.v) < 0.005) msg = P.a === 0 ? L.status_still : L.status_rest;
    else if (P.a === 0) msg = L.status_const;
    else msg = m.v * P.a > 0 ? L.status_up : L.status_down;
    if (tst != null && tst < P.T) msg += ` ${L.turn.replace("{t}", num(tst, 2))}`;
    status.replaceChildren(h("span", {}, msg));
    // events (only after she has touched something)
    if (touched && byTime) {
      if (P.a !== 0 && t >= P.T - 1e-9) onEvent?.("run", root);
      if (tst != null && t >= tst - 1e-9 && tst <= P.T) onEvent?.("brake", root);
    }
  }

  // --- time: play, drag the marker, keyboard ---
  const frame = (now) => {
    if (!root.isConnected) { playing = false; return; }
    if (!playing) return;
    t += Math.min(0.05, (now - last) / 1000); last = now; byTime = true;
    if (t >= P.T) { t = P.T; playing = false; }
    update();
    if (playing) requestAnimationFrame(frame);
  };
  runBtn.addEventListener("click", () => {
    touched = true; byTime = true;
    if (playing) { playing = false; update(); return; }
    if (rm()) { t = P.T; update(); return; }
    if (t >= P.T - 1e-9) t = 0;
    playing = true; last = performance.now(); update(); requestAnimationFrame(frame);
  });
  resetBtn.addEventListener("click", () => { Object.assign(P, { s0: 0, v0: 2, a: 1, T: 6, vert: false }); t = 2; playing = false; byTime = false; update(); });
  const tFromEvent = (e) => { const r = svg.getBoundingClientRect(); return clamp((((e.clientX - r.left) * W) / r.width - GX) / GW, 0, 1) * P.T; };
  handle.addEventListener("pointerdown", (e) => {
    dragging = true; playing = false; touched = true; byTime = true;
    try { handle.setPointerCapture(e.pointerId); } catch { /* not supported */ }
    t = tFromEvent(e); update(); e.preventDefault();
  });
  handle.addEventListener("pointermove", (e) => { if (dragging) { t = tFromEvent(e); update(); } });
  for (const ev of ["pointerup", "pointercancel"]) handle.addEventListener(ev, () => { dragging = false; });
  handle.addEventListener("keydown", (e) => {
    const k = e.key;
    if (k === "ArrowRight" || k === "ArrowUp") t += 0.1; else if (k === "ArrowLeft" || k === "ArrowDown") t -= 0.1;
    else if (k === "Home") t = 0; else if (k === "End") t = P.T; else return;
    e.preventDefault(); playing = false; touched = true; byTime = true; update();
  });
  update();
  return root;
}

// ---------- the game: match the graph ----------
// Each round shows a target s–t curve (dashed, from a hidden s0, v0, a). Tune your own until it lies on the target.
export const GAME_T = 4;
export const GAME_LIM = { s0: [-10, 20], v0: [-10, 10], a: [-4, 4] };
export const GAME_ROUNDS = [
  { s0: 2, v0: 3, a: 0 },        // a straight line going up
  { s0: 14, v0: -4, a: 0 },      // a straight line going down: negative velocity
  { s0: 0, v0: 8, a: -2 },       // a braking curve: stops at t = 4 s
];
export const GAME_TOL = 0.6;     // m: largest gap between the two curves allowed
/** Largest gap (m) between two position curves over 0…T, sampled every 0.02 s. */
export function curveGap(p, q, T = GAME_T) {
  let worst = 0;
  for (let i = 0; i <= T / 0.02; i++) {
    const t = i * 0.02;
    worst = Math.max(worst, Math.abs(posAt(p.s0, p.v0, p.a, t) - posAt(q.s0, q.v0, q.a, t)));
  }
  return worst;
}
/** Which hint to show: the first of start position, start slope (v0) and bend (a) that is off; null when nothing is. */
export function gameHint(p, q) {
  if (Math.abs(p.s0 - q.s0) > 0.3) return p.s0 > q.s0 ? "s0_hi" : "s0_lo";
  if (Math.abs(p.v0 - q.v0) > 0.3) return p.v0 > q.v0 ? "v0_hi" : "v0_lo";
  if (Math.abs(p.a - q.a) > 0.3) return p.a > q.a ? "a_hi" : "a_lo";
  return null;
}

export function matchGraph(L, onWin) {
  const R = GAME_ROUNDS, T = GAME_T, LO = -10, HI = 30;
  let round = 0, t = 0, playing = false, last = 0;
  const P = { s0: 0, v0: 0, a: 0 };
  const GW = 320, GHT = 190, X0 = 34, PW = 280, Y0 = 10, PH = 150;
  const clipId = `mm${++uid}`;
  const gx = (tt) => X0 + (tt / T) * PW, gy = (v) => Y0 + PH - ((v - LO) / (HI - LO)) * PH;
  const grid = [];
  for (let v = LO; v <= HI; v += 10) grid.push(s("path", { d: `M${X0} ${gy(v)}H${X0 + PW}`, stroke: v === 0 ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.12)" }), s("text", { x: X0 - 4, y: gy(v) + 4, fill: "#c4bce8", "font-size": 10, "font-weight": 800, "text-anchor": "end" }, tickLabel(v)));
  for (let sec = 0; sec <= T; sec++) grid.push(s("path", { d: `M${gx(sec)} ${Y0}V${Y0 + PH}`, stroke: "rgba(255,255,255,.1)" }), s("text", { x: gx(sec), y: Y0 + PH + 14, fill: "#c4bce8", "font-size": 10, "font-weight": 800, "text-anchor": "middle" }, String(sec)));
  const target = s("path", { fill: "none", stroke: COL.s, "stroke-width": 4, "stroke-dasharray": "8 6", opacity: 0.9, "clip-path": `url(#${clipId})` });
  const mine = s("path", { fill: "none", stroke: "#ff4fd8", "stroke-width": 3.5, "clip-path": `url(#${clipId})` });
  const gDot = s("circle", { r: 5, fill: COL.s }), mDot = s("circle", { r: 5, fill: "#ff4fd8" });
  const svg = s("svg", { class: "scene", viewBox: `0 0 ${GW} ${GHT}`, role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: GW, height: GHT, fill: "#0a0826" }), s("clipPath", { id: clipId }, s("rect", { x: X0, y: Y0, width: PW, height: PH })),
    ...grid, s("text", { x: GW - 4, y: GHT - 4, fill: "#c4bce8", "font-size": 10, "font-weight": 800, "text-anchor": "end" }, L.axis), target, mine, gDot, mDot);
  const strip = s("svg", { class: "scene", viewBox: "0 0 320 56", role: "img", "aria-label": L.strip, style: "touch-action: pan-y" }, s("rect", { width: 320, height: 56, fill: "#0a0826" }));
  const sx = (v) => 20 + ((v - LO) / (HI - LO)) * 280;
  const gGhost = s("circle", { cy: 18, r: 8, fill: COL.s }), gHero = s("circle", { cy: 40, r: 8, fill: "#ff4fd8", stroke: "#fff", "stroke-width": 2 });
  strip.append(s("path", { d: "M20 29H300", stroke: "rgba(255,255,255,.25)" }), s("path", { d: `M${sx(0)} 6V52`, stroke: "rgba(255,255,255,.5)" }), gGhost, gHero);
  const roundOut = h("div", { class: "qf-count" }), status = h("div", { "aria-live": "polite" });
  const outs = {};
  const mkSlider = (key, label, lim, step, show) => {
    outs[key] = h("output");
    const inp = h("input", { type: "range", min: lim[0], max: lim[1], step, value: P[key], "aria-label": label });
    inp.addEventListener("input", () => { P[key] = Number(inp.value); update(); });
    return { row: [h("label", {}, label, outs[key]), inp], inp, show, key };
  };
  const sl = [mkSlider("s0", L.s0, GAME_LIM.s0, 1, (v) => `${num(v, 0)} m`), mkSlider("v0", L.v0, GAME_LIM.v0, 0.5, (v) => `${num(v, 1)} m/s`), mkSlider("a", L.a, GAME_LIM.a, 0.5, (v) => `${num(v, 1)} m/s²`)];
  const tIn = h("input", { type: "range", min: 0, max: T, step: 0.05, value: 0, "aria-label": L.time }), tOut = h("output");
  tIn.addEventListener("input", () => { playing = false; t = Number(tIn.value); update(); });
  const runBtn = h("button", { class: "btn", type: "button" }, L.run);
  const nextBtn = h("button", { class: "btn primary", type: "button", hidden: true }, L.next);
  let solved = false;
  const curvePath = (p) => { let d = ""; for (let i = 0; i <= 80; i++) { const tt = (i / 80) * T; d += `${i ? "L" : "M"}${gx(tt).toFixed(1)} ${gy(posAt(p.s0, p.v0, p.a, tt)).toFixed(1)}`; } return d; };
  function update() {
    const tg = R[round];
    for (const x of sl) { x.inp.value = P[x.key]; outs[x.key].textContent = x.show(P[x.key]); }
    tOut.textContent = `${num(t, 2)} s`; tIn.value = t;
    target.setAttribute("d", curvePath(tg)); mine.setAttribute("d", curvePath(P));
    const sT = posAt(tg.s0, tg.v0, tg.a, t), sM = posAt(P.s0, P.v0, P.a, t);
    gDot.setAttribute("cx", gx(t)); gDot.setAttribute("cy", clamp(gy(sT), Y0, Y0 + PH)); mDot.setAttribute("cx", gx(t)); mDot.setAttribute("cy", clamp(gy(sM), Y0, Y0 + PH));
    gGhost.setAttribute("cx", clamp(sx(sT), 12, 308)); gHero.setAttribute("cx", clamp(sx(sM), 12, 308));
    roundOut.textContent = `${L.round} ${round + 1} / ${R.length}`;
    runBtn.textContent = playing ? L.pause : L.run;
    const ok = curveGap(P, tg) <= GAME_TOL;
    if (ok) {
      if (!solved) {
        solved = true;
        status.replaceChildren(h("div", { class: "verdict-row" }, h("div", { class: "burst ok", role: "status" }, L.match), h("div", { class: "verdict" }, rich(L.solved[round]))));
        nextBtn.hidden = false; nextBtn.textContent = round + 1 < R.length ? L.next : L.finish;
      }
    } else {
      solved = false; nextBtn.hidden = true;
      const hint = gameHint(P, tg);
      status.replaceChildren(h("div", { class: "small muted" }, rich(hint ? L.hints[hint] : L.hint_start)));
    }
  }
  const frame = (now) => {
    if (!root.isConnected) { playing = false; return; }
    if (!playing) return;
    t += Math.min(0.05, (now - last) / 1000); last = now;
    if (t >= T) { t = T; playing = false; }
    update();
    if (playing) requestAnimationFrame(frame);
  };
  runBtn.addEventListener("click", () => {
    if (playing) { playing = false; update(); return; }
    if (rm()) { t = T; update(); return; }
    if (t >= T - 1e-9) t = 0;
    playing = true; last = performance.now(); update(); requestAnimationFrame(frame);
  });
  nextBtn.addEventListener("click", () => {
    if (round + 1 < R.length) { round++; solved = false; Object.assign(P, { s0: 0, v0: 0, a: 0 }); t = 0; playing = false; update(); }
    else { status.replaceChildren(h("div", { class: "verdict-row" }, h("div", { class: "burst ok", role: "status" }, L.champion), h("p", { class: "verdict" }, L.done))); nextBtn.hidden = true; onWin?.(status); }
  });
  const root = h("div", { class: "lab" },
    h("div", {}, roundOut, h("div", { class: "scene-box" }, svg), h("div", { class: "scene-box", style: "margin-top:8px" }, strip), h("p", { class: "small muted", style: "margin-top:8px" }, L.legend)),
    h("div", { class: "controls" }, ...sl.flatMap((x) => x.row), h("label", {}, L.time, tOut), tIn, h("div", { class: "btn-row" }, runBtn), status, h("div", { class: "btn-row" }, nextBtn)));
  update();
  return root;
}

// ---------- the charge in a uniform field ----------
export const CHARGE_LIM = { U: [10, 500], d: [1, 10] };
export const PARTICLES = { electron: { m: M_ELECTRON }, proton: { m: M_PROTON } };
/** A charge e (magnitude) released at rest at one plate of a parallel-plate pair, travelling the whole gap d (cm) with
 * voltage U (V). Positive direction = the direction of the force on the charge. */
export function chargeRun(kind, U, dCm) {
  const m = PARTICLES[kind].m, d = dCm / 100;
  const E = uniformField(U, d), F = E_CHARGE * E, a = chargeAcc(E_CHARGE, E, m);
  const T = Math.sqrt((2 * d) / a);                          // s = ½·a·t² with s = d
  const v = velAt(0, a, T);                                  // v = a·t
  const vEnergy = Math.sqrt((2 * E_CHARGE * U) / m);         // energy check: q·U = ½·m·v²
  return { m, d, E, F, a, T, v, vEnergy, check: posAt(0, 0, a, T) };
}

export function chargeLab(L, onEvent) {
  const P = { kind: "electron", U: 100, d: 2.5 };
  let tau = 0, playing = false, last = 0, released = false;
  const W = 340, H = 170, SLOW = 3;                          // the whole trip takes 3 s on screen
  const plateGap = () => 80 + ((P.d - 1) / 9) * 170, left = () => (W - plateGap()) / 2, right = () => left() + plateGap();
  const g = s("g"), ghosts = s("g"), part = s("circle", { r: 9 });
  const svg = s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.scene, style: "touch-action: pan-y" }, s("rect", { width: W, height: H, fill: "#0a0826" }), g, ghosts, part);
  const outs = {};
  const mk = (key, label, lim, step, show) => {
    const out = h("output"), inp = h("input", { type: "range", min: lim[0], max: lim[1], step, value: P[key], "aria-label": label });
    inp.addEventListener("input", () => { P[key] = Number(inp.value); tau = 0; playing = false; released = false; update(); });
    outs[key] = { out, inp, show };
    return [h("label", {}, label, out), inp];
  };
  const sU = mk("U", L.U, CHARGE_LIM.U, 10, (v) => `${num(v, 0)} V`), sD = mk("d", L.d, CHARGE_LIM.d, 0.5, (v) => `${num(v, 1)} cm`);
  const kindBtns = Object.keys(PARTICLES).map((k) => {
    const b = h("button", { class: "pill", type: "button", "aria-pressed": "false" }, L[k]);
    b.addEventListener("click", () => { P.kind = k; tau = 0; playing = false; released = false; update(); });
    b.dataset.kind = k;
    return b;
  });
  const goBtn = h("button", { class: "btn primary", type: "button" }, L.release);
  const ro = {};
  const roBox = (key) => { ro[key] = h("b"); return h("div", {}, h("span", {}, L.readout[key]), ro[key]); };
  const readout = h("div", { class: "readout" }, ...["E", "F", "a", "T", "v", "vE"].map(roBox));
  const note = h("p", { class: "small muted" });
  const root = h("div", { class: "lab" }, h("div", {}, h("div", { class: "scene-box" }, svg)),
    h("div", { class: "controls" }, h("div", { class: "btn-row", style: "margin-top:0" }, ...kindBtns), ...sU, ...sD, h("div", { class: "btn-row" }, goBtn), readout, note));

  function update() {
    const r = chargeRun(P.kind, P.U, P.d), x0 = left(), x1 = right();
    const el = P.kind === "electron";
    for (const k of ["U", "d"]) { outs[k].inp.value = P[k]; outs[k].out.textContent = outs[k].show(P[k]); }
    kindBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === P.kind)));
    // plates (left −, right +) and the field arrows (E points from + to −)
    const els = [s("rect", { x: x0 - 8, y: 20, width: 8, height: 120, fill: "#2ef2ff" }), s("rect", { x: x1, y: 20, width: 8, height: 120, fill: "#ff4fd8" }),
      s("text", { x: x0 - 4, y: 14, fill: "#2ef2ff", "font-size": 16, "font-weight": 800, "text-anchor": "middle" }, "−"), s("text", { x: x1 + 4, y: 14, fill: "#ff4fd8", "font-size": 16, "font-weight": 800, "text-anchor": "middle" }, "+")];
    for (const y of [38, 70, 102, 134]) els.push(arrow(x1 - 6, y + 4, -(x1 - x0 - 12), 0, "rgba(255,255,255,.28)"));
    els.push(s("text", { x: (x0 + x1) / 2, y: H - 6, fill: "#c4bce8", "font-size": 11, "font-weight": 800, "text-anchor": "middle" }, `E ←  ·  d = ${num(P.d, 1)} cm`));
    g.replaceChildren(...els);
    // the particle starts at its start plate and is pushed across: electron to the right, proton to the left
    const sx = (frac) => (el ? x0 + 12 + frac * (x1 - x0 - 24) : x1 - 12 - frac * (x1 - x0 - 24));
    const y = 86, gs = [];
    for (let k = 0; k <= 8; k++) gs.push(s("circle", { cx: sx((k / 8) ** 2), cy: y, r: 4, fill: "#fff", opacity: 0.35 }));   // equal time gaps, growing space gaps
    ghosts.replaceChildren(...gs);
    const frac = released ? clamp(tau / SLOW, 0, 1) ** 2 : 0;
    part.setAttribute("cx", sx(rm() && released ? 1 : frac)); part.setAttribute("cy", y);
    part.setAttribute("style", `fill: ${el ? "#2ef2ff" : "#ff4fd8"}; stroke: #fff; stroke-width: 2`);
    ro.E.textContent = `${sci(r.E, 3)} V/m`; ro.F.textContent = `${sci(r.F, 3)} N`; ro.a.textContent = `${sci(r.a, 3)} m/s²`;
    ro.T.textContent = `${sci(r.T, 3)} s`; ro.v.textContent = `${sci(r.v, 3)} m/s`; ro.vE.textContent = `${sci(r.vEnergy, 3)} m/s`;
    note.textContent = `${el ? L.note_e : L.note_p} ${L.slow}`;
  }
  const frame = (now) => {
    if (!root.isConnected) { playing = false; return; }
    if (!playing) return;
    tau += Math.min(0.05, (now - last) / 1000); last = now;
    if (tau >= SLOW) { tau = SLOW; playing = false; }
    update();
    if (playing) requestAnimationFrame(frame);
  };
  goBtn.addEventListener("click", () => {
    released = true; onEvent?.("release", root);
    if (rm()) { tau = SLOW; update(); return; }
    tau = 0; playing = true; last = performance.now(); update(); requestAnimationFrame(frame);
  });
  update();
  return root;
}
