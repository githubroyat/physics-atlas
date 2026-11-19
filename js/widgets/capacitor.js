// Interactives for chapter f2 (Stored lightning): the parallel-plate field lab and the charging / discharging demo.
// Model of lab 1: an ideal uniform field E = U/d between the plates, E ≈ 0 outside (the edge "fringe" is only drawn, not computed).
// Model of lab 2: a capacitor charged / discharged through a resistor; only the SHAPES of U(t) and I(t) are shown.
import { h, s } from "../dom.js";
import { uniformField, capCharge, capEnergy, fmt, sci } from "../physics.js";

const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
/** 2000 -> "2 000" (thin look, no comma): used for field strengths in V/m. */
export const bigFmt = (x, digits = 0) => fmt(x, digits).replace(/,/g, " ");

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

// ======================================================================================
// 1. The parallel-plate lab
// ======================================================================================
export const PLATES = {
  U0: 60, Umin: 0, Umax: 100, Ustep: 5,        // volts
  d0: 3.0, dmin: 2.0, dmax: 10.0, dstep: 0.5,  // centimetres (d > 0 always)
  charges: [2e-9, -2e-9, 4e-9],                // the test charges she can pick, coulombs
};
const SW = 300, SH = 300, PL = 50, PR = 250, CY = 150, THICK = 8, RAD = 11, ARROW_PER_N = 7.5e6, ARROW_MAX = 110, STEP = 8;
const gapPx = (dcm) => 40 + ((dcm - PLATES.dmin) / (PLATES.dmax - PLATES.dmin)) * 140; // 40 px at 2 cm … 180 px at 10 cm

// PHYSICS (move to physics.js): none needed; E = U/d and F = q·E come from uniformField and the product below.
/** Field strength (V/m) and force (N) on charge q at U volts and d centimetres; inside=false gives the model's E ≈ 0 outside. */
export function plateNumbers(U, dcm, q, inside) {
  const E = inside ? uniformField(U, dcm / 100) : 0;
  return { E, F: q * E };
}

