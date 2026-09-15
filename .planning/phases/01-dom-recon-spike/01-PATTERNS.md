# Phase 1: DOM Recon Spike - Pattern Map

**Mapped:** 2026-09-02
**Files analyzed:** 11 new files
**Code analogs found:** 0 / 11
**Tracked design references found:** 11 / 11

## Greenfield Boundary

This repository has no application source, test harness, package manifest, fixture corpus, or utility scripts yet. `git ls-files` contains only planning material and `.claude/CLAUDE.md`. Consequently, none of the Phase 1 deliverables has a genuine implementation analog in the current tree.

The assignments below deliberately distinguish:

- **code analog:** an existing tracked implementation file with the same role and data flow;
- **tracked design reference:** a tracked planning/research file that supplies a concrete contract or code template;
- **no analog:** a greenfield file for which the planner must implement from the research contract rather than claim that an established repository convention exists.

Do not use `.planning/research/.cache/` as an analog source. It is research runtime output, not the project's implementation pattern.

## File Classification

| New File | Basis | Role | Data Flow | Closest Tracked Reference | Match Quality |
|----------|-------|------|-----------|---------------------------|---------------|
| `SELECTORS.md` | explicit | config | event-driven | `.planning/research/ARCHITECTURE.md:716` | design-reference only |
| `package.json` | explicit | config | batch | `.planning/phases/01-dom-recon-spike/01-RESEARCH.md:100` | spec-only |
| `package-lock.json` | implied by exact-version installation | config | batch | `.planning/phases/01-dom-recon-spike/01-RESEARCH.md:396` | spec-only |
| `vitest.config.js` | explicit | config | batch | `.planning/phases/01-dom-recon-spike/01-RESEARCH.md:82` | spec-only |
| `scripts/sanitize-fixture.js` | implied by one-way deterministic sanitization | utility | file-I/O / transform | `.planning/phases/01-dom-recon-spike/01-RESEARCH.md:258` | design-reference only |
| `test/recon/sensitive-patterns.js` | explicit | utility | transform | `.planning/phases/01-dom-recon-spike/01-RESEARCH.md:260` | design-reference only |
| `test/fixtures/zendesk-view-priority-present.html` | explicit | test | file-I/O | `.planning/research/STACK.md:358` | design-reference only |
| `test/fixtures/zendesk-view-priority-absent.html` | explicit | test | file-I/O | `.planning/phases/01-dom-recon-spike/01-CONTEXT.md:27` | design-reference only |
| `test/fixtures/zendesk-view-grouped-long.html` | explicit | test | file-I/O | `.planning/phases/01-dom-recon-spike/01-CONTEXT.md:27` | design-reference only |
| `test/fixtures/manifest.json` | explicit | model | file-I/O | `.planning/phases/01-dom-recon-spike/01-CONTEXT.md:32` | design-reference only |
| `test/recon/fixture-contract.test.js` | explicit | test | file-I/O | `.planning/phases/01-dom-recon-spike/01-RESEARCH.md:277` | research code template |

`scripts/sanitize-fixture.js` is the one implied filename not present in the recommended tree. The capability itself is mandatory: research requires sanitization from a private input into a new output, and forbids in-place mutation of the raw capture. The planner may choose a different exact script path, but must retain that one-way file boundary.

Conditional screenshots are not planned files. Add cropped, sanitized screenshots only when textual output or sanitized markup cannot establish a visual fact; do not create a screenshot inventory pre-emptively.

## Pattern Assignments

### `SELECTORS.md` (config, event-driven)

**Code analog:** None.

**Tracked reference:** `.planning/research/ARCHITECTURE.md:716-760` and `.planning/phases/01-dom-recon-spike/01-CONTEXT.md:35-38`.

**Ledger-entry contract** (`01-CONTEXT.md`, lines 35-38):

```markdown
- question
- status: verified | disproved | outside English-only scope
- exact DevTools probe
- sanitized result or markup excerpt
- interpretation
- fallback
- capture scenario
```

Every English-path entry must end in a terminal status. The document itself must end with an explicit `proceed` or `block` verdict. Textual probe output or sanitized markup is primary evidence; a screenshot is an exception for facts such as painting element, sticky-header geometry, hover, or selection.

