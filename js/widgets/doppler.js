// Interactives for chapter o9 (the Doppler effect): the wavefront lab (top view) and the "tune the siren" game.
// The picture is a SLOW-MOTION model: wave speed v is drawn as PXV px/s, a source/listener speed u is drawn as (u/v)·PXV px/s,
// so ratios (and therefore wavelengths and pitches) are exactly right. Everything on screen is an analytic function of time
// (frameAt), so a paused or reduced-motion still picture is just frameAt at a fixed time.
import { h, s, richInline } from "../dom.js";
import { SOUND_SPEED, dopplerObserver, dopplerSource, fmt } from "../physics.js";

export const V = SOUND_SPEED;        // m/s, sound in air at 20 °C
export const FS = 440;               // Hz, the source frequency used in the whole chapter
export const U_MAX = 308;            // m/s, the core lab's cap (0.9·v = 308.7)
const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- the model (pure, testable in node) ----------
const W = 400, H = 240, CY = 120;
export const PXV = 60;               // px/s, how fast the fronts expand in the picture
export const TEM = 0.45;             // s, slow-motion time between two emitted fronts (one period in the picture)
const R_MAX = 460;                   // px, fronts bigger than this are dropped
const X_START = 50, X_END = 300, X_MID = 200;           // source path (source mode) / fixed source position
const OBS_SRC = [340, 28];                              // listeners A (front) and B (behind) when the source moves
const OBS_LIS = [372, 150], LIS_RUN = 122;              // listeners A, B at the start when the listeners move (towards the left)
const NPOOL = Math.ceil(R_MAX / PXV / TEM) + 3;

const speedPx = (u) => (u / V) * PXV;
/** Seconds of picture time before the run restarts (Infinity when nothing moves). */
export function runLength(mode, u) {
  const sp = speedPx(u);
  if (!(sp > 0)) return Infinity;
  return (mode === "source" ? X_END - X_START : LIS_RUN) / sp;
}
const srcAt = (mode, u, tt) => (mode === "source" && u > 0 ? X_START + speedPx(u) * tt : X_MID);
const obsAt = (mode, u, i, tt) => (mode === "source" ? OBS_SRC[i] : OBS_LIS[i] - speedPx(u) * tt);
/** Everything drawn at picture time t. fronts[] = circles { n, x (where it was emitted), r }. */
export function frameAt(mode, u, t) {
  const nMax = Math.floor(t / TEM + 1e-9);
  const nMin = Math.ceil((t - R_MAX / PXV) / TEM);   // negative n: crests sent before the run starts (the source has been moving all along)
  const fronts = [];
  for (let n = nMin; n <= nMax; n++) fronts.push({ n, x: srcAt(mode, u, n * TEM), r: PXV * (t - n * TEM) });
  return { t, src: srcAt(mode, u, t), obs: [obsAt(mode, u, 0, t), obsAt(mode, u, 1, t)], fronts };
}
/** r − distance for front n and listener i at time t: it turns from negative to ≥ 0 when the front reaches the listener. */
export function gapAt(mode, u, n, i, t) {
  const r = Math.max(0, PXV * (t - n * TEM));
  return r - Math.abs(obsAt(mode, u, i, t) - srcAt(mode, u, n * TEM));
}
/** The pitches the model predicts: [listener A (approaching), listener B (receding)]. */
export function pitches(mode, u) {
  return mode === "source"
    ? [dopplerSource(FS, u, true), dopplerSource(FS, u, false)]
    : [dopplerObserver(FS, u, true), dopplerObserver(FS, u, false)];
}
/** Wavelengths in metres at A and B. */
export function wavelengths(mode, u) {
  return mode === "source" ? [(V - u) / FS, (V + u) / FS] : [V / FS, V / FS];
}
/** Speed needed to hear fo from a moving source of frequency fs (game solution). */
export const speedFor = (fs, fo, approaching, v = V) => (approaching ? v * (1 - fs / fo) : v * (fs / fo - 1));

const fill = (str, vars) => String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
const dash = (c) => ({ stroke: c, "stroke-width": 1.5, "stroke-dasharray": "4 5" });
function slider(label, min, max, step, val, show, set) {
  const out = h("output");
  const inp = h("input", { type: "range", min, max, step, value: val, "aria-label": label });
  const sync = () => { out.textContent = show(Number(inp.value)); };
  inp.addEventListener("input", () => { set(Number(inp.value)); sync(); });
  sync();
  return { nodes: [h("label", {}, label, out), inp], inp, sync };
}
function pill(label, pressed, on) {
  const b = h("button", { class: "pill", type: "button", "aria-pressed": String(pressed) }, label);
  b.addEventListener("click", () => on(b));
  return b;
}

