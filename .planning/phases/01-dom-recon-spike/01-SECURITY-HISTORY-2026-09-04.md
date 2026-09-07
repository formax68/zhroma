---
phase: 01-dom-recon-spike
reviewed: 2026-09-04
standard: OWASP ASVS Level 1
status: verified
block_on: high
threats_found: 33
threats_closed: 27
threats_open: 0
threats_open_nonblocking: 6
---

# Phase 1 Security and Prohibition Review

This record evaluates the repository-visible Phase 1 evidence pipeline. It does
not infer authenticated-session history, live fixture origin, tenant identity,
or private raw-capture custody from sanitized repository bytes. The two
repository-invisible facts were explicitly approved at the Plan 01-08
blocking-human checkpoint without recording identifying content.

## Security Result

The nominal 71-test suite and the two approved human judgments pass, but the
independent execute-post review and security audit reproduced fail-open behavior
outside that suite. Ten high-severity threats were found at the configured
blocking threshold and six additional lower-severity threats remain open.

The user explicitly accepted all ten high-severity threats as documented risks
on 2026-09-04. This closes the security advancement gate without claiming that
the implementation defects were remediated. The repository's current
`FINAL VERDICT: proceed` remains contradicted by direct probes; advancement is a
risk-accepted override, not proof that those probes now pass.

## STRIDE / ASVS Level 1 Results

| Threat | Category | Severity | Automated result | Remaining judgment | Disposition |
|---|---|---:|---|---|---|
| T-01-28 | Information disclosure | high | Canonical containment, symlink rejection, scan-before-parse, and detached parsing pass. | None for those bounded controls. | mitigated by test |
| T-01-29 | Tampering | high | Exact CLI arity passes, but evidence relabeling, prose-only fallback proof, private paint strings, and unresolved inputs can still authorize `proceed`. | Explicitly accepted by the user as an unremediated risk. | closed — accepted risk |
| T-01-30 | Spoofing | high | Checksums pass, but assertion-kind and canonical-file uniqueness are not enforced. | Explicitly accepted by the user as an unremediated risk. | closed — accepted risk |
| T-01-31 | Repudiation | medium | This record assigns a test or judgment owner and evidence reference to every inherited prohibition. | The two external-session facts were explicitly approved at the Plan 01-08 checkpoint. | mitigated by approved judgment |
| T-01-32 | Denial of service | medium | Many malformed inputs fail non-zero, but canonical aliases, ignored unresolved inputs, and JSON `null` escape the stable contract-error model. | None. | open — non-blocking |
| T-01-SC | Supply-chain tampering | high | No install or dependency change occurred; only the supported Node engine range was declared. | None. | mitigated by unchanged lockfile/toolchain |

## Five Inherited Prohibition Records

| # | Requirement | Category | Exact prohibition | Verification tier | Evidence reference | Current disposition |
|---:|---|---|---|---|---|---|
| 1 | RECON-01 | privacy | Repository evidence must not trade tenant confidentiality for fixture fidelity: no real ticket, person, organization, account content, identifying metadata, or raw-capture location may enter a project artifact. | test | `01-REVIEW.md` CR-01 through CR-04 and CR-11; independent security audit | accepted risk — Unicode, denylist-custody, Priority-index, sanitizer-contract, and diagnostic-disclosure defects remain unremediated |
| 2 | RECON-01 | transparency | A hand-authored toy table must not be presented as a captured live Zendesk fixture. | judgment plus test | Plan 01-08 blocking-human checkpoint approval; `01-REVIEW.md` CR-04 through CR-06 | accepted risk — current admission does not enforce sanitizer provenance, assertion kind, or three distinct canonical files |
| 3 | RECON-02 | transparency | An English-only observation must not be represented as evidence of localization, legacy-interface, vanity-domain, or cross-plan compatibility. | test | `01-REVIEW.md` CR-07 and CR-08; independent security audit | accepted risk — required evidence can be relabeled outside scope and unstructured prose can stand in for fallback proof |
| 4 | RECON-02 | safety | Reconnaissance must not alter an operational Zendesk view or take login, MFA, locale, disposable-view, cleanup, or consequential account actions out of the user's control. | judgment | `SELECTORS.md` Authenticated Interaction Handoff and interaction evidence; Plan 01-08 blocking-human checkpoint approval | accepted — the user approved that login, MFA, locale, sensitive navigation, disposable-view management, cleanup, and operational-view safety remained under user control |
| 5 | RECON-03 | evidence-integrity | An inconclusive `host.shadowRoot === null` observation must not be reported as proof that the ticket list has no closed Shadow DOM boundary. | test | `SELECTORS.md` root-chain and top-document-reachability entries; final-gate predicate tests | accepted — automated two-part proof passes |

## Final-Gate Security Rule

- `block` is always the conservative admissible verdict when a human or automated
  predicate is missing, failed, or disputed.
- `proceed` is admissible only after the complete ledger and corpus pass, positive
  interaction paint is recorded, the selected-node root chain rules out a closed
  boundary, selector/fallback evidence is matrix-bound, and all five prohibition
  dispositions are explicitly accepted.
- The implementation does not yet enforce this rule. Direct probes reproduced
  paths where relabeled evidence, prose-only proof, private paint strings, and
  seven unresolved inputs still return `proceed`.

