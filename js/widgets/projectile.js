// Interactives for chapter i2 (projectile motion): the launch lab, the hit-the-target game and the drop-vs-throw demo.
// Model: no air, uniform field. x horizontal (a = 0), y vertical up (a = −g):  x(t) = v0x·t,  y(t) = h0 + v0y·t − ½·g·t²
// (the booklet's s(t) = s0 + v0·t + ½·a·t² applied to each direction). All numbers come from physics.js.
import { h, s } from "../dom.js";
import { G, projectileAt, flightTime, maxHeight, fmt } from "../physics.js";

export const D2R = Math.PI / 180;
const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const fill = (str, vars) => String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const snap = (v, step) => Number((Math.round(v / step) * step).toFixed(6));
const dash = (c, w = 1.5) => ({ stroke: c, "stroke-width": w, "stroke-dasharray": "4 5" });

// ---------- pure helpers (exported so they can be checked in node) ----------
/** Everything about one shot. T = null when the ball never leaves the ground (0° from height 0). */
export function shot(v0, ang, h0) {
  const T = flightTime(v0, ang, h0);
  if (T == null) return { T: null, range: 0, top: h0, vLand: v0, vx: v0 * Math.cos(ang * D2R), vy0: v0 * Math.sin(ang * D2R) };
  const p = projectileAt(v0, ang, T, h0);
  return { T, range: Math.max(0, p.x), top: maxHeight(v0, ang, h0), vLand: Math.hypot(p.vx, p.vy), vx: p.vx, vy0: v0 * Math.sin(ang * D2R) };
}
/** Closest the path comes to the point (tx, ty), sampled every ms until landing; null if there is no flight. */
export function closestApproach(v0, ang, h0, tx, ty) {
  const T = flightTime(v0, ang, h0);
  if (T == null) return null;
  let best = Infinity;
  const n = Math.ceil(T / 0.001);
  for (let i = 0; i <= n; i++) {
    const p = projectileAt(v0, ang, Math.min(i * 0.001, T), h0);
    best = Math.min(best, Math.hypot(p.x - tx, p.y - ty));
  }
  return best;
}
/** Height of the path when it is x metres away horizontally; null if it never gets that far sideways. */
export function heightAtX(v0, ang, h0, x) {
  const vx = v0 * Math.cos(ang * D2R), T = flightTime(v0, ang, h0);
  if (T == null || vx < 1e-9 || projectileAt(v0, ang, T, h0).x < x) return null;
  return projectileAt(v0, ang, x / vx, h0).y;
}
const niceStep = (raw) => { const b = 10 ** Math.floor(Math.log10(raw)), m = raw / b; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * b; };

// ---------- small UI helpers ----------
function slider(label, min, max, step, val, show, set) {
  const out = h("output");
  const inp = h("input", { type: "range", min, max, step, value: val, "aria-label": label });
  const sync = () => { out.textContent = show(Number(inp.value)); };
  inp.addEventListener("input", () => { set(Number(inp.value)); sync(); });
  sync();
  return { nodes: [h("label", {}, label, out), inp], put: (v) => { inp.value = String(v); sync(); } };
}
const toSvg = (svg, e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };

