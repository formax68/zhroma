---
phase: 01-dom-recon-spike
reviewed: 2026-09-07T06:28:01Z
depth: standard
source_snapshot: 1341022a96c4adbbb439c534ab48e1750129d83f
files_reviewed: 23
files_reviewed_list:
  - .gitignore
  - SELECTORS.md
  - DEPENDENCY-APPROVALS.md
  - package.json
  - scripts/fixture-contract.js
  - scripts/interaction-evidence.js
  - scripts/sanitize-fixture.js
  - scripts/sanitized-output-contract.js
  - scripts/sensitive-patterns.js
  - scripts/verify-recon-gate.js
  - test/fixtures/manifest.json
  - test/fixtures/zendesk-view-grouped-long.html
  - test/fixtures/zendesk-view-priority-absent.html
  - test/fixtures/zendesk-view-priority-present.html
  - test/recon/corpus-provenance.test.js
  - test/recon/dependency-approvals.smoke.js
  - test/recon/fixture-contract.test.js
  - test/recon/interaction-evidence.smoke.js
  - test/recon/recon-gate.smoke.js
  - test/recon/sanitize-fixture.test.js
  - test/recon/sanitized-output-contract.test.js
  - test/recon/sensitive-patterns.smoke.js
  - vitest.config.js
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 1: Code Review Report

**Reviewed:** 2026-09-07T06:28:01Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** clean

## Narrative Findings (AI reviewer)

No remaining actionable findings were established at standard depth after the focused re-review of `1341022a96c4adbbb439c534ab48e1750129d83f`. Within this review's scope, all reviewed files meet quality standards. No issues found.

The initial source snapshot, `a006e17bf9a2451734e9f1678f8f225aaf5a9898` (including implementation `83d2be6`), had four demonstrated blockers and one warning despite 165 passing tests. Fix `8572685` closed the false-header, fallback-proof, structured-metadata, and owner-vocabulary defects. Its paint change closed private-text injection but still admitted equivalent transparent colors as distinct states. Fix `1341022` closed that residual comparison defect. This report records those closures without erasing the initial findings.

## Verification Evidence

- Fresh `npm test` on the final source: **65 Node + 108 Vitest = 173 passed**, zero failures, skips, or todos.
- The exact false-absence reproduction now rejects with `declared-header-row-not-found`.
- An existing dependency-approval test offered as selector-fallback proof now produces `selector-fallback-not-matrix-proven` and `fallback-evidence-path-missing`.
- Private text inside `color(...)` and gradients now produces `interaction-grammar-violated`.
- Private unproven proof paths and extra flagged-assumption text now produce `verdict-field-not-structured`.
- `direct-cells` is now admitted consistently at the supported final interaction boundary.
- The original equivalent-transparent-paint reproduction, plus admitted alpha-zero synonyms and numeric alpha spelling variants, all now produce `interaction-grammar-violated`.
- The unchanged ledger returns `{ entryCount: 18, verdict: 'proceed' }`. The final CLI prints `FINAL VERDICT: proceed` after independently validating the complete manifest.
- Scoped source `git diff --exit-code` was empty during both review snapshots and the final checks. The reviewer changed only this report. Temporary synthetic corpus copies were removed. No implementation edits or commits were made by the reviewer.

The paint contract is deliberately bounded to observed comma-separated RGB/RGBA values, `transparent`, and `image:none`. Channels and alpha are validated, and transparent/alpha-zero and opaque RGB/RGBA equivalence are canonicalized before comparison. Other CSS spaces or background images are rejected pending an explicit future contract extension. That is a supported-scope boundary, not an assertion of full CSS equivalence support.

## Original Finding Closure Map

The original report dated `2026-09-04T11:42:32Z` is recoverable verbatim with `git show a006e17:.planning/phases/01-dom-recon-spike/01-REVIEW.md`. Original identifiers are retained below; CR-12 and WR-04 were added by this review. All entries in this table are historical, closed findings and are excluded from current frontmatter counts.

