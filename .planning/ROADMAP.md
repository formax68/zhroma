# Roadmap: Zhroma

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-09-14, closed 2026-09-25 with known gaps) — [archive](milestones/v1.0-ROADMAP.md) · [requirements](milestones/v1.0-REQUIREMENTS.md)
- 🚧 **v1.1 Themes & Rules** — Phases 6-11 (in progress; ships to the Chrome Web Store as extension 1.0.0)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-5) — SHIPPED 2026-09-14</summary>

- [x] Phase 1: DOM Recon Spike (15/15 plans) — completed 2026-09-08
- [x] Phase 2: First Tint on a Real View (3/3 plans) — completed 2026-09-09
- [~] Phase 3: The Tint Survives Everything (3/4 plans; 03-04 halted) — verification `human_needed`, 11/20 live checks passed
- [~] Phase 4: Honest Failure and an Off Switch (20/20 plans) — verification `human_needed`, 14/17 live checks passed
- [~] Phase 5: Published (3/7 plans in GSD; 05-04 to 05-07 finished outside GSD) — 0.1.0 submitted 2026-09-14, reported live 2026-09-25

</details>

### 🚧 v1.1 Themes & Rules (In Progress)

**Milestone Goal:** An agent can pick a well-known colour theme that reads correctly in both Zendesk light and dark mode, and can write their own colouring rules on any column shown in the view. A fresh install still looks and behaves exactly like 0.1.0, with nothing to set up.

- [ ] **Phase 6: Live DOM Recon 2** - Record, from a live account, how Zendesk signals dark mode, where the agent's name renders and how rule-relevant columns render (read-only, user-driven)
- [ ] **Phase 7: Upgrade-Safe Foundation** - Add the settings layer and a 0.1.0 parity harness, so an upgraded or fresh install stays exactly 0.1.0 until the agent changes something
- [ ] **Phase 8: Themes That Follow Dark Mode** - Add a popup theme picker with eight validated presets whose tints follow Zendesk's light/dark mode live
- [ ] **Phase 9: Colouring Rules** - Colour or stripe rows from saved ordered rules on any shown column, through every re-render, with rule status in the popup
- [ ] **Phase 10: Rule Editor, "Is Me" and Settings Files** - Add an options page to write, order and test rules, confirm-once identity for "is me", and local export/import/reset
- [ ] **Phase 11: Release 1.0.0** - Update the policy and disclosures first, run the full regression on release-candidate bytes, then publish 1.0.0 with deferred publishing

**Execution order:** Phases 6 and 7 don't depend on each other. They can run in either order or side by side. Then 8 → 9 → 10 → 11.

**Consolidation for coarse granularity (trade-off chosen):** Research proposed eight phases (6-13). This roadmap uses six:

- **Palette seam + presets + picker, merged with dark-mode detection (research 8 + 9 → Phase 8).** Colour delivery and mode detection land in `content.js` as one reviewed change instead of two. The cost: Phase 8 can't start until recon (Phase 6) has measured the dark surface and signal, so preset authoring can't start early.
- **Identity folded into the options-page phase (research 11 + 12 → Phase 10).** The confirm-once flow lives on the options page. Live match counts (EDIT-08) already need a `content.js` change in that phase, so adding the identity detector costs no extra reviewed step. The cost: Phase 10 is the largest phase (22 requirements) and carries the most uncertain recon (where the name renders).
- **Kept separate on purpose:** Recon (6) and Foundation (7) stay apart. They are independent, and splitting them lets foundation work proceed while the user-driven live session is scheduled. Engine (9) and editor (10) stay apart so the UI describes semantics that are already tested.
- **Net effect:** `content.js` changes in four reviewed steps (7, 8, 9, 10) instead of five. Intermediate phases prove themselves with automated suites (the parity harness, Vitest + happy-dom fixtures, the v1 mutants, Node smoke tests) and dev-only live smoke checks. The full v1 regression UAT runs once, on the 1.0.0 release-candidate bytes (Phase 11).

## Phase Details

### Phase 6: Live DOM Recon 2