// ---------- the aiming dial: drag the arrow tip (angle 0 to 90 degrees, length = speed) ----------
function makeAim(L, st, { vStep, vMin = 1, vMax = 30, onChange, onFire }) {
  const PX = 26, PY = 172, RMAX = 150;
  const arrow = s("line", { x1: PX, y1: PY, style: "stroke: var(--a1)", "stroke-width": 4, "stroke-linecap": "round" });
  const disc = s("circle", { r: 11, style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 3 });
  const handle = s("g", { class: "drag-handle", tabindex: "0", role: "slider", "aria-label": L.drag, "aria-valuemin": 0, "aria-valuemax": 90 }, disc);
  const label = s("text", { x: 196, y: 16, fill: "#ffe14d", "font-size": 13, "font-weight": 800, "text-anchor": "end" });
  const guides = [10, 20, 30].map((v) => { const r = (v / vMax) * RMAX;
    return [s("path", { d: `M${PX + r} ${PY}A${r} ${r} 0 0 0 ${PX} ${PY - r}`, fill: "none", ...dash("rgba(255,255,255,.28)") }),
      s("text", { x: PX + r * 0.707 + 3, y: PY - r * 0.707 - 3, fill: "#a7a0d0", "font-size": 9 }, `${v}`)]; });
  const spokes = [30, 45, 60].map((a) => s("path", { d: `M${PX} ${PY}L${(PX + RMAX * Math.cos(a * D2R)).toFixed(1)} ${(PY - RMAX * Math.sin(a * D2R)).toFixed(1)}`, ...dash("rgba(255,255,255,.18)") }));
  const svg = s("svg", { class: "scene", viewBox: "0 0 200 190", role: "group", "aria-label": L.dial, style: "touch-action: pan-y" },
    s("rect", { width: 200, height: 190, fill: "#0a0826" }),
    s("path", { d: `M${PX} ${PY}H196M${PX} ${PY}V12`, stroke: "rgba(255,255,255,.5)", "stroke-width": 1.5 }),
    ...guides, ...spokes, arrow, handle, label);

  const aSl = slider(L.angle, 0, 90, 1, st.ang, (v) => `${fmt(v, 0)}°`, (v) => { st.ang = v; apply(); onChange(); });
  const vSl = slider(L.speed, vMin, vMax, vStep, st.v, (v) => `${fmt(v, 1)} m/s`, (v) => { st.v = v; apply(); onChange(); });

  function apply() {
    const len = (st.v / vMax) * RMAX, tx = PX + len * Math.cos(st.ang * D2R), ty = PY - len * Math.sin(st.ang * D2R);
    arrow.setAttribute("x2", tx.toFixed(1)); arrow.setAttribute("y2", ty.toFixed(1));
    handle.setAttribute("transform", `translate(${tx.toFixed(1)} ${ty.toFixed(1)})`);
    handle.setAttribute("aria-valuenow", st.ang);
    handle.setAttribute("aria-valuetext", `${fmt(st.ang, 0)} degrees, ${fmt(st.v, 1)} m/s`);
    label.textContent = `${fmt(st.ang, 0)}° · ${fmt(st.v, 1)} m/s`;
    aSl.put(st.ang); vSl.put(st.v);
  }
  function setAim(v, ang) { st.v = clamp(snap(v, vStep), vMin, vMax); st.ang = clamp(Math.round(ang), 0, 90); apply(); onChange(); }
  let dragging = false;
  handle.addEventListener("pointerdown", (e) => {
    dragging = true; e.preventDefault();
    try { handle.setPointerCapture(e.pointerId); } catch { /* capture is a nicety; the flag still works */ }
  });
  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const p = toSvg(svg, e), dx = p.x - PX, dy = PY - p.y, r = Math.hypot(dx, dy);
    if (r < 1) return;                                         // on the pivot: keep the old angle
    setAim((r / RMAX) * vMax, (Math.atan2(dy, dx) / D2R));     // setAim clamps: behind or below the pivot gives 90° or 0°
  });
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) handle.addEventListener(ev, () => { dragging = false; });
  handle.addEventListener("keydown", (e) => {
    const d = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowRight: [vStep, 0], ArrowLeft: [-vStep, 0] }[e.key];
    if (d) { e.preventDefault(); setAim(st.v + d[0], st.ang + d[1]); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFire?.(); }
  });
  apply();
  return { svg, nodes: [...aSl.nodes, ...vSl.nodes], apply };
}

