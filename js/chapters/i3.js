// Chapter i3: Round and round (S6 Uniform circular motion: ω = Δθ/Δt = v/r, a_cent = v²/r = ω²·r, F = m·a, centripetal force, no "centrifugal force").
// Teach-first layout: goals → warm-up → learn steps with checks → worked examples → practice → explore → summary
// → quiz → BONUS (derivation, bucket loop, Moon test, scaling puzzle).
import { h, s, rich } from "../dom.js";
import { circleLab, escapeGame, circleNumbers } from "../widgets/circular.js";
import {
  panel, say, vote, quickfire, choiceSteps, sortCards, toggle, comic, chapterHead, chapterNav,
  award, fillStr, syncStrip, gate, goals, quickCheck, worked, practice, summary, bonusDivider, PREVIEW, useFill
} from "../engine.js";
import { crystalsIn } from "../store.js";
import { circleFig, bankFig } from "./i3-figs.js";
import { G, angularSpeed, centripetalAcc, circlePeriod, EARTH, fmt } from "../physics.js";

// warmup, check1-4, cut, escape, sort, practice, quiz, story, b-bucket, b-derive, b-challenge
const SLOTS = 14;
const LAB = { r: 1.0, v: 5, m: 0.5 };                 // the lab's starting values used in the text
const BUCKET_R = 0.8;                                  // m, vertical circle: shoulder to bucket
const MOON = { r: 3.844e8, days: 27.32 };              // mean distance (m), sidereal period (days)
const CH = { m: 0.5, r: 1.0, v: 4 };                   // challenge ball
const Q = { r: 0.5, v: 3 };                            // quick-fire ball

