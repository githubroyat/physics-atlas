// Chapter o6: static figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
import { s } from "../dom.js";

const BG = "#0a0826";
const TXT = "fill:#fff;font:700 14px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const YEL = "#ffe14d";
const arrow = (x1, y1, x2, y2, style) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9, W = 0.45;
  const p = (da) => `${(x2 - L * Math.cos(a + da)).toFixed(1)} ${(y2 - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${x1} ${y1}L${x2} ${y2}M${p(W)}L${x2} ${y2}L${p(-W)}`, style: `fill:none;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;${style}` });
};

/** The four quarter-stages of one LC cycle: circuit on top, spring twin below.
 *  Stage k (t = 0, T/4, T/2, 3T/4): Q = Q0·cos(2πt/T) so the top plate is + (k=0), empty (1), − (2), empty (3).
 *  I ∝ −dQ/dt: zero (0), clockwise-largest (1: charge leaves the + top plate, through the top wire to the coil), zero (2), anticlockwise-largest (3).
 *  Spring twin: y ↔ Q (right = +), v ↔ I: block at +A (0), middle moving left (1), −A (2), middle moving right (3). */
export const STAGES = [
  { q: 1, i: 0 },   // capacitor full (top +), no current
  { q: 0, i: 1 },   // empty, current clockwise (largest)
  { q: -1, i: 0 },  // full the other way round
  { q: 0, i: -1 },  // empty, current anticlockwise (largest)
];
export function stagesFig(L) {
  const CW = 280, CH = 205, W = CW * 2, H = CH * 2;
  const cells = STAGES.map((st, k) => {
    const ox = (k % 2) * CW, oy = Math.floor(k / 2) * CH;
    const g = [];
    const line = (d, c = "rgba(255,255,255,.75)", w = 2.2) => s("path", { d, style: `fill:none;stroke:${c};stroke-width:${w};stroke-linecap:round;stroke-linejoin:round` });
    // title and the one-line state
    g.push(s("text", { x: 14, y: 22, style: `fill:${YEL};font:700 16px var(--font-body)` }, L.stage[k].t));
    // circuit: wire loop x 50..230, y 42..104; capacitor gap in left wire; coil on the right wire
    const x0 = 50, x1 = 230, y0 = 42, y1 = 108, gy = 66, gh = 80;   // capacitor plates at y = 66 and 80
    g.push(line(`M${x0} ${gy}V${y0}H${x1}V${y0 + 4}`));
    g.push(line(`M${x0} ${gh}V${y1}H${x1}V${y1 - 4}`));
    // coil: four loops down the right wire
    let coil = `M${x1} ${y0 + 4}`;
    for (let n = 0; n < 4; n++) coil += `a9 7.5 0 0 1 0 15`;
    g.push(line(coil, "var(--a2)", 2.6));
    // plates
    g.push(line(`M${x0 - 17} ${gy}H${x0 + 17}`, "var(--a1)", 4), line(`M${x0 - 17} ${gh}H${x0 + 17}`, "var(--a1)", 4));
    if (st.q !== 0) {
      g.push(s("text", { x: x0 + 24, y: gy - 3, style: TXT }, st.q > 0 ? "+" : "−"));
      g.push(s("text", { x: x0 + 24, y: gh + 15, style: TXT }, st.q > 0 ? "−" : "+"));
    }
    // current arrow on the top wire
    if (st.i !== 0) {
      const xa = 100, xb = 180, a = st.i > 0 ? [xa, xb] : [xb, xa];
      g.push(arrow(a[0], y0 - 9, a[1], y0 - 9, `stroke:${YEL}`));
      g.push(s("text", { x: 140, y: y0 - 17, "text-anchor": "middle", style: `fill:${YEL};font:700 14px var(--font-body);paint-order:stroke;stroke:${BG};stroke-width:3px` }, "I"));
    }
    // spring twin: wall at x = 40, rest position of the block centre 150, amplitude 80
    const sy = 150, bw = 28, bx = 150 + st.q * 80;
    g.push(line(`M40 ${sy - 20}V${sy + 20}`, "rgba(255,255,255,.55)", 4));
    const left = bx - bw / 2, n = 9;
    let sp = `M40 ${sy}`;
    for (let j = 1; j < n; j++) sp += `L${(40 + ((left - 40) * j) / n).toFixed(1)} ${sy + (j % 2 ? -9 : 9)}`;
    sp += `L${left.toFixed(1)} ${sy}`;
    g.push(line(sp, "var(--a1)", 2.4));
    g.push(s("rect", { x: left, y: sy - 14, width: bw, height: 28, rx: 3, style: `fill:${YEL}` }));
    g.push(line(`M150 ${sy + 22}V${sy + 30}`, "rgba(255,255,255,.45)", 1.5));       // rest-position tick
    if (st.i !== 0) {
      const dir = st.i > 0 ? -1 : 1;     // current clockwise <-> charge on the top plate falling <-> mass moving towards the middle from +y: left
      g.push(arrow(bx, sy - 24, bx + dir * 40, sy - 24, `stroke:${YEL}`));
    }
    g.push(s("text", { x: 14, y: CH - 12, style: TXT }, L.stage[k].l));
    return s("g", { transform: `translate(${ox} ${oy})` }, ...g);
  });
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("path", { d: `M${CW} 8V${H - 8}M8 ${CH}H${W - 8}`, style: "fill:none;stroke:rgba(255,255,255,.18);stroke-width:1;stroke-dasharray:4 5" }),
    ...cells);
}

