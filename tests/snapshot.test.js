/* ============================================================
   WareSafe — snapshot contract tests
   The app treats a wrong-shaped dataset as no data, so the shape
   has to be checked before it ships.
   ============================================================ */

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const snapshot = JSON.parse(
  await readFile(new URL("../app/data/snapshot.json", import.meta.url), "utf8"),
);

const MATRIX_PICTOGRAMS = ["GHS01", "GHS02", "GHS03", "GHS05", "GHS06", "GHS07"];

test("snapshot has the schema version the app expects", () => {
  assert.equal(snapshot.version, 2);
  assert.equal(typeof snapshot.hash, "string");
  assert.match(snapshot.hash, /^[0-9a-f]{16}$/);
  assert.equal(typeof snapshot.generatedAt, "string");
});

test("counts agree with the arrays they describe", () => {
  assert.equal(snapshot.counts.products, snapshot.products.length);
  assert.equal(
    snapshot.counts.withSds,
    snapshot.products.filter((p) => p.sdsAvailable).length,
  );
  assert.equal(
    snapshot.counts.withoutSds,
    snapshot.products.filter((p) => !p.sdsAvailable).length,
  );
  assert.equal(snapshot.counts.matrixPairs, snapshot.matrix.pairs.length);
});

test("every product has the fields the screens read", () => {
  const ids = new Set();
  for (const product of snapshot.products) {
    assert.ok(product.id, "product id");
    assert.ok(!ids.has(product.id), `duplicate id ${product.id}`);
    ids.add(product.id);
    assert.ok(product.name, `${product.id} name`);
    assert.ok(Array.isArray(product.pictograms), `${product.id} pictograms`);
    assert.equal(typeof product.sdsAvailable, "boolean");
    assert.ok(product.firstAid && typeof product.firstAid === "object");
    assert.ok(!("storageClasses" in product), `${product.id} carries old storage classes`);
    assert.ok(!("flashpoint" in product), `${product.id} carries old flashpoint`);
  }
});

test("every pictogram a product carries has a definition", () => {
  const known = new Set(snapshot.pictograms.map((p) => p.code));
  for (const product of snapshot.products) {
    for (const code of product.pictograms) {
      assert.ok(known.has(code), `${product.id} uses undefined ${code}`);
    }
  }
});

test("the pictogram definitions match the matrix coverage", () => {
  assert.equal(snapshot.pictograms.length, 9);
  for (const pictogram of snapshot.pictograms) {
    assert.ok(pictogram.code);
    assert.ok(pictogram.sign);
    assert.ok(pictogram.hazard);
    assert.equal(
      pictogram.inMatrix,
      MATRIX_PICTOGRAMS.includes(pictogram.code),
      `${pictogram.code} inMatrix flag`,
    );
  }
});

test("the matrix carries exactly the six chart pictograms", () => {
  assert.deepEqual(
    [...snapshot.matrix.pictograms].sort(),
    [...MATRIX_PICTOGRAMS].sort(),
  );
});

test("the matrix has 36 directed pairs (21 unique, symmetrical)", () => {
  assert.equal(snapshot.matrix.pairs.length, 36);

  const keys = new Set();
  for (const pair of snapshot.matrix.pairs) {
    const key = `${pair.a}|${pair.b}`;
    assert.ok(!keys.has(key), `duplicate pair ${key}`);
    keys.add(key);
    assert.ok(MATRIX_PICTOGRAMS.includes(pair.a));
    assert.ok(MATRIX_PICTOGRAMS.includes(pair.b));
    assert.ok(["ok", "conditional", "no"].includes(pair.outcome));
    if (pair.outcome === "conditional") {
      assert.ok(pair.condition, `${key} has no condition set`);
      assert.ok(
        snapshot.matrix.conditions[pair.condition],
        `${key} references missing ${pair.condition}`,
      );
    } else {
      assert.equal(pair.condition, null);
    }
  }
});

test("the matrix conditions are complete in both languages", () => {
  const conditions = snapshot.matrix.conditions;
  for (const id of ["general", "O-1", "O-2", "O-3"]) {
    const condition = conditions[id];
    assert.ok(condition, `missing condition set ${id}`);
    assert.ok(Array.isArray(condition.en) && condition.en.length > 0);
    assert.ok(Array.isArray(condition.bn) && condition.bn.length > 0);
    assert.equal(condition.en.length, condition.bn.length, `${id} parity`);
  }
  for (const id of ["O-1", "O-2", "O-3"]) {
    assert.ok(conditions[id].title.en, `${id} English title`);
    assert.ok(conditions[id].title.bn, `${id} Bangla title`);
  }
});

test("condition highlights are balanced in both languages", () => {
  for (const [id, condition] of Object.entries(snapshot.matrix.conditions)) {
    for (const lang of ["en", "bn"]) {
      for (const item of condition[lang] || []) {
        const markers = (item.match(/\*\*/g) || []).length;
        assert.equal(markers % 2, 0, `${id}/${lang} has unbalanced ** markers`);
      }
    }
  }
});

test("the matrix carries its source and guidance", () => {
  assert.match(snapshot.matrix.source, /75_59_01/);
  assert.ok(snapshot.matrix.readingRule.en);
  assert.ok(snapshot.matrix.readingRule.bn);
  assert.ok(snapshot.matrix.operationalNote.en);
  assert.ok(Array.isArray(snapshot.matrix.references));
  assert.ok(snapshot.matrix.references.length >= 5);
});

test("contacts carry a role and a number", () => {
  assert.ok(snapshot.contacts.length > 0);
  for (const contact of snapshot.contacts) {
    assert.ok(contact.role, "contact role");
    assert.ok(contact.name || contact.phone, "contact name or phone");
  }
});
