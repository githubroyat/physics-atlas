// Chapter o10: Bend, bounce, overlap (S6 Waves: superposition, Huygens' principle, reflection α_i = α_r,
// refraction sin α1 / sin α2 = n2/n1 = c1/c2, critical angle and total internal reflection, dispersion, earthquake waves).
// Teach-first layout: goals → warm-up → learn steps with checks → worked examples → practice → explore → summary
// → quiz → BONUS (Fermat's lifeguard, Snell's law from Huygens' geometry, mirages).
import { h, rich } from "../dom.js";
import { pulseDemo, refractionLab, criticalGame, prismLab, MYSTERY_N } from "../widgets/refraction.js";
import {
  panel, say, vote, quickfire, choiceSteps, comic, chapterHead, simCard, chapterNav,
  award, fillStr, syncStrip, gate, goals, quickCheck, worked, practice, summary, bonusDivider, useFill
} from "../engine.js";
import { raysFig, fibreFig } from "./o10-figs.js";
import { crystalsIn } from "../store.js";
import { DEG, LIGHT_SPEED, refractAngle, criticalAngle, fmt, sci } from "../physics.js";

const SIM_URL = "https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_en.html";
const SIM2_URL = "https://phet.colorado.edu/sims/html/wave-interference/latest/wave-interference_en.html";

// warmup, check1-6, pulses, derive, lab (bend + TIR seen), game, prism, practice, story, quiz, three bonus votes
export const AWARD_KEYS = ["warmup", "check1", "check2", "check3", "check4", "check5", "check6", "pulses", "derive", "lab", "game", "prism",
  "practice", "story", "quiz", "b-fermat", "b-huygens", "b-mirage"];
const SLOTS = AWARD_KEYS.length;

// Rounded textbook indices for yellow light (about 589 nm): air 1.00, water 1.33, glass 1.5, diamond 2.42.
const nA = 1.0, nW = 1.33, nG = 1.5, nD = 2.42;
const C3 = 3.00e8;                         // c as printed in the chapter: 3.00 × 10⁸ m/s (booklet: 2.997 924 58 × 10⁸)
const sin = (deg) => Math.sin(deg * DEG);

/** Fermat's lifeguard: minimise t(x) = √(x² + a²)/v1 + √((D − x)² + b²)/v2 by ternary search. */
export function lifeguard() {
  const a = 30, b = 20, D = 80, v1 = 5.0, v2 = 1.5;
  const t = (x) => Math.hypot(x, a) / v1 + Math.hypot(D - x, b) / v2;
  let lo = 0, hi = D;
  for (let i = 0; i < 200; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (t(m1) < t(m2)) hi = m2; else lo = m1; }
  const x = (lo + hi) / 2, xs = (D * a) / (a + b);
  const s1 = x / Math.hypot(x, a), s2 = (D - x) / Math.hypot(D - x, b);
  return { a, b, D, v1, v2, x, xs, tBest: t(x), tStraight: t(xs), ratio: s1 / s2, a1: Math.asin(s1) / DEG, a2: Math.asin(s2) / DEG };
}

/** The coin-in-the-mug experiment: coin x from the near wall, mug height H, eye d out from the rim; ray coin to rim in water (alpha2), out into air (alpha1). */
const EXP = (() => {
  const x = 6.0, H = 9.0, d = 30, a2 = Math.atan(x / H) / DEG, a1 = refractAngle(nW, nA, a2);
  return { x, H, d, a2, a1, e0: d / Math.tan(a2 * DEG), e1: d / Math.tan(a1 * DEG) };
})();
/** The refractive index you would get from a measured eye height e1 (cm): n = sin(a1) / sin(a2), tan(a1) = d / e1. */
const expN = (e1) => sin(Math.atan(EXP.d / e1) / DEG) / sin(EXP.a2);