// ======================================================================================
// 1. The wavefront lab
// ======================================================================================
export function dopplerLab(L, onEvent) {
  let mode = "source", u = 100, t = 0, paused = false, raf = 0, last = 0;
  const reduced = rm();
  const pulse = [0, 0];

  // ----- scene -----
  const pool = Array.from({ length: NPOOL }, () => s("circle", { fill: "none", style: "stroke: var(--a1)", "stroke-width": 2, opacity: 0 }));
  const srcDot = s("circle", { r: 8, fill: "#ffe14d", stroke: "#fff", "stroke-width": 2 });
  const arrows = [0, 1, 2].map(() => s("path", { fill: "none", stroke: "#ffe14d", "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }));
  const ear = (lbl) => {
    const ring = s("circle", { r: 16, fill: "none", stroke: "#fff", "stroke-width": 3, opacity: 0 });
    const dot = s("circle", { r: 9, style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 2 });
    const text = s("text", { "font-size": 12, "font-weight": 800, "text-anchor": "middle", fill: "#0a0826" }, lbl);
    const grp = s("g", {}, ring, dot, text);
    return { grp, ring, dot, text };
  };
  const earA = ear("A"), earB = ear("B");
  const svg = s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: "#0a0826" }),
    s("path", { d: `M0 ${CY}H${W}`, ...dash("rgba(255,255,255,.18)") }),
    ...pool, ...arrows, srcDot, earA.grp, earB.grp);
  const setArrow = (el, x, dir) => { // small arrow above a mover, pointing dir (+1 right, −1 left)
    if (dir === 0) { el.setAttribute("d", ""); return; }
    const y = CY - 24, tip = x + dir * 18;
    el.setAttribute("d", `M${(x - dir * 4).toFixed(1)} ${y}H${tip.toFixed(1)}M${(tip - dir * 6).toFixed(1)} ${y - 5}L${tip.toFixed(1)} ${y}L${(tip - dir * 6).toFixed(1)} ${y + 5}`);
  };

  // ----- controls & readouts -----
  const two = (a, b, cls) => [h("span", { class: "m-source" }, a), h("span", { class: "m-listener", hidden: true }, b)];
  const mkOut = () => h("b");
  const oSpeed = mkOut(), oRatio = mkOut(), oA = mkOut(), oB = mkOut(), oLa = mkOut(), oLb = mkOut();
  const fA = h("div", { class: "formula" }), fB = h("div", { class: "formula" });
  const status = h("p", { class: "small", "aria-live": "polite" });
  const sp = slider(L.speed, 0, U_MAX, 1, u, (v) => `${fmt(v, 0)} m/s`, (v) => { u = v; restart(); events(); });
  const modeBtns = [
    pill(L.mode_source, true, () => setMode("source")),
    pill(L.mode_listener, false, () => setMode("listener")),
  ];
  const playBtn = h("button", { class: "btn", type: "button" }, L.pause);
  playBtn.addEventListener("click", () => {
    paused = !paused;
    playBtn.replaceChildren(paused ? L.play : L.pause);
    if (!paused) { last = performance.now(); loop(); }
  });
  const hearBtn = h("button", { class: "btn primary", type: "button" }, L.hear);
  const AC = typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : null;
  const row = h("div", { class: "btn-row" }, reduced ? null : playBtn, AC ? hearBtn : null);

  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:480px;margin:0 auto" }, svg),
      h("p", { class: "small muted", style: "margin:8px 0 0;text-align:center" }, L.slowmo)),
    h("div", { class: "controls" },
      h("label", {}, L.mode),
      h("div", { class: "toggle-row", style: "margin-top:4px" }, modeBtns),
      ...sp.nodes, row, status,
      h("div", { class: "readout" },
        h("div", {}, ...two(L.r_speed_s, L.r_speed_l), oSpeed),
        h("div", {}, h("span", {}, L.r_ratio), oRatio),
        h("div", {}, ...two(L.r_fa, L.r_fa), oA),
        h("div", {}, ...two(L.r_fb, L.r_fb), oB),
        h("div", {}, ...two(L.r_la_s, L.r_la_l), oLa),
        h("div", {}, ...two(L.r_lb_s, L.r_lb_l), oLb)),
      fA, fB));

  function setMode(m) {
    mode = m;
    modeBtns[0].setAttribute("aria-pressed", String(m === "source"));
    modeBtns[1].setAttribute("aria-pressed", String(m === "listener"));
    root.querySelectorAll(".m-source").forEach((e) => { e.hidden = m !== "source"; });
    root.querySelectorAll(".m-listener").forEach((e) => { e.hidden = m !== "listener"; });
    restart(); events();
  }
  function events() {
    if (mode === "source" && u >= 250) onEvent?.("fast", sp.inp);
    if (mode === "listener" && u > 0) onEvent?.("listener", sp.inp);
  }

  function readouts() {
    const [fa, fb] = pitches(mode, u), [la, lb] = wavelengths(mode, u);
    oSpeed.textContent = `${fmt(u, 0)} m/s`;
    oRatio.textContent = `${fmt(u / V, 2)}`;
    oA.textContent = `${fmt(fa, 0)} Hz`; oB.textContent = `${fmt(fb, 0)} Hz`;
    oLa.textContent = `${fmt(la, 2)} m`; oLb.textContent = `${fmt(lb, 2)} m`;
    const vars = { fs: fmt(FS, 0), v: fmt(V, 0), u: fmt(u, 0), fa: fmt(fa, 0), fb: fmt(fb, 0) };
    fA.replaceChildren(h("span", {}, fill(mode === "source" ? L.form_src_a : L.form_lis_a, vars)));
    fB.replaceChildren(h("span", {}, fill(mode === "source" ? L.form_src_b : L.form_lis_b, vars)));
    status.replaceChildren(h("span", {}, u === 0 ? L.status_zero : u >= U_MAX ? (mode === "source" ? L.status_cap : L.status_cap_l) : mode === "source" ? L.status_src : L.status_lis));
  }

  // ----- drawing -----
  function draw(fr) {
    pool.forEach((c, i) => {
      const f = fr.fronts[i];
      if (!f || f.r < 0.5) { c.setAttribute("opacity", 0); return; }
      c.setAttribute("cx", f.x.toFixed(1)); c.setAttribute("cy", CY); c.setAttribute("r", f.r.toFixed(1));
      c.setAttribute("opacity", Math.max(0.12, 1 - f.r / R_MAX).toFixed(2));
    });
    srcDot.setAttribute("cx", fr.src.toFixed(1)); srcDot.setAttribute("cy", CY);
    [earA, earB].forEach((e, i) => {
      const x = fr.obs[i].toFixed(1);
      e.dot.setAttribute("cx", x); e.dot.setAttribute("cy", CY);
      e.ring.setAttribute("cx", x); e.ring.setAttribute("cy", CY); e.ring.setAttribute("opacity", pulse[i].toFixed(2));
      e.text.setAttribute("x", x); e.text.setAttribute("y", CY + 4.5);
    });
    if (mode === "source") { setArrow(arrows[0], fr.src, u > 0 ? 1 : 0); setArrow(arrows[1], 0, 0); setArrow(arrows[2], 0, 0); }
    else { setArrow(arrows[0], 0, 0); setArrow(arrows[1], fr.obs[0], u > 0 ? -1 : 0); setArrow(arrows[2], fr.obs[1], u > 0 ? -1 : 0); }
  }
  const stillTime = () => { const run = runLength(mode, u); return Number.isFinite(run) ? 0.6 * run : 5; };
  function restart() {
    t = 0; pulse[0] = pulse[1] = 0; readouts();
    if (reduced) { draw(frameAt(mode, u, stillTime())); return; }
    draw(frameAt(mode, u, t));
  }

  // ----- animation -----
  function loop() {
    cancelAnimationFrame(raf);
    if (reduced || paused) return;
    raf = requestAnimationFrame(tick);
  }
  function tick(now) {
    if (!root.isConnected) { stopAudio(); return; }
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    const t0 = t, t1 = t + dt, run = runLength(mode, u);
    if (t1 >= run) { restart(); loop(); return; }              // the run ended: start again from the left
    t = t1;
    const fr = frameAt(mode, u, t);
    for (const f of fr.fronts) for (let i = 0; i < 2; i++) {
      if (gapAt(mode, u, f.n, i, t0) < 0 && gapAt(mode, u, f.n, i, t1) >= 0) pulse[i] = 1;   // a front just reached listener i
    }
    pulse[0] = Math.max(0, pulse[0] - dt / 0.25); pulse[1] = Math.max(0, pulse[1] - dt / 0.25);
    draw(fr);
    loop();
  }

  // ----- hear it (Web Audio, low volume, only after a tap) -----
  let ac = null, timer = 0, hearing = false, endAt = 0;
  function stopAudio() {
    clearInterval(timer); timer = 0;
    if (hearing) { hearing = false; hearBtn.replaceChildren(L.hear); }
    try { ac?.close(); } catch { /* ignore */ }
    ac = null;
  }
  hearBtn.addEventListener("click", () => {
    if (hearing) { stopAudio(); return; }
    try {
      ac = new AC();
      ac.resume?.();
      const [fa, fb] = pitches(mode, u), t0 = ac.currentTime + 0.05, dur = 1.2;
      [fa, fb].forEach((fq, k) => {
        const osc = ac.createOscillator(), g = ac.createGain(), st = t0 + k * (dur + 0.3);
        osc.type = "sine"; osc.frequency.value = Math.max(80, Math.min(fq, 8000));   // keep it in a comfortable range
        g.gain.setValueAtTime(0, st);
        g.gain.linearRampToValueAtTime(0.08, st + 0.04);          // gain ≤ 0.1: quiet
        g.gain.setValueAtTime(0.08, st + dur - 0.05);
        g.gain.linearRampToValueAtTime(0, st + dur);
        osc.connect(g); g.connect(ac.destination);
        osc.start(st); osc.stop(st + dur + 0.02);
      });
      endAt = t0 + 2 * dur + 0.3 + 0.1;
      hearing = true; hearBtn.replaceChildren(L.hear_stop);
      timer = setInterval(() => { if (!root.isConnected || !ac || ac.currentTime > endAt) stopAudio(); }, 250);
    } catch { stopAudio(); }      // no Web Audio, or blocked: fail silently
  });

  setMode("source");
  if (!reduced) { last = performance.now(); loop(); }
  return root;
}

