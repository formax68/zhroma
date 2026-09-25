# Stack Research: v1.1 Themes & Rules

**Domain:** Adding themes, dark-mode awareness, a custom AND/OR rule engine and editor, an options page, and local storage with file export/import to a published, no-build, `storage`-only MV3 extension (Zhroma 0.1.0 → store version 1.0.0)
**Researched:** 2026-09-25
**Confidence:** MEDIUM-HIGH overall. Chrome API behaviour and quotas were checked against developer.chrome.com. Package versions and theme licences were read directly from the npm registry and GitHub licence APIs on 2026-09-25. Zendesk dark-mode DOM signalling is **LOW**: it is undocumented and needs live recon.

**Scope:** This file only revises the v1.0 stack (`.planning/milestones/v1.0-research/STACK.md`) where the new scope changes it. The v1.0 calls on declarative content scripts, `!important` unlayered CSS, no `@layer`, the attribute-plus-CSS styling seam, happy-dom and Vitest still stand and are not repeated here.

---

## The Headline Verdicts

1. **No new permission. The manifest stays at `permissions: ["storage"]`.** Everything v1.1 needs is either a manifest key that grants no capability (`options_ui`) or a web-platform API available to every extension page (`Blob`, `<a download>`, `<input type=file>`, `matchMedia`, `getComputedStyle`). `downloads`, `unlimitedStorage`, `host_permissions`, `scripting`, `tabs` and `identity` are all unnecessary. Adding any of them is a regression. (HIGH)
2. **No new runtime dependency.** Theme palettes are vendored as hex literals with licence headers. Colour maths is about 60 lines of hand-written sRGB/WCAG/OKLab code. The rule engine is a small interpreter over a data AST. Import validation is a hand-written "parse, don't validate" module. Each library you might reach for (ajv, zod, culori, colorjs.io, json-logic-js, SortableJS, Lit) would either be a runtime dependency in the shipped zip or, in ajv's case, would rely on `new Function`, which MV3 extension CSP forbids. (HIGH)
3. **Stay hand-written: no WXT, no bundler, no `.ts` emit.** v1.0 set a trigger of "migrate to WXT when any two of (a) more than 800 lines, (b) an options page or popup exists, …". That trigger has now fired, because the runtime is 1,295 lines and has a popup. **Override it on purpose.** The trigger was written before the project adopted its evidence model, where evidence binds to shipped bytes and acceptance reads pinned Git blobs. That model is now the most expensive thing in the project, and a bundler would break it: it inserts a generated artifact between the reviewed source and the shipped zip. Share code across contexts with classic-script IIFE files that each register on a namespace object (§10). (HIGH on the rationale, MEDIUM on long-term ergonomics)
4. **`minimum_chrome_version` stays at `"106"`.** Compute colours in JS and write them as plain `rgb(r g b / a)` strings. Do not use `color-mix()` (Chrome 111), `oklch()` (111), relative colour syntax (119) or `light-dark()` (123) in shipped CSS. JS-computed colours are testable in happy-dom, give one source of truth for the content script, the popup swatches and the options preview, and remove any reason to raise the floor. If a phase wants `popover` (114) or CSS nesting (112/120) on the options page, raising the floor is a permission-neutral manifest change. Make that choice on purpose, not by accident. (HIGH on version numbers, opinion on the call)

---

## Recommended Stack

### Core Technologies (all native, all zero-dependency)

| Technology | Version / Availability | Purpose | Why Recommended |
|------------|------------------------|---------|-----------------|
| `options_ui` manifest key with `"open_in_tab": true` | MV3, no permission | Rule editor, identity override, export/import | A nested AND/OR editor needs a full tab. The embedded `chrome://extensions` dialog sizes itself to its content, handles responsive layout poorly, and cannot use the Tabs API. File choosers are also reliable in a tab and flaky in popups (see below). `options_ui` is the current key; `options_page` is the legacy equivalent of `open_in_tab: true`. |
| `chrome.runtime.openOptionsPage()` | Chrome 42+, no permission | "Edit rules…" link in the popup | Opens or focuses the existing options tab. Call `window.close()` in the popup afterwards. |
| `chrome.storage.local` (existing `storage` permission) | 10,485,760-byte quota since Chrome 114 (5 MB before that) | Theme, rules, identity override | Already granted. Local only, as PROJECT.md requires (sync is out of scope). Realistic settings are around 20 KB for 50 rules, so even the 5 MB pre-114 quota is about 250× headroom. **Do not add `unlimitedStorage`.** |
| `chrome.storage.onChanged` / `chrome.storage.local.onChanged` | Chrome 73+ (per-area event) | Live propagation to open Zendesk tabs, the popup and other options tabs | `storage.local` is exposed to content scripts by default, and `content.js` already listens on this event for the `enabled` switch, so this extends a proven path. Re-validate `newValue` on receipt and never trust stored shape. |
| `Blob` + `URL.createObjectURL` + `<a download>` | Web platform, no permission | Export to a `.json` file | Needs no `downloads` permission. It is an ordinary user-initiated page download. Run it from the options tab, not the service worker (no DOM) and not the popup (it may close mid-action). |
| `<input type="file" accept=".json,application/json">` + `File.text()` | `File.text()` Chrome 76 | Import from a file | No permission. **Options page only.** File inputs in action popups are a long-standing flaky area: the popup can lose focus and close when the OS file chooser opens (Chromium issues 40114753 and 114898). The standard workaround is a tab-based extension page. |
| `JSON.parse` + hand-written validator (`lib/settings.js`) | n/a | Schema checking for imports and stored data | See §5. Shared by the options page (import), the worker (writes) and the content script (reads). |
| `getComputedStyle` + `MutationObserver` + `matchMedia('(prefers-color-scheme: dark)')` | Web platform | Detect Zendesk light/dark mode, including a switch mid-session | Zendesk offers light, dark and match-system modes, so `prefers-color-scheme` alone is wrong. Garden v9 carries the scheme in React context (`ThemeProvider colors.base`), not in a documented DOM attribute. Probe the luminance of the rendered table background, and re-probe on `<html>`/`<body>` attribute changes, `<head>` style insertions and `matchMedia` `change`. See §7. |
| CSSOM custom properties (`element.style.setProperty('--zhroma-…', value)`) | Web platform | Deliver JS-resolved colours to static `zhroma.css` rules | CSSOM writes are not blocked by page CSP `style-src`, unlike injecting `<style>` text, where Zendesk's CSP is unverified. `zhroma.css` stays a static, reviewable file, and each rule keeps a `var(--zhroma-urgent, rgb(220 38 38 / 0.14))`-style fallback equal to the 0.1.0 literal, so a fresh install paints exactly like 0.1.0 even before JS resolves a theme. |
| Native form controls: `<template>`, `<dialog>`, `<fieldset>`, `<select>`, `<input type="color">` | All below Chrome 106 | Rule editor, theme picker, confirm-before-import | `<input type=color>` returns lowercase `#rrggbb`, exactly the custom-hex format the validator accepts. `<template>` + `cloneNode` + `textContent` means no `innerHTML` anywhere, which matters because imported rule values are untrusted strings. |

