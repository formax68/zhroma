---
phase: 06-live-dom-recon-2
verified: 2026-09-28T09:35:00Z
status: gaps_found
score: 14/15 must-haves verified
covered_files:
  - .planning/REQUIREMENTS.md
  - .planning/phases/06-live-dom-recon-2/06-01-PLAN.md
  - .planning/phases/06-live-dom-recon-2/06-01-SUMMARY.md
  - .planning/phases/06-live-dom-recon-2/06-02-PLAN.md
  - .planning/phases/06-live-dom-recon-2/06-02-SUMMARY.md
  - .planning/phases/06-live-dom-recon-2/06-03-PLAN.md
  - .planning/phases/06-live-dom-recon-2/06-03-SUMMARY.md
  - .planning/phases/06-live-dom-recon-2/06-RUN-SHEET.md
  - SELECTORS.md
  - scripts/fixture-contract.js
  - scripts/rule-column-contract.js
  - scripts/sanitize-fixture.js
  - scripts/verify-recon-gate.js
  - test/fixtures/manifest.json
  - test/fixtures/zendesk-rules-dark-table.html
  - test/fixtures/zendesk-rules-identity-region.html
  - test/fixtures/zendesk-rules-light-table.html
  - test/recon/recon2-corpus.test.js
  - test/recon/recon2-gate.smoke.js
  - test/recon/rule-column-sanitizer.test.js
covered_digest: "v1:sha256:5b79b5a1833e7adef64c07dea72af68121940e58b727fbc81a2d3ae3b4405b1e"
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "D-20 / D-05 (06-03 must-have): the Recon 2 handoff records restore: complete, recon-views-deleted: yes, private-inputs: deleted or encrypted, and session-state: closed"
    status: failed
    reason: "The committed handoff records recon-views-deleted `pending` and private-inputs `awaiting-user-deletion`. The raw captures, which hold real ticket data and the agent's name, plus the denylist and two spare identity copies, still exist in plaintext outside the repository, and the personal recon view still exists in the tenant. session-state is already `closed` and next-action-owner is still `user`. Plan 03 Task 3 says to set `closed` only after custody is confirmed, so the record contradicts itself. Plan 03 Task 1's check (`recon-views-deleted: yes`) and Task 3's check (`private-inputs: deleted|encrypted`) both fail today. The recon2 gate still prints proceed because it never reads the handoff fields (06-REVIEW IN-06)."
    artifacts:
      - path: "SELECTORS.md"
        issue: "## Recon 2 Session Handoff: recon-views-deleted `pending`, private-inputs `awaiting-user-deletion`, but session-state `closed`"
      - path: "test/fixtures/manifest.json"
        issue: "Each recon2Fixtures sanitizationMethod says private inputs are deleted or encrypted after admission. That is not yet true."
    missing:
      - "User action: delete the private directory (raw captures, spare identity copies, denylist), or gpg-encrypt it and then delete the plaintext"
      - "User action: delete the personal recon view created for the session"
      - "Then run a read-only existence check and set private-inputs `deleted` or `encrypted`, recon-views-deleted `yes` and next-action-owner `none` in the handoff, keep session-state `closed`, re-run the recon2 CLI, and commit. No gap-closure plan is needed."
