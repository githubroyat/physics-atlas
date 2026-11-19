// Chapter o7: Making waves (S6 Description of waves: wave as spreading oscillation, T, f = 1/T, λ, A, phase, v = f·λ,
// transverse vs longitudinal, energy not matter; contexts: rope, spring, sound, earthquake P and S waves).
// Teach-first layout: goals → warm-up → learn steps with checks → worked examples → practice → explore → summary
// → quiz → BONUS (earthquake S–P delay, thick/thin rope). The wave equation y(x, t) comes in the chapter *A wave in space and time*.
import { h, rich } from "../dom.js";
import { waveLab, crestGame, gameInfo, gameDistance } from "../widgets/waves.js";
import {
  panel, say, vote, quickfire, choiceSteps, sortCards, comic, chapterHead, simCard, chapterNav,
  award, fillStr, syncStrip, gate, goals, quickCheck, worked, practice, summary, bonusDivider, PREVIEW, useFill
} from "../engine.js";
import { snapshotFig, longFig } from "./o7-figs.js";
import { crystalsIn } from "../store.js";
import { waveSpeed, wavelength, fmt } from "../physics.js";

const SIM_URL = "https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_en.html";
// warmup, check1..check5, longitudinal, track, measure, sort, derive, practice, story, quiz, b-quake, b-ropes
const SLOTS = 16;
const LAB = { f: 1, v: 4 };                       // lab defaults
const QUAKE = { vP: 6.0, vS: 3.5, dt: 20 };       // km/s typical crust speeds (assumptions), seconds between P and S
const ROPES = { vThick: 2, vThin: 6, f: 1.5 };    // thick rope and thin rope (bonus challenge)
const SOUND = { v: 343, f: 440 };                 // air at about 20 °C, concert A
const ECHO = { d: 50, n: 20, tLo: 5.5, tHi: 6.2 };    // echo experiment: wall distance (m), claps timed, plausible stopwatch range (s)
const freqOf = (T) => 1 / T;                      // f = 1/T (booklet)

