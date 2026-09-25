# Architecture Research

**Domain:** Integrating dark-mode-aware themes, a rule engine over arbitrary view columns, identity detection and a settings UI into Zhroma's shipped MV3 content-script / worker / popup architecture (milestone v1.1, ships as 1.0.0)
**Researched:** 2026-09-25
**Confidence:** HIGH on the integration shape. It is derived from the shipped code (`extension/*.js`, `zhroma.css`, `manifest.json`), the v1 DOM ledger (`SELECTORS.md`) and the Garden source. LOW on every Zendesk DOM fact that is new in v1.1: the dark-mode signal, where the agent's name appears, and how non-Priority cells render. Those facts need live recon (see [Recon 2](#dark-mode-detection-and-the-recon-it-needs)).

---

## Executive answer

**Rules run in the content script, in the same synchronous turn as the existing table inspection. They consume the same validated snapshot, and their output is written as data attributes that a static stylesheet paints.** Themes and dark mode only change which CSS custom property values apply. Neither ever causes rules to be re-evaluated. The worker stays the single writer for every persisted key. It never sees a cell value.

Concretely:

1. **One validator, two consumers.** Extend `inspectCandidateTable` so it returns the header cells and every full-width ticket row it already walks. The Priority logic, and the six-state machine that drives the three-way diagnosis, keep their current semantics. A new pure module (`zhroma-rules.js`) resolves the columns a rule references by header label, and evaluates rules against the rows the Priority validator admitted. Rules can never touch a row, or a table, that v1 would have refused.
2. **Semantic stamps, CSS resolution.** Rows get `data-zhroma-priority` (unchanged), plus `data-zhroma-fill` and `data-zhroma-mark`, each carrying a slot name or `custom`. Custom colours go in `data-zhroma-fill-color` and `data-zhroma-mark-color` as validated `#rrggbb`. `<html>` gets `data-zhroma-theme` and `data-zhroma-scheme`. All colour values live in a static `themes.css`, and custom hex is parsed by CSS itself through `attr(… type(<color>))`. Changing the theme or the scheme is an attribute flip on `<html>`. No row is revisited.
3. **The `enabled` pipeline is not touched in behaviour.** The one boolean, its worker-serialized write queue, the `apply-preference` handshake and the three-way diagnosis stay as they are. New settings live in new keys (`theme`, `rules`, `identityOverride`, `identityDetected`). Absent keys mean the defaults, and the defaults are 0.1.0. **No migration is the migration.**
4. **Rule health is a second, orthogonal status channel.** Rules that reference a column the view lacks do not change the toolbar icon or the three diagnoses. The popup fetches the finite `rule-status` enum through a separate additive message pair and shows it as a second line.
5. **Recon comes first.** The dark-mode signal, where identity is rendered, and how referenced cells render must be read from a live tenant, the same way v1 Phase 1 did it. Garden's own source proves the library emits **no** DOM signal for dark mode (see below), so no desk assumption survives here.

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ DECLARATIVE LAYER (manifest.json)                                            │
│  content_scripts.css: themes.css (NEW) → zhroma.css (MODIFIED)               │
│  content_scripts.js : zhroma-settings.js → zhroma-rules.js → zhroma-scheme.js │
│                       → zhroma-identity.js → content.js   (one isolated world) │
│  options_ui: options.html (NEW)   action.default_popup: popup.html (MODIFIED) │
└───────────────┬──────────────────────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────────────────────┐
│ CONTENT SCRIPT (top frame, isolated world) — the ONLY place ticket DOM is read │
│                                                                              │
│  settings reader ──(storage.get + onChanged)──► compiled RulePlan, themeId,   │
│  (NEW, in content.js)                           identity   [no DOM, no timer] │
│                                                                              │
│  v1 observer ─► inspectCandidateTable (MODIFIED: + headers[], rows[])         │
│                   │  state ∈ safe|blank|missing|waiting|unsafe|unsupported    │
│                   ├─► Priority entries ─► commitSnapshot ─► data-zhroma-priority│
│                   └─► ZhromaRules.bind(headers) + evaluate(rows)  (NEW, pure) │
│                            └─► commitRuleStamps (NEW) ─► data-zhroma-fill/mark │
│                                                                              │
│  ZhromaScheme (NEW): own narrow observer + matchMedia trigger                 │
│                   └─► <html data-zhroma-scheme="light|dark">                  │
│  theme applier (NEW, tiny): <html data-zhroma-theme="classic|nord|…">         │
│  ZhromaIdentity (NEW): own observer, stops after detection                    │
│                   └─► runtime.sendMessage{identity-detected, name} (on change)│
│                                                                              │
│  replies: get-status (v1, unchanged) · get-rule-status (NEW, finite enum)     │
└───────────────┬───────────────────────────────▲──────────────────────────────┘
                │ status-invalidated (v1)        │ get-status / get-rule-status
                │ identity-detected (NEW)        │ apply-preference (v1)
┌───────────────▼───────────────────────────────┴──────────────────────────────┐
│ SERVICE WORKER background.js (MODIFIED) — single writer, never sees ticket data│
│  importScripts('zhroma-settings.js')  → the same validator the others use     │
│  v1: enabled queue, projections, toolbar icon/title   (behaviour unchanged)   │
│  NEW: settings write queue (theme, rules+revision CAS, identity, import)      │
│  NEW: popup-rule-status → tab get-rule-status relay                           │
└───────▲───────────────────────────────▲──────────────────────────────────────┘
        │ popup-status / set-enabled (v1)│ save-rules / set-identity-override /
        │ set-theme / popup-rule-status  │ import-settings (NEW)
┌───────┴──────────────┐        ┌────────┴──────────────────────────────────────┐
│ POPUP (MODIFIED)     │        │ OPTIONS PAGE (NEW, open_in_tab)               │
│ switch (v1) + theme  │        │ rule editor, identity field, export/import;   │
│ picker + rule-health │        │ reads storage directly, writes via worker     │
│ line + "Edit rules"  │        │ Blob download / <input type=file> — no perms  │
└──────────────────────┘        └───────────────────────────────────────────────┘
        ▲ both link themes.css for swatches (same palette bytes as the page)

