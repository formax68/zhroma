# Phase 6: Live DOM Recon 2 - Pattern Map

**Mapped:** 2026-09-25
**Files analyzed:** 13 (4 new code/test modules, 4 modified tracked files, 3 generated fixtures, 1 run sheet, 1 test file that must stay unchanged but constrains design)
**Analogs found:** 11 / 12 (the run sheet has only a partial analog)

**Scope guard (D-22):** every file below is under `scripts/`, `test/recon/`, `test/fixtures/`, `SELECTORS.md` or `.planning/`. No analog requires touching `extension/` or `test/extension/`. Every analog path was checked with `git ls-files` and is tracked. `package.json` needs **no change**: `test:recon` already globs `test/recon/*.smoke.js` and `vitest.config.js` already includes `test/recon/*.test.js`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/rule-column-contract.js` (NEW) | utility (output contract / validator) | transform + validation | `scripts/sanitized-output-contract.js` | exact |
| `scripts/sanitize-fixture.js` (MODIFY: opt-in `mode: 'rule-columns'`, 8-arg CLI) | utility (CLI + library) | file-I/O + transform | itself (v1 path, lines 113-336) | exact (self) |
| `scripts/fixture-contract.js` (MODIFY: export `validateRecon2Fixtures`) | utility (manifest validator) | file-I/O + validation | itself, `validateFixtureManifest` (lines 333-454) | exact (self) |
| `scripts/verify-recon-gate.js` (MODIFY: export `verifyRecon2Ledger`, CLI `recon2`) | utility (ledger gate + CLI) | transform (markdown parse) + validation | itself, `parseEntries` / `parseVerdict` / `runCli` (lines 253-392, 688-735) | exact (self) |
| `test/recon/rule-column-sanitizer.test.js` (NEW, vitest) | test | file-I/O | `test/recon/sanitize-fixture.test.js` + `test/recon/sanitized-output-contract.test.js` | exact |
| `test/recon/recon2-gate.smoke.js` (NEW, node:test) | test | transform | `test/recon/recon-gate.smoke.js` | exact |
| `test/recon/recon2-corpus.test.js` (NEW, vitest; after admission) | test | file-I/O | `test/recon/corpus-provenance.test.js` | exact |
| `test/fixtures/manifest.json` (MODIFY: top-level `recon2Fixtures` array) | config (data manifest) | — | existing `fixtures` entries (lines 3-51) | role-match |
| `test/fixtures/zendesk-recon2-light-columns.html` (NEW, generated) | fixture | — | `test/fixtures/zendesk-view-priority-present.html` (shape only) | role-match; produced by the sanitizer, never hand-written |
| `test/fixtures/zendesk-recon2-identity-region.html` (NEW, generated) | fixture | — | none (new boundary kind) | none; produced by the sanitizer |
| `test/fixtures/zendesk-recon2-dark-table.html` (NEW, generated) | fixture | — | `test/fixtures/zendesk-view-priority-present.html` (shape only) | role-match; produced by the sanitizer |
| `SELECTORS.md` (MODIFY: Recon 2 block before `## Spec-less Planning Assumptions`) | ledger doc | — | `## Ledger Entry: interaction-and-sticky-states` (lines 162-179), `## Authenticated Interaction Handoff` (241-256), `## Final Verdict` (293+) | exact (shape) |
| `.planning/phases/06-live-dom-recon-2/06-RUN-SHEET.md` (NEW) | doc (operator script) | — | probes in `SELECTORS.md` (lines 60, 72, 156, 168) + RESEARCH Code Examples P0-P6 | partial |

**Must stay green, not edited (design constraints):** `test/recon/corpus-provenance.test.js`, `test/recon/sanitize-fixture.test.js`, `test/recon/sanitized-output-contract.test.js`, `test/recon/recon-gate.smoke.js`, `test/recon/fixture-contract.test.js`, `test/recon/interaction-evidence.smoke.js`, `scripts/sanitized-output-contract.js`, `scripts/sensitive-patterns.js`, `scripts/interaction-evidence.js`.

---

## Pattern Assignments

### `scripts/rule-column-contract.js` (utility, transform + validation) — NEW

**Analog:** `scripts/sanitized-output-contract.js` (338 lines, read in full)

**Imports pattern** — reuse, do not duplicate. The analog's only import is happy-dom (line 1). The new module should import the v1 exports it builds on:
```javascript
import {
  PRIORITY_LABELS, PRIORITY_HEADER_LABEL, PRESERVED_ATTRIBUTES, TEXTUAL_ARIA_ATTRIBUTES,
  REFERENCE_ATTRIBUTES, REMOVABLE_ATTRIBUTES, normalizedAriaValue, assertSafeToParse,
  resolveBoundedDocument, SanitizedOutputError,
} from './sanitized-output-contract.js';
```

**Attribute-class sets pattern** (analog lines 8-38, 90-119) — exported frozen-by-convention `Set`s. The rule mode must **copy, never mutate** the v1 sets (RESEARCH Anti-Pattern "Mutating the exported v1 Sets"):
```javascript
export const RULE_PRESERVED_ATTRIBUTES = new Set([...PRESERVED_ATTRIBUTES]);
export const RULE_TOKENISED_TEXT_ATTRIBUTES = new Set([...TEXTUAL_ARIA_ATTRIBUTES, 'title', 'alt']);
export const RULE_REMOVABLE_ATTRIBUTES = new Set(
  [...REMOVABLE_ATTRIBUTES].filter((name) => !['title', 'alt', 'datetime'].includes(name)),
);
```
`datetime` becomes its own class (synthetic literal per format class, D-13).

