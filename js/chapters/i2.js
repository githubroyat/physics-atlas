// Chapter i2: Throw (S6 Interactions: independence of perpendicular motions, projectile motion in a uniform field,
// s(t) = s0 + v0·t + ½·a·t², v(t) = v0 + a·t, energy conservation for kinematics).
// Teach-first layout: goals → warm-up → learn steps with checks → worked examples → practice → explore → summary
// → quiz → BONUS (45° derivation, best angle from a height, the falling lantern).
import { h, rich } from "../dom.js";
import { compFig, plateFig, COMP_FIG } from "./i2-figs.js";
import { projectileLab, targetGame, dropThrow, shot } from "../widgets/projectile.js";
import {
  panel, say, vote, quickfire, choiceSteps, comic, chapterHead, simCard, chapterNav, award, fillStr, syncStrip, gate,
  goals, quickCheck, worked, practice, summary, bonusDivider, useFill
} from "../engine.js";
import { crystalsIn } from "../store.js";
import { G, REF, flightTime, rangeFlat, maxHeight, fmt, E_CHARGE, M_ELECTRON } from "../physics.js";

const SIM_URL = "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_en.html";
// warmup, check1-4, bigidea, lab, target, practice, story, quiz, b-derive, b-lantern
const SLOTS = 13;
const D2R = Math.PI / 180;
const HERO = { v: 7, gap: 6, drop: 2 };                  // the rooftop run: 7 m/s, roof 6 m away and 2 m lower
const LANTERN = { d: 20, hh: 10, v: 25 };               // the falling lantern: 20 m away, 10 m up, snowball at 25 m/s
const DROP_H = 20, DEMO_VX = 8;                          // the drop-vs-throw demo height and its default sideways speed
const LAB = { v: 20, h: 10 };                            // bonus: 20 m/s, from 10 m up
const KICK = { v: 20, a: 30 };                           // worked example 2: kicked ball
const ROUNDS = [                                         // target game: launcher height h0, target at (x, y), radius R (all m)
  { h0: 0, x: 20, y: 0, R: 1.5 },
  { h0: 0, x: 25, y: 8, R: 1.2 },
  { h0: 10, x: 35, y: 4, R: 0.8 },
];
const ELEC = { U: 200, d: 0.020, L: 0.050, v: 2.0e7 };  // worked example 3: electron between plates (SI)
const EXP = { h: 0.75, hLo: 0.70, hHi: 0.80, v1: 1.0, v2: 2.0 };       // home experiment: table height and two example launch speeds (m, m/s)
const ELEC_P = { U: 150, d: 0.015, L: 0.040, v: 3.0e7 }; // practice: electron between plates (SI)
const sinD = (a) => Math.sin(a * D2R), cosD = (a) => Math.cos(a * D2R);
const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
/** Scientific notation with Unicode superscripts: sci(1.602e-19, 3) → "1.602 × 10⁻¹⁹". */
function sci(x, digits = 3) {
  const [m, e] = x.toExponential(digits - 1).split("e");
  return `${m} × 10${String(Number(e)).split("").map((ch) => SUP[ch]).join("")}`;
}
/** Sci string of the value computed from already-printed (rounded) inputs, so the steps chain. */
const rd = (x, digits = 3) => Number(x.toExponential(digits - 1));

