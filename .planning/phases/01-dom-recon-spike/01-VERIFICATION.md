---
phase: 01-dom-recon-spike
verified: 2026-09-03T12:47:19Z
status: gaps_found
score: 7/14 must-haves verified
behavior_unverified: 0
overrides_applied: 0
next_action: "Gaps found. Plan the fixes, then re-run execute-phase before shipping."
next_command: "$gsd-plan-phase 01 --gaps"
decision_coverage:
  honored: 16
  total: 16
  not_honored: []
gaps:
  - truth: "Every English-path DOM assumption needed for v1 is answered against the live view."
    status: failed
    reason: "The ledger records that no hovered or selected row was present, so native hover/selection paint composition was not observed; changing the question to whether the evidence seam succeeded does not answer the underlying DOM assumption."
    artifacts:
      - path: "SELECTORS.md"
        issue: "Lines 159-168 and 289-291 explicitly state that hover/selection paint evidence is absent and keep Phase 2 blocked."
      - path: ".planning/phases/01-dom-recon-spike/01-UI-REVIEW.md"
        issue: "The UI review independently classifies the missing native-state paint evidence as a blocker."
    missing:
      - "A new user-controlled live probe with a genuinely hovered row and a genuinely selected row."
      - "Sanitized computed paint evidence for normal, hover, and selection states, followed by an evidence-derived verdict update."
  - truth: "Private captures pass a one-way, bounded, fail-closed sanitization and sensitive-data admission boundary before repository entry."
    status: failed
    reason: "Independent reproductions show the sanitizer can silently do nothing with exit 0 outside the repository cwd, preserve unrelated sibling UI, preserve unclassified textual ARIA values, and preserve Priority words outside the proven Priority cell."
    artifacts:
      - path: "scripts/sanitize-fixture.js"
        issue: "Direct-execution detection is cwd-dependent (lines 410-414); table-boundary validation is not table-scoped (223-237); arbitrary aria-* values pass (261-267); Priority labels survive globally (275-299)."
      - path: "test/recon/sanitize-fixture.test.js"
        issue: "Tests do not exercise a non-repository cwd, sibling UI under one root, unclassified textual ARIA attributes, or Priority labels in non-Priority content."
    missing:
      - "Entry-module detection independent of cwd and a non-repository-cwd regression test."
      - "A strict immediate-wrapper/selected-table boundary with table-owned header and row checks."
      - "A fail-closed ARIA allowlist and Priority-label preservation restricted to positively identified Priority cells."
  - truth: "The final gate cannot report proceed or a completed corpus while any English evidence, blocking decision, or manifest gate is unresolved or failing."
    status: failed
    reason: "Final mode accepts a missing manifest, accepts script-bearing fixtures when hashes match, accepts a one-entry synthetic ledger, and accepts the current blocked ledger after its verdict is changed to proceed."
    artifacts:
      - path: "scripts/verify-recon-gate.js"
        issue: "Required evidence IDs/scenarios are not enforced (88-136), blocking decision semantics are not evaluated (173-226), manifest verification checks only shape/path/hash (229-275), and the manifest argument is optional (277-290)."
      - path: "test/recon/recon-gate.smoke.js"
        issue: "The test suite explicitly treats a single synthetic entry with proceed as valid, while required Phase 1 IDs exist only in test code."
    missing:
      - "Exact CLI arity for final <ledger> <manifest>."
      - "A production-owned required evidence-ID/scenario contract and decision predicates that reject proceed for the failed interaction gate."
      - "One production corpus validator shared by final mode and tests, including scan-before-parse, selectors, provenance, scenario semantics, and checksums."
  - truth: "The admitted three-scenario fixture corpus is safely contained and its tests prove the recorded scenario semantics."
    status: failed
    reason: "The committed fixtures currently parse and match their hashes, but the validator follows in-directory symlinks outside the corpus and its scenario checks accept materially incomplete shapes; routine npm test also omits the committed manifest."
    artifacts:
      - path: "test/recon/fixture-contract.test.js"
        issue: "Containment is lexical rather than canonical (196-210); scenario assertions do not enforce ungrouped/grouped row counts, widths, order, or genuine scroll structure (128-193); the selected manifest test is conditional (543-552)."
      - path: "test/fixtures/manifest.json"
        issue: "The actual corpus has the recorded 16/6/15 headers and 4/4/12 ticket rows, but those facts are not encoded as enforced assertions."
      - path: "package.json"
        issue: "The default test command does not select test/fixtures/manifest.json."
    missing:
      - "Canonical realpath containment or an explicit symlink rejection."
      - "Exact structural facts for all three scenarios and stronger behavioral assertions."
      - "Default test coverage of the committed manifest."
  - truth: "All five Phase 1 must-NOT prohibitions have an auditable verification disposition."
    status: partial
    reason: "All five prohibitions in 01-04-PLAN.md remain status unresolved with verification null. Some document-level statements appear honored, but the privacy, live provenance, and user-control prohibitions cannot be authoritatively resolved and the sanitizer defects remove wired enforcement."
    artifacts:
      - path: ".planning/phases/01-dom-recon-spike/01-04-PLAN.md"
        issue: "Five flagged prohibition records have no test or judgment verification tier and no recorded resolution."
      - path: ".planning/phases/01-dom-recon-spike/01-REVIEW.md"
        issue: "The review demonstrates that privacy and evidence-integrity enforcement is incomplete."
    missing:
      - "Assign test or judgment verification to every prohibition."
      - "Wire deterministic enforcement where possible and obtain explicit human resolution for judgment-only claims."
