# DESIGN_SYSTEM.md

WareSafe looks and behaves like a native iOS app, because warehouse assistants
already know that grammar and can use it without thinking. On Android it feels
like iOS on purpose.

The visual direction was generated with the
[UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) skill
for a *warehouse safety compliance mobile tool*:

- **Style:** Minimalism & Swiss Style — clean, spacious, functional, white
  space, high contrast, geometric, grid-based, essential. Chosen for
  professional tools and enterprise apps; low performance cost, low
  accessibility risk.
- **Pattern:** trust-first, answer-first. The verdict is the first thing on
  screen; evidence and conditions follow.
- **Anti-patterns to avoid:** hidden consent, weak audit trail, confusing
  flow. Applied here as: every verdict carries its source, its deciding pair
  and the conditions in words.

The brand layer sits on top of that grammar: Syngenta navy, the Syngenta
palette, Montserrat, and the Syngenta logo.

---

## 1. Colour

### 1.1 Palette

All values from `Syngenta Color Pallets.txt`, plus the navy lifted from the
Syngenta logo fill (`#010066`).

| Token | Hex | Role |
|---|---|---|
| `--brand-navy` | `#010066` | Header surface, primary brand ink |
| `--brand-navy-700` | `#1A1A80` | Elevated navy surfaces, tab bar |
| `--brand-turquoise` | `#02E3BB` | Accent on navy — primary action, focus, active state |
| `--brand-turquoise-soft` | `#52EFD3` | Accent wash, secondary highlight |
| `--brand-green` | `#7FDE44` | `ok` outcome |
| `--brand-pink` | `#F70566` | `no` outcome, alarm |
| `--brand-orange` | `#FCBF61` | `conditional` outcome |
| `--brand-cyan` | `#10CCBE` | Informational accent, secondary data |

### 1.2 Neutrals

| Token | Hex | Role |
|---|---|---|
| `--text-primary` | `#0E0E2E` | Body and headings |
| `--text-secondary` | `#4A4A63` | Supporting text, captions |
| `--text-tertiary` | `#78788F` | Metadata, timestamps |
| `--text-on-navy` | `#FFFFFF` | Text on navy surfaces |
| `--surface-base` | `#FFFFFF` | Cards, sheets |
| `--surface-grouped` | `#F3F3F8` | Grouped list background |
| `--surface-sunken` | `#EAEAF2` | Inset fields, chips |
| `--separator` | `rgba(16,16,48,0.10)` | Hairlines |

### 1.3 Matrix outcomes

Every outcome carries a **symbol, a colour and a word**. Never colour alone.

| Outcome | Symbol | Colour | Wash | Text on wash |
|---|---|---|---|---|
| `ok` — joint storage permitted | ✓ | `#7FDE44` | `#E9F9DC` | `#1F5C0A` |
| `conditional` — permitted with conditions | O | `#FCBF61` | `#FDF2DF` | `#7A4A00` |
| `no` — not permitted | X | `#F70566` | `#FDE6EF` | `#A3003F` |
| Review required | help icon | `#5A5A72` | `#EDEDF4` | `#3A3A52` |
| No matrix restriction | help icon | `#5A5A72` | `#EDEDF4` | `#3A3A52` |

**Review required and no-matrix are deliberately grey-blue, not a colour.**
Neither is a verdict; giving them a bright hue would imply a decision was made.

Contrast against their own wash is ≥ 7:1 for the text pairs above.

### 1.4 Emergency

| Token | Hex | Use |
|---|---|---|
| `--emergency` | `#D6003C` | Emergency call-to-action surface |
| `--emergency-soft` | `#FDE6EF` | Emergency banner background |
| `--emergency-text` | `#8E0030` | Emergency banner text |

---

## 2. Typography

| Script | Stack | Source |
|---|---|---|
| Latin | `Montserrat Variable` | Self-hosted `woff2`, 38 KB, `font-weight: 100 900` |
| Bangla | `Noto Sans Bengali` | Self-hosted `woff2`, variable, `font-weight: 100 900` |

