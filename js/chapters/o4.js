// Chapter o4: Where the bounce goes (S6 Oscillations: energy in simple harmonic motion, W = ½·k·A², v_max = A·ω,
// energy graphs, damping in words only; bonus: decay per swing, Q factor, critical damping).
// Teach-first layout: goals → warm-up → learn steps with checks → worked examples → practice → explore → summary
// → quiz → BONUS.
import { h, rich } from "../dom.js";
import { energyFig, dampFig } from "./o4-figs.js";
import { energyLab, catchGame, splitGame, dampingDetective } from "../widgets/energybars.js";
import {
  panel, say, vote, quickfire, choiceSteps, comic, chapterHead, simCard, chapterNav,
  award, fillStr, syncStrip, gate, goals, quickCheck, worked, practice, summary, bonusDivider, PREVIEW, useFill
} from "../engine.js";
import { crystalsIn } from "../store.js";
import { G, shmEnergy, shmSpeedAt, springPeriod, springOmega, pendulumPeriod, fmt } from "../physics.js";

const SIM_URL = "https://phet.colorado.edu/sims/html/masses-and-springs/latest/masses-and-springs_en.html";
export const AWARD_KEYS = [
  "warmup", "check1", "check2", "check3", "check4", "check5", "split", "catch", "derive", "lab-double", "lab-damp",
  "detective", "practice", "story", "quiz", "b-decay", "b-crit",
];
const SLOTS = AWARD_KEYS.length;

const DEMO = { m: 0.5, k: 20, A: 0.10 };               // the lab's starting spring
const PEND = { m: 0.5, h: 0.15 };                      // pendulum recap (m·g·Δh = ½·m·v²)
const WE = { m: 0.20, k: 80, A: 0.05, y: 0.03 };       // worked examples
const P1 = { k: 40, A: 0.10, m: 0.50 };                // practice 1 and 2
const P4 = { m: 0.20, k: 50, A: 0.06, y: 0.03 };       // practice 4
const P5 = { m: 0.30, h: 0.20 };                       // practice 5 (pendulum)
const DECAY = { loss: 0.10, n: 5 };                    // bonus: 10% of the energy lost per swing
const CRIT = { m: 0.5, k: 20 };                        // bonus: critical damping b = 2√(m·k)
const FIG_HALF = 3;                                     // figure 2 (schematic): amplitude halves after 3 swings
const EXP = { L: 0.50, A0: 10, A1: 5, n: 10 };         // "Try it for real": pendulum, amplitude in cm, swings timed

