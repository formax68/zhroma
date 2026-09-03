# Zendesk DOM Recon Evidence Ledger

This file defines the repository-side evidence contract for Phase 1. It does
not contain a live Zendesk finding. The admitted ledger entries below are
synthetic or scope decisions; every live English-path question remains an
explicit pre-capture template with `status` and `assumption` set to
`unresolved`.

An authenticated recon plan converts a template from `Recon Question` to
`Ledger Entry` only after its output is sanitized and admitted. At that point
the status must be exactly `verified` or `disproved`. The final verdict must
remain `block` while any `Recon Question` remains.

## Ledger Entry: tracer-english-path

- id: `tracer-english-path`
- question: Can one complete synthetic entry traverse the evidence gate without asserting a live Zendesk fact?
- scope: `English path`
- status: `verified`
- probe: `document.querySelector('[data-synthetic="ticket-list"]') !== null`
- evidence: Sanitized synthetic contract markup contains the expected test-only ticket-list marker.
- interpretation: The repository validator can enforce the D-13 field contract entirely offline; this says nothing about the live Zendesk DOM.
- fallback: Block the repository gate and collect a complete sanitized entry before accepting evidence.
- scenario: `synthetic-contract`

## Recon Question: shell-metadata

- id: `shell-metadata`
- question: What capture date, current Agent Workspace shell, account plan, and non-identifying page metadata bound each observation?
- scope: `English path`
- status: `unresolved`
- assumption: `unresolved`
- probe: `({ capturedAt: new Date().toISOString(), title: document.title, path: location.pathname, topFrame: window === window.top })`
- evidence: Pending sanitized metadata from all three required live scenarios; tenant identity must be omitted.
- interpretation: Pending; evidence will limit conclusions to the observed shell, plan, date, and scenarios.
- fallback: Record the missing metadata as a blocking evidence gap and do not generalize beyond the observed session.
- scenario: `all-three-live-scenarios`

## Recon Question: top-document-reachability

- id: `top-document-reachability`
- question: Is a selected ticket row reachable from the expected top document, and is its owner document hosted in a frame?
- scope: `English path`
- status: `unresolved`
- assumption: `unresolved`
- probe: `({ consoleIsTopFrame: window === window.top, selectedNodeOwnerIsConsoleDocument: $0.ownerDocument === document, reachableFromConsoleDocument: document.contains($0), ownerFrameTag: $0.ownerDocument.defaultView?.frameElement?.tagName ?? null })`
- evidence: Pending sanitized boolean and element-type output from each live scenario.
- interpretation: Pending; this establishes the document and frame boundary but does not alone rule out Shadow DOM.
- fallback: If framed, record the exact non-identifying frame relationship and reassess the top-frame execution assumption.
- scenario: `all-three-live-scenarios`

## Recon Question: root-chain

- id: `root-chain`
- question: What is the complete root and host chain from a selected ticket row to its owner document, including every ShadowRoot mode?
- scope: `English path`
- status: `unresolved`
- assumption: `unresolved`
- probe: `(() => { const roots = []; let node = $0; while (node) { const root = node.getRootNode(); if (root === node.ownerDocument) { roots.push({ type: 'Document' }); break; } roots.push({ type: root.constructor.name, mode: root.mode ?? null, hostTag: root.host?.tagName ?? null }); node = root.host; } return roots; })()`
- evidence: Pending sanitized root-chain output from each live scenario.
- interpretation: Pending; any closed root around the ticket list is terminal, while a direct Document chain rules it out only for the observed scenario.
- fallback: A closed root produces a Phase 2 block; an open root requires a documented selector and styling entry path.
- scenario: `all-three-live-scenarios`

## Recon Question: stable-identifiers

