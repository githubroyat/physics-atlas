// Chapter f1: static field-line figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
import { s } from "../dom.js";

const BG = "#0a0826";
const TXT = "fill:#fff;font:700 15px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const YEL = "fill:#ffe14d;font:700 15px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";

/** Arrow head only: a small "V" at (x, y) pointing along angle a (radians, screen coordinates). */
const head = (x, y, a, style) => {
  const L = 9, W = 0.45;
  const p = (da) => `${(x - L * Math.cos(a + da)).toFixed(1)} ${(y - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${p(W)}L${x.toFixed(1)} ${y.toFixed(1)}L${p(-W)}`, style: `fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;${style}` });
};
const arrow = (x1, y1, x2, y2, style) =>
  s("path", { d: `M${x1} ${y1}L${x2} ${y2}`, style: `fill:none;stroke-width:2;stroke-linecap:round;${style}` });
const charge = (cx, cy, sign, style) => [
  s("circle", { cx, cy, r: 14, style: `${style};stroke:#fff;stroke-width:1.5` }),
  s("path", { d: sign > 0 ? `M${cx - 7} ${cy}H${cx + 7}M${cx} ${cy - 7}V${cy + 7}` : `M${cx - 7} ${cy}H${cx + 7}`, style: "fill:none;stroke:#0a0826;stroke-width:3;stroke-linecap:round" }),
];

/** Figure 1: radial fields. Left: + charge, 8 lines pointing away. Right: − charge, 8 lines pointing in.
 *  Equal angular spacing, so the lines get further apart as 1/r: closer to the charge = closer lines = stronger field. */
export function radialFig(L) {
  const W = 560, H = 310, cy = 148, R0 = 16, R1 = 118, RH = 78, n = 8;
  const panel = (cx, sign) => {
    const out = [];
    for (let k = 0; k < n; k++) {
      const a = (k * 2 * Math.PI) / n + Math.PI / 8;
      out.push(s("path", { d: `M${(cx + R0 * Math.cos(a)).toFixed(1)} ${(cy + R0 * Math.sin(a)).toFixed(1)}L${(cx + R1 * Math.cos(a)).toFixed(1)} ${(cy + R1 * Math.sin(a)).toFixed(1)}`, style: "fill:none;stroke:var(--a1);stroke-width:2.2;stroke-linecap:round" }));
      // arrow head: pointing away from a + charge, towards a − charge
      out.push(head(cx + RH * Math.cos(a), cy + RH * Math.sin(a), sign > 0 ? a : a + Math.PI, "stroke:var(--a1)"));
    }
    return out;
  };
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    ...panel(140, 1), ...panel(420, -1),
    ...charge(140, cy, 1, "fill:var(--a2)"), ...charge(420, cy, -1, "fill:var(--a2)"),
    s("text", { x: 140, y: 296, "text-anchor": "middle", style: TXT }, L.pos),
    s("text", { x: 420, y: 296, "text-anchor": "middle", style: TXT }, L.neg));
}

/** Field of a + charge at A and an equal − charge at B: E = Σ q·(p − r)/|p − r|³. */
function fieldAt(px, py, A, B) {
  let ex = 0, ey = 0;
  for (const [c, q] of [[A, 1], [B, -1]]) {
    const dx = px - c[0], dy = py - c[1], r2 = dx * dx + dy * dy, r3 = r2 * Math.sqrt(r2);
    ex += (q * dx) / r3; ey += (q * dy) / r3;
  }
  return [ex, ey];
}

/** Trace one field line from a + charge in small steps along E (midpoint method). Stops at the − charge or at the frame edge. */
export function traceLine(A, B, startAngle, W, H, step = 3) {
  let x = A[0] + 15 * Math.cos(startAngle), y = A[1] + 15 * Math.sin(startAngle);
  const pts = [[x, y]];
  let ended = false;
  for (let i = 0; i < 1500; i++) {
    const dir = (px, py) => { const [ex, ey] = fieldAt(px, py, A, B), m = Math.hypot(ex, ey) || 1; return [ex / m, ey / m]; };
    const [d1x, d1y] = dir(x, y), [d2x, d2y] = dir(x + (step / 2) * d1x, y + (step / 2) * d1y);
    x += step * d2x; y += step * d2y;
    if (Math.hypot(x - B[0], y - B[1]) < 15) { pts.push([B[0] + ((x - B[0]) / Math.hypot(x - B[0], y - B[1])) * 15, B[1] + ((y - B[1]) / Math.hypot(x - B[0], y - B[1])) * 15]); ended = true; break; }
    pts.push([x, y]);
    if (x < -20 || x > W + 20 || y < -20 || y > H + 20) break;
  }
  return { pts, ended };
}

/** Figure 2: a + charge and a − charge. 12 lines leave the + (equal angles); the ones that don't reach the − inside the frame are mirrored,
 *  because every line that leaves + ends on −. Lines are closest together near the charges and between them (strong field). */
export function pairFig(L) {
  const W = 560, H = 310, A = [190, 155], B = [370, 155], n = 12;
  const lines = [];
  const path = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("");
  const at = (pts, len) => { let acc = 0; for (let i = 1; i < pts.length; i++) { acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc >= len) return i; } return pts.length - 1; };
  for (let k = 0; k < n; k++) {
    const { pts, ended } = traceLine(A, B, (k * 2 * Math.PI) / n, W, H);
    const total = pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
    const i = Math.max(1, at(pts, Math.min(total / 2, 95)));
    const ang = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]);
    lines.push(s("path", { d: path(pts), style: "fill:none;stroke:var(--a1);stroke-width:2.1;stroke-linecap:round" }));
    lines.push(head(pts[i][0], pts[i][1], ang, "stroke:var(--a1)"));
    if (!ended) {
      // mirror image: the same curve ending on the − charge, arrow pointing into it
      const m = pts.map((p) => [A[0] + B[0] - p[0], p[1]]);
      lines.push(s("path", { d: path(m), style: "fill:none;stroke:var(--a1);stroke-width:2.1;stroke-linecap:round" }));
      lines.push(head(m[i][0], m[i][1], Math.atan2(-(m[i][1] - m[i - 1][1]), -(m[i][0] - m[i - 1][0])), "stroke:var(--a1)"));
    }
  }
  const mx = (A[0] + B[0]) / 2;
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }), ...lines,
    ...charge(A[0], A[1], 1, "fill:var(--a2)"), ...charge(B[0], B[1], -1, "fill:var(--a2)"),
    arrow(mx - 22, A[1] + 22, mx + 14, A[1] + 22, "stroke:#ffe14d"), head(mx + 22, A[1] + 22, 0, "stroke:#ffe14d"),
    s("text", { x: mx, y: A[1] + 42, "text-anchor": "middle", style: YEL }, L.e),
    s("text", { x: mx, y: H - 14, "text-anchor": "middle", style: TXT }, L.strong),
    s("text", { x: A[0], y: 22, "text-anchor": "middle", style: TXT }, L.pos),
    s("text", { x: B[0], y: 22, "text-anchor": "middle", style: TXT }, L.neg));
}
