// Interactives for chapter o8 (a wave in space and time): the two-graph lab (snapshot y–x, history y–t of one marked bead)
// and the "read the graphs" matching game. Everything is drawn from the booklet form y(x, t) = A·sin(2π(t/T − x/λ)).
import { h, s } from "../dom.js";
import { waveY, waveParticleV, fmt } from "../physics.js";

const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- numbers (pure: checkable in node) ----------
export const XMAX = 4;          // m, length of rope drawn
export const TWIN = 2;          // s, time window of the y–t graph (and range of the scrubber)
export const YMAX = 0.1;        // m, vertical half-range of every graph
export const NB = 81;           // beads along 4 m: spacing 0.05 m, so at least 10 per wavelength at the shortest λ (0.5 m)
export const RANGE = { A: [0.02, 0.1, 0.01], T: [0.2, 2, 0.05], lam: [0.5, 4, 0.1] };
export const START = { A: 0.05, T: 0.4, lam: 2, xm: 1 };
export const beadX = (i) => (i * XMAX) / (NB - 1);
export const snapBead = (x) => beadX(Math.round((Math.max(0, Math.min(XMAX, x)) / XMAX) * (NB - 1)));
export const beadVMax = (A, T) => (2 * Math.PI * A) / T;          // A·ω
/** All the lab readings for amplitude A, period T, wavelength lam, bead at x, time t. */
export function readings(A, T, lam, x, t) {
  return { y: waveY(x, t, A, T, lam), vy: waveParticleV(x, t, A, T, lam), v: lam / T, vmax: beadVMax(A, T), phase: 2 * Math.PI * (t / T - x / lam) };
}
/** x positions (m) of all crests at time t (phase 2π(t/T − x/λ) = π/2 + 2π·n). */
export function crestXs(t, T, lam) {
  let x = (((lam * (t / T - 0.25)) % lam) + lam) % lam;
  const out = [];
  for (; x <= XMAX + 1e-9; x += lam) out.push(x);
  return out;
}

// ---------- geometry (one viewBox: optional bead strip on top, then the two graphs) ----------
const W = 360, STRIP = 112, GH = 190;
const SX0 = 14, PXM = 332 / XMAX, YC = 56, YPXS = 44 / YMAX;            // strip
const LX0 = 36, PXX = 136 / XMAX, RX0 = 214, PXT = 136 / TWIN;           // graph x origins and scales
const YG = 93, YPX = 62 / YMAX;                                          // graph zero line and px per metre of y (local to the graph group)
const NS = 160;
const dash = (c) => ({ stroke: c, "stroke-width": 1.4, "stroke-dasharray": "4 4" });
const sg = (v, d) => (Math.abs(v) < 0.5 * 10 ** -d ? fmt(0, d) : `${v > 0 ? "+" : "−"}${fmt(Math.abs(v), d)}`);
const txt = (x, y, str, o = {}) => s("text", { x, y, fill: "rgba(255,255,255,.75)", "font-size": 9, "text-anchor": "middle", ...o }, str);

function slider(label, min, max, step, val, show, set) {
  const out = h("output");
  const inp = h("input", { type: "range", min, max, step, value: val, "aria-label": label });
  const sync = () => { out.textContent = show(Number(inp.value)); };
  inp.addEventListener("input", () => { set(Number(inp.value)); sync(); });
  sync();
  return { nodes: [h("label", {}, label, out), inp], inp, sync };
}

