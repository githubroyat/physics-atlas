// Chapter o1: Push back (S6 Oscillations: restoring force, Hooke's law F = −k·y, SHM condition, elastic energy W = ½·k·y²).
// Teach-first layout: goals → warm-up → learn steps with checks → worked examples → practice → explore → summary
// → quiz → BONUS (olympiad-style and beyond-syllabus extras).
import { h, s, rich } from "../dom.js";
import { springLab } from "../widgets/springlab.js";
import {
  panel, say, vote, quickfire, choiceSteps, sortCards, comic, chapterHead, simCard, chapterNav,
  award, fillStr, syncStrip, burst, gate, goals, quickCheck, worked, practice, summary, bonusDivider, PREVIEW, useFill
} from "../engine.js";
import { hangFig, areaFig } from "./o1-figs.js";
import { crystalsIn } from "../store.js";
import { G, hookeForce, elasticEnergy, springForLaunch, seriesK, fmt } from "../physics.js";

const SIM_URL = "https://phet.colorado.edu/sims/html/hookes-law/latest/hookes-law_en.html";
// warmup, check1, check2, stretch, break, letgo, sort, derive, practice, anagram, quiz, b-series, b-cut, b-boots
const SLOTS = 14;

const thin = (t) => t.replace(/,/g, " "); // thin space as thousands separator

/** Every number in the prose, from physics.js. */
function numbers() {
  const appleStretch = 4; // cm, one spring
  const k1 = 1, kSeries = seriesK(k1, k1);
  const boots = { m: 50, h: 10, x: 0.5 };
  const kBoots = springForLaunch(boots.m, boots.h, boots.x);
  const fBoots = hookeForce(kBoots, boots.x);
  const aBoots = (fBoots - boots.m * G) / boots.m;
  const we1F = 0.2 * G, we1k = we1F / 0.04, we2F = hookeForce(we1k, 0.03);
  return {
    // bonus: springs in a line / boots / cut spring
    s1: fmt(appleStretch, 0), s2: fmt(appleStretch * (k1 / kSeries), 0), sPar: fmt(appleStretch / 2, 0),
    bm: fmt(boots.m, 0), bh: fmt(boots.h, 0), bx: fmt(boots.x * 100, 0),
    bEnergy: thin(fmt(boots.m * G * boots.h, 0)), kBoots: thin(fmt(kBoots, 0)), fBoots: thin(fmt(fBoots, 0)),
    fTonnes: fmt(fBoots / G / 1000, 1), aG: fmt(aBoots / G, 0),
    kWhole: fmt(50, 0), kHalf: fmt(100, 0),
    // learn checks, worked examples, practice
    l2F: fmt(hookeForce(50, 0.1), 1),
    we1F: fmt(we1F, 3), we1k: fmt(we1k, 0), we1k2: fmt(we1k, 2), we2F: fmt(we2F, 2), we2Fx: fmt(we2F, 4), we2a: fmt(we2F / 0.2, 1), we2a2: fmt(we2F / 0.2, 2),
    p1F: fmt(hookeForce(25, 0.08), 1), p1w1: fmt(0.08 / 25, 4), p1w2: fmt(25 / 0.08, 0),
    p2k: fmt(6 / 0.15, 0), p2w1: fmt(6 * 0.15, 2), p2w2: fmt(0.15 / 6, 3), p2w3: fmt(6 / 15, 2),
    p4E: fmt(elasticEnergy(40, 0.1), 2), p4w1: fmt(40 * 0.1, 1), p4w2: fmt(40 * 0.01, 2), p4w3: fmt(0.5 * 40 * 0.1, 1),
    // example 3: k = 80 N/m, stretched 5.0 cm then 10 cm; practice 4 energy chain (F rises 0 → k·y, average ½·k·y)
    we3W: fmt(elasticEnergy(80, 0.05), 2), we3W2: fmt(elasticEnergy(80, 0.1), 2), we3y2: fmt(0.05 * 0.05, 4),
    p4y2: fmt(0.1 * 0.1, 2),
    // home experiment: an example band with k = 50 N/m loaded with 0.1, 0.3, 0.5 kg (F = m·g, y = F/k in cm)
    expK: fmt(50, 0), expFa: fmt(0.1 * G, 2), expFb: fmt(0.3 * G, 2), expFc: fmt(0.5 * G, 2),
    expYa: fmt((0.1 * G / 50) * 100, 1), expYb: fmt((0.3 * G / 50) * 100, 1), expYc: fmt((0.5 * G / 50) * 100, 1),
    kQ: fmt(200, 0), qW: fmt(200 * 0.5, 0), xQ: fmt(5, 0), xM: fmt(0.05, 2), fQ: fmt(hookeForce(200, 0.05), 0),
  };
}

