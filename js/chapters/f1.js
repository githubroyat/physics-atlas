// Chapter f1: Spark (S6 Fields: electric charge, the elementary charge, Coulomb's law F = k·Q1·Q2/r², E = F/q, E = k·Q/r²).
// Teach-first layout: goals → warm-up → learn steps with checks → worked examples → practice → explore → summary → quiz → BONUS.
import { h, rich } from "../dom.js";
import { radialFig, pairFig } from "./f1-figs.js";
import { coulombLab, gravityLab, sciFmt, PAIRS, forceRatio } from "../widgets/coulomb.js";
import {
  panel, say, vote, quickfire, choiceSteps, comic, sortCards, chapterHead, simCard, chapterNav, award, fillStr, syncStrip, gate,
  goals, quickCheck, worked, practice, summary, bonusDivider, PREVIEW, useFill
} from "../engine.js";
import { crystalsIn } from "../store.js";
import { G, K_COULOMB, E_CHARGE, EPS0, GRAV_CONST, M_PROTON, M_ELECTRON, coulombForce, electricField, fmt } from "../physics.js";

const SIM_URL = "https://phet.colorado.edu/sims/html/coulombs-law/latest/coulombs-law_en.html";
// warmup, check1, quantum, check2, lab, signs, check3, check4, derive, practice, gravity, story, quiz, b-eiffel, b-calm
const SLOTS = 15;
const EIFFEL_T = 10000;                                   // tonnes, rough total mass of the Eiffel Tower
const LETTERS = ["A", "B", "C", "D", "E", "F"];
const CARD_VALUES = [3.2e-19, 2.4e-19, -1.6e-19, 8.0e-19, 1.0e-19, -4.8e-19]; // C, the sorting cards
const HALF = 1.5, NEAR = 1, SEP = 3, QRATIO = 4;        // bonus: +4Q and +Q, 3 m apart
const FIELD_Q = 2e-9, FIELD_R = 0.03;                    // quick-fire: 2 nC, 3 cm
const BAL = { m: 0.003, L: 1.0, d1: 0.30, d2: 0.40 };    // home experiment: balloon mass (kg), thread length (m), two separations (m)
/** Two identical balloons on threads of length L from one point hang a distance d apart. sinθ = d/(2L); F = m·g·tanθ; F = k·Q²/d² → Q = d·√(F/k). */
function balloon(d) { const th = Math.asin(d / (2 * BAL.L)), F = BAL.m * G * Math.tan(th); return { th: (th * 180) / Math.PI, F, Q: d * Math.sqrt(F / K_COULOMB) }; }

