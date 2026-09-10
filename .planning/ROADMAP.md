# Roadmap: Zhroma

## Overview

Zhroma tints Zendesk ticket rows by priority so an agent knows what is urgent without reading. The route there is short but strictly ordered. Zendesk publishes no DOM contract for the agent-view ticket table, so the project opens with a reconnaissance spike against a live instance — not a deliverable, a gate, because one possible finding (a closed Shadow DOM around the ticket list) would end the approach entirely. With the DOM known, the thinnest possible vertical slice gets one real view tinted on first load, and freezes the three things that are cheap now and ruinous to retrofit: the permission set, the styling seam, and the palette. Sorting the view breaks that tint, deliberately, which is exactly the demo that motivates the liveness phase — the debounced observer that makes tinting survive sorting, refreshing, view switching and scrolling, and makes every failure path leave the page untouched. Then the extension learns to be honest: a three-way failure taxonomy on the toolbar icon so it never accuses an agent of a missing Priority column when the real problem is an unreadable locale, plus an on/off switch so a misfire during a screen share is a click rather than an uninstall. Finally it ships to the Chrome Web Store, where the direct predecessor of this product died — of a missing privacy policy, not of bad code.

**Ordering constraint:** Phase 1 gates everything. Three of the top four researched risks are decided by what it finds, and its findings can change the shape of Phases 2 through 4. Do not plan Phase 2 in detail before Phase 1 reports.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: DOM Recon Spike** - Answer every unverified DOM assumption against a live Zendesk instance before writing extension code (completed 2026-09-08)
- [x] **Phase 2: First Tint on a Real View** - The thinnest vertical slice: rows tinted on first load, with permissions, palette and styling seam frozen (completed 2026-09-09)
- [ ] **Phase 3: The Tint Survives Everything** - Sorting, refreshing, switching views and scrolling keep the tint correct; every failure leaves the page untouched
- [ ] **Phase 4: Honest Failure and an Off Switch** - Three distinguishable states on the toolbar, a hint that never lies, and a persistent on/off toggle
- [ ] **Phase 5: Published** - A public Chrome Web Store listing that survives review and tells an IT admin exactly what it does

## Phase Details

### Phase 1: DOM Recon Spike

**Goal**: Every DOM assumption needed for the English-only v1 path is answered against a live English Zendesk agent view. Localization-specific assumptions are explicitly excluded from this spike, while the two terminal DOM risks are still ruled in or out before implementation begins.
**Depends on**: Nothing (first phase)
**Requirements**: RECON-01, RECON-02, RECON-03
**Success Criteria** (what must be TRUE):

  1. A `SELECTORS.md` in the repo answers every English-path DOM item with a yes/no, the evidence behind it, and the fallback if the answer is no — including which element actually paints the row background and whether a locale-independent priority signal exists on the row or cell. Localization-only ledger items are explicitly marked outside Phase 1 rather than presented as verified.
  2. A captured `outerHTML` fixture of a real agent view is committed under `test/fixtures/`, and a test can load it and locate the ticket table and its header row with no Zendesk account present.
  3. Anyone reading the repo can state, from the recorded answers alone, whether a closed Shadow DOM wraps the ticket list and whether `data-garden-id` is present on rows in a current agent view — the two answers that decide whether the project proceeds as designed.
  4. The recon was performed in the English agent UI only. `SELECTORS.md` records the observed page-language signal, but Phase 1 makes no claim that it works across UI languages.

**Plans**: 15/15 plans executed (8 original plans and 7 gap-closure plans); verification passed: 23/24 verified plus one explicitly accepted historical approval exception (AR-01-13)

Plans:

- [x] 01-06-PLAN.md
- [x] 01-07-PLAN.md
- [x] 01-08-PLAN.md

**Wave 1**

