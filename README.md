# WareSafe — Product Compatibility Aid

An offline-first warehouse safety app that answers one question quickly and
plainly:

> **Can these two products be stored together?**

The answer comes from the six-by-six GHS pictogram compatibility matrix in
[`chemical-compatibility-conditions-bn.md`](chemical-compatibility-conditions-bn.md),
which is transcribed from the *HSE Guide – Warehousing* (75_59_01
GD_Warehousing v1.0). The app carries the WareSafe product catalogue, the SDS
details and the product-specific first aid; the storage decision is the lean
pictogram matrix.

## What the app does

| Screen | Question it answers |
|---|---|
| **Store** | What should I check before storing this product, and which other products may or may not sit beside it? |
| **Compare** | Can Product A and Product B be stored together? |
| **Response** | What should I do now if someone has been exposed? |

Search accepts a product name, a design code, a material number or a product
type — typing `Herbicide` or `Fungicide` lists every product in that category.

Tapping any partner product in the Store list opens a **pair view** that keeps
both product names and pictograms on screen, so the assistant never loses the
product they started from. The browser back button returns to the same list at
the same scroll offset.

Every verdict is one of three matrix outcomes, always shown as a symbol **and**
a word:

| Symbol | Outcome | Meaning |
|---|---|---|
| ✓ | `ok` | Joint storage permitted |
| O | `conditional` | Permitted with special precautions / conditions |
| X | `no` | Joint storage not permitted |

Two further states are not verdicts:

- **Review required** — the product has no SDS, is flagged for manual review,
  or the record is incomplete. The app refuses to guess.
- **No matrix restriction** — the product carries only pictograms the matrix
  does not cover (GHS08 health hazard, GHS09 environment). The matrix is
  silent, which is not proof of compatibility; the app says so and points to
  the SDS.

The interface is bilingual (বাংলা / English) with a two-option switch in the
top bar, and the whole app works offline from the first launch because the
dataset is bundled with the release.

## Run it

There is no build step. The app is plain ES modules, CSS and JSON.

```bash
# any static server works; this one disables caching for development
python tools/dev_server.py 8765
# then open http://127.0.0.1:8765/index.html
```

Deploy the `app/` folder as-is to any static host (GitHub Pages, an intranet
server, a shared folder behind a web server).

## Tests

```bash
npm test
```

No dependencies and no network. The suite covers every pair in the source
chart, the most-onerous-wins rule, the gates, the no-matrix path, the snapshot
contract, the bilingual copy, and the service-worker file list.

## Regenerate the dataset

The snapshot is generated from a source product snapshot, so the catalogue has
a single origin:

```bash
python tools/build_snapshot.py "path/to/source-snapshot.json"
```

The matrix and its conditions live in `tools/build_snapshot.py`, transcribed
from the markdown source. Change them there and rebuild; the app reads the
result from `app/data/snapshot.json`.

After regenerating the snapshot, bump `DATA_VERSION` in `app/src/config.js`.
The localStorage cache key includes it, so installed copies pick up the new
dataset instead of serving the old one.

Condition strings may contain `**...**` markers around the numbers and
instructions that should be highlighted. The UI renders them as bold amber
spans; the markers are authored by HSE, not guessed by a regex.

## Repository layout

```
.
├── chemical-compatibility-conditions-bn.md   the matrix source (EN + BN)
├── app/                                      the PWA — deploy this folder
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── sw.js                                 precache + offline shell
│   ├── data/snapshot.json                    the bundled dataset
│   ├── styles/                               tokens, base, components, matrix, screens
│   ├── src/
│   │   ├── matrix.js                         the pure decision engine
│   │   ├── store.js                          dataset, search, recents
│   │   ├── i18n.js                           bilingual interface strings
│   │   ├── widgets.js                        shared UI pieces
│   │   └── screens/                          store, compare, response
│   └── assets/                               brand, fonts, GHS pictograms
├── tests/                                    node --test suite
└── tools/
    ├── build_snapshot.py                     source catalogue → WareSafe snapshot
    └── dev_server.py                         no-cache development server
```

## Design and safety notes

- The matrix is a **storage-screening aid**, not a replacement for the SDS or a
  site-specific risk assessment. Where the chart, the SDS and local law
  differ, the more stringent requirement applies.
- A product with more than one pictogram is judged on **every** pair its
  pictograms form with the other product's pictograms; the most onerous outcome
  wins (X > O > ✓).
- Colour is never the only carrier of a verdict. Every symbol is paired with a
  word, and the conditions are written out in the active language.
- The UI design follows the Syngenta brand layer and the Minimalism & Swiss
  Style guidance generated with the
  [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
  skill. See [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md).

## Reinstalling the design skill (development only)

```bash
npm install -g ui-ux-pro-max-cli
uipro init --ai opencode
```

The installed skill lives in `.opencode/skills/` and is not part of the
deployed app.