## Accepted Blocking Threats

All ten threats below remain technically unremediated. The user explicitly
accepted them on 2026-09-04 so that the security gate may advance.

| Threat | Category | Missing mitigation | Disposition |
|---|---|---|---|
| T-01-01 | Information disclosure | Unicode-normalized sensitive scanning and value-free path diagnostics | closed — accepted risk |
| T-01-09 | Information disclosure | Stable Priority indexing and canonical private-denylist custody outside the worktree | closed — accepted risk |
| T-01-10 | Tampering | Exact assertion-kind validation and canonical file uniqueness | closed — accepted risk |
| T-01-13 | Information disclosure | End-to-end sanitizer-output admission, Unicode handling, and correct Priority scoping | closed — accepted risk |
| T-01-15 | Tampering | Proof that admitted bytes satisfy the current sanitizer contract and come from three distinct files | closed — accepted risk |
| T-01-20 | Information disclosure | Production paint-evidence privacy grammar | closed — accepted risk |
| T-01-21 | Spoofing | Structured paint grammar and exact scenario validation | closed — accepted risk |
| T-01-24 | Information disclosure | Strict table boundary, denylist custody, Unicode handling, and sanitizer revalidation | closed — accepted risk |
| T-01-29 | Tampering | Fail-closed handling for relabeling, fallback proof, private paint, and unresolved inputs | closed — accepted risk |
| T-01-30 | Spoofing | Priority-absence assertion kind and canonical scenario uniqueness | closed — accepted risk |

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---|---|---|---|---|
| AR-01-01 | T-01-01 | Explicit override; defect remains unremediated and review evidence remains valid. | User | 2026-09-04 |
| AR-01-02 | T-01-09 | Explicit override; defect remains unremediated and review evidence remains valid. | User | 2026-09-04 |
| AR-01-03 | T-01-10 | Explicit override; defect remains unremediated and review evidence remains valid. | User | 2026-09-04 |
| AR-01-04 | T-01-13 | Explicit override; defect remains unremediated and review evidence remains valid. | User | 2026-09-04 |
| AR-01-05 | T-01-15 | Explicit override; defect remains unremediated and review evidence remains valid. | User | 2026-09-04 |
| AR-01-06 | T-01-20 | Explicit override; defect remains unremediated and review evidence remains valid. | User | 2026-09-04 |
| AR-01-07 | T-01-21 | Explicit override; defect remains unremediated and review evidence remains valid. | User | 2026-09-04 |
| AR-01-08 | T-01-24 | Explicit override; defect remains unremediated and review evidence remains valid. | User | 2026-09-04 |
| AR-01-09 | T-01-29 | Explicit override; defect remains unremediated and review evidence remains valid. | User | 2026-09-04 |
| AR-01-10 | T-01-30 | Explicit override; defect remains unremediated and review evidence remains valid. | User | 2026-09-04 |

### Open below threshold

| Threat | Category | Missing mitigation |
|---|---|---|
| T-01-03 | Tampering | Parse and block on the seven unresolved table-form inputs |
| T-01-04 | Denial of service | Record the planned acceptance in the accepted-risks log |
| T-01-12 | Denial of service | Reject mixed direct header/body children instead of filtering them |
| T-01-19 | Denial of service | Convert scenario, fallback, and terminal-input failures into `block` |
| T-01-27 | Denial of service | Reject ambiguous mixed header/body structure before output |
| T-01-32 | Denial of service | Reject canonical aliases and JSON `null` through the stable error contract |

Closed by the independent audit: T-01-02, T-01-05, T-01-06, T-01-07,
T-01-08, T-01-11, T-01-14, T-01-16, T-01-17, T-01-18, T-01-22,
T-01-23, T-01-25, T-01-26, T-01-28, T-01-31, and T-01-SC.

## Confirmed Contrary Evidence

All eleven critical findings in `01-REVIEW.md` (CR-01 through CR-11) were
independently confirmed and mapped to the risk register above. WR-02 was also
confirmed against T-01-32; WR-01 and WR-03 remain unregistered review warnings.

## Human Review Resolution

At the Plan 01-08 blocking-human checkpoint, the user explicitly approved these
repository-invisible facts without disclosing tenant values or private paths:

1. All three fixtures are live-derived from the named English current Agent
   Workspace scenarios and are not hand-authored toy tables.
2. Login, MFA, locale, sensitive navigation, disposable-view management,
   cleanup, and operational-view safety remained under the user's control.

The two human judgments are resolved. Technical prohibitions 1 through 3 remain
violated or unremediated under the explicit risk acceptance. If remediation is
later undertaken, the repository verdict should return to `block` until the
contrary probes pass; automated privacy, scope, and Shadow DOM controls do not
erase that evidence.

## Security Audit 2026-09-04

| Metric | Count |
|---|---:|
| Threats found | 33 |
| Closed, including accepted risks | 27 |
| Open, all severities | 6 |
| Open at blocking threshold | 0 |

Result: `THREAT-SECURE` by explicit risk acceptance. Six below-threshold threats
remain open and all ten accepted high-severity defects remain unremediated.
`threats_open: 0` records gate disposition only; it does not erase the findings.
