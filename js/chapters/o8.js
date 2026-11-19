// Chapter o8: A wave in space and time (S6 Description of waves: the sinusoidal wave y(x, t) = A·sin(2π(t/T − x/λ)),
// the snapshot y(x) and the history y(t), phase, wave speed λ/T versus the bead's own velocity, maximum A·ω).
// Teach-first layout: goals → warm-up → learn steps with checks → worked examples → practice → explore → summary
// → quiz → BONUS (why λ/T, the wave towards −x, energy and A²).
import { h, rich } from "../dom.js";
import { wavegraphsLab, matchGame, beadVMax, readings } from "../widgets/wavegraphs.js";
import {
  panel, say, vote, quickfire, comic, chapterHead, simCard, chapterNav,
  award, fillStr, syncStrip, gate, goals, quickCheck, worked, practice, summary, bonusDivider, useFill
} from "../engine.js";
import { phaseFig, graphsFig } from "./o8-figs.js";
import { crystalsIn } from "../store.js";
import { waveY, fmt, sci } from "../physics.js";

const SIM_URL = "https://phet.colorado.edu/sims/html/waves-intro/latest/waves-intro_en.html";
// warmup, check1-5, bead + time (lab), match (game), practice, story, quiz, b-speed, b-left, b-energy
export const AWARD_KEYS = ["warmup", "check1", "check2", "check3", "check4", "check5", "bead", "time", "match", "practice", "story", "quiz", "b-speed", "b-left", "b-energy"];
const SLOTS = AWARD_KEYS.length;

const EX = { A: 0.05, T: 0.4, lam: 2.0 };              // the example wave (also the lab's start): y = 0.05·sin(2π(t/0.40 − x/2.0))
const TSU = { v: 200, T: 900, A: 0.5 };                // illustrative open-ocean tsunami: 200 m/s, 15 min, 0.5 m
const D2R = Math.PI / 180;
const W3 = { lam: 0.8, n: 6, t: 3.0 };                  // worked example 3: from the two graphs
const EXP = { len: 3, mark: 0.5, lam: 0.8, fps: 30, n: 15, frames: 3 }; // home experiment: filmed rope

