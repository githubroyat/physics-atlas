// Interactives for chapter o3 (the simple pendulum): the swing lab, the seconds-pendulum game and the two-bobs demo.
// Model: θ'' = −(g/L)·sinθ (no damping), stepped with RK4 at a fixed 1 ms (pendulumStep from physics.js).
import { h, s, clear } from "../dom.js";
import { G, pendulumPeriod, pendulumPeriodExact, pendulumStep, fmt } from "../physics.js";

const DT = 0.001;                         // s, fixed sub-step
const MAX_DEG = 170, MAX_TH = (MAX_DEG * Math.PI) / 180;
const HARD_TH = Math.PI - 0.001;          // the model never sees an angle ≥ 180°
const D2R = Math.PI / 180;
const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// PHYSICS (move to physics.js): pendulumStep has g fixed at 9.81, so a pendulum of length L under gravity g is the
// same equation as one of length Leff = L·G/g under 9.81 (g/L = G/Leff).
export const leff = (L, g) => (L * G) / g;
/** Small-angle period 2π√(L/g) for any g. */
export const periodSmall = (L, g) => pendulumPeriod(leff(L, g));
/** Exact period for release angle theta0 (radians, |theta0| < π) for any g. */
export const periodExact = (L, g, theta0) => pendulumPeriodExact(leff(L, g), Math.abs(theta0));

/** A running simulation from rest at theta0. turns[] = times (s) of the turning points (ω changes sign), interpolated. */
export function makeSim(L, g, theta0) {
  const Le = leff(L, g);
  const sim = { th: theta0, om: 0, t: 0, turns: [] };
  sim.step = () => {
    const [th2, om2] = pendulumStep(sim.th, sim.om, Le, DT, 0);
    if (sim.om !== 0 && sim.om * om2 <= 0) sim.turns.push(sim.t + (sim.om / (sim.om - om2)) * DT);
    sim.th = Math.max(-HARD_TH, Math.min(HARD_TH, th2)); sim.om = om2; sim.t += DT;
  };
  /** Full period from the latest turning point: T = 2 × (time between turning points; the first is T/2 after release). */
  sim.period = () => {
    const n = sim.turns.length;
    return n ? 2 * (sim.turns[n - 1] - (n > 1 ? sim.turns[n - 2] : 0)) : null;
  };
  return sim;
}
/** Run the model without drawing until the first turning point; returns { half (s, release → far end), T (full period) } or null. */
export function runToFirstTurn(L, g, theta0) {
  if (Math.abs(theta0) < 1e-6) return null;
  const sim = makeSim(L, g, theta0);
  for (let i = 0; i < 400000 && !sim.turns.length; i++) sim.step();
  return sim.turns.length ? { half: sim.turns[0], T: sim.period() } : null;
}

// ---------- drawing helpers ----------
const lenPx = (len, lo, hi) => lo + ((len - 0.1) / 1.9) * (hi - lo);
const massR = (m) => 10 + (8 * (m - 0.1)) / 1.9;
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
  return [h("label", {}, label, out), inp];
}
const sgnFmt = (v, d) => (Math.abs(v) < 0.5 * 10 ** -d ? fmt(0, d) : `${v > 0 ? "+" : "−"}${fmt(Math.abs(v), d)}`);

// ======================================================================================
// 1. The swing lab
// ======================================================================================
const PX = 150, PY = 140;
const WORLDS = [["earth", G], ["moon", 1.62], ["mars", 3.71]];