### Supporting Libraries

**Runtime dependencies: none. This is unchanged and still load-bearing.**

Every row below is a devDependency and needs a new exact-version entry in `DEPENDENCY-APPROVALS.md` before installation. That is the project's existing gate.

| Library | Version (npm, 2026-09-25) | Purpose | When to Use |
|---------|---------------------------|---------|-------------|
| `vitest` | **keep `4.1.11`** (latest is 5.0.2, published today) | Test runner | Keep. Do not take a major published on the day of research while mid-milestone. The pinned version is attested. |
| `happy-dom` | **keep `20.13.1`** (latest 20.14.5) | DOM environment | Keep. Nothing in v1.1 needs a newer DOM. Options-page tests exercise `<template>`, forms, `Blob` and `File`, which happy-dom implements. |
| `typescript` | `7.0.2` | `tsc --noEmit --checkJs` only | **Recommended now.** It was recommended in v1.0 but never installed. v1.1 adds a stored schema, a rule AST and a theme model, shared across four contexts, which is exactly where structural checking pays. Put typedefs in a non-shipped `types/zhroma.d.ts`, or as JSDoc `@typedef` in `lib/*.js`. TS 7's JS checking is stricter: use `@typedef`, not `@enum` or `@class`, and write `typeof x` where a value is used as a type. Never emits. |
| `@types/chrome` | `0.3.0` (2026-09-15) | `chrome.*` types for checkJs | Only together with `typescript`. |
| `fast-check` | `4.10.2` | Property-based tests | **Optional, high value.** Generate arbitrary JSON and arbitrary rule trees, then assert that the validator never throws, always returns fresh whitelisted objects, and that `export → import` round-trips exactly. Hand-written example tests miss the malformed-import cases that matter. |
| `colorjs.io` | `0.7.1` (MIT, authored by CSS Color spec editors) | **Test oracle only** for the hand-written colour maths | **Optional.** Cross-check `lib/colour.js` (luminance, contrast, OKLab, compositing) against a spec-grade implementation in Vitest. It must never be imported from `extension/`. Add a test asserting that no file under `extension/` references it. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Existing `chrome://extensions` → Load unpacked loop | Dev loop for the options page as well | The options tab reloads with `location.reload()` after the extension reload arrow. No HMR needed. |
| Existing release-package / inventory tests | Guard the shipped file set | `test/extension/release-package.test.js` and `toolbar-popup.test.js` assert an exact `extension/` inventory. **Each new file (`options.*`, `lib/*`) must be added there deliberately.** That is a feature: it is the tripwire that stops dev tooling leaking into the zip. |
| New "baseline API guard" test (hand-written, around 20 lines) | Keeps shipped code within `minimum_chrome_version: 106` | Grep `extension/**` for above-floor APIs: `.toSorted(`, `.toSpliced(`, `.with(` on arrays (110), `Object.groupBy` (117), `Promise.withResolvers` (119), Set methods `.union(`/`.intersection(` (122), and in CSS `color-mix(`, `oklch(`, `oklab(`, `light-dark(`, `from ` relative syntax, nested `&` selectors, plus the `popover` attribute (114). This is the same "agreement test" habit the project already uses for JS/CSS locale encoding. |

---

## Installation

```bash
# Runtime dependencies: none (no line here on purpose)

# Recommended dev addition (record exact-version approval first)
npm install -D --save-exact typescript@7.0.2 @types/chrome@0.3.0

# Optional dev additions (each needs its own approval record)
npm install -D --save-exact fast-check@4.10.2 colorjs.io@0.7.1

# Explicitly NOT upgrading mid-milestone
#   vitest stays 4.1.11, happy-dom stays 20.13.1
```

`package.json` script to add if TypeScript is adopted: `"check": "tsc --noEmit -p tsconfig.json"` with `allowJs`, `checkJs`, `noEmit`, `strict`, `lib: ["ES2022","DOM","DOM.Iterable"]`, `types: ["chrome"]`, `include: ["extension/**/*.js","types/**/*.d.ts"]`.

---

## 1. Manifest Delta (0.1.0 → 1.0.0)

