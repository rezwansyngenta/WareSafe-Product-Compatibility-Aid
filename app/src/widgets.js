/* ============================================================
   WareSafe — widgets
   Composed, dataset-aware UI pieces shared by the three screens:
   the product hero, the product picker, the verdict card, the
   conditions panel and the matrix reference card.
   ============================================================ */

import { t, contentText, getLang, setLang } from "./i18n.js";
import {
  chip,
  clear,
  el,
  emptyState,
  haptic,
  iconEl,
  openSheet,
  closeSheet,
  pictogramEl,
  richText,
} from "./ui.js";
import { getPictogram, getPictograms, searchProducts } from "./store.js";
import {
  hasSafetyContent,
  hasSignalWord,
  carriesAllPictograms,
} from "./matrix.js";

/* ---------------------------------------------------------------
   Top bar
   --------------------------------------------------------------- */

/**
 * The screen bar: back button (when pushed), Syngenta wordmark and the
 * language slider, always at the far right so it is reachable from
 * anywhere.
 */
export function topBar(options) {
  const opts = options || {};
  const bar = el("div", "screen__bar");

  if (opts.back) {
    const back = el("button", "bar__action");
    back.type = "button";
    back.setAttribute("aria-label", t("back"));
    back.appendChild(iconEl("back"));
    back.addEventListener("click", () => {
      haptic("tap");
      if (opts.onBack) opts.onBack();
    });
    bar.appendChild(back);
  }

  const logo = el("img", "screen__bar-logo");
  logo.src = "./assets/brand/logo-syngenta-onbrand.svg";
  logo.alt = "Syngenta";
  logo.decoding = "async";
  bar.appendChild(logo);

  for (const action of opts.actions || []) {
    const button = el("button", "bar__action");
    button.type = "button";
    button.setAttribute("aria-label", action.label);
    if (action.icon) button.appendChild(iconEl(action.icon));
    if (action.text) button.appendChild(el("span", "", action.text));
    button.addEventListener("click", action.onClick);
    bar.appendChild(button);
  }

  bar.appendChild(langSlider(opts.onLang));

  return bar;
}

/* ---------------------------------------------------------------
   Language pill
   --------------------------------------------------------------- */

const LANG_LABEL_BN = "বাংলা";
const LANG_LABEL_EN = "EN";

/** Set when the language changes, so the replacement pill can take
 *  the keyboard focus back. */
let focusLangAfterRender = false;

/**
 * The language control: a two-option segmented pill in the top bar.
 * Both choices are visible at all times and the active one is filled.
 */
export function langSlider(onChange) {
  const wrap = el("div", "langpill");
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", t("language"));

  const bnBtn = el("button", "langpill__option", LANG_LABEL_BN);
  bnBtn.type = "button";
  bnBtn.setAttribute("aria-pressed", getLang() === "bn" ? "true" : "false");

  const enBtn = el("button", "langpill__option", LANG_LABEL_EN);
  enBtn.type = "button";
  enBtn.setAttribute("aria-pressed", getLang() === "en" ? "true" : "false");

  function commit(next) {
    if (next === getLang()) return;
    setLang(next);
    haptic("select");
    focusLangAfterRender = true;
    if (onChange) onChange();
  }

  bnBtn.addEventListener("click", () => commit("bn"));
  enBtn.addEventListener("click", () => commit("en"));

  wrap.appendChild(bnBtn);
  wrap.appendChild(enBtn);

  if (focusLangAfterRender) {
    focusLangAfterRender = false;
    const target = getLang() === "bn" ? bnBtn : enBtn;
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => target.focus());
    }
  }

  return wrap;
}

/* ---------------------------------------------------------------
   Large title
   --------------------------------------------------------------- */