---

# Phase 1: DOM Recon Spike Verification Report

**Phase Goal:** Every DOM assumption needed for the English-only v1 path is answered against a live English Zendesk agent view. Localization-specific assumptions are explicitly excluded from this spike, while the two terminal DOM risks are still ruled in or out before implementation begins.
**Verified:** 2026-09-03T12:47:19Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

The phase has useful, candid recon evidence, including conclusive recorded answers for the two named terminal risks. It has not achieved its full goal. The repository itself records that hover/selection paint composition was not observed and therefore keeps Phase 2 blocked. Independently reproduced fail-open paths also mean the sanitizer, fixture admission, and final verdict tooling do not enforce the contracts their tests and summaries claim.

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Every English-path DOM assumption needed by v1 has a yes/no answer with evidence and fallback. | ✗ FAILED | `SELECTORS.md:159-168` records no hovered or selected row and no paint comparison; `SELECTORS.md:289-291` says this evidence is still required before Phase 2. |
| 2 | A live-derived, structurally faithful, safely admitted outerHTML corpus is committed and usable offline. | ✗ FAILED | Three fixtures exist, hashes match, and a named test locates their tables/headers; however live derivation is not independently provable, sanitizer/admission is fail-open, and scenario fidelity is under-enforced. |
| 3 | Anyone reading the repo can state whether a closed Shadow DOM wraps the list and whether current rows expose Garden identifiers. | ✓ VERIFIED | `SELECTORS.md:51-73` records a direct `Document` root chain in all scenarios and current `data-garden-id`/`data-test-id` values; `SELECTORS.md:283-286` states both answers plainly. |
| 4 | Recon scope is explicitly English-only, records the observed language signal, and makes no localization compatibility claim. | ✓ VERIFIED | `SELECTORS.md:3-13`, `183-229`, and `290` consistently limit conclusions to `html[lang="en"]` in the current shell and mark localization rows outside scope. |
| 5 | The ledger/final validator cannot authorize proceed with missing evidence, a failed blocking decision, or an omitted/unsafe corpus. | ✗ FAILED | Direct checks accepted final mode without a manifest, accepted a script-bearing three-file corpus, and returned `{"entryCount":18,"verdict":"proceed"}` after only changing the current verdict text. |
| 6 | Fixture sanitization and sensitive-data admission are one-way, bounded, and fail closed. | ✗ FAILED | Direct checks preserved unrelated sibling structure, `aria-placeholder="Unlisted Person"`, and `High` in a non-Priority cell; the CLI returned exit 0 without executing from `/private/tmp`. |
| 7 | The offline tracer proves a complete synthetic ledger path without asserting a live fact. | ✓ VERIFIED | `test/recon/recon-gate.smoke.js:48-66` exercises evidence/final modes and passes in the current test run. |
| 8 | Both exact dependency releases were human-approved before installation. | ? UNCERTAIN | The exact versions are installed and locked, but approval/order is asserted only by execution summaries; no independent checkpoint transcript or testable artifact proves it. |
| 9 | The current English three-scenario session existed and the user retained control of login, account actions, and operational-view safety. | ? UNCERTAIN | `SELECTORS.md` records non-identifying observations and a user-confirmation line, but this external authenticated-session history cannot be independently verified from repository state. |
| 10 | Only `vitest@4.1.11` and `happy-dom@20.13.1` are installed as exact development dependencies. | ✓ VERIFIED | `package.json` has no production dependencies and lists exactly those two versions; `package-lock.json` resolves both exact versions. |
| 11 | The corpus contract proves scan-before-parse, detached parsing, exact checksum provenance, selectors, and complete scenario semantics. | ✗ FAILED | The selected corpus test passes, but production final mode does not call it, symlink containment is lexical, and the grouped/ungrouped semantic assertions accept incomplete fixtures. |
| 12 | Static live findings record root reachability, identifiers, headers, priority representation/absence, row distinction, scrolling, normal paint owner, sticky ownership, and host coverage. | ✓ VERIFIED | `SELECTORS.md:27-157` and `183-205` contain complete fields, named scenarios, exact probes, evidence, interpretations, and fallbacks for these static observations. |
| 13 | The authenticated interaction handoff is recorded as complete, with post-sort/refresh marker evidence. | ✓ VERIFIED | `SELECTORS.md:231-246` records `interaction-evidence-complete`, marker loss, restored table structure, and the user confirmation. This verifies the repository record, not the external action history in truth 9. |
| 14 | The current artifact ends in an explicit block verdict and keeps Phase 2 closed. | ✓ VERIFIED | `SELECTORS.md:281-291` contains exactly one final `block` verdict and states the missing evidence and next live action. |

