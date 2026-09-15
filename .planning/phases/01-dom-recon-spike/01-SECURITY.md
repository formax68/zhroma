---
phase: 01-dom-recon-spike
reviewed: 2026-09-08
source_snapshot: 1341022
standard: OWASP ASVS Level 1
status: verified
block_on: high
threats_found: 68
threats_closed: 68
threats_open: 0
threats_open_nonblocking: 0
---

# Phase 1 Security and Prohibition Review

All reproduced implementation bypasses are remediated and independently rechecked. The security gate is resolved by an explicit acceptance of **one historical risk represented by two threat IDs**. Original dependency approval independence remains not-attested; the user accepted proceeding despite that missing historical evidence on 2026-09-08. This is governance acceptance, not retrospective verification.

This report supersedes the technical status in [the 2026-09-04 report](01-SECURITY-HISTORY-2026-09-04.md). Its accepted-risk history is preserved there; none of those prior overrides substitutes for the technical fixes verified here.

## Independent Audit Evidence

A gsd-security-auditor reviewed all 68 deduplicated plan-authored threats at ASVS1, first against source 83d2be6, then 8572685 and 1341022. A separate gsd-code-reviewer identified the residual false-header and paint-equivalence cases. The original 165 passing tests did not close those defects. New RED regressions reproduced them before fixes.

- Full recheck at 8572685: 172 tests passed (64 Node, 108 Vitest).
- Final source 1341022: full suite 173 passed (65 Node, 108 Vitest); independent security recheck ran all 50 focused interaction/gate cases and original adversarial probes.
- Private color/gradient words, equivalent transparent or opaque RGB/RGBA states, unrelated fallback proof files, unproven private paths, extra private flag prose, and body-row header substitution now reject.
- Corpus checks bind canonical distinct files, exact byte hashes, shared sanitized-output grammar, actual header identity, scenario assertions and sanitizer round-trip parity.
- Six gating assumptions bind exact test-reference sets and case/code anchors; the approved unresolved RECON-01/unclassified exception is explicitly surfaced.
- Privacy and authenticated-session judgments remain distinct. No fresh capture, tenant identity, or retrospective independence attestation was inferred.

## Historical Issue — Explicitly Accepted

| Threat | Severity | Evidence | Disposition |
|---|---|---|---|
| T-01-05 | high | DEPENDENCY-APPROVALS.md records independence as not-attested; user said “I don't remember, it should be fine”. | CLOSED — accepted risk AR-01-13; historical fact remains not-attested |
| T-01-SC | high | Same original approval-independence requirement inherited by the supply-chain register. | CLOSED — same accepted risk AR-01-13 |

Acceptance comes from the later explicit “risk accepted” decision, not from the Plan 01-15 execution approval. See 01-RISK-ACCEPTANCE.md. Plan 01-10's truthful not-attested record is retained.

## Existing Planned Acceptances Recorded

| Risk | Threat | Rationale | Acceptance authority | Recorded on |
|---|---|---|---|---|
| AR-01-11 | T-01-04 | Local smoke inputs are bounded developer-controlled strings; production capture size/parsing controls are implemented before admission. | Existing accept disposition in 01-01-PLAN.md:208 | 2026-09-07 |
| AR-01-12 | T-01-37 | Unsupported Node versions fail loudly on the developer machine; untrusted parties do not choose the runtime. | Existing accept disposition in 01-09-PLAN.md:305 | 2026-09-07 |

These entries record already-authored plan dispositions, not newly obtained user acceptances or invented historical acceptance dates.

## Explicit User Acceptance

| Risk | Threats | Rationale | Accepted by | Recorded on |
|---|---|---|---|---|
| AR-01-13 | T-01-05, T-01-SC | Proceed despite incomplete historical evidence that the two original package approvals were independent; keep not-attested. | User — verbatim “risk accepted”; 01-RISK-ACCEPTANCE.md | 2026-09-08 |

## Complete Register

Each row retains its plan-authored category and severity. CLOSED means the independent audit verified its registered mitigation, retained an explicit prior human judgment where repository evidence cannot prove it, or recorded the two existing low-risk accept dispositions above. The source plan carries the complete mitigation text.