const ICONS = {
  bowl: () => s("svg", { viewBox: "0 0 80 60" }, s("path", { d: "M8 20q32 50 64 0", fill: "none", stroke: "#2ef2ff", "stroke-width": 4 }), s("circle", { cx: 40, cy: 36, r: 7, fill: "#ff4fd8" })),
  hill: () => s("svg", { viewBox: "0 0 80 60" }, s("path", { d: "M6 56q34-60 68 0", fill: "none", stroke: "#2ef2ff", "stroke-width": 4 }), s("circle", { cx: 40, cy: 19, r: 7, fill: "#ff4fd8" })),
  spring: () => s("svg", { viewBox: "0 0 80 60" }, s("path", { d: "M4 30h8l5-10 8 20 8-20 8 20 8-20 5 10h6", fill: "none", stroke: "#2ef2ff", "stroke-width": 4 }), s("rect", { x: 58, y: 18, width: 18, height: 24, rx: 4, fill: "#ff4fd8" })),
  pendulum: () => s("svg", { viewBox: "0 0 80 60" }, s("path", { d: "M20 4h40M40 4l14 38", stroke: "#2ef2ff", "stroke-width": 4 }), s("circle", { cx: 54, cy: 46, r: 8, fill: "#ff4fd8" })),
  floor: () => s("svg", { viewBox: "0 0 80 60" }, s("path", { d: "M4 46h72", stroke: "#2ef2ff", "stroke-width": 4 }), s("circle", { cx: 40, cy: 38, r: 7, fill: "#ff4fd8" })),
  board: () => s("svg", { viewBox: "0 0 80 60" }, s("rect", { x: 2, y: 26, width: 14, height: 30, fill: "#3a2f80" }), s("path", { d: "M16 28q30 2 58 12", fill: "none", stroke: "#2ef2ff", "stroke-width": 5 }), s("circle", { cx: 66, cy: 28, r: 6, fill: "#ff4fd8" })),
};

export function render(view, ctx) {
  const N = numbers();
  const c = ctx.content;
  const f = (str, extra) => fillStr(str, { ...N, ...extra });
  useFill(f);   // engine blocks fill their extra fields (whyNot) with it
  const id = ctx.chapter.id;
  const head = chapterHead(ctx, { art: null, sfx: c.hero.sfx, caption: c.hero.caption, intro: c.intro, slots: SLOTS });
  head.querySelector(".head-text").append(goals(c.goals.title, c.goals.items.map((x) => f(x))));
  const got = () => syncStrip(head, crystalsIn(id).size);
  const win = (key, el) => { award(id, key, el); got(); };
  const pv = ctx.app("app.preview_answer");
  const check = (chk, key) => quickCheck({ q: f(chk.q), choices: chk.choices.map((x) => f(x)), answer: chk.answer, why: f(chk.why), whyNot: chk.whyNot, labels: c.checks, onRight: (el) => win(key, el) });

  // ----- warm-up (free-roam: gate is off unless ?gate) -----
  const { note: gateNote, rest, unlock } = gate(c.predict.gate);
  const warm = c.warmup;
  const warmup = panel(warm.kicker, "hot", say(warm.say, "?"),
    vote({ question: warm.question, choices: warm.choices, answer: warm.answer, verdicts: warm.verdicts, explain: warm.explain,
      lockLabel: warm.lock, grid: true, previewVerdict: pv, saveKey: "o1-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- learn -----
  const fig = (svg, cap) => h("figure", { style: "margin:14px 0" }, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(cap))));
  const figHang = fig(hangFig({ ...c.figs.hang, aria: f(c.figs.hang.aria) }), c.figs.hang.caption);
  const figArea = fig(areaFig({ ...c.figs.area, aria: f(c.figs.area.aria) }), c.figs.area.caption);
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(c.learn1.body), figHang, check(c.learn1.check, "check1"));
  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(c.learn2.body), rich(c.learn2.formula), rich(c.learn2.after),
    springLab(c.lab, f, (ev, el) => win(ev === "stretch" ? "stretch" : ev === "break" ? "break" : "letgo", el)),
    check(c.learn2.check, "check2"));
  const examples = panel(c.examples.kicker, "sun", h("h2", {}, c.examples.title),
    ...c.examples.items.map((ex) => worked({ title: ex.title, problem: f(ex.problem), steps: ex.steps.map((x) => f(x)), answer: f(ex.answer), labels: { next: c.examples.next } })));
  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(c.learn3.lead),
    sortCards(c.bigidea.cards.map((card) => ({ ...card, svg: ICONS[card.icon]() })), { yes: c.bigidea.yes, no: c.bigidea.no, onAll: (el) => win("sort", el) }),
    h("div", { style: "margin-top:12px" }, rich(c.learn3.rule)));
  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(c.learn4.lead),
    choiceSteps(c.derive.steps, { tryAgain: c.derive.try_again, onDone: (el) => win("derive", el) }), figArea);

  // ----- practice -----
  const prac = panel(c.practice.kicker, "hot", h("h2", {}, c.practice.title),
    practice({ items: c.practice.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), hint: f(it.hint), solution: f(it.solution) })),
      labels: c.practice.labels, onDone: (right, el) => { if (right >= 3) win("practice", el); } }));

  // ----- explore -----
  const story = panel(c.story.kicker, "", h("h2", {}, c.story.title), comic(c.story.frames),
    h("h3", {}, c.story.game_title), rich(c.story.game_lead), anagram(c.story, (el) => win("anagram", el)));
  const sim = panel(c.sim.kicker, "cool", ...simCard(c.sim, SIM_URL));
  const T = c.trial;
  const trial = panel(T.kicker, "sun", h("h2", {}, T.title), rich(f(T.lead)), rich(f(T.safety)), rich(f(T.need)), rich(f(T.steps)), rich(f(T.measure)), rich(f(T.compare)), rich(f(T.wrong)));
  const manga = panel(c.manga.kicker, "sun", h("h2", {}, c.manga.title), rich(c.manga.body));

  // ----- remember + quiz -----
  const sum = panel(c.summary.kicker, "sun", h("h2", {}, c.summary.title), summary(c.summary.items));
  const quiz = panel(c.quiz.kicker, "hot", h("h2", {}, c.quiz.title),
    quickfire({ items: c.quiz.items.map((it) => ({ ...it, q: f(it.q), choices: it.choices.map((x) => f(x)), why: f(it.why) })), labels: c.quiz.labels,
      onDone: (score, el) => { if (score >= 2) win("quiz", el); } }));

  // ----- BONUS: beyond the syllabus -----
  const series = panel(c.predict.kicker, "sun", say(f(c.predict.say), "?"),
    vote({ question: f(c.predict.question), choices: c.predict.choices.map((x) => f(x)), answer: c.predict.answer,
      verdicts: c.predict.verdicts, explain: f(c.predict.explain), lockLabel: c.predict.lock, grid: true, previewVerdict: pv,
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("b-series", el); } }));
  const cut = panel(c.challenge.kicker, "sun", h("h2", {}, c.challenge.title),
    vote({ question: f(c.challenge.question), choices: c.challenge.choices, answer: c.challenge.answer, verdicts: c.challenge.verdicts,
      explain: f(c.challenge.explain), lockLabel: c.challenge.lock, previewVerdict: pv,
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("b-cut", el); } }));
  const bootSteps = h("div", { hidden: !PREVIEW },
    h("ol", { class: "steps" }, c.check.steps.map((st) => h("li", {}, rich(f(st))))),
    h("div", { style: "margin-top:10px" }, rich(f(c.check.after))));
  const boots = panel(c.check.kicker, "sun", h("h2", {}, c.check.title), say(f(c.check.say), "!"),
    vote({ question: null, choices: c.check.choices, answer: c.check.answer, verdicts: c.check.verdicts, lockLabel: c.check.lock, previewVerdict: pv,
      onLock: (_, __, el, isPreview) => { bootSteps.hidden = false; if (!isPreview) win("b-boots", el); } }), bootSteps);

  rest.append(learn1, learn2, examples, learn3, learn4, prac, story, sim, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note), series, cut, boots, chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}

