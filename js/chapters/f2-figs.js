// Chapter f2: static figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
import { s } from "../dom.js";

const BG = "#0a0826";
const TXT = "fill:#fff;font:700 13px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const YEL = "fill:#ffe14d;font:700 13px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const arrow = (x1, y1, x2, y2, style) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9, W = 0.45;
  const p = (da) => `${(x2 - L * Math.cos(a + da)).toFixed(1)} ${(y2 - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${x1} ${y1}L${x2} ${y2}M${p(W)}L${x2} ${y2}L${p(-W)}`, style: `fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;${style}` });
};

/** Figure 1: the two field models side by side. Left: radial field of a + point charge (12 spokes, arrows pointing away).
 *  Right: uniform field between a + plate (top) and a − plate (bottom): parallel, equally spaced lines from + to −,
 *  with weaker, bulging lines at the edges (dashed). Field lines run from + to −. */
export function fieldFig(L) {
  const W = 560, H = 330, spokes = 12, cx = 135, cy = 175, r0 = 16, r1 = 100;
  const radial = [];
  for (let k = 0; k < spokes; k++) {
    const a = (2 * Math.PI * k) / spokes;
    radial.push(arrow(cx + r0 * Math.cos(a), cy + r0 * Math.sin(a), cx + r1 * Math.cos(a), cy + r1 * Math.sin(a), "stroke:#ffe14d"));
  }
  const xl = 330, xr = 520, yT = 105, yB = 245, lines = [];
  for (let x = xl + 25; x <= xr - 25; x += 28) lines.push(arrow(x, yT + 6, x, yB - 6, "stroke:#ffe14d"));
  const edge = (x, dir) => s("path", { d: `M${x} ${yT + 4}Q${x + dir * 38} ${(yT + yB) / 2} ${x} ${yB - 4}`, style: "fill:none;stroke:#ffe14d;stroke-width:1.6;stroke-dasharray:5 4;opacity:.7" });
  const plate = (y, c) => s("rect", { x: xl - 8, y: y - 5, width: xr - xl + 16, height: 10, rx: 3, style: `fill:${c}` });
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("text", { x: cx, y: 28, "text-anchor": "middle", style: TXT }, L.radial),
    s("text", { x: (xl + xr) / 2, y: 28, "text-anchor": "middle", style: TXT }, L.uniform),
    s("path", { d: "M280 44V300", style: "fill:none;stroke:rgba(255,255,255,.2);stroke-width:1;stroke-dasharray:4 5" }),
    ...radial,
    s("circle", { cx, cy, r: 13, style: "fill:var(--a2)" }),
    s("text", { x: cx, y: cy + 5, "text-anchor": "middle", style: "fill:#0a0826;font:800 17px var(--font-body)" }, L.plus),
    s("text", { x: cx, y: 306, "text-anchor": "middle", style: YEL }, L.radial_note),
    plate(yT, "var(--a2)"), plate(yB, "var(--a1)"), ...lines, edge(xl, -1), edge(xr, 1),
    s("text", { x: xl - 22, y: yT + 5, "text-anchor": "end", style: TXT }, L.plus),
    s("text", { x: xl - 22, y: yB + 5, "text-anchor": "end", style: TXT }, L.minus),
    s("text", { x: (xl + xr) / 2, y: yB + 26, "text-anchor": "middle", style: YEL }, L.uniform_note),
    s("text", { x: (xl + xr) / 2, y: yT - 14, "text-anchor": "middle", style: "fill:#fff;font:600 12px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px" }, L.edge));
}

/** Figure 2: the Q–U graph of a capacitor: a straight line through the origin (Q = C·U, so the slope is C).
 *  The area under it up to U is the triangle ½·Q·U = the stored energy W; the full rectangle Q·U (dashed) would be too much. */
export function qufig(L) {
  const W = 560, H = 320, x0 = 90, x1 = 480, yB = 255, yT = 55;
  const tri = `M${x0} ${yB}L${x1} ${yT}L${x1} ${yB}Z`;
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("path", { d: `M${x0} ${yT}H${x1}V${yB}`, style: "fill:none;stroke:rgba(255,255,255,.55);stroke-width:1.4;stroke-dasharray:5 5" }),
    s("path", { d: tri, style: "fill:var(--a1);opacity:.55" }),
    s("path", { d: `M${x0} ${yB}L${x1} ${yT}`, style: "fill:none;stroke:#ffe14d;stroke-width:3;stroke-linecap:round" }),
    arrow(x0, yB, x1 + 50, yB, "stroke:rgba(255,255,255,.7)"), arrow(x0, yB, x0, yT - 32, "stroke:rgba(255,255,255,.7)"),
    s("path", { d: `M${x1} ${yB - 4}V${yB + 5}M${x0 - 4} ${yT}H${x0 + 4}`, style: "fill:none;stroke:#fff;stroke-width:2" }),
    s("text", { x: x1, y: yB + 24, "text-anchor": "middle", style: YEL }, L.tickU),
    s("text", { x: x0 - 10, y: yT + 5, "text-anchor": "end", style: YEL }, L.tickQ),
    s("text", { x: x1 + 50, y: yB + 24, "text-anchor": "end", style: TXT }, L.axis_u),
    s("text", { x: x0 - 8, y: yT - 38, style: TXT }, L.axis_q),
    s("text", { x: x1 - 12, y: yB - 20, "text-anchor": "end", style: "fill:#fff;font:800 15px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px" }, L.area),
    s("text", { x: x0 + 14, y: yT + 24, style: "fill:#fff;font:600 12px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px" }, L.too_much),
    s("text", { x: (x0 + x1) / 2 - 12, y: (yT + yB) / 2 - 22, "text-anchor": "end", style: "fill:#ffe14d;font:700 12px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px" }, L.line));
}
