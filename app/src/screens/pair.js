/* ============================================================
   WareSafe — Pair screen
   Answers: why is this particular pairing permitted, conditional
   or forbidden?

   Reached by tapping a partner product in the Store list. It always
   shows both product names and both pictogram sets at the top, so
   the assistant never loses the product they started from.
   ============================================================ */

import { t } from "../i18n.js";
import { el, pictogramEl, rerender } from "../ui.js";
import {
  topBar,
  verdictCard,
  conditionsPanel,
  whyPanel,
  matrixReferenceCard,
} from "../widgets.js";
import { getProduct, getMatrixIndex, getMatrix } from "../store.js";
import { evaluatePair } from "../matrix.js";

export function render(container, route) {
  const productA = route.a ? getProduct(route.a) : null;
  const productB = route.b ? getProduct(route.b) : null;

  container.appendChild(
    topBar({
      back: true,
      onBack: back,
      onLang: () => rerender(),
    }),
  );

  if (!productA || !productB) {
    container.appendChild(el("div", "card", t("productNotFound")));
    return;
  }

  container.appendChild(pairHeader(productA, productB));

  const evaluation = evaluatePair(productA, productB, getMatrixIndex());
  container.appendChild(verdictCard(evaluation));

  const conditions = conditionsPanel(evaluation, getMatrixIndex());
  if (conditions) container.appendChild(conditions);

  container.appendChild(whyPanel(evaluation));

  const reference = matrixReferenceCard(getMatrix());
  if (reference) {
    const block = el("div", "store__block");
    block.appendChild(reference);
    container.appendChild(block);
  }
}

/**
 * The two products side by side, with their pictograms. This is the
 * anchor that says "you are still looking at Cruiser + Abamectin",
 * not at Abamectin on its own.
 */
function pairHeader(productA, productB) {
  const wrap = el("div", "pair-header");
  wrap.appendChild(el("div", "pair-header__caption", t("pairComparison")));

  const row = el("div", "pair-header__row");
  row.appendChild(pairProduct(productA));
  row.appendChild(el("div", "pair-header__plus", "+"));
  row.appendChild(pairProduct(productB));
  wrap.appendChild(row);

  return wrap;
}

function pairProduct(product) {
  const block = el("div", "pair-header__product");
  block.appendChild(el("div", "pair-header__name", product.name));

  if (product.pictograms && product.pictograms.length) {
    const pics = el("div", "pair-header__pics");
    for (const code of product.pictograms) {
      pics.appendChild(pictogramEl(code, "sm"));
    }
    block.appendChild(pics);
  }

  return block;
}

function back() {
  if (window.history.length > 1) window.history.back();
  else window.location.hash = "#/store";
}
