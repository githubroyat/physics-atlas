// "Predict first": she must commit to an answer before anything is revealed.
import { h, rich } from "../dom.js";
import { store } from "../store.js";

/**
 * @param {object} o
 * @param {string} o.id         storage key for this prediction
 * @param {string} o.question   rich text
 * @param {string[]} o.choices
 * @param {number} o.answer     index of the correct choice
 * @param {object} o.text       { lock, verdicts: one line per choice, explain }
 * @param {() => void} o.onDone called once an answer is locked in (also on revisit)
 * @param {boolean} [o.preview] show the answer and explanation without answering (nothing is saved)
 */
export function predict({ id, question, choices, answer, text, onDone, preview = false }) {
  const saved = preview ? { choice: answer } : store.get(`predict:${id}`, null);
  let picked = saved?.choice ?? null;

  const buttons = choices.map((label, i) =>
    h("button", { class: "choice", type: "button", "aria-pressed": "false", onclick: () => choose(i) }, label));
  const lock = h("button", { class: "btn primary", type: "button", disabled: true, onclick: commit }, text.lock);
  const reveal = h("div", { class: "reveal", hidden: true, "aria-live": "polite" });
  const root = h("div", {}, rich(question), h("div", { class: "choices", role: "group" }, buttons), h("div", { class: "btn-row" }, lock), reveal);

  function choose(i) {
    if (reveal.hidden === false) return;
    picked = i;
    buttons.forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
    lock.disabled = false;
  }

  function commit() {
    if (picked == null) return;
    store.set(`predict:${id}`, { choice: picked });
    showResult();
    onDone?.();
  }

  function showResult() {
    buttons.forEach((b, j) => {
      b.disabled = true;
      b.classList.toggle("correct", j === answer);
      b.classList.toggle("wrong", j === picked && j !== answer);
    });
    lock.hidden = true;
    reveal.hidden = false;
    reveal.append(h("p", { class: "verdict" }, preview ? text.previewVerdict : text.verdicts[picked]), rich(text.explain));
  }

  if (picked != null) {
    buttons.forEach((b, j) => b.setAttribute("aria-pressed", String(picked === j)));
    showResult();
    queueMicrotask(() => onDone?.());
  }
  return root;
}