/** The two graph panels (y–x on the left, y–t on the right) as a group, plus path builders. yStep: spacing of the y ticks. */
function makeGraphs(L, yStep) {
  const g = s("g");
  const axes = (x0, px, tmax, tick, labelEvery, name, unit) => {
    for (let v = 0; v <= tmax + 1e-9; v += tick) g.append(s("path", { d: `M${(x0 + v * px).toFixed(1)} 31V155`, stroke: "rgba(255,255,255,.1)", "stroke-width": 1 }));
    for (let k = -Math.round(YMAX / yStep); k <= Math.round(YMAX / yStep); k++) {
      const yy = YG - k * yStep * YPX;
      g.append(s("path", { d: `M${x0} ${yy.toFixed(1)}H${x0 + tmax * px}`, stroke: k === 0 ? "rgba(255,255,255,.55)" : "rgba(255,255,255,.1)", "stroke-width": k === 0 ? 1.5 : 1 }));
      g.append(txt(x0 - 4, yy + 3, k === 0 ? "0" : fmt(k * yStep, 2),{ "text-anchor": "end", "font-size": 8 }));
    }
    g.append(s("path", { d: `M${x0} 31V155`, stroke: "rgba(255,255,255,.55)", "stroke-width": 1.5 }));
    for (let v = 0; v <= tmax + 1e-9; v += labelEvery) g.append(txt((x0 + v * px).toFixed(1), 167, fmt(v, labelEvery < 1 ? 1 : 0)));
    g.append(txt(x0 + (tmax * px) / 2, 181, unit, { "font-weight": 800, "font-size": 10 }));
    g.append(txt(x0 + (tmax * px) / 2, 11, name, { "font-weight": 800, "font-size": 10, fill: "#fff" }));
  };
  axes(LX0, PXX, XMAX, 0.5, 1, L.title_x, L.axis_x);
  axes(RX0, PXT, TWIN, 0.25, 0.5, L.title_t, L.axis_t);
  const path = (style) => { const p = s("path", { fill: "none", "stroke-linejoin": "round", ...style }); g.append(p); return p; };
  const dX = (fn) => { let d = ""; for (let i = 0; i <= NS; i++) { const x = (XMAX * i) / NS; d += `${i ? "L" : "M"}${(LX0 + x * PXX).toFixed(1)} ${(YG - fn(x) * YPX).toFixed(1)}`; } return d; };
  const dT = (fn) => { let d = ""; for (let i = 0; i <= NS; i++) { const t = (TWIN * i) / NS; d += `${i ? "L" : "M"}${(RX0 + t * PXT).toFixed(1)} ${(YG - fn(t) * YPX).toFixed(1)}`; } return d; };
  return { g, path, dX, dT, gx: (x) => LX0 + x * PXX, gt: (t) => RX0 + t * PXT, gy: (y) => YG - y * YPX };
}

