# Phase 02: First Tint on a Real View - Pattern Map

**Mapped:** 2026-09-08
**Files analyzed:** 8 proposed new/modified files
**Analogs found:** 6 / 8 (including existing files as their own modification pattern)

## File Classification

Paths follow the research proposal; implementation names remain discretionary. Existing recon code and admitted fixture files are read-only reference assets, not proposed modifications.

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `extension/manifest.json` (new) | config | event-driven | None: first MV3 manifest | none |
| `extension/content.js` (new) | controller | event-driven, transform | `scripts/sanitized-output-contract.js` | partial: DOM resolver only |
| `extension/zhroma.css` (new) | component | transform | None: first product stylesheet | none |
| `test/extension/initial-tint.test.js` (new) | test | event-driven, transform | `test/recon/fixture-contract.test.js` | role-match |
| `test/extension/runtime-contract.test.js` (new) | test | file-I/O, batch | `test/recon/recon-gate.smoke.js` | role-match |
| `package.json` (modify) | config | batch | `package.json` | exact: extend existing scripts |
| `vitest.config.js` (modify) | config | batch | `vitest.config.js` | exact: extend discovery |
| `.planning/ROADMAP.md` (modify acceptance wording) | config (planning contract) | transform | `.planning/ROADMAP.md` | exact: preserve Phase 2 structure |

## Pattern Assignments

### `extension/content.js` (controller, event-driven / transform)

**Analog:** `scripts/sanitized-output-contract.js`, specifically `resolveBoundedDocument`. This is a structural reference, not a module to import into the extension.

**Same-table ownership** (lines 207–208):

```javascript
const ownedRows = [...table.querySelectorAll('tr, [role="row"]')]
  .filter((row) => row.closest('table, [role="table"]') === table);
```

**Header index from all direct cells** (lines 228–237):

```javascript
const headerCells = [...headerRows[0].children];
if (headerCells.some((cell) => !cell.matches('th, [role="columnheader"]'))) {
  reject('row-children-must-be-cells');
}
const priorityIndexes = headerCells
  .map((cell, index) => (cell.textContent.trim() === PRIORITY_HEADER_LABEL ? index : -1))
  .filter((index) => index >= 0);
if (headerCells.length === 0 || priorityIndexes.length > 1) {
  reject('table-boundary-required');
}
```

**Row shape before selecting the cell** (lines 240–252):

```javascript
const priorityCells = new Set();
for (const row of ticketRows) {
  const cells = [...row.children];
  if (cells.some((cell) => !cell.matches('td, [role="cell"]'))) {
    reject('row-children-must-be-cells');
  }
  if (cells.length !== headerCells.length) {
    reject('table-boundary-required');
  }
  if (priorityIndexes.length === 1) {
    priorityCells.add(cells[priorityIndexes[0]]);
  }
}
```

**Required adaptation:** retain ownership, direct-cell indexing and preflight; replace the sanitizer's broad role/test-id alternatives with the admitted paired Garden/test-id selectors. Its lines 175–205 enforce a bounded sanitized fragment, not the live document shell. Its line 214 accepts legacy synthetic selectors; do not ship those alternatives. Production checks `html[lang="en"]` and exact trimmed labels, admits blank cells without a marker, and refuses the whole candidate table for an unknown non-empty value or malformed structure. Never use the manifest's recorded index as runtime input.

The analog imports `Window` from `happy-dom` and exports ESM helpers (lines 1–3); those are tooling conventions only. The product uses the research's classic IIFE with no imports or Node dependencies. Collect all proposed row markers before applying any; add synchronous final ownership/connectivity checks and rollback of this attempt's markers on unexpected writes. Finite startup observation, timer disposal and marker mutation have no existing implementation analog.

### `test/extension/initial-tint.test.js` (test, event-driven / transform)

**Analog:** `test/recon/fixture-contract.test.js`.

**Import layout and independent expected labels** (lines 14–20, 28):

```javascript
import { afterEach, describe, expect, test, vi } from 'vitest';
import { DOMParser } from 'happy-dom';

import {
  REQUIRED_SCENARIOS,
  validateFixtureManifest,
} from '../../scripts/fixture-contract.js';
```

