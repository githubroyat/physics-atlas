// Shared building blocks for chapters: panels, speech bubbles, votes, quick-fire quizzes, comic strips,
// choice-based derivations, sort cards, crystals and scroll reveal. Chapters compose these plus their own labs.
import { h, rich, richInline } from "./dom.js";
import { earn, crystalTotal, store, PREVIEW, GATED } from "./store.js";

export { PREVIEW, GATED };

/** The "predict first" gate: returns the note and the container for the rest of the chapter. Free-roam by default. */
export function gate(text) {
  if (!GATED || PREVIEW) return { note: null, rest: h("div"), unlock: () => {} };
  const note = h("p", { class: "gate-note rise" }, text);
  const rest = h("div", { class: "locked" });
  const unlock = () => { rest.classList.remove("locked"); note.remove(); rest.querySelectorAll(".rise").forEach((e) => e.classList.add("in")); };
  return { note, rest, unlock };
}

// UI words the engine shows itself; main.js fills them from the language file.
const UI = { yes: "YES!", nope: "NOPE!", whynot: "" };
export function setUi(strings) { Object.assign(UI, strings); }

/** Fill {placeholders} from vars; unknown ones stay visible so they get noticed. */
export function fillStr(str, vars) {
  return String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

// The chapter's placeholder filler, set once per chapter render with useFill(f). Engine blocks use it for fields the
// chapter doesn't fill itself (today: whyNot), so a new field can never show a raw {placeholder}.
let FILL = (x) => x;
export function useFill(f) { FILL = typeof f === "function" ? f : (x) => x; }

/** whyNot: optional array parallel to choices — for each WRONG option, what slip leads there (null for the right one). */
const whyNotOf = (it, i) => (it.whyNot && it.whyNot[i] ? FILL(it.whyNot[i]) : null);
/** Preview mode: list every wrong option with its explanation, so the parent (and the test dumps) can read them all. */
function whyNotList(it, labels) {
  if (!PREVIEW || !Array.isArray(it.whyNot)) return null;
  const rows = it.choices.map((c, i) => (i !== it.answer && it.whyNot[i] ? h("li", {}, h("strong", {}, richInline(c)), ": ", richInline(FILL(it.whyNot[i]))) : null)).filter(Boolean);
  return rows.length ? h("div", { class: "whynot-list small" }, h("p", { class: "muted" }, UI.whynot), h("ul", {}, rows)) : null;
}

// ---------- crystals ----------
export function refreshCrystals() {
  const el = document.getElementById("crystal-count");
  if (el) el.textContent = String(crystalTotal());
}
/** Award a crystal for an interaction; flies a spark from `from` to the counter. */
export function award(chapterId, key, from) {
  if (PREVIEW || !earn(chapterId, key)) return;
  refreshCrystals();
  const box = document.getElementById("crystals");
  if (!box) return;
  box.classList.remove("pop"); void box.offsetWidth; box.classList.add("pop");
  if (!from || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const a = from.getBoundingClientRect(), b = box.getBoundingClientRect();
  for (let i = 0; i < 6; i++) {
    const sp = h("span", { class: "spark" });
    sp.style.left = `${a.left + a.width / 2}px`; sp.style.top = `${a.top + a.height / 2}px`;
    sp.style.setProperty("--dx", `${b.left - a.left - a.width / 2 + (Math.random() - .5) * 40}px`);
    sp.style.setProperty("--dy", `${b.top - a.top - a.height / 2 + (Math.random() - .5) * 40}px`);
    sp.style.animationDelay = `${i * 40}ms`;
    document.body.append(sp);
    setTimeout(() => sp.remove(), 1200);
  }
}

// ---------- layout ----------
export function panel(kicker, tone, ...body) {
  const tilt = Math.random() < .5 ? "tilt-l" : "tilt-r";
  return h("section", { class: `panel rise ${tilt}` }, kicker ? h("span", { class: `kicker ${tone || ""}` }, kicker) : null, ...body);
}
export function say(text, who = "?", right = false) {
  return h("div", { class: `say${right ? " right" : ""}` }, h("div", { class: "who", "aria-hidden": "true" }, who), h("div", { class: "bubble" }, rich(text)));
}
export function burst(text, tone = "") {
  return h("div", { class: `burst ${tone}`, role: "status" }, text);
}

/** Scroll-in animation for every .rise element under root. */
export function observeRise(root) {
  const els = root.querySelectorAll(".rise");
  if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px" });
  els.forEach((e) => io.observe(e));
}

// ---------- vote: pick, lock, reveal ----------
/**
 * Multiple choice with a lock-in step. verdicts: one line per choice (shown in a burst-coloured row).
 * onLock(pickedIndex, correct) fires once.
 */
export function vote({ question, choices, answer, verdicts, explain, lockLabel, grid = false, preview = PREVIEW, previewVerdict, onLock, saveKey }) {
  let picked = null;
  const saved = saveKey ? store.get(`vote:${saveKey}`, null) : null;
  const btns = choices.map((c, i) => h("button", { class: "choice", type: "button", "aria-pressed": "false", onclick: () => pick(i) }, c));
  const lock = h("button", { class: "btn primary", type: "button", disabled: true, onclick: commit }, lockLabel);
  const out = h("div", { class: "reveal", hidden: true, "aria-live": "polite" });
  const root = h("div", {}, question ? rich(question) : null, h("div", { class: `choices${grid ? " grid2" : ""}` }, btns), h("div", { class: "btn-row" }, lock), out);
  function pick(i) {
    if (!out.hidden) return;
    picked = i;
    btns.forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
    lock.disabled = false;
  }
  function commit() {
    if (picked == null) return;
    if (saveKey) store.set(`vote:${saveKey}`, picked);
    show(false);
  }
  function show(isPreview) {
    btns.forEach((b, j) => { b.disabled = true; b.classList.toggle("correct", j === answer); b.classList.toggle("wrong", j === picked && j !== answer); });
    lock.hidden = true; out.hidden = false;
    const ok = picked === answer;
    out.append(...[
      h("div", { class: "verdict-row" },
        isPreview ? null : burst(ok ? UI.yes : UI.nope, ok ? "ok" : "bad"),
        h("p", { class: "verdict" }, richInline(isPreview ? previewVerdict : verdicts[picked]))),
      explain ? rich(explain) : null].filter(Boolean)); // native append() would print "null"
    if (!isPreview) onLock?.(picked, ok, root);
  }
  if (preview) { picked = answer; queueMicrotask(() => { show(true); onLock?.(answer, true, root, true); }); }
  else if (saved != null) { // returning visitor: show her earlier answer, keep the chapter unlocked
    picked = saved;
    btns.forEach((b, j) => b.setAttribute("aria-pressed", String(j === saved)));
    queueMicrotask(() => show(false));
  }
  return root;
}

// ---------- quick-fire quiz ----------
export function quickfire({ items, labels, onDone }) {
  let i = 0, score = 0;
  const body = h("div");
  const root = h("div", {}, body);
  function next() {
    body.replaceChildren();
    if (i >= items.length) {
      body.append(h("div", { class: "verdict-row" }, burst(`${score}/${items.length}`, score === items.length ? "ok" : ""), h("p", { class: "verdict" }, score === items.length ? labels.perfect : labels.done)),
        h("button", { class: "btn", type: "button", onclick: () => { i = 0; score = 0; next(); } }, labels.again));
      onDone?.(score, root);
      return;
    }
    const it = items[i];
    const btns = it.choices.map((c, j) => h("button", { class: "choice", type: "button", onclick: () => answer(j) }, c));
    const fb = h("div", { "aria-live": "polite" });
    function answer(j) {
      btns.forEach((b, k) => { b.disabled = true; b.classList.toggle("correct", k === it.answer); b.classList.toggle("wrong", k === j && k !== it.answer); });
      if (j === it.answer) score++;
      const wn = j === it.answer ? null : whyNotOf(it, j);
      fb.append(...[wn ? h("p", { class: "small whynot" }, richInline(wn)) : null, h("p", { class: "small" }, rich(it.why))].filter(Boolean), h("button", { class: "btn primary", type: "button", onclick: () => { i++; next(); } }, i + 1 < items.length ? labels.next : labels.finish));
    }
    body.append(h("div", { class: "qf-count" }, `${i + 1} / ${items.length}`), h("p", { class: "qf-q" }, richInline(it.q)), h("div", { class: "choices grid2" }, btns), fb);
  }
  next();
  return root;
}

// ---------- derivation as tap-the-next-step ----------
/** steps: [{prompt, options:[...], answer, then}] — pick the right move to reveal `then` and unlock the next step. */
export function choiceSteps(steps, { tryAgain, onDone, preview = PREVIEW }) {
  const list = h("ol", { class: "steps" });
  let i = 0;
  function add() {
    const st = steps[i];
    const done = h("div", { hidden: !preview }, rich(st.then));
    const note = h("p", { class: "small muted", "aria-live": "polite" });
    const opts = preview ? null : h("div", { class: "mini-choices" }, st.options.map((o, j) => h("button", {
      class: "choice", type: "button",
      onclick: (e) => {
        if (j === st.answer) {
          e.currentTarget.classList.add("correct"); opts.querySelectorAll("button").forEach((b) => (b.disabled = true));
          note.textContent = ""; done.hidden = false; i++;
          if (i < steps.length) add(); else onDone?.(list);
        } else { e.currentTarget.classList.add("wrong"); note.textContent = tryAgain; }
      },
    }, o)));
    list.append(h("li", {}, h("div", { class: "step-q" }, rich(st.prompt)), opts, note, done));
    if (preview && ++i < steps.length) add();
  }
  add();
  return list;
}

// ---------- tap-to-sort cards ----------
/** cards: [{label, tagline, svg, yes:boolean, why}] — tap each card to reveal whether it belongs. */
export function sortCards(cards, { yes, no, onAll }) {
  let seen = 0;
  const why = h("p", { class: "small", "aria-live": "polite" });
  const grid = h("div", { class: "cards" }, cards.map((c) => {
    const btn = h("button", { class: "card", type: "button" }, c.svg, h("span", {}, c.label), h("span", { class: "tagline" }, c.tagline));
    btn.addEventListener("click", () => {
      if (!btn.dataset.done) { btn.dataset.done = "1"; seen++; }
      btn.classList.add(c.yes ? "yes" : "no", "flip");
      btn.querySelector(".tagline").textContent = c.yes ? yes : no;
      why.replaceChildren(rich(`**${c.label}:** ${c.why}`));
      if (seen === cards.length) onAll?.(grid);
    });
    return btn;
  }));
  return h("div", {}, grid, why);
}

// ---------- comic strip ----------
/** frames: [{cap, text, fx, wide}] */
export function comic(frames) {
  return h("div", { class: "strip" }, frames.map((f) => h("div", { class: `frame${f.wide ? " wide" : ""}` },
    f.cap ? h("span", { class: "cap" }, f.cap) : null, rich(f.text), f.fx ? h("span", { class: "fx", "aria-hidden": "true" }, f.fx) : null)));
}

// ---------- teaching blocks (teach first; olympiad-level material goes in the bonus at the end) ----------

/** "In this chapter you'll learn…" list, from the syllabus objectives. */
export function goals(title, items) {
  return h("div", { class: "goals" }, h("div", { class: "goals-title" }, title), h("ul", {}, items.map((it) => h("li", {}, rich(it)))));
}

/** One-question check with instant feedback (no lock step). onRight fires the first time it's answered correctly. */
export function quickCheck({ q, choices, answer, why, whyNot, labels, onRight }) {
  let done = false;
  const fb = h("div", { "aria-live": "polite" });
  const btns = choices.map((c, i) => h("button", { class: "choice", type: "button" }, c));
  btns.forEach((b, i) => b.addEventListener("click", () => {
    if (done) return;
    const ok = i === answer;
    b.classList.add(ok ? "correct" : "wrong");
    const wn = ok ? null : whyNotOf({ whyNot }, i);
    fb.replaceChildren(h("p", { class: "small" }, h("strong", {}, ok ? labels.right : labels.wrong), " ", ...(ok ? [rich(why)] : wn ? [richInline(wn)] : [])));
    if (ok) { done = true; btns.forEach((x) => (x.disabled = true)); onRight?.(b); }
  }));
  if (PREVIEW) { btns[answer].classList.add("correct"); fb.append(rich(why)); }
  return h("div", { class: "check" }, h("div", { class: "check-q" }, h("span", { class: "check-tag" }, labels.tag), " ", rich(q)), h("div", { class: "choices grid2" }, btns), fb,
    whyNotList({ choices, answer, whyNot }, labels));
}

/** Worked example: the problem, then one step at a time. */
export function worked({ title, problem, steps, answer, labels }) {
  const list = h("ol", { class: "steps" });
  const ans = h("div", { class: "worked-answer", hidden: !PREVIEW }, rich(answer));
  let i = 0;
  const btn = h("button", { class: "btn", type: "button" }, labels.next);
  const show = () => {
    if (i < steps.length) list.append(h("li", {}, rich(steps[i++])));
    if (i >= steps.length) { btn.remove(); ans.hidden = false; }
  };
  btn.addEventListener("click", show);
  if (PREVIEW) while (i < steps.length) show();
  return h("div", { class: "worked" }, h("h3", {}, title), h("div", { class: "worked-problem" }, rich(problem)), list, h("div", { class: "btn-row" }, btn), ans);
}

/** Stable shuffle of a question's options (seeded by its text), so the right answer isn't always in the same place. */
export function shuffleItem(it) {
  let seed = 0;
  for (const ch of String(it.q)) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const order = it.choices.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return { ...it, choices: order.map((i) => it.choices[i]), answer: order.indexOf(it.answer),
    ...(Array.isArray(it.whyNot) ? { whyNot: order.map((i) => it.whyNot[i] ?? null) } : {}) };
}

/** Practice set: exam-level questions, each with a hint and a full solution after answering. Options are shuffled. */
export function practice({ items, labels, onDone }) {
  let answered = 0, right = 0;
  items = items.map(shuffleItem);
  const score = h("p", { class: "verdict", "aria-live": "polite" });
  const list = h("ol", { class: "practice" }, items.map((it, n) => {
    const sol = h("div", { class: "reveal", hidden: !PREVIEW }, h("strong", {}, labels.solution), " ", rich(it.solution));
    const slip = h("p", { class: "small whynot", hidden: true });
    const hint = h("p", { class: "small muted", hidden: true }, rich(it.hint));
    let locked = false;
    const btns = it.choices.map((c, i) => h("button", { class: "choice", type: "button" }, c));
    btns.forEach((b, i) => b.addEventListener("click", () => {
      if (locked) return;
      locked = true; answered++;
      if (i === it.answer) right++;
      btns.forEach((x, j) => { x.disabled = true; x.classList.toggle("correct", j === it.answer); x.classList.toggle("wrong", j === i && i !== it.answer); });
      const wn = i === it.answer ? null : whyNotOf(it, i);
      if (wn) { slip.replaceChildren(richInline(wn)); slip.hidden = false; }
      sol.hidden = false;
      if (answered === items.length) {
        const msg = right === items.length && labels.perfect ? labels.perfect : labels.score;
        score.textContent = msg.replace("{right}", right).replace("{n}", items.length);
        onDone?.(right, score);
      }
    }));
    if (PREVIEW) btns[it.answer].classList.add("correct");
    const hintBtn = h("button", { class: "pill", type: "button" }, labels.hint);
    hintBtn.addEventListener("click", () => { hint.hidden = false; hintBtn.remove(); });
    return h("li", {}, h("div", { class: "step-q" }, rich(it.q)), h("div", { class: "choices grid2" }, btns), h("div", { class: "toggle-row" }, hintBtn), hint, slip, sol, whyNotList(it, labels));
  }));
  return h("div", {}, list, score);
}

/** "What to remember for the test" card. */
export function summary(items) {
  return h("ul", { class: "summary" }, items.map((it) => h("li", {}, rich(it))));
}

/** Divider that opens the bonus part of a chapter. */
export function bonusDivider(title, note) {
  return h("div", { class: "bonus-divider rise" }, h("span", { class: "bonus-badge" }, title), h("p", { class: "small muted" }, note));
}

/** Simple show/hide toggle. */
export function toggle(label, content, open = PREVIEW) {
  const body = h("div", { hidden: !open, class: "reveal" }, content);
  const btn = h("button", { class: "btn", type: "button", "aria-expanded": String(open) }, label);
  btn.addEventListener("click", () => { body.hidden = !body.hidden; btn.setAttribute("aria-expanded", String(!body.hidden)); });
  return h("div", {}, h("div", { class: "btn-row" }, btn), body);
}

// ---------- shared chapter pieces ----------
export function chapterHead(ctx, { art, alt, sfx, caption, intro, slots }) {
  const box = h("div", { class: "art" },
    sfx ? h("div", { class: "sfx", "aria-hidden": "true" }, sfx) : null,
    caption ? h("div", { class: "caption-box" }, caption) : null);
  const fallback = () => { box.classList.add("fallback"); box.querySelector("img")?.remove(); };
  if (art) {
    const img = h("img", { src: art, alt: alt || "", decoding: "async" });
    img.addEventListener("error", fallback);
    box.prepend(img);
  } else fallback();
  const strip = h("div", { class: "progress-strip", role: "img", "aria-label": "crystals" }, Array.from({ length: slots }, () => h("span")));
  return h("section", { class: "panel chapter-head" }, box,
    h("div", { class: "head-text" },
      h("span", { class: "chip" }, `${ctx.regionName} · ${ctx.app(`chapters.${ctx.chapter.id}.tag`)}`),
      h("h1", {}, ctx.title), rich(intro), strip),
    art ? h("p", { class: "placeholder-note" }, ctx.app("app.placeholder_art")) : null);
}

export function simCard(c, url) {
  return [
    h("h2", {}, c.title), rich(c.body),
    h("div", { class: "sim-card" }, h("a", { class: "btn primary", href: url, target: "_blank", rel: "noopener noreferrer" }, c.open, " ↗")),
    h("p", { class: "attribution" }, c.attribution),
  ];
}

export function chapterNav(ctx) {
  const backHref = `#/r/${ctx.region.id}`;
  return h("nav", { class: "next-nav" },
    h("a", { class: ctx.nextHref === backHref ? "btn primary" : "btn", href: backHref }, ctx.app("app.back_region", { region: ctx.regionName })),
    ctx.nextHref !== backHref ? h("a", { class: "btn primary", href: ctx.nextHref }, ctx.nextLabel) : null);
}

/** Light up the head's progress strip from the chapter's crystal set. */
export function syncStrip(root, got) {
  const spans = root.querySelectorAll(".progress-strip span");
  spans.forEach((s, i) => s.classList.toggle("got", i < got));
}