**Goal**: The DOM facts that dark mode, rules and "is me" depend on are known from a live Zendesk account, not assumed
**Depends on**: Nothing in v1.1 (uses the v1.0 sanitiser and fixture-admission pipeline). Independent of Phase 7
**Requirements**: RECON-04, RECON-05, RECON-06
**Success Criteria** (what must be TRUE):

  1. The selector ledger records, with live evidence, how Zendesk presents Light, Dark and Match system (with the OS in both light and dark). It also records what the DOM does when the agent switches mid-session: class or attribute swap, re-mount, reload, or no mutation at all
  2. The ledger records where the signed-in agent's name renders (top-bar avatar label, profile menu only, lazily or not) and whether it equals the Assignee column text for a ticket assigned to them. Only equal true/false and the kind of difference are kept, never the name
  3. Sanitised fixtures are admitted with provenance. They show the rendered shape of Assignee, Requester, Group, Status, Type, Subject, Tags, a date column and a custom field, including empty placeholders and hidden or `aria-label`-only text, with the agent's name tokenised consistently across the header region and the Assignee cells
     - Tags note (D-26, decided 2026-09-25): Zendesk views very likely cannot show Tags as a column; the live session checks the view's column picker, and a live-confirmed `tags-column: not-offered` in `referenced-cell-representation`, with its fallback (Tags rules resolve no header, so RULE-07 keeps them inactive, and RULE-F2 stays deferred), meets this criterion for Tags and does not block the phase.
  4. A dark-mode table fixture confirms that the v1 Garden table identifiers still hold in dark mode. It also records the measured dark surface and text colours and the native hover, selection and focus appearance that later palette tuning depends on

**Plans**: 3/3 plans executed
Plans:
**Wave 1**

- [x] 06-01-PLAN.md — Rule-columns sanitiser mode (kind tokens, reserved self token, identity-region boundary) and the recon2Fixtures manifest validator, with the v1 corpus unchanged

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 06-02-PLAN.md — Recon 2 ledger gate and `recon2` CLI mode, the registered Recon 2 block in SELECTORS.md, the one-sitting run sheet, and the Tags-column notes

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 06-03-PLAN.md — The user-driven live session, fixture admission and the Recon 2 verdict (run inline in the main checkout)

**Cross-cutting constraints:**

- D-22: no file under extension/ or test/extension/ changes.

**Research**: Needed. This phase *is* the research. It is a live, user-driven, read-only session on a tenant where dark mode is allowed

### Phase 7: Upgrade-Safe Foundation

**Goal**: The 1.0.0 codebase can carry new settings, while an agent upgrading from 0.1.0 or installing fresh sees and keeps exactly what 0.1.0 gave them
**Depends on**: Nothing in v1.1 (builds on shipped 0.1.0). Independent of Phase 6
**Requirements**: COMPAT-01, COMPAT-02, COMPAT-03, COMPAT-04, DATA-01
**Success Criteria** (what must be TRUE):

  1. In Zendesk's light interface, with default settings, the working tree paints the same row attributes, diagnoses and computed cell backgrounds as the pinned 0.1.0 blobs. This covers the three fixtures and the Phase 3/4 mutation sequences, and is proven by a differential parity harness that stays green in every later phase
  2. An install upgraded from 0.1.0 keeps its off/on setting. `chrome.storage` holds nothing beyond `enabled` until the agent changes a setting, and there are no `onInstalled` writes
  3. The update shows no permission prompt. The manifest requests exactly `storage`, with no `host_permissions` and the same match pattern. A frozen contract test, separate from the versioned v1.0 pins, enforces this
  4. With default settings, priority detection, liveness through sort, refresh, view switch, pagination and scroll, the three-way diagnosis and the off/on switch all behave as in 0.1.0. The existing suites pass, the v1 mutants still die, and the zero-rule timing median stays at about 1.3 ms
  5. Any setting written through the new worker settings queue lands only in `chrome.storage.local`. The sync area stays empty, and the extension makes no network request

**Plans**: 7 plans
Plans:
**Wave 1**

- [ ] 07-01-PLAN.md — 0.1.0 parity harness from pinned 6d3ab0b blobs, and the contract split into frozen invariants and versioned v1.0 pins (test-only)
- [ ] 07-02-PLAN.md — Separate exact-version approvals, then install of typescript and @types/chrome (blocking-human legitimacy gate)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 07-03-PLAN.md — Shared `Zhroma` namespace and settings module (theme key, validators, versions, migrate hook, size caps), the options stub, and the packaged-shape pins restated once

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 07-04-PLAN.md — Worker settings queue (single writer, serial, cas option, write only on real change, local only) and D-17 sender checks

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 07-05-PLAN.md — Content settings reader, bounded `settingsReady` gate and change listener, the D-14 end-to-end theme path, and COMPAT-02/DATA-01 upgrade proofs

