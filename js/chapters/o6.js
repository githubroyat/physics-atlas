// Chapter o6: The circuit that rings (S6 Oscillations: LC circuits, energy exchange between the capacitor's electric field and the
// coil's magnetic field, W = ½·L·I², the spring analogy ⇒ ω0 = 1/√(L·C), damping by resistance, AC driving and radio tuning).
// Teach-first layout: goals → warm-up → learn steps with checks → worked examples → practice → explore → summary → quiz → BONUS.
import { h, rich } from "../dom.js";
import { lcLab, radioGame, twinMatch, radioC, radioF0, RADIO, SLOW, labNumbers } from "../widgets/lccircuit.js";
import {
  panel, say, vote, quickfire, choiceSteps, comic, chapterHead, simCard, chapterNav,
  award, fillStr, syncStrip, gate, goals, quickCheck, worked, practice, summary, bonusDivider, PREVIEW, useFill
} from "../engine.js";
import { crystalsIn } from "../store.js";
import { stagesFig, dampFig } from "./o6-figs.js";
import { lcOmega, lcFrequency, inductorEnergy, capEnergy, springPeriod, fmt, sci } from "../physics.js";

const SIM_URL = "https://phet.colorado.edu/sims/html/circuit-construction-kit-ac/latest/circuit-construction-kit-ac_en.html";
// warmup, check1-7, slosh, halve, damp (lab), match, radio (games), practice, quiz, b-sum, b-half, b-range
export const AWARD_KEYS = ["warmup", "check1", "check2", "check3", "check4", "check5", "check6", "check7",
  "slosh", "halve", "damp", "match", "radio", "practice", "quiz", "b-sum", "b-half", "b-range"];
const SLOTS = AWARD_KEYS.length;
const mJ = (x, d = 1) => fmt(x * 1e3, d);

