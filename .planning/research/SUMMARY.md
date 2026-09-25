# Project Research Summary

**Project:** Zhroma. Milestone v1.1 Themes & Rules, shipping as Chrome extension **1.0.0**
**Domain:** Adding dark-mode awareness, preset colour themes with named slots, user-written AND/OR colouring rules, "assignee is me" identity, an options page and local export/import to a published, no-build, `storage`-only MV3 content-script extension that reads Zendesk's rendered DOM
**Researched:** 2026-09-25
**Confidence:** MEDIUM overall. The integration shape and the Chrome platform facts are HIGH. Every new Zendesk DOM fact is LOW until live recon: the dark-mode signal, where the agent's name renders, and how non-Priority cells render.

Detail lives in `STACK.md`, `FEATURES.md`, `ARCHITECTURE.md` and `PITFALLS.md` in this directory. The v1.0 research is archived at `.planning/milestones/v1.0-research/`. Its calls still stand unless revised here: declarative content scripts, unlayered `!important` CSS, no `@layer`, attribute-plus-CSS styling, and Vitest + happy-dom.

---

## Executive Summary

v1.1 turns a single-purpose, zero-config priority tinter into a small rule-driven colouring engine. It still has to behave exactly like 0.1.0 until the agent chooses otherwise. The comparable products (Airtable record colouring, Notion conditional colour, Jira card colours, Google Sheets and Outlook conditional formatting) all use the same model: an ordered rule list where the first match wins, a fixed operator vocabulary, and a left-edge stripe as the recognised second signal. Zendesk's own views and triggers give support staff a flat "Meet ALL / Meet ANY" mental model they already use every week. So nothing about the feature set is novel. What is hard is fitting it into *this* codebase. The verified 0.1.0 priority path has to stay byte-stable in behaviour. Evidence binds to shipped bytes, so every change reopens human checks. The published privacy policy says Zhroma stores "exactly one thing".

The recommended approach is conservative, and all four researchers converge on its core:
- **No new permission.** `permissions` stays exactly `["storage"]`. `options_ui` with `open_in_tab: true`, `Blob` + `<a download>` and `<input type=file>` need nothing more.
- **No runtime dependency and no bundler.** Shared code is classic-script IIFE files on one frozen namespace, loaded in manifest order in the content script, by `<script>` tags in the pages, and by `importScripts` in the worker.
- **Rules run in the content script, inside the existing inspect-then-commit turn.** They consume the same validated snapshot, so a rule can never touch a row or table that v1 would have refused.
- **Rows carry semantic stamps (slot names). CSS custom properties resolve colours.** Every var has the exact 0.1.0 literal as its fallback.
- **The worker is the single validated writer for every new key.** The v1 `enabled` key and its queue are left untouched. An absent key means the 0.1.0 default. Nothing is seeded, so "no migration" is the migration.

The main risks, in damage order:
1. **Shipping a new data practice under a policy that still says "exactly one boolean".** 0.1.0 had automatic publication enabled. Mitigation: make identity opt-in, update the policy before the code ships, and use deferred publishing.
2. **Regressing the verified priority path while generalising column resolution.** Mitigation: build a differential parity test against the pinned 0.1.0 blobs before any feature code, and split the contract test into frozen and versioned parts.
3. **Palettes that vanish or merge on Zendesk's dark surface.** At the 0.1.0 alphas, legibility is fine but distinguishability collapses. Mitigation: a preset is blended output with per-mode alphas, and a palette-validator test gates every preset.
4. **Detecting dark mode from the wrong signal.** Garden emits no DOM signal and `prefers-color-scheme` reflects the OS, not Zendesk. Mitigation: a live-recon gate, then a luminance probe on an unpainted element with narrow re-detect triggers.
5. **Rule semantics that don't match what agents see.** Missing columns, empty placeholders, hidden labels, relative dates and duplicate headers all cause this. Mitigation: an explicit truth table, recon of cell shapes, and a finite rule-health enum.

---

## Key Findings

### Recommended Stack

The stack barely moves, and that is intentional. The shipped extension stays hand-written MV3 JavaScript with zero runtime dependencies, and the manifest adds one key that grants nothing (`options_ui`). The v1.0 "migrate to WXT at 800 lines or when an options page exists" trigger has fired, and it is **overridden on purpose**. A bundler would put a generated artifact between the reviewed source and the shipped zip, which breaks the pinned-blob evidence model. That model is now the project's most expensive asset. **New trigger (record it):** adopt WXT or a drift-tested bundle only if a second browser is committed to, a runtime npm dependency becomes unavoidable, or the shipped-byte evidence model is deliberately replaced. Line count is no longer a trigger. (Full detail: STACK.md §10.)

**Core technologies:**
- **`options_ui` + `open_in_tab: true`, `chrome.runtime.openOptionsPage()`**: rule editor, identity, export/import. A nested editor and file choosers need a full tab. File inputs in popups are flaky because the popup closes under the OS dialog.
- **`chrome.storage.local` (already granted), one key per concern, each schema-versioned**: 10 MB quota (5 MB below Chrome 114). Validator caps keep the worst case around 1 MB. Never `unlimitedStorage` and never `sync`.
- **Hand-written "parse, don't validate" module** (about 150–250 lines): rebuilds fresh objects from whitelisted keys, which kills `__proto__` pollution. It is shared by the options page, the worker and the content script. ajv is ruled out because it needs `new Function`, which MV3 CSP forbids. zod and valibot would be the first runtime dependency.
- **Hand-written `colour.js`** (about 60–80 lines): sRGB compositing, WCAG 2.x contrast and OKLab ΔE. It is testable in happy-dom and shared by the content script, popup swatches and options preview. Use WCAG 2.x, not APCA (non-normative, non-OSI licence).
- **AST interpreter for rules**: no `eval`, no `new Function`, no json-logic, no regex operator in 1.0.0 (ReDoS risk and untrusted `new RegExp`).
- **Native `<template>`, `<dialog>`, `<input type=color>` + `textContent` only**: zero `innerHTML`, because imported rule strings are untrusted.
- **Dev additions (each needs a `DEPENDENCY-APPROVALS.md` entry):** `typescript@7.0.2` + `@types/chrome@0.3.0` for `tsc --noEmit --checkJs`. It is recommended now because a schema, a rule AST and a theme model are shared across four contexts. Optional: `fast-check@4.10.2` (property tests for the validator and round-trips) and `colorjs.io@0.7.1` as a *test-only* oracle, with a test asserting `extension/` never references it. **Keep `vitest@4.1.11` and `happy-dom@20.13.1` pinned.** Do not take vitest 5.0.2, which was published on the research date.
- **New "baseline API guard" test**: greps `extension/**` for anything above the recorded `minimum_chrome_version`.

