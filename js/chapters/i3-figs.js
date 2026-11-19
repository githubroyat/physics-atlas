// Chapter i3: static figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
import { s } from "../dom.js";

const BG = "#0a0826";
const VC = "#ffe14d", AC = "#7de0ff", WC = "#ff8fd0";   // velocity (yellow) and acceleration (blue) as in the lab; weight pink
const TXT = (c) => `fill:${c};font:700 14px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px`;
const arrow = (x1, y1, x2, y2, c, w = 3, dash) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 10, W = 0.45;
  const p = (da) => `${(x2 - L * Math.cos(a + da)).toFixed(1)} ${(y2 - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}M${p(W)}L${x2.toFixed(1)} ${y2.toFixed(1)}L${p(-W)}`,
    style: `fill:none;stroke:${c};stroke-width:${w};stroke-linecap:round;stroke-linejoin:round${dash ? ";stroke-dasharray:5 5" : ""}` });
};

/** Figure 1: top view of uniform circular motion (anticlockwise). At each point the velocity (yellow, tangent) has the SAME length;
 *  the acceleration (blue) points to the centre, also the same length. */
export function circleFig(L) {
  const W = 560, H = 360, cx = 280, cy = 180, R = 105, vl = 62, al = 48;
  const parts = [];
  [0, 90, 180, 270].forEach((deg, i) => {
    const t = (deg * Math.PI) / 180, x = cx + R * Math.cos(t), y = cy - R * Math.sin(t);
    const tx = -Math.sin(t), ty = -Math.cos(t);                     // anticlockwise tangent (screen y points down)
    const nx = -Math.cos(t), ny = Math.sin(t);                      // towards the centre
    parts.push(arrow(x, y, x + tx * vl, y + ty * vl, VC), arrow(x, y, x + nx * al, y + ny * al, AC), s("circle", { cx: x, cy: y, r: 7, style: "fill:#fff" }));
    if (i === 0) parts.push(s("text", { x: x + 14, y: y - vl + 10, style: TXT(VC) }, L.v), s("text", { x: x - al / 2, y: y - 10, "text-anchor": "middle", style: TXT(AC) }, L.a));
  });
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("circle", { cx, cy, r: R, style: "fill:none;stroke:rgba(255,255,255,.35);stroke-width:1.5;stroke-dasharray:5 5" }),
    s("circle", { cx, cy, r: 4, style: "fill:#fff" }),
    s("text", { x: cx + 8, y: cy + 20, style: TXT("#fff") }, L.centre),
    ...parts);
}

/** Figure 2: side view of a car on a banked curve (the centre of the curve is to the LEFT, the outer edge of the road is higher).
 *  N is perpendicular to the road, so it leans towards the centre; its horizontal part N·sinθ is the centripetal force,
 *  its vertical part N·cosθ balances the weight (frictionless design speed). N = m·g/cosθ, so N is a little longer than m·g. */
export function bankFig(L, thetaDeg = 20) {
  const W = 560, H = 320, th = (thetaDeg * Math.PI) / 180, px = 300, py = 175, tn = Math.tan(th);
  const yRoad = (x) => py + (px - x) * tn;
  const [cx, cy] = [px - 17 * Math.sin(th), py - 17 * Math.cos(th)];
  const Nlen = 96, wlen = Nlen * Math.cos(th), nxl = Nlen * Math.sin(th);
  const x0 = 40, x1 = 540, yb = H - 20;
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("path", { d: `M${x0} ${yRoad(x0)}L${x1} ${yRoad(x1)}L${x1} ${yb}L${x0} ${yb}Z`, style: "fill:rgba(255,255,255,.1);stroke:#fff;stroke-width:2.5;stroke-linejoin:round" }),
    s("path", { d: `M${x0} ${yRoad(x0)}H${x0 + 150}`, style: "fill:none;stroke:rgba(255,255,255,.5);stroke-width:1.2;stroke-dasharray:4 5" }),
    s("path", { d: `M${x0 + 80} ${yRoad(x0)}A80 80 0 0 0 ${(x0 + 80 * Math.cos(th)).toFixed(1)} ${(yRoad(x0) - 80 * Math.sin(th)).toFixed(1)}`, style: "fill:none;stroke:#fff;stroke-width:1.5" }),
    s("text", { x: x0 + 92, y: yRoad(x0) - 5, style: TXT("#fff") }, L.theta),
    s("g", { transform: `translate(${px} ${py}) rotate(${-thetaDeg})` },
      s("rect", { x: -38, y: -34, width: 76, height: 28, rx: 6, style: "fill:#3b2f8f;stroke:#fff;stroke-width:2" }),
      s("circle", { cx: -22, cy: -6, r: 6, style: "fill:#fff" }), s("circle", { cx: 22, cy: -6, r: 6, style: "fill:#fff" })),
    s("path", { d: `M${cx - nxl - 12} ${cy}H70`, style: "fill:none;stroke:rgba(255,255,255,.45);stroke-width:1.2;stroke-dasharray:3 6" }),
    s("text", { x: 70, y: cy - 8, style: TXT("#fff") }, L.centre),
    arrow(cx, cy, cx, cy + wlen, WC), s("text", { x: cx + 10, y: cy + wlen - 2, style: TXT(WC) }, L.w),
    arrow(cx, cy, cx - Nlen * Math.sin(th), cy - Nlen * Math.cos(th), AC), s("text", { x: cx - Nlen * Math.sin(th) + 12, y: cy - Nlen * Math.cos(th) + 4, style: TXT(AC) }, L.N),
    arrow(cx, cy, cx - nxl, cy, VC, 3.5), s("text", { x: cx - nxl - 6, y: cy + 22, "text-anchor": "end", style: TXT(VC) }, L.nx));
}
