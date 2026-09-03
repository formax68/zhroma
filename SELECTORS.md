# Zendesk DOM Recon Evidence Ledger

This ledger contains only sanitized structural observations from the authenticated
English Zendesk Agent Workspace session prepared for Phase 1. It intentionally
omits tenant hostnames, view identifiers, ticket identifiers, subjects, people,
organizations, account identifiers, and raw DOM captures. Conclusions are limited
to the current shell observed on 2026-09-03; the account-plan label was not shared.

The three live scenarios are named only by their structural purpose:

- `priority-present-grouped-long`: Priority present, one group row, long/scrollable.
- `priority-present-ungrouped`: Priority present, no group row, long/scrollable.
- `priority-absent`: Priority absent, no group row, long/scrollable.

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

## Ledger Entry: shell-metadata

- id: `shell-metadata`
- question: What capture date, current Agent Workspace shell, account plan, and non-identifying page metadata bound each observation?
- scope: `English path`
- status: `verified`
- probe: `({ captureDate: new Date().toISOString().slice(0, 10), filterPath: /^\/agent\/filters\/[^/]+$/.test(location.pathname), topFrame: window === window.top, htmlLang: document.documentElement.lang || null })`
- evidence: On 2026-09-03 all three scenarios were open in the current Agent Workspace, returned `filterPath: true`, `topFrame: true`, and `htmlLang: "en"`. The account-plan label was unknown/not shared.
- interpretation: These findings are bounded to the observed English current shell and do not establish behavior for another plan, shell, or locale.
- fallback: Re-run this matrix for any materially different shell, plan, or locale before relying on these selectors.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

## Ledger Entry: top-document-reachability

- id: `top-document-reachability`
- question: Is a selected ticket row reachable from the expected top document, and is its owner document hosted in a frame?
- scope: `English path`
- status: `verified`
- probe: `({ consoleIsTopFrame: window === window.top, selectedNodeOwnerIsConsoleDocument: row.ownerDocument === document, reachableFromConsoleDocument: document.contains(row), ownerFrameTag: row.ownerDocument.defaultView?.frameElement?.tagName ?? null })`
- evidence: Each scenario returned `consoleIsTopFrame: true`, `selectedNodeOwnerIsConsoleDocument: true`, `reachableFromConsoleDocument: true`, and `ownerFrameTag: null` for a ticket row selected from its ticket table.
- interpretation: The observed ticket tables are directly reachable in the top document and are not hosted in a child frame.
- fallback: If any future shell returns a frame or owner-document mismatch, resolve and document that frame boundary before querying or styling rows.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

## Ledger Entry: root-chain

- id: `root-chain`
- question: What is the complete root and host chain from a selected ticket row to its owner document, including every ShadowRoot mode?
- scope: `English path`
- status: `verified`
- probe: `(() => { const roots=[]; let node=row; while(node){ const root=node.getRootNode(); if(root===node.ownerDocument){ roots.push({type:'Document'}); break; } roots.push({type:'ShadowRoot', mode:root.mode ?? null, hostTag:root.host?.tagName ?? null}); node=root.host; } return roots; })()`
- evidence: All three selected rows returned the complete root chain `[{ type: "Document" }]`; `row.ownerDocument === document` and `document.contains(row) === true` were also true in every scenario.
- interpretation: No open or closed ShadowRoot lies between the observed ticket row and its owner document. This conclusion uses the selected node's root chain and reachability, not `host.shadowRoot === null`.
- fallback: Any future `ShadowRoot` entry must record its mode and host; a closed root blocks the Phase 2 design.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

## Ledger Entry: stable-identifiers