### Expected Features

**Must have (table stakes for 1.0.0):**
- **Dark mode (A1–A4):** detect Zendesk's own Light / Dark / Match-system choice, not the OS. Follow a mid-session switch without reload. Keep tints distinguishable on the dark surface. Host hover and selection states still win.
- **Palette seam:** colours as data driving CSS custom properties, held to the CSS by an agreement test. This is the foundation for everything else.
- **Theme picker (B1–B5):** in the popup, applied live, with swatch strips showing the *rendered* tint for the current mode. Classic is the default and uses 0.1.0's light values byte for byte. The canonical slot set is `red, orange, yellow, green, cyan, blue, purple, magenta`, filled for every preset in both modes, and derived values are labelled.
- **Presets (B6, B8):** about eight, so the popup stays one screen: Classic, Catppuccin, Tokyo Night, Dracula, Nord, Gruvbox, Solarized, Colourblind-safe. The colourblind preset is validated by CVD simulation of *blended* rows.
- **Rules engine (C1–C12):**
  - conditions keyed by rendered header text, with a duplicate header treated as ambiguous and the rule inactive;
  - operators: is, is not, contains, does not contain, is empty, is not empty, plus **"is any of"**;
  - a symbolic "is me" operand;
  - ordered rules in **two channels, tint (replace) and stripe (mark), each first-match-wins**;
  - rule colour is a theme slot or a fixed hex;
  - a missing column is *unknown*, never empty;
  - rules re-apply through the existing liveness path;
  - group rows and blank cells are never matched.
- **Rule-aware status (C9):** a view without Priority can now be "working". See Conflict 5.
- **Options editor (D1–D8):**
  - each rule shown as a readable one-line sentence, with [column] [operator] [value] rows;
  - ALL/ANY with one group level (see Conflict 4);
  - reorder with up/down buttons (drag optional);
  - per-rule enable, and delete with undo;
  - a slot-swatch picker plus a "Custom…" hex field.
- **Identity (E1, E2, E4):** auto-detect with an override that always wins, and a visible unknown state.
- **Storage (F1–F6):** schema-versioned local storage, JSON export, validated import with a preview and all-or-nothing apply, reset to defaults, and a privacy policy updated for stored names and values.
- **D9 live match counts per rule** ("matches 7 rows here" / "inactive here: needs Group column"): the one feature that makes rules learnable. The content script pushes the counts through the worker. The options page never queries tabs.

**Should have (after validation, v1.x):**
- D11 starter templates, never pre-enabled on install.
- D12 popup legend of active rules.
- C14 "no colour" mute effect.
- D10 duplicate rule.
- F7 "Add to my rules" import mode. Ship Replace-only first if time is short.
- A6 dual-surface (light and dark) preview.

**Defer (v2+):**
- date and relative-time operators (they need locale-aware parsing and new recon);
- whole-word tag matching (pending recon of how Tags render);
- per-view or per-subdomain rule scoping;
- a custom theme editor;
- a regex operator.

**Anti-features (hold the line):**
- arbitrary-depth nesting;
- stacked stripes;
- Zhroma restyling Zendesk;
- `/api/v2/users/me` or MAIN-world identity;
- recording cell values for autocomplete;
- per-row tooltips injected into Zendesk;
- pre-enabled example rules;
- `storage.sync`.

### Architecture Approach

All ticket-data interpretation stays in the content script, in the same synchronous turn as v1's table inspection. `inspectCandidateTable` changes only additively: it also returns `headers[]` and the full-width `rows[]` it already walks. The Priority branch keeps its literal exact-English `'Priority'` test and the `PRIORITY_LABELS` exact match. A separate pure rule module does `compile` (once per settings change), then `bind` (header label → index | MISSING | AMBIGUOUS, per pass) and `evaluate` (per row → `{fill, mark}`). It runs only in states `safe`, `blank` and `missing`, so **rules inherit the English-only gate**. That is a decision to record.

Rule stamps (`data-zhroma-fill`, `data-zhroma-mark`) get their own ownership set, a parallel copy of the v1 marker algorithm, and they are registered in `INTERPRETATION_ATTRIBUTES` plus the expected-marker map so that they neither self-retrigger nor silently vanish. Theme and scheme are attribute or custom-property flips at document level and never re-evaluate rules. The toolbar and the three v1 diagnoses stay Priority-only. Rule health is a separate finite enum, pulled on popup open.

