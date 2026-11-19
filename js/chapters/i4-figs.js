// Chapter i4: static figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
import { s } from "../dom.js";

const BG = "#0a0826";
const TXT = "fill:#fff;font:700 14px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const arrow = (x1, y1, x2, y2, style, width = 2.5) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 11, W = 0.45;
  const p = (da) => `${(x2 - L * Math.cos(a + da)).toFixed(1)} ${(y2 - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}M${p(W)}L${x2.toFixed(1)} ${y2.toFixed(1)}L${p(-W)}`, style: `fill:none;stroke-width:${width};stroke-linecap:round;stroke-linejoin:round;${style}` });
};
const label = (x, y, text, color, anchor = "middle") =>
  s("text", { x, y, "text-anchor": anchor, style: `fill:${color};font:700 15px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px` }, text);

/** Free-body picture of a satellite in a circular orbit: the ONLY force is gravity, pointing to the centre; the velocity is along the tangent.
 *  Position angle 30° above the horizontal, moving anticlockwise. Not to scale (the orbit is drawn far lower than a real one relative to the Earth). */
export function satFig(L) {
  const W = 560, H = 360, cx = 200, cy = 175, rE = 62, rO = 130, th = (30 * Math.PI) / 180;
  const ux = Math.cos(th), uy = -Math.sin(th);                     // outward unit vector (screen)
  const sx = cx + rO * ux, sy = cy + rO * uy;
  // anticlockwise tangent on screen:
  const vx = -Math.sin(th), vy = -Math.cos(th);
  const Lv = 95, Lg = 68;
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("circle", { cx, cy, r: rO, style: "fill:none;stroke:rgba(255,255,255,.35);stroke-width:1.5;stroke-dasharray:5 6" }),
    s("circle", { cx, cy, r: rE, style: "fill:#1d5fa8;stroke:var(--a1);stroke-width:2" }),
    s("circle", { cx, cy, r: 3.5, style: "fill:#fff" }),
    s("path", { d: `M${cx} ${cy}L${sx.toFixed(1)} ${sy.toFixed(1)}`, style: "fill:none;stroke:rgba(255,255,255,.55);stroke-width:1.5;stroke-dasharray:3 4" }),
    arrow(sx, sy, sx + vx * Lv, sy + vy * Lv, "stroke:#ffe14d"),
    arrow(sx, sy, sx - ux * Lg, sy - uy * Lg, "stroke:var(--a2)"),
    s("rect", { x: sx - 7, y: sy - 7, width: 14, height: 14, rx: 2, style: "fill:#fff;stroke:#0a0826;stroke-width:2", transform: `rotate(-30 ${sx.toFixed(1)} ${sy.toFixed(1)})` }),
    label(sx + vx * Lv + 14, sy + vy * Lv + 4, L.v, "#ffe14d", "start"),
    label(cx + 0.5 * rO * ux + 14, cy + 0.5 * rO * uy + 30, L.f, "var(--a2)", "start"),
    label(cx + 0.5 * rO * ux - 14, cy + 0.5 * rO * uy - 14, L.r, "#fff", "end"),
    label(cx, cy + rE + 22, L.earth, "#fff"),
    label(cx, cy + 20, L.centre, "#fff"),
    label(W - 20, H - 44, L.only, "#fff", "end"),
    label(W - 20, H - 20, L.only2, "#fff", "end"));
}

/** Electron moving at right angles to a uniform field B (into the page): the magnetic force is always perpendicular to v and points to the centre.
 *  The electron sits at 60° on a clockwise circle, so v is to the right and down, F to the left and down. */
export function magFig(L) {
  const W = 560, H = 340, cx = 270, cy = 175, r = 105, th = (60 * Math.PI) / 180;
  const ux = Math.cos(th), uy = -Math.sin(th);
  const ex = cx + r * ux, ey = cy + r * uy;
  const vx = Math.sin(th), vy = Math.cos(th);                      // clockwise tangent on screen (to the right and down)
  const Lv = 85, Lf = 62;
  const crosses = [];
  for (let x = 30; x < W; x += 50) for (let y = 25; y < H; y += 50) if (!(x < 230 && y < 50)) crosses.push(`M${x - 4} ${y - 4}L${x + 4} ${y + 4}M${x + 4} ${y - 4}L${x - 4} ${y + 4}`);
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("path", { d: crosses.join(""), style: "fill:none;stroke:rgba(255,255,255,.28);stroke-width:1.5;stroke-linecap:round" }),
    s("circle", { cx, cy, r, style: "fill:none;stroke:rgba(255,255,255,.45);stroke-width:1.5;stroke-dasharray:5 6" }),
    s("circle", { cx, cy, r: 3.5, style: "fill:#fff" }),
    s("path", { d: `M${cx} ${cy}L${ex.toFixed(1)} ${ey.toFixed(1)}`, style: "fill:none;stroke:rgba(255,255,255,.6);stroke-width:1.5;stroke-dasharray:3 4" }),
    arrow(ex, ey, ex + vx * Lv, ey + vy * Lv, "stroke:#ffe14d"),
    arrow(ex, ey, ex - ux * Lf, ey - uy * Lf, "stroke:var(--a2)"),
    s("circle", { cx: ex, cy: ey, r: 8, style: "fill:var(--a1);stroke:#fff;stroke-width:2" }),
    s("text", { x: ex, y: ey + 4, "text-anchor": "middle", style: "fill:#0a0826;font:900 13px var(--font-body)" }, "−"),
    label(ex + vx * Lv + 10, ey + vy * Lv, L.v, "#ffe14d", "start"),
    label(ex - ux * Lf - 12, ey - uy * Lf + 18, L.f, "var(--a2)", "end"),
    label(cx + (r / 2) * ux + 10, cy + (r / 2) * uy + 22, L.r, "#fff", "start"),
    label(cx + 10, cy + 22, L.centre, "#fff", "start"),
    label(20, 30, L.b, "#fff", "start"));
}
