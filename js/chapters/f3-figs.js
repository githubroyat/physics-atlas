// Chapter f3: static figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
import { s } from "../dom.js";

const BG = "#0a0826";
const RED = "#ff5a6a", BLUE = "#5aa0ff", YEL = "#ffe14d";
const TXT = "fill:#fff;font:700 14px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const arrow = (x1, y1, x2, y2, style) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9, W = 0.45;
  const p = (da) => `${(x2 - L * Math.cos(a + da)).toFixed(1)} ${(y2 - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${x1} ${y1}L${x2} ${y2}M${p(W)}L${x2} ${y2}L${p(-W)}`, style: `fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;${style}` });
};
/** A short arrowhead on the point (x, y), pointing along the direction (dx, dy). */
const head = (x, y, dx, dy, style) => {
  const n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n;
  return arrow(x - 7 * ux, y - 7 * uy, x + 7 * ux, y + 7 * uy, style);
};

/** Figure 1: a straight wire seen end-on. Left: current out of the screen (dot), field anticlockwise. Right: current into the screen (cross), field clockwise.
 *  Screen angle θ is measured anticlockwise from the +x axis; the anticlockwise tangent there is (−sinθ, −cosθ) in screen coordinates (y points down). */
export function wireFig(L) {
  const W = 560, H = 270, cy = 140, radii = [40, 72, 104];
  const panel = (cx, out) => {
    const sign = out ? 1 : -1;                                   // +1 anticlockwise, −1 clockwise
    const parts = [];
    radii.forEach((r, i) => {
      parts.push(s("circle", { cx, cy, r, style: `fill:none;stroke:var(--a1);stroke-width:${2.4 - i * 0.4}` }));
      [Math.PI * 0.25, Math.PI * 1.25].forEach((th) => {
        const x = cx + r * Math.cos(th), y = cy - r * Math.sin(th);
        parts.push(head(x, y, sign * -Math.sin(th), sign * -Math.cos(th), "stroke:var(--a1)"));
      });
    });
    // the wire: dot (out of the screen) or cross (into the screen)
    parts.push(s("circle", { cx, cy, r: 13, style: `fill:${BG};stroke:${YEL};stroke-width:2.5` }));
    if (out) parts.push(s("circle", { cx, cy, r: 4, style: `fill:${YEL}` }));
    else parts.push(s("path", { d: `M${cx - 7} ${cy - 7}L${cx + 7} ${cy + 7}M${cx + 7} ${cy - 7}L${cx - 7} ${cy + 7}`, style: `fill:none;stroke:${YEL};stroke-width:2.5;stroke-linecap:round` }));
    parts.push(s("text", { x: cx, y: 22, "text-anchor": "middle", style: `fill:${YEL};font:700 15px var(--font-body)` }, out ? L.out_title : L.in_title));
    parts.push(s("text", { x: cx, y: H - 10, "text-anchor": "middle", style: "fill:#fff;font:700 14px var(--font-body)" }, out ? L.out_note : L.in_note));
    return parts;
  };
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("path", { d: `M${W / 2} 14V${H - 14}`, style: "fill:none;stroke:rgba(255,255,255,.2);stroke-width:1;stroke-dasharray:4 5" }),
    ...panel(140, true), ...panel(420, false));
}

/** Figure 2: a solenoid and a bar magnet side by side, with the SAME closed field lines. Inside they run S → N (to the right), outside N → S.
 *  With N on the right the current in the front strands runs DOWN the screen (right-hand grip: thumb right, fingers go down at the front). */
