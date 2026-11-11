/* ============================================================
   WareSafe — compatibility engine (pure)

   This module decides nothing on its own and reads nothing from the
   environment. It takes plain data and returns plain data, so every
   rule can be tested in isolation.

   The decision follows the six-by-six GHS pictogram matrix in
   `chemical-compatibility-conditions-bn.md`:

     OUTCOME          ok            joint storage permitted
                      conditional   permitted with conditions (O)
                      no            joint storage not permitted (X)

     GATE             review_required          no answer may be given
                      no_matrix_restriction    neither product carries a
                                               pictogram the matrix covers

   A gate always wins. A missing, unverified or incomplete product
   never produces a verdict.

   A product may carry several pictograms. Every pair between the two
   products' matrix pictograms is evaluated and the most onerous
   outcome wins: no > conditional > ok.
   ============================================================ */

/** Outcome ranking. Higher wins when several pictogram pairs disagree. */
export const OUTCOME_RANK = {
  ok: 1,
  conditional: 2,
  no: 3,
};

/** The outcome shown when a gate blocks the verdict. */
export const REVIEW_REQUIRED = "review_required";

/** The outcome shown when neither product is covered by the matrix. */
export const NO_MATRIX_RESTRICTION = "no_matrix_restriction";

function pairKey(a, b) {
  return `${a}|${b}`;
}

/**
 * Build a lookup for the matrix.
 *
 * @param {object} matrix - snapshot.matrix
 * @returns {{pairs: Map, conditions: Map, pictograms: Set, source: string,
 *            references: Array, readingRule: object, operationalNote: object}}
 */
export function buildMatrixIndex(matrix) {
  const data = matrix || {};
  const pairs = new Map();
  const conditions = new Map();

  for (const pair of data.pairs || []) {
    pairs.set(pairKey(pair.a, pair.b), pair);
  }
  for (const [id, condition] of Object.entries(data.conditions || {})) {
    conditions.set(id, condition);
  }

  return {
    pairs,
    conditions,
    pictograms: new Set(data.pictograms || []),
    source: data.source || "",
    references: data.references || [],
    readingRule: data.readingRule || {},
    operationalNote: data.operationalNote || {},
  };
}

/** True when the product has a usable Safety Data Sheet behind it. */
export function hasSds(product) {
  return Boolean(product && product.sdsAvailable);
}

/** True when the SDS record carries an unresolved manual-review flag. */
export function needsManualReview(product) {
  return Boolean(
    product && product.extractionStatus === "Manual Review Required",
  );
}

/** True when the SDS states a real signal word. */
export function hasSignalWord(product) {
  if (!product) return false;
  const word = String(product.signalWord || "").trim().toLowerCase();
  return word === "danger" || word === "warning";
}

/** True when the SDS states no hazard pictogram, signal word or
 *  hazard statement. The record exists but carries no usable content. */
export function hasSafetyContent(product) {
  if (!product) return false;
  const statements = product.hazardStatements || [];
  const precautionary = product.precautionary || [];
  return statements.length > 0 || precautionary.length > 0;
}

/** True when the SDS states materials that must not be stored with it.
 *  The statement is free text, so it cannot be mapped onto a pictogram
 *  pair. When present and meaningful, the comparison is gated. */
export function hasProductOverride(product) {
  if (!product) return false;
  const text = (product.incompatibleMaterials || "").trim();
  if (!text) return false;
  return !/^none known\.?$/i.test(text);
}

/** The pictograms of a product that the matrix actually covers. */
export function coveredPictograms(product, index) {
  if (!product || !index) return [];
  return (product.pictograms || []).filter((code) => index.pictograms.has(code));
}

/** The pictograms of a product that the matrix does not cover. */
export function uncoveredPictograms(product, index) {
  if (!product || !index) return [];
  return (product.pictograms || []).filter((code) => !index.pictograms.has(code));
}

/** True when the product carries every one of the given pictograms.
 *  Used by the picker: selecting two diamonds means "both", not "either". */
export function carriesAllPictograms(product, codes) {
  if (!codes || !codes.length) return true;
  const owned = new Set(product && product.pictograms ? product.pictograms : []);
  return codes.every((code) => owned.has(code));
}

/**
 * The gate that applies to one product on its own. A product that
 * cannot be judged is never shown as though a verdict were possible.
 *
 * @param {object} product
 * @returns {{code: string, i18nKey: string, detail?: string} | null}
 */
export function gateForProduct(product) {
  if (!hasSds(product)) {
    return { code: "no_sds", i18nKey: "noSdsOnFile" };
  }
  if (needsManualReview(product)) {
    return { code: "manual_review", i18nKey: "manualReviewRequired" };
  }
  if (!hasSafetyContent(product)) {
    return { code: "incomplete_record", i18nKey: "incompleteRecord" };
  }
  if (hasProductOverride(product)) {
    return {
      code: "product_override",
      i18nKey: "productOverrideApplies",
      detail: product.incompatibleMaterials,
    };
  }
  return null;
}

/**
 * The gate that applies to a pair of products before any pair of
 * pictograms is evaluated.
 */
export function detectGate(productA, productB) {
  if (!hasSds(productA) || !hasSds(productB)) {
    const missing = !hasSds(productA) ? productA : productB;
    return {
      code: "no_sds",
      i18nKey: "noSdsOnFile",
      detail: missing ? missing.name : "",
    };
  }
  if (needsManualReview(productA) || needsManualReview(productB)) {
    return { code: "manual_review", i18nKey: "manualReviewRequired" };
  }
  if (!hasSafetyContent(productA) || !hasSafetyContent(productB)) {
    const empty = !hasSafetyContent(productA) ? productA : productB;
    return {
      code: "incomplete_record",
      i18nKey: "incompleteRecord",
      detail: empty ? empty.name : "",
    };
  }
  if (hasProductOverride(productA) || hasProductOverride(productB)) {
    const product = hasProductOverride(productA) ? productA : productB;
    return {
      code: "product_override",
      i18nKey: "productOverrideApplies",
      detail: product.incompatibleMaterials,
    };
  }
  return null;
}

