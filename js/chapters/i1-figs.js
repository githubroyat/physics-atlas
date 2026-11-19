// Chapter i1: static figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
import { s } from "../dom.js";
import { posAt, velAt, fmt } from "../physics.js";

const BG = "#0a0826";
const TXT = "fill:#fff;font:700 12px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const arrow = (x1, y1, x2, y2, style) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 8, W = 0.45;
  const p = (da) => `${(x2 - L * Math.cos(a + da)).toFixed(1)} ${(y2 - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${x1} ${y1}L${x2} ${y2}M${p(W)}L${x2} ${y2}L${p(-W)}`, style: `fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;${style}` });
};
const text = (x, y, str, extra = "", anchor = "start") => s("text", { x, y, "text-anchor": anchor, style: TXT + ";" + extra }, str);

/** Figure 1: the v–t line v = v0 + a·t from 0 to T, area split into a RECTANGLE (v0·t) and a TRIANGLE (½·(a·t)·t). */
export const SPLIT = { v0: 4, a: 1, T: 6 };
export function splitFig(L, { v0, a, T } = SPLIT) {
  const W = 340, H = 250, X0 = 52, Y0 = 24, PW = 226, PH = 170;
  const vEnd = velAt(v0, a, T), ymax = Math.ceil(vEnd + 2);
  const gx = (t) => X0 + (t / T) * PW, gy = (v) => Y0 + PH - (v / ymax) * PH;
  const rect = `M${gx(0)} ${gy(0)}V${gy(v0)}H${gx(T)}V${gy(0)}Z`;
  const tri = `M${gx(0)} ${gy(v0)}L${gx(T)} ${gy(vEnd)}V${gy(v0)}Z`;
  const yb = Y0 + PH + 22;
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    s("path", { d: rect, style: "fill:var(--a1);opacity:.4" }),
    s("path", { d: tri, style: "fill:var(--a2);opacity:.45" }),
    s("path", { d: `M${gx(0)} ${gy(v0)}H${gx(T)}`, style: "fill:none;stroke:#fff;stroke-width:1.5;stroke-dasharray:5 4" }),
    arrow(X0, Y0 + PH, X0 + PW + 14, Y0 + PH, "stroke:rgba(255,255,255,.6)"), arrow(X0, Y0 + PH, X0, Y0 - 12, "stroke:rgba(255,255,255,.6)"),
    s("path", { d: `M${gx(0)} ${gy(v0)}L${gx(T)} ${gy(vEnd)}`, style: "fill:none;stroke:#ffe14d;stroke-width:4;stroke-linecap:round" }),
    text(X0 - 6, Y0 - 6, L.axis_v, "fill:#2ef2ff", "end"),
    text(X0 + PW + 14, Y0 + PH + 14, L.axis_t, "", "end"),
    text(X0 - 8, gy(v0 / 2) + 4, L.v0, "", "end"),
    text(gx(T / 2), gy(v0 / 2) - 4, L.rect1, "", "middle"), text(gx(T / 2), gy(v0 / 2) + 12, L.rect2, "", "middle"),
    text(gx(T) - 8, gy(v0) - 28, L.tri1, "", "end"), text(gx(T) - 8, gy(v0) - 12, L.tri2, "", "end"),
    text(gx(0.2), gy(vEnd + 1.1), L.line, "fill:#ffe14d"),
    // width t (below the axis) and height a·t (right of the triangle)
    arrow(gx(T / 2), yb, gx(0), yb, "stroke:#fff"), arrow(gx(T / 2), yb, gx(T), yb, "stroke:#fff"), text(gx(T / 2), yb + 16, L.width, "", "middle"),
    arrow(gx(T) + 12, (gy(v0) + gy(vEnd)) / 2, gx(T) + 12, gy(vEnd), "stroke:#fff"), arrow(gx(T) + 12, (gy(v0) + gy(vEnd)) / 2, gx(T) + 12, gy(v0), "stroke:#fff"),
    text(gx(T) + 18, (gy(v0) + gy(vEnd)) / 2 + 4, L.height));
}

