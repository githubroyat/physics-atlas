// Interactives for chapter f4 (Newton's law of gravitation, the gravitational field g = G·M/r²):
// the planet lab (probe + field lines + g–r graph), the inverse-square spread demo and the "weigh the Earth" calculator puzzle.
// Nothing here animates: every state is a full still picture (so reduced-motion needs no special case).
import { h, s, richInline } from "../dom.js";
import { GRAV_CONST, EARTH, gravField, fmt } from "../physics.js";

// PHYSICS (move to physics.js): readable scientific notation, e.g. sci(5.97e24, 2) = "5.97 × 10²⁴".
const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
export function sci(x, digits = 2) {
  if (!Number.isFinite(x)) return "—";
  if (x === 0) return fmt(0, digits);
  let e = Math.floor(Math.log10(Math.abs(x)));
  let m = x / 10 ** e;
  if (Number(Math.abs(m).toFixed(digits)) >= 10) { m /= 10; e += 1; }
  return `${m.toFixed(digits)} × 10${String(e).split("").map((c) => SUP[c]).join("")}`;
}
// PHYSICS (move to physics.js): the Earth-mass formula with any G (for the calculator puzzle's wrong picks).
export const weigh = (g, R, Gc) => (g * R * R) / Gc;
/** Field-strength number with a sensible number of decimals for 0.001 … 10 000 m/s². */
export function gFmt(v) {
  return fmt(v, v < 0.1 ? 3 : v < 10 ? 2 : v < 100 ? 1 : 0);
}

const slider = (label, min, max, step, val, show, set) => {
  const out = h("output");
  const inp = h("input", { type: "range", min, max, step, value: val, "aria-label": label });
  const sync = () => { out.textContent = show(Number(inp.value)); };
  inp.addEventListener("input", () => { set(Number(inp.value)); sync(); });
  sync();
  return { nodes: [h("label", {}, label, out), inp], inp, sync };
};
const dash = (c) => ({ stroke: c, "stroke-width": 1.5, "stroke-dasharray": "4 5" });

// ======================================================================================
// 1. The planet lab. Planet mass 0.1–10 Earth masses (log slider), radius 0.3–3 Earth radii.
//    The probe sits on a line out from the centre: r runs from the planet's surface (never inside) to 12 Earth radii.
// ======================================================================================
export const LAB = { RE_MAX: 12, M_LO: 0.1, M_HI: 10, R_LO: 0.3, R_HI: 3 };
const VW = 360, VH = 260, CX = 80, CY = 130, PXE = 22;      // scene: pixels per Earth radius along the line
const GW = 360, GH = 150, GL = 40, GR = 10, GT = 14, GB = 28; // graph frame
const N_LINES = 12, LINE_LEN = 44;

