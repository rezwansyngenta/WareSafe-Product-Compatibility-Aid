#!/usr/bin/env python3
"""Build the WareSafe snapshot from a source product snapshot.

The source provides the product catalogue (names, SDS details, first
aid, contacts). The compatibility rules are the six-by-six GHS matrix
in ``chemical-compatibility-conditions-bn.md``.

Usage:
    python tools/build_snapshot.py <path-to-source-snapshot.json>

The script writes ``app/data/snapshot.json``.
"""

from __future__ import annotations

import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "app" / "data" / "snapshot.json"

# ---------------------------------------------------------------------------
# The compatibility matrix, transcribed from
# chemical-compatibility-conditions-bn.md
# ---------------------------------------------------------------------------

MATRIX_PICTOGRAMS = ["GHS01", "GHS02", "GHS03", "GHS05", "GHS06", "GHS07"]

# Only the upper triangle is written; the app treats the matrix as
# symmetrical and the build expands it in both directions.
MATRIX_UPPER = [
    # GHS01 Explosive
    ("GHS01", "GHS01", "ok", None),
    ("GHS01", "GHS02", "no", None),
    ("GHS01", "GHS03", "no", None),
    ("GHS01", "GHS05", "no", None),
    ("GHS01", "GHS06", "no", None),
    ("GHS01", "GHS07", "no", None),
    # GHS02 Flammable
    ("GHS02", "GHS02", "ok", None),
    ("GHS02", "GHS03", "no", None),
    ("GHS02", "GHS05", "no", None),
    ("GHS02", "GHS06", "conditional", "O-3"),
    ("GHS02", "GHS07", "ok", None),
    # GHS03 Oxidising
    ("GHS03", "GHS03", "ok", None),
    ("GHS03", "GHS05", "no", None),
    ("GHS03", "GHS06", "no", None),
    ("GHS03", "GHS07", "conditional", "O-2"),
    # GHS05 Corrosive
    ("GHS05", "GHS05", "ok", None),
    ("GHS05", "GHS06", "conditional", "O-1"),
    ("GHS05", "GHS07", "ok", None),
    # GHS06 Toxic
    ("GHS06", "GHS06", "ok", None),
    ("GHS06", "GHS07", "ok", None),
    # GHS07 Harmful / Irritant
    ("GHS07", "GHS07", "ok", None),
]

