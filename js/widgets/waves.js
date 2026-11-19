// Interactives for chapter o7 (making waves): the wave lab (a rope of coupled beads, transverse or longitudinal)
// and the "time the crest" measuring game. Wave: y(x, t) = A·sin(2π(t/T − x/λ)), v = f·λ (booklet).
import { h, s } from "../dom.js";
import { waveY, wavelength, waveSpeed, fmt } from "../physics.js";

const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- geometry (one rope of 12 m drawn across the scene) ----------
export const ROPE = 12;            // m, length of the rope on screen
export const NB = 41;              // beads (spacing 0.3 m)
const W = 360, H = 215, X0 = 20, PXM = 320 / ROPE, YC = 100, YPX = 60, TRACK = 20;
export const restX = (i) => (i * ROPE) / (NB - 1);   // m
export const TRACK_X = restX(TRACK);                 // 6 m
const MIN_F = 0.25, MAX_F = 1.5, MIN_V = 2, MAX_V = 8, MIN_A = 0.1, MAX_A = 1;

/** Displacement (m) of the piece of rope at rest position x (m). ph = t/T in cycles. Quiet in front of the wave front. */
export function beadDisp(x, ph, A, f, v, front) {
  if (x > front) return 0;
  const T = 1 / f;
  return waveY(x, ph * T, A, T, wavelength(v, f));
}
/** Pixels per metre of displacement in the longitudinal view: capped so neighbours never swap places (max slope 0.8). */
export function longScale(A, lam) { return Math.min(30, (0.8 * lam * PXM) / (2 * Math.PI * A)); }
/** Time (s) when the first crest of a wave shaken from rest reaches x (m): it leaves the source after T/4. */
export const crestArrival = (x, f, v) => 1 / (4 * f) + x / v;

// ---------- small ui helpers ----------
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
const dash = (c) => ({ stroke: c, "stroke-width": 1.5, "stroke-dasharray": "4 5" });
const px = (x) => X0 + x * PXM;
const sg = (v, d) => (Math.abs(v) < 0.5 * 10 ** -d ? fmt(0, d) : `${v > 0 ? "+" : "−"}${fmt(Math.abs(v), d)}`);

// ---------- the rope: beads + line, drawn from numbers ----------
function makeRope(aria) {
  const centre = s("path", { d: `M${X0} ${YC}H${X0 + ROPE * PXM}`, ...dash("rgba(255,255,255,.25)") });
  const ampUp = s("path", dash("rgba(255,225,77,.35)")), ampDown = s("path", dash("rgba(255,225,77,.35)"));
  const ampText = s("text", { fill: "#ffe14d", "font-size": 12, "font-weight": 800, x: X0 + ROPE * PXM - 2, "text-anchor": "end" }, "A");
  const ticks = s("g");
  for (let i = 0; i < NB; i++) ticks.append(s("path", { d: `M${px(restX(i)).toFixed(1)} ${YC + 24}v6`, stroke: "rgba(255,255,255,.3)", "stroke-width": 1.5 }));
  const line = s("path", { fill: "none", style: "stroke: var(--a1)", "stroke-width": 2.5, "stroke-linejoin": "round" });
  const guide = s("path", { fill: "none", ...dash("#ffe14d") });
  const beads = Array.from({ length: NB }, () => s("circle", { r: 4, style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 1 }));
  const rulerLine = s("path", { fill: "none", stroke: "#fff", "stroke-width": 2 });
  const rulerText = s("text", { fill: "#fff", "font-size": 12, "font-weight": 800, "text-anchor": "middle", y: H - 4 });
  const ruler = s("g", {}, rulerLine, rulerText);
  const extra = s("g");
  const svg = s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: "#0a0826" }), centre, ampUp, ampDown, ampText, ticks, guide, line, ...beads, ruler, extra);

  /** o: { mode "t"|"l", ph, A, f, v, front, track, ruler: string|null, amp: bool } */
  function pose(o) {
    const lam = wavelength(o.v, o.f), kL = longScale(o.A, lam);
    const long = o.mode === "l";
    let d = "";
    beads.forEach((b, i) => {
      const x = restX(i), disp = beadDisp(x, o.ph, o.A, o.f, o.v, o.front);
      const cx = long ? px(x) + disp * kL : px(x), cy = long ? YC : YC - disp * YPX;
      b.setAttribute("cx", cx.toFixed(1)); b.setAttribute("cy", cy.toFixed(1));
      const on = o.track && i === TRACK;
      b.setAttribute("r", on ? 7 : 4);
      b.style.fill = on ? "#ffe14d" : "";
      d += `${i ? "L" : "M"}${cx.toFixed(1)} ${cy.toFixed(1)}`;
    });
    line.setAttribute("d", long ? "" : d);
    ticks.setAttribute("opacity", long ? 1 : 0);
    const showAmp = o.amp && !long;
    ampUp.setAttribute("d", showAmp ? `M${X0} ${YC - o.A * YPX}H${X0 + ROPE * PXM}` : "");
    ampDown.setAttribute("d", showAmp ? `M${X0} ${YC + o.A * YPX}H${X0 + ROPE * PXM}` : "");
    ampText.setAttribute("y", YC - o.A * YPX - 4); ampText.textContent = showAmp ? "A" : "";
    guide.setAttribute("d", o.track ? (long ? `M${px(TRACK_X)} ${YC - 26}v52` : `M${px(TRACK_X)} ${YC - 72}v144`) : "");
    if (o.ruler) {
      const end = px(Math.min(lam, ROPE)), y = H - 18;
      rulerLine.setAttribute("d", `M${X0} ${y}H${end.toFixed(1)}M${X0} ${y - 6}v12M${end.toFixed(1)} ${y - 6}v12`);
      rulerText.setAttribute("x", ((X0 + end) / 2).toFixed(1)); rulerText.textContent = o.ruler;
    } else { rulerLine.setAttribute("d", ""); rulerText.textContent = ""; }
  }
  return { svg, pose, extra };
}