```javascript
const EXPECTED_PRIORITIES = Object.freeze(['Urgent', 'High', 'Normal', 'Low']);
```

Use explicit expected per-row labels rather than importing expectations from the product. Execute the manifest-declared content script bytes in an isolated test context as proposed by RESEARCH; the existing tests do not yet provide that VM harness.

**Admitted corpus gate** (lines 462–471):

```javascript
const selectedManifest = process.env.GSD_FIXTURE_MANIFEST
  ?? resolve('test/fixtures/manifest.json');

test('the selected admitted corpus satisfies the complete non-vacuous contract', async () => {
  await access(resolve(selectedManifest));
  const result = await validateFixtureManifest(selectedManifest, {
    requireCompleteScenarioMatrix: true,
  });
  expect(result.fixtureCount).toBe(3);
});
```

Call the existing admission validator for original corpus bytes before deriving product cases. The fixture manifest describes sanitized fragments; construct the supported English test document shell explicitly. Modify copies in memory for reordered headers, blanks, unknown last rows, duplicate headers, spans, missing cells and decoy tables. Label variants synthetic and leave committed fixtures/hashes unchanged. Test actual marker effects and absence of partial writes; admission tests alone do not exercise the extension.

**Cleanup style** (lines 157–162):

```javascript
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(temporaryDirectories.splice(0).map((directory) => (
    rm(directory, { recursive: true, force: true })
  )));
});
```

Adapt cleanup to restore fake timers, close each happy-dom window and dispose startup observers. Existing temporary-directory helpers at lines 137–154 illustrate isolation if disk copies are needed, but product edge cases can stay in memory. Add at least one real MutationObserver integration; fake timer advancement is not proof that browser mutation delivery was exercised.

### `test/extension/runtime-contract.test.js` (test, file-I/O / batch)

**Analog:** `test/recon/recon-gate.smoke.js`, with Vitest imports/assertions from the preceding assignment because the proposed new file is `.test.js`.

**Resolve actual repository paths** (lines 41–43):

```javascript
const REPOSITORY_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const GATE_SCRIPT = join(REPOSITORY_ROOT, 'scripts', 'verify-recon-gate.js');
const REPOSITORY_LEDGER = join(REPOSITORY_ROOT, 'SELECTORS.md');
```

Adapt these paths to the unpacked extension root. Read its actual manifest and follow its declared local assets. Assert exact grants/matches, contained references, classic-script parsing and stylesheet-only product palette; inspect all loaded runtime source rather than a transformed test duplicate.

**CLI invocation and diagnostic contract** (lines 52–59 and 72–76):

```javascript
function runGate(args, debug) {
  const env = { ...process.env };
  delete env.ZHROMA_RECON_DEBUG;
  if (debug !== undefined) env.ZHROMA_RECON_DEBUG = debug;
  return spawnSync(process.execPath, [GATE_SCRIPT, ...args], {
    cwd: REPOSITORY_ROOT, encoding: 'utf8', env,
  });
}
```

```javascript
const result = runGate(['evidence', ledgerPath]);
assert.equal(result.status, 1);
assert.equal(result.stdout, '');
assert.equal(result.stderr, `RECON_GATE_REJECTED ${code}\n`);
assert.doesNotMatch(result.stderr, /PRIVATE-STATUS-VALUE|private-person-id/);
```

Preserve this existing recon CLI contract in the full suite. If invoking a check from a new test, assert its status and output rather than treating successful process creation as a pass. No new product CLI is required. Do not copy debug output into browser runtime behavior; runtime failures should remain quiet and must not log DOM text.

### `package.json` and `vitest.config.js` (config, batch)

**Analogs:** the existing files themselves.

`package.json` lines 9–16:

```json
"scripts": {
  "test": "npm run test:recon",
  "test:recon": "node --test test/recon/*.smoke.js && node node_modules/vitest/vitest.mjs run --config vitest.config.js"
},
"devDependencies": {
  "happy-dom": "20.13.1",
  "vitest": "4.1.11"
}
```