CONDITIONS = {
    "general": {
        "en": [
            "Check the specific products' **Safety Data Sheets (SDS)** and **labels** before allowing joint storage. The GHS pictogram alone does not establish full chemical compatibility.",
            "Store products in groups according to hazard category. Where products are incompatible, they must be either **separated** or **segregated**.",
            "**Separation** means storage in different locations in the same room, at least **3 metres apart**. **Segregation** means storage in separate rooms with a **fire wall** as the barrier.",
            "Small quantities of incompatible categories may be separated; **large quantities should be segregated**. If a product has more than one hazard class, apply the **most stringent** segregation requirement.",
            "Storage areas should have a **firm, impermeable base** with a **containment sill**, **adequate ventilation**, **clear fire-fighting access**, and appropriate **spill-response equipment**.",
        ],
        "bn": [
            "একসঙ্গে সংরক্ষণের অনুমতি দেওয়ার আগে প্রতিটি পণ্যের **সেফটি ডাটা শিট (SDS)** এবং **লেবেল** যাচাই করতে হবে। শুধুমাত্র GHS পিক্টোগ্রাম দেখে সম্পূর্ণ রাসায়নিক সামঞ্জস্যতা নির্ধারণ করা যাবে না।",
            "ঝুঁকির শ্রেণি অনুযায়ী পণ্য দলভুক্ত করে সংরক্ষণ করতে হবে। পণ্য পরস্পর অসামঞ্জস্যপূর্ণ হলে **আলাদা স্থানে সংরক্ষণ (separation)** অথবা **পৃথক কক্ষে সংরক্ষণ (segregation)** করতে হবে।",
            "**Separation** অর্থ একই কক্ষের ভিন্ন স্থানে কমপক্ষে **৩ মিটার দূরত্বে** সংরক্ষণ। **Segregation** অর্থ **অগ্নি-প্রতিরোধী দেয়াল** দ্বারা পৃথক ভিন্ন কক্ষে সংরক্ষণ।",
            "অসামঞ্জস্যপূর্ণ শ্রেণির অল্প পরিমাণ পণ্য আলাদা স্থানে রাখা যেতে পারে; **বড় পরিমাণ হলে পৃথক কক্ষে সংরক্ষণ** করতে হবে। কোনো পণ্যের একাধিক ঝুঁকি থাকলে **সবচেয়ে কঠোর** পৃথকীকরণ শর্ত প্রযোজ্য হবে।",
            "সংরক্ষণস্থলের মেঝে **মজবুত ও তরল-অভেদ্য** হতে হবে, চারপাশে **স্পিল-ধারণ ব্যবস্থা** থাকতে হবে, **পর্যাপ্ত বায়ু চলাচল** ও **অগ্নিনির্বাপণের প্রবেশপথ** নিশ্চিত করতে হবে এবং **স্পিল মোকাবিলার উপকরণ** প্রস্তুত রাখতে হবে।",
        ],
    },
    "O-1": {
        "title": {
            "en": "GHS05 Corrosive + GHS06 Toxic",
            "bn": "ক্ষয়কারী + বিষাক্ত",
        },
        "en": [
            "Verify the two specific products' compatibility through **SDSs and labels**.",
            "If incompatible, apply at least **3 m separation**; **segregate large quantities** or products presenting a higher risk.",
            "Provide **impermeable flooring** and **spill containment**. Maintain appropriate **PPE** and **spill-response materials** because leakage may create both corrosive and toxic exposure.",
            "Ensure **clear access** for emergency response and fire-fighting.",
        ],
        "bn": [
            "দুটি নির্দিষ্ট পণ্যের **SDS ও লেবেল** দেখে পারস্পরিক সামঞ্জস্যতা যাচাই করতে হবে।",
            "অসামঞ্জস্যপূর্ণ হলে **ন্যূনতম ৩ মিটার দূরত্ব** বজায় রাখতে হবে; **পরিমাণ বেশি হলে** অথবা ঝুঁকি বেশি হলে **পৃথক অগ্নি-প্রতিরোধী কক্ষে** সংরক্ষণ করতে হবে।",
            "**তরল-অভেদ্য মেঝে** ও **স্পিল-ধারণ ব্যবস্থা** নিশ্চিত করতে হবে। লিকেজের কারণে ক্ষয়কারী ও বিষাক্ত—উভয় ধরনের এক্সপোজার হতে পারে; তাই উপযুক্ত **PPE** এবং **স্পিল মোকাবিলার উপকরণ** প্রস্তুত রাখতে হবে।",
            "জরুরি প্রতিক্রিয়া ও অগ্নিনির্বাপণের জন্য **প্রবেশপথ সবসময় খালি** রাখতে হবে।",
        ],
    },
    "O-2": {
        "title": {
            "en": "GHS07 Harmful/Irritant + GHS03 Oxidising",
            "bn": "ক্ষতিকর/উত্তেজক + জারক (অক্সিডাইজিং)",
        },
        "en": [
            "Verify compatibility through the **SDSs and labels**; do not assume compatibility from the chart alone.",
            "Keep oxidising materials away from **combustible packaging**, **flammable materials**, **direct heat sources**, and **large electrical installations**.",
            "Maintain **effective ventilation** and **control ignition sources**. Apply at least **3 m separation** or **fire-wall segregation** where SDS assessment identifies incompatibility.",
            "Keep **spill-response equipment** available and do not allow spilled material to accumulate or spread.",
        ],
        "bn": [
            "**SDS ও লেবেল** দেখে সামঞ্জস্যতা যাচাই করতে হবে; শুধু চার্ট দেখে সামঞ্জস্যপূর্ণ ধরে নেওয়া যাবে না।",
            "জারক/অক্সিডাইজিং পণ্যকে **দাহ্য প্যাকেজিং**, **দাহ্য পদার্থ**, **সরাসরি তাপের উৎস** এবং **বড় বৈদ্যুতিক স্থাপনা** থেকে দূরে রাখতে হবে।",
            "**কার্যকর বায়ুচলাচল** নিশ্চিত করতে হবে এবং **প্রজ্বলন উৎস নিয়ন্ত্রণ** করতে হবে। SDS মূল্যায়নে অসামঞ্জস্যতা পাওয়া গেলে অন্তত **৩ মিটার দূরত্ব** বা **অগ্নি-প্রতিরোধী দেয়ালসহ পৃথক কক্ষ** ব্যবহার করতে হবে।",
            "**স্পিল মোকাবিলার সরঞ্জাম** প্রস্তুত রাখতে হবে এবং ছড়িয়ে পড়া পণ্য জমতে বা ছড়িয়ে যেতে দেওয়া যাবে না।",
        ],
    },
    "O-3": {
        "title": {
            "en": "GHS06 Toxic + GHS02 Flammable",
            "bn": "বিষাক্ত + দাহ্য",
        },
        "en": [
            "Confirm compatibility using product **SDSs and labels**. Use **separation or segregation** if the products are incompatible; use **segregation for larger quantities** or higher risk.",
            "**Prevent all ignition sources**; maintain **effective ventilation** to prevent flammable-vapour build-up.",
            "Keep **fire-fighting access clear**. Provide suitable **alarms** and **fire extinguishers**; for larger or higher-hazard storage, **automatic detection** and **sprinkler/automatic extinguishing** should be considered.",
            "Do not store more than **250 tonnes of flammable liquid** in one compartment unless **special fire protection** is provided, such as an **automatic alarm** with rapid fire-service response, **sprinklers**, or another **automatic extinguishing system**.",
            "Keep **toxic-exposure controls**, appropriate **PPE**, **spill containment**, and **emergency procedures** in place.",
        ],
        "bn": [
            "পণ্যের **SDS ও লেবেল** ব্যবহার করে সামঞ্জস্যতা নিশ্চিত করতে হবে। পণ্য অসামঞ্জস্যপূর্ণ হলে **আলাদা স্থান বা পৃথক কক্ষে** রাখতে হবে; **পরিমাণ বেশি বা ঝুঁকি বেশি হলে পৃথক কক্ষে** সংরক্ষণ করতে হবে।",
            "**সব ধরনের প্রজ্বলন উৎস নিয়ন্ত্রণ/দূর** করতে হবে এবং দাহ্য বাষ্প জমা রোধে **কার্যকর বায়ুচলাচল** নিশ্চিত করতে হবে।",
            "**অগ্নিনির্বাপণের প্রবেশপথ খালি** রাখতে হবে। উপযুক্ত **অ্যালার্ম** ও **অগ্নিনির্বাপক** রাখতে হবে; বড় বা উচ্চ-ঝুঁকির স্টোরেজে **স্বয়ংক্রিয় অগ্নি শনাক্তকরণ** এবং **স্প্রিংকলার/স্বয়ংক্রিয় নির্বাপণ** ব্যবস্থা বিবেচনা করতে হবে।",
            "বিশেষ অগ্নি সুরক্ষা ছাড়া একটি কম্পার্টমেন্টে **২৫০ টনের বেশি দাহ্য তরল** রাখা যাবে না। বিশেষ সুরক্ষার উদাহরণ: দ্রুত ফায়ার সার্ভিস প্রতিক্রিয়াসহ **স্বয়ংক্রিয় অ্যালার্ম**, **স্প্রিংকলার**, অথবা অন্য **স্বয়ংক্রিয় অগ্নিনির্বাপণ ব্যবস্থা**।",
            "**বিষাক্ত এক্সপোজার নিয়ন্ত্রণ**, উপযুক্ত **PPE**, **স্পিল-ধারণ ব্যবস্থা** এবং **জরুরি পদ্ধতি** কার্যকর রাখতে হবে।",
        ],
    },
}

