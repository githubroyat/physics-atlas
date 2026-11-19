// Interactives for chapter o4 "Where the bounce goes": a horizontal spring on a frictionless track with live
// energy bars + an energy-time graph (energyLab), a predict-the-split game (splitGame), a catch-the-moment game
// (catchGame) and a damping detective (dampingDetective). All use y for displacement and A for amplitude.
// Damping is a plain slider of words (none ... heavy); no damping formulas are shown to the student.
import { h, s, rich } from "../dom.js";
import { shmEnergy, springPeriod, elasticEnergy, kineticEnergy, fmt } from "../physics.js";

const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const fill = (str, v) => String(str).replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k]) : m));

export const DT = 0.002;       // fixed simulation step, s (stable for every slider setting)
export const TMAX = 20;        // seconds simulated after each (re)start
const COL = { K: "#2ef2ff", U: "#ff4fd8", W: "#ffe14d", H: "#ff8a3d" };

// Damping levels 0..5 = none, very light, light, medium, strong, heavy. Each is a damping ratio ζ, so the same
// word looks the same for every m and k (the student only sees the words).
export const LEVELS = [0, 0.02, 0.06, 0.2, 0.5, 1.5];

// PHYSICS (move to physics.js): damping coefficient b (kg/s) for the force −b·v from a damping ratio ζ.
export const dampingCoeff = (m, k, zeta) => 2 * zeta * Math.sqrt(k * m);

/**
 * Horizontal spring, frictionless track, released from rest at y = A. With ζ = 0 the exact y = A·cos(ω·t) is used
 * (so the total is exactly flat); otherwise m·y'' = −k·y − b·y' is integrated with RK4 at a fixed step.
 */