// ======================================================================================
// 1. The wave lab
// ======================================================================================
export function waveLab(L, onEvent) {
  let f = 1, A = 0.5, v = 4, mode = "t", track = false;
  let ph = 0, front = 0, travelled = 0, running = false, raf = 0, last = 0;
  const reduced = rm();
  const rope = makeRope(L.scene);

  const rT = h("b"), rF = h("b"), rL = h("b"), rV = h("b"), rD = h("b"), rC = h("b");
  const dRow = h("div", { hidden: true }, h("span", {}, L.track_disp), rD);
  const cRow = h("div", { hidden: true }, h("span", {}, L.track_crest), rC);
  const formula = h("div", { class: "formula" });
  const status = h("p", { class: "small", "aria-live": "polite" });

  const pT = pill(L.transverse, () => setMode("t"));
  const pL = pill(L.longitudinal, () => setMode("l"));
  const pTr = pill(L.track, () => { track = !track; travelled = 0; if (track) onEvent?.("track", pTr); draw(); });
  const playBtn = h("button", { class: "btn", type: "button" }, L.freeze);
  const stepBtn = h("button", { class: "btn", type: "button" }, L.step);
  const againBtn = h("button", { class: "btn primary", type: "button" }, L.restart);

  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:520px;margin:0 auto" }, rope.svg)),
    h("div", { class: "controls" },
      ...slider(L.freq, MIN_F, MAX_F, 0.05, f, (x) => `${fmt(x, 2)} Hz`, (x) => { f = x; draw(); }),
      ...slider(L.amp, MIN_A, MAX_A, 0.05, A, (x) => `${fmt(x, 2)} m`, (x) => { A = x; draw(); }),
      ...slider(L.speed, MIN_V, MAX_V, 0.5, v, (x) => `${fmt(x, 1)} m/s`, (x) => { v = x; draw(); }),
      h("div", { class: "toggle-row", style: "margin-top:6px" }, pT, pL, pTr),
      h("div", { class: "btn-row" }, reduced ? null : playBtn, stepBtn, reduced ? null : againBtn),
      status,
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.r_T), rT), h("div", {}, h("span", {}, L.r_f), rF),
        h("div", {}, h("span", {}, L.r_lam), rL), h("div", {}, h("span", {}, L.r_v), rV), dRow, cRow),
      formula));

  function setMode(m) {
    mode = m;
    if (m === "l") onEvent?.("longitudinal", pL);
    draw();
  }
  function draw() {
    const lam = wavelength(v, f), T = 1 / f;
    pT.setAttribute("aria-pressed", String(mode === "t")); pL.setAttribute("aria-pressed", String(mode === "l"));
    pTr.setAttribute("aria-pressed", String(track));
    const longer = lam > ROPE;
    rope.pose({ mode, ph, A, f, v, front, track, amp: true,
      ruler: longer ? L.ruler_long.replace("{n}", fmt(lam, 1)) : L.ruler.replace("{n}", fmt(lam, 1)) });
    rT.textContent = `${fmt(T, 2)} s`; rF.textContent = `${fmt(f, 2)} Hz`; rL.textContent = `${fmt(lam, 2)} m`; rV.textContent = `${fmt(v, 1)} m/s`;
    formula.textContent = `v = f·λ = ${fmt(f, 2)} × ${fmt(lam, 2)} = ${fmt(waveSpeed(f, lam), 2)} m/s`;
    dRow.hidden = !track; cRow.hidden = !track;
    if (track) {
      const dd = beadDisp(TRACK_X, ph, A, f, v, front);
      rD.textContent = `${sg(dd, 2)} m ${mode === "t" ? L.up_down : L.back_forth}`;
      rC.textContent = reduced ? "—" : `${fmt(travelled, 1)} m`;
    }
    status.textContent = track ? (mode === "t" ? L.status_track_t : L.status_track_l) : mode === "t" ? L.status_t : L.status_l;
  }
  function stop() { running = false; cancelAnimationFrame(raf); playBtn.textContent = L.play; }
  function run() { running = true; last = performance.now(); playBtn.textContent = L.freeze; raf = requestAnimationFrame(frame); }
  function frame(now) {
    if (!running) return;
    if (!root.isConnected) { stop(); return; }
    const dt = Math.min(now - last, 50) / 1000; last = now;
    ph = (ph + f * dt) % 1; front += v * dt; travelled += v * dt;     // phase in cycles: t/T
    draw();
    raf = requestAnimationFrame(frame);
  }
  playBtn.addEventListener("click", () => {
    if (running) { front = Infinity; stop(); draw(); } else { front = Infinity; run(); }
  });
  stepBtn.addEventListener("click", () => { front = Infinity; if (running) stop(); ph = (ph + 0.125) % 1; draw(); });
  againBtn.addEventListener("click", () => { stop(); ph = 0; front = 0; travelled = 0; run(); });

  if (reduced) { ph = 0.25; front = Infinity; draw(); }       // a crest at the source: a whole still wave
  else { ph = 0; front = 0; draw(); run(); }
  return root;
}

