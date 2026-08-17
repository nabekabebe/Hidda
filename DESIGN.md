---
name: Night Atlas
description: A family tree as a navigable night sky, with kinship drawn as a constellation.
colors:
  sky: "#141a2e"
  sky-deep: "#0d1324"
  gold: "#d2aa76"
  bone: "#faf6ea"
  ink: "#e8eef8"
  muted: "#9aa6b8"
  constellation: "#7aa2ff"
  glass: "rgb(5 16 27 / 0.72)"
  panel: "#101826"
  danger: "#e08b7a"
typography:
  display:
    fontFamily: "Barlow Condensed, Avenir Next Condensed, sans-serif"
    fontSize: "clamp(3rem, 6vw, 3.75rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "0.02em"
  headline:
    fontFamily: "Barlow Condensed, Avenir Next Condensed, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "0.02em"
  title:
    fontFamily: "Barlow Condensed, Avenir Next Condensed, sans-serif"
    fontSize: "2rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "0.14em"
  star:
    fontFamily: "Barlow Condensed, Avenir Next Condensed, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "0.16em"
  body:
    fontFamily: "Barlow, Avenir Next, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  bio:
    fontFamily: "Source Serif 4, Iowan Old Style, Palatino Linotype, serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Barlow Condensed, Avenir Next Condensed, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.18em"
rounded:
  full: "9999px"
  instrument: "28px"
  nested: "24px"
  well: "16px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.sky-deep}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
    typography: "{typography.body}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
    typography: "{typography.body}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.sky-deep}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
    typography: "{typography.body}"
  chip-idle:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
    typography: "{typography.body}"
  chip-active:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.sky-deep}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
    typography: "{typography.body}"
  input-field:
    backgroundColor: "color-mix(in srgb, {colors.sky} 40%, transparent)"
    textColor: "{colors.ink}"
    rounded: "{rounded.well}"
    padding: "8px 12px"
    typography: "{typography.body}"
  tool-gold:
    backgroundColor: "transparent"
    textColor: "{colors.gold}"
    rounded: "{rounded.full}"
    size: "40px"
  compass-action:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.sky-deep}"
    rounded: "{rounded.full}"
    size: "48px"
    typography: "{typography.label}"
  star-disk:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.gold}"
    rounded: "{rounded.full}"
    size: "84px"
  catalog-slip:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.instrument}"
    padding: "20px"
    width: "320px"
---

# Design System: Night Atlas

## Overview

**Creative North Star: "Night Atlas"**

The family is a night sky you navigate. People are portrait-stars; kinship is the constellation you draw by selecting a star and adding at the compass. The product is the atlas, not a database dressed as a page: the canvas is full-bleed ink-navy, instruments float as glass chrome, and a selected life opens as a catalog slip rather than a form stack.

Materials are specific. The sky is a solid ink-navy field. Portrait-stars wear a thin gold rim. Names are bone-white condensed inscriptions. Biography is the one serif voice, set as a short catalog note. Glass panels sit on the sky with blur, a hairline light edge, and an inset highlight — instrument chrome, not cards on cream.

The system refuses parchment genealogy, cream family-book cards, rectangular person tiles, and form-first CRUD. A day-chart theme exists as a mapped inversion of the same tokens (cool steel sky, deeper bronze gold, ink-dark inscriptions), not as a second, paper world.

**Key Characteristics:**

- Full-bleed atlas canvas with circular portrait-stars on a solid navy field
- Gold used as catalog metal: rims, years, compass, primary actions — never as a large fill
- Barlow Condensed for names, wordmark, and field labels; Barlow for UI; Source Serif 4 for biography only
- Glass instrument column left, catalog slip right, compass add around the selected star
- Depth from glass and gold rings — not from stacked white cards

## Colors

Night metal on ink. The canvas is navy; gold is scarce catalog brass; bone writes the names; a cool blue marks non-blood lines.

### Primary
- **Catalog Gold**: Rim, year, compass, primary button, focus ring, and field-label metal. It must read as a thin instrument finish. Large gold fills are out of character except the 48px compass disks and pill buttons.

### Secondary
- **Constellation Blue**: Partner bonds and adoptive lines. Blood and spouse strokes stay gold; this blue is the other ink on the chart.

### Neutral
- **Ink Navy (sky)**: Page ground and atlas field. Every surface sits on it.
- **Sky Deep**: Text on gold, selection text, and the darker well behind portrait-stars.
- **Bone**: Condensed inscriptions — names, wordmark, dialog titles.
- **Chart Ink**: Body copy on glass and sky.
- **Muted Steel**: Supporting copy, captions, idle icons.
- **Instrument Glass**: Frosted navy over the sky for chrome, slip, and dialogs.
- **Panel**: Opaque fallback for initials disks and for glass when transparency is reduced.
- **Warning Copper**: Delete and error only.