/** Figure 2: the same motion in three graphs (constant a): s–t is a parabola, v–t a sloping line, a–t a flat line.
 *  s(t) = v0·t + ½·a·t², v(t) = v0 + a·t, a(t) = a, over 0 … T. A tangent at t = T/2 shows that the slope of s–t is v there. */
export const THREE = { v0: 2, a: 1.5, T: 4 };
export function threeFig(L, { v0, a, T } = THREE) {
  const W = 340, PW = 226, X0 = 58, PH = 82, P = 128, H = 3 * P + 16;
  const sEnd = posAt(0, v0, a, T), vEnd = velAt(v0, a, T), tm = T / 2, vm = velAt(v0, a, tm), sm = posAt(0, v0, a, tm);
  const gx = (t) => X0 + (t / T) * PW;
  const panel = (i, top, ymax, color, label, ticks, body) => {
    const y0 = 24 + i * P, gy = (y) => y0 + PH - (y / ymax) * PH;
    return [
      arrow(X0, y0 + PH, X0 + PW + 12, y0 + PH, "stroke:rgba(255,255,255,.55)"), arrow(X0, y0 + PH, X0, y0 - 6, "stroke:rgba(255,255,255,.55)"),
      text(X0 - 6, y0 - 8, label, `fill:${color}`, "start"),
      ...ticks.map(([y, str]) => text(X0 - 6, gy(y) + 4, str, "", "end")),
      ...body(gy),
    ];
  };
  const curve = (f, ymax, gy) => {
    const pts = [];
    for (let i = 0; i <= 40; i++) { const t = (T * i) / 40; pts.push(`${i ? "L" : "M"}${gx(t).toFixed(1)} ${gy(f(t)).toFixed(1)}`); }
    return pts.join("");
  };
  const sMax = Math.ceil(sEnd / 5) * 5, vMax = Math.ceil(vEnd / 2) * 2, aMax = Math.ceil(a + 1);
  const sl = 1.0;   // the tangent is drawn from tm − sl to tm + sl
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" },
    s("rect", { width: W, height: H, fill: BG }),
    ...panel(0, 0, sMax, "#ffe14d", L.s, [[0, "0"], [sEnd, fmt(sEnd, 0)]], (gy) => [
      s("path", { d: curve((t) => posAt(0, v0, a, t), sMax, gy), style: "fill:none;stroke:#ffe14d;stroke-width:4;stroke-linecap:round" }),
      s("path", { d: `M${gx(tm - sl)} ${gy(sm - vm * sl)}L${gx(tm + sl)} ${gy(sm + vm * sl)}`, style: "fill:none;stroke:#fff;stroke-width:2;stroke-dasharray:5 4" }),
      s("circle", { cx: gx(tm), cy: gy(sm), r: 5, fill: "#fff" }),
      text(gx(tm) + 10, gy(sm) + 20, L.s_note, "", "start"),
    ]),
    ...panel(1, 0, vMax, "#2ef2ff", L.v, [[0, "0"], [v0, fmt(v0, 1)], [vEnd, fmt(vEnd, 1)]], (gy) => [
      s("path", { d: `M${gx(0)} ${gy(v0)}L${gx(T)} ${gy(vEnd)}`, style: "fill:none;stroke:#2ef2ff;stroke-width:4;stroke-linecap:round" }),
      s("circle", { cx: gx(tm), cy: gy(vm), r: 5, fill: "#fff" }),
      text(gx(tm) + 8, gy(vm) + 22, L.v_note, "", "start"),
    ]),
    ...panel(2, 0, aMax, "#ff6fb1", L.a, [[0, "0"], [a, fmt(a, 1)]], (gy) => [
      s("path", { d: `M${gx(0)} ${gy(a)}H${gx(T)}`, style: "fill:none;stroke:#ff6fb1;stroke-width:4;stroke-linecap:round" }),
      text(gx(tm), gy(a) - 10, L.a_note, "", "middle"),
      text(X0 + PW + 12, 24 + 2 * P + PH + 16, L.axis_t, "", "end"),
    ]));
}
