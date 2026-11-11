# GHS pictogram sources

These nine files are the **official GHS hazard pictograms**, not drawings
made for this project. WareSafe does not render a pictogram; it ships the
same symbol that is printed on the safety data sheet and on the label.

| File | Meaning | Upstream file | SHA-256 of upstream bytes | SHA-256 of installed file |
|------|---------|---------------|----------------------------|---------------------------|
| `ghs01.svg` | Explosive | [GHS-pictogram-explos.svg](https://upload.wikimedia.org/wikipedia/commons/4/4a/GHS-pictogram-explos.svg) | `7daedecc22828389b734a0735a0e207f483184b1e4e3446e8b009df9ebff1c43` | `d78977b5c1187da8f8da21fe3f5d363a59d59df86af7391d8588bc357deb92a3` |
| `ghs02.svg` | Flammable | [GHS-pictogram-flamme.svg](https://upload.wikimedia.org/wikipedia/commons/6/6d/GHS-pictogram-flamme.svg) | `e812ae23f6139af28167cab0a6ad131c116677121b785098a57213c281e03752` | `fcf5398d3813fdf6aa8b62eeb044dc4bcc6ee032ee5212102f29fe467de9e06d` |
| `ghs03.svg` | Oxidiser | [GHS-pictogram-rondflam.svg](https://upload.wikimedia.org/wikipedia/commons/e/e5/GHS-pictogram-rondflam.svg) | `aab8cd9f2f842a499768ef1ac58a7ae2947e0a0b9ce9835167d4da1b45320904` | `4b5457199be8dc210a0535350cfe3a91eef156d57726abc5f7dcb51a864516b5` |
| `ghs04.svg` | Compressed gas | [GHS-pictogram-bottle.svg](https://upload.wikimedia.org/wikipedia/commons/6/6a/GHS-pictogram-bottle.svg) | `5792f474c746302f73d075a91cf5eb5872fa4de1e2068b02f44537177746aeae` | `6e41c018e105bb428994b5755234900e2f344d6b2053c9da64d80e25f034429c` |
| `ghs05.svg` | Corrosive | [GHS-pictogram-acid.svg](https://upload.wikimedia.org/wikipedia/commons/a/a1/GHS-pictogram-acid.svg) | `e70b57e57cb7a53ef97b8b0f9d7d143674293b6bb1338991dfebdfd5848097c0` | `e62b727d29b25f8f90a3a3f0e57e242df88769f059673a7843e5b2218439a333` |
| `ghs06.svg` | Acute toxicity | [GHS-pictogram-skull.svg](https://upload.wikimedia.org/wikipedia/commons/5/58/GHS-pictogram-skull.svg) | `8f84bcbb0e09d83011afda408e001cb9fc15603dba4a47a673b55db867ba4394` | `c3e7920a0b4810fa2d729a64d9270f6e090b3cd0f1048bf51f11cb20118807ed` |
| `ghs07.svg` | Harmful / irritant | [GHS-pictogram-exclam.svg](https://upload.wikimedia.org/wikipedia/commons/c/c3/GHS-pictogram-exclam.svg) | `0774fa5f0b69944b5732df42195310513745f1835222b7c6fe51dfb8cffa7372` | `85fa00f1ff61dc1d8a02e3071d8979e96e36d0171ac9e9a23cffbaf4c99fc701` |
| `ghs08.svg` | Health hazard | [GHS-pictogram-silhouette.svg](https://upload.wikimedia.org/wikipedia/commons/2/21/GHS-pictogram-silhouette.svg) | `a9d7063bf811a5a8462b6aef95b9e1cfff7cf4799242104a9ecae365c0483029` | `9db426fb033781fe0f77f7464fc2c37b84aa64be14dc973052aedc1fb82a1def` |
| `ghs09.svg` | Environmental hazard | [GHS-pictogram-pollu.svg](https://upload.wikimedia.org/wikipedia/commons/b/b9/GHS-pictogram-pollu.svg) | `ac03bb8aa044e841ffb84c1d1e7a2453c2553475750a2b97bd2bdac891071d19` | `fa84f1532ec83c4263aed6d6d59ab860c9e1a94f6c17d6d06e3f43f0d6fd567d` |

Licence: the GHS pictograms were drawn by the United Nations Economic
Commission for Europe (UNECE) and are published without restriction. The
Wikimedia Commons copies are in the public domain. The files may be
reproduced freely, including for commercial and safety use.

Regenerate with:

```bash
python tools/fetch_pictograms.py
```

The script refuses to install a file whose SHA-256 does not match the value
recorded above, so the artwork cannot drift without the change being seen.
The second hash is of the installed file, so a hand edit to a pictogram is
caught by the test suite as well.

## The site's own JPG set

`Hazard Pictograms/` in the project root holds the same nine signs as
720 × 721 JPGs, `GHS01-Hazard-pictogram.jpg` through
`GHS09-Hazard-pictogram.jpg`. They were reviewed against the artwork shipped
here and are **not** used in the app.

| | Site JPG set | Shipped here |
|---|---|---|
| Format | JPEG, 720 × 721, opaque white background | SVG, transparent background |
| Rim red | `#EF4136` | `#FF0000`, the official GHS red |
| Edges | Raster — soft at 3× on a phone screen | Vector — sharp at any density |
| Weight | 19–31 KB each | 0.8–17 KB each |
| Licence | Not stated on the files | UNECE, published without restriction |

The shapes match the UNECE artwork. The difference is the rim colour and the
format, not the symbol, so the vector files show the same thing the assistant
reads on the label.

The rim colour is the one open question. If HSE wants the app to use
`#EF4136` so the diamond matches the site's own printed signage, that is a
branding decision, not a data decision, and it would be shipped as a
recoloured copy of the official artwork with the colour recorded here. Until
that decision is made, the app uses the official GHS red, because a hazard
pictogram is a safety symbol and its colour is part of the standard.

The JPGs stay in the repository as the site's own reference copy.