**Error class + reject pattern** (analog lines 123-133) — copy verbatim shape, new name:
```javascript
export class SanitizedOutputError extends Error {
  constructor(code) {
    super('Sanitized output rejected');
    this.name = 'SanitizedOutputError';
    this.code = code;
  }
}
function reject(code) {
  throw new SanitizedOutputError(code);
}
```
Recommendation: reuse the imported `SanitizedOutputError` (so `sanitize-fixture.js` lines 269-271 `if (error instanceof SanitizedOutputError) reject(error.code);` works unchanged for both modes). New codes must match `/^[a-z]+(?:-[a-z]+)*$/u` (gate CLI, `verify-recon-gate.js` line 722), e.g. `identity-boundary-required`, `datetime-format-unrecognised`, `identifier-value-invalid`.

**Inert parser pattern** (analog lines 147-162) — `createInertParser()` is not exported; copy it verbatim (it is also duplicated as `parseDetached` in `fixture-contract.js` lines 21-36 and in the tests, so duplication is the existing convention):
```javascript
function createInertParser() {
  const isolatedWindow = new Window({
    settings: {
      enableJavaScriptEvaluation: false,
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
      enableImageFileLoading: false,
      navigation: {
        disableMainFrameNavigation: true,
        disableChildFrameNavigation: true,
        disableChildPageNavigation: true,
      },
    },
  });
  return new isolatedWindow.DOMParser();
}
```

**Table boundary** — call exported `resolveBoundedDocument(parsed)` (analog lines 175-256) unchanged. It returns `{ root, table, headerRow, priorityCells, priorityHeaderCell, priorityIndex, ticketRowCount }`. Column index per header = position in `[...headerRow.children]` (same as analog line 228-234). Owning cell for a node = `[...row.children][index]` for the node's ticket row.

**Identity-region boundary** (new kind) — copy the opening checks of `resolveBoundedDocument` (analog lines 176-180) verbatim, then add the RESEARCH Pattern 1 rules (no table/row/nav/header/main/aside/banner/menubar/tablist; at least one `PERSON-SELF`; root = LCA or nearest button/menuitem; element cap ~40):
```javascript
const rootElements = [...parsed.body.children];
if (rootElements.length !== 1 || parsed.head.childNodes.length > 0
  || [...parsed.body.childNodes].some((node) => node.nodeType === 3 && node.data.trim())) {
  reject('identity-boundary-required');
}
```

**Core validator pattern** (analog lines 295-338, `validateSanitizedOutput`) — mirror its order exactly: non-empty string check -> `assertSafeToParse` -> `<!--` rejection -> parse+boundary -> attribute loop -> recursive text `visit`. The rule-mode validator `validateRuleColumnOutput(markup, { boundary })` swaps the grammar only:
```javascript
export function validateSanitizedOutput(markup) {
  if (typeof markup !== 'string' || !markup.trim()) reject('table-boundary-required');
  assertSafeToParse(markup);
  if (markup.includes('<!--')) reject('comment-must-be-absent');
  const capture = parseBoundedCapture(markup);
  const { root, priorityCells, priorityHeaderCell } = capture;
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const attribute of element.attributes) {
      const name = attribute.name.toLocaleLowerCase('en-US');
      if (TEXTUAL_ARIA_ATTRIBUTES.has(name)) {
        if (!/^ARIA-\d{3,}$/u.test(attribute.value)) reject('text-stand-in-required');
      } else if (REFERENCE_ATTRIBUTES.has(name) || REMOVABLE_ATTRIBUTES.has(name)) {
        reject('unsafe-attribute');
      } else if (name.startsWith('aria-')) {
        const normalized = normalizedAriaValue(name, attribute.value);
        if (normalized === undefined) reject('unsafe-aria-attribute');
        if (normalized === null || normalized !== attribute.value) reject('aria-attribute-invalid');
      } else if (!PRESERVED_ATTRIBUTES.has(name)) {
        reject('unsafe-attribute');
      }
    }
  }
  function visit(node) { /* lines 319-335: comment reject, TEXT-nnn or column-owned vocabulary, else text-stand-in-required */ }
  visit(root);
  return { tableCount: 1, ticketRowCount: capture.ticketRowCount, priorityIndex: capture.priorityIndex };
}
```
Rule-mode grammar replaces `/^ARIA-\d{3,}$/u` and `/^TEXT-\d{3,}$/u` with a kind-token grammar (e.g. `/^(?:PERSON|GROUP|SUBJECT|TAG|DATE|STATUS|FIELD|LABEL|TEXT)-\d{3,}$/u` plus `PERSON-SELF` / `PERSON-SELF-ALT`), and admits D-11 vocabulary only inside its owning column. Keep the Priority check byte-identical to lines 328-332 (whole-cell equality).