export function largeTitle(titleKey, subtitleKey, extra) {
  const title = el("div", "largetitle");
  const row = el("div", "largetitle__row");
  row.appendChild(el("h1", "largetitle__title", t(titleKey)));

  if (extra) row.appendChild(extra);

  title.appendChild(row);
  if (subtitleKey) title.appendChild(el("div", "t-subheadline", t(subtitleKey)));
  return title;
}

/* ---------------------------------------------------------------
   Product hero
   --------------------------------------------------------------- */

export function productHero(product) {
  const hero = el("div", "hero");

  const top = el("div", "hero__top");
  const body = el("div", "hero__body");
  body.appendChild(el("h1", "hero__name", product.name));
  if (product.productType) {
    body.appendChild(el("div", "hero__type", product.productType));
  }
  if (product.designCode || product.materialNumber) {
    body.appendChild(
      el(
        "div",
        "hero__code",
        [product.designCode, product.materialNumber].filter(Boolean).join(" · "),
      ),
    );
  }
  top.appendChild(body);

  if (hasSignalWord(product)) {
    const signal = el("div", "hero__signal");
    const word = product.signalWord || "";
    const variant =
      word.toLowerCase() === "danger" ? " signal--danger" : " signal--warning";
    const badge = el("span", `signal${variant}`);
    badge.appendChild(el("span", "", t("signalWord")));
    badge.appendChild(el("span", "", word));
    signal.appendChild(badge);
    top.appendChild(signal);
  }

  hero.appendChild(top);

  const flags = productFlags(product);
  if (flags.length) {
    const row = el("div", "product__flags");
    for (const flag of flags) row.appendChild(flag);
    hero.appendChild(row);
  }

  if (product.pictograms && product.pictograms.length) {
    const row = el("div", "hero__pictograms");
    for (const code of product.pictograms) {
      const pic = pictogramEl(code, "sm");
      const info = getPictogram(code);
      const wrap = el("div", "hero__pictogram");
      wrap.appendChild(pic);
      if (info) {
        wrap.appendChild(el("div", "t-caption1", info.hazard));
      }
      row.appendChild(wrap);
    }
    hero.appendChild(row);
  }

  return hero;
}

/** Status chips for a product. */
export function productFlags(product) {
  const flags = [];
  if (!product.sdsAvailable) {
    flags.push(chip(t("noSdsOnFile"), "danger"));
    return flags;
  }
  if (product.extractionStatus === "Manual Review Required") {
    flags.push(chip(t("manualReviewRequired"), "warn"));
  }
  if (!hasSafetyContent(product)) {
    flags.push(chip(t("incompleteRecord"), "danger"));
  }
  if (product.pictogramsNotStated) {
    flags.push(chip(t("pictogramsNotStated"), "warn"));
  }
  if (!hasSignalWord(product)) {
    flags.push(chip(t("signalNotStated"), "warn"));
  }
  return flags;
}

/* ---------------------------------------------------------------
   Product picker
   --------------------------------------------------------------- */

/**
 * Build the contents of the product picker sheet.
 *
 * @param {object} options
 *   onSelect  - called with the chosen product
 *   excludeId - a product that must not be offered (already picked)
 */
