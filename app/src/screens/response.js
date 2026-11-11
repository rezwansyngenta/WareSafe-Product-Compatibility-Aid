/* ============================================================
   WareSafe — Response screen
   Answers: what should I do now if someone has been exposed?

   The action comes first. The exact SDS wording sits directly
   underneath it in Bangla with the English reference, and the
   emergency escalation is always visible.
   ============================================================ */

import { t, contentText } from "../i18n.js";
import {
  el,
  iconEl,
  listGroup,
  rerender,
  haptic,
  splitSteps,
} from "../ui.js";
import {
  largeTitle,
  productHero,
  quickProductSearch,
  reviewNotice,
  topBar,
} from "../widgets.js";
import { getContacts, getProduct } from "../store.js";

const ROUTES = [
  { id: "general", key: "generalAdvice", wide: true },
  { id: "inhalation", key: "ifInhaled" },
  { id: "skin", key: "skinContact" },
  { id: "eye", key: "eyeContact" },
  { id: "swallowed", key: "ifSwallowed" },
];

const ROUTE_ICONS = {
  general: "info",
  inhalation: "breath",
  skin: "drop",
  eye: "eye",
  swallowed: "drink",
};

const ROLE_KEYS = {
  "Site emergency number": "nationalEmergency",
  "Fire Brigade": "fireBrigade",
  Hospital: "hospital",
  Police: "police",
  Ambulance: "ambulance",
  "Local authority": "localAuthority",
  Government: "government",
  Army: "army",
};

/** The exposure route shown per product, so switching products keeps
 *  the user's context. */
const routeByProduct = new Map();

export function render(container, route) {
  container.appendChild(
    topBar({
      onLang: () => rerender(),
    }),
  );

  container.appendChild(largeTitle("response", "responseGuidance"));

  const product = route.id ? getProduct(route.id) : null;

  if (!product) {
    /* The product search comes first: 999 is common knowledge, but the
       right first-aid text is not. The emergency number stays one
       screen below and is repeated on every product page. */
    container.appendChild(
      quickProductSearch({
        onSelect: (chosen) => {
          window.location.hash = `#/response/${chosen.id}`;
        },
      }),
    );
    container.appendChild(escalationBlock());
    container.appendChild(emergencyBlock());
    return;
  }

  container.appendChild(productHero(product));

  if (!product.sdsAvailable) {
    container.appendChild(reviewNotice("noSdsOnFile"));
    container.appendChild(el("div", "card", t("firstAidUnavailable")));
    container.appendChild(escalationBlock());
    container.appendChild(emergencyBlock());
    return;
  }

  const firstAid = product.firstAid || {};
  const active =
    routeByProduct.get(product.id) ||
    (firstAid.general && firstAid.general.en ? "general" : firstRoute(firstAid));

  container.appendChild(routePicker(product, active));

  /* The action for the chosen route comes first, numbered and bilingual. */
  const fa = firstAid[active] || {};
  const action = el("div", "action");
  action.appendChild(el("div", "action__heading", t(routeKey(active))));
  if (firstAidSteps(fa).length) {
    action.appendChild(stepList(fa, true));
  } else {
    action.appendChild(el("div", "t-body", t("firstAidUnavailable")));
  }
  container.appendChild(action);

  /* The emergency number follows the action, not the other way round:
     the assistant needs the first-aid step first. */
  container.appendChild(escalationBlock());

  if (active !== "general" && firstAid.general && firstAid.general.en) {
    container.appendChild(firstAidCard("generalAdvice", firstAid.general));
  }
  if (firstAid.symptoms && firstAid.symptoms.en) {
    container.appendChild(firstAidCard("symptomsEffects", firstAid.symptoms));
  }
  if (firstAid.medical && firstAid.medical.en) {
    container.appendChild(firstAidCard("immediateMedical", firstAid.medical));
  }

  container.appendChild(emergencyBlock());
}

/* ---------------------------------------------------------------
   Numbered first-aid steps
   --------------------------------------------------------------- */

/** The first-aid steps for one route, in the active language. */
function firstAidSteps(fa) {
  return splitSteps(contentText(fa && fa.bn, fa && fa.en));
}

/**
 * Render steps as a numbered list. The urgent variant uses the red
 * emergency index; the plain variant uses a neutral index for the
 * informational sections below the action.
 */
function stepList(fa, urgent) {
  const steps = firstAidSteps(fa);
  const wrap = el("div", urgent ? "action__steps" : "steps");
  steps.forEach((step, i) => {
    const row = el("div", urgent ? "action__step" : "step");
    row.appendChild(
      el("div", urgent ? "action__index" : "step__index", String(i + 1)),
    );
    const body = el("div", urgent ? "action__text" : "step__body");
    body.appendChild(el("div", "t-body", step));
    row.appendChild(body);
    wrap.appendChild(row);
  });
  return wrap;
}