export function platesLab(L, onEvent) {
  let U = PLATES.U0, dcm = PLATES.d0, qi = 0, x = 150, y = CY, dragging = false;

  const topIn = () => CY - gapPx(dcm) / 2, botIn = () => CY + gapPx(dcm) / 2;
  const isInside = () => x >= PL && x <= PR && y > topIn() && y < botIn();

  // ----- scene -----
  const fieldLines = s("g", { fill: "none", stroke: "#ffe14d", "stroke-width": 2 });
  const plateTop = s("rect", { x: PL, width: PR - PL, height: THICK, rx: 3, fill: "#ff6b6b" });
  const plateBot = s("rect", { x: PL, width: PR - PL, height: THICK, rx: 3, fill: "#4da6ff" });
  const signsTop = s("g", { fill: "#0a0826", "font-size": 13, "font-weight": 800, "text-anchor": "middle" });
  const signsBot = s("g", { fill: "#0a0826", "font-size": 13, "font-weight": 800, "text-anchor": "middle" });
  const arrowShaft = s("path", { fill: "none", stroke: "#fff", "stroke-width": 4, "stroke-linecap": "round" });
  const arrowHead = s("path", { fill: "#fff" });
  const disc = s("circle", { r: RAD, stroke: "#fff", "stroke-width": 3 });
  const sign = s("text", { "text-anchor": "middle", "font-size": 16, "font-weight": 800, fill: "#fff", dy: 5 });
  const handle = s("g", { class: "drag-handle", tabindex: "0", role: "slider", "aria-label": L.drag, "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": 50 }, disc, sign);
  const note = s("text", { x: 8, y: 292, fill: "rgba(255,255,255,.7)", "font-size": 11 }, L.outside_note);
  const svg = s("svg", { class: "scene", viewBox: `0 0 ${SW} ${SH}`, role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: SW, height: SH, fill: "#0a0826" }),
    fieldLines, plateTop, plateBot, signsTop, signsBot, note, arrowShaft, arrowHead, handle);

  // ----- controls and readouts -----
  const pills = PLATES.charges.map((qv, i) => pill(`${qv > 0 ? "+" : "−"}${fmt(Math.abs(qv) * 1e9, 1)} nC`, () => { qi = i; syncPills(); draw(); report(); }));
  const syncPills = () => pills.forEach((b, i) => b.setAttribute("aria-pressed", String(i === qi)));
  syncPills();
  const eVal = h("b"), fVal = h("b"), whereVal = h("b"), dirVal = h("b");
  const formula = h("div", { class: "formula" });
  const status = h("p", { class: "small", "aria-live": "polite" });
  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:340px;margin:0 auto" }, svg),
      h("p", { class: "small muted", style: "margin:8px 0 0;text-align:center" }, L.drag_hint)),
    h("div", { class: "controls" },
      ...slider(L.voltage, PLATES.Umin, PLATES.Umax, PLATES.Ustep, U, (v) => `${fmt(v, 0)} V`, (v) => { U = v; draw(); report(); }),
      ...slider(L.gap, PLATES.dmin, PLATES.dmax, PLATES.dstep, dcm, (v) => `${fmt(v, 1)} cm`, (v) => { const was = isInside(); dcm = v; fit(was); draw(); report(); }),
      h("label", {}, L.charge),
      h("div", { class: "toggle-row", style: "margin-top:4px" }, pills),
      status,
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.field), eVal),
        h("div", {}, h("span", {}, L.force), fVal),
        h("div", {}, h("span", {}, L.dir), dirVal),
        h("div", {}, h("span", {}, L.where), whereVal)),
      formula));

  // ----- keeping the charge off the plates -----
  function fit(wasInside) {
    x = clamp(x, RAD + 4, SW - RAD - 4); y = clamp(y, RAD + 4, SH - RAD - 4);
    if (wasInside) { x = clamp(x, PL, PR); y = clamp(y, topIn() + RAD, botIn() - RAD); return; }
    if (x > PL - RAD && x < PR + RAD) {
      const t = topIn(), b = botIn();
      if (y > t - THICK - RAD && y < t + RAD) y = y < t - THICK / 2 ? t - THICK - RAD : t + RAD;       // top plate band
      if (y > b - RAD && y < b + THICK + RAD) y = y < b + THICK / 2 ? b - RAD : b + THICK + RAD;       // bottom plate band
    }
  }
  function moveTo(nx, ny) { x = nx; y = ny; fit(false); draw(); }

  // ----- drawing -----
  function draw() {
    const t = topIn(), b = botIn(), inside = isInside(), q = PLATES.charges[qi];
    plateTop.setAttribute("y", t - THICK); plateBot.setAttribute("y", b);
    const signs = (g, yy, ch) => { g.replaceChildren(...Array.from({ length: 8 }, (_, i) => s("text", { x: PL + 12.5 + i * 25, y: yy }, ch))); };
    signs(signsTop, t - 1.5, "+"); signs(signsBot, b + THICK - 1.5, "−");
    // field lines: nine straight lines, the two outer ones bulge out at the edges (weaker fringe)
    fieldLines.replaceChildren();
    if (U > 0) {
      const op = 0.4 + 0.6 * (U / PLATES.Umax);
      fieldLines.setAttribute("opacity", op.toFixed(2));
      for (let i = 0; i < 9; i++) {
        const lx = PL + (200 * (i + 0.5)) / 9, bow = i === 0 ? -16 : i === 8 ? 16 : 0, mid = (t + b) / 2;
        fieldLines.append(s("path", { d: bow ? `M${lx.toFixed(1)} ${t}Q${(lx + bow * 2).toFixed(1)} ${mid} ${lx.toFixed(1)} ${b}` : `M${lx.toFixed(1)} ${t}V${b}`, ...(bow ? { "stroke-dasharray": "5 4" } : {}) }));
        fieldLines.append(s("path", { d: `M${(lx + bow - 4).toFixed(1)} ${mid - 3}l4 8l4 -8`, fill: "none" }));
      }
    }
    // test charge and force arrow
    handle.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    disc.setAttribute("fill", q > 0 ? "#ff6b6b" : "#4da6ff");
    sign.textContent = q > 0 ? "+" : "−";
    const { F } = plateNumbers(U, dcm, q, inside);
    if (F !== 0) {
      const len = clamp(Math.abs(F) * ARROW_PER_N, 5, ARROW_MAX), dir = F > 0 ? 1 : -1;   // field points down, + plate on top
      const y0 = y + dir * (RAD + 3), y1 = y0 + dir * len;
      arrowShaft.setAttribute("d", `M${x.toFixed(1)} ${y0.toFixed(1)}V${y1.toFixed(1)}`);
      arrowHead.setAttribute("d", `M${(x - 8).toFixed(1)} ${(y1 - dir * 2).toFixed(1)}L${x.toFixed(1)} ${(y1 + dir * 12).toFixed(1)}L${(x + 8).toFixed(1)} ${(y1 - dir * 2).toFixed(1)}Z`);
    } else { arrowShaft.setAttribute("d", ""); arrowHead.setAttribute("d", ""); }
    handle.setAttribute("aria-valuenow", String(Math.round((y / SH) * 100)));
    handle.setAttribute("aria-valuetext", inside ? L.where_in : L.where_out);
  }

  function report() {
    const inside = isInside(), q = PLATES.charges[qi];
    const { E, F } = plateNumbers(U, dcm, q, inside);
    const dm = dcm / 100;
    eVal.textContent = `${bigFmt(E)} V/m`;
    fVal.textContent = F === 0 ? "0 N" : `${sci(Math.abs(F), 2)} N`;
    dirVal.textContent = F === 0 ? "—" : F > 0 ? L.down : L.up;
    whereVal.textContent = inside ? L.where_in : L.where_out;
    if (!inside) { formula.textContent = L.f_outside; status.textContent = L.s_outside; }
    else if (U === 0) { formula.textContent = L.f_zero; status.textContent = L.s_zero; }
    else {
      formula.replaceChildren( // two lines: spaces would collapse and run the formulas together
        h("div", {}, `E = U/d = ${fmt(U, 0)} / ${fmt(dm, 3)} = ${bigFmt(E)} V/m`),
        h("div", {}, `F = q·E = ${sci(Math.abs(q), 2)} × ${bigFmt(E)} = ${sci(Math.abs(F), 2)} N`));
      status.textContent = L.s_in;
    }
  }
  function settled() { // call after a drag or key press: fire the lab events
    const inside = isInside();
    if (inside && U > 0) onEvent?.("plates", handle);
    if (!inside) onEvent?.("outside", handle);
  }

  // ----- dragging (gesture lock on the charge only) -----
  const toSvg = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  handle.addEventListener("pointerdown", (e) => {
    dragging = true; e.preventDefault();
    try { handle.setPointerCapture(e.pointerId); } catch { /* capture is a nicety; the flag still works */ }
  });
  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const p = toSvg(e);
    moveTo(p.x, p.y); report();
  });
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) handle.addEventListener(ev, () => {
    if (!dragging) return;
    dragging = false;
    if (ev === "pointerup") settled();
  });
  handle.addEventListener("keydown", (e) => {
    const mv = { ArrowRight: [STEP, 0], ArrowLeft: [-STEP, 0], ArrowDown: [0, STEP], ArrowUp: [0, -STEP] }[e.key];
    if (!mv) return;
    e.preventDefault();
    moveTo(x + mv[0], y + mv[1]); report(); settled();
  });

  fit(true); draw(); report();
  return root;
}