export function productPicker(options) {
  const opts = options || {};
  const wrap = el("div", "picker");

  const search = el("div", "search");
  search.appendChild(iconEl("search", "search__icon"));
  const input = el("input", "search__input");
  input.type = "search";
  input.placeholder = t("searchPrompt");
  input.setAttribute("aria-label", t("searchPrompt"));
  input.autocomplete = "off";
  search.appendChild(input);
  wrap.appendChild(search);

  /* A row of the GHS diamonds. Tap one or more to see only the
     products that carry any of them. */
  const pictoRow = el("div", "picker__pictograms");
  const activePictograms = new Set();
  const pictoButtons = new Map();
  const pictoHint = el("div", "picker__hint");
  pictoHint.hidden = true;

  function updateHint() {
    if (activePictograms.size > 1) {
      pictoHint.textContent = `${t("allSelectedPictograms")} (${activePictograms.size})`;
      pictoHint.hidden = false;
    } else {
      pictoHint.hidden = true;
    }
  }

  for (const pictogram of getPictograms()) {
    const button = el("button", "picto-filter");
    button.type = "button";
    button.appendChild(pictogramEl(pictogram.code, "sm"));
    button.setAttribute("aria-label", pictogram.hazard);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      if (activePictograms.has(pictogram.code)) {
        activePictograms.delete(pictogram.code);
      } else {
        activePictograms.add(pictogram.code);
      }
      button.setAttribute(
        "aria-pressed",
        activePictograms.has(pictogram.code) ? "true" : "false",
      );
      updateHint();
      renderList();
    });
    pictoButtons.set(pictogram.code, button);
    pictoRow.appendChild(button);
  }

  const clearPicto = el("button", "picto-clear", t("clear"));
  clearPicto.type = "button";
  clearPicto.addEventListener("click", () => {
    activePictograms.clear();
    for (const node of pictoButtons.values()) {
      node.setAttribute("aria-pressed", "false");
    }
    updateHint();
    renderList();
  });
  pictoRow.appendChild(clearPicto);
  wrap.appendChild(pictoRow);
  wrap.appendChild(pictoHint);

  const filters = el("div", "picker__filters");
  const filterDefs = [
    { id: "all", label: t("filterAll") },
    { id: "sds", label: t("filterWithSds") },
    { id: "nosds", label: t("filterWithoutSds") },
    { id: "review", label: t("filterReview") },
  ];
  let activeFilter = "all";
  const filterButtons = new Map();
  for (const def of filterDefs) {
    const button = el("button", "picker__filter", def.label);
    button.type = "button";
    button.setAttribute("aria-pressed", def.id === activeFilter ? "true" : "false");
    button.addEventListener("click", () => {
      activeFilter = def.id;
      for (const [id, node] of filterButtons) {
        node.setAttribute("aria-pressed", id === activeFilter ? "true" : "false");
      }
      renderList();
    });
    filterButtons.set(def.id, button);
    filters.appendChild(button);
  }
  wrap.appendChild(filters);

  const list = el("div", "picker__list");
  wrap.appendChild(list);

  function matchesFilter(product) {
    if (activeFilter === "sds") return product.sdsAvailable;
    if (activeFilter === "nosds") return !product.sdsAvailable;
    if (activeFilter === "review") {
      return (
        !product.sdsAvailable || product.extractionStatus === "Manual Review Required"
      );
    }
    if (activePictograms.size > 0) {
      /* Selecting two diamonds means "carries both", not "carries
         either" — the assistant is narrowing the list. */
      return carriesAllPictograms(product, [...activePictograms]);
    }
    return true;
  }

  function renderList() {
    clear(list);
    const query = input.value;
    let results = searchProducts(query);
    results = results.filter(matchesFilter);
    if (opts.excludeId) {
      results = results.filter((p) => p.id !== opts.excludeId);
    }

    if (!results.length) {
      list.appendChild(
        emptyState("search", t("productNotFound"), query ? "" : t("noResults")),
      );
      return;
    }

    for (const product of results.slice(0, 200)) {
      const row = el("button", "product");
      row.type = "button";

      const body = el("div", "product__body");
      body.appendChild(el("div", "product__name", product.name));
      const flags = productFlags(product);
      if (flags.length) {
        const row2 = el("div", "product__flags");
        for (const flag of flags) row2.appendChild(flag);
        body.appendChild(row2);
      }
      row.appendChild(body);

      if (product.pictograms && product.pictograms.length) {
        for (const code of product.pictograms.slice(0, 3)) {
          row.appendChild(pictogramEl(code, "sm"));
        }
      }

      row.addEventListener("click", () => {
        if (opts.onSelect) opts.onSelect(product);
      });
      list.appendChild(row);
    }
  }

  input.addEventListener("input", renderList);
  renderList();

  return wrap;
}

