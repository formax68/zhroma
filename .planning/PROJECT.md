# Zhroma

## What This Is

Zhroma is a Chrome extension that colour-codes ticket rows in Zendesk agent views by priority, so an agent can see what's urgent at a glance instead of reading a column of plain text. It is published on the Chrome Web Store (0.1.0) and works with zero setup on English current Agent Workspace views on `*.zendesk.com`. It is aimed at support agents who live in Zendesk views all day. A toolbar icon shows whether tinting is working, whether the view lacks a Priority column, or whether the view can't be read, and the popup has one off/on switch.

## Core Value

Open a Zendesk view and know within one second which tickets are urgent — without reading a word.

## Current State

**Shipped:** v1.0 MVP, released as Zhroma 0.1.0. Submitted to the Chrome Web Store on 2026-09-14; the user reported it live and installable on 2026-09-25. Privacy policy: https://formax68.github.io/zhroma-privacy/. Store item `iaachnhcjjfcgkaohcafodoockhdmdbf`.

**Codebase:** 1,295 lines of hand-written runtime across six files (content script, service worker, popup, stylesheet, manifest) plus six PNG icons. Zero runtime dependencies and no build step. About 16,000 lines of test and evidence tooling. At close, 65 Node smoke tests and 1,082 Vitest tests pass.

**Known gaps:** 16 of 32 v1 requirements are formally checked. The rest are shipped but lack complete human evidence. Phase 3 and Phase 4 verification remain `human_needed`. See `.planning/MILESTONES.md` and `.planning/milestones/v1.0-REQUIREMENTS.md`.

## Next Milestone Goals

Not yet defined; run `/gsd-new-milestone`. Candidates, in rough order of cost to value:

1. **Close the v1.0 evidence gaps.** Most need one UAT session, not code: the Phase 3 isolation, cleanup and performance checks; the Phase 4 waived and deferred checks and the three flagged judgment prohibitions; public-install verification; and the consent-applicability question.
2. **Dark mode and a colourblind-safe palette** (APPR-03, APPR-04), done together as one palette job, as decided in v1.
3. **Localised priority strings** (REACH-01). This is the main reach limit. The three-way diagnosis already keeps non-English agents from being told a column is missing.

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

### Active

These shipped in 0.1.0 but their acceptance evidence is incomplete. They carry forward until verified.

- [ ] Liveness through sort, refresh, view switch, pagination, scroll and tab return (DETECT-03/04, LIVE-01–04). Satisfied in verification and passed live; not formally promoted
- [ ] No perceptible slowdown (LIVE-05) and page left untouched on failure (FAIL-04). Live performance and failure-cleanup checks are untested
- [ ] Missing-column hint and the off/on switch (FAIL-02, CTRL-02–04). All mapped live checks passed; three judgment prohibitions still need review
- [ ] Three-way diagnosis and toolbar state (FAIL-01, FAIL-03, FAIL-05). The non-English and structure-copy checks are waived or deferred
- [ ] Pre-submission smoke checklist run before each submission (STORE-06). The checklist exists; the 0.1.0 run ended `human_needed`

### Out of Scope

- **User-configurable colours** — deferred to v2. v1 ships hard-coded defaults so there is no colour options page and nothing to configure before it works; the separate default-on toggle stores one boolean. Still valid after v1.0: the popup has exactly one control
- **Alternative visual treatments (left-edge stripe, coloured priority pill)** — deferred to v2, where they become a configurable choice alongside custom colours. v1 commits to the full-row tint
- **Colouring the open ticket page, tab strip, search results, and org/user ticket lists** — v1 is scoped to agent views only, which is where the scanning pain actually lives
- **Fetching priority from the Zendesk API** — rejected for v1. It needs auth handling and a heavier permissions ask at store review, in exchange for covering views the agent can fix themselves by adding a column
- **Colourblind-safe / WCAG-audited palette** — acknowledged and deferred. v1 uses obvious, conventional colours; revisit if it becomes a real complaint
- **Firefox, Edge, Safari ports** — Chrome first; other browsers only if there's demand
- **Colour-coding by anything other than priority** (status, SLA breach, assignee, tags) — priority is the whole product for v1

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
- **Setup**: Zero configuration. It must work correctly the moment a stranger installs it, with no options to set first
- **Dependency**: Reads Zendesk's own rendered DOM, which Zendesk can change at any time without notice
- **Privacy**: Ticket data never leaves the browser. No telemetry, no network calls, nothing stored off-device — this is both an ethical line and what makes the store listing simple

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full-row tint for v1, other treatments deferred | One treatment ships faster and proves the glance test; stripe and pill become v2 config options once the core is validated | ✓ Good — shipped v1.0 as translucent direct-cell tints across the row |
| Hard-coded colours, no options page in v1 | Zero setup is the whole point of a public listing — an options page is a decision the user has to make before getting value | ✓ Good — shipped v1.0; the popup holds only the off/on switch |
| Read the Priority column rather than call the Zendesk API | Keeps permissions narrow and store review simple; the coverage gap is fixable by the agent in Zendesk itself | ✓ Good — `storage`-only manifest submitted and reported live |
| Show a hint when the Priority column is absent | Turns a silent failure into a self-service fix — the difference between "this extension is broken" and "add this column" | ⚠️ Revisit — shipped behind 100 ms mutation-quiet certainty; live checks passed, judgment review pending |
| Scope v1 to agent views only | That's where list-scanning under time pressure happens; the open ticket page already shows priority in context | ✓ Good — `/agent/*` matches only; ticket/dashboard isolation live checks still untested |
| Tint all four priorities rather than High/Urgent only | Distinct tints make the whole list scannable, not just the hot rows | ✓ Good — shipped v1.0 |
| Any `*.zendesk.com` rather than a single subdomain | Required for a public listing — a stranger's subdomain is unknowable at build time | ✓ Good — passed store review (listing reported live) |
| Accessibility deferred, recorded rather than dropped | Conventional colours ship now; the colourblind-safe palette is logged in Out of Scope so it can't be quietly forgotten | — Pending — v2 candidate (APPR-03/04) |
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
| Ship 0.1.0 with Phase 3/4 at `human_needed` after the user skipped remaining UAT | The user judged the untested checks non-blocking for a free public listing | — Pending — evidence gaps carried forward |

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
*Last updated: 2026-09-25 after v1.0 milestone*