- id: `stable-identifiers`
- question: Which `data-garden-id` and `data-test-id` values identify the complete container, tables, headers, ticket rows, group rows, and cells?
- scope: `English path`
- status: `unresolved`
- assumption: `unresolved`
- probe: `([...$0.closest('[data-test-id="table_container"]')?.querySelectorAll('[data-garden-id], [data-test-id]') ?? []].map(element => ({ tag: element.tagName, garden: element.getAttribute('data-garden-id'), test: element.getAttribute('data-test-id') })))`
- evidence: Pending sanitized structural identifier inventory from all three live scenarios.
- interpretation: Pending; Garden identifiers rank first, test identifiers second, and structural selectors last.
- fallback: Validate `data-test-id`, then an element-agnostic structural selector across the full scenario matrix; otherwise block.
- scenario: `all-three-live-scenarios`

## Recon Question: header-topology

- id: `header-topology`
- question: Does the body table contain its own header, or must headers be resolved from a sibling sticky or duplicate header table in a shared container?
- scope: `English path`
- status: `unresolved`
- assumption: `unresolved`
- probe: `(() => { const table = $0.closest('table'); const container = table?.closest('[data-test-id="table_container"]'); return { ownHead: Boolean(table?.tHead), tableTestId: table?.getAttribute('data-test-id') ?? null, siblingTables: [...container?.querySelectorAll(':scope table') ?? []].map(item => item.getAttribute('data-test-id')) }; })()`
- evidence: Pending sanitized topology output from the Priority-present and grouped or long scenarios.
- interpretation: Pending; downstream resolution must bind headers to the same body table or its proven sibling header.
- fallback: Resolve the sibling header through the nearest shared container and verify column alignment in both scenarios.
- scenario: `priority-present-and-grouped-long`

## Recon Question: priority-representation

- id: `priority-representation`
- question: How is Priority represented in its header and cells, and is any locale-independent machine-readable signal present?
- scope: `English path`
- status: `unresolved`
- assumption: `unresolved`
- probe: `(() => ({ text: $0.textContent.trim(), accessibleName: $0.getAttribute('aria-label'), attributeNames: $0.getAttributeNames(), datasetKeys: Object.keys($0.dataset), descendants: [...$0.querySelectorAll('*')].map(element => ({ tag: element.tagName, role: element.getAttribute('role'), attributeNames: element.getAttributeNames() })) }))()`
- evidence: Pending sanitized header and Priority-cell output containing only allowed English Priority labels and structural metadata.
- interpretation: Pending; prefer a locale-independent signal, otherwise the permitted English header and value text fallback applies.
- fallback: Use exact English header and cell labels for v1; if the cell is unreadable, keep the page untouched and block that path.
- scenario: `priority-present-ungrouped`

## Recon Question: priority-absence

- id: `priority-absence`
- question: Does a genuine Priority-absent view retain the same proven ticket-table shape while omitting only the Priority header and cells?
- scope: `English path`
- status: `unresolved`
- assumption: `unresolved`
- probe: `(() => { const table = $0.closest('table'); return { ticketRows: table?.querySelectorAll('[data-garden-id="tables.row"]').length ?? 0, headers: [...table?.querySelectorAll('[data-garden-id="tables.header_cell"]') ?? []].map(cell => cell.textContent.trim()), hasPriority: [...table?.querySelectorAll('[data-garden-id="tables.header_cell"]') ?? []].some(cell => cell.textContent.trim() === 'Priority') }; })()`
- evidence: Pending sanitized structural counts and English header labels from the dedicated Priority-absent scenario.
- interpretation: Pending; this control must distinguish a missing column from table-selector failure.
- fallback: If the shape differs, find a stable ticket-table discriminator before allowing any missing-column diagnosis.
- scenario: `priority-absent`

## Recon Question: ticket-vs-group-rows

