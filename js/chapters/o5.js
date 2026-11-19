// Chapter o5: Shatter the glass (S6 Oscillations: free and forced oscillations, driving frequency, resonance f_d = f_0,
// the amplitude-versus-driving-frequency curve (qualitative), damping, resonance in the real world).
// Teach-first layout: goals → warm-up → learn steps with checks → worked examples → practice → explore → summary
// → quiz → BONUS (the amplitude formula, how fast it builds up, the Tacoma Narrows myth).
import { h, s, rich } from "../dom.js";
import { curveFig, pushFig, PUSH_RATIO } from "./o5-figs.js";
import { resonanceLab, pushGame, makeDriven, steadyAmp, dampCoef, QS, K, F0, YMAX, SWING } from "../widgets/resonance.js";
import {
  panel, say, vote, quickfire, sortCards, comic, chapterHead, chapterNav,
  award, fillStr, syncStrip, gate, goals, quickCheck, worked, practice, summary, bonusDivider, useFill
} from "../engine.js";
import { crystalsIn } from "../store.js";
import { G, springFrequency, springPeriod, springOmega, pendulumFrequency, pendulumPeriod, fmt } from "../physics.js";

// warmup, check1-4, push, sort, plot, peak, damp, snap, practice, story, quiz, b-amp, b-cycles, b-myth
export const AWARD_KEYS = ["warmup", "check1", "check2", "check3", "check4", "push", "sort", "plot", "peak", "damp", "snap",
  "practice", "story", "quiz", "b-amp", "b-cycles", "b-myth"];
const SLOTS = AWARD_KEYS.length;
const LAB_M = 0.5;                                    // kg, the lab's starting mass

export function numbers() {
  const f0 = springFrequency(LAB_M, K);
  const eL = 0.25, eF = pendulumFrequency(eL), eL2 = 1.0, eF2 = pendulumFrequency(eL2);   // home experiment: key on a thread
  const w0 = springOmega(LAB_M, K);
  const x0 = F0 / K;                                  // static stretch from the peak push, m
  const swingT = pendulumPeriod(SWING.len), swingF = pendulumFrequency(SWING.len);
  // worked example 1: spring 0.25 kg, 100 N/m
  const w1m = 0.25, w1k = 100, w1f = springFrequency(w1m, w1k);
  // worked example 2: swing with L = 3.0 m
  const w2L = 3.0, w2f = pendulumFrequency(w2L), w2T = pendulumPeriod(w2L);
  // practice
  const p1m = 0.2, p1k = 50, p1f = springFrequency(p1m, p1k);
  const p2L = 1.0, p2f = pendulumFrequency(p2L);
  const p5f = 2.0;
  // bonus: amplitude formula (lab defaults: 0.50 kg, k = 20 N/m, F0 = 1.0 N, light damping)
  const bL = dampCoef(LAB_M, QS.light), aRes = steadyAmp(LAB_M, bL, f0), aRes2 = steadyAmp(LAB_M, bL / 2, f0);
  // bonus: how quickly very light damping reaches the snap limit when driven exactly at f0
  const aVl = steadyAmp(LAB_M, dampCoef(LAB_M, QS.vlight), f0);
  const nFormula = (QS.vlight * Math.log(1 / (1 - YMAX / aVl))) / Math.PI;
  const d = makeDriven(LAB_M, QS.vlight, f0);
  while (!d.snapped && d.t < 120) d.step();
  return {
    g: fmt(G, 2),
    labK: fmt(K, 0), labM: fmt(LAB_M, 2), labF: fmt(F0, 1), labF0: fmt(f0, 2), labT: fmt(springPeriod(LAB_M, K), 2), labW0: fmt(w0, 2), labKm: fmt(K / LAB_M, 0), labInv: fmt(Math.sqrt(LAB_M / K) / (2 * Math.PI), 3),
    labX0: fmt(x0 * 100, 0), labLimit: fmt(YMAX * 100, 0),
    swingL: fmt(SWING.len, 1), swingT: fmt(swingT, 2), swingF: fmt(swingF, 3), goalDeg: fmt(SWING.goalDeg, 0),
    // worked example 1
    w1m: fmt(w1m, 2), w1k: fmt(w1k, 0), w1r: fmt(w1k / w1m, 0), w1s: fmt(Math.sqrt(w1k / w1m), 1), w1f: fmt(w1f, 2), w1T: fmt(1 / w1f, 3),
    // worked example 2
    w2L: fmt(w2L, 1), w2r: fmt(G / w2L, 2), w2s: fmt(Math.sqrt(G / w2L), 3), w2f: fmt(w2f, 3), w2T: fmt(w2T, 2), w2min: fmt(60 / w2T, 1), w2minR: fmt(Math.round(60 / w2T), 0),
    // practice
    p1m: fmt(p1m, 2), p1k: fmt(p1k, 0), p1f: fmt(p1f, 2), p1r: fmt(p1k / p1m, 0), p1s: fmt(Math.sqrt(p1k / p1m), 2), p1w1: fmt(1 / p1f, 2), p1w2: fmt(Math.sqrt(p1k / p1m), 1), p1w3: fmt((p1k / p1m) / (2 * Math.PI), 1),
    p2L: fmt(p2L, 1), p2f: fmt(p2f, 3), p2r: fmt(G / p2L, 2), p2s: fmt(Math.sqrt(G / p2L), 3), p2w1: fmt(1 / p2f, 2), p2w2: fmt(Math.sqrt(G / p2L), 2), p2w3: fmt(1 / (2 * Math.PI), 2),
    p5f: fmt(p5f, 1), p5min: fmt(p5f * 60, 0), p5w1: fmt(p5f, 0), p5w2: fmt(60 / p5f, 0), p5w3: fmt(p5f * 120, 0),
    // figures and home experiment
    figRatio: fmt(PUSH_RATIO, 2),
    expL: fmt(eL, 2), expF: fmt(eF, 2), expT: fmt(1 / eF, 2), expT10: fmt(10 / eF, 1), expPm: fmt(Math.round(60 * eF), 0),
    expTick: fmt(Math.round(120 * eF), 0), expSlowF: fmt(eF / 2, 2), expSlowT: fmt(2 / eF, 1), expSlowTick: fmt(Math.round(120 * eF) / 2, 0),
    expFastF: fmt(2 * eF, 1), expFastT: fmt(1 / (2 * eF), 1), expFastTick: fmt(Math.round(120 * eF) * 2, 0),
    expL2: fmt(eL2, 1), expF2: fmt(eF2, 2), expT2: fmt(1 / eF2, 2),
    // bonus
    bLight: fmt(bL, 2), bHalf: fmt(bL / 2, 3), bAres: fmt(aRes * 100, 0), bAres2: fmt(aRes2 * 100, 0), bAresHalf: fmt((aRes * 100) / 2, 1), bAres4: fmt(aRes * 400, 0),
    bQ: fmt(QS.light, 0), bQ2: fmt(QS.vlight, 0), bAvl: fmt(aVl * 100, 0), bNform: fmt(nFormula, 1), bNsim: fmt(d.t * f0, 1), bTsim: fmt(d.t, 1),
  };
}