**Question-inventory seed** (`.planning/research/ARCHITECTURE.md`, lines 751-760):

```text
data-garden-id on current rows
body-table own thead vs sibling header table
machine-readable priority signal
virtualization at scroll top vs bottom
priority cell representation
documentElement.lang meaning
painting element and CSS precedence
iframe placement
agent-domain coverage
```

The architecture ledger is a checklist seed, not pre-verified live evidence. Preserve the narrower current decisions: Phase 1 is English-only, and localization-only entries are `outside English-only scope`.

**Gate handling:** A closed Shadow DOM entry produces `block`. Missing `data-garden-id` is recoverable only if `data-test-id`, then a structural fallback, succeeds across the complete three-scenario matrix.

---

### `test/fixtures/zendesk-view-priority-present.html` (test, file-I/O)

**Code analog:** None.

**Tracked reference:** `.planning/phases/01-dom-recon-spike/01-CONTEXT.md:28-32` and `.planning/research/STACK.md:358-367`.

**Capture pattern:** Copy the nearest complete real table container, not the full page and not a hand-authored toy table. Preserve wrapper, duplicate/sticky header table, body table, accessibility attributes, immediate state-bearing ancestors, node order, and selector-relevant attributes.

**Required content:** Include deterministic placeholder row data and at least one row for each English priority value: `Urgent`, `High`, `Normal`, and `Low`.

**Admission pattern:** Only the final sanitized output enters this path. A raw capture must never exist anywhere inside the repository, even ignored.

---

### `test/fixtures/zendesk-view-priority-absent.html` (test, file-I/O)

**Code analog:** None.

**Tracked reference:** `.planning/phases/01-dom-recon-spike/01-CONTEXT.md:23-32`.

Use the same bounded-capture, topology-preserving, deterministic-sanitization pattern as the canonical fixture, but retain faithful evidence that the view has no Priority column. The contract test must distinguish genuine column absence from failure to locate the table/header structure.

---

### `test/fixtures/zendesk-view-grouped-long.html` (test, file-I/O)

**Code analog:** None.

**Tracked reference:** `.planning/phases/01-dom-recon-spike/01-CONTEXT.md:23-32`.

Use the same admission pattern as the canonical fixture. Preserve group-row structure, duplicate/sticky header relationships, the scrolling container, and the structural evidence needed to describe whether rows are added, removed, or recycled during scrolling. Do not normalize the capture into the canonical fixture's shape.

---

### `test/fixtures/manifest.json` (model, file-I/O)

**Code analog:** None.

**Tracked reference:** `.planning/phases/01-dom-recon-spike/01-CONTEXT.md:32` and `.planning/phases/01-dom-recon-spike/01-RESEARCH.md:281-291`.

Each fixture entry must carry:

```text
scenario
capture date
non-identifying Agent Workspace metadata
DOM boundary
sanitization method
sanitized fixture filename
SHA-256 of the final sanitized bytes
selectors.ticketTable
selectors.headerRow
```

Do not record tenant identity, the raw-capture location, capture-specific denylist values, ticket/account identifiers, or sensitive URLs. Use relative fixture filenames so `new URL(..., import.meta.url)` remains stable.

---

### `scripts/sanitize-fixture.js` (utility, file-I/O / transform)

**Code analog:** None.

**Tracked reference:** `.planning/phases/01-dom-recon-spike/01-RESEARCH.md:258-269`.

**Core one-way transform pattern** (lines 260-269):

```text
private raw input
  -> preserve topology and allowlisted structural attributes
  -> deterministically replace non-priority row text
  -> preserve only Urgent / High / Normal / Low priority labels
  -> remove or rewrite IDs, URLs, handlers, embedded state, and PII
  -> reject active/resource-bearing markup and suspicious values
  -> write a new sanitized output
  -> scan before Git admission
  -> hash only the final sanitized bytes
```

**Validation/error pattern:** Fail closed when the ephemeral capture-specific denylist is absent, when an unknown attribute/value is not explicitly safe, or when any forbidden pattern survives. Never print or persist the private input path, tenant metadata, or denylist contents. Never rewrite the raw input in place.

