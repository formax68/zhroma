---
phase: 01-dom-recon-spike
reviewed: 2026-09-04T11:42:32Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - .gitignore
  - SELECTORS.md
  - package.json
  - scripts/fixture-contract.js
  - scripts/sanitize-fixture.js
  - scripts/verify-recon-gate.js
  - test/fixtures/manifest.json
  - test/fixtures/zendesk-view-grouped-long.html
  - test/fixtures/zendesk-view-priority-absent.html
  - test/fixtures/zendesk-view-priority-present.html
  - test/recon/fixture-contract.test.js
  - test/recon/interaction-evidence.smoke.js
  - test/recon/recon-gate.smoke.js
  - test/recon/sanitize-fixture.test.js
  - test/recon/sensitive-patterns.js
  - test/recon/sensitive-patterns.smoke.js
  - vitest.config.js
findings:
  critical: 11
  warning: 3
  info: 0
  total: 14
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-09-04T11:42:32Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

The revised implementation still has release-blocking privacy and admission failures. Direct adversarial probes showed that the sanitizer can preserve `High` from a non-Priority cell, canonically equivalent denylist text can evade scanning, the committed fixture corpus contains ARIA values the current sanitizer rejects, a manifest can replace the Priority-absence assertion with a presence assertion, and the final gate can return `proceed` after required live evidence is moved out of scope or interaction paint is replaced with raw private strings. `npm test` passed all 71 tests, demonstrating that the current suite does not cover these fail-open paths.

`package-lock.json` was loaded as mandatory context but excluded from the reviewed-file count under the lock-file scope rule. No performance-only findings are included because performance is outside the v1 review scope.

## Narrative Findings (AI reviewer)

The findings below are ordered by severity. Every Critical issue is classified as a release **BLOCKER**; every Warning is classified as **WARNING**.

## Critical Issues

### CR-01: Filtered header indexes can preserve private text from the wrong column

**Classification:** BLOCKER
**File:** `/Users/mike/code/zhroma/scripts/sanitize-fixture.js:303-340`
**Issue:** `headerCells` is filtered to header-like children and `priorityIndexes` is computed against that filtered array. Body cells are independently filtered, so malformed or mixed direct children shift the index. A direct reproduction with `<tr><td>Subject</td><th>Priority</th></tr>` and a one-cell ticket row preserved `High` from that row as if it were Priority. This defeats the one-way redaction boundary and can admit tenant text when it happens to equal an allowed priority label.
**Fix:** Require every direct header child to be a header cell and every direct ticket-row child to be a body cell, then derive the Priority index from the unfiltered `headerRow.children` collection. Reject any mixed-child row before constructing `priorityCells`.

```js
const headerChildren = [...headerRows[0].children];
if (
  headerChildren.length === 0
  || headerChildren.some((cell) => !cell.matches('th, [role="columnheader"]'))
) reject('table-boundary-required');

const priorityIndex = headerChildren.findIndex(
  (cell) => cell.textContent.trim() === 'Priority',
);
// Also require each ticket row to contain only cells and exactly this width.
```

### CR-02: Unicode-equivalent denylist values bypass sensitive-content admission

**Classification:** BLOCKER
**File:** `/Users/mike/code/zhroma/test/recon/sensitive-patterns.js:80-95,111-115`
**Issue:** Denylist tokens and content are case-folded but never Unicode-normalized. `scanSensitiveContent('<div data-test-id="Jose\u0301">', { denylist: ['José'] })` returned `{ accepted: true }`, even though the two names are canonically equivalent. Because `data-test-id` is preserved by the sanitizer, decomposed names or organizations can reach committed fixtures.
**Fix:** Normalize both denylist tokens and scanned content to the same Unicode form before case folding, and add NFC/NFD regression cases in both scanner and sanitizer tests.

```js
const fold = (value) => value.normalize('NFC').toLocaleLowerCase('en-US');
const normalized = denylist.map((token) => (
  typeof token === 'string' ? fold(token.trim()) : ''
));
const foldedContent = fold(content);
```

### CR-03: The private capture denylist is allowed inside the Git worktree

**Classification:** BLOCKER
**File:** `/Users/mike/code/zhroma/scripts/sanitize-fixture.js:478-498`
**Issue:** The sanitizer canonicalizes and rejects an input capture inside the worktree, but it neither canonicalizes nor applies the same containment rule to `denylistPath`. The denylist is explicitly capture-specific and contains the exact private names/organizations being excluded; allowing it in a worktree where `.gitignore` only ignores `node_modules/` creates a direct source-control disclosure risk.
**Fix:** Resolve the denylist with `realpath()`, reject it when it is inside the project root, and read/stat only the canonical path. Add a defense-in-depth ignore rule for the documented private capture/denylist location or filename convention.

