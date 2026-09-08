---
phase: "02"
slug: first-tint-on-a-real-view
status: verified
threats_open: 0
threats_open_nonblocking: 2
threats_total: 10
threats_closed: 8
asvs_level: 1
block_on: high
created: "2026-09-08"
---

# Phase 02 — Security

Independent planned-threat audit: eight closed threats, two open medium threats, no open threats at or above high. This threshold verdict does not establish product acceptance or authorize phase advancement. All eleven live checks remain pending (`human_needed`).

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Host DOM to isolated script | Admit one owned English Garden table | Header and Priority text only |
| Isolated script to host DOM | Exact namespaced markers after whole-table validation | Recognized priority labels |
| Stylesheet to native page | Translucent backgrounds on direct ticket cells | Four local colour declarations |
| Authentic session to report | User owns navigation and native interactions | Non-identifying aggregate observations only |
| Repository assets to acceptance | Bind observations to the loaded source | Three SHA-256 hashes |

## Threat Register

All planned threats have disposition `mitigate`. The duplicate T-02-SC in the two plans is counted once. Paths below are repository-relative; live report references mean `.planning/phases/02-first-tint-on-a-real-view/02-LIVE-ACCEPTANCE.md`.

| Threat ID | Category | Component | Severity | Disposition | Mitigation and evidence | Status |
|-----------|----------|-----------|----------|-------------|-------------------------|--------|
| T-02-01 | Tampering | DOM preflight / marker commit | high | mitigate | `extension/content.js:23-101` validates ownership and all labels, synchronously revalidates, and rolls back interrupted writes; adverse tests in `test/extension/initial-tint.test.js` | closed |
| T-02-02 | Information disclosure | content.js | high | mitigate | Full runtime reviewed: only header/Priority text reads, no logging/storage/dynamic execution/network; actual-byte side-effect sentinels in `test/extension/runtime-contract.test.js:54-100` | closed |
| T-02-03 | Denial of service | startup lifecycle | medium | mitigate | `extension/content.js:104-146` coalesces checks, uses one non-extending deadline and terminal teardown; lifecycle/churn tests in `test/extension/initial-tint.test.js:338-392` | closed |
| T-02-04 | Elevation of privilege | manifest | high | mitigate | `extension/manifest.json:1-14`: storage only, exact HTTPS agent match, isolated top frame; exact asset/manifest assertions in `test/extension/runtime-contract.test.js:40-51` | closed |
| T-02-05 | Tampering | native appearance | medium | mitigate | Four background-only direct-cell rules and preservation tests exist. Authentic native-state and legibility checks remain pending in the live report | open — below high threshold (non-blocking) |
| T-02-06 | Information disclosure | acceptance report | high | mitigate | Actual pending report inspected: scoped hashes/settings and empty observations contain no tenant/ticket/raw DOM/private-path evidence. Report privacy contract retained; validator is not represented as universal sanitization | closed |
| T-02-07 | Tampering | authentic session actions | high | mitigate | No authentic account action occurred. Report explicitly assigns navigation/interactions to user and leaves missing states pending; runtime only changes owned markers/lifecycle state | closed — current exercised scope |
| T-02-08 | Repudiation | acceptance/source linkage | medium | mitigate | Three hashes independently recomputed and match; freshness and false-pass controls present. Loaded-directory confirmation is false and dated live observations are absent. Code review also identified validator defects requiring repair before use | open — below high threshold (non-blocking) |
| T-02-09 | Tampering | CSS/startup tuning | medium | mitigate | Whole-table preflight, direct-cell styling and documented stale-evidence invalidation retained. No runtime tuning or existing live observations required invalidation | closed |
| T-02-SC | Tampering | installed test tooling | high | mitigate | Installed Vitest 4.1.11 and happy-dom 20.13.1 independently checked against approved versions; dependency/approval diff from 608d98e is empty | closed |

## Accepted Risks Log

No new Phase 02 risk acceptance. Phase 01 AR-01-13 remains an explicitly accepted historical approval-independence uncertainty; it is **not-attested**, not newly verified, and authorizes no future installation. See `01-RISK-ACCEPTANCE.md` and `DEPENDENCY-APPROVALS.md`.

The two open medium threats have not been accepted or waived. Close their missing live portions through authentic source-bound user observations and re-audit.

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Blocking | Run By |
|------------|---------------|--------|------|----------|--------|
| 2026-09-08 | 10 | 8 | 2 | 0 | Independent gsd-security-auditor; orchestrator recorded result |

The auditor independently inspected code/tests, checked installed versions and recomputed runtime hashes. It did not rerun tests. Executor-attributed checks: 39 focused, 111 product, 284 combined tests passed; recon `FINAL VERDICT: proceed`. Independent code review remains a separate gate and its findings must be resolved separately.

## Sign-Off

- [x] All ten unique planned threats have an explicit disposition.
- [x] Historical accepted uncertainty retained without inventing attestation.
- [x] `threats_open: 0` at the configured high threshold.
- [x] Independent L1 mitigation audit recorded.
- [ ] T-02-05 authentic visual/native-state acceptance.
- [ ] T-02-08 loaded-source confirmation and dated observations.

**Approval:** Security threshold verified 2026-09-08; product acceptance remains `human_needed`.