human_verification:
  # Kept even though status is gaps_found, so the flagged judgment-tier prohibitions are not lost.
  - test: "RECON-05 privacy prohibition (06-03, judgment tier): confirm you accept the waiver. The name reached the transcript through screenshots and page reads, and through Claude writing the denylist."
    expected: "Explicit acceptance recorded. The repository side holds: the name-stem count is 0 across the phase files and commit messages, the fixtures carry only PERSON-SELF, and the ledger has no name."
    why_human: "The prohibition says the name may exist only in the private denylist and the user's own tab. The transcript side was knowingly broken by user waiver, and only the user can accept that."
  - test: "RECON-04 safety prohibition (06-02, judgment tier): review the session deviations. Claude drove the UI, reloaded the view once, and saved the personal view through the Zendesk views API from the user's page."
    expected: "The user confirms each action was consented to and that no ticket, admin setting or other view was changed. The SELECTORS.md operator-deviation note should also mention the views-API save, which is currently recorded only in 06-03-SUMMARY."
    why_human: "The run-sheet text passes the static read-only check (RUN_SHEET_OK 19), but the live session went beyond it. The views-API save is a network write that the ledger's deviation note does not name."
  - test: "RECON-06 privacy prohibition (06-01, judgment tier): no tenant-authored text survives in the three admitted fixtures"
    expected: "Non-authoritative LLM verdict: holds. Every text node and every title, alt and aria-label value is a kind token, PERSON-SELF, a header label from the vocabulary, a standard Status, Type or Priority value, or the Ticket placeholder. Identifier values are generic Garden and Zendesk component ids. There are no template elements, hosts, emails or URLs."
    why_human: "A judgment-tier prohibition needs a human sign-off, and the sanitiser has known mechanism gaps for future captures (CR-01, WR-01)."
  - test: "RECON-04 evidence-integrity prohibition (06-03, judgment tier): the dark-mode record does not present prefers-color-scheme, localStorage or a Zhroma colour as Zendesk's signal, and does not read a transparent colour as black"
    expected: "Non-authoritative LLM verdict: holds. The branch is document-marker from html[data-theme]. prefers-color-scheme is recorded as disagreeing with the painted surface. Zhroma was off (zhromaStamps 0). Transparent is recorded as rgba(0, 0, 0, 0) or transparent."
    why_human: "Judgment tier, and the truth of the live readings can only be vouched for by the person who watched them."
  - test: "RECON-06 transparency prohibition (06-03, judgment tier): no hand-written markup is presented as a live capture, and anything unobserved is recorded as not observed or not-offered"
    expected: "Non-authoritative LLM verdict: holds. Each fixture is a single-line sanitiser output that round-trips byte-identically. The unassigned-Assignee shape is recorded as not observed, Tags as not-offered, and class tokens are explicitly not claimed."
    why_human: "Capture provenance from a live page cannot be proven from the repository."
  - test: "RECON-04 flagged assumption: the live observations in the eight Recon 2 entries are true"
    expected: "The user who watched the session confirms the six appearance cells, the three switch classifications and the dark hover, selection and focus readings."
    why_human: "The gate proves the entries are complete and consistent, not that the readings are true. This is the same limit Phase 1 accepted."
---

# Phase 6: Live DOM Recon 2 Verification Report

**Phase Goal:** The DOM facts that dark mode, rules and "is me" depend on are known from a live Zendesk account, not assumed.
**Verified:** 2026-09-28T09:35:00Z
**Status:** gaps_found. The one gap is custody, which needs a user action. All four roadmap success criteria are verified.
**Re-verification:** No. This is the initial verification.

## Goal Achievement

### Observable Truths

Roadmap success criteria (the contract):

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | The ledger records Light, Dark and Match system, each with the OS set to light and to dark, and the mid-session switch effects | ✓ VERIFIED | `dark-mode-signal` holds all six `cell-*` fields, dated 2026-09-27, with `os-auto-used: no`, `zhroma-off: yes` and branch `document-marker` (html data-theme). `dark-mode-switch-mutation` records Light to Dark and Dark to Light as `attribute-or-class-swap` and the OS toggle under Match as `no-mutation`, with record counts, the reload sentinel and the remount marker in the evidence. |
| SC2 | The ledger records where the name renders and whether it equals the Assignee text, keeping only equal and the difference kind | ✓ VERIFIED | `identity-location`: `top-bar-at-load`, `alt`, `full`, `assignee-cell-renders: text`, from three probe runs (no menu, menu open, menu closed). `identity-vs-assignee`: `equal: true`, `difference-kind: identical`. No name appears in the ledger, manifest, fixtures, commit messages or phase docs (name-stem count 0). |
| SC3 | Sanitised fixtures with provenance show Assignee, Requester, Group, Status, Type, Subject, Tags (D-26), a date column and a custom field, including empty placeholders and hidden or aria-label-only text, with the name tokenised consistently | ✓ VERIFIED | Light table: 18 headers and 30 rows. Assignee is PERSON (29) plus PERSON-SELF (1). Requester is PERSON with an equal aria-label. Group is GROUP. `Ticket status` holds Open or On-hold verbatim, plus STATUS tokens for custom names. Type holds Problem or the `Ticket` placeholder. Subject is SUBJECT with 20 text-truncated markers. Updated is a TIME element with the synthetic datetime and a DATE title. The custom dropdown is FIELD with 6 empty cells. The icon columns carry 89 visually-hidden markers. The identity region's only textual value is `alt=PERSON-SELF`. Tags is `not-offered`, with a fallback naming RULE-07 and RULE-F2. Each manifest entry records captureDate, workspace, appearance, boundaryKind, domBoundary, sanitizerMode and sha256. |
| SC4 | A dark-table fixture confirms the v1 Garden identifiers hold in dark, and the ledger records the dark surface and text colours and the native hover, selection and focus appearance | ✓ VERIFIED | The dark fixture carries tables.table, generic-table, tables.row and generic-table-row (30 each), tables.header_cell (18) and tables.cell (540). `dark-table-topology`: `garden-identifiers: hold`, `root-terminus: Document`. `dark-native-states` records the pane, header and text colours, hover and selected row paints, the inset selection bar, sticky header cells, and a 2px Tab-only focus outline. |

