// Chapter o2: The shape of a wobble (S6 Harmonic oscillations: A, T, f, ω; y = A·sin(ωt); a = −ω²·y; T = 2π√(m/k); damping).
// Teach-first layout: goals → warm-up → learn steps with checks → worked examples → practice → explore → summary → quiz → BONUS.
import { h, s, rich } from "../dom.js";
import { oscillator } from "../widgets/oscillator.js";
import { matchWave } from "../widgets/matchwave.js";
import {
  panel, say, vote, quickfire, choiceSteps, comic, chapterHead, simCard, chapterNav,
  award, fillStr, syncStrip, gate, goals, quickCheck, worked, practice, summary, bonusDivider, PREVIEW, useFill
} from "../engine.js";
import { phaseFig, bounceFig } from "./o2-figs.js";
import { crystalsIn } from "../store.js";
import { springPeriod, springOmega, kFromPeriod, parallelK, fmt } from "../physics.js";

const SIM_URL = "https://phet.colorado.edu/sims/html/masses-and-springs/latest/masses-and-springs_en.html";
// warmup, check1-4, damping, circle, shadow, derive, practice, match, story, quiz, b-over, b-car
const SLOTS = 15;
const GRAPH = { m: 0.2, A: 0.08, T: 0.5 };        // the graph in step 1 / worked example 1
const CAR = { m: 1200, kEach: 20000, extra: 300 }; // the suspension check (typical cars bounce at ~1–1.5 Hz)
const TAU = 2 * Math.PI;
const E3 = { A: 0.10, T: 0.80, t1: 0.10, t2: 0.60 };   // worked example 3: y at a given time
const EXP = { k: 20, m1: 0.10, mult: 4, n: 10, Tp: 0.60, Ap: 0.03 };   // home experiment: soft spring, sock + coins; phone on a band

