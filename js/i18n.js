// Language files live in content/<lang>/. Code never contains user-facing text.
import { store } from "./store.js";

let lang = store.get("lang", "en");
const bundles = new Map();

async function load(path) {
  if (!bundles.has(path)) {
    bundles.set(path, fetch(`content/${lang}/${path}.json`).then((r) => {
      if (!r.ok) throw new Error(`Missing content: ${lang}/${path}`);
      return r.json();
    }));
  }
  return bundles.get(path);
}

export const i18n = {
  get lang() { return lang; },
  load,
  /** Fill {placeholders} from vars. Unknown placeholders are left visible so they get noticed. */
  fill(str, vars = {}) {
    return String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  },
};

/** Look up a dotted key in a loaded bundle object. */
export function pick(obj, key) {
  return key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj) ?? `⟨${key}⟩`;
}
