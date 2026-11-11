# ARCHITECTURE.md

## 1. Shape of the system

```
┌───────────────────────────────────────────────────────────────┐
│  app/data/snapshot.json      ← the whole dataset, in the repo │
│  ┌──────────┬──────────┬──────────┬──────────┬─────────────┐  │
│  │ products │ pictograms│  matrix  │ contacts │   counts    │  │
│  └────┬─────┴────┬─────┴────┬─────┴────┬─────┴──────┬──────┘  │
└───────┼──────────┼──────────┼──────────┼────────────┼─────────┘
        │          │          │          │            │
        ▼          ▼          ▼          ▼            ▼
┌───────────────────────────────────────────────────────────────┐
│  PWA (static, no backend, no build step)                      │
│                                                               │
│  service worker ── precache the app shell + snapshot          │
│  localStorage   ── cached copy of the snapshot                │
│  memory index   ── matrix lookup, product lookup, search      │
│  decision engine── pure functions (matrix.js)                 │
│                                                               │
│  Store │ Compare │ Response                                   │
└───────────────────────────────────────────────────────────────┘
```

**There is no server-side logic and no server-side data.** The dataset is part
of the release. A new release is a new snapshot. That is the whole update
mechanism, and it is why the app opens instantly on warehouse WiFi and works
with no signal at all.

## 2. Why these choices

| Choice | Reason | Rejected alternative |
|---|---|---|
| Static PWA, no framework | Fastest first paint on an ordinary Android; no toolchain; ~40 KB of app code | React/Vue — a build step and a bundle for three screens |
| Bundled snapshot | One source of truth, atomic updates, no backend to operate | Google Sheet + Apps Script — extra moving parts the site must maintain |
| Client-side decision engine | Works offline; the logic is inspectable and testable in isolation | Server-side evaluation — latency, breaks offline, hides the rule |
| Six-pictogram matrix | The HSE chart is what the warehouse actually applies; no flashpoint or physical-state inference | The old nine-class storage model — more data, more failure modes |
| One JSON document | The whole dataset is ~300 KB; one request, one cache entry, one version | Per-endpoint queries — more round trips, more failure modes |

## 3. The data flow, step by step

### 3.1 Launch

1. The service worker serves the app shell from cache. The app paints
   immediately — no network required.
2. `store.initStore()` reads the cached snapshot from localStorage.
3. If there is no cache, it fetches the bundled `./data/snapshot.json` and
   caches it.
4. The store builds the product index and the matrix index once, then emits
   `ready`.

### 3.2 The snapshot

One JSON document, described field by field in `DATABASE.md`:

```json
{
  "version": 2,
  "generatedAt": "<ISO timestamp>",
  "site": { "id": "CTG", "name": "Chattogram Warehouse" },
  "counts": { "products": 67, "withSds": 37, "withoutSds": 30, "matrixPairs": 36 },
  "pictograms": [ { "code": "GHS01", "sign": "…", "hazard": "…", "inMatrix": true } ],
  "matrix": {
    "source": "…75_59_01…",
    "readingRule": { "en": "…", "bn": "…" },
    "pictograms": ["GHS01", "GHS02", "GHS03", "GHS05", "GHS06", "GHS07"],
    "pairs": [ { "a": "GHS05", "b": "GHS06", "outcome": "conditional", "condition": "O-1" } ],
    "conditions": { "general": { "en": [], "bn": [] }, "O-1": { "title": {}, "en": [], "bn": [] } },
    "references": [],
    "operationalNote": { "en": "…", "bn": "…" }
  },
  "products": [],
  "contacts": [],
  "hash": "<16 hex characters>"
}
```

`matrix.pairs` holds 36 directed pairs: 21 unique cells, with the 15
off-diagonal cells written in both directions so the engine never has to
normalise order.

## 4. Module boundaries

Each module has one job and no hidden dependencies.

| Module | Responsibility | Depends on |
|---|---|---|
| `config.js` | Snapshot path, cache keys, schema version | — |
| `store.js` | Snapshot in memory, indexes, search, cache, recents | `config`, `matrix` |
| `matrix.js` | **Pure.** Gates, pair evaluation, most-onerous-wins, conditions | — |
| `i18n.js` | Bangla / English interface strings | `config` |
| `ui.js` | DOM helpers, bottom sheet, haptics, focus management | `i18n`, `icons` |
| `icons.js` | Inline SVG definitions | — |
| `widgets.js` | Product hero, picker, verdict card, conditions, pair list, reference card | `ui`, `i18n`, `store`, `matrix` |
| `screens/store.js` | Product landing and per-product guide | `widgets`, `store`, `matrix` |
| `screens/compare.js` | Two-product comparison | `widgets`, `store`, `matrix` |
| `screens/pair.js` | One pairing from a Store row: both products, verdict, conditions, why | `widgets`, `store`, `matrix` |
| `screens/response.js` | First aid and emergency directory | `widgets`, `store` |
| `app.js` | Bootstrap, routing, tab bar, service worker | all |

**`matrix.js` imports nothing.** That is deliberate: the safety logic is the
part that must be provably correct, so it is isolated, pure, and testable
without a DOM, a browser, or a network.

## 5. The decision engine

```
evaluatePair(A, B):
  1. gate: A or B has no SDS              → review_required
  2. gate: A or B is Manual Review        → review_required
  3. gate: A or B has no safety content   → review_required
  4. gate: A or B has an SDS override     → review_required
  5. matrixA = A.pictograms ∩ matrix; matrixB = B.pictograms ∩ matrix
  6. if either set is empty               → no_matrix_restriction
  7. for every (a, b) pair: look up the matrix cell
     - no cell                            → review_required
  8. keep the most onerous outcome:       no > conditional > ok
  9. a conditional result carries the general conditions
     plus every specific O-n condition set that produced it
 10. an X result carries the general conditions (separation /
     segregation rules)
```

`evaluateAgainstAll` uses the same engine in a different shape: it evaluates
the chosen product against **every other product**, keeps the most onerous
pair for each, and sorts the catalogue into five buckets:

| Bucket | Outcome |
|---|---|
| Can't be stored with | `no` |
| Can be stored with conditions | `conditional` |
| Can be stored with | `ok` |
| No matrix restriction | `no_matrix_restriction` |
| Review required | `review_required` |

One engine, two presentations. They cannot disagree.

## 6. Offline behaviour

| Situation | Behaviour |
|---|---|
| First load, no network | The service worker precached the shell and the snapshot during install; the app works. |
| Subsequent loads, no network | Full app from cache. |
| New release | The cache name is bumped; the service worker drops every older cache on activate. |

Every resource is cache-first. There is no network-first path because there is
no remote data source.

## 7. Repository layout

See the tree in [`README.md`](README.md). Generated output is not checked in;
the snapshot is generated once by `tools/build_snapshot.py` and then committed
as part of the release.

## 8. Build and deploy

There is no build step for the app. `app/` is deployed as-is.

```bash
npm test                      # tests, no dependencies, no network
python tools/build_snapshot.py "path/to/source-snapshot.json"  # regenerate the snapshot from a source catalogue
```

Then publish `app/` to GitHub Pages or any static host.

## 9. Explicit non-architecture

Things deliberately not built, and why:

- **No user accounts.** The app carries no personal data.
- **No write path.** v1 is read-only.
- **No server.** The dataset ships with the release.
- **No location model.** Until a location master exists, the app will not
  recommend a location.
- **No i18n framework.** Two languages, one dictionary file.
- **No flashpoint or physical-state inference.** The HSE chart is pictogram
  based; the app does not invent a second hazard model.