**Score:** 7/14 truths verified (0 present, behavior-unverified; 2 additional truths require human/external corroboration)

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `SELECTORS.md` | Complete live evidence ledger and explicit Phase 2 verdict | ⚠️ SUBSTANTIVE, GOAL-INCOMPLETE | 291 lines, all required fields present, terminal risks and scope are clear; hover/selection paint remains explicitly unobserved. |
| `scripts/verify-recon-gate.js` | Fail-closed evidence and final-verdict validator | ✗ FAILED CONTRACT | Exists, exports `verifyReconLedger`, and is used by CLI/tests, but required IDs, decision semantics, full corpus checks, and exact final-mode arity are missing. |
| `test/recon/sensitive-patterns.js` | Shared deterministic sensitive-data policy | ✓ EXISTS + SUBSTANTIVE + WIRED | Imported by sanitizer and fixture tests; catches its declared generic rules and denylist values. It cannot compensate for unsafe values the sanitizer intentionally preserves or for final mode bypassing it. |
| `package.json` / `package-lock.json` / `vitest.config.js` | Exact approved test toolchain | ✓ VERIFIED | Exact dependency versions and test configuration exist; Node 26.8.1 ran the suite successfully. |
| `scripts/sanitize-fixture.js` | One-way topology-preserving sanitizer | ✗ FAILED CONTRACT | 415 substantive lines and imports the shared scanner, but four independently reproduced fail-open/privacy boundary defects violate core must-haves. |
| `test/recon/fixture-contract.test.js` | Detached corpus validation with complete scenario semantics | ✗ FAILED CONTRACT | Substantive and runnable, but it is a test-local validator, has lexical containment, weak scenario semantics, and selects the committed corpus only via an environment variable. |
| `test/fixtures/zendesk-view-priority-present.html` | Canonical Priority-present fixture | ⚠️ PARTIAL | Hash matches; parses to 16 headers, 4 ticket rows, zero groups, and all four Priority labels. Live provenance and safe admission are not independently established. |
| `test/fixtures/zendesk-view-priority-absent.html` | Priority-absent control | ⚠️ PARTIAL | Hash matches; parses to 6 headers, 4 ticket rows, zero groups, and no Priority labels. Live provenance and safe admission are not independently established. |
| `test/fixtures/zendesk-view-grouped-long.html` | Grouped/long topology | ⚠️ PARTIAL | Hash matches; parses to 15 headers, 12 ticket rows, and 1 group row. Tests do not enforce the recorded counts/order or genuine scroll behavior. |
| `test/fixtures/manifest.json` | Scenario provenance, selectors, assertions, and final-byte hashes | ⚠️ PARTIAL | Contains exactly three scenarios with matching current hashes, but declared assertions are too weak and production final validation uses only a subset. |

