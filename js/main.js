import { h, s, clear } from "./dom.js";
import { i18n, pick } from "./i18n.js";
import { TRACKS, findRegion, findChapter, trackOf } from "./atlas.js";
import { isVisited, markVisited, PREVIEW } from "./store.js";
import { refreshCrystals, observeRise, setUi } from "./engine.js";
// Testing only: ?draft opens a chapter by direct link before it is marked ready (it stays off her map).
const DRAFT = new URLSearchParams(location.search).has("draft");

// Parent preview: open the app with ?preview (e.g. /?preview#/c/o1) to see every gate, step and answer
// already unlocked, plus the saved S5 chapters. Nothing is saved in this mode.
const view = document.getElementById("view");
const crumbs = document.getElementById("crumbs");
let atlas; // content/<lang>/atlas.json
const t = (key, vars) => i18n.fill(pick(atlas, key), vars);

// ---------- routing: #/  #/r/<region>  #/c/<chapter>  #/saved ----------
let routeSeq = 0;   // each navigation gets a number; a slow render that finishes after a newer navigation is dropped
async function route() {
  const seq = ++routeSeq;
  const [, kind, id] = (location.hash.replace(/^#/, "") || "/").split("/");
  clear(view);
  view.className = "";
  try {
    atlas ??= await i18n.load("atlas");
    if (seq !== routeSeq) return;
    setUi({ yes: t("app.yes"), nope: t("app.nope"), whynot: t("app.whynot") });
    document.title = t("app.name");
    for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
    if (!kind) renderMap();
    else if (kind === "saved") renderSaved();
    else if (kind === "r" && findRegion(id)) renderRegion(findRegion(id));
    else if (kind === "c" && (findChapter(id)?.chapter.ready || (DRAFT && findChapter(id)))) { if (!(await renderChapter(findChapter(id), seq))) return; }
    else if (kind === "c" && findChapter(id)) renderSoon(findChapter(id));
    else { setCrumbs([]); view.append(h("p", { class: "panel" }, t("app.not_found"))); }
  } catch (err) {
    console.error(err);
    view.append(h("p", { class: "panel" }, atlas ? t("app.load_error") : "Something went wrong loading the app."));
  }
  if (PREVIEW) view.prepend(h("p", { class: "preview-banner" }, t("app.preview_banner")));
  refreshCrystals();
  observeRise(view);
  window.scrollTo(0, 0);
  view.focus({ preventScroll: true });
}

function setCrumbs(items) {
  clear(crumbs);
  items.forEach(([label, href], i) => {
    if (i) crumbs.append(h("span", { class: "sep", "aria-hidden": "true" }, "›"));
    crumbs.append(href ? h("a", { href }, label) : h("span", { "aria-current": "page" }, label));
  });
}

// ---------- map ----------
const ISLANDS = {
  waves: { cx: 200, cy: 150, r: 96, fill: "#2ef2ff", glow: "#2ef2ff" },
  motion: { cx: 312, cy: 352, r: 70, fill: "#ffb02e", glow: "#ff4f6d" },
  fields: { cx: 92, cy: 372, r: 72, fill: "#a77bff", glow: "#b6ff3b" },
};

function blobPath(cx, cy, r, seed) {
  const n = 10, pts = [];
  let x = seed * 9301 + 49297;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.8 + rnd() * 0.32);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.78]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1.map((v) => v.toFixed(1))} ${c2.map((v) => v.toFixed(1))} ${p2.map((v) => v.toFixed(1))}`;
  }
  return d + "Z";
}

function icon(kind, cx, cy, scale = 1) {
  const g = s("g", { class: "icon", transform: `translate(${cx} ${cy - 10}) scale(${scale})` });
  if (kind === "wave") g.append(s("path", { d: "M-40 0c10-22 20-22 30 0s20 22 30 0 20-22 30 0" }), s("path", { d: "M-34 18h68", "stroke-dasharray": "4 6" }));
  if (kind === "arc") g.append(s("path", { d: "M-34 22C-20-30 20-30 34 22", "stroke-dasharray": "5 6" }), s("circle", { cx: 14, cy: -10, r: 6, fill: "currentColor" }));
  if (kind === "field") g.append(s("path", { d: "M4-26-10 2h12L-4 26 14-6H2z", fill: "currentColor" }), s("path", { d: "M-30-12c-6 10-6 18 0 28M30-12c6 10 6 18 0 28" }));
  if (kind === "mountain") g.append(s("path", { d: "M-30 18 -10 -16 0 -2 10 -22 32 18Z" }));
  if (kind === "flake") for (let a = 0; a < 180; a += 60) g.append(s("path", { d: "M0 -22V22", transform: `rotate(${a})` }));
  if (kind === "burst") g.append(s("path", { d: "M0 -24 6 -8 22 -14 12 0 24 10 6 8 4 24 -4 10 -20 18 -10 2 -24 -8 -6 -8Z" }));
  if (kind === "atom") for (let a = 0; a < 180; a += 60) g.append(s("ellipse", { rx: 26, ry: 9, transform: `rotate(${a})` }));
  return g;
}

function regionCard(r) {
  const n = r.chapters.length;
  const done = r.chapters.filter((c) => isVisited(c.id)).length;
  return h("a", { class: `panel rise region-card r-${r.id}`, href: `#/r/${r.id}` },
    h("h2", {}, t(`regions.${r.id}.name`)),
    h("div", { class: "count" }, `${t(`regions.${r.id}.topic`)} · ${t("app.chapters", { n })}`),
    h("p", { class: "small muted", style: "margin:8px 0 0" }, t(`regions.${r.id}.blurb`)),
    h("div", { class: "bar", role: "img", "aria-label": t("app.explored", { done, n }) }, h("span", { style: `width:${(done / n) * 100}%` })));
}