Plan must-haves (added detail, deduplicated against the SCs):

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 5 | 06-01: the v1 default path is unchanged and the three v1 fixture hashes are pinned (D-10) | ✓ VERIFIED | `V1_CORPUS_UNCHANGED`. The Set-membership test and the unmodified v1 tests pass in the full run. |
| 6 | 06-01: rule-columns grammar (column ownership, per-value tokens, reserved self tokens, NFC normalisation, synthetic datetime, identifier and probe grammar, identity boundary, denylist collision) | ✓ VERIFIED | Enforced by `test/recon/rule-column-sanitizer.test.js` (green in the full run). The admitted fixtures show the grammar in practice (see SC3). |
| 7 | 06-01: validateRecon2Fixtures checks fields, path, SHA-256, sensitive scan and grammar, and validateFixtureManifest still returns 3 | ✓ VERIFIED | `scripts/fixture-contract.js:555` calls `validateRuleColumnOutput`. The recon2 CLI accepts the real manifest. The corpus test round-trips each entry. |
| 8 | 06-02: the recon2 gate requires all eight ids, terminal statuses and consistent enums, and prints the verdict | ✓ VERIFIED | `node scripts/verify-recon-gate.js recon2 SELECTORS.md test/fixtures/manifest.json` prints `RECON 2 VERDICT: proceed` (exit 0). There are 47 smoke tests. |
| 9 | 06-02: the D-24 derived verdict and the D-23 fixture outcomes | ✓ VERIFIED | Verdict `proceed` and `none`, with all three fixture fields `admitted`. This matches dark offered plus identifiers hold. |
| 10 | 06-02 / 06-03: Phase 1 gate unchanged | ✓ VERIFIED | `FINAL VERDICT: proceed` and `EVIDENCE READY: 18 terminal entries`. |
| 11 | 06-02: the run sheet is one-sitting, user-driven, with read-only single-line probes | ✓ VERIFIED | Static check re-run: `RUN_SHEET_OK 19` (17 probes and 2 projections). The live deviations are a separate matter; see the prohibitions under Human Verification. |
| 12 | 06-02: D-26 notes in ROADMAP.md SC3 and REQUIREMENTS.md RECON-06 | ✓ VERIFIED | Both notes are present. |
| 13 | 06-03: the vocabulary edit is confined to DEFAULT_RULE_VOCABULARY | ✓ VERIFIED | `VOCABULARY_ONLY_EDIT` against base 097f96e. |
| 14 | D-22: nothing under extension/ or test/extension/ changes | ✓ VERIFIED | `git diff --stat 48024dd..HEAD -- extension test/extension` is empty, and so is the working tree status. |
| 15 | 06-03 D-20 / D-05: the handoff records restore complete, views deleted, private inputs deleted or encrypted, and session closed | ✗ FAILED | `restore: complete` holds, but `recon-views-deleted: pending` and `private-inputs: awaiting-user-deletion`. `session-state: closed` was set early (see Gaps). |