```jsonc
{
  "manifest_version": 3,
  "name": "Zhroma — Priority Colours for Zendesk",
  "version": "1.0.0",                                   // changed
  "description": "…",                                   // likely revised (≤132 chars): now mentions themes and rules
  "minimum_chrome_version": "106",                      // unchanged
  "permissions": ["storage"],                           // UNCHANGED, the whole point
  "action": { "default_popup": "popup.html", "default_icon": { "32": "icons/neutral.png" } },
  "options_ui": { "page": "options.html", "open_in_tab": true },   // NEW, grants nothing
  "icons": { "32": "icons/neutral.png", "128": "icons/brand.png" },
  "background": { "service_worker": "background.js" },  // stays classic (not "type":"module") so importScripts() works
  "content_scripts": [{
    "matches": ["https://*.zendesk.com/agent/*"],       // unchanged
    "js": ["lib/colour.js", "lib/themes.js", "lib/settings.js", "lib/rules.js", "content.js"],  // order = dependency order
    "css": ["zhroma.css"],
    "run_at": "document_idle",
    "world": "ISOLATED",
    "all_frames": false
  }]
}
```

Keys that must **not** appear: `web_accessible_resources` (it would let Zendesk pages fetch and fingerprint extension files; it is only needed for dynamic `import()` in content scripts, which this design avoids), `host_permissions`, `optional_permissions`, `content_security_policy` (the MV3 default is right; never relax it).

---

## 2. Permission Impact — explicit

| New capability | Mechanism | Permission needed | Install/update warning change |
|----------------|-----------|-------------------|-------------------------------|
| Options page | `options_ui` | None | None |
| Open options from popup | `chrome.runtime.openOptionsPage()` | None | None |
| Store theme/rules/identity | `chrome.storage.local` | `storage` (already held) | None. `storage` has no install warning. |
| More data in storage | Quota 10 MB (5 MB before Chrome 114) | None; **not** `unlimitedStorage` | None |
| Export file | `Blob` + `<a download>` | None; **not** `downloads` | None |
| Import file | `<input type=file>` | None | None |
| Dark-mode detection | `getComputedStyle`, `matchMedia`, `MutationObserver` in the content script | None beyond the existing `matches` | None |
| "Me" auto-detection | Read the signed-in agent's rendered name from Zendesk DOM | None; **not** `identity`, not a Zendesk API call | None |

**Conclusion:** the permission set is frozen at `["storage"]`, and v1.1 does not change what Chrome warns about, so existing 0.1.0 users will **not** see a re-consent prompt or have the extension disabled on update. Chrome only disables on update when new permission warnings appear.

**Not a permission, but a store-listing obligation:** the extension will now persist the agent's own name/identity and rule values (which may include colleague names or custom field values) in `chrome.storage.local`, and can write an export file on request. The privacy policy text and the dashboard's data-usage disclosures need a review pass for 1.0.0. This connects to the still-open consent-applicability question in `release/policy-applicability.md`. Flag it for the release phase; no stack change.

---

## 3. Options Page and Popup

**Options page (`extension/options.html` + `options.js` + `options.css`):**
- Classic scripts, in order: `<script src="lib/colour.js">` … `<script src="lib/rules.js">`, then `<script src="options.js">`. No inline script (MV3 CSP forbids it), and no `type="module"`, so the same `lib/*` files load identically in every context.
- Rendering: build from `<template>` clones and set `textContent`/`value` only. **Zero `innerHTML`.** Rule values arrive from untrusted import files, and reviewers look for `innerHTML`.
- Reordering: up/down buttons with a stable `id` per rule, plus keyboard focus management. Not HTML5 drag-and-drop and not SortableJS. Buttons are accessible, trivially testable in happy-dom, and need no library. Drag-and-drop can come later if users ask.
- Nested groups: cap depth in the validator (two levels, a top-level group plus one level of sub-groups, covers "A AND (B OR C)"), and have the editor refuse to create deeper nesting. This keeps the UI, the validator and the evaluator bounded.
- Page styling: the options page is the extension's own document, so `@media (prefers-color-scheme: dark)` and `color-scheme: light dark` are fine for its chrome. Use a system font stack and no web fonts.
- Colour input: `<input type="color">` for custom hex, next to a slot `<select>` whose options show resolved swatches for the current theme and mode.

**Popup theme picker (existing `popup.html`/`popup.js`):**
- A radio group (fieldset + visually swatched labels) or a `<select>` of preset theme IDs, plus an "Edit rules…" link calling `chrome.runtime.openOptionsPage()`.
- Keep the popup's current discipline ("never reads or writes storage itself", with the worker as the single validated writer). A theme change becomes a new message type to the worker, validated against the preset-ID enum, and the worker performs `storage.local.set`. This extends the existing popup↔worker request/timeout machinery instead of opening a second write path.
- **No file import/export in the popup** (flaky file chooser; the popup can close under the dialog).

---

## 4. Storage Schema, Versioning, Migration, Propagation

**Recommended key layout: one key per concern, each carrying its own `v`, not one monolithic settings object.**

| Key | Written by | Shape (sketch) | Why separate |
|-----|------------|----------------|--------------|
| `enabled` | worker (existing) | `boolean` | **Unchanged name and semantics**, so a 0.1.0 → 1.0.0 upgrade keeps the user's switch state with zero migration code. |
| `theme` | worker, via popup message | `{ v: 1, id: "zhroma-classic" }` | The popup writes this often. Separate keys mean a popup theme change can never lose-update an options-page rule edit (read-modify-write races between two UIs vanish). |
| `rules` | worker, via options message | `{ v: 1, items: [ { id, name, enabled, effect: "replace"\|"mark", colour: { slot: "red" } \| { hex: "#rrggbb" }, when: Group } ] }` | Largest value; changes together. |
| `identity` | worker, via options message | `{ v: 1, override: string \| null }` | Store the manual correction only. The auto-detected value is re-derived from the DOM on each load and is tenant-specific, so it should not be persisted as truth. |

