# Phase 1: DOM Recon Spike - Research

**Researched:** 2026-09-02
**Domain:** Authenticated DOM reconnaissance, privacy-safe fixture capture, and selector feasibility gating
**Confidence:** MEDIUM — implementation mechanics are well supported; the live Zendesk DOM facts are intentionally unresolved until execution

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Live Capture and Confidentiality
- **D-01:** Use a hybrid authenticated-session workflow. The user controls login, MFA, locale settings, sensitive navigation, and other account actions; the agent leads or guides DOM inspection after the target view is open.
- **D-02:** Commit only structurally faithful sanitized fixtures. Preserve DOM topology and selector-relevant attributes while replacing ticket subjects, people, emails, organization data, account and ticket identifiers, URLs, embedded state, and other tenant-specific content.
- **D-03:** An unsanitized capture may be retained privately outside the repository, but it must be encrypted at rest. Project artifacts must not reveal its path, tenant identity, or identifying metadata.
- **D-04:** A fixture may enter Git only after an automated sensitive-data scan passes. Human review is not a mandatory admission gate.

### Recon Scenario Matrix
- **D-05:** Phase 1 is intentionally English-only. Localization-specific Verification Ledger items must be labeled outside Phase 1 or unverified; they must not be presented as tested. The phase makes no cross-locale compatibility claim.
- **D-06:** Inspect three live configurations: an ungrouped view with Priority, a view without Priority, and a grouped or sufficiently long view that exposes duplicate or sticky headers plus scrolling or virtualization behavior.
- **D-07:** Inspect the current Zendesk Agent Workspace only. Record the capture date, observed shell, account plan, and other relevant non-identifying UI metadata. Do not claim legacy-interface or cross-plan coverage without evidence.
- **D-08:** Create dedicated disposable recon views when existing views do not cover the matrix. Do not alter operational views. Creation, configuration, and any cleanup remain under the user's authenticated control.

### Fixture Corpus
- **D-09:** Commit one structurally complete Priority-present canonical fixture plus smaller faithful Priority-absent and grouped/long variants.
- **D-10:** The canonical capture boundary is the nearest complete table container: wrapper, sticky or duplicate header table, body table, relevant accessibility attributes, and immediate state-bearing ancestors. Exclude navigation, sidebars, user menus, and unrelated page state.
- **D-11:** Replace non-priority row content with deterministic placeholders while preserving the real row structure and English Priority labels. The canonical fixture must contain at least one Urgent, High, Normal, and Low row.
- **D-12:** Maintain a sidecar fixture manifest containing scenario, capture date, non-identifying Agent Workspace metadata, DOM boundary, sanitization method, and checksum of each sanitized fixture. Do not include tenant identity or the raw-capture location.

### Evidence and Gate Protocol
- **D-13:** Each `SELECTORS.md` item is a reproducible ledger entry containing the question, status (`verified`, `disproved`, or `outside English-only scope`), exact DevTools probe, sanitized result or markup excerpt, interpretation, fallback, and capture scenario.
- **D-14:** Use textual probe output or sanitized markup as primary evidence. Add cropped, sanitized screenshots only for visual facts that text cannot establish, including the painting element, sticky-header layout, or hover and selection behavior.
- **D-15:** Closed Shadow DOM around the ticket list is terminal and blocks Phase 2. Missing `data-garden-id` is not terminal by itself: a stable fallback must work across the complete scenario matrix or Phase 1 remains blocked. Absence of a machine-readable priority signal permits the planned English-text fallback.
- **D-16:** Phase 1 completes only when every English-path ledger item has a terminal status, the sensitive-data scan passes, every committed fixture loads successfully, provenance checksums match, and `SELECTORS.md` ends with an explicit proceed or block verdict. Any unresolved English-path item keeps the phase open.

### the agent's Discretion
- Exact filenames for focused fixtures and the fixture sidecar manifest.
- Exact automated scanning implementation and suspicious-value patterns, provided it covers all sensitive categories in D-02 and fails closed.
- Exact DevTools probe scripts and fixture-loading test organization, provided the evidence and completion contracts above are met.

