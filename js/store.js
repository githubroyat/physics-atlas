// Per-device conveniences only (progress, predictions, crystals). Wrapped so private mode or blocked storage never breaks the app.
const PREFIX = "energy-atlas:";
export const PREVIEW = new URLSearchParams(location.search).has("preview");
// Her version is free-roam: no "predict first" gate, every section open from the start, answers still hidden
// until she tries. Add ?gate to the address to bring the gate back.
export const GATED = new URLSearchParams(location.search).has("gate");

export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    if (PREVIEW) return; // preview mode never saves, so her first run stays fresh
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* storage unavailable: progress just isn't remembered */
    }
  },
};

export function markVisited(chapterId) {
  const v = store.get("visited", {});
  v[chapterId] = true;
  store.set("visited", v);
}
export const isVisited = (chapterId) => !!store.get("visited", {})[chapterId];

/** Crystals: one per interaction completed, per chapter. Returns true if newly earned. */
export function earn(chapterId, key) {
  const all = store.get("crystals", {});
  const got = new Set(all[chapterId] || []);
  if (got.has(key)) return false;
  got.add(key);
  all[chapterId] = [...got];
  store.set("crystals", all);
  return true;
}
export const crystalsIn = (chapterId) => new Set(store.get("crystals", {})[chapterId] || []);
export const crystalTotal = () => Object.values(store.get("crystals", {})).reduce((n, a) => n + a.length, 0);