| Threat | Category | Severity | Status | Evidence owner |
|---|---|---|---|---|
| T-01-01 | Information Disclosure | high | CLOSED | sensitive-patterns.js; sanitizer privacy regressions; .gitignore; 01-01-PLAN.md |
| T-01-02 | Spoofing | high | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-01-PLAN.md |
| T-01-03 | Tampering | medium | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-01-PLAN.md |
| T-01-04 | Denial of Service | low | CLOSED | Existing planned acceptance above; 01-01-PLAN.md |
| T-01-SC | Tampering | high | CLOSED — AR-01-13 | DEPENDENCY-APPROVALS.md — historical independence not-attested; 01-01-PLAN.md |
| T-01-05 | Spoofing | high | CLOSED — AR-01-13 | DEPENDENCY-APPROVALS.md — historical independence not-attested; 01-02-PLAN.md |
| T-01-06 | Information Disclosure | high | CLOSED | SELECTORS.md authenticated handoff; historical user judgment retained; 01-02-PLAN.md |
| T-01-07 | Elevation of Privilege | high | CLOSED | SELECTORS.md authenticated handoff; historical user judgment retained; 01-02-PLAN.md |
| T-01-08 | Spoofing | medium | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-02-PLAN.md |
| T-01-09 | Information Disclosure | high | CLOSED | sanitize-fixture.js; sanitized-output-contract.js; sanitizer regressions; 01-03-PLAN.md |
| T-01-10 | Tampering | high | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-03-PLAN.md |
| T-01-11 | Information Disclosure | high | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-03-PLAN.md |
| T-01-12 | Denial of Service | medium | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-03-PLAN.md |
| T-01-14 | Spoofing | high | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-04-PLAN.md |
| T-01-17 | Repudiation | medium | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-04-PLAN.md |
| T-01-18 | Elevation of Privilege | high | CLOSED | SELECTORS.md authenticated handoff; historical user judgment retained; 01-04-PLAN.md |
| T-01-13 | Information Disclosure | high | CLOSED | sanitize-fixture.js; sanitized-output-contract.js; sanitizer regressions; 01-05-PLAN.md |
| T-01-15 | Tampering | high | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-05-PLAN.md |
| T-01-16 | Information Disclosure | high | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-05-PLAN.md |
| T-01-19 | Denial of Service | medium | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-05-PLAN.md |
| T-01-20 | Information Disclosure | high | CLOSED | interaction-evidence.js; production gate and interaction regressions; 01-06-PLAN.md |
| T-01-21 | Spoofing | high | CLOSED | interaction-evidence.js; production gate and interaction regressions; 01-06-PLAN.md |
| T-01-22 | Elevation of Privilege | high | CLOSED | SELECTORS.md authenticated handoff; historical user judgment retained; 01-06-PLAN.md |
| T-01-23 | Tampering | medium | CLOSED | interaction-evidence.js; production gate and interaction regressions; 01-06-PLAN.md |
| T-01-24 | Information Disclosure | high | CLOSED | sanitize-fixture.js; sanitized-output-contract.js; sanitizer regressions; 01-07-PLAN.md |
| T-01-25 | Tampering | high | CLOSED | sanitize-fixture.js; sanitized-output-contract.js; sanitizer regressions; 01-07-PLAN.md |
| T-01-26 | Tampering | high | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-07-PLAN.md |
| T-01-27 | Denial of Service | medium | CLOSED | sanitize-fixture.js; sanitized-output-contract.js; sanitizer regressions; 01-07-PLAN.md |
| T-01-28 | Information Disclosure | high | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-08-PLAN.md |
| T-01-29 | Tampering | high | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-08-PLAN.md |
| T-01-30 | Spoofing | high | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-08-PLAN.md |
| T-01-31 | Repudiation | medium | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-08-PLAN.md |
| T-01-32 | Denial of Service | medium | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-08-PLAN.md |
| T-01-33 | Information Disclosure | high | CLOSED | sensitive-patterns.js; sanitizer privacy regressions; .gitignore; 01-09-PLAN.md |
| T-01-34 | Information Disclosure | high | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-09-PLAN.md |
| T-01-35 | Tampering | high | CLOSED | sensitive-patterns.js; sanitizer privacy regressions; .gitignore; 01-09-PLAN.md |
| T-01-36 | Tampering | medium | CLOSED | sensitive-patterns.js; sanitizer privacy regressions; .gitignore; 01-09-PLAN.md |
| T-01-37 | Denial of Service | low | CLOSED | Existing planned acceptance above; 01-09-PLAN.md |
| T-01-38 | Repudiation | high | CLOSED | DEPENDENCY-APPROVALS.md; dependency-approvals.smoke.js; 01-10-PLAN.md |
| T-01-39 | Tampering | medium | CLOSED | DEPENDENCY-APPROVALS.md; dependency-approvals.smoke.js; 01-10-PLAN.md |
| T-01-40 | Information Disclosure | medium | CLOSED | DEPENDENCY-APPROVALS.md; dependency-approvals.smoke.js; 01-10-PLAN.md |
| T-01-41 | Information Disclosure | high | CLOSED | sanitize-fixture.js; sanitized-output-contract.js; sanitizer regressions; 01-11-PLAN.md |
| T-01-42 | Information Disclosure | high | CLOSED | sanitize-fixture.js; sanitized-output-contract.js; sanitizer regressions; 01-11-PLAN.md |
| T-01-43 | Spoofing | high | CLOSED | sanitize-fixture.js; sanitized-output-contract.js; sanitizer regressions; 01-11-PLAN.md |
| T-01-44 | Tampering | high | CLOSED | sanitize-fixture.js; sanitized-output-contract.js; sanitizer regressions; 01-11-PLAN.md |
| T-01-45 | Information Disclosure | high | CLOSED | sanitize-fixture.js; sanitized-output-contract.js; sanitizer regressions; 01-11-PLAN.md |
| T-01-46 | Repudiation | medium | CLOSED | sanitize-fixture.js; sanitized-output-contract.js; sanitizer regressions; 01-11-PLAN.md |
| T-01-47 | Spoofing | high | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-12-PLAN.md |
| T-01-48 | Repudiation | high | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-12-PLAN.md |
| T-01-49 | Tampering | high | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-12-PLAN.md |
| T-01-50 | Spoofing | high | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-12-PLAN.md |
| T-01-51 | Information Disclosure | medium | CLOSED | sanitize-fixture.js; sanitized-output-contract.js; sanitizer regressions; 01-12-PLAN.md |
| T-01-52 | Spoofing | high | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-13-PLAN.md |
| T-01-53 | Spoofing | high | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-13-PLAN.md |
| T-01-54 | Tampering | high | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-13-PLAN.md |
| T-01-55 | Denial of Service | medium | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-13-PLAN.md |
| T-01-56 | Information Disclosure | high | CLOSED | fixture-contract.js; shared grammar; corpus provenance and admission regressions; 01-13-PLAN.md |
| T-01-57 | Tampering | high | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-14-PLAN.md |
| T-01-58 | Information Disclosure | high | CLOSED | interaction-evidence.js; production gate and interaction regressions; 01-14-PLAN.md |
| T-01-59 | Spoofing | high | CLOSED | interaction-evidence.js; production gate and interaction regressions; 01-14-PLAN.md |
| T-01-60 | Repudiation | medium | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-14-PLAN.md |
| T-01-61 | Denial of Service | low | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-14-PLAN.md |
| T-01-62 | Tampering | high | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-15-PLAN.md |
| T-01-63 | Tampering | high | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-15-PLAN.md |
| T-01-64 | Repudiation | high | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-15-PLAN.md |
| T-01-65 | Spoofing | high | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-15-PLAN.md |
| T-01-66 | Information Disclosure | medium | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-15-PLAN.md |
| T-01-67 | Repudiation | medium | CLOSED | SELECTORS.md; verify-recon-gate.js; final-gate regressions; 01-15-PLAN.md |

## Inherited Prohibition Dispositions

| Prohibition | Current disposition |
|---|---|
| No tenant content, metadata or private capture paths in admitted artifacts | Technical admission controls verified; numeric computed-paint grammar and private-path rejection rechecked. No claim of automated proof of all historical session content. |
| No toy table presented as a live capture | Current corpus explicitly labels approved repository-byte re-admission, no fresh capture, original hashes recoverable in Git; historical origin remains the recorded human judgment. |
| No English observations generalized to localization, legacy shell, vanity domain or cross-plan compatibility | Required English evidence contracts and scenario sets cannot be relabeled out of scope; ledger limitations retained. |
| Authentication, operational navigation and account actions remain user-controlled | Existing explicit human judgment retained; no new browser session or consequential action in these gap plans. |
| Null shadowRoot alone is not conclusive | Structured two-part root-chain plus top-document reachability proof and negative regression verified. |

## Audit Outcome

68 of 68 registered threats closed, including T-01-05/T-01-SC by one explicit user risk acceptance. No open technical or governance blocker remains. Historical independence is still not-attested. The unchanged technical evidence is source 1341022; this update records a human disposition only. Formal phase acceptance is evaluated separately.