**Artifact tool result:** 12/12 declared artifact paths exist and pass the generic existence/pattern query. Goal-level substance checks above supersede that shallow result.

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `scripts/sanitize-fixture.js` | `test/recon/sensitive-patterns.js` | `scanSensitiveContent` before output | ✓ WIRED | Imported at lines 7-10 and called at 306-313, but upstream sanitization preserves unsafe content classes. |
| `scripts/verify-recon-gate.js` | `SELECTORS.md` | evidence/final CLI parsing | ⚠️ PARTIAL | The CLI reads the ledger, but production validation does not require the Phase 1 ID set or evaluate whether terminal `disproved` entries block proceed. |
| `scripts/verify-recon-gate.js` | `test/fixtures/manifest.json` | final-mode corpus gate | ✗ NOT RELIABLY WIRED | Manifest argument is optional and the production path validates only entry shape, paths, scenarios, and hashes. |
| `test/fixtures/manifest.json` | `test/recon/fixture-contract.test.js` | selected admitted-corpus test | ⚠️ CONDITIONAL | The link exists only when `GSD_FIXTURE_MANIFEST` is supplied; default `npm test` does not exercise the committed corpus. |
| `SELECTORS.md` | Phase 2 | explicit final verdict | ✓ WIRED | The current `block` verdict and rationale explicitly keep Phase 2 closed. |
| Plan 04 marker seam | Plan 05 completion | `marker-staged` to `interaction-evidence-complete` | ✓ SUPERSEDED AS DESIGNED | The generic key-link query reports the old `marker-staged` text missing; the final ledger records the completed successor state instead. This is not a regression. |

### Data-Flow Trace (Level 4)

No user-facing dynamic rendering exists in Phase 1, so rendered-value Level 4 checks are not applicable. The evidence pipeline was traced instead:

| Stage | Source | Consumer | Status | Finding |
|---|---|---|---|---|
| Live DOM claim | Authenticated Zendesk view | `SELECTORS.md` / private captures | ? EXTERNAL | Repository artifacts record the observations, but origin and user-controlled actions require human corroboration. |
| Private capture | Outside-worktree input | `sanitizeFixture()` | ✗ FAIL-OPEN | Cwd-dependent CLI execution and permissive boundary/ARIA/Priority handling break admission guarantees. |
| Sanitized bytes | Three committed HTML files | `manifest.json` | ✓ CURRENT HASH FLOW | All three current hashes match exact bytes. |
| Manifest corpus | `manifest.json` | test-local `validateFixtureManifest()` | ⚠️ PARTIAL | Named selected-corpus test passes; scenario semantics and canonical containment are incomplete. |
| Ledger + manifest | `SELECTORS.md` / manifest | final CLI verdict | ✗ DISCONNECTED CONTRACT | The manifest is optional, the stronger test-local validator is not called, and blocking ledger semantics are ignored. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Full default workspace suite | `npm test` | 17 Node smoke + 29 Vitest tests passed; 0 skipped in the invoked set | ✓ PASS, but committed corpus omitted |
| Committed-corpus named test | `GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json ... vitest ... -t 'the selected admitted corpus...'` | 1 selected test passed; 29 skipped by name filter | ✓ PASS for current bytes |
| Evidence ledger gate | `node scripts/verify-recon-gate.js evidence SELECTORS.md` | `EVIDENCE READY: 18 terminal entries` | ✓ PASS for field/status shape |
| Current final gate | `node scripts/verify-recon-gate.js final SELECTORS.md test/fixtures/manifest.json` | `FINAL VERDICT: block` | ✓ PASS for current happy path |
| Missing manifest must fail | `node scripts/verify-recon-gate.js final SELECTORS.md` | Exit 0, `FINAL VERDICT: block` | ✗ FAIL |
| Failed interaction must prevent proceed | In-memory replacement of only `verdict: block` with `proceed`, then `verifyReconLedger(..., {mode:'final'})` | Accepted: `{"entryCount":18,"verdict":"proceed"}` | ✗ FAIL |
| Unsafe manifest must fail | Three hash-matching fixtures containing `<script>...` passed to final CLI | Exit 0, `FINAL VERDICT: block` | ✗ FAIL |
| Sanitizer CLI invalid invocation outside repo cwd | From `/private/tmp`: absolute sanitizer path with invalid args | No output, exit 0 | ✗ FAIL |
| Sanitizer must reject unsafe retained structure/values | Temporary one-root capture with sibling UI, unclassified ARIA text, and `High` in a non-Priority cell | All three survived sanitized output | ✗ FAIL |