export function numbers() {
  const dW = shmEnergy(DEMO.k, DEMO.A);
  const we1W = shmEnergy(WE.k, WE.A), we1v = Math.sqrt((2 * we1W) / WE.m);
  const we2U = 0.5 * WE.k * WE.y * WE.y, we2K = we1W - we2U, we2v = Math.sqrt((2 * we2K) / WE.m);
  const p1W = shmEnergy(P1.k, P1.A), p2v = shmSpeedAt(P1.m, P1.k, P1.A, 0);
  const p4v = shmSpeedAt(P4.m, P4.k, P4.A, P4.y), p4max = P4.A * springOmega(P4.m, P4.k);
  const p5v = Math.sqrt(2 * G * P5.h);
  const keep = (1 - DECAY.loss) ** DECAY.n;
  return {
    g: fmt(G, 2),
    // the lab's starting spring
    demoM: fmt(DEMO.m, 2), demoK: fmt(DEMO.k, 0), demoA: fmt(DEMO.A * 100, 0), demoW: fmt(dW, 2),
    demoV: fmt(DEMO.A * springOmega(DEMO.m, DEMO.k), 2), demoT: fmt(springPeriod(DEMO.m, DEMO.k), 2),
    demoW2: fmt(shmEnergy(DEMO.k, 2 * DEMO.A), 2), x4: fmt(shmEnergy(DEMO.k, 2 * DEMO.A) / dW, 0),
    spot: fmt(Math.SQRT1_2, 2), spotPct: fmt(Math.SQRT1_2 * 100, 0),
    // pendulum recap
    pM: fmt(PEND.m, 2), pH: fmt(PEND.h, 2), pE: fmt(PEND.m * G * PEND.h, 2), pV: fmt(Math.sqrt(2 * G * PEND.h), 2),
    // worked example 1: W and v_max
    we1W: fmt(we1W, 2), we1W2: fmt(2 * we1W, 2), we1r: fmt((2 * we1W) / WE.m, 2), we1v: fmt(we1v, 2),
    we1w: fmt(springOmega(WE.m, WE.k), 1), we1Aw: fmt(WE.A * springOmega(WE.m, WE.k), 2),
    // worked example 2: speed at y = 0.03 m
    we2U: fmt(we2U, 3), we2K: fmt(we2K, 3), we2K2: fmt(2 * we2K, 3), we2r: fmt((2 * we2K) / WE.m, 2), we2v: fmt(we2v, 2),
    // practice
    p1W: fmt(p1W, 2), p1w1: fmt(P1.k * P1.A * P1.A, 2), p1w2: fmt(0.5 * P1.k * P1.A, 1), p1w3: fmt(P1.k * P1.A, 1),
    p2v: fmt(p2v, 2), p2w1: fmt(Math.sqrt(p1W / P1.m), 2), p2w2: fmt((2 * p1W) / P1.m, 2), p2w3: fmt(springOmega(P1.m, P1.k), 2),
    p4W: fmt(shmEnergy(P4.k, P4.A), 3), p4U: fmt(0.5 * P4.k * P4.y * P4.y, 4), p4K: fmt(shmEnergy(P4.k, P4.A) - 0.5 * P4.k * P4.y * P4.y, 4), p4v: fmt(p4v, 2), p4w1: fmt(p4max, 2), p4w2: fmt(springOmega(P4.m, P4.k) * P4.y, 2), p4w3: fmt(Math.sqrt(((shmEnergy(P4.k, P4.A) - 0.5 * P4.k * P4.y * P4.y)) / P4.m), 2),
    p5v: fmt(p5v, 2), p5w1: fmt(2 * G * P5.h, 2), p5w2: fmt(Math.sqrt(G * P5.h), 2), p5w3: fmt(Math.sqrt((2 * P5.h) / G), 2),
    p5E: fmt(P5.m * G * P5.h, 2),
    // bonus
    decLoss: fmt(DECAY.loss * 100, 0), decN: fmt(DECAY.n, 0), dec5: fmt(keep * 100, 0), decLost: fmt((1 - keep) * 100, 0),
    decAmp: fmt(Math.sqrt(keep) * 100, 0), decHalf: fmt(Math.log(0.5) / Math.log(1 - DECAY.loss), 1),
    decQ: fmt((2 * Math.PI) / DECAY.loss, 0), decLossF: fmt(DECAY.loss, 2), decKeep: fmt(1 - DECAY.loss, 2),
    figHalf: fmt(FIG_HALF, 0),
    expL: fmt(EXP.L, 2), expA0: fmt(EXP.A0, 0), expA1: fmt(EXP.A1, 0), expTen: fmt(EXP.n, 0),
    expT: fmt(pendulumPeriod(EXP.L), 2), expTenT: fmt(EXP.n * pendulumPeriod(EXP.L), 0),
    expQ: fmt((EXP.A1 / EXP.A0) ** 2 * 100, 0),
    critM: fmt(CRIT.m, 2), critK: fmt(CRIT.k, 0), bcrit: fmt(2 * Math.sqrt(CRIT.m * CRIT.k), 1),
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
      lockLabel: warm.lock, grid: true, previewVerdict: pv, saveKey: "o4-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- learn -----
  const fig = (svg, cap) => h("figure", { style: "margin:14px 0" }, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(cap))));
  const figEnergy = fig(energyFig({ ...c.figs.energy, aria: f(c.figs.energy.aria) }), c.figs.energy.caption);
  const figDamp = fig(dampFig({ ...c.figs.damp, aria: f(c.figs.damp.aria), half: f(c.figs.damp.half) }, { halfSwings: FIG_HALF }), c.figs.damp.caption);
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(f(c.learn1.body)), rich(f(c.learn1.pendulum)),
    check(c.learn1.check, "check1"));
  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(f(c.learn2.body)), rich(f(c.lab.lead)),
    energyLab(c.lab, (ev, el) => { if (ev === "double") win("lab-double", el); if (ev === "damp") win("lab-damp", el); }),
    rich(f(c.lab.tasks)), rich(f(c.learn2.after)), check(c.learn2.check, "check2"));
  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(f(c.learn3.body)), figEnergy,
    rich(c.split.lead), splitGame(c.split, (el) => win("split", el)),
    rich(f(c.learn3.spot)), rich(c.catch.lead), catchGame({ ...c.catch, win: f(c.catch.win) }, (el) => win("catch", el)),
    check(c.learn3.check, "check3"));
  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(f(c.learn4.lead)),
    choiceSteps(c.derive.steps.map((st) => ({ ...st, prompt: f(st.prompt), then: f(st.then) })), { tryAgain: c.derive.try_again, onDone: (el) => win("derive", el) }),
    rich(f(c.learn4.after)), check(c.learn4.check, "check4"));
  const learn5 = panel(c.learn5.kicker, "cool", h("h2", {}, c.learn5.title), rich(f(c.learn5.body)), figDamp,
    rich(c.detect.lead), dampingDetective(c.detect, (el) => win("detective", el)),
    rich(f(c.learn5.after)), check(c.learn5.check, "check5"));

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
  const decayAfter = h("div", { hidden: !PREVIEW }, rich(f(c.decay.after)));
  const decay = panel(c.decay.kicker, "sun", h("h2", {}, c.decay.title), say(f(c.decay.say), "!"), rich(f(c.decay.lead)),
    vv(c.decay, { question: f(c.decay.question), grid: true, explain: null,
      onLock: (_, __, el, isPreview) => { decayAfter.hidden = false; if (!isPreview) win("b-decay", el); } }), decayAfter);
  const crit = panel(c.crit.kicker, "sun", h("h2", {}, c.crit.title), rich(f(c.crit.lead)),
    vote({ question: f(c.crit.question), choices: c.crit.choices, answer: c.crit.answer, verdicts: c.crit.verdicts,
      explain: f(c.crit.explain), lockLabel: c.crit.lock, grid: true, previewVerdict: pv, onLock: lockWin("b-crit") }));

  rest.append(learn1, learn2, learn3, learn4, learn5, examples, prac, story, sim, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note), decay, crit, chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}