// ======================================================================================
// 2. Game: tune the siren (find the speed that gives the target pitch)
// ======================================================================================
/** targets: [{ fo (Hz), approaching }]. strings in L; onWin(el) on the first success. */
export function tuneGame(L, targets, onWin) {
  let idx = 0, u = 0, won = false;
  const tgt = h("b"), now = h("b"), tries = h("b");
  let n = 0;
  const msg = h("p", { class: "small", "aria-live": "polite" });
  const prompt = h("p", {});
  const sp = slider(L.speed, 0, U_MAX, 1, u, (v) => `${fmt(v, 0)} m/s`, (v) => { u = v; show(); });
  const heard = () => dopplerSource(FS, u, targets[idx].approaching);
  const check = h("button", { class: "btn primary", type: "button" }, L.check);
  const next = h("button", { class: "btn", type: "button" }, L.next);
  function show() {
    const tg = targets[idx];
    prompt.replaceChildren(richInline(fill(tg.approaching ? L.prompt_toward : L.prompt_away, { fs: fmt(FS, 0), fo: fmt(tg.fo, 0) })));
    tgt.textContent = `${fmt(tg.fo, 0)} Hz`; now.textContent = `${fmt(heard(), 0)} Hz`; tries.textContent = String(n);
  }
  check.addEventListener("click", () => {
    n++;
    const tg = targets[idx], f = heard();
    if (Math.abs(f - tg.fo) / tg.fo <= 0.01) {
      msg.textContent = L.ok;
      if (!won) { won = true; onWin?.(check); }
    } else msg.textContent = f < tg.fo ? L.too_low : L.too_high;
    show();
  });
  next.addEventListener("click", () => { idx = (idx + 1) % targets.length; msg.textContent = ""; show(); });
  show();
  return h("div", { class: "controls" }, prompt, ...sp.nodes, h("div", { class: "btn-row" }, check, next), msg,
    h("div", { class: "readout" },
      h("div", {}, h("span", {}, L.target), tgt), h("div", {}, h("span", {}, L.heard), now), h("div", {}, h("span", {}, L.tries), tries)));
}