**Column-owned vocabulary check** — model on the analog's Priority-in-cell check (lines 328-332), generalised by column kind:
```javascript
if (PRIORITY_LABELS.has(text) && [...priorityCells].some((cell) => (
  cell.contains(child) && cell.textContent.trim() === text
))) continue;
```

**Digit-free identifier grammar** — add a check on `data-garden-id` / `data-test-id` values (RESEARCH Pattern 1, "Identifier values"), because `sensitive-patterns.js` only catches `\b\d{7,}\b`.

---

### `scripts/sanitize-fixture.js` (utility, file-I/O + transform) — MODIFY

**Analog:** itself (336 lines, read in full). The v1 code path must remain byte-for-byte unchanged in behaviour (D-10).

**Imports** (lines 6-16): add one import block for the new contract; do not reorder existing imports.
```javascript
import {
  PRIORITY_LABELS, PRIORITY_HEADER_LABEL, PRESERVED_ATTRIBUTES,
  TEXTUAL_ARIA_ATTRIBUTES, REFERENCE_ATTRIBUTES, REMOVABLE_ATTRIBUTES,
  normalizedAriaValue, assertSafeToParse, parseBoundedCapture,
  validateSanitizedOutput, SanitizedOutputError,
} from './sanitized-output-contract.js';
```

**Custody block to reuse unchanged** (lines 224-264) — mode-independent. Only branch after `decodeUtf8` (line 264):
```javascript
  const source = decodeUtf8(inputBytes, 'input-utf8-required');
  let capture;
  try {
    assertSafeToParse(source);
    capture = parseBoundedCapture(source);
  } catch (error) {
    if (error instanceof SanitizedOutputError) reject(error.code);
    throw error;
  }
  const { root, priorityCells, priorityHeaderCell } = capture;
  const output = finalMarkup(root, priorityCells, priorityHeaderCell, denylist);
```
Rule mode: validate `options.mode` is `undefined` or exactly `'rule-columns'` (else a new code such as `mode-invalid`), keep `assertSafeToParse(source)` in both modes, then call a rule-mode parse (table or identity-region boundary) and a rule-mode `finalMarkup`.

**Denylist parse pattern** (lines 113-122) — the rule-mode variant adds the `self:` directive; copy the shape and keep `denylist-required` for empty input:
```javascript
function parseDenylist(bytes) {
  const values = decodeUtf8(bytes, 'denylist-required')
    .split(/\r?\n/u)
    .map((value) => value.trim())
    .filter(Boolean);
  if (values.length === 0) {
    reject('denylist-required');
  }
  return values;
}
```
The `self:` line must strip the prefix and add the bare name to the scan list (the scan is a substring test, so a literal `self:` prefix would never match content).

**Attribute loop pattern** (lines 125-169) — the rule-mode copy keeps the same order: `on*` reject, resource reject, then classification. Critical ordering difference: rule mode must test its kept `title`/`alt` class and `datetime` **before** the `REMOVABLE_ATTRIBUTES` branch (line 142), because v1's removable set contains `title`, `alt` and `datetime`.
```javascript
      if (REFERENCE_ATTRIBUTES.has(name) || REMOVABLE_ATTRIBUTES.has(name)) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (TEXTUAL_ARIA_ATTRIBUTES.has(name)) {
        ariaCounter += 1;
        element.setAttribute(attribute.name, `ARIA-${String(ariaCounter).padStart(3, '0')}`);
        continue;
      }
```
Rule mode replaces the per-occurrence counter with a per-`(kind, normalised value)` `Map` (D-12) and a single document-order traversal that visits attributes and text together (RESEARCH Pattern 1, "Per-distinct-value tokens").

**Text visit pattern** (lines 171-201) — copy the recursive `visit` with comment removal (`nodeType === 8`) and text rewriting (`nodeType === 3`); swap the preservation predicate for the column-aware allowlist.

**Final markup + scan + self-validate pattern** (lines 203-222) — copy exactly, swapping only the validator:
```javascript
  const output = `${root.outerHTML}\n`;
  try {
    scanSensitiveContent(output, { denylist });
  } catch (error) {
    if (error instanceof SensitiveFixtureError) {
      reject('sensitive-residual');
    }
    throw error;
  }
  try {
    validateSanitizedOutput(output);   // rule mode: validateRuleColumnOutput(output, { boundary })
  } catch {
    reject('output-contract-violated');
  }
  return output;
```

**Write-once** (lines 277-281): `writeFile(outputPath, outputBytes, { flag: 'wx' })` — shared by both modes, unchanged.

**CLI arity pattern** (lines 289-316) — keep the 6-argument branch identical; add an 8-argument branch whose flag set adds `--mode` and whose value must be exactly `rule-columns`:
```javascript
function parseCliArguments(argumentsList) {
  if (argumentsList.length !== 6) {
    reject('cli-arguments-invalid');
  }
  const values = {};
  for (let index = 0; index < argumentsList.length; index += 2) {
    const flag = argumentsList[index];
    const value = argumentsList[index + 1];
    if (!['--input', '--output', '--denylist'].includes(flag) || values[flag]) {
      reject('cli-arguments-invalid');
    }
    if (typeof value !== 'string' || value.length === 0 || value.startsWith('--')) {
      reject('cli-arguments-invalid');
    }
    values[flag] = value;
  }
  ...
}
```
**Value-free CLI output** (lines 318-329): stdout `SANITIZE_FIXTURE_OK <sha256>\n`, stderr `SANITIZE_FIXTURE_REJECTED <code>\n`. Never print paths or values.