**Major components:**
1. **Settings schema/validator** (new shared classic script): keys, defaults, enums, caps, `migrate`, `parse*`. Loaded by the content script, worker (`importScripts`, first statement, classic worker), popup and options.
2. **Rule engine** (new, pure, content-script only): normalise (NFC or NFKC, collapse whitespace, trim, `toLowerCase()`), compile, bind, evaluate, health.
3. **Colour and theme data** (new): preset slot tables × {light, dark} with licence headers. Colours are resolved in JS (see Conflict 1).
4. **Scheme detector** (new): recon-proven marker if one exists, otherwise a luminance probe on an element Zhroma never paints. It has its own narrow observer on `html`/`body`, and `matchMedia` acts only as a re-detect trigger. It **never** widens the v1 observer's `attributeFilter`.
5. **Identity detector** (new): one designated source. It returns exactly one clean candidate or nothing, and runs only when a rule uses "is me" (see Conflict 2).
6. **`content.js` (modified):** snapshot extension, rule stamp commit and clear, settings reader under its own generation counter, a `settingsReady` gate in `runnable()` so the first tint is the right tint, and a `get-rule-status` reply. A failed settings read falls back to defaults. It must never hold priority tinting hostage, unlike the non-boolean `enabled` case. Record this.
7. **Worker (modified):** a settings write queue with a revision compare-and-swap for `rules`, and new `set-theme` / `save-rules` / `import-settings` / rule-status relay handlers. **Tighten sender checks:** v1's `fromContent` also passes for the options page opened in a tab. Content-originated handlers must require a `https://*.zendesk.com` origin, and options handlers must validate `sender.url === getURL('options.html')`.
8. **Popup (modified):** theme picker routed through the worker, which keeps the v1 "popup never touches storage" invariant; a rule-health second line; an "Edit rules…" link.
9. **Options page (new):** reads storage directly and writes only via the worker. Export and import happen here only.
10. **Mark rendering:** a `background-image` linear-gradient stripe on the first *data* cell. It is **not** `box-shadow`, because native selection is an inset shadow on the first cell and `!important` would erase it. It is **not** `border`, because that shifts layout.

### Critical Pitfalls

1. **Undisclosed data-practice change (highest damage).** Chrome policy requires prominent disclosure of post-install changes to data practice, and a name is PII. Prevention:
   - identity is opt-in, with an in-product notice and a "Use my name" action at the point of opt-in;
   - rewrite the policy, listing, `disclosures.md` and the dashboard Privacy tab together, and remove every "exactly one";
   - publish the policy and byte-verify it, then publish the item using **deferred publishing**;
   - re-answer the dashboard data categories (likely PII);
   - re-open `release/policy-applicability.md` with dated notes.
2. **Priority-path regression and evidence reopening.** Prevention:
   - keep Priority a separate literal path;
   - a differential **0.1.0 parity harness** (pinned 0.1.0 blobs against the working tree, the three fixtures plus the Phase 3/4 mutation sequences, default settings, light mode) must be green before feature code;
   - split `runtime-contract.test.js` into **frozen invariants** (permissions exactly `['storage']`, no `host_permissions`, no network APIs, no `url(` in any emitted CSS, match pattern, `all_frames: false`, `world: ISOLATED`) and **versioned v1.0 pins**, which are retired with a written reason (four hues, the eleven-file inventory, the `box-shadow` ban). Never edit the contract test in the same commit as feature code;
   - the v1 mutants must still kill;
   - the zero-rule performance median must stay about 1.3 ms.
3. **Storage races and default seeding.** Prevention:
   - separate keys, and the worker as the single writer;
   - no `onInstalled` writes, because absence means default;
   - import is validate → preview → **one** `storage.local.set` → verify;
   - an explicit Save (or a debounce of at least 500 ms), never autosave per keystroke;
   - compare old and new values in `onChanged` so that no-op changes don't reconcile every open tab.
4. **Palettes collapse once blended.**
   - Computed closest-pair OKLab ΔE×100 (about 2 is a just-noticeable difference) for 0.1.0 as shipped: 1.9 in light and 2.0 in dark, falling to **0.6** under deuteranopia on dark.
   - Solarized red and orange merge Urgent and High (1.0 to 1.2, and 0.1 under deuteranopia).
   - Dark needs about **2× the alpha**. Okabe-Ito at α 0.18 light / 0.30 dark reaches 3.1 / 6.1, and 2.7 / 5.2 under deuteranopia, with text contrast still ≥ 5.3:1.
   - Prevention: presets are stored as final `rgb(r g b / a)` values per mode, and a validator test covers every preset × mode × CVD simulation. Presets that fail don't ship, whatever their name. A preset's slot mapping may deviate from the theme's own names (for Solarized, record each deviation). There is a new dark-mode row-state human check for every preset.
5. **CSS injection and exfiltration through colour strings.**
   - Validate hex against `^#[0-9a-f]{6}$` at import, at storage read and at emit.
   - Emit only through a numeric builder that writes `rgb(r g b / a)` from parsed integers.
   - Never generate `<style>` text or `adoptedStyleSheets` from user data.
   - Run a hostile-import suite: malformed JSON, `__proto__`, a 10 MB file, 10,000 rules, deep nesting, `url(`, `</style>`, HTML in names.

Also carry forward:
- **Wrong "me" is worse than no "me"**: exactly one candidate or nothing, and no substring matching for identity.
- **Permission creep disables every existing user on update**: `downloads`, `clipboardWrite` and `tabs` all show warnings. The frozen test is the only real defence.
- **The listing may name at most five brands** (Spam FAQ). Name four or five themes in the description and show the rest in screenshots.

---

## Conflicts to Resolve

The researchers disagree in the places below. Each item feeds a requirement decision and should be settled in REQUIREMENTS.md before roadmap phases are planned. Recommendations are opinionated. Items 4 and 5 need explicit user confirmation.

### Conflict 1: How custom-hex and theme colours reach the page (the Chrome floor)

| Option | Source | Mechanism | Cost |
|---|---|---|---|
| A. JS-resolved colours, floor stays 106 | STACK | `colour.js` + theme tables resolve `theme × mode × slot → rgb(r g b / a)`. The content script writes `--zhroma-*` custom properties through CSSOM `setProperty`: on `<html>` for priority and slot colours, and as an inline custom property on the stamped row for custom hex. Static `zhroma.css` consumes them with 0.1.0-literal fallbacks. | The palette lives in JS, so the v1 runtime-contract "no colour literals in `content.js`" must be restated as "colour literals only in the theme data file and the CSS fallbacks". A theme or scheme change rewrites a handful of document-level properties (still O(1) and no row revisit). Our own `<html>` writes must be excluded from the scheme observer. |
| B. Palette in `themes.css`, custom hex via typed `attr(data-zhroma-fill-color type(<color>))` | ARCHITECTURE | Rows carry slot names or `#rrggbb`. CSS parses the hex itself. `color-mix()` produces the strengths. | **Raises `minimum_chrome_version` from 106 to 133** (users below stay on 0.1.0). Typed `attr()` inheriting through a custom property to `td` is new and needs a spike (MEDIUM). `color-mix()` / `attr()` cannot be evaluated by happy-dom, so the contrast and distinguishability tests can't see what ships. The popup and options swatches would need a second, JS-side encoding for the validator anyway. |

