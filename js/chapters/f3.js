// Chapter f3: Current makes a magnet (S6 Fields: magnetic field of a current, straight wire (shape + direction), solenoid,
// right-hand grip rule, B = μ·n·I with n = N/l, iron core (qualitative), Earth / MRI field sizes).
// Teach-first layout: goals → warm-up → learn steps with checks → worked examples → practice → explore → summary
// → quiz → BONUS (B = μ0·I/(2π·r) for a wire, could an MRI field come from a plain coil).
import { h, rich } from "../dom.js";
import { solenoidLab, endsGame, buildGame, wireB, formatB, EARTH_B, BUILD } from "../widgets/solenoid.js";
import {
  panel, say, vote, quickfire, sortCards, comic, chapterHead, simCard, chapterNav,
  award, fillStr, syncStrip, gate, goals, quickCheck, worked, practice, summary, bonusDivider, PREVIEW, useFill
} from "../engine.js";
import { wireFig, loopsFig } from "./f3-figs.js";
import { crystalsIn } from "../store.js";
import { MU0, solenoidB, fmt, sci } from "../physics.js";

const SIM_URL = "https://phet.colorado.edu/sims/html/magnets-and-electromagnets/latest/magnets-and-electromagnets_en.html";
export const AWARD_KEYS = [
  "warmup", "check1", "check2", "check3", "check4", "check5", "wire", "coil", "ends", "factors", "build",
  "practice", "story", "quiz", "b-wire", "b-mri",
];
const SLOTS = AWARD_KEYS.length;

const MRI = { low: 1.5, high: 3.0 };                        // T, "about 1.5–3 T" (scope sheet)
const WIRE = { I: 10, rcm: 5 };                              // bonus: a 10 A wire, compass 5.0 cm away
const TIGHT = { N: 500, lcm: 5, I: 5.0 };                    // the lab's tightest coil, at its largest current
const EXP = { N: 20, lcm: 3, I: 1.0 };                       // home experiment: coil on a nail, 1.5 V AA battery (I is a guess, said so)
const int = (x) => fmt(x, 0).replace(/,/g, " ");            // 1257 -> "1 257" (no comma in the middle of a number)

