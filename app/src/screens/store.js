/* ============================================================
   WareSafe — Store screen
   Answers: what should I consider before storing this product,
   and which other products may or may not sit beside it?
   ============================================================ */

import { t } from "../i18n.js";
import {
  el,
  iconEl,
  listGroup,
  infoRow,
  pictogramEl,
  rerender,
  bulletList,
  numberedList,
  splitLines,
  splitSteps,
} from "../ui.js";
import {
  largeTitle,
  pStatementList,
  productHero,
  productPicker,
  reviewNotice,
  sectionBlock,
  topBar,
  matrixLegend,
  matrixReferenceCard,
  SYMBOL,
} from "../widgets.js";
import {
  getProduct,
  getProducts,
  getMatrixIndex,
  getMatrix,
  getRecentIds,
  getGeneratedAt,
  recordRecent,
} from "../store.js";
import { evaluateAgainstAll } from "../matrix.js";

export function render(container, route) {
  if (route.id) {
    renderProduct(container, route.id);
    return;
  }
  renderLanding(container);
}

function renderLanding(container) {
  container.appendChild(
    topBar({
      onLang: () => rerender(),
    }),
  );

  container.appendChild(largeTitle("store", "storeGuidance"));

  const recent = recentStrip();
  if (recent) container.appendChild(recent);

  const picker = productPicker({
    onSelect: (product) => {
      window.location.hash = `#/store/${product.id}`;
    },
  });
  /* The picker is full-bleed by default because it is also used inside
     a bottom sheet. On the landing it sits directly on the page, so it
     is wrapped to restore the gutter and an inset list. */
  const inline = el("div", "picker-inline");
  inline.appendChild(picker);
  container.appendChild(inline);

  /* The legend and the scope note make the vocabulary of the matrix
     visible before the first product is opened. */
  const legendBlock = el("div", "store__block");
  legendBlock.appendChild(el("h2", "store__block-title", t("matrixLegend")));
  legendBlock.appendChild(matrixLegend());
  container.appendChild(legendBlock);

  const scope = el("div", "card card--note");
  scope.appendChild(el("div", "t-footnote t-secondary", t("matrixScope")));
  container.appendChild(scope);

  const reference = matrixReferenceCard(getMatrix());
  if (reference) {
    const block = el("div", "store__block");
    block.appendChild(reference);
    container.appendChild(block);
  }

  const generated = getGeneratedAt();
  if (generated) {
    const footer = el("div", "data-footer");
    footer.appendChild(el("div", "t-caption1", `${t("dataUpdated")}: ${formatDate(generated)}`));
    container.appendChild(footer);
  }
}

/** A horizontal strip of the products opened most recently. */
function recentStrip() {
  const ids = getRecentIds();
  const products = ids.map(getProduct).filter(Boolean).slice(0, 5);
  if (!products.length) return null;

  const block = el("div", "recent");
  block.appendChild(el("div", "recent__title", t("recent")));
  const row = el("div", "recent__row");
  for (const product of products) {
    const chip = el("button", "recent__chip");
    chip.type = "button";
    chip.appendChild(el("span", "recent__name", product.name));
    chip.addEventListener("click", () => {
      window.location.hash = `#/store/${product.id}`;
    });
    row.appendChild(chip);
  }
  block.appendChild(row);
  return block;
}