**Recommendation: Option A.** Keep the floor at 106 and resolve colours in JS. Reasons:
- one implementation serves the page, popup swatches, options preview and the palette-validator test;
- the validator is the main defence against Pitfall 4, and it only works if the shipped values are computable in happy-dom;
- it avoids a store-visible floor bump and an unproven CSS feature;
- ARCHITECTURE's own fallback for `attr()` is the same inline-custom-property technique.

Keep ARCHITECTURE's other styling decisions: semantic slot stamps on rows (never resolved colours, except custom hex), document-level theme and scheme indirection, 0.1.0-literal `var()` fallbacks, and the `background-image` stripe. Keep all hex going through the numeric builder, so a stored string is never emitted verbatim. Raising the floor later is permission-neutral, and should happen only as a recorded decision, for example if Zendesk turns out to set `color-scheme` and `light-dark()` becomes attractive.

### Conflict 2: Persisting the auto-detected identity

- **ARCHITECTURE:** the content script detects the name and sends it to the worker, which persists `identityDetected`. Precedence is override, then live detection, then persisted detection. This is the one deliberate exception to "content tells the extension only finite enums". It survives the worst case, where the name is visible only inside the opened profile menu.
- **PITFALLS:** never persist an auto-detected name. Persist only a name the agent typed or confirmed. Detection runs only when a rule uses "is me", with an in-product notice at opt-in. Keep the name inside the content script by default.
- **FEATURES:** store identity per Zendesk subdomain (E3).
- **ARCHITECTURE and PITFALLS:** one identity, not a per-tenant map, because keying by host stores a list of tenants visited.

**Recommendation (reconciled):**
- Detection is gated: it runs only while at least one enabled rule uses "is me".
- The detected name is **held in memory in the content script** and used there, so "is me" still works with zero setup on any page where detection succeeds.
- The **only persisted identity is `identity.confirmed`** (or `identityOverride`), a name the agent typed or explicitly accepted. When the agent adds their first "is me" condition, the options page shows the notice and asks the open Zendesk tab, on demand through the worker, for the detected name. It displays "Zendesk shows you as X. Use this name?", and confirming stores it.
- The confirmed name then covers later loads, which closes ARCHITECTURE's menu-only worst case without ever storing a scraped value the agent didn't accept.
- Delete `identityDetected` from the key design.
- Use one global identity, not per subdomain. Multi-tenant agents with different names use the override. Document the caveat.
- **Export excludes identity by default, and import never overwrites it** (FEATURES and PITFALLS; ARCHITECTURE had exported `identityOverride`). "Is me" is stored symbolically, so a shared rule pack works for every importer.
- Record the on-demand name hop as an explicit, disclosed exception in `release/disclosures.md`.

### Conflict 3: "Fresh install identical to 0.1.0" against "readable in dark mode"

FEATURES (Finding 7) and PITFALLS agree that 0.1.0 painted the same 0.08–0.14 alphas on both surfaces, and that these are not adequate on Zendesk's dark surface (about `#151A1E`). Text stays legible, but adjacent priorities stop being distinguishable, and the deuteranopia closest pair falls to 0.6. So a dark-mode fix *must* change what a fresh install paints in dark mode. A verifier reading PROJECT.md literally would call that a regression.

**Proposed requirement wording:**
> "In Zendesk's light interface, with no rules and the default theme, a fresh 1.0.0 install, and a 0.1.0 install upgraded to 1.0.0, paints byte-identical tints to 0.1.0 and stores nothing beyond the existing `enabled` key until the agent changes a setting. In Zendesk's dark interface the default (Classic) theme uses the same hues with dark-tuned strengths, so the four priorities stay distinguishable. If Zendesk's mode cannot be determined, Zhroma uses the light values, which is 0.1.0 behaviour."

This also fixes the parity harness's scope: light mode, default settings.

### Conflict 4: Rule logic depth ("full AND/OR logic")

The user chose "full AND/OR logic". The options:

| Option | Source | Shape |
|---|---|---|
| A. Arbitrary nesting | the literal reading of the user's choice | Groups inside groups, to any depth |
| B. Top-level Match ALL / ANY, plus one level of groups, each with its own ALL/ANY | FEATURES (D3), STACK (validator depth ≤ 2) | Airtable-style. Covers Zendesk's own ALL+ANY model directly |
| C. Fixed OR-of-ANDs | PITFALLS | A rule matches if any group matches, and a group matches if all its conditions match |

ARCHITECTURE's validator allowed depth 3 and needs to be aligned with whichever option is chosen.

**Recommendation: Option B, plus the "is any of" operator, with the validator capped at depth 2 and the editor refusing deeper nesting. This needs user confirmation.**
- It loses no expressive power. Any boolean formula over conditions can be written in disjunctive normal form, which B expresses as top-level ANY over ALL groups. Only the shape of deep nesting is lost.
- "Is any of" removes the most common reason a non-technical agent needs OR at all.
- B keeps the one-line rule summary readable, keeps import recursion bounded, and matches what team leads already build in Zendesk.
- Present it to the user as "full AND/OR, expressed as Zendesk-style ALL/ANY with one level of groups". Do not present it as a cut.
- **Keep negation atomic** (`is not`, `does not contain`, `is not empty`), with no NOT-group node. That keeps the missing-column semantics below simple and monotone.

### Conflict 5: Diagnosis and hint when rules are active on a view without Priority

