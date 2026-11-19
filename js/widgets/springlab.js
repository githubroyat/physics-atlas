// Interactive: a mass hanging on a spring (like the formula booklet's picture). Drag it up or down from the middle.
// Displacement y (up = +), restoring force F = −k·y, F–y graph, energy readout ½·k·y² (from the middle), elastic limit, "let go".
import { h, s, clear } from "../dom.js";
import { hookeForce, elasticEnergy, springOmega, fmt } from "../physics.js";

const EQ_Y = 168;          // svg y of the mass centre at equilibrium (the middle)
const SCALE = 400;         // px per metre
const Y_MIN = -0.30, Y_MAX = 0.15, LIMIT = 0.25; // stretched downwards past 25 cm = elastic limit
const MASS = 0.5;          // kg, for the "let go" teaser
const sgn = (v) => (v > 0 ? "+" : v < 0 ? "−" : "");

export function springLab(L, fill, onEvent) {
  let k = 40, y = 0, bent = false, raf = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ----- scene -----
  const coil = s("path", { fill: "none", style: "stroke: var(--a1)", "stroke-width": 4, "stroke-linejoin": "round", "stroke-linecap": "round" });
  const arrow = s("g");
  const mass = s("g", { class: "drag-handle", tabindex: "0", role: "slider", "aria-label": L.drag,
    "aria-valuemin": Y_MIN * 100, "aria-valuemax": Y_MAX * 100 },
    s("rect", { x: -28, y: -24, width: 56, height: 48, rx: 12, style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 3 }),
    s("path", { d: "M-12-8h24M-12 0h24M-12 8h24", stroke: "#120d2b", "stroke-width": 3, "stroke-linecap": "round" }));
  const sfx = s("text", { x: 100, y: 300, "text-anchor": "middle", opacity: 0, fill: "#ffe14d", stroke: "#120d2b", "stroke-width": 2,
    "font-size": 34, "font-family": "Bangers, Impact, sans-serif", transform: "rotate(-8 100 300)" }, L.sfx_break);
  const svg = s("svg", { class: "scene", viewBox: "0 0 200 330", role: "img", "aria-label": L.title, style: "touch-action: pan-y" },
    s("rect", { width: 200, height: 330, fill: "#0a0826" }),
    s("rect", { x: 40, y: 0, width: 120, height: 14, fill: "#3a2f80" }),
    s("path", { d: `M14 ${EQ_Y}H186`, stroke: "#ffe14d", "stroke-width": 1.5, "stroke-dasharray": "4 5" }),
    s("text", { x: 16, y: EQ_Y - 6, fill: "#ffe14d", "font-size": 12, "font-weight": 800 }, L.middle),
    coil, arrow, mass, sfx);

  // ----- graph: restoring force F against displacement y -----
  const G_W = 320, G_H = 190, FMAX = 40;
  const gx = (v) => 22 + ((v - Y_MIN) / (Y_MAX - Y_MIN)) * (G_W - 34);
  const gy = (F) => G_H / 2 - (F / FMAX) * (G_H / 2 - 14);
  const line = s("path", { style: "stroke: var(--a1)", "stroke-width": 3, fill: "none" });
  const area = s("path", { fill: "rgba(255,255,255,.18)" });
  const dot = s("circle", { r: 6, fill: "#ffe14d", stroke: "#120d2b", "stroke-width": 2 });
  const trail = s("g", { fill: "#ffe14d", opacity: .55 });
  const graph = s("svg", { class: "scene", viewBox: `0 0 ${G_W} ${G_H}`, role: "img", "aria-label": L.graph_title },
    s("rect", { width: G_W, height: G_H, fill: "#0a0826" }),
    s("path", { d: `M22 ${G_H / 2}H${G_W - 6}M${gx(0)} 8V${G_H - 8}`, stroke: "#6b62a8", "stroke-width": 2 }),
    s("text", { x: G_W - 8, y: G_H / 2 - 6, "text-anchor": "end", fill: "#c4bce8", "font-size": 12, "font-weight": 800 }, L.axis_x),
    s("text", { x: gx(0) + 6, y: 18, fill: "#c4bce8", "font-size": 12, "font-weight": 800 }, L.axis_f),
    area, line, trail, dot);

  // ----- controls & readouts -----
  const kIn = h("input", { type: "range", min: 10, max: 100, step: 5, value: k, "aria-label": L.k });
  const kOut = h("output");
  const yVal = h("b"), fVal = h("b"), eVal = h("b");
  const status = h("p", { class: "small", "aria-live": "polite" });
  const letGo = h("button", { class: "btn primary", type: "button" }, L.let_go);
  const reset = h("button", { class: "btn", type: "button" }, L.reset);

  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:260px;margin:0 auto" }, svg), h("p", { class: "small muted", style: "margin:8px 0 0;text-align:center" }, L.drag_hint)),
    h("div", { class: "controls" },
      h("label", {}, L.k, kOut), kIn,
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.stretch), yVal),
        h("div", {}, h("span", {}, L.force), fVal),
        h("div", {}, h("span", {}, L.energy), eVal)),
      L.energy_note ? h("p", { class: "small muted", style: "margin:6px 0 0" }, L.energy_note) : null,
      h("h3", { style: "margin-top:14px" }, L.graph_title),
      h("div", { class: "scene-box" }, graph),
      status,
      h("div", { class: "btn-row" }, letGo, reset)));

  // ----- physics with an elastic limit (only when stretched downwards) -----
  const forceAt = (yy) => {
    if (!bent || yy >= -LIMIT) return -hookeForce(k, yy);      // F = −k·y
    return hookeForce(k, LIMIT) + 0.25 * k * (-yy - LIMIT);     // past the limit: no longer proportional
  };

  function drawSpring() {
    const my = EQ_Y - y * SCALE, top = 14, bottom = my - 24, n = 12, amp = 16;
    let d = `M100 ${top}v8`;
    const len = bottom - top - 16;
    for (let i = 0; i < n; i++) d += ` L${100 + (i % 2 ? amp : -amp)} ${top + 8 + (len * (i + 0.5)) / n}`;
    d += ` L100 ${bottom - 8} V${bottom}`;
    coil.setAttribute("d", d);
    coil.style.stroke = bent ? "#ff5a6e" : "var(--a1)";
    mass.setAttribute("transform", `translate(100 ${my})`);
    clear(arrow);
    const F = forceAt(y);
    if (Math.abs(F) > 0.05) {
      const len2 = Math.min(110, Math.abs(F) * 4) * (F > 0 ? -1 : 1); // up on screen = positive force
      arrow.append(
        s("path", { d: `M162 ${my}V${my + len2}`, stroke: "#ffe14d", "stroke-width": 6, "stroke-linecap": "round" }),
        s("path", { d: `M162 ${my + len2}l-9 ${-10 * Math.sign(len2)}h18z`, fill: "#ffe14d" }),
        s("text", { x: 150, y: my + len2 / 2, "text-anchor": "end", fill: "#ffe14d", "font-size": 13, "font-weight": 800 }, `${fmt(Math.abs(F), 1)} N`));
    }
  }

  function drawGraph() {
    if (!bent) line.setAttribute("d", `M${gx(Y_MIN)} ${gy(-k * Y_MIN)}L${gx(Y_MAX)} ${gy(-k * Y_MAX)}`);
    else line.setAttribute("d", `M${gx(Y_MIN)} ${gy(forceAt(Y_MIN))}L${gx(-LIMIT)} ${gy(forceAt(-LIMIT))}L${gx(Y_MAX)} ${gy(forceAt(Y_MAX))}`);
    area.setAttribute("d", `M${gx(0)} ${gy(0)}L${gx(y)} ${gy(0)}L${gx(y)} ${gy(forceAt(y))}Z`);
    dot.setAttribute("cx", gx(y)); dot.setAttribute("cy", gy(forceAt(y)));
  }

  function update() {
    kOut.textContent = `${k} N/m`;
    const F = forceAt(y);
    yVal.textContent = `${sgn(y)}${fmt(Math.abs(y) * 100, 1)} cm`;
    fVal.textContent = `${sgn(F)}${fmt(Math.abs(F), 1)} N`;
    eVal.textContent = bent ? "?" : `${fmt(elasticEnergy(k, y), 2)} J`;
    mass.setAttribute("aria-valuenow", Math.round(y * 100));
    drawSpring(); drawGraph();
  }

  function setY(ny, fromDrag) {
    y = Math.min(Y_MAX, Math.max(Y_MIN, ny));
    if (fromDrag && trail.childNodes.length < 60) trail.append(s("circle", { cx: gx(y), cy: gy(forceAt(y)), r: 2.5 }));
    if (Math.abs(y) >= 0.1) onEvent?.("stretch", mass);
    if (y < -LIMIT && !bent) {
      bent = true;
      status.replaceChildren(fill(L.broke));
      sfx.setAttribute("opacity", 1);
      setTimeout(() => sfx.setAttribute("opacity", 0), 1400);
      onEvent?.("break", mass);
    }
    update();
  }

  // ----- dragging (gesture lock on the mass only) -----
  const toSvgY = (clientY) => { const p = svg.createSVGPoint(); p.x = 0; p.y = clientY; return p.matrixTransform(svg.getScreenCTM().inverse()).y; };
  let dragging = false;
  mass.addEventListener("pointerdown", (e) => {
    cancelAnimationFrame(raf); dragging = true; e.preventDefault();
    try { mass.setPointerCapture(e.pointerId); } catch { /* capture is a nicety; the flag still works */ }
  });
  mass.addEventListener("pointermove", (e) => { if (dragging) setY((EQ_Y - toSvgY(e.clientY)) / SCALE, true); });
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) mass.addEventListener(ev, () => { dragging = false; });
  mass.addEventListener("keydown", (e) => {
    const step = { ArrowUp: 0.01, ArrowRight: 0.01, ArrowDown: -0.01, ArrowLeft: -0.01 }[e.key];
    if (step) { e.preventDefault(); cancelAnimationFrame(raf); setY(y + step, true); }
  });

  kIn.addEventListener("input", () => { k = Number(kIn.value); clear(trail); update(); });
  reset.addEventListener("click", () => { cancelAnimationFrame(raf); bent = false; status.replaceChildren(); clear(trail); y = 0; update(); });
  letGo.addEventListener("click", () => {
    cancelAnimationFrame(raf);
    if (bent) { status.replaceChildren(fill(L.cant_let_go)); return; }
    if (Math.abs(y) < 0.01) { status.replaceChildren(fill(L.pull_first)); return; }
    const y0 = y, w = springOmega(MASS, k), t0 = performance.now();
    status.replaceChildren(fill(L.oscillating));
    onEvent?.("letgo", letGo);
    if (reduced) return;
    const step = (now) => {
      const t = (now - t0) / 1000;
      y = y0 * Math.cos(w * t); // released from rest at y0
      update();
      if (t < 6 && root.isConnected) raf = requestAnimationFrame(step); else { y = 0; update(); }
    };
    raf = requestAnimationFrame(step);
  });

  update();
  return root;
}