| ID | Historical classification | Current disposition and evidence |
| --- | --- | --- |
| CR-01 | BLOCKER | Closed. Shared parser rejects mixed direct header/body children; index-6 and width regressions execute. |
| CR-02 | BLOCKER | Closed. Production scanner normalizes NFC before case folding; bidirectional NFC/NFD and sanitizer CLI regressions execute. |
| CR-03 | BLOCKER | Closed. Denylist canonicalization and current-worktree exclusion precede reads; alias/custody checks and ignore rules are present. |
| CR-04 | BLOCKER | Closed. Both admission paths use the shared output contract; all three repository fixtures pass byte-identical second sanitizer passes. This is repository-byte re-admission, not fresh capture. |
| CR-05 | BLOCKER | Closed after residual recheck. Wrong assertion kinds reject; `8572685` additionally binds the manifest header to the actual shared-parser header, defeating body-row substitution. |
| CR-06 | BLOCKER | Closed. Canonical path uniqueness is checked before admission; relative/symlink aliases and multi-table bytes reject. |
| CR-07 | BLOCKER | Closed. Required live IDs have exact scope/status/scenario contracts; relabeling regressions execute across all required IDs. |
| CR-08 | BLOCKER | Closed after residual recheck. Authorization no longer reads prose; `8572685` allows only the registered Garden proof and rejects unsupported fallback rung promotions, even when their cited file exists. |
| CR-09 | BLOCKER | Closed after two focused fixes. Shared production assessment rejects private function payloads; `1341022` bounds numeric paint and canonicalizes admitted color equivalence before distinctness. |
| CR-10 | BLOCKER | Closed under the approved contract. Seven exact assumption identities and proof-reference sets are parsed; unresolved gating rows block; six resolved/gating rows and the flagged non-gating RECON-01 exception remain explicit. |
| CR-11 | BLOCKER | Closed. CLI emits stable value-free codes by default; explicit local debug mode is separately tested. |
| WR-01 | WARNING | Closed. Node range excludes Node 23: `^20.19.0 || ^22.12.0 || >=24.0.0`. |
| WR-02 | WARNING | Closed. Non-object/null roots throw `manifest-object-required`; root-shape regressions execute. |
| WR-03 | WARNING | Closed. Production scripts import `scripts/sensitive-patterns.js`; tests use the same module. |
| CR-12 | BLOCKER | Closed. Non-proven fallback references must be `none`; flagged-assumption metadata has a closed token/set contract. |
| WR-04 | WARNING | Closed. Final supported paint owners use `row` and `direct-cells`; the unreachable `cell` token was removed and final direct-cell coverage added. |

## Residual Finding History and Reproductions

The following findings were demonstrated on `a006e17`, then rechecked against their fixes. Line references below name the original snapshot, not current source line numbers.

**CR-05 — false absence through a body-row header selector.** At `scripts/fixture-contract.js:417-430` and `151-181`, admission checked only table ownership of the selected header. In a temporary copy of the absence fixture, replacing `TEXT-006` with `Priority`, updating its hash, setting `selectors.headerRow = selectors.ticketRow + ':first-child'`, and choosing absence selector `[data-test-id=irrelevant-missing]` still admitted all three scenarios. Null Priority indexes and six-cell widths were unchanged. The fix binds header identity through `resolveBoundedDocument`. The exact reproduction now rejects.

**CR-08 — unrelated file as selector proof.** At `scripts/verify-recon-gate.js:533-545` and `607-635`, an existing path alone proved a rung. Changing final Garden state to `absent`, rung 2 to `test-id-pair | proven | test/recon/dependency-approvals.smoke.js`, and selector authorization to `test-id-pair` returned `proceed` with stable-identifiers status still verified. The fix rejects unsupported rungs and binds the admitted Garden proof to a validator-owned path/case contract. The exact reproduction now blocks.

**CR-09 — private paint and false distinctness.** At `scripts/interaction-evidence.js:36-41` and `147-155`, function arguments accepted arbitrary words. Replacing only the normal paint's row color with `color(private person)` returned `proceed`; private gradient text also fit the grammar. After the first fix, copying the normal summary to both other states while spelling row transparency as `rgb(0 0 0 / 0)` and `transparent` still returned `proceed`. The final fix uses the bounded computed-paint contract and canonical equality described above. Both reproductions now block. The initial report described `rgb(999,999,999)` as invalid CSS; that wording was inaccurate because CSS can clamp out-of-range channels. Its rejection now reflects the bounded computed-evidence contract, not a general CSS validity claim.

**CR-12 — unvalidated structured metadata.** At `scripts/verify-recon-gate.js:507-511` and `611-618`, independently changing rung 3 to `structural | unproven | /private/PRIVATE-PERSON` or flags to `RECON-01/unclassified, PRIVATE-PERSON` returned `proceed`. Validation now covers every rung state and the entire flagged-ID set. Both reproductions now block without echoing supplied values.

**WR-04 — owner vocabulary divergence.** At `scripts/interaction-evidence.js:35` and `scripts/verify-recon-gate.js:572`, the shared parser admitted `direct-cells` while final mode allowed `cell`, which the shared parser rejected. The supported final vocabulary now uses `direct-cells` and its integration test passes.

## Review Boundaries

Context included the prior report, Plans/Summaries 01-09 through 01-15, current ledger, dependency record, source, and tests. No project AGENTS.md or local skill directories were present; the configured reviewer-skill query returned no injected skills. No structural pre-pass was supplied. Lock metadata was consulted through dependency tests and excluded from the source count. Performance-only issues are outside scope.

No new live DOM evidence or human attestations were created. Historical dependency approval independence remains **not-attested**, exactly as recorded; exact-version attestations do not resolve it. The six-resolved/one-flagged assumption contract is treated as authorized, not as permission to invent specification or live evidence. This clean code review does not replace security review, independent goal verification, or human/product acceptance, and does not independently authorize Phase 2.

---

_Reviewed: 2026-09-07T06:28:01Z_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
