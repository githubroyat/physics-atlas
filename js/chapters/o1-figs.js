// Chapter o1: static figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
import { s } from "../dom.js";

const BG = "#0a0826";
const TXT = "fill:#fff;font:700 13px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const arrow = (x1, y1, x2, y2, style, w = 2.6) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9, W = 0.45;
  const p = (da) => `${(x2 - L * Math.cos(a + da)).toFixed(1)} ${(y2 - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${x1} ${y1}L${x2} ${y2}M${p(W)}L${x2} ${y2}L${p(-W)}`, style: `fill:none;stroke-width:${w};stroke-linecap:round;stroke-linejoin:round;${style}` });
};
/** Zig-zag spring from (x, yTop) down to (x, yBot): 8 coils. */
const coil = (x, yTop, yBot) => {
  const n = 8, pad = 10, step = (yBot - yTop - 2 * pad) / n;
  let d = `M${x} ${yTop}V${yTop + pad}`;
  for (let i = 0; i < n; i++) d += `L${x + (i % 2 ? -12 : 12)} ${(yTop + pad + step * (i + 0.5)).toFixed(1)}`;
  d += `L${x} ${yBot - pad}V${yBot}`;
  return s("path", { d, style: "fill:none;stroke:var(--a1);stroke-width:3;stroke-linejoin:round" });
};

/** Figure 1: free-body picture of a mass hanging on a spring. Arrow lengths are drawn to one scale (1 px of arrow = 1 px of stretch,
 *  i.e. k = 1 in drawing units), so the spring's pull is proportional to its stretch: stretch yEq → pull yEq (= weight); stretch
 *  yEq − y → pull yEq − y; the net force is then (yEq − y) − yEq = −y, downwards, of size y. */
export function hangFig(L) {
  const W = 560, H = 330, top = 28, natural = 70, yEq = 60, dy = 24, boxW = 56, boxH = 34;
  const col = (cx, stretch, title, pullLabel, withNet) => {
    const mTop = top + natural + stretch, cyM = mTop + boxH / 2, pull = stretch, weight = yEq;
    const ax = cx + 52;
    return [
      s("path", { d: `M${cx - 50} ${top}H${cx + 50}`, style: "stroke:#fff;stroke-width:4;stroke-linecap:round" }),
      coil(cx, top, mTop),
      s("rect", { x: cx - boxW / 2, y: mTop, width: boxW, height: boxH, rx: 6, style: "fill:#2a5cff;stroke:#fff;stroke-width:2" }),
      s("text", { x: cx, y: cyM + 5, "text-anchor": "middle", style: "fill:#fff;font:700 14px var(--font-body)" }, "m"),
      arrow(ax, cyM, ax, cyM - pull, "stroke:#ffe14d"),
      arrow(ax, cyM, ax, cyM + weight, "stroke:var(--a2)"),
      s("text", { x: ax + 8, y: cyM - pull - 6, style: "fill:#ffe14d;font:700 13px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px" }, pullLabel),
      s("text", { x: ax + 8, y: cyM + weight + 14, style: "fill:var(--a2);font:700 13px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px" }, L.weight),
      withNet ? [
        arrow(cx + 110, cyM, cx + 110, cyM + dy, "stroke:#7dff9b", 4),
        s("text", { x: cx + 110, y: cyM + dy + 18, "text-anchor": "middle", style: "fill:#7dff9b;font:700 13px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px" }, L.net),
      ] : null,
      s("text", { x: cx, y: H - 12, "text-anchor": "middle", style: TXT }, title),
    ];
  };
  const xL = 130, xR = 390;
  const midY = top + natural + yEq;                  // top of the mass at rest = the middle
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    ...col(xL, yEq, L.rest, L.pull_rest, false),
    s("path", { d: `M${xR - 100} ${midY}H${xR + 36}`, style: "fill:none;stroke:rgba(255,255,255,.5);stroke-width:1.2;stroke-dasharray:4 4" }),
    ...col(xR, yEq - dy, L.moved, L.pull_moved, true),
    arrow(xR - 40, midY, xR - 40, midY - dy, "stroke:#fff", 1.6),
    s("text", { x: xR - 46, y: midY - dy / 2 + 4, "text-anchor": "end", style: TXT }, "y"),
    s("text", { x: xR - 100, y: midY + 16, style: "fill:rgba(255,255,255,.75);font:700 12px var(--font-body)" }, L.middle));
}

/** Figure 2: the force you pull with, F = +k·y, against the stretch y: a straight line through the origin; the area below it
 *  (shaded triangle, base y, height k·y) is the work done, W = ½·y·k·y = ½·k·y². */
export function areaFig(L) {
  const W = 560, H = 300, x0 = 80, x1 = 500, yB = 245, yT = 30, xe = 400, ye = 70;
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    arrow(x0, yB, x1 + 20, yB, "stroke:rgba(255,255,255,.6)", 2), arrow(x0, yB, x0, yT - 8, "stroke:rgba(255,255,255,.6)", 2),
    s("path", { d: `M${x0} ${yB}L${xe} ${yB}L${xe} ${ye}Z`, style: "fill:var(--a1);opacity:.28" }),
    s("path", { d: `M${xe} ${yB}V${ye}H${x0}`, style: "fill:none;stroke:#ffe14d;stroke-width:1.2;stroke-dasharray:4 4;opacity:.8" }),
    s("path", { d: `M${x0} ${yB}L${xe} ${ye}`, style: "fill:none;stroke:#ffe14d;stroke-width:3.4;stroke-linecap:round" }),
    s("circle", { cx: xe, cy: ye, r: 5, style: "fill:#ffe14d" }),
    s("text", { x: xe, y: yB + 22, "text-anchor": "middle", style: TXT }, L.y),
    s("text", { x: x0 - 8, y: ye + 4, "text-anchor": "end", style: TXT }, L.ky),
    s("text", { x: x0 + 8, y: yT - 12, style: TXT }, L.axis_f),
    s("text", { x: x1 + 20, y: yB + 22, "text-anchor": "end", style: TXT }, L.axis_y),
    s("text", { x: xe - 18, y: ye - 10, "text-anchor": "end", style: "fill:#ffe14d;font:700 13px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px" }, L.line),
    s("text", { x: x0 + 215, y: yB - 24, "text-anchor": "middle", style: "fill:#fff;font:700 14px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px" }, L.area));
}
