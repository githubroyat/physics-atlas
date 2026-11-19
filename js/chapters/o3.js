// Chapter o3: Swing (S6 Oscillations: the simple pendulum, restoring force −m·g·sinθ ≈ −(m·g/L)·y, T = 2π√(L/g), non-harmonic big swings).
// Teach-first layout: goals → warm-up → learn steps with checks → worked examples → practice → explore → summary
// → quiz → BONUS (rope swing, big-swing numbers, summer clock).
import { h, rich } from "../dom.js";
import { pendulumLab, secondsGame, twoBobs } from "../widgets/pendulum.js";
import {
  panel, say, vote, quickfire, choiceSteps, comic, chapterHead, simCard, chapterNav,
  award, fillStr, syncStrip, gate, goals, quickCheck, worked, practice, summary, bonusDivider, PREVIEW, useFill
} from "../engine.js";
import { crystalsIn } from "../store.js";
import { forceFig, measureFig, FORCE_DEG } from "./o3-figs.js";
import { G, pendulumPeriod, pendulumPeriodExact, lengthForPeriod, fmt } from "../physics.js";

const SIM_URL = "https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab_en.html";
// warmup, check1-4, mass, derive, bigswing, gravity, seconds, practice, story, quiz, b-rope, b-heat
const SLOTS = 15;
const D2R = Math.PI / 180;
const HERO = { L: 20, deg: 60 };                       // the rope swing
const HEAT = { alpha: 12e-6, dT: 20, day: 86400 };     // steel rod: α ≈ 12×10⁻⁶ per K, a 20 K warmer room
const MOON_G = 1.62;

