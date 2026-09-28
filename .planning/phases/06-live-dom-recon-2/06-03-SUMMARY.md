---
phase: 06-live-dom-recon-2
plan: 03
subsystem: testing
tags: [recon, live-session, dark-mode, identity, rule-columns, fixtures, sanitiser, privacy]
# Dependency graph
requires:
  - phase: 06-live-dom-recon-2
    provides: "Plan 01: the rule-columns sanitiser mode, DEFAULT_RULE_VOCABULARY and validateRecon2Fixtures; Plan 02: the recon2 gate, the pending Recon 2 ledger block and 06-RUN-SHEET.md"
provides:
  - "Eight terminal Recon 2 entries in SELECTORS.md (all verified), the Recon 2 verdict proceed with no blocked consumer, and a closed session handoff"
  - "Three admitted rule-columns fixtures (light table, identity region, dark table) with a top-level recon2Fixtures manifest array"
  - "Session-confirmed DEFAULT_RULE_VOCABULARY: the Ticket status header and the Ticket placeholder for an unset type"
affects: [phase-8, phase-9, phase-10]
# Actuals (#2632)
actuals:
  tasks: 3
  commits: 3
plan_head_before: 3c6793b0dfdbb1cc2a351efdb933c7a2888343b9
# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Probe text spliced into the ledger by script from the run sheet by probe id, never retyped"
    - "Raw captures leave the page only as a browser download that the user moves; nothing raw passes through the conversation"
key-files:
  created:
    - test/fixtures/zendesk-rules-light-table.html
    - test/fixtures/zendesk-rules-identity-region.html
    - test/fixtures/zendesk-rules-dark-table.html
  modified:
    - SELECTORS.md
    - scripts/rule-column-contract.js
    - test/fixtures/manifest.json
key-decisions:
  - "Zendesk's own dark signal is html[data-theme] (light or dark, mirrored by data-color-scheme); it tracked the painted surface in every reading, so Phase 8 takes the document-marker branch and never uses prefers-color-scheme"
  - "An in-app Appearance switch swaps html attributes in place (no reload, no table re-mount); an OS toggle under Match system changes nothing until the next page load"
  - "The Appearance selection reset to Light mode after a page reload and after a re-login (observed twice); Phase 8 reads data-theme rather than assuming the setting persists"
  - "The agent's full name renders at load in the top-bar profile button's avatar alt and equals the Assignee text exactly (difference kind identical), so no self-alt form was needed"
  - "Vocabulary edit (D-11): headerKinds Status became Ticket status, the label this tenant's custom-status column renders, and placeholders gained Ticket, the unset-Type rendering"
  - "The tenant has two custom checkbox fields with one title, so duplicate-in-view and duplicate-custom-titles are both yes from existing fields, with no admin change (D-25)"
patterns-established:
  - "When the operator drives the live UI, record the deviation in the handoff (operator-deviation) and keep every ledger field value-free"
