---
phase: "02"
slug: first-tint-on-a-real-view
status: verified
threats_open: 0
threats_open_nonblocking: 0
threats_total: 10
threats_closed: 10
asvs_level: 1
block_on: high
created: "2026-09-08"
updated: "2026-09-09"
---

# Phase 02 — Security

**Independent reassessment: SECURED, 10/10 planned threats closed.**
The auditor independently inspected implementation, evidence contracts, installed
tool versions and repository hashes. Authentic appearance and loaded-directory
claims are explicitly attributed to user testimony; the auditor did not observe
the browser itself. This audit does not alone authorize phase advancement.

## Threat Register

All dispositions remain `mitigate`. No risk was accepted to close a finding.
The duplicate T-02-SC in the plans is counted once.

| Threat | Category | Severity | Status | Mitigation evidence |
|---|---|---|---|---|
| T-02-01 | Tampering | high | closed | content.js:23-101 whole-table admission, synchronous revalidation and rollback; adverse initial-tint regressions |
| T-02-02 | Information disclosure | high | closed | Full runtime has no collection/data channels; runtime-contract sentinels and source restrictions |
| T-02-03 | Denial of service | medium | closed | content.js:104-146 non-extending deadline, coalescing and terminal disposal; lifecycle/churn tests |
| T-02-04 | Elevation of privilege | high | closed | Exact manifest static scope, isolated top frame and local assets; manifest contract |
| T-02-05 | Tampering | medium | closed | Direct-cell alpha backgrounds and preservation tests plus explicit authentic user acceptance of all hues/native states in UAT |
| T-02-06 | Information disclosure | high | closed | Current report inspected: aggregate observations/settings/hashes, no tenant/ticket identifiers, raw DOM or private paths |
| T-02-07 | Tampering | high | closed | Recorded checks retain user/safe-action boundaries; runtime only writes owned markers and lifecycle state |
| T-02-08 | Repudiation | medium | closed | User confirmed directory/reloads; dated live evidence, independently recomputed hashes and truthful-disposition validator |
| T-02-09 | Tampering | medium | closed | Whole-table/direct-cell controls and source-invalidation/retest rules remain; runtime diff against a58b826 empty |
| T-02-SC | Tampering | high | closed | Installed Vitest 4.1.11 and happy-dom 20.13.1 verified; dependency files unchanged; historical independence not-attested |

## Source and Live-Evidence Boundaries

The auditor independently recomputed these hashes:

- manifest.json: `0c959d71e71b34f5f5d4bc75ffc84f7838f09cc7f0db95d24ad605d45ca57ee6`
- content.js: `35051cca30a12217e121d270715b70616b3deeaca1e697b7904358516f29cd70`
- zhroma.css: `f5af38707480b2379d00343d36ec3a54b27ae79e95a09ad00a4538230c586b61`

G-02-1 is reclassified only after the user clarified both reports as opening
Zendesk then clicking a view. Direct-document controls passed. No runtime repair,
exact lifecycle diagnosis, universal timing guarantee or unobserved delayed-batch
coverage is established. Phase 3 navigation/pagination liveness is unimplemented.

## Accepted Risks

No new Phase 02 risk acceptance. AR-01-13 retains the explicitly accepted Phase 1
historical approval-independence uncertainty as **not-attested**. This audit adds
no retrospective attestation and grants no future installation permission.

## Audit Trail

| Date | Closed | Open | Blocking | Authority |
|---|---|---|---|---|
| 2026-09-08 | 8 | 2 medium | 0 | Independent gsd-security-auditor; original snapshot before authentic evidence |
| 2026-09-09 | 10 | 0 | 0 | Independent gsd-security-auditor reassessment; orchestrator recorded returned verdict |

The original open T-02-05/08 missing-evidence portions are now supported by
explicitly attributed authentic user observations and loaded-source confirmation.
No security risk waiver or speculative remediation closed them. Original report
is preserved in Git history. CR-01/02 were repaired in 0ddcc27/a58b826 and
independently re-reviewed clean. No new unregistered threat flags were found.

Orchestrator verification this run: 301 combined tests; after reconciliation,
56 focused tests with acceptance passed. Auditor did not rerun tests.

## Sign-Off

- [x] All ten unique threats independently reassessed at L1.
- [x] T-02-05 authentic appearance evidence reviewed with attribution.
- [x] T-02-08 loaded-source/dates/hashes reviewed with attribution.
- [x] Zero open threats at or below the configured threshold.
- [x] Historical not-attested exception and Phase 3 limits preserved.

Security threshold verified; goal verification remains a separate gate.