/** Every number in the prose, from physics.js. Inputs are written as SI values (µ = 1e-6, m = 1e-3). */
export function numbers() {
  const def = labNumbers(10, 10), x4 = labNumbers(40, 10);
  // learn checks
  const c1 = { C: 50e-6, U: 6.0 }, c2 = { L: 20e-3, I: 0.5 };
  const c5 = { L: 10e-3, C: 10e-6 }, c5w = lcOmega(c5.L, c5.C);
  // worked examples
  const e1 = { L: 2.0e-3, C: 8.0e-6 }, e1w = lcOmega(e1.L, e1.C);
  const e2 = { C: 20e-6, U: 12, L: 30e-3 }, e2W = capEnergy(e2.C, e2.U), e2I = Math.sqrt((2 * e2W) / e2.L);
  const e2f = lcFrequency(e2.L, e2.C), e2T = 1 / e2f;
  // practice
  const p1 = { L: 5.0e-3, C: 2.0e-6 }, p1w = lcOmega(p1.L, p1.C);
  const p2T = 1 / 500;
  const p4 = { L: 0.2e-3, f: 900e3 }, p4w = 2 * Math.PI * p4.f, p4C = 1 / (p4w * p4w * p4.L);
  const p5 = { L: 0.1, C: 1.0e-6 }, p5w = lcOmega(p5.L, p5.C), p5f = lcFrequency(p5.L, p5.C);
  // worked example 3 (reverse calculation): L = 0.10 mH, f = 1.5 MHz
  const e3 = { L: 1.0e-4, f: 1.5e6 }, e3w = 2 * Math.PI * e3.f, e3C = 1 / (e3w * e3w * e3.L);
  // practice 5 (more steps in the solution)
  const p5LC = p5.L * p5.C;
  // home experiment: mass on a spring, m = 0.20 kg, k = 20 N/m (the ratios are what matter)
  const tr = { m: 0.20, k: 20 }, trT0 = springPeriod(tr.m, tr.k);
  // bonus
  const dialLo = Math.round(radioF0(RADIO.cMax)), dialHi = Math.round(radioF0(RADIO.cMin)), ratio = dialHi / dialLo;
  return {
    slow: fmt(SLOW, 0), labT: fmt(def.T * 1000, 2), f0def: fmt(def.f0, 0), f0x4: fmt(x4.f0, 0),
    rMin: fmt(radioF0(RADIO.cMax), 0), rMax: fmt(radioF0(RADIO.cMin), 0),
    rC1000: fmt(radioC(1000), 0),
    rMinR: fmt(Math.round(radioF0(RADIO.cMax) / 10) * 10, 0), rMaxR: fmt(Math.round(radioF0(RADIO.cMin) / 10) * 10, 0),   // dial range rounded to 10 kHz, for prose only
    c1W: mJ(capEnergy(c1.C, c1.U), 2), c1w1: mJ(c1.C * c1.U * c1.U, 2), c1w2: mJ(0.5 * c1.C * c1.U, 2), c1w3: mJ(c1.C * c1.U, 2),
    c2W: mJ(inductorEnergy(c2.L, c2.I)), c2w1: mJ(c2.L * c2.I * c2.I), c2w2: mJ(c2.L * c2.I), c2w3: mJ(0.5 * c2.I * c2.I),
    c5f: fmt(lcFrequency(c5.L, c5.C), 0), c5w: fmt(c5w, 0), c5w1: fmt(c5w, 0), c5w2: fmt(2 * Math.PI * c5w, 0), c5w3: sci(1 / (2 * Math.PI * c5.L * c5.C), 2),
    ex1LC: sci(e1.L * e1.C, 2), ex1root: sci(Math.sqrt(e1.L * e1.C), 4), ex1root5: sci(Math.sqrt(e1.L * e1.C), 5), ex1w: fmt(e1w, 0), ex1f: fmt(e1w / (2 * Math.PI), 0),
    ex2W: fmt(e2W * 1e3, 2), ex2I2: fmt((2 * e2W) / e2.L, 3), ex2I: fmt(e2I, 2), ex2LC: sci(e2.L * e2.C, 2),
    ex2root: sci(Math.sqrt(e2.L * e2.C), 4), ex2root5: sci(Math.sqrt(e2.L * e2.C), 5), ex2w: fmt(lcOmega(e2.L, e2.C), 0), ex2f: fmt(e2f, 1), ex2T: fmt(e2T * 1e3, 2), ex2T4: fmt((e2T / 4) * 1e3, 2),
    p1f: fmt(lcFrequency(p1.L, p1.C), 0), p1w1: fmt(p1w, 0), p1w2: fmt(2 * Math.PI * p1w, 0), p1w3: fmt(lcFrequency(5, 2), 3),
    p2a: fmt((p2T / 4) * 1e3, 2), p2b: fmt((p2T / 2) * 1e3, 2), p2c: fmt(p2T * 1e3, 2), p2d: fmt((p2T / 8) * 1e3, 2),
    p4w: sci(p4w, 4), p4C: fmt(p4C * 1e12, 0), p4w1: fmt((1 / (p4.f * p4.f * p4.L)) * 1e12, 0), p4w2: fmt((1 / (p4w * p4w * 0.2)) * 1e12, 3), p4w3: fmt((1 / (2 * Math.PI ** 2 * p4.f * p4.f * p4.L)) * 1e12, 0),   // (2π)² written as 2π²
    p5f: fmt(p5f, 0), p5w: fmt(p5w, 0), p5w4: fmt(2 * Math.PI * p5w, 0), p5w5: sci(1 / (2 * Math.PI * p5.L * p5.C), 2),
    ex3w: sci(e3w, 4), ex3w2: sci(e3w * e3w, 4), ex3C: fmt(e3C * 1e12, 1),
    p5LC: sci(p5LC, 2), p5root: sci(Math.sqrt(p5LC), 4), p5root5: sci(Math.sqrt(p5LC), 5),
    trM: fmt(tr.m, 2), trK: fmt(tr.k, 0), trT0: fmt(trT0, 2), trT10: fmt(trT0 * 10, 1), trT1: fmt(springPeriod(2 * tr.m, tr.k), 2), trT2: fmt(springPeriod(tr.m, 2 * tr.k), 2),
    trT4: fmt(springPeriod(4 * tr.m, tr.k), 2), trSqrt2: fmt(Math.SQRT2, 2), trfL: fmt(lcFrequency(20e-3, 10e-6), 0), trfC: fmt(lcFrequency(10e-3, 5e-6), 0),
    bhI: fmt(Math.sqrt(0.75) * 100, 0),
    brRatio: fmt(ratio, 1), br1: fmt(Math.sqrt(ratio), 1), br2: fmt(ratio, 1), br3: fmt(ratio * ratio, 1), br4: fmt(ratio ** 3, 0),
  };
}