// ---------- the side-on scene (equal scale in x and y) ----------
function makeScene(label, shadows) {
  const W = 400, H = 270, WALL = 28, X0 = 56, GY = 222, RAIL = GY + 22, TOP = 14;
  const sc = { k: 1, W, X0, GY, RAIL, WALL };
  sc.X = (x) => X0 + x * sc.k; sc.Y = (y) => GY - y * sc.k;
  const gTicks = s("g"), wTicks = s("g");
  sc.marks = s("g"); sc.extra = s("g");
  sc.pred = s("path", { fill: "none", stroke: "rgba(255,225,77,.5)", "stroke-width": 2, "stroke-dasharray": "5 5" });
  sc.trace = s("path", { fill: "none", style: "stroke: var(--a1)", "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" });
  sc.tower = s("rect", { fill: "#3a2f80" });
  sc.barrel = s("line", { stroke: "#fff", "stroke-width": 5, "stroke-linecap": "round" });
  sc.ball = s("circle", { r: 6, fill: "#ffe14d", stroke: "#fff", "stroke-width": 2 });
  sc.sx = s("circle", { r: 5, style: "fill: var(--a1)", stroke: "#fff", "stroke-width": 1.5 });
  sc.sy = s("circle", { r: 5, style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 1.5 });
  sc.gx = s("line", dash("rgba(255,255,255,.35)", 1)); sc.gy = s("line", dash("rgba(255,255,255,.35)", 1));
  sc.svg = s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": label, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: "#0a0826" }),
    s("path", { d: `M0 ${GY}H${W}`, stroke: "#8f86c9", "stroke-width": 2 }),
    shadows ? s("path", { d: `M${WALL} ${TOP - 6}V${GY}`, stroke: "#8f86c9", "stroke-width": 2 }) : null,
    shadows ? s("path", { d: `M${X0} ${RAIL}H${W - 8}`, ...dash("#8f86c9", 1.5) }) : null,
    gTicks, shadows ? wTicks : null, sc.tower, shadows ? sc.marks : null, sc.pred, sc.trace, sc.extra,
    shadows ? sc.gx : null, shadows ? sc.gy : null, shadows ? sc.sx : null, shadows ? sc.sy : null, sc.barrel, sc.ball);

  /** Fit the view to a region of maxX metres by maxY metres (both > 0). Equal scale in x and y. */
  sc.layout = (maxX, maxY) => {
    sc.k = Math.min((W - 8 - X0) / maxX, (GY - TOP) / maxY);
    gTicks.replaceChildren(); wTicks.replaceChildren();
    const visX = (W - 8 - X0) / sc.k, stepX = niceStep(visX / 5), dx = stepX < 1 ? 1 : 0;
    for (let v = stepX; v <= visX + 1e-9; v += stepX) {
      gTicks.append(s("path", { d: `M${sc.X(v).toFixed(1)} ${GY}v5`, stroke: "#8f86c9" }),
        s("text", { x: sc.X(v).toFixed(1), y: GY + 15, fill: "#a7a0d0", "font-size": 9, "text-anchor": "middle" }, fmt(v, dx)));
    }
    gTicks.append(s("text", { x: W - 6, y: GY - 5, fill: "#a7a0d0", "font-size": 9, "text-anchor": "end" }, "m"));
    const visY = (GY - TOP) / sc.k, stepY = niceStep(visY / 4), dy = stepY < 1 ? 1 : 0;
    for (let v = stepY; v <= visY + 1e-9; v += stepY) {
      wTicks.append(s("path", { d: `M${WALL - 5} ${sc.Y(v).toFixed(1)}h5`, stroke: "#8f86c9" }),
        s("text", { x: WALL - 8, y: (sc.Y(v) + 3).toFixed(1), fill: "#a7a0d0", "font-size": 9, "text-anchor": "end" }, fmt(v, dy)));
    }
  };
  /** Launcher: a tower up to height h0 and a barrel at angle ang. */
  sc.launcher = (h0, ang) => {
    const y = sc.Y(h0);
    sc.tower.setAttribute("x", X0 - 14); sc.tower.setAttribute("width", 14); sc.tower.setAttribute("y", y.toFixed(1)); sc.tower.setAttribute("height", Math.max(0, GY - y).toFixed(1));
    sc.barrel.setAttribute("x1", X0); sc.barrel.setAttribute("y1", y.toFixed(1));
    sc.barrel.setAttribute("x2", (X0 + 18 * Math.cos(ang * D2R)).toFixed(1)); sc.barrel.setAttribute("y2", (y - 18 * Math.sin(ang * D2R)).toFixed(1));
  };
  sc.at = (p) => {  // ball and (if drawn) its two shadows and guide lines at world point p = {x, y}
    const bx = sc.X(p.x), by = sc.Y(Math.max(0, p.y));
    sc.ball.setAttribute("cx", bx.toFixed(1)); sc.ball.setAttribute("cy", by.toFixed(1));
    sc.sx.setAttribute("cx", bx.toFixed(1)); sc.sx.setAttribute("cy", RAIL);
    sc.sy.setAttribute("cx", WALL); sc.sy.setAttribute("cy", by.toFixed(1));
    sc.gx.setAttribute("x1", bx.toFixed(1)); sc.gx.setAttribute("y1", by.toFixed(1)); sc.gx.setAttribute("x2", bx.toFixed(1)); sc.gx.setAttribute("y2", RAIL);
    sc.gy.setAttribute("x1", bx.toFixed(1)); sc.gy.setAttribute("y1", by.toFixed(1)); sc.gy.setAttribute("x2", WALL); sc.gy.setAttribute("y2", by.toFixed(1));
  };
  sc.pathD = (v0, ang, h0, tEnd, n) => {
    let d = "";
    for (let i = 0; i <= n; i++) {
      const p = projectileAt(v0, ang, (tEnd * i) / n, h0);
      d += `${i ? "L" : "M"}${sc.X(p.x).toFixed(1)} ${sc.Y(Math.max(0, p.y)).toFixed(1)}`;
    }
    return d;
  };
  return sc;
}