/* ---------------------------------------------------------------
   Quick product finder
   --------------------------------------------------------------- */

export function quickProductSearch(options) {
  const opts = options || {};
  const wrap = el("div", "quickfind");

  const search = el("div", "search");
  search.appendChild(iconEl("search", "search__icon"));
  const input = el("input", "search__input");
  input.type = "search";
  input.placeholder = t("searchPrompt");
  input.setAttribute("aria-label", t("searchPrompt"));
  input.autocomplete = "off";
  search.appendChild(input);
  wrap.appendChild(search);

  const results = el("div", "quickfind__results");
  wrap.appendChild(results);

  const browse = el("button", "btn btn--secondary btn--block");
  browse.type = "button";
  browse.appendChild(el("span", "", t("browseAllProducts")));
  browse.addEventListener("click", () => {
    haptic("tap");
    const content = productPicker({
      onSelect: (product) => {
        closeSheet();
        if (opts.onSelect) opts.onSelect(product);
      },
    });
    openSheet(t("selectProduct"), content);
  });
  wrap.appendChild(browse);

  function renderResults() {
    clear(results);
    const query = input.value.trim();

    if (!query) {
      results.appendChild(el("div", "quickfind__hint", t("typeToSearch")));
      return;
    }

    const matches = searchProducts(query, 6);

    if (!matches.length) {
      results.appendChild(
        emptyState("search", t("productNotFound"), t("browseAllProducts")),
      );
      return;
    }

    for (const product of matches) {
      const row = el("button", "product");
      row.type = "button";

      const body = el("div", "product__body");
      body.appendChild(el("div", "product__name", product.name));
      row.appendChild(body);

      if (product.pictograms && product.pictograms.length) {
        for (const code of product.pictograms.slice(0, 2)) {
          row.appendChild(pictogramEl(code, "sm"));
        }
      }

      row.addEventListener("click", () => {
        haptic("select");
        if (opts.onSelect) opts.onSelect(product);
      });
      results.appendChild(row);
    }
  }

  input.addEventListener("input", renderResults);
  renderResults();

  return wrap;
}

/* ---------------------------------------------------------------
   Matrix symbols
   --------------------------------------------------------------- */

/** The three matrix symbols, as they are printed in the source chart. */
export const SYMBOL = {
  ok: "✓",
  conditional: "O",
  no: "X",
};

/** A pictogram pair, e.g. [GHS06] × [GHS02]. The pair carries an
 *  accessible label built from the hazard names, because two
 *  decorative images and a multiplication sign say nothing. */
export function pairPictograms(a, b) {
  const wrap = el("span", "pictogram-pair");
  const infoA = getPictogram(a);
  const infoB = getPictogram(b);
  wrap.setAttribute("role", "img");
  wrap.setAttribute(
    "aria-label",
    `${infoA ? infoA.hazard : a} × ${infoB ? infoB.hazard : b}`,
  );
  wrap.appendChild(pictogramEl(a, "sm"));
  wrap.appendChild(el("span", "pictogram-pair__times", "×"));
  wrap.appendChild(pictogramEl(b, "sm"));
  return wrap;
}

/** The compact legend: ✓ permitted, O with conditions, X not permitted. */
export function matrixLegend() {
  const wrap = el("div", "legend");
  const items = [
    { outcome: "ok", key: "legendOk" },
    { outcome: "conditional", key: "legendConditional" },
    { outcome: "no", key: "legendNo" },
  ];
  for (const item of items) {
    const row = el("div", `legend__item ${themeFor(item.outcome)}`);
    const symbol = el("span", "legend__symbol", SYMBOL[item.outcome]);
    symbol.setAttribute("aria-hidden", "true");
    row.appendChild(symbol);
    row.appendChild(el("span", "legend__label", t(item.key)));
    wrap.appendChild(row);
  }
  return wrap;
}