// ======================================================================================
// 1. The lab
// ======================================================================================
export function wavegraphsLab(L, onEvent) {
  let A = START.A, T = START.T, lam = START.lam, xm = START.xm, t = 0;
  let running = false, raf = 0, last = 0, slow = false, dragging = false, moved = false, scrubbed = false;
  const reduced = rm();

  // ----- scene -----
  const gr = makeGraphs(L, 0.05);
  const gg = s("g", { transform: `translate(0 ${STRIP})` }, gr.g);
  const ghost = gr.path({ ...dash("rgba(255,255,255,.55)"), "stroke-width": 1.6 });      // bead at x = 0 (dashed)
  const curveX = gr.path({ style: "stroke: var(--a1)", "stroke-width": 2.6 });
  const curveT = gr.path({ stroke: "#ffe14d", "stroke-width": 2.6 });
  const ampLines = [gr.path(dash("rgba(255,225,77,.45)")), gr.path(dash("rgba(255,225,77,.45)"))];
  const ampLab = [txt(0, 0, "A", { fill: "#ffe14d", "font-weight": 800, "font-size": 10 }), txt(0, 0, "", { fill: "#ffe14d", "font-size": 10 })];
  const lamBr = gr.path({ stroke: "#fff", "stroke-width": 1.8 }), lamTx = txt(0, 0, "", { fill: "#fff", "font-weight": 800 });
  const tBr = gr.path({ stroke: "#fff", "stroke-width": 1.8 }), tTx = txt(0, 0, "", { fill: "#fff", "font-weight": 800 });
  const crestG = s("g");
  const curX = gr.path(dash("rgba(255,225,77,.6)")), curT = gr.path(dash("rgba(255,225,77,.6)"));
  const dotX = s("circle", { r: 5, fill: "#ffe14d", stroke: "#fff", "stroke-width": 1.5 });
  const dotT = s("circle", { r: 5, fill: "#ffe14d", stroke: "#fff", "stroke-width": 1.5 });
  gr.g.append(ampLab[0], lamTx, tTx, crestG, dotX, dotT);

  const sx = (x) => SX0 + x * PXM;
  const line = s("path", { fill: "none", style: "stroke: var(--a1)", "stroke-width": 2, "stroke-linejoin": "round", opacity: 0.8 });
  const beads = Array.from({ length: NB }, () => s("circle", { r: 2.2, style: "fill: var(--a2)" }));
  const mark = s("circle", { r: 6, fill: "#ffe14d", stroke: "#fff", "stroke-width": 1.5 });
  const arrow = s("path", { fill: "none", stroke: "#ff9ec7", "stroke-width": 3, "stroke-linecap": "round" });
  const stripCrests = s("g");
  const handle = s("rect", { class: "drag-handle", tabindex: 0, role: "slider", "aria-label": L.handle, "aria-valuemin": 0, "aria-valuemax": XMAX, "aria-valuenow": xm,
    y: 3, width: 22, height: STRIP - 6, rx: 8, style: "touch-action: none; fill: rgba(255,225,77,.14); stroke: #ffe14d; stroke-width: 1.5" });
  const stripBg = s("rect", { width: W, height: STRIP, fill: "#0a0826" });
  const stripLine = s("path", { d: `M${SX0} ${YC}H${SX0 + XMAX * PXM}`, stroke: "rgba(255,255,255,.25)", "stroke-width": 1.5, "stroke-dasharray": "4 5", fill: "none" });
  const stripNote = s("text", { x: W - 6, y: STRIP - 5, fill: "rgba(255,255,255,.6)", "font-size": 8.5, "text-anchor": "end" }, L.strip_note);
  const svg = s("svg", { class: "scene", viewBox: `0 0 ${W} ${STRIP + GH}`, role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: W, height: STRIP + GH, fill: "#0a0826" }), stripBg, stripLine, line, ...beads, stripCrests, arrow, handle, mark, stripNote, gg);

  // ----- controls -----
  const rV = h("b"), rVb = h("b"), rVmax = h("b"), rY = h("b");
  const formula = h("div", { class: "formula" }), status = h("p", { class: "small", "aria-live": "polite" });
  const sA = slider(L.amp, ...RANGE.A.slice(0, 2), RANGE.A[2], A, (v) => `${fmt(v, 2)} m`, (v) => { A = v; draw(); });
  const sT = slider(L.period, ...RANGE.T.slice(0, 2), RANGE.T[2], T, (v) => `${fmt(v, 2)} s`, (v) => { T = v; draw(); });
  const sL = slider(L.wavelength, ...RANGE.lam.slice(0, 2), RANGE.lam[2], lam, (v) => `${fmt(v, 1)} m`, (v) => { lam = v; draw(); });
  const sTime = slider(L.time, 0, TWIN, 0.01, t, (v) => `${fmt(v, 2)} s`, (v) => { stop(); t = v; if (!scrubbed) { scrubbed = true; onEvent?.("time", sTime.inp); } draw(); });
  const playBtn = h("button", { class: "btn", type: "button" }, L.pause);
  const slowBtn = h("button", { class: "pill", type: "button", "aria-pressed": "false" }, L.slow);
  slowBtn.addEventListener("click", () => { slow = !slow; slowBtn.setAttribute("aria-pressed", String(slow)); });
  const resetBtn = h("button", { class: "btn", type: "button" }, L.zero);
  resetBtn.addEventListener("click", () => { stop(); t = 0; draw(); });

  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg)),
    h("div", { class: "controls" },
      h("p", { class: "small" }, L.legend),
      ...sA.nodes, ...sT.nodes, ...sL.nodes, ...sTime.nodes,
      h("div", { class: "btn-row" }, reduced ? null : playBtn, resetBtn, reduced ? null : slowBtn),
      status,
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.r_v), rV), h("div", {}, h("span", {}, L.r_y), rY),
        h("div", {}, h("span", {}, L.r_vb), rVb), h("div", {}, h("span", {}, L.r_vmax), rVmax)),
      formula));

  function draw() {
    const r = readings(A, T, lam, xm, t), ph = (x) => waveY(x, t, A, T, lam);
    // strip: beads, line, marked bead, velocity arrow, crest markers
    let d = "";
    beads.forEach((b, i) => {
      const x = beadX(i), cy = YC - ph(x) * YPXS;
      b.setAttribute("cx", sx(x).toFixed(1)); b.setAttribute("cy", cy.toFixed(1));
      d += `${i ? "L" : "M"}${sx(x).toFixed(1)} ${cy.toFixed(1)}`;
    });
    line.setAttribute("d", d);
    const bx = sx(xm), by = YC - r.y * YPXS, al = (r.vy / r.vmax) * 34;
    mark.setAttribute("cx", bx.toFixed(1)); mark.setAttribute("cy", by.toFixed(1));
    arrow.setAttribute("d", Math.abs(al) < 1.5 ? "" : `M${bx.toFixed(1)} ${by.toFixed(1)}v${(-al).toFixed(1)}m-5 ${al > 0 ? 7 : -7}l5 ${al > 0 ? -7 : 7}l5 ${al > 0 ? 7 : -7}`);
    handle.setAttribute("x", Math.max(1, Math.min(W - 23, bx - 11)).toFixed(1)); handle.setAttribute("aria-valuenow", fmt(xm, 2));
    handle.setAttribute("aria-valuetext", `x = ${fmt(xm, 2)} m`);
    const cx = crestXs(t, T, lam);
    stripCrests.replaceChildren(...cx.map((x) => s("path", { d: `M${(sx(x) - 4).toFixed(1)} ${Math.max(14, YC - A * YPXS - 13).toFixed(1)}h8l-4 7z`, fill: "#7cf0ff" })));
    // graphs
    curveX.setAttribute("d", gr.dX(ph));
    curveT.setAttribute("d", gr.dT((tt) => waveY(xm, tt, A, T, lam)));
    ghost.setAttribute("d", gr.dT((tt) => waveY(0, tt, A, T, lam)));
    ampLines[0].setAttribute("d", `M${LX0} ${gr.gy(A)}H${LX0 + XMAX * PXX}M${RX0} ${gr.gy(A)}H${RX0 + TWIN * PXT}`);
    ampLines[1].setAttribute("d", `M${LX0} ${gr.gy(-A)}H${LX0 + XMAX * PXX}M${RX0} ${gr.gy(-A)}H${RX0 + TWIN * PXT}`);
    ampLab[0].setAttribute("x", LX0 + XMAX * PXX - 6); ampLab[0].setAttribute("y", (gr.gy(A) - 3).toFixed(1));
    lamBr.setAttribute("d", `M${gr.gx(0)} 26H${gr.gx(lam).toFixed(1)}M${gr.gx(0)} 22v8M${gr.gx(lam).toFixed(1)} 22v8`);
    lamTx.setAttribute("x", ((gr.gx(0) + gr.gx(lam)) / 2).toFixed(1)); lamTx.setAttribute("y", 21); lamTx.textContent = `λ = ${fmt(lam, 1)} m`;
    tBr.setAttribute("d", `M${gr.gt(0)} 26H${gr.gt(T).toFixed(1)}M${gr.gt(0)} 22v8M${gr.gt(T).toFixed(1)} 22v8`);
    tTx.setAttribute("x", ((gr.gt(0) + gr.gt(T)) / 2).toFixed(1)); tTx.setAttribute("y", 21); tTx.textContent = `T = ${fmt(T, 2)} s`;
    crestG.replaceChildren(...cx.map((x) => s("path", { d: `M${(gr.gx(x) - 3.5).toFixed(1)} ${Math.max(33, gr.gy(A) - 12).toFixed(1)}h7l-3.5 6z`, fill: "#7cf0ff" })));
    dotX.setAttribute("cx", gr.gx(xm).toFixed(1)); dotX.setAttribute("cy", gr.gy(r.y).toFixed(1));
    dotT.setAttribute("cx", gr.gt(t).toFixed(1)); dotT.setAttribute("cy", gr.gy(r.y).toFixed(1));
    curX.setAttribute("d", `M${gr.gx(xm).toFixed(1)} 31V155`); curT.setAttribute("d", `M${gr.gt(t).toFixed(1)} 31V155`);
    // readouts
    rV.textContent = `${fmt(r.v, 2)} m/s`; rY.textContent = `${sg(r.y, 3)} m`;
    rVb.textContent = `${sg(r.vy, 2)} m/s`; rVmax.textContent = `${fmt(r.vmax, 2)} m/s`;
    formula.textContent = `y(x, t) = ${fmt(A, 2)}·sin(2π(t/${fmt(T, 2)} − x/${fmt(lam, 1)}))`;
    const dir = Math.abs(r.vy) < 0.005 ? L.turning : r.vy > 0 ? L.up : L.down;
    status.textContent = L.status.replace("{v}", fmt(r.v, 2)).replace("{dir}", dir).replace("{vb}", fmt(Math.abs(r.vy), 2)).replace("{vmax}", fmt(r.vmax, 2)).replace("{x}", fmt(xm, 2));
    sTime.inp.value = String(t); sTime.sync();
  }
  // curX/curT are appended before the dots so the dots sit on top
  gr.g.append(curX, curT, dotX, dotT);

  function setX(x, fromUser) {
    xm = snapBead(x);
    if (fromUser && !moved) { moved = true; onEvent?.("bead", handle); }
    draw();
  }
  const xFrom = (e) => { const r = svg.getBoundingClientRect(); return ((((e.clientX - r.left) / r.width) * W) - SX0) / PXM; };
  svg.addEventListener("pointerdown", (e) => {
    const r = svg.getBoundingClientRect();
    if (((e.clientY - r.top) / r.height) * (STRIP + GH) > STRIP) return;
    dragging = true;
    try { svg.setPointerCapture(e.pointerId); } catch { /* not all browsers */ }
    setX(xFrom(e), true);
  });
  svg.addEventListener("pointermove", (e) => { if (dragging) setX(xFrom(e), true); });
  const endDrag = () => { dragging = false; };
  svg.addEventListener("pointerup", endDrag); svg.addEventListener("pointercancel", endDrag);
  handle.addEventListener("keydown", (e) => {
    const step = { ArrowLeft: -0.05, ArrowDown: -0.05, ArrowRight: 0.05, ArrowUp: 0.05, PageDown: -0.5, PageUp: 0.5 }[e.key];
    if (step != null) { e.preventDefault(); setX(xm + step, true); }
    else if (e.key === "Home") { e.preventDefault(); setX(0, true); }
    else if (e.key === "End") { e.preventDefault(); setX(XMAX, true); }
  });

  function stop() { running = false; cancelAnimationFrame(raf); playBtn.textContent = L.play; }
  function run() { running = true; last = performance.now(); playBtn.textContent = L.pause; raf = requestAnimationFrame(frame); }
  function frame(now) {
    if (!running) return;
    if (!root.isConnected) { stop(); return; }
    t = (t + (Math.min(now - last, 50) / 1000) * (slow ? 0.25 : 1)) % TWIN; last = now;
    draw();
    raf = requestAnimationFrame(frame);
  }
  playBtn.addEventListener("click", () => { if (running) stop(); else run(); });

  draw();                                   // a whole picture even when paused or reduced-motion
  if (!reduced) run();
  return root;
}

