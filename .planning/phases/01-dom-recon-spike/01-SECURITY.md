---
phase: 01-dom-recon-spike
reviewed: 2026-09-04
standard: OWASP ASVS Level 1
status: pass
block_on: high
---

# Phase 1 Security and Prohibition Review

This record evaluates the repository-visible Phase 1 evidence pipeline. It does
not infer authenticated-session history, live fixture origin, tenant identity,
or private raw-capture custody from sanitized repository bytes. The two
repository-invisible facts were explicitly approved at the Plan 01-08
blocking-human checkpoint without recording identifying content.

## Security Result

Automated controls are in place for bounded sanitization, value-free sensitive
content rejection, canonical fixture containment, exact final-byte checksums,
detached inert parsing, scenario fidelity, complete ledger IDs, scenario binding,
and evidence-derived verdict rejection. No package, network, authentication, or
new runtime dependency was introduced by Plan 01-08.

The security result is `pass`: deterministic controls pass, and the user approved
the live-derived provenance and retained-control facts that repository tests
cannot establish. All five records below now have explicit final dispositions,
and `SELECTORS.md` records `prohibition-dispositions: passed`.

## STRIDE / ASVS Level 1 Results

| Threat | Category | Severity | Automated result | Remaining judgment | Disposition |
|---|---|---:|---|---|---|
| T-01-28 | Information disclosure | high | The shared corpus validator canonicalizes paths, scans exact bytes before parsing, rejects active/resource content with value-free diagnostics, and parses only in an isolated query-only window. | None for repository admission. | mitigated by test |
| T-01-29 | Tampering | high | Final mode requires exact CLI arity, the complete production evidence-ID set, admitted-scenario binding, blocking predicates, and the shared corpus validator. | Approved human dispositions are required before `proceed`. | mitigated by test and approved judgment |
| T-01-30 | Spoofing | high | Every fixture is checksum-bound and validated against declared header, ticket-row, group-row, Priority-index, and same-table scroll facts. | The user approved that all three fixtures are live-derived from the named English current Agent Workspace scenarios. | mitigated by test and approved judgment |
| T-01-31 | Repudiation | medium | This record assigns a test or judgment owner and evidence reference to every inherited prohibition. | The two external-session facts were explicitly approved at the Plan 01-08 checkpoint. | mitigated by approved judgment |
| T-01-32 | Denial of service | medium | Malformed modes, arguments, ledgers, manifests, paths, selectors, facts, and checksums fail non-zero. | None. | mitigated by test |
| T-01-SC | Supply-chain tampering | high | No install or dependency change occurred; only the supported Node engine range was declared. | None. | mitigated by unchanged lockfile/toolchain |

## Five Inherited Prohibition Records

| # | Requirement | Category | Exact prohibition | Verification tier | Evidence reference | Current disposition |
|---:|---|---|---|---|---|---|
| 1 | RECON-01 | privacy | Repository evidence must not trade tenant confidentiality for fixture fidelity: no real ticket, person, organization, account content, identifying metadata, or raw-capture location may enter a project artifact. | test | `test/recon/sanitize-fixture.test.js`; `test/recon/fixture-contract.test.js`; `npm run test:recon` | accepted — automated admission and sensitive-content controls pass |
| 2 | RECON-01 | transparency | A hand-authored toy table must not be presented as a captured live Zendesk fixture. | judgment | `SELECTORS.md` Admitted Fixture Corpus; Plan 01-08 blocking-human checkpoint approval | accepted — the user approved that all three fixtures are live-derived from the named English current Agent Workspace scenarios and are not hand-authored toy tables |
| 3 | RECON-02 | transparency | An English-only observation must not be represented as evidence of localization, legacy-interface, vanity-domain, or cross-plan compatibility. | test | `test/recon/recon-gate.smoke.js`; `SELECTORS.md` scope and localization entries | accepted — automated scope checks pass |
| 4 | RECON-02 | safety | Reconnaissance must not alter an operational Zendesk view or take login, MFA, locale, disposable-view, cleanup, or consequential account actions out of the user's control. | judgment | `SELECTORS.md` Authenticated Interaction Handoff and interaction evidence; Plan 01-08 blocking-human checkpoint approval | accepted — the user approved that login, MFA, locale, sensitive navigation, disposable-view management, cleanup, and operational-view safety remained under user control |
| 5 | RECON-03 | evidence-integrity | An inconclusive `host.shadowRoot === null` observation must not be reported as proof that the ticket list has no closed Shadow DOM boundary. | test | `SELECTORS.md` root-chain and top-document-reachability entries; final-gate predicate tests | accepted — automated two-part proof passes |

## Final-Gate Security Rule

- `block` is always the conservative admissible verdict when a human or automated
  predicate is missing, failed, or disputed.
- `proceed` is admissible only after the complete ledger and corpus pass, positive
  interaction paint is recorded, the selected-node root chain rules out a closed
  boundary, selector/fallback evidence is matrix-bound, and all five prohibition
  dispositions are explicitly accepted.
- Editing only the verdict text cannot turn a blocked record into `proceed`.

## Human Review Resolution

At the Plan 01-08 blocking-human checkpoint, the user explicitly approved these
repository-invisible facts without disclosing tenant values or private paths:

1. All three fixtures are live-derived from the named English current Agent
   Workspace scenarios and are not hand-authored toy tables.
2. Login, MFA, locale, sensitive navigation, disposable-view management,
   cleanup, and operational-view safety remained under the user's control.

No prohibition remains unresolved. Any future contrary evidence must restore a
`block` verdict; automated privacy, scope, and Shadow DOM controls do not override
a failed or withdrawn human judgment.