function renderProduct(container, productId) {
  const product = getProduct(productId);
  if (!product) {
    container.appendChild(topBar({ back: true, onBack: back }));
    container.appendChild(el("div", "card", t("productNotFound")));
    return;
  }

  recordRecent(product.id);

  container.appendChild(
    topBar({
      back: true,
      onBack: back,
      onLang: () => rerender(),
    }),
  );

  container.appendChild(productHero(product));

  const body = el("div", "store__sections");

  /* ---- Compatibility guide ---------------------------------- */
  const guide = evaluateAgainstAll(product, getProducts(), getMatrixIndex());

  if (guide.gate) {
    body.appendChild(reviewNotice(guide.gate.i18nKey));
    if (guide.gate.detail) {
      body.appendChild(el("div", "card", guide.gate.detail));
    }
  } else if (guide.ownNoMatrix) {
    const notice = el("div", "notice notice--none");
    const title = el("div", "notice__title");
    title.appendChild(iconEl("help"));
    title.appendChild(el("span", "", t("noMatrixPictograms")));
    notice.appendChild(title);
    body.appendChild(notice);
  } else {
    body.appendChild(segregationSection(guide, product.id));
  }

  /* ---- Hazard information ---------------------------------- */
  if (product.hazardClassifications) {
    const card = el("div", "card");
    card.appendChild(bulletList(splitLines(product.hazardClassifications)));
    body.appendChild(sectionBlock("hazardSummary", [card]));
  }

  if (product.hazardStatements && product.hazardStatements.length) {
    const group = listGroup();
    for (const statement of product.hazardStatements) {
      const row = el("div", "list-row");
      row.style.alignItems = "flex-start";
      const body2 = el("div", "list-row__body");
      body2.appendChild(el("div", "t-caption1", statement.code));
      body2.appendChild(el("div", "t-body", statement.text));
      row.appendChild(body2);
      group.appendChild(row);
    }
    body.appendChild(sectionBlock("hazardStatements", [group]));
  }

  /* ---- Storage --------------------------------------------- */
  if (product.storageConditions) {
    const card = el("div", "card");
    card.appendChild(numberedList(splitSteps(product.storageConditions)));
    body.appendChild(sectionBlock("storageConditions", [card]));
  }
  if (
    product.incompatibleMaterials &&
    !/^none known\.?$/i.test(product.incompatibleMaterials.trim())
  ) {
    const card = el("div", "card");
    card.appendChild(el("div", "t-body", product.incompatibleMaterials));
    body.appendChild(sectionBlock("incompatibleMaterials", [card]));
  }

  /* ---- Precautionary statements ---------------------------- */
  if (product.precautionary && product.precautionary.length) {
    const card = el("div", "card");
    card.appendChild(pStatementList(product.precautionary));
    body.appendChild(sectionBlock("precautionaryStatements", [card]));
  }

  /* ---- SDS reference --------------------------------------- */
  const sdsGroup = listGroup();
  if (product.sdsNumber) {
    sdsGroup.appendChild(infoRow(t("sdsNumber"), product.sdsNumber));
  }
  if (product.sdsVersion) {
    sdsGroup.appendChild(infoRow(t("sdsVersion"), product.sdsVersion));
  }
  if (product.sdsRevisionDate) {
    sdsGroup.appendChild(infoRow(t("sdsRevisionDate"), product.sdsRevisionDate));
  }
  if (product.sourceRef) {
    sdsGroup.appendChild(infoRow(t("source"), product.sourceRef));
  }
  if (sdsGroup.childElementCount) {
    body.appendChild(sectionBlock("viewSds", [sdsGroup]));
  }

  /* ---- Boundary -------------------------------------------- */
  const boundary = el("div", "card card--note");
  boundary.appendChild(el("div", "t-footnote t-secondary", t("storageDecisionBoundary")));
  body.appendChild(boundary);

  const reference = matrixReferenceCard(getMatrix());
  if (reference) {
    const block = el("div", "store__block");
    block.appendChild(reference);
    body.appendChild(block);
  }

  container.appendChild(body);
}

/**
 * The compatibility guide for one product, as products rather than
 * pictogram pairs. Every other product is judged by its hardest pair
 * against this one and listed in one of four buckets.
 *
 * The three verdict buckets are always shown, even when empty: in a
 * rush the assistant needs to see that a category exists and has no
 * members, not wonder whether it was left out.
 *
 * The order is deliberate: cannot store first, then conditions, then
 * can store. The first answer is the one that prevents an incident.
 */
