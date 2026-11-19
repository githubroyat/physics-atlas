// Step-by-step reveal: each step's prompt appears, she thinks, then reveals; the next prompt follows.
import { h, rich } from "../dom.js";

/** @param {{prompt: string, answer: string}[]} steps  @param {boolean} openAll show every step at once (preview mode) */
export function revealSteps(steps, revealLabel, openAll = false) {
  const list = h("ol", { class: "steps" });
  if (openAll) {
    for (const st of steps) list.append(h("li", {}, rich(st.prompt), rich(st.answer)));
    return list;
  }
  let i = 0;
  function addStep() {
    const step = steps[i];
    const answer = h("div", { hidden: true }, rich(step.answer));
    const btn = h("button", { class: "btn", type: "button" }, revealLabel);
    btn.addEventListener("click", () => {
      answer.hidden = false;
      btn.remove();
      i += 1;
      if (i < steps.length) addStep();
    });
    list.append(h("li", {}, rich(step.prompt), answer, btn));
  }
  addStep();
  return list;
}

/** Simple hint/answer toggles. */
export function toggle(label, content, open = false) {
  const body = h("div", { hidden: !open, class: "reveal" }, content);
  const btn = h("button", { class: "btn", type: "button", "aria-expanded": String(open) }, label);
  btn.addEventListener("click", () => {
    body.hidden = !body.hidden;
    btn.setAttribute("aria-expanded", String(!body.hidden));
  });
  return h("div", {}, h("div", { class: "btn-row" }, btn), body);
}
