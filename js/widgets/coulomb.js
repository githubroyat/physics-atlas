// Interactives for chapter f1 (electric charge, Coulomb's law): the two-charge lab and the electric-vs-gravity comparison.
// No animation anywhere: every state is a full still picture, so prefers-reduced-motion needs no special case.
import { h, s, richInline } from "../dom.js";
import { K_COULOMB, E_CHARGE, M_ELECTRON, M_PROTON, GRAV_CONST, coulombForce, gravForce, fmt } from "../physics.js";

// PHYSICS (move to physics.js): scientific notation for very large / very small numbers, e.g. 8.99 × 10⁹.
const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
export function sciFmt(x, digits = 3) {
  if (x === 0 || !Number.isFinite(x)) return "0";
  const [m, e] = Math.abs(x).toExponential(Math.max(0, digits - 1)).split("e");
  const sup = String(Number(e)).split("").map((c) => SUP[c]).join("");
  return `${x < 0 ? "−" : ""}${m} × 10${sup}`;
}
export const sgn = (v) => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : "0");

const NANO = 1e-9, CM = 0.01;
export const R_MIN = 2, R_MAX = 18;                    // cm: the balls touch at 2 cm
export const Q_MAX = 50;                               // nC
/** Force between charges q1, q2 (nC) at distance r (cm), in newtons (magnitude). */
export const labForce = (q1, q2, r) => Math.abs(coulombForce(q1 * NANO, q2 * NANO, r * CM));
/** +1 repel, −1 attract, 0 none. */
export const labKind = (q1, q2) => Math.sign(q1 * q2);

const POS = "#ff6f91", NEG = "#5cc8ff", NEUTRAL = "#8d86b8", YEL = "#ffe14d";
const dash = (c) => ({ stroke: c, "stroke-width": 1.5, "stroke-dasharray": "4 5" });
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const chargeColor = (q) => (q > 0 ? POS : q < 0 ? NEG : NEUTRAL);

function slider(label, min, max, step, val, show, set) {
  const out = h("output");
  const inp = h("input", { type: "range", min, max, step, value: val, "aria-label": label.replace(/_\{([^}]+)\}/g, "$1") });
  const sync = () => { out.textContent = show(Number(inp.value)); };
  inp.addEventListener("input", () => { set(Number(inp.value)); sync(); });
  sync();
  return [h("label", {}, label, out), inp];
}
function pill(label, on) {
  const b = h("button", { class: "pill", type: "button", "aria-pressed": "false" }, label);
  b.addEventListener("click", () => on(b));
  return b;
}

// ======================================================================================
// 1. The two-charge lab
// ======================================================================================
const SX = 90, PPC = 10, SY = 100, BALL = 10, ARROW_MAX = 60, ARROW_MIN = 2, ARROW_FULL_CM = 3;

