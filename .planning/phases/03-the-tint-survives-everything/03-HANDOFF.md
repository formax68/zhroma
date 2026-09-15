---
phase: 03-the-tint-survives-everything
status: human_needed
uat_execution: skipped-by-user
verification: 28/34
next_preparatory_phase: "04"
updated: "2026-09-09T13:25:38Z"
---

# Phase 03 Handoff to Phase 04 Planning

Final automated goal verification is complete. Independent verdict: **human_needed, 28/34 truths verified, zero new implementation blockers**. Phase 03 remains 3/4 plans complete; 03-04 Task 2 is not accepted. No phase.complete or phase advancement was performed.

The user explicitly requested skipping UAT and then authorized automated goal verification and this handoff. Preserve eleven current-source live passes and nine untested checks. Do not restart UAT, profiling or human judgment prompts unless the user asks. Skipping execution does not supply missing evidence or risk acceptance. The generic verification.status next-command points to UAT; that recommendation is superseded by this user instruction.

## Verified baseline

- Runtime SHA-256: `aaf2596dd41e67b520d6accd9ff55ecf8ab525de0098571dc284c81773998dc2`.
- Fresh `npm test`: 65 Node smoke + 338 Vitest = **403 passing tests**, zero failures.
- Independent code review clean; security ASVS 1/high threshold has fourteen closed mitigations, zero blocking threats and one medium missing-snippet evidence gap (T-03-15).
- Finite synthetic Chrome timing passes: 1800 enabled + 1800 disabled measurements over 30/200/1000 rows; largest 30-row median 1.4 ms, largest enabled batch 14.5 ms. Failed initial repair samples remain in history.
- Current source/environment confirmation: Chrome 152.0.7977.77, macOS 27 beta 6, English light-interface current Agent Workspace, 30 mounted ticket rows.
- Current live passes: in-app-entry, delayed-entry, sort, refresh, view-switch, pagination-next, pagination-previous, scroll, grouped-sticky, native-states, tab-return.
- Six requirements are satisfied within admitted evidence scope: DETECT-03/04, LIVE-01/02/03/04. LIVE-05 and FAIL-04 require missing human evidence. All eight IDs are traced in 03-VERIFICATION.md. Requirement completion checkboxes remain governed by formal phase completion; this handoff does not silently mark them complete.

## Evidence carried forward

Six distinct goal truths remain unverified: full live responsiveness/performance, live failure-cleanup appearance, ticket/dashboard/admin isolation, persisted restoration, synthetic synchronous-layout attribution, and synthetic detached-row retainer attribution. They are evidence limitations, not new reproduced implementation defects.

Nine canonical live checks remain pending: failure-cleanup, ticket-isolation, dashboard-isolation, admin-isolation, document-restoration, live-responsiveness, live-pass-budget, live-forced-layout, live-thirty-switch-memory. Three descriptor-less judgment prohibitions remain flagged without explicit human disposition. Permanent native marker-removal failure remains a disclosed platform limit. No old-source observation or aggregate profile result fills these gaps.

## Phase 04 planning inputs

**Phase 04: Honest Failure and an Off Switch.** Target requirements: FAIL-01/02/03/05 and CTRL-02/03/04. Planning can use this verified implementation baseline and explicit open evidence; it must not claim its Phase 03 dependency fully accepted.

Established scope:

1. Toolbar distinguishes working tint, confirmed missing Priority column, and unreadable/unsupported language. Popup explains the actual state.
2. Show the add-Priority hint only when that diagnosis is certain. A transient, absent, ambiguous, malformed or unsupported table must not be called a missing-column view.
3. Default-on toggle clears current tints immediately without page refresh, restores fresh-DOM tint on enable, and survives browser restarts.
4. Persist exactly one boolean with the already-declared storage permission. Preserve no host_permissions, the current host match, English support boundary, CSS-only palette, no build step, no remote code/network/telemetry, and no ticket-content persistence or transmission.
5. Retain mutation-driven discovery; no SPA route hooks or added navigation permissions. Unsupported states must preserve native page behavior.

Source seams for the planner:

- `extension/content.js`: inspectCandidateTable currently returns safe/waiting/unsafe/blank. These states are not yet sufficient for honest three-way product diagnosis; waiting must not be treated as proof of missing Priority.
- The controller already has fresh reconciliation, one non-resetting timer, owned/copied-marker cleanup, pause/resume and self-write suppression. A persistent user-off state must remain distinct from temporary hidden/pagehide pause, so visibility changes cannot undo the user's preference.
- `extension/manifest.json`: no popup/background/toolbar status implementation exists yet. Any planned wiring must preserve the frozen permission surface and data boundary.
- `test/extension/runtime-contract.test.js`: currently enforces the exact Phase 03 asset/manifest contract. Phase 04 must update intentional artifact expectations while preserving security constraints.
- Current live and timing evidence is tied to current source bytes. Future changes need honest new-source records, with existing observations kept as history. Do not manufacture live acceptance when UAT is skipped.

Next preparatory action: establish Phase 04 design/context and executable plans from these inputs. Popup wording/icon treatment and cross-tab behavior should be resolved against existing decisions and current source before implementation. This document is planning input, not a completed Phase 04 plan or authorization to mark Phase 03 accepted.

## Canonical artifacts

- 03-VERIFICATION.md — independent goal and requirement verification.
- 03-LIVE-ACCEPTANCE.md — source-bound eleven-pass/nine-pending record and explicit UAT skip.
- 03-REVIEW.md and 03-SECURITY.md — final source review/security findings.
- 03-PERFORMANCE.md and 03-PERFORMANCE-SAMPLES.json — current finite measurements and attribution limits.
- 03-04-CHECKPOINT.md — preserved user observation sequence and skip instruction.
- 03-REPAIR-SUMMARY.md — repair history; later live progress is summarized here and in canonical acceptance.

Unrelated pre-existing work remains outside this handoff: .planning/config.json, .planning/state.json, .gsd/ and .planning/ui-reviews/. Preserve it.