export function trace(m, k, A, zeta, tEnd = TMAX, dt = DT) {
  const n = Math.floor(tEnd / dt) + 1;
  const y = new Float64Array(n), v = new Float64Array(n), K = new Float64Array(n), U = new Float64Array(n);
  const q = k / m, c = dampingCoeff(m, k, zeta) / m, w = Math.sqrt(q);
  const acc = (p, u) => -q * p - c * u;
  let yy = A, vv = 0;
  for (let i = 0; i < n; i++) {
    if (zeta === 0) { const t = i * dt; yy = A * Math.cos(w * t); vv = -A * w * Math.sin(w * t); }
    y[i] = yy; v[i] = vv; U[i] = elasticEnergy(k, yy); K[i] = kineticEnergy(m, vv);
    if (zeta > 0) {
      const k1y = vv, k1v = acc(yy, vv);
      const k2y = vv + (dt / 2) * k1v, k2v = acc(yy + (dt / 2) * k1y, vv + (dt / 2) * k1v);
      const k3y = vv + (dt / 2) * k2v, k3v = acc(yy + (dt / 2) * k2y, vv + (dt / 2) * k2v);
      const k4y = vv + dt * k3v, k4v = acc(yy + dt * k3y, vv + dt * k3v);
      yy += (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
      vv += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    }
  }
  return { n, dt, y, v, K, U };
}

// ---------------------------------------------------------------------------------------------
// shared drawing pieces
// ---------------------------------------------------------------------------------------------
const EQ = 180, PX = 560, YS = 79;     // scene: equilibrium x, pixels per metre, spring height

function makeScene(label, A) {
  const spring = s("path", { fill: "none", stroke: COL.K, "stroke-width": 3.5, "stroke-linejoin": "round", "stroke-linecap": "round" });
  const block = s("g", {}, s("rect", { x: -20, y: -19, width: 40, height: 38, rx: 7, style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 3 }));
  const marks = s("g", {});
  const spot = s("g", { opacity: 0 });
  const svg = s("svg", { class: "scene", viewBox: "0 0 320 110", role: "img", "aria-label": label, style: "touch-action: pan-y" },
    s("rect", { width: 320, height: 110, fill: "#0a0826" }),
    s("rect", { x: 0, y: 98, width: 320, height: 6, fill: "#3a2f80" }),
    s("rect", { x: 0, y: 30, width: 12, height: 68, fill: "#3a2f80" }),
    marks, spot, spring, block);
  const tick = (x, txt, col, dashed) => [
    s("path", { d: `M${x.toFixed(1)} 24V98`, stroke: col, "stroke-width": dashed ? 1.5 : 2.5, "stroke-dasharray": dashed ? "4 5" : "none" }),
    s("text", { x: x.toFixed(1), y: 16, fill: col, "font-size": 12, "font-weight": 800, "text-anchor": "middle" }, txt)];
  function setA(a) {
    marks.replaceChildren(...tick(EQ, "0", "#c4bce8", true), ...tick(EQ - a * PX, "−A", "#ffe14d", true), ...tick(EQ + a * PX, "A", "#ffe14d", true));
    const r = (a * PX) / Math.SQRT2;
    spot.replaceChildren(...tick(EQ - r, "", "#ffe14d", false), ...tick(EQ + r, "", "#ffe14d", false));
  }
  function set(y) {
    const xb = EQ + y * PX, n = 12, a0 = 18, len = Math.max(8, xb - 20 - 6 - a0);
    let d = `M12 ${YS}H${a0}`;
    for (let i = 0; i < n; i++) d += ` L${(a0 + (len * (i + 0.5)) / n).toFixed(1)} ${YS + (i % 2 ? -11 : 11)}`;
    d += ` L${a0 + len} ${YS}H${(xb - 20).toFixed(1)}`;
    spring.setAttribute("d", d);
    block.setAttribute("transform", `translate(${xb.toFixed(1)} ${YS})`);
  }
  setA(A); set(A);
  return { svg, set, setA, spot: (on) => spot.setAttribute("opacity", on ? 0.85 : 0) };
}

function makeBars(rows, fmtVal) {
  const H = 8 + rows.length * 26;
  const fills = rows.map((r, i) => s("rect", { x: 84, y: 6 + i * 26, width: 0, height: 20, rx: 5, fill: r.col }));
  const vals = rows.map((r, i) => s("text", { x: 306, y: 21 + i * 26, "text-anchor": "end", fill: "#fff", "font-size": 12, "font-weight": 800,
    style: "paint-order: stroke; stroke: #0a0826; stroke-width: 3px" }, ""));
  const svg = s("svg", { class: "scene", viewBox: `0 0 320 ${H}`, role: "img", "aria-label": rows.map((r) => r.label).join(", "), style: "touch-action: pan-y" },
    s("rect", { width: 320, height: H, fill: "#0a0826" }),
    ...rows.map((r, i) => s("rect", { x: 84, y: 6 + i * 26, width: 228, height: 20, rx: 5, fill: "rgba(255,255,255,.08)" })),
    ...fills,
    ...rows.map((r, i) => s("text", { x: 6, y: 21 + i * 26, fill: r.col, "font-size": 13, "font-weight": 800 }, r.label)),
    ...vals);
  function set(values, W0) {
    values.forEach((v, i) => {
      fills[i].setAttribute("width", (228 * clamp(v / W0, 0, 1)).toFixed(1));
      vals[i].textContent = fmtVal(v, W0);
    });
  }
  return { svg, set };
}

const GX0 = 34, GX1 = 312, GY0 = 16, GY1 = 160;
function makeGraph(L) {
  const line = (col, w, extra = {}) => s("path", { fill: "none", stroke: col, "stroke-width": w, "stroke-linejoin": "round", ...extra });
  const periods = s("g", {});
  const heat = s("path", { fill: COL.H, opacity: 0.28 });
  const ghosts = [COL.U, COL.K, COL.W].map((c) => line(c, 2, { opacity: 0.22 }));
  const [pU, pK, pT] = [COL.U, COL.K, COL.W].map((c, i) => line(c, i === 2 ? 3.5 : 2.5));
  const cursor = s("path", { stroke: "rgba(255,255,255,.55)", "stroke-width": 1.5 });
  const svg = s("svg", { class: "scene", viewBox: "0 0 320 190", role: "img", "aria-label": L.graph, style: "touch-action: pan-y" },
    s("rect", { width: 320, height: 190, fill: "#0a0826" }),
    periods,
    s("path", { d: `M${GX0} ${GY0}H${GX1}`, stroke: "rgba(255,225,77,.55)", "stroke-width": 1.5, "stroke-dasharray": "4 4" }),
    s("path", { d: `M${GX0} ${GY1}H${GX1}`, stroke: "rgba(255,255,255,.35)", "stroke-width": 1.5 }),
    heat, ...ghosts, pU, pK, pT, cursor,
    s("text", { x: 4, y: GY0 + 4, fill: COL.W, "font-size": 13, "font-weight": 800 }, "W"),
    s("text", { x: 4, y: GY1 + 4, fill: "#c4bce8", "font-size": 12, "font-weight": 800 }, "0"),
    s("text", { x: GX0, y: 11, fill: "#c4bce8", "font-size": 12, "font-weight": 800 }, L.energy_axis),
    s("text", { x: GX1, y: 184, fill: "#c4bce8", "font-size": 12, "font-weight": 800, "text-anchor": "end" }, L.time_axis));

  /** from/win: visible time window; upto: how far the solid curves go; ghost: also draw the faint future. */
  function draw({ tr, from, win, upto, W0, T, ghost }) {
    const px = (tt) => GX0 + ((tt - from) / win) * (GX1 - GX0);
    const py = (E) => GY1 - (clamp(E, 0, W0 * 1.02) / W0) * (GY1 - GY0);
    const at = (arr, tt) => arr[Math.min(tr.n - 1, Math.max(0, Math.round(tt / tr.dt)))];
    const path = (get, tEnd) => {
      const nn = Math.max(2, Math.ceil((220 * (tEnd - from)) / win));
      const pts = [];
      for (let j = 0; j <= nn; j++) { const tt = from + ((tEnd - from) * j) / nn; pts.push([px(tt), py(get(tt))]); }
      return pts;
    };
    const str = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("");
    const gets = [(tt) => at(tr.U, tt), (tt) => at(tr.K, tt), (tt) => at(tr.K, tt) + at(tr.U, tt)];
    const solid = gets.map((g) => path(g, upto));
    [pU, pK, pT].forEach((p, i) => p.setAttribute("d", str(solid[i])));
    ghosts.forEach((p, i) => p.setAttribute("d", ghost ? str(path(gets[i], from + win)) : ""));
    const tot = solid[2], top = py(W0);
    heat.setAttribute("d", `${str(tot)}L${tot[tot.length - 1][0].toFixed(1)} ${top}L${tot[0][0].toFixed(1)} ${top}Z`);
    const cx = px(upto).toFixed(1);
    cursor.setAttribute("d", `M${cx} ${GY0}V${GY1}`);
    const lines = [];
    for (let n = Math.ceil(from / T); n * T <= from + win + 1e-9; n++) {
      if (n * T < from) continue;
      lines.push(s("path", { d: `M${px(n * T).toFixed(1)} ${GY0}V${GY1}`, stroke: "rgba(255,255,255,.14)", "stroke-width": 1, "stroke-dasharray": "2 4" }));
    }
    periods.replaceChildren(...lines);
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
// 1. The energy lab
// ---------------------------------------------------------------------------------------------
export function energyLab(L, onEvent) {
  let m = 0.5, k = 20, A = 0.1, level = 0, t = 0, playing = true, slow = false, raf = 0, last = performance.now();
  let tr, W0, T, win, damped = false, aMin = A, aMax = A, doubled = false;
  const reduced = rm();
  const J = (v) => `${fmt(v, 4)} J`;

  const scene = makeScene(L.scene, A);
  const bars = makeBars([
    { label: L.kinetic, col: COL.K }, { label: L.elastic, col: COL.U }, { label: L.total, col: COL.W }, { label: L.heat, col: COL.H }], J);
  const graph = makeGraph(L);

  const playBtn = h("button", { class: "btn primary", type: "button", hidden: reduced }, L.pause);
  const againBtn = h("button", { class: "btn", type: "button", hidden: reduced }, L.again);
  const slowPill = h("button", { class: "pill", type: "button", "aria-pressed": "false", hidden: reduced }, L.slow);
  const scrub = h("input", { type: "range", min: 0, max: 5, step: 0.01, value: 0, "aria-label": L.scrub });
  const rd = [0, 1, 2, 3, 4, 5, 6].map(() => h("b"));

  const root = h("div", { class: "lab" },
    h("div", { style: "max-width:420px;margin:0 auto" },
      h("div", { class: "scene-box" }, scene.svg),
      h("div", { class: "scene-box", style: "margin-top:8px" }, bars.svg),
      h("div", { class: "scene-box", style: "margin-top:8px" }, graph.svg),
      h("p", { class: "small muted" }, L.period_note)),
    h("div", { class: "controls" },
      h("div", { class: "btn-row" }, playBtn, againBtn),
      h("div", { class: "toggle-row" }, slowPill),
      h("label", {}, L.scrub),
      scrub,
      ...slider(L.mass, 0.1, 2, 0.05, m, (v) => `${fmt(v, 2)} kg`, (v) => { m = v; recompute(); }),
      ...slider(L.k, 5, 100, 1, k, (v) => `${fmt(v, 0)} N/m`, (v) => { k = v; recompute(); }),
      ...slider(L.amp, 2, 20, 1, A * 100, (v) => `${fmt(v, 0)} cm`, (v) => {
        A = v / 100; aMin = Math.min(aMin, A); aMax = Math.max(aMax, A);
        if (!doubled && aMax >= 2 * aMin) { doubled = true; onEvent?.("double", root); }
        recompute();
      }),
      ...slider(L.damping, 0, 5, 1, level, (v) => L.levels[v], (v) => { level = v; recompute(); })),
    h("div", { class: "readout" },
      h("div", {}, h("span", {}, L.r_kin), rd[0]),
      h("div", {}, h("span", {}, L.r_el), rd[1]),
      h("div", {}, h("span", {}, L.r_tot), rd[2]),
      h("div", {}, h("span", {}, L.r_heat), rd[3]),
      h("div", {}, h("span", {}, L.r_w0), rd[4]),
      h("div", {}, h("span", {}, L.period), rd[5]),
      h("div", {}, h("span", {}, L.vmax), rd[6])));

  function recompute() {
    tr = trace(m, k, A, LEVELS[level]);
    W0 = shmEnergy(k, A);
    T = springPeriod(m, k);
    win = clamp(6 * T, 2.5, 8);
    scrub.max = String(win); scrub.step = String(win / 400);
    t = reduced ? T / 8 : 0;           // a still picture shows the moment where kinetic = elastic
    playing = !reduced;
    damped = false;
    scene.setA(A);
    rd[4].textContent = J(W0);
    rd[5].textContent = `${fmt(T, 2)} s`;
    rd[6].textContent = `${fmt(A * Math.sqrt(k / m), 2)} m/s`;
    syncBtn();
    draw();
  }
  function syncBtn() { playBtn.textContent = playing ? L.pause : L.play; }

  function draw() {
    const i = Math.min(tr.n - 1, Math.round(t / DT));
    const y = tr.y[i], K = tr.K[i], U = tr.U[i], heat = Math.max(0, W0 - K - U);
    scene.set(y);
    bars.set([K, U, K + U, heat], W0);
    graph.draw({ tr, from: t < win ? 0 : t - win, win, upto: t, W0, T, ghost: t < win });
    scrub.value = String(Math.min(t, win));
    rd[0].textContent = J(K); rd[1].textContent = J(U); rd[2].textContent = J(K + U); rd[3].textContent = J(heat);
    if (level > 0 && !damped && K + U < 0.5 * W0) { damped = true; onEvent?.("damp", root); }
  }

  function frame(now) {
    if (!root.isConnected) return;          // chapter left: stop animating
    if (playing) {
      t += (Math.min(now - last, 50) / 1000) * (slow ? 0.25 : 1);
      if (t >= TMAX) { t = TMAX; playing = false; syncBtn(); }
      draw();
    }
    last = now;
    raf = requestAnimationFrame(frame);
  }
  playBtn.addEventListener("click", () => {
    if (!playing && t >= TMAX) t = 0;
    playing = !playing; last = performance.now(); syncBtn(); draw();
  });
  againBtn.addEventListener("click", () => { t = 0; playing = true; last = performance.now(); syncBtn(); draw(); });
  slowPill.addEventListener("click", () => { slow = !slow; slowPill.setAttribute("aria-pressed", String(slow)); });
  scrub.addEventListener("input", () => { playing = false; t = Number(scrub.value); syncBtn(); draw(); });

  recompute();
  if (!reduced) raf = requestAnimationFrame(frame);
  return root;
}

// ---------------------------------------------------------------------------------------------
// 2. Predict the split: the mass is frozen, how much of the energy is in the spring?
// ---------------------------------------------------------------------------------------------
export const SPLIT_ROUNDS = [0.5, -0.8, 0.3, -0.9, 0.6];   // y as a fraction of A
export const SPLIT_TOL = 6;                                  // percentage points

export function splitGame(L, onWin) {
  const A = 0.15;
  let idx = 0, right = 0, answered = false, finished = false, won = false;
  const scene = makeScene(L.scene, A);
  const bars = makeBars([{ label: L.kinetic, col: COL.K }, { label: L.elastic, col: COL.U }], (v) => `${fmt(v, 0)}%`);
  const barsBox = h("div", { class: "scene-box", style: "margin-top:8px", hidden: true }, bars.svg);
  const posOut = h("b");
  const verdict = h("p", { class: "verdict", "aria-live": "polite" });
  const hint = h("p", { class: "small muted", hidden: true });
  const ans = h("input", { type: "range", min: 0, max: 100, step: 1, value: 50, "aria-label": L.guess });
  const ansOut = h("output");
  const check = h("button", { class: "btn primary", type: "button" }, L.check);
  const next = h("button", { class: "btn", type: "button", hidden: true }, L.next);
  const hintBtn = h("button", { class: "pill", type: "button" }, L.hint_btn);
  const score = h("b");
  const syncAns = () => { ansOut.textContent = `${ans.value}%`; };
  ans.addEventListener("input", syncAns);
  const win = h("div", { class: "reveal", hidden: true }, rich(L.win));

  const root = h("div", { class: "lab" },
    h("div", { style: "max-width:420px;margin:0 auto" }, h("div", { class: "scene-box" }, scene.svg), barsBox),
    h("div", { class: "controls" },
      h("div", { class: "readout" }, h("div", {}, h("span", {}, L.position), posOut), h("div", {}, h("span", {}, L.score), score)),
      h("label", {}, L.guess, ansOut), ans,
      h("div", { class: "btn-row" }, check, next),
      h("div", { class: "toggle-row" }, hintBtn), hint, verdict, win));

  const yf = () => SPLIT_ROUNDS[idx];
  function show() {
    const f = yf();
    scene.set(A * f);
    posOut.textContent = `y = ${f < 0 ? "−" : "+"}${fmt(Math.abs(f), 1)}·A`;
    score.textContent = `${right} / ${SPLIT_ROUNDS.length}`;
    barsBox.hidden = true; verdict.textContent = ""; hint.hidden = true; hintBtn.hidden = false;
    ans.disabled = false; ans.value = "50"; syncAns();
    check.hidden = false; next.hidden = true; answered = false;
  }
  check.addEventListener("click", () => {
    if (answered) return;
    answered = true;
    const U = Math.round(yf() * yf() * 100), K = 100 - U;
    const ok = Math.abs(Number(ans.value) - U) <= SPLIT_TOL;
    if (ok) right++;
    bars.set([K, U], 100); barsBox.hidden = false; ans.disabled = true; check.hidden = true; next.hidden = false;
    score.textContent = `${right} / ${SPLIT_ROUNDS.length}`;
    verdict.textContent = fill(ok ? L.right : L.wrong, { U, K, f: fmt(Math.abs(yf()), 1) });
    next.textContent = idx === SPLIT_ROUNDS.length - 1 ? L.again : L.next;
    if (!won && right >= 3) { won = true; win.hidden = false; onWin?.(check); }
  });
  next.addEventListener("click", () => {
    if (idx === SPLIT_ROUNDS.length - 1) { idx = 0; right = 0; } else idx++;
    show();
  });
  hintBtn.addEventListener("click", () => { hint.hidden = false; hint.replaceChildren(h("span", {}, L.hint)); hintBtn.hidden = true; });
  show();
  return root;
}

// ---------------------------------------------------------------------------------------------
// 3. Catch the moment kinetic = elastic (slow-motion; bars hidden until you tap)
// ---------------------------------------------------------------------------------------------
export const CATCH_TOL = 0.30;   // |E_kin − E_el| ≤ 0.30·W counts as caught (each between 35% and 65%)
export const CATCH_ROUNDS = [{ m: 0.5, k: 20, Tshow: 6 }, { m: 0.3, k: 40, Tshow: 5 }, { m: 1.0, k: 10, Tshow: 4 }];
/** Share of the total energy that is kinetic when the mass is at y = frac·A (frac in −1…1). */
export const kineticShare = (frac) => 1 - frac * frac;

export function catchGame(L, onWin) {
  const A = 0.15, NEED = 3, reduced = rm();
  let round = 0, caught = 0, tries = 0, tau = 0, hold = 0, yTap = 0, easy = false, won = false, shown = false, raf = 0, last = performance.now();
  const scene = makeScene(L.scene, A);
  const bars = makeBars([{ label: L.kinetic, col: COL.K }, { label: L.elastic, col: COL.U }], (v) => `${fmt(v * 100, 0)}%`);
  const barsBox = h("div", { class: "scene-box", style: "margin-top:8px", hidden: true }, bars.svg);
  const verdict = h("p", { class: "verdict", "aria-live": "polite" });
  const go = h("button", { class: "btn primary", type: "button" }, reduced ? L.check : L.now);
  const pos = h("input", { type: "range", min: -100, max: 100, step: 1, value: 100, "aria-label": L.pos, hidden: reduced });
  const posOut = h("output");
  const easyPill = h("button", { class: "pill", type: "button", "aria-pressed": "false" }, L.easy);
  const rd = [0, 1, 2].map(() => h("b"));
  const win = h("div", { class: "reveal", hidden: true }, rich(L.win));

  const root = h("div", { class: "lab" },
    h("div", { style: "max-width:420px;margin:0 auto" }, h("div", { class: "scene-box" }, scene.svg), barsBox),
    h("div", { class: "controls" },
      reduced ? h("label", {}, L.pos, posOut) : null, reduced ? pos : null,
      h("div", { class: "btn-row" }, go),
      h("div", { class: "toggle-row" }, easyPill),
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.caught), rd[0]), h("div", {}, h("span", {}, L.tries), rd[1]), h("div", {}, h("span", {}, L.speed), rd[2])),
      verdict, win));

  const cur = () => CATCH_ROUNDS[round];
  const yNow = () => (reduced ? (A * Number(pos.value)) / 100 : hold > 0 ? yTap : A * Math.cos((2 * Math.PI * tau) / cur().Tshow));
  function render() {
    const y = yNow(), f = y / A, K = kineticShare(f);
    scene.set(y);
    bars.set([K, 1 - K], 1);
    barsBox.hidden = !(easy || shown);
    posOut.textContent = `${fmt(Number(pos.value), 0)}%`;
    rd[0].textContent = `${caught} / ${NEED}`; rd[1].textContent = String(tries);
    rd[2].textContent = `× ${fmt(cur().Tshow / springPeriod(cur().m, cur().k), 1)}`;
  }
  function tap() {
    if (hold > 0) return;
    const y = yNow(), f = y / A, K = kineticShare(f), U = 1 - K;
    tries++; yTap = y; shown = true; scene.spot(true);
    const ok = Math.abs(K - U) <= CATCH_TOL;
    const vars = { K: fmt(K * 100, 0), U: fmt(U * 100, 0), y: fmt(Math.abs(f), 2) };
    verdict.textContent = fill(ok ? L.caught_msg : U > K ? L.too_out : L.too_mid, vars);
    if (ok) { caught++; round = (round + 1) % CATCH_ROUNDS.length; }
    if (!reduced) hold = 1.7;
    if (ok && !won && caught >= NEED) { won = true; win.hidden = false; onWin?.(go); }
    render();
  }
  function frame(now) {
    if (!root.isConnected) return;
    const dt = Math.min(now - last, 50) / 1000; last = now;
    if (hold > 0) { hold -= dt; if (hold <= 0) { hold = 0; shown = false; tau = 0; } } else tau += dt;
    render();
    raf = requestAnimationFrame(frame);
  }
  go.addEventListener("click", tap);
  pos.addEventListener("input", () => { shown = false; render(); });
  easyPill.addEventListener("click", () => { easy = !easy; easyPill.setAttribute("aria-pressed", String(easy)); render(); });
  render();
  if (!reduced) raf = requestAnimationFrame(frame);
  return root;
}