- id: `stable-identifiers`
- question: Which `data-garden-id` and `data-test-id` values identify the ticket table, header, ticket rows, group rows, and cells?
- scope: `English path`
- status: `verified`
- probe: `([...boundary.querySelectorAll('[data-garden-id], [data-test-id]')].reduce((out, element) => { for (const name of ['data-garden-id','data-test-id']) { const value=element.getAttribute(name); if(value) out[name][value]=(out[name][value]||0)+1; } return out; }, {'data-garden-id':{},'data-test-id':{}}))`
- evidence: No ancestor exposed a dedicated stable table-container test identifier. The nearest complete stable boundary was therefore the table itself: `table[data-garden-id="tables.table"][data-test-id="generic-table"]`; its ancestor chain later exposed `data-garden-id="pane.content"`, `data-garden-id="pane"`, and `data-test-id="views_views-pane-div"`. The table's own header was `[data-garden-id="tables.head"][data-test-id="generic-table-head"]`; the body was `[data-garden-id="tables.body"][data-test-id="generic-table-body"]`; ticket rows were `[data-garden-id="tables.row"][data-test-id="generic-table-row"]`; group rows were `[data-garden-id="tables.group_row"][data-test-id="generic-table-rows-group-by"]`; direct cells used `data-garden-id="tables.cell"`; and header cells used `data-garden-id="tables.header_cell"`. Counts were: grouped-long `table 1 / head 1 / body 1 / header_cell 15 / row 30 / group_row 1 / cell 451`; ungrouped `1 / 1 / 1 / 16 / 30 / 0 / 480`; Priority-absent `1 / 1 / 1 / 6 / 30 / 0 / 180`.
- interpretation: Rank Garden identifiers first, pair them with the matching test identifiers second, and use element-agnostic structural relationships only as a final fallback. A broad `tbody > tr` selector is unsafe because it includes group rows.
- fallback: If Garden identifiers disappear, require the paired test identifiers across all three fixtures; if both disappear, block until a structural discriminator is proven across the matrix.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

## Ledger Entry: header-topology

- id: `header-topology`
- question: Does the body table contain its own header, or must headers be resolved from a sibling sticky or duplicate header table?
- scope: `English path`
- status: `disproved`
- probe: `(() => { const table=row.closest('table'); return { ownHead:Boolean(table.tHead), headerCount:table.querySelectorAll(':scope > thead [data-garden-id="tables.header_cell"]').length, siblingHeaderTables:[...table.parentElement.children].filter(element=>element!==table && element.matches?.('table')).length }; })()`
- evidence: Each ticket table had its own `THEAD`; header counts were 15, 16, and 6 respectively, and no sibling header table was present at the observed table boundary.
- interpretation: The proposed sibling/duplicate-header topology is disproved for these scenarios. Header resolution must stay inside the same `generic-table` as the ticket rows.
- fallback: If a later layout exposes a sibling table, bind it through the nearest shared table container and re-verify column alignment before reading Priority.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

## Ledger Entry: priority-representation