export function render(view, ctx) {
  const N = numbers();
  const c = ctx.content;
  const f = (str, extra) => fillStr(str, { ...N, ...extra });
  useFill(f);   // engine blocks fill their extra fields (whyNot) with it
  const deep = (v) => (typeof v === "string" ? f(v) : Array.isArray(v) ? v.map(deep) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x)])) : v);
  const id = ctx.chapter.id;
  const head = chapterHead(ctx, { art: null, sfx: c.hero.sfx, caption: c.hero.caption, intro: f(c.intro), slots: SLOTS });
  head.querySelector(".head-text").append(goals(c.goals.title, c.goals.items.map((x) => f(x))));
  const got = () => syncStrip(head, crystalsIn(id).size);
  const win = (key, el) => { award(id, key, el); got(); };
  const lockWin = (key) => (_, __, el, isPreview) => { if (!isPreview) win(key, el); };
  const pv = ctx.app("app.preview_answer");
  const check = (chk, key) => quickCheck({ q: f(chk.q), choices: chk.choices.map((x) => f(x)), answer: chk.answer, why: f(chk.why), whyNot: chk.whyNot, labels: c.checks, onRight: (el) => win(key, el) });

  // ----- warm-up (free-roam: gate is off unless ?gate) -----
  const { note: gateNote, rest, unlock } = gate(c.warmup.gate);
  const warm = c.warmup;
  const warmup = panel(warm.kicker, "hot", say(warm.say, "?"),
    vote({ question: warm.question, choices: warm.choices, answer: warm.answer, verdicts: warm.verdicts, explain: warm.explain,
      lockLabel: warm.lock, grid: true, previewVerdict: pv, saveKey: "o6-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- learn -----
  const fig = (svg, cap) => h("figure", { style: "margin:14px 0" }, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(cap))));
  const figStages = fig(stagesFig({ ...c.figs.stages, aria: f(c.figs.stages.aria) }), c.figs.stages.caption);
  const figDamp = fig(dampFig({ ...c.figs.damp, aria: f(c.figs.damp.aria) }), c.figs.damp.caption);
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(c.learn1.body), check(c.learn1.check, "check1"));
  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(c.learn2.body), check(c.learn2.check, "check2"));
  const lab = lcLab(deep(c.lab), (ev, el) => win(ev, el));    // ONE instance of the lab, in Step 3 (Steps 4 and 6 point back to it)
  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(c.learn3.body), figStages, rich(f(c.learn3.lab_lead)), lab,
    rich(f(c.learn3.tasks)), check(c.learn3.check, "check3"));
  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(c.learn4.body), check(c.learn4.check, "check4"));
  const learn5 = panel(c.learn5.kicker, "cool", h("h2", {}, c.learn5.title), rich(c.learn5.lead),
    twinMatch(c.twins, (el) => win("match", el), { preview: PREVIEW }), rich(c.learn5.body), check(c.learn5.check, "check5"));
  const learn6 = panel(c.learn6.kicker, "cool", h("h2", {}, c.learn6.title), rich(c.learn6.body), figDamp, check(c.learn6.check, "check6"));
  const learn7 = panel(c.learn7.kicker, "cool", h("h2", {}, c.learn7.title), rich(c.learn7.body), rich(f(c.learn7.game_lead)),
    radioGame(deep(c.radio), (_, el) => win("radio", el), { preview: PREVIEW }), check(c.learn7.check, "check7"));

  const examples = panel(c.examples.kicker, "sun", h("h2", {}, c.examples.title),
    ...c.examples.items.map((ex) => worked({ title: ex.title, problem: f(ex.problem), steps: ex.steps.map((x) => f(x)), answer: f(ex.answer), labels: { next: c.examples.next } })));

  // ----- practice -----
  const prac = panel(c.practice.kicker, "hot", h("h2", {}, c.practice.title),
    practice({ items: c.practice.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), hint: f(it.hint), solution: f(it.solution) })),
      labels: c.practice.labels, onDone: (right, el) => { if (right >= 3) win("practice", el); } }));

  // ----- explore -----
  const story = panel(c.story.kicker, "", h("h2", {}, c.story.title), comic(c.story.frames));
  const sim = panel(c.sim.kicker, "cool", ...simCard(c.sim, SIM_URL));
  const T = c.trial;
  const trial = panel(T.kicker, "sun", h("h2", {}, T.title), rich(f(T.lead)), rich(f(T.safety)), rich(f(T.need)), rich(f(T.steps)), rich(f(T.measure)), rich(f(T.compare)), rich(f(T.wrong)));
  const manga = panel(c.manga.kicker, "sun", h("h2", {}, c.manga.title), rich(c.manga.body));

  // ----- remember + quiz -----
  const sum = panel(c.summary.kicker, "sun", h("h2", {}, c.summary.title), summary(c.summary.items));
  const quiz = panel(c.quiz.kicker, "hot", h("h2", {}, c.quiz.title),
    quickfire({ items: c.quiz.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), why: f(it.why) })), labels: c.quiz.labels,
      onDone: (score, el) => { if (score >= 2) win("quiz", el); } }));

  // ----- BONUS: beyond the syllabus -----
  const bsum = panel(c.bsum.kicker, "sun", h("h2", {}, c.bsum.title), rich(c.bsum.lead),
    choiceSteps(c.bsum.steps, { tryAgain: c.bsum.try_again, onDone: (el) => win("b-sum", el) }));
  const bhalf = panel(c.bhalf.kicker, "sun", h("h2", {}, c.bhalf.title),
    vote({ question: c.bhalf.question, choices: c.bhalf.choices, answer: c.bhalf.answer, verdicts: c.bhalf.verdicts, explain: f(c.bhalf.explain),
      lockLabel: c.bhalf.lock, grid: true, previewVerdict: pv, onLock: lockWin("b-half") }));
  const brange = panel(c.brange.kicker, "sun", h("h2", {}, c.brange.title),
    vote({ question: f(c.brange.question), choices: c.brange.choices.map((x) => f(x)), answer: c.brange.answer, verdicts: c.brange.verdicts, explain: f(c.brange.explain),
      lockLabel: c.brange.lock, grid: true, previewVerdict: pv, onLock: lockWin("b-range") }));
  const bimp = panel(c.bimp.kicker, "sun", h("h2", {}, c.bimp.title), rich(c.bimp.body));

  rest.append(learn1, learn2, learn3, learn4, learn5, learn6, learn7, examples, prac, story, sim, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note), bsum, bhalf, brange, bimp, chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}
