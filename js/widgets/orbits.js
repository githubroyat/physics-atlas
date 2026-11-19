// Interactives for chapter i4 (orbits): Newton's cannon, "park the satellite", and the flat-vs-banked bend.
// Model for the cannon: gravity only, a = −G·M/r² towards Earth's centre, stepped with fixed-step leapfrog (kick-drift-kick, dt = 2 s).
// All numbers come from physics.js (booklet M and R). r is always measured from Earth's centre.
import { h, s, richInline } from "../dom.js";
import { GRAV_CONST, EARTH, orbitSpeed, orbitPeriod, fmt } from "../physics.js";

const { M, R } = EARTH;
const GM = GRAV_CONST * M;
const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const TAU = 2 * Math.PI;

export const SIDEREAL = 86160;                       // s, 23 h 56 min: one turn of the Earth relative to the stars
/** Kilometres from metres, with narrow no-break spaces instead of commas: 42157731 → "42 158". */
export const kmStr = (m) => fmt(m / 1e3, 0).replace(/,/g, " ");
/** Duration as "H h MM min". */
export function hm(sec) {
  let hh = Math.floor(sec / 3600), mm = Math.round((sec - hh * 3600) / 60);
  if (mm === 60) { hh += 1; mm = 0; }
  return `${hh} h ${String(mm).padStart(2, "0")} min`;
}
const dur = (sec) => (sec < 7200 ? `${fmt(sec / 60, 1)} min` : `${fmt(sec / 3600, 1)} h`);

// ======================================================================================
// PHYSICS (move to physics.js): Newton's cannon, fixed-step leapfrog
// ======================================================================================
export const CANNON = { h: 4e5, r0: R + 4e5, vMaxKm: 10, vStepKm: 0.01, dt: 2 };

/** A cannonball fired horizontally from r0 (a 400 km tower, above the air) at v0 (m/s). status: flying | crash | orbit. */
export function makeCannon(v0) {
  const { r0, dt } = CANNON;
  const sim = { x: 0, y: r0, vx: v0, vy: 0, t: 0, swept: 0, rmin: r0, rmax: r0, status: "flying", lap: null, impact: null, pts: [[0, r0]] };
  const kick = (hd) => { const r = Math.hypot(sim.x, sim.y), k = (-GM / (r * r * r)) * hd; sim.vx += k * sim.x; sim.vy += k * sim.y; };
  sim.step = () => {
    if (sim.status !== "flying") return;
    const a0 = Math.atan2(sim.x, sim.y);
    kick(dt / 2); sim.x += sim.vx * dt; sim.y += sim.vy * dt; kick(dt / 2);
    sim.t += dt;
    const r = Math.hypot(sim.x, sim.y);
    if (r <= R) {                                           // hit the ground: stop on the surface
      sim.x *= R / r; sim.y *= R / r; sim.rmin = R; sim.status = "crash"; sim.impact = Math.hypot(sim.vx, sim.vy); return;
    }
    sim.rmin = Math.min(sim.rmin, r); sim.rmax = Math.max(sim.rmax, r);
    let d = Math.atan2(sim.x, sim.y) - a0;
    if (d > Math.PI) d -= TAU; else if (d < -Math.PI) d += TAU;
    sim.swept += d;
    if (Math.abs(sim.swept) >= TAU) { sim.status = "orbit"; sim.lap = sim.t; }
    else if (sim.t > 3e5) { sim.status = "orbit"; sim.lap = null; }     // safety net, never reached with the slider range
  };
  return sim;
}
/** Run the whole flight without drawing (reduced motion, tests). Keeps every 8th point. */
export function runCannon(v0) {
  const sim = makeCannon(v0);
  for (let n = 0; sim.status === "flying" && n < 400000; n++) { sim.step(); if (n % 8 === 0) sim.pts.push([sim.x, sim.y]); }
  sim.pts.push([sim.x, sim.y]);
  return sim;
}
/** Shape of a finished orbit from its measured lowest and highest radius. e < 1 % counts as a circle. */
export function shapeOf(rmin, rmax) { return (rmax - rmin) / (rmax + rmin) < 0.01 ? "circle" : "ellipse"; }
/** Launch-radius quantities (horizontal launch at r0): the circular speed and the escape speed (bonus). */
export const circularSpeed0 = () => orbitSpeed(M, CANNON.r0);
export const escapeSpeed0 = () => Math.sqrt((2 * GM) / CANNON.r0);

