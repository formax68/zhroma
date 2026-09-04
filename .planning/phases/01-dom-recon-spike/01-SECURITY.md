---
phase: 01-dom-recon-spike
reviewed: 2026-09-04
standard: OWASP ASVS Level 1
status: human_needed
block_on: high
---

# Phase 1 Security and Prohibition Review

This record evaluates the repository-visible Phase 1 evidence pipeline. It does
not infer authenticated-session history, live fixture origin, tenant identity,
or private raw-capture custody from sanitized repository bytes. Human-only facts
remain pending until the Plan 01-08 blocking-human checkpoint.

## Security Result

Automated controls are in place for bounded sanitization, value-free sensitive
content rejection, canonical fixture containment, exact final-byte checksums,
detached inert parsing, scenario fidelity, complete ledger IDs, scenario binding,
and evidence-derived verdict rejection. No package, network, authentication, or
new runtime dependency was introduced by Plan 01-08.

The security result is `human_needed`, not pass: live provenance and retention of
user control over authenticated or operational actions cannot be established by
repository tests. A `proceed` verdict is therefore prohibited until the five
records below have explicit final dispositions and `SELECTORS.md` records
`prohibition-dispositions: passed`.

## STRIDE / ASVS Level 1 Results

| Threat | Category | Severity | Automated result | Remaining judgment | Disposition |
|---|---|---:|---|---|---|
| T-01-28 | Information disclosure | high | The shared corpus validator canonicalizes paths, scans exact bytes before parsing, rejects active/resource content with value-free diagnostics, and parses only in an isolated query-only window. | None for repository admission. | mitigated by test |
| T-01-29 | Tampering | high | Final mode requires exact CLI arity, the complete production evidence-ID set, admitted-scenario binding, blocking predicates, and the shared corpus validator. | Human dispositions still prevent `proceed`. | mitigated by test |
| T-01-30 | Spoofing | high | Every fixture is checksum-bound and validated against declared header, ticket-row, group-row, Priority-index, and same-table scroll facts. | Live origin cannot be inferred from these bytes. | automated mitigation plus pending provenance judgment |
| T-01-31 | Repudiation | medium | This record assigns a test or judgment owner and evidence reference to every inherited prohibition. | Two external-session facts require explicit human confirmation. | pending human judgment |
| T-01-32 | Denial of service | medium | Malformed modes, arguments, ledgers, manifests, paths, selectors, facts, and checksums fail non-zero. | None. | mitigated by test |
| T-01-SC | Supply-chain tampering | high | No install or dependency change occurred; only the supported Node engine range was declared. | None. | mitigated by unchanged lockfile/toolchain |

## Five Inherited Prohibition Records

| # | Requirement | Category | Exact prohibition | Verification tier | Evidence reference | Current disposition |
|---:|---|---|---|---|---|---|
| 1 | RECON-01 | privacy | Repository evidence must not trade tenant confidentiality for fixture fidelity: no real ticket, person, organization, account content, identifying metadata, or raw-capture location may enter a project artifact. | test | `test/recon/sanitize-fixture.test.js`; `test/recon/fixture-contract.test.js`; `npm run test:recon` | automated controls pass; human must confirm no contrary private provenance fact |
| 2 | RECON-01 | transparency | A hand-authored toy table must not be presented as a captured live Zendesk fixture. | judgment | `SELECTORS.md` Admitted Fixture Corpus; Plan 01-03/01-05 capture history | pending explicit live-provenance attestation |
| 3 | RECON-02 | transparency | An English-only observation must not be represented as evidence of localization, legacy-interface, vanity-domain, or cross-plan compatibility. | test | `test/recon/recon-gate.smoke.js`; `SELECTORS.md` scope and localization entries | automated scope checks pass |
| 4 | RECON-02 | safety | Reconnaissance must not alter an operational Zendesk view or take login, MFA, locale, disposable-view, cleanup, or consequential account actions out of the user's control. | judgment | `SELECTORS.md` Authenticated Interaction Handoff and interaction evidence | pending explicit user-control attestation |
| 5 | RECON-03 | evidence-integrity | An inconclusive `host.shadowRoot === null` observation must not be reported as proof that the ticket list has no closed Shadow DOM boundary. | test | `SELECTORS.md` root-chain and top-document-reachability entries; final-gate predicate tests | automated two-part proof passes |

## Final-Gate Security Rule

- `block` is always the conservative admissible verdict when a human or automated
  predicate is missing, failed, or disputed.
- `proceed` is admissible only after the complete ledger and corpus pass, positive
  interaction paint is recorded, the selected-node root chain rules out a closed
  boundary, selector/fallback evidence is matrix-bound, and all five prohibition
  dispositions are explicitly accepted.
- Editing only the verdict text cannot turn a blocked record into `proceed`.

## Human Review Needed

At the Plan 01-08 checkpoint, confirm or reject only these repository-invisible
facts without disclosing tenant values or private paths:

1. The three sanitized fixtures are live-derived structural captures from the
   named English current Agent Workspace scenarios, not hand-authored toy tables.
2. Login, MFA, locale, disposable-view management, cleanup, sensitive navigation,
   and operational-view safety remained under the user's control.

If either fact is unavailable or disputed, retain `block` and record the missing
fact. The automated privacy, scope, and Shadow DOM dispositions do not override a
failed human judgment.