/** Numbers for the learn checks, worked examples and practice. */
function teachNumbers() {
  const abs = Math.abs;
  // learn checks
  const l2F0 = 8.0, l2r0 = 0.10, l2r1 = 0.30;
  const l3F = abs(coulombForce(5e-9, 20e-9, 0.10));
  const l4q = 2.0e-9, l4F = 6.0e-6, l4E = l4F / l4q;
  // worked examples
  const w1 = { q1: 2.0e-6, q2: -3.0e-6, r: 0.10 }, w1F = abs(coulombForce(w1.q1, w1.q2, w1.r));
  const w2 = { Q: 4.0e-9, r: 0.05 }, w2E = electricField(w2.Q, w2.r), w2F = E_CHARGE * w2E;
  // practice
  const p1 = { q1: 6.0e-9, q2: 4.0e-9, r: 0.03 }, p1F = coulombForce(p1.q1, p1.q2, p1.r);
  const p2 = [3.2e-19, 4.8e-19, 2.4e-19, 8.0e-19];
  const p3F0 = 0.36, p3F = p3F0 * 3 ** 2;
  const p4E = 3.0e4, p4q = 5.0e-9, p4F = p4q * p4E;
  const p5Q = 2.0e-6, p5r = 0.20, p5E = electricField(p5Q, p5r);
  const w3Q = 8.0e-9, w3N = w3Q / 1.6e-19;                // worked 3: rounded e, as in practice 2
  const b1 = balloon(BAL.d1), b2 = balloon(BAL.d2);
  return {
    l1q: sciFmt(2 * E_CHARGE, 2),
    l2F0: fmt(l2F0, 1), l2r0: fmt(l2r0, 2), l2r1: fmt(l2r1, 2), l2a: fmt(l2F0 / 9, 2), l2b: fmt(l2F0 / 3, 1), l2c: fmt(l2F0 * (l2r0 / (l2r1 - l2r0)) ** 2, 1), l2dd: fmt(l2r1 - l2r0, 2), l2d: fmt(l2F0 * 9, 0),
    l3F: sciFmt(l3F, 2), l3F4: sciFmt(4 * l3F, 2),
    l4q: fmt(l4q * 1e9, 1), l4F: sciFmt(l4F, 1), l4E: sciFmt(l4E, 2), l4w1: sciFmt(l4F * l4q, 2), l4w2: sciFmt(l4q / l4F, 2), l4w3: sciFmt(l4F / (l4q * 1e9), 2),
    // worked 1
    w1q1: fmt(w1.q1 * 1e6, 1), w1q2: fmt(abs(w1.q2) * 1e6, 1), w1r: fmt(w1.r, 2), w1prod: sciFmt(abs(w1.q1 * w1.q2), 2), w1r2: fmt(w1.r ** 2, 4), w1F: fmt(w1F, 1),
    // worked 2
    w2Q: fmt(w2.Q * 1e9, 1), w2r: fmt(w2.r * 100, 1), w2rm: fmt(w2.r, 3), w2r2: fmt(w2.r ** 2, 4), w2E: sciFmt(w2E, 3), w2F: sciFmt(w2F, 2),
    w3Q: fmt(w3Q * 1e9, 1), w3N: sciFmt(w3N, 2),
    // experiment
    xm: fmt(BAL.m * 1000, 1), xL: fmt(BAL.L, 1), xd1: fmt(BAL.d1 * 100, 0), xd2: fmt(BAL.d2 * 100, 0),
    xth1: fmt(b1.th, 1), xF1: sciFmt(b1.F, 2), xq1: fmt(Number((b1.Q * 1e9).toPrecision(2)), 0), xq1u: fmt(Number((b1.Q * 1e6).toPrecision(2)), 2), xq2: fmt(b2.Q * 1e9, 0),
    // practice
    p1q1: fmt(p1.q1 * 1e9, 1), p1q2: fmt(p1.q2 * 1e9, 1), p1r: fmt(p1.r * 100, 1), p1F: sciFmt(p1F, 2), p1prod: sciFmt(p1.q1 * p1.q2, 2), p1r2: sciFmt(p1.r ** 2, 2),
    p1w1: sciFmt(p1F * p1.r, 2), p1w2: sciFmt((K_COULOMB * p1.q1 * p1.q2) / (p1.r * 100) ** 2, 2),
    p2a: sciFmt(p2[0], 2), p2b: sciFmt(p2[1], 2), p2c: sciFmt(p2[2], 2), p2d: sciFmt(p2[3], 2),
    p2cn: fmt(p2[2] / 1.6e-19, 1), p2an: fmt(p2[0] / 1.6e-19, 1), p2bn: fmt(p2[1] / 1.6e-19, 1), p2dn: fmt(p2[3] / 1.6e-19, 1),
    p3F0: fmt(p3F0, 2), p3F: fmt(p3F, 1), p3w1: fmt(p3F0 * 3, 1), p3w2: fmt(p3F0 / 3, 2), p3w3: fmt(p3F0 / 9, 2),
    p4E: sciFmt(p4E, 1), p4q: fmt(p4q * 1e9, 1), p4F: sciFmt(p4F, 2), p4w1: sciFmt(p4E / p4q, 2), p4w2: sciFmt(p4E * p4q * 1e9, 2),
    p5Q: fmt(p5Q * 1e6, 1), p5r: fmt(p5r * 100, 0), p5rm: fmt(p5r, 2), p5r2: fmt(p5r ** 2, 2), p5E: sciFmt(p5E, 2), p5w1: sciFmt((K_COULOMB * p5Q) / p5r, 2), p5w2: fmt((K_COULOMB * p5Q) / (p5r * 100) ** 2, 0),
  };
}

