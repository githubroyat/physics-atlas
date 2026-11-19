// Chapter o2: static figures (no animation). Pure functions returning SVG built with s(); every label comes from the JSON (figs.*).
import { s } from "../dom.js";

const BG = "#0a0826";
const TXT = "fill:#fff;font:700 13px var(--font-body);paint-order:stroke;stroke:#0a0826;stroke-width:3px";
const arrow = (x1, y1, x2, y2, style) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9, W = 0.45;
  const p = (da) => `${(x2 - L * Math.cos(a + da)).toFixed(1)} ${(y2 - L * Math.sin(a + da)).toFixed(1)}`;
  return s("path", { d: `M${x1} ${y1}L${x2} ${y2}M${p(W)}L${x2} ${y2}L${p(-W)}`, style: `fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;${style}` });
};

/** Figure 1: y, v and a against time for y = A·sin(ωt), v = A·ω·cos(ωt), a = −A·ω²·sin(ωt), each drawn at its own scale
 *  (the heights are normalised to ±1: the real sizes A, A·ω, A·ω² differ). Two periods. Guide lines at t = T/4 and t = T/2. */
export function phaseFig(L) {
  const W = 420, H = 420, x0 = 56, perT = 160, nT = 2, bandH = 92, top0 = 38, gap = 26, amp = 34;
  const X = (t) => x0 + t * perT;                         // t in units of T
  const rows = [
    { name: L.y, col: "var(--a1)", f: (t) => Math.sin(2 * Math.PI * t) },
    { name: L.v, col: "#2ef2ff", f: (t) => Math.cos(2 * Math.PI * t) },
    { name: L.a, col: "#ffe14d", f: (t) => -Math.sin(2 * Math.PI * t) },
  ];
  const out = [s("rect", { width: W, height: H, fill: BG })];
  const yBottom = top0 + 3 * bandH + 2 * gap;
  for (const g of [0.25, 0.5]) {
    out.push(s("path", { d: `M${X(g)} ${top0 - 10}V${yBottom}`, style: "fill:none;stroke:#fff;stroke-width:1;stroke-dasharray:2 4;opacity:.55" }));
  }
  out.push(s("text", { x: X(0.25), y: top0 - 16, "text-anchor": "middle", style: TXT }, L.g1));
  out.push(s("text", { x: X(0.5), y: top0 - 16, "text-anchor": "middle", style: TXT }, L.g2));
  rows.forEach((r, i) => {
    const mid = top0 + i * (bandH + gap) + bandH / 2;
    out.push(s("path", { d: `M${x0} ${mid}H${X(nT) + 6}`, style: "fill:none;stroke:rgba(255,255,255,.4);stroke-width:1" }));
    let d = "";
    for (let k = 0; k <= 160; k++) { const t = (k / 160) * nT; d += `${k ? "L" : "M"}${X(t).toFixed(1)} ${(mid - amp * r.f(t)).toFixed(1)}`; }
    out.push(s("path", { d, style: `fill:none;stroke:${r.col};stroke-width:3;stroke-linecap:round;stroke-linejoin:round` }));
    out.push(s("text", { x: 8, y: mid + 5, style: `fill:${r.col};font:800 18px var(--font-body)` }, r.name));
  });
  // time axis with ticks at multiples of T/2
  const ya = yBottom + 8;
  out.push(arrow(x0, ya, X(nT) + 14, ya, "stroke:rgba(255,255,255,.6)"));
  L.ticks.forEach((tk, i) => {
    const x = X(i / 2);
    out.push(s("path", { d: `M${x} ${ya - 4}V${ya + 4}`, style: "fill:none;stroke:rgba(255,255,255,.6);stroke-width:1.5" }));
    out.push(s("text", { x, y: ya + 20, "text-anchor": "middle", style: "fill:#fff;font:700 13px var(--font-body)" }, tk));
  });
  out.push(s("text", { x: W - 6, y: ya + 38, "text-anchor": "end", style: "fill:#c4bce8;font:700 13px var(--font-body)" }, L.axis));
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" }, ...out);
}

/** Figure 2: a mass on a spring at the top, the middle and the bottom of its bounce, with its velocity (cyan) and acceleration (yellow).
 *  Arrow lengths are proportional: a = −ω²·y, so a is largest at the ends; v = A·ω in the middle (drawn moving down). */
export function bounceFig(L) {
  const W = 420, H = 300, ceil = 22, mid = 170, A = 56, mh = 26, mw = 46;
  const cols = [
    { cx: 70, y: mid - A, v: 0, a: -1, name: L.top },        // a points down (−) at the top; screen y grows downward
    { cx: 210, y: mid, v: 1, a: 0, name: L.middle },
    { cx: 350, y: mid + A, v: 0, a: 1, name: L.bottom },
  ];
  const out = [s("rect", { width: W, height: H, fill: BG })];
  for (const yy of [mid - A, mid, mid + A]) out.push(s("path", { d: `M10 ${yy}H${W - 10}`, style: "fill:none;stroke:rgba(255,255,255,.2);stroke-width:1;stroke-dasharray:3 6" }));
  out.push(s("path", { d: `M20 ${ceil}H${W - 20}`, style: "fill:none;stroke:rgba(255,255,255,.55);stroke-width:3" }));
  for (const c of cols) {
    const bot = c.y - mh / 2;                              // spring runs from the ceiling to the top of the mass
    let d = `M${c.cx} ${ceil}V${ceil + 10}`;
    const n = 9, y1 = ceil + 10, y2 = bot - 6;
    for (let i = 0; i < n; i++) d += `L${c.cx + (i % 2 ? -11 : 11)} ${(y1 + ((i + 0.5) / n) * (y2 - y1)).toFixed(1)}`;
    d += `L${c.cx} ${y2}V${bot}`;
    out.push(s("path", { d, style: "fill:none;stroke:rgba(255,255,255,.8);stroke-width:2.2;stroke-linejoin:round" }));
    out.push(s("rect", { x: c.cx - mw / 2, y: bot, width: mw, height: mh, rx: 5, style: "fill:var(--a2);stroke:#fff;stroke-width:1.5" }));
    // velocity: arrow down (moving down) in the middle only; acceleration: down at the top, up at the bottom
    if (c.v) out.push(arrow(c.cx - mw / 2 - 12, c.y - 22, c.cx - mw / 2 - 12, c.y + 28, "stroke:#2ef2ff"));
    if (c.a) out.push(arrow(c.cx + mw / 2 + 12, c.y, c.cx + mw / 2 + 12, c.y - c.a * 44, "stroke:#ffe14d"));
    out.push(s("text", { x: c.cx, y: H - 40, "text-anchor": "middle", style: TXT }, c.name));
    out.push(s("text", { x: c.cx, y: H - 22, "text-anchor": "middle", style: "fill:#2ef2ff;font:700 13px var(--font-body)" }, c.v ? L.v_big : L.v_zero));
    out.push(s("text", { x: c.cx, y: H - 6, "text-anchor": "middle", style: "fill:#ffe14d;font:700 13px var(--font-body)" }, c.a ? L.a_big : L.a_zero));
  }
  // axis hint: up is positive y
  out.push(arrow(404, mid + 12, 404, mid - 28, "stroke:rgba(255,255,255,.6)"));
  out.push(s("text", { x: 396, y: mid - 34, "text-anchor": "end", style: "fill:#fff;font:700 13px var(--font-body)" }, L.up));
  return s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": L.aria, style: "touch-action: pan-y" }, ...out);
}