function renderMap() {
  setCrumbs([[t("app.map")]]);
  const regions = TRACKS.s6;
  const svg = s("svg", { class: "map-svg", viewBox: "0 0 400 470", role: "group", "aria-label": t("app.map") });
  const defs = s("defs", {},
    s("linearGradient", { id: "flow", x1: 0, y1: 0, x2: 1, y2: 1 },
      s("stop", { offset: "0", "stop-color": "#2ef2ff" }), s("stop", { offset: ".5", "stop-color": "#ff4fd8" }), s("stop", { offset: "1", "stop-color": "#ffe14d" })));
  const grid = s("g", { class: "grid" });
  for (let x = 20; x < 400; x += 40) grid.append(s("path", { d: `M${x} 6V464` }));
  for (let y = 20; y < 470; y += 40) grid.append(s("path", { d: `M6 ${y}H394` }));
  svg.append(defs,
    s("rect", { class: "sea", x: 4, y: 4, width: 392, height: 462, rx: 26 }), grid,
    s("path", { class: "current", d: "M200 150 C330 170 360 260 312 352 C250 440 150 450 92 372 C40 300 90 170 200 150" }));
  regions.forEach((r, i) => {
    const is = ISLANDS[r.id];
    const go = () => (location.hash = `#/r/${r.id}`);
    const g = s("g", { class: "island", tabindex: "0", role: "link", "aria-label": `${t(`regions.${r.id}.name`)}: ${t(`regions.${r.id}.topic`)}` });
    g.addEventListener("click", go);
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    const path = blobPath(is.cx, is.cy, is.r, i + 5);
    g.append(s("g", { class: "bob" },
      s("path", { class: "glow", d: path, fill: is.glow }),
      s("path", { class: "land", d: path, fill: is.fill }),
      icon(r.icon, is.cx, is.cy, is.r > 80 ? 1.3 : 1)),
      s("text", { class: "label", x: is.cx, y: is.cy + is.r * 0.78 + 28, "text-anchor": "middle" }, t(`regions.${r.id}.name`)),
      s("text", { class: "sub", x: is.cx, y: is.cy + is.r * 0.78 + 46, "text-anchor": "middle" }, t(`regions.${r.id}.topic`)));
    svg.append(g);
  });

  view.append(
    h("section", { class: "map-intro" }, h("h1", {}, t("app.name")), h("p", { class: "muted" }, t("app.tagline"))),
    h("div", { class: "panel map-wrap" }, svg),
    h("div", { class: "region-list" }, regions.map(regionCard)),
    h("a", { class: "saved-link", href: "#/saved" }, t("app.saved_track")),
  );
}

