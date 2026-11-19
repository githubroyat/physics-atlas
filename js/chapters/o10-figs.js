// Chapter o10: static figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
import { s } from "../dom.js";
import { DEG } from "../physics.js";

const BG = "#0a0826";
const TXT = "fill:#fff;font:700 13px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const YEL = "fill:#ffe14d;font:700 14px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const DIM = "fill:rgba(255,255,255,.85);font:700 13px var(--font-body)";
const arrowHead = (x2, y2, a, style) => {
  const L = 10, W = 0.45;
  const p = (da) => `${(x2 - L * Math.cos(a + da)).toFixed(1)} ${(y2 - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${p(W)}L${x2.toFixed(1)} ${y2.toFixed(1)}L${p(-W)}`, style: `fill:none;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;${style}` });
};
/** A ray from (x1,y1) to (x2,y2) with an arrowhead near the middle, showing the direction of travel. */
const ray = (x1, y1, x2, y2, style, w = 3) => {
  const a = Math.atan2(y2 - y1, x2 - x1), mx = (x1 + x2) / 2 + 6 * Math.cos(a), my = (y1 + y2) / 2 + 6 * Math.sin(a);
  return [s("path", { d: `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`, style: `fill:none;stroke-width:${w};stroke-linecap:round;${style}` }), arrowHead(mx, my, a, style)];
};
const dashed = "stroke:rgba(255,255,255,.7);stroke-width:1.4;stroke-dasharray:5 5;fill:none";
/** Arc of radius r around (cx,cy) from angle `from` to angle `to`, both measured from straight up (positive = clockwise on screen). */
const arc = (cx, cy, r, from, to, style) => {
  const P = (a) => `${(cx + r * Math.sin(a * DEG)).toFixed(1)} ${(cy - r * Math.cos(a * DEG)).toFixed(1)}`;
  return s("path", { d: `M${P(from)}A${r} ${r} 0 0 ${to > from ? 1 : 0} ${P(to)}`, style: `fill:none;stroke-width:2;${style}` });
};

/** Figure 1: one ray meeting a flat boundary (medium 1 above, medium 2 below, normal vertical). Incident angle a1, refracted angle a2 (both from
 *  the normal); the reflected ray leaves at a1 as well. Sized for a2 up to about 60°; the chapter uses air to glass at 40°. */
export function raysFig(L, { a1, a2 }) {
  const W = 560, H = 340, cx = 280, cy = 170, len = 135;
  const at = (a, r, up, side) => [cx + side * r * Math.sin(a * DEG), cy + (up ? -1 : 1) * r * Math.cos(a * DEG)];
  const [ix, iy] = at(a1, len, true, -1), [rx, ry] = at(a1, len, true, 1), [tx, ty] = at(a2, len, false, 1);
  const [l1x, l1y] = at(a1 / 2, 72, true, -1), [lrx, lry] = at(a1 / 2, 72, true, 1), [l2x, l2y] = at(a2 / 2, 96, false, 1);
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("rect", { x: 0, y: cy, width: W, height: H - cy, style: "fill:var(--a1);opacity:.16" }),
    s("path", { d: `M0 ${cy}H${W}`, style: "fill:none;stroke:#fff;stroke-width:2.5" }),
    s("path", { d: `M${cx} 22V${H - 22}`, style: dashed }),
    ...ray(ix, iy, cx, cy, "stroke:#ffe14d"), ...ray(cx, cy, rx, ry, "stroke:var(--a2);opacity:.85"), ...ray(cx, cy, tx, ty, "stroke:var(--a2)"),
    arc(cx, cy, 46, 0, -a1, "stroke:#ffe14d"), arc(cx, cy, 46, 0, a1, "stroke:var(--a2)"), arc(cx, cy, 46, 180, 180 - a2, "stroke:var(--a2)"),
    s("text", { x: l1x - 2, y: l1y + 2, "text-anchor": "end", style: YEL }, L.a1),
    s("text", { x: lrx + 2, y: lry + 2, style: TXT }, L.ar),
    s("text", { x: l2x, y: l2y + 4, "text-anchor": "middle", style: TXT }, L.a2),
    s("text", { x: ix - 4, y: iy - 8, "text-anchor": "middle", style: YEL }, L.incident),
    s("text", { x: rx + 4, y: ry - 8, "text-anchor": "middle", style: TXT }, L.reflected),
    s("text", { x: tx + 8, y: ty + 4, style: TXT }, L.refracted),
    s("text", { x: cx + 8, y: 36, style: DIM }, L.normal),
    s("text", { x: 14, y: cy - 10, style: TXT }, L.top), s("text", { x: 14, y: cy + 24, style: TXT }, L.bottom));
}

/** Figure 2: a ray zig-zagging along an optical fibre. The ray hits each wall at angle `alpha` from the wall's normal (the normal is vertical),
 *  so it runs at 90° − alpha to the axis. The angle is marked at the bottom bounce. */
export function fibreFig(L, { alpha }) {
  const W = 560, H = 230, yT = 103, yB = 147, mid = (yT + yB) / 2, hgt = yB - yT, t = Math.tan(alpha * DEG);
  const x1 = 18 + (hgt / 2) * t, x2 = x1 + hgt * t, xEnd = 542, yEnd = yB - (xEnd - x2) / t;   // start mid-core, hit the top wall, hit the bottom wall, run on
  const segs = [...ray(18, mid, x1, yT, "stroke:#ffe14d", 2.6), ...ray(x1, yT, x2, yB, "stroke:#ffe14d", 2.6), ...ray(x2, yB, xEnd, yEnd, "stroke:#ffe14d", 2.6)];
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("rect", { x: 0, y: yT - 36, width: W, height: 36, style: "fill:var(--a2);opacity:.16" }), s("rect", { x: 0, y: yB, width: W, height: 36, style: "fill:var(--a2);opacity:.16" }),
    s("rect", { x: 0, y: yT, width: W, height: hgt, style: "fill:var(--a1);opacity:.2" }),
    s("path", { d: `M0 ${yT}H${W}M0 ${yB}H${W}`, style: "fill:none;stroke:#fff;stroke-width:1.6;opacity:.8" }),
    s("path", { d: `M${x2} ${yB + 30}V${yB - 40}`, style: dashed }),
    ...segs,
    arc(x2, yB, 34, 0, -alpha, "stroke:#ffe14d"), arc(x2, yB, 34, 0, alpha, "stroke:var(--a2)"),
    s("text", { x: x2 - 22, y: yB - 28, "text-anchor": "end", style: YEL }, L.a),
    s("text", { x: x2 + 22, y: yB - 28, style: TXT }, L.ar),
    s("text", { x: x2 + 8, y: yB + 26, style: DIM }, L.normal),
    s("text", { x: 14, y: yT - 12, style: TXT }, L.clad), s("text", { x: 14, y: yB + 26, style: TXT }, L.clad),
    s("text", { x: 22, y: yB - 6, style: TXT }, L.core),
    s("text", { x: W / 2, y: 36, "text-anchor": "middle", style: YEL }, L.trapped));
}