// ---------- drawing helpers ----------
const dash = (c) => ({ stroke: c, "stroke-width": 1.5, "stroke-dasharray": "4 5" });
function slider(label, min, max, step, val, show, set) {
  const out = h("output");
  const inp = h("input", { type: "range", min, max, step, value: val, "aria-label": label });
  const sync = () => { out.textContent = show(Number(inp.value)); };
  inp.addEventListener("input", () => { set(Number(inp.value)); sync(); });
  sync();
  return { row: [h("label", {}, label, out), inp], inp, sync };
}
function arrow(x, y, len, ang, color, w = 3) {          // ang in radians, screen coordinates (0 = right, π/2 = down)
  const x2 = x + len * Math.cos(ang), y2 = y + len * Math.sin(ang), hs = 8;
  const p = (da, d) => `${(x2 - d * Math.cos(ang + da)).toFixed(1)},${(y2 - d * Math.sin(ang + da)).toFixed(1)}`;
  return s("g", {}, s("path", { d: `M${x.toFixed(1)} ${y.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`, stroke: color, "stroke-width": w, "stroke-linecap": "round" }),
    s("path", { d: `M${x2.toFixed(1)} ${y2.toFixed(1)}L${p(0.45, hs)}L${p(-0.45, hs)}Z`, fill: color }));
}

// ======================================================================================
// 1. Newton's cannon
// ======================================================================================
const CX = 150, CY = 150, PXHALF = 138;

