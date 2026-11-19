// Interactive: leap straight up onto a rooftop. Real-time physics, energy bars, mass slider.
// Every number comes from physics.js, the same functions the chapter prose uses.
import { h, s, clear } from "../dom.js";
import { G, STOREY_M, REF, speedForHeight, toKmh, fmt } from "../physics.js";

const GROUND = 370;            // svg y of street level
const SCALE = 300 / 60;        // px per metre (20 storeys = 60 m fills the scene)
const BX = 180, BW = 110;      // building x and width
const START_X = 148, ROOF_X = 222;
const MAX_CMP = 36;            // m/s, fixed scale for the comparison meters

export function rooftop(L, fill) {
  let storeys = 10, mass = 50, raf = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ----- scene -----
  const building = s("g");
  const marker = s("g");
  const lines = s("g", { opacity: 0, stroke: "#ffd27a", "stroke-width": 2, "stroke-linecap": "round" },
    s("line", { x1: -6, y1: 6, x2: -6, y2: 30 }), s("line", { x1: 0, y1: 8, x2: 0, y2: 40 }), s("line", { x1: 6, y1: 6, x2: 6, y2: 30 }));
  const sfx = s("text", { x: 0, y: -40, "text-anchor": "middle", opacity: 0, fill: "#ff7d33", stroke: "#17140f", "stroke-width": 1.5,
    "font-size": 26, "font-weight": 900, "font-style": "italic", transform: "rotate(-10)" }, L.sfx);
  const jumper = s("g", {}, lines, figure(), sfx);
  const svg = s("svg", { class: "scene", viewBox: "0 0 320 400", role: "img", "aria-label": L.title },
    s("defs", {}, s("linearGradient", { id: "sky", x1: 0, y1: 0, x2: 0, y2: 1 },
      s("stop", { offset: "0", "stop-color": "#0b1020" }), s("stop", { offset: "1", "stop-color": "#22325c" }))),
    s("rect", { width: 320, height: 400, fill: "url(#sky)" }),
    stars(),
    s("path", { d: "M0 370V300h22v-26h30v40h18v-60h26v86h14v-40h22v40h30V330h20v40Z", fill: "#141c36" }),
    building, marker,
    s("rect", { x: 0, y: GROUND, width: 320, height: 30, fill: "#2a2f3a" }),
    s("path", { d: "M0 386h320", stroke: "#f3d36e", "stroke-width": 2, "stroke-dasharray": "14 10" }),
    jumper);

  // ----- controls -----
  const storeyOut = h("output");
  const massOut = h("output");
  const storeyIn = h("input", { type: "range", min: 1, max: 20, step: 1, value: storeys, "aria-label": L.storeys });
  const massIn = h("input", { type: "range", min: 30, max: 120, step: 5, value: mass, "aria-label": L.mass });
  const jumpBtn = h("button", { class: "btn primary", type: "button" }, L.jump);
  const resetBtn = h("button", { class: "btn", type: "button" }, L.reset);

  const speedVal = h("b"), speedSub = h("span");
  const energyVal = h("b"), energySub = h("span");

  const bar = (cls, label) => {
    const fillEl = h("span", { class: "fill" });
    const val = h("span", { class: "val" });
    return { row: h("div", { class: `ebar ${cls}` }, h("div", { class: "lbl" }, label, " ", val), h("div", { class: "track" }, fillEl)), fillEl, val };
  };
  const keBar = bar("ke", L.ke), peBar = bar("pe", L.pe), totBar = bar("total", L.total);

  const meter = (cls) => { const f = h("span"); return { el: h("div", { class: `meter ${cls}` }, f), f }; };
  const mNeed = meter("you"), mSprint = meter(""), mJump = meter("");
  const needLbl = h("div"), sprintLbl = h("div", {}, fill(L.cmp_sprint)), jumpLbl = h("div", {}, fill(L.cmp_jump));

  const controls = h("div", { class: "controls" },
    h("label", {}, L.storeys, ": ", storeyOut), storeyIn,
    h("label", {}, L.mass, ": ", massOut), massIn,
    h("div", { class: "btn-row" }, jumpBtn, resetBtn),
    h("div", { class: "readout" },
      h("div", {}, h("span", {}, L.speed), speedVal, speedSub),
      h("div", {}, h("span", {}, L.energy), energyVal, energySub)),
    h("div", { class: "ebars", "aria-hidden": "true" }, keBar.row, peBar.row, totBar.row),
    h("div", { class: "compare" }, h("h3", {}, L.compare_title),
      needLbl, mNeed.el, sprintLbl, mSprint.el, jumpLbl, mJump.el),
  );

  const root = h("div", { class: "lab" }, h("div", { class: "scene-box" }, svg), controls);

  // ----- logic -----
  const height = () => storeys * STOREY_M;

  function drawBuilding() {
    clear(building); clear(marker);
    const top = GROUND - height() * SCALE;
    building.append(s("rect", { x: BX, y: top, width: BW, height: GROUND - top, fill: "#26345a", stroke: "#0a0f1c", "stroke-width": 2 }));
    for (let i = 0; i < storeys; i++) {
      const y = GROUND - (i + 1) * STOREY_M * SCALE + 4;
      for (let k = 0; k < 4; k++) {
        const lit = (i * 7 + k * 3) % 5 !== 0;
        building.append(s("rect", { x: BX + 10 + k * 25, y, width: 15, height: 7, fill: lit ? "#ffd27a" : "#3b4a6e" }));
      }
    }
    building.append(s("rect", { x: BX - 4, y: top - 5, width: BW + 8, height: 6, fill: "#0a0f1c" }));
    marker.append(
      s("path", { d: `M168 ${GROUND}V${top}`, stroke: "#9fe0d8", "stroke-width": 2, "stroke-dasharray": "4 4" }),
      s("path", { d: `M162 ${top}h12M162 ${GROUND}h12`, stroke: "#9fe0d8", "stroke-width": 2 }),
      s("text", { x: 160, y: Math.max(top + 4, 20), "text-anchor": "end", fill: "#9fe0d8", "font-size": 14, "font-weight": 800 }, `${fmt(height(), 0)} m`),
    );
  }

  function place(x, y) { jumper.setAttribute("transform", `translate(${x} ${GROUND - y * SCALE})`); }

  function setEnergy(v, y) {
    const total = mass * G * height();
    const ke = 0.5 * mass * v * v, pe = mass * G * y;
    keBar.fillEl.style.width = `${(ke / total) * 100}%`;
    peBar.fillEl.style.width = `${(pe / total) * 100}%`;
    totBar.fillEl.style.width = "100%";
    // Round the total and KE, then show PE as their difference so the displayed parts always add up.
    const totR = Math.round(total / 100) / 10, keR = Math.round(ke / 100) / 10;
    keBar.val.textContent = `${fmt(keR, 1)} kJ`;
    peBar.val.textContent = `${fmt(Math.max(0, totR - keR), 1)} kJ`;
    totBar.val.textContent = `${fmt(totR, 1)} kJ`;
  }

  function update() {
    cancelAnimationFrame(raf);
    const hgt = height(), v0 = speedForHeight(hgt);
    storeyOut.textContent = fill(L.storeys_val, { n: storeys, h: fmt(hgt, 0) });
    massOut.textContent = fill(L.mass_val, { m: mass });
    speedVal.textContent = `${fmt(v0, 1)} m/s`;
    speedSub.textContent = fill(L.speed_unit, { kmh: fmt(toKmh(v0), 0) });
    energyVal.textContent = `${fmt((mass * G * hgt) / 1000, 1)} kJ`;
    energySub.textContent = fill(L.energy_unit, { m: mass });
    needLbl.textContent = fill(L.cmp_needed, { v: fmt(v0, 1) });
    mNeed.f.style.width = `${Math.min(100, (v0 / MAX_CMP) * 100)}%`;
    mSprint.f.style.width = `${(REF.sprintTopSpeed / MAX_CMP) * 100}%`;
    mJump.f.style.width = `${(speedForHeight(REF.goodStandingJump) / MAX_CMP) * 100}%`;
    drawBuilding();
    lines.setAttribute("opacity", 0); sfx.setAttribute("opacity", 0);
    place(START_X, 0);
    setEnergy(v0, 0);
    jumpBtn.disabled = false;
  }

  function jump() {
    cancelAnimationFrame(raf);
    const hgt = height(), v0 = speedForHeight(hgt), T = v0 / G;
    jumpBtn.disabled = true;
    if (reduced) { place(ROOF_X, hgt); setEnergy(0, hgt); return; }
    const t0 = performance.now();
    const fly = (now) => {
      const t = (now - t0) / 1000;
      if (t >= T) { land(now); return; }
      const y = v0 * t - 0.5 * G * t * t, v = v0 - G * t;
      place(START_X, y);
      setEnergy(v, y);
      lines.setAttribute("opacity", (v / v0).toFixed(2));
      sfx.setAttribute("opacity", Math.max(0, 1 - t / 0.6).toFixed(2));
      raf = requestAnimationFrame(fly);
    };
    const land = (tLand) => {
      lines.setAttribute("opacity", 0); sfx.setAttribute("opacity", 0);
      setEnergy(0, hgt);
      const slide = (now) => {
        const k = Math.min(1, (now - tLand) / 350);
        place(START_X + (ROOF_X - START_X) * k, hgt);
        if (k < 1) raf = requestAnimationFrame(slide);
      };
      raf = requestAnimationFrame(slide);
    };
    raf = requestAnimationFrame(fly);
  }

  storeyIn.addEventListener("input", () => { storeys = Number(storeyIn.value); update(); });
  massIn.addEventListener("input", () => { mass = Number(massIn.value); update(); });
  jumpBtn.addEventListener("click", jump);
  resetBtn.addEventListener("click", update);
  update();
  return root;
}