/* ---------------------------------------------------------------
   Verdict
   --------------------------------------------------------------- */

const OUTCOME_UI = {
  ok: { key: "verdictCan", icon: "checkCircle", theme: "t-compatible" },
  conditional: {
    key: "verdictConditional",
    icon: "alert",
    theme: "t-conditional",
  },
  no: { key: "verdictCannot", icon: "xCircle", theme: "t-incompatible" },
  no_matrix_restriction: {
    key: "verdictNoMatrix",
    icon: "help",
    theme: "t-none",
  },
  review_required: { key: "reviewRequired", icon: "help", theme: "t-review_required" },
};

const OUTCOME_DETAIL_KEYS = {
  ok: "outcomeOk",
  conditional: "outcomeConditional",
  no: "outcomeNo",
};

/** CSS theme class for an outcome. */
export function themeFor(outcome) {
  const ui = OUTCOME_UI[outcome];
  return ui ? ui.theme : "t-review_required";
}

/** The display label of an outcome. */
export function outcomeLabel(outcome) {
  const ui = OUTCOME_UI[outcome];
  return t(ui ? ui.key : "reviewRequired");
}

/**
 * The verdict card: the answer, in one glance, with the deciding pair.
 * @param {object} result from matrix.evaluatePair()
 */
export function verdictCard(result) {
  const ui = OUTCOME_UI[result.outcome] || OUTCOME_UI.review_required;
  const card = el("div", `verdict ${ui.theme}`);

  const head = el("div", "verdict__headline");
  head.appendChild(iconEl(ui.icon, "verdict__icon"));
  const textWrap = el("div");
  textWrap.appendChild(el("div", "verdict__title", t(ui.key)));
  head.appendChild(textWrap);
  card.appendChild(head);

  if (result.outcome === "review_required") {
    if (result.gate) {
      card.appendChild(el("div", "verdict__body", t(result.gate.i18nKey)));
      if (result.gate.detail && result.gate.code === "product_override") {
        card.appendChild(el("div", "verdict__rule", result.gate.detail));
      }
    }
    card.appendChild(el("div", "verdict__rule", t("reviewRequiredResult")));
    return card;
  }

  if (result.outcome === "no_matrix_restriction") {
    card.appendChild(el("div", "verdict__body", t("noMatrixBody")));
    return card;
  }

  // The specific meaning of the outcome, in words, under the headline.
  card.appendChild(
    el("div", "verdict__detail", t(OUTCOME_DETAIL_KEYS[result.outcome])),
  );

  // The pair that decided the verdict.
  const winner = decidingPair(result);
  if (winner) {
    const row = el("div", "verdict__pair");
    row.appendChild(pairPictograms(winner.a, winner.b));
    const symbol = el("span", `symbol symbol--${winner.outcome}`, SYMBOL[winner.outcome]);
    symbol.setAttribute("aria-hidden", "true");
    row.appendChild(symbol);
    card.appendChild(row);
  }

  if (result.mostRestrictive) {
    card.appendChild(el("div", "verdict__footnote", t("mostRestrictiveRule")));
  }

  card.appendChild(el("div", "verdict__rule", t("doNotActOnColour")));
  return card;
}

/** The pair with the most onerous outcome. */
export function decidingPair(result) {
  if (!result.pairs || !result.pairs.length) return null;
  let winner = result.pairs[0];
  for (const pair of result.pairs) {
    if (rank(pair.outcome) > rank(winner.outcome)) winner = pair;
  }
  return winner;
}

function rank(outcome) {
  return { ok: 1, conditional: 2, no: 3 }[outcome] || 0;
}

/* ---------------------------------------------------------------
   Conditions
   --------------------------------------------------------------- */