// ======================================================================================
// 2. Read the graphs: set A, T and λ so your yellow curves lie on the white ones
// ======================================================================================
export const TARGETS = [{ A: 0.06, T: 0.5, lam: 2 }, { A: 0.04, T: 1, lam: 1.5 }, { A: 0.08, T: 0.25, lam: 3 }];
/** Which of A, T, λ are right (within half a slider step). */
export function judgeMatch(g, tg) {
  return { A: Math.abs(g.A - tg.A) < RANGE.A[2] / 2, T: Math.abs(g.T - tg.T) < RANGE.T[2] / 2, lam: Math.abs(g.lam - tg.lam) < RANGE.lam[2] / 2 };
}

export function matchGame(L, winContent, onWin) {
  let idx = 0, won = false, tries = 0;
  const g = { A: 0.03, T: 1, lam: 1 };
  const gr = makeGraphs(L, 0.02);
  const tgX = gr.path({ stroke: "#fff", "stroke-width": 4, opacity: 0.85 }), tgT = gr.path({ stroke: "#fff", "stroke-width": 4, opacity: 0.85 });
  const myX = gr.path({ stroke: "#ffe14d", "stroke-width": 2.2 }), myT = gr.path({ stroke: "#ffe14d", "stroke-width": 2.2 });
  // the white target curves go in the same group but are drawn first; the yellow ones sit on top (append order)
  gr.g.append(myX, myT);
  const svg = s("svg", { class: "scene", viewBox: `0 0 ${W} ${GH}`, role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: W, height: GH, fill: "#0a0826" }), gr.g);

  const tg = () => TARGETS[idx % TARGETS.length];
  function draw() {
    const T0 = tg();
    tgX.setAttribute("d", gr.dX((x) => waveY(x, 0, T0.A, T0.T, T0.lam)));      // snapshot at t = 0
    tgT.setAttribute("d", gr.dT((t) => waveY(0, t, T0.A, T0.T, T0.lam)));      // bead at x = 0
    myX.setAttribute("d", gr.dX((x) => waveY(x, 0, g.A, g.T, g.lam)));
    myT.setAttribute("d", gr.dT((t) => waveY(0, t, g.A, g.T, g.lam)));
    formula.textContent = `y(x, t) = ${fmt(g.A, 2)}·sin(2π(t/${fmt(g.T, 2)} − x/${fmt(g.lam, 1)}))`;
  }
  const formula = h("div", { class: "formula" });
  const verdict = h("p", { class: "verdict", "aria-live": "polite" }), detail = h("p", { class: "small", "aria-live": "polite" });
  const win = h("div", { class: "reveal", hidden: true }, winContent);
  const sA = slider(L.amp, RANGE.A[0], RANGE.A[1], RANGE.A[2], g.A, (v) => `${fmt(v, 2)} m`, (v) => { g.A = v; draw(); });
  const sT = slider(L.period, RANGE.T[0], RANGE.T[1], RANGE.T[2], g.T, (v) => `${fmt(v, 2)} s`, (v) => { g.T = v; draw(); });
  const sL = slider(L.wavelength, RANGE.lam[0], RANGE.lam[1], RANGE.lam[2], g.lam, (v) => `${fmt(v, 1)} m`, (v) => { g.lam = v; draw(); });
  const check = h("button", { class: "btn primary", type: "button" }, L.check);
  const next = h("button", { class: "btn", type: "button" }, L.next);
  check.addEventListener("click", () => {
    tries++;
    const j = judgeMatch(g, tg()), mark = (ok) => (ok ? "✓" : "✗");
    detail.textContent = `A ${mark(j.A)}   T ${mark(j.T)}   λ ${mark(j.lam)}`;
    const all = j.A && j.T && j.lam;
    verdict.textContent = all ? L.ok : L.not_yet;
    if (all && !won) { won = true; win.hidden = false; onWin?.(check); }
  });
  next.addEventListener("click", () => { idx++; verdict.textContent = ""; detail.textContent = ""; draw(); });

  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg)),
    h("div", { class: "controls" }, ...sA.nodes, ...sT.nodes, ...sL.nodes,
      h("div", { class: "btn-row" }, check, next), verdict, detail, formula, win));
  draw();
  return root;
}