---

### `scripts/fixture-contract.js` (utility, file-I/O + validation) — MODIFY

**Analog:** itself, `validateFixtureManifest` (lines 333-454). `validateFixtureManifest` must stay unchanged (it is called with `requireCompleteScenarioMatrix: true` by `test/extension/*`, `scripts/run-tint-workload.js:157`, `scripts/verify-locale-rendering.js:163`, and asserted `fixtureCount: 3`).

**Imports** (lines 1-8): add `import { validateRuleColumnOutput } from './rule-column-contract.js';` alongside the existing imports.

**Error factory** (lines 38-43) — reuse `contractError(code)`; the gate CLI recognises `error?.name === 'FixtureContractError'` (`verify-recon-gate.js` line 721).

**Manifest read + root check** (lines 334-347) — copy the shape for `validateRecon2Fixtures(manifestPath, options)`, keyed on `manifest.recon2Fixtures`:
```javascript
  const absoluteManifestPath = resolve(manifestPath);
  let manifest;
  try {
    manifest = JSON.parse(await readFile(absoluteManifestPath, 'utf8'));
  } catch {
    throw contractError('manifest-readable-json-required');
  }
  if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw contractError('manifest-object-required');
  }
```

**Per-entry field checks** (lines 354-385) — reuse `requireNonEmptyString`, the `captureDate` round-trip check (365-372), `sha256` hex check (373-375), duplicate scenario (376-379), `safeRelativeFixturePath` (306-331) and canonical-duplicate (382-383). Replace `selectors.*` requirements with `appearance`, `boundaryKind` (`table` | `identity-region`), `sanitizerMode === 'rule-columns'`.

**Bytes check order** (lines 387-407) — copy exactly: checksum, then `scanSensitiveContent(markup, { denylist: ADMISSION_DENYLIST })` **before** parsing, then grammar:
```javascript
    const actualHash = createHash('sha256').update(bytes).digest('hex');
    if (actualHash !== entry.sha256) {
      throw contractError('fixture-checksum-mismatch');
    }
    const markup = bytes.toString('utf8');
    scanSensitiveContent(markup, { denylist: ADMISSION_DENYLIST });
    try {
      validateSanitizedOutput(markup);   // recon2: validateRuleColumnOutput(markup, { boundary: entry.boundaryKind })
    } catch (error) {
      if (error instanceof SanitizedOutputError) throw contractError('admitted-bytes-contract-violated');
      throw error;
    }
```
**Return shape** (lines 450-453): `{ fixtureCount, scenarios }` — mirror as `{ recon2FixtureCount, scenarios }`. Absent or empty `recon2Fixtures` should return a zero count (pre-session state), letting the gate decide requiredness (RESEARCH Open Question 3).

---

### `scripts/verify-recon-gate.js` (utility, markdown parse + validation + CLI) — MODIFY

**Analog:** itself (735 lines, read in full). `verifyReconLedger` (lines 658-686) must stay untouched; Phase 1 `final` must still return `{ entryCount: 18, verdict: 'proceed' }`.

**Heading constants pattern** (lines 13-16) — add siblings, do not edit the existing ones:
```javascript
const ENTRY_HEADING = /^## Ledger Entry:\s*(.+?)\s*$/gm;
const QUESTION_HEADING = /^## Recon Question:\s*(.+?)\s*$/gm;
const VERDICT_HEADING = /^## Final Verdict\s*$/gm;
const FIELD_LINE = /^- ([a-z][a-z0-9-]*):\s*(.*)$/gm;
```
New: `RECON2_ENTRY_HEADING = /^## Recon 2 Entry:\s*(.+?)\s*$/gm`, `RECON2_VERDICT_HEADING = /^## Recon 2 Verdict\s*$/gm`.

**Required-field + status sets** (lines 18-28, 43-47) — `REQUIRED_ENTRY_FIELDS` is the D-13 shape; reuse it and add `RECON2_TERMINAL_STATUSES = new Set(['verified', 'disproved', 'not observed'])` (reject `pending`). Required ids as a frozen array of the eight D-21 ids.

**Section/field helpers** (lines 245-282) — `unwrapCode`, `collectSections`, `parseFields` are module-private; call them directly from `verifyRecon2Ledger` (no export needed). `parseFields` already throws `entry-field-duplicate`.

**Entry-parse pattern** (lines 284-332) — copy the body of `parseEntries` into `parseRecon2Entries`: required fields, id regex `/^[a-z0-9][a-z0-9-]*$/`, heading/id match, duplicate id, status membership. Use `recon2-`-prefixed codes where they must be distinguishable (e.g. `recon2-entries-required`, `recon2-evidence-missing`).
```javascript
    const id = fields.get('id');
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
      throw new ReconGateError('entry-id-invalid');
    }
    if (section.heading !== id) {
      throw new ReconGateError('entry-heading-id-mismatch');
    }
    if (ids.has(id)) {
      throw new ReconGateError('entry-id-duplicate');
    }
```

