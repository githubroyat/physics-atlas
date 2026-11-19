// Chapter i1: Position as a function of time (S6 Interactions: s(t) = s0 + v0·t + ½·a·t², v(t) = v0 + a·t, v = Δs/Δt,
// a = Δv/Δt; slope of s–t is v, slope of v–t is a, area under v–t is the displacement; free fall a = −g; a charge in a
// uniform electric field a = q·E/m).
// Teach-first layout: goals → warm-up → learn steps with checks → worked examples → practice → explore → summary
// → quiz → BONUS (derivatives, v² = v0² + 2·a·Δs and stopping distances, Galileo's odd numbers).
import { h, s, rich } from "../dom.js";
import { motionLab, matchGraph, chargeLab, chargeRun } from "../widgets/motiongraphs.js";
import {
  panel, say, vote, quickfire, choiceSteps, comic, chapterHead, simCard, chapterNav,
  award, fillStr, syncStrip, gate, goals, quickCheck, worked, practice, summary, bonusDivider, PREVIEW, useFill
} from "../engine.js";
import { crystalsIn } from "../store.js";
import { splitFig, threeFig, THREE } from "./i1-figs.js";
import { G, posAt, velAt, sci, fmt, M_PROTON, M_ELECTRON, E_CHARGE, LIGHT_SPEED, chargeAcc } from "../physics.js";

const SIM_URL = "https://phet.colorado.edu/sims/html/calculus-grapher/latest/calculus-grapher_en.html";
export const AWARD_KEYS = [
  "warmup", "check1", "check2", "check3", "check4", "check5", "check6", "derive", "run", "brake", "charge",
  "game", "practice", "story", "quiz", "b-calc", "b-v2", "b-odd",
];
const SLOTS = AWARD_KEYS.length;

const f1 = (x) => fmt(x, 1), f2 = (x) => fmt(x, 2), f3 = (x) => fmt(x, 3), f0 = (x) => fmt(x, 0);

