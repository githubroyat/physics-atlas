// Interactive: a mass bouncing on a spring next to a live, scrolling y(t) graph (formula booklet: y = A·sin(ωt)).
// Sliders for mass, stiffness, amplitude and damping; optional v(t), a(t) traces and a "circle view".
import { h, s, clear } from "../dom.js";
import { springOmega, springPeriod, dampedY, dampingRegime, fmt } from "../physics.js";

const WINDOW = 4;          // seconds of history on the graph
const GW = 320, GH = 200, MID = GH / 2, XPX = 600; // graph px per metre of displacement

export function oscillator(L, onEvent) {
  let m = 0.5, k = 20, A = 0.08, b = 0, playing = true, raf = 0, t0 = performance.now(), last = 0;
  let showV = false, showA = false, circle = false;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) playing = false;

  // ----- left: spring + mass (+ optional circle) -----
  const coil = s("path", { fill: "none", stroke: "#2ef2ff", "stroke-width": 3.5, "stroke-linejoin": "round" });
  const mass = s("g", {}, s("rect", { x: -24, y: -18, width: 48, height: 36, rx: 8, fill: "#ff4fd8", stroke: "#fff", "stroke-width": 3 }));
  const ring = s("g", { opacity: 0 });
  const scene = s("svg", { class: "scene", viewBox: "0 0 160 260", role: "img", "aria-label": L.scene },
    s("rect", { width: 160, height: 260, fill: "#0a0826" }),
    s("rect", { x: 20, y: 0, width: 120, height: 12, fill: "#3a2f80" }),
    s("path", { d: "M10 150H150", stroke: "#ffe14d", "stroke-width": 1.5, "stroke-dasharray": "4 5" }),
    ring, coil, mass);

  // ----- right: graph -----
  const pathX = s("path", { fill: "none", stroke: "#ff4fd8", "stroke-width": 3 });
  const pathV = s("path", { fill: "none", stroke: "#2ef2ff", "stroke-width": 2, "stroke-dasharray": "6 4" });
  const pathA = s("path", { fill: "none", stroke: "#ffe14d", "stroke-width": 2, "stroke-dasharray": "2 4" });
  const env = s("path", { fill: "none", stroke: "rgba(255,255,255,.35)", "stroke-width": 1.5, "stroke-dasharray": "3 4" });
  const graph = s("svg", { class: "scene", viewBox: `0 0 ${GW} ${GH}`, role: "img", "aria-label": L.graph },
    s("rect", { width: GW, height: GH, fill: "#0a0826" }),
    grid(), env, pathA, pathV, pathX,
    s("text", { x: 8, y: 16, fill: "#ff4fd8", "font-size": 13, "font-weight": 800 }, "y(t)"),
    s("text", { x: GW - 8, y: GH - 8, fill: "#c4bce8", "font-size": 12, "font-weight": 800, "text-anchor": "end" }, L.time_axis));

  // ----- controls -----
  const slider = (label, min, max, step, val, unit, set, words) => {
    const out = h("output");
    const inp = h("input", { type: "range", min, max, step, value: val, "aria-label": label });
    const sync = () => { out.textContent = words ? words(Number(inp.value)) : `${inp.value} ${unit}`; };
    inp.addEventListener("input", () => { set(Number(inp.value)); sync(); restart(); });
    sync();
    return [h("label", {}, label, out), inp];
  };
  const pill = (label, on) => {
    const b2 = h("button", { class: "pill", type: "button", "aria-pressed": "false" }, label);
    b2.addEventListener("click", () => { const v = b2.getAttribute("aria-pressed") !== "true"; b2.setAttribute("aria-pressed", String(v)); on(v, b2); });
    return b2;
  };
  const playBtn = h("button", { class: "btn primary", type: "button" }, playing ? L.pause : L.play);
  const tVal = h("b"), fVal = h("b"), vVal = h("b"), aVal = h("b");
  const formula = h("div", { class: "formula" });

  const root = h("div", {},
    h("div", { class: "lab" },
      h("div", { style: "display:grid;grid-template-columns:110px 1fr;gap:10px;align-items:start" },
        h("div", { class: "scene-box" }, scene), h("div", { class: "scene-box" }, graph)),
      h("div", { class: "controls" },
        ...slider(L.mass, 0.1, 2, 0.05, m, "kg", (v) => (m = v)),
        ...slider(L.k, 5, 100, 1, k, "N/m", (v) => (k = v)),
        ...slider(L.amp, 2, 15, 0.5, A * 100, "cm", (v) => (A = v / 100)),
        // core: words only, and capped below critical damping 2√(mk) (smallest 1.41 at m = 0.1 kg, k = 5 N/m), so it always wobbles
        ...slider(L.damping, 0, 1, 0.1, b, "", (v) => { b = v; if (v > 0) onEvent?.("damping", root); },
          (v) => { const lv = L.damp_levels ?? ["none", "light", "medium", "strong"]; return v === 0 ? lv[0] : v <= 0.3 ? lv[1] : v <= 0.6 ? lv[2] : lv[3]; }),
        h("div", { class: "toggle-row" },
          pill(L.show_v, (v) => { showV = v; draw(); }),
          pill(L.show_a, (v) => { showA = v; draw(); }),
          pill(L.circle, (v, el) => { circle = v; ring.setAttribute("opacity", v ? 1 : 0); if (v) onEvent?.("circle", el); draw(); })),
        h("div", { class: "btn-row" }, playBtn))),
    h("div", { class: "readout" },
      h("div", {}, h("span", {}, L.period), tVal),
      h("div", {}, h("span", {}, L.freq), fVal),
      h("div", {}, h("span", {}, L.vmax), vVal),
      h("div", {}, h("span", {}, L.amax), aVal)),
    formula);

  // ----- drawing -----
  const yAt = (t) => dampedY(t, A, m, k, b);
  function restart() { t0 = performance.now(); last = 0; readouts(); draw(); }

  function readouts() {
    const w = springOmega(m, k), r = dampingRegime(m, k, b);
    const T = b > 0 && r.kind === "under" ? (2 * Math.PI) / r.w : springPeriod(m, k);
    const wobbles = b === 0 || r.kind === "under";
    tVal.textContent = wobbles ? `${fmt(T, 2)} s` : "—";
    fVal.textContent = wobbles ? `${fmt(1 / T, 2)} Hz` : "—";
    // A·ω and A·ω² are the undamped values; with damping on they no longer match the shrinking curve
    vVal.textContent = b > 0 ? "—" : `${fmt(A * w, 2)} m/s`;
    aVal.textContent = b > 0 ? "—" : `${fmt(A * w * w, 2)} m/s²`;
    if (b === 0) formula.textContent = `y(t) = ${fmt(A * 100, 1)} cm · sin(${fmt(w, 2)} t)    T = 2π√(m/k)`;
    else if (r.kind === "under") formula.textContent = L.damped ?? `y(t) = ${fmt(A * 100, 1)} cm · e^(−${fmt(r.g, 2)}t) · sin(${fmt(r.w, 2)}t)`;
    else formula.textContent = L.overdamped;
  }

  function draw() {
    const t = last;
    const y = yAt(t);
    // spring + mass (scene px per m: 500, equilibrium at svg y=150, up = +)
    const my = 150 - y * 500;
    let d = "M80 12";
    const n = 14, top = 22, bottom = my - 20;
    d += `V${top}`;
    for (let i = 0; i < n; i++) d += ` L${80 + (i % 2 ? 16 : -16)} ${top + ((bottom - top) * (i + 0.5)) / n}`;
    d += ` L80 ${bottom} V${my - 18}`;
    coil.setAttribute("d", d);
    mass.setAttribute("transform", `translate(80 ${my})`);
    clear(ring);
    if (circle && dampingRegime(m, k, b).kind === "under") {
      // A point going round a circle; its height is exactly the mass's position (a shrinking circle when damped).
      const gam = b / (2 * m), w0 = springOmega(m, k), wd = Math.sqrt(Math.max(w0 * w0 - gam * gam, 0));
      const R = A * 500 * Math.exp(-gam * t), ang = wd * t;
      const px2 = 80 + R * Math.cos(ang), py2 = 150 - R * Math.sin(ang);
      ring.append(
        s("circle", { cx: 80, cy: 150, r: R, fill: "none", stroke: "#ffe14d", "stroke-width": 1.5, "stroke-dasharray": "3 4" }),
        s("path", { d: `M${px2} ${py2}H80`, stroke: "#ffe14d", "stroke-width": 1.5, "stroke-dasharray": "2 3" }),
        s("circle", { cx: px2, cy: py2, r: 6, fill: "#ffe14d" }));
    }
    // graph: the most recent WINDOW seconds, newest on the right. When paused (or reduced motion)
    // near the start, show a full window of the curve instead of an almost empty graph.
    const tEnd = playing ? t : Math.max(t, WINDOW);
    const from = Math.max(0, tEnd - WINDOW);
    const px = (tt) => 6 + ((tt - from) / WINDOW) * (GW - 12);
    const w = springOmega(m, k);
    let dx = "", dv = "", da = "", de = "";
    const N = 160, eps = 1e-3;
    for (let i = 0; i <= N; i++) {
      const tt = from + ((tEnd - from) * i) / N;
      const xx = yAt(tt);
      const vv = (yAt(tt + eps) - yAt(tt - eps)) / (2 * eps);
      const aa = (yAt(tt + eps) - 2 * xx + yAt(tt - eps)) / (eps * eps);
      const X = px(tt).toFixed(1);
      dx += `${i ? "L" : "M"}${X} ${(MID - xx * XPX).toFixed(1)}`;
      dv += `${i ? "L" : "M"}${X} ${(MID - (vv / Math.max(w, 1e-6)) * XPX).toFixed(1)}`;
      da += `${i ? "L" : "M"}${X} ${(MID - (aa / Math.max(w * w, 1e-6)) * XPX).toFixed(1)}`;
      if (b > 0 && dampingRegime(m, k, b).kind === "under") de += `${i ? "L" : "M"}${X} ${(MID - A * Math.exp(-(b / (2 * m)) * tt) * XPX).toFixed(1)}`;
    }
    pathX.setAttribute("d", dx);
    pathV.setAttribute("d", showV ? dv : "");
    pathA.setAttribute("d", showA ? da : "");
    env.setAttribute("d", de);
  }

  function frame(now) {
    if (playing) { last = (now - t0) / 1000; draw(); }
    raf = requestAnimationFrame(frame);
  }
  playBtn.addEventListener("click", () => {
    playing = !playing;
    playBtn.textContent = playing ? L.pause : L.play;
    if (playing) t0 = performance.now() - last * 1000;
    draw();
  });

  readouts(); draw();
  raf = requestAnimationFrame(frame);
  // stop animating when the element leaves the page
  const mo = new MutationObserver(() => { if (!root.isConnected) { cancelAnimationFrame(raf); mo.disconnect(); } });
  queueMicrotask(() => root.parentNode && mo.observe(document.getElementById("view"), { childList: true }));
  return root;
}

function grid() {
  const g = s("g", { stroke: "rgba(255,255,255,.08)", "stroke-width": 1 });
  for (let i = 1; i < 8; i++) g.append(s("path", { d: `M${(i * GW) / 8} 0V${GH}` }));
  g.append(s("path", { d: `M0 ${MID}H${GW}`, stroke: "rgba(255,255,255,.3)" }));
  return g;
}