- id: `ticket-vs-group-rows`
- question: Which structural and attribute differences distinguish ticket rows from group rows without reading tenant content?
- scope: `English path`
- status: `unresolved`
- assumption: `unresolved`
- probe: `([...$0.closest('table')?.querySelectorAll('[data-garden-id="tables.row"], [data-garden-id="tables.group_row"]') ?? []].map(row => ({ tag: row.tagName, garden: row.getAttribute('data-garden-id'), test: row.getAttribute('data-test-id'), role: row.getAttribute('role'), cells: row.children.length })))`
- evidence: Pending sanitized row-type and child-count output from the grouped or long scenario.
- interpretation: Pending; the ticket-row selector must positively include tickets rather than broadly matching body rows.
- fallback: Use the narrowest structural discriminator verified across grouped and ungrouped fixtures; otherwise block tinting.
- scenario: `grouped-or-long`

## Recon Question: scrolling-and-recycling

- id: `scrolling-and-recycling`
- question: At the top and bottom of a long view, are rows added, removed, or recycled, and do stable identities survive scrolling?
- scope: `English path`
- status: `unresolved`
- assumption: `unresolved`
- probe: `(() => ({ count: document.querySelectorAll('[data-garden-id="tables.row"]').length, rows: [...document.querySelectorAll('[data-garden-id="tables.row"]')].map(row => ({ tag: row.tagName, garden: row.getAttribute('data-garden-id'), test: row.getAttribute('data-test-id') })) }))()`
- evidence: Pending sanitized output captured once at the top and once at the bottom, plus the observed node added, removed, or recycled behavior.
- interpretation: Pending; the comparison determines whether downstream observers must handle insertion or node reuse.
- fallback: Use element-agnostic selectors and re-derive all visible rows on each debounced DOM mutation.
- scenario: `grouped-or-long-top-and-bottom`

## Recon Question: painting-element

- id: `painting-element`
- question: Which element actually paints the visible ticket-row background: row, cells, or an inner wrapper?
- scope: `English path`
- status: `unresolved`
- assumption: `unresolved`
- probe: `(() => { const row = $0.closest('[data-garden-id="tables.row"]'); return [row, ...row.children].map(element => ({ tag: element.tagName, backgroundColor: getComputedStyle(element).backgroundColor, backgroundImage: getComputedStyle(element).backgroundImage })); })()`
- evidence: Pending sanitized computed-style output and, only if text is insufficient, a cropped sanitized image of a reversible magenta probe.
- interpretation: Pending; Phase 2 must style the element that owns the visible paint without changing DOM structure.
- fallback: Test a declarative translucent layer on the proven painting element and block if Zendesk interaction states cannot survive it.
- scenario: `priority-present-ungrouped`

## Recon Question: interaction-and-sticky-states

- id: `interaction-and-sticky-states`
- question: How do hover, selected, and sticky-header states change computed paint, specificity, and geometry?
- scope: `English path`
- status: `unresolved`
- assumption: `unresolved`
- probe: `(() => ({ row: { backgroundColor: getComputedStyle($0).backgroundColor, backgroundImage: getComputedStyle($0).backgroundImage }, rect: $0.getBoundingClientRect().toJSON(), position: getComputedStyle($0).position, zIndex: getComputedStyle($0).zIndex }))()`
- evidence: Pending sanitized computed-style and geometry output for normal, forced-hover, selected, and sticky states; use a cropped sanitized image only where text cannot establish the fact.
- interpretation: Pending; the evidence determines selector specificity and whether a translucent layer preserves native interaction states.
- fallback: Keep the page untouched if a treatment would suppress hover, selection, focus, or sticky-header readability.
- scenario: `priority-present-and-grouped-long`

## Recon Question: inert-attribute-survival

- id: `inert-attribute-survival`
- question: Does an inert `data-zhroma-probe` attribute survive the row replacement triggered by sort or refresh?
- scope: `English path`
- status: `unresolved`
- assumption: `unresolved`
- probe: `$0.setAttribute('data-zhroma-probe', '1'); /* trigger one sort or refresh */ document.querySelector('[data-zhroma-probe="1"]') !== null; /* then remove the probe */`
- evidence: Pending sanitized boolean result and a statement of whether the original node was retained or replaced.
- interpretation: Pending; survival affects only re-stamping strategy and never authorizes persistent live mutation during recon.
- fallback: Assume attributes are ephemeral and re-stamp idempotently after child-list mutations.
- scenario: `priority-present-ungrouped`