**Wave 5** *(blocked on Wave 4 completion)*

- [ ] 07-06-PLAN.md — Blocking dev-only `tsc --noEmit --checkJs` inside `test:recon`, with the v1 inclusion record

**Wave 6** *(blocked on Wave 5 completion)*

- [ ] 07-07-PLAN.md — Same-session timing against 0.1.0 and the full mutation run (52 mutants) on the final bytes
**Research**: Standard patterns (single-writer worker queue, generation counters, agreement and inventory tests already exist in the repo). Skip research-phase
**Notes**: The contract-test split into frozen and versioned parts happens in its own commit, never with feature code. The `options_ui` manifest stub, shared IIFE namespace, settings schema/validator (absence means default) and `tsc --checkJs` adoption (with dependency approvals) land here

### Phase 8: Themes That Follow Dark Mode

**Goal**: An agent can pick a theme in the popup, and its tints read correctly in both Zendesk light and dark mode, following a switch mid-session without a reload
**Depends on**: Phase 6 (dark-mode signal, switch mechanics, measured dark surface and native states), Phase 7 (settings layer, parity harness)
**Requirements**: DARK-01, DARK-02, DARK-03, DARK-04, DARK-05, THEME-01, THEME-02, THEME-03, THEME-04, THEME-05, THEME-06, THEME-07
**Success Criteria** (what must be TRUE):

  1. An agent picks a preset in the popup (Classic, Catppuccin, Tokyo Night, Dracula, Nord, Gruvbox, Solarized or the colourblind-safe preset) and the open view re-colours immediately without a reload. The choice survives a browser restart. Classic stays the default and still paints 0.1.0's light colours
  2. The picker shows each theme's actual rendered tints, light and dark side by side. Every theme defines the same eight named slots in both modes and maps the four priorities onto them. Each theme credits its source and licence, and the Gruvbox licence decision is recorded
  3. Tints follow the agent's Zendesk appearance setting (Light, Dark, Match system), not the OS on its own. Switching mid-session swaps to the matching variant without a reload and without a flash of the wrong variant. When the mode can't be determined, tints use the light variant
  4. In dark mode, the four priority tints stay distinguishable from each other and from untinted rows, ticket text contrast stays at 4.5:1 or above, and Zendesk's native hover, selection and focus stay visible on tinted rows
  5. A palette-validator test gates every preset in both modes, and a preset that fails does not ship. The colourblind-safe preset keeps the four priorities distinguishable under simulated deuteranopia and protanopia in both modes, with lightness ordered by priority

**Plans**: TBD
**Research**: Needed. The detector design depends on which branch recon found (a stable marker, a luminance probe, or nothing). Validator thresholds (ΔE ×100, with the 0.1.0 light baseline as the floor) and the CVD tooling choice are settled here
**Notes**: Colours are resolved in JavaScript and written as CSS custom properties with 0.1.0-literal fallbacks. `minimum_chrome_version` stays 106. Theme or scheme changes flip document-level properties only and never re-evaluate rows. `prefers-color-scheme` is at most a re-detect trigger, never the source of truth. The dark-mode row-state human checklist for every preset runs on dev bytes here and again on the release candidate in Phase 11
**UI hint**: yes

### Phase 9: Colouring Rules