/** Every number in the prose, from physics.js (and the lab's own pure helpers). */
export function numbers() {
  const ex = readings(EX.A, EX.T, EX.lam, 0, 0);
  const c3 = { A: 0.08, T: 0.25, lam: 1.5 };
  const we1 = { A: 0.12, T: 0.5, lam: 3.0 };
  const we2 = { A: 0.2, T: 0.8, lam: 1.5, x: 0.5, t: 0.3 };
  const we2ph = 2 * Math.PI * (we2.t / we2.T - we2.x / we2.lam);
  const we2y = waveY(we2.x, we2.t, we2.A, we2.T, we2.lam);
  const p1 = { A: 0.03, T: 0.2, lam: 0.8 };
  const p2 = { A: 0.04, T: 0.5, lam: 1.2, x: 0.3, t: 0.2 };
  const p2ph = 2 * Math.PI * (p2.t / p2.T - p2.x / p2.lam);
  const p4 = { lam: 0.6, n: 5, t: 2.0 };
  const p5 = { A: 0.02, T: 0.5, lam: 1.0 };
  const ts = { lam: TSU.v * TSU.T, vmax: beadVMax(TSU.A, TSU.T) };
  const expT = EXP.n / EXP.fps, expV = EXP.lam / expT;
  const bA = { A1: 0.05, A2: 0.1, T: 0.4 };
  return {
    exA: fmt(EX.A, 2), exT: fmt(EX.T, 2), exF: fmt(1 / EX.T, 1), exLam: fmt(EX.lam, 1), exV: fmt(ex.v, 1),
    exOm: fmt((2 * Math.PI) / EX.T, 1), exVmax: fmt(ex.vmax, 2), exRatio: fmt(ex.v / ex.vmax, 1),
    qV: fmt(ex.v, 0), exHalf: fmt(EX.lam / 2, 1), exQuarter: fmt(EX.lam / 4, 1),
    // check 3
    c3A: fmt(c3.A, 2), c3T: fmt(c3.T, 2), c3L: fmt(c3.lam, 1), c3f: fmt(1 / c3.T, 1), c3w1: fmt(c3.T, 2), c3w2: fmt(1 / c3.lam, 2), c3w3: fmt(c3.lam / c3.T, 1),
    // worked example 1: read the equation
    w1A: fmt(we1.A, 2), w1T: fmt(we1.T, 2), w1L: fmt(we1.lam, 1), w1f: fmt(1 / we1.T, 1), w1v: fmt(we1.lam / we1.T, 1),
    w1om: fmt((2 * Math.PI) / we1.T, 2), w1vmax: fmt(beadVMax(we1.A, we1.T), 2),
    // worked example 2: calculate y
    w2A: fmt(we2.A, 2), w2T: fmt(we2.T, 2), w2L: fmt(we2.lam, 1), w2x: fmt(we2.x, 2), w2t: fmt(we2.t, 2),
    w2tT: fmt(we2.t / we2.T, 4), w2xL: fmt(we2.x / we2.lam, 4), w2dif: fmt(we2.t / we2.T - we2.x / we2.lam, 4),
    w2dif5: fmt(we2.t / we2.T - we2.x / we2.lam, 5), w2ph: fmt(we2ph, 4), w2deg: fmt(we2ph / D2R, 1), w2sin: fmt(Math.sin(we2ph), 4), w2y: fmt(we2y, 4),
    // worked example 3: from the two graphs
    w3lam: fmt(W3.lam, 2), w3n: fmt(W3.n, 0), w3t: fmt(W3.t, 1), w3f: fmt(W3.n / W3.t, 1), w3T: fmt(W3.t / W3.n, 2), w3v: fmt((W3.n / W3.t) * W3.lam, 1), w3half: fmt(W3.lam / 2, 2),
    // home experiment (filmed rope)
    expLen: fmt(EXP.len, 0), expMark: fmt(EXP.mark, 2), expLam: fmt(EXP.lam, 2), expFps: fmt(EXP.fps, 0), expN: fmt(EXP.n, 0), expT: fmt(expT, 2), expF: fmt(1 / expT, 1), expV: fmt(expV, 1),
    expDt: fmt(EXP.frames / EXP.fps, 2), expD3: fmt(expV * EXP.frames / EXP.fps, 2), expFr30: fmt(1 / 30, 3), expFr240: fmt(1 / 240, 4), expErr: fmt((1 / EXP.fps) / expT * 100, 1),
    // practice 1: v from the equation
    p1A: fmt(p1.A, 3), p1T: fmt(p1.T, 2), p1L: fmt(p1.lam, 2), p1v: fmt(p1.lam / p1.T, 1), p1w1: fmt(p1.lam * p1.T, 2), p1w2: fmt(1 / p1.T, 1), p1w3: fmt(p1.A / p1.T, 2),
    // practice 2: y at x, t (radians!)
    p2A: fmt(p2.A, 3), p2T: fmt(p2.T, 2), p2L: fmt(p2.lam, 1), p2x: fmt(p2.x, 2), p2t: fmt(p2.t, 2),
    p2ph: fmt(p2ph, 4), p2tT: fmt(p2.t / p2.T, 4), p2xL: fmt(p2.x / p2.lam, 4), p2y: fmt(waveY(p2.x, p2.t, p2.A, p2.T, p2.lam), 4),
    p2deg: sci(p2.A * Math.sin(p2ph * D2R), 2),                                   // calculator left in degrees
    p2no2pi: fmt(p2.A * Math.sin(p2.t / p2.T - p2.x / p2.lam), 4),                // forgot the 2π
    p2sign: fmt(waveY(-p2.x, p2.t, p2.A, p2.T, p2.lam), 4),                       // x sign slip
    // practice 3: phase
    p3L: fmt(3.0, 1), p3d: fmt(1.5, 1), p3frac: fmt(1.5 / 3.0, 1),
    // practice 4: from two graphs
    p4lam: fmt(p4.lam, 2), p4n: fmt(p4.n, 0), p4t: fmt(p4.t, 1), p4f: fmt(p4.n / p4.t, 1), p4v: fmt((p4.n / p4.t) * p4.lam, 1),
    p4w1: fmt(p4.n * p4.lam, 1), p4w2: fmt(p4.lam / (p4.n / p4.t), 2), p4w3: fmt(p4.t * p4.lam, 1), p4T: fmt(p4.lam / ((p4.n / p4.t) * p4.lam), 2),
    // practice 5: the bead's maximum velocity
    p5A: fmt(p5.A, 3), p5T: fmt(p5.T, 2), p5L: fmt(p5.lam, 1), p5v: fmt(p5.lam / p5.T, 1), p5vmax: fmt(beadVMax(p5.A, p5.T), 2),
    p5om: fmt((2 * Math.PI) / p5.T, 2), p5w1: fmt(p5.A / p5.T, 2), p5w2: fmt(Math.PI * p5.A / p5.T, 2),
    // the tsunami story
    tsV: fmt(TSU.v, 0), tsKmh: fmt(TSU.v * 3.6, 0), tsA: fmt(TSU.A, 1), tsT: fmt(TSU.T, 0), tsTmin: fmt(TSU.T / 60, 0), tsLam: fmt(ts.lam / 1000, 0),
    tsVmaxMm: fmt(ts.vmax * 1000, 1), tsRatio: sci(TSU.v / ts.vmax, 2),
    // bonus: energy and A²
    bA1: fmt(bA.A1, 2), bA2: fmt(bA.A2, 2), bV1: fmt(beadVMax(bA.A1, bA.T), 2), bV2: fmt(beadVMax(bA.A2, bA.T), 2), bT: fmt(bA.T, 2),
    bRatio: fmt(beadVMax(bA.A2, bA.T) / beadVMax(bA.A1, bA.T), 0), bE: fmt((beadVMax(bA.A2, bA.T) / beadVMax(bA.A1, bA.T)) ** 2, 0),
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
  const bonusVote = (b, key) => vote({ question: f(b.question), choices: b.choices.map((x) => f(x)), answer: b.answer, verdicts: b.verdicts.map((x) => f(x)),
    explain: f(b.explain), lockLabel: b.lock, grid: true, previewVerdict: pv, onLock: lockWin(key) });

  // ----- warm-up (free-roam: gate is off unless ?gate) -----
  const { note: gateNote, rest, unlock } = gate(c.warmup.gate);
  const warm = c.warmup;
  const warmup = panel(warm.kicker, "hot", say(warm.say, "?"),
    vote({ question: f(warm.question), choices: warm.choices.map((x) => f(x)), answer: warm.answer, verdicts: warm.verdicts, explain: f(warm.explain),
      lockLabel: warm.lock, grid: true, previewVerdict: pv, saveKey: "o8-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- static figures (labels from the JSON) -----
  const fig = (svg, cap) => h("figure", { style: "margin:14px 0" }, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(cap))));
  const figGraphs = fig(graphsFig({ ...c.figs.graphs, aria: f(c.figs.graphs.aria) }), c.figs.graphs.caption);
  const figPhase = fig(phaseFig({ ...c.figs.phase, aria: f(c.figs.phase.aria) }), c.figs.phase.caption);

  // ----- learn -----
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(f(c.learn1.body)), check(c.learn1.check, "check1"));
  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(f(c.learn2.body)), figGraphs, check(c.learn2.check, "check2"));
  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(f(c.learn3.body)), check(c.learn3.check, "check3"),
    h("h3", {}, c.game.title), rich(f(c.game.lead)),
    matchGame(c.game, h("div", {}, h("div", { class: "verdict-row" }, h("p", { class: "verdict" }, c.game.win_head)), rich(f(c.game.win))), (el) => win("match", el)));
  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(f(c.learn4.body)), figPhase, check(c.learn4.check, "check4"));
  const learn5 = panel(c.learn5.kicker, "cool", h("h2", {}, c.learn5.title), rich(f(c.learn5.body)), rich(c.lab.lead),
    wavegraphsLab(c.lab, (ev, el) => { if (ev === "bead" || ev === "time") win(ev, el); }), rich(f(c.lab.tasks)), rich(f(c.learn5.after)), check(c.learn5.check, "check5"));

  const examples = panel(c.examples.kicker, "sun", h("h2", {}, c.examples.title),
    ...c.examples.items.map((ex) => worked({ title: ex.title, problem: f(ex.problem), steps: ex.steps.map((x) => f(x)), answer: f(ex.answer), labels: { next: c.examples.next } })));

  // ----- practice -----
  const prac = panel(c.practice.kicker, "hot", h("h2", {}, c.practice.title),
    practice({ items: c.practice.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), hint: f(it.hint), solution: f(it.solution) })),
      labels: c.practice.labels, onDone: (right, el) => { if (right >= 3) win("practice", el); } }));

  // ----- explore -----
  const story = panel(c.story.kicker, "", h("h2", {}, c.story.title), comic(c.story.frames.map((fr) => ({ ...fr, text: f(fr.text) }))),
    vote({ question: f(c.story.question), choices: c.story.choices.map((x) => f(x)), answer: c.story.answer, verdicts: c.story.verdicts,
      explain: f(c.story.explain), lockLabel: c.story.lock, previewVerdict: pv, onLock: lockWin("story") }));
  const sim = panel(c.sim.kicker, "cool", ...simCard(c.sim, SIM_URL));
  const T = c.try;
  const trial = panel(T.kicker, "sun", h("h2", {}, T.title), rich(f(T.lead)), rich(f(T.safety)), rich(f(T.need)), rich(f(T.steps)), rich(f(T.measure)), rich(f(T.compare)), rich(f(T.wrong)));
  const manga = panel(c.manga.kicker, "sun", h("h2", {}, c.manga.title), rich(f(c.manga.body)));

  // ----- remember + quiz -----
  const sum = panel(c.summary.kicker, "sun", h("h2", {}, c.summary.title), summary(c.summary.items.map((x) => f(x))));
  const quiz = panel(c.quiz.kicker, "hot", h("h2", {}, c.quiz.title),
    quickfire({ items: c.quiz.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), why: f(it.why) })), labels: c.quiz.labels,
      onDone: (score, el) => { if (score >= 2) win("quiz", el); } }));

  // ----- BONUS: beyond the syllabus -----
  const bSpeed = panel(c.bspeed.kicker, "sun", h("h2", {}, c.bspeed.title), rich(f(c.bspeed.lead)), bonusVote(c.bspeed, "b-speed"));
  const bLeft = panel(c.bleft.kicker, "sun", h("h2", {}, c.bleft.title), rich(f(c.bleft.lead)), bonusVote(c.bleft, "b-left"));
  const bEnergy = panel(c.benergy.kicker, "sun", h("h2", {}, c.benergy.title), rich(f(c.benergy.lead)), bonusVote(c.benergy, "b-energy"));

  rest.append(learn1, learn2, learn3, learn4, learn5, examples, prac, story, sim, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note), bSpeed, bLeft, bEnergy, chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}
