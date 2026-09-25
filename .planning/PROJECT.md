# Zhroma

## What This Is

Zhroma is a Chrome extension that colour-codes ticket rows in Zendesk agent views by priority, so an agent can see what's urgent at a glance instead of reading a column of plain text. It is published on the Chrome Web Store (0.1.0) and works with zero setup on English current Agent Workspace views on `*.zendesk.com`. It is aimed at support agents who live in Zendesk views all day. A toolbar icon shows whether tinting is working, whether the view lacks a Priority column, or whether the view can't be read, and the popup has one off/on switch.

## Core Value

Open a Zendesk view and know within one second which tickets are urgent — without reading a word.

## Current State

**Shipped:** v1.0 MVP, released as Zhroma 0.1.0. Submitted to the Chrome Web Store on 2026-09-14; the user reported it live and installable on 2026-09-25. Privacy policy: https://formax68.github.io/zhroma-privacy/. Store item `iaachnhcjjfcgkaohcafodoockhdmdbf`.

**Codebase:** 1,295 lines of hand-written runtime across six files (content script, service worker, popup, stylesheet, manifest) plus six PNG icons. Zero runtime dependencies and no build step. About 16,000 lines of test and evidence tooling. At close, 65 Node smoke tests and 1,082 Vitest tests pass.

**Known gaps:** At the v1.0 close, 16 of 32 v1 requirements were formally checked and the rest lacked complete human evidence (see `.planning/MILESTONES.md` and `.planning/milestones/v1.0-REQUIREMENTS.md`). On 2026-09-25, when starting v1.1, the user reported that they had run the remaining v1.0 UAT and that every check was passed or accepted. That is recorded as a user-reported acceptance. No per-check observation records were written, and the archived v1.0 files are left as they were at close.

## Current Milestone: v1.1 Themes & Rules

Ships to the Chrome Web Store as extension version **1.0.0**.

**Goal:** An agent can pick a well-known colour theme that reads correctly in both Zendesk light and dark mode, and write their own colouring rules on any column shown in the view. A fresh install still works immediately, with nothing to set up.

**Target features:**
- **Dark mode.** Zhroma detects Zendesk's own dark theme, including a switch mid-session, and its tints stay readable on it. Zhroma does not restyle Zendesk itself
- **Theme picker in the popup.** Presets from well-known editor themes (e.g. Tokyo Night, Catppuccin, Dracula, Nord, Gruvbox, Solarized) plus a colourblind-safe preset. Each theme defines named colour slots (red, green, blue…) and maps the four priorities onto them. Light and dark variants follow Zendesk's current mode automatically
- **Custom colouring rules on a new options page.** Conditions on any column shown in the view, combined with AND/OR groups, using operators such as equals, not equals, contains and is empty. Rules are ordered. Each rule's colour is either a theme slot, which re-colours when the theme changes, or a fixed custom hex
- **Per-rule effect.** A rule either replaces the priority tint (the first matching replace-rule wins) or adds a separate mark, such as a left-edge stripe, keeping the priority tint underneath
- **"Assignee is me".** The agent's identity is auto-detected from the signed-in Zendesk page and can be corrected by hand
- **Local storage with export/import.** Theme, rules and identity are stored on the device only (`chrome.storage.local`). Export/import to a file moves rules between machines
- **Zero-setup default preserved.** A fresh install looks and behaves exactly like 0.1.0: today's palette as the default theme, and no rules

## Business Context

- **Customer**: Zendesk support agents and their team leads — anyone who works out of Zendesk agent views daily
- **Revenue model**: None. Free public Chrome Web Store listing
- **Success metric**: The glance test — urgent tickets are identifiable in under a second, and agents keep the extension enabled
- **Strategy notes**: None

## Requirements

### Validated

- ✓ RECON-01: Three live-derived sanitized fixtures admitted for offline testing, with explicit repository-byte re-admission provenance — Phase 01.
- ✓ RECON-02: English-path DOM assumptions recorded with evidence; localization explicitly outside the verified scope — Phase 01.
- ✓ RECON-03: Observed ticket rows reach the top Document directly and current Garden identifiers are present — Phase 01.

