# DATABASE.md

The app reads one JSON document: `app/data/snapshot.json`. This file is the
contract between `tools/build_snapshot.py` and the app. A snapshot that fails
the checks in `tests/snapshot.test.js` is not shipped.

## Top level

| Field | Type | Meaning |
|---|---|---|
| `version` | number | Schema version. The app accepts only `2`. |
| `generatedAt` | string | ISO timestamp of the build. |
| `site` | object | `{ id, name, nameBn }`. |
| `counts` | object | `{ products, withSds, withoutSds, matrixPairs }`. |
| `pictograms` | array | The nine GHS definitions. |
| `matrix` | object | The compatibility matrix and its conditions. |
| `products` | array | The catalogue. |
| `contacts` | array | Emergency directory. |
| `hash` | string | First 16 hex characters of the SHA-256 of the document without `hash`. |

## `pictograms[]`

| Field | Type | Meaning |
|---|---|---|
| `code` | string | `GHS01` … `GHS09`. |
| `sign` | string | The printed symbol name, e.g. `Exploding Bomb`. |
| `hazard` | string | The hazard class, e.g. `Explosives`. |
| `inMatrix` | boolean | True only for the six chart pictograms. |
| `asset` | string | SVG file stem under `app/assets/pictograms/`. |

## `matrix`

| Field | Type | Meaning |
|---|---|---|
| `version` | number | Matrix data version. |
| `source` | string | The HSE guide reference. |
| `readingRule` | `{ en, bn }` | How to read the chart. |
| `pictograms` | string[] | The six covered codes, in chart order. |
| `pairs` | array | 36 directed cells (21 unique, symmetrical). |
| `conditions` | object | `general` plus `O-1`, `O-2`, `O-3`. |
| `references` | string[] | Section references from the guide. |
| `operationalNote` | `{ en, bn }` | The screening-aid disclaimer. |

### `matrix.pairs[]`

| Field | Type | Meaning |
|---|---|---|
| `a` | string | Row pictogram. |
| `b` | string | Column pictogram. |
| `outcome` | `ok` \| `conditional` \| `no` | The cell value. |
| `condition` | string \| null | The O-n set for a `conditional` cell; null otherwise. |

### `matrix.conditions`

Every set has an `en` and a `bn` array of the same length. The three O sets
also carry a `title: { en, bn }`.

Condition strings may contain `**...**` around the numbers and instructions
that should be highlighted in the UI. The app renders each pair of markers as
a bold amber span (`<strong class="hl">`). Markers must be balanced.

| Key | Meaning |
|---|---|
| `general` | The five conditions that apply to every O pairing and to incompatible products. |
| `O-1` | GHS05 Corrosive + GHS06 Toxic. |
| `O-2` | GHS07 Harmful/Irritant + GHS03 Oxidising. |
| `O-3` | GHS06 Toxic + GHS02 Flammable. |

## `products[]`

The WareSafe product catalogue. Fields the app reads:

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Stable product id, e.g. `P001`. |
| `name` | string | Display name. |
| `nameVariants` | string[] | Warehouse label variants, used by search. |
| `designCode` | string | Syngenta design code. |
| `materialNumber` | string | SAP material number. |
| `productType` | string | Insecticide, Fungicide, … |
| `sdsAvailable` | boolean | Whether an SDS is on file. |
| `sdsNumber`, `sdsVersion`, `sdsRevisionDate` | string | SDS reference. |
| `extractionStatus` | string | `Verified` or `Manual Review Required`. |
| `pictograms` | string[] | GHS codes. May include GHS08/GHS09. |
| `pictogramsNotStated` | boolean | The SDS states no pictogram. |
| `signalWord` | string | `Danger` or `Warning`. |
| `hazardClassifications` | string | Newline-separated classification list. |
| `hazardStatements` | array | `{ code, text }`. |
| `precautionary` | array | `{ code, text, bn, catalogueEn, translationStatus }`. |
| `storageConditions` | string | Section 7 text. |
| `incompatibleMaterials` | string | Section 10 text. |
| `firstAid` | object | `general`, `inhalation`, `skin`, `eye`, `swallowed`, `symptoms`, `medical`, each `{ en, bn }`. |
| `unNumber`, `transportClass`, `packingGroup` | string | Transport data. |
| `supplier` | string | SDS supplier block. |
| `sourceRef` | string | Page references into the SDS. |

The legacy storage-model fields `storageClasses`, `flashpoint`,
`combustibility` and `hazardClassCode` are deliberately **not** present: the
new decision model does not use them.

## `contacts[]`

| Field | Type | Meaning |
|---|---|---|
| `site` | string | Site id. |
| `role` | string | `Site emergency number`, `Fire Brigade`, `Hospital`, … |
| `name` | string | Organisation or service name. |
| `phone` | string | One or more numbers, comma separated. |
| `note` | string | Free text. |
| `priority` | number | Sort order. |
