// Chapter i2: static figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
import { s } from "../dom.js";
import { G } from "../physics.js";

const BG = "#0a0826";
const TXT = "fill:#fff;font:700 13px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const arrow = (x1, y1, x2, y2, style, w = 2) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9, W = 0.45;
  const p = (da) => `${(x2 - L * Math.cos(a + da)).toFixed(1)} ${(y2 - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}M${p(W)}L${x2.toFixed(1)} ${y2.toFixed(1)}L${p(-W)}`, style: `fill:none;stroke-width:${w};stroke-linecap:round;stroke-linejoin:round;${style}` });
};
const A1 = "stroke:var(--a1)", A2 = "stroke:var(--a2)", WHITE = "stroke:#fff", YEL = "stroke:#ffe14d";

/** Figure 1: a ground launch (speed v, angle deg) with the velocity components drawn at launch, top and landing.
 *  Same scale on both axes. Arrow length = speed × K px per m/s. v_x is the same at all three; v_y is +v·sin θ, 0, −v·sin θ. */
export const COMP_FIG = { v: 20, deg: 50 };
export function compFig(L, { v, deg } = COMP_FIG) {
  const W = 560, H = 300, x0 = 60, gy = 190, SX = 9.5, K = 5.5;
  const th = (deg * Math.PI) / 180, vx = v * Math.cos(th), vy = v * Math.sin(th);
  const T = (2 * vy) / G, R = vx * T, Hm = (vy * vy) / (2 * G);
  const px = (x) => x0 + x * SX, py = (y) => gy - y * SX;
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const t = (T * i) / 60;
    pts.push(`${i ? "L" : "M"}${px(vx * t).toFixed(1)} ${py(vy * t - 0.5 * G * t * t).toFixed(1)}`);
  }
  const bx = [px(0), px(R / 2), px(R)], by = [py(0), py(Hm), py(0)];
  const ax = vx * K, ay = vy * K;
  const ball = (i) => s("circle", { cx: bx[i], cy: by[i], r: 5.5, style: "fill:#ffe14d" });
  const dash = (x1, y1, x2, y2) => s("path", { d: `M${x1} ${y1}L${x2} ${y2}`, style: "fill:none;stroke:rgba(255,255,255,.55);stroke-width:1.2;stroke-dasharray:3 4" });
  const label = (x, y, txt, anchor, style = TXT) => s("text", { x, y, "text-anchor": anchor || "start", style }, txt);
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("path", { d: `M20 ${gy}H${W - 20}`, style: "fill:none;stroke:rgba(255,255,255,.3);stroke-width:1.5" }),
    s("path", { d: pts.join(""), style: "fill:none;stroke:#ffe14d;stroke-width:2.4;stroke-dasharray:6 5;stroke-linecap:round;opacity:.85" }),
    // launch: v_x, v_y, and the resultant v
    dash(bx[0] + ax, by[0], bx[0] + ax, by[0] - ay), dash(bx[0], by[0] - ay, bx[0] + ax, by[0] - ay),
    arrow(bx[0], by[0], bx[0] + ax, by[0], A1, 3), arrow(bx[0], by[0], bx[0], by[0] - ay, A2, 3), arrow(bx[0], by[0], bx[0] + ax, by[0] - ay, WHITE, 2),
    // top: only v_x
    arrow(bx[1], by[1], bx[1] + ax, by[1], A1, 3),
    // landing: v_x and v_y (down), resultant
    dash(bx[2] + ax, by[2], bx[2] + ax, by[2] + ay), dash(bx[2], by[2] + ay, bx[2] + ax, by[2] + ay),
    arrow(bx[2], by[2], bx[2] + ax, by[2], A1, 3), arrow(bx[2], by[2], bx[2], by[2] + ay, A2, 3), arrow(bx[2], by[2], bx[2] + ax, by[2] + ay, WHITE, 2),
    ball(0), ball(1), ball(2),
    label(bx[0] + ax / 2, by[0] + 20, L.vx, "middle", "fill:#fff;font:700 14px var(--font-body)"),
    label(bx[0] - 9, by[0] - ay / 2 + 5, L.vy, "end", "fill:#fff;font:700 14px var(--font-body)"),
    label(bx[0] + ax + 6, by[0] - ay + 4, L.v),
    label(bx[0] + 4, by[0] + 40, L.start, "start", "fill:#ffe14d;font:700 13px var(--font-body)"),
    label(bx[1] + ax / 2, by[1] - 12, L.vx, "middle", "fill:#fff;font:700 14px var(--font-body)"),
    label(bx[1], by[1] + 24, L.top, "middle"),
    label(bx[1], by[1] - 34, L.topword, "middle", "fill:#ffe14d;font:700 13px var(--font-body)"),
    label(bx[2] + ax / 2, by[2] - 10, L.vx, "middle", "fill:#fff;font:700 14px var(--font-body)"),
    label(bx[2] - 9, by[2] + ay / 2 + 5, L.vy, "end", "fill:#fff;font:700 14px var(--font-body)"),
    label(bx[2] + ax + 6, by[2] + ay + 4, L.v),
    label(bx[2] - 30, by[2] - 20, L.land, "middle", "fill:#ffe14d;font:700 13px var(--font-body)"));
}

