// Chapter f4: Weighing the Earth (S6 Gravitational field: F_G = G·m1·m2/r², g = F_G/m = G·M/r², M = g·R²/G, radial vs uniform field).
// Teach-first layout: goals → warm-up → learn steps with checks → worked examples → practice → explore → summary
// → quiz → BONUS (same-density planet, orbit speed, Cavendish force numbers).
import { h, rich } from "../dom.js";
import { gravityLab, spreadDemo, weighGame, sci } from "../widgets/gravity.js";
import {
  panel, say, vote, quickfire, choiceSteps, comic, chapterHead, simCard, chapterNav, award, fillStr, syncStrip, gate,
  goals, quickCheck, worked, practice, summary, bonusDivider, PREVIEW, useFill
} from "../engine.js";
import { crystalsIn } from "../store.js";
import { G, GRAV_CONST, EARTH, fmt, pendulumPeriod } from "../physics.js";
import { modelsFig, radiusFig } from "./f4-figs.js";

// Printed G is 6.674 × 10⁻¹¹, so every G-based number in this chapter is computed from that printed value:
// a student who redoes a printed step gets the printed result (G·M = 3.984 × 10¹⁴).
const GP = Number(GRAV_CONST.toPrecision(4));
const gravField = (M, r) => (GP * M) / (r * r);
const gravForce = (m1, m2, r) => (GP * m1 * m2) / (r * r);
const massFromSurfaceG = (g, R) => (g * R * R) / GP;

const SIM_URL = "https://phet.colorado.edu/sims/html/gravity-force-lab/latest/gravity-force-lab_en.html";
// warmup, check1, check2, check3, check4, lab, weigh, derive, practice, story, quiz, b-density, b-orbit, b-cav
const SLOTS = 14;
const EVEREST_H = 8800;                              // m, about 8.8 km above sea level
const ISS_H = 4e5;                                   // m, assumed circular orbit at 400 km
const G_RANGE = { lo: 9.78, hi: 9.83 };              // m/s², real surface g from equator to poles (rounded)
const CAV = { rho: 5.48, rhoCorrected: 5.45, big: 158, small: 0.73, sep: 0.23, rhoMeasured: 5448 }; // Cavendish: 5.448 × water (modern 5.51); ball masses ≈ 158 kg / 0.73 kg; separation illustrative
const MOON = { g: 1.62, R: 1.74e6 };                  // Example 3 (given in the problem): Moon surface g and radius
const DROP_H = 1.5, FPS = 30, PEND_L = 1.0, PEND_SLIP = 0.3;   // home experiment: drop height (m), video frame rate, pendulum length (m), timing slip on 10 swings (s)
const MARS_LIKE = { M: 6.4e23, R: 3.4e6 };           // practice planet (rounded, Mars-like)