/** Every number in the prose, from physics.js. */
function numbers() {
  const kCar = parallelK(parallelK(CAR.kEach, CAR.kEach), parallelK(CAR.kEach, CAR.kEach));
  const Tcar = springPeriod(CAR.m, kCar), Tfull = springPeriod(CAR.m + CAR.extra, kCar);
  const x = { m: 0.5, k: 20, A: 0.08 };
  const xw = springOmega(x.m, x.k), xT = springPeriod(x.m, x.k);
  const l3 = { m: 0.2, k: 80 }, p4 = { m: 0.8, k: 45 };
  const p3 = { A: 0.12, w: 5, t: 0.2 };
  const p5 = { A: 0.04, w: 15 };
  return {
    carM: fmt(CAR.m, 0), carK: fmt(CAR.kEach, 0), carKtot: fmt(kCar, 0), carT: fmt(Tcar, 2), carF: fmt(1 / Tcar, 1),
    carExtra: fmt(CAR.extra, 0), carTfull: fmt(Tfull, 2),
    // graph (step 1, worked example 1)
    gm: fmt(GRAPH.m, 1), gA: fmt(GRAPH.A * 100, 0), gT: fmt(GRAPH.T, 2), gk: fmt(kFromPeriod(GRAPH.m, GRAPH.T), 1),
    wm: fmt(GRAPH.m, 2), wf: fmt(1 / GRAPH.T, 1), ww: fmt(TAU / GRAPH.T, 1), ww2: fmt(TAU / GRAPH.T, 2),
    l1f: fmt(1 / GRAPH.T, 1), l1w1: fmt(GRAPH.T, 2), l1w2: fmt(1 / GRAPH.T / 2, 1), l1w3: fmt(2 / GRAPH.T, 1),
    // step 2 check: f = 2.0 Hz
    l2w: fmt(TAU * 2, 1), l2w1: fmt(2, 1), l2w2: fmt(1 / (TAU * 2), 3), l2w3: fmt(Math.PI * 2, 1),
    // step 3 check
    l3m: fmt(l3.m, 2), l3k: fmt(l3.k, 0), l3T: fmt(springPeriod(l3.m, l3.k), 2),
    l3w1: fmt(Math.sqrt(l3.m / l3.k), 3), l3w2: fmt(TAU * Math.sqrt(l3.k / l3.m), 0), l3w3: fmt(Math.PI * Math.sqrt(l3.m / l3.k), 2),
    // worked example 2
    xm: fmt(x.m, 1), xk: fmt(x.k, 0), xA: fmt(x.A * 100, 0), xAm: fmt(x.A, 2),
    xw: fmt(xw, 2), xT: fmt(xT, 2), xf: fmt(1 / xT, 2), xv: fmt(x.A * xw, 2), xa: fmt(x.A * xw * xw, 1),
    // practice
    p1f: fmt(1 / 0.8, 2), p1w1: fmt(0.8, 2), p1w2: fmt(TAU / 0.8, 1), p1w3: fmt(5, 1),
    p2w: fmt(TAU * 3, 1), p2w1: fmt(3, 1), p2w2: fmt(Math.PI * 3, 1), p2w3: fmt(1 / (TAU * 3), 2),
    p3y: fmt(p3.A * Math.sin(p3.w * p3.t), 3), p3w1: fmt(p3.A * Math.sin((p3.w * p3.t * Math.PI) / 180), 4),
    p3w2: fmt(p3.A, 2), p3w3: fmt(p3.A * Math.sin(p3.t), 3),
    p4m: fmt(p4.m, 2), p4k: fmt(p4.k, 0), p4T: fmt(springPeriod(p4.m, p4.k), 2),
    p4w1: fmt(TAU * Math.sqrt(p4.k / p4.m), 1), p4w2: fmt(Math.sqrt(p4.m / p4.k), 2), p4w3: fmt(Math.PI * Math.sqrt(p4.m / p4.k), 2),
    p5a: fmt(p5.A * p5.w * p5.w, 1), p5w1: fmt(p5.A * p5.w, 2), p5w2: fmt(p5.A * 100 * p5.w * p5.w, 0), p5w3: fmt(p5.A * p5.w ** 3, 0),
    p6v: fmt(0.05 * 20, 2), p6w1: fmt(0.05 * 20 * 20, 0), p6w2: fmt(5 * 20, 0), p6w3: fmt(0.05 / 20, 4),
    // worked example 3 (y at a time)
    e3A: fmt(E3.A, 2), e3T: fmt(E3.T, 2), e3t1: fmt(E3.t1, 2), e3t2: fmt(E3.t2, 2), e3w: fmt(TAU / E3.T, 2),
    e3p1: fmt((TAU / E3.T) * E3.t1, 3), e3y1: fmt(E3.A * Math.sin((TAU / E3.T) * E3.t1), 3),
    e3p2: fmt((TAU / E3.T) * E3.t2, 3), e3y2: fmt(E3.A * Math.sin((TAU / E3.T) * E3.t2), 3),
    // home experiment
    exK: fmt(EXP.k, 0), exM1: fmt(EXP.m1, 2), exM2: fmt(EXP.m1 * EXP.mult, 2), exN: fmt(EXP.n, 0),
    exT1: fmt(springPeriod(EXP.m1, EXP.k), 2), exT2: fmt(springPeriod(EXP.m1 * EXP.mult, EXP.k), 2),
    exN1: fmt(EXP.n * springPeriod(EXP.m1, EXP.k), 1), exN2: fmt(EXP.n * springPeriod(EXP.m1 * EXP.mult, EXP.k), 1),
    exM3: fmt(EXP.m1 * 9, 2), exT3: fmt(springPeriod(EXP.m1 * 9, EXP.k), 2), exN3: fmt(EXP.n * springPeriod(EXP.m1 * 9, EXP.k), 1),
    exK2: fmt(kFromPeriod(EXP.m1, springPeriod(EXP.m1, EXP.k)), 0),
    exPT: fmt(EXP.Tp, 2), exPA: fmt(EXP.Ap * 100, 0), exPw: fmt(TAU / EXP.Tp, 1), exPa: fmt(EXP.Ap * (TAU / EXP.Tp) ** 2, 1),
    // quiz
    qT: fmt(springPeriod(0.5, 50), 2), qW1: fmt(Math.PI * Math.sqrt(0.5 / 50), 2), qW2: fmt(TAU * Math.sqrt(50 / 0.5), 0),
  };
}