// ======================================================================================
// 1. The launch lab
// ======================================================================================
export function projectileLab(L, onEvent) {
  const st = { v: 20, ang: 45, h0: 0 };
  const reduced = rm();
  let raf = 0, run = null;               // run = { start (ms), T } while the ball is in the air
  const sc = makeScene(L.scene, true);
  const aim = makeAim(L, st, { vStep: 0.5, onChange: () => changed(), onFire: () => launch() });
  const hSl = slider(L.height, 0, 20, 1, st.h0, (v) => `${fmt(v, 0)} m`, (v) => { st.h0 = v; changed(); });

  const vals = Array.from({ length: 7 }, () => h("b"));
  const names = [L.t_flight, L.range, L.top, L.v_land, L.vx, L.vy, L.t_now];
  const status = h("p", { class: "small", "aria-live": "polite" });
  const go = h("button", { class: "btn primary", type: "button" }, L.launch);
  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box" }, sc.svg), h("p", { class: "small muted", style: "margin:8px 0 0;text-align:center" }, L.legend)),
    h("div", { class: "controls" },
      h("div", { class: "scene-box", style: "max-width:300px;margin:0 auto 6px" }, aim.svg),
      h("p", { class: "small muted", style: "margin:0 0 6px;text-align:center" }, L.drag_hint),
      ...aim.nodes, ...hSl.nodes,
      h("div", { class: "btn-row" }, go), status,
      h("div", { class: "readout" }, names.map((n, i) => h("div", {}, h("span", {}, n), vals[i])))));

  let sh = shot(st.v, st.ang, st.h0);
  function numbersIdle() {
    const none = sh.T == null;
    vals[0].textContent = none ? "—" : `${fmt(sh.T, 2)} s`;
    vals[1].textContent = none ? "—" : `${fmt(sh.range, 1)} m`;
    vals[2].textContent = none ? "—" : `${fmt(sh.top, 1)} m`;
    vals[3].textContent = none ? "—" : `${fmt(sh.vLand, 1)} m/s`;
    vals[4].textContent = `${fmt(sh.vx, 1)} m/s`;
    vals[5].textContent = `${fmt(sh.vy0, 1)} m/s`;
    vals[6].textContent = "0.00 s";
  }
  function idleMessage() {
    if (sh.T == null) return L.noflight;
    if (st.ang === 90) return L.straight_up;
    return L.ready;
  }
  /** Rebuild the view, the predicted path, the time marks and the numbers for the current settings. */
  function refresh() {
    sh = shot(st.v, st.ang, st.h0);
    sc.layout(Math.max(sh.range, 0.5) * 1.03, Math.max(sh.top, st.h0, 0.5) * 1.03);
    sc.launcher(st.h0, st.ang);
    sc.marks.replaceChildren(); sc.extra.replaceChildren(); sc.trace.setAttribute("d", "");
    if (sh.T == null) {
      sc.pred.setAttribute("d", "");
      sc.at({ x: 0, y: st.h0 });
    } else {
      sc.pred.setAttribute("d", sc.pathD(st.v, st.ang, st.h0, sh.T, 80));
      const dt = sh.T > 3 ? 0.5 : sh.T > 1 ? 0.25 : 0.1;
      for (let t = dt; t < sh.T - 1e-9; t += dt) {
        const p = projectileAt(st.v, st.ang, t, st.h0);
        sc.marks.append(s("circle", { cx: sc.X(p.x).toFixed(1), cy: sc.Y(p.y).toFixed(1), r: 2.5, fill: "#fff" }),
          s("circle", { cx: sc.X(p.x).toFixed(1), cy: sc.RAIL, r: 2.5, fill: "#a7a0d0" }),
          s("circle", { cx: sc.WALL, cy: sc.Y(p.y).toFixed(1), r: 2.5, fill: "#a7a0d0" }));
      }
      const fx = sc.X(sh.range);   // landing flag
      sc.extra.append(s("path", { d: `M${fx.toFixed(1)} ${sc.GY}v-14l9 4l-9 4`, fill: "#ffe14d", stroke: "#ffe14d", "stroke-width": 1.5 }));
      sc.at({ x: 0, y: st.h0 });
    }
    numbersIdle();
    status.textContent = idleMessage();
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; run = null; }
  function changed() { stop(); refresh(); }

  function drawAt(t) {
    const p = projectileAt(st.v, st.ang, t, st.h0);
    sc.at(p);
    sc.trace.setAttribute("d", sc.pathD(st.v, st.ang, st.h0, t, Math.max(1, Math.round(t / 0.02))));
    vals[4].textContent = `${fmt(p.vx, 1)} m/s`;
    vals[5].textContent = `${fmt(p.vy, 1)} m/s`;
    vals[6].textContent = `${fmt(t, 2)} s`;
  }
  function finish() {
    drawAt(sh.T);
    const vy = projectileAt(st.v, st.ang, sh.T, st.h0).vy;
    vals[5].textContent = `${fmt(vy, 1)} m/s`;
    status.textContent = fill(L.landed, { t: fmt(sh.T, 2), x: fmt(sh.range, 1) });
    run = null;
  }
  function launch() {
    stop(); refresh();
    if (sh.T == null) return;   // no flight: the message is already showing
    onEvent?.("lab", go);
    if (reduced) { finish(); return; }
    status.textContent = L.flying;
    run = { start: performance.now(), T: sh.T };
    raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    if (!run) return;
    if (!root.isConnected) { stop(); return; }
    const t = Math.min((now - run.start) / 1000, run.T);
    if (t >= run.T) { finish(); return; }
    drawAt(t);
    raf = requestAnimationFrame(frame);
  }
  go.addEventListener("click", launch);
  refresh();
  return root;
}