Both faces are self-hosted so the app works with no signal, renders Bangla the
same on every phone, and never calls a third party from the warehouse floor.

```css
--font-stack: "Montserrat Variable", -apple-system, BlinkMacSystemFont,
  "Segoe UI", system-ui, var(--font-bangla), sans-serif;
```

**The Latin family comes first, and that order is load-bearing.** A browser
picks a family per character, not per run of text. Montserrat has no Bangla
glyphs, so Bangla falls through to Noto Sans Bengali. The reverse order fails
silently: Noto carries a complete Latin set and would claim every English
letter.

---

## 3. Layout

- Content is a single column, max `560px`, centred. Phone-first; the same
  layout reads as a comfortable reading column on a tablet.
- 4/8 px spacing rhythm through the `--space-*` tokens.
- Fixed navy top bar and bottom tab bar; the app body owns scrolling, so the
  large title scrolls under the glass bar.
- Safe areas respected on every fixed surface (`env(safe-area-inset-*)`).
- Touch targets are at least 44 px.

### Screen structure

| Screen | Order |
|---|---|
| Store (landing) | Large title → recents → search + catalogue → matrix legend → scope note → source card |
| Store (product) | Hero → compatibility buckets → hazard summary → hazard statements → storage conditions → incompatible materials → precautionary statements → SDS reference → boundary → source card |
| Compare | Large title → A/B slots → verdict → conditions → why-this-result |
| Pair | Back bar → both products with pictograms → verdict → conditions → why-this-result |
| Response | Large title → escalation → product search → first aid by route → emergency directory |

---

## 4. Components

| Component | Rule |
|---|---|
| Verdict card | Answer first, on a solid outcome fill (green / amber / red / grey) with ink that clears 4.5:1. Symbol + headline + specific meaning + deciding pair + “do not decide from colour alone”. |
| Pair header | Both product names and pictogram sets side by side, so the starting product is never lost. |
| Conditions panel | Specific O-n conditions first (actionable), general conditions collapsed. X verdicts show the separation/segregation instruction. Core numbers and instructions are bolded with an amber highlight; the markers are authored in the dataset. |
| Bucket | Solid red / amber / green / grey bands with a colour-filled header and an always-visible list. Tapping a partner row opens the pair view (verdict, conditions, why); there are no inline expanders. |
| Matrix symbol | Symbol plus word; `aria-hidden` on the glyph when a visible label repeats it. |
| Pictogram pair | Two images with an accessible label built from the hazard names, e.g. “Acute Toxicity × Flammables”. |
| Source card | Collapsed by default: source line, reading rule, operational note, references. |

---

## 5. Motion

- `--motion-fast` 150 ms for press states, `--motion-standard` 250 ms for
  screen entry, `--motion-sheet` 400 ms for the bottom sheet.
- Press feedback scales by 0.97 or tints the surface; it never moves
  surrounding content.
- `prefers-reduced-motion: reduce` collapses every animation and transition.

---

## 6. Accessibility checklist

Checked before delivery, following the skill's pre-delivery checklist:

- [x] No emoji as icons; every glyph is an inline SVG on one 24×24 grid.
- [x] Meaningful icons have text alternatives; decorative icons are
      `aria-hidden`.
- [x] Pictogram pairs carry an accessible label with the hazard names.
- [x] Colour is never the only carrier of meaning — every symbol has a word.
- [x] Text contrast ≥ 4.5:1 on its own surface; outcome text ≥ 7:1 on wash.
- [x] Visible focus ring (`:focus-visible`, turquoise, 3 px).
- [x] Touch targets ≥ 44 px.
- [x] `prefers-reduced-motion` respected.
- [x] Forced-colours mode keeps card and verdict borders.
- [x] Collapsed panels use `hidden` and `aria-expanded`, and `[hidden]` wins
      over author `display` values.
- [x] Bottom sheet closes with the button, the backdrop and Escape.
- [x] Layout tested at 375 px, 768 px and desktop widths; no horizontal
      overflow.
- [x] Bangla and English both render without clipping at the same layout.