┌──────────────────────────────────────────────────────────────────────────────┐
│ chrome.storage.local — enabled (v1, untouched) · theme · rules · identityOverride│
│                        · identityDetected                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | File | Status | Owns | Never does |
|-----------|------|--------|------|------------|
| Settings schema | `extension/zhroma-settings.js` | **NEW** | Key names, `DEFAULTS`, `THEME_IDS`, `SLOTS`, `OPERATORS`, caps, `validateRules`, `validateTheme`, `validateIdentity`, `validateExport`, `migrate`. Pure and frozen. Loaded by content, worker (`importScripts`), popup and options | Touch the DOM or storage |
| Rule engine | `extension/zhroma-rules.js` | **NEW** | `normalizeHeader`, `normalizeCell`, `compile(rules, identity)`, `bind(headerLabels, plan)`, `evaluate(cells, binding)` → `{fill, mark}`, and `health(binding)` | Read the DOM itself, write anything, keep state across passes |
| Table inspection + controller | `extension/content.js` | **MODIFIED** | v1 state machine, observer, readiness gates, stamping. Gains: snapshot `headers` and `rows`, rule stamp commit/clear, settings reader, `get-rule-status` reply, theme attribute | Evaluate rules outside the inspect→commit turn, or send cell values anywhere |
| Scheme detector | `extension/zhroma-scheme.js` | **NEW** | Reads the recon-proven host dark signal, stamps `<html data-zhroma-scheme>`, and runs its own narrow observer plus a `matchMedia` *trigger* | Use `prefers-color-scheme` as the signal, or evaluate rules |
| Identity detector | `extension/zhroma-identity.js` | **NEW** | Reads the recon-proven name location, normalises it, and sends it to the worker on change. Its observer self-stops after detection | Write storage, or read anything beyond the one name element |
| Palette | `extension/themes.css` | **NEW** | Every preset's slot values × {light, dark}, the priority→slot mapping per theme, and tint strengths. Selectors are only `[data-zhroma-theme=…]` / `[data-zhroma-scheme=…]` | Know about tables |
| Paint rules | `extension/zhroma.css` | **MODIFIED** | Selectors plus `!important`. Priority tints become `var(--zhroma-tint-*, <exact 0.1.0 literal>)`. Adds fill, mark and custom-hex `attr()` rules | Hold any colour other than the 0.1.0 fallbacks |
| Worker | `extension/background.js` | **MODIFIED** | Everything it does today. Adds the settings write queue with revision CAS, the `identity-detected` write, the rule-status relay and import | Parse or store cell values or header labels |
| Popup | `extension/popup.html`, `popup.js` | **MODIFIED** | Switch (v1), theme picker, rule-health line, "Edit rules" (`chrome.runtime.openOptionsPage()`) | Read or write storage directly (the v1 D-11 invariant holds) |
| Options page | `extension/options.html`, `options.js` | **NEW** | Rule editing (ordered, AND/OR groups), colour source (slot or hex), effect, identity override, export/import | Write storage directly. All writes go through the worker |

---

## Recommended Project Structure

```
extension/
├── manifest.json          # MODIFIED  version 1.0.0; options_ui; js[] and css[] arrays grow;
│                          #           minimum_chrome_version 106 → 133 (typed attr()); still permissions:["storage"]
├── zhroma-settings.js     # NEW       schema + validators (shared, classic script, one frozen global)
├── zhroma-rules.js        # NEW       pure rule engine (content script only)
├── zhroma-scheme.js       # NEW       dark-mode signal → <html data-zhroma-scheme>
├── zhroma-identity.js     # NEW       agent-name detection → worker message
├── content.js             # MODIFIED  snapshot extension, rule stamps, settings reader, rule-status reply
├── themes.css             # NEW       palette data (all presets × light/dark)
├── zhroma.css             # MODIFIED  var() with 0.1.0 literal fallbacks; fill/mark/custom rules
├── background.js          # MODIFIED  importScripts + settings queue + relay (v1 paths unchanged)
├── popup.html / popup.js  # MODIFIED  theme picker, rule-health line, options link
├── options.html           # NEW
├── options.js             # NEW
└── icons/                 # unchanged (no new status icon; see diagnosis section)

scripts/release-source.js  # MODIFIED  RELEASE_FILES gains the 7 new shipped files
SELECTORS.md               # MODIFIED  new ledger entries: dark signal, dark native states,
                           #           identity location, referenced-cell representation
test/fixtures/             # NEW files: dark-mode table + header capture(s), multi-column
                           #           value capture (Assignee/Status/Group/custom field)
test/extension/            # NEW suites: rules engine, settings schema, rule stamping,
                           #           CSS precedence/agreement, scheme, identity, options, import
release/                   # MODIFIED  disclosures.md / privacy policy / listing for identity + options
```

### Structure Rationale

- **Shared logic lives in separate classic scripts, not in `content.js`.** MV3 runs every file in the `js[]` array in one isolated-world scope, in array order. The worker can take the same file with `importScripts`, which works only in a classic worker at initial evaluation. So there is still no build step, and the shipped bytes are still the authored bytes. Keeping the new logic out of `content.js` keeps the diff to the accepted file small and reviewable. It also gives the rule engine and schema their own test surfaces.
- **The palette lives in CSS, not JS.** This keeps the existing `runtime-contract` property that `content.js` holds no colour literals. The popup and options pages link the same `themes.css` for their swatches, so the store screenshots, the picker and the page all render from one set of bytes. The JS side only knows the *names* (`THEME_IDS`, `SLOTS`). An agreement test holds the names in JS and CSS together, the same pattern already used for the `en`-family JS/CSS agreement.
- **The options page is new files, not a mode of the popup.** A rule editor with nested groups needs a full tab (`open_in_tab: true`). Embedded options pages have sizing issues and no `tabs` API. The popup stays a status panel with two controls.

---

## Answers to the integration questions

### 1. Where rule evaluation runs, and how the rule set is delivered

**Content script. Non-negotiable.** Three reasons:

- The v1 invariant in `commitSnapshot` says: *"Never carry DOM interpretations across a timer or messaging boundary."* Rules are interpretations of cells. Evaluating them in the worker would mean shipping cell values across a process boundary and back, then committing stale conclusions against a DOM that may have been re-rendered in between.
- The worker is documented as "a disposable adapter, never a database". It can be terminated at any moment. The content script is the long-lived observer that already re-derives everything on each mutation.
- Privacy posture: today the content script tells the rest of the extension only finite enums. Keeping rule evaluation local preserves that for ticket data. The one explicit exception is the agent's own name (see §5).

**Delivery and freshness:**

```
storage key         value shape                                      written by (via worker)
enabled             boolean (v1, untouched)                          popup switch
theme               string ∈ THEME_IDS (unknown → 'classic')         popup, options, import
rules               { schema: 1, revision: n, items: Rule[] }        options, import
identityOverride    string | null                                    options, import
identityDetected    string                                           worker, on content message
```

- **Read path in the content script.** A new `readSettings()` does one `chrome.storage.local.get(['theme','rules','identityOverride','identityDetected'])`. It runs under its own generation counter, in the same shape as `readPreference`. A new `onSettingsChanged` listener is registered next to `onPreferenceChanged`, as a **separate** `addListener`, so the v1 function is byte-for-byte untouched. On each change the listener validates with `ZhromaSettings`, recompiles the `RulePlan`, and then:
  - a `theme` change only rewrites `<html data-zhroma-theme>`. No pass.
  - a change to `rules`, `identityOverride` or `identityDetected` calls `scheduleReconcile()`.
