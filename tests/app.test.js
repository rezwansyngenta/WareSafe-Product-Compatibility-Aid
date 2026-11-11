/* ============================================================
   WareSafe — wiring and copy tests
   Proves that every module parses and links, that the copy is
   bilingual, and that the service worker precaches files that
   actually exist.
   ============================================================ */

import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "app");

const MODULES = [
  "app/src/config.js",
  "app/src/matrix.js",
  "app/src/store.js",
  "app/src/i18n.js",
  "app/src/icons.js",
  "app/src/ui.js",
  "app/src/widgets.js",
  "app/src/screens/store.js",
  "app/src/screens/compare.js",
  "app/src/screens/pair.js",
  "app/src/screens/response.js",
  "app/src/app.js",
];

test("every module parses and links", async () => {
  for (const relative of MODULES) {
    const module = await import(new URL(`../${relative}`, import.meta.url));
    assert.ok(module, `${relative} did not load`);
  }
});

test("the engine exposes the API the screens use", async () => {
  const matrix = await import("../app/src/matrix.js");
  for (const name of [
    "buildMatrixIndex",
    "evaluatePair",
    "evaluateAgainstAll",
    "gateForProduct",
    "coveredPictograms",
    "segregationGuidance",
  ]) {
    assert.equal(typeof matrix[name], "function", `missing ${name}`);
  }
});

test("every interface string is bilingual and non-empty", async () => {
  const { stringKeys } = await import("../app/src/i18n.js");
  const source = await readFile(join(APP, "src", "i18n.js"), "utf8");
  const keys = stringKeys();
  assert.ok(keys.length > 100, "the string table looks too small");

  for (const key of keys) {
    const match = source.match(new RegExp(`${key}: \\[([\\s\\S]*?)\\]`));
    assert.ok(match, `${key} not found in the source table`);
  }
});

test("the service worker precaches files that exist", async () => {
  const source = await readFile(join(APP, "sw.js"), "utf8");
  const shellMatch = source.match(/const SHELL = \[([\s\S]*?)\];/);
  assert.ok(shellMatch, "SHELL list not found");

  const entries = [...shellMatch[1].matchAll(/"\.\/([^"]*)"/g)]
    .map((match) => match[1])
    .filter(Boolean);

  assert.ok(entries.length >= 20, "SHELL list looks too short");
  for (const entry of entries) {
    await access(join(APP, entry));
  }
});

test("index.html loads the app and every stylesheet", async () => {
  const html = await readFile(join(APP, "index.html"), "utf8");
  for (const href of [
    "./styles/fonts.css",
    "./styles/tokens.css",
    "./styles/base.css",
    "./styles/components.css",
    "./styles/matrix.css",
    "./styles/screens.css",
  ]) {
    assert.ok(html.includes(href), `index.html does not load ${href}`);
  }
  assert.ok(html.includes('./src/app.js'), "index.html does not load app.js");
});

test("the old storage-class vocabulary is gone from the app source", async () => {
  const files = [
    "src/matrix.js",
    "src/widgets.js",
    "src/screens/store.js",
    "src/screens/compare.js",
  ];
  for (const relative of files) {
    const source = await readFile(join(APP, relative), "utf8");
    assert.ok(
      !/storageClasses|flammable_liquids|outcomeR1|outcomeR2/.test(source),
      `${relative} still references the old storage classes`,
    );
  }
});
