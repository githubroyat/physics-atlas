// Chapter f2: Stored lightning (S6 Fields: uniform field between parallel plates E = U/d, capacitors Q = C·U, W = ½·C·U²,
// charging and discharging as graph shapes, what makes C bigger — qualitatively).
// Teach-first layout: goals → warm-up → learn steps with checks → worked examples → practice → explore → summary
// → quiz → BONUS (C = ε0·εr·A/d, τ = R·C, a thundercloud).
import { h, rich } from "../dom.js";
import { fieldFig, qufig } from "./f2-figs.js";
import { platesLab, chargingLab, bigFmt, CHARGING, plateNumbers } from "../widgets/capacitor.js";
import {
  panel, say, vote, quickfire, choiceSteps, sortCards, comic, chapterHead, simCard, chapterNav,
  award, fillStr, syncStrip, gate, goals, quickCheck, worked, practice, summary, bonusDivider, PREVIEW, useFill
} from "../engine.js";
import { crystalsIn } from "../store.js";
import { G, E_CHARGE, EPS0, uniformField, capCharge, capEnergy, fmt, sci } from "../physics.js";

const SIM_URL = "https://phet.colorado.edu/sims/html/capacitor-lab-basics/latest/capacitor-lab-basics_en.html";
export const AWARD_KEYS = [
  "warmup", "check1", "check2", "plates", "outside", "check3", "check4", "derive", "check5", "charge", "discharge", "check6",
  "sort", "check7", "practice", "story", "quiz", "b-farad", "b-tau", "b-cloud",
];
const SLOTS = AWARD_KEYS.length;

const Q_TEST = 2e-9;                                   // C, the default test charge in the plate lab (2.0 nC)
const FLASH = { C: 100e-6, U: 300, t: 1e-3 };          // camera flash: 100 µF at 300 V, released in about 1 ms (assumed)
const CLOUD = { A: 1e7, d: 2000, U: 1e8, kWhDay: 8 };  // thundercloud: 10 km² (≈ 3.2 km × 3.2 km), 2 km up, 100 MV (all assumed round numbers)
const FARAD = { d: 1e-3 };                             // 1 F with a 1.0 mm gap, vacuum
const PLATE_EX = { side: 0.10, d: 1e-3, er: 5 };       // 10 cm × 10 cm plates, 1.0 mm gap, εr = 5 (assumed)
const EXP = { taps: 10 };                               // home experiment: tally of taps out of 10
const TAU = { R: 10e3, C: 470e-6 };                    // 10 kΩ and 470 µF

const mC = (Q, d = 1) => fmt(Q * 1e3, d);
const mJ = (W, d = 1) => fmt(W * 1e3, d);
const uF = (C, d = 0) => fmt(C * 1e6, d).replace(/,/g, " ");