function firstAidCard(titleKey, fa) {
  const card = el("div", "card");
  card.appendChild(el("div", "t-title3", t(titleKey)));
  card.appendChild(stepList(fa, false));
  return card;
}

/* ---------------------------------------------------------------
   Route picker
   --------------------------------------------------------------- */

function routeKey(routeId) {
  const found = ROUTES.find((r) => r.id === routeId);
  return found ? found.key : "generalAdvice";
}

function firstRoute(firstAid) {
  const found = ROUTES.find(
    (r) => firstAid[r.id] && (firstAid[r.id].en || "").trim(),
  );
  return found ? found.id : "general";
}

function routePicker(product, active) {
  const grid = el("div", "response__routes");
  for (const route of ROUTES) {
    const button = el("button", `route${route.wide ? " route--wide" : ""}`);
    button.type = "button";
    button.setAttribute("aria-pressed", route.id === active ? "true" : "false");
    button.appendChild(iconEl(ROUTE_ICONS[route.id], "route__icon"));
    button.appendChild(el("span", "route__label", t(route.key)));
    button.addEventListener("click", () => {
      haptic("tap");
      routeByProduct.set(product.id, route.id);
      rerender();
    });
    grid.appendChild(button);
  }
  return grid;
}

/* ---------------------------------------------------------------
   Escalation and emergency directory
   --------------------------------------------------------------- */

/**
 * The escalation block. The service name is the label, the number is
 * the point, and the instruction is one short line: the long "call 999
 * or go to hospital" sentence told the assistant nothing they did not
 * already know, and pushed the product search down the screen.
 */
function escalationBlock() {
  const wrap = el("div", "escalate");
  const site = getContacts().find((c) => c.role === "Site emergency number");

  wrap.appendChild(
    el(
      "div",
      "escalate__label",
      site ? roleLabel(site.role) : t("nationalEmergency"),
    ),
  );

  const number = site && site.phone ? site.phone : t("notAssigned");
  if (/^[+\d]/.test(number)) {
    const link = el("a", "escalate__number", number);
    link.href = "tel:" + number.replace(/[^\d+]/g, "");
    wrap.appendChild(link);
  } else {
    wrap.appendChild(el("div", "escalate__number", number));
  }

  wrap.appendChild(el("div", "t-footnote", t("escalateShort")));
  wrap.appendChild(el("div", "t-footnote t-secondary", t("importantWarning")));
  return wrap;
}

/**
 * The emergency directory, grouped under each service. Every number is a
 * button that dials, because a plain number has to be copied by hand in
 * the middle of an incident.
 */
function emergencyBlock() {
  const contacts = getContacts();
  const order = [];
  const byRole = new Map();
  for (const contact of contacts) {
    if (!byRole.has(contact.role)) {
      byRole.set(contact.role, []);
      order.push(contact.role);
    }
    byRole.get(contact.role).push(contact);
  }

  const wrap = el("div");
  for (const role of order) {
    const block = el("div", "store__block");
    block.appendChild(el("h2", "store__block-title", roleLabel(role)));
    const group = listGroup();
    for (const contact of byRole.get(role)) {
      group.appendChild(contactRow(contact));
    }
    block.appendChild(group);
    wrap.appendChild(block);
  }
  return wrap;
}

/* One contact: its name, then each of its numbers as a dial button. */
function contactRow(contact) {
  const row = el("div", "contact");
  row.appendChild(el("div", "contact__name", contact.name || t("notAssigned")));
  const dials = el("div", "contact__dials");
  const numbers = splitNumbers(contact.phone);
  if (!numbers.length) {
    dials.appendChild(el("span", "dial dial--plain", t("notAssigned")));
  }
  for (const number of numbers) {
    dials.appendChild(dialButton(number));
  }
  row.appendChild(dials);
  return row;
}

/* A cell can hold two numbers, separated by a comma. */
function splitNumbers(value) {
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function dialButton(label) {
  const digits = label.replace(/[^\d+]/g, "");
  if (digits.length < 3) return el("span", "dial dial--plain", label);
  const link = el("a", "dial");
  link.href = `tel:${digits}`;
  link.appendChild(iconEl("phone", "dial__icon"));
  link.appendChild(el("span", "", label));
  return link;
}

function roleLabel(role) {
  return ROLE_KEYS[role] ? t(ROLE_KEYS[role]) : role;
}