**Goal**: Saved colouring rules colour or stripe rows based on any column shown in the view, alongside priority tints, through every re-render Zendesk performs
**Depends on**: Phase 8 (colour slots, numeric colour emit builder, custom-property seam), Phase 6 (cell shapes and empty placeholders for the truth table)
**Requirements**: RULE-01, RULE-02, RULE-03, RULE-04, RULE-05, RULE-06, RULE-07, RULE-08, RULE-09, RULE-10, RULE-11, RULE-12, RULE-13, RULE-14, RULE-15
**Success Criteria** (what must be TRUE):

  1. With rules saved in settings (for example "Group is Tier 2 → blue", "Status is Pending → no colour", "Tags contains vip → stripe"), matching rows show the rule's colour, lose their tint or gain a left-edge stripe with the priority tint kept underneath. Rules apply in order: the first matching tint rule sets the tint, falling back to priority, and the first matching stripe rule sets the stripe. A slot colour re-colours when the theme changes; a custom hex does not
  2. Conditions using is, is not, contains, does not contain, is empty, is not empty and is any of, combined with Match ALL/ANY and one level of groups, match exactly as the recorded truth table says. A condition on a column not in the view never matches and is never treated as empty. A duplicate header makes its conditions inactive. Group rows are never coloured
  3. Rule colours and stripes survive sorting, refreshing, view switching, pagination and scrolling just like priority tints. The stripe never hides Zendesk's selection indicator and never shifts layout. Rules apply only on views 0.1.0 supports, and switching Zhroma off removes rule colours and stripes too
  4. With zero rules, the view costs the same as 0.1.0. With rules active, a large view stays within the stated worst-case budget (for example 50 rules × 10 conditions × 30 rows) in the existing timing harness
  5. The popup lists the rules active on the current view, with their colours. The toolbar keeps exactly the three v1 states, and on a view with no Priority column where rules are colouring, the popup says so (e.g. "Your rules are still colouring this view")

**Plans**: TBD
**Research**: Light. Empty placeholders, hidden accessibility text, and date and tag rendering come from Phase 6 recon
**Notes**: Rules have no editor until Phase 10. Verification seeds settings directly. Rules run inside the existing inspect-then-commit pass and inherit the English-only gate. There is no Urgent guard: the first matching tint rule wins, even on an Urgent row. Rule stamps get their own ownership set and are registered so they neither self-retrigger nor silently vanish. The stripe uses `background-image` on the first data cell, never `box-shadow` or `border`
**UI hint**: yes

### Phase 10: Rule Editor, "Is Me" and Settings Files

**Goal**: An agent can write, order, test and share their own rules from an options page, including "assigned to me", without anything leaving the device
**Depends on**: Phase 9 (tested rule semantics and rule-status relay), Phase 7 (settings schema/validator and worker queue), Phase 6 (identity location)
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06, EDIT-07, EDIT-08, EDIT-09, EDIT-10, IDENT-01, IDENT-02, IDENT-03, IDENT-04, IDENT-05, IDENT-06, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, DATA-07
**Success Criteria** (what must be TRUE):

  1. From the popup, "Edit rules…" opens an options page. There the agent can create, edit, delete (with undo), turn rules on and off, and reorder them with up/down buttons and drag-and-drop. Each rule reads as a one-line sentence, and the list explains that the first matching rule wins. The column field offers standard Zendesk column names and accepts free text. The colour picker shows the theme's eight slots plus "Custom…", and warns when a custom colour is hard to read on either surface
  2. Each rule shows its live match count in the open Zendesk view, or why it is inactive there (e.g. "needs a Group column"). Saved changes take effect in open Zendesk tabs without a reload. Conflicting edits from two windows fail visibly instead of silently losing one. Starter rules such as "Assigned to me" can be added in one click, and none is enabled on install
  3. When the agent adds their first "is me" condition, the options page shows a notice and offers the detected name ("Zendesk shows you as X. Use this name?"). Confirming stores it, and a typed name can replace it at any time and always wins. A detected name is never saved without confirmation. "Is me" is stored symbolically, so a shared rule works for whoever imports it
  4. When no name is known, "is me" never matches, and both the editor and the popup say identity is unknown. "Is me" matches only the exact name, never part of one. Detection runs only while an enabled rule uses "is me"
  5. The agent can export rules and theme to a JSON file that never contains their name. They can import a file with a preview, choosing to replace their rules or add to them, and the import never changes the stored name. An invalid, oversized or malicious file is rejected with a clear message and changes nothing. The agent can undo the most recent import in one step, and can reset all settings to defaults

**Plans**: TBD
**Research**: Needed for identity. It depends on the recon worst case (a name visible only in the profile menu) and on Chrome disclosure wording for the opt-in notice. Run `/gsd-ui-phase` (UI-SPEC) and sketch the editor first, since nested ALL/ANY group editing is the milestone's biggest UX risk
**Notes**: Rule logic is Match ALL/ANY with one level of groups. Negation stays inside single conditions, and the validator caps depth at 2. There is one global identity. The name hop from the tab to the options page goes through the worker on demand and is recorded as a disclosed exception. The options page reads storage directly and writes only via the worker, with sender checks tightened for the options page. The page uses `<template>` and `textContent` only (zero `innerHTML`), and a hostile-import suite covers malformed JSON, `__proto__`, oversize files, `url(` and HTML
**UI hint**: yes