- ✓ Header-derived exact-English priority detection and distinct translucent direct-cell tints on initial supported view loads — Phase 02.
- ✓ Native-state/readability and column-reordering acceptance in tested light-interface views — Phase 02.
- ✓ Static minimal-permission manifest and source-bound unpacked loading — Phase 02.
- ✓ Public Chrome Web Store listing (STORE-01): user-reported live and installable on 2026-09-25 — v1.0
- ✓ Published privacy policy linked from the listing (STORE-04), byte-matched over anonymous HTTPS — v1.0

Phase 01 acceptance includes historical approval-risk acceptance AR-01-13; package approval independence remains not-attested.

These shipped in 0.1.0. The user reported on 2026-09-25 that all remaining v1.0 UAT was passed or accepted (user-reported acceptance; no per-check records):

- ✓ Liveness through sort, refresh, view switch, pagination, scroll and tab return (DETECT-03/04, LIVE-01–04) — v1.0, user-reported accepted
- ✓ No perceptible slowdown (LIVE-05) and page left untouched on failure (FAIL-04) — v1.0, user-reported accepted
- ✓ Missing-column hint and the off/on switch (FAIL-02, CTRL-02–04) — v1.0, user-reported accepted
- ✓ Three-way diagnosis and toolbar state (FAIL-01, FAIL-03, FAIL-05) — v1.0, user-reported accepted
- ✓ Pre-submission smoke checklist (STORE-06) — v1.0, user-reported accepted

### Active

Milestone v1.1 Themes & Rules. Detailed REQ-IDs are in `.planning/REQUIREMENTS.md`.

- [ ] Tints stay readable in Zendesk's dark mode, including a theme switch mid-session
- [ ] Agent can choose a colour theme from well-known presets, including a colourblind-safe one, from the popup
- [ ] Themes define named colour slots with light and dark variants that follow Zendesk's current mode
- [ ] Agent can create, edit, reorder and delete colouring rules on an options page
- [ ] Rules test any column shown in the view, with AND/OR groups of conditions
- [ ] Each rule's colour is a theme slot or a fixed custom hex; each rule either replaces the tint or adds a mark
- [ ] "Assignee is me" works from an auto-detected identity the agent can correct
- [ ] Settings are stored on the device only and can be exported to and imported from a file
- [ ] A fresh install behaves exactly like 0.1.0, with no setup
- [ ] Released publicly as extension 1.0.0

### Out of Scope

- **Restyling Zendesk itself (a Zhroma dark mode or whole-UI theme)** — v1.1 themes recolour only Zhroma's own tints and marks, and dark mode means following Zendesk's native dark theme. Restyling the host UI would mean fighting Zendesk's entire stylesheet
- **Rules on fields that aren't shown as view columns** — rules read only rendered columns, the same model as Priority. Covering hidden fields needs the Zendesk API, auth and broader permissions
- **Fetching priority or rule data from the Zendesk API** — rejected in v1 and still rejected. It needs auth handling and a heavier permissions ask at store review, in exchange for covering views the agent can fix themselves by adding a column
- **Syncing settings through `chrome.storage.sync`** — rules can contain agent names and custom field values, and syncing would route them through the user's Google account. Export/import to a file covers moving between machines while keeping everything on-device
- **Coloured priority pill treatment** — still deferred. v1.1 adds the left-edge-stripe-style mark as a per-rule effect only
- **Localised priority strings (REACH-01)** — still deferred. The three-way diagnosis already keeps non-English agents from being told a column is missing
- **Colouring the open ticket page, tab strip, search results, and org/user ticket lists** — scoped to agent views only, which is where the scanning pain actually lives
- **Firefox, Edge, Safari ports** — Chrome first; other browsers only if there's demand

## Context