requirements-completed: [RECON-04, RECON-05, RECON-06]
coverage:
  - id: D1
    description: "Eight terminal Recon 2 entries (dark-mode-signal, dark-mode-switch-mutation, dark-native-states, dark-table-topology, identity-location, identity-vs-assignee, referenced-cell-representation, header-label-uniqueness), all verified"
    requirement: RECON-04
    verification:
      - kind: integration
        ref: "node scripts/verify-recon-gate.js recon2 SELECTORS.md test/fixtures/manifest.json -> RECON 2 VERDICT: proceed"
        status: pass
    human_judgment: true
    rationale: "The gate proves every entry is complete, structured and consistent, but not that the live observation is true; that stays human-only, the same limit Phase 1 accepted (flagged RECON-04 edge fallback)"
  - id: D2
    description: "Session-confirmed DEFAULT_RULE_VOCABULARY, edited only inside the vocabulary object"
    requirement: RECON-06
    verification:
      - kind: other
        ref: "Task 1 vocabulary-only verify command -> VOCABULARY_ONLY_EDIT"
        status: pass
      - kind: unit
        ref: "test/recon/rule-column-sanitizer.test.js and test/recon/recon2-corpus.test.js (84 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Three admitted rule-columns fixtures with manifest entries whose SHA-256 matches and that round-trip byte-identically"
    requirement: RECON-06
    verification:
      - kind: unit
        ref: "test/recon/recon2-corpus.test.js#every admitted recon2 fixture keeps its checksum, grammar and byte-identical rule-mode round trip"
        status: pass
      - kind: integration
        ref: "env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm --prefix . run test:recon (110 node tests, 1166 vitest tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Recon 2 verdict proceed with blocked-consumers none, derived per D-24; Phase 1 gate unchanged"
    requirement: RECON-04
    verification:
      - kind: integration
        ref: "node scripts/verify-recon-gate.js final SELECTORS.md test/fixtures/manifest.json -> FINAL VERDICT: proceed; evidence -> EVIDENCE READY: 18 terminal entries"
        status: pass
      - kind: other
        ref: "v1 corpus hash pins -> V1_CORPUS_UNCHANGED; git status of extension and test/extension -> empty"
        status: pass
    human_judgment: false
  - id: D5
    description: "Restore and custody: original Zendesk appearance, OS appearance and Zhroma switch restored; private inputs and the personal recon view awaiting deletion by the user"
    requirement: RECON-05
    verification: []
    human_judgment: true
    rationale: "Restoration is user-reported; deletion of the private inputs and of the recon view is still pending on the user, recorded as awaiting-user-deletion and pending in the handoff"
  - id: D6
    description: "RECON-05 privacy prohibition (flagged): the name never enters the repository"
    requirement: RECON-05
    verification:
      - kind: other
        ref: "case-insensitive search of SELECTORS.md, the manifest, the three fixtures and scripts/rule-column-contract.js for the name and tenant strings -> 0 matches; recon2 whole-block sensitive scan clean"
        status: pass
    human_judgment: true
    rationale: "The repository side holds, but the transcript side was knowingly waived by the user (screenshots and page reads entered the conversation), so the prohibition as written is only partly met"
# Metrics
duration: "62h 35m wall clock (session spread over 2026-09-25 to 2026-09-28, mostly waiting on the user)"
completed: 2026-09-28
status: complete
---

# Phase 6 Plan 03: Live Session, Fixture Admission and Recon 2 Verdict Summary

**The live session answered all three Recon 2 questions. Zendesk marks its painted theme on `html[data-theme]`. The agent's name renders at load in the top-bar avatar `alt` and matches the Assignee text exactly. The rule columns render as plain text, TIME elements, badges and an unset-Type placeholder, all recorded. Three rule-columns fixtures are admitted and the Recon 2 verdict is `proceed` with no blocked consumer.**

## Performance

- **Duration:** 62h 35m wall clock. The session ran from 2026-09-25 to 2026-09-28, and most of that time was spent waiting for the user.
- **Started:** 2026-09-25T15:38:17Z
- **Completed:** 2026-09-28T06:15:10Z
- **Tasks:** 3 of 3. Task 1 and task 3 each have one deferred verify item; see Issues.
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments

- **Dark mode (RECON-04):**
  - The Appearance menu offers Light, Dark and Match system.
  - All six cells were read with the OS set explicitly each time, never Auto, and Zhroma off.
  - `html[data-theme]` and `data-color-scheme` equalled the painted mode in every reading.
  - Computed `color-scheme` stayed `normal` and no `meta` tag existed.
  - `prefers-color-scheme` disagreed with the painted surface in three readings.
  - The branch is `document-marker`.
  - Measured palettes:

    | Mode | Pane | Header | Cell text |
    |------|------|--------|-----------|
    | Light | `rgb(255, 255, 255)` | `rgb(255, 255, 255)` on `rgb(41, 50, 57)` | `rgb(41, 50, 57)` |
    | Dark | `rgb(21, 26, 30)` | `rgb(21, 26, 30)` on `rgb(216, 220, 222)` | `rgb(216, 220, 222)` |

