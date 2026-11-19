// Chapter i4: Falling forever (S6 Interactions: orbits. Newton's cannon, v = √(G·M/r), T = 2π·r/v, ISS and geostationary orbit,
// weightlessness = free fall, flat vs banked bends).
// Teach-first layout: goals → warm-up → learn steps with checks → worked examples → practice → explore → summary → quiz
// → BONUS (Kepler's third law, escape speed, banked angle, charged particle in a magnetic field).
import { h, rich } from "../dom.js";
import { satFig, magFig } from "./i4-figs.js";
import { cannonLab, parkLab, bendDemo, kmStr, SIDEREAL, circularSpeed0, escapeSpeed0, CANNON } from "../widgets/orbits.js";
import {
  panel, say, vote, quickfire, choiceSteps, sortCards, comic, chapterHead, simCard, chapterNav,
  award, fillStr, syncStrip, gate, goals, quickCheck, worked, practice, summary, bonusDivider, useFill
} from "../engine.js";
import { crystalsIn } from "../store.js";
import {
  G, GRAV_CONST, EARTH, E_CHARGE, M_ELECTRON, LIGHT_SPEED, gravField, orbitSpeed, orbitPeriod, orbitRadiusForPeriod, fmt, sci,
} from "../physics.js";

const SIM_URL = "https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_en.html";
// warmup, derive, check1-6, circle, ellipse, park, geo, sort, bend, practice, story, quiz, b-kepler, b-escape, b-bank, b-magnet
export const AWARD_KEYS = [
  "warmup", "derive", "check1", "check2", "check3", "check4", "check5", "check6", "circle", "ellipse", "park", "geo", "sort", "bend",
  "practice", "story", "quiz", "b-kepler", "b-escape", "b-bank", "b-magnet",
];
const SLOTS = AWARD_KEYS.length;
const { M, R } = EARTH;
const GM = GRAV_CONST * M;
const H_ISS = 4e5;                                   // m, the same assumption as Weighing the Earth: a circular orbit at 400 km
const R_MOON = 3.844e8;                              // m, mean Earth–Moon distance (centres)
const sp = (x, d = 0) => fmt(x, d).replace(/,/g, " ");
const k3 = (m) => kmStr(Number(m.toPrecision(3)));   // metres → km, rounded to 3 significant figures