/**
 * The conditions that apply to a verdict.
 *
 * For "conditional": the specific O-n conditions first (they are the
 * actionable ones), then the general conditions, collapsed.
 * For "no": the separation / segregation instruction, then the
 * general conditions, collapsed.
 *
 * @param {object} result from matrix.evaluatePair()
 * @param {object} index from buildMatrixIndex()
 */
export function conditionsPanel(result, index) {
  if (result.outcome === "no_matrix_restriction" || result.outcome === "review_required") {
    return null;
  }

  const wrap = el("div", "conditions");
  wrap.appendChild(el("h2", "conditions__title", t("requiredCondition")));

  if (result.outcome === "conditional") {
    for (const condition of result.conditions || []) {
      if (condition.id === "general") continue;
      wrap.appendChild(conditionBlock(condition, t("specificConditions")));
    }
  }

  if (result.outcome === "no") {
    const card = el("div", "card condition-card");
    const body = el("div", "t-body");
    body.appendChild(richText(t("separationGuidance")));
    card.appendChild(body);
    wrap.appendChild(card);
  }

  const general = (result.conditions || []).find((c) => c.id === "general");
  if (general) {
    wrap.appendChild(conditionBlock(general, t("generalConditions"), true));
  }

  return wrap;
}

/**
 * One condition set. General conditions are collapsed by default so
 * the specific instruction stays at the top of the screen.
 */
function conditionBlock(condition, title, collapsible) {
  const card = el("div", "card condition-card");

  const heading = el("button", "condition-card__heading");
  heading.type = "button";
  heading.appendChild(el("span", "", title));

  const list = el("ol", "condition-list");
  list.setAttribute("role", "list");
  const items = getLang() === "en" ? condition.en || [] : condition.bn || [];
  for (const item of items) {
    const li = el("li", "condition-list__item");
    li.appendChild(richText(item));
    list.appendChild(li);
  }

  if (collapsible) {
    heading.setAttribute("aria-expanded", "false");
    list.hidden = true;
    heading.appendChild(el("span", "condition-card__caret", "›"));
    heading.addEventListener("click", () => {
      const open = list.hidden;
      list.hidden = !open;
      heading.setAttribute("aria-expanded", String(!open));
    });
    card.appendChild(heading);
  } else {
    card.appendChild(heading);
  }

  card.appendChild(list);
  return card;
}

/* ---------------------------------------------------------------
   Why-this-result panel
   --------------------------------------------------------------- */

/**
 * The "why this result" panel: every pictogram pair that was
 * evaluated, the outcome of each, and the matrix provenance.
 */
export function whyPanel(result) {
  const wrap = el("div", "card");

  wrap.appendChild(el("div", "t-title3", t("whyThisResult")));

  if (result.gate) {
    wrap.appendChild(el("div", "t-callout t-secondary", t(result.gate.i18nKey)));
    if (result.gate.detail) {
      wrap.appendChild(el("div", "t-footnote t-tertiary", result.gate.detail));
    }
    wrap.appendChild(el("div", "t-footnote t-tertiary", t("contactHse")));
    return wrap;
  }

  if (result.outcome === "no_matrix_restriction") {
    wrap.appendChild(el("div", "t-callout t-secondary", t("noMatrixBody")));
    const codes = [];
    for (const product of result.uncovered || []) {
      for (const code of product.pictograms || []) {
        if (!codes.includes(code)) codes.push(code);
      }
    }
    if (codes.length) {
      const row = el("div", "uncovered-row");
      for (const code of codes) {
        const info = getPictogram(code);
        const wrap2 = el("div", "uncovered");
        wrap2.appendChild(pictogramEl(code, "sm"));
        if (info) wrap2.appendChild(el("div", "t-caption1", info.hazard));
        row.appendChild(wrap2);
      }
      wrap.appendChild(row);
    }
    return wrap;
  }

  wrap.appendChild(el("div", "t-subheadline", t("pairsChecked")));

  const list = el("div", "pairs");
  for (const pair of result.pairs) {
    const row = el("div", `pair-row ${themeFor(pair.outcome)}`);
    row.appendChild(pairPictograms(pair.a, pair.b));
    const symbol = el("span", `symbol symbol--${pair.outcome}`, SYMBOL[pair.outcome]);
    symbol.setAttribute("aria-hidden", "true");
    row.appendChild(symbol);
    row.appendChild(el("span", "pair-row__label", outcomeLabel(pair.outcome)));
    if (pair.condition) {
      row.appendChild(el("span", "pair-row__condition", pair.condition));
    }
    list.appendChild(row);
  }
  wrap.appendChild(list);

  return wrap;
}