- **Defaults on read, not on install.** Keep the existing pattern `storage.local.get({ key: DEFAULT })`. A missing key means "fresh install" and resolves to the 0.1.0-identical default (`theme.id = "zhroma-classic"`, `rules.items = []`). Do not depend on `runtime.onInstalled` for correctness: the worker may not have run before a content script reads.
- **Migration = `migrate(raw) → current | null`, a pure function in `lib/settings.js`**, called on every read (content script, worker, options) and on import. `v` missing or unknown means treat it as corrupt: fall back to defaults and fail quiet, never mis-tint. For 1.0.0 the only migration is "absent → default", but put the `v` field in now so 1.1+ has a seam.
- **Single validated writer.** All `set` calls go through the worker, which runs the same `parse*` function before writing. Import writes every imported key in **one** `storage.local.set({...})` call, so listeners see one coherent change batch.
- **Propagation:** `content.js` extends its existing `storage.onChanged` listener. Filter `areaName === 'local'` and the keys above, re-parse `newValue`, recompute the resolved palette, and re-run the existing apply pass. Options and popup pages listen too, so a second options tab shows "changed elsewhere, reload" instead of silently overwriting.
- **Quota:** add validator caps (for example ≤ 100 rules, ≤ 20 conditions per group, ≤ 200 chars per string, depth ≤ 2). These keep worst-case size around 1 MB, well under 5 MB, which makes `QUOTA_BYTES` errors structurally impossible. Still handle `chrome.runtime.lastError` on `set` as the existing code does.

---

## 5. Export / Import and Validation Without a Runtime Dependency

**Export format:**
```json
{ "format": "zhroma-settings", "version": 1, "exportedAt": "2026-09-25T10:00:00.000Z",
  "theme": { "v": 1, "id": "catppuccin" },
  "rules": { "v": 1, "items": [ ... ] },
  "identity": { "v": 1, "override": null } }
```
`JSON.stringify(doc, null, 2)` → `new Blob([…], { type: "application/json" })` → `URL.createObjectURL` → temporary `<a download="zhroma-settings-YYYY-MM-DD.json">` → `click()` → `URL.revokeObjectURL` on a short timeout. Whether `identity.override` is exported, or excluded because it identifies a person and is machine-specific, is a **requirements decision**. The stack supports either.

**Import pipeline (options page):**
1. `file.size` must be ≤ 256 KB before reading, rejected with a message otherwise. This bounds `JSON.parse` cost.
2. `await file.text()` → `JSON.parse` inside `try`.
3. `parseSettingsFile(unknown) → { ok: true, value } | { ok: false, errors: string[] }`.
4. Show a confirm `<dialog>` summarising what will be replaced (N rules, theme X), then a single write via the worker.

**Validator design (`lib/settings.js`, hand-written, around 150–250 lines):**
- **Parse, don't validate:** build **fresh objects from whitelisted keys only**. Never `Object.assign` or spread the parsed input into state. `JSON.parse` can produce an own `"__proto__"` key, and `Object.assign` would then set the target's prototype, which is prototype pollution. Rebuilding from known keys removes the whole class.
- Enforce: exact `format` string; `version` is an integer ≤ supported (newer means "made by a newer Zhroma, update the extension"); enums for `effect`, `op`, group `type`/`all|any`; theme `id` ∈ preset list; slot ∈ the fixed slot set; hex matches `/^#[0-9a-f]{6}$/i`, normalised to lowercase; unique rule `id`s; string length caps; array length caps; depth cap; `Number.isInteger` and range checks.
- **Unknown keys: reject** in `version: 1`. Strictness guarantees exact round-trips and makes the error message honest. Loosen only via a later version bump.
- The same function guards `storage.onChanged` values and storage reads in the content script, so a corrupt store degrades to defaults and never throws.

**Why not a schema library:** `ajv@8.20.0` compiles validators with `new Function`, which the MV3 `script-src 'self'` CSP on extension pages forbids. Its "standalone" mode ships generated, not authored, code. `zod`/`valibot` would be the first runtime dependency in the zip. A JSON Schema document can still be written as **documentation** in `docs/` if it is useful to users, but it must not be the runtime mechanism.

---

## 6. Colour Maths and CSS

**Hand-write `extension/lib/colour.js` (about 60–80 lines). No library.**

| Function | Formula | Notes |
|----------|---------|-------|
| `parseHex('#rrggbb') → [r,g,b]` | trivial | Accept only 6-digit hex (and optionally 3-digit, expanded). No named colours, no alpha hex, since alpha is Zhroma's decision per mode, not the user's. |
| `composite(tint, alpha, bg) → [r,g,b]` | `c = a·tint + (1−a)·bg` per channel, **in gamma-encoded sRGB 0–255** | This matches how Chrome blends `rgb(… / a)` over an opaque background. Compositing in linear light would predict colours the browser doesn't paint. |
| `relativeLuminance([r,g,b])` | WCAG 2.x: linearise (`c ≤ 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4`), then `0.2126R + 0.7152G + 0.0722B` | Public formula. |
| `contrastRatio(a, b)` | `(L1+0.05)/(L2+0.05)` | Target: Zendesk's rendered text colour against the **composited** row colour ≥ 4.5:1 in both modes. |
| `toOklab([r,g,b])` / `deltaEOK(a,b)` | Björn Ottosson's published matrices | For **distinguishability** between the four priority composites and between tint and untinted rows. A contrast ratio says nothing about whether "urgent" and "high" look different. Choose the threshold in the phase (≈0.03–0.05 ΔE_OK is a reasonable starting heuristic, LOW confidence) and check it against the 0.1.0 palette as a baseline. |
| `modeAlpha(mode, priority)` | Table, not formula | Light mode keeps the 0.1.0 alphas exactly (0.14 / 0.12 / 0.09 / 0.08). Dark mode needs its own, higher alphas: translucent tints over a near-black background (Zendesk dark ≈ `#151A1E`, text ≈ `#D8DCDE`, per a single 2025 secondary source, MEDIUM) are much weaker. Derive and freeze them with the tests above. |