/** Every number in the prose, from physics.js. */
export function numbers() {
  // lab suggestions (defaults of the plate lab: U = 60 V, d = 3.0 cm, +2.0 nC)
  const l1 = plateNumbers(60, 3.0, Q_TEST, true), l2 = plateNumbers(60, 6.0, Q_TEST, true), l3 = plateNumbers(100, 2.0, Q_TEST, true);
  // check 2: U/d with d in cm → m
  const c2 = { U: 90, dm: 0.030 }, c2E = uniformField(c2.U, c2.dm);
  // step 3 and check 4
  const c4Q = 6e-3, c4U = 12, c4C = c4Q / c4U, c4Q2 = capCharge(c4C, 24);
  // step 4: the flash
  const fQ = capCharge(FLASH.C, FLASH.U), fW = capEnergy(FLASH.C, FLASH.U);
  // step 5: the charging lab at its defaults
  const K = CHARGING, I0 = K.U0 / (K.R0 * 1e3), Cd = K.C0 * 1e-6;
  // worked examples
  const w1 = { U: 120, dm: 0.015 }, w1E = uniformField(w1.U, w1.dm), w1F = E_CHARGE * w1E;
  const w2 = { C: 470e-6, U: 9.0 }, w2Q = capCharge(w2.C, w2.U), w2W = capEnergy(w2.C, w2.U);
  // practice
  const p1 = { U: 300, dm: 0.05 }, p1E = uniformField(p1.U, p1.dm);
  const p2 = { q: 3.0e-9, E: 5000 }, p2F = p2.q * p2.E;
  const p3 = { C: 2200e-6, U: 12 }, p3Q = capCharge(p3.C, p3.U);
  const p4W = capEnergy(FLASH.C, FLASH.U);
  const w3 = { q: 2.0e-9, U: 150, dm: 0.060 }, w3E = uniformField(w3.U, w3.dm), w3F = w3.q * w3E;
  // quick-fire
  const q1 = { U: 50, dm: 0.020 }, q1E = uniformField(q1.U, q1.dm);
  const q2 = { C: 1000e-6, U: 5.0 }, q2Q = capCharge(q2.C, q2.U);
  // bonus
  const farA = (1 * FARAD.d) / EPS0, farSide = Math.sqrt(farA);
  const pA = PLATE_EX.side ** 2, pC1 = (EPS0 * pA) / PLATE_EX.d, pC5 = pC1 * PLATE_EX.er;
  const tau = TAU.R * TAU.C;
  const cloudC = (EPS0 * CLOUD.A) / CLOUD.d, cloudQ = capCharge(cloudC, CLOUD.U), cloudW = capEnergy(cloudC, CLOUD.U);
  const cloudKWh = cloudW / 3.6e6;
  return {
    eps0: sci(EPS0, 3), g: fmt(G, 2),
    qT: fmt(Q_TEST * 1e9, 1),
    // lab suggestions
    lE1: bigFmt(l1.E), lF1: sci(l1.F, 2), lE2: bigFmt(l2.E), lF2: sci(l2.F, 2), lE3: bigFmt(l3.E), lF3: sci(l3.F, 2),
    c2U: fmt(c2.U, 0), c2d: fmt(c2.dm * 100, 1), c2dm: fmt(c2.dm, 3), c2E: bigFmt(c2E), c2w1: fmt(c2.U * c2.dm, 1), c2w2: fmt(c2.U / (c2.dm * 100), 0), c2w3: sci(c2.dm / c2.U, 2),
    // step 3 / 4
    s3Q: mC(capCharge(100e-6, 9), 2),
    c4Q: mC(c4Q, 1), c4U: fmt(c4U, 0), c4C: uF(c4C, 0), c4a: mC(c4Q2, 0), c4w1: mC(c4Q, 1), c4w2: mC(c4Q * 4, 0), c4w3: mC(c4Q / 2, 1),
    fC: uF(FLASH.C, 0), fU: fmt(FLASH.U, 0), fQ: mC(fQ, 0), fW: fmt(fW, 1), fLift: fmt(fW / G, 2), fT: fmt(FLASH.t * 1e3, 0), fP: fmt(fW / FLASH.t / 1000, 1),
    // step 5
    chSpeed: fmt(K.SPEED, 0), chTW: fmt(K.TW, 0), labR: fmt(K.Rmax, 0), labC: fmt(K.Cmax, 0), labTau: fmt(K.Rmax * 1e3 * K.Cmax * 1e-6, 1),
    chU: fmt(K.U0, 0), chR: fmt(K.R0, 0), chC: fmt(K.C0, 0), chI0: fmt(I0 * 1e3, 1), chQ: mC(capCharge(Cd, K.U0), 1), chW: mJ(capEnergy(Cd, K.U0), 1),
    // worked 1
    w1U: fmt(w1.U, 0), w1d: fmt(w1.dm * 100, 1), w1dm: fmt(w1.dm, 3), w1E: bigFmt(w1E), w1e: sci(E_CHARGE, 4), w1F: sci(w1F, 2),
    // worked 2
    w2C: uF(w2.C, 0), w2U: fmt(w2.U, 1), w2Q: sci(w2Q, 3), w2Qm: mC(w2Q, 2), w2U2: fmt(w2.U ** 2, 0), w2W: mJ(w2W, 1), w2W2: mJ(0.5 * w2Q * w2.U, 1),
    // worked 3
    w3q: fmt(w3.q * 1e9, 1), w3U: fmt(w3.U, 0), w3d: fmt(w3.dm * 100, 1), w3dm: fmt(w3.dm, 3), w3E: bigFmt(w3E), w3F: sci(w3F, 2),
    // home experiment
    expN: fmt(EXP.taps, 0),
    // practice
    p1U: fmt(p1.U, 0), p1d: fmt(p1.dm * 100, 1), p1dm: fmt(p1.dm, 3), p1E: bigFmt(p1E), p1w1: fmt(p1.U / (p1.dm * 100), 0), p1w2: fmt(p1.U * p1.dm, 0), p1w3: sci(p1.dm / p1.U, 2),
    p2q: fmt(p2.q * 1e9, 1), p2E: bigFmt(p2.E), p2F: sci(p2F, 2), p2w1: sci(p2.q / p2.E, 2), p2w2: sci(p2.E / p2.q, 2), p2w3: sci(p2.E * (p2.q * 1e9), 2),
    p3C: uF(p3.C, 0), p3U: fmt(p3.U, 0), p3Q: mC(p3Q, 1), p3w1: mC(0.5 * p3Q, 1), p3w2: mC(p3.C * p3.U ** 2, 0), p3w3: sci(p3.U / p3.C, 2),
    p4W: fmt(p4W, 1), p4w1: fmt(FLASH.C * FLASH.U ** 2, 1), p4w2: fmt(FLASH.C * FLASH.U, 3), p4w3: fmt(0.5 * FLASH.C * FLASH.U, 3), p4U2: bigFmt(FLASH.U ** 2),
    // quick-fire
    q1U: fmt(q1.U, 0), q1d: fmt(q1.dm * 1000, 0), q1E: bigFmt(q1E), q1w1: fmt(q1.U * q1.dm, 2), q1w2: fmt(q1.U / (q1.dm * 1000), 1), q1w3: sci(q1.dm / q1.U, 2),
    q2C: uF(q2.C, 0), q2U: fmt(q2.U, 1), q2Q: mC(q2Q, 1), q2w1: mC(0.5 * q2Q, 1), q2w2: mC(q2.C * q2.U ** 2, 0), q2w3: mC(q2.C / q2.U, 2),
    // bonus: how big is a farad / a small real capacitor
    farD: fmt(FARAD.d * 1000, 1), farA: sci(farA, 3), farKm2: fmt(farA / 1e6, 0), farSide: fmt(farSide / 1000, 1),
    pSide: fmt(PLATE_EX.side * 100, 0), pArea: fmt(pA, 3), pD: fmt(PLATE_EX.d * 1000, 1), pC1: fmt(pC1 * 1e12, 1), pEr: fmt(PLATE_EX.er, 0), pC5: fmt(pC5 * 1e12, 0),
    // bonus: time constant
    tauR: fmt(TAU.R / 1000, 0), tauC: uF(TAU.C, 0), tau: fmt(tau, 1), tau63: fmt((1 - Math.exp(-1)) * 100, 0), tau37: fmt(Math.exp(-1) * 100, 0),
    tau3: fmt((1 - Math.exp(-3)) * 100, 0), tauT3: fmt(3 * tau, 1),
    // bonus: the thundercloud
    clCarKJ: fmt((1000 * G * 5) / 1000, 0), clCarH: fmt(5, 0), clA: sci(CLOUD.A, 1), clAkm: fmt(CLOUD.A / 1e6, 0), clD: fmt(CLOUD.d / 1000, 0), clDm: bigFmt(CLOUD.d), clU: fmt(CLOUD.U / 1e6, 0), clC: fmt(cloudC * 1e9, 1),
    clQ: fmt(cloudQ, 1), clW: sci(cloudW, 2), clWm: fmt(cloudW / 1e6, 0), clKWh: fmt(cloudKWh, 0), clDay: fmt(CLOUD.kWhDay, 0), clDays: fmt(cloudKWh / CLOUD.kWhDay, 0),
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
      lockLabel: warm.lock, grid: true, previewVerdict: pv, saveKey: "f2-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- learn -----
  const fig = (svg, cap, extra = {}) => h("figure", { style: "margin:14px 0", ...extra }, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(cap))));
  const F = c.figs;
  const figFields = fig(fieldFig(F.fields), F.fields.caption);
  const figQU = fig(qufig({ ...F.qu, aria: f(F.qu.aria), tickU: f(F.qu.tickU), tickQ: f(F.qu.tickQ) }), F.qu.caption, { hidden: !PREVIEW });
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(f(c.learn1.body)), figFields, rich(f(c.learn1.formula)), rich(f(c.learn1.after)),
    check(c.learn1.check, "check1"));

  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(f(c.learn2.body)), rich(f(c.learn2.formula)), rich(f(c.learn2.after)),
    rich(f(c.lab.lead)), platesLab(c.lab, (ev, el) => win(ev, el)), rich(f(c.lab.tasks)),
    check(c.learn2.check, "check2"), check(c.learn2.check2, "check3"));

  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(f(c.learn3.body)), rich(f(c.learn3.formula)), rich(f(c.learn3.after)),
    check(c.learn3.check, "check4"));

  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(f(c.learn4.lead)),
    choiceSteps(c.derive.steps.map((st) => ({ ...st, prompt: f(st.prompt), then: f(st.then) })), { tryAgain: c.derive.try_again, onDone: (el) => { figQU.hidden = false; win("derive", el); } }),
    figQU, rich(f(c.learn4.after)), check(c.learn4.check, "check5"));

  const learn5 = panel(c.learn5.kicker, "cool", h("h2", {}, c.learn5.title), rich(f(c.learn5.body)), rich(f(c.charge.lead)),
    chargingLab(c.charge, (ev, el) => win(ev, el)), rich(f(c.charge.tasks)), check(c.learn5.check, "check6"));

  const cards = c.sort.cards.map((cd) => ({ label: cd.label, tagline: c.sort.pending, yes: cd.yes, svg: null, why: f(cd.why) }));
  const learn6 = panel(c.learn6.kicker, "cool", h("h2", {}, c.learn6.title), rich(f(c.learn6.lead)),
    sortCards(cards, { yes: c.sort.yes, no: c.sort.no, onAll: (el) => win("sort", el) }), rich(f(c.learn6.after)), check(c.learn6.check, "check7"));

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
  const farSteps = h("div", { hidden: !PREVIEW }, h("ol", { class: "steps" }, c.farad.steps.map((st) => h("li", {}, rich(f(st))))), h("div", { style: "margin-top:10px" }, rich(f(c.farad.after))));
  const farad = panel(c.farad.kicker, "sun", h("h2", {}, c.farad.title), say(f(c.farad.say), "!"), rich(f(c.farad.lead)),
    vv(c.farad, { question: f(c.farad.question), grid: true,
      onLock: (_, __, el, isPreview) => { farSteps.hidden = false; if (!isPreview) win("b-farad", el); } }), farSteps);
  const tau = panel(c.tau.kicker, "sun", h("h2", {}, c.tau.title), rich(f(c.tau.lead)),
    vv(c.tau, { question: f(c.tau.question), explain: f(c.tau.explain), grid: true, onLock: lockWin("b-tau") }));
  const cloudSteps = h("div", { hidden: !PREVIEW }, h("ol", { class: "steps" }, c.cloud.steps.map((st) => h("li", {}, rich(f(st))))), h("div", { style: "margin-top:10px" }, rich(f(c.cloud.after))));
  const cloud = panel(c.cloud.kicker, "sun", h("h2", {}, c.cloud.title), say(f(c.cloud.say), "!"), rich(f(c.cloud.lead)),
    vv(c.cloud, { question: f(c.cloud.question), grid: true,
      onLock: (_, __, el, isPreview) => { cloudSteps.hidden = false; if (!isPreview) win("b-cloud", el); } }), cloudSteps);

  rest.append(learn1, learn2, learn3, learn4, learn5, learn6, examples, prac, story, sim, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note), farad, tau, cloud, chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}