- [x] 01-01-PLAN.md — Build the offline evidence-ledger tracer and fail-closed admission policy.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Clear package legitimacy and authenticated English-session human gates.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — Install approved test tooling and build the one-way sanitizer/fixture harness.

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-04-PLAN.md — Resolve static live DOM questions and pause at the authenticated interaction seam.

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 01-05-PLAN.md — Admit sanitized fixtures and issue the explicit Phase 2 proceed/block verdict.

#### Gap closure *(after 01-VERIFICATION.md recorded 10/15 and `gaps_found`)*

**Gap Wave 1**

- [x] 01-09-PLAN.md — Tracer: one shared fail-closed sensitive-data policy seam under `scripts/`, Unicode-normalizing, with value-free CLI error codes (CR-02, CR-11, WR-01, WR-03).
- [x] 01-10-PLAN.md — Auditable exact-version package approval record for the uncertain truth 8.

**Gap Wave 2** *(blocked on Gap Wave 1)*

- [x] 01-11-PLAN.md — Sanitizer fails closed on unfiltered-child Priority derivation and denylist custody; shared sanitized-output grammar extracted (CR-01, CR-03, CR-04 producer).

**Gap Wave 3** *(blocked on Gap Wave 2)*

- [x] 01-12-PLAN.md — Re-admit the three committed fixtures to the current sanitizer contract and rewrite manifest provenance and hashes (CR-04 corpus).

**Gap Wave 4** *(blocked on Gap Wave 3)*

- [x] 01-13-PLAN.md — Corpus admission proves Priority absence and three distinct canonical files (CR-04 enforcement, CR-05, CR-06, WR-02).

**Gap Wave 5** *(blocked on Gap Wave 4)*

- [x] 01-14-PLAN.md — Per-ID evidence contract and production-owned interaction paint grammar (CR-07, CR-09).

**Gap Wave 6** *(blocked on Gap Wave 5)*

- [x] 01-15-PLAN.md — Structured per-rung fallback evidence, parsed declared gate inputs, and a verdict with nothing contradicting it (CR-08, CR-10).

### Phase 2: First Tint on a Real View

**Goal**: As a support agent using an English Zendesk view, I want to see every ticket row tinted by its priority on first load with no setup and the permission set, palette and styling seam settled, so that I can identify urgent work at a glance.
**Goal scope (original wording retained)**: On a real Zendesk agent view, with nothing configured after install, every ticket row is tinted by its priority on first load — and the permission set, the palette and the styling seam are settled permanently.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: DETECT-01, DETECT-02, TINT-01, TINT-02, TINT-03, TINT-04, TINT-05, CTRL-01, STORE-02, STORE-03, STORE-05
**Success Criteria** (what must be TRUE):

  1. Loading a real Zendesk agent view with the extension installed shows every ticket row carrying the tint for its priority, with the four values visually distinct at a glance — and nothing was configured first.
  2. Reordering the view's columns so Priority sits somewhere else leaves the tinting correct, because the column is found by its header rather than its position.
  3. Hovering a row, selecting rows for a bulk action, and unread/bold rows all read the way they do without the extension installed, and ticket text is legible over all four tints.
  4. Changing a product tint requires a stylesheet edit only. No shipped extension JavaScript contains product palette values or writes CSS. Recon evidence parsers/tests retain observed colour strings outside the runtime asset boundary.
  5. `manifest.json` has no `host_permissions` block, declares `storage` as its only permission, and matches `https://*.zendesk.com/agent/*` and nothing else; the loaded extension folder is byte-for-byte the repo source.

**Plans**: 3/3 closed out; 02-03 was investigation-only after explicit report clarification. Eleven live checks and twelve decisions passed. Independent goal verification passed 25/25; security reassessment closes all ten planned threats; code review clean.

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Loadable initial-tint tracer with atomic English-table validation and runtime regressions (Wave 1).

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Source-bound acceptance complete; UAT now has eleven live passes (Wave 2; depends on 02-01).

**Gap Wave 3** *(depends on 02-01 and 02-02)*