- **Switches:**

  | Switch | Result |
  |--------|--------|
  | Light to Dark | `attribute-or-class-swap`: 7 `html` attribute records, 228 table `class` records, +625 CSSOM rules |
  | Dark to Light | `attribute-or-class-swap`: 7 `html` attribute records, 228 table `class` records, +21 CSSOM rules |
  | OS toggle under Match system | `no-mutation`: the page stayed dark for 626 seconds until the next load |

  No switch reloaded the page or re-mounted the table.
- **Dark native states:**
  - Hover and selection are still owned by the row: `rgba(102, 160, 205, 0.08)` and `rgba(102, 160, 205, 0.16)`.
  - Cells stay transparent.
  - The selected row keeps its `rgb(38, 148, 214)` inset first-cell bar.
  - Header cells are sticky in dark.
  - Keyboard focus was reached with Tab only and shows as a 2px `rgb(38, 148, 214)` outline on the focused link.
  - The v1 Garden identifiers and the Document-only root chain hold in dark.
- **Identity (RECON-05):**
  - The name is present at load in the top-bar `IMG alt`, inside `BUTTON navigation.profile-menu-button`, in full form.
  - The profile menu repeats it.
  - Compared inside the page, it is `identical` to the Assignee text, which renders as plain text.
- **Rule columns (RECON-06):**
  - The status header reads `Ticket status`. Its badge `aria-label` equals the text, and its `data-test-id` encodes only the status category.
  - An unset Type renders `Ticket`.
  - Dates are TIME elements with an ISO `datetime` and an absolute `title`, and the visible text mixes relative and absolute forms (`date-machine-value: both`).
  - A checkbox field renders `No`, and an empty dropdown cell is truly empty.
  - Tags is not offered as a column (D-26 fallback in force).
  - Two custom checkbox fields share one title, which gives a live duplicate-label case for EDIT-06.
- **Fixtures:**
  - `zendesk-rules-light-table.html` (sha256 `7c9ddb91…`), `zendesk-rules-identity-region.html` (`ae561400…`) and `zendesk-rules-dark-table.html` (`c726244f…`).
  - Each was produced only by the rule-columns sanitiser from a fresh capture.
  - The self token appears once in each file.
  - All three round-trip byte-identically.
- **Verdict:** `recon2-verdict: proceed`, `blocked-consumers: none`, and all three fixture fields `admitted`. The Phase 1 verdict is untouched.

## Task Commits

1. **Task 1: Guided live session, run sheet steps 0 to 8.** `78acfd4` (feat)
2. **Task 2: Admit the fixtures and close the Recon 2 verdict.** `2f4b6f4` (feat)
3. **Task 3: Close the handoff (custody pending on the user).** `9b5aa9e` (docs)

## Files Created/Modified

- `SELECTORS.md`: eight terminal Recon 2 entries, the verdict, and the handoff, with an `operator-deviation` note.
- `scripts/rule-column-contract.js`: `DEFAULT_RULE_VOCABULARY` only (`Ticket status` header, `Ticket` placeholder).
- `test/fixtures/manifest.json`: a new top-level `recon2Fixtures` array; the `fixtures` array is unchanged.
- `test/fixtures/zendesk-rules-light-table.html`, `zendesk-rules-identity-region.html`, `zendesk-rules-dark-table.html`: new generated fixtures.

## Deviations from Plan

1. **[User-directed] Claude drove the Zendesk interface (D-03 and D-04 waived for the transcript).**
   - At the user's explicit request, Claude did the menu, view, hover, checkbox and Tab actions through Claude in Chrome. Screenshots and page reads entered the conversation.
   - The user kept the OS appearance and the Zhroma switch.
   - Recorded in the handoff's `operator-deviation` field.
2. **[User-directed] Personal view created through the Zendesk API.**
   - After a session timeout reset the Admin Center form, the same configuration was saved from the user's signed-in page through the views API.
   - The view is restricted to the user.
   - Its conditions are Status category between New and Solved (exclusive), with Assignee is current user or Priority is Urgent.
   - The planned "unassigned ticket" condition was dropped because it matched about 5,900 alert tickets. As a result, no unassigned Assignee placeholder was observed, and the ledger records that.