export function cannonLab(L, onEvent) {
  const { r0, vMaxKm } = CANNON;
  const vc = circularSpeed0();
  let vKm = 6.0, half = 1.3 * r0, sim = null, raf = 0, last = 0, shown = 0, finished = false;
  const reduced = rm();
  const sc = () => PXHALF / half;
  const sx = (x) => CX + x * sc(), sy = (y) => CY - y * sc();

  // ----- scene -----
  const earth = s("circle", { cx: CX, cy: CY, fill: "#1d4e89", stroke: "#8fb8ff", "stroke-width": 2 });
  const tower = s("path", { stroke: "#c4bce8", "stroke-width": 3, "stroke-linecap": "round" });
  const gun = s("g", {}, s("rect", { x: -3, y: -5, width: 22, height: 10, rx: 3, fill: "#ffe14d" }), s("circle", { cx: 0, cy: 0, r: 6, fill: "#ffe14d" }));
  const trail = s("path", { fill: "none", style: "stroke: var(--a2)", "stroke-width": 2, "stroke-linejoin": "round" });
  const ball = s("circle", { r: 5, fill: "#fff", stroke: "#ffe14d", "stroke-width": 2 });
  const boom = s("text", { "text-anchor": "middle", "font-size": 16, "font-weight": 800, fill: "#ff8a5c", opacity: 0 }, L.boom);
  const svg = s("svg", { class: "scene", viewBox: "0 0 300 300", role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: 300, height: 300, fill: "#0a0826" }), earth, tower, trail, gun, ball, boom);

  // ----- controls & readouts -----
  const sl = slider(L.speed, 0, vMaxKm, CANNON.vStepKm, vKm, (v) => `${fmt(v, 2)} km/s`, (v) => { vKm = v; reset(); if (reduced) fire(); });
  const go = h("button", { class: "btn primary", type: "button" }, L.fire);
  const back = h("button", { class: "btn", type: "button" }, L.reset);
  const status = h("p", { class: "small", "aria-live": "polite" });
  const vVal = h("b"), cVal = h("b"), lowVal = h("b"), highVal = h("b"), tVal = h("b"), resVal = h("b");
  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:340px;margin:0 auto" }, svg),
      h("p", { class: "small muted", style: "margin:8px 0 0;text-align:center" }, L.scene_note)),
    h("div", { class: "controls" }, ...sl.row,
      h("div", { class: "btn-row" }, go, back), status,
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.r_launch), vVal),
        h("div", {}, h("span", {}, L.r_circ), cVal),
        h("div", {}, h("span", {}, L.r_low), lowVal),
        h("div", {}, h("span", {}, L.r_high), highVal),
        h("div", {}, h("span", {}, L.r_time), tVal),
        h("div", {}, h("span", {}, L.r_result), resVal))));

  const clampV = (x) => Math.max(0, Math.min(vMaxKm, x));
  function readouts() {
    vVal.textContent = `${fmt(vKm, 2)} km/s`;
    cVal.textContent = `${fmt(vc / 1e3, 2)} km/s`;
    const sm = sim;
    if (!sm) { lowVal.textContent = "—"; highVal.textContent = "—"; tVal.textContent = "—"; return; }
    lowVal.textContent = sm.status === "crash" ? `0 km (${L.ground})` : `${kmStr(sm.rmin - R)} km`;
    highVal.textContent = `${kmStr(sm.rmax - R)} km`;
    tVal.textContent = sm.status === "orbit" && sm.lap ? `${dur(sm.lap)} (${L.one_lap})` : dur(sm.t);
  }
  function draw() {
    const rr = R * sc();
    earth.setAttribute("r", rr.toFixed(1));
    tower.setAttribute("d", `M${CX} ${sy(R).toFixed(1)}L${CX} ${sy(r0).toFixed(1)}`);
    gun.setAttribute("transform", `translate(${CX} ${sy(r0).toFixed(1)})`);
    const pts = sim ? sim.pts : [];
    trail.setAttribute("d", pts.length > 1 ? "M" + pts.map((p) => `${sx(p[0]).toFixed(1)} ${sy(p[1]).toFixed(1)}`).join("L") : "");
    if (sim) {
      ball.setAttribute("cx", sx(sim.x).toFixed(1)); ball.setAttribute("cy", sy(sim.y).toFixed(1)); ball.setAttribute("opacity", 1);
    } else { ball.setAttribute("cx", CX); ball.setAttribute("cy", sy(r0).toFixed(1)); ball.setAttribute("opacity", 0); }
    if (sim && sim.status === "crash") {
      boom.setAttribute("x", Math.max(40, Math.min(260, sx(sim.x))).toFixed(1)); boom.setAttribute("y", Math.min(285, sy(sim.y) + 26).toFixed(1)); boom.setAttribute("opacity", 1);
    } else boom.setAttribute("opacity", 0);
    readouts();
  }
  function conclude() {
    if (finished || !sim) return;
    if (sim.status === "crash") { finished = true; status.textContent = L.s_crash; resVal.textContent = L.crash; return; }
    if (sim.status !== "orbit") return;
    finished = true;
    const shape = shapeOf(sim.rmin, sim.rmax);
    status.textContent = shape === "circle" ? L.s_circle : L.s_ellipse;
    resVal.textContent = shape === "circle" ? L.circle : L.ellipse;
    onEvent?.(shape, go);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  function reset() { stop(); sim = null; finished = false; half = 1.3 * r0; shown = 0; status.textContent = ""; resVal.textContent = "—"; draw(); }
  function zoomFor(v) { const k = (v * v * r0) / GM; half = k > 1 && k < 1.999 ? Math.max(1.3 * r0, 1.1 * ((r0 * k) / (2 - k))) : 1.3 * r0; }
  function fire() {
    stop(); const v = clampV(vKm) * 1e3; finished = false; resVal.textContent = "—";
    zoomFor(v);
    if (reduced) { sim = runCannon(v); status.textContent = ""; draw(); conclude(); return; }
    sim = makeCannon(v); last = performance.now(); status.textContent = L.s_fly; draw();
    raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    if (!sim) return;
    if (!root.isConnected) { stop(); return; }
    last = now;
    // steps per frame so that the ball moves about 2.5 px per frame at any speed (and zoom)
    const sp = Math.hypot(sim.vx, sim.vy), n = Math.max(1, Math.min(60, Math.round(2.5 / sc() / (Math.max(sp, 1) * CANNON.dt))));
    for (let i = 0; i < n && sim.status === "flying"; i++) sim.step();
    sim.pts.push([sim.x, sim.y]);
    draw();
    if (sim.status === "flying") raf = requestAnimationFrame(frame); else conclude();
  }
  go.addEventListener("click", fire);
  back.addEventListener("click", reset);
  sl.sync();
  reset();
  if (reduced) fire();
  return root;
}

