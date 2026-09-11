# Phase 05: Published — Pattern Map

**Mapped:** 2026-09-11  
**Files analyzed:** 17 proposed file/artifact groups  
**Analogs found:** 10 / 17; five primary tracked source analogs

Names below are planning proposals, not existing interfaces or mandatory filenames. CONTEXT D-01–D-15 governs scope; RESEARCH recommends responsibility groups rather than exact paths. Generated packages remain outside `extension/`. No production build or dependency additions.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/package-release.js` (new) | utility | file-I/O, batch | `scripts/verify-recon-gate.js` | role-match; archive logic new |
| `scripts/release-source.js` (new) | utility | file-I/O, transform | `test/extension/phase-04-live-acceptance.test.js` | flow-match |
| `scripts/verify-release.js` (new) | utility | file-I/O, batch | `scripts/verify-recon-gate.js` | exact |
| `test/extension/release-package.test.js` (new) | test | file-I/O | `test/extension/runtime-contract.test.js` | exact |
| `test/extension/phase-05-release-smoke.test.js` (new) | test | file-I/O, transform | `test/extension/phase-04-live-acceptance.test.js` | exact |
| `test/extension/phase-04-live-acceptance.test.js` (modify) | test | file-I/O, transform | same file, `priorSourceFacts` | exact |
| `test/extension/runtime-contract.test.js` (modify) | test | file-I/O | same file | exact |
| `package.json` (modify) | config | batch | same file | exact |
| `extension/manifest.json` (modify) | config | event-driven | same file | exact |
| `extension/icons/` brand PNG additions; status PNGs only if necessary | component | file-I/O | `test/extension/runtime-contract.test.js` | partial: validation contract only |
| `release/listing.md` (new) | model | transform | none | none |
| `release/disclosures.md` (new) | model | transform | none | none |
| `release/reviewer-instructions.md` (new) | model | transform | none | none |
| `release/assets/` sanitized screenshots, popup image, promotional tile and provenance record | component | file-I/O, transform | none | none |
| `release/privacy/index.html`, `.nojekyll` (staging for separate public repository) | component/config | request-response | none | none |
| `05-RELEASE-CHECKLIST.md` (new, phase directory) | model | event-driven | none | none |
| `release-runs/<run-id>.json` (new, phase directory) | model | file-I/O | none | none; validator schema guidance below |

Generated ZIPs/extracted directories are outputs of the package utility, not source files. The separate policy repository is a later execution destination; a proposed name or address is not evidence of publication. `popup.html` and `zhroma.css` are capture/palette inputs, not planned feature edits. Existing predecessor evidence records retain their observations and hashes.

## Pattern Assignments

### Release packaging and validation utilities

**Analog:** `scripts/verify-recon-gate.js`.

Copy Node ESM and module-relative root conventions (lines 1–11):

```js
import { accessSync, realpathSync, statSync, readFileSync } from 'node:fs';
import { relative, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
```

Copy the import-safe CLI entry point (lines 733–735):

```js
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
```

Lines 721–730 give the error boundary: allowlisted machine-readable error code, `process.stderr.write`, optional developer debug output, and `process.exitCode = 1`. Use a release-specific rejection prefix; never turn failure into a successful report. These are developer tools; do not copy filesystem/logging behavior into extension runtime.

**New work with no complete analog:** invoke installed ZIP tooling with argument arrays, explicit relative-name allowlist and manifest at archive root; reject traversal, symlinks, nonregular entries and unexpected assets; extract to a fresh temporary directory and compare exact names, lengths and hashes. Do not simply copy the existing `statSync` walker, which follows symlinks. Keep archive SHA-256 separate from source-tree identity.

### Source identity helper and historical evidence continuity

**Analog:** `test/extension/phase-04-live-acceptance.test.js`, lines 60–71:

```js
const walk = (dir, base = '') => readdirSync(dir).flatMap((name) => {
  const path = `${dir}/${name}`;
  return statSync(path).isDirectory() ? walk(path, `${base}${name}/`) : [`${base}${name}`];
});
const extensionDir = fileURLToPath(new URL('extension', root));
// The complete packaged inventory, recursively. A new directory cannot hide a
// file from this and an extra file cannot hide inside one.
const SHIPPED = Object.fromEntries(walk(extensionDir).sort().map((name) => [name,
  createHash('sha256').update(readFileSync(`${extensionDir}/${name}`)).digest('hex')]));
const SHIPPED_NAMES = Object.keys(SHIPPED);
const SHIPPED_DIGEST = createHash('sha256').update(SHIPPED_NAMES
  .map((name) => `${SHIPPED[name]}  extension/${name}\n`).join('')).digest('hex');
```

Preserve deterministic ordering and complete inventory; add regular-file checks. If extracting a helper, keep it developer-only and test rejection of extra nested files, altered bytes and symlinks.

The same analog's `priorSourceFacts` (lines 143–171) already verifies recorded observations against Git blobs and derives actual prior counts. Reuse that approach for Phase 4 historical validation; first pin the observation revision and verify the full original inventory. Do not replace old record hashes with new manifest/icon hashes. Lines 643–651 currently demand current working-tree equality and eleven files: this coupling needs deliberate adaptation, not deletion or test exclusion.

### Phase 5 smoke validator and run records

**Analog:** `test/extension/phase-04-live-acceptance.test.js`, parser lines 130–140:

```js
export function parsePhase04Acceptance(markdown) {
  const records = [...markdown.matchAll(/^```json\r?\n([\s\S]*?)\r?\n```\s*$/gm)];
  requireEvidence(records.length === 1, 'single-record-required');
  requireUniqueJsonMembers(records[0][1]);
  let record;
  try { record = JSON.parse(records[0][1]); }
  catch { throw new Error('PHASE04_ACCEPTANCE_REJECTED invalid-json'); }
  requireEvidence(isObject(record), 'object-required');
  return record;
}
```

For standalone JSON retain duplicate-member rejection and object/schema validation, without requiring Markdown fences. Use stable check IDs and actual `pass`/`fail`/`pending` observations. The analog tests at lines 626–635 explicitly preserve failure as `gaps_found` and unavailable scenarios as pending; lines 637–641 reject duplicate keys and multiple records. Copy those adversarial test shapes, changing expected evidence to release-specific identity and checks.

Run-record fields are new design: immutable run ID/time, full candidate asset hashes/lengths, ZIP hash, extracted-candidate load confirmation, observed browser/environment, per-check evidence, predecessor limitations, and submission authorization reference when it exists. A prepared record must remain pending. Do not seed it with the Phase 4 passes. Marketing replacements never establish runtime acceptance.

### Runtime-contract tests, package scripts and brand assets

**Analog:** `test/extension/runtime-contract.test.js`, imports lines 1–8 use Vitest, Node built-ins and relative developer helpers. Its recursive inventory at lines 15–23 is the test pattern:

```js
function shippedInventory(directory = root, prefix = '') {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => (entry.isDirectory()
      ? shippedInventory(new URL(`${entry.name}/`, directory), `${prefix}${entry.name}/`)
      : [`${prefix}${entry.name}`]))
    .sort();
}
```

Extend the explicit inventory for approved brand assets. Existing 32px status-art assertions must remain distinct from new store icon sizes. Preserve PNG integrity, exact worker icon references, permission inventory and prohibited-channel tests. Use temporary malformed packages to prove rejection rather than only asserting the happy path.

**Analog:** `package.json`, lines 9–16:

```json
"scripts": {
  "test": "npm run test:recon",
  "test:recon": "node --test test/recon/*.smoke.js && node node_modules/vitest/vitest.mjs run --config vitest.config.js",
  "test:mutants": "node scripts/verify-mutation-kills.js"
},
"devDependencies": {
  "happy-dom": "20.13.1",
  "vitest": "4.1.11"
}
```

Add direct Node release commands; retain existing default tests and pinned dependencies. No build tool is needed.

### Manifest metadata

**Analog:** `extension/manifest.json`, lines 5–16:

```json
"minimum_chrome_version": "106",
"permissions": ["storage"],
"action": {
  "default_popup": "popup.html",
  "default_icon": { "32": "icons/neutral.png" }
},
"icons": { "32": "icons/neutral.png" },
"background": {
  "service_worker": "background.js"
},
"content_scripts": [{
  "matches": ["https://*.zendesk.com/agent/*"],
```

Apply approved title/description and researched brand icon sizes while preserving permission/match/worker boundaries and meaningful toolbar states. The fragment illustrates the existing contract, not a complete JSON document. Any changed shipped byte requires the new candidate identity and appropriate revalidation.

## Shared Patterns

- **Authentication:** no new application auth. Account login, verification and final submission are user-owned checkpoints; Node helper conventions do not confer publication authority.
- **Evidence honesty:** separate automated validation, genuine smoke, predecessor acceptance, user authorization, store review and public availability. Phase 3 stays eleven passes/nine skipped; Phase 4 stays fourteen passes/three pending, including its explicitly deferred locale check.
- **Validation/errors:** explicit inventories, finite error codes, duplicate-key rejection, source-derived facts and failing exit status. Never accept changed source by editing recorded evidence.
- **Imports/runtime:** Node ESM only for development scripts/tests; extension remains directly packaged local source with no new network calls or dependencies.

## No Analog Found

The seven unmatched groups in the classification table have no close tracked implementation. Listing, disclosures and reviewer instructions should derive from locked wording and RESEARCH; privacy HTML/`.nojekyll` is a minimal static page, not a new website application. Screenshots require genuine layout/tinting and complete sanitization review; no existing fixture sanitizer is a sufficient image-privacy control. The release checklist and run schema are new artifacts guided by the validator patterns above. Archive construction and new artwork also require original implementation despite partial matches.

## Metadata

**Search scope:** tracked `scripts/`, `test/extension/`, `extension/`, package configuration and Phase 4 acceptance structure. Five primary source analogs were inspected, with focused reads of the acceptance validator/CLI and supporting record. Every source analog was confirmed by `git ls-files -- <path>`; no runtime mirrors are named. No root `AGENTS.md` or project skill directories were found. Current source overrides stale generated stack descriptions. Only this pattern map was written; no runtime edits, tests or publication actions were performed.