### Probe Execution

No `scripts/**/tests/probe-*.sh` files or phase-declared shell probes exist. The phase-declared runnable CLI gates were executed as behavioral spot-checks above.

### Requirements Coverage

Every one of the five PLAN frontmatters declares `RECON-01`, `RECON-02`, and `RECON-03`. All three IDs exist in `REQUIREMENTS.md` and are mapped to Phase 1; there are no orphaned Phase 1 requirement IDs.

| Requirement | Source Plans | Description | Status | Evidence |
|---|---|---|---|---|
| RECON-01 | 01-01 through 01-05 | Real-view outerHTML fixture committed and usable as a test fixture | ✗ BLOCKED | Files and offline parsing exist, but safe/faithful admission and live provenance are not reliably established because CR-01 through CR-04, CR-09, and CR-10 affect the capture/corpus boundary. |
| RECON-02 | 01-01 through 01-05 | Every English-path DOM assumption answered live; localization explicitly outside Phase 1 | ✗ BLOCKED | Most static assumptions are recorded, but hover/selection paint composition remains unobserved and is explicitly blocking in the final verdict. |
| RECON-03 | 01-01 through 01-05 | Closed Shadow DOM and current Garden-ID terminal risks ruled in or out | ✓ SATISFIED | The repo plainly records direct Document root chains across all scenarios and current Garden identifiers with ranked selector candidates. |

**Coverage:** 1/3 requirements satisfied; 2/3 blocked.

### Decision Coverage

All 16 trackable `01-CONTEXT.md` decisions were found in shipped artifacts by `check.decision-coverage-verify`. This gate is advisory and does not offset failed goal truths.

### Prohibition Verification

All five prohibitions in `01-04-PLAN.md` are still `status: unresolved`, `verification: null`, `resolution: null`, and `flagged: true`. Because they have neither a valid `test`/`judgment` tier nor enforcement evidence, none is silently treated as authoritative pass.

| Prohibition | Automated assessment | Disposition |
|---|---|---|
| No tenant/customer/identity/raw-path leakage | Current fixture text is deterministic and generic scans pass, but private denylist evidence is unavailable and the sanitizer has privacy fail-open paths. | ⚠️ UNVERIFIED / tooling gap |
| No hand-authored toy table presented as live-captured | Artifacts state they are live-derived projections, but offline repository state cannot prove origin. | ? HUMAN REQUIRED |
| No cross-locale/legacy/vanity/cross-plan compatibility claim | The ledger and manifest repeatedly limit scope to the observed English current shell. | ✓ VERIFIED as a document claim |
| No operational-view mutation or loss of user control | Recorded in the ledger, but authenticated external history cannot be independently replayed. | ? HUMAN REQUIRED |
| No `host.shadowRoot === null` used as conclusive proof | The recorded probe uses top-document reachability and selected-node `getRootNode()` chains. | ✓ VERIFIED as a document claim |

### Test Quality Audit

| Test File | Linked Requirements | Active | Skipped/disabled | Circular | Strongest assertion | Verdict |
|---|---|---:|---:|---|---|---|
| `test/recon/recon-gate.smoke.js` | RECON-02, RECON-03 | 10 | 0 | No | Value/shape | ✗ INSUFFICIENT — a one-entry synthetic `proceed` is explicitly accepted; production does not own required IDs or decision semantics. |
| `test/recon/sensitive-patterns.smoke.js` | RECON-01 | 7 | 0 | No | Behavioral | ⚠️ PARTIAL — strong for declared regex classes, but cannot prove sanitizer handling of unclassified allowed attributes/content. |
| `test/recon/sanitize-fixture.test.js` | RECON-01 | 21 collected | 0 | No | Behavioral | ✗ INSUFFICIENT — omits four reproduced fail-open cases central to privacy/admission. |
| `test/recon/fixture-contract.test.js` | RECON-01, RECON-03 | 8 default + 1 conditional | 0 disabled | No | Structural/value | ✗ INSUFFICIENT — scenario tests accept materially incomplete fixtures; committed corpus is not selected by default. |