// ======================================================================================
// 2. Charging and discharging through a resistor: the shapes of U(t) and I(t)
// ======================================================================================
export const CHARGING = {
  U0: 12, Umin: 0, Umax: 12,        // volts
  R0: 4, Rmin: 2, Rmax: 10,         // kilo-ohms
  C0: 200, Cmin: 100, Cmax: 500,    // microfarads
  TW: 15, SPEED: 3,                 // seconds shown in the graphs; simulated seconds per real second
};

// PHYSICS (move to physics.js): the curves of a capacitor charging / discharging through a resistor. Used only to draw the
// SHAPES; the chapter text does not give the formula (the exponential and τ = R·C are bonus material).
/** Capacitor voltage and circuit current at time t (s). U supply (V), R in ohms, C in farads. */
export function rcState(mode, t, U, R, C) {
  const decay = Math.exp(-t / (R * C));
  return mode === "charge" ? { u: U * (1 - decay), i: (U / R) * decay } : { u: U * decay, i: (U / R) * decay };
}

export function chargingLab(L, onEvent) {
  const K = CHARGING;
  let mode = "charge", U = K.U0, R = K.R0, C = K.C0, t = K.TW, running = false, raf = 0, last = 0;
  const reduced = rm();

  // ----- graphs -----
  const X0 = 44, X1 = 288, UY0 = 16, UY1 = 106, IY0 = 146, IY1 = 236;
  const axis = (y0, y1, label) => [
    s("path", { d: `M${X0} ${y0}V${y1}H${X1}`, fill: "none", stroke: "rgba(255,255,255,.7)", "stroke-width": 1.5 }),
    s("text", { x: 4, y: y0 + 8, fill: "#fff", "font-size": 12, "font-weight": 800 }, label),
  ];
  const faintU = s("path", { fill: "none", stroke: "rgba(255,255,255,.35)", "stroke-width": 2, "stroke-dasharray": "5 5" });
  const faintI = s("path", { fill: "none", stroke: "rgba(255,255,255,.35)", "stroke-width": 2, "stroke-dasharray": "5 5" });
  const solidU = s("path", { fill: "none", style: "stroke: var(--a1)", "stroke-width": 3.5, "stroke-linecap": "round" });
  const solidI = s("path", { fill: "none", style: "stroke: var(--a2)", "stroke-width": 3.5, "stroke-linecap": "round" });
  const dotU = s("circle", { r: 5, fill: "#ffe14d" }), dotI = s("circle", { r: 5, fill: "#ffe14d" });
  const supplyLine = s("path", { d: `M${X0} ${UY0}H${X1}`, stroke: "rgba(255,225,77,.5)", "stroke-dasharray": "3 4", fill: "none" });
  const svg = s("svg", { class: "scene", viewBox: "0 0 300 268", role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: 300, height: 268, fill: "#0a0826" }),
    ...axis(UY0, UY1, "U"), ...axis(IY0, IY1, "I"), supplyLine,
    s("text", { x: X1 - 2, y: UY0 - 3, fill: "#ffe14d", "font-size": 10, "text-anchor": "end" }, L.supply),
    s("text", { x: X1 - 2, y: UY1 + 14, fill: "#fff", "font-size": 11, "text-anchor": "end" }, L.ax_t),
    s("text", { x: X1 - 2, y: IY1 + 14, fill: "#fff", "font-size": 11, "text-anchor": "end" }, L.ax_t),
    faintU, faintI, solidU, solidI, dotU, dotI);

  // ----- controls and readouts -----
  const modeBtns = ["charge", "discharge"].map((m) => pill(L[m], () => { mode = m; syncModes(); restart(); }));
  const syncModes = () => modeBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(["charge", "discharge"][i] === mode)));
  syncModes();
  const go = h("button", { class: "btn primary", type: "button" }, L.go);
  const tInp = h("input", { type: "range", min: 0, max: K.TW, step: 0.1, value: t, "aria-label": L.time });
  const tOut = h("output");
  const uVal = h("b"), iVal = h("b"), qVal = h("b"), wVal = h("b"), pVal = h("b");
  const formula = h("div", { class: "formula" });
  const status = h("p", { class: "small", "aria-live": "polite" });
  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:340px;margin:0 auto" }, svg)),
    h("div", { class: "controls" },
      h("div", { class: "toggle-row", style: "margin-top:0" }, modeBtns, go),
      ...slider(L.voltage, K.Umin, K.Umax, 1, U, (v) => `${fmt(v, 0)} V`, (v) => { U = v; update(); }),
      ...slider(L.capacitance, K.Cmin, K.Cmax, 50, C, (v) => `${fmt(v, 0)} µF`, (v) => { C = v; update(); }),
      ...slider(L.resistance, K.Rmin, K.Rmax, 1, R, (v) => `${fmt(v, 0)} kΩ`, (v) => { R = v; update(); }),
      h("label", {}, L.time, tOut), tInp,
      status,
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.u_now), uVal),
        h("div", {}, h("span", {}, L.i_now), iVal),
        h("div", {}, h("span", {}, L.q_now), qVal),
        h("div", {}, h("span", {}, L.w_now), wVal),
        h("div", {}, h("span", {}, L.level), pVal)),
      formula));

  const Ro = () => R * 1e3, Cf = () => C * 1e-6;
  const px = (tt) => X0 + (tt / K.TW) * (X1 - X0);

  function path(fn, y0, y1, norm, upto) { // fn(t) -> value; normalised by norm (0 -> flat on the axis)
    const n = 90, pts = [];
    for (let k = 0; k <= n; k++) {
      const tt = (upto * k) / n;
      const v = norm > 0 ? fn(tt) / norm : 0;
      pts.push(`${k ? "L" : "M"}${px(tt).toFixed(1)} ${(y1 - v * (y1 - y0 - 4)).toFixed(1)}`);
    }
    return pts.join("");
  }
  function update() { draw(); readouts(); }
  function draw() {
    const I0 = U / Ro(), fu = (tt) => rcState(mode, tt, U, Ro(), Cf()).u, fi = (tt) => rcState(mode, tt, U, Ro(), Cf()).i;
    faintU.setAttribute("d", path(fu, UY0, UY1, U, K.TW)); faintI.setAttribute("d", path(fi, IY0, IY1, I0, K.TW));
    solidU.setAttribute("d", t > 0 ? path(fu, UY0, UY1, U, t) : ""); solidI.setAttribute("d", t > 0 ? path(fi, IY0, IY1, I0, t) : "");
    const place = (dot, fn, y0, y1, norm) => { dot.setAttribute("cx", px(t).toFixed(1)); dot.setAttribute("cy", (y1 - (norm > 0 ? fn(t) / norm : 0) * (y1 - y0 - 4)).toFixed(1)); };
    place(dotU, fu, UY0, UY1, U); place(dotI, fi, IY0, IY1, I0);
    tInp.value = String(t); tOut.textContent = `${fmt(t, 1)} s`;
  }
  function readouts() {
    const st = rcState(mode, t, U, Ro(), Cf());
    uVal.textContent = `${fmt(st.u, 2)} V`; iVal.textContent = `${fmt(st.i * 1e3, 2)} mA`;
    qVal.textContent = `${fmt(capCharge(Cf(), st.u) * 1e3, 2)} mC`; wVal.textContent = `${fmt(capEnergy(Cf(), st.u) * 1e3, 2)} mJ`;
    pVal.textContent = U > 0 ? `${fmt((st.u / U) * 100, 0)} %` : "—";
    const Qf = capCharge(Cf(), U), Wf = capEnergy(Cf(), U);
    formula.textContent = `Q = C·U = ${fmt(C, 0)} µF × ${fmt(U, 0)} V = ${fmt(Qf * 1e3, 2)} mC      W = ½·C·U² = ${fmt(Wf * 1e3, 2)} mJ`;
    status.textContent = U === 0 ? L.s_zero : running ? L.s_run : reduced ? L.s_reduced : (mode === "charge" ? L.s_charge : L.s_discharge);
  }

  // ----- run / stop -----
  function stop() { cancelAnimationFrame(raf); running = false; }
  function checkEnd() { if (t >= K.TW && U > 0) onEvent?.(mode, go); }
  function restart() {
    stop();
    if (reduced) { t = K.TW; update(); checkEnd(); return; }   // no animation: the whole graph, scrub with the time slider
    t = 0; running = true; last = performance.now(); update();
    raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    if (!running) return;
    if (!root.isConnected) { stop(); return; }
    t = Math.min(K.TW, t + (Math.min(now - last, 50) / 1000) * K.SPEED); last = now;
    if (t >= K.TW) { running = false; update(); checkEnd(); return; }
    update();
    raf = requestAnimationFrame(frame);
  }
  go.addEventListener("click", restart);
  tInp.addEventListener("input", () => { stop(); t = Number(tInp.value); update(); checkEnd(); });

  update();
  return root;
}