export function numbers() {
  const mT = (B, d = 2) => fmt(B * 1e3, d);
  // lab tasks (coil tab): N = 200, l = 20 cm, I = 1.0 A, and the neighbours
  const ltB1 = solenoidB(200, 0.2, 1.0), ltB2 = solenoidB(200, 0.2, 2.0), ltB3 = solenoidB(400, 0.2, 1.0), ltB4 = solenoidB(200, 0.4, 1.0);
  const ltMin = solenoidB(10, 0.5, 0.1), ltMax = solenoidB(TIGHT.N, TIGHT.lcm / 100, TIGHT.I);
  // worked examples
  const we1 = { N: 400, l: 0.25, I: 1.5 }, we1n = we1.N / we1.l, we1B = solenoidB(we1.N, we1.l, we1.I);
  const we2 = { N: 250, l: 0.20, B: 5.0e-3 }, we2n = we2.N / we2.l, we2I = we2.B / (MU0 * we2n);
  // quick check c4 and practice p1
  const c4 = { N: 300, lcm: 15, I: 2.0 }, c4n = c4.N / (c4.lcm / 100), c4B = solenoidB(c4.N, c4.lcm / 100, c4.I);
  const p1 = { N: 500, l: 0.40, I: 0.80 }, p1n = p1.N / p1.l, p1B = solenoidB(p1.N, p1.l, p1.I);
  const q3 = { n: 2000, I: 1.0 }, q3B = MU0 * q3.n * q3.I;
  // bonus: wire, MRI
  const bwB = wireB(WIRE.I, WIRE.rcm / 100), bwB2 = wireB(WIRE.I, 2 * WIRE.rcm / 100);
  const mriN = TIGHT.N / (TIGHT.lcm / 100), mriI = MRI.high / (MU0 * mriN);
  const bnI = BUILD.target / MU0, bEx = solenoidB(160, 0.20, 2.0);
  const exn = EXP.N / (EXP.lcm / 100), exB = solenoidB(EXP.N, EXP.lcm / 100, EXP.I);
  return {
    exN: fmt(EXP.N, 0), exL: fmt(EXP.lcm, 0), exn: int(exn), exI: fmt(EXP.I, 1), exB: formatB(exB), exX: int(exB / EARTH_B),
    p1lcm: fmt(p1.l * 100, 0), p1x: int(p1B / EARTH_B),
    earth: fmt(EARTH_B * 1e6, 0), mriLow: fmt(MRI.low, 1), mriHigh: fmt(MRI.high, 1),
    mriR15: sci(MRI.low / EARTH_B, 1), mriR3: sci(MRI.high / EARTH_B, 1),
    mu0n: sci(MU0, 4),
    // lab tasks
    lt_n: int(200 / 0.2), lt_B1: formatB(ltB1), lt_B2: formatB(ltB2), lt_B3: formatB(ltB3), lt_n4: int(200 / 0.4), lt_B4: formatB(ltB4),
    lt_Bmin: formatB(ltMin), lt_Bmax: formatB(ltMax), lt_Bx: int(ltMax / EARTH_B),
    // step 4 example (same coil as the lab's first task)
    ex4B: sci(ltB1, 3), ex4x: int(ltB1 / EARTH_B),
    // build game
    bnI: int(bnI), bEx: formatB(bEx),
    // check 4
    c4N: fmt(c4.N, 0), c4l: fmt(c4.lcm, 0), c4lm: fmt(c4.lcm / 100, 2), c4I: fmt(c4.I, 1), c4n: int(c4n),
    c4B: mT(c4B), c4w1: mT(MU0 * c4.N * c4.I, 3),                        // forgot to divide by l
    c4w2: mT(MU0 * (c4.N / c4.lcm) * c4.I, 4),                           // used cm as if they were metres
    c4w3: mT(10 * c4B, 1),                                               // 15 cm written as 0.015 m
    // worked example 1
    we1N: fmt(we1.N, 0), we1l: fmt(we1.l, 2), we1I: fmt(we1.I, 1), we1n: int(we1n), we1B: sci(we1B, 3), we1mT: mT(we1B), we1x: int(we1B / EARTH_B),
    // worked example 2
    we2N: fmt(we2.N, 0), we2l: fmt(we2.l, 2), we2B: fmt(we2.B * 1e3, 1), we2Bt: sci(we2.B, 2), we2n: int(we2n), we2den: sci(MU0 * we2n, 4), we2I: fmt(we2I, 1),
    // practice
    p1N: fmt(p1.N, 0), p1l: fmt(p1.l, 2), p1I: fmt(p1.I, 2), p1n: int(p1n), p1B: mT(p1B),
    p1w1: mT(MU0 * p1.N * p1.I, 3),                                      // forgot to divide by l
    p1w2: mT(MU0 * (p1.N / (p1.l * 100)) * p1.I, 4),                     // l in cm treated as metres
    p1w3: mT(MU0 * (p1.N / (p1.l / 10)) * p1.I, 1),                      // 0.40 m written as 0.04 m
    p4a: sci(MRI.high / EARTH_B, 1), p4w1: sci(MRI.high / (EARTH_B * 1e6), 1), p4w2: sci(MRI.high / (EARTH_B * 1e3), 1), p4w3: sci(EARTH_B / MRI.high, 2),
    // quiz
    q3n: int(q3.n), q3I: fmt(q3.I, 1), q3B: mT(q3B, 1), q3w1: mT(q3B / 10, 2), q3w2: mT(q3B * 10, 1),  q3w3: fmt(q3B * 1e3, 1),   // mu0 slips: q3w1 = 4π×10⁻⁸, q3w2 = 4π×10⁻⁶
    // bonus: wire
    bwI: fmt(WIRE.I, 0), bwR: fmt(WIRE.rcm, 1), bwRm: fmt(WIRE.rcm / 100, 3), bwB: formatB(bwB), bwX: fmt(bwB / EARTH_B, 1), bwB2: formatB(bwB2),
    bwW1: formatB(bwB / 100), bwW2: formatB(bwB * 100), bwW3: formatB(bwB * 1e6),
    // bonus: MRI
    mriN: fmt(TIGHT.N, 0), mriL: fmt(TIGHT.lcm, 0), mriNm: int(mriN), mriMn: sci(MU0 * mriN, 4),
    mriI1: fmt(mriI / 100, 1), mriI2: fmt(mriI / 10, 0), mriI3: fmt(mriI, 0), mriI4: sci(mriI * 100, 2), mriRatio: fmt(mriI / TIGHT.I, 0),
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
  const vv = (b, extra = {}) => vote({ choices: b.choices.map((x) => f(x)), answer: b.answer, verdicts: b.verdicts.map((x) => f(x)), lockLabel: b.lock, previewVerdict: pv, ...extra });

  // ----- warm-up (free-roam: gate is off unless ?gate) -----
  const { note: gateNote, rest, unlock } = gate(c.warmup.gate);
  const warm = c.warmup;
  const warmup = panel(warm.kicker, "hot", say(warm.say, "?"),
    vote({ question: f(warm.question), choices: warm.choices, answer: warm.answer, verdicts: warm.verdicts, explain: f(warm.explain),
      lockLabel: warm.lock, grid: true, previewVerdict: pv, saveKey: "f3-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- learn -----
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(f(c.learn1.body)), check(c.learn1.check, "check1"));
  const fig = (L) => h("figure", { style: "margin:14px 0" }, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, L.svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(L.caption))));
  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(f(c.learn2.body)), fig({ svg: wireFig(c.figs.wire), caption: c.figs.wire.caption }), check(c.learn2.check, "check2"));
  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(f(c.learn3.body)), fig({ svg: loopsFig(c.figs.loops), caption: c.figs.loops.caption }),
    rich(f(c.lab.lead)), solenoidLab(c.lab, (ev, el) => { if (ev === "wire" || ev === "coil") win(ev, el); }), rich(f(c.lab.tasks)),
    h("h3", {}, c.ends.title), rich(f(c.ends.lead)), endsGame(c.ends, (el) => win("ends", el)),
    check(c.learn3.check, "check3"));

  const cards = c.sort.cards.map((cd) => ({ label: cd.label, tagline: c.sort.pending, yes: cd.yes, svg: null, why: f(cd.why) }));
  const buildWin = h("div", {}, h("div", { class: "verdict-row" }, h("p", { class: "verdict" }, c.build.ok)), rich(f(c.build.win)));
  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(f(c.learn4.body)), rich(f(c.learn4.sort_lead)),
    sortCards(cards, { yes: c.sort.yes, no: c.sort.no, onAll: (el) => win("factors", el) }), rich(f(c.learn4.build_lead)),
    buildGame({ ...c.build, hint: f(c.build.hint) }, buildWin, (el) => win("build", el)),
    check(c.learn4.check, "check4"));
  const learn5 = panel(c.learn5.kicker, "cool", h("h2", {}, c.learn5.title), rich(f(c.learn5.body)), check(c.learn5.check, "check5"));

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
  const T = c.try;
  const trial = panel(T.kicker, "sun", h("h2", {}, T.title), rich(f(T.lead)), rich(f(T.safety)), rich(f(T.need)), rich(f(T.steps)), rich(f(T.measure)), rich(f(T.compare)), rich(f(T.wrong)));
  const manga = panel(c.manga.kicker, "sun", h("h2", {}, c.manga.title), rich(f(c.manga.body)));

  // ----- remember + quiz -----
  const sum = panel(c.summary.kicker, "sun", h("h2", {}, c.summary.title), summary(c.summary.items.map((x) => f(x))));
  const quiz = panel(c.quiz.kicker, "hot", h("h2", {}, c.quiz.title),
    quickfire({ items: c.quiz.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), why: f(it.why) })), labels: c.quiz.labels,
      onDone: (score, el) => { if (score >= 2) win("quiz", el); } }));

  // ----- BONUS -----
  const wireSteps = h("div", { hidden: !PREVIEW }, h("ol", { class: "steps" }, c.wire.steps.map((st) => h("li", {}, rich(f(st))))), h("div", { style: "margin-top:10px" }, rich(f(c.wire.after))));
  const wire = panel(c.wire.kicker, "sun", h("h2", {}, c.wire.title), say(f(c.wire.say), "!"), rich(f(c.wire.lead)),
    vv(c.wire, { question: f(c.wire.question), grid: true,
      onLock: (_, __, el, isPreview) => { wireSteps.hidden = false; if (!isPreview) win("b-wire", el); } }), wireSteps);
  const mriSteps = h("div", { hidden: !PREVIEW }, h("ol", { class: "steps" }, c.mri.steps.map((st) => h("li", {}, rich(f(st))))), h("div", { style: "margin-top:10px" }, rich(f(c.mri.after))));
  const mri = panel(c.mri.kicker, "sun", h("h2", {}, c.mri.title), say(f(c.mri.say), "!"), rich(f(c.mri.lead)),
    vv(c.mri, { question: f(c.mri.question), grid: true,
      onLock: (_, __, el, isPreview) => { mriSteps.hidden = false; if (!isPreview) win("b-mri", el); } }), mriSteps);

  rest.append(learn1, learn2, learn3, learn4, learn5, examples, prac, story, sim, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note), wire, mri, chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}