### CR-04: The corpus gate does not enforce the sanitizer output contract

**Classification:** BLOCKER
**File:** `/Users/mike/code/zhroma/scripts/fixture-contract.js:320-392`; `/Users/mike/code/zhroma/test/fixtures/zendesk-view-priority-present.html:1`; `/Users/mike/code/zhroma/test/fixtures/zendesk-view-priority-absent.html:1`; `/Users/mike/code/zhroma/test/fixtures/zendesk-view-grouped-long.html:1`
**Issue:** The validator checks only that `sanitizationMethod` is non-empty, runs the generic sensitive regexes, and then trusts the hash and selected topology. It never validates the sanitizer's attribute/value grammar. All committed fixtures contain `ARIA-STATE` in enum-valued ARIA attributes (`aria-autocomplete` or `aria-haspopup`), while the current sanitizer rejects those values as `aria-attribute-invalid`. Copying the admitted Priority-present fixture outside the worktree and passing it through the current sanitizer reproduced that rejection. The ledger's claim that these exact bytes were processed by the current sanitizer is therefore not enforced and is inconsistent with the accepted corpus.
**Fix:** Extract a pure sanitized-output validator from `sanitize-fixture.js` and invoke it from both sanitization and corpus admission. Re-admit all three fixtures through the current contract and update their hashes; add a regression that every committed fixture satisfies the same attribute, ARIA, text, and one-table boundary grammar.

### CR-05: A Priority-present column can be admitted as the Priority-absent scenario

**Classification:** BLOCKER
**File:** `/Users/mike/code/zhroma/scripts/fixture-contract.js:156-245`
**Issue:** `assertScenario()` requires only the purpose string `priority-column-absent`; it does not require that assertion's kind to be `selector-absent`. The separate check looks only for leaf text equal to a priority value, not column presence. A direct probe changed the absence assertion to `selector-present`, added a seventh header/cell column with redacted text, updated the declared widths/hash, and the complete matrix still validated. The absence control therefore does not mechanically prove absence.
**Fix:** Resolve the required assertion by purpose and require `kind === 'selector-absent'`, then bind it to the declared ticket table/header topology. Reject a null `priorityIndex` when any declared Priority-column selector resolves.

```js
const absence = entry.assertions.find(
  ({ purpose }) => purpose === 'priority-column-absent',
);
if (absence?.kind !== 'selector-absent') {
  throw contractError('priority-absence-assertion-required');
}
```

### CR-06: Raw path aliases let one physical fixture satisfy the three-file matrix

**Classification:** BLOCKER
**File:** `/Users/mike/code/zhroma/scripts/fixture-contract.js:316-348`
**Issue:** Duplicate detection stores the raw manifest string before `safeRelativeFixturePath()` canonicalizes it. `combo.html`, `./combo.html`, and `.//combo.html` are treated as distinct files even though all resolve to the same canonical path. A direct probe used those aliases and one multi-table HTML file to satisfy all three required scenarios; `requireCompleteScenarioMatrix` returned success. This defeats the canonical-plus-variants corpus requirement and also lets a file impossible under the one-table sanitizer boundary pass as three independent captures.
**Fix:** Add the canonical path returned by `safeRelativeFixturePath()` to a `seenCanonicalFiles` set and reject duplicates after resolution. The sanitizer-output validation from CR-04 must also reject multi-table fixture bytes.

### CR-07: Required live evidence can be relabeled as localization-only and still authorize `proceed`

**Classification:** BLOCKER
**File:** `/Users/mike/code/zhroma/scripts/verify-recon-gate.js:227-265`
**Issue:** Final mode requires evidence IDs, but it does not require each ID's expected scope, status, or scenario set. The generic scenario loop explicitly permits any non-English entry to use `not-run-localization-only`. Changing only `shell-metadata` to `scope: Localization only`, `status: outside English-only scope`, and that localization scenario still returned `{ verdict: 'proceed' }`. Required English-path evidence can therefore be made absent without blocking Phase 2.
**Fix:** Replace the ID-only list with a per-entry contract containing required scope, admissible terminal outcome, and scenario coverage. Validate that contract before evaluating the final verdict.

### CR-08: Selector fallback proof is inferred from an unstructured prose substring

**Classification:** BLOCKER
**File:** `/Users/mike/code/zhroma/scripts/verify-recon-gate.js:303-314`
**Issue:** When stable identifiers are missing, any `ranked-fallback` sentence containing `complete three-scenario corpus` is accepted as proof. The current sentence says the fallback *must pass* that corpus in the future, yet it already satisfies the predicate. A direct probe changed `stable-identifiers` to `disproved` with evidence `No stable identifiers were found`; final mode still returned `proceed` because the prose happened to contain that phrase.
**Fix:** Introduce a machine-readable fallback status and evidence reference, and set it only from a validator result. Do not derive authorization from prose substrings such as `startsWith('No.')`, `startsWith('Passed')`, or `includes(...)`.