- **Readiness gate.** Add `settingsReady` to `runnable()`, so the first commit already reflects the stored theme and rules. Without it you get a flash of classic colours, then a repaint. A settings read that **fails** sets `settingsReady = true` with `DEFAULTS` and rule health `settings-unreadable`. Priority tinting must never be held hostage by a corrupt rules blob. This is deliberately different from `enabled`, where a non-boolean means "stay untinted", and the difference should be recorded as a decision.
- **Versioning.** `rules.schema` is an integer. `migrate(raw)` is pure. The current schema passes through. An older schema is upgraded in memory, and the worker writes the upgraded version back only on the next user save, never on read. A **newer** schema, which happens on downgrade or when importing a file from a later build, is refused: the content script treats it as unreadable and uses defaults, and import shows "made by a newer Zhroma". Reads never write.
- **Migration from the v1 one-boolean store: none.** `enabled` stays its own key with its own validator. Folding it into a settings object would reopen the whole accepted preference pipeline (the queue, the epochs and the apply handshake). It would also risk an upgrade path where a half-migrated value reads as non-boolean, and `applyPreference` treats that as "unconfirmed, stay untinted". A fresh install and an upgraded 0.1.0 install both have no new keys, so both get the defaults, which reproduce 0.1.0.
- **All tabs update for free.** `storage.onChanged` reaches every Zendesk tab's content script. The v1 `apply-preference` handshake exists only so the popup can report honestly about the *active* tab. The new settings don't need it (see §7).

### 2. Generalising header-located column resolution without regressing Priority

**Extend the snapshot and keep the Priority branch literal.** `inspectCandidateTable` already walks every header cell and every body row, and it rejects malformed topology before branching on Priority. Today it throws away what rules need. The change:

```js
// content.js — inside inspectCandidateTable (MODIFIED, sketch)
const result = (state, table = null, entries = [], headers = [], rows = []) =>
  ({ state, table, entries, headers, rows });
// … unchanged validation …
const indexes = headers.flatMap((cell, index) => cell.textContent.trim() === 'Priority' ? [index] : []);
// ↑ UNCHANGED: the verified Priority path keeps its exact-English literal test.
const rows = [];                         // NEW: every witnessed full-width ticket row
for (const row of bodies[0].children) {
  // … unchanged group/row/cell validation …
  if (cells.length < headers.length) { incomplete = true; continue; }
  witnessed = true;
  rows.push(cells);                      // NEW — one line, before the Priority branch
  if (priorityIndex === -1) continue;
  // … unchanged Priority read, including 'unsafe' on an unknown label …
}
if (incomplete || !witnessed) return result('waiting', table);
if (priorityIndex === -1) return result('missing', table, [], headers, rows);
return result(entries.some(...) ? 'safe' : 'blank', table, entries, headers, rows);
```

The rule engine then owns a **separate** resolver that never feeds back into Priority:

```js
// zhroma-rules.js (NEW) — pure
const normalizeHeader = (text) => text.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
function bind(headerLabels, plan) {
  // label → index | AMBIGUOUS. A duplicate label is never guessed at.
  const index = new Map();
  headerLabels.forEach((label, i) => index.set(label, index.has(label) ? AMBIGUOUS : i));
  return plan.columns.map((name) => index.has(name) ? index.get(name) : MISSING);
}
```

Rules on design:

- **Rules run only in states `safe`, `blank` and `missing`.** These are the states where the table is proven rendered: a full-width row has been witnessed. In `waiting`, `unsafe` and `unsupported` there are no rule stamps. So a non-English shell, or a table with an unrecognised Priority label, gets no rule stamps either. That is conservative and consistent with the v1 evidence boundary. Note the consequence: **rules inherit the English-only gate**, even though a rule written against localised header text could work. Record this as a decision, not an accident.
- **Painting in `missing` is allowed. Claiming is not.** A view with no Priority column but an Assignee column should still show "assigned to me". Rule stamps are paint, not a diagnosis. The 100 ms settle certainty still governs only the `missing` *claim*.
- **Normalising values** (in `normalizeCell`, one place, unit-tested):
  - `textContent`, NFC-normalised, whitespace runs collapsed, trimmed.
  - Comparisons are case-insensitive, using `toLowerCase()` on both operands, precomputed at `compile`.
  - `textContent` includes the visually hidden label spans the fixtures show in icon columns (for example `<span hidden>TEXT-017</span>`). That is the accessible value, and it is correct to match on.
  - **Do not fall back to `aria-label` until recon proves a column type needs it.** The fixture has cells with an empty text node and a non-empty `aria-label`. Whether that label is the value or a description is unknown.
  - "is empty" means `normalized === ''` **or** the recon-proven empty placeholder, if Zendesk renders one such as `-`. This must come from recon.
  - `<time>` cells hold relative text ("2 hours ago"). Operators are text-only in v1.1, so date semantics are out of scope and the options page should say so.
- **A missing or ambiguous column makes the rule not apply.** It never makes the condition false, and it never makes it empty. If a missing column read as empty, `not equals X` and `is empty` would match every row of every view that lacks the column. That is the worst possible false positive for a glance tool. Such a rule is skipped for this table and counted in rule health.
- **Evaluation is per pass and stateless.** Re-bind on every pass: the header has at most about 16 cells. No `WeakMap` memo is needed, and none of the stale-index risk that the v1 research warned about. Per row, cache normalised cell text for referenced indexes only.
- **Precedence.** Walk rules in stored order. The first matching `replace` rule sets `fill`. The first matching `mark` rule sets `mark`. Stop when both are found. Disabled rules are skipped at `compile`.

### 3. Styling seam

**Stamps are semantic, and the CSS resolves colour.** Nothing on a row names a resolved colour except custom hex, which is user data and not palette.

| Element | Attribute | Values | Written when |
|---------|-----------|--------|--------------|
| ticket `tr` | `data-zhroma-priority` | `Urgent\|High\|Normal\|Low` (v1, unchanged) | Priority read (v1 path) |
| ticket `tr` | `data-zhroma-fill` | slot name ∈ `SLOTS`, or `custom` | first matching replace rule |
| ticket `tr` | `data-zhroma-fill-color` | `#rrggbb` (validated) | fill is `custom` |
| ticket `tr` | `data-zhroma-mark` | slot name, or `custom` | first matching mark rule |
| ticket `tr` | `data-zhroma-mark-color` | `#rrggbb` | mark is `custom` |
| `<html>` | `data-zhroma-theme` | ∈ `THEME_IDS` | settings read/change |
| `<html>` | `data-zhroma-scheme` | `light\|dark` | scheme detector |

```css
/* themes.css (NEW) — data only; any element may carry the attributes, so popup/options previews can scope them */
[data-zhroma-theme="classic"] {                       /* light = the exact 0.1.0 literals */
  --zhroma-tint-urgent: rgb(220 38 38 / 0.14);  --zhroma-tint-high: rgb(234 88 12 / 0.12);
  --zhroma-tint-normal: rgb(202 138 4 / 0.09);  --zhroma-tint-low:  rgb(22 163 74 / 0.08);
  --zhroma-slot-red: rgb(220 38 38); /* … every slot … */  --zhroma-fill-strength: 14%;
}
[data-zhroma-theme="classic"][data-zhroma-scheme="dark"] { /* dark variant values, higher strength */ }
[data-zhroma-theme="nord"] {
  --zhroma-slot-red: #bf616a; /* … */
  --zhroma-tint-urgent: color-mix(in srgb, var(--zhroma-slot-red) var(--zhroma-strength-urgent), transparent);
}

/* zhroma.css (MODIFIED) — selectors, precedence, !important; no palette beyond v1 fallbacks */
html[lang|="en" i] table[…] > tbody[…] > tr[…][data-zhroma-priority="Urgent"] > td[data-garden-id="tables.cell"] {
  background-color: var(--zhroma-tint-urgent, rgb(220 38 38 / 0.14)) !important;   /* fallback = 0.1.0 */
}
/* Replace: declared AFTER the priority rules with one more attribute → wins on specificity */
html[lang|="en" i] table[…] > tbody[…] > tr[…][data-zhroma-fill][data-zhroma-fill] > td[data-garden-id="tables.cell"] {
  background-color: color-mix(in srgb, var(--zhroma-fill) var(--zhroma-fill-strength, 14%), transparent) !important;
}
tr[data-zhroma-fill="red"]    { --zhroma-fill: var(--zhroma-slot-red); }     /* one line per slot */
tr[data-zhroma-fill="custom"] { --zhroma-fill: attr(data-zhroma-fill-color type(<color>), transparent); }
/* Mark: a left-edge stripe as a background-image layer on the FIRST direct cell */
… > tr[…][data-zhroma-mark] > td[data-garden-id="tables.cell"]:first-child {
  background-image: linear-gradient(to right, var(--zhroma-mark) 0 4px, transparent 4px) !important;
}
```