**Verdict-parse pattern** (lines 367-393) — copy `parseVerdict` for `## Recon 2 Verdict` but **drop** the "must be last section" check (lines 373-378): the Recon 2 verdict sits before `## Spec-less Planning Assumptions`. Require `recon2-verdict` in `{proceed, block}`, `blocked-consumers` in `{none, phase-8}`, and `rationale`.

**Closed-enum check pattern** (lines 592-600) — model the enum-field table on this:
```javascript
  const enums = {
    'closed-shadow-dom-state': ['ruled-out', 'present', 'inconclusive'],
    'garden-identifier-state': ['present', 'absent'],
    ...
  };
  for (const [field, allowed] of Object.entries(enums)) {
    if (!allowed.includes(verdictFields.get(field))) blockers.push('verdict-field-not-structured');
  }
```
Apply per entry id using the RESEARCH Pattern 2 table (`dark-mode-offered`, `dark-branch`, `switch-effect`, `focus-observed`, `garden-identifiers`, `identity-source`, `identity-form`, `equal`, `difference-kind`, `tags-column`, `duplicate-in-view`, `duplicate-custom-titles`). Consistency: `equal: true` iff `difference-kind: identical`; verdict `block` + `phase-8` iff `dark-mode-offered: no` or `garden-identifiers: differ`.

**CLI pattern** (lines 688-735) — add one arity clause and one branch; keep the catch block unchanged (value-free code, debug only with `ZHROMA_RECON_DEBUG === '1'`):
```javascript
    if (
      (mode === 'evidence' && args.length !== 2)
      || (mode === 'final' && args.length !== 3)
      || (mode !== 'evidence' && mode !== 'final')
    ) {
      throw new ReconGateError('cli-arguments-invalid');
    }
```
New clause: `(mode === 'recon2' && args.length !== 3)` and allow `mode === 'recon2'` in the last clause. Output e.g. `RECON 2 VERDICT: proceed\n`, following `FINAL VERDICT: ${result.verdict}\n` (line 719). The existing unknown-mode tests (`'PRIVATE-MODE'`, `'draft'`) must still reject.

**Entry-point guard** (lines 733-735) — unchanged.

---

### `test/recon/rule-column-sanitizer.test.js` (test, vitest) — NEW

**Analogs:** `test/recon/sanitize-fixture.test.js` (library + CLI behaviour) and `test/recon/sanitized-output-contract.test.js` (grammar rejection table).

**Imports** (sanitize-fixture.test.js lines 1-14):
```javascript
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { DOMParser, Element, Window } from 'happy-dom';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { sanitizeFixture, SanitizationError, sha256 } from '../../scripts/sanitize-fixture.js';
```

**Temp-case helper** (lines 76-87) — copy `createCase`, writing a denylist that includes a `self:` line for identity tests. Private files go under `tmpdir()`, outside the worktree:
```javascript
async function createCase(source = safeCapture()) {
  const directory = await mkdtemp(join(tmpdir(), 'zhroma-sanitizer-'));
  temporaryDirectories.push(directory);
  const inputPath = join(directory, 'private-input.html');
  const outputPath = join(directory, 'sanitized-output.html');
  const denylistPath = join(directory, 'private-denylist.txt');
  await writeFile(inputPath, source, 'utf8');
  await writeFile(denylistPath, `${denylistValues.join('\n')}\n`, 'utf8');
  return { directory, inputPath, outputPath, denylistPath };
}
```

**Rejection helper** (lines 101-111) — copy `expectRejected` verbatim (asserts input unchanged and output absent).

**Cleanup** (lines 113-118) — copy the `afterEach` with `vi.restoreAllMocks()` and directory removal.

**Idempotency test shape** (lines 121-133) — first sanitise, then re-sanitise the output bytes and expect byte-identical output and equal result:
```javascript
    const repeat = await createCase(bytes.toString());
    expect(await sanitizeFixture(repeat)).toEqual(first);
    expect(await readFile(repeat.outputPath)).toEqual(bytes);
```

**Self-validation test** (lines 135-142) — spy on `Element.prototype.outerHTML` to inject a residual and expect `output-contract-violated`; copy for rule mode.

**Custody tests** (lines 144-173, 300-345) — denylist inside worktree, aliasing, in-worktree input, in-place output, existing output not overwritten. Re-run a representative subset with `mode: 'rule-columns'` to prove the shared custody path.

**CLI tests** (lines 502-583) — copy the `execFileAsync(process.execPath, [sanitizerCli, ...], { cwd: fixture.directory })` pattern; assert exact `SANITIZE_FIXTURE_OK ${sha256(output)}\n` for the 8-argument form, and `SANITIZE_FIXTURE_REJECTED cli-arguments-invalid\n` for `--mode` with a wrong value, duplicated `--mode`, or 7 arguments.

**Grammar rejection table** (sanitized-output-contract.test.js lines 10-41) — copy the `test.each([[label, mutate, code], ...])` table for `validateRuleColumnOutput`: wrong-column vocabulary, residual text, kept `title` holding a raw value, `datetime` not synthetic, digit-bearing `data-test-id`, identity region containing `nav`/`table`, missing `PERSON-SELF`, oversize region.
```javascript
  ])('rejects %s with a stable code', (_label, mutate, code) => {
    expect(() => validateSanitizedOutput(mutate(validOutput()))).toThrow(SanitizedOutputError);
    expect(() => validateSanitizedOutput(mutate(validOutput()))).toThrow(expect.objectContaining({ code }));
  });
```

