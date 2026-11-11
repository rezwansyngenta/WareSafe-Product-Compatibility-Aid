/* ============================================================
   WareSafe — application shell
   Boots the store, renders the tab bar and routes between the
   three screens. All routing is hash based so the app works
   from a file server, a subdirectory, or offline.
   ============================================================ */

import { initLang, t } from "./i18n.js";
import {
  clear,
  closeSheet,
  el,
  iconEl,
  isSheetOpen,
  announce,
} from "./ui.js";
import { getState, initStore, isReady, subscribe } from "./store.js";
import * as storeScreen from "./screens/store.js";
import * as compareScreen from "./screens/compare.js";
import * as pairScreen from "./screens/pair.js";
import * as responseScreen from "./screens/response.js";

const SCREENS = {
  store: storeScreen,
  compare: compareScreen,
  pair: pairScreen,
  response: responseScreen,
};

const TABS = [
  { id: "store", icon: "drum", label: "store" },
  { id: "compare", icon: "drums", label: "compare" },
  { id: "response", icon: "phone", label: "response" },
];

let currentRoute = { name: "store" };
let lastRouteKey = null;

/* Scroll offsets per route, so a mobile back gesture returns to the
   exact place in the list the assistant left. */
const scrollPositions = new Map();
let restoringScroll = false;

/* ---------------------------------------------------------------
   Boot
   --------------------------------------------------------------- */

async function boot() {
  initLang();
  registerServiceWorker();
  wireSheet();
  renderTabs();

  /* Subscribe before loading the dataset: the store announces its
     state as soon as it has one, and a listener registered after
     that point would miss it and leave the screen on "Loading". */
  subscribe(() => render());
  render();
  wireScrollMemory();

  await initStore();

  if (!isReady()) {
    announce(t("dataUnavailable"));
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js", { scope: "./", updateViaCache: "none" })
      .catch((err) => {
        console.warn("WareSafe service worker registration failed", err);
      });
  });
}

function wireSheet() {
  const backdrop = document.getElementById("sheet-backdrop");
  const close = document.getElementById("sheet-close");
  if (backdrop) backdrop.addEventListener("click", closeSheet);
  if (close) close.addEventListener("click", closeSheet);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isSheetOpen()) closeSheet();
  });
}

/* ---------------------------------------------------------------
   Tab bar
   --------------------------------------------------------------- */

function renderTabs() {
  const bar = document.getElementById("tabbar");
  if (!bar) return;
  clear(bar);
  for (const tab of TABS) {
    const button = el("button", "tabbar__item");
    button.type = "button";
    button.setAttribute("aria-label", t(tab.label));
    button.appendChild(iconEl(tab.icon, "tabbar__icon"));
    button.appendChild(el("span", "tabbar__label", t(tab.label)));
    button.addEventListener("click", () => {
      navigate(tab.id);
    });
    bar.appendChild(button);
  }
  updateTabs(currentRoute.name);
}

function updateTabs(active) {
  const bar = document.getElementById("tabbar");
  if (!bar) return;
  const buttons = bar.querySelectorAll(".tabbar__item");
  TABS.forEach((tab, index) => {
    const button = buttons[index];
    if (!button) return;
    /* The tab label is set once at boot, so a language switch has to
       re-name it here or the bar stays in the old language. */
    const label = button.querySelector(".tabbar__label");
    if (label) label.textContent = t(tab.label);
    button.setAttribute("aria-label", t(tab.label));
    if (tab.id === active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

/* ---------------------------------------------------------------
   Routing
   --------------------------------------------------------------- */

function parseRoute() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const parts = raw.split("/").filter(Boolean);
  if (!parts.length) return { name: "store" };
  switch (parts[0]) {
    case "compare":
      return { name: "compare", a: parts[1] || "", b: parts[2] || "" };
    case "pair":
      return { name: "pair", a: parts[1] || "", b: parts[2] || "" };
    case "response":
      return { name: "response", id: parts[1] || "" };
    case "store":
    default:
      return { name: "store", id: parts[1] || "" };
  }
}

export function navigate(path) {
  const next = `#/${String(path).replace(/^#?\/?/, "")}`;
  if (window.location.hash === next) render();
  else window.location.hash = next;
}

function render() {
  const route = parseRoute();
  currentRoute = route;
  updateTabs(route.name);

  const view = document.getElementById("view");
  if (!view) return;

  const body = document.querySelector(".app__body");

  /* Save where the assistant was before the content changes. */
  if (body && lastRouteKey) {
    scrollPositions.set(lastRouteKey, body.scrollTop);
  }

  /* A new screen starts where it was left. The first visit starts at
     the top; coming back from a pair view restores the exact offset. */
  const routeKey = `${route.name}|${route.a || ""}|${route.b || ""}|${route.id || ""}`;
  const sameRoute = routeKey === lastRouteKey;
  lastRouteKey = routeKey;

  restoringScroll = true;
  clear(view);

  if (!isReady()) {
    view.appendChild(loadingOrUnavailable());
  } else {
    const screen = SCREENS[route.name] || SCREENS.store;
    const container = el("div", "screen");
    view.appendChild(container);
    screen.render(container, route);
  }

  if (!sameRoute && body) {
    body.scrollTop = scrollPositions.get(routeKey) || 0;
  }
  restoringScroll = false;
}

/**
 * Remember the scroll offset of the current route. Ignored while a
 * render is restoring a position, so a content swap cannot overwrite
 * the saved offset with a clamped value.
 */
function wireScrollMemory() {
  const body = document.querySelector(".app__body");
  if (!body) return;
  body.addEventListener(
    "scroll",
    () => {
      if (restoringScroll) return;
      if (lastRouteKey) scrollPositions.set(lastRouteKey, body.scrollTop);
    },
    { passive: true },
  );
}

function loadingOrUnavailable() {
  const wrap = el("div", "screen");
  const card = el("div", "card");
  card.style.marginTop = "24px";

  const state = getState();
  if (state.status === "loading") {
    card.appendChild(el("div", "t-headline", t("loading")));
    const bar = el("div", "skeleton");
    bar.style.height = "12px";
    bar.style.marginTop = "12px";
    card.appendChild(bar);
  } else {
    card.appendChild(el("div", "t-headline", t("dataUnavailable")));
    const retry = el("button", "btn btn--primary", t("retry"));
    retry.type = "button";
    retry.style.marginTop = "16px";
    retry.addEventListener("click", async () => {
      await initStore();
      render();
    });
    card.appendChild(retry);
  }
  wrap.appendChild(card);
  return wrap;
}

/* ---------------------------------------------------------------
   Lifecycle
   --------------------------------------------------------------- */

/* Listeners are registered in a browser only: this module is also imported
   by the test suite, which must be able to load it outside a DOM. */
if (typeof window !== "undefined") {
  window.addEventListener("hashchange", render);
  window.addEventListener("waresafe:rerender", render);
}

/* Boot only in a browser: the module is imported by the test suite to
   prove that every source file parses and links cleanly. */
if (typeof document !== "undefined") {
  boot();
}
