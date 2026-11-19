// Tiny DOM helpers. All text goes through text nodes (no innerHTML), so content can never inject markup.

export function h(tag, attrs = {}, ...children) {
  const el = tag === "svg" || attrs.svg ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false || k === "svg") continue;
    if (k === "class") el.setAttribute("class", v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  append(el, children);
  return el;
}

export function s(tag, attrs = {}, ...children) {
  return h(tag, { ...attrs, svg: true }, ...children);
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    if (c instanceof Node) el.append(c);
    else el.append(...textNodes(el, String(c)));
  }
}

const SVG_NS = "http://www.w3.org/2000/svg";
const SUB = /_\{([^}]+)\}/g;
/** Text with subscripts: "F_{G}" → F<sub>G</sub> (in SVG: a lowered, smaller tspan). Plain text otherwise. */
function textNodes(parent, str) {
  if (!str.includes("_{")) return [document.createTextNode(str)];
  const svg = parent.namespaceURI === SVG_NS;
  const out = [];
  let last = 0;
  for (const m of str.matchAll(SUB)) {
    if (m.index > last) out.push(document.createTextNode(str.slice(last, m.index)));
    out.push(svg ? s("tspan", { "baseline-shift": "sub", "font-size": "70%" }, m[1]) : h("sub", {}, m[1]));
    last = m.index + m[0].length;
  }
  if (last < str.length) out.push(document.createTextNode(str.slice(last)));
  // HTML: keep text + subscripts as ONE inline piece, so a flex parent (e.g. a slider label) doesn't split them apart
  return svg ? out : [h("span", {}, out)];
}

/**
 * Minimal, safe rich text: paragraphs split on blank lines; **bold**, *italic*, x_{sub} subscripts
 * (subscripts work in any text passed to h()/s(), but not in textContent assignments);
 * a line starting with "$ " becomes a centred formula block. Returns a DocumentFragment.
 */
export function rich(text) {
  const frag = document.createDocumentFragment();
  for (const block of String(text).split(/\n\s*\n/)) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("$ ")) {
      // one box; several "$ " lines in the same block become separate lines (the box keeps newlines)
      const lines = trimmed.split(/\r?\n/).map((l) => l.trim().replace(/^\$ /, ""));
      frag.append(h("div", { class: "formula" }, lines.join("\n")));
      continue;
    }
    const p = document.createElement("p");
    inline(p, trimmed);
    frag.append(p);
  }
  return frag;
}

function inline(parent, text) {
  // **bold** may contain *italic* parts (e.g. "**Recap from *Spark*:**", "**…*Title***"); both are rendered recursively
  const re = /(\*\*(?:[^*]|\*[^*]+\*)+\*\*|\*[^*]+\*|\n)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) parent.append(...textNodes(parent, text.slice(last, m.index)));
    const tok = m[0];
    if (tok === "\n") parent.append(document.createElement("br"));
    else {
      const el = h(tok.startsWith("**") ? "strong" : "em");
      inline(el, tok.startsWith("**") ? tok.slice(2, -2) : tok.slice(1, -1));
      parent.append(el);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parent.append(...textNodes(parent, text.slice(last)));
}

/** One line of rich text (**bold**, *italic*, x_{sub}) inside a <span>, for places that hold a line, not paragraphs. */
export function richInline(text) {
  const span = h("span");
  inline(span, String(text ?? ""));
  return span;
}

export function clear(el) {
  while (el.firstChild) el.firstChild.remove();
}