### Named Rules
**The Night Canvas Rule.** The sky is the page. Cream boards, paper genealogy, and dashboard wells never replace the atlas.

**The Gold Rim Rule.** Gold is catalog metal on ≤ the rims, years, labels, compass, and primary pills. If a layout needs a large filled plane, it is sky, glass, or panel — not gold.

## Typography

**Display Font:** Barlow Condensed (with Avenir Next Condensed, sans-serif)
**Body Font:** Barlow (with Avenir Next, sans-serif)
**Bio Font:** Source Serif 4 (with Iowan Old Style, Palatino Linotype, serif)

**Character:** Condensed catalog lettering for anything that belongs on a star chart; humanist sans for controls and supporting copy; a single serif for the life note. Tight tracking and uppercase are for inscriptions, not paragraphs.

### Hierarchy
- **Display** (500, 3rem–3.75rem, 1.1): Home greeting and empty-sky title. Sentence case. Catalog face, default 0.02em tracking.
- **Headline** (500, 1.875rem, 1.1): Dialog titles and home section heads (`Recently added`). Catalog face, mixed case.
- **Title** (500, 2rem, 1.1, 0.14em): Selected person on the catalog slip, uppercase. Canvas node names use the same face at 1.05rem, uppercase, 0.16em.
- **Body** (400, 0.875rem, 1.5): UI copy, form fields, delete warnings. Measure stays short on empty and home ledes (about 36–40ch).
- **Bio** (400, 15px, relaxed): Profile description only, roman with italic available.
- **Label** (500, 11px, 0.18em, uppercase): Slip field names and relation group heads, in gold. Compass captions are the same face at 8px / 0.14em.

Years under a star are catalog, gold, 0.875rem, tracked ~0.12em — a label, not body.

### Named Rules
**The Catalog Inscription Rule.** Names, years, generation marks, and the wordmark use Barlow Condensed. Body stays Barlow. Biography is the only serif. Do not uppercase body or bio.

## Layout

The atlas is a 100dvh full-bleed field. On desktop the instrument column is a vertical glass rail, vertically centered on the left; the catalog slip is a 320px column pinned to the right with 16px inset. The wordmark sits at the top center of the sky. The tree itself is a pan/zoom plane (scale about 0.28–1.8) with nodes 168×200 and generation pitch 268.

Generation lives in the tree layout itself — parents above, children below — not as a painted grid on the sky.

Home is a reading column (`max-w-6xl`, 20–32px page padding, 40px vertical rhythm) with a 32px-radius glass preview well. It is the only stacked page; it still uses sky, catalog type, and portrait-stars.

Below 768px the instrument rail becomes a horizontal cluster at the top, the slip becomes a bottom sheet (top corners 28px, max height ~82dvh), and dialogs may also sheet. Touch pan and pinch replace hover-only tools. Important actions stay as buttons, not hover.

Spacing rhythm is 8 / 16 / 20 / 24. Glass chrome pads 8px; slips and dialogs pad 20–24px; form stacks gap 16px; field label-to-input gap 6px.

## Elevation & Depth

Depth is atmospheric: a solid navy field, glass blur, and gold rings. Surfaces do not stack as paper cards. Glass carries a soft drop so chrome reads as an instrument hovering over the chart; portrait-stars carry a tighter dark drop plus the gold rim. Selected stars add a gold glow.

### Shadow Vocabulary
- **Glass hover** (`box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.18), 0 18px 40px rgb(0 0 0 / 0.28)`): Instrument bar, catalog slip, modal, sheet, context menu. Pair with `backdrop-filter: blur(22px) saturate(1.35)` and a 1px light edge (`rgb(255 255 255 / 0.12)`).
- **Star rest** (`0 8px 20px rgb(0 0 0 / 0.28), 0 0 0 1.5px var(--gold)`): Portrait-star rim.
- **Star selected** (`0 10px 28px rgb(210 170 118 / 0.32), 0 0 0 2px var(--gold)`): Selected disk and the large slip portrait.
- **Compass** (`0 8px 20px rgb(0 0 0 / 0.28)`): The four add disks.

When `prefers-reduced-transparency` is on, glass loses blur and sits on panel. Day-chart glass uses a lighter inset highlight and a cooler 14px-class drop.