| Option | Source | Behaviour |
|---|---|---|
| A. Keep the toolbar and the three diagnoses Priority-only | ARCHITECTURE | Add an orthogonal finite `ruleHealth` enum (`none`, `ok`, `columns-missing`, `identity-unknown`, `settings-unreadable`, `unknown`), shown as a fixed-copy second line in the popup. The icon may say "Add a Priority column" while rules paint rows |
| B. Rule-aware diagnosis | PITFALLS | With rules, "working" also covers "a rule tinted rows", and the "Add a Priority column" hint shows only when no rule matched *and* Priority is absent |
| C. Redesign the status model | FEATURES (C9) | "View readable / unreadable", plus a list of inactive rules and missing columns |

**Recommendation: Option A, with fixed-copy adjustments. The user should confirm the copy.**
- It leaves the accepted FAIL-01/03/05 behaviour, icons, `TITLES` / `COPY` / validators and message shapes untouched, and so avoids a whole class of re-verification.
- With zero rules everything is identical to 0.1.0.
- In a `missing` view where rules are painting, the popup's second line should say so, for example "Your rules are still colouring this view". An agent then does not read "Add a Priority column" as "Zhroma is broken". The toolbar title stays truthful, because it is about priority tinting.
- `ruleHealth` leaves `unknown` only once the v1 100 ms certainty applies, so a mounting view is never accused of lacking a rule's column.
- No page text (column names) is echoed from the page in 1.0.0. Per-rule "inactive here: needs Group column" belongs to D9 match counts, carried as rule IDs plus enums.

### Other disagreements (smaller; resolved here unless flagged)

| Topic | Positions | Recommendation |
|---|---|---|
| **Missing-column semantics** | ARCHITECTURE: any unresolved column skips the *whole rule*. FEATURES: three-valued Kleene logic, where ANY branches can still match. PITFALLS: the condition is false and flagged | **Kleene logic, which with atomic-only negation equals "unknown counts as not matching" per condition.** "Assignee is me OR Group is Tier 2" still lights "me" rows in a view without Group. All agree a missing column is **never** empty, so `is empty` / `is not X` must not match on an absent column. A present-but-empty cell under `is not X` is true. Flag the rule in rule health. |
| **Replace-rule hiding Urgent** | PITFALLS: guard Urgent or warn. User-confirmed: the first matching replace-rule wins | **Flag for the user.** Recommend an editor warning when a replace-rule can match Urgent rows, with a "use a mark instead" suggestion, and no hard guard, which would contradict the confirmed precedence. |
| **Column-name suggestions (D8)** | FEATURES: the content script records header names in storage. ARCHITECTURE (Anti-pattern 9) and the PITFALLS privacy stance: do not harvest | **Static list of standard Zendesk column names plus free text.** D9 match counts give "found in this view" feedback without storing page data. |
| **Dark-mode probe target** | STACK: table/body background. ARCHITECTURE: `DIV[data-garden-id="pane"]` background. PITFALLS: header text colour, never a Zhroma-painted `td` | Recon decides. Use an element Zhroma never paints (the pane or header text), never a tinted cell. A transparent colour must not read as black. |
| **Stripe technique** | FEATURES: inset `box-shadow`. ARCHITECTURE and PITFALLS: `background-image` | **`background-image` on the first data cell.** It preserves native selection, causes no layout shift and skips the checkbox cell. |
| **Popup theme write** | PITFALLS allows the popup to own the `theme` key. STACK and ARCHITECTURE route it through the worker | **Through the worker.** This keeps the verified popup invariant. |
| **Reorder** | STACK: buttons only. FEATURES: drag and buttons | Buttons are required. Drag is optional polish. |
| **Import undo** | PITFALLS: keep a `previousSettings` key for one-step undo. Others: a confirm preview only | Confirm preview plus a one-step undo stored under one key. It is cheap and reduces "lost my rules" reports. |
| **File layout** | STACK: `extension/lib/*.js`. ARCHITECTURE: flat `zhroma-*.js` | Either works. Pick one in the foundation phase, and add every new file deliberately to `RELEASE_FILES` and the inventory tests. |
| **Colourblind preset hues** | FEATURES: IBM (magenta, orange, gold, ultramarine). STACK: Okabe-Ito (vermillion, orange, sky blue, bluish green). PITFALLS computed Okabe-Ito (vermillion, orange, yellow, blue) | Treat all three as hypotheses. The palette validator (blended, both modes, deuteranopia and protanopia) picks. Order by lightness as well as hue. Consider pairing Urgent with the stripe. |
| **Distinguishability threshold** | STACK: ΔE_OK 0.03–0.05 (that is, 3–5 on the ×100 scale). PITFALLS: closest pair ≥ 0.1.0 light baseline (about 1.9) and tint versus untinted ≥ 3 | Settle in the themes phase on the ×100 scale. The 0.1.0 light baseline is the floor, and Urgent/High must clearly exceed it. |

---

## Implications for Roadmap

Numbering continues from v1.0, which ended at Phase 5. Two constraints shape the order. First, **DOM recon gates every DOM-dependent design**. Second, **each shipped-byte change reopens human checks**, so the full v1 regression UAT runs **once, on the 1.0.0 release-candidate bytes**. Intermediate phases prove themselves with automated suites (Vitest + happy-dom fixtures, Node smoke tests, mutant kills, the parity harness) and dev-only live smoke checks.