`vitest.config.js` lines 1–8:

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['test/recon/*.test.js'],
  },
});
```

Extend discovery to `test/extension/*.test.js` and ensure `npm test` runs both recon and product coverage. Preserve Node's `.smoke.js` runner and its nonzero exit propagation. A CLI filter cannot include files excluded by Vitest configuration. Keep exact dependency versions and the no-build runtime boundary; no lockfile or dependency change is implied.

### `.planning/ROADMAP.md` (planning contract, transform)

**Analog:** its Phase 2 section, lines 93–109. Preserve requirement IDs, five numbered criteria, MVP mode and accepted sorting gap.

**Existing acceptance wording** (line 104):

```markdown
  4. Changing a tint colour is an edit to the stylesheet alone — no JavaScript file in the repo contains a colour value.
```

Apply RESEARCH's explicit scope reconciliation to shipped extension JavaScript and product palette/CSS writes. Retain historical recon color evidence. This is a proposed planner edit, not a claim that the literal repository-wide criterion passes.

### `extension/manifest.json` and `extension/zhroma.css`

No existing product analog. Use RESEARCH's manifest skeleton and direct-cell CSS example subject to the locked CONTEXT decisions. The manifest contract is MV3, only `storage`, no `host_permissions`, and only `https://*.zendesk.com/agent/*`. CSS reads one namespaced row attribute and paints only direct ticket cells. Native row fill, first-cell selection inset, typography and interaction remain host-owned. Exact final shades require the live visual checkpoint; no fixture/parser analogy proves compositing.

## Shared Patterns

### Fixture admission precedes parsing

**Source:** `scripts/fixture-contract.js`, lines 395–403. **Apply to:** product tests consuming the admitted corpus, through the existing validator.

```javascript
const actualHash = createHash('sha256').update(bytes).digest('hex');
if (actualHash !== entry.sha256) {
  throw contractError('fixture-checksum-mismatch');
}

const markup = bytes.toString('utf8');
scanSensitiveContent(markup, { denylist: ADMISSION_DENYLIST });
try {
  validateSanitizedOutput(markup);
```

Do not copy this file-I/O pipeline into the extension. Its detached parser settings at lines 21–35 disable script/CSS/image loading and navigation; use the same inert resource policy in test windows and execute only trusted repository script bytes deliberately.

### Value-free errors and exact allowlists

**Source:** `scripts/sanitized-output-contract.js`, lines 123–129. **Apply to:** test-visible validation failures; runtime may instead return an internal no-tint result.

```javascript
export class SanitizedOutputError extends Error {
  constructor(code) {
    super('Sanitized output rejected');
    this.name = 'SanitizedOutputError';
    this.code = code;
  }
}
```

Keep raw cell text out of diagnostics. Exact priority labels appear at line 3 and header label at line 121; copy their literal meaning without importing the sanitizer or its ARIA normalization into runtime label matching. Authentication, database access and network response wrappers have no role in this phase.

## No Analog Found

| File / responsibility | Role | Data Flow | Reason |
|---|---|---|---|
| `extension/manifest.json` | config | event-driven | No tracked extension manifest exists. |
| `extension/zhroma.css` | component | transform | No tracked product stylesheet exists. |
| Finite startup/atomic marker commit within `extension/content.js` | controller | event-driven | Existing resolver is synchronous admission tooling; no startup or paint controller exists. |
| Exact classic-script VM harness within product tests | test | event-driven | Existing tests execute ESM recon helpers and CLI processes; use RESEARCH's harness recommendation. |

## Metadata

**Analog search scope:** tracked `scripts/`, `test/recon/`, root test configuration and Phase 2 acceptance section. Four substantive recon analogs were selected; existing configuration and roadmap files supply in-place edit patterns.

**Files scanned for excerpts:** 6 source/test/config files plus the roadmap section. Analog paths were confirmed with `git ls-files -- <path>` from the repository root. No ignored install/runtime mirror is a pattern source.

**Project instructions:** no root `AGENTS.md` or `.agents/skills` / `.codex/skills` directory was found. The tracked `.claude/CLAUDE.md` project/workflow sections were consulted; current Phase 2 decisions supersede its older generated stack sketches. This mapping is part of the delegated GSD planning workflow.

**Pattern extraction date:** 2026-09-08. No source edits, installs, test execution, live interaction, commits or acceptance-status changes were performed by this mapping.