## Recon Question: english-language-signal

- id: `english-language-signal`
- question: Which observed document or shell signal identifies the current English agent UI without implying cross-locale correctness?
- scope: `English path`
- status: `unresolved`
- assumption: `unresolved`
- probe: `({ htmlLang: document.documentElement.lang || null, bodyLang: document.body?.getAttribute('lang') ?? null, navigatorLanguage: navigator.language })`
- evidence: Pending sanitized language-code output from all three English scenarios.
- interpretation: Pending; this records the observed English signal only and cannot establish locale-independent detection.
- fallback: If no reliable English signal exists, keep the priority-reading state distinguishable from genuine column absence.
- scenario: `all-three-live-scenarios`

## Recon Question: current-host-coverage

- id: `current-host-coverage`
- question: Does the observed current Agent Workspace use HTTPS on a Zendesk subdomain under `/agent/`, and where is the ticket list framed?
- scope: `English path`
- status: `unresolved`
- assumption: `unresolved`
- probe: `({ https: location.protocol === 'https:', zendeskSubdomain: location.hostname.endsWith('.zendesk.com'), agentPath: location.pathname.startsWith('/agent/'), topFrame: window === window.top })`
- evidence: Pending sanitized booleans from all three scenarios; the hostname itself must not be recorded.
- interpretation: Pending; evidence bounds host matching to the observed deployment and does not prove vanity-domain or legacy-shell coverage.
- fallback: Narrow the supported match pattern to what is proven and record unsupported deployment shapes without tenant identity.
- scenario: `all-three-live-scenarios`

## Ledger Entry: translated-priority-strings

- id: `translated-priority-strings`
- question: What translated strings represent the Priority header and its values outside English?
- scope: `Localization only`
- status: `outside English-only scope`
- probe: `Not run in Phase 1 by D-05; no translated interface is opened for this spike.`
- evidence: D-05 explicitly limits reconnaissance to the English agent UI.
- interpretation: Translated strings remain untested and no cross-locale compatibility claim is made.
- fallback: A later localization phase must collect independently sanitized evidence before supporting additional languages.
- scenario: `not-run-localization-only`

## Ledger Entry: cross-locale-behavior

- id: `cross-locale-behavior`
- question: Does DOM topology, priority representation, and language signaling remain stable across Zendesk agent locales?
- scope: `Localization only`
- status: `outside English-only scope`
- probe: `Not run in Phase 1 by D-05; cross-locale comparison is deliberately excluded.`
- evidence: D-05 records cross-locale behavior as deferred rather than verified.
- interpretation: English-path evidence cannot be generalized to another locale.
- fallback: Re-run the complete scenario matrix per supported locale before making a compatibility claim.
- scenario: `not-run-localization-only`

## Spec-less Planning Assumptions

These planner-generated probes are not live DOM conclusions. All seven remain
explicitly unresolved and must not be used to waive a requirement.

| Requirement | Category | Status | Probe |
|-------------|----------|--------|-------|
| RECON-01 | unclassified | unresolved | Review manually; no spec-derived edge contract is available. |
| RECON-02 | adjacency | unresolved | When two things are exactly equal or just touch, do they merge, collide, or separate? |
| RECON-02 | empty | unresolved | What is the result for empty, single-element, or null input? |
| RECON-02 | ordering | unresolved | When elements compare equal, is output order specified and stable? |
| RECON-03 | adjacency | unresolved | When two things are exactly equal or just touch, do they merge, collide, or separate? |
| RECON-03 | empty | unresolved | What is the result for empty, single-element, or null input? |
| RECON-03 | ordering | unresolved | When elements compare equal, is output order specified and stable? |

## Final Verdict

- verdict: `block`
- rationale: The offline evidence contract and admission policy are ready, but all fourteen live English-path questions remain explicitly unresolved; this is not a Phase 2 proceed conclusion.