- [x] 02-03-PLAN.md — Investigated and reclassified G-02-1 to Phase 3 after user clarified both reports; direct-document controls passed, no runtime change.

UAT update (2026-09-09): eleven live checks and all twelve specification/prohibition decisions passed; G-02-1 reclassified by explicit user clarification.

**UI hint**: yes
**Known gap**: sorting the view visibly clears the tint. Intentional and accepted here — closed in Phase 3.
**UAT follow-up**: Next-page pagination also clears tint; explicitly cover Next/Previous navigation in Phase 3. G-02-1 also describes opening Zendesk then clicking a view, including in a fresh tab; explicitly cover landing-page-to-view entry in Phase 3. Direct-view document controls passed.

### Phase 3: The Tint Survives Everything

**Goal**: As a support agent using English Zendesk views, I want to keep priority tinting correct through everyday view interactions without perceptible slowdown and leave the page untouched whenever tinting cannot work, so that I can reliably identify urgent tickets without disrupting Zendesk.
**Goal scope (original wording retained)**: Tinting stays correct through everything an agent actually does to a view, costs nothing perceptible in responsiveness, and leaves the page untouched whenever it cannot do its job.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: DETECT-03, DETECT-04, LIVE-01, LIVE-02, LIVE-03, LIVE-04, LIVE-05, FAIL-04
**Success Criteria** (what must be TRUE):

  1. Opening Zendesk then entering a view, sorting a view, refreshing it, switching to a different view with no page load, using Next/Previous pagination, and scrolling to reveal rows further down all leave every visible ticket row correctly tinted, with no manual refresh performed at any point.
  2. In a grouped view, group header rows are never tinted; in a view wide enough to show the sticky duplicate header, the tints still correspond to the right column.
  3. Scrolling and clicking around a full view feels no slower with the extension enabled than with it disabled, and a measured pass stays within the stated budget with zero forced layouts and no detached-node growth across thirty view switches.
  4. Deliberately breaking the row selector leaves the page pixel-identical to having no extension installed — no half-tinted rows, no errors surfaced into the page.
  5. Opening a ticket page, the dashboard and the admin area with the extension enabled changes nothing on them and breaks nothing.

**Plans**: 3/4 plans executed

Runtime repair update (2026-09-09): CR-01/CR-02 resolved; 403 tests and fresh synthetic timing pass; independent code review clean and security has zero high blockers. Current-source live acceptance remains pending; sixteen prior passes are preserved as historical evidence. Manual profiling stays deferred.

UAT update (2026-09-09): user requested skipping UAT. Eleven current-source live passes are preserved; nine checks remain untested. Stop further UAT prompts. Phase completion is not claimed.

Final goal verification (2026-09-09): 28/34 truths verified; status human_needed; no new implementation blockers. All eight Phase 03 requirements traced. Phase 04 planning inputs are prepared in 03-HANDOFF.md; formal Phase 03 completion remains unclaimed.

Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Persistent tint recovery and historical evidence binding

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — Bounded mutation handling, lifecycle recovery and privacy

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-03-PLAN.md — Reproducible Chrome performance, layout and retention workload

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 03-04-PLAN.md — Source-bound live acceptance and human verification

### Phase 4: Honest Failure and an Off Switch

**Goal**: The agent can tell from the toolbar which of three states the extension is in, is told to add a Priority column only when that is certainly the problem, and can turn tinting off and back on without uninstalling.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: FAIL-01, FAIL-02, FAIL-03, FAIL-05, CTRL-02, CTRL-03, CTRL-04
**Success Criteria** (what must be TRUE):

  1. On a view that has a Priority column the toolbar icon shows that tinting is working; on a view without one it shows a visibly different state, and opening the popup tells the agent to add the column.
  2. With the agent UI set to a language the extension does not read, the toolbar shows a third, distinct state and nothing anywhere claims the view is missing a Priority column.
  3. The popup carries an on/off switch that is already on; turning it off clears every tint from the view currently on screen without a refresh, and turning it back on restores them.
  4. Quitting Chrome and reopening it preserves whichever way the switch was left.

