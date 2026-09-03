---
phase: 01-dom-recon-spike
reviewed: 2026-09-03T12:36:47Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - .gitignore
  - SELECTORS.md
  - package.json
  - scripts/sanitize-fixture.js
  - scripts/verify-recon-gate.js
  - test/fixtures/manifest.json
  - test/fixtures/zendesk-view-grouped-long.html
  - test/fixtures/zendesk-view-priority-absent.html
  - test/fixtures/zendesk-view-priority-present.html
  - test/recon/fixture-contract.test.js
  - test/recon/recon-gate.smoke.js
  - test/recon/sanitize-fixture.test.js
  - test/recon/sensitive-patterns.js
  - test/recon/sensitive-patterns.smoke.js
  - vitest.config.js
findings:
  critical: 10
  warning: 2
  info: 0
  total: 12
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-09-03T12:36:47Z  
**Depth:** standard  
**Files Reviewed:** 15  
**Status:** issues_found

## Summary

The truthful `FINAL VERDICT: block` is not itself a defect. The implementation nevertheless has release-blocking fail-open paths in the sanitizer and final gate. In direct reproductions, the sanitizer returned exit 0 without running when invoked outside the repository root, the final gate accepted an unsafe three-fixture corpus containing executable markup, and changing the current blocked verdict to `proceed` was accepted despite the recorded failed interaction gate. The default 29-test suite and the 30-test manifest-enabled suite both passed, so the green suite does not cover these paths.

`package-lock.json` was loaded as mandatory context but excluded from the reviewed-file count under the lock-file scope rule.

## Narrative Findings (AI reviewer)

The findings below are ordered by severity. Each Critical issue is classified as a release **BLOCKER**; each Warning is classified as **WARNING**.

## Critical Issues

### CR-01: Sanitizer CLI silently succeeds without executing outside one exact working directory

**Classification:** BLOCKER  
**File:** `/Users/mike/code/zhroma/scripts/sanitize-fixture.js:410-414`  
**Issue:** Direct-execution detection compares the script path to `resolve(process.cwd(), 'scripts', 'sanitize-fixture.js')`. Invoking the absolute CLI from `/private/tmp` therefore skipped `runCli()`, ignored deliberately invalid arguments, printed nothing, and exited 0. Automation can interpret that as successful sanitization even though no validation or output occurred.
**Fix:** Detect the entry module independently of the current directory, as the recon verifier already does, and add a regression test with a non-repository `cwd`:

```js
import { pathToFileURL } from 'node:url';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
```

### CR-02: The bounded-capture check admits unrelated sibling UI structure

**Classification:** BLOCKER  
**File:** `/Users/mike/code/zhroma/scripts/sanitize-fixture.js:223-237`  
**Issue:** The code requires only one top-level element, then searches that entire element independently for any table, any header, and any row before returning the whole root. The header and row need not belong to the selected table, and arbitrary navigation, sidebars, or other sibling state inside the single root is retained. A reproduction containing an unrelated `<aside data-test-id="private-nav">` next to a table was accepted and preserved that structure, contrary to the immediate-wrapper/table privacy boundary.
**Fix:** Require exactly one selected table boundary; resolve the header and body row from that table; and reject element descendants outside the allowed immediate wrapper/table subtree. Add cases for an app-root wrapper with sibling UI and for header/row nodes belonging to a different table.

### CR-03: Unknown textual ARIA attributes bypass redaction

**Classification:** BLOCKER  
**File:** `/Users/mike/code/zhroma/scripts/sanitize-fixture.js:261-267`  
**Issue:** Four textual ARIA attributes are replaced, but every other `aria-*` attribute is preserved without validating its value. Text-bearing attributes such as `aria-placeholder`, `aria-braillelabel`, and `aria-brailleroledescription` can therefore carry names or ticket text into Git. A synthetic `aria-placeholder="Unlisted Person"` survived sanitization when the denylist did not happen to contain that value.
**Fix:** Replace every textual ARIA attribute, remove all reference-bearing ARIA attributes, and preserve only an explicit set of state/number attributes after validating their permitted value grammar. Reject any unclassified `aria-*` attribute instead of accepting the prefix wholesale.

### CR-04: Priority labels are preserved in every text node, not only in the proven Priority column

**Classification:** BLOCKER  
**File:** `/Users/mike/code/zhroma/scripts/sanitize-fixture.js:275-299`  
**Issue:** `Urgent`, `High`, `Normal`, and `Low` survive anywhere in the capture. A subject, requester, organization, or unrelated sibling whose complete text is `High` is therefore retained. The reproduction placed `High` in a non-Priority cell and it survived. A complete denylist cannot solve this safely: including `High` would also reject the legitimate Priority cells the corpus is meant to preserve.
**Fix:** Before redaction, locate the proven ticket table and Priority header index, positively identify ticket rows, and allow these four strings only in the direct cell at that index. Replace the same strings everywhere else. Add tests with each allowed label in a subject cell, group row, unrelated sibling, and ARIA attribute.

### CR-05: Final mode treats the fixture manifest as optional

**Classification:** BLOCKER  
**File:** `/Users/mike/code/zhroma/scripts/verify-recon-gate.js:277-290`  
**Issue:** `final` mode verifies fixtures only when a fifth CLI argument happens to be present. `node scripts/verify-recon-gate.js final SELECTORS.md` exits 0 and prints `FINAL VERDICT: block`, so a missing corpus argument silently bypasses the corpus gate even though final mode is supposed to bind the verdict to admitted fixtures. Extra CLI arguments are also ignored.
**Fix:** Parse an exact CLI shape per mode. Require exactly `final <ledger> <manifest>` for final mode, reject missing or extra arguments, and add a smoke test asserting a non-zero exit when the manifest is omitted.