function segregationSection(guide, productId) {
  const wrap = el("div");

  wrap.appendChild(
    bucket("doNotStoreWith", guide.doNotStoreWith, "no", productId),
  );
  wrap.appendChild(
    bucket("conditionalWith", guide.conditional, "conditional", productId),
  );
  wrap.appendChild(
    bucket("compatibleWith", guide.canStoreWith, "ok", productId),
  );

  /* Products outside the matrix are not a verdict; only show the
     bucket when there is something to explain. */
  if (guide.noMatrixRestriction.length) {
    wrap.appendChild(
      bucket("noMatrixWith", guide.noMatrixRestriction, "none", productId),
    );
  }

  /* Products that cannot be auto-evaluated get a prominent notice so
     it cannot be scrolled past. */
  if (guide.reviewRequired && guide.reviewRequired.length) {
    const block = el("div", "store__block");
    const notice = el("div", "notice");
    const title = el("div", "notice__title");
    title.appendChild(iconEl("alert"));
    title.appendChild(
      el("span", "", `${guide.reviewRequired.length} ${t("cannotEvaluate")}`),
    );
    notice.appendChild(title);
    block.appendChild(notice);
    wrap.appendChild(block);
  }

  /* Scope disclosure: what the matrix covers and what it does not. */
  const scopeBlock = el("div", "store__block");
  const scopeCard = el("div", "card card--note");
  scopeCard.appendChild(el("div", "t-footnote t-secondary", t("matrixScope")));
  scopeBlock.appendChild(scopeCard);
  wrap.appendChild(scopeBlock);

  return wrap;
}

/**
 * One bucket: a solid, colour-filled header and list. The colour is a
 * second signal; the symbol and the words carry the meaning on their
 * own.
 */
function bucket(titleKey, items, outcome, productId) {
  const block = el("div", `bucket bucket--${outcome}`);

  const head = el("div", "bucket__head");
  const symbol = el("span", "bucket__symbol", symbolFor(outcome));
  symbol.setAttribute("aria-hidden", "true");
  head.appendChild(symbol);
  head.appendChild(el("span", "bucket__label", t(titleKey)));
  head.appendChild(el("span", "bucket__count", String(items.length)));
  block.appendChild(head);

  const list = el("div", "bucket__list");
  if (!items.length) {
    list.appendChild(el("div", "bucket__empty", t("noProductsInBucket")));
  } else {
    for (const entry of items) {
      list.appendChild(productRow(entry, outcome, productId));
    }
  }
  block.appendChild(list);
  return block;
}

function symbolFor(outcome) {
  if (outcome === "none") return "–";
  return SYMBOL[outcome] || "?";
}

/**
 * One partner product, as a single solid-filled row. The row is
 * deliberately minimal: the section already states the verdict, and
 * tapping the row opens the pair view that explains why. Nothing is
 * hidden behind a second tap.
 */
function productRow(entry, outcome, productId) {
  const row = el("button", "storage-table__row");
  row.type = "button";

  const symbol = el(
    "span",
    "bucket__symbol storage-table__symbol",
    symbolFor(outcome),
  );
  symbol.setAttribute("aria-hidden", "true");
  row.appendChild(symbol);

  const body = el("div", "storage-table__body");
  body.appendChild(el("div", "storage-table__label", entry.name));

  if (entry.pictograms && entry.pictograms.length) {
    const pics = el("div", "storage-table__pics");
    for (const code of entry.pictograms.slice(0, 4)) {
      pics.appendChild(pictogramEl(code, "sm"));
    }
    body.appendChild(pics);
  }

  row.appendChild(body);
  row.appendChild(el("span", "storage-table__chevron", "›"));

  /* Tapping opens the pair view, which keeps both product names and
     pictograms at the top: the assistant never loses the product they
     started from. The browser back button returns to this exact list,
     at the same scroll offset. */
  row.addEventListener("click", () => {
    window.location.hash = `#/pair/${productId}/${entry.id}`;
  });

  return row;
}

function back() {
  if (window.history.length > 1) window.history.back();
  else window.location.hash = "#/store";
}

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