**Contrast standard: WCAG 2.x, not APCA.** APCA is not normative (a WCAG 3 draft), and its reference implementation `apca-w3@0.1.9` (last published 2022) is under a non-OSI "Limited W3 License". That is inappropriate to vendor or depend on. WCAG 2.x is what a store reviewer or an accessibility-minded user will check against.

**Colourblind simulation (test-only):** add the Machado et al. (2009) protanopia/deuteranopia/tritanopia matrices to a test helper (not shipped) and assert that the colourblind-safe preset's four composites stay ΔE_OK-distinct under simulation. This is the only automatable evidence for "colourblind-safe".

**CSS delivery:** Zhroma resolves `theme × mode × slot → rgb(r g b / a)` strings in JS. The content script writes a small set of `--zhroma-*` custom properties via CSSOM `setProperty`, on `document.documentElement` for priority/slot colours and on the row for per-rule colours (the exact seam is an ARCHITECTURE decision). `zhroma.css` stays static and consumes them with 0.1.0-literal fallbacks. Why not `color-mix()` / `oklch()` / `light-dark()`:
- They would raise the floor to 111/119/123.
- `light-dark()` keys off the CSS `color-scheme` property, which Zendesk is not known to set for its dark theme. It would follow the wrong signal.
- happy-dom cannot evaluate them, so the contrast/distinguishability tests could not see what ships.
- The popup swatches and options preview need the same resolved values in JS anyway. One implementation beats two.

---

## 7. Dark-Mode Detection (stack view)

- **Signal:** Zendesk Support offers Light, Dark and "match system", set per agent from the profile Display menu (admins can disable the feature). Ticket conversations can separately be forced light or dark, but that is outside agent views. Garden v9 carries the scheme through `ThemeProvider` (`colors.base`) and `ColorSchemeProvider`. **No documented DOM attribute exists.**
- **Recommended mechanism:** a luminance probe. Take `getComputedStyle` on the view's table/body background, walk ancestors to the first non-transparent colour, and classify as dark when relative luminance is below about 0.2, using the same `colour.js`. Re-probe on:
  - `MutationObserver` on `document.documentElement` and `document.body` with `attributes: true` (class/style/data-* flips);
  - `<head>` `childList` (styled-components injecting a new sheet on theme change);
  - `matchMedia('(prefers-color-scheme: dark)').addEventListener('change', …)` (match-system users flipping their OS).
  Debounce into the existing apply pass. Exclude Zhroma's own custom-property writes on `<html>` from triggering the probe, either with `attributeFilter` or by comparing values.
- **Must be confirmed live (LOW):** whether Zendesk exposes a cheaper, stable marker (a class, a `data-*` attribute, `color-scheme` on `<html>`). If it does, use it as the fast path, with luminance as the fallback. Capture a dark-mode fixture alongside the three existing light fixtures.

---

## 8. Theme Data and Licensing

**Vendor the hex values by hand into `extension/lib/themes.js`. Do not install palette npm packages as runtime dependencies.** Each palette block carries a comment header with the project name, source URL, licence and copyright line. That satisfies MIT/Apache notice requirements in the shipped package without adding a notices file to the inventory. Hex codes are arguably facts rather than copyrightable expression, but a notice is cheap insurance. Use names descriptively ("Catppuccin", "Dracula") with no logos, which is nominative use.

Zhroma only takes each theme's **accent** colours (red/orange/yellow/green/blue/purple…) and composites them translucently over Zendesk's own background. It never uses a theme's background or foreground. That makes a single-mode theme usable in both Zendesk modes: the "light variant" of a dark-only theme is the same accents with light-mode alphas, or the theme's official light accents where one exists.

| Theme | Variants to use (light / dark) | Licence (verified 2026-09-25) | Vendor from | Notes |
|-------|-------------------------------|-------------------------------|-------------|-------|
| **Zhroma Classic** (default) | 0.1.0 values / derived dark alphas | Own | `zhroma.css` 0.1.0 | Must reproduce 0.1.0 byte-for-colour in light mode. |
| Tokyo Night | Day / Night (or Storm) | **MIT** (`tokyo-night/tokyo-night-vscode-theme`, the original) | The VS Code original | The popular Neovim port `folke/tokyonight.nvim` is **Apache-2.0**. Prefer the MIT original's values. If Day values come from folke's port, include the Apache-2.0 notice. |
| Catppuccin | Latte / Mocha (Frappé and Macchiato optional) | **MIT** (`catppuccin/palette`, npm `@catppuccin/palette@1.8.0`) | `palette.json` in that repo | The richest named-slot set (red, maroon, peach, yellow, green, teal, sky, sapphire, blue, lavender, mauve, pink…). Map it onto Zhroma's fixed slot names. |
| Dracula | Alucard / Dracula | **MIT** (`dracula/dracula-theme`) | draculatheme.com/spec | Alucard is the official light counterpart in the current spec. Do not use Dracula PRO colours (commercial product). |
| Nord | (Aurora accents, light alphas) / Aurora on Polar Night | **MIT** (`nordtheme/nord`) | nordtheme.com "Colors and Palettes" | No official light theme. Aurora nord11–nord15 accents work in both modes because only accents are used. |
| Gruvbox | Light / Dark (the accents differ per mode: "faded" vs "bright") | README states **MIT/X11** but the repo has **no LICENSE file** (`morhetz/gruvbox`); one secondary source claimed CC-BY-3.0 | `colors/gruvbox.vim` | Licence is ambiguous (MEDIUM). Attribute prominently. If that is unacceptable, use `gruvbox-community` or drop it. |
| Solarized | Light / Dark with the **same** accents by design | **MIT** (`altercation/solarized`) | README palette table | The ideal fit for the slot model: eight accents shared across both modes. |
| One Dark / One Light | One Light / One Dark | **MIT** (`atom/one-dark-syntax`, `atom/one-light-syntax`) | Atom syntax theme `colors.less` | Atom is archived, so the values are frozen. That is fine. |
| Rosé Pine | Dawn / Main (or Moon) | **MIT** (`rose-pine/rose-pine-palette`) | That repo | Has love/gold/rose/pine/foam/iris. There is no literal "green" (pine and foam are teal/blue-green), so slot mapping needs care. |
| **Colourblind-safe** | Okabe–Ito accents / same | Okabe & Ito, "Color Universal Design" (2008). Published for free use with no formal licence text (LOW-MEDIUM) | jfly.uni-koeln.de/color | Map priorities by **lightness order** as well as hue (vermillion → orange → sky blue → bluish-green is the usual choice) so the ordering survives any CVD type and greyscale. Verify with the simulation test in §6. Recommend pairing with the stripe mark as a redundant non-colour channel. |