// ======================================================================================
// 2. Hit the target: three rounds
// ======================================================================================
export function targetGame(L, rounds, winContent, onWin) {
  const st = { v: 15, ang: 45 };
  const reduced = rm();
  let ri = 0, shots = 0, raf = 0, run = null, won = false, best = null, hitNow = false;
  const sc = makeScene(L.scene, false);
  const ring = s("g");
  const aim = makeAim(L, st, { vStep: 0.1, onChange: () => { const r = rounds[ri]; sc.launcher(r.h0, st.ang); }, onFire: () => fire() });

  const vals = Array.from({ length: 4 }, () => h("b"));
  const names = [L.r_round, L.r_shots, L.r_closest, L.r_tol];
  const info = h("p", { class: "small", "aria-live": "polite" });
  const verdict = h("p", { class: "verdict", "aria-live": "polite" });
  const go = h("button", { class: "btn primary", type: "button" }, L.fire);
  const next = h("button", { class: "btn", type: "button", hidden: true }, L.next);
  const win = h("div", { class: "reveal", hidden: true }, winContent);
  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box" }, sc.svg)),
    h("div", { class: "controls" },
      h("div", { class: "scene-box", style: "max-width:300px;margin:0 auto 6px" }, aim.svg),
      h("p", { class: "small muted", style: "margin:0 0 6px;text-align:center" }, L.drag_hint),
      ...aim.nodes, info,
      h("div", { class: "btn-row" }, go, next), verdict,
      h("div", { class: "readout" }, names.map((n, i) => h("div", {}, h("span", {}, n), vals[i]))), win));

  function setupRound() {
    const r = rounds[ri];
    sc.layout(r.x * 1.3, Math.max(r.y + r.R + 4, r.h0 + 4, 10));
    sc.launcher(r.h0, st.ang);
    sc.trace.setAttribute("d", ""); sc.pred.setAttribute("d", ""); sc.at({ x: 0, y: r.h0 });
    ring.replaceChildren();
    const rp = Math.max(6, r.R * sc.k);
    sc.extra.replaceChildren(
      s("circle", { cx: sc.X(r.x).toFixed(1), cy: sc.Y(r.y).toFixed(1), r: rp.toFixed(1), fill: "rgba(255,125,51,.25)", stroke: "#ff7d33", "stroke-width": 3 }),
      s("circle", { cx: sc.X(r.x).toFixed(1), cy: sc.Y(r.y).toFixed(1), r: 2.5, fill: "#ff7d33" }));
    shots = 0; best = null; hitNow = false;
    info.textContent = fill(L.round_info, { n: ri + 1, total: rounds.length, x: fmt(r.x, 0), y: fmt(r.y, 0), h: fmt(r.h0, 0), r: fmt(r.R, 1) });
    verdict.textContent = ""; next.hidden = true; go.disabled = false;
    vals[0].textContent = `${ri + 1} / ${rounds.length}`; vals[1].textContent = "0"; vals[2].textContent = "—"; vals[3].textContent = `${fmt(r.R, 1)} m`;
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; run = null; }
  function judge(r, sh) {
    const best1 = closestApproach(st.v, st.ang, r.h0, r.x, r.y);
    vals[2].textContent = `${fmt(best1, 1)} m`;
    if (best1 <= r.R) {
      hitNow = true; go.disabled = false;
      verdict.textContent = ri < rounds.length - 1 ? L.hit : L.hit_last;
      if (ri < rounds.length - 1) { next.hidden = false; next.textContent = L.next; }
      else { win.hidden = false; next.hidden = false; next.textContent = L.again; if (!won) { won = true; onWin?.(go); } }
      return;
    }
    const y = heightAtX(st.v, st.ang, r.h0, r.x);
    if (y == null) verdict.textContent = fill(L.short, { d: fmt(Math.max(0, r.x - sh.range), 1) });
    else if (y > r.y) verdict.textContent = fill(L.over, { d: fmt(y - r.y, 1) });
    else verdict.textContent = fill(L.under, { d: fmt(r.y - y, 1) });
  }
  function fire() {
    stop(); const r = rounds[ri];
    const sh = shot(st.v, st.ang, r.h0);
    sc.pred.setAttribute("d", sc.trace.getAttribute("d") || "");   // the last shot stays as a dashed ghost
    sc.trace.setAttribute("d", "");
    if (sh.T == null) { verdict.textContent = L.noflight; return; }
    shots++; vals[1].textContent = String(shots);
    verdict.textContent = ""; next.hidden = true;
    sc.launcher(r.h0, st.ang);
    if (reduced) { sc.trace.setAttribute("d", sc.pathD(st.v, st.ang, r.h0, sh.T, 100)); sc.at(projectileAt(st.v, st.ang, sh.T, r.h0)); judge(r, sh); return; }
    go.disabled = true;
    run = { start: performance.now(), T: sh.T, sh, r };
    raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    if (!run) return;
    if (!root.isConnected) { stop(); return; }
    const { T, sh, r } = run, t = Math.min((now - run.start) / 1000, T);
    sc.at(projectileAt(st.v, st.ang, t, r.h0));
    sc.trace.setAttribute("d", sc.pathD(st.v, st.ang, r.h0, t, Math.max(1, Math.round(t / 0.02))));
    if (t >= T) { run = null; go.disabled = false; judge(r, sh); return; }
    raf = requestAnimationFrame(frame);
  }
  go.addEventListener("click", fire);
  next.addEventListener("click", () => { stop(); ri = ri < rounds.length - 1 ? ri + 1 : 0; if (ri === 0) win.hidden = true; setupRound(); });
  setupRound();
  return root;
}