**v1 non-regression inside the same file** — one test that runs the default mode on a rule-shaped capture and still gets `TEXT-nnn` everywhere and no `title` (proves the default did not change, D-10).

---

### `test/recon/recon2-gate.smoke.js` (test, node:test) — NEW

**Analog:** `test/recon/recon-gate.smoke.js` (639 lines; lines 1-135, 277-340, 400-430 read).

**Imports and constants** (lines 1-50):
```javascript
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import * as reconGate from '../../scripts/verify-recon-gate.js';

const REPOSITORY_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const GATE_SCRIPT = join(REPOSITORY_ROOT, 'scripts', 'verify-recon-gate.js');
const REPOSITORY_LEDGER = join(REPOSITORY_ROOT, 'SELECTORS.md');
const REPOSITORY_MANIFEST = join(REPOSITORY_ROOT, 'test', 'fixtures', 'manifest.json');
```

**CLI runner** (lines 52-59) — copy `runGate(args, debug)` verbatim (strips `ZHROMA_RECON_DEBUG` unless set).

**Synthetic entry builder** (lines 95-117) — copy `completeEntry` / `withVerdict` as `recon2Entry({ id, status, extraFields })` / `withRecon2Verdict(...)`, switching the heading to `## Recon 2 Entry:` and the verdict to `## Recon 2 Verdict`:
```javascript
const completeEntry = ({ id = 'tracer-english-path', status = 'verified', scenario = 'synthetic-contract' } = {}) => `## Ledger Entry: ${id}

- id: \`${id}\`
- question: Can a complete synthetic entry traverse the evidence gate?
- scope: \`English path\`
- status: \`${status}\`
- probe: \`document.querySelector('[data-synthetic="ticket-list"]') !== null\`
- evidence: Sanitized synthetic markup contains the expected test-only ticket-list marker.
- interpretation: The repository-side evidence contract is testable without asserting a live Zendesk fact.
- fallback: Block the gate and collect a complete, sanitized entry.
- scenario: \`${scenario}\`
`;
```

**Value-free CLI assertions** (lines 63-84, 315-336) — `assert.equal(result.stderr, 'RECON_GATE_REJECTED <code>\n')` and `assert.doesNotMatch(result.stderr, /PRIVATE-.../)` for private values planted in ids/status.

**Phase 1 non-regression with a Recon 2 block present** (model on lines 277-299) — read the real `SELECTORS.md`, insert a synthetic Recon 2 block immediately before `## Spec-less Planning Assumptions`, and assert `verifyReconLedger(markdown, { mode: 'final', admittedScenarios })` still deep-equals `{ entryCount: 18, verdict: 'proceed' }`:
```javascript
  assert.deepEqual(verifyReconLedger(markdown, {
    mode: 'final',
    admittedScenarios: ADMITTED_SCENARIOS,
  }), {
    entryCount: 18,
    verdict: 'proceed',
  });
```

**Section mutation helper** (lines 402-409) — copy `mutateEntry(markdown, id, transform)` with the `## Recon 2 Entry: ` heading.

**Error-class assertion** (lines 86-93) — `assert.throws(fn, (error) => error instanceof reconGate.ReconGateError && error.code === '...')`.

---

### `test/recon/recon2-corpus.test.js` (test, vitest) — NEW (populated after admission)

**Analog:** `test/recon/corpus-provenance.test.js` (76 lines, read in full).

**Imports + manifest load** (lines 1-15):
```javascript
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { sanitizeFixture, sha256 } from '../../scripts/sanitize-fixture.js';

const fixtureRoot = join(process.cwd(), 'test', 'fixtures');
const manifest = JSON.parse(await readFile(join(fixtureRoot, 'manifest.json'), 'utf8'));
```

**Round-trip helper** (lines 17-27) — copy `roundTrip(bytes)` and pass `mode: 'rule-columns'`. The synthetic denylist must be a single non-matching token (line 24); for identity fixtures it also needs a `self:` directive that cannot match output (tokens preserved verbatim, per RESEARCH "Idempotency"):
```javascript
async function roundTrip(bytes) {
  const directory = await mkdtemp(join(tmpdir(), 'zhroma-parity-'));
  directories.push(directory);
  const inputPath = join(directory, 'input.html');
  const outputPath = join(directory, 'output.html');
  const denylistPath = join(directory, 'denylist.txt');
  await writeFile(inputPath, bytes);
  await writeFile(denylistPath, '__synthetic_parity_token_not_a_private_denylist__');
  const result = await sanitizeFixture({ inputPath, outputPath, denylistPath });
  return { ...result, output: await readFile(outputPath) };
}
```

**Per-entry loop** (lines 33-47) — iterate `manifest.recon2Fixtures ?? []` (not `manifest.fixtures`): grammar via `validateRuleColumnOutput`, `sha256(bytes) === entry.sha256`, `sanitizerMode === 'rule-columns'`, byte-identical round trip.

**Mutation test** (lines 69-76) — copy "a mutated stand-in fails exact parity and hash agreement" against the first `recon2Fixtures` entry.