export function render(view, ctx) {
  const N = numbers();
  const c = ctx.content;
  const f = (str, extra) => fillStr(str, { ...N, ...extra });
  useFill(f);   // engine blocks fill their extra fields (whyNot) with it
  const id = ctx.chapter.id;
  const head = chapterHead(ctx, { art: null, sfx: c.hero.sfx, caption: c.hero.caption, intro: c.intro, slots: SLOTS });
  head.querySelector(".head-text").append(goals(c.goals.title, c.goals.items.map((x) => f(x))));
  const got = () => syncStrip(head, crystalsIn(id).size);
  const win = (key, el) => { award(id, key, el); got(); };
  const pv = ctx.app("app.preview_answer");
  const check = (chk, key) => quickCheck({ q: f(chk.q), choices: chk.choices.map((x) => f(x)), answer: chk.answer, why: f(chk.why), whyNot: chk.whyNot, labels: c.checks, onRight: (el) => win(key, el) });
  const labEvent = (ev, el) => { if (ev === "damping" || ev === "circle") win(ev, el); };

  // ----- warm-up (free-roam: gate is off unless ?gate) -----
  const { note: gateNote, rest, unlock } = gate(c.predict.gate);
  const warm = c.warmup;
  const warmup = panel(warm.kicker, "hot", say(warm.say, "?"),
    vote({ question: warm.question, choices: warm.choices, answer: warm.answer, verdicts: warm.verdicts, explain: warm.explain,
      lockLabel: warm.lock, grid: true, previewVerdict: pv, saveKey: "o2-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- learn -----
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(c.learn1.body),
    h("div", { class: "scene-box", style: "margin:10px 0" }, readGraph(c.learn1.graph_label)), check(c.learn1.check, "check1"));
  const fig = (svg, cap) => h("figure", { style: "margin:14px 0" }, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(cap))));
  const figBounce = fig(bounceFig(c.figs.bounce), c.figs.bounce.caption);
  const figPhase = fig(phaseFig(c.figs.phase), c.figs.phase.caption);
  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(c.learn2.body), figBounce,
    h("h3", {}, c.lab.title), oscillator(c.lab, labEvent), rich(c.lab.tasks), rich(c.learn2.after), figPhase, check(c.learn2.check, "check2"));
  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(c.learn3.lead),
    shadow(c.learn3, (el) => win("shadow", el)), rich(c.learn3.after),
    choiceSteps(c.derive.steps, { tryAgain: c.derive.try_again, onDone: (el) => win("derive", el) }),
    check(c.learn3.check, "check3"));
  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(c.learn4.body),
    h("h3", {}, c.lab2.title), rich(c.lab2.lead), oscillator(c.lab, labEvent), rich(c.lab2.tasks), check(c.learn4.check, "check4"));
  const examples = panel(c.examples.kicker, "sun", h("h2", {}, c.examples.title),
    ...c.examples.items.map((ex) => worked({ title: ex.title, problem: f(ex.problem), steps: ex.steps.map((x) => f(x)), answer: f(ex.answer), labels: { next: c.examples.next } })));

  // ----- practice -----
  const prac = panel(c.practice.kicker, "hot", h("h2", {}, c.practice.title),
    practice({ items: c.practice.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), hint: f(it.hint), solution: f(it.solution) })),
      labels: c.practice.labels, onDone: (right, el) => { if (right >= 3) win("practice", el); } }));

  // ----- explore -----
  const game = panel(c.game.kicker, "sun", h("h2", {}, c.game.title), rich(c.game.lead), matchWave(c.game, (el) => win("match", el)));
  const story = panel(c.story.kicker, "", h("h2", {}, c.story.title), comic(c.story.frames),
    vote({ question: c.story.question, choices: c.story.choices, answer: c.story.answer, verdicts: c.story.verdicts,
      explain: c.story.explain, lockLabel: c.story.lock, previewVerdict: pv,
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("story", el); } }));
  const sim = panel(c.sim.kicker, "cool", ...simCard(c.sim, SIM_URL));
  const T = c.trial;
  const trial = panel(T.kicker, "sun", h("h2", {}, T.title), rich(f(T.lead)), rich(f(T.safety)), rich(f(T.need)), rich(f(T.steps)), rich(f(T.measure)), rich(f(T.compare)), rich(f(T.phone)), rich(f(T.wrong)));
  const manga = panel(c.manga.kicker, "sun", h("h2", {}, c.manga.title), rich(c.manga.body));

  // ----- remember + quiz -----
  const sum = panel(c.summary.kicker, "sun", h("h2", {}, c.summary.title), summary(c.summary.items));
  const quiz = panel(c.quiz.kicker, "hot", h("h2", {}, c.quiz.title),
    quickfire({ items: c.quiz.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), why: f(it.why) })), labels: c.quiz.labels,
      onDone: (score, el) => { if (score >= 3) win("quiz", el); } }));

  // ----- BONUS -----
  const over = panel(c.over.kicker, "sun", h("h2", {}, c.over.title),
    vote({ question: c.over.question, choices: c.over.choices, answer: c.over.answer, verdicts: c.over.verdicts,
      explain: c.over.explain, lockLabel: c.over.lock, previewVerdict: pv,
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("b-over", el); } }));
  const carSteps = h("div", { hidden: !PREVIEW }, h("ol", { class: "steps" }, c.check.steps.map((st) => h("li", {}, rich(f(st))))), h("div", { style: "margin-top:10px" }, rich(f(c.check.after))));
  const car = panel(c.check.kicker, "hot", h("h2", {}, c.check.title), say(f(c.check.say), "!"),
    vote({ question: null, choices: c.check.choices, answer: c.check.answer, verdicts: c.check.verdicts, lockLabel: c.check.lock,
      grid: true, previewVerdict: pv,
      onLock: (_, __, el, isPreview) => { carSteps.hidden = false; if (!isPreview) win("b-car", el); } }), carSteps);

  rest.append(learn1, learn2, learn3, learn4, examples, prac, game, story, sim, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note), over, car, chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}