**Disabled tests on requirements:** 0  
**Circular expected-value generators:** 0 detected  
**Insufficient assertion sets:** 3 requirement-linked suites  
**External/live provenance:** UNKNOWN — test fixtures and manifest assertions are repository-authored; they do not independently prove the live source.

### Anti-Patterns and Review Findings

No unreferenced `TBD`, `FIXME`, or `XXX` markers were found in phase-modified files. The standard placeholder hits are attribute names or test values, not stubs. The substantive fail-open findings are:

| ID | File / Line | Pattern | Severity | Effect on phase goal |
|---|---|---|---|---|
| CR-01 | `scripts/sanitize-fixture.js:410-414` | Cwd-dependent CLI entry detection | 🛑 BLOCKER | A sanitization command can do nothing and still signal success. Independently reproduced. |
| CR-02 | `scripts/sanitize-fixture.js:223-237` | Table boundary searches unrelated descendants | 🛑 BLOCKER | Unrelated sibling UI can enter the admitted artifact. Independently reproduced. |
| CR-03 | `scripts/sanitize-fixture.js:261-267` | All unclassified `aria-*` values preserved | 🛑 BLOCKER | Textual tenant data can survive. Independently reproduced. |
| CR-04 | `scripts/sanitize-fixture.js:275-299` | Priority labels preserved globally | 🛑 BLOCKER | Real subject/requester content equal to a Priority word can survive. Independently reproduced. |
| CR-05 | `scripts/verify-recon-gate.js:277-290` | Final manifest optional; extra args ignored | 🛑 BLOCKER | Final gate can bypass the corpus. Independently reproduced. |
| CR-06 | `scripts/verify-recon-gate.js:229-275` | Final checks hashes, not safety/semantics | 🛑 BLOCKER | Script-bearing hash-matching corpus is accepted. Independently reproduced. |
| CR-07 | `scripts/verify-recon-gate.js:173-226` | Verdict semantics ignored | 🛑 BLOCKER | Current failed interaction gate can be relabeled proceed. Independently reproduced. |
| CR-08 | `scripts/verify-recon-gate.js:88-136` | Full evidence ID/scenario set not production-owned | 🛑 BLOCKER | A one-entry synthetic ledger can satisfy final validation. Confirmed by source and passing test. |
| CR-09 | `verify-recon-gate.js:243-261`; `fixture-contract.test.js:196-210` | Lexical containment before dereference | 🛑 BLOCKER | An in-directory symlink can escape the corpus boundary. Confirmed by source path flow. |
| CR-10 | `test/recon/fixture-contract.test.js:128-193` | Presence checks stand in for scenario semantics | 🛑 BLOCKER | Incomplete grouped/ungrouped structures pass. Confirmed by the suite's one-ticket-row grouped fixture. |
| WR-01 | `package.json:6-8`; `fixture-contract.test.js:543-552` | Committed manifest test conditional | ⚠️ WARNING | Routine green tests miss drift or unsafe committed fixture changes. |
| WR-02 | `package.json:1-13` | No Node engine contract | ⚠️ WARNING | Contributors can install/run outside the locked Vite engine range. Current Node 26.8.1 is supported. |

### Independent Security Gate

No `01-SECURITY.md` or other Phase 1 security-verification artifact exists. This absence is not a separate roadmap truth, so it is recorded as a warning rather than used alone to determine `gaps_found`. It is nevertheless consequential: the plans define high-severity privacy, tampering, and evidence-integrity threats, and the reproduced CR-01 through CR-10 show several planned mitigations are not actually enforced. Phase 1 should not be treated as security-cleared.

### Human Verification Required

These items do not override the higher-priority `gaps_found` status. They should be performed only after the deterministic tooling gaps are fixed.

#### 1. Native hover and selection paint composition

**Test:** In a disposable English current-Agent-Workspace view, use a new explicit user-controlled seam to hold one ticket row hovered and one genuinely selected, then capture sanitized computed row/cell/wrapper paint for normal, hover, and selected states.