/** Every number in the prose, from physics.js (posAt, velAt, chargeRun → chargeAcc, uniformField). */
export function numbers() {
  const N = { g: f2(G) };
  // step 1: uniform motion
  N.paceV = f2(10 / 8);
  N.runS = f0(posAt(20, -4, 0, 3));
  N.c1s = f0(posAt(30, -5, 0, 4)); N.c1w1 = f0(30 + 5 * 4); N.c1w2 = f0(-5 * 4); N.c1w3 = f0(30 - 5);
  N.figV = f1((30 - 10) / 5);
  // step 2: acceleration
  N.accC = f1((8 - 20) / 3); N.vScoot = f1(velAt(2, 1.5, 4));
  N.c2a = f1((16 - 4) / 3); N.c2w1 = f1(16 / 3); N.c2w2 = f0(16 - 4); N.c2w3 = f2(3 / (16 - 4));
  // step 3: area under v–t
  N.c3 = f0(0.5 * 6 * 12); N.c3w1 = f0(12 * 6); N.c3w2 = f1(12 / 6); N.c3w3 = f0(12 + 6);
  N.figAcc = f1((10 - 4) / 6); N.figRect = f0(4 * 6); N.figTri = f0(0.5 * 6 * (10 - 4)); N.figArea = f0(((4 + 10) / 2) * 6); N.figArea2 = f0(posAt(0, 4, (10 - 4) / 6, 6));
  // step 4: the lab presets
  N.labConstS = f0(posAt(0, 3, 0, 6));
  N.brakeBack = f0(posAt(0, 10, -2.5, 6)); N.brakeT = f1(10 / 2.5); N.brakeD = f0(posAt(0, 10, -2.5, 10 / 2.5));
  const dropT = Math.sqrt((2 * 20) / G);
  N.dropT = f2(dropT); N.dropV = f1(-velAt(0, -G, dropT)); N.dropVE = f1(Math.sqrt(2 * G * 20));
  N.upT = f2(10 / G); N.upH = f2(posAt(0, 10, -G, 10 / G)); N.upHE = f2(100 / (2 * G));
  N.c4a = f1((10 - 2) / 4); N.c4w1 = f1(10 / 4); N.c4w2 = f1(10 - 2); N.c4w3 = f1(10 + 2);
  // step 5: free fall
  N.ff2v = f1(velAt(0, -G, 2)); N.ff2s = f1(-posAt(0, 0, -G, 2));
  N.c5v = f1(Math.sqrt(2 * G * 5)); N.c5w1 = f0(G * 5); N.c5w2 = f1(Math.sqrt(G * 5)); N.c5w3 = f1(2 * G * 5);
  // step 6: charge in a field (the lab's start values: electron, U = 100 V, d = 2.5 cm); printed with 3 s.f.
  const e = chargeRun("electron", 100, 2.5);
  N.chE = sci(e.E, 3); N.chF = sci(e.F, 3); N.chA = sci(e.a, 3); N.chT = sci(e.T, 3); N.chV = sci(e.v, 3); N.chVE = sci(e.vEnergy, 3);
  N.chC = f0((e.v / LIGHT_SPEED) * 100);
  N.massRatio = String(Math.round(M_PROTON / M_ELECTRON / 10) * 10);   // "about 1840"
  N.chWt = sci(e.m * G, 2); N.chWr = sci(e.F / (e.m * G), 2);
  N.c6w1 = f1((M_ELECTRON / 1e-31) / (M_PROTON / 1e-27));   // slip: divide only the numbers in front (9.109 / 1.673), ignore the powers of ten
  // worked example 1: braking car
  const w1 = { v0: 20, a: -5 }, w1t = -w1.v0 / w1.a, w1s = posAt(0, w1.v0, w1.a, w1t);
  N.we1kmh = f0(w1.v0 * 3.6); N.we1t = f1(w1t); N.we1s = f0(w1s); N.we1half = f0(0.5 * w1.a * w1t * w1t); N.we1v0t = f0(w1.v0 * w1t);
  N.we1tri = f0(0.5 * w1t * w1.v0);
  // worked example 2: electron, U = 150 V, d = 3.0 cm (every printed step re-computes from the printed ones at 3 s.f.)
  const w2 = chargeRun("electron", 150, 3);
  N.we2E = sci(w2.E, 3); N.we2a = sci(w2.a, 3); N.we2t2 = sci((2 * w2.d) / Number(w2.a.toPrecision(3)), 3); N.we2t = sci(w2.T, 3); N.we2v = sci(w2.v, 3); N.we2vE = sci(w2.vEnergy, 3);
  N.we2c = f1((w2.v / LIGHT_SPEED) * 100);
  // practice
  N.p1kmh = f0(2.5 * 8 * 3.6);
  N.p1 = f1(2.5 * 8); N.p1w1 = f1(0.5 * 2.5 * 8); N.p1w2 = f1(8 / 2.5); N.p1w3 = f1(0.5 * 2.5 * 64);
  N.p2 = f1((0 - 40) / 10); N.p2w1 = f1(40 / 10); N.p2w2 = fmt(10 / (0 - 40), 2); N.p2w3 = f1(40);
  N.p3 = f1(-posAt(0, 0, -G, 2.5)); N.p3w1 = f1(G * 2.5); N.p3w2 = f1(G * 6.25); N.p3w3 = f1(0.5 * G * 2.5);
  N.p4 = f0(((6 + 14) / 2) * 4); N.p4w1 = f0(14 * 4); N.p4w2 = f0(6 * 4); N.p4w3 = f0(0.5 * 14 * 4); N.p4rect = f0(6 * 4); N.p4tri = f0(0.5 * 4 * (14 - 6)); N.p4avg = f0((6 + 14) / 2);
  const pa = chargeAcc(E_CHARGE, 2.0e4, M_PROTON), pae = chargeAcc(E_CHARGE, 2.0e4, M_ELECTRON);
  N.p5 = sci(pa, 3); N.p5w1 = sci(E_CHARGE * 2.0e4, 4); N.p5w2 = sci(pae, 3); N.p5w3 = sci(2.0e4 / M_PROTON, 3);   // slip: forgot the charge, a = E/m
  // worked example 3: a tram (0 → 6.0 m/s in 8.0 s, cruise 20 s, brake to rest in 4.0 s)
  const tr = { v: 6, t1: 8, t2: 20, t3: 4 };
  N.trA1 = f2(tr.v / tr.t1); N.trA3 = f1(-tr.v / tr.t3);
  N.trS1 = f0(0.5 * tr.t1 * tr.v); N.trS2 = f0(tr.v * tr.t2); N.trS3 = f0(0.5 * tr.t3 * tr.v);
  const trS = 0.5 * tr.t1 * tr.v + tr.v * tr.t2 + 0.5 * tr.t3 * tr.v;
  N.trS = f0(trS); N.trAvg = f1(trS / (tr.t1 + tr.t2 + tr.t3));
  // figure 2 (the scooter of step 2: v0 = 2.0 m/s, a = 1.5 m/s², 4.0 s); the figure draws from the same numbers
  N.thV = f1(velAt(THREE.v0, THREE.a, THREE.T / 2)); N.thA = f1(THREE.a);
  // experiment: a ball from rest on a gentle ramp, a ≈ 0.20 m/s² (an illustrative value)
  const ea = 0.2, ep = (k) => posAt(0, 0, ea, 0.5 * k) * 100;
  N.expA = f2(ea); N.expK = f2(0.5 * ea);
  [1, 2, 3, 4, 5].forEach((k) => { N["expS" + k] = f1(ep(k)); N["expR" + k] = f0(ep(k) / ep(1)); });
  N.expS4m = f3(ep(4) / 100); N.expT4 = f1(0.5 * 4);   // the worked a = 2·s/t² line: 2 × 0.400 m / (2.0 s)²
  [0.1, 0.4, 0.9].forEach((m, i) => { N["expM" + (i + 1)] = f0(m * 100); N["expT" + (i + 1)] = f1(Math.sqrt((2 * m) / ea)); });
  // quiz
  N.qTop = f2(-G);
  // bonus: derivative
  N.bV = f0(2 + 6 * 1); N.bA = f0(6); N.bS1 = f0(5 + 2 * 1 + 3 * 1); N.bW = f0(5);
  // bonus: braking distances (dry road, a = −6.0 m/s²), 1.0 s reaction time
  const d = (kmh, a) => ((kmh / 3.6) ** 2) / (2 * a);     // 54 km/h = 15 m/s and 108 km/h = 30 m/s: whole numbers
  N.vS = f0(54 / 3.6); N.vF = f0(108 / 3.6); N.dS = f1(d(54, 6)); N.dF = f1(d(108, 6)); N.dRatio = f0(d(108, 6) / d(54, 6));
  N.rS = f0(54 / 3.6); N.rF = f0(108 / 3.6); N.tS = f1(d(54, 6) + 54 / 3.6); N.tF = f1(d(108, 6) + 108 / 3.6);
  N.bT = f1((108 / 3.6) / 6); N.bTS = f1((54 / 3.6) / 6);
  // bonus: Galileo's odd numbers (successive seconds from rest, a = g)
  const tot = [1, 2, 3, 4].map((n) => 0.5 * G * n * n);
  N.o1 = f3(tot[0]); N.o2 = f3(tot[1] - tot[0]); N.o3 = f3(tot[2] - tot[1]); N.o4 = f3(tot[3] - tot[2]);
  N.oq3 = f0((tot[1] - tot[0]) / tot[0]); N.oq5 = f0((tot[2] - tot[1]) / tot[0]); N.oq7 = f0((tot[3] - tot[2]) / tot[0]); N.oq9 = f0(tot[2] / tot[0]); N.oq4 = f0(tot[1] / tot[0]);
  N.oT2 = f3(tot[1]); N.oT3 = f3(tot[2]); N.oT4 = f3(tot[3]);
  return N;
}