**Imports:** There is no repository import convention yet. Use Node built-ins only for this script; do not add a runtime package or an HTML regex parser merely to establish a house pattern.

---

### `test/recon/sensitive-patterns.js` (utility, transform)

**Code analog:** None.

**Tracked reference:** `.planning/phases/01-dom-recon-spike/01-RESEARCH.md:260-269`.

Keep the reusable, deterministic admission rules in this module so the sanitizer and contract test apply the same policy. Cover at least:

- scripts, iframes, inline event handlers, and resource-bearing attributes;
- remote URLs and tenant hostnames;
- email addresses, account/ticket identifiers, long numeric identifiers, opaque/high-entropy values, and embedded state;
- captured names, organizations, and subjects via a mandatory private denylist;
- non-allowlisted attributes and forbidden residual text.

**Error handling:** Return structured findings or throw a stable validation error; never silently drop a finding. Tests should assert that any finding fails fixture admission. The scanner is a gate, not a best-effort linter.

---

### `test/recon/fixture-contract.test.js` (test, file-I/O)

**Code analog:** None.

**Tracked code template:** `.planning/phases/01-dom-recon-spike/01-RESEARCH.md:277-293`.

**Imports and core pattern** (lines 277-293):

```javascript
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

describe('sanitized Zendesk fixtures', () => {
  test.each(manifest.fixtures)('$scenario is loadable and authentic', async (entry) => {
    const bytes = await readFile(new URL(`../fixtures/${entry.file}`, import.meta.url));
    expect(sha256(bytes)).toBe(entry.sha256);

    const parsed = new DOMParser().parseFromString(bytes.toString('utf8'), 'text/html');
    const table = parsed.querySelector(entry.selectors.ticketTable);
    expect(table).not.toBeNull();
    expect(table.querySelector(entry.selectors.headerRow)).not.toBeNull();
  });
});
```

The research excerpt omits the `manifest` loading statement; the planner must add it explicitly and keep it compatible with the selected ESM/JSON approach.

**Validation extensions:** For every manifest entry, also run the shared sensitive-data scan and assert that the declared scenario contract holds. The canonical fixture must expose all four priority labels; the absent fixture must locate the table/header while proving the Priority column is absent; the grouped/long fixture must expose group-row and duplicate/sticky-header evidence.

**Safety pattern:** Parse into a separate, query-only document. Never append captured nodes to an active document. Reject resource-bearing markup before parsing, because inert parsing does not by itself prove that external resources cannot be referenced.

---

### `vitest.config.js` (config, batch)

**Code analog:** None.

**Tracked reference:** `.planning/phases/01-dom-recon-spike/01-RESEARCH.md:82-90` and `.planning/research/STACK.md:347-367`.

Configure the recon suite to provide Happy DOM so the research template's global `DOMParser` is defined. Keep configuration minimal and ESM-compatible. This test proves offline structural queryability, checksum integrity, scenario invariants, and sanitation; it does not prove that selectors still match the current live Zendesk DOM.

---

### `package.json` (config, batch)

**Code analog:** None.

**Tracked reference:** `.planning/phases/01-dom-recon-spike/01-RESEARCH.md:76-103`.

Use Node development tooling only; Phase 1 introduces no extension runtime dependencies. Pin the human-approved exact versions of `vitest` and `happy-dom` and expose the smallest script surface needed to run the recon contract/admission tests. Preserve ESM compatibility with the research template.

**Mandatory checkpoint:** The researched `vitest@4.1.11` and `happy-dom@20.13.1` releases are marked `SUS` for recency. The plan must insert `checkpoint:human-verify` before installing either package. Do not silently substitute or install them during scaffolding.

---

### `package-lock.json` (config, batch)

**Code analog:** None.

**Tracked reference:** `.planning/phases/01-dom-recon-spike/01-RESEARCH.md:390-396`.

Generate this file only after the package-legitimacy checkpoint approves exact versions. Commit the generated lockfile; do not hand-edit it and do not claim a selected version is approved before the checkpoint.

## Shared Patterns

### Authentication and Authenticated Actions

**Source:** `.planning/phases/01-dom-recon-spike/01-CONTEXT.md:17-26`  
**Apply to:** live probes, captures, scenario setup, metadata recording