export function gravityLab(L, onEvent) {
  let mRel = 1, rRel = 1, r = 1;                 // planet mass (M_E), planet radius (R_E), probe distance from the centre (R_E)
  let dragging = false, touchedPlanet = false, farOnce = false;
  const M = () => mRel * EARTH.M, R = () => rRel * EARTH.R;
  const gSurf = () => gravField(M(), R());
  const gAt = (rr) => gravField(M(), rr * EARTH.R);
  const pxR = () => PXE * rRel;                  // drawn radius matches the probe's distance scale exactly (surface = r equal to R)
  const clampR = (v) => Math.min(LAB.RE_MAX, Math.max(rRel, v));

  // ----- scene -----
  const axis = s("path", { d: `M${CX} ${CY}H${CX + PXE * LAB.RE_MAX}`, ...dash("rgba(255,255,255,.35)") });
  const ticks = s("g", {});
  const linesG = s("g", { style: "stroke: var(--a1)", fill: "none", "stroke-width": 2, "stroke-linecap": "round", opacity: 0.8 });
  const arrowsG = s("g", { style: "fill: var(--a1)" });
  const planet = s("circle", { cx: CX, cy: CY, style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 3 });
  const planetCore = s("circle", { cx: CX, cy: CY, fill: "rgba(10,8,38,.35)" });
  const gArrow = s("path", { fill: "#ffe14d", stroke: "#ffe14d", "stroke-width": 3, "stroke-linejoin": "round", "stroke-linecap": "round" });
  const disc = s("circle", { r: 11, fill: "#ffe14d", stroke: "#fff", "stroke-width": 3 });
  const hit = s("circle", { r: 24, fill: "transparent" });
  const probe = s("g", { class: "drag-handle", tabindex: "0", role: "slider", "aria-label": L.drag, "aria-valuemin": 1, "aria-valuemax": LAB.RE_MAX, "aria-valuenow": 1 }, hit, disc);
  const svg = s("svg", { class: "scene", viewBox: `0 0 ${VW} ${VH}`, role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: VW, height: VH, fill: "#0a0826" }), axis, ticks, linesG, arrowsG, planet, planetCore, gArrow, probe);

  // ----- graph: g relative to the surface value against distance (outside the planet only) -----
  const gx = (rr) => GL + (rr / LAB.RE_MAX) * (GW - GL - GR);
  const gy = (frac) => GH - GB - frac * (GH - GT - GB);
  const inside = s("rect", { y: GT, height: GH - GT - GB, fill: "rgba(255,255,255,.1)" });
  const curve = s("path", { fill: "none", style: "stroke: var(--a1)", "stroke-width": 3, "stroke-linejoin": "round" });
  const dot = s("circle", { r: 6, fill: "#ffe14d", stroke: "#fff", "stroke-width": 2 });
  const gTop = s("text", { x: GL - 4, y: GT + 4, "text-anchor": "end", fill: "#c4bce8", "font-size": 11, "font-weight": 800 });
  const txt = (x, y, str, anchor = "middle") => s("text", { x, y, "text-anchor": anchor, fill: "#c4bce8", "font-size": 11, "font-weight": 800 }, str);
  const graph = s("svg", { class: "scene", viewBox: `0 0 ${GW} ${GH}`, role: "img", "aria-label": L.graph_label, style: "touch-action: pan-y" },
    s("rect", { width: GW, height: GH, fill: "#0a0826" }),
    s("path", { d: `M${GL} ${GT}V${GH - GB}H${GW - GR}`, fill: "none", stroke: "rgba(255,255,255,.6)", "stroke-width": 1.5 }),
    inside, curve, dot, gTop,
    txt(GL - 4, GH - GB + 4, "0", "end"), txt(GW - GR, GH - 6, L.graph_x, "end"), txt(GL + 6, GT + 12, L.graph_y, "start"),
    txt(GL + 4, GH - GB - 6, L.graph_inside, "start"));

  // ----- controls & readouts -----
  const mS = slider(L.mass, -1, 1, 0.01, 0, (v) => `${fmt(10 ** v, 2)} × ${L.earth_mass}`, (v) => { mRel = 10 ** v; touchedPlanet = true; update(); });
  const rS = slider(L.radius, LAB.R_LO, LAB.R_HI, 0.05, 1, (v) => `${fmt(v, 2)} × ${L.earth_radius}`, (v) => { rRel = v; touchedPlanet = true; r = clampR(r); update(); });
  const earthBtn = h("button", { class: "btn", type: "button" }, L.earth_btn);
  const vals = { gS: h("b"), gP: h("b"), F: h("b"), rr: h("b"), ratio: h("b"), mass: h("b"), rad: h("b"), patch: h("b") };
  const formula = h("div", { class: "formula" });
  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:380px;margin:0 auto" }, svg),
      h("p", { class: "small muted", style: "margin:8px 0 0;text-align:center" }, L.drag_hint),
      h("div", { class: "scene-box", style: "max-width:380px;margin:10px auto 0" }, graph)),
    h("div", { class: "controls" },
      ...mS.nodes, ...rS.nodes, h("div", { class: "btn-row" }, earthBtn),
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.r_mass), vals.mass),
        h("div", {}, h("span", {}, L.r_radius), vals.rad),
        h("div", {}, h("span", {}, L.r_dist), vals.rr),
        h("div", {}, h("span", {}, L.r_gsurf), vals.gS),
        h("div", {}, h("span", {}, L.r_gprobe), vals.gP),
        h("div", {}, h("span", {}, L.r_force), vals.F),
        h("div", {}, h("span", {}, L.r_ratio), vals.ratio),
        h("div", {}, h("span", {}, L.r_patch), vals.patch)),
      formula));

  const tickEls = [];
  for (let k = 1; k <= LAB.RE_MAX; k++) {
    const x = CX + PXE * k;
    tickEls.push(s("path", { d: `M${x} ${CY - 4}V${CY + 4}`, stroke: "rgba(255,255,255,.5)", "stroke-width": 1.5 }));
    if (k % 2 === 0) tickEls.push(s("text", { x, y: CY + 20, "text-anchor": "middle", fill: "#c4bce8", "font-size": 11, "font-weight": 800 }, String(k)));
  }
  ticks.append(...tickEls, s("text", { x: CX + PXE * LAB.RE_MAX, y: CY + 36, "text-anchor": "end", fill: "#c4bce8", "font-size": 11, "font-weight": 800 }, L.axis_unit));

  // ----- drawing -----
  function drawField() {
    const pr = pxR();
    let d = "", a = "";
    for (let k = 0; k < N_LINES; k++) {
      const th = (k * 2 * Math.PI) / N_LINES, ux = Math.cos(th), uy = Math.sin(th);
      const p = (rad) => [CX + rad * ux, CY + rad * uy];
      const [x1, y1] = p(pr), [x2, y2] = p(pr + LINE_LEN);
      d += `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
      const tip = p(pr + 16), base = p(pr + 28), nx = -uy * 5, ny = ux * 5;   // arrowhead pointing in, towards the planet
      a += `M${tip[0].toFixed(1)} ${tip[1].toFixed(1)}L${(base[0] + nx).toFixed(1)} ${(base[1] + ny).toFixed(1)}L${(base[0] - nx).toFixed(1)} ${(base[1] - ny).toFixed(1)}Z`;
    }
    linesG.replaceChildren(s("path", { d }));
    arrowsG.replaceChildren(s("path", { d: a }));
    planet.setAttribute("r", pr.toFixed(1));
    planetCore.setAttribute("r", Math.max(2, pr - 10).toFixed(1));
  }
  function drawProbe() {
    const x = CX + PXE * r, gp = gAt(r);
    probe.setAttribute("transform", `translate(${x.toFixed(1)} ${CY})`);
    probe.setAttribute("aria-valuemin", fmt(rRel, 2)); probe.setAttribute("aria-valuenow", fmt(r, 2));
    probe.setAttribute("aria-valuetext", `${fmt(r, 2)} ${L.earth_radius}, g = ${gFmt(gp)} m/s²`);
    // field arrow at the probe: length grows slowly (log) with g, always points at the planet's centre
    const len = Math.min(60, 8 + 14 * Math.log10(1 + gp)), x0 = x - 12, x1 = x0 - len;
    gArrow.setAttribute("d", `M${x0.toFixed(1)} ${CY}H${(x1 + 2).toFixed(1)}M${(x1 + 9).toFixed(1)} ${CY - 6}L${x1.toFixed(1)} ${CY}L${(x1 + 9).toFixed(1)} ${CY + 6}`);
  }
  function drawGraph() {
    const R1 = rRel;
    let d = "";
    for (let i = 0; i <= 60; i++) {
      const rr = R1 + ((LAB.RE_MAX - R1) * i) / 60;
      d += `${i ? "L" : "M"}${gx(rr).toFixed(1)} ${gy((R1 / rr) ** 2).toFixed(1)}`;
    }
    curve.setAttribute("d", d);
    inside.setAttribute("x", gx(0)); inside.setAttribute("width", Math.max(0, gx(R1) - gx(0)).toFixed(1));
    dot.setAttribute("cx", gx(r).toFixed(1)); dot.setAttribute("cy", gy((rRel / r) ** 2).toFixed(1));
    gTop.textContent = `${gFmt(gSurf())}`;
  }
  function readouts() {
    const gS = gSurf(), gp = gAt(r), rm = r * EARTH.R;
    vals.mass.textContent = `${sci(M(), 2)} kg`;
    vals.rad.textContent = `${sci(R(), 2)} m`;
    vals.rr.textContent = `${fmt(r / rRel, 2)} × ${L.planet_radius}`;
    vals.gS.textContent = `${gFmt(gS)} m/s²`;
    vals.gP.textContent = `${gFmt(gp)} m/s²`;
    vals.F.textContent = `${gFmt(gp)} N`;                       // F = m·g with m = 1 kg
    vals.ratio.textContent = `${fmt(100 * (rRel / r) ** 2, 1)} %`;
    vals.patch.textContent = `${fmt(((1000 / rm) * 180) / Math.PI, 4)}°`;   // a 1 km wide patch seen from the centre
    formula.textContent = `g = G·M/r² = (${sci(GRAV_CONST, 3)} × ${sci(M(), 2)}) / (${sci(rm, 2)})² = ${gFmt(gp)} m/s²`;
  }
  function update() {
    drawField(); drawProbe(); drawGraph(); readouts();
    if (!farOnce && r >= 2 * rRel - 1e-9 && touchedPlanet) { farOnce = true; onEvent?.("lab", probe); }
  }
  function setR(v) { r = clampR(v); update(); }

  // ----- dragging (gesture lock on the probe only) -----
  const toSvg = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  probe.addEventListener("pointerdown", (e) => {
    dragging = true; e.preventDefault();
    try { probe.setPointerCapture(e.pointerId); } catch { /* capture is a nicety; the flag still works */ }
  });
  probe.addEventListener("pointermove", (e) => { if (dragging) setR((toSvg(e).x - CX) / PXE); });
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) probe.addEventListener(ev, () => { dragging = false; });
  probe.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 0.1, ArrowUp: 0.1, ArrowLeft: -0.1, ArrowDown: -0.1, PageUp: 1, PageDown: -1 }[e.key];
    if (step) { e.preventDefault(); setR(r + step); }
    else if (e.key === "Home") { e.preventDefault(); setR(rRel); }
    else if (e.key === "End") { e.preventDefault(); setR(LAB.RE_MAX); }
  });
  earthBtn.addEventListener("click", () => {
    mRel = 1; rRel = 1; r = clampR(r);
    mS.inp.value = "0"; rS.inp.value = "1"; mS.sync(); rS.sync(); update();
  });

  update();
  return root;
}

// ======================================================================================
// 2. The inverse-square law: the same field lines spread over a sphere that grows with distance (area 4π·r²).
// ======================================================================================
export const SPREAD = { N_LO: 1, N_HI: 4 };
export function spreadDemo(L) {
  const W = 360, H = 210, SX = 24, SY = 105, U = 80, HALF = (12 * Math.PI) / 180;
  let n = 1;
  const rays = [-2, -1, 0, 1, 2].map((k) => (k * HALF) / 2);
  const arcs = [1, 2, 3, 4].map((k) => s("path", {
    d: `M${(SX + U * k * Math.cos(-HALF * 1.25)).toFixed(1)} ${(SY + U * k * Math.sin(-HALF * 1.25)).toFixed(1)}A${U * k} ${U * k} 0 0 1 ${(SX + U * k * Math.cos(HALF * 1.25)).toFixed(1)} ${(SY + U * k * Math.sin(HALF * 1.25)).toFixed(1)}`,
    fill: "none", ...dash("rgba(255,255,255,.3)") }));
  const rayPaths = rays.map((a) => s("path", { d: `M${SX} ${SY}L${(SX + U * 4 * Math.cos(a)).toFixed(1)} ${(SY + U * 4 * Math.sin(a)).toFixed(1)}`, style: "stroke: var(--a1)", "stroke-width": 2.5, "stroke-linecap": "round", fill: "none" }));
  const patch = s("ellipse", { style: "fill: var(--a2)", "fill-opacity": 0.55, stroke: "#ffe14d", "stroke-width": 3 });
  const src = s("circle", { cx: SX, cy: SY, r: 9, style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 3 });
  const svg = s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: "#0a0826" }), ...arcs, ...rayPaths, patch, src);
  const v = { n: h("b"), area: h("b"), dens: h("b"), g: h("b") };
  const sl = slider(L.dist, SPREAD.N_LO, SPREAD.N_HI, 0.1, n, (x) => `${fmt(x, 1)} × ${L.unit}`, (x) => { n = x; update(); });
  const root = h("div", { class: "lab" },
    h("div", { class: "scene-box", style: "max-width:380px;margin:0 auto" }, svg),
    h("div", { class: "controls" }, ...sl.nodes,
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.r_dist), v.n),
        h("div", {}, h("span", {}, L.r_area), v.area),
        h("div", {}, h("span", {}, L.r_dens), v.dens),
        h("div", {}, h("span", {}, L.r_g), v.g)),
      h("p", { class: "small muted" }, richInline(L.note))));
  function update() {
    const cx = SX + U * n, ry = U * n * Math.tan(HALF);
    patch.setAttribute("cx", cx.toFixed(1)); patch.setAttribute("cy", SY);
    patch.setAttribute("rx", "6"); patch.setAttribute("ry", ry.toFixed(1));
    v.n.textContent = `${fmt(n, 1)} ×`;
    v.area.textContent = `${fmt(n * n, 2)} ×`;
    v.dens.textContent = `1/${fmt(n * n, 2)} = ${fmt(1 / (n * n), 2)}`;
    v.g.textContent = `${fmt(100 / (n * n), 0)} %`;
  }
  update();
  return root;
}

// ======================================================================================
// 3. Weigh the Earth: pick g, R and G, then M = g·R²/G. Wrong picks give absurd masses with a hint.
// ======================================================================================
export const WEIGH_ROWS = [
  { key: "g", values: [1.62, 9.81, 3.71], right: 1, digits: 2 },
  { key: "R", values: [6.38e3, 1.276e7, EARTH.R], right: 2, digits: 2 },
  { key: "G", values: [GRAV_CONST, 6.6743e-8, 6.6743e11], right: 0, digits: 3 },
];
export function weighGame(L, winContent, onWin) {
  const pick = [null, null, null];
  let won = false;
  const label = (row, v) => (row.key === "g" ? `${fmt(v, 2)}` : sci(v, row.digits));
  const rows = WEIGH_ROWS.map((row, i) => {
    const info = L.rows[i];
    const btns = row.values.map((v, j) => h("button", { class: "choice", type: "button", "aria-pressed": "false" }, `${label(row, v)} ${info.unit}`));
    btns.forEach((b, j) => b.addEventListener("click", () => { pick[i] = j; btns.forEach((x, k) => x.setAttribute("aria-pressed", String(k === j))); sync(); }));
    return h("div", { style: "margin:10px 0" }, h("p", { class: "step-q", style: "margin:0 0 6px" }, info.label), h("div", { class: "choices" }, btns));
  });
  const formula = h("div", { class: "formula" });
  const go = h("button", { class: "btn primary", type: "button", disabled: true }, L.go);
  const out = h("div", { class: "reveal", hidden: true, "aria-live": "polite" });
  const win = h("div", { class: "reveal", hidden: true }, winContent);
  const root = h("div", {}, ...rows, formula, h("div", { class: "btn-row" }, go), out, win);

  const val = (i) => (pick[i] == null ? null : WEIGH_ROWS[i].values[pick[i]]);
  function sync() {
    const [g, R, Gc] = [val(0), val(1), val(2)];
    formula.textContent = `M = g·R²/G = ${g == null ? "?" : fmt(g, 2)} × (${R == null ? "?" : sci(R, 2)})² / ${Gc == null ? "?" : sci(Gc, 3)}`;
    go.disabled = pick.includes(null);
  }
  go.addEventListener("click", () => {
    const [g, R, Gc] = [val(0), val(1), val(2)];
    const Mx = weigh(g, R, Gc), ratio = Mx / EARTH.M;
    const bad = WEIGH_ROWS.map((row, i) => (pick[i] === row.right ? null : L.rows[i].hints[pick[i]])).filter(Boolean);
    out.hidden = false; out.replaceChildren();
    out.append(h("div", { class: "readout" },
      h("div", {}, h("span", {}, L.res_mass), h("b", {}, `${sci(Mx, 2)} kg`)),
      h("div", {}, h("span", {}, L.res_booklet), h("b", {}, `${sci(EARTH.M, 2)} kg`)),
      h("div", {}, h("span", {}, L.res_ratio), h("b", {}, `${ratio < 100 && ratio > 0.01 ? fmt(ratio, 2) : sci(ratio, 1)} ×`))));
    if (!bad.length) {
      out.append(h("p", { class: "verdict" }, L.ok));
      win.hidden = false;
      if (!won) { won = true; onWin?.(go); }
    } else out.append(h("p", { class: "verdict" }, L.wrong), h("ul", { class: "small" }, bad.map((t) => h("li", {}, t))));
  });
  sync();
  return root;
}
