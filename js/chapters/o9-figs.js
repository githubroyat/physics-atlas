// Chapter o9: static figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
import { s } from "../dom.js";
import { dopplerSource, SOUND_SPEED } from "../physics.js";

const BG = "#0a0826";
const TXT = "fill:#fff;font:700 13px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const arrow = (x1, y1, x2, y2, style) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9, W = 0.45;
  const p = (da) => `${(x2 - L * Math.cos(a + da)).toFixed(1)} ${(y2 - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${x1} ${y1}L${x2} ${y2}M${p(W)}L${x2} ${y2}L${p(-W)}`, style: `fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;${style}` });
};

/** Figure 1: wavefronts of a source moving to the right at ratio·v. Circle k = the crest sent k periods ago, centred where the source then was.
 *  In front the gap between crests is (v − u_s)·T, behind it is (v + u_s)·T. */
export const WAVE_RATIO = 0.4;
export function waveFig(L, ratio = WAVE_RATIO) {
  const W = 560, H = 350, cy = 165, xs = 340, vT = 44, uT = ratio * vT, ext = 3;
  const circles = [], dots = [];
  for (let k = 1; k <= ext; k++) {
    circles.push(s("circle", { cx: xs - k * uT, cy, r: k * vT, style: "fill:none;stroke:var(--a1);stroke-width:2.2" }));
    dots.push(s("circle", { cx: xs - k * uT, cy, r: 3, style: "fill:#fff;opacity:.75" }));
  }
  // the gaps between the 2nd and 3rd crest, measured on the axis
  const fA = xs + 2 * (vT - uT), fB = xs + 3 * (vT - uT);      // front: right-hand points
  const bA = xs - 2 * (vT + uT), bB = xs - 3 * (vT + uT);      // behind: left-hand points
  const dim = (xa, xb, label, anchor) => [
    s("path", { d: `M${xa} ${cy}V315M${xb} ${cy}V315`, style: "fill:none;stroke:#ffe14d;stroke-width:1;stroke-dasharray:2 4;opacity:.7" }),
    arrow((xa + xb) / 2, 315, Math.max(xa, xb), 315, "stroke:#ffe14d"), arrow((xa + xb) / 2, 315, Math.min(xa, xb), 315, "stroke:#ffe14d"),
    s("text", { x: (xa + xb) / 2, y: 338, "text-anchor": anchor || "middle", style: "fill:#ffe14d;font:700 13px var(--font-body)" }, label),
  ];
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("path", { d: `M20 ${cy}H${W - 20}`, style: "fill:none;stroke:rgba(255,255,255,.2);stroke-width:1;stroke-dasharray:4 5" }),
    ...circles, ...dots,
    s("circle", { cx: xs, cy, r: 7, style: "fill:#ffe14d" }),
    arrow(xs + 10, cy, xs + 36, cy, "stroke:#ffe14d"),
    s("text", { x: xs + 24, y: cy - 10, "text-anchor": "middle", style: "fill:#ffe14d;font:700 14px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px" }, L.speed),
    s("text", { x: 20, y: 24, style: TXT }, L.behind_word), s("text", { x: W - 20, y: 24, "text-anchor": "end", style: TXT }, L.front_word),
    ...dim(bA, bB, L.behind), ...dim(fA, fB, L.front));
}

/** Figure 2: the pitch heard from a siren (f_s, speed u) driving along a straight road at distance d from the listener.
 *  Plotted against the source's position x along the road (x < 0: still approaching). Radial speed = u·cosθ, with cosθ = −x/√(x² + d²). */
export function pitchFig(L, { fs, u, d, v = SOUND_SPEED, xMax = 30 }) {
  const W = 560, H = 300, x0 = 70, x1 = 540, yT = 40, yB = 245;
  const fHi = dopplerSource(fs, u, true, v), fLo = dopplerSource(fs, u, false, v);
  const pad = (fHi - fLo) * 0.18, top = fHi + pad, bot = fLo - pad;
  const X = (x) => x0 + ((x + xMax) / (2 * xMax)) * (x1 - x0);
  const Y = (f) => yT + ((top - f) / (top - bot)) * (yB - yT);
  const pts = [];
  for (let i = 0; i <= 120; i++) {
    const x = -xMax + (2 * xMax * i) / 120;
    const r = (-x / Math.hypot(x, d)) * u;                       // speed towards the listener (negative once it has passed)
    const f = dopplerSource(fs, Math.abs(r), r >= 0, v);
    pts.push(`${i ? "L" : "M"}${X(x).toFixed(1)} ${Y(f).toFixed(1)}`);
  }
  const line = (f, c) => s("path", { d: `M${x0} ${Y(f)}H${x1}`, style: `fill:none;stroke:${c};stroke-width:1.3;stroke-dasharray:5 5;opacity:.8` });
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    arrow(x0, yB, x1 + 8, yB, "stroke:rgba(255,255,255,.55)"), arrow(x0, yB, x0, yT - 14, "stroke:rgba(255,255,255,.55)"),
    line(fHi, "var(--a2)"), line(fLo, "var(--a1)"), line(fs, "rgba(255,255,255,.55)"),
    s("path", { d: `M${X(0)} ${yT}V${yB}`, style: "fill:none;stroke:#ffe14d;stroke-width:1;stroke-dasharray:2 4;opacity:.7" }),
    s("path", { d: pts.join(""), style: "fill:none;stroke:#ffe14d;stroke-width:3;stroke-linecap:round;stroke-linejoin:round" }),
    s("text", { x: x0 + 8, y: Y(fHi) - 7, style: TXT }, L.hi),
    s("text", { x: x1 - 6, y: Y(fLo) + 18, "text-anchor": "end", style: TXT }, L.lo),
    s("text", { x: X(0) + 8, y: Y(fs) - 7, style: TXT }, L.mid),
    s("text", { x: X(0), y: yB + 20, "text-anchor": "middle", style: "fill:#ffe14d;font:700 13px var(--font-body)" }, L.level),
    s("text", { x: x0 + 4, y: yB + 20, style: "fill:#fff;font:700 13px var(--font-body)" }, L.before),
    s("text", { x: x1, y: yB + 20, "text-anchor": "end", style: "fill:#fff;font:700 13px var(--font-body)" }, L.after),
    s("text", { x: x0 - 8, y: yT - 18, style: "fill:#fff;font:700 13px var(--font-body)" }, L.axis_y),
    s("text", { x: x1 + 8, y: yB + 40, "text-anchor": "end", style: "fill:#fff;font:700 13px var(--font-body)" }, L.axis_x));
}