There is no application auth middleware pattern. The boundary is procedural: the user controls login, MFA, locale, sensitive navigation, disposable-view creation/configuration/cleanup, and confirmation of shell/plan. Project tooling must not capture credentials, cookies, tokens, or persisted browser session state.

### Selector Ranking

**Source:** `.planning/research/ARCHITECTURE.md:747-760`  
**Apply to:** `SELECTORS.md`, manifest selectors, all fixture assertions

```text
current data-garden-id
  -> Zendesk data-test-id
  -> structural fallback scoped to the correct table/container
```

A fallback is admissible only after it works across the Priority-present, Priority-absent, and grouped/long scenarios. Never use styled-components hashes or copied positional selectors as durable evidence.

### Admission and Error Handling

**Source:** `.planning/phases/01-dom-recon-spike/01-RESEARCH.md:258-269`  
**Apply to:** sanitizer, sensitive-pattern module, fixture contract, manifest

All failures are closed failures: no denylist, suspicious residual data, forbidden active markup, parse failure, missing selector, mismatched scenario invariant, or checksum mismatch means the fixture is not admitted. Do not downgrade any of these failures to warnings.

### Provenance

**Source:** `.planning/phases/01-dom-recon-spike/01-RESEARCH.md:277-293`  
**Apply to:** all fixtures and `manifest.json`

Compute SHA-256 after the final sanitization pass and verify the exact bytes in every test run. If a fixture changes, its manifest checksum must change in the same work unit.

### Evidence Before Capture

**Source:** `.planning/phases/01-dom-recon-spike/01-RESEARCH.md:187-208`  
**Apply to:** `SELECTORS.md` and the live-session checkpoint

Scaffold the complete ledger inventory and exact probe snippets before the authenticated session. This makes the live work bounded and ensures no English-path assumption is forgotten.

### Greenfield JavaScript Style

**Source:** `.planning/research/STACK.md:110-130` and `.planning/phases/01-dom-recon-spike/01-RESEARCH.md:76-90`  
**Apply to:** sanitizer, scanner, tests, config

Use plain modern JavaScript and ESM-compatible imports, Node built-ins for file I/O and SHA-256, and no production/runtime dependency. There is no existing local naming, export, error-class, or test-layout convention to preserve beyond the paths fixed by research.

## No Analog Found

| File(s) | Role | Data Flow | Reason |
|---------|------|-----------|--------|
| `SELECTORS.md` | config | event-driven | No prior evidence ledger exists; use the tracked Verification Ledger only as a question seed. |
| `package.json`, `package-lock.json`, `vitest.config.js` | config | batch | Repository has no Node/test configuration. |
| `scripts/sanitize-fixture.js` | utility | file-I/O / transform | Repository has no sanitizer, CLI, or file-processing utility. |
| `test/recon/sensitive-patterns.js` | utility | transform | Repository has no validation/admission module. |
| `test/fixtures/*.html`, `test/fixtures/manifest.json` | test/model | file-I/O | Repository has no fixtures or fixture manifest. |
| `test/recon/fixture-contract.test.js` | test | file-I/O | Repository has no tests; the phase research provides a template, not an established implementation analog. |

## Planner Warnings

- The package checkpoint must occur before dependency installation, because both proposed package releases are research-flagged `SUS`.
- The authenticated human checkpoint must occur after probes/tests are scaffolded and before live inspection.
- Do not put a raw capture anywhere in the repository, including under `.gitignore`.
- Do not invent or record a raw-capture path in any artifact.
- Do not let an offline fixture test stand in for live selector evidence.
- Do not claim English-only observation proves localization, legacy-shell, vanity-domain, or cross-plan compatibility.
- Closed Shadow DOM is terminal. Missing `data-garden-id` is not terminal if and only if a stable fallback passes the full matrix.
- Any unresolved English-path ledger entry keeps the phase open.

## Metadata

**Analog search scope:** all tracked repository files, with targeted review of `.planning/research/` and the phase context/research  
**Tracked files scanned:** 29  
**Implementation files present:** 0  
**Pattern extraction date:** 2026-09-02