**Expected:** The evidence identifies the actual native paint owner and shows how a proposed translucent tint can preserve both hover and selection without painting group or sticky-header cells.

**Why human:** The authenticated Zendesk state and pointer/selection interaction cannot be reconstructed from the detached fixtures; the existing capture had zero hovered and zero selected rows.

#### 2. Live fixture provenance and user-control attestations

**Test:** Review the original authenticated-session checkpoint record, if retained outside the repository, and confirm that the three admitted fixtures came from the named live scenarios and that no operational view/account state was modified.

**Expected:** A durable, non-identifying attestation ties each fixture to its live scenario and confirms user control without exposing tenant data.

**Why human:** Sanitized repository bytes cannot prove their external origin or who performed authenticated actions.

#### 3. Prohibition dispositions

**Test:** Assign each of the five Plan 04 prohibitions a `test` or `judgment` verification tier and explicitly accept/reject the judgment-only evidence after deterministic enforcement is fixed.

**Expected:** No prohibition remains `unresolved`/`verification: null`; privacy and evidence-integrity items cite wired enforcement, and external-action claims have an explicit human decision.

**Why human:** The current prohibition records are structurally unresolved and several claims depend on external session history.

### Deferred Items

None. Phase 2 does include hover/selection preservation as an implementation success criterion, but Phase 1 explicitly requires the underlying DOM assumption to be answered before implementation begins and the current verdict blocks Phase 2. Deferring this gap would contradict the phase dependency and final rationale.

## Gaps Summary

Five grouped concerns block goal achievement:

1. The underlying hover/selection paint-composition assumption is unanswered, so the English-path DOM ledger is not complete in substance.
2. The sanitizer is not reliably executable or privacy-fail-closed.
3. The final gate can bypass or misrepresent both evidence and corpus status.
4. The corpus validator and default test path do not reliably prove scenario fidelity or containment.
5. The five must-NOT prohibitions remain formally unresolved and unroutable.

The current `block` verdict is truthful and should remain in force. The fact that all five plans have summaries and the current tests pass is not evidence that these gaps are closed.

## Recommended Fix Plans

### 01-06: Close the live interaction evidence gap

**Objective:** Answer the native hover/selection DOM assumption through a bounded human-controlled live probe.

1. Define the exact normal/hover/selected computed-paint capture contract and privacy boundary.
2. Run the new authenticated human seam in a disposable view and record sanitized evidence.
3. Re-evaluate the verdict only after the evidence fields and selector/contrast implications are complete.

### 01-07: Harden sanitizer and corpus admission

**Objective:** Make fixture creation and admission genuinely one-way, bounded, and fail closed.

1. Fix CLI entry detection, table-owned capture boundaries, ARIA classification, and Priority-cell scoping; add every reproduced regression.
2. Reject symlinks or canonicalize all corpus paths, encode exact scenario facts, and run the committed manifest by default.
3. Re-sanitize/re-admit the corpus through the corrected pipeline and verify exact final bytes.

### 01-08: Unify and secure the final gate

**Objective:** Ensure one production validator owns evidence IDs, scenario binding, corpus safety, decision semantics, and final CLI arity.

1. Extract the corpus validator from test code and call it from both tests and final mode.
2. Require the full Phase 1 evidence set and reject `proceed` for every blocking predicate, including the interaction gate.
3. Resolve the five prohibitions and run an independent Phase 1 security verification before reconsidering progression.

## Verification Metadata

**Verification approach:** Goal-backward, initial verification  
**Must-haves source:** Four roadmap success criteria merged with all five PLAN frontmatter truth sets, deduplicated to 14 observable truths  
**Requirement IDs checked:** RECON-01, RECON-02, RECON-03 from every plan; 0 missing and 0 orphaned  
**Automated checks:** 5 expected-path checks passed; 5 adversarial behavioral checks failed as evidence of gaps  
**Review reconciliation:** All 10 Critical findings materially affect fixture admission or final-gate truthfulness; both Warnings reduce routine verification reliability  
**Security verification:** Missing  
**Overrides applied:** 0  
**Human/external corroboration items:** 3  

---

_Verified: 2026-09-03T12:47:19Z_  
_Verifier: the agent (gsd-verifier)_
