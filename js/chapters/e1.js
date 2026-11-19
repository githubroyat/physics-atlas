// Chapter e1: Trading height for speed (S5 Work and Energy: PE, KE, conservation of energy).
import { h, rich } from "../dom.js";
import { predict } from "../widgets/predict.js";
import { revealSteps, toggle } from "../widgets/steps.js";
import { rooftop } from "../widgets/rooftop.js";
import { gate } from "../engine.js";
import {
  G, STOREY_M, REF, speedForHeight, energyPerKg, toKmh, landingSpeed, fmt,
} from "../physics.js";

const ART = "art/e1-leap.webp";
const SIM_URL ="https://phet.colorado.edu/sims/html/energy-skate-park-basics/latest/energy-skate-park-basics_en.html";

/** Every number in the prose, computed from physics.js. */
function numbers() {
  const vDrop5 = speedForHeight(5), vDrop10 = speedForHeight(10);
  const hTen = 10 * STOREY_M, vTen = speedForHeight(hTen);
  const H = 20, u = 10;
  return {
    vDrop5: fmt(vDrop5, 1), vDrop10: fmt(vDrop10, 1), ratio: fmt(vDrop10 / vDrop5, 2), h4x: fmt(4 * 5, 0),
    storey: fmt(STOREY_M, 0), g: fmt(G, 2), hTen: fmt(hTen, 0),
    ePerKg: fmt(energyPerKg(hTen), 0), e50: fmt((50 * energyPerKg(hTen)) / 1000, 1),
    vTen: fmt(vTen, 1), vTenKmh: fmt(toKmh(vTen), 0),
    sprint: fmt(REF.sprintTopSpeed, 1), jumpV: fmt(speedForHeight(REF.goodStandingJump), 1),
    times: fmt(vTen / REF.sprintTopSpeed, 0),
    H: fmt(H, 0), u: fmt(u, 0), vLand: fmt(landingSpeed(u, H), 1),
  };
}

const panel = (kicker, cls, ...body) => h("section", { class: "panel" }, h("span", { class: `kicker ${cls}` }, kicker), ...body);

export function render(view, ctx) {
  const N = numbers();
  const c = ctx.content;
  const f = (str, extra) => fillStr(str, { ...N, ...extra });

  // ----- head -----
  // Art is a swappable slot: set ART to null (or delete the file) and a coded speed-line panel takes its place.
  const head = h("section", { class: "panel chapter-head" },
    artSlot(ART, c.hero.alt,
      h("div", { class: "sfx", "aria-hidden": "true" }, c.hero.sfx),
      h("div", { class: "caption-box" }, c.hero.caption)),
    h("div", { class: "head-text" },
      h("span", { class: "chip" }, `${ctx.regionName} · ${ctx.app(`chapters.${ctx.chapter.id}.tag`)}`),
      h("h1", {}, ctx.title),
      rich(c.intro)),
    h("p", { class: "placeholder-note" }, ctx.app("app.placeholder_art")));

  // ----- the "predict first" gate (off in her free-roam version; ?gate brings it back) -----
  const { note: gateNote, rest, unlock } = gate(c.predict.gate);

  const prediction = panel(c.predict.kicker, "hot",
    predict({
      id: "e1-drop-height",
      question: f(c.predict.question),
      choices: c.predict.choices.map((x) => f(x)),
      answer: c.predict.answer,
      text: { lock: c.predict.lock, verdicts: c.predict.verdicts, previewVerdict: ctx.app("app.preview_answer"), explain: f(c.predict.explain) },
      onDone: unlock,
      preview: ctx.preview,
    }));

  // ----- lab -----
  const lab = panel(c.lab.kicker, "cool",
    h("h2", {}, c.lab.title), rich(c.lab.lead),
    rooftop(c.lab, f),
    h("div", { style: "margin-top:14px" }, rich(c.lab.notice)),
    h("p", { class: "small muted" }, f(c.lab.assume)));

  // ----- anime check -----
  const anime = panel(c.anime.kicker, "hot",
    h("h2", {}, c.anime.title), rich(c.anime.setup),
    h("ol", { class: "steps" }, c.anime.steps.map((st) => h("li", {}, rich(f(st))))),
    h("div", { style: "margin-top:10px" }, rich(f(c.anime.verdict))),
    rich(c.anime.your_turn));

  const big = panel(c.bigidea.kicker, "", h("h2", {}, c.bigidea.title), rich(c.bigidea.body));

  const derive = panel(c.derive.kicker, "cool",
    h("h2", {}, c.derive.title), rich(c.derive.lead),
    revealSteps(c.derive.steps, c.derive.reveal, ctx.preview),
    h("div", { style: "margin-top:12px" }, rich(c.derive.bonus)));

  const story = panel(c.story.kicker, "", h("h2", {}, c.story.title), rich(c.story.body));

  const challenge = panel(c.challenge.kicker, "hot",
    h("h2", {}, c.challenge.title), rich(f(c.challenge.question)),
    toggle(c.challenge.hint_label, rich(c.challenge.hint), ctx.preview),
    toggle(c.challenge.answer_label, rich(f(c.challenge.answer)), ctx.preview));

  const sim = panel(c.sim.kicker, "cool",
    h("h2", {}, c.sim.title), rich(c.sim.body),
    h("div", { class: "sim-card" },
      h("a", { class: "btn primary", href: SIM_URL, target: "_blank", rel: "noopener noreferrer" }, c.sim.open, " ↗")),
    h("p", { class: "attribution" }, c.sim.attribution));

  const manga = panel(c.manga.kicker, "", h("h2", {}, c.manga.title), rich(c.manga.body));

  const recap = panel(c.recap.kicker, "hot", h("ul", {}, c.recap.items.map((x) => h("li", {}, x))));

  const backHref = `#/r/${ctx.region.id}`;
  const nav = h("nav", { class: "next-nav" },
    h("a", { class: ctx.nextHref === backHref ? "btn primary" : "btn", href: backHref }, ctx.app("app.back_region", { region: ctx.regionName })),
    ctx.nextHref !== backHref ? h("a", { class: "btn primary", href: ctx.nextHref }, ctx.nextLabel) : null);

  rest.append(lab, anime, big, derive, story, challenge, sim, manga, recap, nav);
  view.append(...[head, prediction, gateNote, rest].filter(Boolean));
}

function artSlot(src, alt, ...overlays) {
  const box = h("div", { class: "art" }, ...overlays);
  const fallback = () => { box.classList.add("fallback"); box.querySelector("img")?.remove(); };
  if (!src) { fallback(); return box; }
  const img = h("img", { src, alt, width: 1200, height: 821, decoding: "async" });
  img.addEventListener("error", fallback);
  box.prepend(img);
  return box;
}

function fillStr(str, vars) {
  return String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}