function numbers() {
  const th = HERO.deg * D2R;
  const drop = HERO.L * (1 - Math.cos(th));            // height gained: h = L(1 − cosθ)
  const v = Math.sqrt(2 * G * drop);                   // m·g·h = ½·m·v²
  const T0 = pendulumPeriod(HERO.L), Tx = pendulumPeriodExact(HERO.L, th);
  const strain = HEAT.alpha * HEAT.dT;                 // ΔL/L = α·ΔT
  // worked examples and practice
  const we1L = 0.8, we1T = pendulumPeriod(we1L);
  const we2T = 1.5, we2L = lengthForPeriod(we2T);
  const p1L = 2.5, p1T = pendulumPeriod(p1L);
  const p3T = 2.0, p3M = p3T * Math.sqrt(G / MOON_G);
  const we3L = 1.0, we3t = 20.1, we3T = we3t / 10;
  const we3g = 4 * Math.PI ** 2 * we3L / (we3T * we3T);
  const p6L = 0.64, p6t = 16.1, p6T = p6t / 10, p6g = 4 * Math.PI ** 2 * p6L / (p6T * p6T);
  const p4h = 0.2, p4v = Math.sqrt(2 * G * p4h);
  // home experiment: a key or nut on a thread, 10 swings, three lengths
  const exL = [1.0, 0.5, 0.25], exT = exL.map((l) => pendulumPeriod(l));
  const exOff = 0.03, exWrongL = G * (exL[0] - exOff) / exL[0];            // L measured 3 cm short of the centre (true L = 1.00 m): g = 4π²·L/T² comes out too small
  const exBig = G / (pendulumPeriodExact(1, 30 * D2R) / pendulumPeriod(1)) ** 2;   // 30° release: T about 1.7% too long, so g too small
  const exCount = G / 0.9 ** 2;                                             // count started at 1 instead of 0: 9 real swings called 10, T 10% too small, g too big
  const exRt = 0.2;                                                         // reaction time 0.2 s
  const thF = FORCE_DEG * D2R;
  return {
    figTh: fmt(FORCE_DEG, 0), figSin: fmt(Math.sin(thF), 2), figCos: fmt(Math.cos(thF), 2),
    exL1: fmt(exL[0], 2), exL2: fmt(exL[1], 2), exL3: fmt(exL[2], 2),
    exT1: fmt(exT[0], 2), exT2: fmt(exT[1], 2), exT3: fmt(exT[2], 2),
    exTen1: fmt(10 * exT[0], 1), exTen2: fmt(10 * exT[1], 1), exTen3: fmt(10 * exT[2], 1),
    exOff: fmt(exOff * 100, 0), exWrongL: fmt(exWrongL, 1), exBig: fmt(exBig, 1), exCount: fmt(exCount, 1),
    exRtOne: fmt(100 * 2 * exRt / exT[0], 0), exRtTen: fmt(100 * 2 * exRt / (10 * exT[0]), 0), exRt: fmt(exRt, 1),
    exTol: fmt(1, 0),
    g: fmt(G, 2), massRatio: fmt(2.0 / 0.2, 0),                // the two bobs in the demo: 2.0 kg and 0.2 kg
    secL: fmt(lengthForPeriod(2), 3),                  // half-period 1 s means T = 2 s
    heroL: fmt(HERO.L, 0), heroDeg: fmt(HERO.deg, 0), heroH: fmt(drop, 1), heroV: fmt(v, 1), heroKmh: fmt(v * 3.6, 0),
    heroT0: fmt(T0, 2), heroT: fmt(Tx, 2), heroPct: fmt((Tx / T0 - 1) * 100, 0), heroTen: fmt(3 - 2 * Math.cos(th), 1),
    pct5: fmt((pendulumPeriodExact(1, 5 * D2R) / pendulumPeriod(1) - 1) * 100, 2),
    pct60: fmt((pendulumPeriodExact(1, 60 * D2R) / pendulumPeriod(1) - 1) * 100, 1),
    r170: fmt(pendulumPeriodExact(1, 170 * D2R) / pendulumPeriod(1), 1),
    sin10: fmt(((10 * D2R - Math.sin(10 * D2R)) / Math.sin(10 * D2R)) * 100, 1),
    moonR: fmt(Math.sqrt(G / MOON_G), 1),
    alphaE: fmt(HEAT.alpha * 1e6, 0), heatDT: fmt(HEAT.dT, 0), heatStrain: fmt(strain * 1e4, 1), heatT: fmt((strain / 2) * 1e4, 1),
    heatDay: fmt(HEAT.day * (strain / 2), 0),
    // worked example 1: T for L = 0.80 m
    we1r: fmt(we1L / G, 5), we1s: fmt(Math.sqrt(we1L / G), 4), we1T: fmt(we1T, 2), we1f: fmt(1 / we1T, 2),
    // worked example 2: L for T = 1.5 s
    we2sq: fmt(we2T * we2T, 2), we2gT: fmt(G * we2T * we2T, 2), we2den: fmt(4 * Math.PI * Math.PI, 2), we2L: fmt(we2L, 2),
    // worked example 3: g from 10 swings
    we3t: fmt(we3t, 1), we3T: fmt(we3T, 2), we3sq: fmt(we3T * we3T, 2), we3den: fmt(4 * Math.PI * Math.PI * we3L, 2), we3g: fmt(we3g, 2),
    // practice 6
    p6T: fmt(p6T, 2), p6g: fmt(p6g, 2), p6w1: fmt(4 * Math.PI ** 2 * p6L / (p6t * p6t), 3), p6w2: fmt(4 * Math.PI ** 2 * p6L / p6T, 1), p6w3: fmt(2 * Math.PI ** 2 * p6L / (p6T * p6T), 2),
    // practice
    p1T: fmt(p1T, 2), p1w1: fmt(Math.sqrt(p1L / G), 2), p1w2: fmt(2 * Math.PI * Math.sqrt(p1L * G), 1), p1w3: fmt(2 * Math.PI * Math.sqrt(G / p1L), 1),
    p1r: fmt(p1L / G, 3), p1s: fmt(Math.sqrt(p1L / G), 3),
    p3q: fmt(G / MOON_G, 2), p3s: fmt(Math.sqrt(G / MOON_G), 2),
    p6num: fmt(4 * Math.PI ** 2 * p6L, 2), p6sq: fmt(p6T * p6T, 3),
    p2a: fmt(pendulumPeriod(0.5), 2), p2b: fmt(pendulumPeriod(2.0), 2),
    p3M: fmt(p3M, 1), p3w1: fmt(p3T * (G / MOON_G), 1), p3w2: fmt(p3T / Math.sqrt(G / MOON_G), 1),
    p4v: fmt(p4v, 2), p4w1: fmt(2 * G * p4h, 2), p4w2: fmt(Math.sqrt(G * p4h), 2), p4w3: fmt(Math.sqrt((2 * p4h) / G), 2),
  };
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
  const vv = (b, extra = {}) => vote({ choices: b.choices.map((x) => f(x)), answer: b.answer, verdicts: b.verdicts, lockLabel: b.lock, previewVerdict: pv, ...extra });

  // ----- warm-up (free-roam: gate is off unless ?gate) -----
  const { note: gateNote, rest, unlock } = gate(c.warmup.gate);
  const warm = c.warmup;
  const warmup = panel(warm.kicker, "hot", say(warm.say, "?"),
    vote({ question: warm.question, choices: warm.choices, answer: warm.answer, verdicts: warm.verdicts, explain: f(warm.explain),
      lockLabel: warm.lock, grid: true, previewVerdict: pv, saveKey: "o3-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- learn -----
  const fig = (svg, cap) => h("figure", { style: "margin:14px 0" }, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(cap))));
  const figForces = fig(forceFig({ ...c.figs.forces, aria: f(c.figs.forces.aria) }), c.figs.forces.caption);
  const figMeasure = fig(measureFig(c.figs.measure), c.figs.measure.caption);
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(c.learn1.body), figForces, rich(c.bigidea.lead),
    twoBobs(c.bigidea, (_, el) => win("mass", el)), rich(f(c.bigidea.after)), rich(f(c.learn1.energy)), check(c.learn1.check, "check1"));
  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(c.learn2.lead),
    choiceSteps(c.derive.steps.map((st) => ({ ...st, prompt: f(st.prompt), then: f(st.then) })), { tryAgain: c.derive.try_again, onDone: (el) => win("derive", el) }),
    check(c.learn2.check, "check2"));
  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(f(c.learn3.body)), rich(c.lab.lead),
    pendulumLab(c.lab, (ev, el) => { if (ev === "bigswing" || ev === "gravity") win(ev, el); }), rich(f(c.lab.tasks)),
    check(c.learn3check, "check3"));
  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(f(c.learn4.body)), rich(c.game.lead),
    secondsGame(c.game, h("div", {}, h("div", { class: "verdict-row" }, h("p", { class: "verdict" }, c.game.win_head)), rich(f(c.game.win))), (el) => win("seconds", el)),
    check(c.learn4.check, "check4"));

  const examples = panel(c.examples.kicker, "sun", h("h2", {}, c.examples.title),
    ...c.examples.items.map((ex) => worked({ title: ex.title, problem: f(ex.problem), steps: ex.steps.map((x) => f(x)), answer: f(ex.answer), labels: { next: c.examples.next } })));

  // ----- practice -----
  const prac = panel(c.practice.kicker, "hot", h("h2", {}, c.practice.title),
    practice({ items: c.practice.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), hint: f(it.hint), solution: f(it.solution) })),
      labels: c.practice.labels, onDone: (right, el) => { if (right >= 3) win("practice", el); } }));

  // ----- explore -----
  const story = panel(c.story.kicker, "", h("h2", {}, c.story.title), comic(c.story.frames.map((fr) => ({ ...fr, text: f(fr.text) }))),
    vote({ question: c.story.question, choices: c.story.choices, answer: c.story.answer, verdicts: c.story.verdicts,
      explain: f(c.story.explain), lockLabel: c.story.lock, previewVerdict: pv, onLock: lockWin("story") }));
  const T = c.trial;
  const trial = panel(T.kicker, "sun", h("h2", {}, T.title), rich(f(T.lead)), rich(f(T.safety)), rich(f(T.need)), rich(f(T.steps)), figMeasure, rich(f(T.measure)), rich(f(T.compare)), rich(f(T.wrong)));
  const sim = panel(c.sim.kicker, "cool", ...simCard(c.sim, SIM_URL));
  const manga = panel(c.manga.kicker, "sun", h("h2", {}, c.manga.title), rich(f(c.manga.body)));

  // ----- remember + quiz -----
  const sum = panel(c.summary.kicker, "sun", h("h2", {}, c.summary.title), summary(c.summary.items));
  const quiz = panel(c.quiz.kicker, "hot", h("h2", {}, c.quiz.title),
    quickfire({ items: c.quiz.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), why: f(it.why) })), labels: c.quiz.labels,
      onDone: (score, el) => { if (score >= 2) win("quiz", el); } }));

  // ----- BONUS -----
  const heroSteps = h("div", { hidden: !PREVIEW }, h("ol", { class: "steps" }, c.check.steps.map((st) => h("li", {}, rich(f(st))))), h("div", { style: "margin-top:10px" }, rich(f(c.check.after))));
  const rope = panel(c.check.kicker, "sun", h("h2", {}, c.check.title), say(f(c.check.say), "!"), rich(f(c.check.lead)),
    vv(c.check, { question: f(c.check.question), grid: true,
      onLock: (_, __, el, isPreview) => { heroSteps.hidden = false; if (!isPreview) win("b-rope", el); } }), heroSteps);
  const bigNum = panel(c.bigswing.kicker, "sun", h("h2", {}, c.bigswing.title), rich(f(c.bigswing.body)));
  const heat = panel(c.challenge.kicker, "sun", h("h2", {}, c.challenge.title), rich(f(c.challenge.lead)),
    vote({ question: f(c.challenge.question), choices: c.challenge.choices, answer: c.challenge.answer, verdicts: c.challenge.verdicts,
      explain: f(c.challenge.explain), lockLabel: c.challenge.lock, grid: true, previewVerdict: pv, onLock: lockWin("b-heat") }));

  rest.append(learn1, learn2, learn3, learn4, examples, prac, story, sim, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note), rope, bigNum, heat, chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}
