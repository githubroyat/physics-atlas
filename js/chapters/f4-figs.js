// Chapter f4: static figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
import { s } from "../dom.js";

const BG = "#0a0826";
const YEL = "#ffe14d";
const TXT = "fill:#fff;font:700 14px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const arrow = (x1, y1, x2, y2, style) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9, W = 0.45;
  const p = (da) => `${(x2 - L * Math.cos(a + da)).toFixed(1)} ${(y2 - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}M${p(W)}L${x2.toFixed(1)} ${y2.toFixed(1)}L${p(-W)}`, style: `fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;${style}` });
};
const EARTH_FILL = "fill:#12306a;stroke:#6fb7ff;stroke-width:2";

/** Figure 1: the two models of the same field. Left: radial lines round the whole Earth (all point at the centre, closer near the surface).
 *  Right: a zoomed patch at the top of the Earth, where the lines are parallel and equally spaced. */
export function modelsFig(L) {
  const W = 560, H = 300, cx = 130, cy = 165, R = 62;
  const lines = [];
  for (let k = 0; k < 12; k++) {
    const a = (k * 2 * Math.PI) / 12, c = Math.cos(a), sn = Math.sin(a);
    lines.push(arrow(cx + 122 * c, cy + 122 * sn, cx + (R + 5) * c, cy + (R + 5) * sn, "stroke:var(--a1)"));
  }
  const bx0 = 322, bx1 = 548, by0 = 40, by1 = 255, gy = 215;
  const par = [];
  for (let k = 0; k < 5; k++) par.push(arrow(362 + k * 40, 72, 362 + k * 40, gy - 6, "stroke:var(--a1)"));
  const px0 = cx - 13, px1 = cx + 13, py0 = cy - R - 11, py1 = cy - R + 9;      // the patch on top of the Earth
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("circle", { cx, cy, r: R, style: EARTH_FILL }),
    ...lines,
    s("text", { x: cx, y: cy + 5, "text-anchor": "middle", style: TXT }, L.earth),
    s("text", { x: cx, y: 24, "text-anchor": "middle", style: TXT }, L.radial),
    s("path", { d: `M${px1} ${py0}L${bx0} ${by0}M${px1} ${py1}L${bx0} ${by1}`, style: `fill:none;stroke:${YEL};stroke-width:1.2;stroke-dasharray:3 4;opacity:.8` }),
    s("rect", { x: px0, y: py0, width: px1 - px0, height: py1 - py0, rx: 2, style: `fill:none;stroke:${YEL};stroke-width:2` }),
    s("rect", { x: bx0, y: by0, width: bx1 - bx0, height: by1 - by0, rx: 8, style: `fill:#100d33;stroke:${YEL};stroke-width:2` }),
    s("rect", { x: bx0 + 1, y: gy, width: bx1 - bx0 - 2, height: by1 - gy - 1, style: "fill:#12306a" }),
    s("path", { d: `M${bx0 + 1} ${gy}H${bx1 - 1}`, style: "fill:none;stroke:#6fb7ff;stroke-width:2" }),
    ...par,
    s("text", { x: (bx0 + bx1) / 2, y: 24, "text-anchor": "middle", style: TXT }, L.uniform),
    s("text", { x: (bx0 + bx1) / 2, y: 238, "text-anchor": "middle", style: TXT }, L.ground),
    s("text", { x: 236, y: 150, "text-anchor": "middle", style: `fill:${YEL};font:700 13px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px` }, L.zoom),
    s("text", { x: cx, y: 292, "text-anchor": "middle", style: "fill:rgba(255,255,255,.75);font:600 12px var(--font-body)" }, L.radial_note),
    s("text", { x: (bx0 + bx1) / 2, y: 280, "text-anchor": "middle", style: "fill:rgba(255,255,255,.75);font:600 12px var(--font-body)" }, L.uniform_note));
}

/** Figure 2: where r is measured from. A ray from the Earth's centre through the ground to a satellite: R + h = r.
 *  Not to scale (a real 400 km orbit is only 6 % of R above the ground). */
export function radiusFig(L) {
  const W = 560, H = 310, cx = 150, cy = 180, R = 100, ang = (-35 * Math.PI) / 180;
  const d = [Math.cos(ang), Math.sin(ang)], n = [-d[1], d[0]];                // n points down-right (away from the upper side)
  const at = (t, off = 0) => [cx + t * d[0] + off * n[0], cy + t * d[1] + off * n[1]];
  const Rr = R, Rs = 215;                                                    // drawn: ground at 100, satellite at 215
  const S = at(Rr), P = at(Rs), C = [cx, cy];
  const lab = (t, off, text, color, anchor = "middle") => { const q = at(t, off); return s("text", { x: q[0], y: q[1] + 5, "text-anchor": anchor, style: `fill:${color};font:700 17px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px` }, text); };
  const O = 38;                                                              // offset of the r dimension line
  const c0 = at(0, O), c1 = at(Rs, O);
  const line = (a, b, style) => s("path", { d: `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`, style: `fill:none;${style}` });
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("circle", { cx, cy, r: R, style: EARTH_FILL }),
    line(C, S, "stroke:#fff;stroke-width:2.5"),
    line(S, P, `stroke:${YEL};stroke-width:4;stroke-linecap:round`),
    line(C, c0, "stroke:rgba(255,255,255,.55);stroke-width:1;stroke-dasharray:3 4"),
    line(P, c1, "stroke:rgba(255,255,255,.55);stroke-width:1;stroke-dasharray:3 4"),
    arrow((c0[0] + c1[0]) / 2, (c0[1] + c1[1]) / 2, c1[0], c1[1], "stroke:var(--a1)"),
    arrow((c0[0] + c1[0]) / 2, (c0[1] + c1[1]) / 2, c0[0], c0[1], "stroke:var(--a1)"),
    s("circle", { cx: C[0], cy: C[1], r: 4, style: "fill:#fff" }),
    s("circle", { cx: S[0], cy: S[1], r: 3.5, style: "fill:#fff" }),
    s("circle", { cx: P[0], cy: P[1], r: 8, style: `fill:${YEL};stroke:#0a0826;stroke-width:2` }),
    s("rect", { x: P[0] - 17, y: P[1] - 2.5, width: 34, height: 5, rx: 1, style: "fill:#6fb7ff" }),
    lab(Rr / 2, -16, L.R, "#fff"), lab((Rr + Rs) / 2, -16, L.h, YEL),
    lab(Rs * 0.62, O + 26, L.r, "var(--a1)"),
    s("text", { x: cx - 4, y: cy + 24, "text-anchor": "middle", style: "fill:#fff;font:700 13px var(--font-body)" }, L.centre),
    s("text", { x: cx - 4, y: cy + 62, "text-anchor": "middle", style: "fill:rgba(255,255,255,.8);font:700 14px var(--font-body)" }, L.earth),
    s("text", { x: P[0] + 14, y: P[1] - 12, style: TXT }, L.sat),
    s("text", { x: at(Rr, -40)[0], y: at(Rr, -40)[1] + 4, "text-anchor": "middle", style: "fill:#fff;font:700 13px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px" }, L.ground),
    s("text", { x: W - 16, y: H - 14, "text-anchor": "end", style: "fill:rgba(255,255,255,.75);font:600 12px var(--font-body)" }, L.note));
}