/** Figure 2: an electron entering horizontally, mid-gap, between two parallel plates (the lower one positive).
 *  The path is y = ½·a·t² with t = x/v, so y ∝ x²; after the plates it continues straight along the tangent.
 *  Geometry in metres: gap d, length L, deflection yDef (all to scale with each other). */
export function plateFig(L, { d, L: len, y }) {
  const W = 560, H = 310, x0 = 70, LEN = 360, px = LEN / len, gy0 = 80;
  const dd = d * px, mid = gy0 + dd / 2;
  const yEnd = y * px, x1 = x0 + LEN;
  const pts = [];
  for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push(`${i ? "L" : "M"}${(x0 + LEN * u).toFixed(1)} ${(mid + yEnd * u * u).toFixed(1)}`); }
  const ext = 55, slope = (2 * yEnd) / LEN, exY = mid + yEnd + slope * ext;
  const lines = [0.2, 0.35, 0.65, 0.8].map((u) => arrow(x0 + LEN * u, gy0 + dd - 8, x0 + LEN * u, gy0 + 14, "stroke:rgba(255,255,255,.28)", 1.4));
  const mx = x0 + LEN / 2, my = mid + yEnd * 0.25;
  const dx = 525, yel = "fill:#ffe14d;font:700 13px var(--font-body)";
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("rect", { x: x0, y: gy0 - 10, width: LEN, height: 10, style: "fill:var(--a2)" }),
    s("rect", { x: x0, y: gy0 + dd, width: LEN, height: 10, style: "fill:var(--a1)" }),
    s("text", { x: x1 + 8, y: gy0 - 1, style: "fill:#fff;font:700 15px var(--font-body)" }, L.minus),
    s("text", { x: x1 + 8, y: gy0 + dd + 12, style: "fill:#fff;font:700 15px var(--font-body)" }, L.plus),
    ...lines,
    s("text", { x: x0 + LEN * 0.2 + 8, y: gy0 + 34, style: "fill:rgba(255,255,255,.8);font:700 13px var(--font-body)" }, L.field),
    s("path", { d: `M${x0 - 6} ${mid}H${x1 + ext}`, style: "fill:none;stroke:rgba(255,255,255,.4);stroke-width:1;stroke-dasharray:3 5" }),
    s("path", { d: `M${x1} ${mid + yEnd}L${x1 + ext} ${exY.toFixed(1)}`, style: "fill:none;stroke:#ffe14d;stroke-width:2.4;stroke-dasharray:6 5;stroke-linecap:round" }),
    s("path", { d: pts.join(""), style: "fill:none;stroke:#ffe14d;stroke-width:3;stroke-linecap:round" }),
    arrow(x0 - 52, mid, x0 - 10, mid, A1, 3),
    s("text", { x: x0 - 31, y: mid - 10, "text-anchor": "middle", style: TXT }, L.vx),
    s("circle", { cx: x0, cy: mid, r: 6, style: "fill:#ffe14d" }),
    s("text", { x: x0 + 10, y: mid - 11, style: TXT }, L.electron),
    arrow(mx, my + 7, mx, my + 41, A2, 3),
    s("circle", { cx: mx, cy: my, r: 5, style: "fill:#ffe14d" }),
    s("text", { x: mx + 9, y: my + 38, style: TXT }, L.force),
    // dimensions: length along the bottom, gap on the right, deflection at the plate end
    arrow(x0, gy0 + dd + 36, x1, gy0 + dd + 36, YEL, 1.4), arrow(x1, gy0 + dd + 36, x0, gy0 + dd + 36, YEL, 1.4),
    s("text", { x: x0 + LEN / 2, y: gy0 + dd + 58, "text-anchor": "middle", style: yel }, L.len),
    arrow(dx, gy0 + dd / 2, dx, gy0, YEL, 1.4), arrow(dx, gy0 + dd / 2, dx, gy0 + dd, YEL, 1.4),
    s("text", { x: dx - 8, y: gy0 + dd / 2 + 5, "text-anchor": "end", style: yel }, L.gap),
    s("path", { d: `M${x1 + 14} ${mid}V${mid + yEnd}`, style: "fill:none;stroke:#fff;stroke-width:1.6" }),
    s("text", { x: x1 + 22, y: mid + yEnd / 2 - 2, style: TXT }, L.defl));
}