3. **[Rule 3 - Blocking] Capture transfer by browser download.**
   - Chrome ran on a different machine from the repository, so neither the clipboard nor the DevTools `copy` route could reach this Mac.
   - An encoded in-transcript transfer was blocked by the auto-mode safety classifier and was not attempted again.
   - Each stash was downloaded by the page on the Chrome machine and moved across by the user.
4. **[User-directed] Claude wrote the private denylist** (`self:` form and tenant subdomain), outside every checkout.
5. **[Rule 1 - Bug] Match system cell re-read at selection.**
   - A reload reset Appearance to Light mode, so the post-reload reading was a light-mode cell, not match/os-light.
   - Match system was re-selected with the OS on Light and read then.
   - The stale reading before the reload is recorded under switch C.
6. **Supplementary probes.**
   - Beyond the run sheet, Claude ran allowlist-only and count-only probes for header labels, Type, status and checkbox vocabulary, and date `title` classes.
   - This follows the plan's "use a corrected probe" rule. No tenant text was returned.
7. **Handoff wording.**
   - The plan's Task 1 wording (`restore: complete`, `private-inputs: retained-for-admission`) was used where the run sheet's step 8 said `restore: done` and `awaiting-admission`.
   - `next-step` stays `admission` because the real-ledger smoke test pins it to a digit or `admission`.

**Total deviations:** 7 (4 user-directed, 1 blocking, 1 bug, 1 wording). **Impact:** the repository record is complete and value-free. The transcript side of the RECON-05 prohibition was knowingly waived.

## Issues Encountered

- **Custody pending on the user.**
  - The private directory (raw captures, two spare identity copies, the denylist) is not yet deleted or encrypted, and the personal recon view is not yet deleted.
  - The handoff records `private-inputs: awaiting-user-deletion` and `recon-views-deleted: pending`.
  - As a result, Task 1's `recon-views-deleted: yes` check and Task 3's `private-inputs: deleted|encrypted` check do not pass yet.
  - Once the user confirms deletion, set both fields.
- **Leftover not recorded through the windows command.**
  - `gsd-tools windows append` rejects the existing `.planning/WINDOWS.md`: entry 12 has kind `accepted-risk`, which the tool does not accept.
  - Both leftovers are recorded in STATE.md instead: the custody follow-up, and the smoke test's `next-step` pin.
  - The pre-existing ledger row was not changed.
- **Stale Match system rendering.** Under Match system, Zendesk kept its old render after a live OS toggle until the next load. This is a consumer note for Phase 8, not a defect.

## Next Phase Readiness

- **Phase 8** can start: take the `html[data-theme]` marker, re-evaluate on `html` attribute changes, use the measured palettes, and use the dark-table fixture.
- **Phase 9** has the cell shapes, placeholders and light-table fixture. The unassigned-Assignee shape is unrecorded, so treat it as not matching.
- **Phase 10** has the identity location, the identical match and the identity-region fixture.

Phase complete, ready for the next step.

## Self-Check: PASSED

- The three fixture files and the manifest entries exist, and each SHA-256 matches.
- The three `(06-03)` commits are present: `78acfd4`, `2f4b6f4`, `9b5aa9e`.
- **Gates:** `recon2` prints `RECON 2 VERDICT: proceed`; `final` prints `FINAL VERDICT: proceed`; `evidence` prints `EVIDENCE READY: 18 terminal entries`.
- **Suite:** `test:recon` passes 110 node tests and 1166 Vitest tests across 26 files.
- **Integrity checks:** `V1_CORPUS_UNCHANGED`, `VOCABULARY_ONLY_EDIT`, and `extension/` and `test/extension/` are untouched.
- **Deferred acceptance items (user custody):** `recon-views-deleted: yes` and `private-inputs: deleted|encrypted`.