export function coulombLab(L, onEvent) {
  let q1 = 30, q2 = -30, r = 6, dragging = false;
  const seen = { kinds: new Set(), lo: Infinity, hi: 0 };

  // ----- scene -----
  const arrow = () => {
    const line = s("path", { stroke: YEL, "stroke-width": 4, "stroke-linecap": "round", fill: "none" });
    const head = s("path", { fill: YEL });
    return { g: s("g", {}, line, head), line, head };
  };
  const a1 = arrow(), a2 = arrow();
  const ruler = s("path", { ...dash("rgba(255,255,255,.45)") });
  const rText = s("text", { fill: "#fff", "font-size": 12, "font-weight": 800, "text-anchor": "middle" });
  const note = s("text", { x: 180, y: 30, fill: "#c4bce8", "font-size": 12, "font-weight": 800, "text-anchor": "middle" });
  const d1 = s("circle", { r: BALL, cx: SX, cy: SY, stroke: "#fff", "stroke-width": 3 });
  const d2 = s("circle", { r: BALL, stroke: "#fff", "stroke-width": 3 });
  const g1 = s("text", { y: SY + 5, "text-anchor": "middle", fill: "#0a0826", "font-size": 16, "font-weight": 900 });
  const g2 = s("text", { y: SY + 5, "text-anchor": "middle", fill: "#0a0826", "font-size": 16, "font-weight": 900 });
  const l1 = s("text", { x: SX, y: 150, "text-anchor": "middle", fill: "#c4bce8", "font-size": 12, "font-weight": 800 });
  const l2 = s("text", { y: 150, "text-anchor": "middle", fill: "#c4bce8", "font-size": 12, "font-weight": 800 });
  const hit = s("circle", { r: 24, cy: SY, fill: "transparent" });
  const handle = s("g", { class: "drag-handle", tabindex: "0", role: "slider", "aria-label": L.drag,
    "aria-valuemin": R_MIN, "aria-valuemax": R_MAX, "aria-valuenow": r }, hit, d2, g2);
  const hint = s("text", { y: 182, "text-anchor": "middle", fill: YEL, "font-size": 11, "font-weight": 800 }, L.drag_short);
  const svg = s("svg", { class: "scene", viewBox: "0 0 360 200", role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: 360, height: 200, fill: "#0a0826" }),
    s("path", { d: `M20 ${SY}H340`, stroke: "rgba(255,255,255,.12)", "stroke-width": 1 }),
    ruler, rText, note, a1.g, a2.g, d1, g1, l1, l2, hint, handle);

  // ----- graph -----
  const GX0 = 40, GX1 = 340, GY0 = 15, GY1 = 125;
  const gx = (rr) => GX0 + ((rr - R_MIN) / (R_MAX - R_MIN)) * (GX1 - GX0);
  const gy = (frac) => GY1 - frac * (GY1 - GY0);
  const curve = s("path", { fill: "none", style: "stroke: var(--a2)", "stroke-width": 3 });
  const dropV = s("path", { ...dash("rgba(255,255,255,.5)") });
  const dropH = s("path", { ...dash("rgba(255,255,255,.5)") });
  const dot = s("circle", { r: 6, fill: YEL, stroke: "#fff", "stroke-width": 2 });
  const gTop = s("text", { x: GX0 + 6, y: 12, fill: "#c4bce8", "font-size": 11, "font-weight": 800 });
  const gNo = s("text", { x: 190, y: 70, "text-anchor": "middle", fill: "#c4bce8", "font-size": 13, "font-weight": 800 });
  const ticks = [2, 6, 10, 14, 18].map((v) => s("text", { x: gx(v), y: 143, "text-anchor": "middle", fill: "#c4bce8", "font-size": 11, "font-weight": 800 }, String(v)));
  const graph = s("svg", { class: "scene", viewBox: "0 0 360 150", role: "img", "aria-label": L.graph, style: "touch-action: pan-y" },
    s("rect", { width: 360, height: 150, fill: "#0a0826" }),
    s("path", { d: `M${GX0} ${GY0}V${GY1}H${GX1}`, fill: "none", stroke: "rgba(255,255,255,.6)", "stroke-width": 2 }),
    ...ticks, s("text", { x: GX1, y: 143, "text-anchor": "end", fill: "#fff", "font-size": 11, "font-weight": 800 }, L.graph_x),
    gTop, curve, dropV, dropH, dot, gNo);

  // ----- controls & readouts -----
  const rVal = h("b"), fVal = h("b"), kVal = h("b"), cVal = h("b");
  const status = h("p", { class: "small", "aria-live": "polite" });
  const formula = h("div", { class: "formula" });
  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:420px;margin:0 auto" }, svg),
      h("div", { class: "scene-box", style: "max-width:420px;margin:10px auto 0" }, graph),
      h("p", { class: "small muted", style: "margin:8px 0 0;text-align:center" }, L.drag_hint)),
    h("div", { class: "controls" },
      ...slider(L.q1, -Q_MAX, Q_MAX, 5, q1, (v) => `${sgn(v)} nC`, (v) => { q1 = v; update(true); }),
      ...slider(L.q2, -Q_MAX, Q_MAX, 5, q2, (v) => `${sgn(v)} nC`, (v) => { q2 = v; update(true); }),
      status,
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.r), rVal),
        h("div", {}, h("span", {}, L.f), fVal),
        h("div", {}, h("span", {}, L.kind), kVal),
        h("div", {}, h("span", {}, L.fr2), cVal)),
      formula));

  const setSvgText = (el, str) => el.replaceChildren(...s("text", {}, str).childNodes);   // x_{sub} markup as tspans

  function setArrow(a, x0, dir, len) {          // from x0 (ball edge) in direction dir (±1)
    const x1 = x0 + dir * len, hd = 9;
    a.line.setAttribute("d", `M${x0} ${SY - 26}H${x1 - dir * 2}`);
    a.head.setAttribute("d", `M${x1} ${SY - 26}L${x1 - dir * hd} ${SY - 26 - 6}V${SY - 26 + 6}Z`);
  }

  function update(user) {
    const x2 = SX + r * PPC, F = labForce(q1, q2, r), kind = labKind(q1, q2);
    d2.setAttribute("cx", x2); hit.setAttribute("cx", x2); g2.setAttribute("x", x2); g1.setAttribute("x", SX);
    d1.setAttribute("style", `fill: ${chargeColor(q1)}`); d2.setAttribute("style", `fill: ${chargeColor(q2)}`);
    g1.textContent = q1 > 0 ? "+" : q1 < 0 ? "−" : ""; g2.textContent = q2 > 0 ? "+" : q2 < 0 ? "−" : "";
    setSvgText(l1, `Q_{1} = ${sgn(q1)} nC`); l2.setAttribute("x", x2); setSvgText(l2, `Q_{2} = ${sgn(q2)} nC`);
    hint.setAttribute("x", x2);
    ruler.setAttribute("d", `M${SX} ${SY + 22}V${SY + 30}M${SX} ${SY + 26}H${x2}M${x2} ${SY + 22}V${SY + 30}`);
    rText.setAttribute("x", (SX + x2) / 2); rText.setAttribute("y", SY + 46); rText.textContent = `r = ${fmt(r, 1)} cm`;
    handle.setAttribute("aria-valuenow", fmt(r, 1));

    // arrows on BOTH charges: equal length, opposite directions (Newton's third law). Length is drawn to scale for the current
    // charges: full length (ARROW_MAX) at ARROW_FULL_CM or closer, then ∝ 1/r², so doubling r quarters it over the whole slider range.
    if (F > 0) {
      const len = clamp(ARROW_MAX * (ARROW_FULL_CM / r) ** 2, ARROW_MIN, ARROW_MAX);
      const toward = kind < 0 ? 1 : -1;            // attract: ball 1 pulled right, ball 2 pulled left
      setArrow(a1, toward > 0 ? SX + BALL + 2 : SX - BALL - 2, toward, len);
      setArrow(a2, toward > 0 ? x2 - BALL - 2 : x2 + BALL + 2, -toward, len);
      a1.g.removeAttribute("display"); a2.g.removeAttribute("display");
      note.textContent = "";
    } else {
      a1.g.setAttribute("display", "none"); a2.g.setAttribute("display", "none");
      note.textContent = L.no_force;
    }

    rVal.textContent = `${fmt(r, 1)} cm`;
    fVal.textContent = F > 0 ? `${sciFmt(F, 3)} N` : "0 N";
    kVal.textContent = kind < 0 ? L.attract : kind > 0 ? L.repel : L.none;
    cVal.textContent = F > 0 ? `${sciFmt(F * (r * CM) ** 2, 3)} N m²` : "0 N m²";
    formula.replaceChildren(richInline(F > 0
      ? `F = k·Q_{1}·Q_{2}/r² = (${sciFmt(K_COULOMB, 3)}) × (${sciFmt(Math.abs(q1 * NANO * q2 * NANO), 2)}) / (${sciFmt((r * CM) ** 2, 2)}) = ${sciFmt(F, 3)} N`
      : "F = 0"));
    status.textContent = F > 0 ? (kind < 0 ? L.status_attract : L.status_repel) : L.status_none;

    // graph: F/F(2 cm) = (2/r)², same shape for every pair of charges
    if (F > 0) {
      const pts = [];
      for (let rr = R_MIN; rr <= R_MAX + 1e-9; rr += 0.25) pts.push(`${gx(rr).toFixed(1)} ${gy((R_MIN / rr) ** 2).toFixed(1)}`);
      curve.setAttribute("d", `M${pts.join("L")}`);
      const fx = gx(r), fy = gy((R_MIN / r) ** 2);
      dot.setAttribute("cx", fx); dot.setAttribute("cy", fy);
      dropV.setAttribute("d", `M${fx} ${fy}V${GY1}`); dropH.setAttribute("d", `M${fx} ${fy}H${GX0}`);
      gTop.textContent = `${L.graph_y} (${L.graph_at} 2 cm: ${sciFmt(labForce(q1, q2, R_MIN), 2)} N)`;
      gNo.textContent = "";
    } else {
      curve.setAttribute("d", `M${GX0} ${GY1}H${GX1}`);
      dot.setAttribute("cx", gx(r)); dot.setAttribute("cy", GY1);
      dropV.setAttribute("d", ""); dropH.setAttribute("d", "");
      gTop.textContent = L.graph_y; gNo.textContent = L.no_force;
    }

    // crystals: tally what the player has seen (only after real interaction)
    if (F > 0) {
      seen.kinds.add(kind); seen.lo = Math.min(seen.lo, r); seen.hi = Math.max(seen.hi, r);
      if (user) {
        if (seen.kinds.size === 2) onEvent?.("signs", fVal);
        if (seen.hi / seen.lo >= 2) onEvent?.("lab", fVal);
      }
    }
  }

  function setR(v, user) { r = clamp(Math.round(v * 10) / 10, R_MIN, R_MAX); update(user); }

  // ----- dragging (gesture lock on the right-hand charge only) -----
  const toSvg = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  handle.addEventListener("pointerdown", (e) => {
    dragging = true; e.preventDefault();
    try { handle.setPointerCapture(e.pointerId); } catch { /* capture is a nicety; the flag still works */ }
  });
  handle.addEventListener("pointermove", (e) => { if (dragging) setR((toSvg(e).x - SX) / PPC, true); });
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) handle.addEventListener(ev, () => { dragging = false; });
  handle.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 }[e.key];
    if (step) { e.preventDefault(); setR(r + step, true); }
    else if (e.key === "Home") { e.preventDefault(); setR(R_MIN, true); }
    else if (e.key === "End") { e.preventDefault(); setR(R_MAX, true); }
  });

  update(false);
  return root;
}