// ======================================================================================
// 2. Park the satellite: choose the radius so that one lap takes the target time
// ======================================================================================
export const PARK = { rMin: R + 2e5, rMax: 4.6e7, steps: 1000, tol: 0.02, targets: [7200, 21600, 43200, SIDEREAL] };
/** Orbit radius (m, from Earth's centre) for slider position 0…steps: a log scale, so small radii are not cramped. */
export const parkRadius = (pos) => PARK.rMin * (PARK.rMax / PARK.rMin) ** (pos / PARK.steps);
export const parkPos = (r) => Math.round((PARK.steps * Math.log(r / PARK.rMin)) / Math.log(PARK.rMax / PARK.rMin));

export function parkLab(L, onEvent) {
  let pos = parkPos(R + 4e5), target = null, t = 0, raf = 0, last = 0, parked = false;
  const reduced = rm();
  const TS = SIDEREAL / 20;                                  // time-lapse: one sidereal day in 20 s
  const px = (r) => (r / PARK.rMax) * 135;
  const earthPx = px(R);

  // ----- scene -----
  const ring = s("circle", { cx: CX, cy: CY, fill: "none", ...dash("rgba(255,255,255,.55)") });
  const link = s("path", { stroke: "#ffe14d", "stroke-width": 1.5, opacity: 0.7 });
  const house = s("g", {}, s("rect", { x: -5, y: -5, width: 10, height: 10, fill: "#ffe14d", stroke: "#fff", "stroke-width": 1.5 }));
  const sat = s("g", {}, s("rect", { x: -9, y: -2.5, width: 18, height: 5, style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 1 }), s("rect", { x: -3, y: -4, width: 6, height: 8, fill: "#fff" }));
  const svg = s("svg", { class: "scene", viewBox: "0 0 300 300", role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: 300, height: 300, fill: "#0a0826" }),
    s("circle", { cx: CX, cy: CY, r: earthPx, fill: "#1d4e89", stroke: "#8fb8ff", "stroke-width": 2 }),
    ring, link, house, sat);

  // ----- controls & readouts -----
  const sl = slider(L.radius, 0, PARK.steps, 1, pos, () => `${kmStr(parkRadius(pos))} km`, (v) => { pos = v; onChange(); });
  const lower = h("button", { class: "btn", type: "button", "aria-label": L.lower }, "−");
  const higher = h("button", { class: "btn", type: "button", "aria-label": L.higher }, "+");
  const nudge = (d) => { pos = Math.max(0, Math.min(PARK.steps, pos + d)); sl.inp.value = String(pos); sl.sync(); onChange(); };
  lower.addEventListener("click", () => nudge(-1)); higher.addEventListener("click", () => nudge(1));
  const targets = [h("button", { class: "pill", type: "button", "aria-pressed": "true" }, L.free)];
  const pickTarget = (i) => { target = i; parked = false; verdict.textContent = ""; tgtVal.textContent = target == null ? "—" : hm(PARK.targets[target]); targets.forEach((b, j) => b.setAttribute("aria-pressed", String(j === i + 1))); go.disabled = target == null; };
  targets[0].addEventListener("click", () => pickTarget(null));
  PARK.targets.forEach((T, i) => {
    const b = h("button", { class: "pill", type: "button", "aria-pressed": "false" }, hm(T));
    b.addEventListener("click", () => pickTarget(i));
    targets.push(b);
  });
  const go = h("button", { class: "btn primary", type: "button", disabled: true }, L.park);
  const rVal = h("b"), hVal = h("b"), vVal = h("b"), tVal = h("b"), tgtVal = h("b", {}, "—");
  const verdict = h("p", { class: "verdict", "aria-live": "polite" });
  const root = h("div", { class: "lab" },
    h("div", { class: "scene-box", style: "max-width:340px;margin:0 auto" }, svg),
    h("div", { class: "controls" },
      h("label", {}, L.target),
      h("div", { class: "toggle-row", style: "margin-top:4px" }, targets),
      ...sl.row,
      h("div", { class: "btn-row" }, lower, higher, go),
      verdict,
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.r_radius), rVal),
        h("div", {}, h("span", {}, L.r_height), hVal),
        h("div", {}, h("span", {}, L.r_speed), vVal),
        h("div", {}, h("span", {}, L.r_period), tVal),
        h("div", {}, h("span", {}, L.r_target), tgtVal)),
      h("p", { class: "small muted" }, L.note)));

  const radius = () => parkRadius(pos);
  function readouts() {
    const r = radius();
    rVal.textContent = `${kmStr(r)} km`;
    hVal.textContent = `${kmStr(r - R)} km`;
    vVal.textContent = `${fmt(orbitSpeed(M, r) / 1e3, 2)} km/s`;
    tVal.textContent = hm(orbitPeriod(M, r));
  }
  function draw() {
    const r = radius(), T = orbitPeriod(M, r);
    const a = TAU * (t / T), b = TAU * (t / SIDEREAL);
    const sxp = CX + px(r) * Math.cos(a), syp = CY - px(r) * Math.sin(a);
    const hx = CX + earthPx * Math.cos(b), hy = CY - earthPx * Math.sin(b);
    ring.setAttribute("r", px(r).toFixed(1));
    sat.setAttribute("transform", `translate(${sxp.toFixed(1)} ${syp.toFixed(1)}) rotate(${(-a * 180 / Math.PI + 90).toFixed(1)})`);
    house.setAttribute("transform", `translate(${hx.toFixed(1)} ${hy.toFixed(1)})`);
    link.setAttribute("d", `M${hx.toFixed(1)} ${hy.toFixed(1)}L${sxp.toFixed(1)} ${syp.toFixed(1)}`);
  }
  function onChange() { parked = false; verdict.textContent = ""; readouts(); draw(); }
  function check() {
    if (target == null) return;
    const T = orbitPeriod(M, radius()), Tt = PARK.targets[target], ok = Math.abs(T / Tt - 1) <= PARK.tol;
    verdict.textContent = ok ? (Tt === SIDEREAL ? L.ok_geo : L.ok) : T > Tt ? L.too_slow : L.too_fast;
    if (ok && !parked) { parked = true; onEvent?.("park", go); if (Tt === SIDEREAL) onEvent?.("geo", go); }
  }
  function frame(now) {
    if (!root.isConnected) { raf = 0; return; }
    t += Math.min(now - last, 50) / 1000 * TS; last = now;
    draw();
    raf = requestAnimationFrame(frame);
  }
  go.addEventListener("click", check);
  readouts();
  if (reduced) { t = 0.2 * SIDEREAL; draw(); }
  else { last = performance.now(); draw(); raf = requestAnimationFrame(frame); }
  return root;
}

