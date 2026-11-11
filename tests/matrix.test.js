/* ============================================================
   WareSafe — matrix engine tests
   The decision logic is pure, so it is tested without a DOM, a
   browser or a network. Every pair in the source chart is covered.
   ============================================================ */

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  OUTCOME_RANK,
  REVIEW_REQUIRED,
  NO_MATRIX_RESTRICTION,
  buildMatrixIndex,
  coveredPictograms,
  carriesAllPictograms,
  evaluatePair,
  evaluateAgainstAll,
  gateForProduct,
  segregationGuidance,
} from "../app/src/matrix.js";

const snapshot = JSON.parse(
  await readFile(new URL("../app/data/snapshot.json", import.meta.url), "utf8"),
);
const index = buildMatrixIndex(snapshot.matrix);

/** A product with the minimum fields the engine reads. */
function product(id, pictograms, extra) {
  return {
    id,
    name: id,
    pictograms,
    sdsAvailable: true,
    extractionStatus: "Verified",
    hazardStatements: [{ code: "H300", text: "Fatal if swallowed." }],
    precautionary: [{ code: "P260", text: "Do not breathe dust." }],
    incompatibleMaterials: "None known.",
    ...extra,
  };
}

const P_IRRITANT = product("P-IRRITANT", ["GHS07"]);
const P_OXIDISER = product("P-OXIDISER", ["GHS03"]);
const P_TOXIC = product("P-TOXIC", ["GHS06"]);
const P_CORROSIVE = product("P-CORROSIVE", ["GHS05"]);
const P_FLAMMABLE = product("P-FLAMMABLE", ["GHS02"]);
const P_EXPLOSIVE = product("P-EXPLOSIVE", ["GHS01"]);
const P_MULTI = product("P-MULTI", ["GHS07", "GHS01"]);
const P_ENV = product("P-ENV", ["GHS08", "GHS09"]);

test("every pair in the source chart resolves to the printed outcome", () => {
  const expected = [
    // GHS05 Corrosive
    ["GHS05", "GHS05", "ok", null],
    ["GHS05", "GHS07", "ok", null],
    ["GHS05", "GHS06", "conditional", "O-1"],
    ["GHS05", "GHS02", "no", null],
    ["GHS05", "GHS03", "no", null],
    ["GHS05", "GHS01", "no", null],
    // GHS07 Harmful / Irritant
    ["GHS07", "GHS07", "ok", null],
    ["GHS07", "GHS06", "ok", null],
    ["GHS07", "GHS02", "ok", null],
    ["GHS07", "GHS03", "conditional", "O-2"],
    ["GHS07", "GHS01", "no", null],
    // GHS06 Toxic
    ["GHS06", "GHS06", "ok", null],
    ["GHS06", "GHS02", "conditional", "O-3"],
    ["GHS06", "GHS03", "no", null],
    ["GHS06", "GHS01", "no", null],
    // GHS02 Flammable
    ["GHS02", "GHS02", "ok", null],
    ["GHS02", "GHS03", "no", null],
    ["GHS02", "GHS01", "no", null],
    // GHS03 Oxidising
    ["GHS03", "GHS03", "ok", null],
    ["GHS03", "GHS01", "no", null],
    // GHS01 Explosive
    ["GHS01", "GHS01", "ok", null],
  ];

  for (const [a, b, outcome, condition] of expected) {
    const rule = index.pairs.get(`${a}|${b}`);
    assert.ok(rule, `missing pair ${a} x ${b}`);
    assert.equal(rule.outcome, outcome, `${a} x ${b} outcome`);
    assert.equal(rule.condition, condition, `${a} x ${b} condition`);
  }
});

test("the matrix is symmetrical", () => {
  for (const [key, rule] of index.pairs) {
    const reverse = index.pairs.get(`${rule.b}|${rule.a}`);
    assert.ok(reverse, `missing reverse of ${key}`);
    assert.equal(reverse.outcome, rule.outcome, `asymmetry at ${key}`);
    assert.equal(reverse.condition, rule.condition, `asymmetry at ${key}`);
  }
});

test("a single-pictogram pair produces its printed verdict", () => {
  assert.equal(evaluatePair(P_CORROSIVE, P_TOXIC, index).outcome, "conditional");
  assert.equal(evaluatePair(P_IRRITANT, P_OXIDISER, index).outcome, "conditional");
  assert.equal(evaluatePair(P_TOXIC, P_FLAMMABLE, index).outcome, "conditional");
  assert.equal(evaluatePair(P_IRRITANT, P_FLAMMABLE, index).outcome, "ok");
  assert.equal(evaluatePair(P_IRRITANT, P_EXPLOSIVE, index).outcome, "no");
});

test("comparison is order-independent", () => {
  const pairs = [
    [P_CORROSIVE, P_TOXIC],
    [P_IRRITANT, P_OXIDISER],
    [P_TOXIC, P_FLAMMABLE],
    [P_IRRITANT, P_EXPLOSIVE],
    [P_ENV, P_IRRITANT],
  ];
  for (const [a, b] of pairs) {
    assert.equal(
      evaluatePair(a, b, index).outcome,
      evaluatePair(b, a, index).outcome,
      `${a.id} vs ${b.id}`,
    );
  }
});

test("the most onerous pictogram pair wins", () => {
  const result = evaluatePair(P_MULTI, P_IRRITANT, index);
  assert.equal(result.outcome, "no");
  assert.equal(result.mostRestrictive, true);
  assert.ok(result.pairs.length > 1);
  assert.equal(OUTCOME_RANK.no > OUTCOME_RANK.conditional, true);
  assert.equal(OUTCOME_RANK.conditional > OUTCOME_RANK.ok, true);
});