// ======================================================================================
// 2. Electric vs gravity: same distance, wildly different forces, and a ratio that never changes
// ======================================================================================
export const PAIRS = [
  { key: "pe", q1: E_CHARGE, q2: -E_CHARGE, m1: M_PROTON, m2: M_ELECTRON },
  { key: "pp", q1: E_CHARGE, q2: E_CHARGE, m1: M_PROTON, m2: M_PROTON },
  { key: "ee", q1: -E_CHARGE, q2: -E_CHARGE, m1: M_ELECTRON, m2: M_ELECTRON },
];
/** F_electric / F_gravity for a pair at distance r (m): independent of r. */
export const forceRatio = (p, r) => Math.abs(coulombForce(p.q1, p.q2, r)) / gravForce(p.m1, p.m2, r);
export { GRAV_CONST };

const LOG_LO = -55, LOG_HI = -5;                       // N, powers of ten on the bar axis
const PM = 1e-12;

export function gravityLab(L, onEvent) {
  let pair = PAIRS[0], rpm = 100;
  const moved = new Set([rpm]);

  const barE = s("rect", { x: 20, y: 38, height: 26, rx: 5, fill: YEL });
  const barG = s("rect", { x: 20, y: 108, height: 26, rx: 5, style: "fill: var(--a2)" });
  const tE = s("text", { x: 20, y: 30, fill: "#fff", "font-size": 13, "font-weight": 800 }, L.f_elec);
  const tG = s("text", { x: 20, y: 100, fill: "#fff", "font-size": 13, "font-weight": 800 }, L.f_grav);
  const axis = [-50, -40, -30, -20, -10].map((p) => {
    const x = 20 + ((p - LOG_LO) / (LOG_HI - LOG_LO)) * 320;
    return [s("path", { d: `M${x} 148V154`, stroke: "rgba(255,255,255,.6)", "stroke-width": 1.5 }),
      s("text", { x, y: 168, "text-anchor": "middle", fill: "#c4bce8", "font-size": 11, "font-weight": 800 }, `10${SUP["-"]}${String(-p).split("").map((c) => SUP[c]).join("")}`)];
  });
  const svg = s("svg", { class: "scene", viewBox: "0 0 360 180", role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: 360, height: 180, fill: "#0a0826" }),
    s("path", { d: "M20 150H340", stroke: "rgba(255,255,255,.4)", "stroke-width": 2 }),
    tE, tG, barE, barG, ...axis.flat(),
    s("text", { x: 340, y: 12, "text-anchor": "end", fill: "#c4bce8", "font-size": 11, "font-weight": 800 }, L.axis_note));

  const eVal = h("b"), gVal = h("b"), rVal = h("b"), kVal = h("b");
  const formula = h("div", { class: "formula" });
  const pills = PAIRS.map((p) => {
    const b = pill(L.pairs[p.key], () => { pair = p; sync(); update(true); });
    b.dataset.key = p.key;
    return b;
  });
  const sync = () => pills.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.key === pair.key)));
  sync();
  const root = h("div", { class: "lab" },
    h("div", { class: "scene-box", style: "max-width:420px;margin:0 auto" }, svg),
    h("div", { class: "controls" },
      h("label", {}, L.pair), h("div", { class: "toggle-row", style: "margin-top:4px" }, pills),
      ...slider(L.dist, 10, 1000, 10, rpm, (v) => `${v} pm`, (v) => { rpm = v; moved.add(v); update(true); }),
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.f_elec), eVal),
        h("div", {}, h("span", {}, L.f_grav), gVal),
        h("div", {}, h("span", {}, L.ratio), rVal),
        h("div", {}, h("span", {}, L.kind), kVal)),
      formula));

  const barLen = (F) => 320 * clamp((Math.log10(F) - LOG_LO) / (LOG_HI - LOG_LO), 0.01, 1);

  function update(user) {
    const r = rpm * PM;
    const Fe = Math.abs(coulombForce(pair.q1, pair.q2, r)), Fg = gravForce(pair.m1, pair.m2, r), ratio = Fe / Fg;
    barE.setAttribute("width", barLen(Fe).toFixed(1)); barG.setAttribute("width", barLen(Fg).toFixed(1));
    eVal.textContent = `${sciFmt(Fe, 3)} N`; gVal.textContent = `${sciFmt(Fg, 3)} N`; rVal.textContent = sciFmt(ratio, 3);
    kVal.textContent = pair.q1 * pair.q2 < 0 ? L.attract : L.repel;
    formula.replaceChildren(richInline(`F_{e} / F_{G} = (k·e²/r²) / (G·m_{1}·m_{2}/r²) = k·e² / (G·m_{1}·m_{2}) = ${sciFmt(ratio, 3)}`));
    if (user && moved.size >= 2) onEvent?.("gravity", rVal);
  }
  update(false);
  return root;
}