/* ---------------------------------------------------------------
   Matrix reference
   --------------------------------------------------------------- */

/**
 * The source card: reading rule, source line, operational note and
 * the guideline references. Collapsed by default.
 */
export function matrixReferenceCard(matrix) {
  if (!matrix) return null;
  const card = el("div", "card matrix-ref");

  const heading = el("button", "condition-card__heading");
  heading.type = "button";
  heading.appendChild(el("span", "", t("matrixSource")));
  heading.appendChild(el("span", "condition-card__caret", "›"));
  heading.setAttribute("aria-expanded", "false");

  const body = el("div", "matrix-ref__body");
  body.hidden = true;

  if (matrix.source) {
    body.appendChild(el("div", "t-body", matrix.source));
  }

  if (matrix.readingRule) {
    body.appendChild(el("div", "t-caption2 matrix-ref__label", t("readingRule")));
    body.appendChild(
      el("div", "t-footnote t-secondary", contentText(matrix.readingRule.bn, matrix.readingRule.en)),
    );
  }

  if (matrix.operationalNote) {
    body.appendChild(el("div", "t-caption2 matrix-ref__label", t("operationalNote")));
    body.appendChild(
      el(
        "div",
        "t-footnote t-secondary",
        contentText(matrix.operationalNote.bn, matrix.operationalNote.en),
      ),
    );
  }

  if (matrix.references && matrix.references.length) {
    const list = el("ul", "matrix-ref__refs");
    list.setAttribute("role", "list");
    for (const reference of matrix.references) {
      list.appendChild(el("li", "t-footnote t-tertiary", reference));
    }
    body.appendChild(list);
  }

  heading.addEventListener("click", () => {
    const open = body.hidden;
    body.hidden = !open;
    heading.setAttribute("aria-expanded", String(!open));
  });

  card.appendChild(heading);
  card.appendChild(body);
  return card;
}

/* ---------------------------------------------------------------
   Review notice
   --------------------------------------------------------------- */

export function reviewNotice(i18nKey) {
  const notice = el("div", "notice");
  const title = el("div", "notice__title");
  title.appendChild(iconEl("alert"));
  title.appendChild(el("span", "", t(i18nKey)));
  notice.appendChild(title);
  return notice;
}

/* ---------------------------------------------------------------
   P-statements
   --------------------------------------------------------------- */

/**
 * Render the precautionary statements of a product: Bangla first,
 * exact English underneath, with the P-code kept exactly as the
 * SDS prints it.
 */
export function pStatementList(statements) {
  const list = el("div", "pstatements");
  for (const statement of statements || []) {
    const item = el("div", "pstatement");
    item.appendChild(el("div", "pstatement__code", statement.code));
    const body = el("div", "pstatement__body");
    body.appendChild(el("div", "t-body", contentText(statement.bn, statement.text)));
    item.appendChild(body);
    list.appendChild(item);
  }
  return list;
}

/**
 * A titled block of content. The heading follows the active
 * language, so the BN/EN switch in the top bar renames every
 * section at once.
 */
export function sectionBlock(titleKey, children) {
  const wrap = el("div", "store__block");
  wrap.appendChild(el("h2", "store__block-title", t(titleKey)));
  for (const child of children || []) wrap.appendChild(child);
  return wrap;
}