- id: `priority-representation`
- question: How is Priority represented in its header and cells, and is any locale-independent machine-readable signal present?
- scope: `English path`
- status: `verified`
- probe: `(() => { const headers=[...table.querySelectorAll('[data-garden-id="tables.header_cell"]')]; const index=headers.findIndex(cell=>cell.textContent.trim()==='Priority'); const cells=[...table.querySelectorAll('[data-garden-id="tables.row"]')].map(row=>row.children[index]); return { index, headerText:headers[index]?.textContent.trim() ?? null, cells:cells.map(cell=>({ allowedText:['Urgent','High','Normal','Low'].includes(cell?.textContent.trim()) ? cell.textContent.trim() : '<empty-or-unreadable>', ariaLabel:cell?.getAttribute('aria-label') ?? null, attributeNames:cell?.getAttributeNames() ?? [], datasetKeys:Object.keys(cell?.dataset ?? {}) })) }; })()`
- evidence: Priority was the zero-based header index 6 in both Priority-present scenarios. Readable cell values were exact allowed English labels: grouped-long `High 3 / Normal 3 / empty-or-unreadable 24`; ungrouped `High 7 / empty-or-unreadable 23`. A readable Priority cell used the same allowed label as `aria-label`, with only `aria-label`, `data-garden-id`, and `data-garden-version` attributes; its only dataset key was `gardenVersion`. No icon, badge, role, or other locale-independent Priority value signal was present.
- interpretation: In the observed English shell, the permitted fallback is the exact `Priority` header and exact English value labels; an empty or unreadable cell is not inferred as a priority.
- fallback: Return an explicit unreadable state rather than guessing. Supporting another locale requires a separate evidence matrix.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`

## Ledger Entry: priority-absence

- id: `priority-absence`
- question: Does a genuine Priority-absent view retain the proven ticket-table shape while omitting the Priority header and cells?
- scope: `English path`
- status: `verified`
- probe: `(() => { const table=document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); const headers=[...table.querySelectorAll('[data-garden-id="tables.header_cell"]')]; return { tableCount:document.querySelectorAll('table[data-garden-id="tables.table"][data-test-id="generic-table"]').length, ticketRows:table.querySelectorAll('[data-garden-id="tables.row"][data-test-id="generic-table-row"]').length, groupRows:table.querySelectorAll('[data-garden-id="tables.group_row"][data-test-id="generic-table-rows-group-by"]').length, headerCount:headers.length, hasPriority:headers.some(cell=>cell.textContent.trim()==='Priority') }; })()`
- evidence: The dedicated absence scenario retained exactly one proven ticket table with 30 ticket rows, 0 group rows, and 6 headers, while `hasPriority` was false. The two presence controls each returned `hasPriority: true` at header index 6.
- interpretation: This is genuine column absence in the observed control, not a failed table selector. Absence is not generalized beyond this scenario.
- fallback: Diagnose Priority as absent only after the proven ticket table and header collection succeed; otherwise report a structural/read failure.
- scenario: `priority-absent`

## Ledger Entry: ticket-vs-group-rows

- id: `ticket-vs-group-rows`
- question: Which structural differences distinguish ticket rows from group rows without reading tenant content?
- scope: `English path`
- status: `verified`
- probe: `([...table.querySelectorAll('[data-garden-id="tables.row"], [data-garden-id="tables.group_row"]')].map(row=>({ tag:row.tagName, garden:row.getAttribute('data-garden-id'), test:row.getAttribute('data-test-id'), role:row.getAttribute('role'), cells:row.children.length })))`
- evidence: Ticket rows were `TR`, `tables.row`, `generic-table-row`, role `row`, with 15 direct cells in the grouped-long scenario. The group row was `TR`, `tables.group_row`, `generic-table-rows-group-by`, no role, with 1 direct cell. Both ungrouped scenarios had 30 ticket rows and 0 group rows; the Priority-absent scenario had 6 direct cells per ticket row.
- interpretation: Select ticket rows positively with the paired row identifiers; do not infer row type from text or from position inside `TBODY`.
- fallback: If the paired identifiers disappear, require a matrix-tested structural predicate that excludes one-cell group rows before applying any tint.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

## Ledger Entry: scrolling-and-recycling

- id: `scrolling-and-recycling`
- question: At separated positions in a long view, are rows removed or recycled?
- scope: `English path`
- status: `disproved`
- probe: `(() => { const rows=[...table.querySelectorAll('[data-garden-id="tables.row"][data-test-id="generic-table-row"]')]; const marker=document.querySelector('[data-zhroma-probe="1"]'); return { ticketRows:rows.length, groupRows:table.querySelectorAll('[data-garden-id="tables.group_row"]').length, scrollTop:scroller.scrollTop, maxScroll:scroller.scrollHeight-scroller.clientHeight, markerCount:document.querySelectorAll('[data-zhroma-probe="1"]').length, markerConnected:Boolean(marker && document.contains(marker)), firstVisibleIndex:rows.findIndex(isVisible), lastVisibleIndex:rows.findLastIndex(isVisible) }; })()`
- evidence: The grouped-long scroller measured `clientHeight 594 / scrollHeight 1493 / maxScroll 899`. At the bottom it retained 30 ticket rows and 1 group row; visible ticket indexes were 18 through 29, while the marked first ticket row remained connected but offscreen and marker count remained 1. Earlier separated-position inspection also returned the same 30-ticket/1-group DOM collection.
- interpretation: Row-window virtualization or recycling is disproved for the observed 30-row page: offscreen rows remain mounted. Pagination still exists, so this does not prove behavior across pages or future shell versions.
- fallback: Re-derive visible rows with element-agnostic selectors after debounced child-list mutations; never depend on a stored row object across sort, refresh, or pagination.
- scenario: `priority-present-grouped-long`

## Ledger Entry: painting-element

- id: `painting-element`
- question: Which element paints the normal visible ticket-row background: row, cells, inner wrapper, or ancestor?
- scope: `English path`
- status: `verified`
- probe: `(() => { const row=document.querySelector('[data-zhroma-probe="1"]'); const cells=[...row.children].map(cell=>({ tag:cell.tagName, garden:cell.getAttribute('data-garden-id'), backgroundColor:getComputedStyle(cell).backgroundColor, backgroundImage:getComputedStyle(cell).backgroundImage })); const chain=[]; for(let node=row;node;node=node.parentElement){ const style=getComputedStyle(node); chain.push({ tag:node.tagName, garden:node.getAttribute('data-garden-id'), backgroundColor:style.backgroundColor, backgroundImage:style.backgroundImage }); if(style.backgroundColor==='rgb(255, 255, 255)') break; } return { row:{ backgroundColor:getComputedStyle(row).backgroundColor, backgroundImage:getComputedStyle(row).backgroundImage }, cells, chain }; })()`
- evidence: The ticket `TR` and every direct `TD[data-garden-id="tables.cell"]` returned `background-color: rgba(0, 0, 0, 0)` and `background-image: none`; `TBODY`, `TABLE`, and intermediate wrappers were also transparent. The first opaque surface in the ancestor chain was `DIV[data-garden-id="pane"]` with `rgb(255, 255, 255)`. No screenshot was retained because textual computed-style evidence established the paint stack.
- interpretation: The pane paints the normal white surface; row and cell boxes are transparent. A future tint must be scoped to the proven ticket cells (or equivalently proven transparent row) rather than changing the shared pane. The cell selector is the conservative containment seam because it cannot paint group rows when reached from a positively matched ticket row.
- fallback: Apply only a translucent declarative color to the direct cells of a proven ticket row, then verify native interaction states; block if cells become opaque or native states are suppressed.
- scenario: `priority-present-grouped-long`

## Ledger Entry: sticky-header-state

- id: `sticky-header-state`
- question: Which element owns sticky header geometry and paint?
- scope: `English path`
- status: `verified`
- probe: `([...table.querySelectorAll('thead [data-garden-id="tables.header_cell"]')].map(cell=>({ position:getComputedStyle(cell).position, top:getComputedStyle(cell).top, zIndex:getComputedStyle(cell).zIndex, backgroundColor:getComputedStyle(cell).backgroundColor })))`
- evidence: Every observed header cell returned `position: sticky`, `top: 0px`, `z-index: 1`, and opaque white paint. The containing table retained its own `THEAD`; no duplicate header table appeared.
- interpretation: Sticky geometry and paint belong to each header cell, not the row body or a sibling table. Ticket tint must not target header cells or their stacking context.
- fallback: Restrict tint selectors to `TBODY` ticket rows and direct ticket cells; re-run geometry checks if header topology changes.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

## Ledger Entry: interaction-and-sticky-states

- id: `interaction-and-sticky-states`
- question: Did the user-controlled interaction seam yield hover or selected-row computed-paint evidence sufficient to validate the proposed translucent tint?
- scope: `English path`
- status: `disproved`
- probe: `(() => { const rows=[...table.querySelectorAll('[data-garden-id="tables.row"][data-test-id="generic-table-row"]')]; const selected=rows.filter(row=>row.getAttribute('aria-selected')==='true'); const hovered=rows.filter(row=>row.matches(':hover')); return { ticketRows:rows.length, selectedRows:selected.length, hoveredRows:hovered.length, selectedPaint:paint(selected[0]), hoveredPaint:paint(hovered[0]), normalPaint:paint(rows.find(row=>!selected.includes(row)&&!hovered.includes(row))) }; })()`
- evidence: In the read-only post-action inspection, the 30-row grouped-long table had 0 selected rows and 0 hovered rows; `selectedPaint` and `hoveredPaint` were null. A normal ticket row and its first direct cell remained transparent with no background image. The user-confirmed action sequence therefore produced sort/refresh evidence but no retained hover or selection paint comparison.
- interpretation: The proposition that the interaction seam supplied sufficient native hover/selection paint evidence is disproved. This does not claim that Zendesk lacks native hover or selected-row styling; it means Phase 1 did not establish how a translucent priority tint composes with those states.
- fallback: Keep Phase 2 blocked until a separate safe, user-controlled comparison records sanitized hover and selected-row paint evidence, then re-run the selector and contrast checks.
- scenario: `priority-present-grouped-long`

## Ledger Entry: inert-attribute-survival

- id: `inert-attribute-survival`
- question: Does an inert `data-zhroma-probe` attribute survive row replacement triggered by sort or refresh?
- scope: `English path`
- status: `disproved`
- probe: `(() => { const table=document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); const headers=[...table.querySelectorAll('[data-garden-id="tables.header_cell"]')]; const rows=[...table.querySelectorAll('[data-garden-id="tables.row"][data-test-id="generic-table-row"]')]; const first=rows[0]; return { markerCount:document.querySelectorAll('[data-zhroma-probe="1"]').length, headerCount:headers.length, priorityIndex:headers.findIndex(cell=>cell.textContent.trim()==='Priority'), ticketRows:rows.length, groupRows:table.querySelectorAll('[data-garden-id="tables.group_row"][data-test-id="generic-table-rows-group-by"]').length, firstRowCells:first.children.length, ownerDocumentMatches:first.ownerDocument===document, documentContains:document.contains(first), rootIsDocument:first.getRootNode()===document }; })()`
- evidence: Before interaction, exactly one marker existed on a connected `TR[data-garden-id="tables.row"][data-test-id="generic-table-row"]` at sanitized zero-based ticket-row index 0, with 15 direct cells, Priority header index 6, and allowed Priority label `High`; owner-document, containment, and Document-root checks were true. After the user alone sorted Priority once and refreshed once, marker count was 0 while the current table remained structurally valid with 15 headers, Priority at index 6, 30 ticket rows, 1 group row, and a connected 15-cell first ticket row in the current Document. The user confirmed no operational view, ticket, or account configuration changed.
- interpretation: Survival is disproved across the requested sort-plus-refresh sequence. The refresh removed the temporary page-local attribute, so there is no marker left to clean up and downstream logic must re-stamp from current DOM state rather than retain node identity.
- fallback: Treat page-local attributes as ephemeral and stamp idempotently after child-list changes.
- scenario: `priority-present-grouped-long`

## Ledger Entry: english-language-signal

- id: `english-language-signal`
- question: Which observed document signal identifies the current English agent UI without implying cross-locale correctness?
- scope: `English path`
- status: `verified`
- probe: `({ htmlLang:document.documentElement.lang || null, bodyLang:document.body?.getAttribute('lang') ?? null })`
- evidence: All three scenarios returned `htmlLang: "en"` and `bodyLang: null`; exact English `Priority`, `Urgent`, `High`, `Normal`, and `Low` labels remain a deliberately English-only fallback.
- interpretation: `html[lang="en"]` is the observed shell signal. It does not establish locale-independent Priority parsing.
- fallback: If `html.lang` is absent or not English, return unsupported/unreadable rather than interpreting English labels.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

## Ledger Entry: current-host-coverage

- id: `current-host-coverage`
- question: Does the observed current Agent Workspace use HTTPS on a Zendesk subdomain under `/agent/`, and where is the ticket list framed?
- scope: `English path`
- status: `verified`
- probe: `({ https:location.protocol==='https:', zendeskSubdomain:location.hostname.endsWith('.zendesk.com'), agentFilterPath:/^\/agent\/filters\/[^/]+$/.test(location.pathname), topFrame:window===window.top })`
- evidence: All three scenarios returned `https: true`, `zendeskSubdomain: true`, `agentFilterPath: true`, and `topFrame: true`. The hostname and opaque view identifier were not recorded.
- interpretation: Coverage is proven only for the observed current Agent Workspace deployment shape.
- fallback: Do not claim support for vanity domains, legacy shells, or different path shapes until separately observed.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

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

## Authenticated Interaction Handoff

- state: interaction-evidence-complete
- post-action-state: interactions-complete
- capture-date: `2026-09-03`
- shell: `current Agent Workspace`
- plan-label: `unknown/not shared`
- scenario: `priority-present-grouped-long`
- marker-selector: `[data-zhroma-probe="1"]`
- baseline: Exactly one marker is attached to a connected ticket `TR` at sanitized zero-based row index 0; it has 15 direct cells, Priority header index 6, allowed Priority label `High`, the current owner document, and a direct Document root.
- next-action-owner: `none`
- next-action: The Plan 04 interaction seam is closed. Any future hover/selection comparison requires a new explicit human-controlled seam.
- post-action-inspection: Marker count was 0 after the user-controlled sort and refresh. The refreshed table retained 15 headers, Priority at index 6, 30 ticket rows, 1 group row, and direct current-Document reachability. The temporary page-local marker therefore required no additional cleanup.
- post-action-interaction-inspection: The current grouped-long table had 0 selected rows and 0 hovered rows, so no native hover/selection paint comparison was available for admission.
- user-confirmation: `interactions complete — no operational view, ticket, or account configuration changed`
- safety: The user alone performed the authenticated sort and refresh in the non-operational recon view; no ticket or account configuration was changed.

## Admitted Fixture Corpus

- capture scenarios: `priority-present-ungrouped`, `priority-absent`, and `grouped-long`.
- boundary: Each fixture is a live-derived projection of the immediate overflow wrapper and its complete ticket table; navigation, sidebars, menus, pagination controls, and unrelated state are excluded.
- structural fidelity: The canonical fixture retains 16 headers and 4 ticket-row topologies normalized to the four allowed Priority labels; the absence control retains 6 headers, 4 ticket rows, and no seventh header cell or allowed Priority value; the grouped-long fixture retains the same-table sticky-header topology, 1 group row, and 12 ordered ticket-row topologies from the observed 30-row scrollable table.
- admission: `scripts/sanitize-fixture.js` processed each private, capture-specific-denylisted input into a new repository output. The private inputs were deleted after sanitization; no tenant identity, denylist literal, private path, raw DOM, or identifying text was admitted.
- verification: `test/fixtures/manifest.json` binds the three scenario assertions and selectors to exact final-byte SHA-256 values. The repository corpus gate performs sensitive scanning before detached parsing, then checks selectors, topology, scenario invariants, and checksums.
- scope: These fixtures cover only the English current Agent Workspace shell observed on 2026-09-03 with account plan unknown/not shared. They make no legacy-shell, vanity-domain, cross-plan, or localization claim.

## Execution Safety Note

During an earlier local probe attempt, an unintended read-only ticket navigation
occurred. Browser Back immediately restored the originating view; no ticket or
account mutation was performed and no identifying content was persisted. Native
keyboard injection was abandoned after that recovery. The reversible magenta
style mutation was not repeated through that unsafe path; the exact computed
paint chain above supplied textual evidence without retaining a visual capture.

## Spec-less Planning Assumptions

These planner-generated probes are not live DOM conclusions and do not waive a
requirement. They remain inputs to the final Plan 05 admission/verdict gate.

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
- rationale: Static evidence is terminal for the three English scenarios and marker survival is disproved after the user-controlled sort-plus-refresh sequence. Hover/selection paint remains explicitly unresolved, and sanitized fixture admission plus the D-16 verdict remain owned by Plan 05.