/** A small static graph: a straight line from (x1, y1) to (x2, y2). kind "s" or "v"; "area" shades under it; "tri" shows Δ triangle. */
function lineFigure(opts, L) {
  const { x1, y1, x2, y2, xmax, ymax, color, area, tri, aria } = opts;
  const W = 300, H = 170, X0 = 44, Y0 = 14, PW = 240, PH = 120;
  const gx = (x) => X0 + (x / xmax) * PW, gy = (y) => Y0 + PH - (y / ymax) * PH;
  const t = (x, y, str, extra = {}) => s("text", { x, y, fill: "#c4bce8", "font-size": 11, "font-weight": 800, ...extra }, str);
  const kids = [s("rect", { width: W, height: H, fill: "#0a0826" }),
    s("path", { d: `M${X0} ${Y0}V${Y0 + PH}H${X0 + PW}`, stroke: "rgba(255,255,255,.6)", fill: "none", "stroke-width": 1.5 })];
  if (area) kids.push(s("path", { d: `M${gx(x1)} ${gy(0)}L${gx(x1)} ${gy(y1)}L${gx(x2)} ${gy(y2)}L${gx(x2)} ${gy(0)}Z`, fill: color, opacity: 0.35 }));
  if (tri) kids.push(s("path", { d: `M${gx(x1)} ${gy(y1)}H${gx(x2)}V${gy(y2)}`, stroke: "#fff", "stroke-dasharray": "4 4", fill: "none" }));
  kids.push(s("path", { d: `M${gx(x1)} ${gy(y1)}L${gx(x2)} ${gy(y2)}`, stroke: color, "stroke-width": 4, fill: "none", "stroke-linecap": "round" }),
    s("circle", { cx: gx(x1), cy: gy(y1), r: 5, fill: "#fff" }), s("circle", { cx: gx(x2), cy: gy(y2), r: 5, fill: "#fff" }),
    t(gx(x1) + 8, gy(y1) - 8, `(${x1} s, ${y1} ${L.unit})`), t(gx(x2) - 4, gy(y2) - 8, `(${x2} s, ${y2} ${L.unit})`, { "text-anchor": "end" }),
    t(X0 - 4, Y0 + 8, L.axis, { "text-anchor": "end", fill: color }), t(X0 + PW, Y0 + PH + 16, "t (s)", { "text-anchor": "end" }));
  return h("div", { class: "scene-box", style: "max-width:420px;margin:10px 0" }, s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": aria, style: "touch-action: pan-y" }, ...kids));
}

export function render(view, ctx) {
  const N = numbers();
  const c = ctx.content;
  const f = (str, extra) => fillStr(str, { ...N, ...extra });
  useFill(f);   // engine blocks fill their extra fields (whyNot) with it
  const id = ctx.chapter.id;
  const head = chapterHead(ctx, { art: null, sfx: c.hero.sfx, caption: c.hero.caption, intro: f(c.intro), slots: SLOTS });
  head.querySelector(".head-text").append(goals(c.goals.title, c.goals.items.map((x) => f(x))));
  const got = () => syncStrip(head, crystalsIn(id).size);
  const win = (key, el) => { award(id, key, el); got(); };
  const lockWin = (key) => (_, __, el, isPreview) => { if (!isPreview) win(key, el); };
  const pv = ctx.app("app.preview_answer");
  const check = (chk, key) => quickCheck({ q: f(chk.q), choices: chk.choices.map((x) => f(x)), answer: chk.answer, why: f(chk.why), whyNot: chk.whyNot, labels: c.checks, onRight: (el) => win(key, el) });
  const vv = (b, key, extra = {}) => vote({ question: f(b.question), choices: b.choices.map((x) => f(x)), answer: b.answer, verdicts: b.verdicts, explain: f(b.explain), lockLabel: b.lock, grid: true, previewVerdict: pv, onLock: lockWin(key), ...extra });

  // ----- warm-up (free-roam: gate is off unless ?gate) -----
  const { note: gateNote, rest, unlock } = gate(c.warmup.gate);
  const warm = c.warmup;
  const warmup = panel(warm.kicker, "hot", say(warm.say, "?"),
    vote({ question: f(warm.question), choices: warm.choices.map((x) => f(x)), answer: warm.answer, verdicts: warm.verdicts, explain: f(warm.explain),
      lockLabel: warm.lock, grid: true, previewVerdict: pv, saveKey: "i1-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- learn -----
  const fig = (svg, cap) => h("figure", { style: "margin:14px 0" }, h("div", { class: "scene-box", style: "max-width:420px;margin:0 auto" }, svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(cap))));
  const fillAll = (o) => Object.fromEntries(Object.entries(o).map(([k, x]) => [k, f(x)]));
  const figSplit = fig(splitFig(fillAll(c.figs.split)), c.figs.split.caption);
  const figThree = fig(threeFig(fillAll(c.figs.three)), c.figs.three.caption);
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(f(c.learn1.do)), rich(f(c.learn1.body)),
    lineFigure({ x1: 0, y1: 10, x2: 5, y2: 30, xmax: 6, ymax: 36, color: "#ffe14d", tri: true, aria: c.fig.s_aria }, c.fig.s),
    rich(f(c.learn1.after)), check(c.learn1.check, "check1"));
  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(f(c.learn2.do)), rich(f(c.learn2.body)), figThree, check(c.learn2.check, "check2"));
  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(f(c.learn3.lead)),
    choiceSteps(c.derive.steps.map((st) => ({ ...st, prompt: f(st.prompt), then: f(st.then) })), { tryAgain: c.derive.try_again, onDone: (el) => win("derive", el) }),
    figSplit,
    rich(f(c.learn3.after)), check(c.learn3.check, "check3"));
  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(f(c.learn4.do)), rich(f(c.lab.lead)),
    motionLab(c.lab, (ev, el) => { if (ev === "run" || ev === "brake") win(ev, el); }), rich(f(c.lab.tasks)), check(c.learn4.check, "check4"));
  const learn5 = panel(c.learn5.kicker, "cool", h("h2", {}, c.learn5.title), rich(f(c.learn5.do)), rich(f(c.learn5.body)), check(c.learn5.check, "check5"));
  const learn6 = panel(c.learn6.kicker, "cool", h("h2", {}, c.learn6.title), rich(f(c.learn6.do)), rich(f(c.learn6.body)),
    chargeLab(c.charge, (ev, el) => { if (ev === "release") win("charge", el); }), rich(f(c.charge.tasks)), check(c.learn6.check, "check6"));

  const examples = panel(c.examples.kicker, "sun", h("h2", {}, c.examples.title),
    ...c.examples.items.map((ex) => worked({ title: ex.title, problem: f(ex.problem), steps: ex.steps.map((x) => f(x)), answer: f(ex.answer), labels: { next: c.examples.next } })));

  // ----- practice -----
  const prac = panel(c.practice.kicker, "hot", h("h2", {}, c.practice.title),
    practice({ items: c.practice.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), hint: f(it.hint), solution: f(it.solution) })),
      labels: c.practice.labels, onDone: (right, el) => { if (right >= 3) win("practice", el); } }));

  // ----- explore -----
  const game = panel(c.game.kicker, "hot", h("h2", {}, c.game.title), rich(c.game.lead), matchGraph(c.game, (el) => win("game", el)));
  const story = panel(c.story.kicker, "", h("h2", {}, c.story.title), comic(c.story.frames.map((fr) => ({ ...fr, text: f(fr.text) }))),
    vote({ question: c.story.question, choices: c.story.choices, answer: c.story.answer, verdicts: c.story.verdicts,
      explain: f(c.story.explain), lockLabel: c.story.lock, previewVerdict: pv, onLock: lockWin("story") }));
  const sim = panel(c.sim.kicker, "cool", ...simCard(c.sim, SIM_URL));
  const T = c.trial;
  const trial = panel(T.kicker, "sun", h("h2", {}, T.title), rich(f(T.lead)), rich(f(T.safety)), rich(f(T.need)), rich(f(T.steps)), rich(f(T.measure)), rich(f(T.compare)), rich(f(T.wrong)));
  const manga = panel(c.manga.kicker, "sun", h("h2", {}, c.manga.title), rich(f(c.manga.body)));

  // ----- remember + quiz -----
  const sum = panel(c.summary.kicker, "sun", h("h2", {}, c.summary.title), summary(c.summary.items.map((x) => f(x))));
  const quiz = panel(c.quiz.kicker, "hot", h("h2", {}, c.quiz.title),
    quickfire({ items: c.quiz.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), why: f(it.why) })), labels: c.quiz.labels,
      onDone: (score, el) => { if (score >= 2) win("quiz", el); } }));

  // ----- BONUS -----
  const calc = panel(c.bcalc.kicker, "sun", h("h2", {}, c.bcalc.title), rich(f(c.bcalc.lead)), vv(c.bcalc, "b-calc"));
  const v2 = panel(c.bv2.kicker, "sun", h("h2", {}, c.bv2.title), rich(f(c.bv2.lead)), vv(c.bv2, "b-v2"), rich(f(c.bv2.after)));
  const odd = panel(c.bodd.kicker, "sun", h("h2", {}, c.bodd.title), rich(f(c.bodd.lead)), vv(c.bodd, "b-odd"));

  rest.append(learn1, learn2, learn3, learn4, learn5, learn6, examples, prac, game, story, sim, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note), calc, v2, odd, chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}