**Pre-session guard:** before admission, `recon2Fixtures` is absent or `[]`; the file must pass with zero entries (a plain test asserting the v1 `manifest.fixtures` scenarios are still exactly `REQUIRED_SCENARIOS`, lines 29-31).

---

### `test/fixtures/manifest.json` (config) — MODIFY

**Analog:** existing entries (lines 3-51). Add a **top-level sibling** `"recon2Fixtures": [...]` beside `"fixtures"`; never append to `fixtures` (breaks `fixtureCount: 3` in `test/extension/*`, `corpus-provenance.test.js` lines 29-40, and `assertScenario`'s `scenario-unsupported`, `fixture-contract.js` lines 243-251).

Copy verbatim from existing entries:
```json
      "workspace": {
        "shell": "current Agent Workspace",
        "plan": "unknown/not shared"
      },
      "domBoundary": "nearest complete table container: immediate overflow wrapper and its ticket table",
```
Keep the 2-space JSON formatting. Checksums come from the sanitizer's `SANITIZE_FIXTURE_OK <sha256>` line. Entry keys proposed in RESEARCH Pattern 3 (`scenario`, `captureDate`, `workspace`, `appearance`, `boundaryKind`, `domBoundary`, `sanitizerMode`, `sanitizationMethod`, `file`, `sha256`).

---

### `test/fixtures/zendesk-recon2-*.html` (fixtures, generated) — NEW

Never hand-authored. Produced only by `node scripts/sanitize-fixture.js --input <private> --output test/fixtures/<name>.html --denylist <private> --mode rule-columns` from the main checkout (RESEARCH Pitfall 3). Shape reference for the two table fixtures: `test/fixtures/zendesk-view-priority-present.html` (wrapper > `table[data-garden-id="tables.table"][data-test-id="generic-table"]`, single trailing newline from `${root.outerHTML}\n`, `sanitize-fixture.js` line 206). The identity-region fixture has no analog.

---

### `SELECTORS.md` (ledger) — MODIFY

**Analog shapes (all in `SELECTORS.md`):**

- **Entry shape** — `## Ledger Entry: interaction-and-sticky-states` (lines 162-179): the nine D-13 fields (`id`, `question`, `scope`, `status`, `probe`, `evidence`, `interpretation`, `fallback`, `scenario`), each `- name: value`, code-wrapped enum values, followed by structured extra fields such as ``- selected-row-count: `1` ``. Recon 2 uses the heading `## Recon 2 Entry: <id>` instead.
- **Structured fields before the D-13 block** — `## Ledger Entry: root-chain` (lines 51-64) puts ``- root-terminus: `Document` `` above `- id:`; either position works because `parseFields` reads the whole section.
- **Handoff shape** — `## Authenticated Interaction Handoff` (lines 241-256): `state`, `post-action-state`, `capture-date`, `shell`, `plan-label`, `scenario`, `marker-selector`, `baseline`, `next-action-owner`, `next-action`, `user-confirmation`, `safety`. Recon 2 gets its **own** `## Recon 2 Session Handoff` with its own field names; the Phase 1 lines `- state: interaction-evidence-complete` and `- post-action-state: interactions-complete` must stay (asserted by `recon-gate.smoke.js` lines 273-274).
- **Verdict shape** — `## Final Verdict` (lines 293+): structured enum fields then `- verdict:` and `- rationale:`. `## Recon 2 Verdict` mirrors it with `recon2-verdict`, `blocked-consumers`, `rationale`.

**Placement (hard constraint):** insert the whole Recon 2 block after `## Execution Safety Note` (line 267) and **before** `## Spec-less Planning Assumptions` (line 276). Nothing may follow `## Final Verdict` (`verify-recon-gate.js` lines 373-378). Never use `## Ledger Entry:` or `## Recon Question:` for Recon 2 (lines 285-332, 334-365, 669-671).

**Probe text rule:** probes recorded in the Recon 2 block must avoid `https:` and `//` literals if the optional transcript-leak scan is added (`sensitive-patterns.js` `resource-url` rule).

---

### `.planning/phases/06-live-dom-recon-2/06-RUN-SHEET.md` (doc) — NEW

**Partial analog:** there is no Phase 1 run sheet (no tracked `01-*-RUN-SHEET.md`; `01-10-CHECKPOINT.md` is an attestation record, not a script). Build it from:
- The Phase 1 probe one-liners in `SELECTORS.md`: `root-chain` (line 60), `stable-identifiers` (line 72), `sticky-header-state` (line 156), `interaction-and-sticky-states` (line 168). `root-chain` and `stable-identifiers` use free variables `row` and `boundary`; the run sheet must give self-contained versions that define them first.
- RESEARCH Code Examples P0, P2, P3, P4/P5, P6 and the Pattern 4 step table (steps 0-8).
- The shared selectors: `table[data-garden-id="tables.table"][data-test-id="generic-table"]`, rows `tr[data-garden-id="tables.row"][data-test-id="generic-table-row"]`, header cells `[data-garden-id="tables.header_cell"]`, cells `[data-garden-id="tables.cell"]`, pane `[data-garden-id="pane"]`, Zhroma stamp `[data-zhroma-priority]` (count must be 0, D-15).
- The Phase 1 Execution Safety Note (`SELECTORS.md` lines 267-274) as the reason for Tab-only focus and user-only interaction.
- D-26: a step-0 check of the column picker for Tags.

No test reads this file.

---

## Shared Patterns

### Value-free error codes and CLI output
**Sources:** `scripts/sanitize-fixture.js` lines 21-31, 318-329; `scripts/verify-recon-gate.js` lines 236-243, 720-730; `scripts/fixture-contract.js` lines 38-43
**Apply to:** every new rejection path in all three modified scripts and `rule-column-contract.js`
```javascript
export class SanitizationError extends Error {
  constructor(code) {
    super('Fixture sanitization rejected');
    this.name = 'SanitizationError';
    this.code = code;
  }
}
...
    const code = (error instanceof ReconGateError || error?.name === 'FixtureContractError')
      && /^[a-z]+(?:-[a-z]+)*$/u.test(error.code ?? '')
      ? error.code
      : 'unexpected-error';
    process.stderr.write(`RECON_GATE_REJECTED ${code}\n`);
    if (process.env.ZHROMA_RECON_DEBUG === '1') { ... }
```
Fixed messages, kebab-case codes, no paths or values ever printed.

### Fail-closed sensitive scan before write and before parse
**Source:** `scripts/sensitive-patterns.js` lines 105-139 (`scanSensitiveContent(content, { denylist })`, NFC + `en-US` fold, substring match); used in `sanitize-fixture.js` lines 208-215 and `fixture-contract.js` lines 400-401 with `ADMISSION_DENYLIST` (lines 10-12)
**Apply to:** rule-mode `finalMarkup`, `validateRecon2Fixtures`, optional Recon 2 ledger-block scan
Note the substring semantics (RESEARCH Pitfall 4): short or token-like denylist entries (`TEXT`, `PERSON`, `DATE`) reject everything.

### Inert happy-dom parsing
**Source:** `scripts/sanitized-output-contract.js` lines 147-162; duplicated in `scripts/fixture-contract.js` lines 21-36 and `test/recon/sanitize-fixture.test.js` lines 27-42
**Apply to:** `rule-column-contract.js`, all new tests that parse output. Always run `assertSafeToParse` (lines 135-145) first.

### Copy, never mutate, v1 contract sets
**Source:** `scripts/sanitized-output-contract.js` lines 8-38, 90-119 (exported mutable `Set`s shared with the v1 validator and sanitiser)
**Apply to:** `rule-column-contract.js` — `new Set([...PRESERVED_ATTRIBUTES, ...])`, never `.add()` / `.delete()` on the imports.

### Namespaced additions beside v1 structures
**Sources:** `manifest.fixtures` iteration in `fixture-contract.js` line 354; `ENTRY_HEADING` in `verify-recon-gate.js` line 13; `parseVerdict` last-section rule lines 373-378
**Apply to:** `manifest.json` (`recon2Fixtures`), `SELECTORS.md` (`## Recon 2 Entry:` / `## Recon 2 Verdict` / `## Recon 2 Session Handoff`, before Spec-less Planning Assumptions), gate (`recon2` mode, separate exported function).

### Private-path custody
**Source:** `scripts/sanitize-fixture.js` lines 47-50 (`isWithin`), 69-83 (`findGitWorktreeRoot` from the module URL), 232-248
**Apply to:** rule mode reuses it unchanged; tests always create private files under `tmpdir()`; the live admission runs from the main checkout, not a GSD worktree.

### Temp-directory test hygiene
**Source:** `test/recon/sanitize-fixture.test.js` lines 76-87, 113-118; `test/recon/corpus-provenance.test.js` lines 12-15; `test/recon/recon-gate.smoke.js` line 63-65 (`t.after(() => rm(...))`)
**Apply to:** all three new test files.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `test/fixtures/zendesk-recon2-identity-region.html` | fixture | — | First non-table boundary kind; produced by the sanitiser under the new identity-region check (RESEARCH Pattern 1) |
| `.planning/phases/06-live-dom-recon-2/06-RUN-SHEET.md` | doc | — | Phase 1 never recorded a reusable run sheet or projection snippet (RESEARCH Pitfall 2); use RESEARCH Code Examples P0-P6 and Pattern 4 |
| In-page projection snippet (inside the run sheet) | doc snippet | — | Phase 1's "one-way in-page structural projection" was never recorded; design per RESEARCH Pitfall 2 (detached clone, strip resource attributes, `copy()`, return only a count) |

## Metadata

**Analog search scope:** `scripts/`, `test/recon/`, `test/fixtures/`, `SELECTORS.md`, `.planning/phases/01-dom-recon-spike/` (tracked files only, verified with `git ls-files`)
**Files scanned:** 14 read (sanitize-fixture.js, sanitized-output-contract.js, verify-recon-gate.js, fixture-contract.js, sensitive-patterns.js excerpt, interaction-evidence.js excerpt, corpus-provenance.test.js, sanitize-fixture.test.js excerpts, sanitized-output-contract.test.js, recon-gate.smoke.js excerpts, fixture-contract.test.js excerpt, manifest.json, SELECTORS.md excerpts, vitest.config.js / package.json scripts)
**Pattern extraction date:** 2026-09-25
