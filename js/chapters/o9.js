// Chapter o9: The siren's trick (S6 Doppler effect: moving source f_o = f_s·v/(v ∓ u_s), moving observer f_o = f_s·(v ± u_o)/v,
// "approaching means higher", light qualitatively). Teach-first layout: goals → warm-up → learn steps with checks → worked examples
// → practice → explore → summary → quiz → BONUS (both moving, sonic boom, radar and light numbers).
import { h, rich } from "../dom.js";
import { waveFig, pitchFig, WAVE_RATIO } from "./o9-figs.js";
import { dopplerLab, tuneGame, speedFor, FS, V, U_MAX } from "../widgets/doppler.js";
import {
  panel, say, vote, quickfire, choiceSteps, comic, chapterHead, chapterNav,
  award, fillStr, syncStrip, gate, goals, quickCheck, worked, practice, summary, bonusDivider, useFill
} from "../engine.js";
import { crystalsIn } from "../store.js";
import { dopplerObserver, dopplerSource, LIGHT_SPEED, fmt, sci } from "../physics.js";

const FIG_PITCH = { fs: 700, u: 25, d: 8 };            // figure 2 = worked example 1 (700 Hz at 25 m/s), road 8 m from the listener
const EXP = { fs: 1000, u: 0.5, u2: 1.5, d: 4 };         // home experiment: two phones, a slow walk

// warmup, check1-5, derive-s, derive-o, fast, listener, tune, practice, story, quiz, b-both, b-boom
export const AWARD_KEYS = ["warmup", "check1", "check2", "check3", "check4", "check5", "derive-s", "derive-o", "fast", "listener", "tune",
  "practice", "story", "quiz", "b-both", "b-boom"];
const SLOTS = AWARD_KEYS.length;
const TARGETS = [{ fo: 500, approaching: true }, { fo: 400, approaching: false }];