function numbers() {
  const lab = circleNumbers(LAB.r, LAB.v, LAB.m), lab2 = circleNumbers(LAB.r, 2 * LAB.v, LAB.m);
  const labBigR = circleNumbers(2 * LAB.r, LAB.v, LAB.m), labSmallR = circleNumbers(0.2, LAB.v, LAB.m);
  const vTop = Math.sqrt(G * BUCKET_R), wTop = angularSpeed(vTop, BUCKET_R), vBot = Math.sqrt(vTop * vTop + 4 * G * BUCKET_R);
  const nBot = 1 + centripetalAcc(vBot, BUCKET_R) / G;                  // N − m·g = m·v²/r at the bottom
  const Tmoon = MOON.days * 86400, wMoon = (2 * Math.PI) / Tmoon, aMoon = wMoon * wMoon * MOON.r;   // a = ω²·r
  const ratio = MOON.r / EARTH.R, gMoon = G / (ratio * ratio);
  const c1 = CH.m * centripetalAcc(CH.v, CH.r), c2 = CH.m * centripetalAcc(2 * CH.v, 2 * CH.r);
  // learn checks
  const k1 = { r: 2.0, T: 4.0 }, k1v = (2 * Math.PI * k1.r) / k1.T;
  const k3 = { r: 2.0, v: 6.0 };
  // worked example 1: car on a flat bend; example 2: ball on a string on a smooth table
  const car = { m: 1200, r: 50, v: 15 }, carA = centripetalAcc(car.v, car.r), carF = car.m * carA;
  const wb = { m: 0.5, r: 0.8, f: 2 }, wbT = 1 / wb.f, wbW = (2 * Math.PI) / wbT, wbV = wbW * wb.r, wbA = wbW * wbW * wb.r, wbF = wb.m * wbA;
  // practice
  const p1T = 8.0, p1w = (2 * Math.PI) / p1T;
  const p2 = { r: 20, v: 10 }, p2a = centripetalAcc(p2.v, p2.r);
  const p3 = { m: 0.2, r: 0.5, w: 6.0 }, p3a = p3.w * p3.w * p3.r, p3F = p3.m * p3a;
  // practice 6: car over a hill crest (gravity and the normal force give the centripetal force)
  const p6 = { m: 800, r: 40, v: 10 }, p6Fc = p6.m * centripetalAcc(p6.v, p6.r), p6W = p6.m * G;
  // example 3: car over a hill crest, N = m·g − m·v²/r
  const hc = { m: 1000, r: 50, v: 15 }, hcFc = hc.m * centripetalAcc(hc.v, hc.r), hcW = hc.m * G;
  // experiment: object on a string, 10 turns in 7.5 s, r = 0.6 m, 30 g
  const ex = { r: 0.6, n: 10, t: 7.5, m: 0.03 }, exT = ex.t / ex.n, exW = (2 * Math.PI) / exT, exV = exW * ex.r, exA = exV * exV / ex.r;
  const exAt = (T) => { const w = (2 * Math.PI) / T; return w * w * ex.r; };
  return {
    g: fmt(G, 2),
    labR: fmt(LAB.r, 1), labV: fmt(LAB.v, 0), labM: fmt(LAB.m, 1), labW: fmt(lab.w, 1), labT: fmt(lab.T, 2), labA: fmt(lab.a, 0), labF: fmt(lab.F, 1),
    labV2: fmt(2 * LAB.v, 0), ratio4: fmt(lab2.F / lab.F, 0),
    labR2: fmt(2 * LAB.r, 1), labT2: fmt(labBigR.T, 2), labW2: fmt(labBigR.w, 1),
    labA02: fmt(labSmallR.a, 0), labF02: fmt(labSmallR.F, 1),
    k1r: fmt(k1.r, 1), k1T: fmt(k1.T, 1), k1v: fmt(k1v, 1), k1w1: fmt(k1.r / k1.T, 1), k1w2: fmt(2 * Math.PI * k1.r * k1.T, 1), k1w3: fmt((2 * Math.PI) / k1.T, 1),
    k3r: fmt(k3.r, 1), k3v: fmt(k3.v, 1), k3a: fmt(centripetalAcc(k3.v, k3.r), 0), k3w1: fmt(k3.v / k3.r, 0), k3w2: fmt(k3.v * k3.v * k3.r, 0), k3w3: fmt(k3.v * k3.r, 0),
    carM: fmt(car.m, 0), carR: fmt(car.r, 0), carV: fmt(car.v, 0), carA: fmt(carA, 1), carF: fmt(carF, 0), carMu: fmt(carF / (car.m * G), 2),
    wbM: fmt(wb.m, 1), wbR: fmt(wb.r, 1), wbRev: fmt(wb.f, 0), wbT: fmt(wbT, 2), wbW: fmt(wbW, 2), wbV: fmt(wbV, 1), wbA: fmt(wbA, 0), wbA2: fmt((wbV * wbV) / wb.r, 0), wbF: fmt(wbF, 0),
    p1T: fmt(p1T, 1), p1w: fmt(p1w, 2), p1w1: fmt(1 / p1T, 3), p1w2: fmt(2 * Math.PI * p1T, 1), p1w3: fmt(p1T, 1),
    p2r: fmt(p2.r, 0), p2v: fmt(p2.v, 0), p2a: fmt(p2a, 1), p2w1: fmt(p2.v / p2.r, 1), p2w2: fmt(p2a / 2, 1), p2w3: fmt(p2.v * p2.r, 0),
    p3m: fmt(p3.m, 1), p3r: fmt(p3.r, 1), p3w: fmt(p3.w, 1), p3a: fmt(p3a, 0), p3F: fmt(p3F, 1), p3w1: fmt(p3.m * p3.w * p3.r, 1), p3w2: fmt(p3.m * p3.w * p3.w, 1), p3w3: fmt(p3.m * p3.w * p3.w * p3.r * p3.r, 1),
    p6m: fmt(p6.m, 0), p6r: fmt(p6.r, 0), p6v: fmt(p6.v, 0), p6Fc: fmt(p6Fc, 0), p6W: fmt(p6W, 0), p6N: fmt(p6W - p6Fc, 0), p6w1: fmt(p6W + p6Fc, 0),
    hcM: fmt(hc.m, 0), hcR: fmt(hc.r, 0), hcV: fmt(hc.v, 0), hcFc: fmt(hcFc, 0), hcW: fmt(hcW, 0), hcN: fmt(hcW - hcFc, 0),
    expR: fmt(ex.r, 1), expLen: fmt(ex.r + 0.1, 1), expM: fmt(ex.m * 1000, 0), expTot: fmt(ex.t, 1), expT: fmt(exT, 2), expW: fmt(exW, 2), expV: fmt(exV, 1), expA: fmt(exA, 0),
    expAg: fmt(exA / G, 1), expF: fmt(ex.m * exA, 1), expLo: fmt(exAt(1.0), 0), expHi: fmt(exAt(0.6), 0),
    bR: fmt(BUCKET_R, 1), vTop: fmt(vTop, 1), wTop: fmt(wTop, 1), revT: fmt(circlePeriod(BUCKET_R, vTop), 1),
    vBot: fmt(vBot, 1), nBot: fmt(nBot, 0),
    moonKm: fmt(MOON.r / 1000, 0), moonD: fmt(MOON.days, 2), moonA: fmt(aMoon * 1000, 2), moonG: fmt(gMoon * 1000, 2), moonRatio: fmt(ratio, 1),
    chM: fmt(CH.m, 1), chR: fmt(CH.r, 1), chV: fmt(CH.v, 0), chF1: fmt(c1, 0), chV2: fmt(2 * CH.v, 0), chR2: fmt(2 * CH.r, 0), chF2: fmt(c2, 0),
    qR: fmt(Q.r, 1), qV: fmt(Q.v, 0), qW: fmt(angularSpeed(Q.v, Q.r), 0), qA: fmt(centripetalAcc(Q.v, Q.r), 0), qVR: fmt(Q.v * Q.r, 1), qV2: fmt(Q.v * Q.v, 0),
  };
}

