// Interactives for chapter i3 (uniform circular motion): the ball-on-a-string lab with "Cut the string",
// and the "predict the escape path" game. Top view, anticlockwise unless a round says otherwise.
// Maths in screen-friendly "math coordinates" (x right, y up, origin at the centre); converted to SVG at draw time.
import { h, s } from "../dom.js";
import { angularSpeed, centripetalAcc, circlePeriod, fmt } from "../physics.js";

const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const C = 150;                                   // scene centre, px (both scenes are 300 × 300)
const toX = (x) => (C + x).toFixed(1), toY = (y) => (C - y).toFixed(1);

/** Number with sensible digits across 0.0125 … 1000. */
export const sig = (x) => fmt(x, x >= 100 ? 0 : x >= 10 ? 1 : x >= 1 ? 2 : 3);
/** Readout numbers for the lab: ω = v/r, T = 2π·r/v, a = v²/r (= ω²·r), string force F = m·a. */
export function circleNumbers(r, v, m) {
  const a = centripetalAcc(v, r);
  return { w: angularSpeed(v, r), T: circlePeriod(r, v), a, F: m * a };
}
/** Animation only: real time up to 3 rad/s, then compressed so a 50 rad/s spin is still watchable. */
export const shownRate = (w) => (w <= 3 ? w : 3 + 0.2 * (w - 3));
/** Distance s ≥ 0 along P + s·t until the point hits the square |x|,|y| = lim (P inside the square). */
export function exitLen(P, t, lim) {
  let best = Infinity;
  for (let i = 0; i < 2; i++) {
    if (Math.abs(t[i]) < 1e-9) continue;
    const sv = (lim * Math.sign(t[i]) - P[i]) / t[i];
    if (sv >= 0 && sv < best) best = sv;
  }
  return best;
}
/**
 * The four candidate escape paths from a ball at angle theta on a circle of radius R, spinning in direction dir (+1 anticlockwise).
 * Each is a list of [x, y]; length L px. tangent = the real one.
 */