### Phase 6: Recon 2 (live DOM for dark mode, identity and rule columns)
**Rationale:** Garden emits no dark-mode DOM signal, the identity location is undocumented, and the v1 fixtures sanitise every non-Priority cell to `TEXT-nnn`. None of these can be settled by desk research. This is v1 Phase 1's equivalent. It is read-only and user-driven on a live tenant with dark mode allowed.
**Delivers:**
- `SELECTORS.md` ledger entries: `dark-mode-signal` (Light / Dark / Match-system with the OS light and dark; `color-scheme` on `html`; classes and attributes on `html`/`body`; pane and header computed colours), `dark-mode-switch-mutation` (class swap, re-mount or reload; whether mutations occur at all), `dark-native-states` (hover, selected, sticky, focus in dark), `dark-table-topology` (the v1 Garden identifiers still hold), `identity-location` (top-bar avatar `alt` / `aria-label`, or profile menu only; lazy or not), `identity-vs-assignee` (record only equal true/false and the kind of difference), `referenced-cell-representation` (Assignee, Requester, Group, Status, Type, Subject, Tags, a date column, one custom dropdown or checkbox: `textContent` shape, `aria-label`-only cells, hidden label spans, empty placeholder such as "-" or "Unassigned", truncation), and `header-label-uniqueness`.
- **A new fixture capture and sanitisation policy:** keep the *element shape* of rule-relevant cells (avatars, `<time>`, badges, hidden spans) while tokenising names, and tokenise the agent's name *consistently* across the header region and the Assignee cells.
- New fixtures, admitted through the existing sanitiser with provenance: a dark-mode table, a sanitised header or identity region, and a multi-column capture with one ticket assigned to the capturing agent.
**Addresses:** the prerequisites for A1–A4, C1/C2/C8 tests and E1.
**Avoids:** Pitfalls 5, 7 and 8 (designing against assumed DOM).
**Parallelism:** it does not block Phase 7 or the data authoring in Phase 8.

### Phase 7: Foundation (invisible; parity-guarded)
**Rationale:** every later phase changes shipped bytes. Without a cheap way to prove "0.1.0 behaviour unchanged", each phase reopens the whole v1 human check set. With defaults, the page must paint exactly as 0.1.0 did, so the parity requirement becomes a regression check at the earliest possible moment.
**Delivers:**
- **The 0.1.0 parity harness** (pinned blobs against the working tree, the three fixtures plus the Phase 3/4 mutation sequences, default settings, light mode: row attributes, diagnoses, computed cell backgrounds).
- The contract-test split into frozen and versioned parts, and the baseline API guard test.
- `tsc --checkJs` adoption (with dependency approvals).
- The shared IIFE namespace pattern.
- The settings schema, validator and `migrate` (per-key versioning, absence means default, no `onInstalled` writes, caps).
- The worker settings queue with revision CAS and tightened sender checks.
- In the content script, `readSettings`, a separate `onSettingsChanged` listener with old-versus-new comparison, and the `settingsReady` gate (a read failure falls back to defaults).
- The manifest `options_ui` stub, and `RELEASE_FILES` / inventory updates.
- `enabled` byte-identical in behaviour.
**Uses:** STACK §4, §5, §10 and ARCHITECTURE §1 and §7.
**Avoids:** Pitfalls 2, 3 and 9.
**Research:** standard patterns. Skip research-phase.

### Phase 8: Palette seam and theme presets
**Rationale:** fills, marks, hex rules, dark mode and the picker all need colours as data. Building rules first would mean inventing a second colour path. Preset *data* for both modes can be authored here from recon-measured surfaces, with the dark values checked offline by the validator. Live dark *detection* follows in Phase 9.
**Delivers:**
- `colour.js` (composite, WCAG, OKLab, `modeAlpha`, the numeric `rgb()` builder).
- Theme data for about eight presets × {light, dark} × eight slots, each block with a licence and source header; derived values labelled (Dracula blue, Nord light and magenta).
- `zhroma.css` refactored to `var(--zhroma-*, <0.1.0 literal>)` with custom properties written through CSSOM (Conflict 1, Option A).
- The **palette-validator test**: contrast ≥ 4.5:1, closest-pair ΔE, Urgent/High separation, tint versus untinted, and Machado CVD simulation of *blended* colours, run as a test helper that does not ship.
- The colourblind preset chosen by the validator.
- The popup theme picker (radio or swatch strip showing rendered tints, set through the worker), live apply through `storage.onChanged`.
- A JS/CSS agreement test.
- Parity still green in light mode.
**Addresses:** B1–B8 and the palette seam.
**Avoids:** Pitfalls 4 and 6 (the emit builder). Also covers theme licensing:
- Tokyo Night values come from the **MIT** VS Code original. If Day values come from `folke/tokyonight.nvim`, include its **Apache-2.0** notice.
- **Gruvbox** has no LICENSE file; its README says MIT/X11 and one secondary source says CC-BY-3.0. Decide whether attribution is enough, use `gruvbox-community`, or drop it.
- Okabe-Ito has no formal licence text.
- No Dracula PRO colours.
- Use names only, with no logos and no implied endorsement.

### Phase 9: Dark-mode detection and live switching
**Rationale:** depends entirely on the branch Phase 6 found: (a) a stable marker, keyed in CSS or JS directly; (b) a luminance probe on the pane or header text with a narrow `html`/`body` observer plus `matchMedia`, `visibilitychange` and `pageshow` re-detect triggers plus an end-of-pass safety net; or (c) nothing, which defaults to light.
**Delivers:**
- The scheme detector, with the scheme decided **before the first positive commit** (no flash of the wrong variant).
- The mid-session switch with no rule re-evaluation.
- The pause and off paths clear every document-level attribute and property.
- A dark fixture suite.
- The **new dark-mode row-state human checklist** for every preset (hover, hover-while-tinted, select one or all, focus, unread), run on dev bytes and re-confirmed in the Phase 13 release candidate.
**Addresses:** A1–A4 and B4.
**Avoids:** Pitfall 5. No `class` in `INTERPRETATION_ATTRIBUTES`, no `prefers-color-scheme` as the source of truth, and no reading page `localStorage`.
**Consolidation option:** if re-acceptance cost bites, merge Phases 8 and 9. `content.js` changes then come in fewer reviewed steps.