/** Every number in the prose, from physics.js. */
export function numbers() {
  const fg = lifeguard();
  const critW = criticalAngle(nW, nA), critG = criticalAngle(nG, nA), critD = criticalAngle(nD, nA);
  const mysCrit = criticalAngle(MYSTERY_N, 1);
  const a40g = refractAngle(nA, nG, 40), a20g = refractAngle(nG, nA, 20), a50g = refractAngle(nA, nG, 50);   // 50°: the figure (not a practice answer)
  const we1 = refractAngle(nA, nW, 50);
  const we2c = critW, we2a = refractAngle(nW, nA, 40);
  const p1 = refractAngle(nA, nG, 40);
  const lam = 650e-9;
  return {
    // indices and speeds
    nA: fmt(nA, 2), nW: fmt(nW, 2), nG: fmt(nG, 2), nD: fmt(nD, 2),
    cvac: sci(C3, 3), cW: sci(C3 / nW, 3), cG: sci(C3 / nG, 3), cD: sci(C3 / nD, 3),
    critW: fmt(critW, 1), critG: fmt(critG, 1), critD: fmt(critD, 1),
    lamRed: "780", lamViolet: "380",                                     // the visible-spectrum scale on the booklet
    // learn 1 (pulses)
    sup6: fmt(3 + 3, 0),
    // learn 2 (mirror check: angle to the surface)
    mir: fmt(90 - 35, 0), mirW1: fmt(35, 0), mirW2: fmt(70, 0), mirW3: fmt(180 - 35, 0),
    // learn 3 (lab tasks)
    a40g: fmt(a40g, 1), a20g: fmt(a20g, 1), a50g: fmt(a50g, 1),
    // learn 4 (check + game)
    mysCrit: fmt(mysCrit, 1), mysN: fmt(1 / sin(Number(fmt(mysCrit, 1))), 2),
    // worked example 1: air → water at 50°
    we1s: fmt(sin(50), 4), we1q: fmt(Number(fmt(sin(50), 4)) / nW, 4), we1a: fmt(we1, 1),
    // worked example 2: water → air, critical angle, a ray at 60° and one at 40°
    we2q: fmt(1 / nW, 4), we2c: fmt(we2c, 1), we2a: fmt(we2a, 1), we2s: fmt(nW * sin(40), 4), we2s40: fmt(sin(40), 4), we2p: fmt(nW * Number(fmt(sin(40), 4)), 4),
    // practice
    p1: fmt(p1, 1), p1w1: fmt(refractAngle(nG, nA, 40), 1), p1w2: fmt(40 / nG, 1), p1w3: fmt(90 - p1, 1), p1s: fmt(sin(40) / nG, 4),
    p2: sci(C3 / nW, 3), p2w1: sci(C3 * nW, 3), p2w2: sci(C3 / (nW * nW), 3),
    p3: fmt((lam * 1e9 * nA) / nG, 0), p3w1: fmt(lam * 1e9 * nG, 0), p3w2: fmt(lam * 1e9 * (nA / (nG * nG)), 0), p3f: sci(C3 / lam, 3),
    p4: fmt(critG, 1), p4w1: fmt(90 - critG, 1), p4w2: fmt(Math.atan(nG) / DEG, 1), p4w3: fmt(Math.atan(1 / nG) / DEG, 1), p4s: fmt(1 / nG, 4),
    p5: fmt(3 - 1, 1), p5w1: fmt(3 + 1, 1),
    // quiz
    q1: fmt(20, 0), q1w: fmt(70, 0), q1w2: fmt(40, 0),
    // figures: ray diagram (air to glass at 50 degrees, a2 = a50g, so it doesn't print practice 1's answer) and the optical fibre (core 1.50, cladding 1.44, ray at 80 degrees)
    nClad: fmt(1.44, 2), fibCrit: fmt(criticalAngle(nG, 1.44), 1), fibAlpha: fmt(80, 0),
    // worked example 3: green light, 520 nm in air, into water
    e3lam: fmt(520, 0), e3lw: fmt((520 * nA) / nW, 0), e3c: sci(C3 / nW, 3), e3f: sci(C3 / 520e-9, 3),
    // experiment: the coin in the mug. x = 6.0 cm from the near wall, H = 9.0 cm, eye d = 30 cm out; water to the rim, n = 1.33
    expX: fmt(EXP.x, 1), expH: fmt(EXP.H, 1), expD: fmt(EXP.d, 0), expA2: fmt(EXP.a2, 1), expA1: fmt(EXP.a1, 1),
    expE0: fmt(EXP.e0, 0), expE1: fmt(EXP.e1, 0), expDe: fmt(Number(fmt(EXP.e0, 0)) - Number(fmt(EXP.e1, 0)), 0),
    expE1lo: fmt(25, 0), expE1hi: fmt(30, 0), expNlo: fmt(expN(30), 2), expNhi: fmt(expN(25), 2),
    // bonus: Fermat's lifeguard
    fgA: fmt(fg.a, 0), fgB: fmt(fg.b, 0), fgD: fmt(fg.D, 0), fgV1: fmt(fg.v1, 1), fgV2: fmt(fg.v2, 1),
    fgXs: fmt(fg.xs, 0), fgTs: fmt(fg.tStraight, 1), fgX: fmt(fg.x, 2), fgTb: fmt(fg.tBest, 1), fgSave: fmt(fg.tStraight - fg.tBest, 1),
    fgA1: fmt(fg.a1, 1), fgA2: fmt(fg.a2, 1), fgRatio: fmt(fg.ratio, 2), fgVr: fmt(fg.v1 / fg.v2, 2),
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
  const vv = (b, key) => vote({ question: f(b.question), choices: b.choices.map((x) => f(x)), answer: b.answer, verdicts: b.verdicts.map((x) => f(x)),
    explain: f(b.explain), lockLabel: b.lock, grid: true, previewVerdict: pv, onLock: lockWin(key) });
  const steps = (d, key) => choiceSteps(d.steps.map((st) => ({ ...st, prompt: f(st.prompt), options: st.options.map((x) => f(x)), then: f(st.then) })),
    { tryAgain: d.try_again, onDone: (el) => win(key, el) });

  // ----- warm-up (free-roam: gate is off unless ?gate) -----
  const { note: gateNote, rest, unlock } = gate(c.warmup.gate);
  const warm = c.warmup;
  const warmup = panel(warm.kicker, "hot", say(warm.say, "?"),
    vote({ question: warm.question, choices: warm.choices, answer: warm.answer, verdicts: warm.verdicts, explain: f(warm.explain),
      lockLabel: warm.lock, grid: true, previewVerdict: pv, saveKey: "o10-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- learn -----
  const fig = (svg, cap) => h("figure", { style: "margin:14px 0" }, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(cap))));
  const fl = (L) => Object.fromEntries(Object.entries(L).map(([k, v]) => [k, f(v)]));   // fill the {placeholders} in a figure's labels
  const figRays = fig(raysFig(fl(c.figs.rays), { a1: 50, a2: refractAngle(nA, nG, 50) }), c.figs.rays.caption);
  const figFibre = fig(fibreFig(fl(c.figs.fibre), { alpha: 80 }), c.figs.fibre.caption);
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(f(c.learn1.body)),
    pulseDemo(c.pulses, (_, el) => win("pulses", el)), rich(f(c.pulses.tasks)), check(c.learn1.check, "check1"));
  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(f(c.learn2.body)), rich(c.derive.lead),
    steps(c.derive, "derive"), rich(f(c.learn2.after)), check(c.learn2.check, "check2"));
  const seenLab = new Set();
  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(f(c.learn3.body)), figRays, rich(c.lab.lead),
    refractionLab(c.lab, (ev, el) => { seenLab.add(ev); if (seenLab.has("bend") && seenLab.has("tir")) win("lab", el); }),
    rich(f(c.lab.tasks)), check(c.learn3.check, "check3"));
  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(f(c.learn4.body)), figFibre, rich(c.game.lead),
    criticalGame(c.game, h("div", {}, h("div", { class: "verdict-row" }, h("p", { class: "verdict" }, c.game.win_head)), rich(f(c.game.win))), (el) => win("game", el)),
    check(c.learn4.check, "check4"));
  const learn5 = panel(c.learn5.kicker, "cool", h("h2", {}, c.learn5.title), rich(f(c.learn5.body)), rich(c.prism.lead),
    prismLab(c.prism, (_, el) => win("prism", el)), rich(f(c.prism.tasks)), check(c.learn5.check, "check5"));
  const learn6 = panel(c.learn6.kicker, "cool", h("h2", {}, c.learn6.title), rich(f(c.learn6.body)), check(c.learn6.check, "check6"));

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
  const sim2 = panel(c.sim2.kicker, "cool", ...simCard(c.sim2, SIM2_URL));
  const T = c.trial;
  const trial = panel(T.kicker, "sun", h("h2", {}, T.title), rich(f(T.lead)), rich(f(T.safety)), rich(f(T.need)), rich(f(T.steps)), rich(f(T.measure)), rich(f(T.compare)), rich(f(T.wrong)));
  const manga = panel(c.manga.kicker, "sun", h("h2", {}, c.manga.title), rich(f(c.manga.body)));

  // ----- remember + quiz -----
  const sum = panel(c.summary.kicker, "sun", h("h2", {}, c.summary.title), summary(c.summary.items.map((x) => f(x))));
  const quiz = panel(c.quiz.kicker, "hot", h("h2", {}, c.quiz.title),
    quickfire({ items: c.quiz.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), why: f(it.why) })), labels: c.quiz.labels,
      onDone: (score, el) => { if (score >= 2) win("quiz", el); } }));

  // ----- BONUS -----
  const fermat = panel(c.b1.kicker, "sun", h("h2", {}, c.b1.title), say(f(c.b1.say), "!"), rich(f(c.b1.lead)), vv(c.b1, "b-fermat"));
  const huy = panel(c.b2.kicker, "sun", h("h2", {}, c.b2.title), rich(f(c.b2.lead)), steps(c.b2, "b-huygens"), rich(f(c.b2.after)));
  const mirage = panel(c.b3.kicker, "sun", h("h2", {}, c.b3.title), rich(f(c.b3.lead)), vv(c.b3, "b-mirage"));

  rest.append(learn1, learn2, learn3, learn4, learn5, learn6, examples, prac, story, sim, sim2, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note), fermat, huy, mirage, chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}