export function numbers() {
  const T = 1 / FS;
  const us = 30, uo = 10;                                   // examples in the derivation steps
  const half = Math.round(0.5 * V);                       // 172 m/s: about half of v, and a value the 1 m/s slider can reach
  const C_RADAR = 3.00e8;                                   // the value printed in the text
  // worked examples
  const w1 = { fs: 700, u: 25 };
  const w2 = { fs: 800, u: 8 };
  // practice
  const p1 = { fs: 440, u: 20 }, p2 = { fs: 1000, u: 30 }, p3 = { fs: 600, u: 15 }, p5 = { fs: 500, fo: 550 };
  // bonus
  const w3 = { fs: 900, fo: 960 };
  const b1 = { fs: 400, u: 20 };
  const mach = 1.5, radarF = 24e9, radarU = 30;
  return {
    v: fmt(V, 0), fs: fmt(FS, 0), lam0: fmt(V / FS, 2), Tms: fmt(T * 1000, 2),
    // step 2 (source), u_s = 30 m/s
    us: fmt(us, 0), usT: fmt(us * T, 3), lamF: fmt((V - us) * T, 2), lamB: fmt((V + us) * T, 2),
    sA: fmt(dopplerSource(FS, us, true), 0), sB: fmt(dopplerSource(FS, us, false), 0),
    // step 3 (observer), u_o = 10 m/s
    uo: fmt(uo, 0), oA: fmt(dopplerObserver(FS, uo, true), 0), oB: fmt(dopplerObserver(FS, uo, false), 0),
    // step 4 (lab): source at v/2 against listener at v/2
    halfSrc: fmt(dopplerSource(FS, half, true) / FS, 2), halfLis: fmt(dopplerObserver(FS, half, true) / FS, 2),
    halfU: fmt(half, 0), cap: fmt(U_MAX, 0), capF: fmt(dopplerSource(FS, U_MAX, true), 0),
    // worked example 1
    w1fs: fmt(w1.fs, 0), w1u: fmt(w1.u, 0), w1d1: fmt(V - w1.u, 0), w1d2: fmt(V + w1.u, 0),
    w1A: fmt(dopplerSource(w1.fs, w1.u, true), 0), w1B: fmt(dopplerSource(w1.fs, w1.u, false), 0),
    w1drop: fmt(dopplerSource(w1.fs, w1.u, true) - dopplerSource(w1.fs, w1.u, false), 0),
    // worked example 2
    w2fs: fmt(w2.fs, 0), w2u: fmt(w2.u, 0), w2n1: fmt(V + w2.u, 0), w2n2: fmt(V - w2.u, 0),
    w2A: fmt(dopplerObserver(w2.fs, w2.u, true), 0), w2B: fmt(dopplerObserver(w2.fs, w2.u, false), 0),
    // worked example 3 (find the speed)
    w3fs: fmt(w3.fs, 0), w3fo: fmt(w3.fo, 0), w3one: fmt(1 - w3.fs / w3.fo, 4), w3: fmt(speedFor(w3.fs, w3.fo, true), 1), w3kmh: fmt(speedFor(w3.fs, w3.fo, true) * 3.6, 0),
    // figures
    figRatio: fmt(WAVE_RATIO, 1), figD: fmt(FIG_PITCH.d, 0),
    // home experiment
    expFs: fmt(EXP.fs, 0), expU: fmt(EXP.u, 1), expU2: fmt(EXP.u2, 1), expD: fmt(EXP.d, 0), expT: fmt(EXP.d / EXP.u, 0),
    expA: fmt(dopplerSource(EXP.fs, EXP.u, true), 1), expB: fmt(dopplerSource(EXP.fs, EXP.u, false), 1),
    expDf: fmt(dopplerSource(EXP.fs, EXP.u, true) - EXP.fs, 1), expN: fmt((dopplerSource(EXP.fs, EXP.u, true) - EXP.fs) * (EXP.d / EXP.u), 0),
    expDf2: fmt(dopplerSource(EXP.fs, EXP.u2, true) - EXP.fs, 1),
    // practice
    p1fs: fmt(p1.fs, 0), p1u: fmt(p1.u, 0), p1d: fmt(V - p1.u, 0), p1: fmt(dopplerSource(p1.fs, p1.u, true), 0),
    p1w1: fmt(dopplerSource(p1.fs, p1.u, false), 0), p1w2: fmt(dopplerObserver(p1.fs, p1.u, true), 0), p1w3: fmt(p1.fs, 0),
    p2fs: fmt(p2.fs, 0), p2u: fmt(p2.u, 0), p2d: fmt(V + p2.u, 0), p2: fmt(dopplerSource(p2.fs, p2.u, false), 0),
    p2w1: fmt(dopplerSource(p2.fs, p2.u, true), 0), p2w2: fmt(dopplerObserver(p2.fs, p2.u, false), 0), p2w3: fmt(p2.fs - p2.u, 0),
    p3fs: fmt(p3.fs, 0), p3u: fmt(p3.u, 0), p3n: fmt(V + p3.u, 0), p3: fmt(dopplerObserver(p3.fs, p3.u, true), 1),
    p3w1: fmt(dopplerObserver(p3.fs, p3.u, false), 1), p3w2: fmt(dopplerSource(p3.fs, p3.u, true), 1), p3w3: fmt(dopplerSource(p3.fs, p3.u, false), 1),
    p5fs: fmt(p5.fs, 0), p5fo: fmt(p5.fo, 0), p5r: fmt(p5.fs / p5.fo, 3), p5one: fmt(1 - p5.fs / p5.fo, 3),
    p5: fmt(speedFor(p5.fs, p5.fo, true), 1), p5chk: fmt(dopplerSource(p5.fs, speedFor(p5.fs, p5.fo, true), true), 0), p5kmh: fmt(speedFor(p5.fs, p5.fo, true) * 3.6, 0), p5w1: fmt(V * (p5.fo / p5.fs - 1), 1), p5w2: fmt(V * (p5.fs / p5.fo), 1),
    p5w3: fmt((V * (p5.fo - p5.fs)) / (p5.fo + p5.fs), 1),
    // tune game
    tuneU: fmt(speedFor(FS, TARGETS[0].fo, true), 1), tuneU2: fmt(speedFor(FS, TARGETS[1].fo, false), 1), tuneF1: fmt(TARGETS[0].fo, 0), tuneF2: fmt(TARGETS[1].fo, 0),
    // bonus: both moving
    b1fs: fmt(b1.fs, 0), b1u: fmt(b1.u, 0), b1n: fmt(V + b1.u, 0), b1d: fmt(V - b1.u, 0),
    b1: fmt((b1.fs * (V + b1.u)) / (V - b1.u), 0), b1w1: fmt(dopplerSource(b1.fs, b1.u, true), 0),
    b1w2: fmt(dopplerObserver(b1.fs, 2 * b1.u, true), 0), b1w3: fmt((b1.fs * (V - b1.u)) / (V + b1.u), 0),
    // bonus: boom
    machU: fmt(mach * V, 0), machK: fmt(mach, 1), machAng: fmt((Math.asin(1 / mach) * 180) / Math.PI, 0),
    // bonus: radar and light
    radarGHz: fmt(radarF / 1e9, 0), radarU: fmt(radarU, 0), radarDf: fmt((2 * radarU * radarF) / C_RADAR, 0), radarKHz: fmt((2 * radarU * radarF) / C_RADAR / 1000, 1),
    cLight: sci(LIGHT_SPEED, 3), earthRatio: sci(30e3 / LIGHT_SPEED, 2), sunRatio: sci(2e3 / LIGHT_SPEED, 2),
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
  const steps = (d, key) => choiceSteps(d.steps.map((st) => ({ ...st, prompt: f(st.prompt), then: f(st.then) })), { tryAgain: d.try_again, onDone: (el) => win(key, el) });

  // ----- warm-up (free-roam: gate is off unless ?gate) -----
  const { note: gateNote, rest, unlock } = gate(c.warmup.gate);
  const warm = c.warmup;
  const warmup = panel(warm.kicker, "hot", say(warm.say, "?"),
    vote({ question: warm.question, choices: warm.choices, answer: warm.answer, verdicts: warm.verdicts, explain: f(warm.explain),
      lockLabel: warm.lock, grid: true, previewVerdict: pv, saveKey: "o9-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- learn -----
  const fig = (svg, cap) => h("figure", { style: "margin:14px 0" }, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(cap))));
  const figPitch = fig(pitchFig({ ...c.figs.pitch, aria: f(c.figs.pitch.aria), hi: f(c.figs.pitch.hi), lo: f(c.figs.pitch.lo), mid: f(c.figs.pitch.mid) }, FIG_PITCH), c.figs.pitch.caption);
  const figWave = fig(waveFig(c.figs.wave, WAVE_RATIO), c.figs.wave.caption);
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(f(c.learn1.body)), check(c.learn1.check, "check1"));
  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(f(c.learn2.lead)), figWave, steps(c.derive_s, "derive-s"),
    rich(f(c.learn2.after)), check(c.learn2.check, "check2"));
  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(f(c.learn3.lead)), steps(c.derive_o, "derive-o"),
    rich(f(c.learn3.after)), check(c.learn3.check, "check3"));
  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(f(c.learn4.body)), rich(c.lab.lead),
    dopplerLab(c.lab, (ev, el) => { if (ev === "fast" || ev === "listener") win(ev, el); }), rich(f(c.lab.tasks)), check(c.learn4.check, "check4"));
  const learn5 = panel(c.learn5.kicker, "cool", h("h2", {}, c.learn5.title), rich(f(c.learn5.body)), check(c.learn5.check, "check5"));

  const examples = panel(c.examples.kicker, "sun", h("h2", {}, c.examples.title),
    ...c.examples.items.flatMap((ex, i) => [worked({ title: ex.title, problem: f(ex.problem), steps: ex.steps.map((x) => f(x)), answer: f(ex.answer), labels: { next: c.examples.next } }), i === 0 ? figPitch : null]).filter(Boolean));

  // ----- practice -----
  const prac = panel(c.practice.kicker, "hot", h("h2", {}, c.practice.title),
    practice({ items: c.practice.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), hint: f(it.hint), solution: f(it.solution) })),
      labels: c.practice.labels, onDone: (right, el) => { if (right >= 3) win("practice", el); } }));

  // ----- explore -----
  const game = panel(c.game.kicker, "hot", h("h2", {}, c.game.title), rich(f(c.game.lead)),
    tuneGame(c.game, TARGETS, (el) => win("tune", el)), rich(f(c.game.after)));
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
  const bv = (b, key, extra = {}) => vote({ question: f(b.question), choices: b.choices.map((x) => f(x)), answer: b.answer, verdicts: b.verdicts,
    explain: f(b.explain), lockLabel: b.lock, grid: true, previewVerdict: pv, onLock: lockWin(key), ...extra });
  const both = panel(c.both.kicker, "sun", h("h2", {}, c.both.title), rich(f(c.both.lead)), bv(c.both, "b-both"));
  const boom = panel(c.boom.kicker, "sun", h("h2", {}, c.boom.title), rich(f(c.boom.lead)), bv(c.boom, "b-boom"));
  const radar = panel(c.radar.kicker, "sun", h("h2", {}, c.radar.title), rich(f(c.radar.body)));

  rest.append(learn1, learn2, learn3, learn4, learn5, examples, prac, game, story, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note), both, boom, radar, chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}