/** Damping: the capacitor voltage after the switch closes (starting full). Light damping: U = e^(−t/τ)·cos(2π·t/T) with τ = 2.5·T.
 *  Heavy damping: no ringing, U just drains away: U = e^(−t/(0.5·T)). Shown for t = 0 … 4·T. */
export function dampFig(L) {
  const W = 560, H = 270, x0 = 56, x1 = 538, yMid = 140, yAmp = 90, nT = 4;
  const X = (t) => x0 + (t / nT) * (x1 - x0), Y = (u) => yMid - u * yAmp;
  const path = (fn) => { let d = ""; for (let i = 0; i <= 320; i++) { const t = (nT * i) / 320; d += `${i ? "L" : "M"}${X(t).toFixed(1)} ${Y(fn(t)).toFixed(1)}`; } return d; };
  const tau = 2.5;
  const light = (t) => Math.exp(-t / tau) * Math.cos(2 * Math.PI * t), heavy = (t) => Math.exp(-t / 0.5), env = (t) => Math.exp(-t / tau);
  const ticks = [1, 2, 3, 4].map((k) => s("text", { x: X(k), y: yMid + 18, "text-anchor": "middle", style: "fill:rgba(255,255,255,.75);font:700 12px var(--font-body)" }, `${k}T`));
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    arrow(x0, yMid, x1 + 6, yMid, "stroke:rgba(255,255,255,.55)"), arrow(x0, yMid + 100, x0, 30, "stroke:rgba(255,255,255,.55)"),
    s("path", { d: path(env) + path((t) => -env(t)), style: "fill:none;stroke:var(--a1);stroke-width:1.2;stroke-dasharray:4 5;opacity:.75" }),
    s("path", { d: path(light), style: "fill:none;stroke:var(--a1);stroke-width:3;stroke-linejoin:round" }),
    s("path", { d: path(heavy), style: "fill:none;stroke:var(--a2);stroke-width:3;stroke-linejoin:round" }),
    ...ticks,
    s("text", { x: x0 + 8, y: 30, style: TXT }, L.axis_y),
    s("text", { x: x1, y: H - 12, "text-anchor": "end", style: TXT }, L.axis_x),
    s("text", { x: x1 - 6, y: 40, "text-anchor": "end", style: "fill:var(--a1);font:700 14px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px" }, L.light),
    s("text", { x: x1 - 6, y: 62, "text-anchor": "end", style: "fill:var(--a2);font:700 14px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px" }, L.heavy));
}
