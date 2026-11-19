// Chapter o5: static figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
import { s } from "../dom.js";
import { steadyAmp, dampCoef, QS, FD_MAX } from "../widgets/resonance.js";
import { springFrequency } from "../physics.js";

const BG = "#0a0826";
const TXT = "fill:#fff;font:700 13px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const AX = "fill:#fff;font:700 13px var(--font-body)";
const arrow = (x1, y1, x2, y2, style) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9, W = 0.45;
  const p = (da) => `${(x2 - L * Math.cos(a + da)).toFixed(1)} ${(y2 - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${x1} ${y1}L${x2} ${y2}M${p(W)}L${x2} ${y2}L${p(-W)}`, style: `fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;${style}` });
};

/** Figure 1: the resonance curve of the lab (mass m, k = 20 N/m, peak push 1.0 N): settled amplitude against driving frequency,
 *  light damping (Q = 5) and strong damping (Q = 2.5). Curves come from the same steady-state formula the lab is checked against. */
export function curveFig(L, { m }) {
  const W = 560, H = 320, x0 = 70, x1 = 540, yT = 40, yB = 260, aMax = 0.30;
  const f0 = springFrequency(m, 20);
  const X = (f) => x0 + (f / FD_MAX) * (x1 - x0);
  const Y = (a) => yB - (Math.min(a, aMax) / aMax) * (yB - yT);
  const curve = (Q) => {
    const b = dampCoef(m, Q), pts = [];
    for (let i = 0; i <= 250; i++) { const f = (FD_MAX * i) / 250; pts.push(`${i ? "L" : "M"}${X(f).toFixed(1)} ${Y(steadyAmp(m, b, f)).toFixed(1)}`); }
    return pts.join("");
  };
  const peak = (Q) => steadyAmp(m, dampCoef(m, Q), f0);
  const line = (Q, c) => s("path", { d: curve(Q), style: `fill:none;stroke:${c};stroke-width:3;stroke-linecap:round;stroke-linejoin:round` });
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    arrow(x0, yB, x1 + 8, yB, "stroke:rgba(255,255,255,.55)"), arrow(x0, yB, x0, yT - 14, "stroke:rgba(255,255,255,.55)"),
    s("path", { d: `M${X(f0)} ${yT - 4}V${yB}`, style: "fill:none;stroke:#fff;stroke-width:1.3;stroke-dasharray:5 5;opacity:.8" }),
    line(QS.strong, "var(--a1)"), line(QS.light, "var(--a2)"),
    s("text", { x: X(f0) + 52, y: Y(peak(QS.light)) + 4, style: `${TXT};fill:var(--a2)` }, L.light),
    s("text", { x: X(f0) + 52, y: Y(peak(QS.strong)) - 2, style: `${TXT};fill:var(--a1)` }, L.strong),
    s("text", { x: X(f0), y: yT - 12, "text-anchor": "middle", style: TXT }, L.f0),
    s("text", { x: x0 - 8, y: yT - 18, style: AX }, L.axis_y),
    s("text", { x: x1 + 8, y: yB + 22, "text-anchor": "end", style: AX }, L.axis_x),
    s("text", { x: x0, y: yB + 20, "text-anchor": "middle", style: AX }, "0"));
}

/** Figure 2: when the pushes arrive. The swing's own motion y = sin(2π·t/T) (time in swing periods). A push to the right helps when the swing is
 *  moving right (velocity ∝ cos(2π·t/T) > 0). Row A: pushes once per swing (f_d = f_0), all help. Row B: pushes at f_d = ratio·f_0, they drift in and out of step. */
export const PUSH_RATIO = 1.25;
export function pushFig(L, ratio = PUSH_RATIO) {
  const W = 560, H = 360, x0 = 60, x1 = 540, tMax = 3.5, amp = 36;
  const X = (t) => x0 + (t / tMax) * (x1 - x0);
  const row = (cy, title, rate) => {
    const pts = [];
    for (let i = 0; i <= 200; i++) { const t = (tMax * i) / 200; pts.push(`${i ? "L" : "M"}${X(t).toFixed(1)} ${(cy - amp * Math.sin(2 * Math.PI * t)).toFixed(1)}`); }
    const marks = [];
    for (let k = 0; (k / rate) <= tMax + 1e-9; k++) {
      const t = k / rate, y = cy - amp * Math.sin(2 * Math.PI * t), helps = Math.cos(2 * Math.PI * t) > 0;
      marks.push(s("path", { d: `M${X(t)} ${cy + amp + 10}V${y}`, style: "fill:none;stroke:rgba(255,255,255,.18);stroke-width:1;stroke-dasharray:2 4" }));
      marks.push(helps ? s("circle", { cx: X(t), cy: y, r: 7, style: "fill:#7dffb0;stroke:#0a0826;stroke-width:2" })
        : s("circle", { cx: X(t), cy: y, r: 6.5, style: "fill:none;stroke:#ff5a6e;stroke-width:3" }));
    }
    return [s("path", { d: `M${x0} ${cy}H${x1}`, style: "fill:none;stroke:rgba(255,255,255,.25);stroke-width:1" }),
      s("path", { d: pts.join(""), style: "fill:none;stroke:var(--a1);stroke-width:2.5;stroke-linecap:round" }), ...marks,
      s("text", { x: x0, y: cy - amp - 14, style: TXT }, title)];
  };
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    ...row(100, L.rowA, 1), ...row(236, L.rowB, ratio),
    s("circle", { cx: x0 + 6, cy: 336, r: 7, style: "fill:#7dffb0" }), s("text", { x: x0 + 20, y: 341, style: AX }, L.helps),
    s("circle", { cx: x0 + 236, cy: 336, r: 6.5, style: "fill:none;stroke:#ff5a6e;stroke-width:3" }), s("text", { x: x0 + 250, y: 341, style: AX }, L.fights),
    s("text", { x: x1, y: 341, "text-anchor": "end", style: AX }, L.axis_x));
}