export function numbers() {
  const F1C = coulombForce(1, 1, 1);                     // two 1 C charges 1 m apart
  const tonnes = F1C / G / 1000;                         // the weight (mass × g) that would equal that force
  const Fp = coulombForce(10e-9, 10e-9, 0.05);           // two 10 nC pith balls 5 cm apart
  const xZero = (SEP * Math.sqrt(QRATIO)) / (1 + Math.sqrt(QRATIO)); // 4Q/x² = Q/(d−x)² → x = 2d/3 from the 4Q
  const cards = CARD_VALUES.map((v) => ({ v, n: v / E_CHARGE }));
  return {
    k: sciFmt(K_COULOMB, 3), e: sciFmt(E_CHARGE, 4), e2: sciFmt(E_CHARGE, 2), eps0: sciFmt(EPS0, 4),
    Gc: sciFmt(GRAV_CONST, 4), mp: sciFmt(M_PROTON, 4), me: sciFmt(M_ELECTRON, 4), g: fmt(G, 2),
    f1C: sciFmt(F1C, 2), tonnes: sciFmt(tonnes, 2), eiffelT: fmt(EIFFEL_T, 0).replace(",", " "), nEiffel: fmt(tonnes / EIFFEL_T, 0),
    nElec1C: sciFmt(1 / E_CHARGE, 3),
    pithF: sciFmt(Fp, 2), pithM: fmt((Fp / G) * 1000, 3),
    ratioPE: sciFmt(forceRatio(PAIRS[0], 1e-10), 2), ratioPP: sciFmt(forceRatio(PAIRS[1], 1e-10), 2),
    chD: fmt(SEP, 0), chHalf: fmt(HALF, 1), chNear: fmt(NEAR, 0), chX: fmt(xZero, 0), chW: fmt(SEP - xZero, 0),
    chFx: fmt(QRATIO, 0),
    cardList: cards.map((c, i) => `- **${LETTERS[i]}:** ${c.v < 0 ? "−" : ""}${sciFmt(Math.abs(c.v), 2)} C`).join("\n"),
    ionC: sciFmt(2 * E_CHARGE, 2),
    qCharge: sciFmt(4.8e-19, 2), qN: fmt(Math.round(4.8e-19 / E_CHARGE), 0),
    fQ: fmt(FIELD_Q * 1e9, 1), fR: fmt(FIELD_R * 100, 1),
    fE: sciFmt(electricField(FIELD_Q, FIELD_R), 2), fENoSq: sciFmt((K_COULOMB * FIELD_Q) / FIELD_R, 2),
    fECm: fmt((K_COULOMB * FIELD_Q) / (FIELD_R * 100) ** 2, 1),
    ...teachNumbers(),
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
  const vv = (b, extra = {}) => vote({ choices: b.choices.map((x) => f(x)), answer: b.answer, verdicts: b.verdicts, lockLabel: b.lock, previewVerdict: pv, ...extra });
  const check = (chk, key) => quickCheck({ q: f(chk.q), choices: chk.choices.map((x) => f(x)), answer: chk.answer, why: f(chk.why), whyNot: chk.whyNot, labels: c.checks, onRight: (el) => win(key, el) });

  // ----- warm-up (free-roam: gate is off unless ?gate) -----
  const { note: gateNote, rest, unlock } = gate(c.warmup.gate);
  const warm = c.warmup;
  const warmup = panel(warm.kicker, "hot", say(warm.say, "?"),
    vote({ question: warm.question, choices: warm.choices, answer: warm.answer, verdicts: warm.verdicts, explain: f(warm.explain),
      lockLabel: warm.lock, grid: true, previewVerdict: pv, saveKey: "f1-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- learn -----
  const cards = CARD_VALUES.map((v, i) => {
    const n = v / E_CHARGE, ok = Math.abs(n - Math.round(n)) < 0.02;
    return { label: LETTERS[i], tagline: c.learn1.pending, yes: ok, svg: null,
      why: f(ok ? c.learn1.why_yes : c.learn1.why_no, { n: ok ? fmt(Math.abs(Math.round(n)), 0) : fmt(Math.abs(n), 2) }) };
  });
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(f(c.learn1.body)), rich(f(c.learn1.formula)), rich(f(c.learn1.lead)),
    sortCards(cards, { yes: c.learn1.yes, no: c.learn1.no, onAll: (el) => win("quantum", el) }), rich(f(c.learn1.after)), check(c.learn1.check, "check1"));

  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(f(c.learn2.body)), rich(f(c.learn2.formula)), rich(f(c.learn2.after)),
    rich(f(c.lab.lead)),
    coulombLab(c.lab, (ev, el) => win(ev, el)), rich(f(c.lab.tasks)), check(c.learn2.check, "check2"));

  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(f(c.learn3.body)), check(c.learn3.check, "check3"));

  const fig = (svg, cap) => h("figure", { style: "margin:14px 0" }, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(cap))));
  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(f(c.learn4.lead)),
    choiceSteps(c.derive.steps.map((st) => ({ ...st, prompt: f(st.prompt), then: f(st.then) })), { tryAgain: c.derive.try_again, onDone: (el) => win("derive", el) }),
    rich(f(c.learn4.after)),
    fig(radialFig({ ...c.figs.radial, aria: f(c.figs.radial.aria) }), c.figs.radial.caption),
    fig(pairFig({ ...c.figs.pair, aria: f(c.figs.pair.aria) }), c.figs.pair.caption), check(c.learn4.check, "check4"));

  const examples = panel(c.examples.kicker, "sun", h("h2", {}, c.examples.title),
    ...c.examples.items.map((ex) => worked({ title: ex.title, problem: f(ex.problem), steps: ex.steps.map((x) => f(x)), answer: f(ex.answer), labels: { next: c.examples.next } })));

  // ----- practice -----
  const prac = panel(c.practice.kicker, "hot", h("h2", {}, c.practice.title),
    practice({ items: c.practice.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), hint: f(it.hint), solution: f(it.solution) })),
      labels: c.practice.labels, onDone: (right, el) => { if (right >= 3) win("practice", el); } }));

  // ----- explore -----
  const game = panel(c.game.kicker, "sun", h("h2", {}, c.game.title), rich(f(c.game.lead)),
    gravityLab(c.game, (ev, el) => win(ev, el)), rich(f(c.game.after)));
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
  const steps = h("div", { hidden: !PREVIEW }, h("ol", { class: "steps" }, c.check.steps.map((st) => h("li", {}, rich(f(st))))), h("div", { style: "margin-top:10px" }, rich(f(c.check.after))));
  const eiffel = panel(c.check.kicker, "sun", h("h2", {}, c.check.title), say(f(c.check.say), "!"), rich(f(c.check.lead)),
    vv(c.check, { question: f(c.check.question), grid: true,
      onLock: (_, __, el, isPreview) => { steps.hidden = false; if (!isPreview) win("b-eiffel", el); } }), steps);
  const calm = panel(c.challenge.kicker, "sun", h("h2", {}, c.challenge.title), rich(f(c.challenge.lead)),
    vv(c.challenge, { question: f(c.challenge.question), explain: f(c.challenge.explain), grid: true, onLock: lockWin("b-calm") }));

  rest.append(learn1, learn2, learn3, learn4, examples, prac, game, story, sim, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note), eiffel, calm, chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}