// small icon for the sort cards: arrow into the circle (a real force) or a dashed arrow out (not one)
function icon(real) {
  return s("svg", { viewBox: "0 0 72 56", "aria-hidden": "true" },
    s("circle", { cx: 36, cy: 28, r: 6, style: "fill: var(--a2)" }),
    s("path", { d: real ? "M8 28H26M20 22L26 28L20 34" : "M64 28H46M52 22L46 28L52 34", fill: "none", stroke: real ? "#7de0ff" : "#ff8fd0", "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": real ? "none" : "4 4" }));
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
  const labEv = (ev, el) => { if (ev === "cut") win("cut", el); };

  // ----- warm-up (free-roam: gate is off unless ?gate) -----
  const { note: gateNote, rest, unlock } = gate(c.warmup.gate);
  const warm = c.warmup;
  const warmup = panel(warm.kicker, "hot", say(warm.say, "?"),
    vote({ question: warm.question, choices: warm.choices, answer: warm.answer, verdicts: warm.verdicts, explain: f(warm.explain),
      lockLabel: warm.lock, grid: true, previewVerdict: pv, saveKey: "i3-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- learn -----
  const fig = (svg, cap) => h("figure", { style: "margin:14px 0" }, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(cap))));
  const figCircle = fig(circleFig({ ...c.figs.circle, aria: f(c.figs.circle.aria) }), c.figs.circle.caption);
  const figBank = fig(bankFig({ ...c.figs.bank, aria: f(c.figs.bank.aria) }), c.figs.bank.caption);
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(f(c.learn1.body)), rich(c.learn1.formula),
    circleLab(c.lab, labEv), rich(f(c.learn1.tasks)), check(c.learn1.check, "check1"));
  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(f(c.learn2.body)), figCircle,
    circleLab(c.lab, labEv), rich(f(c.learn2.tasks)),
    h("h3", {}, c.learn2.game_title), rich(c.learn2.game_lead), escapeGame(c.game, (el) => win("escape", el)),
    check(c.learn2.check, "check2"));
  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(f(c.learn3.body)), rich(c.learn3.formula), rich(f(c.learn3.after)),
    circleLab(c.lab, labEv), rich(f(c.learn3.tasks)), check(c.learn3.check, "check3"));
  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(c.learn4.lead),
    sortCards(c.bigidea.cards.map((cd) => ({ ...cd, svg: icon(cd.yes) })), { yes: c.bigidea.yes, no: c.bigidea.no, onAll: (el) => win("sort", el) }),
    toggle(c.bigidea.toggle, rich(c.bigidea.feel)), rich(c.learn4.after), figBank, check(c.learn4.check, "check4"));

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
  // no HTML5 PhET simulation fits this topic, so there is no sim card
  const T = c.trial;
  const trial = panel(T.kicker, "sun", h("h2", {}, T.title), rich(f(T.lead)), rich(f(T.safety)), rich(f(T.need)), rich(f(T.steps)), rich(f(T.measure)), rich(f(T.compare)), rich(f(T.wrong)));
  const manga = panel(c.manga.kicker, "sun", h("h2", {}, c.manga.title), rich(f(c.manga.body)));

  // ----- remember + quiz -----
  const sum = panel(c.summary.kicker, "sun", h("h2", {}, c.summary.title), summary(c.summary.items));
  const quiz = panel(c.quiz.kicker, "hot", h("h2", {}, c.quiz.title),
    quickfire({ items: c.quiz.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), why: f(it.why) })), labels: c.quiz.labels,
      onDone: (score, el) => { if (score >= 2) win("quiz", el); } }));

  // ----- BONUS: beyond the syllabus -----
  const bucketSteps = h("div", { hidden: !PREVIEW }, h("ol", { class: "steps" }, c.check.steps.map((st) => h("li", {}, rich(f(st))))), h("div", { style: "margin-top:10px" }, rich(f(c.check.after))));
  const bucket = panel(c.check.kicker, "hot", h("h2", {}, c.check.title), say(f(c.check.say), "!"), rich(f(c.check.lead)),
    vote({ question: f(c.check.question), choices: c.check.choices.map((x) => f(x)), answer: c.check.answer, verdicts: c.check.verdicts, lockLabel: c.check.lock, grid: true,
      previewVerdict: pv, onLock: (_, __, el, isPreview) => { bucketSteps.hidden = false; if (!isPreview) win("b-bucket", el); } }), bucketSteps);
  const derive = panel(c.derive.kicker, "cool", h("h2", {}, c.derive.title), rich(f(c.derive.lead)),
    choiceSteps(c.derive.steps.map((st) => ({ ...st, prompt: f(st.prompt), then: f(st.then) })), { tryAgain: c.derive.try_again, onDone: (el) => win("b-derive", el) }));
  const moon = panel(c.moon.kicker, "sun", h("h2", {}, c.moon.title), rich(f(c.moon.body)));
  const challenge = panel(c.challenge.kicker, "hot", h("h2", {}, c.challenge.title), rich(f(c.challenge.lead)),
    vote({ question: f(c.challenge.question), choices: c.challenge.choices, answer: c.challenge.answer, verdicts: c.challenge.verdicts,
      explain: f(c.challenge.explain), lockLabel: c.challenge.lock, grid: true, previewVerdict: pv, onLock: lockWin("b-challenge") }));

  rest.append(learn1, learn2, learn3, learn4, examples, prac, story, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note), derive, bucket, moon, challenge, chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}