Optional agreement test: if `@catppuccin/palette` (or the other palette packages) are ever added **as devDependencies**, a test can assert that the vendored hex literals still equal upstream. That uses the same "two encodings held together by a test" pattern the project already applies to locale strings. Not needed for 1.0.0.

---

## 9. Rule Engine (stack view)

- **Pure data AST + a hand-written interpreter in `lib/rules.js`** (about 80–120 lines): `Group = { all: Node[] } | { any: Node[] }`, `Condition = { column, op, value? }`, where `op ∈ { equals, not_equals, contains, not_contains, is_empty, is_not_empty }` and the special value `{ me: true }` resolves against the effective identity (override ?? auto-detected).
- **Never compile rules to code.** No `new Function`, no `eval` (both are blocked by MV3 CSP in extension pages and in the isolated world anyway), and no `json-logic-js`-style runtime dependency. An interpreter over a validated, depth-capped tree is fully reviewable.
- **Text matching:** normalise both sides with `.normalize('NFKC')`, trim, collapse internal whitespace, and compare case-insensitively (`toLowerCase()`, English-only scope). Keep this in one exported function so the options preview and the content script agree.
- **No regex operator in 1.0.0.** User regexes bring ReDoS against every row on every mutation pass, add a validation surface (`new RegExp` on untrusted import strings), and are a support burden. Add it later if asked, with a length cap and a compile-in-`try` step.
- **Column binding:** conditions name a column by its **rendered header text**, resolved to an index per table on each pass, exactly as Priority is today. Rules on absent columns evaluate as non-matching (fail quiet) and feed the existing three-way diagnosis.

---

## 10. Tooling Verdict — stay hand-written, share code with classic IIFE files

**Verdict: no WXT, no bundler, no transpiled TypeScript for v1.1.** Add `tsc --noEmit --checkJs` for type safety.

**Honest accounting.** The v1.0 trigger ("adopt WXT when any two of: >800 lines, an options page or popup exists, a second browser, an unavoidable runtime dependency") has fired on (a) and (b), and v1.1 roughly doubles the runtime (estimated at +1,500 to +2,500 lines, with the options editor as the largest piece). The trigger is being overridden, not overlooked, for these reasons:

1. **The evidence model changed the economics.** PROJECT.md records that "evidence binds to shipped bytes" and "acceptance reads pinned Git blobs", and that every shipped-byte change reopens human checks. With a bundler, the shipped bytes are *output*, so a pinned Git blob of the source no longer proves what shipped. You would need reproducible builds, a checked-in `dist/` with a drift test, or a new evidence chain. Each costs more than the code-sharing convenience it buys.
2. **"Submit code as authored" still holds.** Store review favours readable, unbundled source, and v1.1 goes through review as a larger code change anyway, a named review-slowing signal. There is no reason to add "and now it's a bundle".
3. **The problems a bundler solves are small here.** Cross-context code sharing is solved by classic scripts (below). Types come from checkJs. There is no second browser (out of scope) and no runtime npm dependency (by design).
4. **WXT is still pre-1.0** (`0.21.4`, 2026-08-11). Adopting a 0.x framework into a project whose maintenance pattern is "dormant for months, then an urgent selector fix" is a liability.

**Revised trigger (write it down):** adopt WXT (or esbuild with a checked-in, drift-tested output) only if **one** of these becomes true: a second browser is committed to, a runtime npm dependency becomes genuinely unavoidable, or the project deliberately replaces the shipped-byte evidence model. Line count alone is no longer a trigger.

**How to share code without a bundler (the pattern to standardise in the first v1.1 phase):**

```js
// extension/lib/colour.js (classic script, no import/export)
(() => {
  'use strict';
  const lib = (globalThis.ZhromaLib ??= {});   // ??= is Chrome 85+
  if (lib.colour) return;                       // idempotent if loaded twice
  function parseHex(hex) { /* … */ }
  // …
  lib.colour = Object.freeze({ parseHex, composite, relativeLuminance, contrastRatio, toOklab, deltaEOK });
})();
```

| Context | How it loads `lib/*` |
|---------|----------------------|
| Content script | Listed before `content.js` in `content_scripts[0].js`. All files share one isolated-world global, invisible to Zendesk's page JS. |
| Popup / options | `<script src="lib/….js"></script>` tags before the page script. |
| Service worker | `importScripts('lib/settings.js', …)` at the top of classic `background.js`, if the worker validates writes (recommended). |
| Vitest | Read the file text and evaluate it in the happy-dom global, exactly as the existing tests already read `background.js` via `readFileSync`. |