const ICONS = {
  swing: () => s("svg", { viewBox: "0 0 80 60" }, s("path", { d: "M14 6h52M30 6l-6 34M50 6l6 34M20 40h40", fill: "none", stroke: "#2ef2ff", "stroke-width": 4, "stroke-linecap": "round" }), s("circle", { cx: 40, cy: 32, r: 7, fill: "#ff4fd8" })),
  radio: () => s("svg", { viewBox: "0 0 80 60" }, s("rect", { x: 8, y: 20, width: 64, height: 34, rx: 6, fill: "none", stroke: "#2ef2ff", "stroke-width": 4 }), s("circle", { cx: 52, cy: 37, r: 8, fill: "#ff4fd8" }), s("path", { d: "M18 37h18M50 20L66 6", stroke: "#2ef2ff", "stroke-width": 4, "stroke-linecap": "round" })),
  fork: () => s("svg", { viewBox: "0 0 80 60" }, s("path", { d: "M30 6v26q0 8 10 8t10-8V6M40 40v16", fill: "none", stroke: "#2ef2ff", "stroke-width": 4, "stroke-linecap": "round" }), s("path", { d: "M18 14q-6 8 0 16M62 14q6 8 0 16", fill: "none", stroke: "#ff4fd8", "stroke-width": 4, "stroke-linecap": "round" })),
  bridge: () => s("svg", { viewBox: "0 0 80 60" }, s("path", { d: "M4 36q18 8 36 0t36 0", fill: "none", stroke: "#2ef2ff", "stroke-width": 5 }), s("path", { d: "M14 36v14M40 36v14M66 36v14", stroke: "#ff4fd8", "stroke-width": 4 })),
  tower: () => s("svg", { viewBox: "0 0 80 60" }, s("rect", { x: 30, y: 6, width: 20, height: 50, fill: "none", stroke: "#2ef2ff", "stroke-width": 4 }), s("path", { d: "M18 20q-6 10 0 20M62 20q6 10 0 20", fill: "none", stroke: "#ff4fd8", "stroke-width": 4, "stroke-linecap": "round" })),
  machine: () => s("svg", { viewBox: "0 0 80 60" }, s("rect", { x: 18, y: 6, width: 44, height: 48, rx: 5, fill: "none", stroke: "#2ef2ff", "stroke-width": 4 }), s("circle", { cx: 40, cy: 32, r: 12, fill: "none", stroke: "#ff4fd8", "stroke-width": 4 })),
};

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
  const vv = (b, key, extra = {}) => vote({ question: f(b.question), choices: b.choices.map((x) => f(x)), answer: b.answer, verdicts: b.verdicts.map((x) => f(x)),
    explain: f(b.explain), lockLabel: b.lock, grid: true, previewVerdict: pv, onLock: lockWin(key), ...extra });

  // ----- warm-up (free-roam: gate is off unless ?gate) -----
  const { note: gateNote, rest, unlock } = gate(c.warmup.gate);
  const warm = c.warmup;
  const warmup = panel(warm.kicker, "hot", say(warm.say, "?"),
    vote({ question: warm.question, choices: warm.choices, answer: warm.answer, verdicts: warm.verdicts, explain: f(warm.explain),
      lockLabel: warm.lock, grid: true, previewVerdict: pv, saveKey: "o5-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- learn -----
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(f(c.learn1.body)), check(c.learn1.check, "check1"));
  const gameWin = h("div", {}, h("div", { class: "verdict-row" }, h("p", { class: "verdict" }, c.game.win_head)), rich(f(c.game.win)));
  const fig = (svg, cap) => h("figure", { style: "margin:14px 0" }, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(cap))));
  const fp = c.figs.push, fc = c.figs.curve;
  const figPush = fig(pushFig({ ...fp, aria: f(fp.aria), rowB: f(fp.rowB) }, PUSH_RATIO), fp.caption);
  const figCurve = fig(curveFig({ ...fc, aria: f(fc.aria), f0: f(fc.f0) }, { m: LAB_M }), fc.caption);
  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(f(c.learn2.body)), rich(f(c.game.lead)),
    pushGame(c.game, gameWin, (el) => win("push", el)), rich(f(c.learn2.after)), figPush, check(c.learn2.check, "check2"));
  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(f(c.learn3.body)), rich(f(c.lab.lead)),
    resonanceLab(c.lab, (ev, el) => win(ev, el)), rich(f(c.lab.tasks)), rich(f(c.lab.curve)), figCurve, check(c.learn3check, "check3"));
  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(f(c.learn4.body)), rich(c.sort.lead),
    sortCards(c.sort.cards.map((card) => ({ ...card, svg: ICONS[card.icon]() })), { yes: c.sort.yes, no: c.sort.no, onAll: (el) => win("sort", el) }),
    rich(f(c.learn4.after)), check(c.learn4.check, "check4"));

  const examples = panel(c.examples.kicker, "sun", h("h2", {}, c.examples.title),
    ...c.examples.items.map((ex) => worked({ title: ex.title, problem: f(ex.problem), steps: ex.steps.map((x) => f(x)), answer: f(ex.answer), labels: { next: c.examples.next } })));

  // ----- practice -----
  const prac = panel(c.practice.kicker, "hot", h("h2", {}, c.practice.title),
    practice({ items: c.practice.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), hint: f(it.hint), solution: f(it.solution) })),
      labels: c.practice.labels, onDone: (right, el) => { if (right >= 3) win("practice", el); } }));

  // ----- explore (no PhET card: there is no HTML5 resonance sim) -----
  const story = panel(c.story.kicker, "", h("h2", {}, c.story.title), comic(c.story.frames.map((fr) => ({ ...fr, text: f(fr.text) }))),
    vote({ question: c.story.question, choices: c.story.choices, answer: c.story.answer, verdicts: c.story.verdicts,
      explain: f(c.story.explain), lockLabel: c.story.lock, previewVerdict: pv, onLock: lockWin("story") }));
  const T = c.trial;
  const trial = panel(T.kicker, "sun", h("h2", {}, T.title), rich(f(T.lead)), rich(f(T.safety)), rich(f(T.need)), rich(f(T.steps)), rich(f(T.measure)), rich(f(T.compare)), rich(f(T.wrong)));
  const manga = panel(c.manga.kicker, "sun", h("h2", {}, c.manga.title), rich(f(c.manga.body)));

  // ----- remember + quiz -----
  const sum = panel(c.summary.kicker, "sun", h("h2", {}, c.summary.title), summary(c.summary.items.map((x) => f(x))));
  const quiz = panel(c.quiz.kicker, "hot", h("h2", {}, c.quiz.title),
    quickfire({ items: c.quiz.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), why: f(it.why) })), labels: c.quiz.labels,
      onDone: (score, el) => { if (score >= 2) win("quiz", el); } }));

  // ----- BONUS -----
  const bAmp = panel(c.bamp.kicker, "sun", h("h2", {}, c.bamp.title), rich(f(c.bamp.lead)), vv(c.bamp, "b-amp"));
  const bCyc = panel(c.bcyc.kicker, "sun", h("h2", {}, c.bcyc.title), rich(f(c.bcyc.lead)), vv(c.bcyc, "b-cycles"));
  const bMyth = panel(c.bmyth.kicker, "sun", h("h2", {}, c.bmyth.title), rich(f(c.bmyth.lead)), vv(c.bmyth, "b-myth"));

  rest.append(learn1, learn2, learn3, learn4, examples, prac, story, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note), bAmp, bCyc, bMyth, chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}