How the effects compose:

- **Replace vs priority.** Keep the priority stamp on a filled row. It stays truthful, and the v1 commit path is untouched. Let CSS precedence hide it: the fill rule comes later in the file and adds one attribute to its specificity. A test must assert this precedence, because `!important` against `!important` falls through to specificity and then to source order.
- **Mark vs tint.** `background-image` layers over `background-color` on the same cell, so a mark always sits on top of whichever tint won.
- **Native hover and selection (v1 ledger `interaction-and-sticky-states`).**
  - Hover and selected paint belong to the `tr`, and cells are transparent. Translucent fills keep the v1-accepted composition: the row's hover colour shows through the cell's translucent layer.
  - Selection *also* adds `box-shadow: inset 3px 0 0 rgb(31 115 183)` on the **first direct cell**. **Do not draw the stripe with `box-shadow`**, because `!important` would erase the native selection indicator. An inset box-shadow paints above the background layers, so with a `background-image` stripe the native selection indicator stays visible on selected rows. The dark-mode values of these native states are unknown until recon.
- **Light/dark without re-evaluation.** The scheme detector flips one attribute on `<html>`. Every `--zhroma-*` variable re-resolves in the cascade. Row stamps, the rule plan and the observer are not involved.
- **A theme change** is the same kind of single attribute flip. Custom-hex colours are fixed by definition, but they still adapt through the theme's per-scheme `--zhroma-fill-strength`.
- **Fallback if typed `attr()` inheritance misbehaves.** It is new: Chrome 133, confidence MEDIUM. The fallback is `row.style.setProperty('--zhroma-fill', hex)`, which is an inline custom property on our own stamped row. Run a 30-minute spike in the styling phase before relying on the primary path. Do **not** fall back to a generated `<style>` or `adoptedStyleSheets`: user strings would become CSS text (an injection surface), and adopted sheets from content scripts are poorly specified. They are broken outright in Firefox, and a host that reassigns the array silently drops them.
- **Minimum Chrome** goes to 133 for typed `attr()`. That also covers `color-mix()` (111) and `light-dark()` (123). Current stable is 152. Users on older Chrome keep 0.1.0. That is a store-visible change, but not a permission change.

### 4. Dark-mode detection and the recon it needs

**What is known (primary source).** In the published `@zendeskgarden/react-theming@9.16.1` tarball, `ThemeProvider` is a bare styled-components `ThemeProvider` and renders nothing to the DOM. `ColorSchemeProvider` keeps `'light' | 'dark' | 'system'` in page `localStorage['color-scheme']` (the key is configurable and can be disabled). It follows `prefers-color-scheme` only in system mode, and it sets **no** attribute, class or `color-scheme` on the document. Garden itself therefore gives no CSS-selectable signal. Dark mode shows up as regenerated hashed classes and different computed colours, **unless Zendesk adds its own marker**. Zendesk's help docs say agents choose Light, Dark or Match system from the profile menu. The dark surface is about `#151A1E`, and dark mode covers views.

**Decision tree** (recon picks the branch):

1. **Zendesk sets a stable attribute or class on `html` or `body`** (for example `data-color-scheme`, `.dark`, or `color-scheme: dark` on `:root`). Then key CSS directly on it. For `color-scheme`, use `light-dark()`. **There is no detector JS at all**, and a mid-session switch is free. This is the best outcome.
2. **No marker, but the table's opaque surface changes colour.** The v1 ledger proved the first opaque ancestor is `DIV[data-garden-id="pane"]`. `zhroma-scheme.js` reads `getComputedStyle(pane).backgroundColor`, classifies it by relative luminance (dark if below 0.2), and stamps `<html data-zhroma-scheme>`. To catch a mid-session switch:
   - It runs its own `MutationObserver` on `documentElement` and `body` (attributes, no subtree) and on the current pane (`class` and `style` only), re-bound when the pane is replaced.
   - A `matchMedia('(prefers-color-scheme: dark)')` change listener is used **only as a trigger to re-detect**, because system mode flips the host when the OS flips.
   - It re-detects on `visibilitychange` and `pageshow`.
   - It also runs one cheap detection at the end of each reconcile pass, as a safety net.
   - **Do not add `class` to the v1 observer's `attributeFilter`.** That would push every class churn in the SPA through the table classifier.
3. **Neither.** Default to `light`. That is the 0.1.0 behaviour, so nothing is lost. Report `scheme: unknown` in rule health, or in a debug-only field.

**Never** use `prefers-color-scheme` as the signal: an agent who chose explicit Dark on a light OS would get light tints. **Never** read page `localStorage['color-scheme']` either. The key is Garden's default, not a Zendesk contract. A same-tab change fires no `storage` event. It reads page storage, which is a reviewer smell and banned by the current runtime-contract test. And it still needs `matchMedia` for system mode.

