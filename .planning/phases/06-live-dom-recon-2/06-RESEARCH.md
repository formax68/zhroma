# Phase 6: Live DOM Recon 2 - Research

**Researched:** 2026-09-25
**Domain:** Repository evidence tooling (fixture sanitiser, ledger gate, fixture manifest) plus the run sheet for a user-driven, read-only live Zendesk session
**Confidence:** HIGH for the repository seams (every claim was read this session); MEDIUM/LOW for Zendesk facts (they are what the live session exists to settle)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

The user asked for sensible defaults on every area ("sensible defaults are fine for the above"). The decisions below are Claude's recommended defaults, accepted by the user as a group. Phase 1's decisions D-01 to D-16 (`.planning/phases/01-dom-recon-spike/01-CONTEXT.md`) carry forward unless one below narrows them.

#### Session and tenant setup
- **D-01:** Run one live session from a written run sheet the user can get through in one sitting (aim for about an hour). The order is:
  1. Preconditions.
  2. Light-mode column and identity capture.
  3. Dark-mode matrix and switch observation.
  4. Dark native states and the dark table capture.
  5. Restore the original settings.

  If the session is interrupted, a handoff record in `SELECTORS.md` (like Phase 1's "Authenticated Interaction Handoff") states exactly where to resume. This follows retrospective lesson 1: UAT that isn't sized for one sitting gets skipped.
- **D-02:** The session starts with three user-checked preconditions:
  - (a) Zendesk offers them Appearance (Light / Dark / Match system) on this tenant.
  - (b) They can create a personal, unshared view.
  - (c) At least one existing ticket already assigned to them will show in that view.

  If (a) fails, the dark-mode entries end as blocked and Phase 8 cannot start. No one changes admin settings on the operational tenant without a separate, explicit decision from the user. Recon never uses the OS `prefers-color-scheme` as a stand-in for a Zendesk signal. If (c) fails, stop and ask the user. A ticket is never reassigned, created or edited to make one.
- **D-03:** The user performs every click, menu opening, settings change (Zendesk appearance, OS appearance, Zhroma's switch), view creation and deletion, hover, row selection and Tab press. Claude only runs read-only JavaScript evaluations in the user's own logged-in Chrome tab, through Claude in Chrome. If that isn't connected, Claude hands the user probes to paste into DevTools. Claude never clicks, types, sends keys or navigates in the Zendesk tab (see Phase 1's Execution Safety Note in `SELECTORS.md`). Temporary page-local markers (`data-zhroma-probe`) and temporary observers are allowed. They are removed at the end or vanish on reload.
- **D-04:** Probe return values enter the conversation transcript, so a probe may return only:
  - structure: tag names, `data-garden-id` / `data-test-id` values, attribute *names*, counts and booleans;
  - computed colours and style values, and difference kinds;
  - Zendesk's own UI vocabulary from an explicit allowlist (see D-09).

  A probe never returns names, emails, subjects, tag values, group names, custom-field values, hostnames, ticket or view ids, or URLs. No screenshots of the live page go through the tool, because they carry ticket content. If a visual fact truly needs an image, the user takes and crops it (Phase 1 D-14).
- **D-05:** Raw DOM for fixtures never passes through the transcript:
  - Claude marks the target element.
  - The user copies its outerHTML in DevTools into a file at a private path outside the repository, and writes the private denylist next to it. The denylist includes their display name.
  - Claude runs `scripts/sanitize-fixture.js` on those paths without printing or persisting them.
  - Raw captures and the denylist are deleted after admission, unless the user keeps them encrypted (Phase 1 D-03).
- **D-06:** A dedicated personal recon view holds Priority plus the nine rule columns. If Zendesk's column limit rules out a single view, split it into two views that both keep Priority and Assignee. Choose view conditions so the rows include:
  - a ticket assigned to the user;
  - tickets assigned to others;
  - an unassigned ticket;
  - an empty value in other columns, where the tenant has one.

  The user creates and later deletes the view. No operational view is touched (Phase 1 D-08).
- **D-07:** Pick columns from what the tenant has:
  - **Date column:** if possible, one that Zendesk renders as relative time (for example "Updated"). The ledger records whether an absolute timestamp is also present in a `title` or `<time datetime>`.
  - **Custom field:** a dropdown. If the tenant also has a checkbox field, capture that too, because checkbox cells are the most likely to be icon-only or `aria-label`-only.

#### Identity
- **D-08:** The identity probe looks first at the top-bar avatar (`img alt`, button `aria-label` / `title`), then inside the profile menu once the user opens it. It records:
  - which element and which attribute or text node carries the name;
  - whether the name is present at page load without opening anything, or appears only later or lazily;
  - whether it is a full name or a short form, recorded as a category and never as the value.

  How the Assignee cell renders a name is recorded too: text, avatar with `aria-label` / `title`, or both.
- **D-09 (identity comparison):** The comparison happens inside the page. The probe normalises both strings (NFC, collapse whitespace, trim). It returns only `equal: true/false` plus one difference kind from a fixed set: identical, case-only, whitespace-only, one is a prefix of the other, different, not comparable. The raw strings never leave the page (SC 2).

#### What the sanitiser keeps
- **D-10:** The v1 sanitiser policy stays exactly as it is. The three admitted fixtures, their checksums and their byte-identical round-trip tests do not change. The rule-column policy is a separate, explicitly selected mode of the same sanitiser. It uses the same sensitive scan and the same fail-closed rejection. It is not a change to the default. — **Reversibility:** costly — changing the default instead would force re-admission of the v1 corpus and touch the Phase 1 gate, the manifest checksums and every round-trip test.
- **D-11:** In rule-column mode, the following text is kept verbatim. Matching uses exact trimmed text, only in the header or cell where the text belongs:
  - standard Zendesk header labels as rendered: Priority, Assignee, Requester, Group, Status, Type, Subject, Tags, and the chosen date column's label;
  - standard Status values (New, Open, Pending, On-hold, Solved, Closed);
  - standard Type values (Question, Incident, Problem, Task);
  - Priority values, as in v1;
  - empty placeholders.

  Placeholders such as "-" or "Unassigned" join the allowlist only after the session shows them, with a ledger note. The exact spelling and casing come from what the session shows, not from this list.

  Everything else is tokenised, including custom ticket-status names and the custom field's header label, because tenants define both.
- **D-12:** Tenant-specific text is tokenised by kind and by value. That covers people, groups, subjects, tags, custom-field values and dates. The same original string gets the same token everywhere in one capture set, so equal cells stay equal and equality and "is any of" tests stay meaningful.

  The agent's own name maps to one reserved token everywhere it appears: the identity region, the Assignee cells, and any `aria-label`, `title` or `alt` that repeats it. The name-to-token mapping lives only in the private denylist (SC 3).
- **D-13:** Element shape is kept and values are not. The sanitiser keeps avatars, `<time>` elements, badges, tag chips, hidden spans, truncation wrappers and `aria-label`-only cells.

  The v1 policy drops `title`, `alt` and `datetime`. When they carry rule-relevant text, this mode keeps them with a tokenised value instead, so a test can see where the text lives. Dates become fixed synthetic values of the same format class (relative or absolute), and the ledger records that class. URL and resource attributes are still removed.
- **D-14:** Three new fixtures are admitted, each with a manifest entry in `test/fixtures/manifest.json` (Phase 1 D-12). An entry holds the scenario, capture date, non-identifying shell metadata, boundary, sanitiser mode and checksum:
  - (a) The light-mode multi-column table, using the v1 boundary: the nearest complete table container.
  - (b) The identity region: the smallest subtree that contains the rendered name, such as the avatar button with its label. Never the whole top bar or navigation. If the name renders only in the opened profile menu, the capture comes from there.
  - (c) The dark-mode table, using the v1 table boundary.

#### Dark-mode matrix and switch
- **D-15:** Zhroma 0.1.0 is switched off with its popup switch for the whole session, and the ledger records that it was off. Its `!important` cell tints would otherwise contaminate colour readings.
- **D-16:** The session observes all six cells: Zendesk Light, Dark and Match system, each with the OS set explicitly to light and to dark, never "auto". The cells where Zendesk and the OS disagree, plus the Match-system cells, are the ones DARK-01 depends on. The other two cost one toggle each.

  Each cell records:
  - `color-scheme` on `html`, both computed and from any `meta[name=color-scheme]`;
  - attribute names and mode-like class tokens on `html` and `body`;
  - the `matchMedia('(prefers-color-scheme: dark)')` result;
  - computed colours of the pane background, the header-cell background and text, and a ticket cell's text.

  It never reads a colour Zhroma could paint. The `dark-mode-signal` entry names which branch of ARCHITECTURE §4's decision tree holds: a document marker, surface luminance only, or neither.
- **D-17:** Before each switch, a temporary page-local recorder is installed. It has:
  - a `MutationObserver` on `html`, `head`, `body` and the table (attributes and childList);
  - a window sentinel to detect a reload;
  - a marker on the table to detect a re-mount;
  - a before/after count of stylesheet rules, because styled-components inserts rules through the CSSOM and that produces no mutation records.

  Three switches are observed: Light→Dark and Dark→Light in Zendesk's settings, and an OS toggle while Match system is set. Only counts and element kinds are recorded.
- **D-18:** Dark native states re-run Phase 1's `interaction-and-sticky-states` probe in dark mode, on a hovered row, a selected row (selected with its checkbox), a normal row and the sticky header. For keyboard focus, the user presses Tab only, never Enter or Space, which can open a ticket, until focus lands in the table. Claude then reads the focused element's computed outline and box-shadow. If focus can't be observed safely, the entry ends as not observed, with a named fallback for Phase 8, and does not block the phase.
- **D-19:** `dark-table-topology` re-runs the v1 `stable-identifiers` and `root-chain` checks in dark mode. If the Garden identifiers differ in dark, that blocks Phase 8. It is reported, not worked around.
- **D-20:** At the end of the session, the user restores their original Zendesk appearance, OS appearance and Zhroma switch state, then deletes the recon view(s). The handoff records the restore.

#### How heavy the evidence is
- **D-21:** Evidence stays light and proportionate. The phase reuses what already exists: the Phase 1 D-13 ledger entry shape, the sanitiser and its sensitive scan, the manifest with checksums, and the round-trip tests. It adds only:
  - the rule-column sanitiser mode, with its own tests;
  - manifest entries for the three new fixtures;
  - the new ledger ids, registered so the phase cannot close while any of them is missing or unresolved.

  The new ids are `dark-mode-signal`, `dark-mode-switch-mutation`, `dark-native-states`, `dark-table-topology`, `identity-location`, `identity-vs-assignee`, `referenced-cell-representation` and `header-label-uniqueness`. Recon 2 gets its own verdict section in `SELECTORS.md`. The Phase 1 Final Verdict is left untouched.

  The phase adds no new mutant registries, no pinned-blob acceptance binding (fixtures are not shipped bytes) and no re-admission ceremony. This follows retrospective lesson 5: the evidence apparatus outgrew the product.
- **D-22:** Phase 6 changes no shipped bytes. Nothing under `extension/` changes, so no v1 human check reopens and Phase 7's parity harness is unaffected. Phase 6 stays within `scripts/`, `test/recon/`, `test/fixtures/` and `SELECTORS.md`.
- **D-23:** Review and repair is capped at one round (retrospective lesson 2). Leftover findings that don't block go to the backlog or `.planning/WINDOWS.md`, not to a second gap-closure plan.
- **D-24:** Every new entry ends with a terminal status. Where a fact could not be observed, the entry names a fallback for the consuming phase. Only two outcomes block downstream work:
  - dark mode is not offered on the tenant;
  - the v1 Garden identifiers do not hold in dark mode.

  Everything else ends with a fallback. For example, if no name is found anywhere, Phase 10 relies on a typed name (IDENT-03). If there is no marker and no readable surface, the page falls back to light (DARK-05).
- **D-25:** `header-label-uniqueness` records whether any two headers in the recon view share a label, and whether the tenant has two custom fields with the same title. No admin change is made to create such a case.

### Claude's Discretion
- Exact probe scripts, run-sheet wording and order within D-01.
- Token formats and names (for example `PERSON-nnn` or the reserved identity token), and how the sanitised-output grammar is extended to admit them.
- How the rule-column mode is selected (a flag or a separate entry point) and the new fixture file names.
- Whether `referenced-cell-representation` is one ledger entry or one per column.
- The status value for "could not be observed". This may be a minimal extension of Phase 1's D-13 vocabulary (`verified`, `disproved`, `outside English-only scope`).
- Which date column and which custom field, within D-07.

### Deferred Ideas (OUT OF SCOPE)
- Date and relative-time operators (RULE-F1). This recon records only the date format class and where timestamps live.
- Whole-word tag matching (RULE-F2). This recon records the tag rendering shape, which RULE-F2 will need later.
- Non-English recon and localised values (REACH-01).
- The ticket conversation pane's own dark/light override. It is out of scope because it is on the ticket page, not an agent view.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RECON-04 | How Zendesk signals light vs dark mode, and what changes on a mid-session switch, is recorded with evidence from a live account | Probes P3 (per-cell signal) and P4/P5 (recorder install/read-back) in Code Examples; six-cell matrix ordering in Pattern 4; ledger ids `dark-mode-signal`, `dark-mode-switch-mutation`, `dark-native-states`, `dark-table-topology` registered by the Recon 2 gate (Pattern 2); dark table fixture (c) through the rule-column mode (Pattern 1) |
| RECON-05 | Where the signed-in agent's name renders, and whether it matches the Assignee column text, is recorded from a live account | The name-free identity probe P2 (it compares against the user-selected own-ticket Assignee cell inside the page, so nobody types the name into the transcript); the reserved identity token and the `self:` denylist directive (Pattern 1); the identity-region boundary check (Pattern 1, "Identity-region boundary") |
| RECON-06 | How rule-relevant columns render (Assignee, Requester, Group, Status, Type, Subject, Tags, a date column, a custom field), including empty placeholders, is recorded and captured as sanitised fixtures | Rule-column mode: column-aware allowlist, per-distinct-value tokens, kept `title`/`alt`/`aria-label` with tokenised values, synthetic `datetime` (Pattern 1); cell-shape probe P1; manifest `recon2Fixtures` array (Pattern 3). **Tags cannot be a view column according to a Zendesk employee** (Open Question 1) |
</phase_requirements>

## Summary

Phase 6 is two different kinds of work. The first is repository work that can be built and tested before anyone opens Zendesk: a rule-column sanitiser mode, a Recon 2 ledger gate, and a manifest extension. The second is one live session, driven by the user and read-only, which fills the ledger and produces three raw captures that the new mode admits. The planner should split them. Build and test the tooling first, then hold the session as a single human checkpoint, then admit fixtures and close the verdict.

The biggest finding is that **the existing v1 gates are rigid in ways that make the "obvious" extensions break them**. These are not stylistic concerns. Each one breaks an existing test:
- Every consumer iterates `manifest.fixtures` with v1-only rules. `test/extension/*` asserts `fixtureCount` is 3. Recon 2 fixtures must therefore live in a **separate top-level array** in the same `manifest.json`.
- The Phase 1 gate parses every `## Ledger Entry:` heading in the file. The smoke test asserts `entryCount: 18`, and any unknown scenario throws `scenario-not-admitted`. Recon 2 entries therefore need a **distinct heading prefix**.
- `## Final Verdict` must be the last `##` section. Anything after it is merged into the verdict's fields. The Recon 2 section must therefore sit **before** `## Spec-less Planning Assumptions`.
- The sanitiser CLI accepts exactly 6 arguments, so an optional `--mode` pair must be added without touching the 6-argument path.
- The sanitiser rejects `src`, `href` and `style` with `url()` *before parsing*. Phase 1 got live captures past this with an unrecorded "one-way in-page structural projection". Phase 6 needs its own **user-run projection snippet** that strips resource attributes on a detached clone and ends in DevTools' `copy()`.

Two external facts reshape the run sheet. Zendesk's help centre says a view takes "up to 15 columns", that "Multi-select fields are not supported", and that "Agents can create views for their own personal use only". A Zendesk employee answer says "it's not possible to add Tags as a column". So Priority plus the other eight rule columns fit in one view, D-06's two-view split is very likely unnecessary, and **the Tags part of RECON-06 / SC 3 probably cannot be observed as a column at all**. That needs user confirmation before it becomes a `not observed` entry with a Phase 9 fallback.

**Primary recommendation:** Build an opt-in `mode: 'rule-columns'` in `sanitize-fixture.js`, backed by a new `scripts/rule-column-contract.js`, and leave `sanitized-output-contract.js` untouched. Also build a `recon2` mode in `verify-recon-gate.js` that reads `## Recon 2 Entry:` sections and one `## Recon 2 Verdict`, plus a `recon2Fixtures` manifest array validated by a new exported function in `fixture-contract.js`. Then run one scripted session in which every probe returns only enums, counts, colours and allowlisted Zendesk vocabulary.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Observing appearance signal, switch mutations, native states | Live browser tab (read-only probes, user-driven) | Ledger (`SELECTORS.md`) | Only the live DOM can answer; probes must return enums, counts and colours only (D-04) |
| Locating the agent's name and comparing it with Assignee | Live browser tab (in-page comparison) | Ledger | Raw strings must never leave the page (D-09); only `equal` plus a difference kind cross into the transcript |
| Projecting raw DOM to a capturable shape | Live browser tab (user-pasted DevTools snippet, `copy()`) | Private file outside every checkout | Strips `src`/`href`/`style`/`class`/`id` on a detached clone so the fail-closed pre-parse check stays intact |
| Tokenising and admitting fixtures | Node dev tooling (`scripts/sanitize-fixture.js` rule-column mode) | `scripts/sensitive-patterns.js` | Same custody, scan and write-once rules as v1 (D-10) |
| Checking the admitted output grammar | Node dev tooling (`scripts/rule-column-contract.js`) | Vitest round-trip tests | Separate from the v1 validator so v1 bytes and tests stay identical |
| Registering the required ledger ids and the Recon 2 verdict | Node dev tooling (`scripts/verify-recon-gate.js` `recon2` mode) | `test/recon/*` | The phase cannot close with any id missing or unresolved (D-21) |
| Shipped extension | — (untouched) | — | D-22: nothing under `extension/` or `test/extension/` changes |

## Project Constraints (from CLAUDE.md)

- Chrome Extension MV3, Chrome only; permissions frozen (host access `*.zendesk.com`, no API tokens, no remote code). Phase 6 changes no permission and no shipped byte.
- **Privacy:** ticket data never leaves the browser; no telemetry or network calls. For this phase that means probe outputs must carry no ticket data into the transcript (D-04), and fixtures carry only tokens.
- Zendesk's DOM is undocumented and can change without notice. Selectors must be derived empirically, and a captured fixture is the durable record.
- No bundler, no TypeScript emit, no build step. New scripts are hand-written ESM like the existing ones (`"type": "module"` in `package.json`).
- Tests: Vitest 4.1.11 plus happy-dom (installed 20.13.1), and `node --test` for `*.smoke.js`. No Jest, Puppeteer or Selenium. No live-Zendesk E2E in CI.
- Never use `prefers-color-scheme` as the dark signal (CLAUDE.md research notes plus ARCHITECTURE Anti-Pattern 3).
- GSD workflow enforcement: file changes go through a GSD command (`/gsd-execute-phase`).
- Developer profile: not configured, so no additional directives.

## Standard Stack

No package is added. Everything reuses installed tooling. [VERIFIED: `package.json` read this session: `"devDependencies": { "happy-dom": "20.13.1", "vitest": "4.1.11" }`, `"test:recon": "node --test test/recon/*.smoke.js && node node_modules/vitest/vitest.mjs run --config vitest.config.js"`]

### Core
| Library / Tool | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | v26.8.2 (local) | Runs the sanitiser, gate and tests | `engines` is `"^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0"`, which v26 satisfies [VERIFIED: `node --version`, package.json] |
| happy-dom | 20.13.1 | Inert `DOMParser` for sanitisation and validation | Already used by `createInertParser()` with JavaScript, CSS, image and navigation loading disabled [VERIFIED: sanitized-output-contract.js:147-162] |
| vitest | 4.1.11 | Rule-column mode tests, recon2 manifest tests | `vitest.config.js` includes `'test/recon/*.test.js'`, so new files there are picked up automatically [VERIFIED: vitest.config.js] |
| node:test | built-in | `*.smoke.js` gate tests | The existing `recon-gate.smoke.js` pattern [VERIFIED] |
| node:crypto `createHash('sha256')` | built-in | Fixture checksums | Existing `sha256()` export [VERIFIED: sanitize-fixture.js:33-38] |

### Supporting
| Tool | Purpose | When to Use |
|---------|---------|-------------|
| Claude in Chrome (JS evaluation) | Read-only probes in the user's tab | Primary path per D-03 |
| Chrome DevTools console | Fallback probe path; the **only** path for the capture projection, because `copy()` is a DevTools Command Line API helper [ASSUMED] | Capture step, and whenever Claude in Chrome is not connected |
| `gpg` 2.5.22 (local) | Optional encryption of retained raw captures (Phase 1 D-03) | Only if the user keeps raw captures |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate `recon2Fixtures` array in `manifest.json` | Appending to `manifest.fixtures` | Breaks `fixtureCount` 3 in `test/extension/*` (Phase 7's territory, D-22), the `REQUIRED_SCENARIOS` matrix test, and v1 round-trip tests. **Rejected.** |
| `## Recon 2 Entry:` heading prefix | Reusing `## Ledger Entry:` | Breaks `entryCount: 18` and throws `scenario-not-admitted` in the Phase 1 final gate. **Rejected.** |
| New `scripts/rule-column-contract.js` | Adding sets to `sanitized-output-contract.js` | The exported sets are mutable `Set`s shared with the v1 validator. Editing or mutating them changes v1 behaviour. **Rejected.** |
| In-page projection, then the unchanged pre-parse rejection | Relaxing rule mode to parse markup that still has `src`/`href`, then removing them | Weakens the fail-closed posture D-10 keeps ("the same fail-closed rejection"), and parses resource-bearing markup. **Rejected.** |

**Installation:** none.

## Package Legitimacy Audit

This phase installs no external packages. The `package-legitimacy` gate is not applicable.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none) | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                ┌──────────────────── USER-DRIVEN LIVE TAB (read-only for Claude) ─────────────────────┐
 user actions   │  personal recon view ─► table[data-garden-id="tables.table"][data-test-id="generic-table"]│
 (clicks, menus,│        │                         ▲                                                    │
  appearance,   │        │ probes P0–P6            │ recorder P4 (MutationObserver + sentinel + marker) │
  OS toggle,    │        ▼                         │                                                    │
  hover, select,│   in-page reduction ──► enums / counts / computed colours / allowlisted vocabulary     │
  Tab)          │        │                                           │                                  │
                │        │ capture marker data-zhroma-probe="capture" ▼                                  │
                │        └─► user-pasted projection snippet (detached clone, strip src/href/style/class/id)│
                └────────────────┬──────────────────────────────────────────┬──────────────────────────┘
                                 │ transcript (safe values only)            │ clipboard (DevTools copy())
                                 ▼                                          ▼
                     SELECTORS.md  ## Recon 2 Entry: <id>        private dir OUTSIDE every checkout
                     (D-13 field shape + closed enums)           raw.private.html + denylist (with `self:` line)
                                 │                                          │
                                 │                                          ▼
                                 │                  sanitize-fixture.js --mode rule-columns
                                 │                  custody checks → assertSafeToParse → inert parse →
                                 │                  boundary (table | identity-region) → attribute + text
                                 │                  tokenisation (column-aware) → scanSensitiveContent →
                                 │                  validateRuleColumnOutput → write once (wx)
                                 │                                          │
                                 │                                          ▼
                                 │                  test/fixtures/zendesk-recon2-*.html
                                 │                  + manifest.json "recon2Fixtures" entry (sha256)
                                 ▼                                          │
                  verify-recon-gate.js recon2 SELECTORS.md manifest.json ◄──┘
                  (8 ids terminal + verdict consistency + fixture checksums/grammar) → RECON 2 VERDICT
                  (Phase 1 `final` mode unchanged → FINAL VERDICT: proceed)
```

### Recommended Project Structure
```
scripts/
├── sanitize-fixture.js          # + opt-in mode 'rule-columns' (v1 path byte-for-byte unchanged)
├── rule-column-contract.js      # NEW: rule-mode attribute classes, allowlists, token grammar,
│                                #      identity-region boundary, validateRuleColumnOutput()
├── fixture-contract.js          # + exported validateRecon2Fixtures() over manifest.recon2Fixtures
├── verify-recon-gate.js         # + exported verifyRecon2Ledger(), CLI mode `recon2`
├── sanitized-output-contract.js # UNCHANGED
└── sensitive-patterns.js        # UNCHANGED (reused as is)
test/recon/
├── rule-column-sanitizer.test.js  # NEW (vitest): mode behaviour, idempotency, rejection codes
├── recon2-corpus.test.js          # NEW (vitest): recon2Fixtures checksums + rule-mode round trip
└── recon2-gate.smoke.js           # NEW (node:test): synthetic ledgers, verdict consistency
test/fixtures/
├── manifest.json                  # + "recon2Fixtures": [...] (top level, beside "fixtures")
├── zendesk-recon2-light-columns.html
├── zendesk-recon2-identity-region.html
└── zendesk-recon2-dark-table.html
SELECTORS.md                       # + Recon 2 block inserted before "## Spec-less Planning Assumptions"
.planning/phases/06-live-dom-recon-2/06-RUN-SHEET.md   # probes + step order (no test reads it; lesson 4)
```
File names are suggestions (Claude's discretion).

### Pattern 1: Opt-in rule-column mode on the same sanitiser

**What:** `sanitizeFixture({ inputPath, outputPath, denylistPath, mode })` has `mode` default `undefined`, which means the v1 path. The value `'rule-columns'` selects the new pipeline. The CLI accepts either the existing 6 arguments or 8 arguments with `--mode rule-columns`.

**Why it is safe:** `sanitizeFixture` ignores unknown option keys today. The custody block is mode-independent and should be reused as is: denylist outside the worktree, the denylist not aliasing input or output, input outside the worktree, size bounds, the UTF-8 check, `assertSafeToParse`, and the `wx` write. [VERIFIED: sanitize-fixture.js:224-287]

Verbatim facts the mode must respect:
- CLI arity: `if (argumentsList.length !== 6) { reject('cli-arguments-invalid'); }` and the flag set `['--input', '--output', '--denylist']` [VERIFIED: sanitize-fixture.js:290-299]. Existing tests assert that duplicate or missing flags reject and that invalid invocations print exactly `SANITIZE_FIXTURE_REJECTED cli-arguments-invalid\n` [VERIFIED: sanitize-fixture.test.js:529-582]. Keep the 6-argument branch identical and add an 8-argument branch that also requires `--mode` with the value `rule-columns`.
- Pre-parse rejection stays: `RESOURCE_ATTRIBUTE = /\s(?:src|srcset|href|xlink:href|action|formaction|poster|srcdoc)\s*=/iu` and `CSS_RESOURCE` (a `style` containing `url(`) are rejected by `assertSafeToParse` before any parse [VERIFIED: sanitized-output-contract.js:6-7, 135-145]. Rule mode reuses `assertSafeToParse` unchanged. The projection snippet is what removes those attributes.
- v1 attribute classes (do **not** mutate them; copy into new sets): `PRESERVED_ATTRIBUTES` = `'role', 'scope', 'colspan', 'rowspan', 'tabindex', 'lang', 'dir', 'type', 'disabled', 'hidden', 'checked', 'selected', 'multiple', 'readonly', 'data-garden-id', 'data-test-id', 'data-zhroma-probe'`. `REMOVABLE_ATTRIBUTES` includes `'title'`, `'alt'`, `'datetime'`, `'class'`, `'style'`, `'id'`, `'value'`, `'placeholder'`. `TEXTUAL_ARIA_ATTRIBUTES` includes `'aria-label'`. [VERIFIED: sanitized-output-contract.js:8-38, 90-119]
- The v1 grammar the rule mode must **not** reuse: textual ARIA must match `/^ARIA-\d{3,}$/u`, and text must match `/^TEXT-\d{3,}$/u` or be Priority vocabulary in the right cell [VERIFIED: sanitized-output-contract.js:306, 327-333]. A rule-mode fixture carrying `title` fails `validateSanitizedOutput` with `unsafe-attribute`, because `title` is in `REMOVABLE_ATTRIBUTES` (lines 94, 307-308). That is exactly why rule-mode fixtures cannot sit in `manifest.fixtures`.

**Rule-mode design (recommended; token names are Claude's discretion and are proposals, not verified values):** [ASSUMED]
- **Table boundary:** call the exported `resolveBoundedDocument(parsed)` unchanged, so D-14's "v1 boundary" holds exactly. It returns `{ root, table, headerRow, priorityCells, priorityHeaderCell, priorityIndex, ticketRowCount }` [VERIFIED: sanitized-output-contract.js:254-255]. Derive the column index of each header cell from `headerRow.children`.
- **Column kind:** trimmed header text is looked up in an in-repo allowlist. The mapping is Assignee / Requester (plus any observed person column such as the requester variant) → `PERSON`; Group → `GROUP`; Subject → `SUBJECT`; Tags → `TAG`; the date label → `DATE`; Status → `STATUS` for non-standard values; Priority → v1 behaviour. A non-standard header gets its label tokenised as `LABEL-nnn` and its cells become `FIELD`. A header with no text (the checkbox column) gets `TEXT`. Anything outside cells gets `TEXT`.
- **Kept verbatim (D-11):** the text node's trimmed value is exactly in the allowlist for **that** column: header labels only inside header cells, Status values only in Status cells, Type values only in Type cells, Priority exactly as v1, placeholders only in cells. The same check applies to textual attributes (`aria-label`, `title`, `alt`) on elements inside the owning cell. Recon 1 observed "A readable Priority cell used the same allowed label as `aria-label`" [VERIFIED: SELECTORS.md:97], so keeping an allowlisted `aria-label` verbatim in its own column records exactly that shape. Priority stays whole-cell-equal, as v1 (`allowedPriorityCell?.textContent.trim() === trimmed`) [VERIFIED: sanitize-fixture.js:182-184]. For the new columns, prefer text-node equality inside the owning cell, so that a hidden prefix span such as a visually hidden "Status:" does not force the visible "Open" to be tokenised.
- **Per-distinct-value tokens (D-12):** one `Map` keyed by `(kind, normalise(value))`, where `normalise` is NFC, with NBSP and whitespace runs collapsed to one space, then trimmed, and case-sensitive. Tokens are numbered per kind in first-appearance order in **one** document-order traversal that visits attributes and text together, giving `PERSON-001`, `GROUP-001` and so on. Equal cells get equal tokens, and an `aria-label`, `title` or `alt` equal to its cell's text shares the token.
- **Reserved identity token (D-12):** proposed `PERSON-SELF`. The rule-mode denylist parser recognises a directive line `self: <display name form>`, adds the bare name to the scan list, and maps any text or textual attribute whose normalised value equals it to `PERSON-SELF` in **every** column and in the identity region. If the session shows that the top bar and Assignee use different forms (difference kind is not `identical`), list both forms and map the second to `PERSON-SELF-ALT`. Otherwise the fixture would show equality the live page does not have, contradicting `identity-vs-assignee`.
- **Kept attributes (D-13):** `title`, `alt` and textual ARIA are kept with a tokenised or allowlisted value. `datetime` is replaced by one fixed synthetic literal per format class, for example `2000-01-01T00:00:00Z` for date-time and `2000-01-01` for date only. An unrecognised format rejects with a new code such as `datetime-format-unrecognised`. `class`, `style`, `id`, `name`, `value` and `placeholder` stay removed.
- **Identifier values:** `data-garden-id` / `data-test-id` values survive verbatim. The v1 corpus only ever kept `tables.*` / `generic-table*` values (verified by grep of the three fixtures). Rule-mode fixtures will be the first to carry inner identifiers such as avatar or tag-chip ids. Add a rule-mode check that identifier values match a digit-free grammar, for example `/^[a-z][a-z._-]*$/i`. The generic scan only catches `\b\d{7,}\b` [VERIFIED: sensitive-patterns.js:33-36], so a 4-digit ticket id inside a `data-test-id` would otherwise pass.
- **Idempotency (round-trip):** rule mode must treat an already-valid token as a value of its column kind, so first-appearance renumbering reproduces the same numbers. It must preserve `PERSON-SELF`/`PERSON-SELF-ALT` and the synthetic `datetime` literals verbatim, so re-sanitising an admitted fixture with a synthetic denylist is byte-identical. That mirrors `corpus-provenance.test.js`'s v1 round trip [VERIFIED: corpus-provenance.test.js:18-27, 41-46].

**Identity-region boundary (new boundary kind, D-14b):** [ASSUMED design]
- Exactly one root element in `body`, an empty `head`, and no stray text (the same opening checks as `resolveBoundedDocument`, lines 176-180).
- No `table`, `[role="table"]`, `[role="grid"]`, `tr`, `[role="row"]`, `nav`, `header`, `main`, `aside`, `[role="navigation"]`, `[role="banner"]`, `[role="menubar"]` or `[role="tablist"]` anywhere in the capture. This proves it is not the top bar or navigation.
- At least one `PERSON-SELF` occurrence, in text or a kept textual attribute.
- **Minimality:** the root is the lowest common ancestor of all `PERSON-SELF` occurrences, or the nearest `button` / `[role="button"]` / `[role="menuitem"]` ancestor of that ancestor. This matches "the avatar button with its label".
- A small element cap, for example 40 or fewer.
- Stable reject code, for example `identity-boundary-required`.

### Pattern 2: Recon 2 ledger section and gate (without touching Phase 1)

Verbatim constraints from the Phase 1 gate:
- `const ENTRY_HEADING = /^## Ledger Entry:\s*(.+?)\s*$/gm;`, `const VERDICT_HEADING = /^## Final Verdict\s*$/gm;`, `const FIELD_LINE = /^- ([a-z][a-z0-9-]*):\s*(.*)$/gm;` [VERIFIED: verify-recon-gate.js:13-16]
- `TERMINAL_STATUSES` = `'verified'`, `'disproved'`, `'outside English-only scope'` [VERIFIED: verify-recon-gate.js:43-47]
- `LEDGER_TO_MANIFEST_SCENARIO` maps only `'priority-present-grouped-long'`, `'priority-present-ungrouped'` and `'priority-absent'`. Any other scenario on a `## Ledger Entry:` throws `new ReconGateError('scenario-not-admitted')` [VERIFIED: verify-recon-gate.js:52-56, 445-448]
- `parseVerdict` throws `'verdict-not-final-section'` if any `^##\s+` heading follows `## Final Verdict` [VERIFIED: verify-recon-gate.js:373-378]. Its fields are parsed up to the next `^##\s+`. `/^##\s+/` does not match `###`, so any `### …` subsection placed after the verdict would have its `- field:` lines merged into the verdict. That would fail with `entry-field-duplicate` on a repeated `verdict`/`rationale`, or silently change the verdict fields.
- `parseOpenQuestions` throws `question-unresolved` for **any** `## Recon Question:` heading anywhere in the file, even in `evidence` mode [VERIFIED: verify-recon-gate.js:334-365, 669-671]. **Pre-session Recon 2 placeholders must not use that heading.**
- The smoke test pins the real ledger: `verifyReconLedger(markdown, { mode: 'final', admittedScenarios: ADMITTED_SCENARIOS })` must equal `{ entryCount: 18, verdict: 'proceed' }` [VERIFIED: recon-gate.smoke.js:280-286]. It also requires `^- state: interaction-evidence-complete$` and `^- post-action-state: interactions-complete$` to exist somewhere [VERIFIED: recon-gate.smoke.js:273-274], so the Phase 1 handoff record must stay. Recon 2 gets its **own** handoff section.
- The assumption-table test strips `/^## Spec-less Planning Assumptions[\s\S]*?(?=^## Final Verdict)/m` [VERIFIED: recon-gate.smoke.js:588]. Placing the Recon 2 block **before** `## Spec-less Planning Assumptions` keeps that test's meaning unchanged.

**Recommended shape:**
```
## Recon 2 Session Handoff        ← D-01 resume record (state / next-action / restore), own field names
## Recon 2 Entry: dark-mode-signal
- id: `dark-mode-signal`
- question: …
- scope: `English path`
- status: `verified` | `disproved` | `not observed` | `pending`
- probe: `<exact one-line probe>`
- evidence: …
- interpretation: …
- fallback: … (must name the consuming phase when status is `not observed`)
- scenario: `recon2-appearance-matrix`
- dark-mode-offered: `yes` | `no`                          ← closed enum, gate-checked
- dark-branch: `document-marker` | `surface-luminance` | `neither` | `not-offered`
## Recon 2 Entry: … (the other seven ids; see closed fields below)
## Recon 2 Verdict
- recon2-verdict: `proceed` | `block`
- blocked-consumers: `none` | `phase-8`
- rationale: …
                                   (then the existing, untouched:)
## Spec-less Planning Assumptions
## Final Verdict
```

Proposed closed-enum fields [ASSUMED; names are Claude's discretion]:

| Id | Structured field(s) | Values |
|----|---------------------|--------|
| `dark-mode-signal` | `dark-mode-offered`, `dark-branch` | `yes/no`; `document-marker/surface-luminance/neither/not-offered` |
| `dark-mode-switch-mutation` | `switch-effect` (one line per observed switch, or three fields) | `attribute-or-class-swap / cssom-only / remount / reload / no-mutation` |
| `dark-native-states` | `focus-observed` | `yes/no` |
| `dark-table-topology` | `garden-identifiers` | `hold/differ` |
| `identity-location` | `identity-source`, `identity-form` | `top-bar-at-load / top-bar-lazy / profile-menu-only / not-found`; `full / short / not-found` |
| `identity-vs-assignee` | `equal`, `difference-kind` | `true/false`; `identical / case-only / whitespace-only / prefix / different / not-comparable`. The gate checks `equal: true` if and only if `identical` |
| `referenced-cell-representation` | one entry is enough; a `columns-observed` count plus a `tags-column` field | `observed / not-offered` |
| `header-label-uniqueness` | `duplicate-in-view`, `duplicate-custom-titles` | `yes/no`; `yes/no/unknown` |

**Gate logic (`verifyRecon2Ledger(markdown, { recon2Fixtures })`):**
1. Parse `## Recon 2 Entry:` sections with the same `collectSections` / `parseFields` helpers. They are in the same module, so they need no export.
2. Require exactly the eight ids, each with all D-13 fields and a terminal status (`verified`, `disproved`, `not observed`). `pending` is rejected.
3. Require the closed-enum fields and their consistency.
4. Require the Recon 2 verdict: `block` with `blocked-consumers: phase-8` if and only if `dark-mode-offered: no` or `garden-identifiers: differ`; otherwise `proceed` with `none` (D-24).
5. Require three admitted `recon2Fixtures`. For a `proceed` verdict all three are needed; if dark mode is not offered, the dark table cannot exist, so only the light table and identity region are required (Open Question 3).
6. Optional and cheap: run `scanSensitiveContent` over the Recon 2 block only, as a transcript-leak guard. Probes in this block must then avoid `https:` and `//` literals, because `resource-url` matches `(?:https?:|blob:|data:|file:|\/\/)` [VERIFIED: sensitive-patterns.js:42-46].

**CLI:** add `recon2 <ledger> <manifest>` next to `evidence` and `final`. The existing arity checks (`(mode === 'evidence' && args.length !== 2) || (mode === 'final' && args.length !== 3) || (mode !== 'evidence' && mode !== 'final')`) [VERIFIED: verify-recon-gate.js:692-698] gain one clause. `verifyReconLedger` itself stays untouched. Its `mode-invalid` test uses `'draft'` [VERIFIED: recon-gate.smoke.js:240-245], and the CLI unknown-mode test uses `'PRIVATE-MODE'` [VERIFIED: recon-gate.smoke.js:81], so both still hold.

### Pattern 3: `recon2Fixtures` manifest array

Why a separate array is required (each item verbatim):
- `validateFixtureManifest` iterates `manifest.fixtures` and, for every entry, requires `selectors.ticketTable`/`headerRow`, runs `validateSanitizedOutput` (the v1 grammar), and calls `assertScenario`, which throws `scenario-unsupported` for any scenario outside the three [VERIFIED: fixture-contract.js:354-439, 243-251]. With `requireCompleteScenarioMatrix` it also requires `seenScenarios.size !== REQUIRED_SCENARIOS.length` to be false, where `REQUIRED_SCENARIOS = ['priority-present-ungrouped', 'priority-absent', 'grouped-long']` [VERIFIED: fixture-contract.js:15-19, 441-448].
- `test/extension/initial-tint.test.js` and `runtime-contract.test.js` call `validateFixtureManifest(... { requireCompleteScenarioMatrix: true })` on the real manifest and assert `.fixtureCount).toBe(3)` [VERIFIED: initial-tint.test.js:16-20; runtime-contract.test.js:26-30]. `persistent-tint.test.js:17`, `scripts/run-tint-workload.js:157` and `scripts/verify-locale-rendering.js:163` call it the same way [VERIFIED by grep]. **Phase 7 owns `test/extension/`, so these must not be touched (D-22).**
- `corpus-provenance.test.js` asserts `manifest.fixtures` scenarios equal `REQUIRED_SCENARIOS`, and for each entry expects `sanitizationMethod` to match `/Re-admitted.*previously sanitized repository bytes/` and to contain `'not a fresh live capture'` [VERIFIED: corpus-provenance.test.js:29-40]. New live captures would fail both.
- No test inspects top-level manifest keys. `copyCommittedCorpus` rewrites the whole manifest but copies only `manifest.fixtures` files [VERIFIED: fixture-contract.test.js:137-146], and the final CLI reads only `fixtures`. A sibling array is therefore invisible to every v1 consumer.

**Entry shape** (D-14 plus what the validator needs):
```json
{
  "scenario": "recon2-light-columns",
  "captureDate": "2026-09-DD",
  "workspace": { "shell": "current Agent Workspace", "plan": "unknown/not shared" },
  "appearance": "light",
  "boundaryKind": "table",
  "domBoundary": "nearest complete table container: immediate overflow wrapper and its ticket table",
  "sanitizerMode": "rule-columns",
  "sanitizationMethod": "Fresh live capture through the in-page projection, admitted by scripts/sanitize-fixture.js --mode rule-columns; private inputs deleted after admission.",
  "file": "zendesk-recon2-light-columns.html",
  "sha256": "<64 hex>"
}
```
The `workspace` values are copied from the existing entries [VERIFIED: manifest.json]. The new keys are proposals [ASSUMED]. `validateRecon2Fixtures(manifestPath)` should reuse the internal `safeRelativeFixturePath` (canonical path containment, symlink rejection), the checksum, `scanSensitiveContent(markup, { denylist: ADMISSION_DENYLIST })` **before** parsing, and then `validateRuleColumnOutput(markup, { boundary: entry.boundaryKind })` [VERIFIED: fixture-contract.js:10-12, 306-331, 387-407].

### Pattern 4: Run sheet order (D-01) with minimum toggles

Six appearance cells and three observed switches, in an order that needs five changes:

| Step | Zendesk | OS | What happens |
|------|---------|----|--------------|
| 0 | (original) | (original) | Record the originals for the restore step. Zhroma switched off, confirmed by `[data-zhroma-priority]` count 0. Preconditions D-02 (a)(b)(c). Check that evaluations persist between calls (Open Question 2) |
| 1 | Light | light | Light column capture: P1 cell shapes, header labels, uniqueness. Identity P2 at load, then again after the user opens the profile menu. Capture (a) light table and (b) identity region, then sanitise immediately. **Cell 1** P3 |
| 2 | Light→Dark | light | Install recorder P4, user switches, read back P5 (**switch A**). **Cell 3** P3 |
| 3 | Dark | light→dark | **Cell 4** P3 (OS toggled explicitly to Dark, never Auto) |
| 4 | Dark→Light | dark | P4, switch, P5 (**switch B**). **Cell 2** P3 |
| 5 | Light→Match | dark | **Cell 6** P3 |
| 6 | Match | dark→light | P4, OS toggle, P5 (**switch C**). **Cell 5** P3 |
| 7 | Dark | any | Dark native states (Phase 1 interaction probe, sticky probe, focus probe P6 after Tab-only). `dark-table-topology` (stable-identifiers plus root-chain). Capture (c) dark table |
| 8 | restore | restore | Original appearance, OS and Zhroma switch. User deletes the recon view. Handoff record written |

Note: D-06 describes "Priority plus the nine rule columns". Zendesk allows "up to 15 columns" [CITED: support.zendesk.com/hc/en-us/articles/4408888828570], so one view fits. However, Tags is very likely not offerable as a column (Open Question 1).

### Anti-Patterns to Avoid
- **Appending Recon 2 fixtures to `manifest.fixtures`.** This breaks `test/extension/*` (`fixtureCount` 3), the Phase 1 final CLI and `corpus-provenance.test.js`.
- **Reusing `## Ledger Entry:` or `## Recon Question:` for Recon 2.** The first changes `entryCount: 18` and throws `scenario-not-admitted`. The second throws `question-unresolved` in every mode.
- **Putting anything after `## Final Verdict`.** This triggers `verdict-not-final-section`, or silent field merging under `###`.
- **Mutating the exported v1 `Set`s** (`PRESERVED_ATTRIBUTES.add('title')`). This silently changes the v1 validator and the v1 sanitiser. Build new sets by copying: `new Set([...PRESERVED_ATTRIBUTES, ...])`.
- **Probes that return `textContent` or attribute values.** D-04 forbids it. Reduce inside the page to enums, counts and booleans. This also blocks prompt-injection text in tickets from ever reaching the model.
- **Reading a colour from a cell Zhroma could paint**, or treating `rgba(0, 0, 0, 0)` as black. Read the pane background and the header cell, and a ticket cell's **text** colour only.
- **`prefers-color-scheme` or page `localStorage['color-scheme']` as the signal** (ARCHITECTURE Anti-Pattern 3). `matchMedia` is recorded as a per-cell fact only.
- **Mapping two different self-forms to one token.** The fixture would then claim `identical` when the live page differs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Path custody (worktree, symlink, alias) | A new path checker | The existing `sanitizeFixture` custody block and `safeRelativeFixturePath` | Already covers symlinks to the worktree, aliasing and in-worktree input, with value-free codes [VERIFIED: sanitize-fixture.js:232-248; fixture-contract.js:306-331] |
| Sensitive residual scan | New regexes | `scanSensitiveContent` (NFC plus case fold, generic rules plus denylist) | Findings are value-free; the Phase 1 NFD/NFC work is already done [VERIFIED: sensitive-patterns.js:82-139] |
| Inert HTML parsing | A string-based parser | happy-dom `Window` with loading disabled (`createInertParser` / `parseDetached` pattern) | No script, CSS, image or navigation loading [VERIFIED: sanitized-output-contract.js:147-162] |
| Table boundary | A second table-boundary algorithm | Exported `resolveBoundedDocument` | D-14 says "using the v1 boundary"; reuse keeps it identical |
| Ledger field parsing | New markdown parsing | `collectSections` / `parseFields` in `verify-recon-gate.js` | Same D-13 shape, same duplicate-field rejection |
| Mid-session switch detection | Polling screenshots or colour diffs | `MutationObserver` counts, a stylesheet rule-count delta, a sentinel and a table marker (D-17) | styled-components CSSOM inserts produce no mutation records (PITFALLS 5) |
| Checksums | Anything custom | `sha256()` export | Hashes exact bytes [VERIFIED: sanitize-fixture.js:33-38] |

**Key insight:** every hard part of this phase (custody, scanning, inert parsing, table boundary, ledger parsing) already exists and is tested. The new code is tokenisation policy, a boundary kind, and registration, and it should stay small (D-21).

## Session State to Restore (live-state inventory)

This is not a rename phase, but the live session changes user-owned state that no repository change covers.

| Category | Items | Action Required |
|----------|-------|-----------------|
| Zendesk user setting | Appearance (Light / Dark / Match system) | Record the original at step 0; the user restores it at step 8 (D-20) |
| OS setting | macOS appearance (Light / Dark / Auto) | Record the original, including Auto; the user restores it at step 8 |
| Extension state | Zhroma 0.1.0 popup switch | Off for the session (D-15); the user restores the original |
| Tenant data | Personal recon view(s) | The user creates them at step 0 and deletes them at step 8. The handoff records the deletion |
| Page-local state | `data-zhroma-probe` markers, `window` sentinel, observers | The P5 read-back disconnects observers and removes markers; a reload clears everything |
| Private files | Raw captures plus denylist (outside every checkout) | Deleted after admission, or gpg-encrypted if kept (Phase 1 D-03) |

## Common Pitfalls

### Pitfall 1: A "small" manifest or ledger extension turns 1082 green tests red
**What goes wrong:** Adding to `manifest.fixtures` or using `## Ledger Entry:` fails `test/extension/*`, `corpus-provenance.test.js` and `recon-gate.smoke.js`, and blocks Phase 7's parity harness.
**How to avoid:** Use the separate `recon2Fixtures` array, the `## Recon 2 Entry:` prefix, and the block placed before Spec-less Planning Assumptions. Re-run `node scripts/verify-recon-gate.js final SELECTORS.md test/fixtures/manifest.json` and expect `FINAL VERDICT: proceed` (baseline output, run this session).
**Warning signs:** `entryCount` is no longer 18; `fixtureCount` is no longer 3; `scenario-not-admitted` or `verdict-not-final-section` appears.

### Pitfall 2: The raw capture is rejected before sanitisation
**What goes wrong:** An outerHTML copied from the Elements panel carries `href` (subject links), `src` (avatars), `style` with `url()` and `xlink:href` (svg `<use>`). `assertSafeToParse` rejects with `resource-bearing-attribute`, and nothing is admitted.
**Why it happens:** Phase 1's "one-way in-page structural projection" [VERIFIED: 01-05-SUMMARY.md:24, 95] was never recorded as a reusable snippet.
**How to avoid:** Put a projection snippet in the run sheet. The user pastes it into DevTools. It clones `[data-zhroma-probe="capture"]` detached, removes script/style/link/meta/iframe/object/embed/base/form/template, keeps only rule-mode attribute names plus `aria-*`, removes the marker, rebuilds `wrapper(shallow) > table(deep)` for tables, and ends with `copy(clone.outerHTML)`. It returns only an element count.

### Pitfall 3: Private paths inside a checkout or worktree
**What goes wrong:** `sanitizeFixture` resolves the project root from the module location (`findGitWorktreeRoot(MODULE_DIRECTORY)`) [VERIFIED: sanitize-fixture.js:69-83, 232]. If execution runs in a git worktree nested under the main checkout, a private file under the main checkout is "outside the worktree" and is accepted. `.gitignore` already lists `*.private.html`, `*.denylist.txt` and `private-capture/` [VERIFIED: .gitignore], which invites in-repo placement.
**How to avoid:** Run the live-session plan from the main checkout, not a worktree (`use_worktrees: true` is set in config). Put private files in a directory outside every checkout, for example under the user's home directory. [ASSUMED: where GSD places agent worktrees]

### Pitfall 4: A short denylist form fails admission falsely
**What goes wrong:** The denylist scan is a case-folded substring test (`foldedContent.includes(token)`) [VERIFIED: sensitive-patterns.js:119-124]. A short form such as a two-letter first name matches inside preserved vocabulary (for example inside "Normal"), and admission fails with `sensitive-residual`. An entry equal to a token prefix (`TEXT`, `PERSON`, `DATE`) rejects everything.
**How to avoid:** The denylist carries full display-name forms. The run sheet warns about entries of 3 characters or fewer and token-like words. A fail-closed rejection is recorded, never bypassed.

### Pitfall 5: The recorder cannot be read back
**What goes wrong:** A `window` sentinel or observer created in one evaluation may not be visible to the next, depending on how Claude in Chrome evaluates (main world, or an isolated or fresh context). [ASSUMED] The switch observation is then empty or reads as `reloaded: true` when it was not.
**How to avoid:** Step 0 runs a two-call persistence check (set a `window` property, read it back). If persistence fails, switch the recorder to the DevTools-paste path (the console context persists until reload). Also mark reload with a DOM attribute on `documentElement`, which is shared across worlds and cleared by a reload.

### Pitfall 6: Noise read as a switch
**What goes wrong:** Views auto-refresh and relative times tick. Hover can also cause attribute churn. Mutation counts after a switch then include unrelated records.
**How to avoid:** P4 records a quiet baseline window (for example 20 s) before the user switches, and P5 reports deltas against it. Count per target kind (`html`, `head`, `body`, `table`) and record attribute *names* only.

### Pitfall 7: The colour grammar rejects dark values
**What goes wrong:** The Phase 1 paint grammar admits only `transparent`, `rgb()` and `rgba()` [VERIFIED: interaction-evidence.js:37-42]. A dark palette built with modern colour functions may serialise differently. [ASSUMED]
**How to avoid:** Record the computed strings verbatim in the Recon 2 entries. Do not route `dark-native-states` through `assessInteractionEvidence`, which parses only the Phase 1 entry anyway (`namedEntry` looks up `## Ledger Entry: interaction-and-sticky-states`, lines 66-79). Phase 8 does the contrast arithmetic.

### Pitfall 8: Keyboard focus opens a ticket
**What goes wrong:** Enter or Space on a focused row opens a ticket. Recon 1's Execution Safety Note records an unintended navigation from injected keys [VERIFIED: SELECTORS.md:267-274].
**How to avoid:** The user presses Tab only (D-18). Claude never sends keys. If focus never reaches the table safely, the entry is `not observed` with a Phase 8 fallback, and the phase does not block.

### Pitfall 9: Identity picks the wrong "me"
**What goes wrong:** The first avatar with a name found is a requester, a colleague's presence indicator or the view title (PITFALLS 7).
**How to avoid:** Use probe P2's name-free method. The user selects the checkbox of a ticket they know is theirs (precondition c). The probe reads that row's Assignee string **inside the page**, then searches only candidate scopes outside the ticket table (landmarks, `[role="menu"]`, `[data-garden-id^="avatars"]`, buttons with `aria-label`/`title`). It returns candidate descriptors (tag, garden or test id, carrying attribute *name*, difference kind) and hit counts, never strings. The user confirms visually which candidate is the top-bar avatar.

## Code Examples

Probe values that appear below and are quoted from repository files: the table selector `table[data-garden-id="tables.table"][data-test-id="generic-table"]`, ticket rows `[data-garden-id="tables.row"][data-test-id="generic-table-row"]`, header cells `data-garden-id="tables.header_cell"`, cells `data-garden-id="tables.cell"`, pane `DIV[data-garden-id="pane"]` [VERIFIED: SELECTORS.md:73, 145]. Zhroma's stamp is `const PRIORITY_ATTRIBUTE = 'data-zhroma-priority';` [VERIFIED: extension/content.js:4]. The marker attribute `'data-zhroma-probe'` is a preserved attribute [VERIFIED: sanitized-output-contract.js:25]. Everything else in these probes is a proposal [ASSUMED] for the run sheet.

### P0: Preconditions and the Zhroma-off check (read-only)
```js
(() => ({
  topFrame: window === window.top,
  htmlLang: document.documentElement.lang || null,
  filterPath: /^\/agent\/filters\/[^/]+$/.test(location.pathname),
  zhromaStamps: document.querySelectorAll('[data-zhroma-priority]').length,   // must be 0 (D-15)
  ticketTables: document.querySelectorAll('table[data-garden-id="tables.table"][data-test-id="generic-table"]').length,
}))()
```

### P3: One appearance cell (D-16), with no colour Zhroma could paint
```js
(() => {
  const html = document.documentElement, body = document.body;
  const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]');
  const pane = table?.closest('[data-garden-id="pane"]');
  const header = table?.querySelector('thead [data-garden-id="tables.header_cell"]');
  const cell = table?.querySelector('tbody tr[data-garden-id="tables.row"][data-test-id="generic-table-row"] > [data-garden-id="tables.cell"]');
  const cs = (el) => (el ? getComputedStyle(el) : null);
  const MODE = /dark|light|theme|scheme|mode/i;
  const modeTokens = (el) => [...el.classList].filter((c) => MODE.test(c));
  const modeValues = (el) => el.getAttributeNames()
    .filter((n) => /^(light|dark|system|auto)$/i.test(el.getAttribute(n) ?? '')).map((n) => `${n}=${el.getAttribute(n).toLowerCase()}`);
  return {
    htmlColorScheme: cs(html).colorScheme, bodyColorScheme: cs(body).colorScheme,
    metaColorScheme: document.querySelector('meta[name="color-scheme"]')?.getAttribute('content') ?? null,
    htmlAttributeNames: html.getAttributeNames(), bodyAttributeNames: body.getAttributeNames(),
    htmlModeClassTokens: modeTokens(html), bodyModeClassTokens: modeTokens(body),
    modeAttributeValues: [...modeValues(html), ...modeValues(body)],
    prefersDark: matchMedia('(prefers-color-scheme: dark)').matches,
    paneBackground: cs(pane)?.backgroundColor ?? null,
    headerCellBackground: cs(header)?.backgroundColor ?? null, headerCellText: cs(header)?.color ?? null,
    ticketCellText: cs(cell)?.color ?? null,                       // text colour only, never a background
    zhromaStamps: document.querySelectorAll('[data-zhroma-priority]').length,
  };
})()
```

### P4 / P5: Switch recorder (D-17). Install before the switch, read back after it
```js
// P4 install
(() => {
  const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]');
  const ruleCount = () => [...document.styleSheets].reduce((n, s) => { try { return n + s.cssRules.length; } catch { return n; } }, 0);
  const counts = { html: {}, head: {}, body: {}, table: {} };
  const bump = (k, type, attr) => { const c = counts[k]; c[type] = (c[type] ?? 0) + 1; if (attr) (c.attrNames ??= new Set()).add(attr); };
  const where = (t) => (t === document.documentElement ? 'html' : t === document.body ? 'body'
    : document.head.contains(t) ? 'head' : 'table');
  const observer = new MutationObserver((list) => list.forEach((r) => bump(where(r.target), r.type, r.attributeName)));
  observer.observe(document.documentElement, { attributes: true });
  observer.observe(document.head, { childList: true, subtree: true });
  observer.observe(document.body, { attributes: true, childList: true });
  observer.observe(table, { attributes: true, childList: true, subtree: true });
  table.setAttribute('data-zhroma-probe', 'recon2-table');
  document.documentElement.setAttribute('data-zhroma-probe', 'recon2-sentinel');
  window.__zhromaRecon2 = { observer, counts, rules: ruleCount(), sheets: document.styleSheets.length, ruleCount };
  return { installed: true, rules: window.__zhromaRecon2.rules };
})()
// P5 read back (also removes markers and disconnects)
(() => {
  const r = window.__zhromaRecon2;
  const sentinel = document.documentElement.getAttribute('data-zhroma-probe') === 'recon2-sentinel';
  if (!r || !sentinel) return { reloaded: true };
  const marked = document.querySelector('[data-zhroma-probe="recon2-table"]');
  const current = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]');
  r.observer.disconnect();
  const out = { reloaded: false, tableRemounted: !marked || marked !== current,
    ruleDelta: r.ruleCount() - r.rules, sheetDelta: document.styleSheets.length - r.sheets,
    counts: Object.fromEntries(Object.entries(r.counts).map(([k, c]) => [k, { ...c, attrNames: [...(c.attrNames ?? [])] }])) };
  marked?.removeAttribute('data-zhroma-probe'); document.documentElement.removeAttribute('data-zhroma-probe');
  delete window.__zhromaRecon2;
  return out;
})()
```

### P6: Dark focus after Tab only (D-18)
```js
(() => {
  const a = document.activeElement;
  const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]');
  const s = getComputedStyle(a);
  return { inTable: Boolean(table?.contains(a)), tag: a.tagName, garden: a.getAttribute('data-garden-id'),
    test: a.getAttribute('data-test-id'), focusVisible: a.matches(':focus-visible'),
    outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} offset ${s.outlineOffset}`, boxShadow: s.boxShadow,
    rowBoxShadow: a.closest('tr') ? getComputedStyle(a.closest('tr')).boxShadow : null };
})()
```
Re-run the Phase 1 `interaction-and-sticky-states` probe [VERIFIED: SELECTORS.md:168] and `sticky-header-state` probe [VERIFIED: SELECTORS.md:156] verbatim in dark mode. The `stable-identifiers` [VERIFIED: SELECTORS.md:72] and `root-chain` [VERIFIED: SELECTORS.md:60] probes use free variables `boundary` and `row`, so the run sheet must supply self-contained versions that define them first.

### P2 (sketch): Name-free identity comparison (D-08, D-09)
```js
(() => {
  const norm = (s) => (s ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim();  // \s covers NBSP in JS
  const kind = (a, b) => !a || !b ? 'not-comparable' : a === b ? 'identical'
    : a.toLowerCase() === b.toLowerCase() ? 'case-only'
    : a.replace(/\s/gu, '') === b.replace(/\s/gu, '') ? 'whitespace-only'
    : (a.startsWith(b) || b.startsWith(a)) ? 'prefix' : 'different';
  // assigneeIndex: from header labels (allowlisted "Assignee"); own row: the user-selected checkbox row
  // candidates: elements OUTSIDE the ticket table in landmark/menu/avatar scopes, reading alt/aria-label/title/text
  // return only: { selectedRows, assigneeRenders: 'text'|'avatar-label'|'both', candidates: [{ tag, garden, test,
  //   carrier: 'alt'|'aria-label'|'title'|'text', presentAtLoad, difference: kind(...), wordCountClass }] }
})()
```

### Rule-mode CLI invocation (planned)
```bash
node scripts/sanitize-fixture.js --input "$PRIVATE/light.private.html" \
  --output test/fixtures/zendesk-recon2-light-columns.html \
  --denylist "$PRIVATE/capture.denylist.txt" --mode rule-columns
# stdout: SANITIZE_FIXTURE_OK <sha256>   (existing success line, sanitize-fixture.js:321)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| v1: every non-Priority text becomes `TEXT-nnn` per text node; `title`/`alt`/`datetime` dropped | Rule-column mode: per-distinct-value, kind-labelled tokens; `title`/`alt` kept tokenised; synthetic `datetime` | This phase | Phase 9 tests can assert equality, emptiness and "is any of" on real cell shapes |
| Phase 1: single `## Final Verdict` gate over 15 required ids | Plus a namespaced Recon 2 section with its own verdict and 8 ids | This phase | Phase 1 verdict and tests untouched |

**Deprecated/outdated:** nothing is deprecated. The v1 mode stays the default.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Tags cannot be added as a view column (a Zendesk employee said so in 2022; not re-verified in 2026) | Summary, Open Q1 | If Tags *is* offered, the run sheet must include it. If not, SC 3's "Tags" cannot be met literally and needs user acceptance |
| A2 | DevTools `copy()` is available in the console but not to Claude in Chrome evaluations | Supporting stack, Pitfall 2 | If Claude could copy, the user step shrinks; no safety impact |
| A3 | Whether Claude in Chrome evaluations share state across calls | Pitfall 5 | The recorder read-back fails; the DevTools fallback is needed |
| A4 | GSD worktrees may live under the main checkout | Pitfall 3 | A private file could be accepted inside the main repo |
| A5 | Token names (`PERSON-SELF`, `PERSON-SELF-ALT`, `LABEL-`, `FIELD-`), the `self:` denylist directive, synthetic `datetime` literals, closed-enum ledger fields, the `recon2Fixtures` key and entry keys | Patterns 1–3 | Discretion items; wrong names only cost renames |
| A6 | "Capture set" means one fixture file (numbering per file); only the identity token is cross-file | Pattern 1 | If cross-file value equality is wanted, the sanitiser needs a multi-input invocation or a private mapping file |
| A7 | Dark computed colours may serialise outside `rgb()`/`rgba()` | Pitfall 7 | Only affects whether a grammar check is added |
| A8 | Standard header spellings ("Requester", "Updated", "Requested" and so on) and placeholders | Pattern 1 | The allowlist constants are edited after step 1 of the session, before sanitising |
| A9 | Garden chrome scopes for identity candidates (`[data-garden-id^="avatars"]`, landmarks, `[role="menu"]`) | P2 | The probe misses the name; the entry ends `not observed` with the IDENT-03 fallback |

## Open Questions (RESOLVED)

All five questions are settled. Each one records the decision or the plan step that settles it.

1. **Tags as a column (RECON-06 / SC 3). RESOLVED.**
   - What we know: a Zendesk employee answer says "it's not possible to add Tags as a column". The help centre says "Multi-select fields are not supported" as columns.
   - What's unclear: whether this still holds on the user's tenant in 2026.
   - Recommendation: precondition step 0 checks the column picker. If Tags is absent, `referenced-cell-representation` records `tags-column: not-offered`, and the fallback states that Tags rules resolve no header (RULE-07 inactive) while RULE-F2 stays deferred. **The planner should surface this to the user as an SC 3 wording confirmation, not decide it silently.**
   - Resolution: the question was put to the user during plan-phase, and they chose "Check live, accept not-offered". This is recorded as CONTEXT **D-26** (decided at plan time, 2026-09-25). A live-confirmed `tags-column: not-offered`, with its fallback (Tags rules resolve no header, RULE-07 inactive for Tags, RULE-F2 deferred), meets SC 3 and RECON-06 for Tags and does not block the phase. The plans carry this through:
     - 06-02 Task 1: the gate accepts `not-offered` only with a `tags-fallback` that names both RULE-07 and RULE-F2, and requires a `tags-cell` for `observed`.
     - 06-02 Task 2: adds the D-26 note under ROADMAP.md Phase 6 success criterion 3 and under REQUIREMENTS.md RECON-06.
     - 06-02 Task 3: the run sheet's step 0 checks the column picker and records `tags-offered`.
     - 06-03 Task 1: the user confirms the answer live during the session.
2. **Evaluation persistence in Claude in Chrome. RESOLVED.**
   - Recommendation: a step-0 check. If it fails, run P4/P5 through DevTools paste.
   - Resolution: 06-02 Task 3 puts the probes `P0-persistence-set` and `P0-persistence-read` in the run sheet. Together they set, then read back as booleans, a window property and a `data-zhroma-probe` attribute on `documentElement`. The result decides whether P4 and P5 run through Claude in Chrome or in DevTools. In step 0, 06-03 Task 1 records the answer as `probe-path`. When `probe-path` is `devtools`, Claude hands the user each probe to paste into DevTools.
3. **Recon 2 fixture count when dark mode is not offered. RESOLVED.**
   - What we know: D-24 makes "not offered" a block for Phase 8 only; D-14 lists three fixtures.
   - Recommendation: the gate requires light-table plus identity-region always, and the dark table only when `dark-mode-offered: yes`.
   - Resolution: 06-02 Task 1 defines which fixtures are eligible:
     - `rules-light-table`: always.
     - `rules-identity-region`: unless `identity-source` is `not-found`.
     - `rules-dark-table`: only when dark mode is offered and `garden-identifiers` is `hold`.

     The Recon 2 Verdict records `fixture-light-table`, `fixture-identity-region` and `fixture-dark-table`. Each is `admitted`, `rejected` or `not-required`, and `not-required` is accepted only for an ineligible scenario. With `dark-mode-offered: no`, the gate requires `block` plus `phase-8` and only the light-table and identity-region fixtures. 06-03 Task 2 fills these fields from the actual admissions.
4. **Allowlist spellings are known only mid-session. RESOLVED.**
   - Recommendation: the session plan includes a small, reviewed edit to the `rule-column-contract.js` allowlist constants after step 1 (header labels, placeholders, each with a ledger note per D-11). Tests re-run before sanitising. Raw files stay private until admission.
   - Resolution: after step 1, 06-03 Task 1 edits only `DEFAULT_RULE_VOCABULARY` in `scripts/rule-column-contract.js`, per D-11. That means header labels, Status values, Type values, the DATE label, and only the placeholders the session actually showed. Each change goes in `vocabulary-notes`, and `vocabulary` is set to `confirmed-from-session`. The two rule-column Vitest files are re-run before any capture is trial-sanitised. The task's verify command must print `VOCABULARY_ONLY_EDIT`, which proves nothing outside the vocabulary object changed. 06-01 Task 1 builds its synthetic test labels from `DEFAULT_RULE_VOCABULARY`, so a spelling correction needs no test edit. Raw captures stay in the private directory until 06-03 Task 2 admits them (D-20).
5. **Grouping by Assignee (PITFALLS 7: the Assignee value may appear only in group rows). RESOLVED.**
   - Recommendation: out of scope for the one-hour budget; the recon view stays ungrouped. Optionally a one-line note if the user already has such a view.
   - Resolution: out of scope for Phase 6. The run sheet's step 0 (06-02 Task 3) creates the recon view ungrouped, which keeps the session to one sitting. The optional note is not planned, and no group-row capture happens in this phase.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Sanitiser, gate, tests | ✓ | v26.8.2 | — |
| npm | `npm run test:recon` | ✓ | 11.19.1 | Direct `node` commands |
| vitest / happy-dom (installed) | Tests, inert parsing | ✓ | 4.1.11 / 20.13.1 | — |
| git | Commits | ✓ | 2.50.1 | — |
| Google Chrome | Live session | ✓ (app present) | not probed | — |
| Claude in Chrome connection | Read-only probes | not probed from here | — | DevTools paste (D-03) |
| Zendesk tenant with Appearance offered | RECON-04 | not probed (by design) | — | None. Dark entries end blocked and Phase 8 is blocked (D-02, D-24) |
| gpg | Optional encrypted retention | ✓ | 2.5.22 | Delete raw files after admission |
| age | — | ✗ | — | gpg |

**Missing dependencies with no fallback:** a tenant that offers Appearance. That can only be checked by the user in step 0.

## Validation Architecture

> `workflow.nyquist_validation` is `false` in `.planning/config.json`. The orchestrator explicitly requested this section, so it is included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 (happy-dom env) plus `node:test` for `*.smoke.js` |
| Config file | `vitest.config.js` (`include: ['test/recon/*.test.js', 'test/extension/*.test.js']`) |
| Quick run command | `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/recon` (baseline: 4 files, 108 tests, about 1.4 s) and `node --test test/recon/*.smoke.js` (baseline: 65 tests) |
| Full suite command | `npm run test:recon` (baseline this session: 65 smoke plus 1082 Vitest in 24 files, all passing, about 18 s) |
| Gate regression | `node scripts/verify-recon-gate.js final SELECTORS.md test/fixtures/manifest.json` gives `FINAL VERDICT: proceed`; `node scripts/verify-recon-gate.js evidence SELECTORS.md` gives `EVIDENCE READY: 18 terminal entries` (both baseline outputs, this session) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RECON-06 | Rule mode keeps allowlisted labels and values only in their own column; tokenises per distinct value; kept `title`/`alt`/`aria-label` are tokenised; `datetime` is synthetic; resource attributes are still rejected pre-parse; CLI with 6 or 8 arguments | unit | `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/recon/rule-column-sanitizer.test.js` | ❌ Wave 0 |
| RECON-05 | The `self:` directive maps every repeat to the reserved token (text, `aria-label`, `title`, `alt`, any column); a second form maps to the ALT token; identity-region boundary accepts the LCA or button root and rejects nav/table/banner/oversize/missing token | unit | same file | ❌ Wave 0 |
| RECON-04/05/06 | Recon 2 gate: 8 ids required, `pending` rejected, `not observed` needs a consumer fallback, enum consistency, verdict computed from `dark-mode-offered`/`garden-identifiers`, CLI `recon2` value-free codes | unit (smoke) | `node --test test/recon/recon2-gate.smoke.js` | ❌ Wave 0 |
| RECON-06 | Admitted `recon2Fixtures`: checksum, contained path, scan before parse, rule-mode grammar, byte-identical rule-mode round trip | integration | `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/recon/recon2-corpus.test.js` | ❌ Wave 0 (fixtures arrive after the session) |
| D-10 / D-22 | v1 behaviour unchanged | regression | `npm run test:recon` plus the two gate commands above | ✅ existing |
| RECON-04/05/06 live facts | Appearance matrix, switch effects, identity location and difference, cell shapes | **manual-only** (live, user-driven session) | — : evidence is the ledger entries, checked structurally by the recon2 gate | n/a |

### What automation can and cannot prove
- **Automatable:** mode behaviour, grammar, custody, boundary kinds, idempotency, gate registration and consistency, fixture checksums, and v1 non-regression.
- **Human-only:** every live DOM fact, whether probes were run as written, whether the user restored settings and deleted views, and whether the chosen candidate is really the top-bar avatar. The gate can check only that each entry is complete and internally consistent, not that it is true. That is the same limit Phase 1 accepted.

### Sampling Rate
- **Per task commit:** the quick run commands.
- **Per wave merge:** `npm run test:recon` plus both Phase 1 gate commands.
- **Phase gate:** full suite green, `node scripts/verify-recon-gate.js recon2 SELECTORS.md test/fixtures/manifest.json` prints the Recon 2 verdict, and the Phase 1 `final` output is unchanged.

### Wave 0 Gaps
- [ ] `test/recon/rule-column-sanitizer.test.js`: synthetic captures (multi-column table with avatar `img alt`, `<time>`, tag chips, hidden spans, placeholder cells; identity region), written with the `createCase`/`expectRejected` helpers from `sanitize-fixture.test.js:76-111`
- [ ] `test/recon/recon2-gate.smoke.js`: synthetic Recon 2 ledgers, including a copy of the real `SELECTORS.md` with a synthetic Recon 2 block, to prove Phase 1 `final` still passes with the block present (`entryCount` 18)
- [ ] `test/recon/recon2-corpus.test.js`: added after admission. Before that, a test that `recon2Fixtures` is absent or an empty array must not fail the v1 suites
- [ ] No framework install is needed

## Security Domain

`security_enforcement: true`, ASVS level 1, block on `high`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | The user's own Zendesk session; Claude never handles credentials |
| V3 Session Management | no | Same |
| V4 Access Control | no | No new access surface |
| V5 Validation, Sanitization and Encoding | **yes** | Pre-parse `assertSafeToParse`, inert happy-dom parse, closed attribute classification (unknown attributes rejected), rule-mode output grammar, fail-closed codes |
| V7 Error Handling and Logging | **yes** | Value-free `SANITIZE_FIXTURE_REJECTED <code>` / `RECON_GATE_REJECTED <code>`; details only with `ZHROMA_RECON_DEBUG=1` [VERIFIED: verify-recon-gate.js:721-728; sanitize-fixture.js:318-329]. New codes follow the `/^[a-z]+(?:-[a-z]+)*$/u` shape the gate CLI enforces |
| V8 Data Protection | **yes** | D-04 probe discipline; tokens only in fixtures; denylist outside the worktree; raw captures deleted or gpg-encrypted; no screenshots through the tool |
| V12 Files and Resources | **yes** | `realpath` custody, `wx` write-once, manifest path containment and symlink rejection (reuse) |
| V6 Cryptography | minimal | SHA-256 via `node:crypto` for integrity only; gpg for optional retention (never hand-rolled) |

### Known Threat Patterns for this phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tenant PII (names, subjects, tags, ids, hostnames) enters git through newly kept `title`/`alt`/`aria-label`/`datetime` | Information disclosure | Tokenise or allowlist per column; synthetic `datetime`; `scanSensitiveContent` with denylist before write; digit-free identifier grammar; the rule-mode validator runs again at manifest time |
| The agent's name enters the transcript or repository | Information disclosure | In-page comparison only (D-09); name only in the private denylist (`self:` line); the reserved token in fixtures |
| Ticket content read by probes carries prompt-injection text into the model | Tampering / Elevation | Probes reduce in-page to enums, counts, colours and allowlisted vocabulary; no `textContent` or attribute values are returned (D-04) |
| An accidental live mutation or navigation (opening a ticket, changing a view) | Tampering | The user performs every interaction (D-03); probes are read-only; Tab only for focus (D-18); markers are page-local and removed |
| Active markup or a resource URL admitted in a fixture | Tampering | Unchanged pre-parse rejection plus the output-time `assertSafeToParse` and scan |
| Private path disclosure in CLI output | Information disclosure | Existing value-free CLI; paths never printed (tested) |
| A private file accepted inside a nested checkout | Information disclosure | Run the session plan in the main checkout; private dir outside every checkout (Pitfall 3) |
| A screenshot of the live page leaks ticket content | Information disclosure | None through the tool; user-cropped only if unavoidable (D-04, Phase 1 D-14) |

## Sources

### Primary (HIGH confidence; read this session)
- `scripts/sanitize-fixture.js`, `scripts/sanitized-output-contract.js`, `scripts/sensitive-patterns.js`, `scripts/fixture-contract.js`, `scripts/verify-recon-gate.js`, `scripts/interaction-evidence.js`: full reads
- `test/recon/sanitize-fixture.test.js`, `corpus-provenance.test.js`, `sanitized-output-contract.test.js`, `recon-gate.smoke.js` (lines 1-80, 240-639), `fixture-contract.test.js` (lines 80-170); `test/extension/initial-tint.test.js:10-35`, `runtime-contract.test.js:20-35`
- `test/fixtures/manifest.json`, the three fixture files (element, attribute and identifier profiles), `SELECTORS.md` (full), `extension/content.js` (grep), `package.json`, `vitest.config.js`, `.gitignore`, `.planning/config.json`
- `.planning/phases/06-live-dom-recon-2/06-CONTEXT.md`, `REQUIREMENTS.md`, `STATE.md`, `ROADMAP.md` §Phase 6, `01-CONTEXT.md` decisions, `01-05-SUMMARY.md`, `research/ARCHITECTURE.md` §4–5 and Anti-Patterns 3 and 9, `research/PITFALLS.md` 5/7/8, `research/SUMMARY.md` §Phase 6, `RETROSPECTIVE.md` Key Lessons
- Baseline runs this session: `node --test test/recon/*.smoke.js` (65 pass), full Vitest (1082 pass, 24 files), both Phase 1 gate CLI modes

### Secondary (seam-rated LOW; official vendor pages fetched directly)
- [Zendesk help: Creating views to build customized lists of tickets](https://support.zendesk.com/hc/en-us/articles/4408888828570-Creating-views-to-build-customized-lists-of-tickets): "add up to 15 columns"; "Multi-select fields are not supported"; "Agents can create views for their own personal use only."
- [Zendesk community: How do I add tags, light agent, or custom fields as a column in a View?](https://community.zendesk.com/fid-7/tid-14761): Zendesk employee, 2022-04-12: "it's not possible to add Tags as a column"

### Tertiary (LOW)
- [eesel AI: Zendesk view columns guide](https://www.eesel.ai/blog/zendesk-view-columns-customize): corroborates the 15-column limit and Tags not being a column (aggregator; not relied on alone)

## Metadata

**Confidence breakdown:**
- Repository seams (manifest, gate, sanitiser constraints): HIGH. Every constraint was read and quoted, and the baselines were run.
- Rule-mode and gate design: MEDIUM. The approach is grounded in the code, but the token and field names are discretion proposals.
- Live Zendesk facts (Tags column, identity scopes, colour serialisation, evaluation persistence): LOW. These are what the session exists to establish.

**Research date:** 2026-09-25
**Valid until:** 2026-10-25 for the repository findings, until any change to the listed scripts or tests. Zendesk facts hold until the live session.
