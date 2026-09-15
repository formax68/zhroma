---
phase: "03"
slug: the-tint-survives-everything
status: secured
threats_open: 0
threats_open_total: 1
threats_closed: 14
asvs_level: 1
block_on: high
created: "2026-09-09"
---

# Phase 03 — Security Reverification

Independent gsd-security-auditor verified all fifteen authored threat mitigations on final content.js SHA-256 `aaf2596dd41e67b520d6accd9ff55ecf8ab525de0098571dc284c81773998dc2`. Verdict SECURED at ASVS 1 / high blocking threshold: fourteen closed, zero blocking open, one non-blocking medium evidence gap. This verifies mitigation implementation, not phase completion or live acceptance.

## Trust boundaries

Host-controlled DOM crosses the exact-English inspector and extension-owned marker boundary. The development harness uses allowlisted loopback assets and a fresh Chrome profile. User-controlled live observations remain aggregate-only and source-bound.

## Threat register

| Threat ID | Category | Component | Severity | Disposition | Planned mitigation | Status |
|---|---|---|---|---|---|---|
| T-03-01 | Tampering | inspector/reconciliation | high | mitigate | Exact allowlist, whole-table validation, same-table ownership and unsafe recovery regressions | CLOSED — final repaired source adopts copied markers before fresh validation |
| T-03-02 | Tampering | marker cleanup | high | mitigate | Clear complete owned/attempted set independently after faults; no stale rollback; fault-limit disclosure | CLOSED |
| T-03-03 | Repudiation | historical acceptance | high | mitigate | Immutable verified Git bytes supply hashes/settings; missing revision errors; old evidence preserved | CLOSED |
| T-03-04 | Spoofing | group/sticky header classification | medium | mitigate | Current paired identifiers and same-table guards; adversarial group and sibling decoy tests | CLOSED |
| T-03-05 | Denial of Service | observer/scheduler | high | mitigate | Input-derived filtering, one non-resetting pending pass, self-write suppression, continuous-burst and idle-quiescence tests | CLOSED — table identifier removal invalidates even with null candidate |
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


## Repaired blocking findings

- T-03-01 / CR-01: content.js adopts reserved markers across every added subtree and marker mutation before filtering. Lifecycle entry also discovers preexisting copies. Only a freshly validated whole-table snapshot permits retained or positive markers. Unknown, incomplete and blank rows cannot retain copied paint; detached originals are cleaned and released. Regressions cover native observer delivery and the state before deferred positive writes.
- T-03-05 / CR-02: removing or changing either table identifier invalidates the candidate universe even when ambiguity left no unique candidate and the changed table no longer matches. Native-observer regressions cover either identifier and both identifiers removed in one delivery, with one pending coalesced pass and automatic recovery.
- Existing cleanup fault, ownership release, no-data-channel, lifecycle, same-table topology and minimal manifest mitigations remain intact. The harness retains bounded CDP commands, a separately bounded 180-second matrix, finally cleanup, exact identity and overwrite refusal.

## Remaining evidence gap

T-03-15 remains OPEN, medium and below the high blocking threshold. Historical records describe the user-controlled five-second selector removal/restoration result, but the exact reviewed snippet and its provenance remain unavailable. Do not invent that code or infer risk acceptance. Recover the exact historical operation before closing this finding.

## Audit trail

The [original blocked audit](history/2026-09-09-before-runtime-repair/03-SECURITY.md) is preserved byte-for-byte. Its two independently reproduced blockers prompted these repairs.

2026-09-09 — Independent gsd-security-auditor reverified all fifteen authored threats using source and regression inspection at ASVS 1. Fourteen closed; one non-blocking medium open; no unregistered flags. The auditor ran no tests during active synthetic matrices to avoid interference. Parent validation and final code review are recorded separately in 03-REPAIR-SUMMARY.md and 03-REVIEW.md.

## Acceptance boundaries

No new risks accepted. Current-source live confirmation and twenty checks remain pending; previous sixteen passes remain historical. Synthetic timing passed, but layout/retainer attribution remains human_needed. Manual profiling remains deferred. This security threshold verdict does not close those separate phase gates.