// ======================================================================================
// 3. Flat vs banked bend (qualitative): cross-section of a car on a bend, centre of the bend on the right
// ======================================================================================
export function bendDemo(L, onEvent) {
  let banked = false, icy = false;
  const seen = new Set(["flat-dry"]);
  const BANK = 20 * Math.PI / 180;
  const P = [150, 112];                                         // the car's centre of mass
  const svg = s("svg", { class: "scene", viewBox: "0 0 300 200", role: "img", "aria-label": L.scene, style: "touch-action: pan-y" });
  const info = h("div", { "aria-live": "polite" });
  const mk = (label, on) => { const b = h("button", { class: "pill", type: "button", "aria-pressed": "false" }, label); b.addEventListener("click", () => on(b)); return b; };
  const pFlat = mk(L.flat, () => { banked = false; draw(); }), pBank = mk(L.banked, () => { banked = true; draw(); });
  const pDry = mk(L.dry, () => { icy = false; draw(); }), pIce = mk(L.icy, () => { icy = true; draw(); });
  const root = h("div", { class: "lab" },
    h("div", { class: "scene-box", style: "max-width:340px;margin:0 auto" }, svg),
    h("div", { class: "controls" },
      h("label", {}, L.road), h("div", { class: "toggle-row", style: "margin:4px 0 8px" }, pFlat, pBank),
      h("label", {}, L.surface), h("div", { class: "toggle-row", style: "margin:4px 0 8px" }, pDry, pIce),
      info));

  function draw() {
    const th = banked ? BANK : 0, mode = `${banked ? "banked" : "flat"}-${icy ? "icy" : "dry"}`;
    seen.add(mode);
    pFlat.setAttribute("aria-pressed", String(!banked)); pBank.setAttribute("aria-pressed", String(banked));
    pDry.setAttribute("aria-pressed", String(!icy)); pIce.setAttribute("aria-pressed", String(icy));
    const deg = (th * 180) / Math.PI;
    const n = [Math.sin(th), -Math.cos(th)], tg = [Math.cos(th), Math.sin(th)];   // normal (up, towards the centre when banked) and slope direction
    const kids = [
      s("rect", { width: 300, height: 200, fill: "#0a0826" }),
      s("g", { transform: `rotate(${deg.toFixed(1)} 150 140)` },
        s("rect", { x: -40, y: 140, width: 380, height: 16, fill: "#3a2f80" }),
        s("rect", { x: 118, y: 112, width: 64, height: 28, rx: 8, style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 2 }),
        s("circle", { cx: 132, cy: 140, r: 6, fill: "#222" }), s("circle", { cx: 168, cy: 140, r: 6, fill: "#222" })),
      s("path", { d: "M70 22H220", ...dash("rgba(255,255,255,.55)") }),
      arrow(200, 22, 50, 0, "#ffe14d", 2),
      s("text", { x: 150, y: 14, "text-anchor": "middle", fill: "#ffe14d", "font-size": 12, "font-weight": 800 }, L.centre),
      s("circle", { cx: P[0], cy: P[1], r: 3, fill: "#fff" }),
      arrow(P[0], P[1], 52, Math.PI / 2, "#c4bce8"),                                    // weight, straight down
      arrow(P[0], P[1], 52 / Math.cos(th), Math.atan2(n[1], n[0]), banked ? "#ffe14d" : "#c4bce8"), // normal force, perpendicular to the road
    ];
    if (!icy) kids.push(arrow(P[0], P[1], banked ? 18 : 46, Math.atan2(tg[1], tg[0]), "#ffe14d"));   // friction along the road, towards the centre
    else if (!banked) kids.push(arrow(P[0], P[1] - 28, 38, Math.PI, "#ff8a5c", 2), s("text", { x: 70, y: 70, "text-anchor": "middle", fill: "#ff8a5c", "font-size": 12, "font-weight": 800 }, L.slides));
    kids.push(
      s("text", { x: P[0] + 6, y: P[1] + 66, fill: "#c4bce8", "font-size": 12, "font-weight": 800 }, "m·g"),
      s("text", { x: P[0] - 12 + (banked ? 34 : 0), y: P[1] - 62, fill: banked ? "#ffe14d" : "#c4bce8", "font-size": 12, "font-weight": 800 }, "N"));
    if (!icy) kids.push(s("text", { x: P[0] + (banked ? 58 : 66), y: P[1] + (banked ? 34 : 4), fill: "#ffe14d", "font-size": 12, "font-weight": 800 }, "F_{fr}"));
    svg.replaceChildren(...kids);
    info.replaceChildren(h("p", { class: "small" }, richInline(L.modes[mode])));
    if (seen.size === 4) onEvent?.("bend", info);
  }
  draw();
  return root;
}