### CR-06: Final manifest verification accepts active or sensitive fixtures when their hashes match

**Classification:** BLOCKER  
**File:** `/Users/mike/code/zhroma/scripts/verify-recon-gate.js:229-275`  
**Issue:** `verifyManifestBytes()` checks only entry shape, scenario names, paths, and SHA-256. It never runs the sensitive-content scanner, inert parsing, selector resolution, provenance checks, or scenario assertions implemented elsewhere. A synthetic manifest whose three fixtures each contained `<script>globalThis.compromised=true</script>` and whose hashes were updated passed final mode and printed `FINAL VERDICT: block`.
**Fix:** Move the fixture-contract validator out of the test file into a production module and invoke that single implementation from both tests and `runCli()`. Sensitive scanning must precede detached parsing, and final mode must require the complete scenario matrix and every metadata/selector/topology assertion.

### CR-07: A `proceed` verdict is accepted even when the recorded interaction safety gate failed

**Classification:** BLOCKER  
**File:** `/Users/mike/code/zhroma/scripts/verify-recon-gate.js:173-226`  
**Issue:** Final validation checks only that `verdict` is one of two strings and that every ledger status belongs to a generic terminal set. It does not evaluate whether a particular `disproved` result is safe or blocking. Replacing the current `- verdict: \`block\`` with `proceed` returned `{ "entryCount": 18, "verdict": "proceed" }` even though `interaction-and-sticky-states` still records that required hover/selection evidence was not obtained.
**Fix:** Encode a machine-readable admission predicate for each blocking decision, including the interaction evidence, closed-root result, identifier/fallback coverage, and corpus result. Permit `proceed` only when every predicate is satisfied; otherwise require `block` or reject the ledger as inconsistent.

### CR-08: Final ledger validation does not require the Phase 1 evidence set or bind scenarios to the manifest

**Classification:** BLOCKER  
**File:** `/Users/mike/code/zhroma/scripts/verify-recon-gate.js:88-136`  
**Issue:** Production validation accepts any one well-shaped terminal entry and discards the `scenario` value after checking it is non-empty. The required live IDs exist only in a smoke-test constant, and the manifest is validated separately, so deleted evidence sections, fabricated scenario names, or a one-entry synthetic ledger can pass final mode. The current test explicitly demonstrates that a single synthetic entry with `proceed` is accepted.
**Fix:** Move the required evidence-ID set into production validation, retain parsed scenario values, require the full Phase 1 set in final mode, and cross-check every in-scope live scenario reference against the admitted manifest (with explicit exceptions only for the synthetic tracer and localization-only entries).

### CR-09: Lexical path checks allow fixture symlinks to escape the manifest directory

**Classification:** BLOCKER  
**File:** `/Users/mike/code/zhroma/scripts/verify-recon-gate.js:243-261`  
**Issue:** Containment is checked before dereferencing the fixture. A relative path to a symlink inside the fixture directory passes the lexical `relative()` test while `readFile()` follows it anywhere on disk. The same defect exists in `/Users/mike/code/zhroma/test/recon/fixture-contract.test.js:196-210`. This defeats the advertised bounded relative-path contract and can hash or parse files outside the admitted corpus.
**Fix:** Canonicalize the manifest directory and every fixture with `realpath()`, then repeat containment on the canonical paths before reading. If symlinked fixtures are not required, use `lstat()` and reject them outright. Add a test with an in-directory symlink targeting an external temporary file.

### CR-10: The scenario validator accepts fixtures that do not satisfy their named scenarios

**Classification:** BLOCKER  
**File:** `/Users/mike/code/zhroma/test/recon/fixture-contract.test.js:128-193`  
**Issue:** Assertions verify selector presence rather than the scenario semantics. `priority-present-ungrouped` never proves group rows are absent; `priority-absent` does not require the proven six-header/six-cell ticket-table shape; and `grouped-long` does not check row count, order, or any scroll-bearing structural fact. The suite's own supposedly valid grouped-long fixture has only one ticket row at lines 326-327 and passes as “all scenario invariants.” A materially incomplete corpus can therefore be admitted.
**Fix:** Store and validate exact structural facts derived from the sanitized captures: header count, ticket-row count and widths, group-row count/position, Priority index or absence, and the wrapper/duplicate-header relationship. At minimum require zero group rows in both ungrouped scenarios and require the admitted grouped fixture's declared 12 ordered ticket rows rather than accepting one.

## Warnings

### WR-01: The default test command does not validate the committed fixture corpus

**Classification:** WARNING  
**File:** `/Users/mike/code/zhroma/package.json:6-8`  
**Issue:** The only test of `test/fixtures/manifest.json` is conditionally registered at `/Users/mike/code/zhroma/test/recon/fixture-contract.test.js:543-552`. `npm test` ran 29 tests and skipped the committed corpus; only a separately supplied `GSD_FIXTURE_MANIFEST` ran the 30th test. Routine green test runs therefore miss fixture drift or accidental sensitive content.
**Fix:** Make the committed manifest the default selected corpus inside the test module, while retaining the environment variable as an override for negative tests. Then `npm test` always exercises the actual admitted artifacts.

### WR-02: Supported Node versions are not declared despite dependency engine requirements

**Classification:** WARNING  
**File:** `/Users/mike/code/zhroma/package.json:1-13`  
**Issue:** The package does not declare an `engines.node` range, while the locked Vite release requires Node `^20.19.0 || >=22.12.0`. Contributors can install under an unsupported Node version and encounter avoidable install or test failures without an early project-level diagnostic.
**Fix:** Add the effective minimum supported runtime, for example:

```json
"engines": {
  "node": "^20.19.0 || >=22.12.0"
}
```

---

_Reviewed: 2026-09-03T12:36:47Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: standard_