- The problem is not that priority is missing from Zendesk — it's that priority is rendered as plain text with no visual weight, and is often scrolled off to the right in wide views. The information is present but invisible under time pressure.
- Zendesk agent views only render the columns a view is configured with. A view that omits Priority gives the extension nothing to read. This is a known, accepted gap in v1 — the hint turns a silent no-op into a one-click fix the agent performs themselves in Zendesk view settings.
- The Zendesk agent interface is a dynamic single-page app: rows are re-rendered on sort, refresh, view switch and scroll. Any implementation that tints once on page load will appear broken within seconds. Re-application on DOM change is a hard requirement, not a nicety.
- Publishing publicly means the extension must be defensible at Chrome Web Store review: narrow host permissions, no remote code, a clear justification for every permission requested, and a privacy policy — even though the extension collects nothing.
- Zendesk owns the DOM this extension reads. Selector fragility is the standing risk for the life of the project: a Zendesk front-end change can break tinting without warning, and the extension must fail quietly (page untouched) rather than loudly (page broken).
- v1.0 shipped as 0.1.0. Phases 1 and 2 closed with verification passed. Phases 3 and 4 shipped with verification `human_needed` after the user chose to skip the remaining UAT. Phase 5 was finished outside GSD; `release/PUBLISHING-STATUS.md` is its record.
- The runtime grew from the planned ~300-line single content script to 1,295 lines, with a service worker and a toolbar action. The three-way toolbar state and the popup switch needed the `background` and `action` keys the original stack guidance said to omit. The permission surface did not grow: it is still `storage` only.
- Evidence binds to bytes. Live observations apply only to the shipped bytes they were taken on, and Phase 4 acceptance reads pinned Git blobs. This made acceptance trustworthy and also expensive: every shipped-byte change reopens human checks.
- A consent-applicability question from Chrome's user-data policy (`release/policy-applicability.md`) was open at submission. If the store review didn't raise it, that isn't a ruling.

## Constraints

