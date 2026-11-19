// Chapter o7: static figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
import { s } from "../dom.js";

const BG = "#0a0826";
const TXT = "fill:#fff;font:700 13px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const YEL = "fill:#ffe14d;font:700 14px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const arrow = (x1, y1, x2, y2, style) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9, W = 0.45;
  const p = (da) => `${(x2 - L * Math.cos(a + da)).toFixed(1)} ${(y2 - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${x1} ${y1}L${x2} ${y2}M${p(W)}L${x2} ${y2}L${p(-W)}`, style: `fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;${style}` });
};
const dashed = (d) => s("path", { d, style: "fill:none;stroke:#ffe14d;stroke-width:1;stroke-dasharray:2 4;opacity:.7" });

/** Figure 1: a snapshot of a transverse wave (y against x) with the amplitude A and the wavelength λ marked.
 *  y = A·sin(2π(x − x0)/λ), drawn upside-down in screen coordinates so that crests point up. */
export function snapshotFig(L) {
  const W = 560, H = 270, cy = 150, x0 = 50, lam = 200, A = 62, xEnd = 530;
  const pts = [];
  for (let x = x0; x <= xEnd; x += 4) pts.push(`${pts.length ? "L" : "M"}${x} ${(cy - A * Math.sin((2 * Math.PI * (x - x0)) / lam)).toFixed(1)}`);
  const c1 = x0 + lam / 4, c2 = x0 + (5 * lam) / 4;            // two neighbouring crests
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("path", { d: `M${x0 - 20} ${cy}H${xEnd + 10}`, style: "fill:none;stroke:rgba(255,255,255,.3);stroke-width:1;stroke-dasharray:4 5" }),
    arrow(x0 - 20, cy + 98, xEnd + 14, cy + 98, "stroke:rgba(255,255,255,.55)"),
    arrow(x0 - 20, cy + 98, x0 - 20, 14, "stroke:rgba(255,255,255,.55)"),
    s("path", { d: pts.join(""), style: "fill:none;stroke:var(--a1);stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round" }),
    dashed(`M${c1} ${cy - A}V36M${c2} ${cy - A}V36`),
    arrow((c1 + c2) / 2, 40, c1, 40, "stroke:#ffe14d"), arrow((c1 + c2) / 2, 40, c2, 40, "stroke:#ffe14d"),
    s("text", { x: (c1 + c2) / 2, y: 30, "text-anchor": "middle", style: YEL }, L.lam),
    arrow(c1 - 34, cy, c1 - 34, cy - A + 1, "stroke:var(--a2)"),    s("text", { x: c1 - 42, y: cy - A / 2 + 5, "text-anchor": "end", style: "fill:var(--a2);font:700 15px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px" }, L.amp),
    s("text", { x: c1, y: cy - A - 8, "text-anchor": "middle", style: TXT }, L.crest),
    s("text", { x: x0 + (3 * lam) / 4, y: cy + A + 20, "text-anchor": "middle", style: TXT }, L.trough),
    s("text", { x: x0 - 26, y: 14, style: TXT }, L.axis_y),
    s("text", { x: xEnd + 14, y: cy + 92, "text-anchor": "end", style: TXT }, L.axis_x),
    s("text", { x: xEnd, y: cy - 8, "text-anchor": "end", style: "fill:rgba(255,255,255,.7);font:600 12px var(--font-body)" }, L.mid));
}

/** Figure 2: a longitudinal wave on a spring (or sound in air). Top row: the coils at rest, evenly spaced. Bottom row: the same coils
 *  with the wave: coil at rest position u moves to u + a·sin(k·u). The spacing is smallest where cos(k·u) = −1 (a compression)
 *  and largest where cos(k·u) = +1 (a rarefaction). λ = 2π/k runs from one compression to the next. */
export function longFig(L) {
  const W = 560, H = 290, x0 = 30, lam = 160, k = (2 * Math.PI) / lam, a = 15, n = 63, dx = 8, rows = [70, 100, 130];
  const rest = [], wave = [];
  for (let i = 0; i < n; i++) {
    const u = i * dx, x = x0 + u + a * Math.sin(k * u);
    for (const y of rows) {
      rest.push(s("circle", { cx: x0 + u, cy: y - 20, r: 3.2, style: "fill:rgba(255,255,255,.55)" }));
      wave.push(s("circle", { cx: x, cy: y + 105, r: 3.2, style: "fill:var(--a1)" }));
    }
  }
  const cm1 = x0 + lam / 2, cm2 = x0 + (3 * lam) / 2;          // centres of two compressions (u = λ/2 and 3λ/2, where the displacement is 0)
  const rf = x0 + lam;                                         // centre of the rarefaction in between
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("text", { x: x0, y: 16, style: TXT }, L.rest_row),
    ...rest,
    s("text", { x: x0, y: 143, style: TXT }, L.wave_row),
    ...wave,
    dashed(`M${cm1} 150V260M${cm2} 150V260`),
    s("text", { x: cm1, y: 276, "text-anchor": "middle", style: YEL }, L.compression),
    s("text", { x: cm2, y: 276, "text-anchor": "middle", style: YEL }, L.compression),
    s("text", { x: rf, y: 276, "text-anchor": "middle", style: TXT }, L.rarefaction),
    arrow((cm1 + cm2) / 2, 258, cm1, 258, "stroke:#ffe14d"), arrow((cm1 + cm2) / 2, 258, cm2, 258, "stroke:#ffe14d"),
    s("text", { x: (cm1 + cm2) / 2, y: 249, "text-anchor": "middle", style: YEL }, L.lam),
    arrow(W - 130, 20, W - 30, 20, "stroke:var(--a2)"),
    s("text", { x: W - 80, y: 42, "text-anchor": "middle", style: "fill:var(--a2);font:700 13px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px" }, L.travel));
}