/** Tap the letters to rebuild Hooke's hidden sentence. */
function anagram(c, onSolve) {
  const target = c.anagram_answer.replace(/\s/g, "");
  const letters = c.anagram_letters.split("");
  const slots = h("div", { class: "mini-choices", "aria-live": "polite", style: "font:22px Bangers, Impact, sans-serif;letter-spacing:.12em" });
  const status = h("div", { class: "verdict-row" });
  let built = "";
  const pool = h("div", { class: "mini-choices" });
  const draw = () => { slots.replaceChildren(h("span", {}, (built + "_".repeat(target.length - built.length)).replace(/(.{2})(.{6})(.{3})(.{3})/, "$1 $2 $3 $4"))); };
  function reset() {
    built = ""; status.replaceChildren(); draw();
    pool.replaceChildren(...letters.map((ch) => {
      const b = h("button", { class: "choice", type: "button", style: "min-width:46px;text-align:center" }, ch.toUpperCase());
      b.addEventListener("click", () => {
        b.disabled = true; built += ch.toUpperCase(); draw();
        if (built.length === target.length) {
          if (built === target.toUpperCase()) { status.replaceChildren(burst(c.anagram_burst_ok, "ok"), h("p", { class: "verdict" }, c.anagram_solved)); onSolve(status); }
          else status.replaceChildren(burst(c.anagram_burst_bad, "bad"), h("p", { class: "verdict" }, c.anagram_wrong));
        }
      });
      return b;
    }));
  }
  const hint = h("button", { class: "btn", type: "button" }, c.anagram_hint_label);
  hint.addEventListener("click", () => status.replaceChildren(h("p", { class: "small" }, c.anagram_hint)));
  const again = h("button", { class: "btn", type: "button", onclick: reset }, c.anagram_reset);
  reset();
  if (PREVIEW) status.replaceChildren(h("p", { class: "verdict" }, `${c.anagram_answer.toUpperCase()}: ${c.anagram_meaning}`));
  return h("div", {}, slots, pool, h("div", { class: "btn-row" }, hint, again), status);
}