export function numbers() {
  const { M, R } = EARTH;
  const fE = (R / (R + EVEREST_H)) ** 2;               // g(R+h)/g(R)
  const rI = R + ISS_H, gI = gravField(M, rI), vI = Math.sqrt(gI * rI);   // a_cent = v²/r = g
  const gB = gravField(M, R), mCalc = massFromSurfaceG(G, R);
  const fCav = gravForce(CAV.big, CAV.small, CAV.sep);
  const gCav = (3 * G) / (4 * Math.PI * R * CAV.rhoMeasured);              // G = 3g/(4π·R·ρ)
  const gMars = gravField(MARS_LIKE.M, MARS_LIKE.R);
  const fPerson = gravForce(M, 70, R);
  const p1 = gravForce(60, 80, 2.0);
  const dropT = Math.sqrt((2 * DROP_H) / G), pT = pendulumPeriod(PEND_L);
  return {
    g: fmt(G, 2), gB: fmt(gB, 2), gLo: fmt(G_RANGE.lo, 2), gHi: fmt(G_RANGE.hi, 2),
    Msci: sci(M, 2), Rsci: sci(R, 2), Gsci: sci(GP, 3), rKm: fmt(R / 1e3, 0),
    everestH: fmt(EVEREST_H / 1e3, 1), everestFrac: fmt((EVEREST_H / R) * 100, 2), everestTwice: fmt(2 * Number(fmt((EVEREST_H / R) * 100, 2)), 2), everestPct: fmt((1 - fE) * 100, 1),
    everestG: fmt(G * fE, 2), w50: fmt(50 * G, 1), everestLoss: fmt(50 * G * (1 - fE), 1),
    issH: fmt(ISS_H / 1e3, 0), issHm: sci(ISS_H, 0), issR: sci(rI, 2), issG: fmt(gI, 2), issPct: fmt((gI / G) * 100, 0),
    issV: fmt(vI / 1e3, 1), issT: fmt((2 * Math.PI * rI) / vI / 60, 0),
    mCalc: sci(mCalc, 2), mBook: sci(M, 2), mDiff: fmt(Math.abs(mCalc / M - 1) * 100, 1),
    nine: fmt(3 ** 2, 0),
    chalG: fmt(gravField(8 * M, 2 * R), 1),
    cavRho: fmt(CAV.rho, 1), cavRho2: fmt(CAV.rho, 2), cavRhoFix: fmt(CAV.rhoCorrected, 2), GcavE: fmt(gCav * 1e11, 1), cavBig: fmt(CAV.big, 0), cavSmall: fmt(CAV.small, 2), cavSep: fmt(CAV.sep, 2),
    cavF: sci(fCav, 1), cavRatio: sci((CAV.small * G) / fCav, 1),
    // learn checks
    c1F: fmt(100, 0), c1a: fmt(100 / 4, 0), c1b: fmt(100 / 2, 0), c1c: fmt(100 * 2, 0),
    c2F: fmt(12, 0), c2m: fmt(4, 0), c2g: fmt(12 / 4, 1), c2w1: fmt(12 * 4, 0), c2w2: fmt(4 / 12, 2), c2w3: fmt(12 + 4, 0),
    // worked example 1: Earth and a 70 kg person
    w1m: fmt(70, 0), w1GM: sci(GP * M, 3), w1R2: sci(R * R, 2), w1F: fmt(fPerson, 0), w1mg: fmt(70 * gB, 0), w1mg81: fmt(70 * G, 0),
    // worked example 2: g at 400 km
    w2r: sci(rI, 2), w2r2: sci(rI * rI, 4), w2g: fmt(gI, 2), w2pct: fmt((gI / G) * 100, 0),
    // practice
    p1F: sci(p1, 2), p1w1: sci(p1 * 2, 2), p1w2: sci(p1 / 2, 2), p1w3: sci((GP * (60 + 80)) / 4, 2),
    pM: sci(MARS_LIKE.M, 1), pR: sci(MARS_LIKE.R, 1), pg: fmt(gMars, 1),
    pgW1: fmt(gravField(MARS_LIKE.M, 2 * MARS_LIKE.R), 1), pgW2: sci((GP * MARS_LIKE.M) / MARS_LIKE.R, 1), pgW3: sci(MARS_LIKE.M / MARS_LIKE.R ** 2, 1),
    p3g: fmt(G / 4, 2), p3w1: fmt(G / 2, 2), p3w2: fmt(G / 9, 2), p3w3: fmt(G, 2),
    p4g: fmt(3.7, 1), p4M: sci(massFromSurfaceG(3.7, MARS_LIKE.R), 1), p4w1: sci((3.7 * MARS_LIKE.R) / GP, 1),
    p4w2: sci(massFromSurfaceG(3.7, 2 * MARS_LIKE.R), 1), p4w3: sci(3.7 * MARS_LIKE.R ** 2 * GP, 1),
    // worked example 3: mass of the Moon, M = g·R²/G
    w3g: fmt(MOON.g, 2), w3R: sci(MOON.R, 2), w3R2: sci(MOON.R ** 2, 3), w3gR2: sci(MOON.g * MOON.R ** 2, 3),
    w3M: sci(massFromSurfaceG(MOON.g, MOON.R), 2), w3pct: fmt((massFromSurfaceG(MOON.g, MOON.R) / M) * 100, 1),
    // home experiment: drop t = √(2h/g); frames n = t·fps; g = 2h/(n/fps)²; pendulum T = 2π√(L/g), g = 4π²L/T²
    dropH: fmt(DROP_H, 1), dropT: fmt(dropT, 2), dropFr: fmt(dropT * FPS, 0),
    dropG16: fmt((2 * DROP_H) / (16 / FPS) ** 2, 1), dropG17: fmt((2 * DROP_H) / (17 / FPS) ** 2, 1),
    pL: fmt(PEND_L, 2), pT: fmt(pT, 2), pT10: fmt(10 * pT, 1), pSlip: fmt(PEND_SLIP, 1),
    pGlo: fmt((4 * Math.PI ** 2 * PEND_L) / ((10 * pT + PEND_SLIP) / 10) ** 2, 1), pGhi: fmt((4 * Math.PI ** 2 * PEND_L) / ((10 * pT - PEND_SLIP) / 10) ** 2, 1),
    pPct: fmt(((2 * PEND_SLIP) / (10 * pT)) * 100, 0),
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
    vv(warm, { question: f(warm.question), explain: f(warm.explain), grid: true, saveKey: "f4-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- learn -----
  const fig = (svg, cap) => h("figure", { style: "margin:14px 0" }, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(cap))));
  const figModels = fig(modelsFig({ ...c.figs.models, aria: f(c.figs.models.aria) }), c.figs.models.caption);
  const figRadius = fig(radiusFig({ ...c.figs.radius, aria: f(c.figs.radius.aria) }), c.figs.radius.caption);
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(f(c.learn1.body)), rich(c.learn1.formula), rich(f(c.learn1.after)),
    spreadDemo(c.bigidea), check(c.learn1.check, "check1"));
  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(f(c.learn2.body)), rich(c.learn2.formula), rich(f(c.learn2.after)),
    gravityLab(c.lab, (ev, el) => { if (ev === "lab") win("lab", el); }), rich(f(c.lab.tasks)), check(c.learn2.check, "check2"));
  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(f(c.learn3.body)), rich(c.learn3.formula), figRadius, rich(f(c.learn3.after)), figModels,
    gravityLab(c.lab, () => {}), rich(f(c.learn3.tasks)), check(c.learn3.check, "check3"));
  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(f(c.learn4.lead)),
    choiceSteps(c.derive.steps.map((st) => ({ ...st, prompt: f(st.prompt), then: f(st.then) })), { tryAgain: c.derive.try_again, onDone: (el) => win("derive", el) }),
    h("div", { style: "margin-top:12px" }, rich(f(c.learn4.game_lead))),
    weighGame(c.game, h("div", {}, h("div", { class: "verdict-row" }, h("p", { class: "verdict" }, c.game.win_head)), rich(f(c.game.win))), (el) => win("weigh", el)),
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
  const challenge = panel(c.challenge.kicker, "sun", h("h2", {}, c.challenge.title), rich(f(c.challenge.lead)),
    vv(c.challenge, { question: f(c.challenge.question), explain: f(c.challenge.explain), grid: true, onLock: lockWin("b-density") }));
  const heroSteps = h("div", { hidden: !PREVIEW }, h("ol", { class: "steps" }, c.check.steps.map((st) => h("li", {}, rich(f(st))))), h("div", { style: "margin-top:10px" }, rich(f(c.check.after))));
  const orbit = panel(c.check.kicker, "sun", h("h2", {}, c.check.title), say(f(c.check.say), "!"), rich(f(c.check.lead)),
    vv(c.check, { question: f(c.check.question), grid: true,
      onLock: (_, __, el, isPreview) => { heroSteps.hidden = false; if (!isPreview) win("b-orbit", el); } }), heroSteps);
  const cav = panel(c.cav.kicker, "sun", h("h2", {}, c.cav.title), rich(f(c.cav.lead)),
    vv(c.cav, { question: f(c.cav.question), explain: f(c.cav.explain), onLock: lockWin("b-cav") }));

  rest.append(learn1, learn2, learn3, learn4, examples, prac, story, sim, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note), challenge, orbit, cav, chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}