- **Tech stack**: Chrome Extension Manifest V3 — MV2 is no longer accepted by the Chrome Web Store
- **Platform**: Chrome only for v1
- **Permissions**: As narrow as possible — host access scoped to `*.zendesk.com`, no API tokens, no remote code, nothing that complicates store review. Frozen at `storage` only since Phase 2; any change triggers extended review on every later update
- **Setup**: Zero configuration. It must work correctly the moment a stranger installs it, with no options to set first. From v1.1 themes and rules are optional refinements; the defaults must reproduce 0.1.0 exactly
- **Dependency**: Reads Zendesk's own rendered DOM, which Zendesk can change at any time without notice. From v1.1 this includes the rendered identity of the signed-in agent and any column a rule references
- **Privacy**: Ticket data never leaves the browser. No telemetry, no network calls, nothing stored off-device — this is both an ethical line and what makes the store listing simple. From v1.1 rules and identity stay in `chrome.storage.local`; an export file is written only when the agent asks for one

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full-row tint for v1, other treatments deferred | One treatment ships faster and proves the glance test; stripe and pill become v2 config options once the core is validated | ✓ Good — shipped v1.0 as translucent direct-cell tints across the row |
| Hard-coded colours, no options page in v1 | Zero setup is the whole point of a public listing — an options page is a decision the user has to make before getting value | ✓ Good — shipped v1.0; the popup holds only the off/on switch. Revisited in v1.1: options become optional refinements over unchanged defaults |
| Read the Priority column rather than call the Zendesk API | Keeps permissions narrow and store review simple; the coverage gap is fixable by the agent in Zendesk itself | ✓ Good — `storage`-only manifest submitted and reported live |
| Show a hint when the Priority column is absent | Turns a silent failure into a self-service fix — the difference between "this extension is broken" and "add this column" | ✓ Good — shipped behind 100 ms mutation-quiet certainty; live checks passed; remaining judgment review user-reported accepted 2026-09-25 |
| Scope v1 to agent views only | That's where list-scanning under time pressure happens; the open ticket page already shows priority in context | ✓ Good — `/agent/*` matches only; ticket/dashboard isolation user-reported accepted 2026-09-25 |
| Tint all four priorities rather than High/Urgent only | Distinct tints make the whole list scannable, not just the hot rows | ✓ Good — shipped v1.0 |
| Any `*.zendesk.com` rather than a single subdomain | Required for a public listing — a stranger's subdomain is unknowable at build time | ✓ Good — passed store review (listing reported live) |
| Accessibility deferred, recorded rather than dropped | Conventional colours ship now; the colourblind-safe palette is logged in Out of Scope so it can't be quietly forgotten | — Pending — taken up in v1.1 as a colourblind-safe theme preset alongside dark mode |
| Bounded initial snapshot; ongoing liveness follows in Phase 3 | Direct-document controls passed; opening Zendesk then clicking a view and pagination require reapplication | ✓ Good — in-app entry and pagination passed live in Phase 03 |
| Source-bound acceptance with explicit report clarification | Avoid speculative runtime changes or confusing fresh tabs with direct view-document entry | 02-03 investigation-only closure, 2026-09-09 |
| English-only current Agent Workspace evidence boundary | Observations do not establish localization, legacy-shell, vanity-domain or cross-plan compatibility | Validated in Phase 01 |
| Garden selector pair with same-table header ownership | Current corpus proves the Garden strategy; unsupported fallback rungs cannot authorize implementation | Validated in Phase 01 |
| Re-admit existing sanitized bytes with explicit provenance and exact second-pass parity | Original captures are unavailable; repository history retains originals and checksums | User-approved, verified in Phase 01 |
| Accept historical approval-independence risk without inventing attestation | User explicitly accepted incomplete historical evidence; exact package versions remain pinned | AR-01-13, 2026-09-08 |
| Add a service worker and toolbar action for the three-way state and the switch | A toolbar state readable without opening anything (FAIL-05) needs `action`, and the tab-scoped state needs a worker | ✓ Shipped v1.0 — no new permission; runtime 4× the planned size |
| English family (`en`, `en-*`) is the supported language, encoded in both JS and CSS | `en-GB` is English; no build step means two encodings, held together by an agreement test | ✓ Good — Phase 04 |
| Evidence binds to shipped bytes; acceptance reads pinned Git blobs | An observation proves only the bytes it was taken on | ✓ Good for trust, ⚠️ costly — every byte change reopens UAT |
| Reading rendered page content counts as handling user data, so publish a privacy policy | Chrome user-data FAQ: local-only processing is not a disclosure exemption | ✓ Good — policy published; consent-applicability question still open |
| Ship 0.1.0 with Phase 3/4 at `human_needed` after the user skipped remaining UAT | The user judged the untested checks non-blocking for a free public listing | ✓ Resolved 2026-09-25 — user reported all remaining v1.0 UAT passed or accepted (user-reported, no per-check records) |
| Themes define named colour slots; rules reference a slot or a fixed hex | Borrowed from terminal themes: every well-known theme defines the same ANSI colour names, so switching theme re-colours rules coherently and light/dark variants resolve per slot | — Pending — v1.1 |
| Rule precedence is chosen per rule: replace the tint, or add a mark | Some rules should override priority (e.g. "assigned to me"); others should add a signal without hiding it | — Pending — v1.1 |
| Rules read rendered view columns only | Keeps the no-API, `storage`-only permission model; a rule on a hidden field is fixed by adding the column, as with Priority | — Pending — v1.1 |
| Settings stay in `chrome.storage.local`, with file export/import | Rules can hold names and field values; sync would route them through the user's Google account | — Pending — v1.1 |
| "Me" is auto-detected from the Zendesk page and editable | Keeps "assignee is me" zero-setup while surviving detection failure or DOM change | — Pending — v1.1 |
| Planning milestone v1.1 ships as extension 1.0.0 | Milestone labels continue the planning sequence; the store version marks the first feature-complete public release | — Pending — v1.1 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Business Context check — customer, revenue model, success metric still accurate?
4. Audit Out of Scope — reasons still valid?
5. Update Context with current state

---
*Last updated: 2026-09-25 after starting milestone v1.1 Themes & Rules*