**Plans**: 4/6 plans executed
**UI hint**: yes

Plans:

- [x] 04-01-PLAN.md — Resolve the three product choices before implementation (wave 1)
- [x] 04-02-PLAN.md — Trace supported-view status through content, worker, toolbar and popup (wave 2)
- [x] 04-06-PLAN.md — Integrate inherited regressions and the preference-aware browser workload (wave 3)
- [x] 04-03-PLAN.md — Confirm missing-column certainty and distinguish all diagnoses (wave 4)
- [ ] 04-04-PLAN.md — Persist off/on intent and apply it without refreshing (wave 5)
- [ ] 04-05-PLAN.md — Bind final-source evidence and reach blocking browser acceptance (wave 6)

### Phase 5: Published

**Goal**: Zhroma is live as a public Chrome Web Store listing that survives review, makes its value legible to a reviewer who has never used Zendesk, and answers an IT admin's questions before they ask.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: STORE-01, STORE-04, STORE-06
**Success Criteria** (what must be TRUE):

  1. A stranger can find Zhroma in the Chrome Web Store, install it, open a Zendesk agent view and see tinting, with no steps in between.
  2. The listing shows real before/after screenshots of a genuinely tinted view at the required dimensions, and states plainly that the view needs a Priority column — so a reviewer whose trial view has none still understands what the extension does.
  3. A privacy policy is live at a stable URL, linked from the listing, and states that no data is collected; the store's privacy disclosures agree with it and with what the manifest actually requests.
  4. A pre-submission smoke checklist lives in the repo, and the run that preceded the shipped submission is recorded.

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. DOM Recon Spike | 15/15 | Complete    | 2026-09-08 |
| 2. First Tint on a Real View | 3/3 | Complete    | 2026-09-09 |
| 3. The Tint Survives Everything | 3/4 | In Progress|  |
| 4. Honest Failure and an Off Switch | 4/6 | In Progress|  |
| 5. Published | 0/TBD | Not started | - |

## Requirement Coverage

All 32 v1 requirements map to exactly one phase.

| Phase | Requirements | Count |
|-------|--------------|-------|
| 1. DOM Recon Spike | RECON-01, RECON-02, RECON-03 | 3 |
| 2. First Tint on a Real View | DETECT-01, DETECT-02, TINT-01, TINT-02, TINT-03, TINT-04, TINT-05, CTRL-01, STORE-02, STORE-03, STORE-05 | 11 |
| 3. The Tint Survives Everything | DETECT-03, DETECT-04, LIVE-01, LIVE-02, LIVE-03, LIVE-04, LIVE-05, FAIL-04 | 8 |
| 4. Honest Failure and an Off Switch | FAIL-01, FAIL-02, FAIL-03, FAIL-05, CTRL-02, CTRL-03, CTRL-04 | 7 |
| 5. Published | STORE-01, STORE-04, STORE-06 | 3 |
| **Total** | | **32** |

## Notes

- **The permission set is frozen in Phase 2, not Phase 5.** Any later change to the manifest's permission surface triggers extended review on every subsequent update, for the life of the project. Phase 5 documents the permission set; it does not choose it.
- **Route detection is an anti-requirement.** A view switch is already a large DOM mutation that the Phase 3 observer handles. Do not plan history patching, `webNavigation`, or a Navigation API path.
- **Dark mode and the colourblind-safe palette, including hue selection, are out of v1** by explicit decision. The Phase 4 on/off toggle is the accepted mitigation for dark-mode agents.
- **English only in v1**, but the three-way failure taxonomy ships in v1 so the hint never accuses a non-English agent of a missing column.
- **No build step, no bundler.** Hand-written files, zipped. Shipped bytes equal repo bytes.

---
*Roadmap created: 2026-09-02*