Do **not** use ES modules for shared code. Content scripts cannot statically `import`. Dynamic `import(chrome.runtime.getURL(…))` requires `web_accessible_resources`, which exposes the files to Zendesk pages. A module/classic split would force two copies of the code.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Hand-written classic IIFE `lib/*` files | **WXT 0.21.4** | A second browser is committed to, or the shipped-byte evidence model is deliberately replaced. |
| Hand-written classic files | esbuild 0.28.2 concatenation with a checked-in, drift-tested bundle | Only if duplicated boilerplate across contexts becomes genuinely painful. It still weakens "code as authored". |
| `options_ui` + `open_in_tab: true` | `options_ui` embedded (`open_in_tab: false`) | A tiny settings page with no file I/O and no nested editor. Not this one. |
| `options_ui` | Legacy `options_page` | Equivalent behaviour. There is no reason to prefer the legacy key. |
| Hand-written validator | ajv 8.20.0 standalone-compiled | If the schema grows past about 500 lines of validator. Even then, generated code is not authored code. |
| Hand-written colour maths | culori 4.0.2 / colorjs.io 0.7.1 at runtime | Never in the shipped zip. colorjs.io is fine as a dev-only **test oracle**. |
| WCAG 2.x contrast | APCA (`apca-w3`) | If and when WCAG 3 becomes normative and the licence is OSI-compatible. |
| JS-resolved `rgb(… / a)` custom properties | `color-mix()` / `light-dark()` in CSS | If `minimum_chrome_version` rises to ≥123 **and** Zendesk is confirmed to set `color-scheme` on dark mode **and** the tests move to a real browser. All three are needed; none holds today. |
| CSSOM `setProperty` | Injected `<style>` element / constructed `adoptedStyleSheets` from the isolated world | If a spike proves Zendesk's CSP allows it and a per-rule selector set can't be expressed through custom properties. Unverified (LOW), so avoid. |
| Up/down reorder buttons | HTML5 drag-and-drop | As a later enhancement layered on top of buttons, never as the only path. |
| Luminance-probe dark detection | `prefers-color-scheme` alone | Never. Zendesk's explicit Light/Dark choice overrides the OS preference. |
| Keep vitest 4.1.11 | vitest 5.0.2 | After v1.1 ships, as its own approved upgrade. |
| `typescript@7.0.2` for checkJs | `typescript@6.0.3` | If TS 7's stricter JSDoc handling rejects a pattern you can't cheaply rewrite. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `downloads` permission | Adds a permission warning for zero benefit. `<a download>` from an extension page needs nothing. | Blob + anchor |
| `unlimitedStorage` | Settings are around 20 KB against a 5–10 MB quota. It is a permission with no need. | Validator size caps |
| `chrome.storage.sync` | Explicitly out of scope: it routes names and field values through the user's Google account. Its 8 KB per-item and 100 KB total quotas would also constrain rules. | `storage.local` + export/import |
| `identity` permission / Zendesk API for "me" | New permission, auth, network calls. All three are forbidden by the constraints. | Read the rendered agent name, plus a manual override |
| `web_accessible_resources` | Only needed for dynamic `import()` in content scripts. It exposes extension files to Zendesk pages. | Manifest-ordered classic scripts |
| `innerHTML` / `insertAdjacentHTML` in popup or options | Imported rule values are untrusted strings, and reviewers flag it | `<template>` + `textContent` |
| `new Function`, `eval`, `json-logic-js`, any rule compiler | Blocked by MV3 CSP anyway, and hides behaviour from review | AST interpreter |
| ajv / zod / valibot / yup at runtime | First runtime dependency. ajv needs `new Function` (CSP). | Hand-written parse functions |
| culori / colorjs.io / chroma-js at runtime | Tens of KB of dependency for about 60 lines of maths | `lib/colour.js` |
| `apca-w3` | Non-OSI "Limited W3 License", not normative, last published 2022 | WCAG 2.x formula |
| `color-mix()`, `oklch()`, relative colour syntax, `light-dark()` in shipped CSS | They raise the floor to 111–123, `light-dark()` follows the wrong signal, and they are untestable in happy-dom | JS-resolved `rgb(r g b / a)` |
| `@catppuccin/palette` etc. as runtime dependencies | Runtime dependency for a handful of hex literals | Vendored literals with licence headers |
| Dracula PRO colours | Commercial product | The free Dracula / Alucard spec |
| `prefers-color-scheme` as the sole dark signal | Wrong whenever an agent picks Zendesk Dark on a light OS, or the reverse | Luminance probe + observers |
| File import in the popup | The popup can close under the OS file chooser | Options tab |
| Regex rule operator (1.0.0) | ReDoS on every mutation pass; untrusted `new RegExp` | equals / contains / is empty family |
| Lit / Preact / React / any UI framework for the options page | Runtime dependency, and a build step in practice | Native `<template>`, `<dialog>`, forms |
| SortableJS or similar | Runtime dependency; drag-and-drop is less accessible | Up/down buttons |
| Upgrading vitest/happy-dom mid-milestone | Reopens dependency approvals for no feature gain | Pinned 4.1.11 / 20.13.1 |

---

## Stack Patterns by Variant

**If live recon finds a stable Zendesk dark-mode marker (class, `data-*` or `color-scheme` on `<html>`):**
- Use it as the fast path. Keep the luminance probe as the fallback and the tie-breaker.
- Because Zendesk can rename private markers without notice, and the probe is Zendesk-agnostic.

**If Zendesk's CSP turns out to allow `<style>` injection from the isolated world, and per-rule colours can't be expressed via custom properties:**
- Generate one owned `<style id="zhroma-rules">` via `textContent`, with selectors from a fixed template and values from validated data only.
- Because it is still static-shaped CSS. Spike it first; do not assume it.

**If a phase needs `popover`, CSS nesting or ES2023 array methods on the options page:**
- Raise `minimum_chrome_version` to `"120"` (or whatever the feature needs) and update the baseline-guard test.
- Because it is permission-neutral and affects essentially no users, but it must be a recorded decision.