**Proposed Recon 2 (this milestone's Phase-1 equivalent).** It uses the same ledger format and sanitizer discipline as `SELECTORS.md`. It is read-only, and the user drives the authenticated session. Entries:

| Ledger id | Question | Probe (sketch) |
|-----------|----------|----------------|
| `dark-mode-signal` | Which document-level signal differs between Light, Dark and System (OS light/dark)? | `html`/`body` `getAttributeNames()` + `className`, `getComputedStyle(documentElement).colorScheme`, `meta[name=color-scheme]`, count of `[data-theme],[data-color-scheme],[class*=dark]`, pane `backgroundColor` |
| `dark-mode-switch-mutation` | Does a mid-session switch re-mount the table (childList), swap classes only, or reload? | Temporary observer counting record types on `html`/`body`/pane/table during one switch |
| `dark-native-states` | Hover, selected, sticky-header and pane paint in dark | Same probe as v1 `interaction-and-sticky-states`, run in dark |
| `dark-table-topology` | Are the table, row and cell Garden identifiers identical in dark? | Re-run the v1 `stable-identifiers` probe |
| `identity-location` | Where is the signed-in agent's name rendered *without* opening a menu? | Top-bar avatar `img[alt]`, button `aria-label`/`title`, `[data-test-id*=profile]`/`[data-garden-id^="avatars"]`; also inside the opened profile menu |
| `identity-vs-assignee` | Is the identity string byte-equal to the Assignee cell text for the agent's own tickets? | Compare normalised strings; record only `equal: true/false` and the kind of difference |
| `referenced-cell-representation` | How do Assignee, Requester, Group, Status, Type, Subject and one custom dropdown/checkbox field render (text vs `aria-label` vs badge; empty placeholder)? | Per column: `textContent` shape class, `aria-label` present/equal, child tags, empty rendering |
| `header-label-uniqueness` | Can two columns share a header label, for example custom fields with the same title? | Admin-side check plus a header probe |

Fixtures to admit, through the existing sanitizer: a dark-mode capture of the table, a sanitized capture of the header region with the name replaced by a token, and a multi-column capture with one ticket assigned to the capturing agent. The sanitizer must learn to tokenise the agent's name consistently across the header and the Assignee cells, otherwise the `identity-vs-assignee` evidence cannot be kept.

### 5. Identity detection and the editable override

- **Where the name probably renders.** The top-bar profile avatar at the upper right. The name is likely an `img alt`, a `title`/`aria-label` on the avatar button, or visible only inside the opened profile menu. There is no public documentation. This is a recon item, and the architecture must survive the worst case, where the name is only visible while the menu is open.
- **Detector.** `zhroma-identity.js` has its own debounced observer. It is independent of the table observer, because the header can mount after the table and nothing in the table would re-trigger a pass. On a successful read, it normalises the name (NFC, collapse whitespace, trim, length ≤ 128, no control characters). If the name differs from the last one sent, it sends `{type: 'identity-detected', name}` to the worker. It then disconnects, and re-arms on `pageshow`. In the worst case it detects opportunistically when the agent opens their profile menu, and the persisted `identityDetected` covers every later page load.
- **Worker write.** The worker checks `fromContent(sender)`, validates the name with `ZhromaSettings.validateIdentity`, and writes `identityDetected` only when it changed, through the settings queue. This is the **one deliberate break** of the "content tells the extension only finite enums" rule. It is scoped to the agent's own display name, which the user explicitly asked to have detected. Record it as a decision, and update `release/disclosures.md` and the privacy policy: a name is now stored on the device. The consent-applicability question in `release/policy-applicability.md` should be re-read in light of this.
- **Precedence at `compile`.** `identityOverride` (if set) wins, then this document's live detection, then the persisted `identityDetected`, then none. With none, `is me` conditions make the rule **not apply** (same rule as a missing column), and rule health reports `identity-unknown`. The options page shows "Detected: <name>" read from storage, beside an override field with "Use detected" to clear it.
- **Multi-tenant caveat.** Agents working in two subdomains under different display names will see the last-detected name from the other tenant until the current header is read. Live detection wins within a document, so the window is short. Storing per-host would put tenant hostnames into storage, which v1 carefully avoided. Accept the caveat and document it.
- **Model.** `is me` is an operand, not a column: `{column: 'Assignee', operator: 'equals', operand: {kind: 'me'}}`. It works with `equals` and `not-equals` on any column, for example Requester. That is free generality, and it stops "assignee" from being hard-coded into the engine.

### 6. Three-way diagnosis and toolbar status when rules reference missing columns

**The toolbar and the three diagnoses stay Priority-only. Rule health is a separate channel.**

- The diagnoses (`working`, `missing`, `cannot-read`) are accepted v1 behaviour, backed by paired icons, fixed copy and exact-shape validators in three files (`TITLES`, `COPY`, `validDiagnosis`, and `isExact(reply, ['type','requestId','diagnosis','reason'])`). Adding a rules dimension to them would change every one of those tables and reopen FAIL-01/03/05. It would also blur a clear message: "Add a Priority column" is about Priority.
- **New finite enum** in the content script: `ruleHealth ∈ {'none', 'ok', 'columns-missing', 'identity-unknown', 'settings-unreadable', 'unknown'}`. It is computed from the same pass, and it only leaves `unknown` in states `safe` or `blank`, or in `missing` once `missingConfirmed` is set. That reuses the v1 certainty: a mounting view is never accused of lacking a rule's column.
- **Transport is additive.** The popup sends `{type: 'popup-rule-status', requestId}`. The worker relays `{type: 'get-rule-status', requestId}` to `frameId: 0` under the same `bounded()` deadlines. The content script replies `{type: 'rule-status', requestId, health}`. None of the v1 message shapes change.
- **Popup copy.** Second line, fixed strings. For example: `columns-missing` → "Some rules use a column this view doesn't show". `identity-unknown` → "Zhroma doesn't know who you are yet — set your name in Rules". Nothing appears for `none`/`ok`/`unknown`. No column names are echoed from the page. The line could name the rule, since rule names are the user's own data, but keep v1.1 to fixed copy.
- **Toolbar icon.** Unchanged. No sixth shape. Rules painting in a `missing` view while the icon says "Add a Priority column" is still true, because the message is about priority tinting.
- **Off.** The one switch turns off everything: tints, fills, marks and the `<html>` attributes. `pauseController` also clears rule stamps and removes `data-zhroma-theme` and `data-zhroma-scheme`, so the page is left exactly as it was.

### 7. Data flow: options ↔ popup ↔ worker ↔ content, and the import boundary

**The worker is the single writer for every key.** This extends the v1 key decision rather than inventing a second policy. It gives three things. First, one serial queue, so a popup theme change, an options save and an identity detection can never interleave a read-modify-write. Second, one trust boundary, because the worker validates with the same `ZhromaSettings` the content script reads with. Third, the existing bounded-hop and admission-cap machinery can be reused. Extension pages may **read** storage directly (the options page does). The popup keeps its v1 rule and asks the worker.

```
Options "Save"   → {type:'save-rules', requestId, rules, baseRevision}
                   worker: validateRules → read rules.revision → baseRevision matches?
                     yes → set {rules:{schema:1, revision:n+1, items}} → {saved:true, revision:n+1}
                     no  → {saved:false, conflict:true}  → options reloads from storage and says so
                   storage.onChanged → every content script recompiles → scheduleReconcile()
Popup theme      → {type:'set-theme', requestId, theme} → validateTheme → set {theme} → {saved}
                   storage.onChanged → content flips <html data-zhroma-theme>; no pass
Content identity → {type:'identity-detected', name} → validateIdentity → set if changed
Options import   → file ≤ 256 KB → JSON.parse (try) → validateExport (UX preview: "Replace 7 rules, theme Nord?")
                   → {type:'import-settings', requestId, payload}
                   worker re-validates (the trust boundary) → ONE set({theme, rules, identityOverride})
Options export   → read storage → {format:'zhroma-settings', schema:1, theme, rules, identityOverride}
                   → Blob + <a download> (no downloads permission); identityDetected is NOT exported
```

- **Import validation is strict and whole-document.** Only exact keys are allowed. Unknown operators or slots reject the file. Hex must match `^#[0-9a-f]{6}$` after lowercasing. Caps apply: 100 rules, 20 conditions per rule, group depth 3, 200-character strings. It replaces rather than silently merges, and the worker revalidates even though the page already did. Reject before any write, so a bad file changes nothing.
- **Why a revision CAS.** It lets two options tabs, or options plus import, fail honestly ("changed elsewhere, reloaded") instead of last-writer-wins silently eating a rule edit. The popup's theme and the options page's rules are separate keys, so the most common concurrent pair never conflicts at all.
- **Honest reporting stays the norm.** The save reply is `saved: true/false`, and the options page shows "Zhroma could not save that" on false, mirroring `NOT_SAVED`. An application acknowledgement from tabs is **not** needed: `storage.onChanged` is reliable in every tab, and the v1 handshake existed to report on the switch. For verification, if wanted, have `get-rule-status` also echo the compiled `rules.revision`.

---

## Architectural Patterns

### Pattern 1: One validator, many consumers

**What:** Rules, the Priority read and rule health all hang off the single `inspectCandidateTable` walk.
**When:** Always. A second walker in the rules module would sooner or later disagree with the first about which rows are tickets.
**Trade-off:** It touches the accepted function, but only additively: two return fields and one `rows.push`. The mutants in `test/mutants/*.json` for inspection should still kill, which is a direct regression check.

### Pattern 2: Parallel ownership for new stamps

**What:** Rule stamps get their own `ownedRuleRows` set and expected-value `WeakMap`, and their own `commitRuleStamps` / `clearRuleStamps`. These copy the v1 algorithm: copied-marker adoption, one bounded retry on removal, and full rollback on a failed write. They are called at exactly the points where the v1 marker functions are called: `commitSnapshot`, the observer's same-turn invalidation, `pauseController`, and the error paths.
**When:** For every new row attribute.
**Trade-off:** About 50 lines of near-duplicate code, in exchange for leaving `clearOwnedMarkers` and `commitSnapshot` behaviour identical. The new attributes are added to `INTERPRETATION_ATTRIBUTES`, so host tampering and cloning are detected just as they are for `data-zhroma-priority`. The `<html>` attributes are **not** added. Our own writes there should not wake the table classifier.

### Pattern 3: Colour indirection through CSS custom properties, with literal fallbacks

**What:** Rows name a *role* (priority value, slot, `custom`). `<html>` names the theme and scheme. `themes.css` maps them to values. Every var has the 0.1.0 literal as its fallback.
**When:** For every painted surface.
**Trade-off:** A few more selectors. In return, a theme or scheme change costs O(1) DOM writes, the default install is provably 0.1.0 (string-comparable in tests), and the popup previews use the same bytes.

### Pattern 4: Compile once, evaluate per pass

**What:** `compile(rules, identity)` lowercases operands, drops disabled rules, flattens groups into a closure-free tree and lists referenced columns. It runs only on a settings change. `bind` and `evaluate` run per pass.
**When:** Rules change rarely and passes are frequent.

```js
// zhroma-rules.js — evaluation core (sketch)
function test(node, cells, binding) {
  if (node.group) {
    const results = node.items.map((child) => test(child, cells, binding));
    if (results.includes(SKIP)) return SKIP;                 // unresolved column/identity → rule doesn't apply
    return node.group === 'all' ? results.every(Boolean) : results.some(Boolean);
  }
  const index = binding[node.column];
  if (index === MISSING || index === AMBIGUOUS) return SKIP;
  const value = cells.text(index);                          // normalised, per-pass cached
  switch (node.op) {
    case 'equals':     return node.me ? node.meValue !== null && value === node.meValue : value === node.value;
    case 'not-equals': return node.me ? node.meValue !== null && value !== node.meValue : value !== node.value;
    case 'contains':   return value.includes(node.value);
    case 'is-empty':   return value === '' || value === EMPTY_PLACEHOLDER;   // placeholder from recon
  }
}
```

(Where `node.meValue === null`, the `me` rule is marked SKIP at `compile`, so no rule quietly matches on an unknown identity.)

---

## Data Flow

### Flow A: Page load with a non-default theme and rules

```
document_idle → settings.js, rules.js, scheme.js, identity.js, content.js evaluate (one scope)
  content: listeners registered (v1 order) + onSettingsChanged (NEW) → readPreference() ∥ readSettings()
  scheme:  detect → <html data-zhroma-scheme="dark">           (CSS vars now resolve dark)
  settings ready → compile(rules, identity) ; <html data-zhroma-theme="nord">
  preference ready ∧ settings ready ∧ visible → resumeController → observer → reconcile pass
      inspectCandidateTable → {state:'safe', entries, headers, rows}
      commitSnapshot (v1) + bind/evaluate + commitRuleStamps (NEW) — same synchronous turn
      publishStatus('working') (v1)  ;  ruleHealth = 'ok' | 'columns-missing'
  CSS engine paints: priority tint, overridden by fill where stamped, stripe where marked
identity (independent): header mounts → name read → worker → identityDetected (if changed)
      → storage.onChanged → recompile → scheduleReconcile → 'me' rules now apply
```

### Flow B: Agent switches Zendesk to Dark mid-session

```
Zendesk re-renders its own styles (recon: class swap vs re-mount)
  scheme observer / matchMedia trigger → re-detect → <html data-zhroma-scheme="dark">
  CSS: every --zhroma-* re-resolves → tints and marks repaint
  NO reconcile pass, NO rule evaluation, NO row writes
  (if the switch re-mounted the table, the v1 observer re-stamps as it would for any re-render)
```

### Flow C: Theme picked in the popup

```
popup → worker set-theme → storage.set({theme}) → reply {saved}
  every Zendesk tab: onSettingsChanged → <html data-zhroma-theme="…"> → CSS repaints
  popup swatches (themes.css) already showed the choice; no tab handshake needed
```

### Key Data Flows

1. **Ticket data** goes DOM → content script → row attributes. It never crosses a messaging boundary, and it is never persisted.
2. **Settings** go extension page → worker (validate, serialize, CAS) → `storage.local` → `onChanged` → every content script (re-validate, compile).
3. **Identity** is the one page-derived string that leaves the content script: content → worker → `storage.local`. It is validated, deduplicated and disclosed.
4. **Status** stays as v1: finite diagnosis → worker → toolbar. Rule health is finite too, pulled on popup open.

---

## Scaling Considerations

The axes are rows per view, rules and mutation rate, not users.

| Scale | Architecture adjustments |
|-------|--------------------------|
| 30 rows × up to 10 rules (typical) | Nothing. Bind (16 headers) plus about 300 condition tests per pass, well under 1 ms |
| 100 rows × 100 rules × 20 conditions (the cap) | About 200k comparisons worst case. Still a few ms, and passes are already coalesced by the zero-delay reconcile timer. Extend `test/performance/tint-workload` with a rules workload and hold it to the existing LIVE-05 budget |
| High mutation rate (live-updating view) | Unchanged from v1. The observer callback's same-turn invalidation must stay O(rows) and must **not** run full rule evaluation. Clear rule stamps just as priority stamps are cleared, and let the deferred pass re-evaluate |

### Scaling Priorities

1. **First bottleneck: correctness, not speed.** Zendesk renames a header ("Assignee" → "Assigned to") and rules silently stop applying. Rule health `columns-missing` is the mitigation: the agent is told, not left guessing.
2. **Second: the same-turn observer path.** If rule clearing were made "smart" (diffing, partial keeps), that complexity would sit in the code that runs on every mutation batch. Keep it clear-all-then-restamp, as v1 does for non-`safe` states.

---

## Anti-Patterns

### Anti-Pattern 1: Evaluating rules in the service worker
**What people do:** Send the header labels and cell texts to the worker "because that's where settings live".
**Why it's wrong:** Ticket data crosses a process boundary. Conclusions are committed against a DOM that has moved on (breaking the v1 same-turn invariant). The worker can be terminated mid-evaluation.
**Do this instead:** Compile in the content script from `storage.onChanged`, and evaluate inside the reconcile pass.

### Anti-Pattern 2: Treating a missing column as an empty value
**What people do:** `cells[index] ?? ''`.
**Why it's wrong:** `not equals` and `is empty` then match every row in every view that lacks the column. The view lights up with false signals, which is the one failure that destroys trust in a glance tool.
**Do this instead:** An unresolved column or identity makes the rule not apply, and it is counted in rule health.

### Anti-Pattern 3: `prefers-color-scheme` (or page `localStorage['color-scheme']`) as the dark signal
**Why it's wrong:** Zendesk offers explicit Light and Dark independent of the OS. The localStorage key is Garden's configurable default, not a Zendesk contract, and it fires no same-tab event.
**Do this instead:** Use the recon-proven host signal, or the pane surface luminance, with `matchMedia` as a re-detect trigger only.

### Anti-Pattern 4: Stamping resolved colours on rows
**What people do:** `row.setAttribute('data-color', theme.red)`.
**Why it's wrong:** Every theme or scheme change becomes a full re-evaluation and restamp. It also puts the palette into JS and breaks the palette-free contract.
**Do this instead:** Stamp slot names. Resolve colour in CSS. Only user-supplied custom hex goes on the row, and CSS parses it with `attr(type(<color>))`.

### Anti-Pattern 5: Generating CSS text from user settings
**What people do:** Build `<style>` or `adoptedStyleSheets` from rule colours.
**Why it's wrong:** A validation slip becomes CSS injection into the agent's Zendesk page. Adopted sheets from isolated worlds are poorly specified (Firefox is broken outright), and a host that reassigns the array drops them silently.
**Do this instead:** Use static CSS plus attribute stamps. As a fallback, use an inline custom property on our own stamped row.

### Anti-Pattern 6: Drawing the mark with `box-shadow`
**Why it's wrong:** Native selection is `box-shadow: inset 3px 0 0` on the first cell. Our `!important` shadow would erase it on selected rows.
**Do this instead:** Put a `background-image` gradient stripe on the first direct cell. It layers over the tint and sits under the native selection shadow.

### Anti-Pattern 7: Folding `enabled` into a new settings object
**Why it's wrong:** It reopens the accepted preference queue, epochs and apply handshake. It also risks a half-migrated read being treated as "unconfirmed → untinted" for every upgrading user.
**Do this instead:** Leave `enabled` as it is. New keys, and absent means default.

### Anti-Pattern 8: Letting rules change the three-way diagnosis or the toolbar
**Why it's wrong:** It rewrites accepted FAIL-01/03/05 behaviour in three files, and it muddies "Add a Priority column".
**Do this instead:** An orthogonal `rule-status` enum, with a popup second line.

### Anti-Pattern 9: Harvesting header labels or cell values into storage for autocomplete
**Why it's wrong:** It persists page data, custom-field names included, and makes the content script a storage writer.
**Do this instead:** Offer a static list of standard Zendesk column names plus free text in the options page. A "pick from current view" helper is a later feature that would need its own privacy decision.

### Anti-Pattern 10: Content script or options page writing storage directly
**Why it's wrong:** You get multiple writers, lost updates, and no single validation boundary.
**Do this instead:** Every write goes through the worker queue. Pages may read.

---

## Integration Points

### External Services

| Service | Integration pattern | Notes |
|---------|---------------------|-------|
| Zendesk DOM (table) | Unchanged Garden selector pair, same-table header ownership | Rules add no new selectors. They reuse the validated snapshot |
| Zendesk DOM (dark signal) | **TBD by recon.** Direct CSS keying, or pane luminance plus a narrow observer | New standing fragility. Fail to `light`, which is the 0.1.0 look |
| Zendesk DOM (identity) | **TBD by recon.** Header avatar or profile menu | New standing fragility. Fails to `identity-unknown`, and the override always works |
| Network, Zendesk API | None | Unchanged. The export file is written only on explicit user action |

### Internal Boundaries

| Boundary | Communication | Status | Notes |
|----------|---------------|--------|-------|
| content ↔ worker `status-invalidated` / `get-status` / `apply-preference` | runtime messages | unchanged | Byte-level edits are possible, but behaviour must not change. Rerun the v1 suites and mutants |
| content → worker `identity-detected {name}` | fire-and-forget | **NEW** | The only page-derived string leaving the content script. **Tighten the sender check:** the v1 `fromContent` (tab + `frameId: 0` + `documentId`) is also true for the options page opened in a tab, so this handler must additionally require `sender.origin` to be an `https://*.zendesk.com` origin, never `chrome-extension://` |
| worker → content `get-rule-status` → `rule-status {health}` | request/reply, `frameId: 0`, bounded | **NEW** | Finite enum |
| popup → worker `set-theme`, `popup-rule-status` | request/reply | **NEW** | `fromPopup` sender check (v1 helper) |
| options → worker `save-rules`, `set-identity-override`, `import-settings` | request/reply | **NEW** | New `fromOptions` check: `sender.url === getURL('options.html')`, `sender.tab` set because it opens in a tab. Validate the URL, not the tab |
| worker ↔ `zhroma-settings.js` | `importScripts` at top level | **NEW** | Classic worker only. It must be the first statement, before any listener registration |
| content scripts ↔ each other | shared isolated-world globals (`ZhromaSettings`, `ZhromaRules`, `ZhromaScheme`, `ZhromaIdentity`), each `Object.freeze`d | **NEW** | The runtime-contract "no new globals" assertion becomes "exactly these four" |
| page ↔ CSS | `<html>` and `tr` data attributes | **MODIFIED** | Seven owned attributes instead of one. All are removed on pause or off |

---

## Suggested build order

The ordering is driven by three constraints: DOM recon gates every piece of DOM-dependent design; pure foundations can proceed in parallel with recon; and **each shipped-byte change reopens human checks**. So the v1 behavioural regression UAT should run **once, on the 1.0.0 release candidate bytes**, not once per phase. Intermediate phases prove themselves with the automated suites (Vitest + happy-dom fixtures, Node smoke, mutation kills) and dev-only live smoke.

| # | Phase | Ships | Depends on | New / modified | Research flag |
|---|-------|-------|-----------|----------------|---------------|
| 1 | **Recon 2: dark mode, identity and column values** | No runtime bytes. `SELECTORS.md` entries, admitted fixtures, sanitizer support for a consistent name token | Live tenant with dark mode allowed, the user driving | MODIFIED `SELECTORS.md`, `scripts/sanitize-fixture.js`; NEW fixtures | **Required.** The whole milestone's DOM facts live here |
| 2 | **Settings foundation (invisible)** | `zhroma-settings.js`; worker `importScripts` + settings queue + CAS + `set-theme`/`save-rules`/`import-settings` handlers; content `readSettings`, `onSettingsChanged` and the `settingsReady` gate; manifest arrays, `options_ui` stub; `RELEASE_FILES` | None. **Can run in parallel with 1** | NEW `zhroma-settings.js`; MODIFIED `background.js`, `content.js`, `manifest.json`, `scripts/release-source.js` | Standard patterns |
| 3 | **Styling seam + themes (light)** | `themes.css`; `zhroma.css` refactored to vars with 0.1.0 fallbacks; `<html data-zhroma-theme>`; popup theme picker; colourblind-safe preset; typed-`attr()` spike | 2 | NEW `themes.css`; MODIFIED `zhroma.css`, `content.js`, `popup.html`, `popup.js`, `manifest.json` (min Chrome) | Spike: `attr()` in custom properties plus inheritance to `td` |
| 4 | **Dark mode** | `zhroma-scheme.js`; dark variants for every preset; `<html data-zhroma-scheme>`; mid-session switch | **1** (signal and dark native states) + 3 | NEW `zhroma-scheme.js`; MODIFIED `themes.css`, `content.js` (pause/cleanup), `manifest.json` | Depends entirely on the recon branch taken |
| 5 | **Rule engine + effects (no UI)** | `zhroma-rules.js`; snapshot `headers`/`rows`; rule stamps with parallel ownership; fill/mark CSS; `rule-status` relay + popup line. Tests seed rules through storage | 2, 3; **1** for cell normalisation and the empty placeholder | NEW `zhroma-rules.js`; MODIFIED `content.js`, `zhroma.css`, `background.js`, `popup.js` | Moderate: normalisation edge cases |
| 6 | **Options page + export/import** | `options.html`/`options.js`: ordered rules, nested AND/OR groups, slot-or-hex colour, replace/mark, identity override field, export/import with preview | 2 (schema), 5 (semantics the UI must describe) | NEW `options.html`, `options.js`; MODIFIED `popup.*` ("Edit rules" link) | UI phase (UI-SPEC recommended): nested group editing is the UX risk |
| 7 | **Identity detection + `is me`** | `zhroma-identity.js`; `identity-detected` handler; `me` operand; `identity-unknown` health | **1** (location) + 5 + 6 | NEW `zhroma-identity.js`; MODIFIED `background.js`, `zhroma-rules.js`, `options.js` | Depends on the recon worst case (menu-only name) |
| 8 | **Release 1.0.0** | Version bump; privacy policy and disclosures (stored name, options page); listing and screenshots incl. dark; v1 regression UAT + v1.1 UAT on the candidate bytes | All | MODIFIED `manifest.json`, `release/*` | Standard, but budget for the full UAT |

**Ordering rationale:**

- **Recon runs first but does not block 2 or 3.** The settings foundation and the light-mode styling seam have no Zendesk DOM dependency beyond what v1 already proved. Phase 2 is deliberately *invisible*: with defaults, the page must be byte-for-byte as painted by 0.1.0. That makes the "fresh install identical" requirement a regression check at the earliest possible moment, instead of a hope at the end.
- **Styling before rules.** Fill and mark need the var seam and the slot vocabulary. Building rules first would mean inventing a second colour path and deleting it later.
- **Engine before editor.** The options page must describe semantics that already exist and are tested: missing column → rule doesn't apply, precedence, empty placeholder. The engine is fully testable by seeding storage.
- **Identity last.** It has the most uncertain recon, and it is one operand. Everything else ships without it, and the override path works without detection at all.
- **Consolidate `content.js` edits.** Phases 2, 3, 4 and 5 all touch it. If re-acceptance cost bites, merge 2 into 3 and 4 into 5 so the accepted file changes in two reviewed steps, not four.

---

## Sources

- **Shipped code (primary, HIGH):** `extension/content.js`, `background.js`, `popup.js`, `popup.html`, `zhroma.css`, `manifest.json`; `test/extension/runtime-contract.test.js` (palette-free and write-surface assertions, manifest key prohibitions, shipped-inventory list); `scripts/release-source.js` (`RELEASE_FILES`); `test/fixtures/zendesk-view-priority-present.html` (header/cell shapes: hidden label spans, `aria-label` cells, `<time>` cells)
- **v1 DOM ledger (primary, HIGH within its English/light scope):** `SELECTORS.md`, in particular `painting-element`, `interaction-and-sticky-states` (row-owned hover/selection, first-cell inset selection shadow) and `stable-identifiers`
- **v1 architecture research:** `.planning/milestones/v1.0-research/ARCHITECTURE.md` (stamp-and-style, stateless passes, the v2 seam)
- **Zendesk Garden source (primary, HIGH):** `@zendeskgarden/react-theming@9.16.1` npm tarball, `dist/esm/elements/ThemeProvider.js` and `ColorSchemeProvider.js`. No DOM signal; `localStorage['color-scheme']`; `matchMedia` only in system mode
- [Zendesk — Using dark mode to increase agent display options](https://support.zendesk.com/hc/en-us/articles/9011095783322-Using-dark-mode-to-increase-agent-display-options) (MEDIUM): Light/Dark/Match system, views included
- [Zendesk — Announcing dark mode for Zendesk Support](https://support.zendesk.com/hc/en-us/articles/9235318127770-Announcing-dark-mode-for-Zendesk-Support) (MEDIUM)
- [Internal Note — Zendesk Dark Mode](https://internalnote.com/zendesk-dark-mode/) (LOW–MEDIUM, 2025-03-24): `#151A1E` surface, profile-menu toggle
- [Zendesk Developer Docs — Supporting dark mode (apps)](https://developer.zendesk.com/documentation/apps/app-developer-guide/dark-mode/) (MEDIUM): ZAF `colorScheme` and `colorScheme.changed` exist for apps only; they are not reachable from a content script
- [Chrome for Developers — CSS attr() gets an upgrade](https://developer.chrome.com/blog/advanced-attr) (MEDIUM–HIGH): Chrome 133, any property including custom properties, `type(<color>)` with fallback
- [Chrome for Developers — Options page](https://developer.chrome.com/docs/extensions/develop/ui/options-page) (HIGH): `options_ui`, `openOptionsPage`, embedded-page limits
- [Mozilla bug 1767819](https://bugzilla.mozilla.org/show_bug.cgi?id=1767819) / [1770592](https://bugzilla.mozilla.org/show_bug.cgi?id=1770592) (LOW for Chrome relevance): adoptedStyleSheets broken from content scripts in Firefox; Chrome behaviour under-documented, so the mechanism is avoided
- MV3 classic service worker `importScripts` only at initial evaluation (MEDIUM, [Chromium issue 40760920](https://issues.chromium.org/issues/40760920) and community references)

### Gaps (need phase-specific work)

- The dark-mode signal and switch mechanics (Recon 2). Nothing about it can be settled by desk research.
- Identity location. The worst case (name only visible in the opened menu) is designed for, but not confirmed.
- The empty-value placeholder and `aria-label`-only cells for non-Priority columns.
- Typed `attr()` inside a custom property inheriting to `td` from an isolated-world-stamped `tr`. Spike in phase 3.
- Whether storing the agent's display name changes the Chrome Web Store privacy disclosures (phase 8, with `release/policy-applicability.md`).

---
*Architecture research for: Zhroma v1.1 Themes & Rules integration*
*Researched: 2026-09-25*