export function pendulumLab(L, onEvent) {
  let len = 1.0, mass = 1.0, g = G, theta0 = 40 * D2R, th = theta0;
  let sim = null, raf = 0, last = 0, acc = 0, dragging = false, shown = 0;
  const reduced = rm();

  // ----- scene -----
  const rod = s("path", { style: "stroke: var(--a1)", "stroke-width": 3, "stroke-linecap": "round" });
  const ghost = s("circle", { fill: "none", ...dash("#ffe14d") });
  const arc = s("path", { fill: "none", stroke: "#ffe14d", "stroke-width": 2 });
  const arcLabel = s("text", { fill: "#ffe14d", "font-size": 13, "font-weight": 800, "text-anchor": "middle" });
  const disc = s("circle", { style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 3 });
  const bob = s("g", { class: "drag-handle", tabindex: "0", role: "slider", "aria-label": L.drag,
    "aria-valuemin": -MAX_DEG, "aria-valuemax": MAX_DEG, "aria-valuenow": 40 }, disc);
  const svg = s("svg", { class: "scene", viewBox: "0 0 300 290", role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: 300, height: 290, fill: "#0a0826" }),
    s("path", { d: `M${PX} ${PY}V270`, ...dash("rgba(255,255,255,.4)") }),
    s("rect", { x: PX - 40, y: PY - 8, width: 80, height: 8, rx: 3, fill: "#3a2f80" }),
    ghost, arc, arcLabel, rod, s("circle", { cx: PX, cy: PY, r: 5, fill: "#fff" }), bob);

  // ----- controls & readouts -----
  const aVal = h("b"), mVal = h("b"), sVal = h("b"), dVal = h("b");
  const formula = h("div", { class: "formula" });
  const status = h("p", { class: "small", "aria-live": "polite" });
  const go = h("button", { class: "btn primary", type: "button" }, L.release);
  const reset = h("button", { class: "btn", type: "button" }, L.reset);
  const pills = WORLDS.map(([key, gv]) => {
    const b = pill(`${L[key]} ${fmt(gv, 2)} m/s²`, () => { g = gv; syncPills(); restart(); });
    b.dataset.g = String(gv);
    return b;
  });
  const syncPills = () => pills.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.g) === g)));
  syncPills();

  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:340px;margin:0 auto" }, svg),
      h("p", { class: "small muted", style: "margin:8px 0 0;text-align:center" }, L.drag_hint)),
    h("div", { class: "controls" },
      ...slider(L.length, 0.1, 2, 0.05, len, (v) => `${fmt(v, 2)} m`, (v) => { len = v; restart(); }),
      ...slider(L.mass, 0.1, 2, 0.1, mass, (v) => `${fmt(v, 1)} kg`, (v) => { mass = v; draw(); }),
      h("label", {}, L.gravity),
      h("div", { class: "toggle-row", style: "margin-top:4px" }, pills),
      h("div", { class: "btn-row" }, go, reset),
      status,
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.angle), aVal),
        h("div", {}, h("span", {}, L.measured), mVal),
        h("div", {}, h("span", {}, L.small), sVal),
        h("div", {}, h("span", {}, L.diff), dVal)),
      formula));

  // ----- numbers -----
  function readouts() {
    const T0 = periodSmall(len, g);
    aVal.textContent = `${fmt(Math.abs(theta0) / D2R, 0)}°`;
    sVal.textContent = `${fmt(T0, 2)} s`;
    formula.textContent = `T = 2π√(L/g) = 2π√(${fmt(len, 2)} / ${fmt(g, 2)}) = ${fmt(T0, 2)} s`;
  }
  function report(T) {
    const T0 = periodSmall(len, g), d = ((T - T0) / T0) * 100;
    mVal.textContent = `${fmt(T, 2)} s`;
    dVal.textContent = `${sgnFmt(d, 1)} %`;
    status.textContent = Math.abs(theta0) >= 20 * D2R ? L.status_big : L.status_small;
    if (g !== G) onEvent?.("gravity", go);
    if (Math.abs(theta0) >= 60 * D2R && d >= 5) onEvent?.("bigswing", dVal);
  }
  function clearMeasured() { mVal.textContent = "—"; dVal.textContent = "—"; }

  // ----- drawing -----
  function draw() {
    const Lp = lenPx(len, 30, 108), r = massR(mass);
    const x = PX + Lp * Math.sin(th), y = PY + Lp * Math.cos(th);
    rod.setAttribute("d", `M${PX} ${PY}L${x.toFixed(1)} ${y.toFixed(1)}`);
    bob.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    disc.setAttribute("r", r);
    const showGhost = sim || Math.abs(th - theta0) > 1e-9;
    ghost.setAttribute("opacity", showGhost ? 0.8 : 0);
    ghost.setAttribute("cx", (PX + Lp * Math.sin(theta0)).toFixed(1)); ghost.setAttribute("cy", (PY + Lp * Math.cos(theta0)).toFixed(1)); ghost.setAttribute("r", r);
    // angle arc from straight down to the rod
    const R = 40;
    if (Math.abs(th) > 0.02) {
      arc.setAttribute("d", `M${PX} ${PY + R}A${R} ${R} 0 0 ${th > 0 ? 0 : 1} ${(PX + R * Math.sin(th)).toFixed(1)} ${(PY + R * Math.cos(th)).toFixed(1)}`);
      const mid = th / 2;
      arcLabel.setAttribute("x", (PX + 62 * Math.sin(mid)).toFixed(1)); arcLabel.setAttribute("y", (PY + 62 * Math.cos(mid) + 5).toFixed(1));
      arcLabel.textContent = `${fmt(Math.abs(th) / D2R, 0)}°`;
    } else { arc.setAttribute("d", ""); arcLabel.textContent = ""; }
    bob.setAttribute("aria-valuenow", Math.round(theta0 / D2R));
  }

  // ----- run / stop -----
  function stop() { cancelAnimationFrame(raf); sim = null; shown = 0; }
  function release() {
    stop();
    onEvent?.("release", go);
    if (Math.abs(theta0) < 1 * D2R) { status.textContent = L.pull_first; th = theta0; clearMeasured(); draw(); return; }
    if (reduced) { // still picture + all the numbers
      th = theta0;
      const r = runToFirstTurn(len, g, theta0);
      if (r) report(r.T);
      draw(); return;
    }
    sim = makeSim(len, g, theta0); acc = 0; last = performance.now(); shown = 0;
    clearMeasured(); status.textContent = L.status_run;
    raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    if (!sim) return;
    if (!root.isConnected) { stop(); return; }
    acc += Math.min(now - last, 50) / 1000; last = now;
    for (let n = 0; acc >= DT && n < 60; n++, acc -= DT) sim.step();
    th = sim.th;
    if (sim.turns.length !== shown) { shown = sim.turns.length; report(sim.period()); }
    draw();
    raf = requestAnimationFrame(frame);
  }
  function restart() { // after changing length or gravity: hang at the release angle again (and swing again if it was swinging)
    const was = !!sim;
    stop(); th = theta0; clearMeasured(); status.textContent = ""; readouts(); draw();
    if (was) release();
    else if (reduced) { const r = runToFirstTurn(len, g, theta0); if (r) report(r.T); }
  }
  function setAngle(a) { stop(); theta0 = Math.max(-MAX_TH, Math.min(MAX_TH, a)); th = theta0; clearMeasured(); status.textContent = ""; readouts(); draw(); }

  // ----- dragging (gesture lock on the bob only) -----
  const toSvg = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  bob.addEventListener("pointerdown", (e) => {
    dragging = true; e.preventDefault(); stop();
    try { bob.setPointerCapture(e.pointerId); } catch { /* capture is a nicety; the flag still works */ }
  });
  bob.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const p = toSvg(e);
    if (Math.hypot(p.x - PX, p.y - PY) < 1) return;          // exactly on the pivot: keep the old angle
    setAngle(Math.atan2(p.x - PX, p.y - PY));
  });
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) bob.addEventListener(ev, () => {
    if (!dragging) return;
    dragging = false;
    if (ev === "pointerup") release();                       // let go of the bob = let go of the pendulum
  });
  bob.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (step) { e.preventDefault(); setAngle(theta0 + step * D2R); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); release(); }
  });
  go.addEventListener("click", release);
  reset.addEventListener("click", () => { stop(); th = theta0; clearMeasured(); status.textContent = ""; draw(); });

  readouts(); clearMeasured(); draw();
  if (reduced) { const r = runToFirstTurn(len, g, theta0); if (r) report(r.T); }
  return root;
}

