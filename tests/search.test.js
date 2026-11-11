/* ============================================================
   WareSafe — search tests
   The search must answer a name, a code or a product category, so
   an assistant can type "Herbicide" and get the herbicides.
   ============================================================ */

import test from "node:test";
import assert from "node:assert/strict";

import { searchProductsIn } from "../app/src/store.js";

const products = [
  { id: "P1", name: "Karate 2.5 EC", productType: "Insecticide" },
  { id: "P2", name: "Score 250 EC", productType: "Fungicide" },
  { id: "P3", name: "Rifit 500 EC", productType: "Herbicide" },
  { id: "P4", name: "Axial 50 EC", productType: "Herbicide" },
  { id: "P5", name: "Cultar 250 SC", productType: "Plant growth regulator" },
  { id: "P6", name: "Herbicide Master", productType: "Fungicide" },
  { id: "P8", name: "Super Herbicide", productType: "Fungicide" },
  { id: "P7", name: "No Type Product" },
];

const ids = (list) => list.map((p) => p.id).sort();

test("a category query lists every product of that type", () => {
  assert.deepEqual(ids(searchProductsIn(products, "Herbicide")), [
    "P3",
    "P4",
    "P6",
    "P8",
  ]);
  assert.deepEqual(ids(searchProductsIn(products, "Fungicide")), [
    "P2",
    "P6",
    "P8",
  ]);
  assert.deepEqual(ids(searchProductsIn(products, "Insecticide")), ["P1"]);
  assert.deepEqual(ids(searchProductsIn(products, "Plant growth regulator")), [
    "P5",
  ]);
});

test("category search is case-insensitive and accepts a prefix", () => {
  assert.deepEqual(ids(searchProductsIn(products, "herbicide")), [
    "P3",
    "P4",
    "P6",
    "P8",
  ]);
  assert.deepEqual(ids(searchProductsIn(products, "herb")), [
    "P3",
    "P4",
    "P6",
    "P8",
  ]);
  assert.deepEqual(ids(searchProductsIn(products, "FUNGI")), [
    "P2",
    "P6",
    "P8",
  ]);
});

test("an exact product name ranks first", () => {
  const result = searchProductsIn(products, "Herbicide Master");
  assert.equal(result[0].id, "P6");
});

test("ranking: name prefix > type match > name containing the word", () => {
  const positions = searchProductsIn(products, "Herbicide").map((p) => p.id);
  // "Herbicide Master" starts with the query, so it ranks first.
  assert.equal(positions[0], "P6");
  // The herbicides (type match) rank above "Super Herbicide" (name only).
  assert.ok(positions.indexOf("P3") < positions.indexOf("P8"));
  assert.ok(positions.indexOf("P4") < positions.indexOf("P8"));
});

test("an empty query returns the whole catalogue", () => {
  assert.equal(searchProductsIn(products, "").length, products.length);
  assert.equal(searchProductsIn(products, "   ").length, products.length);
});

test("an unknown query returns nothing", () => {
  assert.deepEqual(searchProductsIn(products, "zzzz"), []);
});

test("a missing product type does not break the search", () => {
  assert.deepEqual(ids(searchProductsIn(products, "No Type")), ["P7"]);
});
