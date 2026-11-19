// Chapter o4: static figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
import { s } from "../dom.js";

const BG = "#0a0826";
const FS = 15;
const HALO = "paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const arrow = (x1, y1, x2, y2, style) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9, W = 0.45;
  const p = (da) => `${(x2 - L * Math.cos(a + da)).toFixed(1)} ${(y2 - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${x1} ${y1}L${x2} ${y2}M${p(W)}L${x2} ${y2}L${p(-W)}`, style: `fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;${style}` });
};
const txt = (x, y, text, color, anchor = "start", halo = true) =>
  s("text", { x, y, "text-anchor": anchor, style: `fill:${color};font:700 ${FS}px var(--font-body);${halo ? HALO : ""}` }, text);

/** Figure 1: energy against position y for a frictionless spring (−A ≤ y ≤ A).
 *  Elastic ½·k·y² is the parabola (y/A)² (in units of W), the total W is the flat line at 1, kinetic is the gap between them. */
export function energyFig(L) {
  const W = 560, H = 320, x0 = 70, x1 = 530, yT = 50, yB = 250, xAx = 52;
  const X = (u) => x0 + ((u + 1) / 2) * (x1 - x0);     // u = y/A
  const Y = (e) => yB - e * (yB - yT);                 // e = energy / W
  const parab = [];
  for (let i = 0; i <= 80; i++) {
    const u = -1 + (2 * i) / 80;
    parab.push(`${i ? "L" : "M"}${X(u).toFixed(1)} ${Y(u * u).toFixed(1)}`);
  }
  const fill = `${parab.join("")}L${X(1)} ${Y(1)}L${X(-1)} ${Y(1)}Z`;
  const r = Math.SQRT1_2;
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("path", { d: fill, style: "fill:#4dd8ff;opacity:.22;stroke:none" }),
    arrow(xAx - 8, yB, x1 + 12, yB, "stroke:rgba(255,255,255,.55)"), arrow(xAx, yB + 6, xAx, yT - 22, "stroke:rgba(255,255,255,.55)"),
    s("path", { d: `M${X(-1)} ${Y(1)}H${X(1)}`, style: "fill:none;stroke:#ffe14d;stroke-width:3;stroke-linecap:round" }),
    s("path", { d: parab.join(""), style: "fill:none;stroke:var(--a2);stroke-width:3;stroke-linecap:round;stroke-linejoin:round" }),
    s("path", { d: `M${X(-1)} ${yB}V${Y(1)}M${X(1)} ${yB}V${Y(1)}`, style: "fill:none;stroke:rgba(255,255,255,.3);stroke-width:1;stroke-dasharray:3 4" }),
    s("path", { d: `M${X(r)} ${yB}V${Y(0.5)}M${X(-r)} ${yB}V${Y(0.5)}M${X(-r)} ${Y(0.5)}H${X(r)}`, style: "fill:none;stroke:#fff;stroke-width:1.2;stroke-dasharray:2 4;opacity:.75" }),
    s("circle", { cx: X(r), cy: Y(0.5), r: 4.5, style: "fill:#fff" }), s("circle", { cx: X(-r), cy: Y(0.5), r: 4.5, style: "fill:#fff" }),
    txt(X(0), Y(1) - 9, L.total, "#ffe14d", "middle"),
    txt(X(0), Y(0.76), L.kinetic, "#4dd8ff", "middle"),
    txt(X(0), Y(0.5) - 7, L.equal, "#fff", "middle"),
    txt(X(1) - 4, Y(0.1), L.elastic, "var(--a2)", "end"),
    txt(X(-1), yB + 21, L.minusA, "#fff", "middle", false),
    txt(X(0), yB + 21, L.zero, "#fff", "middle", false),
    txt(X(1), yB + 21, L.plusA, "#fff", "middle", false),
    txt(x1 + 12, yB + 42, L.axis_x, "#fff", "end", false),
    txt(xAx + 10, yT - 24, L.axis_y, "#fff", "start", false));
}

/** Figure 2: displacement y against time for a lightly damped oscillator. Schematic: amplitude halves after `halfSwings` full swings. */
export function dampFig(L, { halfSwings = 3, total = 10 } = {}) {
  const W = 560, H = 290, x0 = 64, x1 = 535, yM = 145, yAmp = 100;
  const gam = Math.log(2) / (halfSwings * 2 * Math.PI);      // y = e^(−γ·t)·cos(t), t in radians
  const tMax = total * 2 * Math.PI;
  const X = (t) => x0 + (t / tMax) * (x1 - x0);
  const Y = (v) => yM - v * yAmp;
  const pts = [], up = [], dn = [];
  for (let i = 0; i <= 600; i++) {
    const t = (tMax * i) / 600, e = Math.exp(-gam * t);
    pts.push(`${i ? "L" : "M"}${X(t).toFixed(1)} ${Y(e * Math.cos(t)).toFixed(1)}`);
    up.push(`${i ? "L" : "M"}${X(t).toFixed(1)} ${Y(e).toFixed(1)}`);
    dn.push(`${i ? "L" : "M"}${X(t).toFixed(1)} ${Y(-e).toFixed(1)}`);
  }
  const tH = halfSwings * 2 * Math.PI;
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    arrow(x0 - 8, yM, x1 + 12, yM, "stroke:rgba(255,255,255,.55)"), arrow(x0, yM + 100, x0, 26, "stroke:rgba(255,255,255,.55)"),
    s("path", { d: up.join("") + dn.join(""), style: "fill:none;stroke:#ffe14d;stroke-width:1.6;stroke-dasharray:5 5;opacity:.85" }),
    s("path", { d: pts.join(""), style: "fill:none;stroke:var(--a1);stroke-width:2.6;stroke-linejoin:round" }),
    s("path", { d: `M${x0 - 5} ${Y(1)}H${x0 + 5}M${x0 - 5} ${Y(0.5)}H${X(tH)}V${yM}`, style: "fill:none;stroke:#fff;stroke-width:1.2;stroke-dasharray:2 4;opacity:.8" }),
    s("circle", { cx: X(tH), cy: Y(0.5), r: 4.5, style: "fill:#fff" }),
    txt(x0 - 10, Y(1) + 5, L.amp0, "#fff", "end"),
    txt(x0 - 10, Y(0.5) + 5, L.amp1, "#fff", "end"),
    txt(X(tH) + 10, Y(0.5) - 12, L.half, "#fff"),
    txt(x1 - 4, yM - 35, L.envelope, "#ffe14d", "end"),
    txt(x0 + 10, 22, L.axis_y, "#fff", "start", false),
    txt(x1 + 10, yM + 40, L.axis_x, "#fff", "end", false));
}