/** Every number in the prose, from physics.js. */
function numbers() {
  const g1 = gameInfo(0), g2 = gameInfo(1), g3 = gameInfo(2);
  const gap = 1 / QUAKE.vS - 1 / QUAKE.vP;         // s per km
  const dist = QUAKE.dt / gap;                      // d = Δt / (1/vS − 1/vP)
  const snap = { x1: 1.0, x2: 3.4, A: 0.6 };        // snapshot check
  const osc = { n: 20, t: 5.0 };                    // 20 oscillations in 5.0 s
  const we1 = { f: 2.5, lam: 0.8 };
  const p1 = { T: 0.02 }, p2 = { f: 12, lam: 0.5 }, p3 = { T: 0.5, v: 3.0 };
  const c4 = { v: 12, f: 3 };
  const q2 = { f: 686 };
  const we3 = { T: 0.4, lam: 0.6 };                // worked example 3 (cork)
  const tEcho = (ECHO.n * 2 * ECHO.d) / SOUND.v;     // 20 claps, 2d/v each
  return {
    labV: fmt(LAB.v, 0), labF: fmt(LAB.f, 0), labLam: fmt(wavelength(LAB.v, LAB.f), 0),
    f2: fmt(2 * LAB.f, 0), lam2: fmt(wavelength(LAB.v, 2 * LAB.f), 0),
    lamLow: fmt(wavelength(LAB.v, 0.5), 0), lamTight: fmt(wavelength(2 * LAB.v, LAB.f), 0),
    lamLong: fmt(wavelength(8, 0.25), 0), lamShort: fmt(wavelength(2, 1.5), 2), rope: "12",
    gD: fmt(gameDistance, 0), gF: fmt(0.5, 2), gTol: "15",
    gDt1: fmt(g1.dtTrue, 2), gV1: fmt(g1.v, 1), gLam1: fmt(g1.lam, 1), gProd1: fmt(waveSpeed(g1.f, g1.lam), 1),
    gV2: fmt(g2.v, 1), gV3: fmt(g3.v, 1),
    vP: fmt(QUAKE.vP, 1), vS: fmt(QUAKE.vS, 1), qDt: fmt(QUAKE.dt, 0),
    qDist: fmt(dist, 0), tP: fmt(dist / QUAKE.vP, 0), tS: fmt(dist / QUAKE.vS, 0), rule: fmt(1 / gap, 1), gapS: fmt(gap, 3),
    qWrong: fmt(QUAKE.dt * QUAKE.vS, 0),
    thickV: fmt(ROPES.vThick, 0), thinV: fmt(ROPES.vThin, 0), cF: fmt(ROPES.f, 1),
    thickLam: fmt(wavelength(ROPES.vThick, ROPES.f), 2), thinLam: fmt(wavelength(ROPES.vThin, ROPES.f), 1),
    soundV: fmt(SOUND.v, 0), soundF: fmt(SOUND.f, 0), soundLam: fmt(wavelength(SOUND.v, SOUND.f), 2),
    // learn checks
    x1: fmt(snap.x1, 1), x2: fmt(snap.x2, 1), sLam: fmt(snap.x2 - snap.x1, 1), sA: fmt(snap.A, 1), sAbad: fmt(2 * snap.A, 1),
    sLamHalf: fmt((snap.x2 - snap.x1) / 2, 1),
    oN: fmt(osc.n, 0), oT: fmt(osc.t, 1), oPer: fmt(osc.t / osc.n, 2), oF: fmt(osc.n / osc.t, 1),
    oPerBad: fmt(osc.n * osc.t, 0), oFbad: fmt(1 / (osc.n * osc.t), 2), oFmix: fmt(osc.t / osc.n, 2),
    c4v: fmt(c4.v, 0), c4f: fmt(c4.f, 0), c4lam: fmt(wavelength(c4.v, c4.f), 1), c4w1: fmt(c4.v * c4.f, 0), c4w2: fmt(c4.f / c4.v, 2),
    c4w3: fmt(c4.v + c4.f, 0),
    // worked examples
    we1f: fmt(we1.f, 1), we1lam: fmt(we1.lam, 2), we1v: fmt(waveSpeed(we1.f, we1.lam), 1), we1T: fmt(freqOf(we1.f), 2),
    we2lam: fmt(wavelength(SOUND.v, SOUND.f), 2),
    we3T: fmt(we3.T, 2), we3lam: fmt(we3.lam, 2), we3f: fmt(freqOf(we3.T), 1), we3v: fmt(waveSpeed(freqOf(we3.T), we3.lam), 1),
    // echo experiment
    eD: fmt(ECHO.d, 0), eN: fmt(ECHO.n, 0), eInt: fmt((2 * ECHO.d) / SOUND.v, 2), eF: fmt(SOUND.v / (2 * ECHO.d), 1), eT: fmt(tEcho, 1),
    eTlo: fmt(ECHO.tLo, 1), eThi: fmt(ECHO.tHi, 1), eVhi: fmt((2 * ECHO.d * ECHO.n) / ECHO.tLo, 0), eVlo: fmt((2 * ECHO.d * ECHO.n) / ECHO.tHi, 0),
    // practice
    p1T: fmt(p1.T, 3), p1f: fmt(freqOf(p1.T), 0), p1w1: fmt(p1.T, 3), p1w2: fmt(freqOf(p1.T) / 1000, 3), p1w3: fmt(freqOf(p1.T) * 10, 0),
    p2f: fmt(p2.f, 0), p2lam: fmt(p2.lam, 2), p2v: fmt(waveSpeed(p2.f, p2.lam), 1), p2w1: fmt(p2.f / p2.lam, 0),
    p2w2: fmt(p2.lam / p2.f, 3), p2w3: fmt(p2.f + p2.lam, 1),
    p3T: fmt(p3.T, 2), p3f: fmt(freqOf(p3.T), 1), p3v: fmt(p3.v, 1), p3lam: fmt(wavelength(p3.v, freqOf(p3.T)), 1), p3w1: fmt(p3.v / p3.T, 1),
    p3w2: fmt(p3.T / p3.v, 2), p3w3: fmt(p3.v + p3.T, 1),
    // quiz
    q1v: fmt(waveSpeed(5, 0.4), 1), q2f: fmt(q2.f, 0), q2lam: fmt(wavelength(SOUND.v, q2.f), 2), q2w1: fmt(q2.f / SOUND.v, 1),
    q2w2: fmt(SOUND.v + q2.f, 0), q2w3: fmt(q2.f, 0),
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
  const pv = ctx.app("app.preview_answer");
  const lockWin = (key) => (_, __, el, isPreview) => { if (!isPreview) win(key, el); };
  const check = (chk, key) => quickCheck({ q: f(chk.q), choices: chk.choices.map((x) => f(x)), answer: chk.answer, why: f(chk.why), whyNot: chk.whyNot, labels: c.checks, onRight: (el) => win(key, el) });
  const fig = (svg, cap) => h("figure", { style: "margin:14px 0" }, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(cap))));
  const FG = c.figs;
  const figSnap = fig(snapshotFig({ ...FG.snapshot, aria: f(FG.snapshot.aria) }), FG.snapshot.caption);
  const figLong = fig(longFig({ ...FG.long, aria: f(FG.long.aria) }), FG.long.caption);
  const lab = () => waveLab(c.lab, (ev, el) => { if (ev === "longitudinal" || ev === "track") win(ev, el); });

  // ----- warm-up (free-roam: gate is off unless ?gate) -----
  const { note: gateNote, rest, unlock } = gate(c.warmup.gate);
  const warm = c.warmup;
  const warmup = panel(warm.kicker, "hot", say(warm.say, "?"),
    vote({ question: f(warm.question), choices: warm.choices, answer: warm.answer, verdicts: warm.verdicts, explain: f(warm.explain),
      lockLabel: warm.lock, grid: true, previewVerdict: pv, saveKey: "o7-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- learn -----
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(f(c.learn1.body)), lab(), rich(f(c.learn1.tasks)), check(c.learn1.check, "check1"));
  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(f(c.learn2.body)), figSnap, rich(c.learn2.formula), rich(f(c.learn2.after)), lab(), rich(f(c.learn2.tasks)),
    check(c.learn2.check, "check2"), check(c.learn2.check2, "check3"));
  const examples = panel(c.examples.kicker, "sun", h("h2", {}, c.examples.title),
    ...c.examples.items.map((ex) => worked({ title: ex.title, problem: f(ex.problem), steps: ex.steps.map((x) => f(x)), answer: f(ex.answer), labels: { next: c.examples.next } })));
  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(f(c.learn3.lead)),
    choiceSteps(c.derive.steps.map((st) => ({ ...st, prompt: f(st.prompt), then: f(st.then) })), { tryAgain: c.derive.try_again, onDone: (el) => win("derive", el) }),
    rich(f(c.learn3.rule)), check(c.learn3.check, "check4"),
    h("h3", {}, c.game.title), rich(f(c.game.lead)),
    crestGame(c.game, h("div", {}, h("div", { class: "verdict-row" }, h("p", { class: "verdict" }, c.game.win_head)), rich(f(c.game.win))), (el) => win("measure", el)));
  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(f(c.learn4.lead)), figLong, lab(), rich(f(c.learn4.tasks)),
    quickCheck({ q: f(c.learn4.check0.q), choices: c.learn4.check0.choices.map((x) => f(x)), answer: c.learn4.check0.answer, why: f(c.learn4.check0.why), whyNot: c.learn4.check0.whyNot, labels: c.checks }),   // no award (no new crystals)
    h("h3", {}, c.bigidea.title), rich(f(c.bigidea.lead)),
    sortCards(c.bigidea.cards.map((cd) => ({ ...cd, svg: null, why: f(cd.why) })), { yes: c.bigidea.yes, no: c.bigidea.no, onAll: (el) => win("sort", el) }),
    rich(f(c.bigidea.after)), check(c.learn4.check, "check5"));

  // ----- practice -----
  const prac = panel(c.practice.kicker, "hot", h("h2", {}, c.practice.title),
    practice({ items: c.practice.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), hint: f(it.hint), solution: f(it.solution) })),
      labels: c.practice.labels, onDone: (right, el) => { if (right >= 3) win("practice", el); } }));

  // ----- explore -----
  const story = panel(c.story.kicker, "", h("h2", {}, c.story.title), comic(c.story.frames.map((fr) => ({ ...fr, text: f(fr.text) }))),
    vote({ question: f(c.story.question), choices: c.story.choices, answer: c.story.answer, verdicts: c.story.verdicts,
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

  // ----- BONUS: beyond the syllabus -----
  const quakeSteps = h("div", { hidden: !PREVIEW }, h("ol", { class: "steps" }, c.quake.steps.map((st) => h("li", {}, rich(f(st))))), h("div", { style: "margin-top:10px" }, rich(f(c.quake.after))));
  const quake = panel(c.quake.kicker, "hot", h("h2", {}, c.quake.title), say(f(c.quake.say), "!"), rich(f(c.quake.lead)),
    vote({ question: f(c.quake.question), choices: c.quake.choices.map((x) => f(x)), answer: c.quake.answer, verdicts: c.quake.verdicts.map((x) => f(x)), lockLabel: c.quake.lock,
      grid: true, previewVerdict: pv,
      onLock: (_, __, el, isPreview) => { quakeSteps.hidden = false; if (!isPreview) win("b-quake", el); } }), quakeSteps);
  const ropes = panel(c.challenge.kicker, "hot", h("h2", {}, c.challenge.title), rich(f(c.challenge.lead)),
    vote({ question: f(c.challenge.question), choices: c.challenge.choices, answer: c.challenge.answer, verdicts: c.challenge.verdicts,
      explain: f(c.challenge.explain), lockLabel: c.challenge.lock, grid: true, previewVerdict: pv, onLock: lockWin("b-ropes") }));

  rest.append(learn1, learn2, examples, learn3, learn4, prac, story, sim, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note), quake, ropes, chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}