// ======================================================================================
// 2. Build a seconds pendulum: set the length so one one-way swing takes 1.00 s on Earth (within 1%)
// ======================================================================================
export function secondsGame(L, winContent, onWin) {
  const TH0 = 5 * D2R, TOL = 0.01;
  let len = 0.5, sim = null, raf = 0, last = 0, acc = 0, first = null, attempts = 0, won = false;
  const reduced = rm();
  const GPY = 20, bobAt = (th) => [150 + lenPx(len, 40, 230) * Math.sin(th), GPY + lenPx(len, 40, 230) * Math.cos(th)];

  const rod = s("path", { style: "stroke: var(--a1)", "stroke-width": 3, "stroke-linecap": "round" });
  const disc = s("circle", { r: 14, style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 3 });
  const bob = s("g", {}, disc);
  const svg = s("svg", { class: "scene", viewBox: "0 0 300 290", role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: 300, height: 290, fill: "#0a0826" }),
    s("path", { d: `M150 ${GPY}V280`, ...dash("rgba(255,255,255,.4)") }),
    s("rect", { x: 110, y: GPY - 8, width: 80, height: 8, rx: 3, fill: "#3a2f80" }),
    rod, bob);

  const lVal = h("b"), tVal = h("b"), nVal = h("b");
  const verdict = h("p", { class: "verdict", "aria-live": "polite" });
  const win = h("div", { class: "reveal", hidden: true }, winContent);
  const go = h("button", { class: "btn primary", type: "button" }, L.test);
  const root = h("div", { class: "lab" },
    h("div", { class: "scene-box", style: "max-width:340px;margin:0 auto" }, svg),
    h("div", { class: "controls" },
      ...slider(L.length, 0.1, 2, 0.01, len, (v) => `${fmt(v, 2)} m`, (v) => { len = v; reset(); }),
      h("div", { class: "btn-row" }, go),
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.length), lVal),
        h("div", {}, h("span", {}, L.oneway), tVal),
        h("div", {}, h("span", {}, L.target), h("b", {}, "1.00 s ± 1%")),
        h("div", {}, h("span", {}, L.tries), nVal)),
      verdict, win));

  function draw(th, t) {
    const [x, y] = bobAt(th);
    rod.setAttribute("d", `M150 ${GPY}L${x.toFixed(1)} ${y.toFixed(1)}`);
    bob.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    lVal.textContent = `${fmt(len, 2)} m`;
    nVal.textContent = String(attempts);
    tVal.textContent = first != null ? `${fmt(first, 3)} s` : t != null ? `${fmt(t, 3)} s` : "—";
  }
  function stop() { cancelAnimationFrame(raf); sim = null; }
  function reset() { stop(); first = null; verdict.textContent = ""; draw(TH0, null); }
  function judge(t) {
    first = t; attempts++;
    const ok = Math.abs(t - 1) <= TOL;
    verdict.textContent = ok ? L.ok : t > 1 ? L.too_slow : L.too_fast;
    if (ok && !won) { won = true; win.hidden = false; onWin?.(go); }
    draw(sim ? sim.th : -TH0, null);
  }
  function test() {
    stop(); first = null; verdict.textContent = "";
    if (reduced) { const r = runToFirstTurn(len, G, TH0); judge(r.half); draw(-TH0, null); return; }
    sim = makeSim(len, G, TH0); acc = 0; last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    if (!sim) return;
    if (!root.isConnected) { stop(); return; }
    acc += Math.min(now - last, 50) / 1000; last = now;
    for (let n = 0; acc >= DT && n < 60; n++, acc -= DT) sim.step();
    if (first == null && sim.turns.length) judge(sim.turns[0]);   // the first turning point = one one-way swing
    draw(sim.th, sim.t);
    raf = requestAnimationFrame(frame);
  }
  go.addEventListener("click", test);

  draw(TH0, null);
  return root;
}

