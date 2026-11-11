/* ============================================================
   WareSafe — UI primitives
   Small, dependency-free helpers for building DOM safely.

   Rule: any text that can come from the dataset is written with
   textContent. innerHTML is never used for data, only for the
   constant icon markup in icons.js.
   ============================================================ */

import { icon } from "./icons.js";

/**
 * Create an element.
 * @param {string} tag
 * @param {string} className
 * @param {string} text  optional text content
 */
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

/** Remove every child of a node. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/**
 * Render text that may contain **highlighted** spans. The markers are
 * authored in the dataset, so the important numbers and instructions
 * are chosen by HSE, not guessed by a regex. Returns a fragment built
 * with textContent only — no innerHTML, no injection path.
 */
export function richText(value) {
  const fragment = document.createDocumentFragment();
  const parts = String(value || "").split(/\*\*(.+?)\*\*/g);
  parts.forEach((part, index) => {
    if (!part) return;
    if (index % 2 === 1) {
      const mark = document.createElement("strong");
      mark.className = "hl";
      mark.textContent = part;
      fragment.appendChild(mark);
    } else {
      fragment.appendChild(document.createTextNode(part));
    }
  });
  return fragment;
}

/** A single line of text. */
export function text(tag, className, value) {
  return el(tag, className, value);
}

/** An icon element with an optional accessible label. */
export function iconEl(name, className, label) {
  const svg = icon(name, className);
  if (label) {
    const wrap = el("span", "sr-only", label);
    svg.appendChild(wrap);
  }
  return svg;
}

/**
 * The nine known GHS pictogram asset names. Nothing else may be built into
 * a path, because the code comes from a sheet cell.
 */
const PICTOGRAM_ASSET = /^ghs0[1-9]$/;

/**
 * A GHS pictogram. The asset is a static SVG file; it is loaded as
 * an image so the browser caches it and it stays out of the DOM.
 */
export function pictogramEl(code, size) {
  const asset = `ghs${String(code || "").replace(/\D/g, "")}`;
  if (!PICTOGRAM_ASSET.test(asset)) {
    // A code that is not one of the nine known pictograms gets an empty
    // placeholder instead of an image, so no sheet value reaches the path.
    return el("span", `pictogram pictogram--empty${size === "sm" ? " pictogram--sm" : ""}${size === "lg" ? " pictogram--lg" : ""}`);
  }
  const img = el("img", "pictogram");
  img.src = `./assets/pictograms/${asset}.svg`;
  img.alt = "";
  img.loading = "lazy";
  img.decoding = "async";
  if (size === "sm") img.classList.add("pictogram--sm");
  if (size === "lg") img.classList.add("pictogram--lg");
  img.dataset.code = code;
  return img;
}

/** A grouped inset list. */
export function listGroup() {
  return el("div", "list-group");
}

/** A plain, non-interactive row. */
export function infoRow(label, value) {
  const row = el("div", "list-row");
  const body = el("div", "list-row__body");
  body.appendChild(el("div", "list-row__label", label));
  row.appendChild(body);
  if (value) row.appendChild(el("div", "list-row__value", value));
  return row;
}

/** An empty-state block. */
export function emptyState(iconName, titleKey, bodyKey) {
  const wrap = el("div", "empty");
  wrap.appendChild(iconEl(iconName, "empty__icon"));
  wrap.appendChild(el("div", "empty__title", titleKey));
  if (bodyKey) wrap.appendChild(el("div", "empty__body", bodyKey));
  return wrap;
}

/** A chip. */
export function chip(textValue, variant) {
  return el("span", `chip${variant ? ` chip--${variant}` : ""}`, textValue);
}

/* ---------------------------------------------------------------
   Content lists
   Long SDS free text is broken into scannable lists: numbered steps
   for a sequence of actions, bullets for a set of items.
   --------------------------------------------------------------- */

/**
 * Split a run-on safety sentence into numbered steps. Semicolons, sentence
 * periods (English) and dandas (Bangla) separate the steps.
 */
export function splitSteps(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  return raw
    .split(/\s*;\s*|\s*\.\s+(?=[A-Z0-9\u0980-\u09FF])|\s*।\s*/)
    .map((s) => s.replace(/[.;।]\s*$/, "").trim())
    .filter(Boolean);
}

/** Split text into lines for a bulleted list. */
export function splitLines(text) {
  return String(text || "")
    .split(/\s*[\n;]\s*/)
    .map((s) => s.replace(/[.;।]\s*$/, "").trim())
    .filter(Boolean);
}

