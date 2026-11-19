// Chapter o3: static figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
import { s } from "../dom.js";

const BG = "#0a0826";
const TXT = "fill:#fff;font:700 15px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const arrow = (x1, y1, x2, y2, style) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9, W = 0.45;
  const p = (da) => `${(x2 - L * Math.cos(a + da)).toFixed(1)} ${(y2 - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${x1} ${y1}L${x2} ${y2}M${p(W)}L${x2} ${y2}L${p(-W)}`, style: `fill:none;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;${style}` });
};
const dash = (d, style) => s("path", { d, style: `fill:none;stroke-width:1.3;stroke-dasharray:4 5;${style}` });

export const FORCE_DEG = 38;
const FS = 15;
const lab = (x, y, text, color, anchor = "start") => {
  const rows = Array.isArray(text) ? text : [text];
  return rows.map((r, i) => s("text", { x, y: y + i * (FS + 3), "text-anchor": anchor, style: `fill:${color};font:700 ${FS}px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px` }, r));
};

/** Figure 1: the weight m·g of a bob released at angle θ, split into a part along the string and a part along the arc.
 *  Bob at P + L(sinθ, cosθ) (SVG y points down). Along the string (outwards): m·g·cosθ·(sinθ, cosθ).
 *  Along the arc (towards the lowest point): m·g·sinθ·(−cosθ, sinθ). The two parts add up to (0, m·g).
 *  The tension points to the pivot (drawn at the release instant, where it balances the along-string part). */
export function forceFig(L, deg = FORCE_DEG) {
  const W = 600, H = 340, px = 190, py = 24, len = 232, wt = 104;
  const th = (deg * Math.PI) / 180, sn = Math.sin(th), cs = Math.cos(th);
  const bx = px + len * sn, by = py + len * cs;
  const along = wt * cs, arc = wt * sn;
  const sx = bx + along * sn, sy = by + along * cs;                 // tip of the along-string part
  const ax = bx - arc * cs, ay = by + arc * sn;                     // tip of the along-arc part
  const wx = bx, wy = by + wt;                                      // tip of the weight
  const tx = bx - along * sn, ty = by - along * cs;                 // tip of the tension
  const rA = 54;
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("path", { d: `M${px - 60} ${py}H${px + 60}`, style: "fill:none;stroke:rgba(255,255,255,.55);stroke-width:3;stroke-linecap:round" }),
    dash(`M${px} ${py}V${py + len}`, "stroke:rgba(255,255,255,.35)"),
    dash(`M${px} ${py + len}A${len} ${len} 0 0 0 ${bx.toFixed(1)} ${by.toFixed(1)}`, "stroke:rgba(255,255,255,.45)"),
    s("path", { d: `M${px} ${py}L${bx.toFixed(1)} ${by.toFixed(1)}`, style: "fill:none;stroke:#fff;stroke-width:2" }),
    s("path", { d: `M${px} ${py + rA}A${rA} ${rA} 0 0 0 ${(px + rA * sn).toFixed(1)} ${(py + rA * cs).toFixed(1)}`, style: "fill:none;stroke:#ffe14d;stroke-width:1.6" }),
    s("text", { x: px + 8, y: py + rA + 30, style: `fill:#ffe14d;font:700 ${FS + 1}px var(--font-body)` }, L.theta),
    lab(px - 16, py + len + 4, L.lowest, "#fff", "end"),
    // the weight and its two parts: dotted rectangle
    dash(`M${sx.toFixed(1)} ${sy.toFixed(1)}L${wx.toFixed(1)} ${wy.toFixed(1)}L${ax.toFixed(1)} ${ay.toFixed(1)}`, "stroke:rgba(255,255,255,.6)"),
    arrow(bx, by, tx, ty, "stroke:var(--a1)"),
    arrow(bx, by, sx, sy, "stroke:#ffe14d"),
    arrow(bx, by, ax, ay, "stroke:var(--a2)"),
    arrow(bx, by, wx, wy, "stroke:#fff"),
    s("circle", { cx: bx, cy: by, r: 13, style: "fill:#ff7ad9;stroke:#0a0826;stroke-width:2" }),
    lab(tx - 22, ty - 4, L.tension, "var(--a1)", "end"),
    lab(sx + 12, sy + 2, L.along_string, "#ffe14d"),
    lab(ax - 5, ay + 28, L.along_arc, "var(--a2)", "end"),
    lab(wx + 12, wy + 5, L.weight, "#fff"));
}

/** Figure 2: how to measure L for the home experiment: from the pivot to the CENTRE of the bob, not just the thread. */
export function measureFig(L) {
  const W = 600, H = 300, px = 250, py = 34, thread = 166, r = 26, cy = py + thread + r;
  const dim = (x, y1, y2, c) => [
    arrow(x, (y1 + y2) / 2, x, y1, `stroke:${c}`), arrow(x, (y1 + y2) / 2, x, y2, `stroke:${c}`),
  ];
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("path", { d: `M${px - 70} ${py}H${px + 70}`, style: "fill:none;stroke:rgba(255,255,255,.55);stroke-width:3;stroke-linecap:round" }),
    s("path", { d: `M${px} ${py}V${py + thread}`, style: "fill:none;stroke:#fff;stroke-width:2" }),
    s("circle", { cx: px, cy, r, style: "fill:#ff7ad9;stroke:#0a0826;stroke-width:2" }),
    s("circle", { cx: px, cy, r: 3, style: "fill:#0a0826" }),
    // extension lines from the support level and from the thread end / the bob centre out to the two dimension arrows
    dash(`M${px - 70} ${py}H${px - 100}`, "stroke:#ff9a5c;opacity:.8"), dash(`M${px + 70} ${py}H${px + 100}`, "stroke:#ffe14d;opacity:.8"),
    dash(`M${px - 100} ${py + thread}H${px - 8}`, "stroke:#ff9a5c;opacity:.8"),
    dash(`M${px + r + 4} ${cy}H${px + 100}`, "stroke:#ffe14d;opacity:.8"),
    ...dim(px - 100, py, py + thread, "#ff9a5c"), ...dim(px + 100, py, cy, "#ffe14d"),
    lab(px - 112, py + thread / 2 - 6, L.wrong, "#ff9a5c", "end"),
    lab(px + 112, py + (cy - py) / 2 - 6, L.right, "#ffe14d"),
    lab(px + 80, py - 12, L.pivot, "#fff"),
    lab(px, H - 12, L.bob, "#fff", "middle"));
}
