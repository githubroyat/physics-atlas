// Chapter o8: static figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
// Both curves are drawn from the booklet formula y(x, t) = A·sin(2π(t/T − x/λ)):
//   snapshot t = 0:  y = −A·sin(2π·x/λ)     history x = 0:  y = A·sin(2π·t/T)
import { s } from "../dom.js";

const BG = "#0a0826";
const TXT = "fill:#fff;font:700 14px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const YEL = "fill:#ffe14d;font:700 14px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const arrow = (x1, y1, x2, y2, style) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9, W = 0.45;
  const p = (da) => `${(x2 - L * Math.cos(a + da)).toFixed(1)} ${(y2 - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${x1} ${y1}L${x2} ${y2}M${p(W)}L${x2} ${y2}L${p(-W)}`, style: `fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;${style}` });
};
const dashed = (d, c = "#ffe14d") => s("path", { d, style: `fill:none;stroke:${c};stroke-width:1;stroke-dasharray:2 4;opacity:.7` });
/** A two-headed dimension arrow from xa to xb at height y, with a label centred above it. */
const dim = (xa, xb, y, label, style = "stroke:#ffe14d", textStyle = YEL, dy = 20) => [
  arrow((xa + xb) / 2, y, xb, y, style), arrow((xa + xb) / 2, y, xa, y, style),
  s("text", { x: (xa + xb) / 2, y: y + dy, "text-anchor": "middle", style: textStyle }, label),
];

/** Curve through `n` samples: f(u) gives the screen y for u in [0, 2] (two wavelengths or two periods). */
function curve(x0, wpx, fy, n = 200) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const u = (2 * i) / n; pts.push(`${i ? "L" : "M"}${(x0 + u * wpx / 2).toFixed(1)} ${fy(u).toFixed(1)}`); }
  return pts.join("");
}

/** Figure 1: one snapshot at t = 0 (y = −A·sin(2π·x/λ)), two wavelengths long. Bead 1 and bead 3 sit λ apart (both at the
 *  trough: same height); bead 2 sits λ/2 from bead 1 (at the crest: opposite height). */
export function phaseFig(L) {
  const W = 560, H = 300, x0 = 42, wpx = 490, lam = wpx / 2, cy = 112, amp = 56;
  const X = (u) => x0 + u * lam;                                  // u in units of λ
  const Y = (u) => cy + amp * Math.sin(2 * Math.PI * u);          // screen y of y = −A·sin(2π·u)
  const bead = (u, label, fill) => [
    s("circle", { cx: X(u), cy: Y(u), r: 10, style: `fill:${fill};stroke:#0a0826;stroke-width:2` }),
    s("text", { x: X(u), y: Y(u) + 4.5, "text-anchor": "middle", style: "fill:#0a0826;font:700 13px var(--font-body)" }, label),
  ];
  const line = (yy) => s("path", { d: `M${x0} ${yy}H${x0 + wpx}`, style: "fill:none;stroke:rgba(255,255,255,.28);stroke-width:1;stroke-dasharray:4 5" });
  const yDim1 = 205, yDim2 = 255;
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    line(cy - amp), line(cy + amp),
    s("path", { d: `M${x0} ${cy}H${x0 + wpx}`, style: "fill:none;stroke:rgba(255,255,255,.55);stroke-width:1.2" }),
    s("path", { d: curve(x0, wpx, (u) => Y(u)), style: "fill:none;stroke:var(--a1);stroke-width:3;stroke-linecap:round;stroke-linejoin:round" }),
    dashed(`M${X(0.25)} ${Y(0.25)}V${yDim2}M${X(1.25)} ${Y(1.25)}V${yDim2}M${X(0.75)} ${Y(0.75)}V${yDim1}`),
    ...dim(X(0.25), X(0.75), yDim1, L.half, "stroke:var(--a2)", TXT),
    ...dim(X(0.25), X(1.25), yDim2, L.whole),
    ...bead(0.25, "1", "#ffe14d"), ...bead(1.25, "3", "#ffe14d"), ...bead(0.75, "2", "var(--a2)"),
    s("text", { x: x0 - 6, y: cy - amp + 5, "text-anchor": "end", style: TXT }, L.top),
    s("text", { x: x0 - 6, y: cy + amp + 5, "text-anchor": "end", style: TXT }, L.bottom),
    s("text", { x: x0 + wpx, y: cy + 20, "text-anchor": "end", style: "fill:rgba(255,255,255,.7);font:700 13px var(--font-body)" }, L.axis_x));
}

/** Figure 2: the two graphs of the same wave. Top: the snapshot y(x, 0) = −A·sin(2π·x/λ) (starts down, repeats every λ).
 *  Bottom: the history of the bead at x = 0, y(0, t) = A·sin(2π·t/T) (starts up, repeats every T). */
export function graphsFig(L) {
  const W = 560, H = 455, x0 = 40, wpx = 490, unit = wpx / 2, amp = 50;
  const c1 = 122, c2 = 338;
  const axes = (cy, label, top) => [
    arrow(x0 - 10, cy, x0 + wpx + 8, cy, "stroke:rgba(255,255,255,.55)"), arrow(x0, cy + amp + 14, x0, top, "stroke:rgba(255,255,255,.55)"),
    s("text", { x: x0 + wpx + 4, y: cy + 36, "text-anchor": "end", style: "fill:#fff;font:700 13px var(--font-body)" }, label),
    s("text", { x: x0 + 8, y: top + 10, style: "fill:#fff;font:700 13px var(--font-body)" }, "y"),
  ];
  const Yx = (u) => c1 + amp * Math.sin(2 * Math.PI * u);         // y = −A·sin(2π·x/λ) drawn with y up
  const Yt = (u) => c2 - amp * Math.sin(2 * Math.PI * u);         // y = +A·sin(2π·t/T)
  const X = (u) => x0 + u * unit;
  const yD1 = 44, yD2 = c2 + amp + 24;
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    // top: snapshot
    s("text", { x: x0, y: 18, style: TXT }, L.title_x),
    ...axes(c1, L.axis_x, 28),
    s("path", { d: curve(x0, wpx, Yx), style: "fill:none;stroke:var(--a1);stroke-width:3;stroke-linecap:round;stroke-linejoin:round" }),
    dashed(`M${X(0.75)} ${Yx(0.75)}V${yD1}M${X(1.75)} ${Yx(1.75)}V${yD1}`),
    ...dim(X(0.75), X(1.75), yD1, L.lam, "stroke:#ffe14d", YEL, -8),
    s("circle", { cx: X(0), cy: c1, r: 5, style: "fill:#ffe14d" }),
    s("text", { x: X(0.25), y: c1 + amp + 22, "text-anchor": "middle", style: YEL }, L.down),
    // bottom: history
    s("text", { x: x0, y: c2 - amp - 38, style: TXT }, L.title_t),
    ...axes(c2, L.axis_t, c2 - amp - 24),
    s("path", { d: curve(x0, wpx, Yt), style: "fill:none;stroke:var(--a2);stroke-width:3;stroke-linecap:round;stroke-linejoin:round" }),
    dashed(`M${X(0.75)} ${Yt(0.75)}V${yD2}M${X(1.75)} ${Yt(1.75)}V${yD2}`),
    ...dim(X(0.75), X(1.75), yD2, L.per),
    s("circle", { cx: X(0), cy: c2, r: 5, style: "fill:#ffe14d" }),
    s("text", { x: X(0.25), y: c2 - amp - 8, "text-anchor": "middle", style: YEL }, L.up));
}