export function loopsFig(L) {
  const W = 560, H = 270, cy = 135, a = 60, b = 220, halfH = 30;
  // [offset of the line from the axis, height of its outer loop]: two above, two below the axis
  const lines = [[-9, 50], [-22, 80], [9, 50], [22, 80]];
  const mid = (p0, p1, p2, p3) => [(p0[0] + 3 * p1[0] + 3 * p2[0] + p3[0]) / 8, (p0[1] + 3 * p1[1] + 3 * p2[1] + p3[1]) / 8, p3[0] + p2[0] - p1[0] - p0[0], p3[1] + p2[1] - p1[1] - p0[1]];
  const field = (ox) => {
    const out = [];
    lines.forEach(([d, H2]) => {
      const up = d < 0, y0 = cy + d, ey = up ? -H2 * 1.33 : H2 * 1.33;
      const P0 = [ox + b, y0], P1 = [ox + b + 52, y0 + ey], P2 = [ox + a - 52, y0 + ey], P3 = [ox + a, y0];
      out.push(s("path", { d: `M${P3[0]} ${y0}H${P0[0]}M${P0[0]} ${y0}C${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]} ${P3[0]} ${P3[1]}`, style: "fill:none;stroke:var(--a1);stroke-width:2.2" }));
      const m = mid(P0, P1, P2, P3);
      out.push(head(m[0], m[1], m[2], m[3], "stroke:var(--a1)"));         // outside: from N round to S (leftwards on top)
      out.push(head(ox + (a + b) / 2, y0, 1, 0, "stroke:var(--a1)"));    // inside: S to N (rightwards)
    });
    return out;
  };
  const ends = (ox) => [
    s("text", { x: ox + a - 8, y: cy + 5, "text-anchor": "end", style: `fill:${BLUE};font:700 17px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px` }, L.s),
    s("text", { x: ox + b + 8, y: cy + 5, style: `fill:${RED};font:700 17px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px` }, L.n),
  ];
  // left panel: solenoid (rectangle with slanted turns, current arrows on the front strands)
  const coil = [s("rect", { x: a, y: cy - halfH, width: b - a, height: 2 * halfH, rx: 3, style: "fill:#16124a;stroke:#fff;stroke-width:1.5;opacity:.95" })];
  for (let i = 0; i < 9; i++) {
    const x = a + 10 + i * ((b - a - 20) / 8);
    coil.push(s("path", { d: `M${x - 5} ${cy - halfH}L${x + 5} ${cy + halfH}`, style: `fill:none;stroke:${YEL};stroke-width:2.4;stroke-linecap:round` }));
  }
  coil.push(head(a + 10 + 4 * ((b - a - 20) / 8), cy, 0.17, 1, `stroke:#fff`));
  // right panel: bar magnet, S half blue, N half red
  const ox2 = 280;
  const bar = [
    s("rect", { x: ox2 + a, y: cy - halfH, width: (b - a) / 2, height: 2 * halfH, style: `fill:${BLUE};opacity:.85` }),
    s("rect", { x: ox2 + (a + b) / 2, y: cy - halfH, width: (b - a) / 2, height: 2 * halfH, style: `fill:${RED};opacity:.85` }),
    s("rect", { x: ox2 + a, y: cy - halfH, width: b - a, height: 2 * halfH, style: "fill:none;stroke:#fff;stroke-width:1.5" }),
  ];
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("path", { d: `M${W / 2} 14V${H - 14}`, style: "fill:none;stroke:rgba(255,255,255,.2);stroke-width:1;stroke-dasharray:4 5" }),
    ...coil, ...bar, ...field(0), ...field(ox2), ...ends(0), ...ends(ox2),
    s("text", { x: (a + b) / 2, y: 22, "text-anchor": "middle", style: `fill:${YEL};font:700 15px var(--font-body)` }, L.coil),
    s("text", { x: ox2 + (a + b) / 2, y: 22, "text-anchor": "middle", style: `fill:${YEL};font:700 15px var(--font-body)` }, L.bar),
    s("text", { x: (a + b) / 2, y: H - 10, "text-anchor": "middle", style: "fill:#fff;font:700 14px var(--font-body)" }, L.current),
    s("text", { x: ox2 + (a + b) / 2, y: H - 10, "text-anchor": "middle", style: "fill:#fff;font:700 14px var(--font-body)" }, L.magnet));
}