### Deferred Ideas (OUT OF SCOPE)
- Non-English live reconnaissance and localized priority strings are outside Phase 1. Localization-only ledger entries remain explicitly unverified; later phases must not infer cross-locale support from this spike.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RECON-01 | A captured `outerHTML` fixture of a real Zendesk agent view is committed to the repo and usable as a test fixture | Use the nearest complete table-container boundary, sanitize before admission, record SHA-256 in a sidecar manifest, and parse the committed file with Happy DOM in a Vitest test. [VERIFIED: .planning/REQUIREMENTS.md:14-14] |
| RECON-02 | Every English-path DOM assumption in the research Verification Ledger is answered against a live English instance, with answers recorded in the repo; localization-only items are explicitly marked unverified and outside Phase 1 | Seed `SELECTORS.md` from the existing ledger and require one terminal status plus probe, evidence, interpretation, fallback, and scenario for every item. [VERIFIED: .planning/REQUIREMENTS.md:15-15] |
| RECON-03 | The two terminal risks are explicitly ruled in or out — a closed Shadow DOM around the ticket list, and the absence of `data-garden-id` attributes in a current agent view | Use the two-part Shadow DOM proof below and test the selector/fallback hierarchy over all three scenarios. [VERIFIED: .planning/REQUIREMENTS.md:16-16] |
</phase_requirements>

## Summary

Treat this phase as an evidence-acquisition and admission pipeline, not as extension implementation. Prepare reproducible probes and fixture tests before the authenticated session; pause at a human checkpoint while the user opens or creates the three required English Agent Workspace views; then capture, sanitize, scan, checksum, test, and close the ledger offline. The repository's prior research explicitly lists the live-only assumptions and says they cannot be confirmed without a real account. [VERIFIED: .planning/research/ARCHITECTURE.md:747-760]

The most important correction is the Shadow DOM proof rule. `host.shadowRoot === null` is not evidence that no shadow root exists, because closed roots also return `null`. A conclusive ruling requires both (1) selector reachability from the expected top document and (2) the inspected ticket-row node's complete `getRootNode()`/host chain, including every `ShadowRoot.mode`. MDN documents that document selectors do not cross shadow boundaries, a closed host exposes `null` through `shadowRoot`, and a node inside a shadow tree returns its `ShadowRoot` from `getRootNode()`. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM] [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Node/getRootNode]