export function escapePaths(theta, dir, R, L, n = 40) {
  const c = Math.cos(theta), sn = Math.sin(theta);
  const P = [R * c, R * sn], t = [-dir * sn, dir * c], inn = [-c, -sn]; // t = direction of motion, inn = unit vector towards the centre
  const at = (k) => (L * k) / n;
  const tangent = Array.from({ length: n + 1 }, (_, k) => [P[0] + at(k) * t[0], P[1] + at(k) * t[1]]);
  const radial = Array.from({ length: n + 1 }, (_, k) => [P[0] - at(k) * inn[0], P[1] - at(k) * inn[1]]); // straight out, away from the centre
  // keeps bending the same way, on a circle twice as wide
  const R2 = 2 * R, C2 = [P[0] + inn[0] * R2, P[1] + inn[1] * R2]; // centre of the wide circle, on the inner side
  const bend = Array.from({ length: n + 1 }, (_, k) => {
    const phi = dir * (at(k) / R2), a0 = Math.atan2(P[1] - C2[1], P[0] - C2[0]);
    return [C2[0] + R2 * Math.cos(a0 + phi), C2[1] + R2 * Math.sin(a0 + phi)];
  });
  // spirals outwards while still turning
  const spiral = Array.from({ length: n + 1 }, (_, k) => {
    const phi = (2.2 * k) / n, psi = theta + dir * phi, rho = R * (1 + 0.6 * phi);
    return [rho * Math.cos(psi), rho * Math.sin(psi)];
  });
  return { tangent, radial, bend, spiral };
}
/** Last point of a path that is still inside the square |x|,|y| ≤ lim (for placing a label). */
export function lastInside(points, lim, frac = 1) {
  let k = 0;
  points.forEach((p, i) => { if (Math.abs(p[0]) <= lim && Math.abs(p[1]) <= lim) k = i; });
  return points[Math.round(k * frac)];
}
const pathD = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${toX(p[0])} ${toY(p[1])}`).join("");
/** Arrow from (x0,y0) to (x1,y1) in math coordinates, as an SVG path with a small open head. */
function arrowD(x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, hd = Math.min(9, len * 0.5);
  const l = [x1 - hd * (ux * 0.87 - uy * 0.5), y1 - hd * (uy * 0.87 + ux * 0.5)], r = [x1 - hd * (ux * 0.87 + uy * 0.5), y1 - hd * (uy * 0.87 - ux * 0.5)];
  return `M${toX(x0)} ${toY(y0)}L${toX(x1)} ${toY(y1)}M${toX(l[0])} ${toY(l[1])}L${toX(x1)} ${toY(y1)}L${toX(r[0])} ${toY(r[1])}`;
}
const dash = (c, w = 1.5) => ({ stroke: c, "stroke-width": w, "stroke-dasharray": "4 5" });

function slider(label, min, max, step, val, show, set) {
  const out = h("output");
  const inp = h("input", { type: "range", min, max, step, value: val, "aria-label": label });
  const sync = () => { out.textContent = show(Number(inp.value)); };
  inp.addEventListener("input", () => { set(Number(inp.value)); sync(); });
  sync();
  return [h("label", {}, label, out), inp];
}

// ======================================================================================
// 1. The lab: ball on a string, with a "Cut the string" button
// ======================================================================================
const Rpx = (r) => 20 + ((r - 0.2) * 75) / 1.8;            // 0.2 m → 20 px … 2 m → 95 px
const ballPx = (m) => 5 + (4 * (m - 0.1)) / 1.9;           // 0.1 kg → 5 px … 2 kg → 9 px
const FLY_LIM = 140;                                        // the ball counts as gone once it reaches the edge of the square

export function circleLab(L, onEvent) {
  let r = 1.0, v = 5, m = 0.5, theta = 0.8, mode = "orbit";   // mode: orbit | fly | still (reduced motion) | gone
  let fly = null, raf = 0, last = 0, wait = 0;
  const reduced = rm();

  const ring = s("circle", { cx: C, cy: C, fill: "none", ...dash("rgba(255,255,255,.35)") });
  const string = s("line", { x1: C, y1: C, style: "stroke: var(--a1)", "stroke-width": 2.5, "stroke-linecap": "round" });
  const stub = s("line", { x1: C, y1: C, stroke: "rgba(255,255,255,.35)", "stroke-width": 2, "stroke-dasharray": "3 4" });
  const trail = s("line", { ...dash("#ffe14d", 1.5), fill: "none" });
  const ghostBall = s("circle", { fill: "none", ...dash("#ffe14d") });
  const disc = s("circle", { style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 2.5 });
  const vArrow = s("path", { fill: "none", stroke: "#ffe14d", "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" });
  const aArrow = s("path", { fill: "none", style: "stroke: #7de0ff", "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" });
  const vTxt = s("text", { fill: "#ffe14d", "font-size": 14, "font-weight": 800, "text-anchor": "middle" }, "v");
  const aTxt = s("text", { fill: "#7de0ff", "font-size": 14, "font-weight": 800, "text-anchor": "middle" }, "a");
  const svg = s("svg", { class: "scene", viewBox: "0 0 300 300", role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: 300, height: 300, fill: "#0a0826" }),
    ring, stub, string, trail, ghostBall, s("circle", { cx: C, cy: C, r: 5, fill: "#fff" }), disc, vArrow, aArrow, vTxt, aTxt);

  const cut = h("button", { class: "btn primary", type: "button" }, L.cut);
  const status = h("p", { class: "small", "aria-live": "polite" });
  const wV = h("b"), tV = h("b"), aV = h("b"), fV = h("b");
  const formula = h("div", { class: "formula" });
  const root = h("div", { class: "lab" },
    h("div", {}, h("div", { class: "scene-box", style: "max-width:340px;margin:0 auto" }, svg),
      h("p", { class: "small muted", style: "margin:8px 0 0;text-align:center" }, L.hint)),
    h("div", { class: "controls" },
      ...slider(L.radius, 0.2, 2, 0.05, r, (x) => `${fmt(x, 2)} m`, (x) => { r = x; back(); }),
      ...slider(L.speed, 0.5, 10, 0.1, v, (x) => `${fmt(x, 1)} m/s`, (x) => { v = x; back(); }),
      ...slider(L.mass, 0.1, 2, 0.1, m, (x) => `${fmt(x, 1)} kg`, (x) => { m = x; back(); }),
      h("div", { class: "btn-row" }, cut),
      status,
      h("div", { class: "readout" },
        h("div", {}, h("span", {}, L.omega), wV),
        h("div", {}, h("span", {}, L.period), tV),
        h("div", {}, h("span", {}, L.acc), aV),
        h("div", {}, h("span", {}, L.force), fV)),
      formula));

  function numbers() {
    const n = circleNumbers(r, v, m), cutNow = mode !== "orbit";
    wV.textContent = `${sig(n.w)} rad/s`;
    tV.textContent = `${sig(n.T)} s`;
    aV.textContent = cutNow ? "0 m/s²" : `${sig(n.a)} m/s²`;
    fV.textContent = cutNow ? "0 N" : `${sig(n.F)} N`;
    formula.textContent = cutNow
      ? L.free
      : `ω = v/r = ${fmt(v, 1)}/${fmt(r, 2)} = ${sig(n.w)} rad/s   ·   a = v²/r = ${sig(n.a)} m/s²   ·   F = m·a = ${fmt(m, 1)} × ${sig(n.a)} = ${sig(n.F)} N`;
  }

  function place(x, y, ux, uy, withAcc, R) {
    // ball at (x,y) moving along (ux,uy); acceleration arrow (if any) points to the centre
    const bR = ballPx(m), n = circleNumbers(r, v, m);
    disc.setAttribute("cx", toX(x)); disc.setAttribute("cy", toY(y)); disc.setAttribute("r", bR.toFixed(1));
    const vl = Math.min(70, 12 + 5 * v);
    vArrow.setAttribute("d", arrowD(x + ux * bR, y + uy * bR, x + ux * (bR + vl), y + uy * (bR + vl)));
    vTxt.setAttribute("x", toX(x + ux * (bR + vl + 12))); vTxt.setAttribute("y", (Number(toY(y + uy * (bR + vl + 12))) + 5).toFixed(1));
    if (withAcc) {
      const cx = -x / R, cy = -y / R;                                          // unit vector to the centre
      const al = Math.max(8, Math.min(R - bR - 3, 14 + 14 * Math.log10(1 + n.a)));
      aArrow.setAttribute("d", arrowD(x + cx * bR, y + cy * bR, x + cx * (bR + al), y + cy * (bR + al)));
      aTxt.setAttribute("x", toX(x + cx * (bR + al * 0.5) - cy * 12)); aTxt.setAttribute("y", (Number(toY(y + cy * (bR + al * 0.5) + cx * 12)) + 5).toFixed(1));
      aArrow.setAttribute("opacity", 1); aTxt.setAttribute("opacity", 1);
    } else { aArrow.setAttribute("opacity", 0); aTxt.setAttribute("opacity", 0); }
  }

  function draw() {
    const R = Rpx(r), c = Math.cos(theta), sn = Math.sin(theta), P = [R * c, R * sn], t = [-sn, c];
    ring.setAttribute("r", R.toFixed(1));
    trail.setAttribute("opacity", 0); ghostBall.setAttribute("opacity", 0);
    if (mode === "orbit") {
      string.setAttribute("opacity", 1); stub.setAttribute("opacity", 0);
      string.setAttribute("x2", toX(P[0])); string.setAttribute("y2", toY(P[1]));
      place(P[0], P[1], t[0], t[1], true, R);
      return;
    }
    // cut: the string hangs limp (a short stub at the cut point) and the ball goes straight along the tangent
    string.setAttribute("opacity", 0); stub.setAttribute("opacity", 1);
    stub.setAttribute("x2", toX(fly.px)); stub.setAttribute("y2", toY(fly.py));
    const bx = mode === "still" ? fly.px + fly.t[0] * fly.len : fly.x, by = mode === "still" ? fly.py + fly.t[1] * fly.len : fly.y;
    if (mode === "still") {
      trail.setAttribute("x1", toX(fly.px)); trail.setAttribute("y1", toY(fly.py)); trail.setAttribute("x2", toX(bx)); trail.setAttribute("y2", toY(by));
      trail.setAttribute("opacity", 0.9);
      ghostBall.setAttribute("cx", toX(fly.px)); ghostBall.setAttribute("cy", toY(fly.py)); ghostBall.setAttribute("r", ballPx(m).toFixed(1)); ghostBall.setAttribute("opacity", 0.8);
    }
    place(bx, by, fly.t[0], fly.t[1], false, R);
    if (mode === "gone") { disc.setAttribute("opacity", 0); vArrow.setAttribute("opacity", 0); vTxt.setAttribute("opacity", 0); }
    else { disc.setAttribute("opacity", 1); vArrow.setAttribute("opacity", 1); vTxt.setAttribute("opacity", 1); }
  }

  function stop() { cancelAnimationFrame(raf); raf = 0; }
  function showAll() { disc.setAttribute("opacity", 1); vArrow.setAttribute("opacity", 1); vTxt.setAttribute("opacity", 1); }
  function back() { // reattach the string and carry on round
    mode = "orbit"; fly = null; wait = 0; cut.textContent = L.cut; status.textContent = ""; showAll();
    numbers(); draw(); run();
  }
  function doCut() {
    if (mode !== "orbit") { back(); return; }
    const R = Rpx(r), c = Math.cos(theta), sn = Math.sin(theta), P = [R * c, R * sn], t = [-sn, c];
    const sp = Math.max(shownRate(angularSpeed(v, r)) * R, 45);       // px/s on screen (same speed the ball had)
    fly = { px: P[0], py: P[1], x: P[0], y: P[1], t, sp, len: exitLen(P, t, FLY_LIM) };
    mode = reduced ? "still" : "fly"; cut.textContent = L.reattach; status.textContent = L.cut_done;
    onEvent?.("cut", cut);
    numbers(); draw(); run();
  }
  function frame(now) {
    raf = 0;
    if (!root.isConnected) return;
    const dt = Math.min(now - last, 50) / 1000; last = now;
    if (mode === "orbit") theta = (theta + shownRate(angularSpeed(v, r)) * dt) % (2 * Math.PI);
    else if (mode === "fly") {
      fly.x += fly.t[0] * fly.sp * dt; fly.y += fly.t[1] * fly.sp * dt;
      if (Math.max(Math.abs(fly.x), Math.abs(fly.y)) >= FLY_LIM) { mode = "gone"; wait = 0.9; status.textContent = L.gone; }
    } else if (mode === "gone") {
      wait -= dt;
      if (wait <= 0) { back(); return; }
    }
    draw();
    raf = requestAnimationFrame(frame);
  }
  function run() {
    if (reduced || raf || mode === "still") return;
    last = performance.now(); raf = requestAnimationFrame(frame);
  }

  cut.addEventListener("click", doCut);
  numbers(); draw(); run();
  return root;
}

// ======================================================================================
// 2. The game: predict the escape path
// ======================================================================================
const ROUNDS = [
  { deg: 35, dir: 1, order: ["radial", "tangent", "bend", "spiral"] },
  { deg: 150, dir: -1, order: ["spiral", "bend", "radial", "tangent"] },
  { deg: 225, dir: 1, order: ["tangent", "spiral", "bend", "radial"] },
  { deg: 320, dir: -1, order: ["bend", "radial", "tangent", "spiral"] },
];
export const GAME_ROUNDS = ROUNDS;
const COLS = ["#ffe14d", "#7de0ff", "#ff8fd0", "#9dff9d"], LETTERS = ["A", "B", "C", "D"];
const LABEL_FRAC = { tangent: 0.9, radial: 0.9, bend: 0.55, spiral: 0.35 };   // where along each path (inside the picture) its letter sits, so letters never overlap
const GR = 70, GL = 230, G_LIM = 138, G_FLY = 150;

export function escapeGame(L, onWin) {
  let round = 0, score = 0, phase = "choose", pick = -1, ball = null, raf = 0, last = 0, won = false;
  const reduced = rm();

  const layer = s("g", {});
  const svg = s("svg", { class: "scene", viewBox: "0 0 300 300", role: "img", "aria-label": L.scene, style: "touch-action: pan-y" },
    s("rect", { width: 300, height: 300, fill: "#0a0826" }), layer);
  const status = h("p", { class: "small", "aria-live": "polite" });
  const verdict = h("p", { class: "verdict", "aria-live": "polite" });
  const next = h("button", { class: "btn primary", type: "button", hidden: true }, L.next);
  const btnRow = h("div", { class: "mini-choices" });
  const scoreV = h("b"), roundV = h("b");
  const root = h("div", { class: "lab" },
    h("div", { class: "scene-box", style: "max-width:340px;margin:0 auto" }, svg),
    h("div", { class: "controls" },
      status, btnRow,
      h("div", { class: "readout" }, h("div", {}, h("span", {}, L.round), roundV), h("div", {}, h("span", {}, L.score), scoreV)),
      verdict, h("div", { class: "btn-row" }, next)));

  const cfg = () => ROUNDS[round];
  const theta = () => (cfg().deg * Math.PI) / 180;
  const paths = () => escapePaths(theta(), cfg().dir, GR, GL);
  const correctIdx = () => cfg().order.indexOf("tangent");

  function render() {
    const cf = cfg(), th = theta(), pp = paths(), P = [GR * Math.cos(th), GR * Math.sin(th)];
    layer.replaceChildren();
    layer.append(s("circle", { cx: C, cy: C, r: GR, fill: "none", ...dash("rgba(255,255,255,.35)") }));
    // direction-of-spin hint on the far side of the circle
    const a0 = th + Math.PI, a1 = a0 + cf.dir * 0.7, ar = (a) => [GR * Math.cos(a), GR * Math.sin(a)];
    const q0 = ar(a0), q1 = ar(a1), tv = [-cf.dir * Math.sin(a1), cf.dir * Math.cos(a1)];
    layer.append(s("path", { d: `M${toX(q0[0])} ${toY(q0[1])}A${GR} ${GR} 0 0 ${cf.dir > 0 ? 0 : 1} ${toX(q1[0])} ${toY(q1[1])}`, fill: "none", stroke: "#ffe14d", "stroke-width": 3 }),
      s("path", { d: arrowD(q1[0] - tv[0] * 2, q1[1] - tv[1] * 2, q1[0] + tv[0] * 2, q1[1] + tv[1] * 2), fill: "none", stroke: "#ffe14d", "stroke-width": 3, "stroke-linejoin": "round" }));
    const reveal = phase !== "choose";
    cf.order.forEach((kind, i) => {
      const pts = pp[kind], real = kind === "tangent";
      const lab = lastInside(pts, G_LIM, LABEL_FRAC[kind]);
      const on = reveal && (real || i === pick);
      const g = s("g", { class: "esc-path", role: "button", tabindex: reveal ? "-1" : "0", "aria-label": `${L.path} ${LETTERS[i]}`, style: "cursor:pointer" },
        s("path", { d: pathD(pts), fill: "none", stroke: COLS[i], "stroke-width": reveal ? (real ? 4 : 2.5) : 2.5, "stroke-dasharray": reveal && real ? "none" : "6 6", opacity: reveal && !on ? 0.25 : 1 }),
        s("path", { d: pathD(pts), fill: "none", stroke: "rgba(0,0,0,0)", "stroke-width": 26, "pointer-events": "stroke" }),
        s("circle", { cx: toX(lab[0]), cy: toY(lab[1]), r: 12, fill: "#0a0826", stroke: COLS[i], "stroke-width": 2, opacity: reveal && !on ? 0.4 : 1 }),
        s("text", { x: toX(lab[0]), y: (Number(toY(lab[1])) + 5).toFixed(1), fill: COLS[i], "font-size": 14, "font-weight": 800, "text-anchor": "middle", opacity: reveal && !on ? 0.4 : 1 }, LETTERS[i]));
      g.addEventListener("click", () => choose(i));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(i); } });
      layer.append(g);
    });
    layer.append(s("circle", { cx: C, cy: C, r: 5, fill: "#fff" }));
    if (!reveal) layer.append(s("line", { x1: C, y1: C, x2: toX(P[0]), y2: toY(P[1]), style: "stroke: var(--a1)", "stroke-width": 2.5, "stroke-linecap": "round" }));
    else layer.append(s("line", { x1: C, y1: C, x2: toX(P[0]), y2: toY(P[1]), stroke: "rgba(255,255,255,.35)", "stroke-width": 2, "stroke-dasharray": "3 4" }));
    const b = ball || P;
    layer.append(s("circle", { cx: toX(b[0]), cy: toY(b[1]), r: 9, style: "fill: var(--a2)", stroke: "#fff", "stroke-width": 2.5 }));
    roundV.textContent = `${Math.min(round + 1, ROUNDS.length)} / ${ROUNDS.length}`;
    scoreV.textContent = `${score}`;
    btnRow.replaceChildren(...cf.order.map((kind, i) => h("button", { class: "choice", type: "button", disabled: reveal,
      "aria-label": `${L.path} ${LETTERS[i]}`, style: `border-color:${COLS[i]}`, onclick: () => choose(i) }, LETTERS[i])));
    btnRow.querySelectorAll("button").forEach((bt, i) => {
      bt.classList.toggle("correct", reveal && i === correctIdx());
      bt.classList.toggle("wrong", reveal && i === pick && i !== correctIdx());
    });
  }

  function setStatus() { status.textContent = `${cfg().dir > 0 ? L.spin_ccw : L.spin_cw} ${L.ask}`; }
  function choose(i) {
    if (phase !== "choose") return;
    pick = i; phase = "fly";
    const ok = i === correctIdx(); if (ok) score++;
    verdict.textContent = ok ? L.right : L.wrong;
    status.textContent = L.cutting;
    const th = theta(), cf = cfg();
    const P = [GR * Math.cos(th), GR * Math.sin(th)], t = [-cf.dir * Math.sin(th), cf.dir * Math.cos(th)];
    const total = exitLen(P, t, G_FLY);
    if (reduced) { ball = [P[0] + t[0] * total, P[1] + t[1] * total]; finish(); return; }
    ball = P.slice(); let travelled = 0; last = performance.now();
    const step = (now) => {
      if (!root.isConnected) return;
      const dt = Math.min(now - last, 50) / 1000; last = now;
      travelled = Math.min(total, travelled + 160 * dt);
      ball = [P[0] + t[0] * travelled, P[1] + t[1] * travelled];
      if (travelled >= total) { finish(); return; }
      render(); raf = requestAnimationFrame(step);
    };
    render(); raf = requestAnimationFrame(step);
  }
  function finish() {
    phase = "done"; render();
    status.textContent = L.explain;
    next.hidden = false; next.textContent = round + 1 < ROUNDS.length ? L.next : L.finish;
    if (round + 1 >= ROUNDS.length) { next.hidden = false; }
  }
  next.addEventListener("click", () => {
    if (round + 1 < ROUNDS.length) { round++; phase = "choose"; pick = -1; ball = null; verdict.textContent = ""; next.hidden = true; setStatus(); render(); return; }
    if (phase === "over") { round = 0; score = 0; phase = "choose"; pick = -1; ball = null; verdict.textContent = ""; next.hidden = true; setStatus(); render(); return; }
    // end of the last round
    phase = "over";
    const good = score >= 3;
    verdict.textContent = `${score} / ${ROUNDS.length}. ${good ? L.win : L.again_msg}`;
    next.textContent = L.again; status.textContent = "";
    if (good && !won) { won = true; onWin?.(next); }
  });

  setStatus(); render();
  return root;
}