function renderSaved() {
  setCrumbs([[t("app.map"), "#/"], [t("app.saved_title")]]);
  view.append(h("section", { class: "map-intro" }, h("h1", {}, t("app.saved_title")), h("p", { class: "muted" }, t("app.saved_intro"))),
    h("div", { class: "region-list" }, TRACKS.s5.map(regionCard)));
}

// ---------- region ----------
function renderRegion(r) {
  const name = t(`regions.${r.id}.name`);
  view.className = `r-${r.id}`;
  setCrumbs(trackOf(r.id) === "s5" ? [[t("app.map"), "#/"], [t("app.saved_title"), "#/saved"], [name]] : [[t("app.map"), "#/"], [name]]);
  const hero = h("section", { class: "panel region-hero" });
  if (r.art) hero.append(h("div", { class: "art" }, h("img", { src: r.art, alt: "", loading: "lazy", decoding: "async" })));
  hero.append(h("div", { class: "hero-text" },
    h("span", { class: "chip" }, t(`regions.${r.id}.topic`)),
    h("h1", {}, name),
    h("p", { class: "muted", style: "margin:0" }, t(`regions.${r.id}.blurb`))));
  const list = h("ol", { class: "chapter-list" }, r.chapters.map((c, i) => {
    const inner = [
      h("span", { class: "num" }, String(i + 1)),
      h("span", {}, h("div", { class: "ttl" }, t(`chapters.${c.id}.title`)), h("div", { class: "tag" }, c.ready ? t(`chapters.${c.id}.tag`) : `${t(`chapters.${c.id}.tag`)} · ${t("app.soon")}`)),
      c.ready && isVisited(c.id) ? h("span", { class: "done-mark", "aria-label": "visited" }, "✓") : null,
    ];
    return h("li", { class: "chapter-item rise" }, c.ready ? h("a", { href: `#/c/${c.id}` }, inner) : h("div", { class: "soon" }, inner));
  }));
  view.append(hero, list);
}

function renderSoon({ region, chapter }) {
  const regionName = t(`regions.${region.id}.name`);
  const title = t(`chapters.${chapter.id}.title`);
  view.className = `r-${region.id}`;
  setCrumbs([[t("app.map"), "#/"], [regionName, `#/r/${region.id}`], [title]]);
  view.append(h("section", { class: "panel" },
    h("span", { class: "chip" }, t(`chapters.${chapter.id}.tag`)),
    h("h1", {}, title),
    h("p", { class: "muted" }, t("app.soon")),
    h("a", { class: "btn primary", href: `#/r/${region.id}` }, t("app.back_region", { region: regionName }))));
}

// ---------- chapter ----------
async function renderChapter({ region, chapter, index }, seq) {
  const [mod, content] = await Promise.all([import(`./chapters/${chapter.id}.js`), i18n.load(`chapters/${chapter.id}`)]);
  if (seq !== routeSeq) return false;   // she has already moved on: don't stack this chapter under the new page
  const regionName = t(`regions.${region.id}.name`);
  const title = t(`chapters.${chapter.id}.title`);
  view.className = `r-${region.id}`;
  setCrumbs([[t("app.map"), "#/"], [regionName, `#/r/${region.id}`], [title]]);
  document.title = `${title} · ${t("app.name")}`;
  const next = region.chapters.slice(index + 1).find((c) => c.ready);
  mod.render(view, {
    content,
    preview: PREVIEW,
    region, chapter, title, regionName,
    t: (key, vars) => i18n.fill(pick(content, key), vars),
    app: t,
    nextHref: next ? `#/c/${next.id}` : `#/r/${region.id}`,
    nextLabel: next ? t("app.next", { title: t(`chapters.${next.id}.title`) }) : t("app.back_region", { region: regionName }),
  });
  markVisited(chapter.id);
  return true;
}

window.addEventListener("hashchange", route);
route();