/** A point going round a circle, and its shadow tracing a sine (y = A·sin(ωt)). */
function shadow(L, onPlay) {
  const R = 60, CX = 80, CY = 90, W = 320;
  const dot = s("circle", { r: 7, fill: "#ffe14d" });
  const sh = s("circle", { r: 7, fill: "#ff4fd8" });
  const link = s("path", { stroke: "#ffe14d", "stroke-width": 1.5, "stroke-dasharray": "3 3" });
  const trace = s("path", { fill: "none", stroke: "#ff4fd8", "stroke-width": 3 });
  const svg = s("svg", { class: "scene", viewBox: `0 0 ${W} 180`, role: "img", "aria-label": L.title2 },
    s("rect", { width: W, height: 180, fill: "#0a0826" }),
    s("circle", { cx: CX, cy: CY, r: R, fill: "none", stroke: "#2ef2ff", "stroke-width": 2 }),
    s("path", { d: `M160 ${CY - R}V${CY + R}`, stroke: "rgba(255,255,255,.4)", "stroke-width": 2 }),
    trace, link, dot, sh);
  let raf = 0, t0 = 0;
  const w = 2.2;
  const frame = (now) => {
    const t = (now - t0) / 1000, ang = w * t;
    const x = CX + R * Math.cos(ang), y = CY - R * Math.sin(ang);
    dot.setAttribute("cx", x); dot.setAttribute("cy", y);
    sh.setAttribute("cx", 160); sh.setAttribute("cy", y);
    link.setAttribute("d", `M${x} ${y}H160`);
    let d = "";
    for (let i = 0; i <= 80; i++) { const tt = Math.max(0, t - (i / 80) * 2.5); d += `${i ? "L" : "M"}${160 + i * 1.95} ${CY - R * Math.sin(w * tt)}`; }
    trace.setAttribute("d", d);
    if (t < 30 && svg.isConnected) raf = requestAnimationFrame(frame);
  };
  const btn = h("button", { class: "btn primary", type: "button" }, L.play);
  btn.addEventListener("click", () => { cancelAnimationFrame(raf); t0 = performance.now(); raf = requestAnimationFrame(frame); onPlay(btn); });
  frame(performance.now()); t0 = performance.now();
  return h("div", {}, h("div", { class: "scene-box" }, svg), h("div", { class: "btn-row" }, btn));
}

/** Static y(t) graph (step 1 and worked example 1), drawn from GRAPH so the picture and the answers match. */
function readGraph(label) {
  const W = 320, H = 180, MID = 90, span = 1.25, ypx = 75 / GRAPH.A;
  const g = s("svg", { class: "scene", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": label },
    s("rect", { width: W, height: H, fill: "#0a0826" }));
  for (let i = 0; i <= 5; i++) {
    const x = 30 + (i * (W - 40)) / 5;
    g.append(s("path", { d: `M${x} 10V${H - 16}`, stroke: "rgba(255,255,255,.15)" }),
      s("text", { x, y: H - 2, "text-anchor": "middle", fill: "#c4bce8", "font-size": 11, "font-weight": 800 }, `${fmt(i * 0.25, 2)} s`));
  }
  for (const v of [-1, 0, 1]) {
    const y = MID - v * GRAPH.A * ypx;
    g.append(s("path", { d: `M30 ${y}H${W - 10}`, stroke: v ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.4)" }),
      s("text", { x: 26, y: y + 4, "text-anchor": "end", fill: "#c4bce8", "font-size": 11, "font-weight": 800 }, fmt(v * GRAPH.A * 100, 0)));
  }
  g.append(s("text", { x: 6, y: 14, fill: "#c4bce8", "font-size": 11, "font-weight": 800 }, "y (cm)"));
  let d = "";
  for (let i = 0; i <= 200; i++) {
    const t = (i / 200) * span;
    d += `${i ? "L" : "M"}${(30 + (t / span) * (W - 40)).toFixed(1)} ${(MID - GRAPH.A * Math.sin((2 * Math.PI * t) / GRAPH.T) * ypx).toFixed(1)}`;
  }
  g.append(s("path", { d, fill: "none", stroke: "#ff4fd8", "stroke-width": 3 }));
  return g;
}