### Named Rules
**The Glass Over Sky Rule.** Chrome, slips, and dialogs are glass on the atlas. Do not introduce a white card layer to create hierarchy.

## Shapes

Two silhouettes: the circle and the stadium. People, compass actions, buttons, chips, and tool hits are fully round. Glass instruments, slips, and dialogs use a 28px stadium-squircle; nested popovers and the photo well use 24px; inputs, search, mini-map, and menus use 16px.

Borders are hairlines: gold 1.5–2px rings on stars, ink at 14–16% on ghost buttons and fields, dashed gold on the portrait drop zone. No sharp rectangles for people. Photos crop to a circle before they enter the sky.

## Components

### Buttons
- **Shape:** Fully round (9999px), 8×16 padding, 0.875rem medium Barlow.
- **Primary (gold):** Gold fill, sky-deep label. Default for Place / Continue / Save.
- **Ghost:** Transparent, ink label, 16% ink hairline. Cancel, secondary, icon actions on the slip.
- **Danger:** Copper fill, sky-deep label. Delete only.
- **Hover / Focus:** No fill shift. `:active` scales to 0.97 (140ms ease-out). Focus is a 2px gold ring, 3px offset. Disabled at 40% opacity.

### Chips
- **Style:** Fully round, 4×12 padding, 0.875rem. Idle is a 14% ink hairline; active is gold fill with sky-deep text.
- **State:** Used for living/gender/tag filters and for gender on the person form (active = gold stroke and gold text, not always a fill).

### Cards / Containers
- **Corner Style:** 28px on instrument, slip, modal, sheet; 24px on the overflow tool tray; 16px on mini-map and context menu.
- **Background:** Glass recipe (gradient + `--glass`), not a solid card.
- **Shadow Strategy:** Glass hover vocabulary above.
- **Border:** 1px light edge.
- **Internal Padding:** 8px on the tool rail; 20–24px on slip and dialog.

### Inputs / Fields
- **Style:** 16px corners, 14% ink hairline, sky at 40% fill (or transparent in filters), 8×12 padding, gold caret.
- **Focus:** Global gold 2px ring, 3px offset. No extra inner glow.
- **Error:** Body-size copper message under the stack. First name empty is a validation voice, not a red border language.

### Navigation
Instrument rail: 40px round hits, 18px phosphor glyphs. Primary tools are gold; overflow tools are bone; the active/more state is gold at 22% fill. Horizontal on small screens, vertical on desktop. Home wordmark is catalog; “Open the sky” is a gold text link, 0.875rem.

### Portrait-star
Circular photographic disk (rest 84px, selected 96px, slip 128px, list 36px) with a gold rim. Missing photos show catalog initials on panel. Ghosted (filtered/focus-mode) stars sit at ~28–35% opacity. A search pulse scales the disk once (strike, 900ms).

### Compass
Four 48px gold disks around the selected star: Parent above, Child below, Sibling left, Spouse right, each with a condensed `+` and 8px uppercase caption. This is the add affordance.

**The Compass Add Rule.** New kin are placed from the selected star’s cardinals. A form may complete the person; it does not replace the compass as the way into adding.

### Catalog slip
Glass column: large selected star, uppercase name, gold year, serif bio, gold 11px labels, then relation rows with 36px stars. Footer is three ghost icon buttons (edit, focus, delete).

### Dialogs
Modal: dim `rgb(2 8 16 / 0.62)`, glass panel 28px, max-width 32rem (52rem when wide), catalog title. Sheet on small screens: 28px top corners, 420ms drawer ease, 4px grab tick.

## Do's and Don'ts

### Do:
- **Do** set new screens on ink navy with glass chrome and gold used as rim, type metal, and pill — not as wallpaper.
- **Do** represent people as circular portrait-stars with a 1.5–2px gold ring and condensed uppercase names.
- **Do** add relatives from the four compass actions on the selected star.
- **Do** set biography in Source Serif 4 at 15px and keep UI copy in Barlow.
- **Do** keep generation structure visible in the tree layout, not as a painted grid on the sky.

### Don't:
- **Don't** rebuild the tree as cream genealogy cards, parchment, tables, or rectangular avatar tiles.
- **Don't** open a form-first add flow when a star is selected; the compass is the add.
- **Don't** set body paragraphs or bio in Barlow Condensed, and don't uppercase running text.
- **Don't** fill large regions with gold or constellation blue; those colors are line, rim, and small controls.
- **Don't** introduce a white or cream card layer to solve hierarchy — use glass over sky, or dim the unused stars.