### Phase 10: Rule engine and effects (no editor UI)
**Rationale:** the editor must describe semantics that already exist and are tested. The engine is fully testable by seeding storage.
**Delivers:**
- The rule module (compile, bind, evaluate, health) and the additive `headers[]` / `rows[]` snapshot fields.
- The **operator truth table** in REQUIREMENTS and tests: missing column is unknown; present-empty under `is not X` is true; `is empty` is empty or a recon-confirmed placeholder; group rows are skipped; duplicate headers are ambiguous; date-like columns get only `is empty` / `is not empty`.
- "Is any of".
- Symbolic `{me}` resolved from a confirmed or override name only. In-memory detection arrives in Phase 12.
- Two first-match channels (fill and mark).
- Rule stamps with parallel ownership, registered in the expected-marker map, with a no-self-retrigger test.
- Fill and mark CSS, with the precedence test (fill must beat the priority tint on specificity).
- The `ruleHealth` enum, relay and popup second line (Conflict 5).
- Performance: zero-rule median about 1.3 ms with an early exit, plus a stated worst-case budget (for example 50 rules × 10 conditions × 30 rows) in the existing harness.
**Addresses:** C1–C12 and C13.
**Avoids:** Pitfalls 2 and 8, and Anti-patterns 1, 2 and 8 in ARCHITECTURE.