### Phase 11: Release 1.0.0

**Goal**: 1.0.0 is live on the Chrome Web Store as an update to the existing listing, and the policy and disclosures described what it stores before any user received it
**Depends on**: Phase 10
**Requirements**: STORE-07, STORE-08, STORE-09, STORE-10, STORE-11
**Success Criteria** (what must be TRUE):

  1. The privacy policy, store listing and dashboard privacy disclosures describe the settings 1.0.0 stores locally, including the agent's name, and no longer say Zhroma stores "exactly one thing". The updated policy is live and byte-verified over anonymous HTTPS before the item is published
  2. The smoke checklist, extended with dark-mode and rule checks (including the dark row-state checklist for every preset), and a full v1 regression pass both run on the release-candidate bytes before submission. A DevTools Network check shows no requests, and the manifest shows `permissions` exactly `["storage"]`
  3. The listing screenshots show a real, sanitised rule-coloured view and a dark-mode view
  4. A rollback build (0.1.0 behaviour with a bumped version) is packaged and ready before 1.0.0 publishes
  5. 1.0.0 is submitted as an update to item `iaachnhcjjfcgkaohcafodoockhdmdbf` with deferred publishing, and is published only after the updated policy is confirmed live

**Plans**: TBD
**Research**: Needed. The live dashboard data-category labels must be read in place. `release/policy-applicability.md` gets dated notes. The consent-applicability question can only be answered by Google
**Notes**: Order is fixed: policy, listing and disclosures are updated and verified live first, then the item is submitted and published with deferred publishing (STORE-07 before STORE-08). The listing names at most five theme brands. There is no store rollback, and a rejected update leaves 0.1.0 live

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. DOM Recon Spike | v1.0 | 15/15 | Complete | 2026-09-08 |
| 2. First Tint on a Real View | v1.0 | 3/3 | Complete | 2026-09-09 |
| 3. The Tint Survives Everything | v1.0 | 3/4 | Shipped; human_needed | 2026-09-14 |
| 4. Honest Failure and an Off Switch | v1.0 | 20/20 | Shipped; human_needed | 2026-09-14 |
| 5. Published | v1.0 | 3/7 | Shipped outside GSD | 2026-09-14 |
| 6. Live DOM Recon 2 | v1.1 | 3/3 | In Progress|  |
| 7. Upgrade-Safe Foundation | v1.1 | 0/TBD | Not started | - |
| 8. Themes That Follow Dark Mode | v1.1 | 0/TBD | Not started | - |
| 9. Colouring Rules | v1.1 | 0/TBD | Not started | - |
| 10. Rule Editor, "Is Me" and Settings Files | v1.1 | 0/TBD | Not started | - |
| 11. Release 1.0.0 | v1.1 | 0/TBD | Not started | - |

Known gaps carried out of v1.0 are listed in [MILESTONES.md](MILESTONES.md) and in the STATE.md Deferred Items section.

## Standing constraints

- **The permission set is frozen.** Any change to the manifest's permission surface triggers extended review on every later update. Currently: `storage` only, no `host_permissions`, matches `https://*.zendesk.com/agent/*` only.
- **Route detection is an anti-requirement.** A view switch is already a large DOM mutation that the observer handles. Do not plan history patching, `webNavigation` or a Navigation API path.
- **No build step, no bundler.** Hand-written files, zipped. Shipped bytes equal repo bytes.
- **Evidence binds to bytes.** Any shipped-byte change invalidates live observations taken on the old bytes. Tests read `.planning/phases/**` and `.planning/milestones/v1.0-REQUIREMENTS.md`, so do not move either without updating the tests.
- **v1.1 verification strategy.** Phases 7-10 prove themselves with automated suites and dev-only live smoke checks. The full v1 regression UAT plus v1.1 UAT runs once, on the 1.0.0 release-candidate bytes (Phase 11, STORE-11).
- **Defaults reproduce 0.1.0.** With the default theme and no rules, light-mode tints are identical to 0.1.0 and nothing new is stored. The 0.1.0 parity harness from Phase 7 must stay green in every later phase.

---
*Roadmap created: 2026-09-02 · v1.0 archived: 2026-09-25 · v1.1 phases added: 2026-09-25*
