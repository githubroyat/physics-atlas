// Mini-game: tune amplitude, mass and stiffness until your y(t) = A·sin(2πt/T) curve lies on the target curve.
import { h, s } from "../dom.js";
import { springPeriod, fmt } from "../physics.js";
import { burst } from "../engine.js";

const GW = 320, GH = 180, MID = GH / 2, SPAN = 3, YPX = 520;
// Targets are reachable with the slider steps (checked: within tolerance for some m, k on the grid).
const TARGETS = [
  { A: 0.08, T: 1.0 },
  { A: 0.04, T: 0.5 },
  { A: 0.12, T: 1.6 },
];
const TOL_A = 0.06, TOL_T = 0.05;

export function matchWave(L, onWin) {
  let round = 0, A = 0.05, m = 1, k = 10;
  const target = s("path", { fill: "none", stroke: "#ffe14d", "stroke-width": 4, "stroke-dasharray": "8 6", opacity: .9 });
  const mine = s("path", { fill: "none", stroke: "#ff4fd8", "stroke-width": 3 });
  const svg = s("svg", { class: "scene", viewBox: `0 0 ${GW} ${GH}`, role: "img", "aria-label": L.title },
    s("rect", { width: GW, height: GH, fill: "#0a0826" }),
    s("path", { d: `M0 ${MID}H${GW}`, stroke: "rgba(255,255,255,.3)" }),
    ...[1, 2].map((sec) => s("path", { d: `M${(sec / SPAN) * GW} 0V${GH}`, stroke: "rgba(255,255,255,.12)" })),
    ...[1, 2].map((sec) => s("text", { x: (sec / SPAN) * GW + 4, y: GH - 6, fill: "#c4bce8", "font-size": 11, "font-weight": 800 }, `${sec} s`)),
    target, mine);
  const roundOut = h("div", { class: "qf-count" });
  const status = h("div", { "aria-live": "polite" });
  const outs = {};
  const slider = (key, label, min, max, step, unit, get, set) => {
    outs[key] = h("output");
    const inp = h("input", { type: "range", min, max, step, value: get(), "aria-label": label });
    inp.addEventListener("input", () => { set(Number(inp.value)); update(); });
    return { row: [h("label", {}, label, outs[key]), inp], inp, unit, get };
  };
  const sA = slider("A", L.amp, 2, 15, 0.5, "cm", () => A * 100, (v) => (A = v / 100));
  const sM = slider("m", L.mass, 0.1, 2, 0.05, "kg", () => m, (v) => (m = v));
  const sK = slider("k", L.k, 5, 100, 1, "N/m", () => k, (v) => (k = v));
  const tOut = h("b");
  const nextBtn = h("button", { class: "btn primary", type: "button", hidden: true }, L.next);

  const curve = (amp, T) => {
    let d = "";
    for (let i = 0; i <= 200; i++) {
      const t = (i / 200) * SPAN;
      d += `${i ? "L" : "M"}${((t / SPAN) * GW).toFixed(1)} ${(MID - amp * Math.sin((2 * Math.PI * t) / T) * YPX).toFixed(1)}`;
    }
    return d;
  };

  function update() {
    const tg = TARGETS[round], T = springPeriod(m, k);
    outs.A.textContent = `${fmt(A * 100, 1)} cm`; outs.m.textContent = `${fmt(m, 2)} kg`; outs.k.textContent = `${k} N/m`;
    tOut.textContent = `${fmt(T, 2)} s`;
    target.setAttribute("d", curve(tg.A, tg.T));
    mine.setAttribute("d", curve(A, T));
    roundOut.textContent = `${L.round} ${round + 1} / ${TARGETS.length}`;
    const ok = Math.abs(A - tg.A) / tg.A <= TOL_A && Math.abs(T - tg.T) / tg.T <= TOL_T;
    if (ok && nextBtn.hidden) {
      status.replaceChildren(h("div", { class: "verdict-row" }, burst(L.match, "ok"),
        h("p", { class: "verdict" }, `${L.target}: A = ${fmt(tg.A * 100, 1)} cm, T = ${fmt(tg.T, 2)} s`)));
      nextBtn.hidden = false;
      nextBtn.textContent = round + 1 < TARGETS.length ? L.next : L.finish;
    } else if (!ok) { status.replaceChildren(h("p", { class: "small muted" }, L.hint)); nextBtn.hidden = true; }
  }
  nextBtn.addEventListener("click", () => {
    if (round + 1 < TARGETS.length) { round++; nextBtn.hidden = true; update(); }
    else { status.replaceChildren(h("div", { class: "verdict-row" }, burst(L.champion, "ok"), h("p", { class: "verdict" }, L.done))); nextBtn.hidden = true; onWin?.(status); }
  });
  update();
  return h("div", { class: "lab" },
    h("div", {}, roundOut, h("div", { class: "scene-box" }, svg),
      h("p", { class: "small muted", style: "margin-top:8px" }, L.legend)),
    h("div", { class: "controls" }, ...sA.row, ...sM.row, ...sK.row,
      h("div", { class: "readout" }, h("div", {}, h("span", {}, L.your_period), tOut)),
      status, h("div", { class: "btn-row" }, nextBtn)));
}
