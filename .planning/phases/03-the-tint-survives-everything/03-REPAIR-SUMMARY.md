---
phase: 03-the-tint-survives-everything
status: human_needed
runtime_repairs: verified
code_review: clean
security_blocking_open: 0
security_nonblocking_open: 1
updated: "2026-09-09T12:44:20Z"
---

# Phase 03 Runtime Repair Summary

CR-01 and CR-02 are repaired and independently reverified. Final content.js SHA-256: `aaf2596dd41e67b520d6accd9ff55ecf8ab525de0098571dc284c81773998dc2`. Phase 03 remains incomplete at Plan 03-04 Task 2; no phase-complete operation was run.

## Changes

- CR-01: discover copied extension markers at lifecycle entry and across every mutation-added subtree and marker attribute record before filtering. Fresh whole-table validation governs retained and positive markers. Cleanup removes stale copied markers and releases detached original rows without changing native ticket content or attributes.
- CR-02: table identifier changes invalidate discovery even when previous ambiguity left no unique candidate. Removing either or both identifiers from a competing table now restores the sole valid table automatically, with one coalesced pending pass.
- The first correctness repair scanned the full document every relevant pass and failed the 1000-row performance budget. The final change bounds repeated discovery to mutation-added subtrees. Failed samples and the first repair source/review remain in history/2026-09-09-first-repair-performance; they were not discarded.
- The development harness gives the complete 660-batch operation matrix a bounded 180-second timeout after its former 60-second limit expired. Individual setup/profile commands keep 60-second deadlines; product timing limits are unchanged.
- Historical live evidence and samples are preserved byte-for-byte against Git revision e2eb7bab92deb04d1ad5ec1156973426ab0e0e8f. Tests reject using those hashes as current-source acceptance. Hypothetical validator success cases now use explicit in-memory samples rather than depend on real benchmark success.

## Verification

- Before the first fix: nine new regressions failed while 59 existing persistent-runtime tests passed.
- Final `npm test`: 65 Node smoke tests plus 338 Vitest tests, **403 passed, zero failed**. Phase 02 historical acceptance remains passed; Phase 03 current-source acceptance consistently reports human_needed.
- Independent final code review: clean, zero findings; 113 targeted tests and additional native-observer reproductions passed. See 03-REVIEW.md for final source identity and scope.
- Independent security verification: 14/15 mitigations closed, zero blocking threats at ASVS 1/high threshold. T-03-15 remains non-blocking medium because the exact historical reviewed selector snippet is unavailable. See 03-SECURITY.md. No new risk acceptance.
- Final synthetic Chrome workload: 1800 enabled and 1800 disabled samples across 30/200/1000 rows. Largest 30-row median 1.4 ms (<2); overall enabled maximum 14.5 ms (<16). Both thirty-switch profile runs completed with zero pending timers and zero aggregate detached-row growth; synchronous layout and retainer attribution remain human_needed.
- Manifest, stylesheet, permissions and dependencies are unchanged. No publication or authenticated site interaction was performed.

## Preserved acceptance boundary and next work

Sixteen user-reported live passes and four pending checks remain historical evidence for the pre-repair source. The final source has not been loaded and confirmed by the user; its canonical twenty live checks are pending. Source changes were not represented as validated by old observations. The existing log is retained in 03-04-CHECKPOINT.md with a current resumption note.

Manual profiling remains deferred at the user's request. Do not reopen those questions automatically. When the user chooses to resume live acceptance, start with final-source loading/confirmation and retain original observations as history. Current source-bound human acceptance, unavailable persisted-restoration evidence, layout/retainer attribution and final goal verification remain open. Do not count the halted 03-04 summary as completion or advance Phase 4.