### CR-09: The real interaction gate accepts arbitrary private strings as paint evidence

**Classification:** BLOCKER
**File:** `/Users/mike/code/zhroma/scripts/verify-recon-gate.js:273-291`; `/Users/mike/code/zhroma/test/recon/interaction-evidence.smoke.js:30-36,92-165`
**Issue:** Production final validation checks only that the three paint fields are non-empty and byte-distinct. The syntax/privacy validator in `interaction-evidence.smoke.js` exists only inside the test file and is never called by `verifyReconLedger()`. Replacing the three repository paint summaries with `PRIVATE-PERSON-NAME`, `PRIVATE-TENANT-NAME`, and `PRIVATE-ACCOUNT-NAME` still returned `proceed`. Whitespace-only variations of semantically identical paint would also satisfy the distinctness test.
**Fix:** Move `assessInteractionEvidence()` into a production module, import that same function from the final gate and tests, strictly parse and canonicalize paint values before comparison, and reject any unrecognized field/value without echoing it. Run the sensitive-content policy over the complete ledger or enforce an equivalent closed grammar.

### CR-10: Seven explicitly unresolved final-gate inputs are ignored

**Classification:** BLOCKER
**File:** `/Users/mike/code/zhroma/scripts/verify-recon-gate.js:159-191,340-356`; `/Users/mike/code/zhroma/SELECTORS.md:273-290`
**Issue:** The ledger says the seven `Spec-less Planning Assumptions` remain inputs to the final admission/verdict gate, and the smoke suite asserts that all seven remain `unresolved`. `parseOpenQuestions()` inspects only `## Recon Question` sections, so table rows are invisible and the same document is accepted with `verdict: proceed`. The machine result contradicts the ledger's own gating statement.
**Fix:** Represent every gating item in the parsed `Recon Question` schema, or add a strict parser for this table and reject `proceed` while any row is unresolved. If these rows are intentionally non-gating, remove the claim that they are final-gate inputs and test the revised contract explicitly.

### CR-11: Recon CLI errors disclose private paths and untrusted field values

**Classification:** BLOCKER
**File:** `/Users/mike/code/zhroma/scripts/verify-recon-gate.js:128-143,394-396`
**Issue:** The CLI prints `error.message` verbatim. A missing ledger at `/private/tmp/PRIVATE-PERSON-NAME-missing.md` produced the full path in stderr. Parser errors also interpolate untrusted IDs and status values. This conflicts with the repository's privacy boundary and can copy sensitive paths or accidentally pasted content into CI logs.
**Fix:** Convert failures to stable error codes and print only those codes at the CLI boundary. Wrap ledger reads as `ledger-readable-required`; reserve full exception details for an explicitly local debug mode that is disabled by default.

## Warnings

### WR-01: The declared Node range includes a version rejected by locked Vitest

**Classification:** WARNING
**File:** `/Users/mike/code/zhroma/package.json:6-8`
**Issue:** `^20.19.0 || >=22.12.0` includes Node 23.x, but locked `vitest@4.1.11` declares `^20.0.0 || ^22.0.0 || >=24.0.0`. A runtime accepted by the project can therefore be unsupported by the test runner.
**Fix:** Declare the intersection of the locked tools' engine ranges, for example `^20.19.0 || ^22.12.0 || >=24.0.0`, and refresh lock metadata with the approved versions unchanged.

### WR-02: A valid JSON `null` manifest escapes the stable contract error model

**Classification:** WARNING
**File:** `/Users/mike/code/zhroma/scripts/fixture-contract.js:303-313`
**Issue:** `JSON.parse('null')` succeeds, then `manifest.fixtures` throws a raw `TypeError` with no stable `code`. A direct probe returned `TypeError: Cannot read properties of null`, unlike every other malformed-manifest path.
**Fix:** Validate that the parsed root is a non-null, non-array object before dereferencing it, and throw `contractError('manifest-object-required')`. Add `null`, scalar, and array root cases.

### WR-03: Production admission scripts depend on a module under the test tree

**Classification:** WARNING
**File:** `/Users/mike/code/zhroma/scripts/fixture-contract.js:7`; `/Users/mike/code/zhroma/scripts/sanitize-fixture.js:8-11`
**Issue:** Both production scripts import the sensitive-admission primitive from `test/recon/sensitive-patterns.js`. Any packaging, reuse, or deployment that excludes tests breaks the sanitizer and final corpus gate at module load time, and it encourages the production/test divergence already present in CR-09.
**Fix:** Move the scanner to a production module under `scripts/` or `src/`, then have all tests import that single implementation.

---

_Reviewed: 2026-09-04T11:42:32Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