test("conditional verdicts carry the general set and the specific O-n set", () => {
  const result = evaluatePair(P_TOXIC, P_FLAMMABLE, index);
  assert.equal(result.outcome, "conditional");
  const ids = result.conditions.map((c) => c.id);
  assert.ok(ids.includes("general"));
  assert.ok(ids.includes("O-3"));

  const corrosive = evaluatePair(P_CORROSIVE, P_TOXIC, index);
  assert.ok(corrosive.conditions.map((c) => c.id).includes("O-1"));

  const oxidiser = evaluatePair(P_IRRITANT, P_OXIDISER, index);
  assert.ok(oxidiser.conditions.map((c) => c.id).includes("O-2"));
});

test("X verdicts still carry the separation / segregation rule", () => {
  const result = evaluatePair(P_IRRITANT, P_EXPLOSIVE, index);
  assert.equal(result.outcome, "no");
  assert.ok(result.conditions.some((c) => c.id === "general"));
  const guidance = segregationGuidance(index);
  assert.equal(guidance.en.length, 2);
  assert.equal(guidance.bn.length, 2);
  assert.match(guidance.en.join(" "), /3 metres/);
});

test("gates block a verdict when the data cannot support one", () => {
  const noSds = product("P-NOSDS", ["GHS07"], { sdsAvailable: false });
  assert.equal(evaluatePair(noSds, P_IRRITANT, index).outcome, REVIEW_REQUIRED);
  assert.equal(evaluatePair(noSds, P_IRRITANT, index).gate.code, "no_sds");

  const review = product("P-REVIEW", ["GHS07"], {
    extractionStatus: "Manual Review Required",
  });
  assert.equal(evaluatePair(review, P_IRRITANT, index).gate.code, "manual_review");

  const empty = product("P-EMPTY", ["GHS07"], {
    hazardStatements: [],
    precautionary: [],
  });
  assert.equal(evaluatePair(empty, P_IRRITANT, index).gate.code, "incomplete_record");

  const override = product("P-OVERRIDE", ["GHS07"], {
    incompatibleMaterials: "Do not store with acids.",
  });
  const gated = evaluatePair(override, P_IRRITANT, index);
  assert.equal(gated.gate.code, "product_override");
  assert.equal(gated.gate.detail, "Do not store with acids.");
});

test("a product outside the matrix gets no restriction, not a verdict", () => {
  const result = evaluatePair(P_ENV, P_IRRITANT, index);
  assert.equal(result.outcome, NO_MATRIX_RESTRICTION);
  assert.equal(result.gate, null);
  assert.deepEqual(coveredPictograms(P_ENV, index), []);
  assert.deepEqual(coveredPictograms(P_IRRITANT, index), ["GHS07"]);

  assert.equal(
    evaluatePair(P_ENV, P_ENV, index).outcome,
    NO_MATRIX_RESTRICTION,
  );
});

test("gateForProduct reports the first blocking condition", () => {
  assert.equal(gateForProduct(P_IRRITANT), null);
  assert.equal(
    gateForProduct(product("X", [], { sdsAvailable: false })).code,
    "no_sds",
  );
  assert.equal(
    gateForProduct(product("X", [], { incompatibleMaterials: "Acids" })).code,
    "product_override",
  );
});

test("the picker filter requires every selected pictogram", () => {
  const mixed = product("P-MIXED", ["GHS02", "GHS08"]);
  assert.equal(carriesAllPictograms(mixed, ["GHS02"]), true);
  assert.equal(carriesAllPictograms(mixed, ["GHS02", "GHS08"]), true);
  assert.equal(carriesAllPictograms(mixed, ["GHS02", "GHS09"]), false);
  assert.equal(carriesAllPictograms(product("P-NONE", []), ["GHS02"]), false);
  assert.equal(carriesAllPictograms(product("P-NONE", []), []), true);
});

test("evaluateAgainstAll buckets every partner product", () => {
  const catalogue = [
    P_IRRITANT,
    P_EXPLOSIVE,
    P_OXIDISER,
    P_TOXIC,
    P_CORROSIVE,
    P_FLAMMABLE,
    P_MULTI,
    P_ENV,
    product("P-NOSDS", ["GHS07"], { sdsAvailable: false }),
  ];

  const guide = evaluateAgainstAll(P_IRRITANT, catalogue, index);
  const ids = (list) => list.map((entry) => entry.id).sort();

  assert.deepEqual(ids(guide.doNotStoreWith), ["P-EXPLOSIVE", "P-MULTI"]);
  assert.deepEqual(ids(guide.conditional), ["P-OXIDISER"]);
  assert.deepEqual(ids(guide.canStoreWith), ["P-CORROSIVE", "P-FLAMMABLE", "P-TOXIC"]);
  assert.deepEqual(ids(guide.noMatrixRestriction), ["P-ENV"]);
  assert.deepEqual(ids(guide.reviewRequired), ["P-NOSDS"]);
  assert.ok(!ids(guide.canStoreWith).includes("P-IRRITANT"), "self is excluded");
});

test("evaluateAgainstAll refuses to judge a product outside the matrix", () => {
  const guide = evaluateAgainstAll(P_ENV, [P_IRRITANT, P_TOXIC], index);
  assert.equal(guide.ownNoMatrix, true);
  assert.equal(guide.outcome, NO_MATRIX_RESTRICTION);
});

test("evaluateAgainstAll respects a product gate", () => {
  const noSds = product("P-NOSDS", ["GHS07"], { sdsAvailable: false });
  const guide = evaluateAgainstAll(noSds, [P_IRRITANT], index);
  assert.equal(guide.gate.code, "no_sds");
  assert.equal(guide.outcome, REVIEW_REQUIRED);
});