// ---------------------------------------------------------------------------------------------
// 4. Damping detective: read the energy graph and say how strong the damping was (words only)
// ---------------------------------------------------------------------------------------------
export const DETECT_ROUNDS = [3, 2, 5];     // LEVELS index shown in each round; answers: 0 light, 1 medium, 2 heavy
const DETECT_ANSWER = { 2: 0, 3: 1, 5: 2 };

export function dampingDetective(L, onWin) {
  const M = 0.5, K = 20, A0 = 0.1, WIN = 6;
  let idx = 0, right = 0, answered = false, won = false;
  const W0 = shmEnergy(K, A0), T = springPeriod(M, K);
  const traces = DETECT_ROUNDS.map((lv) => trace(M, K, A0, LEVELS[lv], WIN + 0.1));
  const graph = makeGraph(L);
  const verdict = h("p", { class: "verdict", "aria-live": "polite" });
  const next = h("button", { class: "btn", type: "button", hidden: true }, L.next);
  const btns = L.options.map((o) => h("button", { class: "choice", type: "button" }, o));
  const num = h("b");

  const root = h("div", { class: "lab" },
    h("div", { style: "max-width:420px;margin:0 auto" }, h("div", { class: "scene-box" }, graph.svg), h("p", { class: "small muted" }, L.note)),
    h("div", { class: "controls" },
      h("div", { class: "readout" }, h("div", {}, h("span", {}, L.round), num)),
      h("div", { class: "choices grid2" }, btns), verdict, h("div", { class: "btn-row" }, next)));

  function show() {
    graph.draw({ tr: traces[idx], from: 0, win: WIN, upto: WIN, W0, T, ghost: false });
    num.textContent = `${idx + 1} / ${DETECT_ROUNDS.length}`;
    btns.forEach((b) => { b.disabled = false; b.classList.remove("correct", "wrong"); });
    verdict.textContent = ""; next.hidden = true; answered = false;
  }
  btns.forEach((b, i) => b.addEventListener("click", () => {
    if (answered) return;
    answered = true;
    const want = DETECT_ANSWER[DETECT_ROUNDS[idx]], ok = i === want;
    if (ok) right++;
    btns.forEach((x, j) => { x.disabled = true; x.classList.toggle("correct", j === want); x.classList.toggle("wrong", j === i && !ok); });
    verdict.textContent = `${ok ? L.right : L.wrong} ${L.why[want]}`;
    next.hidden = false;
    next.textContent = idx === DETECT_ROUNDS.length - 1 ? L.again : L.next;
    if (!won && idx === DETECT_ROUNDS.length - 1 && right >= 2) { won = true; onWin?.(next); }
  }));
  next.addEventListener("click", () => {
    if (idx === DETECT_ROUNDS.length - 1) { idx = 0; right = 0; } else idx++;
    show();
  });
  show();
  return root;
}