/** Render a numbered list of steps. */
export function numberedList(items) {
  const wrap = el("div", "steps");
  items.forEach((item, i) => {
    const row = el("div", "step");
    row.appendChild(el("div", "step__index", String(i + 1)));
    const body = el("div", "step__body");
    body.appendChild(el("div", "t-body", item));
    row.appendChild(body);
    wrap.appendChild(row);
  });
  return wrap;
}

/** Render a bulleted list. */
export function bulletList(items) {
  const wrap = el("div", "bullets");
  for (const item of items) {
    wrap.appendChild(el("div", "bullet", item));
  }
  return wrap;
}

/* ---------------------------------------------------------------
   Bottom sheet
   --------------------------------------------------------------- */

let sheetOpen = false;
let lastFocused = null;

function sheetRefs() {
  return {
    sheet: document.getElementById("sheet"),
    backdrop: document.getElementById("sheet-backdrop"),
    body: document.getElementById("sheet-body"),
    title: document.getElementById("sheet-title"),
    close: document.getElementById("sheet-close"),
  };
}

export function openSheet(title, content) {
  const refs = sheetRefs();
  if (!refs.sheet) return;
  lastFocused = document.activeElement;

  refs.title.textContent = title;
  clear(refs.body);
  refs.body.appendChild(content);
  refs.sheet.hidden = false;
  refs.backdrop.hidden = false;

  // Force a reflow so the transition runs from the closed position.
  void refs.sheet.offsetHeight;
  refs.sheet.classList.add("is-open");
  refs.backdrop.classList.add("is-open");
  sheetOpen = true;
  document.body.classList.add("is-locked");

  refs.close.replaceChildren(iconEl("close"));
  refs.close.setAttribute("aria-label", "Close");
  refs.close.focus();
}

export function closeSheet() {
  const refs = sheetRefs();
  if (!refs.sheet || !sheetOpen) return;
  refs.sheet.classList.remove("is-open");
  refs.backdrop.classList.remove("is-open");
  document.body.classList.remove("is-locked");
  sheetOpen = false;
  window.setTimeout(() => {
    if (sheetOpen) return;
    refs.sheet.hidden = true;
    refs.backdrop.hidden = true;
    clear(refs.body);
  }, 320);
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

export function isSheetOpen() {
  return sheetOpen;
}

/* ---------------------------------------------------------------
   Feedback
   --------------------------------------------------------------- */

/** Announce a message to screen readers. */
export function announce(message) {
  const region = document.getElementById("live-region");
  if (!region) return;
  region.textContent = "";
  window.setTimeout(() => {
    region.textContent = message;
  }, 30);
}

/**
 * Ask the shell to re-render the current screen.
 * Used when a screen changes its own state, such as the language
 * switch or a selected exposure route.
 */
export function rerender() {
  window.dispatchEvent(new Event("waresafe:rerender"));
}

/** Haptic patterns, matching the motion tokens. */
export const HAPTIC = {
  tap: 10,
  select: [8, 30, 8],
  success: [12, 50, 12],
  warn: [24, 70, 24],
  alert: [30, 70, 30, 70, 30],
};

/**
 * Resolve a haptic request to the value the Vibration API expects.
 *
 * A name ("tap", "select") is looked up in HAPTIC. A number or an
 * array is passed through unchanged. Anything else resolves to null,
 * because navigator.vibrate only accepts a duration or a pattern of
 * durations, and a wrong value silently does nothing.
 *
 * @param {string|number|number[]} pattern
 * @returns {number|number[]|null}
 */
export function resolveHaptic(pattern) {
  if (typeof pattern === "string") {
    const found = HAPTIC[pattern];
    return found === undefined ? null : found;
  }
  if (typeof pattern === "number" && Number.isFinite(pattern)) return pattern;
  if (Array.isArray(pattern) && pattern.every((n) => typeof n === "number")) {
    return pattern;
  }
  return null;
}

/**
 * Fire a haptic pattern.
 *
 * @param {string|number|number[]} pattern - a HAPTIC name, a duration
 *   in milliseconds, or a full pattern array.
 */
export function haptic(pattern) {
  const resolved = resolveHaptic(pattern);
  if (resolved === null) return;
  try {
    if (navigator.vibrate) navigator.vibrate(resolved);
  } catch (err) {
    /* not supported: ignore */
  }
}

/* ---------------------------------------------------------------
   Formatting
   --------------------------------------------------------------- */

/** Format an ISO timestamp as a short, readable date-time. */
export function formatDateTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}
