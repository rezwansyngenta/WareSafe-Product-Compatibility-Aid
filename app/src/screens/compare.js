/* ============================================================
   WareSafe — Compare screen
   Answers: can Product A and Product B be kept together?
   ============================================================ */

import { t } from "../i18n.js";
import {
  el,
  iconEl,
  pictogramEl,
  openSheet,
  closeSheet,
  rerender,
  haptic,
} from "../ui.js";
import {
  largeTitle,
  matrixLegend,
  matrixReferenceCard,
  productPicker,
  topBar,
  verdictCard,
  conditionsPanel,
  whyPanel,
} from "../widgets.js";
import { getMatrix, getMatrixIndex, getProduct } from "../store.js";
import { evaluatePair } from "../matrix.js";

export function render(container, route) {
  container.appendChild(
    topBar({
      onLang: () => rerender(),
    }),
  );

  container.appendChild(largeTitle("compare", "compareGuidance"));

  const productA = route.a ? getProduct(route.a) : null;
  const productB = route.b ? getProduct(route.b) : null;

  container.appendChild(slots(productA, productB));

  if (productA && productB) {
    container.appendChild(result(productA, productB));
  } else {
    /* Before a pair is chosen, show the vocabulary the result will
       use, so the symbols are already understood. */
    const legendBlock = el("div", "store__block");
    legendBlock.appendChild(el("h2", "store__block-title", t("matrixLegend")));
    legendBlock.appendChild(matrixLegend());
    container.appendChild(legendBlock);

    const reference = matrixReferenceCard(getMatrix());
    if (reference) {
      const block = el("div", "store__block");
      block.appendChild(reference);
      container.appendChild(block);
    }
  }
}

function slots(productA, productB) {
  const wrap = el("div", "compare__slots");

  wrap.appendChild(slot(productA, "a"));
  wrap.appendChild(slot(productB, "b"));

  const swap = el("button", "slot__swap");
  swap.type = "button";
  swap.setAttribute("aria-label", t("swapProducts"));
  swap.appendChild(iconEl("swap"));
  swap.addEventListener("click", () => {
    haptic("tap");
    const current = parseIds();
    if (!current.a || !current.b) return;
    window.location.hash = `#/compare/${current.b}/${current.a}`;
  });
  wrap.appendChild(swap);

  return wrap;
}

function slot(product, which) {
  if (!product) {
    const button = el("button", "slot slot--empty");
    button.type = "button";
    button.appendChild(el("div", "slot__label", which === "a" ? "A" : "B"));
    button.appendChild(iconEl("plus"));
    button.appendChild(el("div", "t-subheadline", t("selectProduct")));
    button.addEventListener("click", () => openPicker(which));
    return button;
  }

  const wrap = el("div", "slot");

  const main = el("button", "slot__main");
  main.type = "button";
  main.appendChild(el("div", "slot__label", which === "a" ? "A" : "B"));
  main.appendChild(el("div", "slot__name", product.name));

  /* The pictograms are the fastest way to confirm the right product
     was picked, so they sit in the slot itself. */
  if (product.pictograms && product.pictograms.length) {
    const pics = el("div", "slot__pictograms");
    for (const code of product.pictograms) {
      pics.appendChild(pictogramEl(code, "sm"));
    }
    main.appendChild(pics);
  }

  main.addEventListener("click", () => openPicker(which));
  wrap.appendChild(main);

  const clearButton = el("button", "slot__clear");
  clearButton.type = "button";
  clearButton.setAttribute("aria-label", t("clear"));
  clearButton.appendChild(iconEl("close"));
  clearButton.addEventListener("click", (event) => {
    event.stopPropagation();
    haptic("tap");
    const current = parseIds();
    if (which === "a") window.location.hash = `#/compare/${current.b}`;
    else window.location.hash = `#/compare/${current.a}`;
  });
  wrap.appendChild(clearButton);

  return wrap;
}

function openPicker(which) {
  const current = parseIds();
  const content = productPicker({
    onSelect: (product) => {
      closeSheet();
      haptic("select");
      if (which === "a") {
        window.location.hash = `#/compare/${product.id}/${current.b || ""}`;
      } else {
        window.location.hash = `#/compare/${current.a || ""}/${product.id}`;
      }
    },
    excludeId: which === "a" ? current.b : current.a,
  });
  openSheet(t("compare"), content);
}

function parseIds() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const parts = raw.split("/").filter(Boolean);
  return { a: parts[1] || "", b: parts[2] || "" };
}

function result(productA, productB) {
  const wrap = el("div");

  const evaluation = evaluatePair(productA, productB, getMatrixIndex());
  wrap.appendChild(verdictCard(evaluation));

  const conditions = conditionsPanel(evaluation, getMatrixIndex());
  if (conditions) wrap.appendChild(conditions);

  wrap.appendChild(whyPanel(evaluation));

  return wrap;
}