export function numbers() {
  const rI = R + H_ISS, vI = orbitSpeed(M, rI), TI = orbitPeriod(M, rI), gI = gravField(M, rI), gS = gravField(M, R);
  const rG = orbitRadiusForPeriod(M, SIDEREAL), vG = orbitSpeed(M, rG);
  const r2k = R + 2e6;
  // worked example 1: height 600 km
  const w1r = R + 7e5, w1v2 = GM / w1r, w1v = Math.sqrt(w1v2), w1T = (2 * Math.PI * w1r) / w1v;
  // worked example 2: period 2.00 h
  const w2T = 7200, w2num = GM * w2T * w2T, w2den = 4 * Math.PI * Math.PI, w2r3 = w2num / w2den, w2r = Math.cbrt(w2r3);
  // practice and checks
  const p1r = 7.0e6, p1v = orbitSpeed(M, p1r);
  const p2r = R + 1e6, p2v = orbitSpeed(M, p2r);
  const p5v = Number(fmt(p1v / 1e3, 2)) * 1e3, p5T = (2 * Math.PI * p1r) / p5v;
  const rMoonG = R_MOON / rG, moonDays = (SIDEREAL * rMoonG ** 1.5) / 86400;
  const vEsc = escapeSpeed0(), vEscS = Math.sqrt((2 * GM) / R);
  const bv = 25, br = 200, bth = Math.atan((bv * bv) / (br * G)) * 180 / Math.PI;
  // home experiment: spotting the ISS (the 400 km circle of this chapter)
  const exT = 300, exArc = (360 * exT) / TI, exMaxArc = (2 * Math.acos(R / rI) * 180) / Math.PI, exAng = ((vI / H_ISS) * 180) / Math.PI;
  const mv = 1.0e7, mB = 1.0e-3, mr = (M_ELECTRON * mv) / (E_CHARGE * mB);
  const cv = 3.0e6, cB = 1.0e-3, cr = (M_ELECTRON * cv) / (E_CHARGE * cB);   // step 7: electron, 3.0 × 10⁶ m/s, B = 1.0 mT
  return {
    g: fmt(G, 2), Msci: sci(M, 3), Rsci: sci(R, 3), Gsci: sci(GRAV_CONST, 3), GM5: sci(GM, 5), Rkm: kmStr(R),
    issH: fmt(H_ISS / 1e3, 0), issHm: sci(H_ISS, 1), issR: sci(rI, 3), issRkm: kmStr(rI), issG: fmt(gI, 2), issPct: fmt((gI / G) * 100, 0),
    issV: fmt(vI / 1e3, 2), issVm: sp(vI), issT: fmt(TI / 60, 1), issTs: sp(TI),
    surfV: fmt(orbitSpeed(M, R) / 1e3, 2), surfT: fmt(orbitPeriod(M, R) / 60, 1),
    capV: fmt(CANNON.vMaxKm, 1), escI: fmt(vEsc / 1e3, 2), escS: fmt(vEscS / 1e3, 1), vcI: fmt(circularSpeed0() / 1e3, 2),
    exMin: fmt(exT / 60, 0), exT: fmt(exT, 0), exDkm: sp((vI * exT) / 1e3), exFrac: fmt((exT / TI) * 100, 1), exArc: fmt(exArc, 0),
    exMaxArc: fmt(exMaxArc, 0), exMax: fmt((exMaxArc / 360) * (TI / 60), 0), exLap: sp((2 * Math.PI * rI) / 1e3), exLapDay: fmt(86400 / TI, 1),
    exAng: fmt(exAng, 1), exFist: fmt(10 / exAng, 0),
    // learn 3 table
    t2r: kmStr(r2k), t2v: fmt(orbitSpeed(M, r2k) / 1e3, 2), t2T: fmt(orbitPeriod(M, r2k) / 60, 1),
    // geostationary
    sid: sp(SIDEREAL), geoR: sci(rG, 3), geoRkm: k3(rG), geoH: k3(rG - R), geoV: fmt(vG / 1e3, 2), geoRatio: fmt(rG / R, 1),
    geoT2: sci(SIDEREAL * SIDEREAL, 4), geoNum: sci(GM * SIDEREAL * SIDEREAL, 4), geoDen: fmt(4 * Math.PI * Math.PI, 2),
    geoR3: sci(rG ** 3, 4), geoRc: sci(rG, 4),
    // worked example 1
    w1r: sci(w1r, 3), w1v2: sci(w1v2, 5), w1v: sp(w1v), w1vk: fmt(w1v / 1e3, 2), w1T: sp(w1T), w1Tm: fmt(w1T / 60, 1),
    // worked example 2
    w2T: sp(w2T), w2T2: sci(w2T * w2T, 4), w2num: sci(w2num, 4), w2r3: sci(w2r3, 4), w2r: sci(w2r, 4), w2h: kmStr(w2r - R),
    // checks
    c3r: sci(p1r, 3), c3r4: sci(4 * p1r, 3), c3v: fmt(p1v / 1e3, 2), c3v4: fmt(p1v / 2e3, 2), c3w1: fmt(p1v / 4e3, 2), c3w2: fmt((p1v * 2) / 1e3, 1),
    // practice
    p1r: sci(p1r, 3), p1v: fmt(p1v / 1e3, 2), p1w1: fmt(Math.sqrt(G * p1r) / 1e3, 2), p1w2: fmt(orbitSpeed(M, R + p1r) / 1e3, 2), p1w3: fmt(gravField(M, p1r), 2), p1v2: sci(GM / p1r, 4), p1vm: sp(p1v),
    p2h: sp(1e3), p2r: sci(p2r, 3), p2v: fmt(p2v / 1e3, 2), p2w1: fmt(orbitSpeed(M, R) / 1e3, 2), p2w2: fmt(orbitSpeed(M, 1e6) / 1e3, 1), p2w3: fmt(orbitSpeed(M, R - 1e6) / 1e3, 2),
    p5v: fmt(p5v / 1e3, 2), p5vm: sp(p5v), p5Ts: sp(p5T), p5T: fmt(p5T / 60, 1), p5w1: fmt(p1r / p5v / 60, 1), p5w2: fmt(p5T / 120, 1), p5w3: fmt(p5T / 30, 1),
    // bonus: Kepler
    moonR: sci(R_MOON, 4), moonRatio: fmt(rMoonG, 1), moonDays: fmt(moonDays, 1), moonDirect: fmt(orbitPeriod(M, R_MOON) / 86400, 1),
    // bonus: escape
    escRatio: fmt(Math.SQRT2, 2), escMore: fmt((Math.SQRT2 - 1) * 100, 0),
    // bonus: banked bend
    bv: fmt(bv, 0), bvk: fmt(bv * 3.6, 0), br: fmt(br, 0), bv2: fmt(bv * bv, 0), brg: sp(br * G), btan: fmt((bv * bv) / (br * G), 3), bdeg: fmt(bth, 1), bdeg0: fmt(bth, 0),
    // bonus: charged particle
    mv: sci(mv, 2), mB: fmt(mB * 1e3, 1), mr: fmt(mr * 100, 1), mrmm: fmt(mr * 1e3, 0), mc: fmt((mv / LIGHT_SPEED) * 100, 1),
    cv: sci(cv, 2), cB: fmt(cB * 1e3, 1), cnum: sci(M_ELECTRON * cv, 3), cden: sci(E_CHARGE * cB, 3), crm: fmt(cr, 3), cr: fmt(cr * 100, 1), mratio: fmt(mr / cr, 1),
    mm: sci(M_ELECTRON, 3), me: sci(E_CHARGE, 3), mnum: sci(M_ELECTRON * mv, 3), mden: sci(E_CHARGE * mB, 3),
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
  const fd = (o) => (typeof o === "string" ? f(o) : Array.isArray(o) ? o.map(fd) : o && typeof o === "object" ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, fd(v)])) : o);
  const cannonL = fd(c.cannon), parkL = fd(c.park), bendL = fd(c.bend), sortL = fd(c.sort);
  const pv = ctx.app("app.preview_answer");
  const check = (chk, key) => quickCheck({ q: f(chk.q), choices: chk.choices.map((x) => f(x)), answer: chk.answer, why: f(chk.why), whyNot: chk.whyNot, labels: c.checks, onRight: (el) => win(key, el) });

  // ----- warm-up (free-roam: gate is off unless ?gate) -----
  const { note: gateNote, rest, unlock } = gate(c.warmup.gate);
  const warm = c.warmup;
  const warmup = panel(warm.kicker, "hot", say(warm.say, "?"),
    vote({ question: f(warm.question), choices: warm.choices.map((x) => f(x)), answer: warm.answer, verdicts: warm.verdicts, explain: f(warm.explain),
      lockLabel: warm.lock, grid: true, previewVerdict: pv, saveKey: "i4-warmup",
      onLock: (_, __, el, isPreview) => { if (!isPreview) win("warmup", el); unlock(); } }));

  // ----- learn -----
  const fig = (L, svg) => h("figure", { style: "margin:14px 0" }, h("div", { class: "scene-box", style: "max-width:560px;margin:0 auto" }, svg), h("figcaption", { class: "small muted", style: "margin-top:8px" }, rich(f(L.caption))));
  const figSat = fig(c.figs.sat, satFig({ ...c.figs.sat, aria: f(c.figs.sat.aria) }));
  const figMag = fig(c.figs.mag, magFig({ ...c.figs.mag, aria: f(c.figs.mag.aria) }));
  const learn1 = panel(c.learn1.kicker, "cool", h("h2", {}, c.learn1.title), rich(f(c.learn1.body)), rich(f(c.cannon.lead)),
    cannonLab(cannonL, (ev, el) => { if (ev === "circle" || ev === "ellipse") win(ev, el); }), rich(f(c.cannon.tasks)), check(c.learn1.check, "check1"));
  const learn2 = panel(c.learn2.kicker, "cool", h("h2", {}, c.learn2.title), rich(f(c.learn2.lead)), figSat,
    choiceSteps(c.derive.steps.map((st) => ({ ...st, prompt: f(st.prompt), then: f(st.then) })), { tryAgain: c.derive.try_again, onDone: (el) => win("derive", el) }),
    check(c.learn2.check, "check2"));
  const learn3 = panel(c.learn3.kicker, "cool", h("h2", {}, c.learn3.title), rich(f(c.learn3.body)), check(c.learn3.check, "check3"));
  const learn4 = panel(c.learn4.kicker, "cool", h("h2", {}, c.learn4.title), rich(f(c.learn4.body)), rich(f(c.park.lead)),
    parkLab(parkL, (ev, el) => win(ev, el)), rich(f(c.park.after)), check(c.learn4.check, "check4"));
  const learn5 = panel(c.learn5.kicker, "cool", h("h2", {}, c.learn5.title), rich(f(c.learn5.body)),
    sortCards(sortL.cards, { yes: sortL.yes, no: sortL.no, onAll: (el) => win("sort", el) }), rich(f(c.learn5.after)), check(c.learn5.check, "check5"));
  const learn7 = panel(c.learn7.kicker, "cool", h("h2", {}, c.learn7.title), rich(f(c.learn7.body)), figMag,
    quickCheck({ q: f(c.learn7.check.q), choices: c.learn7.check.choices.map((x) => f(x)), answer: c.learn7.check.answer, why: f(c.learn7.check.why), whyNot: c.learn7.check.whyNot, labels: c.checks }));   // quick check without an award: no new crystals
  const learn6 = panel(c.learn6.kicker, "cool", h("h2", {}, c.learn6.title), rich(f(c.learn6.body)),
    bendDemo(bendL, (ev, el) => win(ev, el)), rich(f(c.learn6.after)), check(c.learn6.check, "check6"));

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
  const bonus = (b, key) => panel(b.kicker, "sun", h("h2", {}, b.title), rich(f(b.lead)),
    vote({ question: f(b.question), choices: b.choices.map((x) => f(x)), answer: b.answer, verdicts: b.verdicts, explain: f(b.explain),
      lockLabel: b.lock, grid: true, previewVerdict: pv, onLock: lockWin(key) }));

  rest.append(learn1, learn2, learn3, learn4, learn5, learn6, learn7, examples, prac, story, sim, trial, manga, sum, quiz,
    bonusDivider(c.bonus.title, c.bonus.note),
    bonus(c.bk, "b-kepler"), bonus(c.be, "b-escape"), bonus(c.bb, "b-bank"), bonus(c.bm, "b-magnet"), chapterNav(ctx));
  view.append(...[head, warmup, gateNote, rest].filter(Boolean));
  got();
}