REFERENCES = [
    "Section 4.2, p. 6: Product hazards; SDS and labels are key sources of information.",
    "Section 4.4.7, pp. 14-15: Product segregation and separation; hazard grouping; 3 m separation; fire-wall segregation; incompatible products; 250-tonne flammable-liquid limit.",
    "Section 4.4.8, p. 16: Storage plan, containment, storage arrangement, and fire-fighting access.",
    "Section 4.6, pp. 21-23: Spill response, clean-up, spill equipment, and disposal.",
    "Section 4.7.1, pp. 24-25: Ignition-source control, ventilation, and hazardous-area considerations for flammable goods.",
    "Section 4.8, pp. 26-27: Alarms, fire extinguishers, hydrants/hose lines, and sprinklers.",
]

READING_RULE = {
    "en": "Identify the two products' GHS pictograms from their labels/SDS, then read the intersection of the corresponding row and column. The matrix is symmetrical.",
    "bn": "পণ্য দুটির লেবেল/SDS থেকে GHS পিক্টোগ্রাম শনাক্ত করুন, তারপর সংশ্লিষ্ট সারি ও কলামের ছেদস্থল দেখুন। ম্যাট্রিক্সটি প্রতিসম।",
}

OPERATIONAL_NOTE = {
    "en": "This matrix is a storage-screening aid, not a replacement for the SDS or a site-specific risk assessment. Where the chart, SDS, or local legal requirements differ, follow the more stringent requirement.",
    "bn": "এই ম্যাট্রিক্সটি সংরক্ষণ-প্রাথমিক যাচাইয়ের সহায়ক, SDS বা সাইট-নির্দিষ্ট ঝুঁকি মূল্যায়নের বিকল্প নয়। চার্ট, SDS বা স্থানীয় আইনি requirement ভিন্ন হলে বেশি কঠোর requirement অনুসরণ করুন।",
}