**If the colourblind preset can't achieve ΔE separation under simulation while keeping text contrast ≥ 4.5:1 at translucent alphas:**
- Make that preset default the "mark" (left-edge stripe, opaque) as a redundant cue, rather than raising tint alpha until text contrast suffers.
- Because hue plus position beats hue alone for CVD users.

**If a second browser is ever committed to:**
- WXT becomes worth it (cross-browser manifest divergence). Migrate `lib/*` IIFEs to ES modules at that point.

---

## Version Compatibility

| Package / Platform | Version | Compatible With | Notes |
|--------------------|---------|-----------------|-------|
| Chrome floor | `minimum_chrome_version: "106"` (unchanged) | Everything recommended here | `options_ui` (MV3), `openOptionsPage` (42), `storage.local.onChanged` (73), `File.text()` (76), `??=` (85), `structuredClone` (98), `:has()` (105), `<dialog>` (37), `<input type=color>` (20). Above-floor APIs to avoid: listed in the baseline-guard test. |
| `storage.local` quota | 10 MB on Chrome ≥114, 5 MB on 106–113 | Validator caps (≈1 MB worst case) | Safe on both. |
| `vitest` | 4.1.11 (pinned) | `happy-dom@20.13.1`, Node `^20.19 \|\| ^22.12 \|\| >=24` | 5.0.2 exists (2026-09-25); defer. |
| `typescript` | 7.0.2 | `@types/chrome@0.3.0` | Go-native compiler with stricter checkJs (no `@enum`/`@class` special-casing). No stable programmatic API until 7.1, which is irrelevant for CLI `--noEmit`. Fall back to 6.0.3 if needed. |
| `fast-check` | 4.10.2 | vitest 4.x | Plain library; call `fc.assert` inside `test()`. |
| `colorjs.io` | 0.7.1 | Node ESM | Test-only oracle. Pre-1.0, so pin exactly. |
| WXT (not adopted) | 0.21.4 (2026-08-11) | n/a | Still pre-1.0. |

---

## Sources

**Official / primary:**
- developer.chrome.com/docs/extensions/develop/ui/options-page — `options_page` vs `options_ui`, embedded limitations (no Tabs API, sizing), `runtime.openOptionsPage()` (fetched 2026-09-25; seam tier MEDIUM)
- developer.chrome.com/docs/extensions/reference/api/storage — `storage.local` `QUOTA_BYTES` 10,485,760 (5 MB before Chrome 114), `unlimitedStorage`, content-script exposure and `setAccessLevel`, JSON-stringification quota accounting, sync quotas (fetched 2026-09-25; MEDIUM)
- developer.chrome.com/blog/css-relative-color-syntax — relative colour syntax shipped in Chrome 119 (MEDIUM)
- MDN `light-dark()` — keys off `color-scheme`; Baseline 2024 (Chrome 123) (MEDIUM)
- npm registry API, queried 2026-09-25 — wxt 0.21.4, typescript 7.0.2, @types/chrome 0.3.0, vitest 5.0.2, happy-dom 20.14.5, fast-check 4.10.2, colorjs.io 0.7.1, culori 4.0.2, ajv 8.20.0, @catppuccin/palette 1.8.0, @rose-pine/palette 4.0.1, apca-w3 0.1.9 ("Limited W3 License"), @playwright/test 1.63.0, @biomejs/biome 2.5.14, esbuild 0.28.2 (primary registry data)
- GitHub licence API, queried 2026-09-25 — catppuccin/palette MIT; dracula/dracula-theme MIT; nordtheme/nord MIT; rose-pine/rose-pine-palette MIT; altercation/solarized MIT; atom/one-dark-syntax MIT; tokyo-night/tokyo-night-vscode-theme MIT; folke/tokyonight.nvim Apache-2.0; morhetz/gruvbox has no detected licence file, and its README states MIT/X11 (primary)
- Context7 `/zendeskgarden/react-components` — Garden v9 `ThemeProvider colors.base`, `ColorSchemeProvider`, `useColorScheme` ('light' | 'dark' | 'system'); dark mode is carried in React context (MEDIUM)
- support.zendesk.com articles 9235063674138 and 9011095783322 — agent Light/Dark/match-system choice, admin toggle, ticket-conversation override (MEDIUM)

**Secondary:**
- internalnote.com/zendesk-dark-mode (2025-03-24) — dark background ≈ `#151A1E`, text ≈ `#D8DCDE`; no DOM-marker information (MEDIUM, single source, verify live)
- Chromium issues 40114753 / 114898 and the Mozilla 1658694 discussion — file inputs closing or breaking action popups; the options-page workaround (MEDIUM)
- TypeScript 7.0 announcement and release notes — stricter JSDoc checking in `.js` files (MEDIUM)
- draculatheme.com/spec — Alucard light variant (MEDIUM)

**Known gaps (flag for phase research):**
- **Zendesk dark-mode DOM marker:** unknown. Needs a live capture in dark mode, as a new fixture. (LOW)
- **Zendesk page CSP vs. isolated-world `<style>` / `adoptedStyleSheets` injection:** unverified. Avoided by the CSSOM recommendation, but it would matter if the architecture wants generated CSS. (LOW)
- **Rendered signed-in agent identity location** for "me" auto-detection: needs live recon. No stack implication beyond "read the DOM". (LOW)
- **Gruvbox licence ambiguity** (README-only MIT/X11 claim). Decide during the themes phase whether attribution suffices. (MEDIUM)
- **Okabe–Ito usage terms:** widely treated as free to use, but no formal licence text was located. (LOW-MEDIUM)
- **GSD research-store:** two docs-kind cache writes failed on a sandbox EPERM for `~/.gsd/research-cache`. The web-kind digests were cached. This does not affect the findings.

---
*Stack research for: Zhroma v1.1 Themes & Rules (no-build, `storage`-only MV3 extension)*
*Researched: 2026-09-25*