// ======================================================================================
// 3. Drop one, throw one: same height, same moment
// ======================================================================================
export function dropThrow(L, onEvent) {
  const HEIGHT = 20, K = 9, GYp = 250, XD = 40, XT = 110, STEP = 0.25;
  const reduced = rm();
  let vx = 8, raf = 0, start = 0, T = 0, strobes = [], ran = false;

  const ground = s("path", { d: `M0 ${GYp}H400`, stroke: "#8f86c9", "stroke-width": 2 });
  const strobeG = s("g");
  const dropped = s("circle", { r: 8, fill: "#ffe14d", stroke: "#fff", "stroke-width": 2 });
  const thrown = s("circle", { r: 8, style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 2 });
  const svg = s("svg", { class: "scene", viewBox: "0 0 400 270", role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: 400, height: 270, fill: "#0a0826" }), ground,
    s("rect", { x: XD - 14, y: GYp - HEIGHT * K, width: 28, height: 6, rx: 2, fill: "#3a2f80" }),
    s("rect", { x: XT - 14, y: GYp - HEIGHT * K, width: 28, height: 6, rx: 2, fill: "#3a2f80" }),
    s("text", { x: XD, y: GYp + 16, fill: "#ffe14d", "font-size": 11, "font-weight": 800, "text-anchor": "middle" }, L.lbl_drop),
    s("text", { x: XT, y: GYp + 16, style: "fill: var(--a2)", "font-size": 11, "font-weight": 800, "text-anchor": "middle" }, L.lbl_throw),
    s("text", { x: 396, y: GYp - HEIGHT * K + 4, fill: "#a7a0d0", "font-size": 10, "text-anchor": "end" }, `${HEIGHT} m`),
    strobeG, dropped, thrown);

  const vals = [h("b"), h("b"), h("b")];
  const names = [L.t_drop, L.t_throw, L.dist];
  const go = h("button", { class: "btn primary", type: "button" }, L.release);
  const root = h("div", { class: "lab" },
    h("div", { class: "scene-box" }, svg),
    h("div", { class: "controls" },
      ...slider(L.vx, 0, 15, 1, vx, (v) => `${fmt(v, 0)} m/s`, (v) => { vx = v; reset(); }).nodes,
      h("div", { class: "btn-row" }, go),
      h("div", { class: "readout" }, names.map((n, i) => h("div", {}, h("span", {}, n), vals[i]))),
      h("p", { class: "small muted" }, L.note)));

  const dropAt = (t) => projectileAt(0, 0, t, HEIGHT), throwAt = (t) => projectileAt(vx, 0, t, HEIGHT);
  const px = (p, x0) => [(x0 + p.x * K).toFixed(1), (GYp - Math.max(0, p.y) * K).toFixed(1)];
  function place(t) {
    const [dx, dy] = px(dropAt(t), XD), [tx, ty] = px(throwAt(t), XT);
    dropped.setAttribute("cx", dx); dropped.setAttribute("cy", dy); thrown.setAttribute("cx", tx); thrown.setAttribute("cy", ty);
  }
  function reset() {
    cancelAnimationFrame(raf); raf = 0; ran = false;
    T = flightTime(vx, 0, HEIGHT);
    strobeG.replaceChildren(); strobes = [];
    for (let t = STEP; t <= T + 1e-9; t += STEP) {          // faint rungs: where both balls will be at the same instants
      const [dx, dy] = px(dropAt(t), XD), [tx, ty] = px(throwAt(t), XT);
      const g = s("g", { opacity: 0.22 },
        s("path", { d: `M${dx} ${dy}H${tx}`, ...dash("#fff", 1) }),
        s("circle", { cx: dx, cy: dy, r: 3.5, fill: "#ffe14d" }), s("circle", { cx: tx, cy: ty, r: 3.5, style: "fill: var(--a2)" }));
      strobes.push({ t, g }); strobeG.append(g);
    }
    place(0);
    vals.forEach((v) => { v.textContent = "—"; });
  }
  function show(t) {
    place(t);
    strobes.forEach((o) => o.g.setAttribute("opacity", t + 1e-9 >= o.t ? 1 : 0.22));
  }
  function done() {
    show(T); ran = true;
    vals[0].textContent = `${fmt(flightTime(0, 0, HEIGHT), 2)} s`;
    vals[1].textContent = `${fmt(T, 2)} s`;
    vals[2].textContent = `${fmt(throwAt(T).x, 1)} m`;
  }
  function frame(now) {
    if (!root.isConnected) { cancelAnimationFrame(raf); return; }
    const t = Math.min((now - start) / 1000, T);
    if (t >= T) { done(); return; }
    show(t);
    raf = requestAnimationFrame(frame);
  }
  go.addEventListener("click", () => {
    reset(); onEvent?.("bigidea", go);
    if (reduced) { done(); return; }
    start = performance.now(); raf = requestAnimationFrame(frame);
  });
  reset();
  return root;
}