### Phase 11: Options page, rule editor and export/import
**Rationale:** it depends on the Phase 7 schema and the Phase 10 semantics. Nested-group editing is the milestone's biggest UX risk.
**Delivers:**
- `options.html` / `options.js` (`<template>` + `textContent`, zero `innerHTML`).
- A sentence-style rule list with a first-match explainer.
- The ALL/ANY + one-group-level editor (Conflict 4, pending the user's confirmation).
- Up/down reorder, enable/disable, delete with undo.
- A slot-swatch picker with a "Custom…" hex field and a contrast warning on either surface.
- A replace-can-hide-Urgent warning (if the user agrees).
- A standard column-name list plus free text.
- **D9 live match counts** pushed from the content script through the worker.
- An identity override field with the standing notice.
- Export (Blob, identity excluded, `zhroma-settings-YYYY-MM-DD.json`).
- Import: ≤ 256 KB, parse, strict whole-document validation, confirm dialog, one `set`, one-step undo.
- A hostile-import suite, and "Reset to defaults" (delete the new keys).
- The popup "Edit rules…" link.
**Addresses:** D1–D9, F2–F6 and E2.
**Research:** **run `/gsd-ui-phase` (UI-SPEC) and sketch first.**

### Phase 12: Identity detection and "is me" (opt-in)
**Rationale:** it has the most uncertain recon and is one operand. Everything else ships without it, and the override works without detection. The opt-in design must be fixed before the code, because it decides where detection runs.
**Delivers:**
- The identity detector from the single designated source, returning exactly one clean candidate or nothing, gated on an enabled "is me" rule, held in memory in the content script, and self-stopping.
- Normalisation (NFC, NBSP to space, whitespace collapse, `toLowerCase()`, exact comparison, no substring).
- The on-demand "Zendesk shows you as X. Use this name?" confirmation from the options page through the worker (Conflict 2).
- The `identity-unknown` health state and the visible unknown state in the editor.
- An `ISOLATED`-world assertion and a no-`fetch`/`XMLHttpRequest` test.
**Addresses:** E1–E4 (E3 per-subdomain dropped; see Conflict 2) and C3.
**Avoids:** Pitfalls 1 and 7.

### Phase 13: Release 1.0.0
**Rationale:** release is a real phase with store-policy exposure, not a footnote.
**Delivers:**
- Version `1.0.0`, and a revised manifest `description` (≤ 132 characters).
- **Policy first.** Rewrite `release/privacy/index.html`, so that it is true for both 0.1.0 and 1.0.0 users during rollout ("From version 1.0.0 …"), then `release/listing.md` (remove "stores exactly one thing" and "Dark mode is not supported"; name at most five brands), `release/disclosures.md` (source-fact rows plus the identity exception) and the dashboard Privacy tab (read the live category labels; likely add PII; update the single purpose and the `storage` justification).
- Publish the policy and repeat the anonymous-HTTPS byte-match (`policy-publication.json`).
- Submit with **deferred publishing**, never automatic publication, and publish the item only after the policy is verified.
- Update `release/policy-applicability.md` with dated notes. Update the reviewer instructions for the options page (still credential-free).
- New real, sanitised screenshots, including a rule and a dark view.
- A **ready 1.0.1 rollback build** (the 0.1.0 runtime with the version bumped; 0.1.0 ignores the new keys).
- **Full v1 regression UAT plus v1.1 UAT on the release-candidate bytes**, including the dark row-state checklist, race tests, a DevTools Network check that shows no requests, and a manifest check that `permissions` is exactly `["storage"]`.
- Budget review time for "significant code changes". There is no store rollback, and a rejected update leaves 0.1.0 live.
**Avoids:** Pitfalls 1 and 9, and the moderate release pitfalls.

### Phase Ordering Rationale

- **Recon (6) runs in parallel with Foundation (7)** because neither depends on the other. Phases 9, 10 (normalisation and placeholders) and 12 all consume recon output.
- **Foundation before any feature** because the parity harness and contract split make every later byte change cheap to re-close.
- **Themes (8) before rules (10)** because fills and marks need the var seam, the slot vocabulary and the validated emit builder.
- **Engine (10) before editor (11)** so the UI describes tested semantics.
- **Identity (12) after the editor** because its opt-in flow lives in the options page, and "is me" is one operand on an existing engine.
- **One release-candidate UAT (13)** instead of per-phase human re-verification.
- `content.js` is touched in Phases 7, 8, 9, 10 and 12. If re-acceptance cost bites, merge 8 into 9, and 12 into 10 or 11, so the accepted file changes in fewer reviewed steps.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 6:** this *is* the research. It is a live, user-driven session, and it blocks the designs of Phases 9, 10 and 12.
- **Phase 9:** the plan depends on the recon branch (marker, luminance or none) and on dark native-state values.
- **Phase 12:** depends on the identity recon worst case (a name visible only in the profile menu) and on Chrome disclosure wording for the opt-in notice.
- **Phase 13:** needs a live dashboard reading of the exact data-category labels. The consent-applicability question can only be answered by Google, not by more reading.
- **Phase 8 (light):** validator thresholds and CVD tooling choice, and a decision on the Gruvbox licence.
- **Phase 10 (light):** empty placeholders, hidden accessibility text, and date and tag rendering from recon.
- **Phase 11:** run `/gsd-ui-phase` for a UI-SPEC and sketch. This is UX design rather than external research.

Phases with standard patterns (skip research-phase):
- **Phase 7:** established patterns already present in the repo (worker single writer, generation counters, agreement tests, inventory tests).

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH (MEDIUM on long-term tooling ergonomics) | Chrome APIs, quotas and permission warnings were checked against developer.chrome.com. Versions and licences were read from the npm registry and GitHub licence API on 2026-09-25. The "no bundler" override is well argued, but it is an opinion about future maintenance. |
| Features | MEDIUM | Precedence, stripe and ALL/ANY patterns are cross-verified across five or more products and Zendesk's own docs. Palette hex values come from official specs. Every rendered-DOM dependency (dark signal, identity, cell shapes) is LOW. |
| Architecture | HIGH on integration shape, LOW on new DOM facts | It is derived from the shipped code, the v1 selector ledger and the Garden `react-theming@9.16.1` source (which proves there is no DOM dark signal). The dark, identity and cell facts await Phase 6. |
| Pitfalls | MEDIUM | Chrome policy text is first-party and quoted verbatim, though tiered LOW by the single-fetch seam. The blend and CVD numbers are a local computation that assumes Zendesk's colours (`#151A1E` / `#D8DCDE` from one 2025 secondary source, and `#2F3941` light text assumed). They are relative guidance, not acceptance evidence. |

**Overall confidence:** MEDIUM. It becomes MEDIUM-HIGH once Phase 6 recon lands.

### Gaps to Address

- **Zendesk dark-mode signal and switch mechanics (LOW, blocking Phase 9):** resolve in Phase 6. The fallback design (luminance probe, fail to light) is already safe.
- **Identity location and equality with the Assignee text (LOW, blocking detection):** resolve in Phase 6. The override path works regardless.
- **Non-Priority cell rendering, empty placeholders and `aria-label`-only cells (LOW, blocking the truth-table tests):** Phase 6, plus the new sanitiser policy.
- **Dark surface and text colours:** single secondary source. Measure them in Phase 6 before tuning alphas.
- **Zendesk page CSP versus `<style>` / `adoptedStyleSheets` injection (LOW):** avoided by the CSSOM approach. Only matters if a later design wants generated CSS.
- **Whether an extension page can find the Zendesk tab without `tabs` (LOW):** design D9 and the identity confirmation as push or relay through the worker and content script only. Verify during Phase 7 or 11 planning.
- **Gruvbox licence (MEDIUM) and Okabe-Ito usage terms (LOW-MEDIUM):** decide in Phase 8.
- **Dashboard data-category labels and the consent-applicability question:** Phase 13, read live.
- **Requirement decisions pending user input:** Conflict 4 (logic depth), Conflict 5 copy, the replace-hides-Urgent warning, and the English-gate inheritance for rules (recommend recording "rules follow the English-only gate in 1.0.0").
- **Research-store note:** two docs-kind cache writes failed on a sandbox EPERM. This does not affect the findings.

---

## Sources

### Primary (HIGH confidence)
- Shipped code: `extension/content.js`, `background.js`, `popup.*`, `zhroma.css`, `manifest.json`; `test/extension/runtime-contract.test.js`; `scripts/release-source.js`; `test/fixtures/*.html`; `SELECTORS.md`; `release/*` (privacy policy, listing, disclosures, policy applicability, publishing status); v1.0 phase verification files (1.3–1.4 ms medians)
- `@zendeskgarden/react-theming@9.16.1` tarball: `ThemeProvider` and `ColorSchemeProvider` set no DOM attribute; `localStorage['color-scheme']`; `matchMedia` only in system mode
- npm registry and GitHub licence API, 2026-09-25: package versions; Catppuccin, Dracula, Nord, Rosé Pine, Solarized, One Dark/Light and Tokyo Night (original) MIT; `folke/tokyonight.nvim` Apache-2.0; `morhetz/gruvbox` no licence file; `apca-w3` "Limited W3 License"
- developer.chrome.com: options page, `chrome.storage` (quotas, content-script exposure, no atomicity statement), content scripts, `attr()` upgrade (Chrome 133)

### Secondary (MEDIUM confidence)
- Chrome Web Store Program Policies (2025-05-22), Disclosure Requirements, User Data FAQ (Q3, Q4, Q10, Q14), Permission Warnings, Permissions list, Update your item (deferred publishing, staged rollout above 10k), Review process, MV3 requirements, Spam FAQ (at most five brands). Quoted verbatim, seam tier LOW for single fetches
- Zendesk help and developer docs: dark mode (Light / Dark / Match-system, admin toggle, conversation override), ZAF `colorScheme` (apps only), views and "meet all / meet any", "current user"
- Comparable products: Airtable record colouring, Notion conditional colour, Jira card colours, Google Sheets and Outlook conditional formatting, Linear filters, Zest
- Palette specs: catppuccin.com, draculatheme.com/spec (Alucard), nordtheme.com (no official light variant), Tokyo Night, Gruvbox, Solarized, Okabe-Ito, IBM colour-blind-safe palette, Paul Tol
- Chromium issues 40114753 / 114898 (popup closes under the file chooser); crxjs issues #811 and #1119

### Tertiary (LOW confidence)
- internalnote.com/zendesk-dark-mode (2025-03-24): dark surface `#151A1E`, text `#D8DCDE`. Single source, measure live
- A community report that Match-system with the OS set to "auto" stays dark
- Filter-builder UX practitioner articles (Smart Interface Design Patterns, Pencil & Paper, SaaS UI)
- Local blend, contrast, OKLab and Machado-2009 CVD computation (PITFALLS.md "Local computation"). Assumption-dependent guidance for validator design

---
*Research completed: 2026-09-25*
*Ready for roadmap: yes, after the user settles Conflicts 4 and 5 and the replace-hides-Urgent question in requirements*