**Score:** 14/15 truths verified (0 present but behaviour-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/rule-column-contract.js` | Rule-columns grammar | ✓ VERIFIED | 538 lines. Imported by the sanitiser and by the fixture contract. |
| `scripts/sanitize-fixture.js` | Rule-columns mode, CLI forms | ✓ VERIFIED | Line 26 imports from `./rule-column-contract.js`. |
| `scripts/fixture-contract.js` | validateRecon2Fixtures | ✓ VERIFIED | Imported by the gate at line 9. |
| `scripts/verify-recon-gate.js` | recon2 mode | ✓ VERIFIED | Lines 1037 to 1041. |
| `SELECTORS.md` Recon 2 block | Eight terminal entries, verdict, handoff | ⚠️ PARTIAL | The entries and verdict are complete. The handoff custody fields are still pending. |
| `test/fixtures/manifest.json` | recon2Fixtures | ✓ VERIFIED | Three entries. The `fixtures` array is unchanged. |
| `test/fixtures/zendesk-rules-light-table.html` | Light table | ✓ VERIFIED | The SHA-256 prefix 7c9ddb91 matches the manifest. |
| `test/fixtures/zendesk-rules-identity-region.html` | Identity region | ✓ VERIFIED | The SHA-256 prefix ae561400 matches. 4 elements. |
| `test/fixtures/zendesk-rules-dark-table.html` | Dark table | ✓ VERIFIED | The SHA-256 prefix c726244f matches. |
| `06-RUN-SHEET.md` | Session script | ✓ VERIFIED | `RUN_SHEET_OK 19`. |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| sanitize-fixture.js | rule-column-contract.js | import | WIRED |
| fixture-contract.js | rule-column-contract.js | `validateRuleColumnOutput` at line 555 | WIRED |
| verify-recon-gate.js | fixture-contract.js | `validateRecon2Fixtures` at line 1037 | WIRED |
| recon2-corpus.test.js | manifest.json | iterates `recon2Fixtures` and round-trips each with its `boundaryKind` | WIRED |
| SELECTORS.md | manifest.json | the recon2 CLI checks that the admitted scenarios match the fixture fields | WIRED (proceed) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Recon 2 verdict | `node scripts/verify-recon-gate.js recon2 SELECTORS.md test/fixtures/manifest.json` | `RECON 2 VERDICT: proceed` | ✓ PASS |
| Phase 1 final | `... final SELECTORS.md test/fixtures/manifest.json` | `FINAL VERDICT: proceed` | ✓ PASS |
| Phase 1 evidence | `... evidence SELECTORS.md` | `EVIDENCE READY: 18 terminal entries` | ✓ PASS |
| Full suite (run once) | `npm test` | node 110/110; vitest 1166/1166 across 26 files | ✓ PASS |
| v1 hash pins | pinned-hash script | `V1_CORPUS_UNCHANGED` | ✓ PASS |
| Vocabulary-only edit | Plan 03 verify script | `VOCABULARY_ONLY_EDIT` | ✓ PASS |
| Fixture shape (structural parse, no contents printed) | happy-dom column and token census | as in SC3 and SC4 | ✓ PASS |

### Probe Execution

Step 7c: no `scripts/*/tests/probe-*.sh` probes are declared. The phase's "probes" are in-page run-sheet expressions for a live tab, which cannot be re-run here. Their static check was re-run instead (`RUN_SHEET_OK 19`).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| RECON-04 | 06-02, 06-03 | Light/dark signal and mid-session switch recorded from a live account | ✓ SATISFIED | SC1, SC4 |
| RECON-05 | 06-01, 06-02, 06-03 | Name location and Assignee equality recorded from a live account | ✓ SATISFIED | SC2. The custody gap affects the phase's privacy close-out, not the recorded facts. |
| RECON-06 | 06-01, 06-02, 06-03 | Rule-column rendering recorded and captured as sanitised fixtures | ✓ SATISFIED | SC3 |

No orphaned requirements: REQUIREMENTS.md maps only RECON-04, RECON-05 and RECON-06 to Phase 6, and all three are claimed by the plans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (phase-modified files) | — | TBD, FIXME or XXX debt markers | — | None found |
| SELECTORS.md | handoff | `session-state: closed` while custody is pending | 🛑 Blocker (part of gap) | Misstates the session as closed |
| test/fixtures/manifest.json | recon2Fixtures | sanitizationMethod says the inputs are deleted or encrypted | ⚠️ Warning | Provenance claim is not yet true. It becomes true once the gap closes. |
| scripts/rule-column-contract.js | 389-404, 482-492 | 06-REVIEW CR-01: `<template>` content bypasses tokenisation and the validator | ⚠️ Warning | Does not affect the committed fixtures (0 template elements in each). It does affect any future rule-columns admission, and Phases 8 to 10 may add captures. |
| scripts/rule-column-contract.js | 66-68 | 06-REVIEW WR-01: letters-only identifier values are kept verbatim | ⚠️ Warning | The committed identifier values are all generic Zendesk and Garden component ids (checked). The mechanism would admit a tenant slug in a future capture. |
| scripts/rule-column-contract.js | 31 | 06-REVIEW WR-02: `Status` key replaced by `Ticket status` | ⚠️ Warning | A tenant whose header reads plain `Status` would have its standard values tokenised as FIELD in a future capture |
| test/recon/recon2-gate.smoke.js | 724-753 | 06-REVIEW WR-05: no test locks the committed ledger and manifest through the recon2 gate | ⚠️ Warning | The `proceed` result is proven only by a manual CLI run (done here) |
| scripts/verify-recon-gate.js | 926-1008 | 06-REVIEW WR-04 and IN-06: the gate cannot see names and ignores the handoff custody fields | ℹ️ Info | This is why the gate prints proceed despite the custody gap |
| 06-RUN-SHEET.md | 33, 44 | The developer's own checkout path is written out | ℹ️ Info | This is the repository path, not the private capture directory, and it predates the session |

### Human Verification Required

These items are kept even though the status is gaps_found. They are all flagged judgment-tier prohibitions or the RECON-04 flagged assumption. Full text is in the frontmatter `human_verification`.

1. **RECON-05 name prohibition, transcript side.** Accept the explicit waiver. The repository side verifies clean.
2. **RECON-04 run-sheet safety prohibition.** Review the live deviations: Claude drove the UI, reloaded the view once, and saved the personal view through the Zendesk views API. The API save is missing from the SELECTORS.md operator-deviation note.
3. **RECON-06 fixture privacy prohibition.** The LLM verdict (holds) is non-authoritative and needs sign-off.
4. **RECON-04 evidence integrity.** The LLM verdict (holds) is non-authoritative.
5. **RECON-06 transparency.** The LLM verdict (holds) is non-authoritative.
6. **Truth of the live readings.** Only the observer can vouch for them.

### Gaps Summary

The phase goal is met in substance. The dark-mode signal, the switch behaviour, the dark palette and native states, the identity location and match, and the rule-column shapes are all recorded from a live account. Three sanitised fixtures are admitted with provenance and verified checksums, the recon2 gate returns `proceed`, and extension/ is untouched.

One must-have fails: **custody close-out (D-20 / D-05)**. The plaintext raw captures (real ticket data and the agent's name), the denylist and the spare identity copies still exist outside the repository, and the personal recon view still exists in the tenant. The handoff says so, yet it also marks the session `closed`. This is a privacy obligation, not a code defect, so an override is not appropriate. Closing it needs the user to delete (or encrypt and then delete) the private inputs and the view, then a four-field ledger update and a re-run of the recon2 CLI. No gap-closure plan is needed. No later phase addresses it, so it is not deferred.

Separately, the sanitiser review findings (CR-01, WR-01, WR-02) leave the three committed fixtures unaffected. They should be fixed before any later phase admits another rule-columns capture.

---

_Verified: 2026-09-28T09:35:00Z_
_Verifier: Claude (gsd-verifier)_