// ======================================================================================
// 3. Two bobs, very different masses, same length: they swing together
// ======================================================================================
export function twoBobs(L, onEvent) {
  const LEN = 1.0, MASSES = [0.2, 2.0], XS = [90, 210], TOP = 30, LP = 110;
  let theta0 = 30 * D2R, sims = null, raf = 0, last = 0, acc = 0;
  const reduced = rm();

  const rods = MASSES.map(() => s("path", { style: "stroke: var(--a1)", "stroke-width": 3, "stroke-linecap": "round" }));
  const discs = MASSES.map((m, i) => s("circle", { r: m < 1 ? 10 : 20, style: i ? "fill: var(--a2)" : "fill: #ffe14d", stroke: "#fff", "stroke-width": 3 }));
  const svg = s("svg", { class: "scene", viewBox: "0 0 300 200", role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: 300, height: 200, fill: "#0a0826" }),
    s("rect", { x: 40, y: TOP - 8, width: 220, height: 8, rx: 3, fill: "#3a2f80" }),
    ...XS.map((x) => s("path", { d: `M${x} ${TOP}V190`, ...dash("rgba(255,255,255,.3)") })),
    ...rods, ...discs,
    ...MASSES.map((m, i) => s("text", { x: XS[i], y: 196, "text-anchor": "middle", fill: "#c4bce8", "font-size": 12, "font-weight": 800 }, `${fmt(m, 1)} kg`)));

  const vals = [0, 1, 2, 3].map(() => h("b"));
  const go = h("button", { class: "btn primary", type: "button" }, L.release);
  const back = h("button", { class: "btn", type: "button" }, L.reset);
  const root = h("div", { class: "lab" },
    h("div", { class: "scene-box", style: "max-width:340px;margin:0 auto" }, svg),
    h("div", { class: "controls" },
      ...slider(L.angle, 5, 60, 5, 30, (v) => `${v}°`, (v) => { theta0 = v * D2R; stop(); draw(theta0); }),
      h("div", { class: "btn-row" }, go, back),
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, `${L.force} · ${fmt(MASSES[0], 1)} kg`), vals[0]),
        h("div", {}, h("span", {}, `${L.force} · ${fmt(MASSES[1], 1)} kg`), vals[1]),
        h("div", {}, h("span", {}, `${L.accel} · ${fmt(MASSES[0], 1)} kg`), vals[2]),
        h("div", {}, h("span", {}, `${L.accel} · ${fmt(MASSES[1], 1)} kg`), vals[3])),
      h("p", { class: "small muted" }, L.note)));

  function draw(...ths) {
    MASSES.forEach((m, i) => {
      const th = ths[i] ?? ths[0], x = XS[i] + LP * Math.sin(th), y = TOP + LP * Math.cos(th);
      rods[i].setAttribute("d", `M${XS[i]} ${TOP}L${x.toFixed(1)} ${y.toFixed(1)}`);
      discs[i].setAttribute("cx", x.toFixed(1)); discs[i].setAttribute("cy", y.toFixed(1));
      // tiny epsilon: float sin(30°) is 0.4999…, so 4.905 would otherwise display as 4.90 instead of 4.91
      vals[i].textContent = `${fmt(Math.abs(m * G * Math.sin(th)) + 1e-9, 2)} N`;          // F = m·g·sinθ along the swing
      vals[2 + i].textContent = `${fmt(Math.abs((m * G * Math.sin(th)) / m) + 1e-9, 2)} m/s²`; // a = F/m = g·sinθ
    });
  }
  function stop() { cancelAnimationFrame(raf); sims = null; }
  function frame(now) {
    if (!sims) return;
    if (!root.isConnected) { stop(); return; }
    acc += Math.min(now - last, 50) / 1000; last = now;
    for (let n = 0; acc >= DT && n < 60; n++, acc -= DT) sims.forEach((sm) => sm.step());
    draw(...sims.map((sm) => sm.th));
    raf = requestAnimationFrame(frame);
  }
  go.addEventListener("click", () => {
    stop(); onEvent?.("mass", go);
    if (reduced) { draw(theta0); return; }
    sims = MASSES.map(() => makeSim(LEN, G, theta0)); acc = 0; last = performance.now();
    raf = requestAnimationFrame(frame);
  });
  back.addEventListener("click", () => { stop(); draw(theta0); });
  draw(theta0);
  return root;
}