// ======================================================================================
// 2. Time the crest: tap Start when the yellow crest passes A, Stop when it passes B; v = d/Δt
// ======================================================================================
const GAME = { f: 0.5, A: 0.5, xA: 2, xB: 10, speeds: [3.5, 5, 2.5], tol: 0.15 };
export const gameDistance = GAME.xB - GAME.xA;
export const gameInfo = (idx) => {
  const v = GAME.speeds[idx % GAME.speeds.length], lam = wavelength(v, GAME.f);
  return { v, lam, dtTrue: gameDistance / v, f: GAME.f };
};
/** v = d/Δt for the measured Δt; ok if within the tolerance of the true speed. */
export function judgeMeasure(dt, vTrue) {
  const vm = gameDistance / Math.max(dt, 0.01);
  return { vm, rel: (vm - vTrue) / vTrue, ok: Math.abs(vm - vTrue) / vTrue <= GAME.tol };
}

export function crestGame(L, winContent, onWin) {
  const reduced = rm();
  let idx = 0, t = 0, running = false, raf = 0, last = 0, tA = null, tB = null, clock = false, won = false, shown = false;
  const rope = makeRope(L.scene);
  const T = 1 / GAME.f;
  const mk = (x, name) => [
    s("path", { d: `M${px(x)} ${YC - 70}V${YC + 70}`, ...dash("#fff") }),
    s("text", { x: px(x), y: YC - 76, fill: "#fff", "font-size": 14, "font-weight": 800, "text-anchor": "middle" }, name)];
  const crest = s("circle", { r: 8, fill: "#ffe14d", stroke: "#fff", "stroke-width": 2 });
  rope.extra.append(...mk(GAME.xA, "A"), ...mk(GAME.xB, "B"),
    s("path", { d: `M${px(GAME.xA)} ${YC + 62}H${px(GAME.xB)}M${px(GAME.xA)} ${YC + 56}v12M${px(GAME.xB)} ${YC + 56}v12`, stroke: "#fff", "stroke-width": 2 }),
    s("text", { x: (px(GAME.xA) + px(GAME.xB)) / 2, y: YC + 82, fill: "#fff", "font-size": 12, "font-weight": 800, "text-anchor": "middle" }, L.distance_label.replace("{n}", fmt(gameDistance, 0))),
    crest);

  const vf = h("b"), vd = h("b", {}, `${fmt(gameDistance, 0)} m`), vc = h("b", {}, "—"), vm = h("b", {}, "—");
  const verdict = h("p", { class: "verdict", "aria-live": "polite" });
  const win = h("div", { class: "reveal", hidden: true }, winContent);
  const truth = h("p", { class: "small", "aria-live": "polite" });
  const launch = h("button", { class: "btn primary", type: "button" }, L.launch);
  const tap = h("button", { class: "btn", type: "button", disabled: true }, L.tap_start);
  const showA = h("button", { class: "btn", type: "button" }, L.show_a);
  const showB = h("button", { class: "btn", type: "button", disabled: true }, L.show_b);
  const next = h("button", { class: "btn", type: "button" }, L.next);
  const root = h("div", { class: "lab" },
    h("div", { class: "scene-box", style: "max-width:520px;margin:0 auto" }, rope.svg),
    h("div", { class: "controls" },
      h("div", { class: "btn-row" }, reduced ? [showA, showB] : [launch, tap], next),
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.r_f), vf), h("div", {}, h("span", {}, L.r_d), vd),
        h("div", {}, h("span", {}, L.r_clock), vc), h("div", {}, h("span", {}, L.r_vmeas), vm)),
      verdict, truth, win));

  const cur = () => gameInfo(idx);
  function draw(full) {
    const { v } = cur();
    rope.pose({ mode: "t", ph: (t / T) % 1, A: GAME.A, f: GAME.f, v, front: full ? Infinity : v * t, track: false, amp: false, ruler: null });
    const xc = v * (t - T / 4);
    crest.setAttribute("opacity", !full && xc >= 0 && xc <= ROPE ? 1 : 0);
    crest.setAttribute("cx", px(Math.max(0, Math.min(ROPE, xc))).toFixed(1)); crest.setAttribute("cy", YC - GAME.A * YPX);
    vf.textContent = `${fmt(GAME.f, 2)} Hz`;
    vc.textContent = clock ? `${fmt(t - tA, 2)} s` : tA != null && tB != null ? `${fmt(tB - tA, 2)} s` : "—";
  }
  function stopAnim() { running = false; cancelAnimationFrame(raf); }
  function reset() {
    stopAnim(); t = 0; tA = tB = null; clock = false; shown = false;
    verdict.textContent = ""; truth.textContent = ""; vm.textContent = "—"; vc.textContent = "—";
    tap.disabled = true; tap.textContent = L.tap_start; launch.disabled = false; showA.disabled = false; showB.disabled = true;
    draw(true);                                                    // a whole still wave, not an empty rope
  }
  function finish() {
    const { v, lam, f } = cur(), dt = tB - tA, r = judgeMeasure(dt, v);
    vc.textContent = `${fmt(dt, 2)} s`; vm.textContent = `${fmt(r.vm, 1)} m/s`;
    verdict.textContent = r.ok ? L.ok : r.rel > 0 ? L.too_fast : L.too_slow;
    truth.textContent = L.truth.replace("{f}", fmt(f, 2)).replace("{lam}", fmt(lam, 1)).replace("{v}", fmt(v, 1)).replace("{prod}", fmt(waveSpeed(f, lam), 1));
    shown = true;
    if (r.ok && !won) { won = true; win.hidden = false; onWin?.(reduced ? showB : tap); }
  }
  function frame(now) {
    if (!running) return;
    if (!root.isConnected) { stopAnim(); return; }
    t += Math.min(now - last, 50) / 1000; last = now;
    if (t > 30) { reset(); return; }
    draw(false);
    raf = requestAnimationFrame(frame);
  }
  launch.addEventListener("click", () => {
    reset(); launch.disabled = true; tap.disabled = false; running = true; last = performance.now(); t = 0;
    raf = requestAnimationFrame(frame);
  });
  tap.addEventListener("click", () => {
    if (!clock && tA == null) { tA = t; clock = true; tap.textContent = L.tap_stop; return; }
    if (clock) { tB = t; clock = false; stopAnim(); tap.disabled = true; draw(false); finish(); }
  });
  showA.addEventListener("click", () => { // reduced motion: freeze the moment the crest is at A, then at B
    const { v } = cur(); t = crestArrival(GAME.xA, GAME.f, v); tA = t; tB = null; shown = false; verdict.textContent = ""; truth.textContent = "";
    vm.textContent = "—"; showB.disabled = false; draw(false); vc.textContent = `${fmt(t, 2)} s`;
  });
  showB.addEventListener("click", () => {
    if (tA == null) return;
    const { v } = cur(); t = crestArrival(GAME.xB, GAME.f, v); tB = t; draw(false); showB.disabled = true; finish();
  });
  next.addEventListener("click", () => { idx++; reset(); });

  reset();
  return root;
}