/**
 * Evaluate a two-product comparison.
 *
 * @param {object} productA
 * @param {object} productB
 * @param {object} index - from buildMatrixIndex()
 * @returns {object} result
 */
export function evaluatePair(productA, productB, index) {
  const result = {
    outcome: REVIEW_REQUIRED,
    gate: null,
    pairs: [],
    conditions: [],
    uncovered: [],
    mostRestrictive: false,
  };

  const gate = detectGate(productA, productB);
  if (gate) {
    result.gate = gate;
    return result;
  }

  const aPictograms = coveredPictograms(productA, index);
  const bPictograms = coveredPictograms(productB, index);

  /* Neither product carries a pictogram the matrix covers. The matrix
     is silent, which is not the same as "compatible". */
  if (!aPictograms.length || !bPictograms.length) {
    result.outcome = NO_MATRIX_RESTRICTION;
    result.uncovered = [productA, productB].filter(
      (p) => !coveredPictograms(p, index).length,
    );
    return result;
  }

  const seen = new Set();
  for (const codeA of aPictograms) {
    for (const codeB of bPictograms) {
      const key = pairKey(codeA, codeB);
      if (seen.has(key)) continue;
      seen.add(key);

      const rule = index.pairs.get(key);
      if (!rule) {
        result.gate = {
          code: "missing_pair",
          i18nKey: "reviewRequired",
          detail: `${codeA} × ${codeB}`,
        };
        result.outcome = REVIEW_REQUIRED;
        return result;
      }
      result.pairs.push({
        a: codeA,
        b: codeB,
        outcome: rule.outcome,
        condition: rule.condition || null,
      });
    }
  }

  // Most onerous pictogram pair wins.
  let winner = result.pairs[0];
  for (const pair of result.pairs) {
    if (OUTCOME_RANK[pair.outcome] > OUTCOME_RANK[winner.outcome]) winner = pair;
  }

  result.outcome = winner.outcome;
  result.mostRestrictive = result.pairs.length > 1;

  if (result.outcome === "conditional") {
    result.conditions = collectConditions(result.pairs, index);
  } else if (result.outcome === "no") {
    /* An X verdict still needs the separation / segregation rules,
       which live in the general condition set. */
    result.conditions = collectConditions([], index);
  }

  return result;
}

/**
 * The condition sets that apply to an outcome: the general conditions
 * plus every specific O-n set produced by a conditional pair.
 */
export function collectConditions(pairs, index) {
  const ids = new Set(["general"]);
  for (const pair of pairs || []) {
    if (pair.outcome === "conditional" && pair.condition) {
      ids.add(pair.condition);
    }
  }
  const collected = [];
  for (const id of ids) {
    const condition = index.conditions.get(id);
    if (!condition) continue;
    collected.push({ id, ...condition });
  }
  return collected;
}

/**
 * The most onerous co-storage outcome between two products, for the
 * Store guide.
 *
 * @returns {{outcome: string, gate: object|null, pairs: Array,
 *            conditions: Array, uncovered: Array}}
 */
export function productCompatibility(productA, productB, index) {
  return evaluatePair(productA, productB, index);
}

/**
 * Evaluate one product against every other product in the catalogue,
 * for the Store screen.
 *
 * @param {object} product
 * @param {Array} products
 * @param {object} index
 * @returns {object}
 */
export function evaluateAgainstAll(product, products, index) {
  const result = {
    outcome: "ok",
    gate: null,
    ownNoMatrix: false,
    canStoreWith: [],       // ok
    conditional: [],        // conditional
    doNotStoreWith: [],     // no
    noMatrixRestriction: [], // other product outside the matrix
    reviewRequired: [],     // gate
  };

  const ownGate = gateForProduct(product);
  if (ownGate) {
    result.gate = ownGate;
    result.outcome = REVIEW_REQUIRED;
    return result;
  }

  /* The selected product itself carries no matrix pictogram, so the
     matrix cannot judge it against anything. */
  if (!coveredPictograms(product, index).length) {
    result.ownNoMatrix = true;
    result.outcome = NO_MATRIX_RESTRICTION;
    return result;
  }

  for (const other of products || []) {
    if (!other || other.id === product.id) continue;

    const evaluation = productCompatibility(product, other, index);
    const entry = {
      id: other.id,
      name: other.name,
      pictograms: other.pictograms || [],
      productType: other.productType || "",
      outcome: evaluation.outcome,
      pairs: evaluation.pairs,
      conditions: evaluation.conditions,
      uncovered: evaluation.uncovered,
    };

    if (evaluation.outcome === "no") result.doNotStoreWith.push(entry);
    else if (evaluation.outcome === "conditional") result.conditional.push(entry);
    else if (evaluation.outcome === "ok") result.canStoreWith.push(entry);
    else if (evaluation.outcome === NO_MATRIX_RESTRICTION) {
      result.noMatrixRestriction.push(entry);
    } else result.reviewRequired.push(entry);
  }

  return result;
}

/**
 * The separation / segregation instruction that applies when two
 * products must not be stored together. These are general conditions
 * 2 and 3 of the source guidance, which also govern incompatible
 * products, not only the "O" pairings.
 */
export function segregationGuidance(index) {
  const general = index.conditions.get("general");
  if (!general) return { en: [], bn: [] };
  return {
    en: (general.en || []).slice(1, 3),
    bn: (general.bn || []).slice(1, 3),
  };
}