function figure() {
  // A simple coded jumper (feet at 0,0): grey hair, green hoodie, orange headphones.
  return s("g", {},
    s("path", { d: "M-4 0l2-10M4 0l-2-10", stroke: "#111", "stroke-width": 3, "stroke-linecap": "round" }),
    s("path", { d: "M-7-10h14l-2-12h-10z", fill: "#3d6b47", stroke: "#0a0f1c", "stroke-width": 1.5 }),
    s("circle", { cx: 0, cy: -27, r: 6, fill: "#f2d6c4", stroke: "#0a0f1c", "stroke-width": 1.5 }),
    s("path", { d: "M-6.5-28a6.5 6.5 0 0 1 13 0l-2-3-3 2-2-3-2 3-3-2z", fill: "#d9dde3", stroke: "#0a0f1c", "stroke-width": 1 }),
    s("circle", { cx: -5, cy: -21, r: 2.2, fill: "#ff7d33" }), s("circle", { cx: 5, cy: -21, r: 2.2, fill: "#ff7d33" }),
  );
}

function stars() {
  const g = s("g", { fill: "#cfd8ff", opacity: 0.7 });
  for (let i = 0; i < 26; i++) {
    g.append(s("circle", { cx: (i * 73) % 320, cy: 10 + ((i * 41) % 200), r: i % 4 === 0 ? 1.4 : 0.8 }));
  }
  return g;
}