KEEP_PRODUCT_FIELDS = [
    "id",
    "name",
    "nameVariants",
    "designCode",
    "materialNumber",
    "materialState",
    "productType",
    "sdsAvailable",
    "sdsNumber",
    "sdsVersion",
    "sdsRevisionDate",
    "sourceRef",
    "extractionStatus",
    "extractionNotes",
    "pictograms",
    "pictogramsNotStated",
    "signalWord",
    "hazardClassifications",
    "hazardStatements",
    "precautionary",
    "storageConditions",
    "incompatibleMaterials",
    "unNumber",
    "transportClass",
    "packingGroup",
    "supplier",
    "firstAid",
]


def canonical_hash(document: dict) -> str:
    payload = {k: v for k, v in document.items() if k != "hash"}
    canonical = json.dumps(
        payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:16]


def build_pairs() -> list[dict]:
    """Expand the upper triangle into a symmetrical pair list."""
    pairs = []
    for a, b, outcome, condition in MATRIX_UPPER:
        pairs.append({"a": a, "b": b, "outcome": outcome, "condition": condition})
        if a != b:
            pairs.append({"a": b, "b": a, "outcome": outcome, "condition": condition})
    return pairs


def build(source: Path) -> dict:
    with source.open("r", encoding="utf-8") as handle:
        source_data = json.load(handle)

    products = []
    for product in source_data.get("products", []):
        trimmed = {key: product.get(key) for key in KEEP_PRODUCT_FIELDS}
        trimmed.setdefault("pictograms", [])
        products.append(trimmed)

    pictograms = []
    for pictogram in source_data.get("pictograms", []):
        code = pictogram.get("code")
        if not code:
            continue
        pictograms.append(
            {
                "code": code,
                "sign": pictogram.get("sign", ""),
                "hazard": pictogram.get("hazard", ""),
                "inMatrix": code in MATRIX_PICTOGRAMS,
                "asset": pictogram.get("asset") or code.lower(),
            }
        )

    with_sds = sum(1 for p in products if p.get("sdsAvailable"))

    snapshot = {
        "version": 2,
        "generatedAt": datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z"),
        "site": source_data.get("site", {"id": "CTG", "name": "Chattogram Warehouse"}),
        "counts": {
            "products": len(products),
            "withSds": with_sds,
            "withoutSds": len(products) - with_sds,
            "matrixPairs": len(build_pairs()),
        },
        "pictograms": pictograms,
        "matrix": {
            "version": 1,
            "source": "Chemical Compatibility Matrix — HSE Guide 75_59_01 GD_Warehousing v1.0",
            "readingRule": READING_RULE,
            "pictograms": MATRIX_PICTOGRAMS,
            "pairs": build_pairs(),
            "conditions": CONDITIONS,
            "references": REFERENCES,
            "operationalNote": OPERATIONAL_NOTE,
        },
        "products": products,
        "contacts": source_data.get("contacts", []),
    }
    snapshot["hash"] = canonical_hash(snapshot)
    return snapshot


def main() -> int:
    if len(sys.argv) < 2:
        print(
            "Usage: python tools/build_snapshot.py <path-to-source-snapshot.json>"
        )
        return 1

    source = Path(sys.argv[1])
    if not source.exists():
        print(f"Source snapshot not found: {source}")
        return 1

    snapshot = build(source)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as handle:
        json.dump(snapshot, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    print(f"Wrote {OUTPUT}")
    print(
        "Products: {products} | with SDS: {withSds} | without SDS: {withoutSds} | matrix pairs: {matrixPairs}".format(
            **snapshot["counts"]
        )
    )
    print(f"Hash: {snapshot['hash']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
