/* ============================================================
   WareSafe — data store
   Owns the one dataset the whole app reads from.

   Order of preference:
     1. the cached copy in localStorage (instant, works offline)
     2. the bundled snapshot shipped with the app

   There is no server. The dataset is part of the release, so an
   update is a new deployment of the app.
   ============================================================ */

import { BUNDLED_SNAPSHOT, KEYS, SNAPSHOT_VERSION } from "./config.js";
import { buildMatrixIndex } from "./matrix.js";

const state = {
  status: "loading", // loading | ready | unavailable
  snapshot: null,
  matrixIndex: new Map(),
  productsById: new Map(),
  source: "none", // cache | bundle
  error: null,
};

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) {
    try {
      fn(state);
    } catch (err) {
      console.error("WareSafe store listener failed", err);
    }
  }
}

export function getState() {
  return state;
}

export function isReady() {
  return state.status === "ready" && Boolean(state.snapshot);
}

/* ---------------------------------------------------------------
   Bootstrap
   --------------------------------------------------------------- */

export async function initStore() {
  const cached = readCache();
  if (cached) {
    applySnapshot(cached, "cache");
    state.status = "ready";
    emit();
    return state;
  }

  const bundled = await loadBundled();
  if (bundled) {
    applySnapshot(bundled, "bundle");
    state.status = "ready";
    emit();
  } else {
    state.status = "unavailable";
    state.error = "No dataset available.";
    emit();
  }
  return state;
}

async function loadBundled() {
  try {
    const response = await fetch(BUNDLED_SNAPSHOT, { cache: "no-cache" });
    if (!response.ok) return null;
    const data = await response.json();
    return isUsableSnapshot(data) ? data : null;
  } catch (err) {
    return null;
  }
}

/* ---------------------------------------------------------------
   Cache
   --------------------------------------------------------------- */

function readCache() {
  try {
    const raw = localStorage.getItem(KEYS.snapshot);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return isUsableSnapshot(data) ? data : null;
  } catch (err) {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(KEYS.snapshot, JSON.stringify(data));
  } catch (err) {
    /* storage full or blocked: the app still works from memory */
  }
}

/**
 * A snapshot is usable only if it matches the schema this build
 * understands. A version mismatch is treated as no data at all,
 * because a wrong-shaped dataset is more dangerous than none.
 */
export function isUsableSnapshot(data) {
  if (!data || typeof data !== "object") return false;
  if (data.version !== SNAPSHOT_VERSION) return false;
  if (!Array.isArray(data.products)) return false;
  if (!data.matrix || !Array.isArray(data.matrix.pairs)) return false;
  if (!Array.isArray(data.pictograms)) return false;
  return true;
}

/* ---------------------------------------------------------------
   Apply
   --------------------------------------------------------------- */

function applySnapshot(data, source) {
  state.snapshot = data;
  state.source = source;
  state.productsById = new Map();
  for (const product of data.products) {
    state.productsById.set(product.id, product);
  }
  state.matrixIndex = buildMatrixIndex(data.matrix);
  writeCache(data);
}

/* ---------------------------------------------------------------
   Accessors
   --------------------------------------------------------------- */

export function getProducts() {
  return state.snapshot ? state.snapshot.products : [];
}

export function getProduct(id) {
  return state.productsById.get(id) || null;
}

export function getMatrixIndex() {
  return state.matrixIndex;
}

export function getMatrix() {
  return state.snapshot ? state.snapshot.matrix : null;
}

export function getPictograms() {
  return state.snapshot ? state.snapshot.pictograms : [];
}

export function getPictogram(code) {
  return getPictograms().find((p) => p.code === code) || null;
}

export function getContacts() {
  return state.snapshot && Array.isArray(state.snapshot.contacts)
    ? state.snapshot.contacts
    : [];
}

export function getGeneratedAt() {
  return state.snapshot ? state.snapshot.generatedAt : null;
}

/* ---------------------------------------------------------------
   Recently viewed products
   --------------------------------------------------------------- */

/** Product ids the assistant opened most recently, newest first. */
export function getRecentIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEYS.recent) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch (err) {
    return [];
  }
}

/** Record that a product was opened, keeping the list short. */
export function recordRecent(id) {
  try {
    const ids = getRecentIds().filter((x) => x !== id);
    ids.unshift(id);
    localStorage.setItem(KEYS.recent, JSON.stringify(ids.slice(0, 6)));
  } catch (err) {
    /* private mode: recents simply do not persist */
  }
}

/* ---------------------------------------------------------------
   Search
   --------------------------------------------------------------- */

function normalise(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/**
 * Find products by name, warehouse name variant, product type, design
 * code or material number. Typing a category such as "Herbicide"
 * lists every product of that type; exact code matches rank before
 * name matches.
 *
 * @param {string} query
 * @param {number} limit
 */
export function searchProducts(query, limit) {
  const list = searchProductsIn(getProducts(), query);
  return limit ? list.slice(0, limit) : list;
}

/**
 * The search itself, with no dependency on the loaded dataset, so it
 * can be tested against a fixed list.
 *
 * @param {Array} products
 * @param {string} query
 */
export function searchProductsIn(products, query) {
  const q = String(query || "").trim();
  if (!q) return products || [];
  const needle = q.toUpperCase();
  const needleTight = normalise(q);
  const hits = [];

  for (const product of products || []) {
    let score = 0;
    const names = [product.name, ...(product.nameVariants || [])];
    for (const name of names) {
      const upper = String(name || "").toUpperCase();
      if (upper === needle) score = Math.max(score, 100);
      else if (upper.startsWith(needle)) score = Math.max(score, 80);
      else if (upper.includes(needle)) score = Math.max(score, 60);
    }
    if (product.designCode && product.designCode.toUpperCase() === needle) {
      score = Math.max(score, 95);
    } else if (
      product.designCode &&
      normalise(product.designCode) === needleTight
    ) {
      score = Math.max(score, 92);
    } else if (
      product.designCode &&
      product.designCode.toUpperCase().includes(needle)
    ) {
      score = Math.max(score, 50);
    }
    if (product.materialNumber && product.materialNumber === q.trim()) {
      score = Math.max(score, 95);
    } else if (
      product.materialNumber &&
      product.materialNumber.includes(q.trim())
    ) {
      score = Math.max(score, 50);
    }

    /* A category query ("Herbicide", "Fungicide", "herb") lists every
       product of that type. It ranks below an exact name but above no
       match at all. */
    const type = String(product.productType || "").toUpperCase();
    if (type) {
      if (type === needle) score = Math.max(score, 70);
      else if (type.startsWith(needle)) score = Math.max(score, 66);
      else if (type.includes(needle)) score = Math.max(score, 55);
    }

    if (score > 0) hits.push({ product, score });
  }

  hits.sort(
    (a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name),
  );
  return hits.map((h) => h.product);
}
