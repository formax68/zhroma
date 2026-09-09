---
phase: "03"
slug: the-tint-survives-everything
status: blocked
threats_open: 2
threats_open_total: 3
threats_closed: 12
asvs_level: 1
block_on: high
created: "2026-09-09"
---

# Phase 03 — Security

Independent auditor verified the authored fifteen-threat register against actual implementation. Its preliminary clean threshold verdict was superseded after both code-review defects were independently reproduced. Two high threats block advancement; one medium evidence gap is non-blocking.

## Trust boundaries

Host-controlled DOM crosses the exact-English table inspector and extension-owned marker boundary. The development harness crosses a loopback/CDP boundary using a fresh profile and synthetic target. User-controlled live observations cross into aggregate-only, source-bound acceptance records.

## Threat register

| Threat ID | Category | Component | Severity | Disposition | Planned mitigation | Status |
|---|---|---|---|---|---|---|
| T-03-01 | Tampering | inspector/reconciliation | high | mitigate | Exact allowlist, whole-table validation, same-table ownership and unsafe recovery regressions | OPEN — blocking; CR-01 copied markers bypass rejection |
| T-03-02 | Tampering | marker cleanup | high | mitigate | Clear complete owned/attempted set independently after faults; no stale rollback; fault-limit disclosure | CLOSED |
| T-03-03 | Repudiation | historical acceptance | high | mitigate | Immutable verified Git bytes supply hashes/settings; missing revision errors; old evidence preserved | CLOSED |
| T-03-04 | Spoofing | group/sticky header classification | medium | mitigate | Current paired identifiers and same-table guards; adversarial group and sibling decoy tests | CLOSED |
| T-03-05 | Denial of Service | observer/scheduler | high | mitigate | Input-derived filtering, one non-resetting pending pass, self-write suppression, continuous-burst and idle-quiescence tests | OPEN — blocking; CR-02 ambiguity recovery filtered out |
| T-03-06 | Information Disclosure | runtime channels/ownership | high | mitigate | Extended forbidden-channel sentinels and deterministic detached-row release across thirty switches | CLOSED |
| T-03-07 | Tampering | lifecycle resume | medium | mitigate | Idempotent pause/resume clears snapshots and revalidates current DOM before paint | CLOSED |
| T-03-08 | Elevation of Privilege | manifest and browser surfaces | high | mitigate | Preserve frozen manifest; DOM-only navigation; no added privileged runtime channel | CLOSED |
| T-03-09 | Information Disclosure | development harness | high | mitigate | Loopback allowlist, fresh profile, local synthetic target only, no existing authenticated session access | CLOSED |
| T-03-10 | Repudiation | performance evidence | high | mitigate | All samples retained, exact source hashes, deterministic counts, threshold negative tests, split live/synthetic status | CLOSED |
| T-03-11 | Denial of Service | Chrome/CDP driver | medium | mitigate | Command/sample deadlines, bounded batches and finally cleanup of child/profile/server | CLOSED |
| T-03-12 | Tampering | performance optimization | high | mitigate | Preserve whole-table veto and cleanup; actual-source regression suite after every optimization | CLOSED |
| T-03-13 | Information Disclosure | live evidence/heap inspection | high | mitigate | User-controlled authentication/navigation, aggregate-only records, no raw live captures or traces retained | CLOSED |
| T-03-14 | Repudiation | live acceptance validator | high | mitigate | Current source/settings, exact check inventory, duplicate rejection, dated live evidence and derived fail-closed status | CLOSED |
| T-03-15 | Tampering | deliberate failure scenario | medium | mitigate | Reviewed ephemeral selector-only change controlled by user; restore identifier; no ticket-data mutation | OPEN — below high threshold; reviewed snippet unavailable |

## Blocking evidence

- T-03-01: extension/content.js:80–83,121–124,193–198 clears tracked originals but leaves copied markers on a replacement clone rejected for Unknown Priority. See CR-01 in 03-REVIEW.md for the independent reproduction.
- T-03-05: extension/content.js:26–28,143–146 drops candidate identity during ambiguity and filters out the identifier removal that resolves it. No reconciliation is scheduled for the remaining valid table. See CR-02.
- T-03-15: successful user-controlled five-second selector removal/restoration is recorded, but the exact console snippet is unavailable for independent verification. This is missing evidence, not an observed data mutation.

## Closed mitigation evidence

T-03-02: content.js:76–114 independently clears tracked owned/attempted nodes; bounded permanent native-removal failure remains disclosed. T-03-03: test/extension/live-acceptance.test.js:13–32 binds historical Git bytes. T-03-04: content.js:6–13,30–69 enforces paired identifiers and topology. T-03-06: content.js:20–21,90–91,159–165 releases references; runtime-contract.test.js:54–106 exercises forbidden channels and thirty switches. T-03-07: content.js:159–177,202–205 implements idempotent pause/resume. T-03-08: unchanged manifest and DOM-only runtime preserve privileges.

T-03-09: scripts/run-tint-workload.js:150–184 provides exact loopback assets, temporary profile and its own target. T-03-10: driver:33–75,186–200 validates complete samples and identity, while attribution remains human_needed. T-03-11: driver:80,96,123,166–171,203–214 bounds commands and cleans resources. T-03-12: runtime unchanged during performance work; this preservation does not erase the newly found runtime defects. T-03-13: retained live evidence is sanitized aggregates; synthetic trace/heap data is discarded at driver:128–142. T-03-14: phase-03-live-acceptance.test.js:10–124 derives fail-closed current-source acceptance with exact inventory and dates.

## Accepted risks

No new risks accepted. The request to move on defers manual profiling only.

## Audit trail

2026-09-09 — gsd-security-auditor: 15 total,12 closed,3 open (2 high blocking,1 medium). Corrected verdict OPEN_THREATS supersedes preliminary SECURED after independent reproduction of CR-01 and CR-02. No runtime files changed. Four live checks and synthetic layout/retainer attribution remain human_needed independently.

## Sign-off

Blocked. Repair both runtime defects and rerun independent review/security verification. Reconcile source-bound evidence honestly if source changes; preserve existing user observations as historical evidence.