/** Every number in the prose, from physics.js. */
function numbers() {
  const tf = flightTime(0, 0, HERO.drop);                // fall time from rest: t = √(2h/g)
  const t6 = HERO.gap / HERO.v;
  const fall6 = 0.5 * G * t6 * t6;
  const need = HERO.gap / Number(fmt(tf, 2));            // run-up needed, from the printed fall time
  const optA = Math.round((Math.atan(LAB.v / Math.sqrt(LAB.v * LAB.v + 2 * G * LAB.h)) / D2R)); // tan = v/√(v²+2gh)
  const line = Math.hypot(LANTERN.d, LANTERN.hh), tHit = line / LANTERN.v;
  // learn checks
  const c3h = 80, c3t = Math.sqrt((2 * c3h) / G);
  const c4T = 3;
  // worked 1 landing speed (energy and components agree)
  const tfP = Number(fmt(tf, 2));                        // printed fall time: later steps use it
  const heroVy = G * tfP, heroLand = Math.sqrt(HERO.v ** 2 + 2 * G * HERO.drop);
  // worked 2
  const kvx = KICK.v * cosD(KICK.a), kvy = KICK.v * sinD(KICK.a), kT = flightTime(KICK.v, KICK.a, 0);
  // practice
  const p1v = 12, p1h = 45, p1t = Math.sqrt((2 * p1h) / G);
  const p2v = 25, p2a = 40;
  const p3v = 18, p3a = 60, p3vy = p3v * sinD(p3a);
  const p5v = 10, p5h = 15, p5Land = Math.sqrt(p5v ** 2 + 2 * G * p5h);
  const q3t = 2, q3vy = G * q3t;
  // electron between plates (worked 3 and practice 7): every step is computed from the printed value before it
  const eP = rd(E_CHARGE, 4), mP = rd(M_ELECTRON, 4);   // printed e and mₑ
  const elec = (S) => {
    const E = rd(S.U / S.d, 3), F = rd(eP * E, 4), a = rd(F / mP, 4), t = rd(S.L / S.v, 3), y = 0.5 * a * t * t;
    return { E, F, a, t, y };
  };
  const ew = elec(ELEC), pw = elec(ELEC_P);
  const mg = rd(mP * G, 3);
  const fvx = COMP_FIG.v * cosD(COMP_FIG.deg), fvy = COMP_FIG.v * sinD(COMP_FIG.deg);   // figure 1: the components along one flight
  const expT = Math.sqrt((2 * EXP.h) / G);                                          // home experiment: fall time from the table height
  const pwA = 0.5 * pw.a * (ELEC_P.d / ELEC_P.v) ** 2;   // slip: time taken as plate gap / speed
  return {
    raw: { eDef: ew.y },
    g: fmt(G, 2),
    t20: fmt(flightTime(0, 0, DROP_H), 2), dropH: fmt(DROP_H, 0), d8: fmt(shot(DEMO_VX, 0, DROP_H).range, 1),
    r30: fmt(rangeFlat(LAB.v, 30), 1), r45: fmt(rangeFlat(LAB.v, 45), 1), rmax20: fmt(rangeFlat(LAB.v, 45), 1),
    r45h: fmt(shot(LAB.v, 45, LAB.h).range, 1), optA: fmt(optA, 0), rOpt: fmt(shot(LAB.v, optA, LAB.h).range, 1),
    heroV: fmt(HERO.v, 0), heroKmh: fmt(HERO.v * 3.6, 0), heroGap: fmt(HERO.gap, 0), heroDrop: fmt(HERO.drop, 0),
    heroT: fmt(tf, 2), heroX: fmt(HERO.v * tf, 1), heroShort: fmt(HERO.gap - HERO.v * tf, 1),
    heroT6: fmt(t6, 2), heroFall6: fmt(fall6, 2), heroBelow: fmt(fall6 - HERO.drop, 1),
    heroNeed: fmt(need, 1), heroNeedKmh: fmt(need * 3.6, 0), sprint: fmt(REF.sprintTopSpeed, 0),
    heroVy: fmt(heroVy, 2), heroLand: fmt(heroLand, 1), heroV2: fmt(HERO.v ** 2, 0), heroGh: fmt(2 * G * HERO.drop, 1),
    heroSum: fmt(HERO.v ** 2 + 2 * G * HERO.drop, 1),
    chD: fmt(LANTERN.d, 0), chH: fmt(LANTERN.hh, 0), chV: fmt(LANTERN.v, 0), chT: fmt(tHit, 2),
    chDrop: fmt(0.5 * G * tHit * tHit, 2), chFall: fmt(flightTime(0, 0, LANTERN.hh), 2),
    // checks
    c1g: fmt(G * 0.3, 2), c1sum: fmt(2 + G * 0.3, 1), c2vy: fmt(30 * sinD(60), 1), c2vx: fmt(30 * cosD(60), 1),
    c3t: fmt(c3t, 2), c3w1: fmt(c3h / G, 2), c3w2: fmt(Math.sqrt(c3h / G), 2), c3w3: fmt((2 * c3h) / G, 1), c3h: fmt(c3h, 0),
    c4T: fmt(c4T, 1), c4half: fmt(c4T / 2, 1), c4w: fmt(c4T / 4, 2), c4w2: fmt(c4T * 2, 1),
    // worked 2: kick
    kV: fmt(KICK.v, 0), kA: fmt(KICK.a, 0), kvx: fmt(kvx, 2), kvy: fmt(kvy, 2), kT: fmt(kT, 2), kTtop: fmt(kT / 2, 2),
    kH: fmt(maxHeight(KICK.v, KICK.a, 0), 2), kR: fmt(kvx * kT, 1), kRcheck: fmt(rangeFlat(KICK.v, KICK.a), 1),
    // practice
    p1v: fmt(p1v, 0), p1h: fmt(p1h, 0), p1t: fmt(p1t, 2), p1x: fmt(p1v * p1t, 1), p1w1: fmt(p1v * Math.sqrt(p1h / G), 1),
    p1w2: fmt((p1v * p1h) / G, 1), p1w3: fmt((p1v * 2 * p1h) / G, 1),
    p2v: fmt(p2v, 0), p2a: fmt(p2a, 0), p2x: fmt(p2v * cosD(p2a), 1), p2w1: fmt(p2v * sinD(p2a), 1), p2w3: fmt(p2v * Math.tan(p2a * D2R), 1),
    p3v: fmt(p3v, 0), p3a: fmt(p3a, 0), p3vy: fmt(p3vy, 2), p3H: fmt(p3vy ** 2 / (2 * G), 1), p3w1: fmt(p3v ** 2 / (2 * G), 1),
    p3w2: fmt(p3vy ** 2 / G, 1), p3w3: fmt((p3v * cosD(p3a)) ** 2 / (2 * G), 1),
    p5v: fmt(p5v, 0), p5h: fmt(p5h, 0), p5L: fmt(p5Land, 1), p5sum: fmt(p5v ** 2 + 2 * G * p5h, 1), p5w1: fmt(p5v + Math.sqrt(2 * G * p5h), 1),
    p5w2: fmt(Math.sqrt(2 * G * p5h), 1), p5w3: fmt(p5v + p5h, 0), p5gh: fmt(2 * G * p5h, 1),
    eStr: sci(eP, 4), meStr: sci(mP, 4),
    eV0: sci(ELEC.v, 2), eL: fmt(ELEC.L * 100, 1), ed: fmt(ELEC.d * 100, 1), eU: fmt(ELEC.U, 0), edm: fmt(ELEC.d, 3), eLm: fmt(ELEC.L, 3),
    eEStr: sci(ew.E, 3), eFStr: sci(ew.F, 4), eaStr: sci(ew.a, 4), etStr: sci(ew.t, 3), eyM: sci(ew.y, 3), eyMm: fmt(ew.y * 1e3, 2),
    eHalfMm: fmt((ELEC.d / 2) * 1e3, 0), mgStr: sci(mg, 3), fRatioStr: sci(ew.F / mg, 3),
    p7v: sci(ELEC_P.v, 2), p7L: fmt(ELEC_P.L * 100, 1), p7d: fmt(ELEC_P.d * 100, 1), p7U: fmt(ELEC_P.U, 0), p7dm: fmt(ELEC_P.d, 3), p7Lm: fmt(ELEC_P.L, 3),
    p7EStr: sci(pw.E, 3), p7aStr: sci(pw.a, 4), p7tStr: sci(pw.t, 3), p7yM: sci(pw.y, 3), p7y: fmt(pw.y * 1e3, 2),
    p7w1: fmt(2 * pw.y * 1e3, 2), p7w2: fmt(0.5 * pw.y * 1e3, 2), p7w3: fmt(pwA * 1e3, 2),
    q1tot: fmt(Math.hypot(10, G), 1), p6x: fmt(LAB.v * cosD(30), 1), p6y: fmt(LAB.v * sinD(30), 1),
    fv0: fmt(COMP_FIG.v, 0), fa: fmt(COMP_FIG.deg, 0), fvx: fmt(fvx, 1), fvy: fmt(fvy, 1), fH: fmt(fvy ** 2 / (2 * G), 1), fR: fmt(fvx * (2 * fvy) / G, 1),
    expH: fmt(EXP.h, 2), expHlo: fmt(EXP.hLo, 2), expHhi: fmt(EXP.hHi, 2), expT: fmt(expT, 2), expTlo: fmt(Math.sqrt((2 * EXP.hLo) / G), 2),
    expThi: fmt(Math.sqrt((2 * EXP.hHi) / G), 2), expF30: fmt(expT * 30, 0), expV1: fmt(EXP.v1, 1), expV2: fmt(EXP.v2, 1),
    expX1: fmt(EXP.v1 * expT, 2), expX2: fmt(EXP.v2 * expT, 2),
    heroX4: fmt(HERO.v * tfP, 2), r45v: fmt(LAB.v, 0), p1t3: fmt(p1t, 3),
    q3t: fmt(q3t, 0), q3vy: fmt(q3vy, 1), q3vxy: fmt(Math.hypot(10, q3vy), 1),
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

  // ----- warm-up (free-roam: gate is off unless ?gate) -----
  const { note: gateNote, rest, unlock } = gate(c.warmup.gate);
  const warm = c.warmup;
  const warmup = panel(warm.kicker, "hot", say(warm.say, "?"),
    vote({ question: warm.question, choices: warm.choices, answer: warm.answer, verdicts: warm.verdicts, explain: f(warm.explain),
      lockLabel: warm.lock, grid: true, previewVerdict: pv, saveKey: "i2-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- learn -----
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(f(c.learn1.body)),
    dropThrow(c.bigidea, (_, el) => win("bigidea", el)), rich(f(c.bigidea.after)), check(c.learn1.check, "check1"));
  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(f(c.learn2.body)), rich(c.learn2.formula), rich(f(c.learn2.after)),
    projectileLab(c.lab, (ev, el) => win("lab", el)), rich(f(c.lab.tasks)), check(c.learn2.check, "check2"));
  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(f(c.learn3.body)), rich(c.learn3.formula), rich(f(c.learn3.after)),
    check(c.learn3.check, "check3"));
  const fig = (svg, cap) => h("figure", { style: "margin:14px 0" }, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(cap))));
  const figComp = fig(compFig({ ...c.figs.comp, aria: f(c.figs.comp.aria) }, COMP_FIG), c.figs.comp.caption);
  const figPlates = fig(plateFig({ ...c.figs.plates, aria: f(c.figs.plates.aria) }, { d: ELEC.d, L: ELEC.L, y: N.raw.eDef }), c.figs.plates.caption);
  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(f(c.learn4.body)), rich(c.learn4.formula), figComp, rich(f(c.learn4.after)),
    check(c.learn4.check, "check4"),
    h("h3", {}, c.game.title), rich(c.game.lead),
    targetGame(c.game, ROUNDS, h("div", {}, h("div", { class: "verdict-row" }, h("p", { class: "verdict" }, c.game.win_head)), rich(f(c.game.win))), (el) => win("target", el)));

  const examples = panel(c.examples.kicker, "sun", h("h2", {}, c.examples.title),
    ...c.examples.items.flatMap((ex, i) => [worked({ title: ex.title, problem: f(ex.problem), steps: ex.steps.map((x) => f(x)), answer: f(ex.answer), labels: { next: c.examples.next } }), i === 2 ? figPlates : null]).filter(Boolean));

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
  const sum = panel(c.summary.kicker, "sun", h("h2", {}, c.summary.title), summary(c.summary.items));
  const quiz = panel(c.quiz.kicker, "hot", h("h2", {}, c.quiz.title),
    quickfire({ items: c.quiz.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), why: f(it.why) })), labels: c.quiz.labels,
      onDone: (score, el) => { if (score >= 2) win("quiz", el); } }));

  // ----- BONUS: beyond the syllabus -----
  const derive = panel(c.derive.kicker, "sun", h("h2", {}, c.derive.title), rich(c.derive.lead),
    choiceSteps(c.derive.steps.map((st) => ({ ...st, prompt: f(st.prompt), then: f(st.then) })), { tryAgain: c.derive.try_again, onDone: (el) => win("b-derive", el) }),
    h("div", { style: "margin-top:12px" }, rich(f(c.derive.height))));
  const challenge = panel(c.challenge.kicker, "sun", h("h2", {}, c.challenge.title), rich(f(c.challenge.lead)),
    vote({ question: f(c.challenge.question), choices: c.challenge.choices, answer: c.challenge.answer, verdicts: c.challenge.verdicts,
      explain: f(c.challenge.explain), lockLabel: c.challenge.lock, grid: true, previewVerdict: pv, onLock: lockWin("b-lantern") }));

  rest.append(learn1, learn2, learn3, learn4, examples, prac, story, sim, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note), derive, challenge, chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}
