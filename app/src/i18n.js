/* ============================================================
   WareSafe — strings
   Interface chrome defaults to Bangla and can be switched to
   English with the toggle in the top bar. The active language is
   the single language shown on screen: there is no second, stacked
   translation underneath.
   ============================================================ */

import { KEYS } from "./config.js";

/**
 * Every interface string, with the approved Bangla wording and the
 * English reference text.
 */
const STRINGS = {
  // Shell
  appSubtitle: ["গুদাম নিরাপত্তা সহায়ক", "Warehouse safety companion"],
  language: ["ভাষা", "Language"],

  // Navigation
  store: ["সংরক্ষণ", "Store"],
  compare: ["তুলনা", "Compare"],
  response: ["জরুরি সহায়তা", "Response"],

  // Common actions
  findProduct: ["পণ্য খুঁজুন", "Find product"],
  searchPrompt: ["পণ্যের নাম বা ধরন লিখুন", "Enter a product name or type"],
  recent: ["সাম্প্রতিক", "Recent"],
  selectProduct: ["পণ্য নির্বাচন করুন", "Select product"],
  productNotFound: ["পণ্যটি পাওয়া যায়নি", "Product not found"],
  noResults: ["কোনো পণ্য পাওয়া যায়নি", "No product found"],
  filterAll: ["সব পণ্য", "All products"],
  filterWithSds: ["SDS আছে", "Has SDS"],
  filterWithoutSds: ["SDS নেই", "No SDS"],
  filterReview: ["পর্যালোচনা প্রয়োজন", "Review needed"],
  allSelectedPictograms: [
    "নির্বাচিত সব বিপদ চিহ্নযুক্ত পণ্য",
    "Products with all selected pictograms",
  ],
  clear: ["মুছুন", "Clear"],
  back: ["ফিরে যান", "Back"],
  close: ["বন্ধ করুন", "Close"],
  viewSds: ["মূল SDS দেখুন", "View original SDS"],
  sdsVersion: ["SDS সংস্করণ", "SDS version"],
  sdsRevisionDate: ["SDS সংশোধনের তারিখ", "SDS revision date"],
  sdsNumber: ["SDS নম্বর", "SDS number"],
  dataUpdated: ["তথ্য হালনাগাদ", "Data updated"],
  dataUnavailable: ["তথ্য এখন পাওয়া যাচ্ছে না", "Information is currently unavailable"],
  reviewRequired: ["পর্যালোচনা প্রয়োজন", "Review required"],
  contactHse: [
    "HSE/দায়িত্বপ্রাপ্ত ব্যক্তির সঙ্গে যোগাযোগ করুন",
    "Contact HSE / designated authority",
  ],

  // Store screen
  storeGuidance: [
    "এই পণ্য সংরক্ষণের আগে নিচের নিরাপত্তা তথ্য যাচাই করুন।",
    "Check the safety information below before storing this product.",
  ],
  hazardPictograms: ["বিপদ চিহ্ন", "Hazard pictograms"],
  signalWord: ["সতর্কতা শব্দ", "Signal word"],
  hazardSummary: ["বিপদ সারসংক্ষেপ", "Hazard summary"],
  hazardStatements: ["বিপদ সম্পর্কিত বিবৃতি", "Hazard statements"],
  storageConditions: ["সংরক্ষণের শর্ত", "Storage conditions"],
  incompatibleMaterials: ["যে উপকরণের সঙ্গে রাখা যাবে না", "Incompatible materials"],
  precautionaryStatements: ["সতর্কতামূলক নির্দেশনা", "Precautionary statements"],
  compatibleWith: ["যাদের সঙ্গে রাখা যেতে পারে", "Can be stored with"],
  conditionalWith: ["শর্তসাপেক্ষে রাখা যাবে", "With conditions"],
  doNotStoreWith: ["যাদের সঙ্গে রাখা যাবে না", "Can't be stored with"],
  noMatrixWith: ["ম্যাট্রিক্সে বিধিনিষেধ নেই", "No matrix restriction"],
  noProductsInBucket: [
    "এই তালিকায় কোনো পণ্য নেই",
    "No products in this list",
  ],
  cannotEvaluate: [
    "কিছু পণ্যের জন্য স্বয়ংক্রিয় সিদ্ধান্ত দেওয়া যায়নি (SDS নেই বা পর্যালোচনা প্রয়োজন) — HSE/দায়িত্বপ্রাপ্ত ব্যক্তির সঙ্গে যোগাযোগ করুন।",
    "An automated decision could not be made for some products (no SDS or review required) — contact HSE / designated authority.",
  ],
  matrixScope: [
    "সংরক্ষণের নিয়মাবলি ৬টি GHS বিপদ চিহ্নের ভিত্তিতে তৈরি ম্যাট্রিক্স অনুসরণ করে। GHS08 (স্বাস্থ্য ঝুঁকি) ও GHS09 (পরিবেশ) এই ম্যাট্রিক্সে নেই।",
    "Storage rules follow the matrix built on six GHS hazard pictograms. GHS08 (health hazard) and GHS09 (environment) are not covered by this matrix.",
  ],
  storageDecisionBoundary: [
    "গুদামের অনুমোদিত স্থান ও সাইটের নিয়ম অনুযায়ী সংরক্ষণের স্থান নির্বাচন করুন।",
    "Choose the storage location according to approved warehouse areas and site procedures.",
  ],
  incompleteRecord: [
    "এই পণ্যের তথ্য অসম্পূর্ণ। স্বয়ংক্রিয় সিদ্ধান্ত ব্যবহার করবেন না।",
    "This product record is incomplete. Do not use an automated decision.",
  ],
  sdsReviewFlag: [
    "এই SDS তথ্য যাচাই প্রয়োজন। স্বয়ংক্রিয় সিদ্ধান্ত ব্যবহার করবেন না।",
    "This SDS information requires review. Do not use an automated decision.",
  ],
  productType: ["পণ্যের ধরন", "Product type"],
  productDetails: ["পণ্যের তথ্য", "Product details"],
  matrixCoverage: ["ম্যাট্রিক্সে যেসব বিপদ চিহ্ন রয়েছে", "Pictograms covered by the matrix"],
  outsideMatrix: [
    "এই বিপদ চিহ্ন ম্যাট্রিক্সে নেই",
    "Not covered by the matrix",
  ],
  noMatrixPictograms: [
    "এই পণ্যের কোনো বিপদ চিহ্ন ম্যাট্রিক্সে নেই — SDS দেখে যাচাই করুন।",
    "This product has no pictogram the matrix covers — check the SDS.",
  ],

  // Compare screen
  compareGuidance: [
    "দুটি পণ্য নির্বাচন করে দেখুন এগুলো একসঙ্গে রাখা যাবে কি না।",
    "Select two products to check whether they can be stored together.",
  ],
  compatibilityResult: ["একসঙ্গে সংরক্ষণের ফলাফল", "Compatibility result"],
  pairComparison: ["এই জোড়ার ফলাফল", "Why this pairing"],
  whyThisResult: ["এই ফলাফলের কারণ", "Why this result"],
  requiredCondition: ["যে শর্ত অবশ্যই মানতে হবে", "Required condition"],
  mostRestrictiveRule: ["সবচেয়ে কঠোর নিয়ম প্রযোজ্য", "The most restrictive rule applies"],
  reviewRequiredResult: [
    "এই তুলনার জন্য অনুমোদিত স্বয়ংক্রিয় সিদ্ধান্ত নেই। HSE/দায়িত্বপ্রাপ্ত ব্যক্তির সঙ্গে যোগাযোগ করুন।",
    "No approved automated decision is available for this comparison. Contact HSE / designated authority.",
  ],
  doNotActOnColour: [
    "শুধু রঙ দেখে সিদ্ধান্ত নেবেন না; নিচের নির্দেশনা পড়ুন।",
    "Do not decide from colour alone; read the instruction below.",
  ],
  swapProducts: ["পণ্য দুটির অবস্থান বদলান", "Swap the two products"],
  clearSelection: ["নির্বাচন মুছুন", "Clear selection"],

  // Matrix verdicts
  verdictCan: ["একসঙ্গে রাখা যাবে", "Can be stored together"],
  verdictConditional: [
    "শর্তসাপেক্ষে একসঙ্গে রাখা যাবে",
    "Can be stored together with conditions",
  ],
  verdictCannot: ["একসঙ্গে রাখা যাবে না", "Cannot be stored together"],
  verdictNoMatrix: ["ম্যাট্রিক্সে কোনো বিধিনিষেধ নেই", "No restriction in this matrix"],
  outcomeOk: ["একসঙ্গে সংরক্ষণ অনুমোদিত", "Joint storage permitted"],
  outcomeConditional: [
    "বিশেষ সতর্কতা/শর্তসাপেক্ষে একসঙ্গে সংরক্ষণ অনুমোদিত",
    "Joint storage permitted with special precautions / conditions",
  ],
  outcomeNo: ["একসঙ্গে সংরক্ষণ অনুমোদিত নয়", "Joint storage not permitted"],
  legendOk: ["একসঙ্গে সংরক্ষণ অনুমোদিত", "Joint storage permitted"],
  legendConditional: [
    "বিশেষ সতর্কতা/শর্তসাপেক্ষে",
    "Permitted with conditions",
  ],
  legendNo: ["একসঙ্গে সংরক্ষণ অনুমোদিত নয়", "Not permitted"],
  matrixLegend: ["ম্যাট্রিক্সের প্রতীক", "Matrix legend"],
  readingRule: ["পড়ার নিয়ম", "Reading rule"],
  operationalNote: ["কার্যক্রমের নোট", "Operational note"],
  matrixSource: ["ম্যাট্রিক্সের উৎস", "Matrix source"],
  generalConditions: ["সাধারণ শর্তাবলি", "General conditions"],
  specificConditions: ["এই সমন্বয়ের শর্তাবলি", "Conditions for this pairing"],
  separationGuidance: [
    "আলাদা স্থানে (কমপক্ষে **৩ মিটার দূরত্বে**) অথবা **অগ্নি-প্রতিরোধী দেয়ালসহ পৃথক কক্ষে** সংরক্ষণ করুন।",
    "Store separated (at least **3 m apart**) or segregated in separate rooms with a **fire wall**.",
  ],
  noMatrixBody: [
    "এই তুলনার অন্তত একটি পণ্যের বিপদ চিহ্ন (যেমন GHS08 বা GHS09) ম্যাট্রিক্সে নেই। তাই ম্যাট্রিক্স কোনো বিধিনিষেধ দেয় না — এটি সামঞ্জস্যের প্রমাণও নয়। SDS দেখে যাচাই করুন।",
    "At least one product in this comparison carries a pictogram the matrix does not cover (for example GHS08 or GHS09). The matrix therefore gives no restriction — which is not proof of compatibility. Check the SDS.",
  ],
  pairsChecked: ["যে জোড়াগুলো যাচাই হয়েছে", "Pairs checked"],
  noPairs: [
    "কোনো বিপদ চিহ্ন জোড়া যাচাই করা যায়নি।",
    "No pictogram pair could be checked.",
  ],

  // Verdict provenance
  source: ["উৎস", "Source"],
  owner: ["দায়িত্বপ্রাপ্ত ব্যক্তি", "Owner"],
  effectiveDate: ["কার্যকর তারিখ", "Effective date"],
  approvalStatus: ["অনুমোদনের অবস্থা", "Approval status"],
  rulesPendingApproval: [
    "নিয়মতালিকাটি HSE অনুমোদনের অপেক্ষায় আছে। সাইটের সংরক্ষণ পরিকল্পনা অনুসরণ করুন।",
    "The rule set is pending HSE approval. Follow the site storage plan.",
  ],
  noSdsOnFile: [
    "এই পণ্যের কোনো SDS ফাইল নেই।",
    "No SDS is on file for this product.",
  ],
  manualReviewRequired: [
    "এই পণ্যের SDS তথ্যে স্বয়ংক্রিয় পর্যালোচনা প্রয়োজন।",
    "This product's SDS information requires manual review.",
  ],
  pictogramsNotStated: [
    "এই SDS-এ কোনো বিপদ চিহ্ন উল্লেখ করা নেই।",
    "This SDS states no hazard pictogram.",
  ],
  signalNotStated: [
    "এই SDS-এ সতর্কতা শব্দ উল্লেখ করা নেই।",
    "This SDS states no signal word.",
  ],
  productOverrideApplies: [
    "এই পণ্যের নিজস্ব SDS নির্দেশনা প্রযোজ্য।",
    "A product-specific SDS restriction applies.",
  ],

  // Response screen
  responseGuidance: [
    "পণ্য নির্বাচন করে সংস্পর্শের ধরন নির্বাচন করুন। জরুরি হলে সাইটের জরুরি প্রক্রিয়া অনুসরণ করুন।",
    "Select the product and exposure route. In an emergency, follow the site emergency procedure.",
  ],
  selectRoute: ["ধরন নির্বাচন করুন", "Select exposure route"],
  browseAllProducts: ["সব পণ্য দেখুন", "Browse all products"],
  typeToSearch: ["পণ্যের নাম লিখে খুঁজুন", "Type a product name to search"],
  generalAdvice: ["সাধারণ পরামর্শ", "General advice"],
  ifInhaled: ["শ্বাসের সঙ্গে প্রবেশ করলে", "If inhaled"],
  skinContact: ["ত্বকে লাগলে", "Skin contact"],
  eyeContact: ["চোখে লাগলে", "Eye contact"],
  ifSwallowed: ["গিলে ফেললে", "If swallowed"],
  symptomsEffects: ["গুরুত্বপূর্ণ লক্ষণ ও প্রভাব", "Most important symptoms and effects"],
  immediateMedical: [
    "তাৎক্ষণিক চিকিৎসা / বিশেষ চিকিৎসা",
    "Immediate medical attention / special treatment",
  ],
  callEmergency: [
    "জরুরি নম্বর ৯৯৯-এ কল করুন বা নিকটস্থ হাসপাতালে যান।",
    "Call the emergency number 999 or go to the nearest hospital.",
  ],
  takeSdsWithYou: [
    "সাহায্য চাইতে গেলে পণ্যের পাত্র, লেবেল বা SDS সঙ্গে রাখুন।",
    "Have the product container, label or SDS with you when seeking help.",
  ],
  doNotDelay: ["দেরি করবেন না।", "Do not delay."],
  escalateShort: [
    "দেরি করবেন না। পণ্যের পাত্র, লেবেল বা SDS সঙ্গে রাখুন।",
    "Do not delay. Have the product container, label or SDS with you.",
  ],
  importantWarning: [
    "নিজে থেকে চিকিৎসা করবেন না। SDS ও সাইটের জরুরি প্রক্রিয়া অনুসরণ করুন।",
    "Do not self-treat. Follow the SDS and site emergency procedure.",
  ],
  emergencyContact: ["জরুরি যোগাযোগ", "Emergency contact"],
  nationalEmergency: ["জাতীয় জরুরি সেবা", "National emergency service"],
  government: ["সরকারি সংস্থা", "Government"],
  army: ["সেনাবাহিনী", "Army"],
  fireBrigade: ["ফায়ার ব্রিগেড", "Fire brigade"],
  hospital: ["হাসপাতাল", "Hospital"],
  police: ["পুলিশ", "Police"],
  ambulance: ["অ্যাম্বুলেন্স", "Ambulance"],
  localAuthority: ["স্থানীয় সংস্থা", "Local organisation"],
  notAssigned: ["এখনও নির্ধারণ করা হয়নি", "Not yet assigned"],
  firstAidUnavailable: [
    "এই পণ্যের প্রথম চিকিৎসা নির্দেশনা নেই। সাইটের জরুরি প্রক্রিয়া অনুসরণ করুন।",
    "No first-aid text is available for this product. Follow the site emergency procedure.",
  ],

  // Status
  loading: ["লোড হচ্ছে…", "Loading…"],
  retry: ["আবার চেষ্টা করুন", "Try again"],
  refresh: ["হালনাগাদ করুন", "Refresh"],
  site: ["সাইট", "Site"],
};

const PREFS_KEY = KEYS.prefs;

let current = "bn";

export function getLang() {
  return current;
}

export function setLang(lang) {
  current = lang === "en" ? "en" : "bn";
  try {
    const prefs = loadPrefs();
    prefs.lang = current;
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    document.documentElement.setAttribute("lang", current);
  } catch (err) {
    /* private mode: language still applies for this session */
  }
}

export function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") || {};
  } catch (err) {
    return {};
  }
}

export function initLang() {
  const stored = loadPrefs().lang;
  current = stored === "en" ? "en" : "bn";
  document.documentElement.setAttribute("lang", current);
  return current;
}

/** Interface string in the active language. */
export function t(key) {
  const pair = STRINGS[key];
  if (!pair) return key;
  return current === "en" ? pair[1] : pair[0];
}

/**
 * The one language to show for content that carries both a Bangla and an
 * English wording. Bangla mode shows the Bangla when it exists; English
 * mode always shows the English.
 */
export function contentText(bn, en) {
  return current === "en" ? en || bn : bn || en;
}

/** Every interface key, for the test suite. */
export function stringKeys() {
  return Object.keys(STRINGS);
}