**Primary recommendation:** Plan four gates in order: scaffold ledger/tests → authenticated three-scenario capture → sanitize/admit fixtures → issue an explicit proceed/block verdict. Do not begin Phase 2 when any English-path item is unresolved.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Authentication, MFA, view creation, locale control | External Zendesk / User | Browser | The user retains control of consequential authenticated actions under D-01 and D-08. [VERIFIED: .planning/phases/01-dom-recon-spike/01-CONTEXT.md:17-26] |
| DOM probing and visual inspection | Browser / DevTools | — | Only a live rendered agent view can settle the unsupported DOM assumptions. [VERIFIED: .planning/research/PITFALLS.md:586-595] |
| Raw-capture custody | Private local storage outside Git | User | Raw material may be retained only encrypted and its path/identity must not appear in project artifacts. [VERIFIED: .planning/phases/01-dom-recon-spike/01-CONTEXT.md:18-20] |
| Sanitization and admission scan | Local test/tooling | Git boundary | The scanner is the mandatory gate before fixture admission. [VERIFIED: .planning/phases/01-dom-recon-spike/01-CONTEXT.md:18-20] |
| Fixture parsing and checksum verification | Local test/tooling | — | Tests prove the sanitized corpus is loadable and has not drifted from its manifest. [CITED: https://nodejs.org/docs/latest-v22.x/api/crypto.html] |
| Proceed/block decision | Repository documentation | Phase orchestration | `SELECTORS.md` is the evidence ledger and must end in the explicit gate verdict. [VERIFIED: .planning/phases/01-dom-recon-spike/01-CONTEXT.md:35-38] |

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Chrome DevTools | Chrome 152.0.7977.75 observed locally | Inspect the live DOM, force states, read computed styles, and run exact probes | The target UI is rendered in Chrome, and the Elements/Computed panes expose the browser's actual DOM and cascade. [CITED: https://developer.chrome.com/docs/devtools/elements] |
| Node.js built-ins | Local Node v26.8.1 | Read fixture bytes, run admission logic, and compute SHA-256 | `node:fs/promises` and `node:crypto` avoid extra packages for I/O and provenance. [CITED: https://nodejs.org/docs/latest-v22.x/api/crypto.html] |
| `vitest` 4.1.11 [WARNING: flagged as suspicious — verify before using.] | 4.1.11, published 2026-08-18 | Fixture contract test runner | Project research already standardizes Vitest; official docs support per-suite DOM environments. The package gate returned `SUS` only because this release is recent. [CITED: https://github.com/vitest-dev/vitest/blob/v4.1.6/docs/guide/features.md] |
| `happy-dom` 20.13.1 [WARNING: flagged as suspicious — verify before using.] | 20.13.1, published 2026-09-02 | Parse sanitized HTML into a queryable offline `Document` | Vitest's official documentation names Happy DOM as a supported environment, and Happy DOM documents `DOMParser`. The package gate returned `SUS` because the current release is same-day. [CITED: https://github.com/capricorn86/happy-dom] |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| SHA-256 through `node:crypto` | Built-in | Bind each sanitized fixture to its manifest entry | After final sanitization and in every fixture contract test. [CITED: https://nodejs.org/docs/latest-v22.x/api/crypto.html] |
| `DOMParser.parseFromString(..., 'text/html')` | Browser/Happy DOM API | Parse fixture text into a separate in-memory document | Query only; never adopt captured nodes into an active document. Browser documentation notes that the parsed document is inert but may still reference downloadable resources. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Happy DOM | Regex/string matching | Rejected: it does not demonstrate that the captured markup is a structurally queryable DOM. |
| Vitest + Happy DOM | Playwright | Unnecessary for the required load-and-locate contract; a live authenticated browser is still required for selector truth. [VERIFIED: .planning/research/STACK.md:393-401] |
| Built-in SHA-256 | A checksum package | Rejected: Node already provides the required primitive. [CITED: https://nodejs.org/docs/latest-v22.x/api/crypto.html] |

**Installation:** The planner must insert `checkpoint:human-verify` before installing each `SUS` package.

```bash
npm install --save-dev vitest@4.1.11 happy-dom@20.13.1
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `vitest` | npm | Since 2021-12-03 | 99,878,658/week | github.com/vitest-dev/vitest | SUS: latest release too new; no postinstall | Flagged — planner must add checkpoint |
| `happy-dom` | npm | Since 2019-09-15 | 15,886,262/week | github.com/capricorn86/happy-dom | SUS: latest release too new; no postinstall | Flagged — planner must add checkpoint |

**Packages removed due to SLOP verdict:** none.

**Packages flagged as suspicious [SUS]:** `vitest`, `happy-dom`. Their official repositories and high use reduce concern, but the required legitimacy seam still mandates a human verification checkpoint before installation.

## Architecture Patterns

### System Architecture Diagram

```text
User opens current English Zendesk Agent Workspace
        |
        v
[Authenticated checkpoint: user controls login/MFA/views]
        |
        +--> Priority-present view
        +--> Priority-absent view
        `--> Grouped/long view
                 |
                 v
        Exact DevTools probes + bounded outerHTML capture
                 |
         +-------+--------------------+
         |                            |
         v                            v
  SELECTORS.md evidence         Raw capture (private,
  ledger                        outside Git, encrypted
         |                      if retained)
         |                            |
         |                            v
         |                    Deterministic sanitizer
         |                            |
         |                            v
         |                    Sensitive-data scan
         |                            |
         |                  pass -----+----- fail
         |                    |               |
         |                    v               `--> no Git admission
         |             sanitized fixtures
         |             + manifest checksums
         |                    |
         `--------------------v
                    fixture load/selector tests
                              |
             +----------------+----------------+
             |                                 |
   closed Shadow root? yes             all gates terminal/pass?
             |                                 |
             v                           yes --+-- no
       BLOCK PHASE 2                     |         |
                                        v         `--> keep Phase 1 open
                                  PROCEED TO PHASE 2
```

### Recommended Project Structure

```text
SELECTORS.md
package.json
vitest.config.js
test/
├── fixtures/
│   ├── zendesk-view-priority-present.html
│   ├── zendesk-view-priority-absent.html
│   ├── zendesk-view-grouped-long.html
│   └── manifest.json
└── recon/
    ├── fixture-contract.test.js
    └── sensitive-patterns.js
```

These filenames are recommended under the agent's discretion; the locked integration locations are repository-root `SELECTORS.md` and `test/fixtures/`. [VERIFIED: .planning/phases/01-dom-recon-spike/01-CONTEXT.md:75-81]

### Pattern 1: Evidence Before Capture

Create the complete `SELECTORS.md` question inventory and exact probe snippets before opening the authenticated session. Each row must use the locked status vocabulary verbatim: `verified`, `disproved`, or `outside English-only scope`. [VERIFIED: .planning/phases/01-dom-recon-spike/01-CONTEXT.md:35-35]

Minimum English-path ledger coverage:

| Item | Required observation | Scenario(s) | Gate / fallback |
|------|----------------------|-------------|-----------------|
| Shell metadata | Capture date, current Agent Workspace shell, plan, current hostname/path, top-frame state | All | Scope the claim to exactly what was observed. |
| Ticket-list reachability | Whether the selected ticket row is queryable from the expected document | All | Feeds the Shadow DOM/iframe ruling. |
| Shadow root chain | Every root between selected row and owner document, including `mode` | All | Any closed root wrapping the list blocks Phase 2. |
| Garden selectors | Counts and exact values of `data-garden-id` on table/header/body/ticket/group rows/cells | All | If missing, validate `data-test-id`, then structural fallback across the full matrix. |
| Header topology | Body table's own header versus sibling sticky/duplicate header, and shared container | Priority-present, grouped/long | Record same-table resolution or sibling-header fallback. |
| Priority representation | Cell text, accessible name, attribute names, dataset keys, icons/badges, and any locale-independent signal | Priority-present | Machine signal if present; otherwise English header/value text fallback is permitted. |
| Priority absence control | Confirm the same ticket-table shape with no Priority column | Priority-absent | Must distinguish absence from selector failure. |
| Ticket versus group rows | Structural and attribute differences | Grouped/long | Record selector that excludes group rows. |
| Scrolling/virtualization | Row count and stable identities at top/bottom; nodes added, removed, or recycled | Grouped/long | Record element-agnostic fallback if rows are not `<tr>`. |
| Painting element | Row/cell/inner-wrapper computed backgrounds plus reversible magenta probe | Priority-present | Record the exact element Phase 2 must style. |
| Hover/selection/sticky behavior | Textual computed-style/geometry evidence; sanitized crop only if text is inadequate | Priority-present, grouped/long | Record selector/specificity consequence without implementing tinting. |
| Unknown attribute survival | Add a temporary inert `data-zhroma-probe`, trigger sort/refresh, and report whether the replacement row retains it | Priority-present | Evidence for re-stamping strategy; remove the probe afterwards. |
| Language signal | Observed `document.documentElement.lang` and relevant shell marker in English | All | Observation only; no cross-language inference. |
| Current host coverage | Observed agent URL and frame placement | All | Do not infer vanity-domain, legacy-shell, or cross-plan support. |

The existing Verification Ledger is the canonical seed, not a source of already-verified live facts. [VERIFIED: .planning/research/ARCHITECTURE.md:716-760]

### Pattern 2: Two-Part Shadow DOM Proof

Select a real ticket row in Elements so it is `$0`, then record both reachability and the full root chain:

```js
// Sources:
// https://developer.mozilla.org/en-US/docs/Web/API/Node/getRootNode
// https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM
(() => {
  const row = $0;
  const ownerDocument = row.ownerDocument;
  const roots = [];
  let node = row;

  while (node) {
    const root = node.getRootNode();
    if (root === ownerDocument) {
      roots.push({ type: 'Document' });
      break;
    }

    roots.push({
      type: root.constructor.name,
      mode: root.mode ?? null,
      hostTag: root.host?.tagName ?? null,
      hostGardenId: root.host?.getAttribute?.('data-garden-id') ?? null,
      hostTestId: root.host?.getAttribute?.('data-test-id') ?? null,
    });
    node = root.host;
  }

  return {
    consoleIsTopFrame: window === window.top,
    selectedNodeOwnerIsConsoleDocument: ownerDocument === document,
    reachableFromConsoleDocument: document.contains(row),
    ownerFrameTag: ownerDocument.defaultView?.frameElement?.tagName ?? null,
    roots,
  };
})();
```

Interpretation is strict:

- `host.shadowRoot === null` alone is inconclusive; it means either no root or a closed root. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM]
- A row found from the intended top document, with `document.contains(row) === true` and a root chain ending directly at that `Document`, rules out a Shadow DOM boundary around that row in the observed scenario. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Node/getRootNode]
- A root-chain entry with `mode: 'closed'` is terminal and the final verdict is block. An open root is not automatically terminal, but the ledger must record how selectors and CSS would enter it. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot]
- Run this in all three scenarios; one light-DOM view cannot establish the other configurations.

### Pattern 3: Sanitization as a One-Way Admission Boundary

Never place the raw capture in the repository, even under `.gitignore`. Sanitize from a private input into a new output; never edit the raw file in place. The output policy should:

1. Preserve topology and a narrow allowlist of selector-relevant attributes.
2. Replace every non-priority row text node with deterministic placeholders.
3. Preserve only the English Priority labels `Urgent`, `High`, `Normal`, and `Low` verbatim. [VERIFIED: .planning/phases/01-dom-recon-spike/01-CONTEXT.md:29-32]
4. Remove or deterministically rewrite identifiers, `href`, `src`, inline event handlers, embedded state, emails, names, organizations, subjects, and tenant hostnames.
5. Reject scripts, frames, remote-resource URLs, unknown high-entropy values, long numeric identifiers, and capture-specific denylist tokens.
6. Run the scan before `git add`; compute SHA-256 only after the final sanitized bytes exist.

A generic regex is insufficient for names and organizations. Pair generic patterns with an ephemeral, uncommitted capture-specific denylist supplied during sanitization, and fail if the denylist is missing. This is the reliable way to satisfy D-02 without making human review mandatory.

### Pattern 4: Parse Fixtures Inertly and Verify Provenance

```js
// Sources:
// https://github.com/capricorn86/happy-dom
// https://nodejs.org/docs/latest-v22.x/api/crypto.html
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

Keep the parsed document separate and query-only. Do not append its nodes to an active document; MDN notes that inert parsed markup can become executable if inserted into a live document and that resource-bearing elements may still download. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString]

### Pattern 5: Explicit Authenticated-Session Checkpoint

The plan must stop at a human checkpoint after probes/tests exist and before any live inspection. The checkpoint asks the user to:

- log in and complete MFA;
- confirm the agent UI is English;
- open or create the three disposable recon scenarios;
- confirm current Agent Workspace shell and account plan;
- control any view creation, configuration, cleanup, and sensitive navigation.

The agent may then guide inspection and capture. A missing scenario is not waived: the user creates a disposable view or Phase 1 remains open. [VERIFIED: .planning/phases/01-dom-recon-spike/01-CONTEXT.md:17-26]

### Anti-Patterns to Avoid

- **`host.shadowRoot === null` as proof:** closed and absent roots produce the same result.
- **Capturing the full page:** it unnecessarily includes navigation, account state, user menus, and tenant identifiers.
- **Sanitizing after commit or staging:** the raw capture must never cross the Git boundary.
- **Regex-only privacy scan:** it cannot discover arbitrary people or organization names without deterministic replacement and a capture-specific denylist.
- **Reserializing into a toy table:** it destroys the topology this phase exists to preserve.
- **Using one scenario to prove absence:** `data-garden-id`, group rows, sticky headers, and virtualization must be checked across the complete matrix.
- **Treating an offline fixture test as live compatibility:** it proves repeatable parsing of the observed DOM, not that Zendesk has not changed. [VERIFIED: .planning/research/STACK.md:393-401]
- **Cross-language or cross-plan claims:** only the observed English shell/plan is in scope.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML parsing | Regex parser | Happy DOM `DOMParser` | The acceptance criterion is structural queryability, not substring presence. [CITED: https://github.com/capricorn86/happy-dom] |
| Cryptographic checksum | Custom digest | `node:crypto.createHash('sha256')` | Standard, built-in implementation. [CITED: https://nodejs.org/docs/latest-v22.x/api/crypto.html] |
| Encryption for optional raw retention | Project-local cipher or password convention | Existing OS/enterprise encrypted storage; otherwise delete the raw capture | D-03 requires encryption at rest but does not authorize inventing key management. [VERIFIED: .planning/phases/01-dom-recon-spike/01-CONTEXT.md:19-19] |
| General DOM compatibility abstraction | Premature selector engine | Evidence-ranked selector plus tested fallbacks | Zendesk publishes no supported ticket-table DOM contract; the live ledger is the contract for this project. [VERIFIED: .planning/research/PITFALLS.md:586-595] |

## Common Pitfalls

### Pitfall 1: An inconclusive Shadow DOM answer is recorded as “no”

**What goes wrong:** A host returns `null` from `.shadowRoot`, and the ledger incorrectly declares no shadow root.  
**Why it happens:** Closed roots intentionally return `null`. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM]  
**How to avoid:** Require top-document reachability plus the selected row's root chain in every scenario.  
**Warning sign:** Evidence contains only a host lookup and no selected-row output.

### Pitfall 2: Sensitive data survives in attributes

**What goes wrong:** Visible text is replaced, but IDs, URLs, ARIA labels, embedded JSON, or data attributes leak tenant information.  
**Why it happens:** Sanitization focuses only on text nodes.  
**How to avoid:** Use an attribute allowlist, deterministic value rewriting, generic secret/PII patterns, and a private capture-specific denylist.  
**Warning sign:** Any non-placeholder URL, email, long numeric value, opaque encoded value, or inline event handler remains.

### Pitfall 3: The fixture is safe but no longer faithful

**What goes wrong:** A hand-authored sample passes tests but omits the duplicate header, group rows, accessibility roles, or state-bearing wrappers.  
**Why it happens:** Rebuilding markup is easier than sanitizing it.  
**How to avoid:** Transform the real bounded capture in place, preserving node order/topology and allowed structural attributes.  
**Warning sign:** The sanitized tree has materially fewer structural nodes than the capture or all three fixtures share a toy shape.

### Pitfall 4: Missing `data-garden-id` is treated as automatic failure or automatic success

**What goes wrong:** The project blocks without trying fallbacks, or proceeds after a fallback works in only one view.  
**How to avoid:** Missing Garden attributes is recoverable only when `data-test-id` or a structural selector is stable across all required scenarios. [VERIFIED: .planning/phases/01-dom-recon-spike/01-CONTEXT.md:37-38]  
**Warning sign:** The verdict does not name the fallback and its three-scenario evidence.

### Pitfall 5: Language observation becomes a localization claim

**What goes wrong:** An English `lang` value is reported as proof the signal tracks arbitrary agent locales.  
**How to avoid:** Record only the observed English signal and mark localization-specific items `outside English-only scope`.  
**Warning sign:** Words such as “all locales,” “locale-independent language detection,” or translated priority strings appear in the verdict.

## State of the Art

| Old / insufficient approach | Current prescribed approach | Impact |
|-----------------------------|-----------------------------|--------|
| Infer current Zendesk markup from Garden source or prior-art userscripts | Verify the live current Agent Workspace and retain sanitized fixtures | Published component attributes remain candidates, not proof of live composition. [VERIFIED: .planning/research/ARCHITECTURE.md:747-760] |
| Check only `element.shadowRoot` | Combine top-document selector reachability with selected-node root-chain modes | Distinguishes “no boundary” from “closed boundary.” [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Node/getRootNode] |
| Commit a fixture and trust it | Manifest checksum plus admission scan plus load/selector test | Detects privacy failures, corruption, and fixture/manifest drift. [CITED: https://nodejs.org/docs/latest-v22.x/api/crypto.html] |
| Cross-locale recon | English-only observation with localization explicitly deferred | Matches the locked Phase 1 boundary. [VERIFIED: .planning/phases/01-dom-recon-spike/01-CONTEXT.md:23-25] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `[ASSUMED]` An authenticated English Agent Workspace and permissions to create disposable recon views will be available during execution. | Environment / Checkpoint | The three-scenario matrix cannot be completed and the phase remains open. |
| A2 | `[ASSUMED]` The proposed attribute allowlist and deterministic text replacement can preserve enough topology for downstream tests. | Sanitization | The fixture may be safe but unusable; validate structural counts and selectors before admission. |
| A3 | `[ASSUMED]` The two recently released test-package versions are acceptable after human legitimacy review. | Standard Stack | Pin an earlier reviewed version or use the existing approved project baseline if the checkpoint rejects either release. |

## Open Questions

1. **Is the required authenticated scenario matrix available?**
   - What we know: D-06 requires three configurations and D-08 permits disposable views.
   - What's unclear: Account access and view-management permissions were not available to this research run.
   - Recommendation: Make this the first execution checkpoint after scaffolding probes/tests; no fallback can create trustworthy live evidence.

2. **Will the raw capture be retained?**
   - What we know: Retention is optional, but any retained raw copy must be encrypted and invisible to project artifacts.
   - What's unclear: The user's preferred private encrypted store.
   - Recommendation: Default to deletion immediately after sanitized output passes; if retained, the user selects and controls the encrypted location.

3. **Will current package releases pass the human legitimacy checkpoint?**
   - What we know: Both packages have official repositories, millions of weekly downloads, and no postinstall, but the seam flags their newest releases as too new.
   - Recommendation: Review provenance before install; pin the accepted exact versions in `package-lock.json`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Google Chrome | Live DOM inspection | Yes | 152.0.7977.75 observed | None; target platform is Chrome |
| Node.js | Tests, sanitizer, checksum | Yes | v26.8.1 observed | Any version satisfying the selected packages' declared engine ranges |
| npm | Dev dependency installation | Yes | 11.19.0 observed | None needed |
| Authenticated English Zendesk Agent Workspace | RECON-01/02/03 | Unconfirmed | — | Human checkpoint; no synthetic substitute |
| Permission to create/configure disposable views | Three-scenario matrix | Unconfirmed | — | Use existing non-operational views only if they exactly cover the matrix |
| Encrypted private storage | Optional raw retention | Unconfirmed | — | Do not retain raw capture |

**Missing dependencies with no fallback:** a live authenticated English Agent Workspace blocks phase execution if unavailable.

**Missing dependencies with fallback:** encrypted private storage is unnecessary when the raw capture is deleted after sanitized admission.

## Security Domain

Security enforcement is enabled at ASVS Level 1 in project configuration. [VERIFIED: .planning/config.json:47-49]

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No implementation | The user performs Zendesk login/MFA; never capture credentials, cookies, or tokens. |
| V3 Session Management | No implementation | Do not persist or export authenticated browser state. |
| V4 Access Control | Yes, procedural | Raw capture remains under user-controlled encrypted private storage or is deleted. |
| V5 Input Validation | Yes | Treat captured HTML as untrusted; sanitize, reject active/resource-bearing content, scan, then parse query-only. |
| V6 Cryptography | Conditional | Use established encrypted storage for retained raw captures and Node's standard SHA-256 for integrity; do not hand-roll cryptography. |

OWASP ASVS 5.0's current Data Protection chapter calls for identifying/classifying sensitive data and documenting encryption, integrity, retention, logging, and access requirements. [CITED: https://github.com/OWASP/ASVS/blob/master/5.0/en/0x23-V14-Data-Protection.md]

### Known Threat Patterns for DOM Capture

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tenant PII, ticket content, URLs, identifiers, or tokens enter Git | Information Disclosure | Bounded capture, deterministic redaction, attribute allowlist, private denylist, fail-closed scan before staging |
| Fixture changes without manifest update | Tampering | Recompute SHA-256 in tests and reject mismatches |
| Captured HTML executes or fetches during tests | Tampering / Information Disclosure | Remove scripts/handlers/resource URLs; parse into a separate inert document; never attach to live DOM |
| Raw-capture path or tenant name appears in artifacts/logs | Information Disclosure | Accept the path only as transient input; never print or persist it |
| Evidence from the wrong frame/shell is treated as the ticket list | Spoofing | Record frame ownership, root chain, URL shape, current shell, and scenario metadata |

## Sources

### Primary (HIGH confidence for the cited API or project decision)

- `.planning/phases/01-dom-recon-spike/01-CONTEXT.md` — locked scope, capture, fixture, evidence, and gate decisions.
- `.planning/REQUIREMENTS.md` — RECON-01, RECON-02, and RECON-03 verbatim.
- `.planning/research/ARCHITECTURE.md` — canonical Verification Ledger and live-instance assumptions.
- [MDN: Using shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) — selector encapsulation and closed-root behavior.
- [MDN: `Node.getRootNode()`](https://developer.mozilla.org/en-US/docs/Web/API/Node/getRootNode) — root-chain semantics.
- [Chrome DevTools Elements](https://developer.chrome.com/docs/devtools/elements) — live DOM and computed-style inspection.
- [Node.js crypto](https://nodejs.org/docs/latest-v22.x/api/crypto.html) — SHA-256 implementation.
- [OWASP ASVS 5.0 V14](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x23-V14-Data-Protection.md) — data-protection controls.

### Secondary (MEDIUM confidence)

- [Vitest v4.1.6 official guide](https://github.com/vitest-dev/vitest/blob/v4.1.6/docs/guide/features.md) — Happy DOM environment configuration; the registry version was separately checked as 4.1.11.
- [Happy DOM official repository](https://github.com/capricorn86/happy-dom) — `Window`/`DOMParser` usage; Context7 documentation snapshot was v19 while the registry version was separately checked as 20.13.1.
- [MDN: `DOMParser.parseFromString`](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString) — inert parsing and resource/injection cautions.

### Tertiary (LOW confidence)

- Live Zendesk DOM conclusions: none are asserted here; they remain Phase 1 execution evidence.

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — official documentation and registry probes agree, but both latest package releases triggered the required recency warning.
- Architecture: HIGH — directly derived from locked decisions and standard browser/Node APIs.
- Live DOM facts: LOW before execution — intentionally unresolved until the authenticated three-scenario probes run.
- Pitfalls: HIGH — privacy and evidence-failure modes follow directly from the capture boundary and browser API semantics.

**Validation architecture:** Omitted because `workflow.nyquist_validation` is explicitly `false`. [VERIFIED: .planning/config.json:20-25]

**Research date:** 2026-09-02  
**Valid until:** 2026-09-09 for package versions and live-DOM planning assumptions; the committed live capture date governs the fixture itself.
